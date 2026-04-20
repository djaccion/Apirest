# The Power Grid — Dashboard de Simulación de Valor
Dashboard interactivo con temática cyberpunk para presentaciones de preventa.
Aplicación 100% estática: HTML5 + CSS3 + Vanilla JS ES6+. Sin dependencias.

## Estructura del Proyecto

```
/
├── index.html          # Punto de entrada. Orquesta la carga de módulos JS.
├── styles.css          # Estilos globales y tokens de color (:root).
├── README.md           # Este archivo.
└── src/
    ├── main.js         # Inicialización del loop y wiring de módulos.
    ├── state.js        # Estado global y KPI_CONFIG. Fuente única de verdad.
    ├── kpi-engine.js   # Motor de cálculo y animación de KPIs.
    ├── canvas-renderer.js  # Renderizado Canvas (partículas, radar, velocímetro).
    └── ui-controller.js    # Manejadores de eventos DOM y lógica de UI.
```

## Requisitos Previos

- Un navegador moderno con soporte ES6 Modules (Chrome 61+, Firefox 60+, Safari 10.1+, Edge 16+).
- Un servidor HTTP local para servir los archivos estáticos (requerido por la política CORS de ES6 Modules — **no funciona abriendo `index.html` directamente con `file://`**).

## Cómo Levantar el Proyecto

> ⚠️ No abras index.html directamente desde el explorador de archivos. Los módulos ES6 requieren un servidor HTTP para resolver imports. El navegador bloqueará la carga con un error CORS.

### Opción A — VS Code Live Server (Recomendado para demo)
1. Instala la extensión **Live Server** en VS Code.
2. Haz clic derecho sobre `index.html` → **"Open with Live Server"**.
3. El dashboard abre automáticamente en `http://127.0.0.1:5500`.

### Opción B — Python (sin instalación adicional)
```bash
# Python 3
python3 -m http.server 8080
```
Abre `http://localhost:8080` en el navegador.

### Opción C — Node.js `npx serve` (si Node está disponible)
```bash
npx serve .
```
Abre la URL que indique la terminal (por defecto `http://localhost:3000`).

## Notas Operativas

- **Estado en memoria:** Los valores del simulador se reinician al recargar la página. Es el comportamiento esperado — no hay persistencia.
- **Rendimiento:** Si se detecta consumo elevado de CPU, el cap de partículas es configurable directamente en `src/state.js`.
- **Pestaña en segundo plano:** El loop de animación se pausa automáticamente cuando la pestaña no está visible, reduciendo el consumo de recursos.