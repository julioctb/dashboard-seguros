/* ================================================================
   MODAL ACTIVIDAD
================================================================ */
function populateAgentDropdown() {
  const select = document.getElementById('actAgent');
  select.innerHTML = state.agents.map(agent => '<option value="' + agent.id + '">' + escapeHtml(agent.name) + '</option>').join('');
}

function populateActivityCatalogDropdowns(selectedType, selectedResult) {
  const typeSelect = document.getElementById('actType');
  const resultSelect = document.getElementById('actResult');
  if (typeSelect) {
    typeSelect.innerHTML = buildOptionsHtml(getCatalog('activityTypes'), selectedType || getCatalogSemanticValue('activityTypes', 'inicial'));
  }
  if (resultSelect) {
    resultSelect.innerHTML = buildOptionsHtml(getCatalog('activityResults'), selectedResult || getCatalogSemanticValue('activityResults', 'ok'));
  }
}

function populateAgentStatusDropdown(selectedStatus) {
  const statusSelect = document.getElementById('newAgentStatus');
  if (!statusSelect) return;
  statusSelect.innerHTML = buildOptionsHtml(getCatalog('agentStatuses'), selectedStatus || getCatalogSemanticValue('agentStatuses', 'gray'));
}

function syncActivityTypeFields() {
  const type = document.getElementById('actType').value;
  const polizaFields = document.getElementById('actPolizaFields');
  const cierreFields = document.getElementById('actCierreFields');
  if (polizaFields) polizaFields.style.display = type === getCatalogSemanticValue('activityTypes', 'poliza') ? 'block' : 'none';
  if (cierreFields) cierreFields.style.display = type === getCatalogSemanticValue('activityTypes', 'cierre') ? 'block' : 'none';
}

function onTypeChange() {
  syncActivityTypeFields();
}

function setFumador(value) {
  document.querySelectorAll('#fumadorToggle .fumador-opt').forEach(button => {
    button.classList.toggle('selected', button.dataset.val === value);
  });
}

function getFumador() {
  const selected = document.querySelector('#fumadorToggle .fumador-opt.selected');
  return selected ? selected.dataset.val : 'nd';
}

function resetFumador() {
  setFumador('nd');
}

function onAnfCheckChange(el) {
  const label = el.closest('.anf-check');
  if (label) label.classList.toggle('checked', el.checked);
}

function getAnfNecesidades() {
  return Array.from(document.querySelectorAll('#anfChecks input[type=checkbox]:checked')).map(checkbox => checkbox.value);
}

function setAnfNecesidades(values) {
  const selected = new Set(values || []);
  document.querySelectorAll('#anfChecks input[type=checkbox]').forEach(checkbox => {
    checkbox.checked = selected.has(checkbox.value);
    const label = checkbox.closest('.anf-check');
    if (label) label.classList.toggle('checked', checkbox.checked);
  });
}

