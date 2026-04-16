src/ui/doraBar.js

```javascript
import { animateValue } from '../utils/animation.js';

const DORA_METRICS = [
  {
    id: 'deploy-frequency',
    label: 'Deploy Frequency',
    unit: '/day',
    baseValue: 2.1,
    maxValue: 12.4,
    decimals: 1,
    trend: 'up'
  },
  {
    id: 'lead-time',
    label: 'Lead Time for Changes',
    unit: ' days',
    baseValue: 4.2,
    maxValue: 0.3,
    decimals: 1,
    trend: 'down'
  },
  {
    id: 'change-failure-rate',
    label: 'Change Failure Rate',
    unit: '%',
    baseValue: 18,
    maxValue: 2,
    decimals: 0,
    trend: 'down'
  },
  {
    id: 'mttr',
    label: 'MTTR',
    unit: ' min',
    baseValue: 240,
    maxValue: 8,
    decimals: 0,
    trend: 'down'
  },
  {
    id: 'traceability-index',
    label: 'Traceability Index',
    unit: '%',
    baseValue: 34,
    maxValue: 98,
    decimals: 0,
    trend: 'up'
  }
];

const domCache = new Map();
const currentValues = new Map();
const activeAnimations = new Map();

let doraBarRoot = null;

function getLevelClass(activeModulesCount) {
  if (activeModulesCount === 0) return 'level-inactive';
  if (activeModulesCount <= 2) return 'level-low';
  if (activeModulesCount <= 4) return 'level-medium';
  return 'level-max';
}

function setTrendIndicator(metricConfig, targetValue) {
  const cached = domCache.get(metricConfig.id);
  if (!cached) return;

  const currentValue = currentValues.get(metricConfig.id) ?? metricConfig.baseValue;
  const trendEl = cached.trendEl;

  trendEl.classList.remove('trend-positive', 'trend-negative', 'trend-neutral');

  const delta = targetValue - currentValue;

  if (Math.abs(delta) < 0.0001) {
    trendEl.textContent = '=';
    trendEl.classList.add('trend-neutral');
    return;
  }

  const valueIncreased = delta > 0;

  let isPositive;
  if (metricConfig.trend === 'up') {
    isPositive = valueIncreased;
  } else {
    isPositive = !valueIncreased;
  }

  if (isPositive) {
    trendEl.textContent = '↑';
    trendEl.classList.add('trend-positive');
  } else {
    trendEl.textContent = '↓';
    trendEl.classList.add('trend-negative');
  }
}

function animateDoraValue(metricId, targetValue) {
  const cached = domCache.get(metricId);
  if (!cached) return;

  const metric = DORA_METRICS.find(m => m.id === metricId);
  if (!metric) return;

  const currentValue = currentValues.get(metricId) ?? metric.baseValue;

  if (activeAnimations.has(metricId)) {
    cancelAnimationFrame(activeAnimations.get(metricId));
    activeAnimations.delete(metricId);
  }

  const duration = 800;
  const startTime = performance.now();
  const startValue = currentValue;

  function tick(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);

    const eased = 1 - Math.pow(1 - progress, 3);
    const interpolated = startValue + (targetValue - startValue) * eased;

    cached.valueEl.textContent = interpolated.toFixed(metric.decimals);

    if (progress < 1) {
      const rafId = requestAnimationFrame(tick);
      activeAnimations.set(metricId, rafId);
    } else {
      cached.valueEl.textContent = targetValue.toFixed(metric.decimals);
      currentValues.set(metricId, targetValue);
      activeAnimations.delete(metricId);
    }
  }

  const rafId = requestAnimationFrame(tick);
  activeAnimations.set(metricId, rafId);
}

function init() {
  doraBarRoot = document.querySelector('.dora-bar');

  DORA_METRICS.forEach(metric => {
    const container = document.querySelector(`[data-dora-id="${metric.id}"]`);
    if (!container) {
      console.warn(`[doraBar] Container not found for metric: ${metric.id}`);
      return;
    }

    const valueEl = container.querySelector('.dora-value');
    const unitEl = container.querySelector('.dora-unit');
    const trendEl = container.querySelector('.dora-trend');
    const labelEl = container.querySelector('.dora-label');

    if (unitEl) {
      unitEl.textContent = metric.unit;
    }

    if (labelEl) {
      labelEl.textContent = metric.label;
    }

    if (valueEl) {
      valueEl.textContent = metric.baseValue.toFixed(metric.decimals);
    }

    if (trendEl) {
      trendEl.textContent = '=';
      trendEl.classList.add('trend-neutral');
    }

    domCache.set(metric.id, {
      container,
      valueEl,
      unitEl,
      trendEl,
      labelEl
    });

    currentValues.set(metric.id, metric.baseValue);
  });
}

function update(activeModulesCount, isOverdrive) {
  const factor = activeModulesCount / 5;
  const levelClass = getLevelClass(activeModulesCount);

  DORA_METRICS.forEach(metric => {
    const targetValue = metric.baseValue + (metric.maxValue - metric.baseValue) * factor;

    setTrendIndicator(metric, targetValue);

    animateDoraValue(metric.id, targetValue);

    const cached = domCache.get(metric.id);
    if (cached && cached.container) {
      cached.container.classList.remove(
        'level-inactive',
        'level-low',
        'level-medium',
        'level-max'
      );
      cached.container.classList.add(levelClass);
    }
  });

  if (doraBarRoot) {
    if (isOverdrive) {
      doraBarRoot.classList.add('dora-bar--overdrive');
    } else {
      doraBarRoot.classList.remove('dora-bar--overdrive');
    }
  }
}

export { init, update };