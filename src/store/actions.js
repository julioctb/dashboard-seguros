/* ================================================================
   STORE ACTIONS
================================================================ */
function getActivityUsefulResultValues() {
  return ['ok', 'cerrada', 'contrapropuesta', 'noAhora'].map(key => getCatalogSemanticValue('activityResults', key));
}

function getCierreSolicitudResultValues() {
  return ['ok', 'cerrada', 'contrapropuesta'].map(key => getCatalogSemanticValue('activityResults', key));
}

function uid() {
  return 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function refreshUI(scope) {
  if (typeof applyAppShellSettings === 'function') applyAppShellSettings();

  if (scope === 'dashboard') {
    renderDashboard();
    return;
  }

  if (scope === 'agents') {
    renderAgentTabs();
    renderAgentPanels();
    return;
  }

  if (scope === 'deliverables') {
    renderDeliverables();
    return;
  }

  if (scope === 'admin') {
    if (typeof renderAdmin === 'function') renderAdmin(true);
    return;
  }

  if (scope === 'cierres') {
    renderCierresTable_v53();
    if (state.currentAgent) renderCierresAgent_v53(state.currentAgent);
    return;
  }

  renderDashboard();
  renderDeliverables();
  renderAgentTabs();
  renderAgentPanels();
  if (typeof renderAdmin === 'function') renderAdmin();
}

function normalizeFumadorValue(value) {
  return ['si', 'no', 'nd'].includes(value) ? value : 'nd';
}

function updateSettingsSection(sectionKey, payload) {
  const nextSettings = normalizeSettings({
    ...state.settings,
    [sectionKey]: payload,
  });
  state.settings = nextSettings;
  saveState();
  return state.settings[sectionKey];
}

function updateSettingsCatalogs(catalogs) {
  const nextSettings = normalizeSettings({
    ...state.settings,
    catalogs,
  });
  state.settings = nextSettings;
  saveState();
  return state.settings.catalogs;
}
