/* ================================================================
   AGENTS VIEW
================================================================ */
function renderAgentTabs() {
  const container = document.getElementById('agentTabs');
  const showAddAgent = !(typeof isPortalAuthEnabled === 'function' && isPortalAuthEnabled() && !isAdminUser());
  container.innerHTML = state.agents.map(a =>
    '<button class="agent-tab ' + (a.id === state.currentAgent ? 'active' : '') + '" data-agent="' + a.id + '">' +
    '<span class="status-dot ' + getCatalogSemanticKeyForValue('agentStatuses', a.status) + '"></span>' + escapeHtml(a.name) + '</button>'
  ).join('') +
  (showAddAgent ? '<button class="agent-add-btn" onclick="openNewAgentModal()"><span>+</span> Agregar agente</button>' : '');

  container.querySelectorAll('.agent-tab').forEach(btn => {
    btn.onclick = () => {
      state.currentAgent = btn.dataset.agent;
      refreshUI('agents');
    };
  });
}

function renderAgentHeaderSection(agent) {
  const statusTone = getCatalogSemanticKeyForValue('agentStatuses', agent.status);
  const canEditAgent = !(typeof isPortalAuthEnabled === 'function' && isPortalAuthEnabled() && !isAdminUser());
  return '<div class="agent-header-card">' +
    '<div class="agent-header-avatar">' + agent.initials + '</div>' +
    '<div class="agent-header-main">' +
      '<div class="stamp-label">Expediente de agente</div>' +
      '<div class="agent-header-name">' + escapeHtml(agent.name) +
        '<span class="status-pill ' + statusTone + '" style="font-size:10px">' + escapeHtml(agent.tag) + '</span>' +
      '</div>' +
      '<div class="agent-header-meta">Folio: ' + agent.id + ' · Iniciales: ' + agent.initials + '</div>' +
    '</div>' +
    '<div class="agent-header-actions">' +
      (canEditAgent ? '<button class="edit-agent-btn" onclick="openEditAgentModal(\'' + agent.id + '\')"><span>✎</span> Editar agente</button>' : '') +
    '</div>' +
  '</div>';
}

function renderAgentCycleSection(agent, stats, semaforo) {
  const convCC = stats.iniciales > 0 ? Math.round((stats.cierres / stats.iniciales) * 100) : 0;
  const convCP = stats.cierres > 0 ? Math.round((stats.polizas / stats.cierres) * 100) : 0;
  const convRef = stats.polizas > 0 ? Math.round((stats.referidos / stats.polizas) * 100) : 0;
  const stageCls = (count, isLast) => count > 0 ? (isLast ? 'active' : 'touched') : '';
  return '<div class="ciclo-meter">' +
    '<div class="ciclo-meter-top">' +
      '<div class="ciclo-meter-title">Carril del expediente comercial · 4 etapas</div>' +
      '<span class="ciclo-meter-verdict ' + semaforo.level + '">' + semaforo.text + '</span>' +
    '</div>' +
    '<div class="ciclo-stages">' +
      '<div class="ciclo-stage ' + stageCls(stats.iniciales, false) + '"><div class="ciclo-stage-icon">◉</div><div class="ciclo-stage-label">Inicial</div><div class="ciclo-stage-num">' + stats.iniciales + '</div></div>' +
      '<div class="ciclo-stage ' + stageCls(stats.cierres, false) + '"><div class="ciclo-stage-icon">◇</div><div class="ciclo-stage-label">Cierre</div><div class="ciclo-stage-num">' + stats.cierres + '</div></div>' +
      '<div class="ciclo-stage ' + stageCls(stats.solicitudes, false) + '"><div class="ciclo-stage-icon">▤</div><div class="ciclo-stage-label">Solicitud</div><div class="ciclo-stage-num">' + stats.solicitudes + '</div></div>' +
      '<div class="ciclo-stage ' + stageCls(stats.polizas, true) + '"><div class="ciclo-stage-icon">★</div><div class="ciclo-stage-label">Póliza</div><div class="ciclo-stage-num">' + stats.polizas + '</div></div>' +
    '</div>' +
    '<div class="ciclo-conversion">' +
      '<div class="conv-item"><div class="conv-item-val">' + convCC + '%</div><div class="conv-item-label">Cita → Cierre</div></div>' +
      '<div class="conv-item"><div class="conv-item-val">' + convCP + '%</div><div class="conv-item-label">Cierre → Póliza</div></div>' +
      '<div class="conv-item"><div class="conv-item-val">' + stats.referidos + '</div><div class="conv-item-label">Referidos</div></div>' +
      '<div class="conv-item"><div class="conv-item-val">' + convRef + '%</div><div class="conv-item-label">Ref. / Póliza</div></div>' +
    '</div>' +
  '</div>';
}

