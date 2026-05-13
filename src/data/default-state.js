/* ================================================================
   DEFAULT DATA + BUILDERS
================================================================ */
const DEFAULT_PROGRAM_SETTINGS = {
  title: 'Seguimiento · Paquete 1',
  subtitle: 'Blanca Rosas Facio · Promotoría #2984',
  phaseTitle: 'Programa de Desarrollo Comercial · Fase 1',
  phaseName: 'Arranque y Estabilización',
  startDate: '2026-03-25',
  endDate: '2026-05-06',
  totalWeeks: 6,
  citasContratadas: 35,
  totalEntregables: 21,
  montoTotal: 29000,
};

const DEFAULT_BRANDING_SETTINGS = {
  brandBadge: 'BIENESTAR PATRIMONIAL',
  currency: 'MXN',
};

const DEFAULT_CATALOGS = {
  agentStatuses: [
    { value: 'gray', label: 'Sin activación (nuevo)' },
    { value: 'amber', label: 'Seguimiento' },
    { value: 'green', label: 'Foco activo' },
    { value: 'red', label: 'Bajo impacto' },
    { value: 'blue', label: 'Avanzado' },
  ],
  activityTypes: [
    { value: 'inicial', label: 'Cita inicial' },
    { value: 'cierre', label: 'Cita de cierre (propuesta)' },
    { value: 'solicitud', label: 'Solicitud llenada' },
    { value: 'poliza', label: 'Póliza emitida' },
    { value: 'referido', label: 'Cita por referido' },
    { value: 'roleplay', label: 'Role-play (cancelación)' },
  ],
  activityResults: [
    { value: 'ok', label: 'Ejecutada' },
    { value: 'cerrada', label: 'Cerró (venta)' },
    { value: 'contrapropuesta', label: 'Contrapropuesta' },
    { value: 'noAhora', label: 'Por ahora no' },
    { value: 'reagend', label: 'Reagendada' },
    { value: 'cancel', label: 'Cancelada' },
    { value: 'sustituida', label: 'Sustituida con otro prospecto' },
    { value: 'perdida', label: 'Perdida' },
  ],
  cierreStatuses: [
    { value: 'pendiente', label: 'Pendiente · falta armar cotización' },
    { value: 'en_progreso', label: 'En progreso · cotizando' },
    { value: 'listo', label: 'Listo · cotización armada, falta pasar a HTML' },
  ],
  cierrePriorities: [
    { value: 'alta', label: 'Alta' },
    { value: 'media', label: 'Media' },
    { value: 'baja', label: 'Baja' },
  ],
  deliverableStatuses: [
    { value: 'entregado', label: 'Entregado' },
    { value: 'sustituido', label: 'Sustituido' },
    { value: 'progreso', label: 'En progreso' },
    { value: 'diferido', label: 'Diferido' },
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'fase2', label: 'Mover a Fase 2' },
  ],
};

const CATALOG_SEMANTIC_KEYS = {
  agentStatuses: ['gray', 'amber', 'green', 'red', 'blue'],
  activityTypes: ['inicial', 'cierre', 'solicitud', 'poliza', 'referido', 'roleplay'],
  activityResults: ['ok', 'cerrada', 'contrapropuesta', 'noAhora', 'reagend', 'cancel', 'sustituida', 'perdida'],
  cierreStatuses: ['pendiente', 'en_progreso', 'listo'],
  cierrePriorities: ['alta', 'media', 'baja'],
  deliverableStatuses: ['entregado', 'sustituido', 'progreso', 'diferido', 'pendiente', 'fase2'],
};

const PROGRAM = DEFAULT_PROGRAM_SETTINGS;

