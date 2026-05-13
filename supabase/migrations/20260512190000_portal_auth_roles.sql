create table if not exists public.portal_user_access (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  snapshot_id text not null,
  role text not null check (role in ('admin', 'editor', 'viewer')),
  agent_id text null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portal_user_access_agent_scope_check check (
    (role = 'admin' and agent_id is null)
    or (role in ('editor', 'viewer') and agent_id is not null)
  )
);

create index if not exists portal_user_access_snapshot_idx
  on public.portal_user_access (snapshot_id);

create or replace function public.portal_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists portal_user_access_set_updated_at on public.portal_user_access;

create trigger portal_user_access_set_updated_at
before update on public.portal_user_access
for each row
execute function public.portal_set_updated_at();

alter table public.portal_user_access enable row level security;

revoke all on table public.portal_user_access from anon, authenticated;

drop policy if exists "portal_snapshots_select" on public.portal_snapshots;
drop policy if exists "portal_snapshots_insert" on public.portal_snapshots;
drop policy if exists "portal_snapshots_update" on public.portal_snapshots;

revoke all on table public.portal_snapshots from anon, authenticated;
grant select, insert, update on table public.portal_snapshots to authenticated;

create policy "portal_snapshots_admin_select"
  on public.portal_snapshots
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.portal_user_access access
      where access.user_id = auth.uid()
        and access.is_active = true
        and access.role = 'admin'
        and access.snapshot_id = public.portal_snapshots.id
    )
  );

create policy "portal_snapshots_admin_insert"
  on public.portal_snapshots
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.portal_user_access access
      where access.user_id = auth.uid()
        and access.is_active = true
        and access.role = 'admin'
        and access.snapshot_id = public.portal_snapshots.id
    )
  );

create policy "portal_snapshots_admin_update"
  on public.portal_snapshots
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.portal_user_access access
      where access.user_id = auth.uid()
        and access.is_active = true
        and access.role = 'admin'
        and access.snapshot_id = public.portal_snapshots.id
    )
  )
  with check (
    exists (
      select 1
      from public.portal_user_access access
      where access.user_id = auth.uid()
        and access.is_active = true
        and access.role = 'admin'
        and access.snapshot_id = public.portal_snapshots.id
    )
  );

create or replace function public.portal_get_access_context()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  access_row public.portal_user_access%rowtype;
begin
  select *
  into access_row
  from public.portal_user_access
  where user_id = auth.uid()
  limit 1;

  if not found then
    return jsonb_build_object(
      'hasAccess', false,
      'isActive', false
    );
  end if;

  return jsonb_build_object(
    'hasAccess', true,
    'userId', access_row.user_id,
    'email', access_row.email,
    'snapshotId', access_row.snapshot_id,
    'role', access_row.role,
    'agentId', access_row.agent_id,
    'isActive', access_row.is_active
  );
end;
$$;

create or replace function public.portal_get_my_workspace()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  access_row public.portal_user_access%rowtype;
  snapshot_payload jsonb;
  agent_entry jsonb;
  agent_ficha jsonb;
  scoped_activities jsonb;
  scoped_cierres jsonb;
