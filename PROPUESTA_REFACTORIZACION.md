# Propuesta De Refactorización

## Diagnóstico

El proyecto está concentrado en un único archivo `Portal_Seguimiento.html` que mezcla:

- estructura HTML
- estilos
- seeds de datos
- persistencia en `localStorage`
- render de vistas
- reglas de negocio
- observadores y extensiones incrementales `v4.x` y `v5.x`

Eso genera tres problemas principales:

1. Acoplamiento fuerte: cualquier cambio en actividades, dashboard o modales obliga a tocar el mismo archivo.
2. Duplicación funcional: había varios `DOMContentLoaded`, `MutationObserver` y secuencias repetidas de `save + render`.
3. Fuente de verdad difusa: el HTML contiene un snapshot precargado y además existe un JSON externo con datos distintos.

## Separación Objetivo

### 1. Capa de datos

- `data/default-state.js`
- `data/catalogs.js`
- `data/migrations.js`

Responsabilidad:

- estado inicial
- normalización de snapshots
- migración de respaldos viejos
- catálogos de tipos, estados y etiquetas

### 2. Capa de estado

- `src/store/state.js`
- `src/store/persistence.js`
- `src/store/bootstrap.js`

Responsabilidad:

- `loadState`
- `saveState`
- `applyStateSnapshot`
- seeds por defecto
- control de `localStorage`

### 3. Capa de dominio

- `src/domain/activities.js`
- `src/domain/agents.js`
- `src/domain/deliverables.js`
- `src/domain/prospects.js`

Responsabilidad:

- cálculos de métricas
- agrupación por prospecto
- conversión de etapas
- semáforos
- reglas de negocio del flujo comercial

### 4. Capa de UI

- `src/ui/dashboard.js`
- `src/ui/agents.js`
- `src/ui/deliverables.js`
- `src/ui/modals.js`
- `src/ui/toast.js`

Responsabilidad:

- render de vistas
- render de tablas y cards
- apertura/cierre de modales
- notificaciones

### 5. Capa de extensiones

- `src/extensions/prospect-flow.js`
- `src/extensions/duplicates.js`
- `src/extensions/inducciones.js`
- `src/extensions/cierres.js`

Responsabilidad:

- features aditivas
- observers puntuales
- hooks post-guardado

## Orden Recomendado

1. Extraer primero `store` y `domain` sin tocar el HTML visual.
2. Extraer después `dashboard`, `agents` y `deliverables` a módulos separados.
3. Dejar `extensions` al final para convertir cada bloque `v4.x` / `v5.x` en feature aislada.
4. Mover el snapshot actual a una sola fuente de verdad y dejar el JSON solo como respaldo importable.

## Código Muerto O Redundante Detectado

- snapshot precargado que sobreescribía persistencia local en cada carga
- múltiples `DOMContentLoaded` para el mismo arranque
- observers duplicados sobre `toast` y `activityModal`
- métricas no usadas en `agentStats`
- divergencia entre el snapshot del HTML y `bienestar-seguimiento-2026-05-07-2.json`

## Siguiente Fase

La siguiente refactorización debería dividir físicamente `Portal_Seguimiento.html` en:

- `index.html`
- `assets/portal.css`
- `src/app.js`
- `src/store/*`
- `src/domain/*`
- `src/ui/*`
- `src/extensions/*`

El objetivo no es solo “ordenar archivos”, sino dejar una frontera clara entre datos, reglas y render para que cada cambio futuro toque una sola capa.
