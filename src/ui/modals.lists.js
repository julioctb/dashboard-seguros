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
  el.innerHTML = extrasDraft.map((extra, index) =>
    '<div class="list-editor-item">' +
      '<div class="list-editor-inputs">' +
        '<input type="text" placeholder="Título" value="' + escapeHtml(extra.title || '') + '" oninput="updateExtraField(' + index + ', \'title\', this.value)">' +
        '<textarea placeholder="Descripción" oninput="updateExtraField(' + index + ', \'desc\', this.value)">' + escapeHtml(extra.desc || '') + '</textarea>' +
      '</div>' +
      '<button class="list-editor-del" onclick="removeExtraItem(' + index + ')" title="Eliminar">×</button>' +
    '</div>'
  ).join('');
}

function updateExtraField(index, field, value) {
  if (extrasDraft[index]) extrasDraft[index][field] = value;
}

function addExtraItem() {
  extrasDraft.push({ id: 'ex_' + Date.now(), title: '', desc: '' });
  renderExtrasEditor();
}

function removeExtraItem(index) {
  if (!confirm('¿Eliminar este extra?')) return;
  extrasDraft.splice(index, 1);
  renderExtrasEditor();
}

function saveExtras() {
  saveExtrasList(extrasDraft);
  closeExtrasModal();
  refreshUI('deliverables');
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
  el.innerHTML = nextStepsDraft.map((item, index) =>
    '<div class="list-editor-item">' +
      '<div class="list-editor-inputs">' +
        '<input type="text" placeholder="Título del paso" value="' + escapeHtml(item.title || '') + '" oninput="updateNextStepField(' + index + ', \'title\', this.value)">' +
        '<textarea placeholder="Detalle" oninput="updateNextStepField(' + index + ', \'text\', this.value)">' + escapeHtml(item.text || '') + '</textarea>' +
        '<div class="icon-picker">' +
          ICON_OPTIONS.map(color =>
            '<div class="icon-picker-opt ' + color + (item.icon === color ? ' selected' : '') + '" onclick="updateNextStepIcon(' + index + ', \'' + color + '\')" title="' + color + '"></div>'
          ).join('') +
        '</div>' +
      '</div>' +
      '<button class="list-editor-del" onclick="removeNextStepItem(' + index + ')" title="Eliminar">×</button>' +
    '</div>'
  ).join('');
}

function updateNextStepField(index, field, value) {
  if (nextStepsDraft[index]) nextStepsDraft[index][field] = value;
}

function updateNextStepIcon(index, color) {
  if (nextStepsDraft[index]) {
    nextStepsDraft[index].icon = color;
    renderNextStepsEditor();
  }
}

function addNextStepItem() {
  nextStepsDraft.push({ id: 'ns_' + Date.now(), icon: 'teal', title: '', text: '' });
  renderNextStepsEditor();
}

function removeNextStepItem(index) {
  if (!confirm('¿Eliminar este paso?')) return;
  nextStepsDraft.splice(index, 1);
  renderNextStepsEditor();
}

function saveNextSteps() {
  saveNextStepsList(nextStepsDraft);
  closeNextStepsModal();
  refreshUI('dashboard');
  showToast('Próximos pasos actualizados');
}

/* ================================================================
   INDUCCIONES
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
  el.innerHTML = induccionesDraft_v52.map((induccion, index) => {
    const statusLabel = { done: 'Realizada', pending: 'Pendiente', scheduled: 'Agendada' }[induccion.status] || 'Pendiente';
    return '<div class="induccion-row">' +
      '<div class="induccion-row-head">' +
        '<div class="induccion-row-title">' + escapeHtml(induccion.label || ('Inducción ' + (index + 1))) + '</div>' +
        '<span class="induccion-row-status ' + (induccion.status || 'pending') + '">' + statusLabel + '</span>' +
      '</div>' +
      '<div class="induccion-row-fields" style="grid-template-columns: 1fr 1fr 1fr">' +
        '<div>' +
          '<label>Estado</label>' +
          '<select onchange="updateInduccionField(' + index + ', \'status\', this.value)">' +
            '<option value="pending" ' + (induccion.status === 'pending' ? 'selected' : '') + '>Pendiente · por agendar</option>' +
            '<option value="scheduled" ' + (induccion.status === 'scheduled' ? 'selected' : '') + '>Agendada · fechas confirmadas</option>' +
            '<option value="done" ' + (induccion.status === 'done' ? 'selected' : '') + '>Realizada · 5 días completados</option>' +
          '</select>' +
        '</div>' +
        '<div>' +
          '<label>Fecha inicio</label>' +
          '<input type="date" value="' + escapeAttr(induccion.startDate || '') + '" onchange="updateInduccionField(' + index + ', \'startDate\', this.value)">' +
        '</div>' +
        '<div>' +
          '<label>Fecha fin</label>' +
          '<input type="date" value="' + escapeAttr(induccion.endDate || '') + '" onchange="updateInduccionField(' + index + ', \'endDate\', this.value)">' +
        '</div>' +
      '</div>' +
      '<div style="margin-top:10px">' +
        '<label style="font-size:10px; text-transform:uppercase; letter-spacing:0.06em; font-weight:700; color:var(--text-muted); display:block; margin-bottom:4px">Nota</label>' +
        '<input type="text" value="' + escapeAttr(induccion.note || '') + '" placeholder="Detalle, cohorte, participantes..." onchange="updateInduccionField(' + index + ', \'note\', this.value)" style="width:100%; padding:8px 10px; border:1px solid var(--gray-300); border-radius:var(--radius-sm); font-size:12px; background:white">' +
      '</div>' +
    '</div>';
  }).join('');
}

function updateInduccionField(index, field, value) {
  if (!induccionesDraft_v52[index]) return;
  induccionesDraft_v52[index][field] = value;
  if (field === 'status') renderInduccionesEditor();
}

function saveInducciones() {
  saveInduccionesList(induccionesDraft_v52);
  closeInduccionesModal();
  refreshUI('dashboard');
  showToast('Inducciones actualizadas');
}
