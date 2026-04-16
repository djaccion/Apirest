const Speedometer = (() => {
  let canvas = null;
  let ctx = null;
  let currentValue = 0;
  let targetValue = 0;
  let animFrameId = null;
  let isOverdrive = false;

  const CONFIG = {
    startAngleDeg: 135,
    endAngleDeg: 45,
    sweepDeg: 270,
    minValue: 0,
    maxValue: 100,
    tickCount: 11,
  };

  function getThemeColors() {
    const style = getComputedStyle(document.documentElement);
    return {
      primary: style.getPropertyValue('--color-primary').trim() || '#7c3aed',
      accent: style.getPropertyValue('--color-accent').trim() || '#f5f0ff',
      overdriveCyan: style.getPropertyValue('--color-overdrive').trim() || '#00ffff',
      text: style.getPropertyValue('--color-text').trim() || '#ffffff',
    };
  }

  function setupCanvasResolution() {
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const cssWidth = rect.width || canvas.offsetWidth || 200;
    const cssHeight = rect.height || canvas.offsetHeight || 200;
    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;
    canvas.style.width = cssWidth + 'px';
    canvas.style.height = cssHeight + 'px';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  }

  function degreesToRadians(deg) {
    return (deg * Math.PI) / 180;
  }

  function valueToAngle(value) {
    const pct = (value - CONFIG.minValue) / (CONFIG.maxValue - CONFIG.minValue);
    const sweepRad = degreesToRadians(CONFIG.sweepDeg);
    const startRad = degreesToRadians(CONFIG.startAngleDeg);
    return startRad + pct * sweepRad;
  }

  function getCSSSize() {
    const dpr = window.devicePixelRatio || 1;
    return {
      width: canvas.width / dpr,
      height: canvas.height / dpr,
    };
  }

  function drawTrack(cx, cy, radius, lineWidth) {
    const startRad = degreesToRadians(CONFIG.startAngleDeg);
    const endRad = degreesToRadians(CONFIG.endAngleDeg);
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startRad, endRad, false);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  function drawProgressArc(cx, cy, radius, lineWidth, value) {
    const startRad = degreesToRadians(CONFIG.startAngleDeg);
    const currentAngle = valueToAngle(value);
    const colors = getThemeColors();

    let gradient;
    try {
      gradient = ctx.createLinearGradient(
        cx - radius,
        cy,
        cx + radius,
        cy
      );
      if (isOverdrive) {
        gradient.addColorStop(0, 'rgba(0, 200, 255, 0.7)');
        gradient.addColorStop(1, colors.overdriveCyan);
      } else {
        gradient.addColorStop(0, colors.primary);
        gradient.addColorStop(1, '#a78bfa');
      }
    } catch (e) {
      gradient = isOverdrive ? colors.overdriveCyan : colors.primary;
    }

    if (isOverdrive) {
      ctx.shadowBlur = 25;
      ctx.shadowColor = colors.overdriveCyan;
    } else if (value >= 80) {
      ctx.shadowBlur = 15;
      ctx.shadowColor = colors.primary;
    } else {
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
    }

    ctx.beginPath();
    ctx.arc(cx, cy, radius, startRad, currentAngle, false);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
  }

  function drawNeedle(cx, cy, radius, value) {
    const angle = valueToAngle(value);
    const needleLength = radius * 0.85;
    const pivotRadius = radius * 0.06;
    const colors = getThemeColors();

    const tipX = cx + Math.cos(angle) * needleLength;
    const tipY = cy + Math.sin(angle) * needleLength;

    const baseAngleLeft = angle + Math.PI / 2;
    const baseAngleRight = angle - Math.PI / 2;
    const baseHalfWidth = 3;
    const baseLeftX = cx + Math.cos(baseAngleLeft) * baseHalfWidth;
    const baseLeftY = cy + Math.sin(baseAngleLeft) * baseHalfWidth;
    const baseRightX = cx + Math.cos(baseAngleRight) * baseHalfWidth;
    const baseRightY = cy + Math.sin(baseAngleRight) * baseHalfWidth;

    if (isOverdrive) {
      ctx.shadowBlur = 20;
      ctx.shadowColor = colors.overdriveCyan;
    } else {
      ctx.shadowBlur = 8;
      ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
    }

    ctx.beginPath();
    ctx.moveTo(baseLeftX, baseLeftY);
    ctx.lineTo(tipX, tipY);
    ctx.lineTo(baseRightX, baseRightY);
    ctx.closePath();
    ctx.fillStyle = isOverdrive ? '#ffffff' : (colors.accent || '#ffffff');
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';

    ctx.beginPath();
    ctx.arc(cx, cy, pivotRadius, 0, Math.PI * 2);
    ctx.fillStyle = isOverdrive ? colors.overdriveCyan : colors.primary;
    ctx.fill();
  }

  function drawTicks(cx, cy, radius, lineWidth) {
    const colors = getThemeColors();
    const totalTicks = CONFIG.tickCount;
    const sweepRad = degreesToRadians(CONFIG.sweepDeg);
    const startRad = degreesToRadians(CONFIG.startAngleDeg);

    for (let i = 0; i < totalTicks; i++) {
      const pct = i / (totalTicks - 1);
      const angle = startRad + pct * sweepRad;
      const isMajor = i === 0 || i === totalTicks - 1 || i === Math.floor((totalTicks - 1) / 2);
      const tickLength = isMajor ? lineWidth * 1.8 : lineWidth * 1.1;
      const outerR = radius + lineWidth / 2;
      const innerR = outerR - tickLength;

      const x1 = cx + Math.cos(angle) * outerR;
      const y1 = cy + Math.sin(angle) * outerR;
      const x2 = cx + Math.cos(angle) * innerR;
      const y2 = cy + Math.sin(angle) * innerR;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = isOverdrive
        ? 'rgba(0, 255, 255, 0.6)'
        : 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = isMajor ? 2 : 1;
      ctx.stroke();
    }
  }

  function drawLabels(cx, cy, radius, lineWidth) {
    const totalTicks = CONFIG.tickCount;
    const sweepRad = degreesToRadians(CONFIG.sweepDeg);
    const startRad = degreesToRadians(CONFIG.startAngleDeg);
    const labelRadius = radius + lineWidth * 2.5;
    const colors = getThemeColors();
    const { width } = getCSSSize();
    const fontSize = Math.max(9, Math.round(width * 0.07));

    ctx.font = `${fontSize}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isOverdrive
      ? 'rgba(0, 255, 255, 0.8)'
      : 'rgba(255, 255, 255, 0.6)';

    const labelIndices = [0, Math.floor((totalTicks - 1) / 2), totalTicks - 1];

    for (const i of labelIndices) {
      const pct = i / (totalTicks - 1);
      const angle = startRad + pct * sweepRad;
      const value = Math.round(CONFIG.minValue + pct * (CONFIG.maxValue - CONFIG.minValue));
      const lx = cx + Math.cos(angle) * labelRadius;
      const ly = cy + Math.sin(angle) * labelRadius;
      ctx.fillText(value.toString(), lx, ly);
    }
  }

  function drawCenterText(cx, cy, value) {
    const { width } = getCSSSize();
    const colors = getThemeColors();
    const valueFontSize = Math.round(width * 0.22);
    const unitFontSize = Math.max(10, Math.round(width * 0.09));

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (isOverdrive) {
      ctx.shadowBlur = 15;
      ctx.shadowColor = colors.overdriveCyan;
    }

    ctx.font = `bold ${valueFontSize}px monospace`;
    ctx.fillStyle = colors.text || '#ffffff';
    ctx.fillText(Math.round(value).toString(), cx, cy + width * 0.12);

    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';

    ctx.font = `${unitFontSize}px sans-serif`;
    ctx.fillStyle = isOverdrive
      ? 'rgba(0, 255, 255, 0.7)'
      : 'rgba(255, 255, 255, 0.5)';
    ctx.fillText('pts/sprint', cx, cy + width * 0.12 + valueFontSize * 0.65);
  }

  function render(value) {
    if (!ctx || !canvas) return;
    const { width, height } = getCSSSize();

    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height * 0.55;
    const radius = width * 0.38;
    const lineWidth = radius * 0.12;

    drawTrack(cx, cy, radius, lineWidth);
    drawProgressArc(cx, cy, radius, lineWidth, value);
    drawTicks(cx, cy, radius, lineWidth);
    drawLabels(cx, cy, radius, lineWidth);
    drawNeedle(cx, cy, radius, value);
    drawCenterText(cx, cy, value);
  }

  function animateTo(newTarget) {
    if (animFrameId !== null) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }

    targetValue = Math.max(CONFIG.minValue, Math.min(CONFIG.maxValue, newTarget));

    const startValue = currentValue;
    const delta = targetValue - startValue;
    const duration = 600;
    let startTime = null;

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);

      currentValue = startValue + delta * eased;
      render(currentValue);

      if (progress < 1) {
        animFrameId = requestAnimationFrame(step);
      } else {
        currentValue = targetValue;
        render(currentValue);
        animFrameId = null;
      }
    }

    animFrameId = requestAnimationFrame(step);
  }

  function update(newValue, overdriveFlag) {
    if (typeof overdriveFlag === 'boolean') {
      isOverdrive = overdriveFlag;
    }
    animateTo(newValue);
  }

  function setOverdrive(flag) {
    isOverdrive = !!flag;
    render(currentValue);
  }

  function handleResize() {
    setupCanvasResolution();
    render(currentValue);
  }

  function initSpeedometer(selector) {
    const el = typeof selector === 'string'
      ? document.querySelector(selector)
      : selector;

    if (!el) {
      console.warn('[Speedometer] Canvas element not found for selector:', selector);
      return null;
    }

    canvas = el;
    ctx = canvas.getContext('2d');

    if (!ctx) {
      console.warn('[Speedometer] Could not get 2D context from canvas.');
      return null;
    }

    setupCanvasResolution();
    render(0);

    window.addEventListener('resize', handleResize);

    return {
      update,
      setOverdrive,
      destroy() {
        if (animFrameId !== null) {
          cancelAnimationFrame(animFrameId);
          animFrameId = null;
        }
        window.removeEventListener('resize', handleResize);
        canvas = null;
        ctx = null;
      },
    };
  }

  return {
    initSpeedometer,
  };
})();

export const initSpeedometer = Speedometer.initSpeedometer;
export default Speedometer;