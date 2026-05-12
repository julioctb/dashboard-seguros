/* ================================================================
   MODAL ACTIVIDAD
================================================================ */
function populateAgentDropdown() {
  const sel = document.getElementById('actAgent');
  sel.innerHTML = state.agents.map(a => '<option value="' + a.id + '">' + escapeHtml(a.name) + '</option>').join('');
}

function onTypeChange() {
  const type = document.getElementById('actType').value;
  document.getElementById('actPolizaFields').style.display = type === 'poliza' ? 'block' : 'none';
}

function onAnfCheckChange(el) {
  const label = el.closest('.anf-check');
  if (label) label.classList.toggle('checked', el.checked);
}

function getAnfNecesidades() {
  return Array.from(document.querySelectorAll('#anfChecks input[type=checkbox]:checked')).map(c => c.value);
}

function setAnfNecesidades(arr) {
  const set = new Set(arr || []);
  document.querySelectorAll('#anfChecks input[type=checkbox]').forEach(c => {
    c.checked = set.has(c.value);
    const label = c.closest('.anf-check');
    if (label) label.classList.toggle('checked', c.checked);
  });
}

function openActivityModal(prefillAgent, editId, prefill) {
  populateAgentDropdown();
  document.getElementById('modalTitle').textContent = editId ? 'Editar actividad' : 'Registrar actividad';
  document.getElementById('deleteBtn').style.display = editId ? 'block' : 'none';
  document.getElementById('actEditId').value = editId || '';

  if (editId) {
    const act = state.activities.find(a => a.id === editId);
    if (act) {
      document.getElementById('actAgent').value = act.agent;
      document.getElementById('actDate').value = act.date;
      document.getElementById('actType').value = act.type;
      document.getElementById('actResult').value = act.result;
      document.getElementById('actProspect').value = act.prospect || '';
      document.getElementById('actNote').value = act.note || '';
      document.getElementById('actANFSummary').value = act.anfSummary || '';
      document.getElementById('actANFMonto').value = act.anfMonto || '';
      document.getElementById('actANFNota').value = act.anfNota || '';
      document.getElementById('actPrima').value = act.prima || '';
      setAnfNecesidades(act.anfNecesidades || []);
    }
  } else {
    document.getElementById('actAgent').value = (prefill && prefill.agent) || prefillAgent || state.currentAgent || (state.agents[0] && state.agents[0].id);
    document.getElementById('actDate').value = (prefill && prefill.date) || new Date().toISOString().slice(0, 10);
    document.getElementById('actType').value = (prefill && prefill.type) || 'inicial';
    document.getElementById('actResult').value = (prefill && prefill.result) || 'ok';
    document.getElementById('actProspect').value = (prefill && prefill.prospect) || '';
    document.getElementById('actNote').value = (prefill && prefill.note) || '';
    document.getElementById('actANFSummary').value = '';
    document.getElementById('actANFMonto').value = '';
    document.getElementById('actANFNota').value = '';
    document.getElementById('actPrima').value = '';
    setAnfNecesidades([]);
  }
  onTypeChange();
  document.getElementById('activityModal').classList.add('open');
}

function closeActivityModal() { document.getElementById('activityModal').classList.remove('open'); }