begin
  select *
  into access_row
  from public.portal_user_access
  where user_id = auth.uid()
    and is_active = true
  limit 1;

  if not found then
    raise exception 'No se encontró acceso activo para este usuario';
  end if;

  if access_row.role not in ('editor', 'viewer') then
    raise exception 'Solo los usuarios asignados por agente usan este endpoint';
  end if;

  if access_row.agent_id is null then
    raise exception 'Este usuario no tiene un agente asignado';
  end if;

  select payload
  into snapshot_payload
  from public.portal_snapshots
  where id = access_row.snapshot_id;

  if snapshot_payload is null then
    raise exception 'No se encontró el snapshot asignado al usuario';
  end if;

  select entry
  into agent_entry
  from jsonb_array_elements(coalesce(snapshot_payload->'agents', '[]'::jsonb)) as entry
  where entry->>'id' = access_row.agent_id
  limit 1;

  if agent_entry is null then
    raise exception 'El agente asignado ya no existe en el snapshot';
  end if;

  select coalesce(jsonb_agg(entry), '[]'::jsonb)
  into scoped_activities
  from jsonb_array_elements(coalesce(snapshot_payload->'activities', '[]'::jsonb)) as entry
  where entry->>'agent' = access_row.agent_id;

  select coalesce(jsonb_agg(entry), '[]'::jsonb)
  into scoped_cierres
  from jsonb_array_elements(coalesce(snapshot_payload->'cierres', '[]'::jsonb)) as entry
  where entry->>'agente' = access_row.agent_id;

  agent_ficha = coalesce(snapshot_payload->'fichas'->access_row.agent_id, '{}'::jsonb);

  return jsonb_build_object(
    'scopeMode', 'agent',
    'agents', jsonb_build_array(agent_entry),
    'activities', scoped_activities,
    'deliverables', '{}'::jsonb,
    'fichas', jsonb_build_object(access_row.agent_id, agent_ficha),
    'extras', '[]'::jsonb,
    'nextSteps', '[]'::jsonb,
    'inducciones', '[]'::jsonb,
    'cierres', scoped_cierres,
    'settings', coalesce(snapshot_payload->'settings', '{}'::jsonb),
    'currentAgent', access_row.agent_id,
    'currentSubtab', coalesce(snapshot_payload->>'currentSubtab', 'bitacora')
  );
end;
$$;

