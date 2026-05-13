/* ================================================================
   AUTH + ACCESS CONTROL
================================================================ */
const PORTAL_ROLE_LABELS = {
  admin: 'Administrador',
  editor: 'Editor',
  viewer: 'Lectura',
};

const PORTAL_AUTH_PASSWORD_FLOW_TYPES = new Set(['invite', 'recovery']);

let authState = {
  enabled: false,
  ready: false,
  session: null,
  accessContext: null,
  supabaseClient: null,
};

function clearProtectedBrowserCache() {
  try {
    localStorage.removeItem('bienestar_seguimiento_v5_2');
  } catch (error) {}
}

function isPortalAuthEnabled() {
  return getBackendConfig().type === 'supabase';
}

function hasPortalSupabaseConfig() {
  const config = getBackendConfig();
  return Boolean(config.supabase.url && config.supabase.anonKey);
}

function ensurePortalSupabaseClient() {
  if (authState.supabaseClient) return authState.supabaseClient;
  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    throw new Error('No se cargó el cliente de Supabase');
  }
  const config = getBackendConfig();
  authState.supabaseClient = window.supabase.createClient(config.supabase.url, config.supabase.anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
  return authState.supabaseClient;
}

function getPortalSupabaseClient() {
  return ensurePortalSupabaseClient();
}

async function getSupabaseAccessToken() {
  if (!isPortalAuthEnabled()) return '';
  if (authState.session && authState.session.access_token) return authState.session.access_token;
  const client = ensurePortalSupabaseClient();
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  authState.session = data.session || null;
  return authState.session && authState.session.access_token ? authState.session.access_token : '';
}

function normalizeAccessContext(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  return {
    hasAccess: Boolean(source.hasAccess),
    isActive: Boolean(source.isActive),
    userId: source.userId || '',
    email: source.email || '',
    snapshotId: source.snapshotId || '',
    role: source.role || '',
    agentId: source.agentId || null,
  };
}

function getAccessContext() {
  return authState.accessContext || null;
}

function getPortalUserId() {
  return (authState.session && authState.session.user && authState.session.user.id) || '';
}

function getPortalUserEmail() {
  return (authState.session && authState.session.user && authState.session.user.email) || '';
}

function getActorRole() {
  if (!isPortalAuthEnabled()) return 'admin';
  return (authState.accessContext && authState.accessContext.role) || '';
}

function isAdminUser() {
  return !isPortalAuthEnabled() || getActorRole() === 'admin';
}

function canEditOwnWorkspace() {
  return !isPortalAuthEnabled() || getActorRole() === 'editor';
}

function isViewerUser() {
  return isPortalAuthEnabled() && getActorRole() === 'viewer';
}

function getAssignedAgentId() {
  return authState.accessContext && authState.accessContext.agentId ? authState.accessContext.agentId : null;
}

function getActiveSnapshotId() {
  if (authState.accessContext && authState.accessContext.snapshotId) return authState.accessContext.snapshotId;
  return getBackendConfig().supabase.snapshotId;
}

function hasAgentScope(agentId) {
  if (isAdminUser()) return true;
  return Boolean(agentId) && agentId === getAssignedAgentId();
}

function assertCanEditAgentScope(agentId) {
  if (!isPortalAuthEnabled()) return;
  if (isAdminUser()) return;
  if (!canEditOwnWorkspace()) {
    throw new Error('Tu acceso es solo de lectura');
  }
  if (!hasAgentScope(agentId)) {
    throw new Error('Solo puedes editar tu expediente asignado');
  }
}

function getScopedUiStorageKey(baseKey) {
  return baseKey + '::' + (getPortalUserId() || 'anon');
}

function getAuthFlowTypeFromUrl() {
  const searchParams = new URLSearchParams(window.location.search);
  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
  const hashParams = new URLSearchParams(hash);
  return (hashParams.get('type') || searchParams.get('type') || '').trim();
}

function shouldPromptPasswordSetup() {
  return PORTAL_AUTH_PASSWORD_FLOW_TYPES.has(getAuthFlowTypeFromUrl());
}

function clearAuthUrlArtifacts() {
  const nextUrl = new URL(window.location.href);
  nextUrl.hash = '';
  nextUrl.searchParams.delete('type');
  window.history.replaceState({}, document.title, nextUrl.toString());
}

function formatPortalRoleLabel(role) {
  return PORTAL_ROLE_LABELS[role] || 'Sin rol';
}

function ensureAuthGate() {
  let gate = document.getElementById('authGate');
  if (gate) return gate;
  gate = document.createElement('div');
  gate.id = 'authGate';
  gate.className = 'auth-gate';
  document.body.appendChild(gate);
  return gate;
}