function saveActivity() {
  const editId = document.getElementById('actEditId').value;
  const data = {
    agent: document.getElementById('actAgent').value,
    date: document.getElementById('actDate').value,
    type: document.getElementById('actType').value,
    result: document.getElementById('actResult').value,
    prospect: document.getElementById('actProspect').value.trim(),
    note: document.getElementById('actNote').value.trim(),
    anfNecesidades: getAnfNecesidades(),
    anfMonto: document.getElementById('actANFMonto').value.trim(),
    anfNota: document.getElementById('actANFNota').value.trim(),
    anfSummary: document.getElementById('actANFSummary').value.trim(),
    prima: document.getElementById('actPrima').value.trim(),
  };
  if (!data.date) { showToast('Falta la fecha', 'error'); return; }

  let savedActivity = null;
  if (editId) {
    const idx = state.activities.findIndex(a => a.id === editId);
    if (idx >= 0) {
      state.activities[idx] = { ...state.activities[idx], ...data };
      savedActivity = state.activities[idx];
    }
  } else {
    savedActivity = { id: uid(), ...data };
    state.activities.push(savedActivity);
  }

  saveState();
  closeActivityModal();
  refreshDashboardAndAgents();
  showToast(editId ? 'Actividad actualizada' : 'Actividad registrada');

  // Agendar cierre automático tras cita inicial ejecutada
  if (!editId && savedActivity && savedActivity.type === 'inicial' && ['ok','cerrada','contrapropuesta','noAhora'].includes(savedActivity.result)) {
    setTimeout(() => {
      if (confirm('¿Agendar la cita de cierre para este prospecto?')) {
        const inicialDate = new Date(savedActivity.date + 'T00:00:00');
        inicialDate.setDate(inicialDate.getDate() + 7);
        const cierreDate = inicialDate.toISOString().slice(0, 10);
        openActivityModal(null, null, {
          agent: savedActivity.agent,
          date: cierreDate,
          type: 'cierre',
          result: 'ok',
          prospect: savedActivity.prospect,
          note: 'Cierre agendado tras cita inicial del ' + savedActivity.date
        });
      }
    }, 400);
  }
}

function editActivity(id) { openActivityModal(null, id); }

function confirmDelete(id) {
  if (confirm('¿Eliminar esta actividad? No se puede deshacer.')) {
    state.activities = state.activities.filter(a => a.id !== id);
    saveState();
    refreshDashboardAndAgents();
    showToast('Actividad eliminada');
  }
}

function deleteActivityFromModal() {
  const editId = document.getElementById('actEditId').value;
  if (editId && confirm('¿Eliminar esta actividad?')) {
    state.activities = state.activities.filter(a => a.id !== editId);
    saveState();
    closeActivityModal();
    refreshDashboardAndAgents();
    showToast('Actividad eliminada');
  }
}

/* ================================================================
   MODAL AGENTE
================================================================ */
function openNewAgentModal() {
  document.getElementById('agentModalTitle').textContent = 'Agregar nuevo agente';
  document.getElementById('agentDeleteBtn').style.display = 'none';
  document.getElementById('agentEditId').value = '';
  document.getElementById('newAgentName').value = '';
  document.getElementById('newAgentId').value = '';
  document.getElementById('newAgentInitials').value = '';
  document.getElementById('newAgentStatus').value = 'gray';
  document.getElementById('newAgentTag').value = '';
  document.getElementById('agentModal').classList.add('open');
}

function openEditAgentModal(agentId) {
  const a = state.agents.find(x => x.id === agentId);
  if (!a) return;
  document.getElementById('agentModalTitle').textContent = 'Editar agente';
  document.getElementById('agentDeleteBtn').style.display = 'block';
  document.getElementById('agentEditId').value = agentId;
  document.getElementById('newAgentName').value = a.name;
  document.getElementById('newAgentId').value = a.id;
  document.getElementById('newAgentId').disabled = true;
  document.getElementById('newAgentInitials').value = a.initials;
  document.getElementById('newAgentStatus').value = a.status;
  document.getElementById('newAgentTag').value = a.tag;
  document.getElementById('agentModal').classList.add('open');
}

function closeAgentModal() {
  document.getElementById('agentModal').classList.remove('open');
  document.getElementById('newAgentId').disabled = false;
}

function saveAgent() {
  const editId = document.getElementById('agentEditId').value;
  const name = document.getElementById('newAgentName').value.trim();
  let id = document.getElementById('newAgentId').value.trim().toLowerCase();
  let initials = document.getElementById('newAgentInitials').value.trim().toUpperCase();
  const status = document.getElementById('newAgentStatus').value;
  const tag = document.getElementById('newAgentTag').value.trim() || 'Sin nota';

  if (!name) { showToast('Falta el nombre', 'error'); return; }
  if (!id) id = slugify(name);
  if (!initials) initials = name.slice(0, 1).toUpperCase();

  if (editId) {
    const idx = state.agents.findIndex(a => a.id === editId);
    if (idx >= 0) {
      state.agents[idx] = { ...state.agents[idx], name, initials, status, tag };
    }
  } else {
    if (state.agents.find(a => a.id === id)) { showToast('Ya existe un agente con ese ID', 'error'); return; }
    state.agents.push({ id, name, initials, status, tag });
    // Inicializar ficha vacía
    state.fichas[id] = { perfil: '', fortalezas: '', puntosMejora: '', comentarios: '', materiales: [], pendientes: [] };
    state.currentAgent = id;
  }
  saveState();
  closeAgentModal();
  refreshAllViews();
  showToast(editId ? 'Agente actualizado' : 'Agente agregado');
}

