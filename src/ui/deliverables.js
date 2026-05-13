/* ================================================================
   DELIVERABLES
================================================================ */
function countDeliverablesCovered() {
  const statusEntregado = getCatalogSemanticValue('deliverableStatuses', 'entregado');
  const statusSustituido = getCatalogSemanticValue('deliverableStatuses', 'sustituido');
  let count = 0;
  DELIVERABLES_TEMPLATE.forEach(group => {
    group.items.forEach(item => {
      const key = group.group + '::' + item.name;
      const status = state.deliverables[key]?.status;
      if (status === statusEntregado || status === statusSustituido) count++;
    });
  });
  return count;
}

function getDeliverableStatusTone(status) {
  return getCatalogSemanticKeyForValue('deliverableStatuses', status);
}

function renderDeliverableStatusMenu() {
  const menu = document.getElementById('statusMenu');
  if (!menu) return;
  const items = getCatalog('deliverableStatuses');
  const semanticKeys = CATALOG_SEMANTIC_KEYS.deliverableStatuses || [];
  menu.innerHTML = items.map((item, index) =>
    '<div class="status-menu-item ' + (semanticKeys[index] || 'default') + '" data-status="' + escapeAttr(item.value) + '">' +
      escapeHtml(item.label || item.value) +
    '</div>'
  ).join('');
}

function renderDeliverables() {
  const statusFase2 = getCatalogSemanticValue('deliverableStatuses', 'fase2');
  const statusEntregado = getCatalogSemanticValue('deliverableStatuses', 'entregado');
  const statusSustituido = getCatalogSemanticValue('deliverableStatuses', 'sustituido');
  const program = getProgramSettings();
  const totalLabel = document.getElementById('deliverablesContractTotalText');
  if (totalLabel) totalLabel.textContent = program.totalEntregables + ' entregables contratados';
  renderDeliverableStatusMenu();

  const extrasList = document.getElementById('extrasList');
  if (extrasList) {
    extrasList.innerHTML = (state.extras || []).map(extra =>
      '<div class="extra-item"><div class="extra-item-title">' + escapeHtml(extra.title) + '</div><div class="extra-item-desc">' + escapeHtml(extra.desc) + '</div></div>'
    ).join('');
  }

  const fase2Items = [];
  DELIVERABLES_TEMPLATE.forEach(group => {
    group.items.forEach(item => {
      const key = group.group + '::' + item.name;
      const data = state.deliverables[key] || {};
      if (data.status === statusFase2) {
        fase2Items.push({ name: item.name, group: group.group, note: data.note || item.defaultNote });
      }
    });
  });

  const fase2List = document.getElementById('fase2List');
  if (fase2List) {
    fase2List.innerHTML = fase2Items.length === 0
      ? '<p style="color:var(--text-muted); font-size:12px; font-style:italic">No hay entregables reprogramados aún.</p>'
      : fase2Items.map((item, index) =>
          '<div class="fase2-item"><div class="fase2-item-icon">' + (index + 1) + '</div>' +
          '<div class="fase2-item-text"><strong>' + escapeHtml(item.name) + '</strong> · ' + escapeHtml(item.group) + '<br>' +
          '<span class="fase2-item-note">' + escapeHtml(item.note || '') + '</span></div></div>'
        ).join('');
  }

  const container = document.getElementById('delGroups');
  if (!container) return;

  let totalItems = 0;
  let coveredItems = 0;
  container.innerHTML = DELIVERABLES_TEMPLATE.map((group, groupIndex) => {
    const visibleItems = group.items.filter(item => {
      const key = group.group + '::' + item.name;
      return state.deliverables[key]?.status !== statusFase2;
    });
    const groupCovered = visibleItems.filter(item => {
      const status = state.deliverables[group.group + '::' + item.name]?.status;
      return status === statusEntregado || status === statusSustituido;
    }).length;
    totalItems += group.items.length;
    coveredItems += group.items.filter(item => {
      const status = state.deliverables[group.group + '::' + item.name]?.status;
      return status === statusEntregado || status === statusSustituido;
    }).length;
    const groupNum = String(groupIndex + 1).padStart(2, '0');
    if (visibleItems.length === 0) return '';

    return '<div class="del-group" data-group="' + groupIndex + '">' +
      '<div class="del-group-head" onclick="toggleGroup(' + groupIndex + ')">' +
        '<div class="del-group-num">' + groupNum + '</div>' +
        '<div class="del-group-title">' + escapeHtml(group.group) + '</div>' +
        '<div class="del-group-count">' + groupCovered + '/' + visibleItems.length + '</div>' +
        '<div class="del-group-chevron">▼</div>' +
      '</div>' +
      '<div class="del-group-body">' +
        visibleItems.map(item => {
          const key = group.group + '::' + item.name;
          const data = state.deliverables[key] || { status: getCatalogSemanticValue('deliverableStatuses', 'pendiente'), note: '', date: '', link: '' };
          return '<div class="del-item">' +
            '<div class="del-item-head">' +
              '<button class="del-status-badge ' + getDeliverableStatusTone(data.status) + '" onclick="openStatusMenu(event, \'' + escapeAttr(key) + '\')">' + labelStatus(data.status) + '</button>' +
              '<div class="del-name">' + escapeHtml(item.name) + '</div>' +
            '</div>' +
            '<div class="del-field-group">' +
              '<input type="date" class="del-date-field" value="' + (data.date || '') + '" onchange="setDelField(\'' + escapeAttr(key) + '\', \'date\', this.value)" title="Fecha de entrega">' +
              '<input type="text" class="del-link-field" placeholder="Link, ruta o referencia" value="' + escapeHtml(data.link || '') + '" onchange="setDelField(\'' + escapeAttr(key) + '\', \'link\', this.value)">' +
            '</div>' +
            '<textarea class="del-note-field" placeholder="Nota, justificación..." onchange="setDelField(\'' + escapeAttr(key) + '\', \'note\', this.value)">' + escapeHtml(data.note || '') + '</textarea>' +
          '</div>';
        }).join('') +
      '</div>' +
    '</div>';
  }).join('');

  const doneEl = document.getElementById('delStatDone');
  const pendingEl = document.getElementById('delStatPending');
  const pctEl = document.getElementById('delStatPct');
  const barEl = document.getElementById('delSumBar');
  const summaryTarget = Math.max(totalItems, Number(program.totalEntregables) || totalItems || 0);
  const pct = summaryTarget > 0 ? Math.round((coveredItems / summaryTarget) * 100) : 0;

  if (doneEl) doneEl.textContent = coveredItems;
  if (pendingEl) pendingEl.textContent = Math.max(summaryTarget - coveredItems, 0);
  if (pctEl) pctEl.textContent = pct + '%';
  if (barEl) barEl.style.width = pct + '%';
}

function labelStatus(status) {
  return getCatalogLabel('deliverableStatuses', status);
}

function toggleGroup(groupIndex) {
  const element = document.querySelector('[data-group="' + groupIndex + '"]');
  if (element) element.classList.toggle('collapsed');
}

function setDelField(key, field, value) {
  updateDeliverableField(key, field, value);
  refreshUI(field === 'status' ? 'all' : 'deliverables');
}

let activeStatusKey = null;

function openStatusMenu(event, key) {
  event.stopPropagation();
  activeStatusKey = key;
  const menu = document.getElementById('statusMenu');
  if (!menu) return;
  const rect = event.target.getBoundingClientRect();
  menu.style.top = (rect.bottom + window.scrollY + 4) + 'px';
  menu.style.left = (rect.left + window.scrollX) + 'px';
  menu.classList.add('open');
}
