# Configurar Supabase como backend principal por snapshot

La app sigue funcionando con `localStorage` por defecto, pero ya puede usar Supabase como backend principal para persistir el estado completo en un snapshot JSON.

## 1. Crear la tabla

Ejecuta este SQL en Supabase:

```sql
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
```

> Nota: estas políticas permiten leer y escribir con la anon key. Para un entorno público, reemplázalas por políticas autenticadas o por un Edge Function/API propia.

## 2. Configurar el frontend

### Opción A · Configuración persistida en el navegador

Pega esto una vez en la consola del navegador, cambiando URL y anon key:

```js
localStorage.setItem('portal_backend_config', JSON.stringify({
  type: 'supabase',
  cacheLocalSnapshot: true,
  seedFromPreload: true,
  supabase: {
    url: 'https://TU_PROJECT_REF.supabase.co',
    anonKey: 'TU_SUPABASE_ANON_KEY',
    table: 'portal_snapshots',
    snapshotId: 'bienestar-patrimonial-paquete-1',
    fallbackToLocalStorage: true,
  },
}));
location.reload();
```

Para volver al modo local:

```js
localStorage.removeItem('portal_backend_config');
location.reload();
```

### Opción B · Configuración por archivo

Usa `src/config/backend.supabase.example.js` como referencia y adapta `src/config/backend.js` en tu entorno privado:

```js
window.PORTAL_BACKEND_CONFIG = {
  type: 'supabase',
  cacheLocalSnapshot: true,
  seedFromPreload: true,
  supabase: {
    url: 'https://TU_PROJECT_REF.supabase.co',
    anonKey: 'TU_SUPABASE_ANON_KEY',
    table: 'portal_snapshots',
    snapshotId: 'bienestar-patrimonial-paquete-1',
    fallbackToLocalStorage: true,
  },
};
```

## 3. Comportamiento

- Al iniciar, la app intenta cargar el snapshot remoto si Supabase está habilitado.
- Si Supabase no tiene snapshot pero existe estado local, usa el local y lo sube como seed remoto.
- Si no existe estado local pero sí `PRELOAD_STATE_SNAPSHOT`, usa ese preload como seed remoto inicial.
- Cada `saveState()` sincroniza Supabase en cola, para que varios guardados rápidos no se pisen entre sí por carreras de red.
- Si `cacheLocalSnapshot` está activo, también guarda una copia local para arranque rápido y fallback.
- Si Supabase falla y `fallbackToLocalStorage` está activo, la app continúa funcionando localmente.

## 4. Flags útiles

- `cacheLocalSnapshot: true`
  Mantiene una copia local del snapshot aunque Supabase sea el backend principal. Recomendado.
- `seedFromPreload: true`
  Permite usar el preload embebido como semilla inicial cuando no existe snapshot remoto todavía.
- `fallbackToLocalStorage: true`
  Si Supabase falla, la app sigue operando con la copia local.

## 5. Limitaciones actuales del modelo

- El backend actual guarda un snapshot completo, no tablas relacionales separadas.
- Si dos clientes editan al mismo tiempo, la estrategia sigue siendo `last write wins`.
- Algunas preferencias estrictamente de UI siguen viviendo en `localStorage`, por ejemplo la vista de bitácora y el estado abierto/cerrado de cards.
