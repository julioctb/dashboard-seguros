/* ================================================================
   STORE ACTIONS · DELIVERABLES AND CIERRES
================================================================ */
function ensureCierresState() {
  if (!Array.isArray(state.cierres)) state.cierres = [];
}

function syncLocalCierre(cierre) {
  ensureCierresState();
  const index = state.cierres.findIndex(entry => entry.id === cierre.id);
  if (index >= 0) {
    state.cierres[index] = cierre;
  } else {
    state.cierres.push(cierre);
  }
}

async function upsertCierre(data, options) {
  ensureCierresState();
  const editId = options && options.editId ? options.editId : '';
  const payload = {
    agente: data.agente,
    prospecto: (data.prospecto || '').trim(),
    producto: (data.producto || '').trim(),
    monto: (data.monto || '').trim(),
    estado: data.estado,
    prioridad: data.prioridad,
    fechaLimite: data.fechaLimite,
    nota: (data.nota || '').trim(),
  };
  let previous = null;
  let current = null;

  if (typeof isPortalAuthEnabled === 'function' && isPortalAuthEnabled() && typeof isAdminUser === 'function' && !isAdminUser()) {
    assertCanEditAgentScope(payload.agente);

    if (editId) {
      const existing = state.cierres.find(cierre => cierre.id === editId);
      if (!existing) throw new Error('No se encontró el cierre a editar');
      previous = { ...existing };
      current = { ...existing, ...payload, id: editId };
    } else {
      current = { id: uid(), ...payload };
    }

    const savedCierre = await requestSupabaseRpc('portal_upsert_my_cierre', { p_payload: current });
    current = savedCierre && typeof savedCierre === 'object' ? savedCierre : current;
    syncLocalCierre(current);
    return { previous, current, isNew: !editId, isEdit: Boolean(editId) };
  }

  if (editId) {
    const index = state.cierres.findIndex(cierre => cierre.id === editId);
    if (index < 0) throw new Error('No se encontró el cierre a editar');
    previous = { ...state.cierres[index] };
    current = { ...state.cierres[index], ...payload };
    state.cierres[index] = current;
  } else {
    current = { id: uid(), ...payload };
    state.cierres.push(current);
  }

  saveState();
  return { previous, current, isNew: !editId, isEdit: Boolean(editId) };
}

async function deleteCierre(id) {
  ensureCierresState();
  const existing = state.cierres.find(cierre => cierre.id === id);
  if (!existing) return null;

  if (typeof isPortalAuthEnabled === 'function' && isPortalAuthEnabled() && typeof isAdminUser === 'function' && !isAdminUser()) {
    assertCanEditAgentScope(existing.agente);
    await requestSupabaseRpc('portal_delete_my_cierre', { p_id: id });
    state.cierres = state.cierres.filter(cierre => cierre.id !== id);
    return existing;
  }

  state.cierres = state.cierres.filter(cierre => cierre.id !== id);
  saveState();
  return existing;
}

function saveExtrasList(items) {
  state.extras = (items || []).filter(item => (item.title || '').trim() || (item.desc || '').trim());
  saveState();
  return state.extras;
}

function saveNextStepsList(items) {
  state.nextSteps = (items || []).filter(item => (item.title || '').trim() || (item.text || '').trim());
  saveState();
  return state.nextSteps;
}

function saveInduccionesList(items) {
  state.inducciones = Array.isArray(items) ? items : [];
  saveState();
  return state.inducciones;
}

function updateDeliverableField(key, field, value) {
  if (!state.deliverables[key]) state.deliverables[key] = {};
  state.deliverables[key][field] = value;
  saveState();
  return state.deliverables[key];
}
