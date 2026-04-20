import { initState } from './state.js';
import { initKpiEngine, startKpiLoop } from './kpi-engine.js';
import { initCanvasRenderer, renderParticleFrame, renderConnectionFrame } from './canvas-renderer.js';
import { initUIController } from './ui-controller.js';

function startAnimationLoop() {
  function loop() {
    renderParticleFrame();
    renderConnectionFrame();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

document.addEventListener('visibilitychange', () => {
  // El navegador pausa requestAnimationFrame automáticamente
  // cuando visibilityState === 'hidden'. No se requiere lógica adicional.
});

function init() {
  initState();
  initCanvasRenderer();
  initUIController();
  initKpiEngine();
  startKpiLoop();
  startAnimationLoop();
}

document.addEventListener('DOMContentLoaded', init);