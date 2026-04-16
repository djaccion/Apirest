src/ui/kpiPanel.js

```javascript
import { animateValue, easeOutCubic } from '../utils/animation.js';
import { getState } from '../state/appState.js';
import { KPI_CONFIG } from '../config/kpiConfig.js';

let domRefs = {};
let previousValues = {};

export function initKpiPanel() {
  domRefs = {};

  for (const [kpiName, kpiDef] of Object.entries(KPI_CONFIG)) {
    const refs = {};

    const valueEl = document.getElementById(kpiDef.ids?.value);
    if (valueEl) {
      refs.value = valueEl;
    } else {
      console.warn(`[kpiPanel] Element not found for KPI "${kpiName}" value id: ${kpiDef.ids?.value}`);
    }

    const deltaEl = document.getElementById(kpiDef.ids?.delta);
    if (deltaEl) {
      refs.delta = deltaEl;
    } else {
      console.warn(`[kpiPanel] Element not found for KPI "${kpiName}" delta id: ${kpiDef.ids?.delta}`);
    }

    const barEl = document.getElementById(kpiDef.ids?.bar);
    if (barEl) {
      refs.bar = barEl;
    } else {
      console.warn(`[kpiPanel] Element not found for KPI "${kpiName}" bar id: ${kpiDef.ids?.bar}`);
    }

    const statusEl = document.getElementById(kpiDef.ids?.status);
    if (statusEl) {
      refs.status = statusEl;
    } else {
      console.warn(`[kpiPanel] Element not found for KPI "${kpiName}" status id: ${kpiDef.ids?.status}`);
    }

    const containerEl = document.getElementById(kpiDef.ids?.container);
    if (containerEl) {
      refs.container = containerEl;
    } else {
      console.warn(`[kpiPanel] Element not found for KPI "${kpiName}" container id: ${kpiDef.ids?.container}`);
    }

    domRefs[kpiName] = refs;
  }
}

export function updateKpiPanel(stateOverride) {
  const state = stateOverride || getState();

  for (const [kpiName, kpiDef] of Object.entries(KPI_CONFIG)) {
    const baseValue = state.kpiValues?.[kpiName] ?? kpiDef.baseValue ?? 0;

    let boostTotal = 0;
    if (kpiDef.boosts) {
      for (const [moduleName, boostValue] of Object.entries(kpiDef.boosts)) {
        if (state.modules?.[moduleName]) {
          boostTotal += boostValue;
        }
      }
    }

    const effectiveValue = baseValue + boostTotal;
    const previousValue = previousValues[kpiName] ?? kpiDef.baseValue ?? 0;

    renderKpiItem(kpiName, effectiveValue, previousValue);

    previousValues[kpiName] = effectiveValue;
  }
}

function formatValue(value, kpiDef) {
  const type = kpiDef.format ?? 'integer';
  if (type === 'decimal') {
    return value.toFixed(1);
  }
  if (type === 'percent') {
    return `${Math.round(value)}%`;
  }
  return `${Math.round(value)}`;
}

function getStatusInfo(effectiveValue, kpiDef) {
  const thresholds = kpiDef.thresholds;
  if (!thresholds) {
    return { label: 'OPTIMAL', className: 'status-optimal' };
  }

  if (kpiDef.higherIsBetter !== false) {
    if (effectiveValue >= thresholds.optimal) {
      return { label: 'OPTIMAL', className: 'status-optimal' };
    } else if (effectiveValue >= thresholds.good) {
      return { label: 'GOOD', className: 'status-good' };
    } else if (effectiveValue >= thresholds.warning) {
      return { label: 'WARNING', className: 'status-warning' };
    } else {
      return { label: 'CRITICAL', className: 'status-critical' };
    }
  } else {
    if (effectiveValue <= thresholds.optimal) {
      return { label: 'OPTIMAL', className: 'status-optimal' };
    } else if (effectiveValue <= thresholds.good) {
      return { label: 'GOOD', className: 'status-good' };
    } else if (effectiveValue <= thresholds.warning) {
      return { label: 'WARNING', className: 'status-warning' };
    } else {
      return { label: 'CRITICAL', className: 'status-critical' };
    }
  }
}

function renderKpiItem(kpiName, newValue, previousValue) {
  const refs = domRefs[kpiName];
  const kpiDef = KPI_CONFIG[kpiName];

  if (!refs || !kpiDef) return;

  // PASO 1 - Animación del número principal
  if (newValue !== previousValue && refs.value) {
    animateValue({
      from: previousValue,
      to: newValue,
      duration: 800,
      easing: easeOutCubic,
      onUpdate: (interpolatedValue) => {
        if (refs.value) {
          refs.value.textContent = formatValue(interpolatedValue, kpiDef);
        }
      }
    });
  }

  // PASO 2 - Actualización del delta
  if (refs.delta) {
    const diff = newValue - previousValue;
    if (diff > 0) {
      refs.delta.textContent = `+${formatValue(diff, kpiDef)}`;
      refs.delta.classList.remove('delta-negative', 'delta-neutral');
      refs.delta.classList.add('delta-positive');
    } else if (diff < 0) {
      refs.delta.textContent = formatValue(diff, kpiDef);
      refs.delta.classList.remove('delta-positive', 'delta-neutral');
      refs.delta.classList.add('delta-negative');
    } else {
      refs.delta.textContent = '';
      refs.delta.classList.remove('delta-positive', 'delta-negative');
      refs.delta.classList.add('delta-neutral');
    }
  }

  // PASO 3 - Actualización de la barra de progreso
  if (refs.bar) {
    const maxValue = kpiDef.maxValue ?? 100;
    const rawPercent = (newValue / maxValue) * 100;
    const clampedPercent = Math.min(100, Math.max(0, rawPercent));
    refs.bar.style.transform = `scaleX(${clampedPercent / 100})`;
  }

  // PASO 4 - Actualización del label de estado
  if (refs.status) {
    const statusInfo = getStatusInfo(newValue, kpiDef);
    refs.status.textContent = statusInfo.label;

    const allStatusClasses = ['status-optimal', 'status-good', 'status-warning', 'status-critical'];
    refs.status.classList.remove(...allStatusClasses);
    refs.status.classList.add(statusInfo.className);
  }
}

export function highlightKpiBoost(moduleName) {
  for (const [kpiName, kpiDef] of Object.entries(KPI_CONFIG)) {
    if (kpiDef.boosts && kpiDef.boosts[moduleName] !== undefined) {
      const refs = domRefs[kpiName];
      if (refs?.container) {
        refs.container.classList.add('kpi-boost-flash');
        setTimeout(() => {
          refs.container.classList.remove('kpi-boost-flash');
        }, 1200);
      }
    }
  }
}

export function resetKpiDisplay() {
  previousValues = {};

  for (const [kpiName, kpiDef] of Object.entries(KPI_CONFIG)) {
    const baseValue = kpiDef.baseValue ?? 0;
    const refs = domRefs[kpiName];

    if (!refs) continue;

    // Animar valor numérico de vuelta al base
    if (refs.value) {
      const currentDisplayed = parseFloat(refs.value.textContent) || 0;
      animateValue({
        from: currentDisplayed,
        to: baseValue,
        duration: 600,
        easing: easeOutCubic,
        onUpdate: (interpolatedValue) => {
          if (refs.value) {
            refs.value.textContent = formatValue(interpolatedValue, kpiDef);
          }
        }
      });
    }

    // Limpiar delta
    if (refs.delta) {
      refs.delta.textContent = '';
      refs.delta.classList.remove('delta-positive', 'delta-negative', 'delta-neutral');
    }

    // Recalcular barra de progreso con valor base
    if (refs.bar) {
      const maxValue = kpiDef.maxValue ?? 100;
      const rawPercent = (baseValue / maxValue) * 100;
      const clampedPercent = Math.min(100, Math.max(0, rawPercent));
      refs.bar.style.transform = `scaleX(${clampedPercent / 100})`;
    }

    // Recalcular label de estado con valor base
    if (refs.status) {
      const statusInfo = getStatusInfo(baseValue, kpiDef);
      refs.status.textContent = statusInfo.label;

      const allStatusClasses = ['status-optimal', 'status-good', 'status-warning', 'status-critical'];
      refs.status.classList.remove(...allStatusClasses);
      refs.status.classList.add(statusInfo.className);
    }

    previousValues[kpiName] = baseValue;
  }
}