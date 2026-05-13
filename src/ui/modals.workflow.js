/* ================================================================
   SOLICITUD HOOK
================================================================ */
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

async function handleSolicitudHookChoice(choice) {
  const context = solicitudHookContext_v41;
  if (!context) {
    closeSolicitudHook();
    return;
  }

  if (choice === 'si') {
    try {
      await addSolicitudActivityFromCierre(context);
      closeSolicitudHook();
      refreshUI('all');
      showToast('Solicitud registrada');
    } catch (error) {
      showToast(error.message || 'No se pudo registrar la solicitud', 'error');
    }
    return;
  }

  if (choice === 'seguimiento') {
    document.getElementById('solicitudHookFollowup').style.display = 'block';
    return;
  }

  closeSolicitudHook();
  showToast('Cierre registrado sin solicitud');
}

async function confirmSolicitudHookFollowup() {
  const context = solicitudHookContext_v41;
  if (!context) {
    closeSolicitudHook();
    return;
  }
  const nextDate = document.getElementById('solicitudHookNextDate').value;
  if (!nextDate) {
    showToast('Falta la fecha de siguiente contacto', 'error');
    return;
  }

  try {
    await scheduleCierreFollowup(context.id, nextDate);
    closeSolicitudHook();
    refreshUI('all');
    showToast('Seguimiento agendado para ' + formatDate(nextDate));
  } catch (error) {
    showToast(error.message || 'No se pudo guardar el seguimiento', 'error');
  }
}
