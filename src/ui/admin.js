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
let adminUserInviteDraft = {
  email: '',
  role: 'viewer',
  agentId: '',
};
let adminUsersState = {
  loading: false,
  error: '',
  rows: [],
  loadedSnapshotId: '',
};

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

function syncStickyShellOffset() {
  const header = document.querySelector('.topbar');
  const root = document.documentElement;
  if (!header || !root) return;
  root.style.setProperty('--folio-sticky-offset', header.offsetHeight + 'px');
}

function applyAppShellSettings() {
  const program = getProgramSettings();
  const branding = getBrandingSettings();
  const timelineLabel = buildProgramTimelineLabel(program, branding);
  const amountLabel = formatCurrency(program.montoTotal, branding.currency);
  const brandBadgeEl = document.getElementById('brandBadgeText');
  const brandNameEl = document.getElementById('brandNameText');
  const brandSubEl = document.getElementById('brandSubText');
  const heroTitleEl = document.getElementById('heroTitleText');
  const heroH1El = document.getElementById('heroH1Text');
  const heroSubEl = document.getElementById('heroSubText');
  const shellPhaseEl = document.getElementById('shellPhaseTitleText');
  const shellTimelineEl = document.getElementById('shellProgramTimelineText');
  const shellAmountEl = document.getElementById('shellProgramAmountText');
  const shellWeeksEl = document.getElementById('shellTotalWeeksText');
  const heroRangeStartEl = document.getElementById('heroRangeStartText');
  const heroRangeEndEl = document.getElementById('heroRangeEndText');
  const paymentTotalEl = document.getElementById('paymentTotalValue');
  const footerBrandEl = document.getElementById('appFooterBrandText');
  const footerProgramEl = document.getElementById('appFooterProgramText');

  if (brandBadgeEl) brandBadgeEl.textContent = branding.brandBadge;
  if (brandNameEl) brandNameEl.textContent = program.title;
  if (brandSubEl) brandSubEl.textContent = program.subtitle;
  if (heroTitleEl) heroTitleEl.textContent = program.phaseTitle;
  if (heroH1El) heroH1El.textContent = program.phaseName;
  if (heroSubEl) heroSubEl.textContent = timelineLabel;
  if (shellPhaseEl) shellPhaseEl.textContent = program.phaseTitle;
  if (shellTimelineEl) shellTimelineEl.textContent = timelineLabel;
  if (shellAmountEl) shellAmountEl.textContent = amountLabel;
  if (shellWeeksEl) shellWeeksEl.textContent = program.totalWeeks;
  if (heroRangeStartEl) heroRangeStartEl.innerHTML = 'Semana 1 · <strong>' + escapeHtml(formatDate(program.startDate)) + '</strong>';
  if (heroRangeEndEl) heroRangeEndEl.innerHTML = 'Semana ' + escapeHtml(String(program.totalWeeks)) + ' · <strong>' + escapeHtml(formatDateWithYear(program.endDate)) + '</strong>';
  if (paymentTotalEl) paymentTotalEl.textContent = amountLabel;
  if (footerBrandEl) footerBrandEl.textContent = branding.brandBadge;
  if (footerProgramEl) footerProgramEl.textContent = program.title;
  document.title = program.title + ' · ' + branding.brandBadge;
  syncStickyShellOffset();
}

window.addEventListener('resize', syncStickyShellOffset);

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

function ensureAdminAccessAction() {
  if (typeof isPortalAuthEnabled === 'function' && isPortalAuthEnabled() && !isAdminUser()) {
    throw new Error('Solo el administrador puede usar este control');
  }
}

function getAdminRoleOptionsHtml(selectedValue) {
  return ['admin', 'editor', 'viewer'].map(role =>
    '<option value="' + role + '"' + (role === selectedValue ? ' selected' : '') + '>' + escapeHtml(formatPortalRoleLabel(role)) + '</option>'
  ).join('');
}

