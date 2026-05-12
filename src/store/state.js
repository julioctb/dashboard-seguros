/* ================================================================
   CONFIG
================================================================ */
const PROGRAM = {
  startDate: '2026-03-25',
  endDate: '2026-05-06',
  totalWeeks: 6,
  citasContratadas: 35,
  totalEntregables: 21,
  montoTotal: 29000,
};

const DEFAULT_AGENTS = [
  { id: 'katia',   name: 'Katia',   initials: 'K', status: 'green', tag: 'Foco principal · Alta actividad' },
  { id: 'ana',     name: 'Ana',     initials: 'A', status: 'green', tag: 'Foco principal · Zoom' },
  { id: 'liz',     name: 'Liz',     initials: 'L', status: 'amber', tag: 'Blanca la lleva · Ciclo avanzado' },
  { id: 'jorge',   name: 'Jorge',   initials: 'J', status: 'red',   tag: 'Agenda cancelada Sem 1-3' },
  { id: 'eva',     name: 'Eva',     initials: 'E', status: 'red',   tag: 'Zoom Salina Cruz · Familiar' },
  { id: 'vicente', name: 'Vicente', initials: 'V', status: 'gray',  tag: 'Sin contacto · A definir' },
];

/* ENTREGABLES - 21 del contrato + grupo Fase 2 aparte */
const DELIVERABLES_TEMPLATE = [
  {
    group: 'Presentaciones por día · Onboarding',
    items: [
      { name: 'Presentación Día 1', defaultStatus: 'progreso', defaultNote: 'Lista en borrador. Afinar para lunes antes de segunda cohorte.' },
      { name: 'Presentación Día 2', defaultStatus: 'progreso', defaultNote: 'Lista en borrador. Afinar para lunes.' },
      { name: 'Presentación Día 3', defaultStatus: 'progreso', defaultNote: 'Lista en borrador. Afinar para lunes.' },
      { name: 'Presentación Día 4', defaultStatus: 'progreso', defaultNote: 'Lista en borrador. Afinar para lunes.' },
      { name: 'Presentación Día 5', defaultStatus: 'progreso', defaultNote: 'Lista en borrador. Afinar para lunes.' },
    ]
  },
  {
    group: 'Kahoots de validación',
    items: [
      { name: 'Kahoot Día 1', defaultStatus: 'pendiente', defaultNote: 'Por diseñar. Semana 4.' },
      { name: 'Kahoot Día 2', defaultStatus: 'pendiente', defaultNote: 'Por diseñar. Semana 4.' },
      { name: 'Kahoot Día 3', defaultStatus: 'pendiente', defaultNote: 'Por diseñar. Semana 4.' },
      { name: 'Kahoot Día 4', defaultStatus: 'pendiente', defaultNote: 'Por diseñar. Semana 4.' },
      { name: 'Kahoot Día 5', defaultStatus: 'pendiente', defaultNote: 'Por diseñar. Semana 4.' },
    ]
  },
  {
    group: 'Materiales de apoyo al agente',
    items: [
      { name: 'Guión de presentación comercial', defaultStatus: 'sustituido', defaultNote: 'SUSTITUIDO por: Presentación del agente (3 slides) + ANF editable que aplica conocer/conectar + SPIN + Guiones telefónicos con manejo de objeciones. Función cumplida de forma superior.' },
      { name: 'Plantilla de seguimiento a prospecto', defaultStatus: 'sustituido', defaultNote: 'SUSTITUIDO por: ANF editable PDF de 4 hojas. Captura información del prospecto, aplica SPIN, sensibiliza y cierra con compromiso monetario.' },
      { name: 'Folleto institucional de la promotoría', defaultStatus: 'pendiente', defaultNote: 'Por diseñar. Único material de este bloque sin cubrir.' },
      { name: 'Material de consulta rápida (ciclo comercial)', defaultStatus: 'sustituido', defaultNote: 'SUSTITUIDO por: HTML de propuesta de cierre en 2 fases (coberturas/pagos/recuperación estrategia + tabla de valores). Herramienta viva que el agente usa en cada cierre. Diseñada por Ale cuando Blanca envía cotización.' },
    ]
  },
  {
    group: 'Embudo y CRM',
    items: [
      { name: 'Embudo de prospectos adaptado', defaultStatus: 'sustituido', defaultNote: 'SUSTITUIDO por: Sistema de seguimiento de 25 puntos en línea. Cumple función de embudo básico.' },
      { name: 'CRM básico para gestión de cartera', defaultStatus: 'fase2', defaultNote: 'REPROGRAMADO A FASE 2. Ajuste por prioridades operativas del programa: el tiempo se invirtió en acompañamiento directo en citas por fase del equipo.' },
      { name: 'Protocolo de seguimiento post-cita', defaultStatus: 'sustituido', defaultNote: 'SUSTITUIDO parcialmente por: Guiones telefónicos con manejo de objeciones (entregados). Protocolo formal escrito se reprograma a Fase 2.' },
    ]
  },
  {
    group: 'Procesos documentados',
    items: [
      { name: 'Protocolo recluta-a-campo', defaultStatus: 'entregado', defaultNote: 'ENTREGADO: Ficha de levantamiento de requisitos en HTML (antes era Excel, ahora automatizada). Reemplaza y mejora el proceso original.' },
      { name: 'Ciclo comercial documentado', defaultStatus: 'entregado', defaultNote: 'ENTREGADO: Checklist imprimible de Ruta de Ingreso del Agente en HTML. Base para armar el Business Plan que le pide SMNYL.' },
    ]
  },
  {
    group: 'Reportes',
    items: [
      { name: 'Reporte individual por cita', defaultStatus: 'progreso', defaultNote: 'Este HTML de seguimiento cubre el reporte grupal e individual básico. Reporte detallado por cita en desarrollo.' },
      { name: 'Reporte semanal por agente', defaultStatus: 'progreso', defaultNote: 'Se genera desde la vista "Por agente" de este HTML. Versión imprimible en curso.' },
      { name: 'Dashboard grupal semanal', defaultStatus: 'entregado', defaultNote: 'ENTREGADO: Vista Dashboard de este HTML cubre el tablero grupal. Se entrega a Blanca con avance real.' },
    ]
  },
  {
    group: 'Sesiones grupales',
    items: [
      { name: 'Skill Builder 1 (2 hrs)', defaultStatus: 'sustituido', defaultNote: 'SUSTITUIDO por: Sesión de Arranque grupal (2 hrs). Agendas del equipo no coinciden por exámenes y cursos SMNYL — respaldado por Cláusula Sexta del contrato (disponibilidad del equipo).' },
      { name: 'Skill Builder 2 (2 hrs)', defaultStatus: 'sustituido', defaultNote: 'SUSTITUIDO por: Clínica Telefónica grupal (2 hrs). Misma justificación: agendas cruzadas.' },
      { name: 'Mesa de estrategia de producto (2 hrs)', defaultStatus: 'pendiente', defaultNote: 'Por agendar Semanas 5-6. Coordinar con Blanca disponibilidad del equipo.' },
    ]
  },
  {
    group: 'Desarrollo persona interna',
    items: [
      { name: 'Plan de desarrollo y criterios de autonomía', defaultStatus: 'fase2', defaultNote: 'REPROGRAMADO A FASE 2 por decisión estratégica conjunta: fase actual del equipo requiere consolidar estructura, recluta y cierres antes de desarrollar persona interna.' },
    ]
  },
];

