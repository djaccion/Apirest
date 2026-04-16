# The Power Grid

> SPA dashboard en Vanilla JS sin dependencias externas para visualización de estado de herramientas DevOps y métricas DORA en tiempo real.

---

## Tabla de Contenidos

- [1. Descripción General de la Arquitectura](#1-descripción-general-de-la-arquitectura)
- [2. Diagrama de Capas](#2-diagrama-de-capas)
- [3. Estructura de Archivos del Proyecto](#3-estructura-de-archivos-del-proyecto)
- [4. Descripción de Módulos JavaScript](#4-descripción-de-módulos-javascript)
- [5. Flujo de Datos y Ciclo de Vida](#5-flujo-de-datos-y-ciclo-de-vida)
- [6. El Loop Maestro de Animación](#6-el-loop-maestro-de-animación)
- [7. Sistema de KPIs y Configuración de Boosts](#7-sistema-de-kpis-y-configuración-de-boosts)
- [8. Modo Overdrive](#8-modo-overdrive)
- [9. Guía de Instalación y Ejecución](#9-guía-de-instalación-y-ejecución)
- [10. Decisiones de Diseño y Justificaciones](#10-decisiones-de-diseño-y-justificaciones)
- [11. Consideraciones de Seguridad](#11-consideraciones-de-seguridad)
- [12. Guía de Contribución y Convenciones](#12-guía-de-contribución-y-convenciones)

---

## 1. Descripción General de la Arquitectura

The Power Grid adopta una arquitectura Frontend SPA puramente cliente, implementada en Vanilla JS sin ninguna dependencia externa. El patrón estructural central es MVC adaptado al entorno de un navegador moderno sin framework.

**AppState como Modelo:** Un objeto global `AppState` centraliza todo el estado de la aplicación: el estado booleano de activación de los cinco módulos de herramientas, el flag de modo Overdrive, los valores actuales de cada KPI y la configuración de boosts por herramienta definida en `KPI_CONFIG`. Este objeto nunca se muta directamente desde el exterior; toda modificación ocurre exclusivamente a través de funciones de transición puras definidas en `appState.js`, garantizando trazabilidad y predictibilidad del estado.

**Módulos de render como Vista:** Los subsistemas de canvas (`particleSystem`, `connectionRenderer`, `coreRenderer`) y los componentes de UI DOM (`kpiPanel`, `speedometer`, `radarChart`, `nodeRing`) constituyen la capa de Vista. Cada módulo de render lee el estado actual de `AppState` en cada frame y produce la representación visual correspondiente. No almacenan estado propio derivado del negocio; son funciones de proyección del estado hacia píxeles o nodos DOM.

**Event handlers como Controlador:** Los manejadores de eventos registrados en `main.js` y en los componentes de UI actúan como Controladores. Interceptan las interacciones del usuario, invocan las funciones de transición de `appState.js` y delegan el resto al ciclo de render. No contienen lógica de negocio ni manipulan el DOM directamente más allá de lo estrictamente necesario para registrar el evento.

**Patrón Observer/Pub-Sub:** Los cambios en `AppState` se propagan de forma desacoplada a múltiples subsistemas mediante un patrón Observer implícito en el loop maestro de `requestAnimationFrame`. En cada tick del loop, cada subsistema consulta el estado y reacciona si detecta cambios relevantes. Adicionalmente, las CSS Custom Properties actúan como canal de comunicación reactivo entre el estado JS y el sistema de estilos: cuando `AppState` cambia, `document.documentElement.style.setProperty` actualiza las variables CSS, desencadenando transiciones visuales en todo el tema sin que los módulos de estilo necesiten conocer la lógica de negocio. Este mecanismo garantiza que los subsistemas de KPIs, Canvas y CSS permanezcan desacoplados entre sí y solo dependan del estado centralizado.

---

## 2. Diagrama de Capas

```
+------------------------------------------------------------------+
|                        CAPA DE UI DOM                            |
|  Componentes KPI, velocímetro, radar, nodos: accesibilidad y     |
|  valores numéricos renderizados en elementos DOM con textContent  |
+------------------------------------------------------------------+
|                     CAPA DE RENDER CANVAS                        |
|  Dos canvas superpuestos: partículas, bezier curves, núcleo Jira  |
|  y pulsos de datos animados via requestAnimationFrame            |
+------------------------------------------------------------------+
|                   CAPA DE ESTILOS DINÁMICOS                      |
|  CSS Custom Properties modificadas desde JS con setProperty;     |
|  transiciones de tema global, modo Overdrive neón cyan           |
+------------------------------------------------------------------+
|                       CAPA DE ESTADO                             |
|  AppState: fuente única de verdad; modificado solo via           |
|  funciones de transición puras definidas en appState.js          |
+------------------------------------------------------------------+
```

---

## 3. Estructura de Archivos del Proyecto

```
the-power-grid/
|
+-- index.html                  # Punto de entrada HTML de la SPA
+-- main.js                     # Bootstrap, inicialización y orquestación
|
+-- state/
|   +-- appState.js             # Estado global y funciones de transición puras
|
+-- config/
|   +-- kpiConfig.js            # Configuración KPIs, boosts por herramienta, refs DOM
|   +-- moduleConfig.js         # Config visual de los 5 nodos: colores, posiciones, labels
|
+-- canvas/
|   +-- particleSystem.js       # Sistema de partículas con pool, física simple
|   +-- connectionRenderer.js   # Bezier curves, pulsos de datos, glow effects
|   +-- coreRenderer.js         # Núcleo Jira, anillos orbitales, rotación animada
|
+-- ui/
|   +-- kpiPanel.js             # Actualización paneles laterales, animación de números
|   +-- speedometer.js          # Widget velocímetro en canvas dedicado
|   +-- radarChart.js           # Widget radar chart 7 ejes en canvas dedicado
|   +-- nodeRing.js             # Renderizado y posicionamiento radial de 5 nodos
|   +-- overdriveOverlay.js     # Superposición visual modo Overdrive, efectos neón
|   +-- doraBar.js              # Barra inferior métricas DORA y trazabilidad
|
+-- utils/
|   +-- animation.js            # Funciones easing, interpolación, animateValue
|   +-- mathHelpers.js          # Cálculos geométricos posicionamiento radial y canvas
|
+-- styles/
    +-- main.css                # Variables CSS, layout base, Flexbox grid
    +-- modules.css             # Estilos nodos, colores específicos por herramienta
    +-- animations.css          # @keyframes rotación, latidos, parpadeo Overdrive
    +-- overdrive.css           # Tema neón cyan completo para modo Overdrive
    +-- kpi-panels.css          # Estilos paneles laterales y barra inferior DORA
```

---

## 4. Descripción de Módulos JavaScript

---

### `main.js`

- **Responsabilidad principal:** Punto de entrada de la aplicación. Inicializa todos los subsistemas, registra los event listeners de interacción del usuario y contiene el único loop maestro `requestAnimationFrame` que orquesta el render de todos los módulos en cada frame.
- **Dependencias que consume:** `appState.js`, `kpiConfig.js`, `moduleConfig.js`, `particleSystem.js`, `connectionRenderer.js`, `coreRenderer.js`, `kpiPanel.js`, `speedometer.js`, `radarChart.js`, `nodeRing.js`, `overdriveOverlay.js`, `doraBar.js`, `animation.js`, `mathHelpers.js`
- **Consumido por:** Ningún módulo. Es el punto de entrada raíz.

---

### `state/appState.js`

- **Responsabilidad principal:** Define el objeto `AppState` como fuente única de verdad y exporta las funciones de transición puras que son el único mecanismo autorizado para modificar el estado. Gestiona el estado booleano de los cinco módulos, el flag de Overdrive y los valores actuales de KPIs.
- **Dependencias que consume:** `kpiConfig.js`
- **Consumido por:** `main.js`, `kpiPanel.js`, `connectionRenderer.js`, `coreRenderer.js`, `particleSystem.js`, `overdriveOverlay.js`, `nodeRing.js`, `doraBar.js`, `speedometer.js`, `radarChart.js`

---

### `config/kpiConfig.js`

- **Responsabilidad principal:** Define la configuración estática de todos los KPIs del dashboard: nombres, valores base, valores máximos, unidades de medida, referencias a elementos DOM y los valores de boost que cada herramienta aporta al activarse.
- **Dependencias que consume:** Ninguna. Es un módulo de configuración pura.
- **Consumido por:** `appState.js`, `kpiPanel.js`, `speedometer.js`, `radarChart.js`, `doraBar.js`

---

### `config/moduleConfig.js`

- **Responsabilidad principal:** Define la configuración visual estática de los cinco nodos de herramientas: colores de acento, ángulos de posicionamiento radial, etiquetas de texto y referencias de iconos. Centraliza los datos visuales para que los módulos de render no contengan constantes hardcodeadas.
- **Dependencias que consume:** Ninguna. Es un módulo de configuración pura.
- **Consumido por:** `main.js`, `nodeRing.js`, `connectionRenderer.js`, `particleSystem.js`

---

### `canvas/particleSystem.js`

- **Responsabilidad principal:** Gestiona el sistema de partículas flotantes del fondo. Implementa un pool de objetos para reutilizar instancias de partículas y evitar presión sobre el Garbage Collector. Aplica física simple de movimiento y ciclo de vida por frame.
- **Dependencias que consume:** `appState.js`, `moduleConfig.js`, `mathHelpers.js`
- **Consumido por:** `main.js` (invocado desde el loop maestro)

---

### `canvas/connectionRenderer.js`

- **Responsabilidad principal:** Dibuja las bezier curves que conectan cada nodo periférico con el núcleo central. Anima pulsos de datos que viajan a lo largo de las curvas mediante interpolación paramétrica. Aplica efectos de glow proporcionales al estado de activación de cada módulo.
- **Dependencias que consume:** `appState.js`, `moduleConfig.js`, `mathHelpers.js`, `animation.js`
- **Consumido por:** `main.js` (invocado desde el loop maestro)

---

### `canvas/coreRenderer.js`

- **Responsabilidad principal:** Renderiza el núcleo central del dashboard (Jira), incluyendo los anillos orbitales concéntricos y la animación de rotación continua. La intensidad visual del núcleo escala con el número de módulos activos en `AppState`.
- **Dependencias que consume:** `appState.js`, `mathHelpers.js`, `animation.js`
- **Consumido por:** `main.js` (invocado desde el loop maestro)

---

### `ui/kpiPanel.js`

- **Responsabilidad principal:** Actualiza los paneles laterales de KPIs en el DOM. Gestiona la animación de transición numérica de los valores usando `animateValue` de `animation.js`. Inyecta todos los valores exclusivamente via `textContent` por razones de seguridad.
- **Dependencias que consume:** `appState.js`, `kpiConfig.js`, `animation.js`
- **Consumido por:** `main.js` (invocado desde el loop maestro)

---

### `ui/speedometer.js`

- **Responsabilidad principal:** Renderiza el widget de velocímetro en su canvas dedicado. Traduce el valor del KPI correspondiente a un ángulo de aguja y dibuja el arco de escala, la aguja y el valor numérico central en cada frame.
- **Dependencias que consume:** `appState.js`, `kpiConfig.js`, `animation.js`, `mathHelpers.js`
- **Consumido por:** `main.js` (invocado desde el loop maestro)

---

### `ui/radarChart.js`

- **Responsabilidad principal:** Renderiza el widget de radar chart de siete ejes en su canvas dedicado. Calcula los vértices del polígono de datos en coordenadas polares y dibuja la malla de referencia, el polígono de valores actuales y las etiquetas de cada eje.
- **Dependencias que consume:** `appState.js`, `kpiConfig.js`, `mathHelpers.js`, `animation.js`
- **Consumido por:** `main.js` (invocado desde el loop maestro)

---

### `ui/nodeRing.js`

- **Responsabilidad principal:** Gestiona el renderizado y posicionamiento radial de los cinco nodos de herramientas en el DOM. Calcula las coordenadas absolutas de cada nodo usando trigonometría relativa al centro del viewport y actualiza las posiciones en cada evento de resize.
- **Dependencias que consume:** `appState.js`, `moduleConfig.js`, `mathHelpers.js`
- **Consumido por:** `main.js`

---

### `ui/overdriveOverlay.js`

- **Responsabilidad principal:** Gestiona la superposición visual del modo Overdrive. Cuando `AppState` indica que todos los módulos están activos, activa la pantalla de overlay con efectos neón y modifica las CSS Custom Properties globales via `setProperty` para aplicar el tema cyan de `overdrive.css`.
- **Dependencias que consume:** `appState.js`, `animation.js`
- **Consumido por:** `main.js`

---

### `ui/doraBar.js`

- **Responsabilidad principal:** Renderiza y actualiza la barra inferior del dashboard con las métricas DORA (Deployment Frequency, Lead Time, Change Failure Rate, Time to Restore) y los indicadores de trazabilidad. Lee los valores desde `AppState` y los proyecta al DOM via `textContent`.
- **Dependencias que consume:** `appState.js`, `kpiConfig.js`, `animation.js`
- **Consumido por:** `main.js`

---

### `utils/animation.js`

- **Responsabilidad principal:** Provee las funciones utilitarias de animación reutilizables: función de easing `easeOutCubic`, interpolación lineal `lerp` y la función `animateValue` que anima un número desde un valor origen a un destino durante una duración dada usando `requestAnimationFrame`.
- **Dependencias que consume:** Ninguna. Es una utilidad pura sin estado.
- **Consumido por:** `kpiPanel.js`, `speedometer.js`, `radarChart.js`, `connectionRenderer.js`, `coreRenderer.js`, `overdriveOverlay.js`, `doraBar.js`

---

### `utils/mathHelpers.js`

- **Responsabilidad principal:** Provee funciones de cálculo geométrico reutilizables: conversión de coordenadas polares a cartesianas, cálculo de puntos de control para bezier curves, normalización de valores a rangos y utilidades de escalado para canvas con soporte de `devicePixelRatio`.
- **Dependencias que consume:** Ninguna. Es una utilidad pura sin estado.
- **Consumido por:** `particleSystem.js`, `connectionRenderer.js`, `coreRenderer.js`, `speedometer.js`, `radarChart.js`, `nodeRing.js`

---

## 5. Flujo de Datos y Ciclo de Vida

El siguiente flujo describe el ciclo de vida completo desde que el usuario activa un módulo de herramienta hasta que el dashboard refleja el nuevo estado en todos sus subsistemas.

**Paso 1 — Interacción del usuario (`main.js`):**
El usuario hace clic sobre uno de los cinco nodos de herramienta en la interfaz. El event listener registrado en `main.js` mediante `addEventListener` captura el evento `click`. No se utiliza ningún handler inline en el HTML.

**Paso 2 — Invocación de la función de transición (`state/appState.js`):**
El Controlador en `main.js` invoca la función de transición correspondiente exportada por `appState.js`, por ejemplo `toggleModule(moduleId)`. Esta función es pura: recibe el estado actual, calcula el nuevo estado y actualiza `AppState`. Nunca se modifica `AppState` directamente desde fuera de este módulo.

**Paso 3 — Actualización de AppState (`state/appState.js`):**
`AppState` refleja el nuevo estado: el flag booleano del módulo activado cambia a `true`, y los valores de KPI se recalculan sumando los boosts definidos en `kpiConfig.js` para esa herramienta. Si los cinco módulos están ahora activos, el flag `overdrive` se establece en `true` como estado derivado automático.

**Paso 4 — Detección del cambio en el loop maestro (`main.js`):**
En el siguiente tick del loop `requestAnimationFrame` en `main.js`, todos los subsistemas de render son invocados secuencialmente. Cada subsistema lee `AppState` en ese momento y compara con su estado interno previo para determinar si debe actualizar su representación visual.

**Paso 5 — Reacción del subsistema Canvas (`canvas/connectionRenderer.js`, `canvas/coreRenderer.js`, `canvas/particleSystem.js`):**
`connectionRenderer.js` incrementa la intensidad del glow y la frecuencia de pulsos en la curva bezier del nodo recién activado. `coreRenderer.js` ajusta el radio y la velocidad de rotación de los anillos orbitales en proporción al número de módulos activos. `particleSystem.js` aumenta la tasa de emisión de partículas desde la posición del nodo activado.

**Paso 6 — Reacción del subsistema de UI DOM (`ui/kpiPanel.js`):**
`kpiPanel.js` detecta que los valores de KPI en `AppState` han cambiado respecto al frame anterior. Invoca `animateValue` de `utils/animation.js` para cada KPI modificado, iniciando una animación suave desde el valor anterior al nuevo valor. Los números se inyectan en el DOM exclusivamente via `textContent`.

**Paso 7 — Animación de KPIs (`utils/animation.js`):**
La función `animateValue` ejecuta su propio sub-loop de `requestAnimationFrame` durante la duración de la animación, aplicando la curva de easing `easeOutCubic` para que la transición numérica sea visualmente fluida y no abrupta.

**Paso 8 — Activación del modo Overdrive (`ui/overdriveOverlay.js`, `styles/overdrive.css`):**
Si `AppState.overdrive` es `true`, `overdriveOverlay.js` activa la superposición visual y llama a `document.documentElement.style.setProperty` para modificar las CSS Custom Properties definidas en `overdrive.css`. El tema neón cyan se propaga instantáneamente a todos los elementos del DOM que referencian esas variables, sin necesidad de que ningún módulo individual conozca la lógica del modo Overdrive.

---

## 6. El Loop Maestro de Animación

`main.js` contiene un único loop `requestAnimationFrame` que actúa como director de orquesta de todos los subsistemas de render. En cada frame, el loop invoca los módulos en el siguiente orden secuencial y determinista:

```
1. particleSystem.update()   — canvas/particleSystem.js
2. connectionRenderer.draw() — canvas/connectionRenderer.js
3. coreRenderer.draw()       — canvas/coreRenderer.js
4. kpiPanel.update()         — ui/kpiPanel.js
5. speedometer.draw()        — ui/speedometer.js
6. radarChart.draw()         — ui/radarChart.js
```

**Por qué un único loop es la decisión correcta:**

Si cada módulo registrara su propio `requestAnimationFrame` de forma independiente, el navegador podría ejecutarlos en ticks diferentes dentro del mismo frame de pantalla, produciendo condiciones de carrera donde `connectionRenderer` dibuja sobre un estado de `AppState` diferente al que leyó `coreRenderer` milisegundos antes. Esto generaría inconsistencias visuales perceptibles como desincronización entre el estado del núcleo y las conexiones.

Adicionalmente, múltiples loops compitiendo por el contexto de GPU del canvas generan contención de recursos: el compositor del navegador debe gestionar múltiples solicitudes de paint en el mismo frame, incrementando el tiempo de composición y arriesgando dropped frames. Un único loop garantiza que todo el trabajo de render ocurra en una sola fase de paint por frame, maximizando la eficiencia del pipeline de renderizado del navegador.

El loop maestro también simplifica la cancelación: cuando `IntersectionObserver` detecta que el dashboard sale del viewport, basta con cancelar un único `animationFrameId` para detener completamente todo el render y liberar recursos de CPU y GPU.

---

## 7. Sistema de KPIs y Configuración de Boosts

La configuración de todos los KPIs del dashboard reside en `config/kpiConfig.js` como un objeto estático exportado bajo el nombre `KPI_CONFIG`. Este módulo es la fuente de verdad para la definición de métricas y no contiene lógica de negocio.

**Estructura de cada entrada en KPI_CONFIG:**

Cada KPI está definido como un objeto con las siguientes propiedades:
- `id`: identificador único de cadena para referenciar el KPI en el estado y en el DOM
- `label`: nombre legible para mostrar en la interfaz
- `unit`: unidad de medida del valor (porcentaje, tiempo, frecuencia, etc.)
- `baseValue`: valor numérico de partida cuando ningún módulo está activo
- `maxValue`: valor máximo posible para normalización en widgets como el velocímetro y el radar
- `domRef`: referencia al elemento DOM donde se proyecta el valor via `textContent`
- `boosts`: objeto que mapea cada identificador de módulo de herramienta a un valor numérico de incremento

**Mecanismo de boosts:**

Cuando el usuario activa un módulo de herramienta, la función de transición en `appState.js` itera sobre `KPI_CONFIG`, suma los valores del campo `boosts` correspondientes al módulo activado a los valores actuales de `AppState`, y almacena los nuevos valores. Al desactivar un módulo, los boosts se restan. Este mecanismo permite que la configuración de impacto de cada herramienta sobre cada métrica sea declarativa y centralizada en un único archivo, sin lógica dispersa en los módulos de render.

**Los cinco módulos de herramientas** cuyos boosts están configurados en `KPI_CONFIG` corresponden a los cinco nodos definidos en `moduleConfig.js`. Sus identificadores son los definidos en ese archivo de configuración y no deben ser inventados ni asumidos fuera de lo declarado en el código fuente.

**Seguridad en la proyección de valores:**

Todos los valores numéricos calculados a partir de `KPI_CONFIG` se inyectan en el DOM exclusivamente mediante `element.textContent = value`. Nunca se utiliza `innerHTML` para proyectar valores derivados del estado, eliminando cualquier vector de inyección de contenido no confiable.

---

## 8. Modo Overdrive

El modo Overdrive no es un estado independiente que el usuario activa directamente. Es un **estado derivado automático** que `appState.js` calcula en cada llamada a las funciones de transición: si y solo si los cinco módulos de herramientas están simultáneamente activos, el flag `AppState.overdrive` se establece en `true`. Cuando cualquiera de los cinco módulos se desactiva, el flag vuelve a `false` sin intervención adicional.

Esta decisión de diseño elimina la posibilidad de inconsistencias donde el modo Overdrive esté activo pero el estado de los módulos no lo justifique, o viceversa. No existe ninguna función `setOverdrive(true)` que pueda ser llamada independientemente del estado de los módulos.

**Gestión visual del modo Overdrive:**

`ui/overdriveOverlay.js` es el único módulo responsable de la representación visual del modo Overdrive. En cada frame del loop maestro, lee `AppState.overdrive` y determina si debe mostrar u ocultar la superposición. Cuando el modo se activa, este módulo:

1. Hace visible el elemento de overlay con la animación de entrada definida en `styles/animations.css`
2. Llama a `document.documentElement.style.setProperty` para sobreescribir las CSS Custom Properties del tema base con los valores neón cyan definidos en `styles/overdrive.css`
3. Cuando el modo se desactiva, revierte las Custom Properties a sus valores originales, restaurando el tema base mediante una transición CSS suave

**Separación de responsabilidades en Overdrive:**

`overdriveOverlay.js` gestiona la lógica de activación y las modificaciones de CSS Custom Properties. `styles/overdrive.css` contiene exclusivamente las definiciones de los valores de las variables para el tema neón cyan. `styles/animations.css` contiene los `@keyframes` del efecto de parpadeo. Esta separación permite modificar el aspecto visual del modo Overdrive editando únicamente los archivos CSS sin tocar la lógica JS.

---

## 9. Guía de Instalación y Ejecución

The Power Grid no tiene dependencias npm, no requiere proceso de build, no necesita transpilación y no utiliza ningún bundler. El proyecto es un conjunto de archivos estáticos que el navegador consume directamente.

**Pasos para ejecutar el proyecto:**

**1. Clonar el repositorio:**
```bash
git clone <url-del-repositorio>
cd the-power-grid
```

**2. Servir los archivos con un servidor HTTP local:**

Opción A — Live Server de VSCode:
Abrir la carpeta del proyecto en VSCode, hacer clic derecho sobre `index.html` y seleccionar "Open with Live Server".

Opción B — Python (disponible en cualquier sistema con Python instalado):
```bash
# Python 3
python -m http.server 8080

# Python 2
python -m SimpleHTTPServer 8080
```
Luego abrir `http://localhost:8080` en el navegador.

Opción C — Node.js con npx (sin instalación permanente):
```bash
npx serve .
```

**3. Abrir en el navegador:**
Navegar a la URL que el servidor local indique, típicamente `http://localhost:8080`.

> **Advertencia importante:** El proyecto **no funciona** si se abre `index.html` directamente desde el sistema de archivos usando el protocolo `file://`. Los módulos ES (`type="module"`) están sujetos a la política de mismo origen del navegador, que bloquea las importaciones entre archivos locales bajo el protocolo `file://`. Es obligatorio usar un servidor HTTP local aunque sea mínimo.

---

## 10. Decisiones de Diseño y Justificaciones

### Loop requestAnimationFrame unificado

**Decisión:** Existe un único loop `requestAnimationFrame` en `main.js` que invoca todos los subsistemas de render en orden secuencial dentro del mismo frame.

**Problema que resuelve:** Si cada módulo de render registrara su propio loop independiente, los subsistemas leerían `AppState` en momentos diferentes dentro del mismo frame visual, produciendo inconsistencias donde el estado del canvas de conexiones no coincide con el del núcleo central. Adicionalmente, múltiples loops generan contención en el pipeline de composición del navegador, incrementando el riesgo de dropped frames y aumentando el consumo de CPU innecesariamente.

**Alternativas descartadas:** Loop por módulo (descartado por las razones anteriores), sistema de eventos DOM para trigger de render (descartado por overhead de dispatch/listener y por no garantizar orden de ejecución determinista dentro del mismo frame).

---

### Separación Canvas versus DOM

**Decisión:** Los efectos visuales y animaciones de partículas, curvas y núcleo se renderizan en elementos `<canvas>`. Los valores numéricos de KPIs y las etiquetas de texto se renderizan en elementos DOM estándar.

**Problema que resuelve:** Renderizar texto y números en canvas impide que los lectores de pantalla y las herramientas de accesibilidad accedan al contenido. Renderizar efectos visuales complejos en DOM genera reflows y repaints costosos que degradan el rendimiento. La separación permite que cada tecnología opere en su dominio óptimo.

**Alternativas descartadas:** Todo en canvas (descartado por inaccesibilidad total y dificultad de interacción), todo en DOM con animaciones CSS (descartado por limitaciones de performance para sistemas de partículas y curvas bezier dinámicas).

---

### Posicionamiento radial matemático

**Decisión:** Las posiciones de los cinco nodos en el anillo se calculan dinámicamente mediante funciones trigonométricas (`cos`/`sin`) en `mathHelpers.js`, relativas al centro del viewport, y se recalculan en cada evento de resize.

**Problema que resuelve:** Hardcodear posiciones en píxeles o porcentajes CSS hace que el layout se rompa en viewports de proporciones diferentes a las del diseño original. El cálculo matemático garantiza que los nodos siempre estén equidistantes en el anillo y centrados respecto al núcleo, independientemente del tamaño de pantalla.

**Alternativas descartadas:** Posiciones fijas en CSS (descartado por falta de responsividad), CSS Grid/Flexbox para posicionamiento circular (descartado por complejidad de mantener sincronía con las coordenadas del canvas de conexiones, que necesita las mismas posiciones en coordenadas de píxel).

---

### Modo Overdrive como estado derivado

**Decisión:** El flag `overdrive` en `AppState` se calcula automáticamente como derivación del estado de los cinco módulos, sin ser un estado independiente que se pueda establecer directamente.

**Problema que resuelve:** Si el modo Overdrive fuera un estado independiente, sería posible tener inconsistencias donde `overdrive === true` pero no todos los módulos estén activos, o donde todos los módulos estén activos pero `overdrive === false` por un bug en la lógica de activación. Al ser un estado derivado, la consistencia es estructuralmente garantizada: el modo Overdrive es verdadero si y solo si su condición de activación es verdadera.

**Alternativas descartadas:** Estado independiente con función `activateOverdrive()` (descartado por riesgo de inconsistencia), detección en el módulo de overlay en lugar de en `appState.js` (descartado porque la lógica de negocio no debe residir en módulos de presentación).

---

## 11. Consideraciones de Seguridad

- **Ausencia de dependencias externas — mitiga ataques de supply chain:** Al no depender de ningún paquete npm ni CDN externo, el proyecto elimina completamente el vector de ataque donde una dependencia comprometida inyecta código malicioso. No existe `node_modules`, no existe `package.json` con dependencias de terceros, y no se carga ningún script desde dominios externos.

-