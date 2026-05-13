/* ================================================================
   STORE ACTIONS · AGENTS
================================================================ */
function buildAgentPayload(data) {
  const name = data.name.trim();
  const id = (data.id || slugify(name)).trim().toLowerCase();
  return {
    id,
    name,
    initials: (data.initials || name.slice(0, 1)).trim().toUpperCase(),
    status: data.status,
    tag: (data.tag || 'Sin nota').trim(),
  };
}

function upsertAgent(data, options) {
  const editId = options && options.editId ? options.editId : '';
  const payload = buildAgentPayload(data);
  let previous = null;
  let current = null;

  if (editId) {
    const index = state.agents.findIndex(agent => agent.id === editId);
    if (index < 0) throw new Error('No se encontró el agente a editar');
    previous = { ...state.agents[index] };
    current = { ...state.agents[index], ...payload, id: editId };
    state.agents[index] = current;
  } else {
    if (state.agents.find(agent => agent.id === payload.id)) {
      throw new Error('Ya existe un agente con ese ID');
    }
    current = { ...payload };
    state.agents.push(current);
    if (!state.fichas[current.id]) state.fichas[current.id] = createEmptyFicha();
    state.currentAgent = current.id;
  }

  saveState();
  return { previous, current, isNew: !editId, isEdit: Boolean(editId) };
}

function deleteAgent(agentId) {
  const existing = state.agents.find(agent => agent.id === agentId);
  if (!existing) return null;

  state.agents = state.agents.filter(agent => agent.id !== agentId);
  state.activities = state.activities.filter(activity => activity.agent !== agentId);
  delete state.fichas[agentId];

  if (state.currentAgent === agentId) {
    state.currentAgent = state.agents[0] ? state.agents[0].id : null;
  }

  saveState();
  return existing;
}