function renderAuthGate(mode, context) {
  const gate = ensureAuthGate();
  const data = context && typeof context === 'object' ? context : {};
  const titleMap = {
    loading: 'Conectando portal',
    login: 'Inicia sesión',
    password: 'Define tu contraseña',
    noaccess: 'Sin acceso activo',
    config: 'Falta configurar Supabase',
  };
  const copyMap = {
    loading: 'Estamos validando tu sesión y el acceso asignado al portal.',
    login: 'Usa el correo y la contraseña que te asignó la administración del portal.',
    password: 'Tu invitación ya fue validada. Antes de entrar, define una contraseña nueva para esta cuenta.',
    noaccess: 'Tu cuenta está autenticada, pero todavía no tiene acceso activo o no tiene un agente asignado.',
    config: 'El portal está en modo Supabase, pero faltan la URL o la anon key del proyecto.',
  };

  let bodyHtml = '';

  if (mode === 'loading') {
    bodyHtml = '<div class="auth-spinner"></div>';
  } else if (mode === 'login') {
    bodyHtml =
      '<form class="auth-form" onsubmit="submitPortalLogin(event)">' +
        '<label class="auth-field">' +
          '<span>Correo</span>' +
          '<input type="email" id="authEmailInput" autocomplete="email" required>' +
        '</label>' +
        '<label class="auth-field">' +
          '<span>Contraseña</span>' +
          '<input type="password" id="authPasswordInput" autocomplete="current-password" required>' +
        '</label>' +
        '<button class="btn btn-primary auth-submit" type="submit">Entrar</button>' +
      '</form>';
  } else if (mode === 'password') {
    bodyHtml =
      '<form class="auth-form" onsubmit="submitPortalPasswordSetup(event)">' +
        '<label class="auth-field">' +
          '<span>Nueva contraseña</span>' +
          '<input type="password" id="authNewPasswordInput" autocomplete="new-password" minlength="8" required>' +
        '</label>' +
        '<label class="auth-field">' +
          '<span>Confirmar contraseña</span>' +
          '<input type="password" id="authConfirmPasswordInput" autocomplete="new-password" minlength="8" required>' +
        '</label>' +
        '<button class="btn btn-primary auth-submit" type="submit">Guardar contraseña</button>' +
      '</form>';
  } else if (mode === 'noaccess') {
    bodyHtml =
      '<div class="auth-state-copy">' +
        '<div class="auth-state-note">Cuenta: ' + escapeHtml(data.email || getPortalUserEmail() || 'sin correo') + '</div>' +
        '<div class="auth-state-note">Pide a la administración que active tu rol o asigne tu agente.</div>' +
      '</div>' +
      '<div class="auth-inline-actions">' +
        '<button class="btn btn-ghost" type="button" onclick="performPortalLogout()">Cerrar sesión</button>' +
      '</div>';
  } else if (mode === 'config') {
    bodyHtml =
      '<div class="auth-state-copy">' +
        '<div class="auth-state-note">Completa `window.PORTAL_BACKEND_CONFIG.supabase.url` y `anonKey` antes de usar el portal protegido.</div>' +
      '</div>';
  }

  const errorHtml = data.error
    ? '<div class="auth-error">' + escapeHtml(data.error) + '</div>'
    : '';

  gate.innerHTML =
    '<div class="auth-gate-backdrop"></div>' +
    '<div class="auth-gate-card">' +
      '<div class="stamp-label">Acceso seguro</div>' +
      '<h2>' + escapeHtml(titleMap[mode] || 'Acceso') + '</h2>' +
      '<p>' + escapeHtml(copyMap[mode] || '') + '</p>' +
      errorHtml +
      bodyHtml +
    '</div>';

  gate.classList.add('active');
  document.body.classList.add('auth-locked');
}

function hideAuthGate() {
  const gate = document.getElementById('authGate');
  if (gate) gate.classList.remove('active');
  document.body.classList.remove('auth-locked');
}

function syncPortalSessionChrome() {
  const sessionBadge = document.getElementById('sessionBadge');
  const sessionBadgeText = document.getElementById('sessionBadgeText');
  const sessionBadgeMeta = document.getElementById('sessionBadgeMeta');
  const logoutBtn = document.getElementById('logoutBtn');

  if (sessionBadge) {
    sessionBadge.hidden = !isPortalAuthEnabled() || !authState.session;
  }
  if (sessionBadgeText) {
    sessionBadgeText.textContent = getPortalUserEmail() || 'Sin sesión';
  }
  if (sessionBadgeMeta) {
    const role = getActorRole();
    sessionBadgeMeta.textContent = role ? formatPortalRoleLabel(role) : 'Sesión';
  }
  if (logoutBtn) {
    logoutBtn.hidden = !isPortalAuthEnabled() || !authState.session;
  }
}

