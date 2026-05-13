/* ================================================================
   STORE ACTIONS · ACTIVITIES
================================================================ */
function buildActivityPayload(data) {
  const cierreTypeValue = getCatalogSemanticValue('activityTypes', 'cierre');
  return {
    agent: data.agent,
    date: data.date,
    type: data.type,
    result: data.result,
    prospect: (data.prospect || '').trim(),
    note: (data.note || '').trim(),
    anfNecesidades: Array.isArray(data.anfNecesidades) ? data.anfNecesidades : [],
    anfMonto: (data.anfMonto || '').trim(),
    anfNota: (data.anfNota || '').trim(),
    anfSummary: (data.anfSummary || '').trim(),
    prima: (data.prima || '').trim(),
    productoCotizado: data.type === cierreTypeValue ? (data.productoCotizado || '').trim() : '',
    fumador: normalizeFumadorValue(data.fumador),
  };
}

function upsertActivity(data, options) {
  const editId = options && options.editId ? options.editId : '';
  const payload = buildActivityPayload(data);
  let previous = null;
  let current = null;

  if (editId) {
    const index = state.activities.findIndex(activity => activity.id === editId);
    if (index < 0) throw new Error('No se encontró la actividad a editar');
    previous = { ...state.activities[index] };
    current = { ...state.activities[index], ...payload };
    state.activities[index] = current;
  } else {
    current = { id: uid(), ...payload };
    state.activities.push(current);
  }

  saveState();
  return { previous, current, isNew: !editId, isEdit: Boolean(editId) };
}

function deleteActivity(id) {
  const existing = state.activities.find(activity => activity.id === id);
  if (!existing) return null;
  state.activities = state.activities.filter(activity => activity.id !== id);
  saveState();
  return existing;
}

function addSolicitudActivityFromCierre(activity) {
  const newActivity = {
    id: uid(),
    agent: activity.agent,
    date: new Date().toISOString().slice(0, 10),
    type: getCatalogSemanticValue('activityTypes', 'solicitud'),
    result: getCatalogSemanticValue('activityResults', 'ok'),
    prospect: activity.prospect,
    note: 'Solicitud firmada tras cierre del ' + activity.date + ' (auto-registrada via hook v4.1)',
    anfNecesidades: [],
    anfMonto: '',
    anfNota: '',
    anfSummary: '',
    prima: '',
    productoCotizado: '',
    fumador: 'nd',
  };
  state.activities.push(newActivity);
  saveState();
  return newActivity;
}

function scheduleCierreFollowup(activityId, nextDate) {
  const activity = state.activities.find(entry => entry.id === activityId);
  if (!activity) return null;
  const followupNote = '[Seguimiento pendiente · próximo contacto: ' + nextDate + ']';
  activity.note = (activity.note || '').trim();
  if (activity.note && !activity.note.includes('[Seguimiento pendiente')) {
    activity.note = activity.note + '\n' + followupNote;
  } else if (!activity.note) {
    activity.note = followupNote;
  }
  activity.followupDate_v41 = nextDate;
  saveState();
  return activity;
}

function unifyProspectActivities(groups) {
  let unifiedCount = 0;
  (groups || []).forEach(group => {
    const canonical = (group.canonical || '').trim();
    if (!canonical) return;
    (group.activities || []).forEach(activity => {
      const stateActivity = state.activities.find(entry => entry.id === activity.id);
      if (!stateActivity) return;
      stateActivity.prospect = canonical;
      unifiedCount++;
    });
  });
  saveState();
  return unifiedCount;
}
