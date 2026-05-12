/* Mostrar/ocultar campos extra del cierre según type seleccionado.
   Usa evento propio sobre el select — NO modifica onTypeChange. */
function syncCierreFieldsVisibility() {
  const typeEl = document.getElementById('actType');
  const cierreFields = document.getElementById('actCierreFields');
  if (!typeEl || !cierreFields) return;
  cierreFields.style.display = typeEl.value === 'cierre' ? 'block' : 'none';
}

/* Cargar producto cotizado al editar actividad existente.
   Se engancha vía DOM event, no modifica openActivityModal. */
function syncProductoCotizadoField() {
  const editId = document.getElementById('actEditId').value;
  const productoField = document.getElementById('actCierreProducto');
  if (!productoField) return;
  if (editId) {
    const act = state.activities.find(a => a.id === editId);
    productoField.value = (act && act.productoCotizado) || '';
  } else {
    productoField.value = '';
  }
}

/* Persistir producto cotizado dentro de la actividad justo después de guardar.
   Observa el toast existente para saber que saveActivity terminó. */
function persistProductoCotizado() {
  const productoField = document.getElementById('actCierreProducto');
  if (!productoField || !productoField.value.trim()) return;
  const productoValue = productoField.value.trim();
  const typeValue = document.getElementById('actType').value;
  if (typeValue !== 'cierre') return;

  /* Encontrar la última actividad recién guardada (la más reciente del mismo tipo y agente) */
  const agentValue = document.getElementById('actAgent').value;
  const dateValue = document.getElementById('actDate').value;
  const prospectValue = document.getElementById('actProspect').value.trim();

  /* Buscar match por agente + fecha + prospect + type */
  const match = state.activities.filter(a =>
    a.agent === agentValue &&
    a.date === dateValue &&
    a.type === 'cierre' &&
    (a.prospect || '') === prospectValue
  ).pop();

  if (match) {
    match.productoCotizado = productoValue;
    saveState();
  }
}

/* ================================================================
   HOOK POST-GUARDADO · solicitud tras cierre
   Observa mutaciones al toast sin tocar saveActivity
================================================================ */
let lastSavedSnapshot_v41 = null;

/* ================================================================
   NUEVO v5 · BITÁCORA AGRUPADA POR PROSPECTO
   ================================================================
   Vista agrupada por prospecto dentro del perfil del agente con:
   - Toggle agrupado/plano (persistido en localStorage)
   - Cards colapsables cerrados por defecto
   - Bloque "Sin prospecto" arriba
   - Detección y unificación de duplicados
================================================================ */

const BITACORA_VIEW_KEY_V5 = 'bienestar_bitacora_view_v5';
const PROSPECT_OPEN_KEY_V5 = 'bienestar_prospect_open_v5';
const DUP_DISMISS_KEY_V5 = 'bienestar_dup_dismiss_v5';

let bitacoraViewMode_v5 = 'plain'; /* v5.4: modo plain forzado */

/* Estado de cards abiertas (por agentId::prospectKey) */
let openProspectCards_v5 = (function() {
  try { return JSON.parse(localStorage.getItem(PROSPECT_OPEN_KEY_V5) || '{}'); }
  catch(e) { return {}; }
})();

/* Grupos de duplicados ya descartados por el usuario (por agentId) */
let dismissedDuplicates_v5 = (function() {
  try { return JSON.parse(localStorage.getItem(DUP_DISMISS_KEY_V5) || '{}'); }
  catch(e) { return {}; }
})();

function setBitacoraViewMode_v5(mode) {
  bitacoraViewMode_v5 = mode;
  try { localStorage.setItem(BITACORA_VIEW_KEY_V5, mode); } catch(e) {}
  renderAgentPanels();
}


/* ============ CABLEADO INIT v5 ============ */
function initV5Extensions() {
  /* Cerrar modal unificar al click fuera + Escape */
  const dupModal = document.getElementById('dupUnifyModal');
  if (dupModal) {
    dupModal.addEventListener('click', (e) => {
      if (e.target.id === 'dupUnifyModal') closeDupUnifyModal();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && dupModal && dupModal.classList.contains('open')) closeDupUnifyModal();
  });
}
registerOnReady(initV5Extensions);
/* ================================================================
   FIN NUEVO v5
================================================================ */


/* Cableado de cierre modal inducciones */
registerOnReady(() => {
  const indModal = document.getElementById('induccionesModal');
  if (indModal) {
    indModal.addEventListener('click', (e) => {
      if (e.target.id === 'induccionesModal') closeInduccionesModal();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && indModal && indModal.classList.contains('open')) closeInduccionesModal();
  });
});
/* ================================================================
   FIN NUEVO v5.2
================================================================ */


