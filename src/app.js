/* ================================================================
   NAV + EXPORT
================================================================ */
function goToAgent(agentId) {
  state.currentAgent = agentId;
  state.currentSubtab = 'bitacora';
  switchView('agents');
}

function switchView(viewName) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('view-' + viewName).classList.add('active');
  document.querySelector('[data-view="' + viewName + '"]').classList.add('active');

  if (viewName === 'agents') { renderAgentTabs(); renderAgentPanels(); }
  else if (viewName === 'deliverables') renderDeliverables();
  else renderDashboard();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function exportData() {
  const data = {
    exportDate: new Date().toISOString(),
    program: PROGRAM,
    ...createStateSnapshot(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'bienestar-seguimiento-' + new Date().toISOString().slice(0,10) + '.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Respaldo descargado');
}

function handleImportFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (!confirm('¿Reemplazar TODOS los datos actuales con los del respaldo? Esta acción no se puede deshacer.')) {
    event.target.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (!data || typeof data !== 'object') throw new Error('El archivo no es un JSON válido');
      if (!Array.isArray(data.agents)) throw new Error('El archivo no parece un respaldo válido (falta "agents")');

      applyStateSnapshot(data);
      saveState();
      refreshAllViews();
      showToast('Importado · ' + state.agents.length + ' agentes · ' + state.activities.length + ' actividades · ' + state.cierres.length + ' cierres');
    } catch (err) {
      console.error('Import error', err);
      showToast('Error al importar: ' + err.message, 'error');
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
  await loadState();
  updateBackendStatusLabel();

  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  // Cerrar modales al click fuera
  ['activityModal','agentModal','paymentModal','extrasModal','nextStepsModal'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('click', (e) => {
      if (e.target.id === id) {
        if (id === 'activityModal') closeActivityModal();
        else if (id === 'agentModal') closeAgentModal();
        else if (id === 'paymentModal') closePaymentModal();
        else if (id === 'extrasModal') closeExtrasModal();
        else if (id === 'nextStepsModal') closeNextStepsModal();
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeActivityModal();
      closeAgentModal();
      closePaymentModal();
      closeExtrasModal();
      closeNextStepsModal();
      document.getElementById('statusMenu').classList.remove('open');
    }
  });

  // Status menu clicks
  document.querySelectorAll('#statusMenu .status-menu-item').forEach(item => {
    item.addEventListener('click', () => {
      if (activeStatusKey) {
        setDelField(activeStatusKey, 'status', item.dataset.status);
        showToast('Estado actualizado');
      }
      document.getElementById('statusMenu').classList.remove('open');
    });
  });

  document.addEventListener('click', (e) => {
    const menu = document.getElementById('statusMenu');
    if (!menu.contains(e.target) && !e.target.classList.contains('del-status-badge')) {
      menu.classList.remove('open');
    }
  });

  renderDashboard();
}


document.addEventListener('DOMContentLoaded', async () => {
  await init();
  runOnReadyTasks();
});
