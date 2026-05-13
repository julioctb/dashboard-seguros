/* ================================================================
   NAV + EXPORT
================================================================ */
const readyTasks = [];
let readyTasksRan = false;

function registerOnReady(task) {
  if (readyTasksRan) {
    task();
    return;
  }
  readyTasks.push(task);
}

function runOnReadyTasks() {
  readyTasksRan = true;
  readyTasks.splice(0).forEach(task => task());
}

function goToAgent(agentId) {
  if (typeof hasAgentScope === 'function' && !hasAgentScope(agentId)) return;
  state.currentAgent = agentId;
  state.currentSubtab = 'bitacora';
  switchView('agents');
}

function switchView(viewName) {
  if (typeof isPortalAuthEnabled === 'function' && isPortalAuthEnabled() && !isAdminUser()) {
    viewName = 'agents';
  }

  document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  document.getElementById('view-' + viewName).classList.add('active');
  const activeTab = document.querySelector('[data-view="' + viewName + '"]');
  if (activeTab) activeTab.classList.add('active');

  if (viewName === 'agents') {
    refreshUI('agents');
  } else if (viewName === 'deliverables') {
    refreshUI('deliverables');
  } else if (viewName === 'admin') {
    refreshUI('admin');
  } else {
    refreshUI('dashboard');
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function exportData() {
  if (typeof isPortalAuthEnabled === 'function' && isPortalAuthEnabled() && !isAdminUser()) {
    showToast('Solo el administrador puede exportar respaldos', 'error');
    return;
  }

  const data = {
    exportDate: new Date().toISOString(),
    program: getProgramSettings(),
    ...createStateSnapshot(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'bienestar-seguimiento-' + new Date().toISOString().slice(0, 10) + '.json';
  anchor.click();
  URL.revokeObjectURL(url);
  showToast('Respaldo descargado');
}

function handleImportFile(event) {
  if (typeof isPortalAuthEnabled === 'function' && isPortalAuthEnabled() && !isAdminUser()) {
    showToast('Solo el administrador puede importar respaldos', 'error');
    event.target.value = '';
    return;
  }

  const file = event.target.files[0];
  if (!file) return;
  if (!confirm('¿Reemplazar TODOS los datos actuales con los del respaldo? Esta acción no se puede deshacer.')) {
    event.target.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = function(loadEvent) {
    try {
      const data = JSON.parse(loadEvent.target.result);
      if (!data || typeof data !== 'object') throw new Error('El archivo no es un JSON válido');
      if (!Array.isArray(data.agents)) throw new Error('El archivo no parece un respaldo válido (falta "agents")');

      applyStateSnapshot(data);
      saveState();
      refreshUI('all');
      showToast('Importado · ' + state.agents.length + ' agentes · ' + state.activities.length + ' actividades · ' + (state.cierres || []).length + ' cierres');
    } catch (error) {
      console.error('Import error', error);
      showToast('Error al importar: ' + error.message, 'error');
    }
    event.target.value = '';
  };
  reader.onerror = function() {
    showToast('Error al leer el archivo', 'error');
    event.target.value = '';
  };
  reader.readAsText(file);
}

/* ================================================================
   INIT
================================================================ */
async function init() {
  if (typeof hydrateSessionScopedUiState_v5 === 'function') {
    hydrateSessionScopedUiState_v5();
  }

  await loadState();
  if (typeof isPortalAuthEnabled === 'function' && isPortalAuthEnabled() && !isAdminUser()) {
    state.currentAgent = getAssignedAgentId() || state.currentAgent;
    state.currentSubtab = 'bitacora';
  }
  updateBackendStatusLabel();
  if (typeof applyAppShellSettings === 'function') applyAppShellSettings();
  if (typeof syncPortalAccessChrome === 'function') syncPortalAccessChrome();

  document.querySelectorAll('.tab').forEach(button => {
    button.addEventListener('click', () => switchView(button.dataset.view));
  });

  ['activityModal', 'agentModal', 'paymentModal', 'extrasModal', 'nextStepsModal'].forEach(id => {
    const element = document.getElementById(id);
    if (!element) return;
    element.addEventListener('click', event => {
      if (event.target.id !== id) return;
      if (id === 'activityModal') closeActivityModal();
      else if (id === 'agentModal') closeAgentModal();
      else if (id === 'paymentModal') closePaymentModal();
      else if (id === 'extrasModal') closeExtrasModal();
      else if (id === 'nextStepsModal') closeNextStepsModal();
    });
  });

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    closeActivityModal();
    closeAgentModal();
    closePaymentModal();
    closeExtrasModal();
    closeNextStepsModal();
    const statusMenu = document.getElementById('statusMenu');
    if (statusMenu) statusMenu.classList.remove('open');
  });

  const statusMenu = document.getElementById('statusMenu');
  if (statusMenu) {
    statusMenu.addEventListener('click', event => {
      const item = event.target.closest('.status-menu-item');
      if (!item) return;
      if (activeStatusKey) {
        updateDeliverableField(activeStatusKey, 'status', item.dataset.status);
        refreshUI('all');
        showToast('Estado actualizado');
      }
      statusMenu.classList.remove('open');
    });
  }

  document.addEventListener('click', event => {
    const menu = document.getElementById('statusMenu');
    if (!menu) return;
    if (!menu.contains(event.target) && !event.target.classList.contains('del-status-badge')) {
      menu.classList.remove('open');
    }
  });

  refreshUI('all');
  if (typeof isPortalAuthEnabled === 'function' && isPortalAuthEnabled() && !isAdminUser()) {
    switchView('agents');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  if (typeof bootstrapPortalAuth === 'function') {
    const authBootstrap = await bootstrapPortalAuth();
    if (!authBootstrap.ok) {
      runOnReadyTasks();
      return;
    }
  }
  await init();
  runOnReadyTasks();
});
