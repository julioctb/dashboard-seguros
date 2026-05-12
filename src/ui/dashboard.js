/* ================================================================
   DASHBOARD RENDER
================================================================ */
function renderDashboard() {
  const week = computeCurrentWeek();
  document.getElementById('currentWeekNum').textContent = week;

  const t = totalsGlobal();
  document.getElementById('kpiCitasDone').textContent = t.consumidas;
  const citasPct = Math.min(100, Math.round((t.consumidas / PROGRAM.citasContratadas) * 100));
  document.getElementById('kpiCitasPct').textContent = citasPct + '% del contrato';
  const citasTag = document.getElementById('kpiCitasTag');
  const expectedPct = (week / PROGRAM.totalWeeks) * 100;
  if (citasPct >= expectedPct - 10) { citasTag.className = 'kpi-tag green'; citasTag.textContent = 'En ruta'; }
  else if (citasPct >= expectedPct - 25) { citasTag.className = 'kpi-tag amber'; citasTag.textContent = 'Atención'; }
  else { citasTag.className = 'kpi-tag red'; citasTag.textContent = 'Atraso'; }

  document.getElementById('kpiSolicitud').textContent = t.solicitudes;
  document.getElementById('kpiPoliza').textContent = t.polizas;

  const cov = countDeliverablesCovered();
  document.getElementById('kpiDelDone').textContent = cov;
  const delPct = Math.min(100, Math.round((cov / PROGRAM.totalEntregables) * 100));
  document.getElementById('kpiDelPct').textContent = delPct + '% avance';

  /* v5.2 · Avance real ponderado del programa */
  const induccionesDone = (state.inducciones || []).filter(i => i.status === 'done').length;
  const induccionesPct = Math.round((induccionesDone / 2) * 100);
  const avanceReal = Math.round((delPct * 0.4) + (citasPct * 0.4) + (induccionesPct * 0.2));

  /* Hero: barra refleja avance real, no tiempo transcurrido */
  document.getElementById('heroProgressFill').style.width = avanceReal + '%';
  document.getElementById('heroTodayLabel').innerHTML = 'Hoy · <strong>Sem ' + week + '</strong> · avance real <strong>' + avanceReal + '%</strong>';

  /* Desglose visible */
  const hbMat = document.getElementById('hbMateriales'); if (hbMat) hbMat.textContent = delPct + '%';
  const hbCit = document.getElementById('hbCitas'); if (hbCit) hbCit.textContent = citasPct + '%';
  const hbInd = document.getElementById('hbInducciones'); if (hbInd) hbInd.textContent = induccionesPct + '%';
  const hbTot = document.getElementById('hbTotal'); if (hbTot) hbTot.textContent = avanceReal + '%';

  document.getElementById('matrixMeta').textContent = state.agents.length + ' agentes · Semana ' + week + ' en curso';
  document.getElementById('tabAgentsCount').textContent = state.agents.length;
  document.getElementById('tabDelCount').textContent = cov + '/' + PROGRAM.totalEntregables;

  renderMatrix();
  renderNextSteps();
}

function renderNextSteps() {
  const el = document.getElementById('nextStepsList');
  if (!el) return;
  const items = state.nextSteps || [];
  if (items.length === 0) {
    el.innerHTML = '<p style="color:var(--text-muted); font-size:12px; font-style:italic; padding:16px">No hay próximos pasos definidos. Usa "✎ Editar lista" para agregarlos.</p>';
    return;
  }
  el.innerHTML = items.map(it =>
    '<div class="finding">' +
      '<div class="finding-icon ' + (it.icon || 'teal') + '">▸</div>' +
      '<div class="finding-content">' +
        '<div class="finding-title">' + escapeHtml(it.title) + '</div>' +
        '<div class="finding-text">' + escapeHtml(it.text) + '</div>' +
      '</div>' +
    '</div>'
  ).join('');
}

