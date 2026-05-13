/* ================================================================
   STORE ACTIONS · FICHA
================================================================ */
function updateFichaFieldValue(agentId, field, value) {
  if (!state.fichas[agentId]) state.fichas[agentId] = createEmptyFicha();
  state.fichas[agentId][field] = value;
  saveState();
  return state.fichas[agentId];
}

function addFichaListItem(agentId, type) {
  if (!state.fichas[agentId]) state.fichas[agentId] = createEmptyFicha();
  if (!Array.isArray(state.fichas[agentId][type])) state.fichas[agentId][type] = [];
  const item = { id: uid(), text: '', date: '', done: false };
  state.fichas[agentId][type].push(item);
  saveState();
  return item;
}

function updateFichaListItemValue(agentId, type, itemId, field, value) {
  const list = state.fichas[agentId] && state.fichas[agentId][type];
  if (!Array.isArray(list)) return null;
  const item = list.find(entry => entry.id === itemId);
  if (!item) return null;
  item[field] = value;
  saveState();
  return item;
}

function toggleFichaListItemState(agentId, type, itemId) {
  const list = state.fichas[agentId] && state.fichas[agentId][type];
  if (!Array.isArray(list)) return null;
  const item = list.find(entry => entry.id === itemId);
  if (!item) return null;
  item.done = !item.done;
  saveState();
  return item;
}

function removeFichaListItemById(agentId, type, itemId) {
  const list = state.fichas[agentId] && state.fichas[agentId][type];
  if (!Array.isArray(list)) return null;
  const nextList = list.filter(entry => entry.id !== itemId);
  state.fichas[agentId][type] = nextList;
  saveState();
  return nextList;
}
