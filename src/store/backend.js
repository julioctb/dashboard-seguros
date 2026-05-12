/* ================================================================
   BACKEND ADAPTERS · localStorage / Supabase REST
================================================================ */
const BACKEND_DEFAULT_CONFIG = {
  type: 'localStorage',
  supabase: {
    url: '',
    anonKey: '',
    table: 'portal_snapshots',
    snapshotId: 'bienestar-patrimonial-paquete-1',
    fallbackToLocalStorage: true,
  },
};

let backendStatus = {
  type: 'localStorage',
  connected: false,
  lastError: null,
  lastSyncAt: null,
};

function getBackendConfig() {
  const custom = (typeof window !== 'undefined' && window.PORTAL_BACKEND_CONFIG) || {};
  const supabase = {
    ...BACKEND_DEFAULT_CONFIG.supabase,
    ...(custom.supabase || {}),
  };
  return {
    ...BACKEND_DEFAULT_CONFIG,
    ...custom,
    supabase,
  };
}

function isSupabaseBackendEnabled() {
  const config = getBackendConfig();
  return config.type === 'supabase' && Boolean(config.supabase.url && config.supabase.anonKey);
}

function getSupabaseRestBaseUrl(config) {
  return config.supabase.url.replace(/\/$/, '') + '/rest/v1/' + encodeURIComponent(config.supabase.table);
}

async function requestSupabaseSnapshot(method, body) {
  const config = getBackendConfig();
  const url = getSupabaseRestBaseUrl(config);
  const snapshotId = encodeURIComponent(config.supabase.snapshotId);
  const query = method === 'GET'
    ? '?id=eq.' + snapshotId + '&select=payload&limit=1'
    : '?on_conflict=id';

  const response = await fetch(url + query, {
    method,
    headers: {
      apikey: config.supabase.anonKey,
      Authorization: 'Bearer ' + config.supabase.anonKey,
      'Content-Type': 'application/json',
      Prefer: method === 'POST' ? 'resolution=merge-duplicates,return=minimal' : 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error('Supabase ' + response.status + ': ' + text);
  }

  if (method === 'GET') return response.json();
  return null;
}

async function loadSupabaseSnapshot() {
  if (!isSupabaseBackendEnabled()) return null;
  const rows = await requestSupabaseSnapshot('GET');
  return rows && rows[0] ? rows[0].payload : null;
}

async function saveSupabaseSnapshot(snapshot) {
  if (!isSupabaseBackendEnabled()) return;
  const config = getBackendConfig();
  await requestSupabaseSnapshot('POST', {
    id: config.supabase.snapshotId,
    payload: snapshot,
    updated_at: new Date().toISOString(),
  });
}

function updateBackendStatusLabel() {
  const el = document.getElementById('backendStatusLabel');
  if (!el) return;
  const config = getBackendConfig();
  if (config.type !== 'supabase') {
    el.textContent = 'localStorage';
    return;
  }
  el.textContent = backendStatus.connected ? 'Supabase' : 'Supabase (fallback local)';
}

function setBackendStatus(patch) {
  backendStatus = { ...backendStatus, ...patch };
  updateBackendStatusLabel();
}
