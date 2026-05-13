/*
  Ejemplo de configuración Supabase.
  Puedes copiar este objeto en `src/config/backend.js` para uso privado,
  o guardarlo en localStorage como se explica en SUPABASE_SETUP.md.
*/

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
