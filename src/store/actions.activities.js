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
    followupDate_v41: (data.followupDate_v41 || '').trim(),
  };
}

function syncLocalActivity(activity) {
  const index = state.activities.findIndex(entry => entry.id === activity.id);
  if (index >= 0) {
    state.activities[index] = activity;
  } else {
    state.activities.push(activity);
  }
}

async function upsertActivity(data, options) {
  const editId = options && options.editId ? options.editId : '';
  const payload = buildActivityPayload(data);
  let previous = null;
  let current = null;

  if (typeof isPortalAuthEnabled === 'function' && isPortalAuthEnabled() && typeof isAdminUser === 'function' && !isAdminUser()) {
    assertCanEditAgentScope(payload.agent);

    if (editId) {
      const existing = state.activities.find(activity => activity.id === editId);
      if (!existing) throw new Error('No se encontró la actividad a editar');
      previous = { ...existing };
      current = { ...existing, ...payload, id: editId };
    } else {
      current = { id: uid(), ...payload };
    }

    const savedActivity = await requestSupabaseRpc('portal_upsert_my_activity', { p_payload: current });
    current = savedActivity && typeof savedActivity === 'object' ? savedActivity : current;
    syncLocalActivity(current);
    return { previous, current, isNew: !editId, isEdit: Boolean(editId) };
  }

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

async function deleteActivity(id) {
  const existing = state.activities.find(activity => activity.id === id);
  if (!existing) return null;

  if (typeof isPortalAuthEnabled === 'function' && isPortalAuthEnabled() && typeof isAdminUser === 'function' && !isAdminUser()) {
    assertCanEditAgentScope(existing.agent);
    await requestSupabaseRpc('portal_delete_my_activity', { p_id: id });
    state.activities = state.activities.filter(activity => activity.id !== id);
    return existing;
  }

  state.activities = state.activities.filter(activity => activity.id !== id);
  saveState();
  return existing;
}

async function addSolicitudActivityFromCierre(activity) {
  const newActivity = {
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
  const result = await upsertActivity(newActivity, {});
  return result.current;
}

async function scheduleCierreFollowup(activityId, nextDate) {
  const activity = state.activities.find(entry => entry.id === activityId);
  if (!activity) return null;
  const nextActivity = { ...activity };
  const followupNote = '[Seguimiento pendiente · próximo contacto: ' + nextDate + ']';
  nextActivity.note = (nextActivity.note || '').trim();
  if (nextActivity.note && !nextActivity.note.includes('[Seguimiento pendiente')) {
    nextActivity.note = nextActivity.note + '\n' + followupNote;
  } else if (!nextActivity.note) {
    nextActivity.note = followupNote;
  }
  nextActivity.followupDate_v41 = nextDate;
  const result = await upsertActivity(nextActivity, { editId: activityId });
  return result.current;
}

async function unifyProspectActivities(groups) {
  let unifiedCount = 0;
  for (const group of (groups || [])) {
    const canonical = (group.canonical || '').trim();
    if (!canonical) continue;
    for (const activity of (group.activities || [])) {
      const stateActivity = state.activities.find(entry => entry.id === activity.id);
      if (!stateActivity) continue;
      if (typeof isPortalAuthEnabled === 'function' && isPortalAuthEnabled() && typeof isAdminUser === 'function' && !isAdminUser()) {
        await upsertActivity({ ...stateActivity, prospect: canonical }, { editId: stateActivity.id });
      } else {
        stateActivity.prospect = canonical;
      }
      unifiedCount++;
    }
  }
  if (!(typeof isPortalAuthEnabled === 'function' && isPortalAuthEnabled() && typeof isAdminUser === 'function' && !isAdminUser())) {
    saveState();
  }
  return unifiedCount;
}
