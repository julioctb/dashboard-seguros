/* ================================================================
   EXTENSIONS UI STATE
================================================================ */
const BITACORA_VIEW_KEY_V5 = 'bienestar_bitacora_view_v5';
const PROSPECT_OPEN_KEY_V5 = 'bienestar_prospect_open_v5';
const DUP_DISMISS_KEY_V5 = 'bienestar_dup_dismiss_v5';

let bitacoraViewMode_v5 = 'plain';
let openProspectCards_v5 = {};
let dismissedDuplicates_v5 = {};

function hydrateSessionScopedUiState_v5() {
  try {
    bitacoraViewMode_v5 = localStorage.getItem(getScopedUiStorageKey(BITACORA_VIEW_KEY_V5)) || 'plain';
  } catch (error) {
    bitacoraViewMode_v5 = 'plain';
  }
  try {
    openProspectCards_v5 = JSON.parse(localStorage.getItem(getScopedUiStorageKey(PROSPECT_OPEN_KEY_V5)) || '{}');
  } catch (error) {
    openProspectCards_v5 = {};
  }
  try {
    dismissedDuplicates_v5 = JSON.parse(localStorage.getItem(getScopedUiStorageKey(DUP_DISMISS_KEY_V5)) || '{}');
  } catch (error) {
    dismissedDuplicates_v5 = {};
  }
}

function setBitacoraViewMode_v5(mode) {
  bitacoraViewMode_v5 = mode;
  try {
    localStorage.setItem(getScopedUiStorageKey(BITACORA_VIEW_KEY_V5), mode);
  } catch (error) {}
  renderAgentPanels();
}

/* ================================================================
   EXPLICIT POST-SAVE FLOW
================================================================ */
function afterActivitySaved(context) {
  if (!context || !context.current || !context.isNew) return;
  const activity = context.current;
  const typeInicial = getCatalogSemanticValue('activityTypes', 'inicial');
  const typeCierre = getCatalogSemanticValue('activityTypes', 'cierre');
  const resultOk = getCatalogSemanticValue('activityResults', 'ok');

  if (activity.type === typeInicial && getActivityUsefulResultValues().includes(activity.result)) {
    setTimeout(() => {
      if (!confirm('¿Agendar la cita de cierre para este prospecto?')) return;
      const initialDate = new Date(activity.date + 'T00:00:00');
      initialDate.setDate(initialDate.getDate() + 7);
      openActivityModal(null, null, {
        agent: activity.agent,
        date: initialDate.toISOString().slice(0, 10),
        type: typeCierre,
        result: resultOk,
        prospect: activity.prospect,
        note: 'Cierre agendado tras cita inicial del ' + activity.date,
      });
    }, 400);
    return;
  }

  if (activity.type === typeCierre && getCierreSolicitudResultValues().includes(activity.result)) {
    setTimeout(() => openSolicitudHook(activity), 400);
  }
}

/* ================================================================
   READY TASKS
================================================================ */
function wireBackdropClose(modalId, onClose) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.addEventListener('click', event => {
    if (event.target.id === modalId) onClose();
  });
}

registerOnReady(() => {
  wireBackdropClose('dupUnifyModal', closeDupUnifyModal);
  wireBackdropClose('induccionesModal', closeInduccionesModal);
  wireBackdropClose('solicitudHookModal', closeSolicitudHook);
  wireBackdropClose('cierreModal', closeCierreModal);

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const dupModal = document.getElementById('dupUnifyModal');
    const induccionesModal = document.getElementById('induccionesModal');
    const solicitudModal = document.getElementById('solicitudHookModal');
    const cierreModal = document.getElementById('cierreModal');

    if (dupModal && dupModal.classList.contains('open')) closeDupUnifyModal();
    if (induccionesModal && induccionesModal.classList.contains('open')) closeInduccionesModal();
    if (solicitudModal && solicitudModal.classList.contains('open')) closeSolicitudHook();
    if (cierreModal && cierreModal.classList.contains('open')) closeCierreModal();
  });
});
