const PowerGrid = {
  state: {
    modules: {
      gitlab:   false,
      gitlabCI: false,
      xray:     false,
      datadog:  false,
      rovo:     false
    },
    overdrive: false,
    animationFrameId: null,
    particles: [],
    pulses: []
  },
  config: {
    kpis: [
      {
        id: 'deployFreq',
        domId: 'kpi-deploy-freq',
        base: 2,
        max: 24,
        current: 2,
        target: 2,
        unit: '/h',
        boosts: { gitlab: 4, gitlabCI: 8, xray: 2, datadog: 2, rovo: 4 },
        inverse: false
      },
      {
        id: 'leadTime',
        domId: 'kpi-lead-time',
        base: 72,
        max: 4,
        current: 72,
        target: 72,
        unit: 'h',
        boosts: { gitlab: 12, gitlabCI: 20, xray: 8, datadog: 4, rovo: 8 },
        inverse: true
      },
      {
        id: 'changeFailRate',
        domId: 'kpi-fail-rate',
        base: 15,
        max: 1,
        current: 15,
        target: 15,
        unit: '%',
        boosts: { gitlab: 2, gitlabCI: 3, xray: 5, datadog: 3, rovo: 1 },
        inverse: true
      },
      {
        id: 'mttr',
        domId: 'kpi-mttr',
        base: 240,
        max: 8,
        current: 240,
        target: 240,
        unit: 'min',
        boosts: { gitlab: 20, gitlabCI: 10, xray: 15, datadog: 60, rovo: 10 },
        inverse: true
      },
      {
        id: 'coverage',
        domId: 'kpi-coverage',
        base: 40,
        max: 98,
        current: 40,
        target: 40,
        unit: '%',
        boosts: { gitlab: 5, gitlabCI: 8, xray: 30, datadog: 5, rovo: 5 },
        inverse: false
      }
    ],
    overdriveFactor: 1.15,
    particleCount: 80,
    connectionDistance: 120
  },
  canvas: {},
  kpi: {},
  ui: {}
};

/* ─────────────────────────────────────────────
   CANVAS — init
───────────────────────────────────────────── */
PowerGrid.canvas.init = function () {
  var container = document.getElementById('canvas-container');
  if (!container) return;

  var existing = document.getElementById('canvas-particles');
  if (existing) {
    PowerGrid.canvas.el = existing;
  } else {
    PowerGrid.canvas.el = document.createElement('canvas');
    PowerGrid.canvas.el.id = 'canvas-particles';
    container.appendChild(PowerGrid.canvas.el);
  }

  PowerGrid.canvas.ctx = PowerGrid.canvas.el.getContext('2d');
  PowerGrid.canvas.resize();

  window.addEventListener('resize', function () {
    PowerGrid.canvas.resize();
  });
};

PowerGrid.canvas.resize = function () {
  var container = document.getElementById('canvas-container');
  if (!container || !PowerGrid.canvas.el) return;
  PowerGrid.canvas.el.width  = container.offsetWidth;
  PowerGrid.canvas.el.height = container.offsetHeight;
};

/* ─────────────────────────────────────────────
   PARTICLES — init & update
───────────────────────────────────────────── */
PowerGrid.canvas.initParticles = function () {
  PowerGrid.state.particles = [];
  var w = PowerGrid.canvas.el ? PowerGrid.canvas.el.width  : window.innerWidth;
  var h = PowerGrid.canvas.el ? PowerGrid.canvas.el.height : window.innerHeight;
  var count = PowerGrid.config.particleCount;

  for (var i = 0; i < count; i++) {
    PowerGrid.state.particles.push({
      x:  Math.random() * w,
      y:  Math.random() * h,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      radius: Math.random() * 1.8 + 0.8,
      alpha:  Math.random() * 0.5 + 0.3
    });
  }
};

PowerGrid.canvas.updateParticles = function () {
  var w = PowerGrid.canvas.el.width;
  var h = PowerGrid.canvas.el.height;
  var particles = PowerGrid.state.particles;

  for (var i = 0; i < particles.length; i++) {
    var p = particles[i];
    p.x += p.vx;
    p.y += p.vy;

    if (p.x < 0)  { p.x = 0;  p.vx *= -1; }
    if (p.x > w)  { p.x = w;  p.vx *= -1; }
    if (p.y < 0)  { p.y = 0;  p.vy *= -1; }
    if (p.y > h)  { p.y = h;  p.vy *= -1; }
  }
};