const DEFAULT_AGENTS = [
  { id: 'katia', name: 'Katia', initials: 'K', status: 'green', tag: 'Foco principal · Alta actividad' },
  { id: 'ana', name: 'Ana', initials: 'A', status: 'green', tag: 'Foco principal · Zoom' },
  { id: 'liz', name: 'Liz', initials: 'L', status: 'amber', tag: 'Blanca la lleva · Ciclo avanzado' },
  { id: 'jorge', name: 'Jorge', initials: 'J', status: 'red', tag: 'Agenda cancelada Sem 1-3' },
  { id: 'eva', name: 'Eva', initials: 'E', status: 'red', tag: 'Zoom Salina Cruz · Familiar' },
  { id: 'vicente', name: 'Vicente', initials: 'V', status: 'gray', tag: 'Sin contacto · A definir' },
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

function cloneSeed(value) {
  return JSON.parse(JSON.stringify(value));
}

function buildDefaultSettings() {
  return {
    program: { ...DEFAULT_PROGRAM_SETTINGS },
    branding: { ...DEFAULT_BRANDING_SETTINGS },
    catalogs: cloneSeed(DEFAULT_CATALOGS),
  };
}

function normalizeCatalogEntries(entries, fallbackEntries) {
  const safeFallback = Array.isArray(fallbackEntries) ? fallbackEntries : [];
  const source = Array.isArray(entries) ? entries : safeFallback;
  const length = Math.max(source.length, safeFallback.length);
  const normalized = [];

  for (let index = 0; index < length; index++) {
    const fallback = safeFallback[index] && typeof safeFallback[index] === 'object' ? safeFallback[index] : {};
    const raw = source[index] && typeof source[index] === 'object' ? source[index] : {};
    const value = String(raw.value || fallback.value || '').trim();
    const label = String(raw.label || fallback.label || value).trim();
    if (!value) continue;
    normalized.push({ value, label: label || value });
  }

  return normalized;
}

function normalizeSettings(settings) {
  const defaults = buildDefaultSettings();
  const raw = settings && typeof settings === 'object' ? settings : {};
  const rawCatalogs = raw.catalogs && typeof raw.catalogs === 'object' ? raw.catalogs : {};
  const catalogs = {};

  Object.keys(defaults.catalogs).forEach(name => {
    catalogs[name] = normalizeCatalogEntries(rawCatalogs[name], defaults.catalogs[name]);
  });

  return {
    program: {
      ...defaults.program,
      ...(raw.program && typeof raw.program === 'object' ? raw.program : {}),
    },
    branding: {
      ...defaults.branding,
      ...(raw.branding && typeof raw.branding === 'object' ? raw.branding : {}),
    },
    catalogs,
  };
}

function getSettings() {
  if (typeof state === 'object' && state && state.settings) {
    return normalizeSettings(state.settings);
  }
  return buildDefaultSettings();
}

function getProgramSettings() {
  return getSettings().program;
}

function getBrandingSettings() {
  return getSettings().branding;
}

function getCatalog(name) {
  const settings = getSettings();
  return cloneSeed(settings.catalogs[name] || DEFAULT_CATALOGS[name] || []);
}

function getCatalogEntryBySemantic(name, semanticKey) {
  const semanticKeys = CATALOG_SEMANTIC_KEYS[name] || [];
  const index = semanticKeys.indexOf(semanticKey);
  const catalog = getCatalog(name);
  if (index >= 0 && catalog[index]) return catalog[index];
  return catalog.find(entry => entry.value === semanticKey) || null;
}

function getCatalogSemanticValue(name, semanticKey) {
  const entry = getCatalogEntryBySemantic(name, semanticKey);
  return entry && entry.value ? entry.value : semanticKey;
}

function getCatalogSemanticKeyForValue(name, value) {
  const semanticKeys = CATALOG_SEMANTIC_KEYS[name] || [];
  const catalog = getCatalog(name);
  const index = catalog.findIndex(entry => entry.value === value);
  if (index >= 0 && semanticKeys[index]) return semanticKeys[index];
  return index >= 0 ? 'default' : (semanticKeys.includes(value) ? value : 'default');
}

function getCatalogLabel(name, value) {
  const catalog = getCatalog(name);
  const found = catalog.find(entry => entry.value === value);
  if (found && found.label) return found.label;
  const fallback = (DEFAULT_CATALOGS[name] || []).find(entry => entry.value === value);
  return fallback && fallback.label ? fallback.label : value;
}

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
  const fichas = cloneSeed(SEED_FICHAS);
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
    inducciones: cloneSeed(SEED_INDUCCIONES),
    cierres: [],
    settings: buildDefaultSettings(),
    currentAgent: DEFAULT_AGENTS[0] ? DEFAULT_AGENTS[0].id : null,
    currentSubtab: 'bitacora',
  };
}