const EXTRAS_DELIVERED = [
  { title: 'HTML de propuesta de cierre · 2 fases', desc: 'Herramienta viva para presentar coberturas/pagos/recuperación + tabla de valores. Diseñada cuando Blanca envía la cotización. No estaba en el contrato original.' },
  { title: 'Presentación mini · Clínica telefónica', desc: 'Material adicional a las 5 presentaciones del onboarding, usada en la sesión grupal de clínica telefónica.' },
  { title: 'Presentación ejemplo · Arranques lunes', desc: 'Material adicional creado como ejemplo para los arranques semanales de los lunes con los agentes. Complementa las 5 oficiales del onboarding.' },
  { title: 'Guiones telefónicos con objeciones', desc: 'Guiones entregados e implementados. Incluye manejo de objeciones frecuentes. No estaban en el contrato; sustituyen parcialmente el Protocolo post-cita.' },
  { title: 'Sistema 25 puntos en línea', desc: 'Sistema integral de seguimiento y revisión que cubre función de embudo + seguimiento básico del agente.' },
  { title: 'Ficha de levantamiento · HTML', desc: 'Antes Excel, ahora HTML automatizado con validaciones. Modernización real del proceso de recluta.' },
  { title: 'Checklist Ruta de Ingreso · imprimible', desc: 'Checklist HTML imprimible base para el Business Plan que pide SMNYL. Valor estratégico adicional.' },
];

