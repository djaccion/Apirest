// src/canvas-renderer.js

// ---------------------------------------------------------------------------
// Paso 1 — Variables de módulo (privadas, nunca exportadas)
// ---------------------------------------------------------------------------
let particleCtx = null;
let connectionCtx = null;
let particleCanvas = null;
let connectionCanvas = null;
let particles = [];
let animationWidth = 0;
let animationHeight = 0;

// ---------------------------------------------------------------------------
// Paso 3 — Función privada: _initParticles(maxParticles)
// ---------------------------------------------------------------------------
function _initParticles(maxParticles) {
  particles = [];
  for (let i = 0; i < maxParticles; i++) {
    particles.push({
      x: Math.random() * animationWidth,
      y: Math.random() * animationHeight,
      vx: (Math.random() - 0.5) * 0.6,   // rango -0.3 a 0.3
      vy: (Math.random() - 0.5) * 0.6,   // rango -0.3 a 0.3
      radius: 1 + Math.random() * 1.5,   // rango 1 a 2.5
      alpha: 0.2 + Math.random() * 0.5   // rango 0.2 a 0.7
    });
  }
}

// ---------------------------------------------------------------------------
// Paso 4 — Función privada: _updateParticles()
// ---------------------------------------------------------------------------
function _updateParticles() {
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;

    if (p.x > animationWidth)  p.x = 0;
    if (p.x < 0)               p.x = animationWidth;
    if (p.y > animationHeight) p.y = 0;
    if (p.y < 0)               p.y = animationHeight;
  }
}

// ---------------------------------------------------------------------------
// Paso 5 — Función privada: _drawParticles(isOverdriveActive)
// ---------------------------------------------------------------------------
function _drawParticles(isOverdriveActive) {
  particleCtx.clearRect(0, 0, animationWidth, animationHeight);

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    particleCtx.beginPath();
    particleCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    particleCtx.fillStyle = isOverdriveActive
      ? `rgba(255, 0, 60, ${p.alpha})`
      : `rgba(0, 255, 159, ${p.alpha})`;
    particleCtx.fill();
  }
}

// ---------------------------------------------------------------------------
// Paso 6 — Función privada: _drawConnections(nodePositions, isOverdriveActive)
//
// Recibe un array de objetos { x, y } ya calculados por ui-controller.js.
// No realiza ninguna consulta al DOM.
// ---------------------------------------------------------------------------
function _drawConnections(nodePositions, isOverdriveActive) {
  connectionCtx.clearRect(0, 0, animationWidth, animationHeight);

  if (!nodePositions || nodePositions.length < 2) return;

  const baseColor = isOverdriveActive ? '255, 0, 60' : '0, 255, 159';

  for (let i = 0; i < nodePositions.length; i++) {
    for (let j = i + 1; j < nodePositions.length; j++) {
      const a = nodePositions[i];
      const b = nodePositions[j];

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Opacidad inversamente proporcional a la distancia
      const maxDist = Math.sqrt(animationWidth * animationWidth + animationHeight * animationHeight);
      const alpha = Math.max(0, 1 - distance / (maxDist * 0.5));

      if (alpha <= 0) continue;

      const gradient = connectionCtx.createLinearGradient(a.x, a.y, b.x, b.y);
      gradient.addColorStop(0, `rgba(${baseColor}, ${(alpha * 0.8).toFixed(3)})`);
      gradient.addColorStop(1, `rgba(${baseColor}, ${(alpha * 0.2).toFixed(3)})`);

      connectionCtx.beginPath();
      connectionCtx.moveTo(a.x, a.y);
      connectionCtx.lineTo(b.x, b.y);
      connectionCtx.strokeStyle = gradient;
      connectionCtx.lineWidth = isOverdriveActive ? 1.5 : 0.8;
      connectionCtx.stroke();
    }
  }
}

// ---------------------------------------------------------------------------
// Paso 7 — Función privada: _drawSpeedometer(ctx, value, max, isOverdriveActive)
//
// Dibuja un velocímetro semicircular en el canvas de conexiones.
// ctx      : CanvasRenderingContext2D destino
// value    : valor actual (número)
// max      : valor máximo de la escala
// isOverdriveActive : boolean para coloración
// ---------------------------------------------------------------------------
function _drawSpeedometer(ctx, value, max, isOverdriveActive) {
  const cx = animationWidth - 110;
  const cy = animationHeight - 80;
  const radius = 60;
  const startAngle = Math.PI;           // 180° — extremo izquierdo
  const endAngle   = 2 * Math.PI;      // 360° — extremo derecho (semicírculo)

  const ratio = Math.min(Math.max(value / max, 0), 1);
  const needleAngle = Math.PI + ratio * Math.PI;

  const accentColor = isOverdriveActive ? '#ff003c' : '#00ff9f';
  const trackColor  = 'rgba(255,255,255,0.08)';

  // Arco de fondo
  ctx.beginPath();
  ctx.arc(cx, cy, radius, startAngle, endAngle);
  ctx.strokeStyle = trackColor;
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Arco de progreso
  if (ratio > 0) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, needleAngle);
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  // Aguja
  const needleLen = radius - 10;
  const nx = cx + Math.cos(needleAngle) * needleLen;
  const ny = cy + Math.sin(needleAngle) * needleLen;

  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(nx, ny);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Punto central
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fillStyle = accentColor;
  ctx.fill();

  // Etiqueta de valor
  ctx.font = 'bold 14px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(Math.round(value), cx, cy + 20);

  // Etiqueta "SPEED"
  ctx.font = '10px monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText('SPEED', cx, cy + 34);
}

