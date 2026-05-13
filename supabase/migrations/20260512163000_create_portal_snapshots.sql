create table if not exists public.portal_snapshots (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.portal_snapshots enable row level security;

create policy "portal_snapshots_select"
  on public.portal_snapshots
  for select
  using (true);

create policy "portal_snapshots_insert"
  on public.portal_snapshots
  for insert
  with check (true);

create policy "portal_snapshots_update"
  on public.portal_snapshots
  for update
  using (true)
  with check (true);
