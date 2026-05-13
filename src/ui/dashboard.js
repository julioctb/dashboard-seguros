/* ================================================================
   DASHBOARD RENDER
================================================================ */
function computeCurrentWeek() {
  const program = getProgramSettings();
  const start = new Date(program.startDate + 'T00:00:00');
  const today = new Date();
  const diffDays = Math.floor((today - start) / (1000 * 60 * 60 * 24));
  const week = Math.floor(diffDays / 7) + 1;
  return Math.max(1, Math.min(week, program.totalWeeks));
}

function renderDashboard() {
  const program = getProgramSettings();
  const week = computeCurrentWeek();
  const weekEl = document.getElementById('currentWeekNum');
  if (weekEl) weekEl.textContent = week;

  const totals = totalsGlobal();
  const citasMeta = Math.max(1, Number(program.citasContratadas) || 0);
  const deliverablesMeta = Math.max(1, Number(program.totalEntregables) || 0);
  const citasPct = Math.min(100, Math.round((totals.consumidas / citasMeta) * 100));
  const coveredDeliverables = countDeliverablesCovered();
  const delPct = Math.min(100, Math.round((coveredDeliverables / deliverablesMeta) * 100));
  const induccionesDone = (state.inducciones || []).filter(induccion => induccion.status === 'done').length;
  const induccionesTotal = Math.max(1, (state.inducciones || []).length || 0);
  const induccionesPct = Math.round((induccionesDone / induccionesTotal) * 100);
  const avanceReal = Math.round((delPct * 0.4) + (citasPct * 0.4) + (induccionesPct * 0.2));
  const expectedPct = (week / Math.max(1, Number(program.totalWeeks) || 1)) * 100;

  const citasDoneEl = document.getElementById('kpiCitasDone');
  const citasPctEl = document.getElementById('kpiCitasPct');
  const citasTagEl = document.getElementById('kpiCitasTag');
  const solicitudEl = document.getElementById('kpiSolicitud');
  const polizaEl = document.getElementById('kpiPoliza');
  const delDoneEl = document.getElementById('kpiDelDone');
  const delPctEl = document.getElementById('kpiDelPct');
  const heroFillEl = document.getElementById('heroProgressFill');
  const heroTodayEl = document.getElementById('heroTodayLabel');
  const matrixMetaEl = document.getElementById('matrixMeta');
  const tabAgentsCountEl = document.getElementById('tabAgentsCount');
  const tabDelCountEl = document.getElementById('tabDelCount');

  if (citasDoneEl) citasDoneEl.textContent = totals.consumidas;
  if (citasPctEl) citasPctEl.textContent = citasPct + '% del contrato';
  if (citasTagEl) {
    if (citasPct >= expectedPct - 10) {
      citasTagEl.className = 'kpi-tag green';
      citasTagEl.textContent = 'En ruta';
    } else if (citasPct >= expectedPct - 25) {
      citasTagEl.className = 'kpi-tag amber';
      citasTagEl.textContent = 'Atención';
    } else {
      citasTagEl.className = 'kpi-tag red';
      citasTagEl.textContent = 'Atraso';
    }
  }

  if (solicitudEl) solicitudEl.textContent = totals.solicitudes;
  if (polizaEl) polizaEl.textContent = totals.polizas;
  if (delDoneEl) delDoneEl.textContent = coveredDeliverables;
  if (delPctEl) delPctEl.textContent = delPct + '% avance';
  if (heroFillEl) heroFillEl.style.width = avanceReal + '%';
  if (heroTodayEl) heroTodayEl.innerHTML = 'Hoy · <strong>Sem ' + week + '</strong> · avance real <strong>' + avanceReal + '%</strong>';
  if (matrixMetaEl) matrixMetaEl.textContent = state.agents.length + ' agentes · Semana ' + week + ' en curso';
  if (tabAgentsCountEl) tabAgentsCountEl.textContent = state.agents.length;
  if (tabDelCountEl) tabDelCountEl.textContent = coveredDeliverables + '/' + program.totalEntregables;

  const hbMaterialesEl = document.getElementById('hbMateriales');
  const hbCitasEl = document.getElementById('hbCitas');
  const hbInduccionesEl = document.getElementById('hbInducciones');
  const hbTotalEl = document.getElementById('hbTotal');
  if (hbMaterialesEl) hbMaterialesEl.textContent = delPct + '%';
  if (hbCitasEl) hbCitasEl.textContent = citasPct + '%';
  if (hbInduccionesEl) hbInduccionesEl.textContent = induccionesPct + '%';
  if (hbTotalEl) hbTotalEl.textContent = avanceReal + '%';

  renderMatrix();
  renderNextSteps();
  renderExtConversions();
  renderAgentProgressTable();
  renderCierresTable_v53();
}

function renderNextSteps() {
  const el = document.getElementById('nextStepsList');
  if (!el) return;
  const items = state.nextSteps || [];
  if (items.length === 0) {
    el.innerHTML = '<p style="color:var(--text-muted); font-size:12px; font-style:italic; padding:16px">No hay próximos pasos definidos. Usa "✎ Editar lista" para agregarlos.</p>';
    return;
  }
  el.innerHTML = items.map(item =>
    '<div class="finding">' +
      '<div class="finding-icon ' + (item.icon || 'teal') + '">▸</div>' +
      '<div class="finding-content">' +
        '<div class="finding-title">' + escapeHtml(item.title) + '</div>' +
        '<div class="finding-text">' + escapeHtml(item.text) + '</div>' +
      '</div>' +
    '</div>'
  ).join('');
}

