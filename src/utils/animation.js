export function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

export function easeInCubic(t) {
  return t * t * t;
}

export function easeInOutQuad(t) {
  if (t < 0.5) {
    return 2 * t * t;
  }
  return 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function easeOutElastic(t) {
  if (t === 0) return 0;
  if (t === 1) return 1;
  const c4 = (2 * Math.PI) / 3;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

export function easeOutBounce(t) {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) {
    return n1 * t * t;
  } else if (t < 2 / d1) {
    t -= 1.5 / d1;
    return n1 * t * t + 0.75;
  } else if (t < 2.5 / d1) {
    t -= 2.25 / d1;
    return n1 * t * t + 0.9375;
  } else {
    t -= 2.625 / d1;
    return n1 * t * t + 0.984375;
  }
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function animateValue({
  from,
  to,
  duration,
  easing = easeOutCubic,
  onUpdate,
  onComplete,
}) {
  let startTime = null;
  let rafId = null;

  function tick(currentTime) {
    if (startTime === null) {
      startTime = currentTime;
    }

    const rawProgress = (currentTime - startTime) / duration;
    const progress = clamp(rawProgress, 0, 1);
    const easedProgress = easing(progress);
    const currentValue = from + (to - from) * easedProgress;

    onUpdate(currentValue);

    if (progress >= 1) {
      if (typeof onComplete === 'function') {
        onComplete();
      }
      return;
    }

    rafId = requestAnimationFrame(tick);
  }

  rafId = requestAnimationFrame(tick);

  return rafId;
}

export function animateSequence(steps) {
  let cancelled = false;
  let currentRafId = null;
  let currentTimeoutId = null;

  function runStep(index) {
    if (cancelled) return;
    if (index >= steps.length) return;

    const step = steps[index];
    const delay = step.delay || 0;

    currentTimeoutId = setTimeout(() => {
      if (cancelled) return;

      currentRafId = animateValue({
        from: step.from,
        to: step.to,
        duration: step.duration,
        easing: step.easing || easeOutCubic,
        onUpdate: step.onUpdate,
        onComplete: () => {
          if (typeof step.onComplete === 'function') {
            step.onComplete();
          }
          runStep(index + 1);
        },
      });
    }, delay);
  }

  runStep(0);

  return function cancel() {
    cancelled = true;
    if (currentRafId !== null) {
      cancelAnimationFrame(currentRafId);
    }
    if (currentTimeoutId !== null) {
      clearTimeout(currentTimeoutId);
    }
  };
}