function renderMatrix() {
  const tbody = document.getElementById('matrixBody');
  const semMap = { excelente:'green', bien:'blue', atencion:'amber', critico:'red', inicio:'gray' };
  tbody.innerHTML = state.agents.map(a => {
    const s = agentStats(a.id);
    const sem = agentSemaforo(s);
    const nc = n => n === 0 ? 'num zero' : 'num';
    return '<tr onclick="goToAgent(\'' + a.id + '\')" style="cursor:pointer">' +
      '<td><div class="agent-cell"><div class="agent-avatar">' + a.initials + '</div>' +
      '<div><div class="agent-info-name">' + escapeHtml(a.name) + '</div>' +
      '<div class="agent-info-tag">' + escapeHtml(a.tag) + '</div></div></div></td>' +
      '<td class="' + nc(s.iniciales) + '">' + s.iniciales + '</td>' +
      '<td class="' + nc(s.cierres) + '">' + s.cierres + '</td>' +
      '<td class="' + nc(s.solicitudes) + '">' + s.solicitudes + '</td>' +
      '<td class="' + nc(s.polizas) + '">' + s.polizas + '</td>' +
      '<td class="' + nc(s.reagend) + '">' + s.reagend + '</td>' +
      '<td class="' + nc(s.cancel) + '">' + s.cancel + '</td>' +
      '<td><span class="status-pill ' + semMap[sem.level] + '">' + sem.text + '</span></td>' +
      '</tr>';
  }).join('');
}

/* ================================================================
   DELIVERABLES
================================================================ */
function countDeliverablesCovered() {
  let count = 0;
  DELIVERABLES_TEMPLATE.forEach(group => {
    group.items.forEach(item => {
      const key = group.group + '::' + item.name;
      const st = state.deliverables[key]?.status;
      if (st === 'entregado' || st === 'sustituido') count++;
    });
  });
  return count;
}

