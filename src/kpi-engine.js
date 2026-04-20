import { getState, getKpiConfig } from './state.js';

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function formatKpiValue(value, unit) {
  if (unit === '%') {
    return Math.round(value) + '%';
  } else if (unit === 'x') {
    return value.toFixed(1) + 'x';
  } else {
    return Math.round(value) + ' ' + unit;
  }
}

export function calculateKpiFrame(kpiId, elapsedMs, durationMs) {
  const config = getKpiConfig();
  const kpi = config[kpiId];

  if (!kpi) {
    return null;
  }

  const t = Math.min(elapsedMs / durationMs, 1);
  const easedT = easeOutCubic(t);
  const currentValue = kpi.baseValue + (kpi.targetValue - kpi.baseValue) * easedT;

  return { value: currentValue, isComplete: t >= 1 };
}

export function updateKpiDisplay(kpiId, currentValue) {
  const config = getKpiConfig();
  const kpi = config[kpiId];

  if (!kpi) {
    return;
  }

  const element = document.getElementById(kpi.elementId);

  if (!element) {
    return;
  }

  element.textContent = formatKpiValue(currentValue, kpi.unit);
}