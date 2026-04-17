// =============================================================================
// canvas-engine.js
// Motor de renderizado de partículas y conexiones (Canvas 2D puro).
// Responsabilidad única: recibir estado externo, dibujar, no decidir negocio.
// =============================================================================

// -----------------------------------------------------------------------------
// PASO 1 — Constantes visuales privadas (no exportadas)
// -----------------------------------------------------------------------------
const PARTICLE_COUNT_BASE       = 80;
const PARTICLE_COUNT_OVERDRIVE  = 150;
const CONNECTION_DISTANCE       = 120;
const PARTICLE_SPEED_BASE       = 0.4;
const PARTICLE_SPEED_OVERDRIVE  = 1.1;
const PARTICLE_RADIUS_MIN       = 1;
const PARTICLE_RADIUS_MAX       = 3;
const COLOR_PARTICLE_NORMAL     = '#00f0ff';
const COLOR_PARTICLE_OVERDRIVE  = '#ff00ff';
const COLOR_CONNECTION          = 'rgba(0, 240, 255, 0.15)';
const COLOR_CONNECTION_OVERDRIVE = 'rgba(255, 0, 255, 0.2)';
const COLOR_BG_CLEAR            = 'rgba(10, 10, 20, 0.15)';

// -----------------------------------------------------------------------------
// PASO 2 — Estado interno privado del módulo (única fuente de verdad interna)
// -----------------------------------------------------------------------------
const _state = {
  particleCanvas:    null,
  connectionCanvas:  null,
  pCtx:              null,
  cCtx:              null,
  particles:         [],
  animationId:       null,
  isOverdriveActive: false,
  isRunning:         false
};

// -----------------------------------------------------------------------------
// PASO 3 — Función auxiliar privada: _createParticle(width, height)
// Retorna un objeto literal que representa una partícula.
// -----------------------------------------------------------------------------
function _createParticle(width, height) {
  const speed = _state.isOverdriveActive ? PARTICLE_SPEED_OVERDRIVE : PARTICLE_SPEED_BASE;
  return {
    x:      Math.random() * width,
    y:      Math.random() * height,
    vx:     (Math.random() * 2 - 1) * speed,
    vy:     (Math.random() * 2 - 1) * speed,
    radius: PARTICLE_RADIUS_MIN + Math.random() * (PARTICLE_RADIUS_MAX - PARTICLE_RADIUS_MIN)
  };
}

// -----------------------------------------------------------------------------
// PASO 4 — Función auxiliar privada: _initParticles()
// Vacía y rellena _state.particles según el modo activo.
// -----------------------------------------------------------------------------
function _initParticles() {
  const width  = _state.particleCanvas.width;
  const height = _state.particleCanvas.height;
  const count  = _state.isOverdriveActive ? PARTICLE_COUNT_OVERDRIVE : PARTICLE_COUNT_BASE;

  _state.particles = [];
  for (let i = 0; i < count; i++) {
    _state.particles.push(_createParticle(width, height));
  }
}