create or replace function public.portal_upsert_my_activity(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  access_row public.portal_user_access%rowtype;
  snapshot_payload jsonb;
  activity_payload jsonb;
  activity_id text;
  next_activities jsonb;
  existing_count integer;
  owned_count integer;
begin
  select *
  into access_row
  from public.portal_user_access
  where user_id = auth.uid()
    and is_active = true
  limit 1;

  if not found then
    raise exception 'No se encontró acceso activo para este usuario';
  end if;

  if access_row.role <> 'editor' then
    raise exception 'Solo los usuarios con permiso de edición pueden guardar actividades';
  end if;

  if access_row.agent_id is null then
    raise exception 'Este usuario no tiene un agente asignado';
  end if;

  if coalesce(p_payload->>'agent', '') <> access_row.agent_id then
    raise exception 'Solo puedes editar actividades de tu agente asignado';
  end if;

  activity_payload = coalesce(p_payload, '{}'::jsonb);
  activity_id = nullif(activity_payload->>'id', '');

  if activity_id is null then
    activity_id = 'id_' || md5(clock_timestamp()::text || random()::text);
    activity_payload = jsonb_set(activity_payload, '{id}', to_jsonb(activity_id), true);
  end if;

  select payload
  into snapshot_payload
  from public.portal_snapshots
  where id = access_row.snapshot_id
  for update;

  if snapshot_payload is null then
    raise exception 'No se encontró el snapshot asignado al usuario';
  end if;

  select count(*)
  into existing_count
  from jsonb_array_elements(coalesce(snapshot_payload->'activities', '[]'::jsonb)) as entry
  where entry->>'id' = activity_id;

  select count(*)
  into owned_count
  from jsonb_array_elements(coalesce(snapshot_payload->'activities', '[]'::jsonb)) as entry
  where entry->>'id' = activity_id
    and entry->>'agent' = access_row.agent_id;

  if existing_count > 0 and owned_count = 0 then
    raise exception 'No puedes sobrescribir una actividad de otro agente';
  end if;

  if existing_count > 0 then
    select coalesce(
      jsonb_agg(
        case
          when entry->>'id' = activity_id and entry->>'agent' = access_row.agent_id then activity_payload
          else entry
        end
      ),
      '[]'::jsonb
    )
    into next_activities
    from jsonb_array_elements(coalesce(snapshot_payload->'activities', '[]'::jsonb)) as entry;
  else
    next_activities = coalesce(snapshot_payload->'activities', '[]'::jsonb) || jsonb_build_array(activity_payload);
  end if;

  snapshot_payload = jsonb_set(snapshot_payload, '{activities}', next_activities, true);

  update public.portal_snapshots
  set payload = snapshot_payload,
      updated_at = now()
  where id = access_row.snapshot_id;

  return activity_payload;
end;
$$;

create or replace function public.portal_delete_my_activity(p_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  access_row public.portal_user_access%rowtype;
  snapshot_payload jsonb;
  removed_count integer;
  next_activities jsonb;
begin
  select *
  into access_row
  from public.portal_user_access
  where user_id = auth.uid()
    and is_active = true
  limit 1;

  if not found then
    raise exception 'No se encontró acceso activo para este usuario';
  end if;

  if access_row.role <> 'editor' then
    raise exception 'Solo los usuarios con permiso de edición pueden eliminar actividades';
  end if;

  select payload
  into snapshot_payload
  from public.portal_snapshots
  where id = access_row.snapshot_id
  for update;

  if snapshot_payload is null then
    raise exception 'No se encontró el snapshot asignado al usuario';
  end if;

  select count(*)
  into removed_count
  from jsonb_array_elements(coalesce(snapshot_payload->'activities', '[]'::jsonb)) as entry
  where entry->>'id' = p_id
    and entry->>'agent' = access_row.agent_id;

  if removed_count = 0 then
    raise exception 'No se encontró la actividad o no tienes permiso para eliminarla';
  end if;

  select coalesce(jsonb_agg(entry), '[]'::jsonb)
  into next_activities
  from jsonb_array_elements(coalesce(snapshot_payload->'activities', '[]'::jsonb)) as entry
  where not (entry->>'id' = p_id and entry->>'agent' = access_row.agent_id);

  snapshot_payload = jsonb_set(snapshot_payload, '{activities}', next_activities, true);

  update public.portal_snapshots
  set payload = snapshot_payload,
      updated_at = now()
  where id = access_row.snapshot_id;

  return jsonb_build_object('deleted', true, 'id', p_id);
end;
$$;

create or replace function public.portal_upsert_my_cierre(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  access_row public.portal_user_access%rowtype;
  snapshot_payload jsonb;
  cierre_payload jsonb;
  cierre_id text;
  next_cierres jsonb;
  existing_count integer;
  owned_count integer;
begin
  select *
  into access_row
  from public.portal_user_access
  where user_id = auth.uid()
    and is_active = true
  limit 1;

  if not found then
    raise exception 'No se encontró acceso activo para este usuario';
  end if;

  if access_row.role <> 'editor' then
    raise exception 'Solo los usuarios con permiso de edición pueden guardar cierres';
  end if;

  if access_row.agent_id is null then
    raise exception 'Este usuario no tiene un agente asignado';
  end if;

  if coalesce(p_payload->>'agente', '') <> access_row.agent_id then
    raise exception 'Solo puedes editar cierres de tu agente asignado';
  end if;

  cierre_payload = coalesce(p_payload, '{}'::jsonb);
  cierre_id = nullif(cierre_payload->>'id', '');

  if cierre_id is null then
    cierre_id = 'id_' || md5(clock_timestamp()::text || random()::text);
    cierre_payload = jsonb_set(cierre_payload, '{id}', to_jsonb(cierre_id), true);
  end if;

  select payload
  into snapshot_payload
  from public.portal_snapshots
  where id = access_row.snapshot_id
  for update;

  if snapshot_payload is null then
    raise exception 'No se encontró el snapshot asignado al usuario';
  end if;

  select count(*)
  into existing_count
  from jsonb_array_elements(coalesce(snapshot_payload->'cierres', '[]'::jsonb)) as entry
  where entry->>'id' = cierre_id;

  select count(*)
  into owned_count
  from jsonb_array_elements(coalesce(snapshot_payload->'cierres', '[]'::jsonb)) as entry
  where entry->>'id' = cierre_id
    and entry->>'agente' = access_row.agent_id;

  if existing_count > 0 and owned_count = 0 then
    raise exception 'No puedes sobrescribir un cierre de otro agente';
  end if;

  if existing_count > 0 then
    select coalesce(
      jsonb_agg(
        case
          when entry->>'id' = cierre_id and entry->>'agente' = access_row.agent_id then cierre_payload
          else entry
        end
      ),
      '[]'::jsonb
    )
    into next_cierres
    from jsonb_array_elements(coalesce(snapshot_payload->'cierres', '[]'::jsonb)) as entry;
  else
    next_cierres = coalesce(snapshot_payload->'cierres', '[]'::jsonb) || jsonb_build_array(cierre_payload);
  end if;

  snapshot_payload = jsonb_set(snapshot_payload, '{cierres}', next_cierres, true);

  update public.portal_snapshots
  set payload = snapshot_payload,
      updated_at = now()
  where id = access_row.snapshot_id;

  return cierre_payload;
end;
$$;

create or replace function public.portal_delete_my_cierre(p_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  access_row public.portal_user_access%rowtype;
  snapshot_payload jsonb;
  removed_count integer;
  next_cierres jsonb;
begin
  select *
  into access_row
  from public.portal_user_access
  where user_id = auth.uid()
    and is_active = true
  limit 1;

  if not found then
    raise exception 'No se encontró acceso activo para este usuario';
  end if;

  if access_row.role <> 'editor' then
    raise exception 'Solo los usuarios con permiso de edición pueden eliminar cierres';
  end if;

  select payload
  into snapshot_payload
  from public.portal_snapshots
  where id = access_row.snapshot_id
  for update;

  if snapshot_payload is null then
    raise exception 'No se encontró el snapshot asignado al usuario';
  end if;

  select count(*)
  into removed_count
  from jsonb_array_elements(coalesce(snapshot_payload->'cierres', '[]'::jsonb)) as entry
  where entry->>'id' = p_id
    and entry->>'agente' = access_row.agent_id;

  if removed_count = 0 then
    raise exception 'No se encontró el cierre o no tienes permiso para eliminarlo';
  end if;

  select coalesce(jsonb_agg(entry), '[]'::jsonb)
  into next_cierres
  from jsonb_array_elements(coalesce(snapshot_payload->'cierres', '[]'::jsonb)) as entry
  where not (entry->>'id' = p_id and entry->>'agente' = access_row.agent_id);

  snapshot_payload = jsonb_set(snapshot_payload, '{cierres}', next_cierres, true);

  update public.portal_snapshots
  set payload = snapshot_payload,
      updated_at = now()
  where id = access_row.snapshot_id;

  return jsonb_build_object('deleted', true, 'id', p_id);
end;
$$;

revoke all on function public.portal_get_access_context() from public, anon;
revoke all on function public.portal_get_my_workspace() from public, anon;
revoke all on function public.portal_upsert_my_activity(jsonb) from public, anon;
revoke all on function public.portal_delete_my_activity(text) from public, anon;
revoke all on function public.portal_upsert_my_cierre(jsonb) from public, anon;
revoke all on function public.portal_delete_my_cierre(text) from public, anon;

grant execute on function public.portal_get_access_context() to authenticated;
grant execute on function public.portal_get_my_workspace() to authenticated;
grant execute on function public.portal_upsert_my_activity(jsonb) to authenticated;
grant execute on function public.portal_delete_my_activity(text) to authenticated;
grant execute on function public.portal_upsert_my_cierre(jsonb) to authenticated;
grant execute on function public.portal_delete_my_cierre(text) to authenticated;