function renderAgentSubtabs(agentId, activityCount) {
  return '<div class="subtabs document-tabs">' +
    '<button class="subtab ' + (state.currentSubtab === 'bitacora' ? 'active' : '') + '" data-sub="bitacora">Bitácora <span class="subtab-pill">' + activityCount + '</span></button>' +
    '<button class="subtab ' + (state.currentSubtab === 'cierres' ? 'active' : '') + '" data-sub="cierres">Cierres de expediente <span class="subtab-pill" id="cierresPillAgent_' + agentId + '">0</span></button>' +
    '<button class="subtab ' + (state.currentSubtab === 'ficha' ? 'active' : '') + '" data-sub="ficha">Ficha operativa</button>' +
  '</div>';
}

function renderAgentBitacoraPanel(agent, activityCount) {
  const canEditActivities = canEditOwnWorkspace();
  return '<div class="subpanel ' + (state.currentSubtab === 'bitacora' ? 'active' : '') + '" id="sub-bitacora">' +
    '<div class="activity-card">' +
      '<div class="activity-header">' +
        '<h3>Registro de citas · ' + activityCount + ' actividades</h3>' +
        (canEditActivities ? '<button class="add-btn-sm" onclick="openActivityModal(\'' + agent.id + '\')">+ Nueva actividad</button>' : '') +
      '</div>' +
      '<div class="bitacora-toolbar">' +
        '<div class="bitacora-view-toggle">' +
          '<button class="bitacora-view-btn ' + (bitacoraViewMode_v5 === 'grouped' ? 'active' : '') + '" onclick="setBitacoraViewMode_v5(\'grouped\')">◈ Agrupado por prospecto</button>' +
          '<button class="bitacora-view-btn ' + (bitacoraViewMode_v5 === 'plain' ? 'active' : '') + '" onclick="setBitacoraViewMode_v5(\'plain\')">≡ Lista simple</button>' +
        '</div>' +
        '<span style="font-size:11px; color:var(--text-muted); font-family:\'DM Mono\', monospace">Flujo: Inicial(30) · Cierre(20) · Solicitud(20) · Póliza(30)</span>' +
      '</div>' +
      '<div id="bitacoraContent_' + agent.id + '"></div>' +
    '</div>' +
  '</div>';
}

function renderAgentCierresPanel(agent) {
  const canEditCierres = canEditOwnWorkspace();
  return '<div class="subpanel ' + (state.currentSubtab === 'cierres' ? 'active' : '') + '" id="sub-cierres">' +
    '<div class="activity-card">' +
      '<div class="activity-header">' +
        '<h3>Cierres pendientes · ' + escapeHtml(agent.name) + '</h3>' +
        (canEditCierres ? '<button class="add-btn-sm" onclick="openCierreModal(\'' + agent.id + '\')">+ Agregar cierre</button>' : '') +
      '</div>' +
      '<div id="cierresAgentContent_' + agent.id + '" class="cierres-agent-list" style="margin-top:12px"></div>' +
    '</div>' +
  '</div>';
}

function renderAgentPanels() {
  const container = document.getElementById('agentPanels');
  const a = state.agents.find(x => x.id === state.currentAgent);
  if (!a) { container.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding:40px">Selecciona un agente o agrega uno nuevo.</p>'; return; }

  const s = agentStats(a.id);
  const acts = state.activities.filter(x => x.agent === a.id).sort((x, y) => (y.date || '').localeCompare(x.date || ''));
  const ficha = state.fichas[a.id] || {};
  const sem = agentSemaforo(s);

  container.innerHTML =
    '<div class="agent-panel active">' +
    renderAgentHeaderSection(a) +
    renderAgentCycleSection(a, s, sem) +
    renderAgentSubtabs(a.id, acts.length) +
    renderAgentBitacoraPanel(a, acts.length) +
    renderAgentCierresPanel(a) +
    renderAgentFichaPanel(a.id, ficha) +
    '</div>';

  container.querySelectorAll('.subtab').forEach(btn => {
    btn.onclick = () => { state.currentSubtab = btn.dataset.sub; renderAgentPanels(); };
  });

  /* v5: poblar el contenedor de bitácora con vista agrupada o plana */
  renderAgentBitacora_v5(a.id);
  /* v5.3: poblar cierres pendientes del agente */
  renderCierresAgent_v53(a.id);
}
