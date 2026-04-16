import { getCartesianPoint, calculateRadarVertices } from '../utils/mathHelpers.js';
import { animateValue } from '../utils/animation.js';

const AXES = [
  'Velocity',
  'Quality',
  'Collaboration',
  'Automation',
  'Visibility',
  'Predictability',
  'Innovation',
];

const NUM_AXES = AXES.length;
const START_ANGLE = -Math.PI / 2;
const ANGLE_INCREMENT = (2 * Math.PI) / NUM_AXES;
const PADDING = 30;
const REFERENCE_RINGS = [0.2, 0.4, 0.6, 0.8, 1.0];
const LABEL_OFFSET = 18;
const DOT_RADIUS = 4;
const RING_OPACITY_MIN = 0.05;
const RING_OPACITY_MAX = 0.12;
const RING_COLOR = `rgba(255, 255, 255, ${(RING_OPACITY_MIN + RING_OPACITY_MAX) / 2})`;
const DATA_FILL_OPACITY = 0.25;
const DATA_STROKE_WIDTH = 2;
const DOT_GLOW_BLUR = 8;
const ANIMATION_DURATION = 400;

let ctx = null;
let centerX = 0;
let centerY = 0;
let maxRadius = 0;
let cachedVertices = [];
let currentValues = new Array(NUM_AXES).fill(0);
let displayValues = new Array(NUM_AXES).fill(0);
let resizeObserver = null;
let primaryColor = '#00d4ff';
let animationFrameIds = [];

function getPrimaryColor() {
  const computed = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-primary')
    .trim();
  return computed || '#00d4ff';
}

function cacheGeometry() {
  if (!ctx) return;

  const canvas = ctx.canvas;
  const width = canvas.width;
  const height = canvas.height;

  centerX = width / 2;
  centerY = height / 2;
  maxRadius = Math.min(centerX, centerY) - PADDING;
  if (maxRadius < 0) maxRadius = 0;

  cachedVertices = calculateRadarVertices(
    centerX,
    centerY,
    maxRadius,
    NUM_AXES,
    START_ANGLE,
    ANGLE_INCREMENT
  );
}

function getDataPoint(axisIndex, normalizedValue) {
  const angle = START_ANGLE + axisIndex * ANGLE_INCREMENT;
  const r = maxRadius * Math.max(0, Math.min(1, normalizedValue));
  return getCartesianPoint(centerX, centerY, r, angle);
}

function drawReferenceRings() {
  ctx.save();
  ctx.strokeStyle = RING_COLOR;
  ctx.lineWidth = 1;

  for (const scale of REFERENCE_RINGS) {
    ctx.beginPath();
    for (let i = 0; i < NUM_AXES; i++) {
      const vx = centerX + (cachedVertices[i].x - centerX) * scale;
      const vy = centerY + (cachedVertices[i].y - centerY) * scale;
      if (i === 0) {
        ctx.moveTo(vx, vy);
      } else {
        ctx.lineTo(vx, vy);
      }
    }
    ctx.closePath();
    ctx.stroke();
  }

  ctx.restore();
}

function drawAxisLines() {
  ctx.save();
  ctx.strokeStyle = RING_COLOR;
  ctx.lineWidth = 1;

  for (let i = 0; i < NUM_AXES; i++) {
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(cachedVertices[i].x, cachedVertices[i].y);
    ctx.stroke();
  }

  ctx.restore();
}

function drawDataArea() {
  primaryColor = getPrimaryColor();

  const dataPoints = displayValues.map((val, i) => getDataPoint(i, val));

  ctx.save();

  ctx.beginPath();
  for (let i = 0; i < NUM_AXES; i++) {
    if (i === 0) {
      ctx.moveTo(dataPoints[i].x, dataPoints[i].y);
    } else {
      ctx.lineTo(dataPoints[i].x, dataPoints[i].y);
    }
  }
  ctx.closePath();

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 212, b: 255 };
  };

  const rgb = hexToRgb(primaryColor);
  const rgbStr = `${rgb.r}, ${rgb.g}, ${rgb.b}`;

  ctx.fillStyle = `rgba(${rgbStr}, ${DATA_FILL_OPACITY})`;
  ctx.fill();

  ctx.strokeStyle = `rgba(${rgbStr}, 1.0)`;
  ctx.lineWidth = DATA_STROKE_WIDTH;
  ctx.stroke();

  ctx.restore();
}

function drawDataDots() {
  primaryColor = getPrimaryColor();

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 212, b: 255 };
  };

  const rgb = hexToRgb(primaryColor);
  const rgbStr = `${rgb.r}, ${rgb.g}, ${rgb.b}`;

  ctx.save();
  ctx.fillStyle = `rgba(${rgbStr}, 1.0)`;
  ctx.shadowBlur = DOT_GLOW_BLUR;
  ctx.shadowColor = primaryColor;

  for (let i = 0; i < NUM_AXES; i++) {
    const point = getDataPoint(i, displayValues[i]);
    ctx.beginPath();
    ctx.arc(point.x, point.y, DOT_RADIUS, 0, 2 * Math.PI);
    ctx.fill();
  }

  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawLabels() {
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let i = 0; i < NUM_AXES; i++) {
    const angle = START_ANGLE + i * ANGLE_INCREMENT;
    const labelRadius = maxRadius + LABEL_OFFSET;
    const lx = centerX + labelRadius * Math.cos(angle);
    const ly = centerY + labelRadius * Math.sin(angle);
    ctx.fillText(AXES[i], lx, ly);
  }

  ctx.restore();
}

function drawRadarChart() {
  if (!ctx) return;

  const canvas = ctx.canvas;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (maxRadius <= 0 || cachedVertices.length === 0) return;

  drawReferenceRings();
  drawAxisLines();
  drawDataArea();
  drawDataDots();
  drawLabels();
}

export function initRadarChart(canvasElement) {
  if (!canvasElement) return;

  ctx = canvasElement.getContext('2d');

  const syncCanvasSize = () => {
    const rect = canvasElement.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      canvasElement.width = rect.width;
      canvasElement.height = rect.height;
    }
    cacheGeometry();
    drawRadarChart();
  };

  syncCanvasSize();

  if (resizeObserver) {
    resizeObserver.disconnect();
  }

  resizeObserver = new ResizeObserver(() => {
    syncCanvasSize();
  });

  resizeObserver.observe(canvasElement);
}

export function updateRadarChart(dataObject) {
  if (!ctx) return;

  const keys = [
    'velocity',
    'quality',
    'collaboration',
    'automation',
    'visibility',
    'predictability',
    'innovation',
  ];

  const newValues = keys.map((key) => {
    const val = dataObject[key];
    if (typeof val === 'number') {
      return Math.max(0, Math.min(1, val));
    }
    return 0;
  });

  animationFrameIds.forEach((id) => cancelAnimationFrame(id));
  animationFrameIds = [];

  const previousValues = [...displayValues];

  newValues.forEach((targetVal, i) => {
    const startVal = previousValues[i];
    currentValues[i] = targetVal;

    animateValue(
      startVal,
      targetVal,
      ANIMATION_DURATION,
      (interpolated) => {
        displayValues[i] = interpolated;
        drawRadarChart();
      }
    );
  });
}