/* FICHAS precargadas */
const SEED_FICHAS = {
  katia: {
    perfil: 'Agente con alta actividad desde la Semana 1. Compromiso constante con la agenda. Ha ejecutado más citas que ningún otro agente del grupo.',
    fortalezas: 'Buena escucha activa en la cita inicial. Aplica diagnóstico. Maneja bien rapport. Ejecuta con disciplina.',
    puntosMejora: 'Mejorar estructura de propuesta para acelerar cierre. Reforzar técnica de referidos post-cierre.',
    comentarios: 'Primer cierre del programa fue con ella. Agente con potencial de convertirse en caso de éxito documentado para futuras cohortes.',
    materiales: [
      { text: 'HTML de propuesta de cierre entregado', date: '2026-04-03', done: true },
      { text: 'ANF editable - explicado en sesión 1 a 1', date: '2026-03-28', done: true },
      { text: 'Guiones telefónicos con objeciones', date: '2026-04-04', done: true },
    ],
    pendientes: [
      { text: 'Role-play de referidos post-cierre', date: '2026-04-20', done: false },
      { text: 'Revisar propuestas pendientes antes del cierre', date: '2026-04-15', done: false },
    ],
  },
  ana: {
    perfil: 'Agente de alta actividad. Trabaja 100% por Zoom. Detección de necesidades sólida.',
    fortalezas: 'Excelente escucha activa en Zoom. Sabe ajustar cotización a presupuesto. Tono cálido y profesional.',
    puntosMejora: 'Reforzar manejo de objeciones virtuales. Explorar mejores herramientas de propuesta en pantalla compartida.',
    comentarios: 'Segundo cierre del programa fue con ella. Zoom no es limitante; documentar su estilo para replicar.',
    materiales: [
      { text: 'HTML de propuesta de cierre entregada', date: '2026-04-05', done: true },
      { text: 'ANF editable - sesión 1 a 1 virtual', date: '2026-03-28', done: true },
      { text: 'Guiones telefónicos con objeciones', date: '2026-04-04', done: true },
    ],
    pendientes: [
      { text: 'Sesión de técnicas de cierre virtual', date: '2026-04-18', done: false },
      { text: 'Seguimiento de prospectos activos', date: '2026-04-14', done: false },
    ],
  },
  liz: {
    perfil: 'Agente más avanzada al inicio. Blanca la acompañó conmigo. 3 iniciales ejecutadas, pero 3 cierres se cayeron: 2 reagendadas, 1 perdida.',
    fortalezas: 'Diagnóstico sólido en cita inicial. Buena conexión con prospecto. Agenda activa.',
    puntosMejora: 'PUNTO CRÍTICO: manejo de objeciones en cierre. Revisar calidad de propuesta previa al cierre. Posible brecha entre valor percibido y precio.',
    comentarios: 'Iba más avanzada que el resto, pero los cierres se están cayendo. Reunión 1 a 1 urgente con ella + Blanca. Post-mortem del caso perdido.',
    materiales: [
      { text: 'HTML de propuesta de cierre - usado con L1 y L2', date: '2026-04-04', done: true },
      { text: 'ANF editable', date: '2026-03-27', done: true },
    ],
    pendientes: [
      { text: 'Role-play intensivo de manejo de objeciones', date: '2026-04-14', done: false },
      { text: 'Revisar propuestas reagendadas antes del re-cierre', date: '2026-04-15', done: false },
      { text: 'Post-mortem del caso perdido L3', date: '2026-04-13', done: false },
    ],
  },
  jorge: {
    perfil: 'Agente con agenda débil. 3 iniciales agendadas en 3 semanas, las 3 canceladas.',
    fortalezas: 'Mantiene la intención de agendar. Responde a Blanca.',
    puntosMejora: 'Compromiso del prospecto al agendar. Calidad de la prospección. Mejor reconfirmación 24h antes.',
    comentarios: 'Problema no es de proceso, es de agenda y calidad del prospecto. Plática con Blanca urgente antes del 20 de abril.',
    materiales: [
      { text: 'Presentación del agente (3 slides)', date: '2026-03-28', done: true },
    ],
    pendientes: [
      { text: 'Revisión de script de agendamiento', date: '2026-04-14', done: false },
      { text: 'Decisión de continuidad con Blanca', date: '2026-04-20', done: false },
    ],
  },
  eva: {
    perfil: 'Familiar de Blanca, vive en Salina Cruz. Todo por Zoom. Citas ejecutadas pero con prospectos no calificados.',
    fortalezas: 'Disciplina para agendar pese a distancia. Aprovecha herramientas virtuales.',
    puntosMejora: 'FILTRO DE PROSPECCIÓN. Prospectos no prestan atención o ya tienen seguros. Enseñar cómo calificar antes de agendar.',
    comentarios: 'El problema no es la ejecución de Eva, es la calidad del prospecto. Sesión específica de prospección estratégica.',
    materiales: [
      { text: 'HTML de propuesta de cierre', date: '2026-04-03', done: true },
      { text: 'ANF editable - explicado por Zoom', date: '2026-04-02', done: true },
    ],
    pendientes: [
      { text: 'Sesión de calificación de prospecto', date: '2026-04-16', done: false },
      { text: 'Criterios mínimos para agendar', date: '2026-04-16', done: false },
    ],
  },
  vicente: {
    perfil: 'Agente sin contacto. No ha respondido a Blanca. No ha agendado. No ha participado.',
    fortalezas: 'Por evaluar.',
    puntosMejora: 'Definir estatus real con Blanca.',
    comentarios: 'Punto de decisión pendiente con Blanca antes de Semana 4. Si no hay contacto en 72h, recomiendo cerrarlo del conteo.',
    materiales: [],
    pendientes: [
      { text: 'Reunión de decisión con Blanca sobre Vicente', date: '2026-04-15', done: false },
    ],
  },
};