function syncPortalAccessChrome() {
  syncPortalSessionChrome();

  const dashboardTab = document.querySelector('[data-view="dashboard"]');
  const deliverablesTab = document.querySelector('[data-view="deliverables"]');
  const adminTab = document.querySelector('[data-view="admin"]');
  const topPaymentsBtn = document.getElementById('topPaymentsBtn');
  const topExportBtn = document.getElementById('topExportBtn');
  const topImportBtn = document.getElementById('topImportBtn');
  const topPrintBtn = document.getElementById('topPrintBtn');
  const topNewActivityBtn = document.getElementById('topNewActivityBtn');

  const allowAdminSurface = isAdminUser();

  [dashboardTab, deliverablesTab, adminTab].forEach((element) => {
    if (!element) return;
    element.hidden = !allowAdminSurface;
  });

  [topPaymentsBtn, topExportBtn, topImportBtn, topPrintBtn].forEach((element) => {
    if (!element) return;
    element.hidden = !allowAdminSurface;
  });

  if (topNewActivityBtn) {
    topNewActivityBtn.hidden = !allowAdminSurface;
  }

  document.body.classList.toggle('portal-agent-scoped', isPortalAuthEnabled() && !allowAdminSurface);
  document.body.classList.toggle('portal-readonly', isViewerUser());
}

async function loadPortalAccessContext() {
  const payload = await requestSupabaseRpc('portal_get_access_context');
  authState.accessContext = normalizeAccessContext(payload);
  return authState.accessContext;
}

async function bootstrapPortalAuth() {
  authState.enabled = isPortalAuthEnabled();
  authState.ready = false;
  authState.accessContext = null;
  authState.session = null;

  if (!authState.enabled) {
    authState.ready = true;
    hideAuthGate();
    syncPortalAccessChrome();
    return { ok: true, mode: 'disabled' };
  }

  clearProtectedBrowserCache();

  if (!hasPortalSupabaseConfig()) {
    renderAuthGate('config');
    syncPortalAccessChrome();
    return { ok: false, mode: 'config' };
  }

  renderAuthGate('loading');
  syncPortalAccessChrome();

  try {
    const client = ensurePortalSupabaseClient();
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    authState.session = data.session || null;

    if (!authState.session) {
      renderAuthGate('login');
      syncPortalAccessChrome();
      return { ok: false, mode: 'login' };
    }

    if (shouldPromptPasswordSetup()) {
      renderAuthGate('password');
      syncPortalAccessChrome();
      return { ok: false, mode: 'password' };
    }

    const accessContext = await loadPortalAccessContext();
    syncPortalAccessChrome();

    if (!accessContext.hasAccess || !accessContext.isActive || (accessContext.role !== 'admin' && !accessContext.agentId)) {
      renderAuthGate('noaccess', { email: authState.session.user && authState.session.user.email });
      return { ok: false, mode: 'noaccess' };
    }

    authState.ready = true;
    hideAuthGate();
    syncPortalAccessChrome();
    return { ok: true, mode: 'ready' };
  } catch (error) {
    console.error('Auth bootstrap error', error);
    renderAuthGate('login', {
      error: error && error.message ? error.message : 'No se pudo iniciar la sesión',
    });
    syncPortalAccessChrome();
    return { ok: false, mode: 'error' };
  }
}

async function submitPortalLogin(event) {
  if (event) event.preventDefault();
  const email = document.getElementById('authEmailInput').value.trim();
  const password = document.getElementById('authPasswordInput').value;

  if (!email || !password) {
    renderAuthGate('login', { error: 'Escribe tu correo y contraseña' });
    return;
  }

  renderAuthGate('loading');

  try {
    const client = ensurePortalSupabaseClient();
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    window.location.reload();
  } catch (error) {
    renderAuthGate('login', {
      error: error && error.message ? error.message : 'No se pudo iniciar sesión',
    });
  }
}

async function submitPortalPasswordSetup(event) {
  if (event) event.preventDefault();
  const password = document.getElementById('authNewPasswordInput').value;
  const confirmPassword = document.getElementById('authConfirmPasswordInput').value;

  if (!password || password.length < 8) {
    renderAuthGate('password', { error: 'Usa una contraseña de al menos 8 caracteres' });
    return;
  }
  if (password !== confirmPassword) {
    renderAuthGate('password', { error: 'Las contraseñas no coinciden' });
    return;
  }

  renderAuthGate('loading');

  try {
    const client = ensurePortalSupabaseClient();
    const { error } = await client.auth.updateUser({ password });
    if (error) throw error;
    clearAuthUrlArtifacts();
    window.location.reload();
  } catch (error) {
    renderAuthGate('password', {
      error: error && error.message ? error.message : 'No se pudo guardar la contraseña',
    });
  }
}

async function performPortalLogout() {
  try {
    clearProtectedBrowserCache();
    if (isPortalAuthEnabled()) {
      const client = ensurePortalSupabaseClient();
      await client.auth.signOut();
    }
  } catch (error) {
    console.error('Logout error', error);
  }
  window.location.reload();
}
