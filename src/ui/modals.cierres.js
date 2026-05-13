/* ================================================================
   CIERRES PENDIENTES
================================================================ */
let cierreEditId_v53 = null;

function populateCierreCatalogDropdowns(selectedEstado, selectedPrioridad) {
  const estadoSelect = document.getElementById('cierreEstado');
  const prioridadSelect = document.getElementById('cierrePrioridad');
  if (estadoSelect) {
    estadoSelect.innerHTML = buildOptionsHtml(getCatalog('cierreStatuses'), selectedEstado || getCatalogSemanticValue('cierreStatuses', 'pendiente'));
  }
  if (prioridadSelect) {
    prioridadSelect.innerHTML = buildOptionsHtml(getCatalog('cierrePriorities'), selectedPrioridad || getCatalogSemanticValue('cierrePriorities', 'media'));
  }
}

function openCierreModal(prefillAgentId, editId) {
  cierreEditId_v53 = editId || null;
  const select = document.getElementById('cierreAgente');
  select.innerHTML = state.agents.map(agent => '<option value="' + agent.id + '">' + escapeHtml(agent.name) + '</option>').join('');
  const title = document.getElementById('cierreModalTitle');
  const deleteButton = document.getElementById('cierreDeleteBtn');

  if (editId) {
    const cierre = (state.cierres || []).find(item => item.id === editId);
    if (!cierre) return;
    title.textContent = 'Editar cierre pendiente';
    deleteButton.style.display = 'block';
    populateCierreCatalogDropdowns(cierre.estado, cierre.prioridad);
    select.value = cierre.agente || '';
    document.getElementById('cierreProspecto').value = cierre.prospecto || '';
    document.getElementById('cierreProducto').value = cierre.producto || '';
    document.getElementById('cierreMonto').value = cierre.monto || '';
    document.getElementById('cierreEstado').value = cierre.estado || getCatalogSemanticValue('cierreStatuses', 'pendiente');
    document.getElementById('cierrePrioridad').value = cierre.prioridad || getCatalogSemanticValue('cierrePriorities', 'media');
    document.getElementById('cierreFechaLimite').value = cierre.fechaLimite || '';
    document.getElementById('cierreNota').value = cierre.nota || '';
  } else {
    title.textContent = 'Agregar cierre pendiente';
    deleteButton.style.display = 'none';
    populateCierreCatalogDropdowns();
    select.value = prefillAgentId || (state.agents[0] && state.agents[0].id) || '';
    document.getElementById('cierreProspecto').value = '';
    document.getElementById('cierreProducto').value = '';
    document.getElementById('cierreMonto').value = '';
    document.getElementById('cierreEstado').value = getCatalogSemanticValue('cierreStatuses', 'pendiente');
    document.getElementById('cierrePrioridad').value = getCatalogSemanticValue('cierrePriorities', 'media');
    document.getElementById('cierreFechaLimite').value = '';
    document.getElementById('cierreNota').value = '';
  }

  document.getElementById('cierreModal').classList.add('open');
}

function closeCierreModal() {
  document.getElementById('cierreModal').classList.remove('open');
  cierreEditId_v53 = null;
}

function saveCierre() {
  const isEdit = Boolean(cierreEditId_v53);
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

  if (!data.prospecto) {
    showToast('Falta el nombre del prospecto', 'error');
    return;
  }

  try {
    upsertCierre(data, { editId: cierreEditId_v53 });
    closeCierreModal();
    refreshUI('all');
    showToast(isEdit ? 'Cierre actualizado' : 'Cierre agregado');
  } catch (error) {
    console.error('Save cierre error', error);
    showToast(error.message || 'No se pudo guardar el cierre', 'error');
  }
}

function deleteCierreFromModal() {
  if (!cierreEditId_v53 || !confirm('¿Eliminar este cierre pendiente?')) return;
  deleteCierre(cierreEditId_v53);
  closeCierreModal();
  refreshUI('all');
  showToast('Cierre eliminado');
}

function confirmDeleteCierre(id) {
  if (!confirm('¿Eliminar este cierre pendiente?')) return;
  deleteCierre(id);
  refreshUI('all');
  showToast('Cierre eliminado');
}
