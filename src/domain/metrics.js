/* ================================================================
   STATS + SEMÁFORO
================================================================ */
function getActivitiesForAgent(agentId, activities) {
  return (activities || []).filter(activity => activity.agent === agentId);
}

function getActivitySuccessResultValues() {
  return ['ok', 'cerrada'].map(key => getCatalogSemanticValue('activityResults', key));
}

function agentStats(agentId, activities) {
  const acts = getActivitiesForAgent(agentId, activities || state.activities);
  const usefulResults = getActivityUsefulResultValues();
  const successResults = getActivitySuccessResultValues();
  const typeInicial = getCatalogSemanticValue('activityTypes', 'inicial');
  const typeCierre = getCatalogSemanticValue('activityTypes', 'cierre');
  const typeSolicitud = getCatalogSemanticValue('activityTypes', 'solicitud');
  const typePoliza = getCatalogSemanticValue('activityTypes', 'poliza');
  const typeReferido = getCatalogSemanticValue('activityTypes', 'referido');
  const resultReagend = getCatalogSemanticValue('activityResults', 'reagend');
  const resultCancel = getCatalogSemanticValue('activityResults', 'cancel');
  // Iniciales: contamos las ejecutadas (ok, cerrada, contrapropuesta, noAhora)
  const iniciales = acts.filter(a => a.type === typeInicial && usefulResults.includes(a.result)).length;
  const cierres = acts.filter(a => a.type === typeCierre && usefulResults.includes(a.result)).length;
  const solicitudes = acts.filter(a => a.type === typeSolicitud && successResults.includes(a.result)).length;
  const polizas = acts.filter(a => a.type === typePoliza && successResults.includes(a.result)).length;
  const referidos = acts.filter(a => a.type === typeReferido && successResults.includes(a.result)).length;
  const reagend = acts.filter(a => a.result === resultReagend).length;
  const cancel = acts.filter(a => a.result === resultCancel).length;
  // v5.1 · Criterio cita consumida (interpretación B): solo citas de tipo inicial
  // cuentan para el contrato, ya sean ejecutadas o reagendadas.
  const inicialesReagendadas = acts.filter(a => a.type === typeInicial && a.result === resultReagend).length;
  const citasConsumidas = iniciales + inicialesReagendadas;
  return {
    iniciales, cierres, solicitudes, polizas, referidos,
    reagend, cancel, citasConsumidas, all: acts.length
  };
}

function agentSemaforo(s) {
  // Rúbrica: el contrato se mide por ejecución del ciclo completo hasta Póliza
  if (s.all === 0) return { level: 'inicio', text: 'Sin actividad' };
  if (s.polizas >= 1) return { level: 'excelente', text: 'Excelente' };
  if (s.solicitudes >= 1) return { level: 'bien', text: 'Bien' };
  if (s.iniciales >= 3 && s.cierres >= 1) return { level: 'bien', text: 'Bien' };
  if (s.iniciales >= 2) return { level: 'bien', text: 'Bien' };
  if (s.iniciales >= 1 && s.cierres === 0) return { level: 'atencion', text: 'Atención' };
  if (s.cancel > 0 && s.iniciales === 0) return { level: 'critico', text: 'Crítico' };
  return { level: 'atencion', text: 'Atención' };
}

function totalsGlobal(agents, activities) {
  const allAgents = agents || state.agents;
  const allActivities = activities || state.activities;
  const resultReagend = getCatalogSemanticValue('activityResults', 'reagend');
  const resultCancel = getCatalogSemanticValue('activityResults', 'cancel');
  let consumidas = 0, polizas = 0, solicitudes = 0;
  allAgents.forEach(agent => {
    const s = agentStats(agent.id, allActivities);
    consumidas += s.citasConsumidas;
    polizas += s.polizas;
    solicitudes += s.solicitudes;
  });
  const reagend = allActivities.filter(activity => activity.result === resultReagend).length;
  const cancel = allActivities.filter(activity => activity.result === resultCancel).length;
  return { consumidas, reagend, cancel, polizas, solicitudes };
}