/* v5.1 · SEED_ACTIVITIES vaciado · los nombres genéricos "Prospecto N" se eliminaron.
   Las actividades se registran manualmente con nombres reales de prospectos. */
const SEED_ACTIVITIES = [];

/* ================================================================
   STATE
================================================================ */
const STORAGE_KEY = 'bienestar_seguimiento_v5_2';

let state = {
  agents: [],
  activities: [],
  deliverables: {},
  fichas: {},
  extras: [],
  nextSteps: [],
  inducciones: [],
  currentAgent: null,
  currentSubtab: 'bitacora',
};

const SEED_NEXT_STEPS = [
  { id: 'ns1', icon: 'teal', title: 'Foco mantener con Katia y Ana', text: 'Llevar al ciclo completo. Prioridad en referidos post-cierre.' },
  { id: 'ns2', icon: 'amber', title: 'Rescate de cierres de Liz', text: 'Acompañar las 2 reagendadas. Role-play de manejo de objeciones previo.' },
  { id: 'ns3', icon: 'purple', title: 'Decisión sobre Jorge y Vicente (Blanca)', text: 'Reunión de definición antes del 20 abr: continuidad, ajuste de agenda o baja del programa.' },
  { id: 'ns4', icon: 'blue', title: 'Cerrar Kahoots y afinar presentaciones', text: 'Afinar 5 presentaciones oficiales + diseñar los 5 Kahoots pendientes. Base de la segunda cohorte.' },
];

/* v5.2 · Seed inducciones: primera cohorte realizada, segunda pendiente */
const SEED_INDUCCIONES = [
  { id: 'ind1', label: 'Inducción · Cohorte 1', status: 'done', startDate: '2026-03-25', endDate: '2026-03-31', note: 'Primera cohorte completada (5 días)' },
  { id: 'ind2', label: 'Inducción · Cohorte 2', status: 'pending', startDate: '', endDate: '', note: 'Por agendar · fechas a definir' },
];

function createEmptyFicha() {
  return { perfil: '', fortalezas: '', puntosMejora: '', comentarios: '', materiales: [], pendientes: [] };
}

function buildDeliverablesState() {
  const deliverables = {};
  DELIVERABLES_TEMPLATE.forEach(group => {
    group.items.forEach(item => {
      const key = group.group + '::' + item.name;
      deliverables[key] = {
        status: item.defaultStatus,
        note: item.defaultNote || '',
        date: '',
        link: '',
      };
    });
  });
  return deliverables;
}

function ensureChecklistIds(items, prefix) {
  if (!Array.isArray(items)) return [];
  return items.map((item, index) => ({ ...item, id: item.id || (prefix + index) }));
}

function buildSeedFichas() {
  const fichas = JSON.parse(JSON.stringify(SEED_FICHAS));
  Object.keys(fichas).forEach(agentId => {
    fichas[agentId].materiales = ensureChecklistIds(fichas[agentId].materiales, 'm_' + agentId + '_');
    fichas[agentId].pendientes = ensureChecklistIds(fichas[agentId].pendientes, 'p_' + agentId + '_');
  });
  return fichas;
}

function buildDefaultState() {
  return {
    agents: [...DEFAULT_AGENTS],
    activities: [...SEED_ACTIVITIES].map((activity, index) => ({ ...activity, id: activity.id || ('seed_' + index) })),
    deliverables: buildDeliverablesState(),
    fichas: buildSeedFichas(),
    extras: EXTRAS_DELIVERED.map((extra, index) => ({ id: 'ex_' + index, ...extra })),
    nextSteps: [...SEED_NEXT_STEPS],
    inducciones: JSON.parse(JSON.stringify(SEED_INDUCCIONES)),
    cierres: [],
    currentAgent: DEFAULT_AGENTS[0] ? DEFAULT_AGENTS[0].id : null,
    currentSubtab: 'bitacora',
  };
}