function getAdminAgentOptionsHtml(selectedValue, allowBlank) {
  const placeholder = allowBlank ? '<option value="">Sin asignar</option>' : '<option value="">Selecciona un agente</option>';
  return placeholder + state.agents.map(agent =>
    '<option value="' + escapeAttr(agent.id) + '"' + (agent.id === selectedValue ? ' selected' : '') + '>' + escapeHtml(agent.name) + '</option>'
  ).join('');
}

function renderAdminCatalogCard(catalogKey) {
  const meta = ADMIN_CATALOG_META[catalogKey];
  const items = adminCatalogDrafts[catalogKey] || [];
  const protectedCount = (DEFAULT_CATALOGS[catalogKey] || []).length;

  return '<div class="admin-catalog-card">' +
    '<div class="admin-catalog-head">' +
      '<div>' +
        '<div class="stamp-label">Catálogo</div>' +
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

function renderAdminUsersSection() {
  if (!(typeof isPortalAuthEnabled === 'function' && isPortalAuthEnabled())) {
    return '<section class="admin-card admin-card-users">' +
      '<div class="admin-card-head">' +
        '<div>' +
          '<div class="admin-card-eyebrow">Acceso y seguridad</div>' +
          '<h3>Usuarios del portal</h3>' +
          '<div class="admin-card-copy">Esta sección se habilita cuando el backend activo usa Supabase con autenticación.</div>' +
        '</div>' +
      '</div>' +
      '<div class="note-inline amber">Cambia el backend a Supabase y recarga el portal para administrar invitaciones, roles y agentes asignados.</div>' +
    '</section>';
  }

  return '<section class="admin-card admin-card-users">' +
    '<div class="admin-card-head">' +
      '<div>' +
        '<div class="admin-card-eyebrow">Acceso y seguridad</div>' +
        '<h3>Usuarios del portal</h3>' +
        '<div class="admin-card-copy">Invita cuentas, asigna rol y enlaza a cada editor o lector con su agente correspondiente dentro del snapshot activo.</div>' +
      '</div>' +
      '<button class="btn btn-ghost" onclick="loadAdminUsers(true)">Recargar usuarios</button>' +
    '</div>' +
    '<div class="admin-users-shell">' +
      '<div class="admin-users-invite">' +
        '<div class="stamp-label">Invitar usuario</div>' +
        '<div class="form-row">' +
          '<div class="form-group">' +
            '<label>Correo</label>' +
            '<input type="email" id="adminInviteEmail" value="' + escapeAttr(adminUserInviteDraft.email) + '" oninput="updateAdminInviteDraft(\'email\', this.value)" placeholder="persona@empresa.com">' +
          '</div>' +
          '<div class="form-group">' +
            '<label>Rol</label>' +
            '<select id="adminInviteRole" onchange="updateAdminInviteDraft(\'role\', this.value)">' + getAdminRoleOptionsHtml(adminUserInviteDraft.role) + '</select>' +
          '</div>' +
        '</div>' +
        '<div class="form-row">' +
          '<div class="form-group">' +
            '<label>Agente asignado</label>' +
            '<select id="adminInviteAgent"' + (adminUserInviteDraft.role === 'admin' ? ' disabled' : '') + ' onchange="updateAdminInviteDraft(\'agentId\', this.value)">' +
              getAdminAgentOptionsHtml(adminUserInviteDraft.agentId, true) +
            '</select>' +
          '</div>' +
          '<div class="form-group">' +
            '<label>Snapshot</label>' +
            '<input type="text" value="' + escapeAttr(getActiveSnapshotId()) + '" disabled>' +
          '</div>' +
        '</div>' +
        '<div class="admin-inline-actions">' +
          '<button class="btn btn-primary" onclick="submitAdminInvite()">Enviar invitación</button>' +
        '</div>' +
      '</div>' +
      '<div class="admin-users-list" id="adminUsersList">Cargando usuarios…</div>' +
    '</div>' +
  '</section>';
}

function renderAdminRail(program, branding, backend) {
  const activeBackend = backend.type === 'supabase'
    ? (backendStatus.connected ? 'Supabase' : 'Supabase con fallback local')
    : 'localStorage';
  const timelineLabel = buildProgramTimelineLabel(program, branding);
  const lastErrorLabel = backendStatus.lastError ? escapeHtml(backendStatus.lastError) : 'sin errores registrados';

  return '<aside class="admin-rail dossier-rail">' +
    '<div class="admin-rail-card">' +
      '<div class="stamp-label">Estado del expediente</div>' +
      '<h3>Control del portal</h3>' +
      '<div class="admin-rail-copy">Panel interno para configurar programa, lenguaje operativo, catálogos y persistencia sin tocar el modelo de datos.</div>' +
      '<div class="admin-rail-kpis">' +
        '<div class="admin-rail-kpi">' +
          '<span>Backend activo</span>' +
          '<strong>' + escapeHtml(activeBackend) + '</strong>' +
        '</div>' +
        '<div class="admin-rail-kpi">' +
          '<span>Snapshot</span>' +
          '<strong>' + escapeHtml(backend.supabase.snapshotId || 'sin definir') + '</strong>' +
        '</div>' +
        '<div class="admin-rail-kpi">' +
          '<span>Última sync</span>' +
          '<strong>' + escapeHtml(formatAdminSyncLabel(backendStatus.lastSyncAt)) + '</strong>' +
        '</div>' +
      '</div>' +
      '<div class="admin-rail-note">' + lastErrorLabel + '</div>' +
    '</div>' +
    '<div class="admin-rail-card">' +
      '<div class="stamp-label">Conteo operativo</div>' +
      '<div class="admin-metric-stack">' +
        '<div class="admin-metric-row"><span>Agentes</span><strong>' + state.agents.length + '</strong></div>' +
        '<div class="admin-metric-row"><span>Actividades</span><strong>' + state.activities.length + '</strong></div>' +
        '<div class="admin-metric-row"><span>Cierres</span><strong>' + (state.cierres || []).length + '</strong></div>' +
        '<div class="admin-metric-row"><span>Entregables cubiertos</span><strong>' + countDeliverablesCovered() + '/' + program.totalEntregables + '</strong></div>' +
      '</div>' +
    '</div>' +
    '<div class="admin-rail-card">' +
      '<div class="stamp-label">Acciones rápidas</div>' +
      '<div class="admin-rail-actions">' +
        '<button class="btn btn-primary" onclick="exportData()">Respaldar</button>' +
        '<button class="btn btn-ghost" onclick="document.getElementById(\'importFileInput\').click()">Importar</button>' +
        '<button class="btn btn-ghost" onclick="window.print()">PDF</button>' +
      '</div>' +
      '<div class="admin-rail-meta">' +
        '<div><span>Programa</span><strong>' + escapeHtml(program.title) + '</strong></div>' +
        '<div><span>Ventana activa</span><strong>' + escapeHtml(timelineLabel) + '</strong></div>' +
      '</div>' +
    '</div>' +
  '</aside>';
}

function renderAdmin(forceReset) {
  const container = document.getElementById('adminContent');
  if (!container) return;

  ensureAdminCatalogDrafts(forceReset);

  const program = getProgramSettings();
  const branding = getBrandingSettings();
  const backend = getBackendEditableConfig();

  container.innerHTML =
    '<div class="admin-shell">' +
      renderAdminRail(program, branding, backend) +
      '<div class="admin-main">' +
        '<section class="admin-card admin-card-program">' +
          '<div class="admin-card-head">' +
            '<div>' +
              '<div class="admin-card-eyebrow">Ficha del programa</div>' +
              '<h3>Programa y contexto activo</h3>' +
              '<div class="admin-card-copy">Edita el folio principal del servicio: identidad del portal, fase, fechas, metas comerciales y monto total contratado.</div>' +
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
        '</section>' +
        '<section class="admin-card">' +
          '<div class="admin-card-head">' +
            '<div>' +
              '<div class="admin-card-eyebrow">Lenguaje y marca</div>' +
              '<h3>Textos visibles del portal</h3>' +
              '<div class="admin-card-copy">Ajusta la marca operativa, la moneda y la expresión visible del expediente principal para toda la app.</div>' +
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
            '<div class="admin-preview-label">Preview del folio</div>' +
            '<div class="admin-preview-title">' + escapeHtml(program.phaseTitle) + '</div>' +
            '<div class="admin-preview-h1">' + escapeHtml(program.phaseName) + '</div>' +
            '<div class="admin-preview-sub">' + escapeHtml(buildProgramTimelineLabel(program, branding)) + '</div>' +
          '</div>' +
        '</section>' +
        '<section class="admin-card">' +
          '<div class="admin-card-head">' +
            '<div>' +
              '<div class="admin-card-eyebrow">Catálogos de operación</div>' +
              '<h3>Opciones disponibles en la interfaz</h3>' +
              '<div class="admin-card-copy">Estos catálogos alimentan los estados, etapas y resultados visibles en agentes, actividades, cierres y contrato.</div>' +
            '</div>' +
            '<button class="btn btn-primary" onclick="saveAdminCatalogSettings()">Guardar catálogos</button>' +
          '</div>' +
          '<div class="admin-catalog-grid">' +
            Object.keys(ADMIN_CATALOG_META).map(renderAdminCatalogCard).join('') +
          '</div>' +
        '</section>' +
        renderAdminUsersSection() +
        '<section class="admin-card admin-card-technical">' +
          '<div class="admin-card-head">' +
            '<div>' +
              '<div class="admin-card-eyebrow">Infraestructura y respaldo</div>' +
              '<h3>Persistencia, snapshot y salida documental</h3>' +
              '<div class="admin-card-copy">Zona técnica del portal. Aquí se define la fuente de verdad, el snapshot activo y las acciones de exportación o recuperación.</div>' +
            '</div>' +
            '<button class="btn btn-primary" onclick="saveAdminBackendSettings()">Guardar backend</button>' +
          '</div>' +
          '<div class="admin-infra-grid">' +
            '<div class="admin-infra-panel">' +
              '<div class="stamp-label">Persistencia</div>' +
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
            '<div class="admin-infra-panel admin-infra-panel-quiet">' +
              '<div class="stamp-label">Respaldo</div>' +
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
              '<div class="note-inline amber">Los respaldos incluyen <strong>settings</strong>, así que programa, branding y catálogos viajan dentro del snapshot.</div>' +
            '</div>' +
          '</div>' +
        '</section>' +
      '</div>' +
    '</div>';

  loadAdminUsers();
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
  ensureAdminAccessAction();
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
  ensureAdminAccessAction();
  updateSettingsSection('branding', {
    brandBadge: document.getElementById('adminBrandBadge').value.trim(),
    currency: document.getElementById('adminBrandCurrency').value.trim() || 'MXN',
  });
  refreshUI('all');
  showToast('Branding actualizado');
}

function saveAdminCatalogSettings() {
  ensureAdminAccessAction();
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
  ensureAdminAccessAction();
  saveBackendEditableConfig(readAdminBackendForm());
  updateBackendStatusLabel();
  refreshUI('all');
  showToast('Backend guardado');
  if (confirm('La configuración de backend quedó guardada. ¿Recargar ahora para aplicar la carga inicial con esa fuente?')) {
    window.location.reload();
  }
}

function saveAdminBackendAsLocal() {
  ensureAdminAccessAction();
  const config = readAdminBackendForm();
  config.type = 'localStorage';
  saveBackendEditableConfig(config);
  updateBackendStatusLabel();
  refreshUI('all');
  showToast('Backend cambiado a localStorage');
}

function updateAdminInviteDraft(field, value) {
  adminUserInviteDraft[field] = value;
  if (field === 'role' && value === 'admin') {
    adminUserInviteDraft.agentId = '';
  }
  const inviteAgentSelect = document.getElementById('adminInviteAgent');
  if (inviteAgentSelect && field === 'role') {
    inviteAgentSelect.disabled = value === 'admin';
    if (value === 'admin') inviteAgentSelect.value = '';
  }
}

function setAdminUsersStateFromRows(rows) {
  adminUsersState.rows = Array.isArray(rows) ? rows : [];
  adminUsersState.error = '';
  adminUsersState.loading = false;
  adminUsersState.loadedSnapshotId = getActiveSnapshotId();
  renderAdminUsersList();
}

function renderAdminUsersList() {
  const container = document.getElementById('adminUsersList');
  if (!container) return;

  if (adminUsersState.loading) {
    container.innerHTML = '<div class="admin-note">Cargando usuarios del portal…</div>';
    return;
  }

  if (adminUsersState.error) {
    container.innerHTML = '<div class="note-inline amber">' + escapeHtml(adminUsersState.error) + '</div>';
    return;
  }

  if (!adminUsersState.rows.length) {
    container.innerHTML = '<div class="admin-note">Todavía no hay usuarios invitados para este snapshot.</div>';
    return;
  }

  container.innerHTML =
    '<div class="admin-users-table-wrap">' +
      '<table class="cierres-table admin-users-table">' +
        '<thead><tr><th>Correo</th><th>Rol</th><th>Agente</th><th>Estado</th><th>Último acceso</th><th></th></tr></thead>' +
        '<tbody>' +
          adminUsersState.rows.map(user => {
            const canChangeSelf = user.userId !== getPortalUserId();
            const roleSelectId = 'adminUserRole_' + user.userId;
            const agentSelectId = 'adminUserAgent_' + user.userId;
            const activeToggleId = 'adminUserActive_' + user.userId;
            return '<tr>' +
              '<td><div style="font-weight:600">' + escapeHtml(user.email) + '</div><div class="agent-info-tag">Snapshot: ' + escapeHtml(user.snapshotId || '—') + '</div></td>' +
              '<td><select id="' + roleSelectId + '"' + (canChangeSelf ? '' : ' disabled') + ' onchange="toggleAdminUserAgentField(\'' + user.userId + '\')">' + getAdminRoleOptionsHtml(user.role) + '</select></td>' +
              '<td><select id="' + agentSelectId + '"' + (user.role === 'admin' ? ' disabled' : '') + (canChangeSelf ? '' : ' disabled') + '>' + getAdminAgentOptionsHtml(user.agentId || '', true) + '</select></td>' +
              '<td><label class="admin-check"><input type="checkbox" id="' + activeToggleId + '"' + (user.isActive ? ' checked' : '') + (canChangeSelf ? '' : ' disabled') + '> activo</label></td>' +
              '<td>' + escapeHtml(formatAdminSyncLabel(user.lastSignInAt || user.invitedAt || user.updatedAt)) + '</td>' +
              '<td><div class="row-actions">' +
                (canChangeSelf ? '<button class="btn btn-ghost admin-mini-btn" onclick="saveAdminUserAccess(\'' + user.userId + '\')">Guardar</button>' : '') +
                '<button class="btn btn-ghost admin-mini-btn" onclick="resendAdminInvite(\'' + escapeAttr(user.email) + '\')">Reenviar</button>' +
                (canChangeSelf ? '<button class="btn btn-ghost admin-mini-btn" onclick="disableAdminUserAccess(\'' + user.userId + '\')">Desactivar</button>' : '') +
              '</div></td>' +
            '</tr>';
          }).join('') +
        '</tbody>' +
      '</table>' +
    '</div>';
}

function toggleAdminUserAgentField(userId) {
  const roleSelect = document.getElementById('adminUserRole_' + userId);
  const agentSelect = document.getElementById('adminUserAgent_' + userId);
  if (!roleSelect || !agentSelect) return;
  const isAdminRole = roleSelect.value === 'admin';
  agentSelect.disabled = isAdminRole;
  if (isAdminRole) agentSelect.value = '';
}

async function loadAdminUsers(forceReload) {
  if (!(typeof isPortalAuthEnabled === 'function' && isPortalAuthEnabled()) || !isAdminUser()) {
    return;
  }

  const snapshotId = getActiveSnapshotId();
  if (!forceReload && adminUsersState.loadedSnapshotId === snapshotId && !adminUsersState.error) {
    renderAdminUsersList();
    return;
  }

  adminUsersState.loading = true;
  adminUsersState.error = '';
  renderAdminUsersList();

  try {
    const response = await invokeSupabaseFunction('portal-admin-users', { action: 'list' });
    setAdminUsersStateFromRows(response.users || []);
  } catch (error) {
    adminUsersState.loading = false;
    adminUsersState.error = error.message || 'No se pudieron cargar los usuarios';
    renderAdminUsersList();
  }
}

async function submitAdminInvite() {
  try {
    ensureAdminAccessAction();
    const email = (adminUserInviteDraft.email || '').trim().toLowerCase();
    const role = adminUserInviteDraft.role || 'viewer';
    const agentId = role === 'admin' ? '' : (adminUserInviteDraft.agentId || '').trim();

    if (!email) throw new Error('Falta el correo del usuario');
    if (role !== 'admin' && !agentId) throw new Error('Selecciona un agente para ese rol');

    adminUsersState.loading = true;
    renderAdminUsersList();

    const response = await invokeSupabaseFunction('portal-admin-users', {
      action: 'invite',
      email,
      role,
      agentId,
      redirectTo: window.location.origin + window.location.pathname,
    });

    adminUserInviteDraft = { email: '', role: 'viewer', agentId: '' };
    setAdminUsersStateFromRows(response.users || []);
    renderAdmin();
    showToast('Invitación enviada');
  } catch (error) {
    adminUsersState.loading = false;
    renderAdminUsersList();
    showToast(error.message || 'No se pudo invitar al usuario', 'error');
  }
}

async function saveAdminUserAccess(userId) {
  try {
    ensureAdminAccessAction();
    const role = document.getElementById('adminUserRole_' + userId).value;
    const agentId = document.getElementById('adminUserAgent_' + userId).value;
    const isActive = document.getElementById('adminUserActive_' + userId).checked;

    if (role !== 'admin' && !agentId) throw new Error('Selecciona un agente para ese usuario');

    adminUsersState.loading = true;
    renderAdminUsersList();

    const response = await invokeSupabaseFunction('portal-admin-users', {
      action: 'update_access',
      userId,
      role,
      agentId,
      isActive,
    });

    setAdminUsersStateFromRows(response.users || []);
    showToast('Acceso actualizado');
  } catch (error) {
    adminUsersState.loading = false;
    renderAdminUsersList();
    showToast(error.message || 'No se pudo actualizar el acceso', 'error');
  }
}

async function resendAdminInvite(email) {
  try {
    ensureAdminAccessAction();
    adminUsersState.loading = true;
    renderAdminUsersList();

    const response = await invokeSupabaseFunction('portal-admin-users', {
      action: 'resend_invite',
      email,
      redirectTo: window.location.origin + window.location.pathname,
    });

    setAdminUsersStateFromRows(response.users || []);
    showToast('Invitación reenviada');
  } catch (error) {
    adminUsersState.loading = false;
    renderAdminUsersList();
    showToast(error.message || 'No se pudo reenviar la invitación', 'error');
  }
}

async function disableAdminUserAccess(userId) {
  if (!confirm('¿Desactivar el acceso de este usuario?')) return;

  try {
    ensureAdminAccessAction();
    adminUsersState.loading = true;
    renderAdminUsersList();

    const response = await invokeSupabaseFunction('portal-admin-users', {
      action: 'disable_access',
      userId,
    });

    setAdminUsersStateFromRows(response.users || []);
    showToast('Acceso desactivado');
  } catch (error) {
    adminUsersState.loading = false;
    renderAdminUsersList();
    showToast(error.message || 'No se pudo desactivar el acceso', 'error');
  }
}