function deleteAgent() {
  const editId = document.getElementById('agentEditId').value;
  if (!editId) return;
  const a = state.agents.find(x => x.id === editId);
  if (!confirm('¿Eliminar al agente "' + a.name + '"? Esto también borra sus actividades y ficha. No se puede deshacer.')) return;

  state.agents = state.agents.filter(x => x.id !== editId);
  state.activities = state.activities.filter(x => x.agent !== editId);
  delete state.fichas[editId];
  if (state.currentAgent === editId) {
    state.currentAgent = state.agents[0] ? state.agents[0].id : null;
  }
  saveState();
  closeAgentModal();
  refreshAllViews();
  showToast('Agente eliminado');
}

/* ================================================================
   MODAL PAGOS
================================================================ */
function openPaymentModal() { document.getElementById('paymentModal').classList.add('open'); }
function closePaymentModal() { document.getElementById('paymentModal').classList.remove('open'); }


/* ================================================================
   EXTRAS (CRUD)
================================================================ */
let extrasDraft = [];

function openExtrasModal() {
  extrasDraft = JSON.parse(JSON.stringify(state.extras || []));
  renderExtrasEditor();
  document.getElementById('extrasModal').classList.add('open');
}

function closeExtrasModal() {
  document.getElementById('extrasModal').classList.remove('open');
}

function renderExtrasEditor() {
  const el = document.getElementById('extrasEditor');
  if (extrasDraft.length === 0) {
    el.innerHTML = '<p style="color:var(--text-muted); font-size:12px; font-style:italic; padding:8px">No hay extras. Agrega uno con el botón inferior.</p>';
    return;
  }
  el.innerHTML = extrasDraft.map((e, i) =>
    '<div class="list-editor-item">' +
      '<div class="list-editor-inputs">' +
        '<input type="text" placeholder="Título" value="' + escapeHtml(e.title || '') + '" oninput="updateExtraField(' + i + ', \'title\', this.value)">' +
        '<textarea placeholder="Descripción" oninput="updateExtraField(' + i + ', \'desc\', this.value)">' + escapeHtml(e.desc || '') + '</textarea>' +
      '</div>' +
      '<button class="list-editor-del" onclick="removeExtraItem(' + i + ')" title="Eliminar">×</button>' +
    '</div>'
  ).join('');
}

function updateExtraField(idx, field, value) {
  if (extrasDraft[idx]) extrasDraft[idx][field] = value;
}

function addExtraItem() {
  extrasDraft.push({ id: 'ex_' + Date.now(), title: '', desc: '' });
  renderExtrasEditor();
}

function removeExtraItem(idx) {
  if (!confirm('¿Eliminar este extra?')) return;
  extrasDraft.splice(idx, 1);
  renderExtrasEditor();
}

function saveExtras() {
  // Filtrar vacíos
  state.extras = extrasDraft.filter(e => (e.title || '').trim() || (e.desc || '').trim());
  saveState();
  closeExtrasModal();
  renderDeliverables();
  showToast('Extras actualizados');
}

/* ================================================================
   NEXT STEPS (CRUD)
================================================================ */
let nextStepsDraft = [];
const ICON_OPTIONS = ['teal', 'amber', 'purple', 'blue', 'coral'];

function openNextStepsModal() {
  nextStepsDraft = JSON.parse(JSON.stringify(state.nextSteps || []));
  renderNextStepsEditor();
  document.getElementById('nextStepsModal').classList.add('open');
}

function closeNextStepsModal() {
  document.getElementById('nextStepsModal').classList.remove('open');
}