/* ─────────────────────────────────────────────
   PULSES — spawn & update
───────────────────────────────────────────── */
PowerGrid.canvas.spawnPulse = function (x1, y1, x2, y2) {
  PowerGrid.state.pulses.push({
    x1: x1, y1: y1,
    x2: x2, y2: y2,
    t: 0,
    speed: 0.012 + Math.random() * 0.008
  });
};

PowerGrid.canvas.updatePulses = function () {
  var pulses = PowerGrid.state.pulses;
  for (var i = pulses.length - 1; i >= 0; i--) {
    pulses[i].t += pulses[i].speed;
    if (pulses[i].t >= 1) {
      pulses.splice(i, 1);
    }
  }
};

/* ─────────────────────────────────────────────
   DRAW — main render call
───────────────────────────────────────────── */
PowerGrid.canvas.draw = function () {
  var ctx        = PowerGrid.canvas.ctx;
  var w          = PowerGrid.canvas.el.width;
  var h          = PowerGrid.canvas.el.height;
  var particles  = PowerGrid.state.particles;
  var pulses     = PowerGrid.state.pulses;
  var maxDist    = PowerGrid.config.connectionDistance;
  var overdrive  = PowerGrid.state.overdrive;

  ctx.clearRect(0, 0, w, h);

  /* — connections — */
  for (var i = 0; i < particles.length; i++) {
    for (var j = i + 1; j < particles.length; j++) {
      var dx   = particles[i].x - particles[j].x;
      var dy   = particles[i].y - particles[j].y;
      var dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < maxDist) {
        var lineAlpha = (1 - dist / maxDist) * 0.25;
        if (overdrive) lineAlpha *= 1.6;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.strokeStyle = overdrive
          ? 'rgba(255, 180, 0, ' + lineAlpha + ')'
          : 'rgba(0, 210, 255, '  + lineAlpha + ')';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        /* randomly spawn a pulse on active connections */
        if (Math.random() < 0.0008) {
          PowerGrid.canvas.spawnPulse(
            particles[i].x, particles[i].y,
            particles[j].x, particles[j].y
          );
        }
      }
    }
  }

  /* — pulses — */
  for (var p = 0; p < pulses.length; p++) {
    var pulse = pulses[p];
    var px = pulse.x1 + (pulse.x2 - pulse.x1) * pulse.t;
    var py = pulse.y1 + (pulse.y2 - pulse.y1) * pulse.t;
    var pulseAlpha = 1 - pulse.t;

    ctx.beginPath();
    ctx.arc(px, py, overdrive ? 3 : 2, 0, Math.PI * 2);
    ctx.fillStyle = overdrive
      ? 'rgba(255, 220, 50, ' + pulseAlpha + ')'
      : 'rgba(100, 240, 255, ' + pulseAlpha + ')';
    ctx.fill();
  }

  /* — particles — */
  for (var k = 0; k < particles.length; k++) {
    var pt = particles[k];
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
    var pAlpha = overdrive ? Math.min(pt.alpha * 1.4, 1) : pt.alpha;
    ctx.fillStyle = overdrive
      ? 'rgba(255, 200, 80, ' + pAlpha + ')'
      : 'rgba(0, 220, 255, '  + pAlpha + ')';
    ctx.fill();
  }
};

/* ─────────────────────────────────────────────
   ANIMATION LOOP
───────────────────────────────────────────── */
PowerGrid.canvas.loop = function () {
  PowerGrid.canvas.updateParticles();
  PowerGrid.canvas.updatePulses();
  PowerGrid.canvas.draw();
  PowerGrid.state.animationFrameId = requestAnimationFrame(PowerGrid.canvas.loop);
};

PowerGrid.canvas.start = function () {
  if (PowerGrid.state.animationFrameId !== null) return;
  PowerGrid.canvas.loop();
};

