/* ================================================================
   BACKEND CONFIG
   Por defecto usa localStorage. Puedes habilitar Supabase con:
   - window.PORTAL_BACKEND_CONFIG antes de cargar esta app, o
   - localStorage.portal_backend_config (ver SUPABASE_SETUP.md).
================================================================ */
function readStoredBackendConfig() {
  try {
    const raw = localStorage.getItem('portal_backend_config');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('Backend config error', e);
    return null;
  }
}

window.PORTAL_BACKEND_CONFIG = window.PORTAL_BACKEND_CONFIG || readStoredBackendConfig() || {
  type: 'localStorage',
  supabase: {
    url: '',
    anonKey: '',
    table: 'portal_snapshots',
    snapshotId: 'bienestar-patrimonial-paquete-1',
    fallbackToLocalStorage: true,
  },
};