function renderNextStepsEditor() {
  const el = document.getElementById('nextStepsEditor');
  if (nextStepsDraft.length === 0) {
    el.innerHTML = '<p style="color:var(--text-muted); font-size:12px; font-style:italic; padding:8px">No hay pasos. Agrega uno con el botón inferior.</p>';
    return;
  }
  el.innerHTML = nextStepsDraft.map((it, i) =>
    '<div class="list-editor-item">' +
      '<div class="list-editor-inputs">' +
        '<input type="text" placeholder="Título del paso" value="' + escapeHtml(it.title || '') + '" oninput="updateNextStepField(' + i + ', \'title\', this.value)">' +
        '<textarea placeholder="Detalle" oninput="updateNextStepField(' + i + ', \'text\', this.value)">' + escapeHtml(it.text || '') + '</textarea>' +
        '<div class="icon-picker">' +
          ICON_OPTIONS.map(c =>
            '<div class="icon-picker-opt ' + c + (it.icon === c ? ' selected' : '') + '" onclick="updateNextStepIcon(' + i + ', \'' + c + '\')" title="' + c + '"></div>'
          ).join('') +
        '</div>' +
      '</div>' +
      '<button class="list-editor-del" onclick="removeNextStepItem(' + i + ')" title="Eliminar">×</button>' +
    '</div>'
  ).join('');
}

function updateNextStepField(idx, field, value) {
  if (nextStepsDraft[idx]) nextStepsDraft[idx][field] = value;
}

function updateNextStepIcon(idx, color) {
  if (nextStepsDraft[idx]) {
    nextStepsDraft[idx].icon = color;
    renderNextStepsEditor();
  }
}

function addNextStepItem() {
  nextStepsDraft.push({ id: 'ns_' + Date.now(), icon: 'teal', title: '', text: '' });
  renderNextStepsEditor();
}

function removeNextStepItem(idx) {
  if (!confirm('¿Eliminar este paso?')) return;
  nextStepsDraft.splice(idx, 1);
  renderNextStepsEditor();
}

function saveNextSteps() {
  state.nextSteps = nextStepsDraft.filter(it => (it.title || '').trim() || (it.text || '').trim());
  saveState();
  closeNextStepsModal();
  renderNextSteps();
  showToast('Próximos pasos actualizados');
}

/* ================================================================
   NUEVO v5.2 · INDUCCIONES (2 cohortes de 5 días)
   Peso en el avance real del programa: 20% combinado (10% cada una)
================================================================ */
let induccionesDraft_v52 = [];

function openInduccionesModal() {
  induccionesDraft_v52 = JSON.parse(JSON.stringify(state.inducciones || []));
  renderInduccionesEditor();
  document.getElementById('induccionesModal').classList.add('open');
}

function closeInduccionesModal() {
  document.getElementById('induccionesModal').classList.remove('open');
}

function renderInduccionesEditor() {
  const el = document.getElementById('induccionesList');
  if (!el) return;
  el.innerHTML = induccionesDraft_v52.map((ind, i) => {
    const statusLabel = { done: 'Realizada', pending: 'Pendiente', scheduled: 'Agendada' }[ind.status] || 'Pendiente';
    return '<div class="induccion-row">' +
      '<div class="induccion-row-head">' +
        '<div class="induccion-row-title">' + escapeHtml(ind.label || ('Inducción ' + (i + 1))) + '</div>' +
        '<span class="induccion-row-status ' + (ind.status || 'pending') + '">' + statusLabel + '</span>' +
      '</div>' +
      '<div class="induccion-row-fields" style="grid-template-columns: 1fr 1fr 1fr">' +
        '<div>' +
          '<label>Estado</label>' +
          '<select onchange="updateInduccionField(' + i + ', \'status\', this.value)">' +
            '<option value="pending" ' + (ind.status === 'pending' ? 'selected' : '') + '>Pendiente · por agendar</option>' +
            '<option value="scheduled" ' + (ind.status === 'scheduled' ? 'selected' : '') + '>Agendada · fechas confirmadas</option>' +
            '<option value="done" ' + (ind.status === 'done' ? 'selected' : '') + '>Realizada · 5 días completados</option>' +
          '</select>' +
        '</div>' +
        '<div>' +
          '<label>Fecha inicio</label>' +
          '<input type="date" value="' + escapeAttr(ind.startDate || '') + '" onchange="updateInduccionField(' + i + ', \'startDate\', this.value)">' +
        '</div>' +
        '<div>' +
          '<label>Fecha fin</label>' +
          '<input type="date" value="' + escapeAttr(ind.endDate || '') + '" onchange="updateInduccionField(' + i + ', \'endDate\', this.value)">' +
        '</div>' +
      '</div>' +
      '<div style="margin-top:10px">' +
        '<label style="font-size:10px; text-transform:uppercase; letter-spacing:0.06em; font-weight:700; color:var(--text-muted); display:block; margin-bottom:4px">Nota</label>' +
        '<input type="text" value="' + escapeAttr(ind.note || '') + '" placeholder="Detalle, cohorte, participantes..." onchange="updateInduccionField(' + i + ', \'note\', this.value)" style="width:100%; padding:8px 10px; border:1px solid var(--gray-300); border-radius:var(--radius-sm); font-size:12px; background:white">' +
      '</div>' +
    '</div>';
  }).join('');
}

