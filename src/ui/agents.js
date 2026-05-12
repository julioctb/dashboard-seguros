/* ================================================================
   AGENTS VIEW
================================================================ */
function renderAgentTabs() {
  const container = document.getElementById('agentTabs');
  container.innerHTML = state.agents.map(a =>
    '<button class="agent-tab ' + (a.id === state.currentAgent ? 'active' : '') + '" data-agent="' + a.id + '">' +
    '<span class="status-dot ' + a.status + '"></span>' + escapeHtml(a.name) + '</button>'
  ).join('') +
  '<button class="agent-add-btn" onclick="openNewAgentModal()"><span>+</span> Agregar agente</button>';

  container.querySelectorAll('.agent-tab').forEach(btn => {
    btn.onclick = () => {
      state.currentAgent = btn.dataset.agent;
      renderAgentTabs();
      renderAgentPanels();
    };
  });
}

function renderAgentPanels() {
  const container = document.getElementById('agentPanels');
  const a = state.agents.find(x => x.id === state.currentAgent);
  if (!a) { container.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding:40px">Selecciona un agente o agrega uno nuevo.</p>'; return; }

  const s = agentStats(a.id);
  const acts = state.activities.filter(x => x.agent === a.id).sort((x, y) => y.date.localeCompare(x.date));
  const ficha = state.fichas[a.id] || {};
  const materiales = ficha.materiales || [];
  const pendientes = ficha.pendientes || [];
  const sem = agentSemaforo(s);

  const convCC = s.iniciales > 0 ? Math.round((s.cierres / s.iniciales) * 100) : 0;
  const convCP = s.cierres > 0 ? Math.round((s.polizas / s.cierres) * 100) : 0;
  const convRef = s.polizas > 0 ? Math.round((s.referidos / s.polizas) * 100) : 0;

  const stageCls = (n, isLast) => n > 0 ? (isLast ? 'active' : 'touched') : '';

  container.innerHTML =
    '<div class="agent-panel active">' +
    '<div class="agent-header-card">' +
      '<div class="agent-header-avatar">' + a.initials + '</div>' +
      '<div class="agent-header-main">' +
        '<div class="agent-header-name">' + escapeHtml(a.name) +
          '<span class="status-pill ' + a.status + '" style="font-size:10px">' + escapeHtml(a.tag) + '</span>' +
        '</div>' +
        '<div class="agent-header-meta">ID: ' + a.id + ' · Iniciales: ' + a.initials + '</div>' +
      '</div>' +
      '<div class="agent-header-actions">' +
        '<button class="edit-agent-btn" onclick="openEditAgentModal(\'' + a.id + '\')"><span>✎</span> Editar agente</button>' +
      '</div>' +
    '</div>' +

    // MEDIDOR CICLO
    '<div class="ciclo-meter">' +
      '<div class="ciclo-meter-top">' +
        '<div class="ciclo-meter-title">Ciclo de la cita · 4 etapas</div>' +
        '<span class="ciclo-meter-verdict ' + sem.level + '">' + sem.text + '</span>' +
      '</div>' +
      '<div class="ciclo-stages">' +
        '<div class="ciclo-stage ' + stageCls(s.iniciales, false) + '"><div class="ciclo-stage-icon">◉</div><div class="ciclo-stage-label">Inicial</div><div class="ciclo-stage-num">' + s.iniciales + '</div></div>' +
        '<div class="ciclo-stage ' + stageCls(s.cierres, false) + '"><div class="ciclo-stage-icon">◇</div><div class="ciclo-stage-label">Cierre</div><div class="ciclo-stage-num">' + s.cierres + '</div></div>' +
        '<div class="ciclo-stage ' + stageCls(s.solicitudes, false) + '"><div class="ciclo-stage-icon">▤</div><div class="ciclo-stage-label">Solicitud</div><div class="ciclo-stage-num">' + s.solicitudes + '</div></div>' +
        '<div class="ciclo-stage ' + stageCls(s.polizas, true) + '"><div class="ciclo-stage-icon">★</div><div class="ciclo-stage-label">Póliza</div><div class="ciclo-stage-num">' + s.polizas + '</div></div>' +
      '</div>' +
      '<div class="ciclo-conversion">' +
        '<div class="conv-item"><div class="conv-item-val">' + convCC + '%</div><div class="conv-item-label">Cita → Cierre</div></div>' +
        '<div class="conv-item"><div class="conv-item-val">' + convCP + '%</div><div class="conv-item-label">Cierre → Póliza</div></div>' +
        '<div class="conv-item"><div class="conv-item-val">' + s.referidos + '</div><div class="conv-item-label">Referidos</div></div>' +
        '<div class="conv-item"><div class="conv-item-val">' + convRef + '%</div><div class="conv-item-label">Ref. / Póliza</div></div>' +
      '</div>' +
    '</div>' +

    // SUBTABS
    '<div class="subtabs">' +
      '<button class="subtab ' + (state.currentSubtab === 'bitacora' ? 'active' : '') + '" data-sub="bitacora">Bitácora de citas <span class="subtab-pill">' + acts.length + '</span></button>' +
      '<button class="subtab ' + (state.currentSubtab === 'cierres' ? 'active' : '') + '" data-sub="cierres">Cierres pendientes <span class="subtab-pill" id="cierresPillAgent_' + a.id + '">0</span></button>' +
      '<button class="subtab ' + (state.currentSubtab === 'ficha' ? 'active' : '') + '" data-sub="ficha">Ficha de avance</button>' +
    '</div>' +

    '<div class="subpanel ' + (state.currentSubtab === 'bitacora' ? 'active' : '') + '" id="sub-bitacora">' +
      '<div class="activity-card">' +
        '<div class="activity-header">' +
          '<h3>Registro de citas · ' + acts.length + ' actividades</h3>' +
          '<button class="add-btn-sm" onclick="openActivityModal(\'' + a.id + '\')">+ Nueva actividad</button>' +
        '</div>' +
        '<div class="bitacora-toolbar">' +
          '<div class="bitacora-view-toggle">' +
            '<button class="bitacora-view-btn ' + (bitacoraViewMode_v5 === 'grouped' ? 'active' : '') + '" onclick="setBitacoraViewMode_v5(\'grouped\')">◈ Agrupado por prospecto</button>' +
            '<button class="bitacora-view-btn ' + (bitacoraViewMode_v5 === 'plain' ? 'active' : '') + '" onclick="setBitacoraViewMode_v5(\'plain\')">≡ Lista simple</button>' +
          '</div>' +
          '<span style="font-size:11px; color:var(--text-muted); font-family:\'DM Mono\', monospace">Flujo: Inicial(30) · Cierre(20) · Solicitud(20) · Póliza(30)</span>' +
        '</div>' +
        '<div id="bitacoraContent_' + a.id + '"></div>' +
      '</div>' +
    '</div>' +

    // CIERRES PENDIENTES del agente
    '<div class="subpanel ' + (state.currentSubtab === 'cierres' ? 'active' : '') + '" id="sub-cierres">' +
      '<div class="activity-card">' +
        '<div class="activity-header">' +
          '<h3>Cierres pendientes · ' + escapeHtml(a.name) + '</h3>' +
          '<button class="add-btn-sm" onclick="openCierreModal(\'' + a.id + '\')">+ Agregar cierre</button>' +
        '</div>' +
        '<div id="cierresAgentContent_' + a.id + '" class="cierres-agent-list" style="margin-top:12px"></div>' +
      '</div>' +
    '</div>' +

    // FICHA
    '<div class="subpanel ' + (state.currentSubtab === 'ficha' ? 'active' : '') + '" id="sub-ficha">' +
      '<div class="ficha-grid">' +
        '<div class="ficha-card full">' +
          '<div class="ficha-head"><h4>Perfil del agente</h4><span class="autosave-ind">Autoguardado</span></div>' +
          '<div class="ficha-body"><textarea class="ficha-textarea" data-field="perfil" onchange="saveFichaField(this)" placeholder="Descripción general...">' + escapeHtml(ficha.perfil || '') + '</textarea></div>' +
        '</div>' +
        '<div class="ficha-card"><div class="ficha-head"><h4>Fortalezas</h4></div>' +
          '<div class="ficha-body"><textarea class="ficha-textarea" data-field="fortalezas" onchange="saveFichaField(this)" placeholder="Habilidades observadas...">' + escapeHtml(ficha.fortalezas || '') + '</textarea></div>' +
        '</div>' +
        '<div class="ficha-card"><div class="ficha-head"><h4>Puntos de mejora</h4></div>' +
          '<div class="ficha-body"><textarea class="ficha-textarea" data-field="puntosMejora" onchange="saveFichaField(this)" placeholder="Áreas a trabajar...">' + escapeHtml(ficha.puntosMejora || '') + '</textarea></div>' +
        '</div>' +
        '<div class="ficha-card full"><div class="ficha-head"><h4>Comentarios y observaciones</h4></div>' +
          '<div class="ficha-body"><textarea class="ficha-textarea" data-field="comentarios" onchange="saveFichaField(this)" placeholder="Observaciones tuyas...">' + escapeHtml(ficha.comentarios || '') + '</textarea></div>' +
        '</div>' +
        '<div class="ficha-card"><div class="ficha-head"><h4>Materiales compartidos</h4></div>' +
          '<div class="ficha-body"><div class="list-editable">' +
          materiales.map(m => renderListItem(m, 'materiales')).join('') +
          '</div><button class="list-add" onclick="addListItem(\'materiales\')" style="margin-top:10px">+ Agregar material</button></div>' +
        '</div>' +
        '<div class="ficha-card"><div class="ficha-head"><h4>Pendientes y próximos pasos</h4></div>' +
          '<div class="ficha-body"><div class="list-editable">' +
          pendientes.map(p => renderListItem(p, 'pendientes')).join('') +
          '</div><button class="list-add" onclick="addListItem(\'pendientes\')" style="margin-top:10px">+ Agregar pendiente</button></div>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '</div>';

  container.querySelectorAll('.subtab').forEach(btn => {
    btn.onclick = () => { state.currentSubtab = btn.dataset.sub; renderAgentPanels(); };
  });

  /* v5: poblar el contenedor de bitácora con vista agrupada o plana */
  renderAgentBitacora_v5(a.id);
  /* v5.3: poblar cierres pendientes del agente */
  renderCierresAgent_v53(a.id);
}

function renderListItem(item, type) {
  return '<div class="list-item ' + (item.done ? 'done' : '') + '" data-id="' + item.id + '">' +
    '<div class="list-check ' + (item.done ? 'checked' : '') + '" onclick="toggleListItem(\'' + type + '\',\'' + item.id + '\')"></div>' +
    '<input class="list-input ' + (item.done ? 'done' : '') + '" type="text" value="' + escapeHtml(item.text || '') + '" onchange="updateListItem(\'' + type + '\',\'' + item.id + '\',\'text\',this.value)" placeholder="Descripción...">' +
    '<input class="list-date" type="date" value="' + (item.date || '') + '" onchange="updateListItem(\'' + type + '\',\'' + item.id + '\',\'date\',this.value)">' +
    '<button class="list-remove" onclick="removeListItem(\'' + type + '\',\'' + item.id + '\')" title="Eliminar">×</button>' +
    '</div>';
}

function labelType(t) {
  return { llamada:'Llamada', inicial:'Inicial', cierre:'Cierre', solicitud:'Solicitud', poliza:'Póliza', referido:'Referido', roleplay:'Role-play' }[t] || t;
}
function labelResult(r) {
  return { ok:'Ejecutada', cerrada:'Cerró', contrapropuesta:'Contrapropuesta', noAhora:'Por ahora no', reagend:'Reagendada', cancel:'Cancelada', sustituida:'Sustituida', perdida:'Perdida' }[r] || r;
}

function renderANFIndicator(act) {
  const nec = (act.anfNecesidades || []).length;
  const monto = (act.anfMonto || '').trim();
  const nota = (act.anfNota || '').trim();
  const summary = (act.anfSummary || '').trim();
  const tooltipParts = [];
  if (nec > 0) tooltipParts.push('Necesidades: ' + act.anfNecesidades.join(', '));
  if (monto) tooltipParts.push('Monto: ' + monto);
  if (nota) tooltipParts.push('Nota: ' + nota);
  if (summary) tooltipParts.push('Resumen: ' + summary);
  const tooltip = tooltipParts.join(' · ');
  let result = '';
  if (nec > 0) {
    result = '<span class="anf-pill has-summary" title="' + escapeHtml(tooltip) + '">✓ ' + nec + ' nec.' + (monto ? ' · $' + escapeHtml(monto) : '') + '</span>';
  } else if (summary || monto || nota) {
    result = '<span class="anf-pill has-summary" title="' + escapeHtml(tooltip) + '">✎ Resumen</span>';
  } else if (act.anfFileName) {
    result = '<span class="anf-pill has-pdf" title="' + escapeHtml(act.anfSummary || 'PDF cargado') + '">📎 PDF</span>';
  } else {
    result = '<span class="anf-pill none">—</span>';
  }
  /* Fumador integrado */
  if (act.fumador === 'no') result += ' <span class="fumador-pill no">🚭 No fuma</span>';
  if (act.fumador === 'si') result += ' <span class="fumador-pill si">🚬 Fuma</span>';
  return result;
}

/* Ficha handlers */
function saveFichaField(el) {
  const field = el.dataset.field;
  const agent = state.currentAgent;
  if (!state.fichas[agent]) state.fichas[agent] = {};
  state.fichas[agent][field] = el.value;
  saveState();
  showToast('Ficha actualizada');
}

function addListItem(type) {
  const agent = state.currentAgent;
  if (!state.fichas[agent]) state.fichas[agent] = {};
  if (!state.fichas[agent][type]) state.fichas[agent][type] = [];
  state.fichas[agent][type].push({ id: uid(), text: '', date: '', done: false });
  saveState();
  renderAgentPanels();
}

function updateListItem(type, id, field, value) {
  const agent = state.currentAgent;
  const list = state.fichas[agent][type];
  const item = list.find(x => x.id === id);
  if (item) { item[field] = value; saveState(); }
}

function toggleListItem(type, id) {
  const agent = state.currentAgent;
  const list = state.fichas[agent][type];
  const item = list.find(x => x.id === id);
  if (item) { item.done = !item.done; saveState(); renderAgentPanels(); }
}

function removeListItem(type, id) {
  if (!confirm('¿Eliminar este elemento?')) return;
  const agent = state.currentAgent;
  state.fichas[agent][type] = state.fichas[agent][type].filter(x => x.id !== id);
  saveState();
  renderAgentPanels();
}

function renderAgentBitacora_v5(agentId) {
  const container = document.getElementById('bitacoraContent_' + agentId);
  if (!container) return;

  let html = '';

  const { withProspect, withoutProspect } = groupActivitiesByProspect_v5(agentId);
  const allOrphans = withProspect.length === 0 && withoutProspect.length > 0;

  /* Si todas las actividades están sin nombre de prospecto y el usuario
     está en modo agrupado, mostrar aviso y ofrecer lista simple */
  if (bitacoraViewMode_v5 === 'grouped' && allOrphans) {
    html += '<div class="duplicates-banner" style="margin-bottom:12px">' +
      '<div class="duplicates-banner-icon" style="color:var(--blue)">ℹ</div>' +
      '<div class="duplicates-banner-body">' +
        '<div class="duplicates-banner-title">Actividades sin nombre de prospecto</div>' +
        '<div class="duplicates-banner-text">Todas las actividades de este agente están registradas sin nombre de prospecto, o con el campo vacío. El agrupado no puede organizarlas por prospecto. Puedes verlas en lista simple o editarlas para agregar el nombre.</div>' +
        '<div class="duplicates-banner-actions">' +
          '<button class="duplicates-btn" style="border-color:var(--blue);color:var(--blue)" onclick="setBitacoraViewMode_v5(\'plain\')">Ver en lista simple</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  /* Banner de duplicados (solo en modo agrupado) */
  if (bitacoraViewMode_v5 === 'grouped' && !allOrphans) {
    const dups = detectProspectDuplicates_v5(agentId);
    const dismissed = dismissedDuplicates_v5[agentId] || [];
    const activeDups = dups.filter(g => !dismissed.includes(g.key));
    if (activeDups.length > 0) {
      html += '<div class="duplicates-banner">' +
        '<div class="duplicates-banner-icon">⚠</div>' +
        '<div class="duplicates-banner-body">' +
          '<div class="duplicates-banner-title">Posibles prospectos duplicados</div>' +
          '<div class="duplicates-banner-text">Se detectaron ' + activeDups.length + ' grupo' + (activeDups.length === 1 ? '' : 's') + ' con nombres parecidos escritos de forma distinta.</div>' +
          '<div class="duplicates-banner-actions">' +
            '<button class="duplicates-btn" onclick="openDupUnifyModal_v5(\'' + agentId + '\')">Revisar y unificar</button>' +
            '<button class="duplicates-btn dismiss" onclick="dismissAllDuplicates_v5(\'' + agentId + '\')">Ignorar por ahora</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }
  }

  if (bitacoraViewMode_v5 === 'plain') {
    html += renderAgentBitacoraPlain_v5(agentId);
  } else {
    html += renderAgentBitacoraGrouped_v5(agentId);
  }

  container.innerHTML = html;
}

function renderAgentBitacoraGrouped_v5(agentId) {
  const { withProspect, withoutProspect } = groupActivitiesByProspect_v5(agentId);

  if (withProspect.length === 0 && withoutProspect.length === 0) {
    return '<div class="prospect-card-empty" style="background:white; border:1px solid var(--gray-200); border-radius:var(--radius)">Sin actividad. Usa "+ Nueva actividad" para empezar.</div>';
  }

  let html = '';

  /* Sin prospecto ARRIBA */
  if (withoutProspect.length > 0) {
    html += '<div class="prospect-group-header">Sin prospecto asignado · ' + withoutProspect.length + ' actividad' + (withoutProspect.length === 1 ? '' : 'es') + '</div>';
    const cardKey = agentId + '::__noProspect__';
    /* Abrir por defecto si es el único grupo o tiene la mayoría de actividades */
    const totalActs = withoutProspect.length + withProspect.reduce((sum, g) => sum + g.activities.length, 0);
    const openByDefault = true; /* v5.3: abiertas por defecto siempre */
    if (!(cardKey in openProspectCards_v5)) {
      openProspectCards_v5[cardKey] = openByDefault;
    }
    const isOpen = openProspectCards_v5[cardKey] === true;
    html += '<div class="prospect-card no-assigned ' + (isOpen ? 'open' : '') + '">' +
      '<div class="prospect-card-head" onclick="toggleProspectCard_v5(\'' + agentId + '\', \'__noProspect__\')">' +
        '<span class="prospect-card-chevron">▶</span>' +
        '<div class="prospect-card-main">' +
          '<div class="prospect-card-name"><span class="prospect-card-name-text">Actividades sin nombre de prospecto</span></div>' +
          '<div class="prospect-card-sub"><span class="prospect-card-sub-item">' + withoutProspect.length + ' actividades</span></div>' +
        '</div>' +
        '<div class="prospect-card-activities-count">' + withoutProspect.length + ' act.</div>' +
      '</div>' +
      '<div class="prospect-card-body">' +
        '<div class="prospect-card-activities">' +
          withoutProspect.map(renderProspectActivity_v5).join('') +
        '</div>' +
      '</div>' +
    '</div>';
  }

  /* Prospectos con nombre */
  if (withProspect.length > 0) {
    if (withoutProspect.length > 0) {
      html += '<div class="prospect-group-header">Prospectos · ' + withProspect.length + '</div>';
    }
    withProspect.forEach(g => {
      const cardKey = agentId + '::' + g.key;
      /* Abrir por defecto si nunca se ha tocado */
      if (!(cardKey in openProspectCards_v5)) openProspectCards_v5[cardKey] = true;
      const isOpen = openProspectCards_v5[cardKey] === true;
      const pct = g.progress.pct;
      const isComplete = pct === 100;
      const st = g.progress.stages;
      const onclickKey = escapeAttr(g.key);
      html += '<div class="prospect-card ' + (isOpen ? 'open' : '') + '">' +
        '<div class="prospect-card-head" onclick="toggleProspectCard_v5(\'' + agentId + '\', \'' + onclickKey + '\')">' +
          '<span class="prospect-card-chevron">▶</span>' +
          '<div class="prospect-card-main">' +
            '<div class="prospect-card-name">' +
              '<span class="prospect-card-name-text">' + escapeHtml(g.displayName) + '</span>' +
              (isComplete ? '<span class="prospect-card-badge complete">Ciclo completo</span>' : '') +
              (g.variants.length > 1 ? '<span class="prospect-card-badge" style="background:var(--amber-faint);color:var(--amber)" title="' + escapeAttr(g.variants.join(' · ')) + '">' + g.variants.length + ' variantes</span>' : '') +
            '</div>' +
            '<div class="prospect-card-sub">' +
              '<span class="prospect-card-sub-item">' + g.activities.length + ' actividad' + (g.activities.length === 1 ? '' : 'es') + '</span>' +
              (g.productoCotizado ? '<span class="prospect-card-sub-item">◆ ' + escapeHtml(g.productoCotizado) + '</span>' : '') +
              (g.montoCotizado ? '<span class="prospect-card-sub-item">$' + escapeHtml(g.montoCotizado) + '</span>' : '') +
            '</div>' +
          '</div>' +
          '<div class="prospect-stages-mini">' +
            '<div class="prospect-stage-dot' + (st.inicial ? ' done' : '') + '" title="Inicial">I</div>' +
            '<div class="prospect-stage-dot' + (st.cierre ? ' done' : '') + '" title="Cierre">C</div>' +
            '<div class="prospect-stage-dot' + (st.solicitud ? ' done' : '') + '" title="Solicitud">S</div>' +
            '<div class="prospect-stage-dot' + (st.poliza ? ' done final' : '') + '" title="Póliza">P</div>' +
          '</div>' +
          '<div class="prospect-card-progress">' +
            '<div class="prospect-progress-bar-track">' +
              '<div class="prospect-progress-bar-fill' + (isComplete ? ' complete' : '') + '" style="width:' + pct + '%"></div>' +
            '</div>' +
            '<span class="prospect-progress-pct">' + pct + '%</span>' +
          '</div>' +
        '</div>' +
        '<div class="prospect-card-body">' +
          renderProspectCardMetadata_v5(g) +
          '<div class="prospect-card-activities">' +
            g.activities.map(renderProspectActivity_v5).join('') +
          '</div>' +
        '</div>' +
      '</div>';
    });
  }

  return html;
}

function renderProspectCardMetadata_v5(g) {
  const items = [];
  if (g.productoCotizado) items.push({ label: 'Producto cotizado', value: g.productoCotizado });
  if (g.montoCotizado) items.push({ label: 'Monto', value: '$' + g.montoCotizado });
  if (g.progress.lastDate) items.push({ label: 'Última actividad', value: formatDate(g.progress.lastDate) + ' · ' + labelType(g.progress.lastType) });
  if (items.length === 0) return '';
  return '<div class="prospect-card-metadata">' +
    items.map(it =>
      '<div class="prospect-card-meta-item">' +
        '<div class="prospect-card-meta-label">' + escapeHtml(it.label) + '</div>' +
        '<div class="prospect-card-meta-value">' + escapeHtml(it.value) + '</div>' +
      '</div>'
    ).join('') +
  '</div>';
}

function renderProspectActivity_v5(act) {
  return '<div class="prospect-card-activity">' +
    '<div class="prospect-card-activity-date">' + formatDate(act.date) + '</div>' +
    '<div class="prospect-card-activity-main">' +
      '<div class="prospect-card-activity-row1">' +
        '<span class="type-pill ' + act.type + '">' + labelType(act.type) + '</span>' +
        '<span class="result-pill ' + act.result + '">' + labelResult(act.result) + '</span>' +
        renderANFIndicator(act) +
      '</div>' +
      (act.note ? '<div class="prospect-card-activity-note">' + escapeHtml(act.note) + '</div>' : '') +
    '</div>' +
    '<div class="prospect-card-activity-actions">' +
      '<button class="icon-btn" onclick="event.stopPropagation(); editActivity(\'' + act.id + '\')" title="Editar">✎</button>' +
      '<button class="icon-btn danger" onclick="event.stopPropagation(); confirmDelete(\'' + act.id + '\')" title="Eliminar">×</button>' +
    '</div>' +
  '</div>';
}

function renderAgentBitacoraPlain_v5(agentId) {
  const acts = state.activities.filter(a => a.agent === agentId).sort((x, y) => (y.date || '').localeCompare(x.date || ''));
  if (acts.length === 0) {
    return '<div class="prospect-card-empty" style="background:white; border:1px solid var(--gray-200); border-radius:var(--radius)">Sin actividad.</div>';
  }
  return acts.map(act => {
    const nec = (act.anfNecesidades || []);
    const monto = (act.anfMonto || '').trim();
    const nota = (act.anfNota || '').trim();
    const summary = (act.anfSummary || '').trim();
    const hasANF = nec.length > 0 || monto || nota || summary;
    return '<div style="background:white;border:1px solid var(--gray-200);border-radius:var(--radius-sm);padding:12px 16px;margin-bottom:8px">' +
      '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:' + (hasANF || act.note ? '8px' : '0') + '">' +
        '<span style="font-family:\'DM Mono\',monospace;font-size:11px;color:var(--text-muted);min-width:46px">' + formatDate(act.date) + '</span>' +
        '<span class="type-pill ' + act.type + '">' + labelType(act.type) + '</span>' +
        '<span class="result-pill ' + act.result + '">' + labelResult(act.result) + '</span>' +
        '<strong style="font-size:13px;color:var(--navy)">' + escapeHtml(act.prospect || '(sin nombre)') + '</strong>' +
        (act.fumador === 'no' ? '<span class="fumador-pill no">🚭 No fuma</span>' : '') +
        (act.fumador === 'si' ? '<span class="fumador-pill si">🚬 Fuma</span>' : '') +
        '<div style="margin-left:auto;display:flex;gap:4px">' +
          '<button class="icon-btn" onclick="editActivity(\'' + act.id + '\')" title="Editar">✎</button>' +
          '<button class="icon-btn danger" onclick="confirmDelete(\'' + act.id + '\')" title="Eliminar">×</button>' +
        '</div>' +
      '</div>' +
      (hasANF ?
        '<div style="background:var(--teal-faint);border-radius:var(--radius-sm);padding:10px 12px;font-size:12px;color:var(--navy);display:flex;flex-wrap:wrap;gap:12px;margin-bottom:' + (act.note ? '6px' : '0') + '">' +
          (nec.length > 0 ? '<span><strong>Necesidades:</strong> ' + escapeHtml(nec.join(', ')) + '</span>' : '') +
          (monto ? '<span><strong>Monto:</strong> $' + escapeHtml(monto) + '</span>' : '') +
          (nota ? '<span><strong>Nota:</strong> ' + escapeHtml(nota) + '</span>' : '') +
          (summary ? '<div style="width:100%;margin-top:2px"><strong>ANF:</strong> ' + escapeHtml(summary) + '</div>' : '') +
        '</div>' : '') +
      (act.note ? '<div style="font-size:12px;color:var(--text-muted);padding-top:6px;border-top:1px solid var(--gray-200)">' + escapeHtml(act.note) + '</div>' : '') +
    '</div>';
  }).join('');
}

function toggleProspectCard_v5(agentId, prospectKey) {
  const cardKey = agentId + '::' + prospectKey;
  openProspectCards_v5[cardKey] = !openProspectCards_v5[cardKey];
  try { localStorage.setItem(PROSPECT_OPEN_KEY_V5, JSON.stringify(openProspectCards_v5)); } catch(e) {}
  renderAgentBitacora_v5(agentId);
}

function dismissAllDuplicates_v5(agentId) {
  const dups = detectProspectDuplicates_v5(agentId);
  dismissedDuplicates_v5[agentId] = dups.map(g => g.key);
  try { localStorage.setItem(DUP_DISMISS_KEY_V5, JSON.stringify(dismissedDuplicates_v5)); } catch(e) {}
  renderAgentBitacora_v5(agentId);
}

/* ============ MODAL UNIFICAR DUPLICADOS ============ */
let dupUnifyContext_v5 = null;

function openDupUnifyModal_v5(agentId) {
  const dups = detectProspectDuplicates_v5(agentId);
  if (dups.length === 0) { showToast('No hay duplicados detectados'); return; }
  dupUnifyContext_v5 = { agentId, groups: dups };
  const list = document.getElementById('dupList');
  list.innerHTML = dups.map((g, i) => {
    const variantCounts = {};
    g.activities.forEach(a => {
      const v = (a.prospect || '').trim();
      variantCounts[v] = (variantCounts[v] || 0) + 1;
    });
    return '<div class="dup-group">' +
      '<div class="dup-group-head">Grupo ' + (i + 1) + ' · ' + g.variants.length + ' variantes, ' + g.activities.length + ' actividades</div>' +
      '<div class="dup-group-variants">' +
        Object.entries(variantCounts).map(([name, count]) =>
          '<div class="dup-group-variant">' +
            '<span class="dup-group-variant-name">"' + escapeHtml(name) + '"</span>' +
            '<span class="dup-group-variant-count">' + count + ' actividad' + (count === 1 ? '' : 'es') + '</span>' +
          '</div>'
        ).join('') +
      '</div>' +
      '<div class="dup-group-canonical">' +
        '<label>Unificar como:</label>' +
        '<input type="text" data-group-idx="' + i + '" value="' + escapeAttr(g.displayName) + '">' +
      '</div>' +
    '</div>';
  }).join('');
  document.getElementById('dupUnifyModal').classList.add('open');
}

function closeDupUnifyModal() {
  document.getElementById('dupUnifyModal').classList.remove('open');
  dupUnifyContext_v5 = null;
}

function confirmUnifyDuplicates() {
  const ctx = dupUnifyContext_v5;
  if (!ctx) { closeDupUnifyModal(); return; }
  const inputs = document.querySelectorAll('#dupList input[data-group-idx]');
  let unifiedCount = 0;
  inputs.forEach(input => {
    const idx = parseInt(input.getAttribute('data-group-idx'), 10);
    const canonical = input.value.trim();
    if (!canonical) return;
    const group = ctx.groups[idx];
    if (!group) return;
    /* Actualizar todas las actividades del grupo con el nombre canónico */
    group.activities.forEach(act => {
      const stateAct = state.activities.find(a => a.id === act.id);
      if (stateAct) {
        stateAct.prospect = canonical;
        unifiedCount++;
      }
    });
  });
  saveState();
  closeDupUnifyModal();
  refreshDashboardAndAgents();
  showToast(unifiedCount + ' actividades unificadas');
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
