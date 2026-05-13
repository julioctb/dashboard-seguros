/* ================================================================
   AGENT FICHA
================================================================ */
function renderAgentFichaPanel(agentId, ficha) {
  const readOnly = typeof isPortalAuthEnabled === 'function' && isPortalAuthEnabled() && !isAdminUser();
  const readonlyAttr = readOnly ? ' readonly' : '';
  const disabledAttr = readOnly ? ' disabled' : '';
  const materiales = ficha.materiales || [];
  const pendientes = ficha.pendientes || [];
  return '<div class="subpanel ' + (state.currentSubtab === 'ficha' ? 'active' : '') + '" id="sub-ficha">' +
    '<div class="ficha-grid">' +
      '<div class="ficha-card full">' +
        '<div class="ficha-head"><h4>Perfil del agente</h4><span class="autosave-ind">' + (readOnly ? 'Solo lectura' : 'Autoguardado') + '</span></div>' +
        '<div class="ficha-body"><textarea class="ficha-textarea" data-field="perfil" onchange="saveFichaField(this)" placeholder="Descripción general..."' + readonlyAttr + '>' + escapeHtml(ficha.perfil || '') + '</textarea></div>' +
      '</div>' +
      '<div class="ficha-card"><div class="ficha-head"><h4>Fortalezas</h4></div>' +
        '<div class="ficha-body"><textarea class="ficha-textarea" data-field="fortalezas" onchange="saveFichaField(this)" placeholder="Habilidades observadas..."' + readonlyAttr + '>' + escapeHtml(ficha.fortalezas || '') + '</textarea></div>' +
      '</div>' +
      '<div class="ficha-card"><div class="ficha-head"><h4>Puntos de mejora</h4></div>' +
        '<div class="ficha-body"><textarea class="ficha-textarea" data-field="puntosMejora" onchange="saveFichaField(this)" placeholder="Áreas a trabajar..."' + readonlyAttr + '>' + escapeHtml(ficha.puntosMejora || '') + '</textarea></div>' +
      '</div>' +
      '<div class="ficha-card full"><div class="ficha-head"><h4>Comentarios y observaciones</h4></div>' +
        '<div class="ficha-body"><textarea class="ficha-textarea" data-field="comentarios" onchange="saveFichaField(this)" placeholder="Observaciones tuyas..."' + readonlyAttr + '>' + escapeHtml(ficha.comentarios || '') + '</textarea></div>' +
      '</div>' +
      '<div class="ficha-card"><div class="ficha-head"><h4>Materiales compartidos</h4></div>' +
        '<div class="ficha-body"><div class="list-editable">' +
        materiales.map(item => renderListItem(item, 'materiales', readOnly)).join('') +
        '</div>' + (readOnly ? '' : '<button class="list-add" onclick="addListItem(\'materiales\')" style="margin-top:10px">+ Agregar material</button>') + '</div>' +
      '</div>' +
      '<div class="ficha-card"><div class="ficha-head"><h4>Pendientes y próximos pasos</h4></div>' +
        '<div class="ficha-body"><div class="list-editable">' +
        pendientes.map(item => renderListItem(item, 'pendientes', readOnly)).join('') +
        '</div>' + (readOnly ? '' : '<button class="list-add" onclick="addListItem(\'pendientes\')" style="margin-top:10px">+ Agregar pendiente</button>') + '</div>' +
      '</div>' +
    '</div>' +
  '</div>';
}

function renderListItem(item, type, readOnly) {
  const readonlyAttr = readOnly ? ' readonly' : '';
  const disabledAttr = readOnly ? ' disabled' : '';
  return '<div class="list-item ' + (item.done ? 'done' : '') + '" data-id="' + item.id + '">' +
    '<div class="list-check ' + (item.done ? 'checked' : '') + (readOnly ? ' disabled' : '') + '"' + (readOnly ? '' : ' onclick="toggleListItem(\'' + type + '\',\'' + item.id + '\')"') + '></div>' +
    '<input class="list-input ' + (item.done ? 'done' : '') + '" type="text" value="' + escapeHtml(item.text || '') + '" onchange="updateListItem(\'' + type + '\',\'' + item.id + '\',\'text\',this.value)" placeholder="Descripción..."' + readonlyAttr + '>' +
    '<input class="list-date" type="date" value="' + (item.date || '') + '" onchange="updateListItem(\'' + type + '\',\'' + item.id + '\',\'date\',this.value)"' + disabledAttr + '>' +
    (readOnly ? '' : '<button class="list-remove" onclick="removeListItem(\'' + type + '\',\'' + item.id + '\')" title="Eliminar">×</button>') +
    '</div>';
}

function saveFichaField(el) {
  if (typeof isPortalAuthEnabled === 'function' && isPortalAuthEnabled() && !isAdminUser()) {
    showToast('La ficha operativa es solo de lectura para tu rol', 'error');
    return;
  }
  const field = el.dataset.field;
  const agent = state.currentAgent;
  updateFichaFieldValue(agent, field, el.value);
  showToast('Ficha actualizada');
}

function addListItem(type) {
  if (typeof isPortalAuthEnabled === 'function' && isPortalAuthEnabled() && !isAdminUser()) {
    showToast('La ficha operativa es solo de lectura para tu rol', 'error');
    return;
  }
  const agent = state.currentAgent;
  addFichaListItem(agent, type);
  renderAgentPanels();
}

function updateListItem(type, id, field, value) {
  if (typeof isPortalAuthEnabled === 'function' && isPortalAuthEnabled() && !isAdminUser()) return;
  const agent = state.currentAgent;
  updateFichaListItemValue(agent, type, id, field, value);
}

function toggleListItem(type, id) {
  if (typeof isPortalAuthEnabled === 'function' && isPortalAuthEnabled() && !isAdminUser()) return;
  const agent = state.currentAgent;
  toggleFichaListItemState(agent, type, id);
  renderAgentPanels();
}

function removeListItem(type, id) {
  if (typeof isPortalAuthEnabled === 'function' && isPortalAuthEnabled() && !isAdminUser()) return;
  if (!confirm('¿Eliminar este elemento?')) return;
  const agent = state.currentAgent;
  removeFichaListItemById(agent, type, id);
  renderAgentPanels();
}
