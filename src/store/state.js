/* ================================================================
   STATE
================================================================ */
const STORAGE_KEY = 'bienestar_seguimiento_v5_2';

let state = {
  agents: [],
  activities: [],
  deliverables: {},
  fichas: {},
  extras: [],
  nextSteps: [],
  inducciones: [],
  cierres: [],
  settings: buildDefaultSettings(),
  currentAgent: null,
  currentSubtab: 'bitacora',
};

function normalizeStateSnapshot(snapshot) {
  const defaults = buildDefaultState();
  const raw = snapshot && typeof snapshot === 'object' ? snapshot : {};
  const rawSettings = raw.settings && typeof raw.settings === 'object' ? raw.settings : {};
  const legacyProgram = raw.program && typeof raw.program === 'object' ? raw.program : {};
  const agents = Array.isArray(raw.agents) && raw.agents.length > 0 ? raw.agents : defaults.agents;
  const deliverables = (raw.deliverables && typeof raw.deliverables === 'object')
    ? { ...defaults.deliverables, ...raw.deliverables }
    : defaults.deliverables;
  const settings = normalizeSettings({
    ...rawSettings,
    program: {
      ...legacyProgram,
      ...((rawSettings && rawSettings.program) || {}),
    },
  });
  const sourceFichas = raw.fichas && typeof raw.fichas === 'object' ? raw.fichas : {};
  const fichas = { ...buildSeedFichas() };

  Object.entries(sourceFichas).forEach(([agentId, ficha]) => {
    const safeFicha = ficha && typeof ficha === 'object' ? ficha : {};
    fichas[agentId] = {
      ...createEmptyFicha(),
      ...fichas[agentId],
      ...safeFicha,
      materiales: ensureChecklistIds(safeFicha.materiales || fichas[agentId]?.materiales, 'm_' + agentId + '_'),
      pendientes: ensureChecklistIds(safeFicha.pendientes || fichas[agentId]?.pendientes, 'p_' + agentId + '_'),
    };
  });

  agents.forEach(agent => {
    if (!fichas[agent.id]) {
      fichas[agent.id] = createEmptyFicha();
    }
  });

  return {
    agents,
    activities: Array.isArray(raw.activities) ? raw.activities : defaults.activities,
    deliverables,
    fichas,
    extras: Array.isArray(raw.extras) ? raw.extras : defaults.extras,
    nextSteps: Array.isArray(raw.nextSteps) ? raw.nextSteps : defaults.nextSteps,
    inducciones: Array.isArray(raw.inducciones) ? raw.inducciones : defaults.inducciones,
    cierres: Array.isArray(raw.cierres) ? raw.cierres : defaults.cierres,
    settings,
    currentAgent: raw.currentAgent || defaults.currentAgent,
    currentSubtab: raw.currentSubtab || defaults.currentSubtab,
  };
}

function applyStateSnapshot(snapshot) {
  Object.assign(state, normalizeStateSnapshot(snapshot));
  if (!state.agents.find(agent => agent.id === state.currentAgent)) {
    state.currentAgent = state.agents.length > 0 ? state.agents[0].id : null;
  }
}

function createStateSnapshot() {
  return {
    agents: state.agents,
    activities: state.activities,
    deliverables: state.deliverables,
    fichas: state.fichas,
    extras: state.extras,
    nextSteps: state.nextSteps,
    inducciones: state.inducciones,
    cierres: state.cierres || [],
    settings: state.settings,
    currentAgent: state.currentAgent,
    currentSubtab: state.currentSubtab,
  };
}

function cloneSnapshotData(snapshot) {
  if (typeof structuredClone === 'function') return structuredClone(snapshot);
  return JSON.parse(JSON.stringify(snapshot));
}

function getPreloadStateSnapshot() {
  if (!shouldSeedFromPreload()) return null;
  if (typeof PRELOAD_STATE_SNAPSHOT !== 'object' || !PRELOAD_STATE_SNAPSHOT) return null;
  return cloneSnapshotData(PRELOAD_STATE_SNAPSHOT);
}

function getInitialSeedSnapshot(localSnapshot) {
  return localSnapshot || getPreloadStateSnapshot() || buildDefaultState();
}

function loadLocalStateSnapshot() {
  if (!shouldUseLocalSnapshotCache()) return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

function saveLocalStateSnapshot(snapshot) {
  if (!shouldUseLocalSnapshotCache()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

async function loadState() {
  const backendConfig = getBackendConfig();
  const localSnapshot = (() => {
    try {
      return loadLocalStateSnapshot();
    } catch (error) {
      console.error('Local load error', error);
      return null;
    }
  })();

  if (isSupabaseBackendEnabled()) {
    try {
      const remoteSnapshot = await loadSupabaseSnapshot();
      if (remoteSnapshot) {
        applyStateSnapshot(remoteSnapshot);
        saveLocalStateSnapshot(createStateSnapshot());
        setBackendStatus({ type: 'supabase', connected: true, lastError: null, lastSyncAt: new Date().toISOString() });
        return;
      }

      applyStateSnapshot(getInitialSeedSnapshot(localSnapshot));
      saveState();
      setBackendStatus({ type: 'supabase', connected: true, lastError: null });
      return;
    } catch (error) {
      console.error('Supabase load error', error);
      setBackendStatus({ type: 'supabase', connected: false, lastError: error.message });
      if (!backendConfig.supabase.fallbackToLocalStorage) {
        applyStateSnapshot(buildDefaultState());
        showToast('No se pudo cargar Supabase', 'error');
        return;
      }
      showToast('Supabase no disponible · usando copia local', 'error');
    }
  }

  try {
    if (localSnapshot) {
      applyStateSnapshot(localSnapshot);
    } else {
      applyStateSnapshot(getInitialSeedSnapshot(null));
      saveState();
    }
  } catch (error) {
    console.error('Load error', error);
    applyStateSnapshot(getInitialSeedSnapshot(null));
  }
}

function saveState() {
  const snapshot = createStateSnapshot();
  try {
    saveLocalStateSnapshot(snapshot);
  } catch (error) {
    console.error('Save error', error);
    showToast('Error al guardar (límite de almacenamiento)', 'error');
  }

  if (isSupabaseBackendEnabled()) {
    queueSupabaseSnapshotSave(snapshot)
      .then(() => setBackendStatus({ type: 'supabase', connected: true, lastError: null, lastSyncAt: new Date().toISOString() }))
      .catch(error => {
        console.error('Supabase save error', error);
        setBackendStatus({ type: 'supabase', connected: false, lastError: error.message });
        if (!getBackendConfig().supabase.fallbackToLocalStorage) {
          showToast('No se pudo guardar en Supabase', 'error');
        }
      });
  }
}