function openActivityModal(prefillAgent, editId, prefill) {
  if (typeof isPortalAuthEnabled === 'function' && isPortalAuthEnabled() && !isAdminUser()) {
    const targetAgentId = editId
      ? ((state.activities.find(item => item.id === editId) || {}).agent || prefillAgent || getAssignedAgentId())
      : ((prefill && prefill.agent) || prefillAgent || getAssignedAgentId());
    try {
      assertCanEditAgentScope(targetAgentId);
    } catch (error) {
      showToast(error.message || 'No puedes editar este expediente', 'error');
      return;
    }
  }

  populateAgentDropdown();
  populateActivityCatalogDropdowns();
  document.getElementById('modalTitle').textContent = editId ? 'Editar actividad' : 'Registrar actividad';
  document.getElementById('deleteBtn').style.display = editId ? 'block' : 'none';
  document.getElementById('actEditId').value = editId || '';

  if (editId) {
    const activity = state.activities.find(item => item.id === editId);
    if (activity) {
      populateActivityCatalogDropdowns(activity.type, activity.result);
      document.getElementById('actAgent').value = activity.agent;
      document.getElementById('actDate').value = activity.date;
      document.getElementById('actType').value = activity.type;
      document.getElementById('actResult').value = activity.result;
      document.getElementById('actProspect').value = activity.prospect || '';
      document.getElementById('actNote').value = activity.note || '';
      document.getElementById('actANFSummary').value = activity.anfSummary || '';
      document.getElementById('actANFMonto').value = activity.anfMonto || '';
      document.getElementById('actANFNota').value = activity.anfNota || '';
      document.getElementById('actPrima').value = activity.prima || '';
      document.getElementById('actCierreProducto').value = activity.productoCotizado || '';
      setFumador(activity.fumador || 'nd');
      setAnfNecesidades(activity.anfNecesidades || []);
    }
  } else {
    document.getElementById('actAgent').value = (prefill && prefill.agent) || prefillAgent || state.currentAgent || (state.agents[0] && state.agents[0].id);
    document.getElementById('actDate').value = (prefill && prefill.date) || new Date().toISOString().slice(0, 10);
    document.getElementById('actType').value = (prefill && prefill.type) || getCatalogSemanticValue('activityTypes', 'inicial');
    document.getElementById('actResult').value = (prefill && prefill.result) || getCatalogSemanticValue('activityResults', 'ok');
    document.getElementById('actProspect').value = (prefill && prefill.prospect) || '';
    document.getElementById('actNote').value = (prefill && prefill.note) || '';
    document.getElementById('actANFSummary').value = (prefill && prefill.anfSummary) || '';
    document.getElementById('actANFMonto').value = (prefill && prefill.anfMonto) || '';
    document.getElementById('actANFNota').value = (prefill && prefill.anfNota) || '';
    document.getElementById('actPrima').value = (prefill && prefill.prima) || '';
    document.getElementById('actCierreProducto').value = (prefill && prefill.productoCotizado) || '';
    setFumador((prefill && prefill.fumador) || 'nd');
    setAnfNecesidades((prefill && prefill.anfNecesidades) || []);
  }

  syncActivityTypeFields();
  document.getElementById('activityModal').classList.add('open');
}

function closeActivityModal() {
  document.getElementById('activityModal').classList.remove('open');
}

function readActivityFormData() {
  return {
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
    productoCotizado: document.getElementById('actCierreProducto').value.trim(),
    fumador: getFumador(),
  };
}

async function saveActivity() {
  const editId = document.getElementById('actEditId').value;
  const data = readActivityFormData();
  if (!data.date) {
    showToast('Falta la fecha', 'error');
    return;
  }

  try {
    const result = await upsertActivity(data, { editId });
    closeActivityModal();
    refreshUI('all');
    showToast(editId ? 'Actividad actualizada' : 'Actividad registrada');
    await afterActivitySaved(result);
  } catch (error) {
    console.error('Save activity error', error);
    showToast(error.message || 'No se pudo guardar la actividad', 'error');
  }
}

function editActivity(id) {
  openActivityModal(null, id);
}

async function confirmDeleteActivity(id) {
  if (!confirm('¿Eliminar esta actividad? No se puede deshacer.')) return;
  try {
    await deleteActivity(id);
    refreshUI('all');
    showToast('Actividad eliminada');
  } catch (error) {
    showToast(error.message || 'No se pudo eliminar la actividad', 'error');
  }
}

async function deleteActivityFromModal() {
  const editId = document.getElementById('actEditId').value;
  if (!editId || !confirm('¿Eliminar esta actividad?')) return;
  try {
    await deleteActivity(editId);
    closeActivityModal();
    refreshUI('all');
    showToast('Actividad eliminada');
  } catch (error) {
    showToast(error.message || 'No se pudo eliminar la actividad', 'error');
  }
}

