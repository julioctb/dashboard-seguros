/* ================================================================
   BACKEND CONFIG
   Por defecto usa localStorage. Puedes habilitar Supabase con:
   - window.PORTAL_BACKEND_CONFIG antes de cargar esta app, o
   - localStorage.portal_backend_config (ver SUPABASE_SETUP.md).
================================================================ */
const DEFAULT_BACKEND_EDITABLE_CONFIG = {
  type: 'localStorage',
  cacheLocalSnapshot: true,
  seedFromPreload: true,
  supabase: {
    url: '',
    anonKey: '',
    table: 'portal_snapshots',
    snapshotId: 'bienestar-patrimonial-paquete-1',
    fallbackToLocalStorage: true,
  },
};

function buildDefaultBackendEditableConfig() {
  return JSON.parse(JSON.stringify(DEFAULT_BACKEND_EDITABLE_CONFIG));
}

function normalizeBackendEditableConfig(config) {
  const raw = config && typeof config === 'object' ? config : {};
  return {
    ...buildDefaultBackendEditableConfig(),
    ...raw,
    supabase: {
      ...DEFAULT_BACKEND_EDITABLE_CONFIG.supabase,
      ...(raw.supabase && typeof raw.supabase === 'object' ? raw.supabase : {}),
    },
  };
}

function readStoredBackendConfig() {
  try {
    const raw = localStorage.getItem('portal_backend_config');
    return raw ? normalizeBackendEditableConfig(JSON.parse(raw)) : null;
  } catch (e) {
    console.error('Backend config error', e);
    return null;
  }
}

function getBackendEditableConfig() {
  const stored = (typeof window !== 'undefined' && window.PORTAL_BACKEND_CONFIG) || readStoredBackendConfig() || buildDefaultBackendEditableConfig();
  return normalizeBackendEditableConfig(stored);
}

function saveBackendEditableConfig(config) {
  const normalized = normalizeBackendEditableConfig(config);
  localStorage.setItem('portal_backend_config', JSON.stringify(normalized));
  window.PORTAL_BACKEND_CONFIG = normalized;
  return normalized;
}

window.PORTAL_BACKEND_CONFIG = getBackendEditableConfig();