/* ============================================================
   NUEVO v4.2 · INTERCEPTOR DE CONFIRM (aditivo, no modifica saveActivity)
   ============================================================
   Neutraliza el confirm("¿Agendar la cita de cierre...?") que aparece
   tras guardar una cita inicial. Deja intactos todos los demás confirm()
   de la aplicación (eliminar actividad, eliminar agente, importar, etc.).

   Estrategia: envolver window.confirm. Si el texto coincide con el patrón
   del agendado automático Y hay un snapshot reciente de una inicial,
   retorna false automáticamente y no muestra el diálogo. Todo lo demás
   pasa al confirm nativo sin modificación.
============================================================ */
const ORIGINAL_CONFIRM_V42 = window.confirm.bind(window);
const AUTO_CIERRE_PATTERN = /agendar.*cita.*cierre/i;

function installConfirmInterceptor_v42() {
  window.confirm = function(message) {
    /* Detectar el confirm específico del agendado automático */
    if (typeof message === 'string' && AUTO_CIERRE_PATTERN.test(message)) {
      /* Verificar que viene de guardar una inicial reciente */
      const snap = lastSavedSnapshot_v41;
      if (snap && snap.isNew && snap.type === 'inicial' &&
          (Date.now() - snap.timestamp) < 2000) {
        /* Auto-skip · retorna false (no agenda cierre automático) */
        return false;
      }
    }
    /* Cualquier otro confirm pasa al nativo sin tocarlo */
    return ORIGINAL_CONFIRM_V42(message);
  };
}

/* Captura estado del modal activo justo antes de que saveActivity corra.
   Se engancha al click del botón "Guardar" via captura (no reemplaza). */
function captureActivitySnapshotV41(e) {
  const modal = document.getElementById('activityModal');
  if (!modal || !modal.classList.contains('open')) return;
  const editId = document.getElementById('actEditId').value;
  lastSavedSnapshot_v41 = {
    editId: editId || null,
    isNew: !editId,
    agent: document.getElementById('actAgent').value,
    date: document.getElementById('actDate').value,
    type: document.getElementById('actType').value,
    result: document.getElementById('actResult').value,
    prospect: document.getElementById('actProspect').value.trim(),
    timestamp: Date.now(),
  };
}

/* Se dispara tras el toast "Actividad registrada" (observa MutationObserver sobre #toast) */
function maybeTriggerSolicitudHook() {
  const snap = lastSavedSnapshot_v41;
  if (!snap || !snap.isNew) return;
  if (Date.now() - snap.timestamp > 3000) return; /* Solo reaccionar si fue reciente */
  if (snap.type !== 'cierre') return;
  if (!['ok','cerrada','contrapropuesta'].includes(snap.result)) return;
  /* Guard extra: si el modal hook ya está abierto, no lo vuelvas a abrir */
  const hookModal = document.getElementById('solicitudHookModal');
  if (hookModal && hookModal.classList.contains('open')) return;
  /* Guard extra: si el modal de actividad sigue abierto (flujo encadenado inicial→cierre), no dispares */
  const activityModal = document.getElementById('activityModal');
  if (activityModal && activityModal.classList.contains('open')) return;
  lastSavedSnapshot_v41 = null; /* Consumir snapshot para que no se re-dispare */
  /* Pequeño delay para que el usuario vea el toast de confirmación primero */
  setTimeout(() => openSolicitudHook(snap), 600);
  /* Persistir producto cotizado de la actividad recién guardada */
  persistProductoCotizado();
}

