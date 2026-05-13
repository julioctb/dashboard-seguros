/* ================================================================
   CIERRES PENDIENTES UI
================================================================ */
function renderCierresTable_v53() {
  const container = document.getElementById('cierresTableContainer');
  if (!container) return;
  const items = state.cierres || [];
  const pendientes = items.filter(c => getCatalogSemanticKeyForValue('cierreStatuses', c.estado) !== 'listo').length;
  const listos = items.filter(c => getCatalogSemanticKeyForValue('cierreStatuses', c.estado) === 'listo').length;
  const elP = document.getElementById('cierresPendienteCount');
  const elL = document.getElementById('cierresListoCount');
  if (elP) elP.textContent = pendientes;
  if (elL) elL.textContent = listos;
  if (items.length === 0) {
    container.innerHTML = '<div class="cierres-empty">Sin cierres pendientes. Usa "+ Agregar cierre pendiente" cuando tengas una cotización que armar.</div>';
    return;
  }
  const sorted = [...items].sort((a, b) => {
    const prioOrder = { alta: 0, media: 1, baja: 2, default: 99 };
    const estOrder = { pendiente: 0, en_progreso: 1, listo: 2, default: 99 };
    const statusA = getCatalogSemanticKeyForValue('cierreStatuses', a.estado);
    const statusB = getCatalogSemanticKeyForValue('cierreStatuses', b.estado);
    if ((estOrder[statusA] ?? 99) !== (estOrder[statusB] ?? 99)) return (estOrder[statusA] ?? 99) - (estOrder[statusB] ?? 99);
    const prioA = getCatalogSemanticKeyForValue('cierrePriorities', a.prioridad);
    const prioB = getCatalogSemanticKeyForValue('cierrePriorities', b.prioridad);
    return (prioOrder[prioA] ?? 99) - (prioOrder[prioB] ?? 99);
  });
  let html = '<table class="cierres-table"><thead><tr>' +
    '<th>Agente</th><th>Prospecto</th><th>Producto</th><th>Monto</th><th>Estado</th><th>Prioridad</th><th>Fecha límite</th><th></th>' +
    '</tr></thead><tbody>';
  sorted.forEach(c => {
    const agentObj = state.agents.find(a => a.id === c.agente);
    const agentName = agentObj ? agentObj.name : (c.agente || '—');
    html += '<tr>' +
      '<td>' + escapeHtml(agentName) + '</td>' +
      '<td style="font-weight:600">' + escapeHtml(c.prospecto || '—') + '</td>' +
      '<td>' + escapeHtml(c.producto || '—') + '</td>' +
      '<td style="font-family:\'DM Mono\',monospace">' + (c.monto ? '$' + escapeHtml(c.monto) : '—') + '</td>' +
      '<td><span class="cierres-estado ' + getCatalogSemanticKeyForValue('cierreStatuses', c.estado) + '">' + escapeHtml(getCatalogLabel('cierreStatuses', c.estado)) + '</span></td>' +
      '<td><span class="cierres-priority ' + getCatalogSemanticKeyForValue('cierrePriorities', c.prioridad) + '">' + escapeHtml(getCatalogLabel('cierrePriorities', c.prioridad)) + '</span></td>' +
      '<td style="font-family:\'DM Mono\',monospace; font-size:11px">' + (c.fechaLimite ? formatDate(c.fechaLimite) : '—') + '</td>' +
      '<td><div class="row-actions">' +
        '<button class="icon-btn" onclick="openCierreModal(null, \'' + c.id + '\')">✎</button>' +
        '<button class="icon-btn danger" onclick="confirmDeleteCierre(\'' + c.id + '\')">×</button>' +
      '</div></td>' +
    '</tr>';
    if (c.nota) {
      html += '<tr><td colspan="8" style="padding:4px 10px 10px; font-size:12px; color:var(--text-muted)">' + escapeHtml(c.nota) + '</td></tr>';
    }
  });
  html += '</tbody></table>';
  container.innerHTML = html;
}


function renderCierresAgent_v53(agentId) {
  const container = document.getElementById('cierresAgentContent_' + agentId);
  if (!container) return;
  const items = (state.cierres || []).filter(c => c.agente === agentId);
  /* Actualizar pill del subtab */
  const pill = document.getElementById('cierresPillAgent_' + agentId);
  if (pill) pill.textContent = items.filter(c => getCatalogSemanticKeyForValue('cierreStatuses', c.estado) !== 'listo').length;
  if (items.length === 0) {
    container.innerHTML = '<div class="prospect-card-empty" style="background:white; border:1px solid var(--gray-200); border-radius:var(--radius)">Sin cierres pendientes para este agente.</div>';
    return;
  }
  const sorted = [...items].sort((a, b) => {
    const prioOrder = { alta: 0, media: 1, baja: 2, default: 99 };
    const estOrder = { pendiente: 0, en_progreso: 1, listo: 2, default: 99 };
    const statusA = getCatalogSemanticKeyForValue('cierreStatuses', a.estado);
    const statusB = getCatalogSemanticKeyForValue('cierreStatuses', b.estado);
    if ((estOrder[statusA] ?? 99) !== (estOrder[statusB] ?? 99)) return (estOrder[statusA] ?? 99) - (estOrder[statusB] ?? 99);
    const prioA = getCatalogSemanticKeyForValue('cierrePriorities', a.prioridad);
    const prioB = getCatalogSemanticKeyForValue('cierrePriorities', b.prioridad);
    return (prioOrder[prioA] ?? 99) - (prioOrder[prioB] ?? 99);
  });
  container.innerHTML = sorted.map(c =>
    '<div class="cierres-agent-item ' + getCatalogSemanticKeyForValue('cierreStatuses', c.estado) + '">' +
      '<div class="cierres-agent-main">' +
        '<div class="cierres-agent-prospect">' + escapeHtml(c.prospecto || '(sin nombre)') + '</div>' +
        '<div class="cierres-agent-meta">' +
          escapeHtml(c.producto || '—') +
          (c.monto ? ' · $' + escapeHtml(c.monto) : '') +
          ' · ' + escapeHtml(getCatalogLabel('cierreStatuses', c.estado)) +
          ' · ' + escapeHtml(getCatalogLabel('cierrePriorities', c.prioridad)) +
          (c.fechaLimite ? ' · Límite: ' + formatDate(c.fechaLimite) : '') +
        '</div>' +
        (c.nota ? '<div class="cierres-agent-note">' + escapeHtml(c.nota) + '</div>' : '') +
      '</div>' +
      '<div class="cierres-agent-actions">' +
        '<button class="icon-btn" onclick="openCierreModal(\'' + agentId + '\', \'' + c.id + '\')">✎</button>' +
        '<button class="icon-btn danger" onclick="confirmDeleteCierre(\'' + c.id + '\')">×</button>' +
      '</div>' +
    '</div>'
  ).join('');
}
