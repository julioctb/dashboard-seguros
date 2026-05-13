# Configurar Supabase con login, roles y acceso por agente

El portal ahora usa Supabase Auth cuando el backend activo es `supabase`. En ese modo:

- `admin` lee y guarda el snapshot completo.
- `editor` y `viewer` solo cargan su expediente asignado por RPC.
- Ya no se usa caché local compartida para datos protegidos.

## 1. Ejecutar migraciones

Aplica las migraciones de `supabase/migrations/`, en especial:

- `20260512163000_create_portal_snapshots.sql`
- `20260512190000_portal_auth_roles.sql`

La segunda migración:

- crea `public.portal_user_access`,
- cierra las políticas públicas previas de `portal_snapshots`,
- deja acceso directo al snapshot solo para `admin`,
- crea los RPCs:
  - `portal_get_access_context`
  - `portal_get_my_workspace`
  - `portal_upsert_my_activity`
  - `portal_delete_my_activity`
  - `portal_upsert_my_cierre`
  - `portal_delete_my_cierre`

## 2. Desplegar la Edge Function

Despliega `supabase/functions/portal-admin-users/index.ts`.

La función usa:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Acciones disponibles:

- `list`
- `invite`
- `resend_invite`
- `update_access`
- `disable_access`

Ejemplo de despliegue con Supabase CLI:

```bash
supabase functions deploy portal-admin-users
```

## 3. Configurar el frontend

### Opción A · Configuración persistida en el navegador

```js
localStorage.setItem('portal_backend_config', JSON.stringify({
  type: 'supabase',
  cacheLocalSnapshot: false,
  seedFromPreload: true,
  supabase: {
    url: 'https://TU_PROJECT_REF.supabase.co',
    anonKey: 'TU_SUPABASE_ANON_KEY',
    table: 'portal_snapshots',
    snapshotId: 'bienestar-patrimonial-paquete-1',
    fallbackToLocalStorage: false,
  },
}));
location.reload();
```

### Opción B · Configuración por archivo

Usa `src/config/backend.supabase.example.js` como base:

```js
window.PORTAL_BACKEND_CONFIG = {
  type: 'supabase',
  cacheLocalSnapshot: false,
  seedFromPreload: true,
  supabase: {
    url: 'https://TU_PROJECT_REF.supabase.co',
    anonKey: 'TU_SUPABASE_ANON_KEY',
    table: 'portal_snapshots',
    snapshotId: 'bienestar-patrimonial-paquete-1',
    fallbackToLocalStorage: false,
  },
};
```

## 4. Crear el primer admin

Después de desplegar la migración, crea un usuario en Supabase Auth y asígnale acceso en `public.portal_user_access`.

Ejemplo:

```sql
insert into public.portal_user_access (
  user_id,
  email,
  snapshot_id,
  role,
  agent_id,
  is_active
)
values (
  'UUID_DEL_USUARIO_AUTH',
  'admin@tu-dominio.com',
  'bienestar-patrimonial-paquete-1',
  'admin',
  null,
  true
);
```

Ese usuario ya podrá entrar al portal y, desde `Control`, invitar al resto.

## 5. Flujo operativo esperado

- Sin sesión válida, el portal muestra login y no carga datos.
- Si el link de invitación llega con `type=invite` o `type=recovery`, el portal obliga a definir contraseña antes de entrar.
- `admin` usa el snapshot completo.
- `editor` y `viewer` cargan un workspace filtrado al `agent_id` asignado.
- Las mutaciones de `editor` viajan por RPC, no por `saveState()` global.

## 6. Notas de seguridad

- La `anon key` sigue siendo pública, pero ya no alcanza para leer o modificar `portal_snapshots` sin sesión válida y rol `admin`.
- El snapshot local `bienestar_seguimiento_v5_2` se limpia en modo protegido.
- Las preferencias de UI que sí permanecen en `localStorage` ahora se guardan con clave por usuario.
