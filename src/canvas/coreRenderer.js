let _canvas = null;
let _ctx = null;
let _activeModules = 0;
let _isOverdrive = false;
let _rotationAngle = 0;
let _pulsePhase = 0;
let _lastTimestamp = 0;

function initCoreRenderer(canvas, ctx) {
  _canvas = canvas;
  _ctx = ctx;
}

function updateCoreState(appState) {
  if (appState.modules) {
    if (Array.isArray(appState.modules)) {
      _activeModules = appState.modules.filter(Boolean).length;
    } else {
      _activeModules = Object.values(appState.modules).filter(Boolean).length;
    }
  } else {
    _activeModules = 0;
  }
  _isOverdrive = !!appState.overdrive;
}

function _getColorScheme() {
  if (_isOverdrive) {
    return {
      coreColor: '#00FFFF',
      ringColor: '#FF00FF',
      glowColor: '#00FFFF',
      textColor: '#FFFFFF'
    };
  }
  return {
    coreColor: '#0052CC',
    ringColor: '#4C9AFF',
    glowColor: '#4C9AFF',
    textColor: '#FFFFFF'
  };
}

function renderCore(timestamp, centerX, centerY) {
  if (!_ctx || !_canvas) return;

  let deltaTime;
  if (_lastTimestamp === 0) {
    deltaTime = 16;
  } else {
    deltaTime = timestamp - _lastTimestamp;
  }
  _lastTimestamp = timestamp;

  const rotationSpeed = _isOverdrive ? 0.016 : 0.008;
  const pulseSpeed = _isOverdrive ? 0.006 : 0.003;

  _rotationAngle = (_rotationAngle + rotationSpeed * deltaTime) % (Math.PI * 2);
  _pulsePhase = (_pulsePhase + pulseSpeed * deltaTime) % (Math.PI * 2);

  const colors = _getColorScheme();

  // Paso 1 - Glow exterior difuso
  const glowRadius = 60 + _activeModules * 8;
  const pulseValue = Math.sin(_pulsePhase);
  const glowOpacity = 0.15 + (pulseValue + 1) / 2 * 0.20;

  const glowGradient = _ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowRadius);

  const glowColorRGB = _hexToRgb(colors.glowColor);
  glowGradient.addColorStop(0, `rgba(${glowColorRGB.r}, ${glowColorRGB.g}, ${glowColorRGB.b}, ${glowOpacity})`);
  glowGradient.addColorStop(1, `rgba(${glowColorRGB.r}, ${glowColorRGB.g}, ${glowColorRGB.b}, 0)`);

  _ctx.save();
  _ctx.fillStyle = glowGradient;
  _ctx.beginPath();
  _ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
  _ctx.fill();
  _ctx.restore();

  // Paso 2 - Anillos orbitales
  const rings = [
    { radius: 45, multiplier: 1, lineWidth: 2, colorKey: 'ringColor' },
    { radius: 62, multiplier: -0.7, lineWidth: 1.5, colorKey: 'coreColor' },
    { radius: 80, multiplier: 0.5, lineWidth: 1.5, colorKey: 'ringColor' }
  ];

  rings.forEach((ring, index) => {
    _ctx.save();
    _ctx.translate(centerX, centerY);
    _ctx.rotate(_rotationAngle * ring.multiplier);

    _ctx.beginPath();
    _ctx.arc(0, 0, ring.radius, 0, Math.PI * 1.5);

    _ctx.lineWidth = ring.lineWidth;

    let strokeColor = colors[ring.colorKey];

    if (_isOverdrive && index === 2) {
      const overdriveAlpha = 0.7 + (Math.sin(_pulsePhase * 1.5) + 1) / 2 * 0.3;
      const rgb = _hexToRgb(strokeColor);
      strokeColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${overdriveAlpha})`;
      _ctx.shadowColor = colors.ringColor;
      _ctx.shadowBlur = 12;
    } else {
      _ctx.shadowColor = 'transparent';
      _ctx.shadowBlur = 0;
    }

    _ctx.strokeStyle = strokeColor;
    _ctx.stroke();
    _ctx.restore();
  });

  // Paso 3 - Núcleo central (círculo base)
  const coreRadius = 32;
  const coreGradient = _ctx.createRadialGradient(centerX - 6, centerY - 6, 2, centerX, centerY, coreRadius);
  const coreRGB = _hexToRgb(colors.coreColor);

  if (_isOverdrive) {
    coreGradient.addColorStop(0, `rgba(${coreRGB.r}, ${coreRGB.g}, ${coreRGB.b}, 1)`);
    coreGradient.addColorStop(0.6, `rgba(${coreRGB.r}, ${coreRGB.g}, ${coreRGB.b}, 0.85)`);
    coreGradient.addColorStop(1, `rgba(${coreRGB.r}, ${coreRGB.g}, ${coreRGB.b}, 0.6)`);
  } else {
    coreGradient.addColorStop(0, `rgba(${coreRGB.r + 40}, ${coreRGB.g + 40}, ${coreRGB.b + 40}, 1)`);
    coreGradient.addColorStop(0.6, `rgba(${coreRGB.r}, ${coreRGB.g}, ${coreRGB.b}, 0.9)`);
    coreGradient.addColorStop(1, `rgba(${Math.max(0, coreRGB.r - 20)}, ${Math.max(0, coreRGB.g - 20)}, ${Math.max(0, coreRGB.b - 20)}, 0.8)`);
  }

  _ctx.save();
  if (_isOverdrive) {
    _ctx.shadowColor = colors.coreColor;
    _ctx.shadowBlur = 20 + Math.sin(_pulsePhase) * 8;
  }
  _ctx.beginPath();
  _ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
  _ctx.fillStyle = coreGradient;
  _ctx.fill();
  _ctx.restore();

  // Paso 4 - Borde del núcleo
  _ctx.save();
  _ctx.beginPath();
  _ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
  _ctx.lineWidth = _isOverdrive ? 2 : 1.5;
  _ctx.strokeStyle = colors.ringColor;
  if (_isOverdrive) {
    _ctx.shadowColor = colors.ringColor;
    _ctx.shadowBlur = 10;
  }
  _ctx.stroke();
  _ctx.restore();

  // Paso 5 - Texto central (label Jira)
  _ctx.save();
  _ctx.textAlign = 'center';
  _ctx.textBaseline = 'middle';
  _ctx.fillStyle = colors.textColor;

  if (_isOverdrive) {
    _ctx.shadowColor = colors.coreColor;
    _ctx.shadowBlur = 8;
  }

  _ctx.font = 'bold 10px Inter, Arial, sans-serif';
  _ctx.fillText('JIRA', centerX, centerY - 5);

  _ctx.font = '7px Inter, Arial, sans-serif';
  _ctx.fillStyle = _isOverdrive
    ? `rgba(255, 255, 255, 0.9)`
    : `rgba(255, 255, 255, 0.75)`;
  _ctx.fillText('CORE', centerX, centerY + 6);

  _ctx.restore();

  // Paso 6 - Indicadores de módulos activos (puntos orbitales)
  if (_activeModules > 0) {
    _ctx.save();
    const dotOrbitRadius = 80;
    const dotCount = _activeModules;
    const dotRGB = _hexToRgb(colors.ringColor);

    for (let i = 0; i < dotCount; i++) {
      const angle = _rotationAngle * 0.5 + (i / dotCount) * Math.PI * 2;
      const dotX = centerX + Math.cos(angle) * dotOrbitRadius;
      const dotY = centerY + Math.sin(angle) * dotOrbitRadius;
      const dotPulse = 0.7 + (Math.sin(_pulsePhase + i * 1.2) + 1) / 2 * 0.3;

      _ctx.beginPath();
      _ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
      _ctx.fillStyle = `rgba(${dotRGB.r}, ${dotRGB.g}, ${dotRGB.b}, ${dotPulse})`;

      if (_isOverdrive) {
        _ctx.shadowColor = colors.ringColor;
        _ctx.shadowBlur = 8;
      }

      _ctx.fill();
    }
    _ctx.restore();
  }
}

function _hexToRgb(hex) {
  const sanitized = hex.replace('#', '');
  const bigint = parseInt(sanitized, 16);
  return {
    r: Math.min(255, (bigint >> 16) & 255),
    g: Math.min(255, (bigint >> 8) & 255),
    b: Math.min(255, bigint & 255)
  };
}

export { initCoreRenderer, updateCoreState, renderCore };