PowerGrid.canvas.stop = function () {
  if (PowerGrid.state.animationFrameId !== null) {
    cancelAnimationFrame(PowerGrid.state.animationFrameId);
    PowerGrid.state.animationFrameId = null;
  }
};

/* ─────────────────────────────────────────────
   KPI — target calculation
───────────────────────────────────────────── */
PowerGrid.kpi.calculateTargets = function () {
  var modules   = PowerGrid.state.modules;
  var overdrive = PowerGrid.state.overdrive;
  var factor    = PowerGrid.config.overdriveFactor;
  var kpis      = PowerGrid.config.kpis;

  for (var i = 0; i < kpis.length; i++) {
    var kpi = kpis[i];

    if (kpi.inverse) {
      /* starts at base, each active module reduces the value */
      var reduced = kpi.base;
      for (var mod in kpi.boosts) {
        if (modules[mod]) {
          reduced -= kpi.boosts[mod];
        }
      }
      if (overdrive) {
        /* overdrive pushes further toward max (lower) */
        var gap = reduced - kpi.max;
        reduced = reduced - gap * (factor - 1);
      }
      kpi.target = Math.max(reduced, kpi.max);
    } else {
      /* starts at base, each active module increases the value */
      var boosted = kpi.base;
      for (var mod in kpi.boosts) {
        if (modules[mod]) {
          boosted += kpi.boosts[mod];
        }
      }
      if (overdrive) {
        var gap = kpi.max - boosted;
        boosted = boosted + gap * (factor - 1);
      }
      kpi.target = Math.min(boosted, kpi.max);
    }
  }
};

/* ─────────────────────────────────────────────
   KPI — animate current toward target
───────────────────────────────────────────── */
PowerGrid.kpi.animateValues = function () {
  var kpis    = PowerGrid.config.kpis;
  var lerpRate = 0.04;

  for (var i = 0; i < kpis.length; i++) {
    var kpi  = kpis[i];
    var diff = kpi.target - kpi.current;

    if (Math.abs(diff) < 0.05) {
      kpi.current = kpi.target;
    } else {
      kpi.current += diff * lerpRate;
    }
  }
};

/* ─────────────────────────────────────────────
   KPI — render values to DOM
───────────────────────────────────────────── */
PowerGrid.kpi.render = function () {
  var kpis = PowerGrid.config.kpis;

  for (var i = 0; i < kpis.length; i++) {
    var kpi = kpis[i];
    var el  = document.getElementById(kpi.domId);
    if (!el) continue;

    var display;
    if (kpi.unit === '/h' || kpi.unit === 'x') {
      display = kpi.current.toFixed(1);
    } else if (kpi.unit === '%') {
      display = kpi.current.toFixed(1);
    } else {
      display = Math.round(kpi.current);
    }

    el.textContent = display + kpi.unit;

    /* colour feedback: green when near max, amber mid, red near base */
    var progress;
    if (kpi.inverse) {
      progress = (kpi.base - kpi.current) / (kpi.base - kpi.max);
    } else {
      progress = (kpi.current - kpi.base) / (kpi.max - kpi.base);
    }
    progress = Math.max(0, Math.min(1, progress));

    el.classList.remove('kpi-good', 'kpi-warn', 'kpi-bad');
    if (progress >= 0.66) {
      el.classList.add('kpi-good');
    } else if (progress >= 0.33) {
      el.classList.add('kpi-warn');
    } else {
      el.classList.add('kpi-bad');
    }
  }
};

/* ─────────────────────────────────────────────
   UI — live clock
───────────────────────────────────────────── */
PowerGrid.ui.startClock = function () {
  var el = document.getElementById('live-clock');
  if (!el) return;

  function tick() {
    var now = new Date();
    var hh  = String(now.getHours()).padStart(2, '0');
    var mm  = String(now.getMinutes()).padStart(2, '0');
    var ss  = String(now.getSeconds()).padStart(2, '0');
    el.textContent = hh + ':' + mm + ':' + ss;
  }

  tick();
  setInterval(tick, 1000);
};