function renderDeliverables() {
  // Extras
  document.getElementById('extrasList').innerHTML = (state.extras || []).map(e =>
    '<div class="extra-item"><div class="extra-item-title">' + escapeHtml(e.title) + '</div><div class="extra-item-desc">' + escapeHtml(e.desc) + '</div></div>'
  ).join('');

  // Fase 2 items (pull deliverables con status fase2)
  const fase2Items = [];
  DELIVERABLES_TEMPLATE.forEach(group => {
    group.items.forEach(item => {
      const key = group.group + '::' + item.name;
      const data = state.deliverables[key] || {};
      if (data.status === 'fase2') {
        fase2Items.push({ name: item.name, group: group.group, note: data.note || item.defaultNote });
      }
    });
  });
  document.getElementById('fase2List').innerHTML = fase2Items.length === 0
    ? '<p style="color:var(--text-muted); font-size:12px; font-style:italic">No hay entregables reprogramados aún.</p>'
    : fase2Items.map((f, i) =>
        '<div class="fase2-item"><div class="fase2-item-icon">' + (i+1) + '</div>' +
        '<div class="fase2-item-text"><strong>' + escapeHtml(f.name) + '</strong> · ' + escapeHtml(f.group) + '<br>' +
        '<span class="fase2-item-note">' + escapeHtml(f.note || '') + '</span></div></div>'
      ).join('');

  // Grupos contrato
  const container = document.getElementById('delGroups');
  let totalItems = 0, coveredItems = 0;
  container.innerHTML = DELIVERABLES_TEMPLATE.map((group, gi) => {
    const visibleItems = group.items.filter(item => {
      const key = group.group + '::' + item.name;
      return state.deliverables[key]?.status !== 'fase2';
    });
    const groupCovered = visibleItems.filter(item => {
      const st = state.deliverables[group.group + '::' + item.name]?.status;
      return st === 'entregado' || st === 'sustituido';
    }).length;
    totalItems += group.items.length;
    coveredItems += group.items.filter(item => {
      const st = state.deliverables[group.group + '::' + item.name]?.status;
      return st === 'entregado' || st === 'sustituido';
    }).length;
    const groupNum = String(gi + 1).padStart(2, '0');
    if (visibleItems.length === 0) return '';

    return '<div class="del-group" data-group="' + gi + '">' +
      '<div class="del-group-head" onclick="toggleGroup(' + gi + ')">' +
        '<div class="del-group-num">' + groupNum + '</div>' +
        '<div class="del-group-title">' + escapeHtml(group.group) + '</div>' +
        '<div class="del-group-count">' + groupCovered + '/' + visibleItems.length + '</div>' +
        '<div class="del-group-chevron">▼</div>' +
      '</div>' +
      '<div class="del-group-body">' +
      visibleItems.map(item => {
        const key = group.group + '::' + item.name;
        const data = state.deliverables[key] || { status: 'pendiente', note: '', date: '', link: '' };
        return '<div class="del-item">' +
          '<div class="del-item-head">' +
          '<button class="del-status-badge ' + data.status + '" onclick="openStatusMenu(event, \'' + escapeAttr(key) + '\')">' + labelStatus(data.status) + '</button>' +
          '<div class="del-name">' + escapeHtml(item.name) + '</div>' +
          '</div>' +
          '<div class="del-field-group">' +
          '<input type="date" class="del-date-field" value="' + (data.date || '') + '" onchange="setDelField(\'' + escapeAttr(key) + '\',\'date\',this.value)" title="Fecha de entrega">' +
          '<input type="text" class="del-link-field" placeholder="Link, ruta o referencia" value="' + escapeHtml(data.link || '') + '" onchange="setDelField(\'' + escapeAttr(key) + '\',\'link\',this.value)">' +
          '</div>' +
          '<textarea class="del-note-field" placeholder="Nota, justificación..." onchange="setDelField(\'' + escapeAttr(key) + '\',\'note\',this.value)">' + escapeHtml(data.note || '') + '</textarea>' +
          '</div>';
      }).join('') +
      '</div></div>';
  }).join('');

  document.getElementById('delStatDone').textContent = coveredItems;
  document.getElementById('delStatPending').textContent = totalItems - coveredItems;
  const pct = Math.round((coveredItems / totalItems) * 100);
  document.getElementById('delStatPct').textContent = pct + '%';
  document.getElementById('delSumBar').style.width = pct + '%';
}

function labelStatus(s) {
  return { entregado:'Entregado', sustituido:'Sustituido', progreso:'En progreso', diferido:'Diferido', pendiente:'Pendiente', fase2:'Fase 2' }[s] || s;
}

function toggleGroup(gi) {
  const el = document.querySelector('[data-group="' + gi + '"]');
  if (el) el.classList.toggle('collapsed');
}

function setDelField(key, field, value) {
  if (!state.deliverables[key]) state.deliverables[key] = {};
  state.deliverables[key][field] = value;
  saveState();
  if (field === 'status') { renderDeliverables(); renderDashboard(); }
}

/* Status menu */
let activeStatusKey = null;
function openStatusMenu(event, key) {
  event.stopPropagation();
  activeStatusKey = key;
  const menu = document.getElementById('statusMenu');
  const rect = event.target.getBoundingClientRect();
  menu.style.top = (rect.bottom + window.scrollY + 4) + 'px';
  menu.style.left = (rect.left + window.scrollX) + 'px';
  menu.classList.add('open');
}

