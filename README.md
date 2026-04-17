# The Power Grid
Dashboard interactivo de simulación de valor con temática cyberpunk. Aplicación estática, sin dependencias, sin build step.

## Requisitos

- Un navegador moderno con soporte ES6 Modules (Chrome 61+, Firefox 60+, Safari 10.1+, Edge 16+).
- Un servidor HTTP local (requerido por la política CORS de ES6 modules; **no funciona abriendo el archivo directamente con `file://` en Chrome**).

## Cómo ejecutar (desarrollo local)

Opción A — Python (sin instalación adicional):

```bash
python -m http.server 8080
```

Luego abrir: `http://localhost:8080`

Opción B — Node.js (si está disponible):

```bash
npx serve .
```

Luego abrir la URL que indique la terminal.

Opción C — VSCode (extensión Live Server):

Clic derecho sobre `index.html` → "Open with Live Server".

## Estructura de archivos

```
the-power-grid/
├── index.html          # Punto de entrada único. Contiene el markup y carga los módulos.
├── styles.css          # Estilos globales y variables CSS (tokens de diseño cyberpunk).
├── README.md           # Este archivo.
└── js/
    ├── state.js        # Estado global de la aplicación (objeto plano, sin framework).
    ├── kpi-engine.js   # Lógica de cálculo de KPIs (funciones puras).
    ├── canvas-engine.js# Bucle de animación y renderizado de partículas.
    ├── renderer.js     # Actualización del DOM con los valores calculados.
    └── ui-controller.js# Listeners de eventos de usuario (sliders, toggles, botones).
```

## Controles de la demo

| Control | Tipo | Efecto |
|---|---|---|
| Sliders de parámetros | `<input type="range">` | Ajustan los valores de entrada del motor de KPIs en tiempo real. |
| Toggles de módulos | `<input type="checkbox">` | Activan o desactivan módulos de la simulación (6 en total). |
| Botón Overdrive | `<button>` | Activa el modo de animación de alta intensidad (opt-in, puede ser pesado en hardware antiguo). |
| Botón Reset | `<button>` | Restaura todos los controles a sus valores por defecto definidos en `KPI_CONFIG`. |

## Advertencia de compatibilidad

> ⚠️ **Importante:** No abras `index.html` directamente desde el explorador de archivos
> (protocolo `file://`). Los módulos ES6 nativos requieren un servidor HTTP.
> Usa cualquiera de las opciones de la sección anterior.