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

function handleSolicitudHookChoice(choice) {
  const context = solicitudHookContext_v41;
  if (!context) {
    closeSolicitudHook();
    return;
  }

  if (choice === 'si') {
    addSolicitudActivityFromCierre(context);
    closeSolicitudHook();
    refreshUI('all');
    showToast('Solicitud registrada');
    return;
  }

  if (choice === 'seguimiento') {
    document.getElementById('solicitudHookFollowup').style.display = 'block';
    return;
  }

  closeSolicitudHook();
  showToast('Cierre registrado sin solicitud');
}

function confirmSolicitudHookFollowup() {
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

  scheduleCierreFollowup(context.id, nextDate);
  closeSolicitudHook();
  refreshUI('all');
  showToast('Seguimiento agendado para ' + formatDate(nextDate));
}