/* ================================================================
   Inicialización v4.1 · cableado sin tocar init original
================================================================ */
function initV41Extensions() {
  /* 0. Instalar interceptor de confirm (neutraliza agendado automático de cierre) */
  installConfirmInterceptor_v42();

  /* 1. Sync de visibilidad del bloque cierre al cambiar type */
  const typeEl = document.getElementById('actType');
  if (typeEl) {
    typeEl.addEventListener('change', syncCierreFieldsVisibility);
  }

  /* 2. Al abrir el modal actividad, sincronizar campos nuevos */
  const modalObserver = new MutationObserver(() => {
    const modal = document.getElementById('activityModal');
    if (modal && modal.classList.contains('open')) {
      syncCierreFieldsVisibility();
      syncProductoCotizadoField();
    }
  });
  const activityModal = document.getElementById('activityModal');
  if (activityModal) {
    modalObserver.observe(activityModal, { attributes: true, attributeFilter: ['class'] });
  }

  /* 3. Captura snapshot al hacer click en Guardar (fase de captura, antes que handler existente) */
  document.addEventListener('click', (e) => {
    if (e.target && e.target.matches('.modal-foot .btn.btn-primary')) {
      const modal = e.target.closest('.modal-backdrop');
      if (modal && modal.id === 'activityModal') {
        captureActivitySnapshotV41(e);
      }
    }
  }, true);

  /* 4. Observa el toast para saber cuándo se completó un save */
  const toast = document.getElementById('toast');
  if (toast) {
    let lastProcessedTimestamp = 0;
    let lastProcessedText = '';
    const toastObserver = new MutationObserver(() => {
      const current = toast.textContent || '';
      if (!toast.classList.contains('show')) return;
      const now = Date.now();
      /* Guard antiduplicación: mismo texto en menos de 1.5s = misma acción */
      if (current === lastProcessedText && (now - lastProcessedTimestamp) < 1500) return;
      lastProcessedText = current;
      lastProcessedTimestamp = now;
      if (current.toLowerCase().includes('registrada') || current.toLowerCase().includes('actualizada')) {
        persistFumadorFromSnapshot();
        maybeTriggerSolicitudHook();
        renderProspectProgress();
        renderExtConversions();
        renderAgentProgressTable();
      }
    });
    toastObserver.observe(toast, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  }

  /* 5. Cablear cierre del modal hook (click fuera + Escape) */
  const hookModal = document.getElementById('solicitudHookModal');
  if (hookModal) {
    hookModal.addEventListener('click', (e) => {
      if (e.target.id === 'solicitudHookModal') closeSolicitudHook();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSolicitudHook();
  });

  /* 6. Primer render de los bloques nuevos */
  renderProspectProgress();
  renderExtConversions();
  renderAgentProgressTable();

  /* 7. Re-render cada vez que el usuario cambia de vista al dashboard */
  const dashboardObserver = new MutationObserver(() => {
    const view = document.getElementById('view-dashboard');
    if (view && view.classList.contains('active')) {
      renderProspectProgress();
      renderExtConversions();
      renderAgentProgressTable();
    }
  });
  const dashView = document.getElementById('view-dashboard');
  if (dashView) {
    dashboardObserver.observe(dashView, { attributes: true, attributeFilter: ['class'] });
  }
}

registerOnReady(initV41Extensions);
/* ================================================================
   FIN NUEVO v4.1
================================================================ */


/* ================================================================
   NUEVO v5.3 · FUMADOR + CIERRES PENDIENTES
================================================================ */

/* ---- FUMADOR ---- */
function setFumador(val) {
  document.querySelectorAll('#fumadorToggle .fumador-opt').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.val === val);
  });
}

function getFumador() {
  const sel = document.querySelector('#fumadorToggle .fumador-opt.selected');
  return sel ? sel.dataset.val : 'nd';
}

function resetFumador() { setFumador('nd'); }

function loadFumadorFromActivity(act) {
  setFumador(act && act.fumador ? act.fumador : 'nd');
}

function fumadorPill(val) {
  if (val === 'no') return '<span class="fumador-pill no">🚭 No fuma</span>';
  if (val === 'si') return '<span class="fumador-pill si">🚬 Fuma</span>';
  return '';
}

function findActivityFromLastSavedSnapshot() {
  const snap = lastSavedSnapshot_v41;
  if (!snap) return state.activities[state.activities.length - 1] || null;
  if (snap.editId) {
    return state.activities.find(activity => activity.id === snap.editId) || null;
  }
  return state.activities.filter(activity =>
    activity.agent === snap.agent &&
    activity.date === snap.date &&
    activity.type === snap.type &&
    (activity.prospect || '') === snap.prospect
  ).pop() || state.activities[state.activities.length - 1] || null;
}

function persistFumadorFromSnapshot() {
  const fumador = getFumador();
  if (fumador === 'nd') return;
  const activity = findActivityFromLastSavedSnapshot();
  if (!activity || activity.fumador === fumador) return;
  activity.fumador = fumador;
  saveState();
}

registerOnReady(() => {
  const modal = document.getElementById('activityModal');
  if (!modal) return;
  new MutationObserver(() => {
    if (modal.classList.contains('open')) {
      const editId = document.getElementById('actEditId').value;
      if (editId) {
        const activity = state.activities.find(item => item.id === editId);
        loadFumadorFromActivity(activity);
      } else {
        resetFumador();
      }
    }
  }).observe(modal, { attributes: true, attributeFilter: ['class'] });
});

/* fumador ya integrado en renderANFIndicator directamente */

/* ---- CIERRES PENDIENTES ---- */
/* state.cierres: array de { id, agente, prospecto, producto, monto, estado, prioridad, fechaLimite, nota } */
/* saveState ya incluye cierres en la función unificada del bloque STATE */

/* getCierres: helper seguro */
function getCierres() { return state.cierres || []; }

/* Cableado init v5.3 */
registerOnReady(() => {
  /* Cablear modal cierre */
  const cm = document.getElementById('cierreModal');
  if (cm) {
    cm.addEventListener('click', (e) => { if (e.target.id === 'cierreModal') closeCierreModal(); });
  }
  /* Escape */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cm && cm.classList.contains('open')) closeCierreModal();
  });
  /* Render inicial de la tabla global */
  if (!state.cierres) state.cierres = [];
  renderCierresTable_v53();
  /* Re-render cuando el usuario vuelve al dashboard */
  const dashView = document.getElementById('view-dashboard');
  if (dashView) {
    new MutationObserver(() => {
      if (dashView.classList.contains('active')) renderCierresTable_v53();
    }).observe(dashView, { attributes: true, attributeFilter: ['class'] });
  }
});
/* ================================================================
   FIN NUEVO v5.3
================================================================ */
