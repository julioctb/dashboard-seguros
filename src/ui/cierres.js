/* ================================================================
   CIERRES PENDIENTES UI
================================================================ */
function renderCierresTable_v53() {
  const container = document.getElementById('cierresTableContainer');
  if (!container) return;
  const items = getCierres();
  const pendientes = items.filter(c => c.estado !== 'listo').length;
  const listos = items.filter(c => c.estado === 'listo').length;
  const elP = document.getElementById('cierresPendienteCount');
  const elL = document.getElementById('cierresListoCount');
  if (elP) elP.textContent = pendientes;
  if (elL) elL.textContent = listos;
  if (items.length === 0) {
    container.innerHTML = '<div class="cierres-empty">Sin cierres pendientes. Usa "+ Agregar cierre pendiente" cuando tengas una cotización que armar.</div>';
    return;
  }
  const sorted = [...items].sort((a, b) => {
    const prioOrder = { alta: 0, media: 1, baja: 2 };
    const estOrder = { pendiente: 0, en_progreso: 1, listo: 2 };
    if (estOrder[a.estado] !== estOrder[b.estado]) return estOrder[a.estado] - estOrder[b.estado];
    return (prioOrder[a.prioridad] || 1) - (prioOrder[b.prioridad] || 1);
  });
  const prioLabel = { alta: 'Alta', media: 'Media', baja: 'Baja' };
  const estLabel = { pendiente: 'Pendiente', en_progreso: 'En progreso', listo: 'Listo' };
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
      '<td><span class="cierres-estado ' + (c.estado || 'pendiente') + '">' + escapeHtml(estLabel[c.estado] || c.estado) + '</span></td>' +
      '<td><span class="cierres-priority ' + (c.prioridad || 'media') + '">' + escapeHtml(prioLabel[c.prioridad] || c.prioridad) + '</span></td>' +
      '<td style="font-family:\'DM Mono\',monospace; font-size:11px">' + (c.fechaLimite ? formatDate(c.fechaLimite) : '—') + '</td>' +
      '<td><div class="row-actions">' +
        '<button class="icon-btn" onclick="openCierreModal(null, \'' + c.id + '\')">✎</button>' +
        '<button class="icon-btn danger" onclick="deleteCierre(\'' + c.id + '\')">×</button>' +
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
  const items = getCierres().filter(c => c.agente === agentId);
  /* Actualizar pill del subtab */
  const pill = document.getElementById('cierresPillAgent_' + agentId);
  if (pill) pill.textContent = items.filter(c => c.estado !== 'listo').length;
  if (items.length === 0) {
    container.innerHTML = '<div class="prospect-card-empty" style="background:white; border:1px solid var(--gray-200); border-radius:var(--radius)">Sin cierres pendientes para este agente.</div>';
    return;
  }
  const sorted = [...items].sort((a, b) => {
    const prioOrder = { alta: 0, media: 1, baja: 2 };
    const estOrder = { pendiente: 0, en_progreso: 1, listo: 2 };
    if (estOrder[a.estado] !== estOrder[b.estado]) return estOrder[a.estado] - estOrder[b.estado];
    return (prioOrder[a.prioridad] || 1) - (prioOrder[b.prioridad] || 1);
  });
  const estLabel = { pendiente: 'Pendiente', en_progreso: 'En progreso', listo: 'Listo' };
  const prioLabel = { alta: '🔴 Alta', media: '🟡 Media', baja: '⚪ Baja' };
  container.innerHTML = sorted.map(c =>
    '<div class="cierres-agent-item ' + (c.estado || 'pendiente') + '">' +
      '<div class="cierres-agent-main">' +
        '<div class="cierres-agent-prospect">' + escapeHtml(c.prospecto || '(sin nombre)') + '</div>' +
        '<div class="cierres-agent-meta">' +
          escapeHtml(c.producto || '—') +
          (c.monto ? ' · $' + escapeHtml(c.monto) : '') +
          ' · ' + escapeHtml(estLabel[c.estado] || c.estado) +
          ' · ' + escapeHtml(prioLabel[c.prioridad] || c.prioridad) +
          (c.fechaLimite ? ' · Límite: ' + formatDate(c.fechaLimite) : '') +
        '</div>' +
        (c.nota ? '<div class="cierres-agent-note">' + escapeHtml(c.nota) + '</div>' : '') +
      '</div>' +
      '<div class="cierres-agent-actions">' +
        '<button class="icon-btn" onclick="openCierreModal(\'' + agentId + '\', \'' + c.id + '\')">✎</button>' +
        '<button class="icon-btn danger" onclick="deleteCierre(\'' + c.id + '\')">×</button>' +
      '</div>' +
    '</div>'
  ).join('');
}