function updateInduccionField(idx, field, value) {
  if (induccionesDraft_v52[idx]) {
    induccionesDraft_v52[idx][field] = value;
    /* Re-render solo si cambia el status (afecta badge visual) */
    if (field === 'status') renderInduccionesEditor();
  }
}

function saveInducciones() {
  state.inducciones = induccionesDraft_v52;
  saveState();
  closeInduccionesModal();
  renderDashboard();
  showToast('Inducciones actualizadas');
}

/* Apertura del modal de hook solicitud */
let solicitudHookContext_v41 = null;
function openSolicitudHook(context) {
  solicitudHookContext_v41 = context;
  document.getElementById('solicitudHookProspect').textContent = context.prospect || '(sin nombre)';
  document.getElementById('solicitudHookFollowup').style.display = 'none';
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + 7);
  document.getElementById('solicitudHookNextDate').value = nextDate.toISOString().slice(0, 10);
  document.getElementById('solicitudHookModal').classList.add('open');
}

function closeSolicitudHook() {
  document.getElementById('solicitudHookModal').classList.remove('open');
  solicitudHookContext_v41 = null;
}

function handleSolicitudHookChoice(choice) {
  const ctx = solicitudHookContext_v41;
  if (!ctx) { closeSolicitudHook(); return; }

  if (choice === 'si') {
    /* Registrar nueva actividad de tipo Solicitud con fecha de hoy */
    const today = new Date().toISOString().slice(0, 10);
    state.activities.push({
      id: uid(),
      agent: ctx.agent,
      date: today,
      type: 'solicitud',
      result: 'ok',
      prospect: ctx.prospect,
      note: 'Solicitud firmada tras cierre del ' + ctx.date + ' (auto-registrada via hook v4.1)',
      anfNecesidades: [],
    });
    saveState();
    closeSolicitudHook();
    refreshDashboardAndAgents();
    showToast('Solicitud registrada');
  } else if (choice === 'seguimiento') {
    /* Mostrar sub-form de fecha */
    document.getElementById('solicitudHookFollowup').style.display = 'block';
  } else if (choice === 'noCerro') {
    /* Solo confirmar cierre sin venta */
    closeSolicitudHook();
    showToast('Cierre registrado sin solicitud');
  }
}

function confirmSolicitudHookFollowup() {
  const ctx = solicitudHookContext_v41;
  if (!ctx) { closeSolicitudHook(); return; }
  const nextDate = document.getElementById('solicitudHookNextDate').value;
  if (!nextDate) { showToast('Falta la fecha de siguiente contacto', 'error'); return; }

  /* Anotar el seguimiento dentro de la nota de la actividad de cierre recién creada */
  const match = state.activities.filter(a =>
    a.agent === ctx.agent &&
    a.date === ctx.date &&
    a.type === 'cierre' &&
    (a.prospect || '') === ctx.prospect
  ).pop();
  if (match) {
    const followupNote = '[Seguimiento pendiente · próximo contacto: ' + nextDate + ']';
    match.note = (match.note || '').trim();
    if (match.note && !match.note.includes('[Seguimiento pendiente')) {
      match.note = match.note + '\n' + followupNote;
    } else if (!match.note) {
      match.note = followupNote;
    }
    match.followupDate_v41 = nextDate;
    saveState();
    renderAgentPanels();
  }
  closeSolicitudHook();
  showToast('Seguimiento agendado para ' + formatDate(nextDate));
}

