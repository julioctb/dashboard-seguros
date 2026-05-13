/* ================================================================
   ADMIN PORTAL
================================================================ */
const ADMIN_CATALOG_META = {
  agentStatuses: {
    title: 'Estados de agente',
    description: 'Controla las opciones disponibles al crear o editar agentes.',
  },
  activityTypes: {
    title: 'Etapas de actividad',
    description: 'Define las etapas del flujo comercial disponibles en el modal de actividad.',
  },
  activityResults: {
    title: 'Resultados de actividad',
    description: 'Ajusta los resultados que se pueden registrar por cita.',
  },
  cierreStatuses: {
    title: 'Estados de cierre',
    description: 'Backlog operativo para cotizaciones y cierres pendientes.',
  },
  cierrePriorities: {
    title: 'Prioridades de cierre',
    description: 'Orden de atención para el backlog de cierres.',
  },
  deliverableStatuses: {
    title: 'Estados de entregable',
    description: 'Opciones que se muestran al actualizar entregables del contrato.',
  },
};

let adminCatalogDrafts = null;

function cloneAdminValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function buildProgramTimelineLabel(program, branding) {
  return formatDate(program.startDate) + ' → ' + formatDateWithYear(program.endDate) +
    ' · ' + program.totalWeeks + ' semanas · ' + formatCurrency(program.montoTotal, branding.currency);
}