function normalizeStateSnapshot(snapshot) {
  const defaults = buildDefaultState();
  const raw = snapshot && typeof snapshot === 'object' ? snapshot : {};
  const agents = Array.isArray(raw.agents) && raw.agents.length > 0 ? raw.agents : defaults.agents;
  const deliverables = (raw.deliverables && typeof raw.deliverables === 'object')
    ? { ...defaults.deliverables, ...raw.deliverables }
    : defaults.deliverables;
  const sourceFichas = raw.fichas && typeof raw.fichas === 'object' ? raw.fichas : {};
  const fichas = { ...buildSeedFichas() };

  Object.entries(sourceFichas).forEach(([agentId, ficha]) => {
    const safeFicha = ficha && typeof ficha === 'object' ? ficha : {};
    fichas[agentId] = {
      ...createEmptyFicha(),
      ...fichas[agentId],
      ...safeFicha,
      materiales: ensureChecklistIds(safeFicha.materiales || fichas[agentId]?.materiales, 'm_' + agentId + '_'),
      pendientes: ensureChecklistIds(safeFicha.pendientes || fichas[agentId]?.pendientes, 'p_' + agentId + '_'),
    };
  });

  agents.forEach(agent => {
    if (!fichas[agent.id]) {
      fichas[agent.id] = createEmptyFicha();
    }
  });

  return {
    agents,
    activities: Array.isArray(raw.activities) ? raw.activities : defaults.activities,
    deliverables,
    fichas,
    extras: Array.isArray(raw.extras) ? raw.extras : defaults.extras,
    nextSteps: Array.isArray(raw.nextSteps) ? raw.nextSteps : defaults.nextSteps,
    inducciones: Array.isArray(raw.inducciones) ? raw.inducciones : defaults.inducciones,
    cierres: Array.isArray(raw.cierres) ? raw.cierres : defaults.cierres,
    currentAgent: raw.currentAgent || defaults.currentAgent,
    currentSubtab: raw.currentSubtab || defaults.currentSubtab,
  };
}

function applyStateSnapshot(snapshot) {
  Object.assign(state, normalizeStateSnapshot(snapshot));
  if (!state.agents.find(agent => agent.id === state.currentAgent)) {
    state.currentAgent = state.agents.length > 0 ? state.agents[0].id : null;
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      applyStateSnapshot(JSON.parse(raw));
    } else {
      applyStateSnapshot(buildDefaultState());
      saveState();
    }
  } catch(e) {
    console.error('Load error', e);
    applyStateSnapshot(buildDefaultState());
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      agents: state.agents,
      activities: state.activities,
      deliverables: state.deliverables,
      fichas: state.fichas,
      extras: state.extras,
      nextSteps: state.nextSteps,
      inducciones: state.inducciones,
      cierres: state.cierres || [],
      currentAgent: state.currentAgent,
      currentSubtab: state.currentSubtab,
    }));
  } catch(e) {
    console.error('Save error', e);
    showToast('Error al guardar (límite de almacenamiento)', 'error');
  }
}

/* HELPERS */
function uid() { return 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7); }
function slugify(s) { return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, ''); }

function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + (type || 'success');
  setTimeout(() => t.classList.remove('show'), 2000);
}

const readyTasks = [];
let readyTasksRan = false;

function registerOnReady(task) {
  if (readyTasksRan) {
    task();
    return;
  }
  readyTasks.push(task);
}

function runOnReadyTasks() {
  readyTasksRan = true;
  readyTasks.splice(0).forEach(task => task());
}

function refreshDashboardAndAgents() {
  renderDashboard();
  renderAgentPanels();
}

function refreshAllViews() {
  renderDashboard();
  renderAgentTabs();
  renderAgentPanels();
  renderDeliverables();
  renderCierresTable_v53();
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return d.getDate() + ' ' + months[d.getMonth()];
}

function computeCurrentWeek() {
  const start = new Date(PROGRAM.startDate + 'T00:00:00');
  const today = new Date();
  const diffDays = Math.floor((today - start) / (1000 * 60 * 60 * 24));
  const week = Math.floor(diffDays / 7) + 1;
  return Math.max(1, Math.min(week, PROGRAM.totalWeeks));
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function escapeAttr(s) { return String(s).replace(/'/g, "\\'").replace(/"/g, "&quot;"); }
