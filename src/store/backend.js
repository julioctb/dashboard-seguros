/* ================================================================
   BACKEND ADAPTERS · localStorage / Supabase REST
================================================================ */
const BACKEND_DEFAULT_CONFIG = buildDefaultBackendEditableConfig();

let backendStatus = {
  type: 'localStorage',
  connected: false,
  lastError: null,
  lastSyncAt: null,
};

let supabaseSaveQueue = Promise.resolve();

function getBackendConfig() {
  const custom = (typeof window !== 'undefined' && window.PORTAL_BACKEND_CONFIG) || BACKEND_DEFAULT_CONFIG;
  return normalizeBackendEditableConfig(custom);
}

function isProtectedPortalSession() {
  return typeof isPortalAuthEnabled === 'function' && isPortalAuthEnabled();
}

function isSupabaseBackendEnabled() {
  const config = getBackendConfig();
  return config.type === 'supabase' && Boolean(config.supabase.url && config.supabase.anonKey);
}

function shouldUseLocalSnapshotCache() {
  if (isProtectedPortalSession()) return false;
  const config = getBackendConfig();
  if (config.type !== 'supabase') return true;
  return config.cacheLocalSnapshot !== false;
}

function shouldSeedFromPreload() {
  const config = getBackendConfig();
  return config.seedFromPreload !== false;
}

function getSupabaseRestBaseUrl(config) {
  return config.supabase.url.replace(/\/$/, '') + '/rest/v1/' + encodeURIComponent(config.supabase.table);
}

function getSupabaseFunctionsBaseUrl(config) {
  return config.supabase.url.replace(/\/$/, '') + '/functions/v1/';
}

function getEffectiveSnapshotId(config) {
  if (typeof getActiveSnapshotId === 'function') {
    const activeSnapshotId = getActiveSnapshotId();
    if (activeSnapshotId) return activeSnapshotId;
  }
  return config.supabase.snapshotId;
}

async function buildSupabaseHeaders(includeJsonContentType) {
  const config = getBackendConfig();
  const headers = {
    apikey: config.supabase.anonKey,
    Authorization: 'Bearer ' + config.supabase.anonKey,
  };

  if (isProtectedPortalSession() && typeof getSupabaseAccessToken === 'function') {
    const accessToken = await getSupabaseAccessToken();
    if (accessToken) headers.Authorization = 'Bearer ' + accessToken;
  }

  if (includeJsonContentType) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

async function requestSupabaseSnapshot(method, body) {
  const config = getBackendConfig();
  const url = getSupabaseRestBaseUrl(config);
  const snapshotId = encodeURIComponent(getEffectiveSnapshotId(config));
  const query = method === 'GET'
    ? '?id=eq.' + snapshotId + '&select=payload&limit=1'
    : '?on_conflict=id';
  const headers = await buildSupabaseHeaders(true);

  const response = await fetch(url + query, {
    method,
    headers: {
      ...headers,
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
    id: getEffectiveSnapshotId(config),
    payload: snapshot,
    updated_at: new Date().toISOString(),
  });
}

function cloneSnapshotForTransport(snapshot) {
  if (typeof structuredClone === 'function') return structuredClone(snapshot);
  return JSON.parse(JSON.stringify(snapshot));
}

function queueSupabaseSnapshotSave(snapshot) {
  const queuedSnapshot = cloneSnapshotForTransport(snapshot);
  supabaseSaveQueue = supabaseSaveQueue
    .catch(() => null)
    .then(() => saveSupabaseSnapshot(queuedSnapshot));
  return supabaseSaveQueue;
}

async function requestSupabaseRpc(name, payload) {
  if (!isSupabaseBackendEnabled()) {
    throw new Error('Supabase no está configurado para este portal');
  }
  const config = getBackendConfig();
  const headers = await buildSupabaseHeaders(true);
  const response = await fetch(config.supabase.url.replace(/\/$/, '') + '/rest/v1/rpc/' + encodeURIComponent(name), {
    method: 'POST',
    headers,
    body: payload ? JSON.stringify(payload) : '{}',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error('RPC ' + name + ' ' + response.status + ': ' + text);
  }

  if (response.status === 204) return null;
  return response.json();
}

async function invokeSupabaseFunction(name, payload) {
  if (!isSupabaseBackendEnabled()) {
    throw new Error('Supabase no está configurado para este portal');
  }
  const config = getBackendConfig();
  const headers = await buildSupabaseHeaders(true);
  const response = await fetch(getSupabaseFunctionsBaseUrl(config) + encodeURIComponent(name), {
    method: 'POST',
    headers,
    body: JSON.stringify(payload || {}),
  });

  if (!response.ok) {
    let message = response.status + '';
    try {
      const data = await response.json();
      message = data && data.error ? data.error : message;
    } catch (error) {}
    throw new Error(message);
  }

  if (response.status === 204) return null;
  return response.json();
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