// ---------------------------------------------------------------------------
// Paso 8 — Función privada: _drawKpiRadar(ctx, kpiData, isOverdriveActive)
//
// Dibuja un radar (spider chart) con los KPIs activos.
// kpiData : array de { label: string, value: number, max: number }
// ---------------------------------------------------------------------------
function _drawKpiRadar(ctx, kpiData, isOverdriveActive) {
  if (!kpiData || kpiData.length < 3) return;

  const cx = 110;
  const cy = animationHeight - 110;
  const radius = 65;
  const sides = kpiData.length;
  const angleStep = (Math.PI * 2) / sides;
  const accentColor = isOverdriveActive ? 'rgba(255,0,60,' : 'rgba(0,255,159,';

  // Rejilla de fondo (3 niveles)
  for (let level = 1; level <= 3; level++) {
    const r = (radius / 3) * level;
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const angle = -Math.PI / 2 + i * angleStep;
      const px = cx + Math.cos(angle) * r;
      const py = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Ejes
  for (let i = 0; i < sides; i++) {
    const angle = -Math.PI / 2 + i * angleStep;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Polígono de datos
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const ratio = Math.min(Math.max(kpiData[i].value / kpiData[i].max, 0), 1);
    const angle = -Math.PI / 2 + i * angleStep;
    const px = cx + Math.cos(angle) * radius * ratio;
    const py = cy + Math.sin(angle) * radius * ratio;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = accentColor + '0.15)';
  ctx.fill();
  ctx.strokeStyle = accentColor + '0.9)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Etiquetas de ejes
  ctx.font = '9px monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.textAlign = 'center';
  for (let i = 0; i < sides; i++) {
    const angle = -Math.PI / 2 + i * angleStep;
    const lx = cx + Math.cos(angle) * (radius + 14);
    const ly = cy + Math.sin(angle) * (radius + 14);
    ctx.fillText(kpiData[i].label, lx, ly + 3);
  }
}

// ---------------------------------------------------------------------------
// Paso 2 — Función exportada: initRenderer(pCanvas, cCanvas, maxParticles)
// ---------------------------------------------------------------------------
export function initRenderer(pCanvas, cCanvas, maxParticles) {
  particleCanvas    = pCanvas;
  connectionCanvas  = cCanvas;
  particleCtx       = pCanvas.getContext('2d');
  connectionCtx     = cCanvas.getContext('2d');
  animationWidth    = pCanvas.width;
  animationHeight   = pCanvas.height;

  _initParticles(maxParticles);
}

// ---------------------------------------------------------------------------
// Función exportada: resizeRenderer(width, height)
// Permite a main.js notificar cambios de tamaño sin acceder a variables internas.
// ---------------------------------------------------------------------------
export function resizeRenderer(width, height) {
  animationWidth  = width;
  animationHeight = height;
}

// ---------------------------------------------------------------------------
// Función exportada: renderFrame(params)
//
// Punto de entrada único que main.js llama en cada tick de requestAnimationFrame.
//
// params = {
//   isOverdriveActive : boolean,
//   nodePositions     : Array<{ x: number, y: number }>,  // calculado por ui-controller
//   speedValue        : number,
//   speedMax          : number,
//   kpiData           : Array<{ label: string, value: number, max: number }>
// }
// ---------------------------------------------------------------------------
export function renderFrame(params) {
  const {
    isOverdriveActive = false,
    nodePositions     = [],
    speedValue        = 0,
    speedMax          = 100,
    kpiData           = []
  } = params;

  // — Capa de partículas —
  _updateParticles();
  _drawParticles(isOverdriveActive);

  // — Capa de conexiones + overlays —
  connectionCtx.clearRect(0, 0, animationWidth, animationHeight);
  _drawConnections(nodePositions, isOverdriveActive);
  _drawSpeedometer(connectionCtx, speedValue, speedMax, isOverdriveActive);
  _drawKpiRadar(connectionCtx, kpiData, isOverdriveActive);
}