function formatAdminSyncLabel(iso) {
  if (!iso) return 'Sin sincronización';
  const date = new Date(iso);
  return date.toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function applyAppShellSettings() {
  const program = getProgramSettings();
  const branding = getBrandingSettings();
  const heroSub = buildProgramTimelineLabel(program, branding);
  const brandBadgeEl = document.getElementById('brandBadgeText');
  const brandNameEl = document.getElementById('brandNameText');
  const brandSubEl = document.getElementById('brandSubText');
  const heroTitleEl = document.getElementById('heroTitleText');
  const heroH1El = document.getElementById('heroH1Text');
  const heroSubEl = document.getElementById('heroSubText');
  const paymentTotalEl = document.getElementById('paymentTotalValue');
  const footerBrandEl = document.getElementById('appFooterBrandText');
  const footerProgramEl = document.getElementById('appFooterProgramText');

  if (brandBadgeEl) brandBadgeEl.textContent = branding.brandBadge;
  if (brandNameEl) brandNameEl.textContent = program.title;
  if (brandSubEl) brandSubEl.textContent = program.subtitle;
  if (heroTitleEl) heroTitleEl.textContent = program.phaseTitle;
  if (heroH1El) heroH1El.textContent = program.phaseName;
  if (heroSubEl) heroSubEl.textContent = heroSub;
  if (paymentTotalEl) paymentTotalEl.textContent = formatCurrency(program.montoTotal, branding.currency);
  if (footerBrandEl) footerBrandEl.textContent = branding.brandBadge;
  if (footerProgramEl) footerProgramEl.textContent = program.title;
  document.title = program.title + ' · ' + branding.brandBadge;
}

function ensureAdminCatalogDrafts(forceReset) {
  if (forceReset || !adminCatalogDrafts) {
    adminCatalogDrafts = cloneAdminValue(getSettings().catalogs);
  }
}

function readAdminNumberValue(inputId, fallback) {
  const raw = document.getElementById(inputId).value.trim();
  const value = parseInt(raw, 10);
  return Number.isFinite(value) ? value : fallback;
}

function renderAdminSummaryCards() {
  const config = getBackendEditableConfig();
  const activeBackend = config.type === 'supabase'
    ? (backendStatus.connected ? 'Supabase' : 'Supabase fallback local')
    : 'localStorage';

  return '<div class="admin-summary-grid">' +
    '<div class="admin-summary-card">' +
      '<div class="admin-summary-label">Backend activo</div>' +
      '<div class="admin-summary-value">' + escapeHtml(activeBackend) + '</div>' +
      '<div class="admin-summary-sub">' + escapeHtml(config.supabase.snapshotId || 'snapshot no definido') + '</div>' +
    '</div>' +
    '<div class="admin-summary-card">' +
      '<div class="admin-summary-label">Agentes</div>' +
      '<div class="admin-summary-value">' + state.agents.length + '</div>' +
      '<div class="admin-summary-sub">registro operativo</div>' +
    '</div>' +
    '<div class="admin-summary-card">' +
      '<div class="admin-summary-label">Actividades</div>' +
      '<div class="admin-summary-value">' + state.activities.length + '</div>' +
      '<div class="admin-summary-sub">bitácora comercial</div>' +
    '</div>' +
    '<div class="admin-summary-card">' +
      '<div class="admin-summary-label">Cierres</div>' +
      '<div class="admin-summary-value">' + (state.cierres || []).length + '</div>' +
      '<div class="admin-summary-sub">backlog de cotizaciones</div>' +
    '</div>' +
    '<div class="admin-summary-card">' +
      '<div class="admin-summary-label">Última sync</div>' +
      '<div class="admin-summary-value admin-summary-value-sm">' + escapeHtml(formatAdminSyncLabel(backendStatus.lastSyncAt)) + '</div>' +
      '<div class="admin-summary-sub">' + (backendStatus.lastError ? escapeHtml(backendStatus.lastError) : 'sin errores') + '</div>' +
    '</div>' +
  '</div>';
}

function renderAdminCatalogCard(catalogKey) {
  const meta = ADMIN_CATALOG_META[catalogKey];
  const items = adminCatalogDrafts[catalogKey] || [];
  const protectedCount = (DEFAULT_CATALOGS[catalogKey] || []).length;

  return '<div class="admin-catalog-card">' +
    '<div class="admin-catalog-head">' +
      '<div>' +
        '<div class="admin-catalog-title">' + escapeHtml(meta.title) + '</div>' +
        '<div class="admin-catalog-desc">' + escapeHtml(meta.description) + '</div>' +
      '</div>' +
      '<button class="btn btn-ghost admin-mini-btn" onclick="addAdminCatalogItem(\'' + catalogKey + '\')">+ Agregar</button>' +
    '</div>' +
    '<div class="admin-catalog-list">' +
      items.map((item, index) =>
        '<div class="admin-catalog-row">' +
          '<div class="admin-catalog-inputs">' +
            '<div class="form-group" style="margin-bottom:0">' +
              '<label>Value</label>' +
              '<input type="text" value="' + escapeAttr(item.value || '') + '" oninput="updateAdminCatalogField(\'' + catalogKey + '\', ' + index + ', \'value\', this.value)">' +
            '</div>' +
            '<div class="form-group" style="margin-bottom:0">' +
              '<label>Label</label>' +
              '<input type="text" value="' + escapeAttr(item.label || '') + '" oninput="updateAdminCatalogField(\'' + catalogKey + '\', ' + index + ', \'label\', this.value)">' +
            '</div>' +
          '</div>' +
          '<button class="admin-catalog-remove' + (index < protectedCount ? ' disabled' : '') + '" onclick="removeAdminCatalogItem(\'' + catalogKey + '\', ' + index + ')"' + (index < protectedCount ? ' disabled' : '') + ' title="' + (index < protectedCount ? 'Las opciones base no se eliminan' : 'Eliminar opción') + '">×</button>' +
        '</div>'
      ).join('') +
    '</div>' +
    '<div class="admin-note">Las primeras ' + protectedCount + ' opciones son base del sistema. Puedes renombrarlas o cambiar su value; el portal migrará los datos existentes por posición.</div>' +
  '</div>';
}

function renderAdmin(forceReset) {
  const container = document.getElementById('adminContent');
  if (!container) return;

  ensureAdminCatalogDrafts(forceReset);

  const program = getProgramSettings();
  const branding = getBrandingSettings();
  const backend = getBackendEditableConfig();

  container.innerHTML =
    renderAdminSummaryCards() +
    '<div class="admin-grid">' +
      '<div class="admin-card">' +
        '<div class="admin-card-head">' +
          '<div>' +
            '<div class="admin-card-eyebrow">Programa</div>' +
            '<h3>Configuración principal</h3>' +
          '</div>' +
          '<button class="btn btn-primary" onclick="saveAdminProgramSettings()">Guardar programa</button>' +
        '</div>' +
        '<div class="form-group">' +
          '<label>Título del portal</label>' +
          '<input type="text" id="adminProgramTitle" value="' + escapeAttr(program.title) + '">' +
        '</div>' +
        '<div class="form-group">' +
          '<label>Subtítulo superior</label>' +
          '<input type="text" id="adminProgramSubtitle" value="' + escapeAttr(program.subtitle) + '">' +
        '</div>' +
        '<div class="form-group">' +
          '<label>Título de fase</label>' +
          '<input type="text" id="adminProgramPhaseTitle" value="' + escapeAttr(program.phaseTitle) + '">' +
        '</div>' +
        '<div class="form-group">' +
          '<label>Nombre de fase</label>' +
          '<input type="text" id="adminProgramPhaseName" value="' + escapeAttr(program.phaseName) + '">' +
        '</div>' +
        '<div class="form-row">' +
          '<div class="form-group">' +
            '<label>Fecha inicio</label>' +
            '<input type="date" id="adminProgramStartDate" value="' + escapeAttr(program.startDate) + '">' +
          '</div>' +
          '<div class="form-group">' +
            '<label>Fecha fin</label>' +
            '<input type="date" id="adminProgramEndDate" value="' + escapeAttr(program.endDate) + '">' +
          '</div>' +
        '</div>' +
        '<div class="form-row">' +
          '<div class="form-group">' +
            '<label>Total semanas</label>' +
            '<input type="number" id="adminProgramWeeks" min="1" value="' + escapeAttr(program.totalWeeks) + '">' +
          '</div>' +
          '<div class="form-group">' +
            '<label>Citas contratadas</label>' +
            '<input type="number" id="adminProgramCitas" min="1" value="' + escapeAttr(program.citasContratadas) + '">' +
          '</div>' +
        '</div>' +
        '<div class="form-row">' +
          '<div class="form-group">' +
            '<label>Total entregables</label>' +
            '<input type="number" id="adminProgramDeliverables" min="1" value="' + escapeAttr(program.totalEntregables) + '">' +
          '</div>' +
          '<div class="form-group">' +
            '<label>Monto total</label>' +
            '<input type="number" id="adminProgramAmount" min="0" step="1" value="' + escapeAttr(program.montoTotal) + '">' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="admin-card">' +
        '<div class="admin-card-head">' +
          '<div>' +
            '<div class="admin-card-eyebrow">Branding</div>' +
            '<h3>Textos visibles</h3>' +
          '</div>' +
          '<button class="btn btn-primary" onclick="saveAdminBrandingSettings()">Guardar branding</button>' +
        '</div>' +
        '<div class="form-group">' +
          '<label>Badge de marca</label>' +
          '<input type="text" id="adminBrandBadge" value="' + escapeAttr(branding.brandBadge) + '">' +
        '</div>' +
        '<div class="form-group">' +
          '<label>Moneda</label>' +
          '<input type="text" id="adminBrandCurrency" maxlength="6" value="' + escapeAttr(branding.currency) + '">' +
        '</div>' +
        '<div class="admin-preview-card">' +
          '<div class="admin-preview-label">Preview hero</div>' +
          '<div class="admin-preview-title">' + escapeHtml(program.phaseTitle) + '</div>' +
          '<div class="admin-preview-h1">' + escapeHtml(program.phaseName) + '</div>' +
          '<div class="admin-preview-sub">' + escapeHtml(buildProgramTimelineLabel(program, branding)) + '</div>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="admin-card">' +
      '<div class="admin-card-head">' +
        '<div>' +
          '<div class="admin-card-eyebrow">Catálogos</div>' +
          '<h3>Opciones del sistema</h3>' +
        '</div>' +
        '<button class="btn btn-primary" onclick="saveAdminCatalogSettings()">Guardar catálogos</button>' +
      '</div>' +
      '<div class="admin-catalog-grid">' +
        Object.keys(ADMIN_CATALOG_META).map(renderAdminCatalogCard).join('') +
      '</div>' +
    '</div>' +
    '<div class="admin-grid admin-grid-wide">' +
      '<div class="admin-card">' +
        '<div class="admin-card-head">' +
          '<div>' +
            '<div class="admin-card-eyebrow">Backend y datos</div>' +
            '<h3>Persistencia</h3>' +
          '</div>' +
          '<button class="btn btn-primary" onclick="saveAdminBackendSettings()">Guardar backend</button>' +
        '</div>' +
        '<div class="form-group">' +
          '<label>Modo</label>' +
          '<select id="adminBackendType">' +
            '<option value="localStorage"' + (backend.type === 'localStorage' ? ' selected' : '') + '>localStorage</option>' +
            '<option value="supabase"' + (backend.type === 'supabase' ? ' selected' : '') + '>Supabase</option>' +
          '</select>' +
        '</div>' +
        '<div class="form-row">' +
          '<div class="form-group">' +
            '<label>Supabase URL</label>' +
            '<input type="text" id="adminBackendUrl" value="' + escapeAttr(backend.supabase.url || '') + '">' +
          '</div>' +
          '<div class="form-group">' +
            '<label>Anon key</label>' +
            '<input type="password" id="adminBackendAnonKey" value="' + escapeAttr(backend.supabase.anonKey || '') + '">' +
          '</div>' +
        '</div>' +
        '<div class="form-row">' +
          '<div class="form-group">' +
            '<label>Tabla</label>' +
            '<input type="text" id="adminBackendTable" value="' + escapeAttr(backend.supabase.table || '') + '">' +
          '</div>' +
          '<div class="form-group">' +
            '<label>Snapshot ID</label>' +
            '<input type="text" id="adminBackendSnapshotId" value="' + escapeAttr(backend.supabase.snapshotId || '') + '">' +
          '</div>' +
        '</div>' +
        '<div class="admin-checkbox-grid">' +
          '<label class="admin-check"><input type="checkbox" id="adminBackendFallback"' + (backend.supabase.fallbackToLocalStorage ? ' checked' : '') + '> fallback a localStorage</label>' +
          '<label class="admin-check"><input type="checkbox" id="adminBackendCacheLocal"' + (backend.cacheLocalSnapshot !== false ? ' checked' : '') + '> cache local activo</label>' +
          '<label class="admin-check"><input type="checkbox" id="adminBackendSeedPreload"' + (backend.seedFromPreload !== false ? ' checked' : '') + '> usar preload si no hay snapshot</label>' +
        '</div>' +
        '<div class="admin-inline-actions">' +
          '<button class="btn btn-ghost" onclick="saveAdminBackendAsLocal()">Usar localStorage</button>' +
          '<button class="btn btn-ghost" onclick="window.location.reload()">Recargar portal</button>' +
        '</div>' +
        '<div class="admin-note">Si cambias backend o snapshot, conviene recargar la página para que la carga inicial use la nueva fuente.</div>' +
      '</div>' +
      '<div class="admin-card">' +
        '<div class="admin-card-head">' +
          '<div>' +
            '<div class="admin-card-eyebrow">Respaldo</div>' +
            '<h3>Exportación e importación</h3>' +
          '</div>' +
        '</div>' +
        '<div class="admin-data-actions">' +
          '<button class="btn btn-primary" onclick="exportData()">Descargar respaldo</button>' +
          '<button class="btn btn-ghost" onclick="document.getElementById(\'importFileInput\').click()">Importar respaldo</button>' +
          '<button class="btn btn-ghost" onclick="window.print()">Exportar PDF</button>' +
        '</div>' +
        '<div class="admin-data-list">' +
          '<div class="admin-data-row"><span>Storage key</span><strong>bienestar_seguimiento_v5_2</strong></div>' +
          '<div class="admin-data-row"><span>Backend config key</span><strong>portal_backend_config</strong></div>' +
          '<div class="admin-data-row"><span>Snapshot actual</span><strong>' + escapeHtml(backend.supabase.snapshotId || '—') + '</strong></div>' +
        '</div>' +
        '<div class="note-inline amber">Los respaldos ahora incluyen <strong>settings</strong>, así que programa, branding y catálogos viajan dentro del snapshot.</div>' +
      '</div>' +
    '</div>';
}

function updateAdminCatalogField(catalogKey, index, field, value) {
  if (!adminCatalogDrafts || !adminCatalogDrafts[catalogKey] || !adminCatalogDrafts[catalogKey][index]) return;
  adminCatalogDrafts[catalogKey][index][field] = value;
}

function addAdminCatalogItem(catalogKey) {
  ensureAdminCatalogDrafts();
  adminCatalogDrafts[catalogKey].push({ value: 'nueva_opcion_' + Date.now(), label: 'Nueva opción' });
  renderAdmin();
}

function removeAdminCatalogItem(catalogKey, index) {
  ensureAdminCatalogDrafts();
  const protectedCount = (DEFAULT_CATALOGS[catalogKey] || []).length;
  if (index < protectedCount) return;
  adminCatalogDrafts[catalogKey].splice(index, 1);
  renderAdmin();
}

function buildCatalogValueMap(previousEntries, nextEntries) {
  const valueMap = {};
  const length = Math.max(previousEntries.length, nextEntries.length);
  for (let index = 0; index < length; index++) {
    const previousValue = previousEntries[index] && previousEntries[index].value;
    const nextValue = nextEntries[index] && nextEntries[index].value;
    if (previousValue && nextValue && previousValue !== nextValue) {
      valueMap[previousValue] = nextValue;
    }
  }
  return valueMap;
}

function remapArrayField(items, field, valueMap) {
  (items || []).forEach(item => {
    if (!item || !valueMap[item[field]]) return;
    item[field] = valueMap[item[field]];
  });
}

function remapDeliverableStatuses(valueMap) {
  Object.values(state.deliverables || {}).forEach(item => {
    if (!item || !valueMap[item.status]) return;
    item.status = valueMap[item.status];
  });
}

function applyCatalogValueMigrations(previousCatalogs, nextCatalogs) {
  const agentStatusMap = buildCatalogValueMap(previousCatalogs.agentStatuses || [], nextCatalogs.agentStatuses || []);
  const activityTypeMap = buildCatalogValueMap(previousCatalogs.activityTypes || [], nextCatalogs.activityTypes || []);
  const activityResultMap = buildCatalogValueMap(previousCatalogs.activityResults || [], nextCatalogs.activityResults || []);
  const cierreStatusMap = buildCatalogValueMap(previousCatalogs.cierreStatuses || [], nextCatalogs.cierreStatuses || []);
  const cierrePriorityMap = buildCatalogValueMap(previousCatalogs.cierrePriorities || [], nextCatalogs.cierrePriorities || []);
  const deliverableStatusMap = buildCatalogValueMap(previousCatalogs.deliverableStatuses || [], nextCatalogs.deliverableStatuses || []);

  remapArrayField(state.agents, 'status', agentStatusMap);
  remapArrayField(state.activities, 'type', activityTypeMap);
  remapArrayField(state.activities, 'result', activityResultMap);
  remapArrayField(state.cierres, 'estado', cierreStatusMap);
  remapArrayField(state.cierres, 'prioridad', cierrePriorityMap);
  remapDeliverableStatuses(deliverableStatusMap);
}

function saveAdminProgramSettings() {
  const current = getProgramSettings();
  updateSettingsSection('program', {
    title: document.getElementById('adminProgramTitle').value.trim(),
    subtitle: document.getElementById('adminProgramSubtitle').value.trim(),
    phaseTitle: document.getElementById('adminProgramPhaseTitle').value.trim(),
    phaseName: document.getElementById('adminProgramPhaseName').value.trim(),
    startDate: document.getElementById('adminProgramStartDate').value,
    endDate: document.getElementById('adminProgramEndDate').value,
    totalWeeks: readAdminNumberValue('adminProgramWeeks', current.totalWeeks),
    citasContratadas: readAdminNumberValue('adminProgramCitas', current.citasContratadas),
    totalEntregables: readAdminNumberValue('adminProgramDeliverables', current.totalEntregables),
    montoTotal: readAdminNumberValue('adminProgramAmount', current.montoTotal),
  });
  refreshUI('all');
  showToast('Programa actualizado');
}

function saveAdminBrandingSettings() {
  updateSettingsSection('branding', {
    brandBadge: document.getElementById('adminBrandBadge').value.trim(),
    currency: document.getElementById('adminBrandCurrency').value.trim() || 'MXN',
  });
  refreshUI('all');
  showToast('Branding actualizado');
}

function saveAdminCatalogSettings() {
  ensureAdminCatalogDrafts();
  const previousCatalogs = cloneAdminValue(getSettings().catalogs);
  const nextCatalogs = normalizeSettings({ catalogs: adminCatalogDrafts }).catalogs;
  applyCatalogValueMigrations(previousCatalogs, nextCatalogs);
  updateSettingsCatalogs(nextCatalogs);
  adminCatalogDrafts = null;
  refreshUI('all');
  showToast('Catálogos actualizados');
}

function readAdminBackendForm() {
  return normalizeBackendEditableConfig({
    type: document.getElementById('adminBackendType').value,
    cacheLocalSnapshot: document.getElementById('adminBackendCacheLocal').checked,
    seedFromPreload: document.getElementById('adminBackendSeedPreload').checked,
    supabase: {
      url: document.getElementById('adminBackendUrl').value.trim(),
      anonKey: document.getElementById('adminBackendAnonKey').value.trim(),
      table: document.getElementById('adminBackendTable').value.trim() || 'portal_snapshots',
      snapshotId: document.getElementById('adminBackendSnapshotId').value.trim() || 'bienestar-patrimonial-paquete-1',
      fallbackToLocalStorage: document.getElementById('adminBackendFallback').checked,
    },
  });
}

function saveAdminBackendSettings() {
  saveBackendEditableConfig(readAdminBackendForm());
  updateBackendStatusLabel();
  refreshUI('all');
  showToast('Backend guardado');
  if (confirm('La configuración de backend quedó guardada. ¿Recargar ahora para aplicar la carga inicial con esa fuente?')) {
    window.location.reload();
  }
}

function saveAdminBackendAsLocal() {
  const config = readAdminBackendForm();
  config.type = 'localStorage';
  saveBackendEditableConfig(config);
  updateBackendStatusLabel();
  refreshUI('all');
  showToast('Backend cambiado a localStorage');
}