/* ================================================================
   NUEVO v4.1 · EXTENSIÓN FLUJO PROSPECTOS (aditivo, no modifica nada)
   ================================================================
   Este bloque agrega:
   - calculateProcessProgress(prospectName, agentId)
   - calculateNewConversions() → bloque de conversiones extendidas
   - Hook post-guardado (observa mutaciones al toast sin tocar saveActivity)
   - Campos extra para cierre (producto cotizado)
   - Modal "¿Se firmó solicitud?" tras un cierre
   ================================================================ */

/* Pesos por etapa · regla fija según requerimiento */
const STAGE_WEIGHTS_V41 = {
  inicial: 30,
  cierre: 20,
  solicitud: 20,
  poliza: 30,
};

/* Calcula progreso acumulado para un prospecto específico.
   Agrupa por prospect+agent (mismo prospecto puede tener varias actividades).
   Solo cuenta actividades con resultado "útil" (ok, cerrada, contrapropuesta, noAhora). */
function calculateProcessProgress(prospectName, agentId, activities) {
  if (!prospectName) return { pct: 0, stages: {}, lastDate: '', lastType: '' };
  const typeInicial = getCatalogSemanticValue('activityTypes', 'inicial');
  const typeCierre = getCatalogSemanticValue('activityTypes', 'cierre');
  const typeSolicitud = getCatalogSemanticValue('activityTypes', 'solicitud');
  const typePoliza = getCatalogSemanticValue('activityTypes', 'poliza');
  const acts = (activities || state.activities).filter(a =>
    a.prospect && a.agent === agentId &&
    a.prospect.trim().toLowerCase() === prospectName.trim().toLowerCase()
  );
  const validResults = getActivityUsefulResultValues();
  const stages = { inicial: false, cierre: false, solicitud: false, poliza: false };
  let lastDate = '', lastType = '';
  acts.forEach(a => {
    if (validResults.includes(a.result)) {
      if (a.type === typeInicial) stages.inicial = true;
      if (a.type === typeCierre) stages.cierre = true;
      if (a.type === typeSolicitud) stages.solicitud = true;
      if (a.type === typePoliza) stages.poliza = true;
    }
    if (!lastDate || (a.date && a.date > lastDate)) { lastDate = a.date; lastType = a.type; }
  });
  let pct = 0;
  if (stages.inicial) pct += STAGE_WEIGHTS_V41.inicial;
  if (stages.cierre) pct += STAGE_WEIGHTS_V41.cierre;
  if (stages.solicitud) pct += STAGE_WEIGHTS_V41.solicitud;
  if (stages.poliza) pct += STAGE_WEIGHTS_V41.poliza;
  return { pct, stages, lastDate, lastType };
}

/* Agrupa todas las actividades por par prospecto+agente para listar prospectos únicos */
function getUniqueProspects(activities) {
  const map = new Map();
  (activities || state.activities).forEach(a => {
    if (!a.prospect || !a.prospect.trim()) return;
    const key = a.agent + '::' + a.prospect.trim().toLowerCase();
    if (!map.has(key)) {
      map.set(key, { prospect: a.prospect.trim(), agent: a.agent, firstDate: a.date || '' });
    } else {
      const existing = map.get(key);
      if (a.date && (!existing.firstDate || a.date < existing.firstDate)) existing.firstDate = a.date;
    }
  });
  return Array.from(map.values());
}


/* Conversiones extendidas · sobre prospectos únicos (no actividades) */
function calculateNewConversions(activities) {
  const allActivities = activities || state.activities;
  const prospects = getUniqueProspects(allActivities);
  let withInicial = 0, withCierre = 0, withSolicitud = 0, withPoliza = 0;
  prospects.forEach(p => {
    const st = calculateProcessProgress(p.prospect, p.agent, allActivities).stages;
    if (st.inicial) withInicial++;
    if (st.cierre) withCierre++;
    if (st.solicitud) withSolicitud++;
    if (st.poliza) withPoliza++;
  });
  return {
    totalProspects: prospects.length,
    inicial: withInicial,
    cierre: withCierre,
    solicitud: withSolicitud,
    poliza: withPoliza,
    inicialACierre: withInicial > 0 ? Math.round((withCierre / withInicial) * 100) : 0,
    cierreASolicitud: withCierre > 0 ? Math.round((withSolicitud / withCierre) * 100) : 0,
    solicitudAPoliza: withSolicitud > 0 ? Math.round((withPoliza / withSolicitud) * 100) : 0,
    inicialAPoliza: withInicial > 0 ? Math.round((withPoliza / withInicial) * 100) : 0,
  };
}