/* ================================================================
   MODAL AGENTE
================================================================ */
function openNewAgentModal() {
  if (typeof isPortalAuthEnabled === 'function' && isPortalAuthEnabled() && !isAdminUser()) {
    showToast('Solo el administrador puede crear agentes', 'error');
    return;
  }
  populateAgentStatusDropdown();
  document.getElementById('agentModalTitle').textContent = 'Agregar nuevo agente';
  document.getElementById('agentDeleteBtn').style.display = 'none';
  document.getElementById('agentEditId').value = '';
  document.getElementById('newAgentName').value = '';
  document.getElementById('newAgentId').value = '';
  document.getElementById('newAgentInitials').value = '';
  document.getElementById('newAgentStatus').value = getCatalogSemanticValue('agentStatuses', 'gray');
  document.getElementById('newAgentTag').value = '';
  document.getElementById('newAgentId').disabled = false;
  document.getElementById('agentModal').classList.add('open');
}

function openEditAgentModal(agentId) {
  if (typeof isPortalAuthEnabled === 'function' && isPortalAuthEnabled() && !isAdminUser()) {
    showToast('Solo el administrador puede editar agentes', 'error');
    return;
  }
  const agent = state.agents.find(item => item.id === agentId);
  if (!agent) return;
  populateAgentStatusDropdown(agent.status);
  document.getElementById('agentModalTitle').textContent = 'Editar agente';
  document.getElementById('agentDeleteBtn').style.display = 'block';
  document.getElementById('agentEditId').value = agentId;
  document.getElementById('newAgentName').value = agent.name;
  document.getElementById('newAgentId').value = agent.id;
  document.getElementById('newAgentId').disabled = true;
  document.getElementById('newAgentInitials').value = agent.initials;
  document.getElementById('newAgentStatus').value = agent.status;
  document.getElementById('newAgentTag').value = agent.tag;
  document.getElementById('agentModal').classList.add('open');
}

function closeAgentModal() {
  document.getElementById('agentModal').classList.remove('open');
  document.getElementById('newAgentId').disabled = false;
}

function saveAgent() {
  if (typeof isPortalAuthEnabled === 'function' && isPortalAuthEnabled() && !isAdminUser()) {
    showToast('Solo el administrador puede guardar agentes', 'error');
    return;
  }
  const editId = document.getElementById('agentEditId').value;
  const data = {
    name: document.getElementById('newAgentName').value.trim(),
    id: document.getElementById('newAgentId').value.trim(),
    initials: document.getElementById('newAgentInitials').value.trim(),
    status: document.getElementById('newAgentStatus').value,
    tag: document.getElementById('newAgentTag').value.trim(),
  };

  if (!data.name) {
    showToast('Falta el nombre', 'error');
    return;
  }

  try {
    upsertAgent(data, { editId });
    closeAgentModal();
    refreshUI('all');
    showToast(editId ? 'Agente actualizado' : 'Agente agregado');
  } catch (error) {
    console.error('Save agent error', error);
    showToast(error.message || 'No se pudo guardar el agente', 'error');
  }
}

function deleteAgentFromModal() {
  if (typeof isPortalAuthEnabled === 'function' && isPortalAuthEnabled() && !isAdminUser()) {
    showToast('Solo el administrador puede eliminar agentes', 'error');
    return;
  }
  const editId = document.getElementById('agentEditId').value;
  if (!editId) return;
  const agent = state.agents.find(item => item.id === editId);
  if (!agent) return;
  if (!confirm('¿Eliminar al agente "' + agent.name + '"? Esto también borra sus actividades y ficha. No se puede deshacer.')) return;
  deleteAgent(editId);
  closeAgentModal();
  refreshUI('all');
  showToast('Agente eliminado');
}

/* ================================================================
   MODAL PAGOS
================================================================ */
function openPaymentModal() {
  document.getElementById('paymentModal').classList.add('open');
}

function closePaymentModal() {
  document.getElementById('paymentModal').classList.remove('open');
}