// -----------------------------------------------------------------------------
// PASO 5 — Función auxiliar privada: _drawFrame()
// Cuerpo del loop de animación. Orden de sub-pasos es estricto.
// -----------------------------------------------------------------------------
function _drawFrame() {
  const { pCtx, cCtx, particles, isOverdriveActive } = _state;
  const width  = _state.particleCanvas.width;
  const height = _state.particleCanvas.height;

  // 5a — Limpiar canvas
  // Partículas: efecto trail con rectángulo semitransparente (NO clearRect puro)
  pCtx.fillStyle = COLOR_BG_CLEAR;
  pCtx.fillRect(0, 0, width, height);

  // Conexiones: limpieza total cada frame (sin trail en conexiones)
  cCtx.clearRect(0, 0, width, height);

  // Colores según modo
  const particleColor    = isOverdriveActive ? COLOR_PARTICLE_OVERDRIVE  : COLOR_PARTICLE_NORMAL;
  const connectionColor  = isOverdriveActive ? COLOR_CONNECTION_OVERDRIVE : COLOR_CONNECTION;

  // 5b — Actualizar posición y rebotar en bordes
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];

    p.x += p.vx;
    p.y += p.vy;

    // Rebote en borde izquierdo / derecho
    if (p.x - p.radius < 0) {
      p.x  = p.radius;
      p.vx = Math.abs(p.vx);
    } else if (p.x + p.radius > width) {
      p.x  = width - p.radius;
      p.vx = -Math.abs(p.vx);
    }

    // Rebote en borde superior / inferior
    if (p.y - p.radius < 0) {
      p.y  = p.radius;
      p.vy = Math.abs(p.vy);
    } else if (p.y + p.radius > height) {
      p.y  = height - p.radius;
      p.vy = -Math.abs(p.vy);
    }
  }

  // 5c — Dibujar conexiones entre partículas próximas (canvas de conexiones)
  cCtx.strokeStyle = connectionColor;
  cCtx.lineWidth   = 0.6;

  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx   = particles[i].x - particles[j].x;
      const dy   = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < CONNECTION_DISTANCE) {
        // Opacidad proporcional a la proximidad
        const alpha = 1 - dist / CONNECTION_DISTANCE;
        cCtx.globalAlpha = alpha;
        cCtx.beginPath();
        cCtx.moveTo(particles[i].x, particles[i].y);
        cCtx.lineTo(particles[j].x, particles[j].y);
        cCtx.stroke();
      }
    }
  }
  // Restaurar globalAlpha para no contaminar otros dibujos
  cCtx.globalAlpha = 1;

  // 5d — Dibujar partículas (canvas de partículas)
  pCtx.fillStyle = particleColor;

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    pCtx.beginPath();
    pCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    pCtx.fill();
  }

  // 5e — Encolar el siguiente frame
  _state.animationId = requestAnimationFrame(_drawFrame);
}

// =============================================================================
// API PÚBLICA EXPORTADA
// =============================================================================

/**
 * Inicializa el motor de canvas.
 * Debe llamarse una única vez antes de `startEngine`.
 *
 * @param {HTMLCanvasElement} particleCanvas  - Canvas destinado a las partículas.
 * @param {HTMLCanvasElement} connectionCanvas - Canvas destinado a las conexiones.
 */
export function initEngine(particleCanvas, connectionCanvas) {
  _state.particleCanvas   = particleCanvas;
  _state.connectionCanvas = connectionCanvas;
  _state.pCtx             = particleCanvas.getContext('2d');
  _state.cCtx             = connectionCanvas.getContext('2d');
}

/**
 * Arranca el loop de animación.
 * Incluye guardia contra doble arranque.
 */
export function startEngine() {
  if (_state.isRunning) return;
  _state.isRunning = true;
  _initParticles();
  _state.animationId = requestAnimationFrame(_drawFrame);
}

/**
 * Detiene el loop de animación y limpia ambos canvas.
 */
export function stopEngine() {
  if (_state.animationId !== null) {
    cancelAnimationFrame(_state.animationId);
    _state.animationId = null;
  }
  _state.isRunning = false;

  if (_state.pCtx) {
    _state.pCtx.clearRect(
      0, 0,
      _state.particleCanvas.width,
      _state.particleCanvas.height
    );
  }
  if (_state.cCtx) {
    _state.cCtx.clearRect(
      0, 0,
      _state.connectionCanvas.width,
      _state.connectionCanvas.height
    );
  }
}

/**
 * Activa o desactiva el modo Overdrive.
 * Reinicia el pool de partículas con la nueva cantidad y velocidad.
 *
 * @param {boolean} active - `true` para activar Overdrive, `false` para modo normal.
 */
export function setOverdriveMode(active) {
  if (_state.isOverdriveActive === active) return;
  _state.isOverdriveActive = active;

  // Reiniciar partículas con nueva velocidad y cantidad
  if (_state.isRunning) {
    _initParticles();
  }
}

/**
 * Redimensiona ambos canvas al tamaño del contenedor y reinicia las partículas.
 * Debe llamarse desde el listener `resize` del ui-controller.
 *
 * @param {number} width  - Nuevo ancho en píxeles.
 * @param {number} height - Nuevo alto en píxeles.
 */
export function resizeEngine(width, height) {
  if (!_state.particleCanvas || !_state.connectionCanvas) return;

  _state.particleCanvas.width    = width;
  _state.particleCanvas.height   = height;
  _state.connectionCanvas.width  = width;
  _state.connectionCanvas.height = height;

  if (_state.isRunning) {
    _initParticles();
  }
}