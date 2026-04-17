import { initState }        from './state.js';
import { initRenderer }     from './renderer.js';
import { initKpiEngine }    from './kpi-engine.js';
import { initCanvasEngine } from './canvas-engine.js';
import { initUIController } from './ui-controller.js';

/**
 * Orquesta la inicialización de todos los módulos de la aplicación.
 * ORDEN DE LLAMADA ES OBLIGATORIO:
 *   1. state       → fuente de verdad global
 *   2. kpi-engine  → registra los calculadores sobre el estado
 *   3. canvas-engine → inicializa los dos canvas superpuestos
 *   4. renderer    → arranca el bucle requestAnimationFrame
 *   5. ui-controller → enlaza los eventos del DOM al estado
 * @returns {void}
 */
function bootstrap() {
    initState();
    initKpiEngine();
    initCanvasEngine();
    initRenderer();
    initUIController();
}

document.addEventListener('DOMContentLoaded', bootstrap);