/* Modal CRUD cierres */
let _cierreEditId_v53 = null;

function openCierreModal(prefillAgentId, editId) {
  _cierreEditId_v53 = editId || null;
  /* Poblar dropdown agentes */
  const sel = document.getElementById('cierreAgente');
  sel.innerHTML = state.agents.map(a => '<option value="' + a.id + '">' + escapeHtml(a.name) + '</option>').join('');
  const title = document.getElementById('cierreModalTitle');
  const delBtn = document.getElementById('cierreDeleteBtn');
  if (editId) {
    const c = getCierres().find(x => x.id === editId);
    if (!c) return;
    title.textContent = 'Editar cierre pendiente';
    delBtn.style.display = 'block';
    sel.value = c.agente || '';
    document.getElementById('cierreProspecto').value = c.prospecto || '';
    document.getElementById('cierreProducto').value = c.producto || '';
    document.getElementById('cierreMonto').value = c.monto || '';
    document.getElementById('cierreEstado').value = c.estado || 'pendiente';
    document.getElementById('cierrePrioridad').value = c.prioridad || 'media';
    document.getElementById('cierreFechaLimite').value = c.fechaLimite || '';
    document.getElementById('cierreNota').value = c.nota || '';
  } else {
    title.textContent = 'Agregar cierre pendiente';
    delBtn.style.display = 'none';
    sel.value = prefillAgentId || (state.agents[0] && state.agents[0].id) || '';
    document.getElementById('cierreProspecto').value = '';
    document.getElementById('cierreProducto').value = '';
    document.getElementById('cierreMonto').value = '';
    document.getElementById('cierreEstado').value = 'pendiente';
    document.getElementById('cierrePrioridad').value = 'media';
    document.getElementById('cierreFechaLimite').value = '';
    document.getElementById('cierreNota').value = '';
  }
  document.getElementById('cierreModal').classList.add('open');
}

function closeCierreModal() {
  document.getElementById('cierreModal').classList.remove('open');
  _cierreEditId_v53 = null;
}

function saveCierre() {
  const data = {
    agente: document.getElementById('cierreAgente').value,
    prospecto: document.getElementById('cierreProspecto').value.trim(),
    producto: document.getElementById('cierreProducto').value.trim(),
    monto: document.getElementById('cierreMonto').value.trim(),
    estado: document.getElementById('cierreEstado').value,
    prioridad: document.getElementById('cierrePrioridad').value,
    fechaLimite: document.getElementById('cierreFechaLimite').value,
    nota: document.getElementById('cierreNota').value.trim(),
  };
  if (!data.prospecto) { showToast('Falta el nombre del prospecto', 'error'); return; }
  if (!state.cierres) state.cierres = [];
  if (_cierreEditId_v53) {
    const idx = state.cierres.findIndex(c => c.id === _cierreEditId_v53);
    if (idx >= 0) state.cierres[idx] = { ...state.cierres[idx], ...data };
  } else {
    state.cierres.push({ id: uid(), ...data });
  }
  saveState();
  closeCierreModal();
  renderCierresTable_v53();
  renderCierresAgent_v53(data.agente);
  showToast(_cierreEditId_v53 ? 'Cierre actualizado' : 'Cierre agregado');
}

function deleteCierreFromModal() {
  if (!_cierreEditId_v53) return;
  if (!confirm('¿Eliminar este cierre pendiente?')) return;
  const c = getCierres().find(x => x.id === _cierreEditId_v53);
  state.cierres = state.cierres.filter(x => x.id !== _cierreEditId_v53);
  saveState();
  closeCierreModal();
  renderCierresTable_v53();
  if (c) renderCierresAgent_v53(c.agente);
  showToast('Cierre eliminado');
}

function deleteCierre(id) {
  if (!confirm('¿Eliminar este cierre pendiente?')) return;
  const c = getCierres().find(x => x.id === id);
  state.cierres = (state.cierres || []).filter(x => x.id !== id);
  saveState();
  renderCierresTable_v53();
  if (c) renderCierresAgent_v53(c.agente);
  showToast('Cierre eliminado');
}