/* ============================================================
   NUEVO v4.2 · PROGRESO PONDERADO POR AGENTE
   Calcula % promedio del flujo de cada agente usando los pesos 30/20/20/30
   sobre los prospectos únicos atendidos por ese agente.
============================================================ */
function calculateAgentWeightedProgress(agentId, activities) {
  const allActivities = activities || state.activities;
  const prospects = getUniqueProspects(allActivities).filter(p => p.agent === agentId);
  if (prospects.length === 0) {
    return { avgPct: 0, totalProspects: 0, stageCount: { inicial: 0, cierre: 0, solicitud: 0, poliza: 0 } };
  }
  let sumPct = 0;
  const stageCount = { inicial: 0, cierre: 0, solicitud: 0, poliza: 0 };
  prospects.forEach(p => {
    const prog = calculateProcessProgress(p.prospect, agentId, allActivities);
    sumPct += prog.pct;
    if (prog.stages.inicial) stageCount.inicial++;
    if (prog.stages.cierre) stageCount.cierre++;
    if (prog.stages.solicitud) stageCount.solicitud++;
    if (prog.stages.poliza) stageCount.poliza++;
  });
  return {
    avgPct: Math.round(sumPct / prospects.length),
    totalProspects: prospects.length,
    stageCount,
  };
}


/* Normaliza nombre: trim + lowercase + colapsar espacios + quitar acentos */
function normalizeProspectKey_v5(name) {
  if (!name) return '';
  return String(name)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/* Agrupa actividades del agente por prospecto normalizado.
   Retorna { withProspect: [{key, displayName, activities[], variants[]}], withoutProspect: [] } */
function groupActivitiesByProspect_v5(agentId, activities) {
  const acts = getActivitiesForAgent(agentId, activities || state.activities);
  const typeCierre = getCatalogSemanticValue('activityTypes', 'cierre');
  const groups = new Map(); /* key normalizada -> { displayName, activities[], variants Set } */
  const orphans = [];

  acts.forEach(act => {
    const raw = (act.prospect || '').trim();
    if (!raw) {
      orphans.push(act);
      return;
    }
    const key = normalizeProspectKey_v5(raw);
    if (!groups.has(key)) {
      groups.set(key, { key, displayName: raw, activities: [], variants: new Set() });
    }
    const g = groups.get(key);
    g.activities.push(act);
    g.variants.add(raw);
    /* El displayName es el más reciente (por fecha) entre las variantes */
    if (act.date && act.date >= (g._latestDate || '')) {
      g._latestDate = act.date;
      g.displayName = raw;
    }
  });

  /* Ordenar actividades dentro de cada grupo por fecha desc */
  groups.forEach(g => {
    g.activities.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    g.variants = Array.from(g.variants);
  });

  /* Ordenar orphans por fecha desc */
  orphans.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  /* Enriquecer grupos con progreso y ordenar por % desc */
  const withProspect = Array.from(groups.values()).map(g => {
    const progress = calculateProcessProgress(g.displayName, agentId, acts);
    /* Extraer producto cotizado y monto de actividades de cierre */
    let productoCotizado = '';
    let montoCotizado = '';
    g.activities.forEach(a => {
      if (a.type === typeCierre && a.productoCotizado && !productoCotizado) productoCotizado = a.productoCotizado;
      if (a.anfMonto && !montoCotizado) montoCotizado = a.anfMonto;
    });
    return { ...g, progress, productoCotizado, montoCotizado };
  }).sort((a, b) => b.progress.pct - a.progress.pct);

  return { withProspect, withoutProspect: orphans };
}

/* Detecta duplicados: variantes distintas que normalizan igual */
function detectProspectDuplicates_v5(agentId, activities) {
  const { withProspect } = groupActivitiesByProspect_v5(agentId, activities || state.activities);
  return withProspect.filter(g => g.variants.length > 1);
}