function renderExtConversions() {
  const el = document.getElementById('extConvGrid');
  if (!el) return;
  const c = calculateNewConversions();
  if (c.totalProspects === 0) {
    el.innerHTML = '<p style="color:var(--text-muted); font-size:12px; font-style:italic; padding:16px; grid-column: 1/-1">Sin prospectos registrados aún.</p>';
    return;
  }
  el.innerHTML =
    '<div class="ext-conv-item">' +
      '<div class="ext-conv-label">Inicial → Cierre</div>' +
      '<div class="ext-conv-val">' + c.inicialACierre + '%</div>' +
      '<div class="ext-conv-sub">' + c.cierre + ' de ' + c.inicial + ' prospectos avanzaron</div>' +
    '</div>' +
    '<div class="ext-conv-item cierre">' +
      '<div class="ext-conv-label">Cierre → Solicitud</div>' +
      '<div class="ext-conv-val">' + c.cierreASolicitud + '%</div>' +
      '<div class="ext-conv-sub">' + c.solicitud + ' de ' + c.cierre + ' firmaron solicitud</div>' +
    '</div>' +
    '<div class="ext-conv-item solicitud">' +
      '<div class="ext-conv-label">Solicitud → Póliza</div>' +
      '<div class="ext-conv-val">' + c.solicitudAPoliza + '%</div>' +
      '<div class="ext-conv-sub">' + c.poliza + ' de ' + c.solicitud + ' emitieron póliza</div>' +
    '</div>' +
    '<div class="ext-conv-item poliza">' +
      '<div class="ext-conv-label">Embudo total · Inicial → Póliza</div>' +
      '<div class="ext-conv-val">' + c.inicialAPoliza + '%</div>' +
      '<div class="ext-conv-sub">' + c.poliza + ' de ' + c.inicial + ' llegaron al final</div>' +
    '</div>';
}

function renderAgentProgressTable() {
  const container = document.getElementById('agentProgressTable');
  if (!container) return;
  const rows = state.agents.map(a => {
    const prog = calculateAgentWeightedProgress(a.id);
    return { agent: a, prog };
  }).sort((x, y) => y.prog.avgPct - x.prog.avgPct);

  if (rows.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted); font-size:12px; font-style:italic; padding:16px">Sin agentes registrados.</p>';
    return;
  }

  let html = '<table class="prospect-progress-table"><thead><tr>' +
    '<th>Agente</th>' +
    '<th>Prospectos</th>' +
    '<th>Etapas alcanzadas</th>' +
    '<th>Progreso promedio</th>' +
    '</tr></thead><tbody>';

  rows.forEach(r => {
    const sc = r.prog.stageCount;
    const isHigh = r.prog.avgPct >= 75;
    html += '<tr>' +
      '<td><div class="prospect-name-cell">' + escapeHtml(r.agent.name) + '</div>' +
        '<div class="prospect-agent-sub">' + escapeHtml(r.agent.tag || '') + '</div></td>' +
      '<td><span class="prospect-last-activity">' + r.prog.totalProspects + '</span></td>' +
      '<td><div class="prospect-stages-mini">' +
        '<div class="prospect-stage-dot' + (sc.inicial > 0 ? ' done' : '') + '" title="Iniciales: ' + sc.inicial + '">I</div>' +
        '<div class="prospect-stage-dot' + (sc.cierre > 0 ? ' done' : '') + '" title="Cierres: ' + sc.cierre + '">C</div>' +
        '<div class="prospect-stage-dot' + (sc.solicitud > 0 ? ' done' : '') + '" title="Solicitudes: ' + sc.solicitud + '">S</div>' +
        '<div class="prospect-stage-dot' + (sc.poliza > 0 ? ' done final' : '') + '" title="Pólizas: ' + sc.poliza + '">P</div>' +
      '</div></td>' +
      '<td><div class="prospect-progress-bar">' +
        '<div class="prospect-progress-bar-track">' +
          '<div class="prospect-progress-bar-fill' + (isHigh ? ' complete' : '') + '" style="width:' + r.prog.avgPct + '%"></div>' +
        '</div>' +
        '<span class="prospect-progress-pct">' + r.prog.avgPct + '%</span>' +
      '</div></td>' +
      '</tr>';
  });
  html += '</tbody></table>';
  container.innerHTML = html;
}