/* ─────────────────────────────────────────────
   UI — module toggle buttons
───────────────────────────────────────────── */
PowerGrid.ui.bindModuleToggles = function () {
  var moduleKeys = ['gitlab', 'gitlabCI', 'xray', 'datadog', 'rovo'];

  for (var i = 0; i < moduleKeys.length; i++) {
    (function (key) {
      var btn = document.getElementById('toggle-' + key);
      if (!btn) return;

      btn.addEventListener('click', function () {
        PowerGrid.state.modules[key] = !PowerGrid.state.modules[key];
        btn.classList.toggle('active', PowerGrid.state.modules[key]);
        PowerGrid.kpi.calculateTargets();
        PowerGrid.ui.updateOverdriveAvailability();
      });
    })(moduleKeys[i]);
  }
};

/* ─────────────────────────────────────────────
   UI — overdrive toggle
───────────────────────────────────────────── */
PowerGrid.ui.bindOverdriveToggle = function () {
  var btn = document.getElementById('toggle-overdrive');
  if (!btn) return;

  btn.addEventListener('click', function () {
    var modules = PowerGrid.state.modules;
    var anyActive = modules.gitlab || modules.gitlabCI ||
                    modules.xray   || modules.datadog  || modules.rovo;

    if (!anyActive && !PowerGrid.state.overdrive) return;

    PowerGrid.state.overdrive = !PowerGrid.state.overdrive;
    btn.classList.toggle('active', PowerGrid.state.overdrive);
    document.getElementById('app-root') &&
      document.getElementById('app-root').classList.toggle('overdrive-active', PowerGrid.state.overdrive);
    PowerGrid.kpi.calculateTargets();
  });
};

PowerGrid.ui.updateOverdriveAvailability = function () {
  var btn = document.getElementById('toggle-overdrive');
  if (!btn) return;

  var modules   = PowerGrid.state.modules;
  var anyActive = modules.gitlab || modules.gitlabCI ||
                  modules.xray   || modules.datadog  || modules.rovo;

  btn.disabled = !anyActive;

  if (!anyActive && PowerGrid.state.overdrive) {
    PowerGrid.state.overdrive = false;
    btn.classList.remove('active');
    var root = document.getElementById('app-root');
    if (root) root.classList.remove('overdrive-active');
    PowerGrid.kpi.calculateTargets();
  }
};

/* ─────────────────────────────────────────────
   UI — modal handlers
───────────────────────────────────────────── */
PowerGrid.ui.bindModals = function () {
  var overlays = document.querySelectorAll('.modal-overlay');

  for (var i = 0; i < overlays.length; i++) {
    (function (overlay) {
      var closeBtn = overlay.querySelector('.modal-close-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', function () {
          overlay.classList.remove('visible');
        });
      }

      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) {
          overlay.classList.remove('visible');
        }
      });
    })(overlays[i]);
  }

  /* open triggers — buttons with data-modal attribute */
  var triggers = document.querySelectorAll('[data-modal]');
  for (var j = 0; j < triggers.length; j++) {
    (function (trigger) {
      trigger.addEventListener('click', function () {
        var targetId = trigger.getAttribute('data-modal');
        var modal    = document.getElementById(targetId);
        if (modal) modal.classList.add('visible');
      });
    })(triggers[j]);
  }
};

/* ─────────────────────────────────────────────
   MAIN RENDER LOOP (KPI tick inside rAF)
───────────────────────────────────────────── */
PowerGrid.mainLoop = function () {
  PowerGrid.kpi.animateValues();
  PowerGrid.kpi.render();
  requestAnimationFrame(PowerGrid.mainLoop);
};

/* ─────────────────────────────────────────────
   BOOT
───────────────────────────────────────────── */
PowerGrid.init = function () {
  PowerGrid.canvas.init();
  PowerGrid.canvas.initParticles();
  PowerGrid.canvas.start();

  PowerGrid.kpi.calculateTargets();

  PowerGrid.ui.startClock();
  PowerGrid.ui.bindModuleToggles();
  PowerGrid.ui.bindOverdriveToggle();
  PowerGrid.ui.updateOverdriveAvailability();
  PowerGrid.ui.bindModals();

  requestAnimationFrame(PowerGrid.mainLoop);
};

document.addEventListener('DOMContentLoaded', PowerGrid.init);