function renderMatrix() {
  const tbody = document.getElementById('matrixBody');
  if (!tbody) return;
  const semMap = { excelente: 'green', bien: 'blue', atencion: 'amber', critico: 'red', inicio: 'gray' };
  tbody.innerHTML = state.agents.map(agent => {
    const stats = agentStats(agent.id);
    const semaforo = agentSemaforo(stats);
    const numClass = value => value === 0 ? 'num zero' : 'num';
    return '<tr onclick="goToAgent(\'' + agent.id + '\')" style="cursor:pointer">' +
      '<td><div class="agent-cell"><div class="agent-avatar">' + agent.initials + '</div>' +
      '<div><div class="agent-info-name">' + escapeHtml(agent.name) + '</div>' +
      '<div class="agent-info-tag">' + escapeHtml(agent.tag) + '</div></div></div></td>' +
      '<td class="' + numClass(stats.iniciales) + '">' + stats.iniciales + '</td>' +
      '<td class="' + numClass(stats.cierres) + '">' + stats.cierres + '</td>' +
      '<td class="' + numClass(stats.solicitudes) + '">' + stats.solicitudes + '</td>' +
      '<td class="' + numClass(stats.polizas) + '">' + stats.polizas + '</td>' +
      '<td class="' + numClass(stats.reagend) + '">' + stats.reagend + '</td>' +
      '<td class="' + numClass(stats.cancel) + '">' + stats.cancel + '</td>' +
      '<td><span class="status-pill ' + semMap[semaforo.level] + '">' + semaforo.text + '</span></td>' +
      '</tr>';
  }).join('');
}

function renderExtConversions() {
  const el = document.getElementById('extConvGrid');
  if (!el) return;
  const conversions = calculateNewConversions();
  if (conversions.totalProspects === 0) {
    el.innerHTML = '<p style="color:var(--text-muted); font-size:12px; font-style:italic; padding:16px; grid-column: 1/-1">Sin prospectos registrados aún.</p>';
    return;
  }
  el.innerHTML =
    '<div class="ext-conv-item">' +
      '<div class="ext-conv-label">Inicial → Cierre</div>' +
      '<div class="ext-conv-val">' + conversions.inicialACierre + '%</div>' +
      '<div class="ext-conv-sub">' + conversions.cierre + ' de ' + conversions.inicial + ' prospectos avanzaron</div>' +
    '</div>' +
    '<div class="ext-conv-item cierre">' +
      '<div class="ext-conv-label">Cierre → Solicitud</div>' +
      '<div class="ext-conv-val">' + conversions.cierreASolicitud + '%</div>' +
      '<div class="ext-conv-sub">' + conversions.solicitud + ' de ' + conversions.cierre + ' firmaron solicitud</div>' +
    '</div>' +
    '<div class="ext-conv-item solicitud">' +
      '<div class="ext-conv-label">Solicitud → Póliza</div>' +
      '<div class="ext-conv-val">' + conversions.solicitudAPoliza + '%</div>' +
      '<div class="ext-conv-sub">' + conversions.poliza + ' de ' + conversions.solicitud + ' emitieron póliza</div>' +
    '</div>' +
    '<div class="ext-conv-item poliza">' +
      '<div class="ext-conv-label">Embudo total · Inicial → Póliza</div>' +
      '<div class="ext-conv-val">' + conversions.inicialAPoliza + '%</div>' +
      '<div class="ext-conv-sub">' + conversions.poliza + ' de ' + conversions.inicial + ' llegaron al final</div>' +
    '</div>';
}

function renderAgentProgressTable() {
  const container = document.getElementById('agentProgressTable');
  if (!container) return;
  const rows = state.agents.map(agent => ({
    agent,
    progress: calculateAgentWeightedProgress(agent.id),
  })).sort((left, right) => right.progress.avgPct - left.progress.avgPct);

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

  rows.forEach(row => {
    const stageCount = row.progress.stageCount;
    const isHigh = row.progress.avgPct >= 75;
    html += '<tr>' +
      '<td><div class="prospect-name-cell">' + escapeHtml(row.agent.name) + '</div>' +
        '<div class="prospect-agent-sub">' + escapeHtml(row.agent.tag || '') + '</div></td>' +
      '<td><span class="prospect-last-activity">' + row.progress.totalProspects + '</span></td>' +
      '<td><div class="prospect-stages-mini">' +
        '<div class="prospect-stage-dot' + (stageCount.inicial > 0 ? ' done' : '') + '" title="Iniciales: ' + stageCount.inicial + '">I</div>' +
        '<div class="prospect-stage-dot' + (stageCount.cierre > 0 ? ' done' : '') + '" title="Cierres: ' + stageCount.cierre + '">C</div>' +
        '<div class="prospect-stage-dot' + (stageCount.solicitud > 0 ? ' done' : '') + '" title="Solicitudes: ' + stageCount.solicitud + '">S</div>' +
        '<div class="prospect-stage-dot' + (stageCount.poliza > 0 ? ' done final' : '') + '" title="Pólizas: ' + stageCount.poliza + '">P</div>' +
      '</div></td>' +
      '<td><div class="prospect-progress-bar">' +
        '<div class="prospect-progress-bar-track">' +
          '<div class="prospect-progress-bar-fill' + (isHigh ? ' complete' : '') + '" style="width:' + row.progress.avgPct + '%"></div>' +
        '</div>' +
        '<span class="prospect-progress-pct">' + row.progress.avgPct + '%</span>' +
      '</div></td>' +
      '</tr>';
  });

  html += '</tbody></table>';
  container.innerHTML = html;
}
