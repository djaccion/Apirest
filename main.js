// ============================================================
// === STATE ===
// ============================================================

const globalState = {
    modules: {
        jira: false,
        confluence: false,
        bitbucket: false,
        compass: false,
        rovo: false
    },
    overdrive: false,
    animationFrameId: null,
    particles: [],
    pulses: []
};

const KPI_CONFIG = {
    ttm: {
        label: 'Reducción TTM',
        unit: '%',
        base: 0,
        max: 75,
        current: 0,
        target: 0,
        elementId: 'kpi-ttm',
        boosts: { jira: 10, confluence: 8, bitbucket: 15, compass: 12, rovo: 20 }
    },
    defects: {
        label: 'Reducción Defectos',
        unit: '%',
        base: 0,
        max: 60,
        current: 0,
        target: 0,
        elementId: 'kpi-defects',
        boosts: { jira: 8, confluence: 5, bitbucket: 18, compass: 7, rovo: 15 }
    },
    velocity: {
        label: 'Aumento Velocidad',
        unit: 'x',
        base: 1.0,
        max: 4.5,
        current: 1.0,
        target: 1.0,
        elementId: 'kpi-velocity',
        boosts: { jira: 0.4, confluence: 0.3, bitbucket: 0.5, compass: 0.4, rovo: 0.9 }
    },
    cost: {
        label: 'Eficiencia de Costo',
        unit: '%',
        base: 0,
        max: 55,
        current: 0,
        target: 0,
        elementId: 'kpi-cost',
        boosts: { jira: 7, confluence: 6, bitbucket: 10, compass: 9, rovo: 18 }
    }
};

// ============================================================
// === KPI ENGINE ===
// ============================================================

function calculateTargets() {
    Object.keys(KPI_CONFIG).forEach(function(key) {
        var kpi = KPI_CONFIG[key];
        var total = kpi.base;
        Object.keys(globalState.modules).forEach(function(mod) {
            if (globalState.modules[mod]) {
                total += kpi.boosts[mod];
            }
        });
        if (globalState.overdrive) {
            var allBoosts = Object.values(kpi.boosts).reduce(function(a, b) { return a + b; }, 0);
            var boostedSum = kpi.base + allBoosts;
            var overdriveBonus = kpi.max - boostedSum;
            total += overdriveBonus;
        }
        total = Math.min(total, kpi.max);
        kpi.target = parseFloat(total.toFixed(2));
    });
}

function animateKPIs() {
    var allSettled = true;
    Object.keys(KPI_CONFIG).forEach(function(key) {
        var kpi = KPI_CONFIG[key];
        var diff = kpi.target - kpi.current;
        if (Math.abs(diff) > 0.01) {
            kpi.current += diff * 0.08;
            allSettled = false;
        } else {
            kpi.current = kpi.target;
        }
    });
    _renderKPIValues();
    return allSettled;
}

function _renderKPIValues() {
    Object.keys(KPI_CONFIG).forEach(function(key) {
        var kpi = KPI_CONFIG[key];
        var el = document.getElementById(kpi.elementId);
        if (!el) return;
        var display = kpi.unit === 'x'
            ? kpi.current.toFixed(2) + kpi.unit
            : Math.round(kpi.current) + kpi.unit;
        el.textContent = display;
        _updateKPIDelta(key, kpi);
    });
    _updateDerivedKPIs();
}

function _updateKPIDelta(key, kpi) {
    var deltaMap = {
        ttm: 'kpi-ttm-delta',
        defects: 'kpi-defects-delta',
        velocity: 'kpi-velocity-delta',
        cost: 'kpi-cost-delta'
    };
    var deltaId = deltaMap[key];
    if (!deltaId) return;
    var deltaEl = document.getElementById(deltaId);
    if (!deltaEl) return;
    var diff = kpi.current - kpi.base;
    if (kpi.unit === 'x') {
        deltaEl.textContent = diff >= 0 ? '+' + diff.toFixed(2) + 'x vs base' : diff.toFixed(2) + 'x vs base';
    } else {
        deltaEl.textContent = diff >= 0 ? '+' + Math.round(diff) + '% vs base' : Math.round(diff) + '% vs base';
    }
}

function _updateDerivedKPIs() {
    var activeCount = Object.values(globalState.modules).filter(Boolean).length;
    var roiEl = document.getElementById('kpi-roi');
    var roiDeltaEl = document.getElementById('kpi-roi-delta');
    var hoursEl = document.getElementById('kpi-hours');
    var hoursDeltaEl = document.getElementById('kpi-hours-delta');

    if (roiEl) {
        var roiVal = activeCount * 47 + (globalState.overdrive ? 85 : 0);
        var currentRoi = parseFloat(roiEl.textContent) || 0;
        var newRoi = currentRoi + (roiVal - currentRoi) * 0.08;
        roiEl.textContent = Math.round(newRoi) + '%';
    }
    if (roiDeltaEl) {
        roiDeltaEl.textContent = activeCount > 0 ? '+' + (activeCount * 47 + (globalState.overdrive ? 85 : 0)) + '% ROI proyectado' : 'Sin módulos activos';
    }
    if (hoursEl) {
        var hoursVal = activeCount * 12 + (globalState.overdrive ? 20 : 0);
        var currentHours = parseFloat(hoursEl.textContent) || 0;
        var newHours = currentHours + (hoursVal - currentHours) * 0.08;
        hoursEl.textContent = Math.round(newHours) + 'h';
    }
    if (hoursDeltaEl) {
        hoursDeltaEl.textContent = activeCount > 0 ? '-' + (activeCount * 12 + (globalState.overdrive ? 20 : 0)) + 'h/semana ahorradas' : 'Sin módulos activos';
    }
}

// ============================================================
// === CANVAS: PARTICLES ===
// ============================================================

function initParticles(canvas) {
    globalState.particles = [];
    var count = 80;
    for (var i = 0; i < count; i++) {
        globalState.particles.push(_createParticle(canvas));
    }
}

function _createParticle(canvas) {
    return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 1,
        alpha: Math.random() * 0.5 + 0.1,
        color: _getParticleColor()
    };
}

function _getParticleColor() {
    var colors = ['#00c8ff', '#7b61ff', '#00ffb3', '#ff6b35'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function drawParticles(ctx, canvas) {
    globalState.particles.forEach(function(p) {
        _updateParticlePosition(p, canvas);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
    });
}

function _updateParticlePosition(p, canvas) {
    var speedMult = globalState.overdrive ? 2.5 : 1;
    p.x += p.vx * speedMult;
    p.y += p.vy * speedMult;
    if (p.x < 0) p.x = canvas.width;
    if (p.x > canvas.width) p.x = 0;
    if (p.y < 0) p.y = canvas.height;
    if (p.y > canvas.height) p.y = 0;
}

// ============================================================
// === CANVAS: CONNECTIONS ===
// ============================================================

function drawConnections(ctx) {
    var particles = globalState.particles;
    var maxDist = globalState.overdrive ? 120 : 80;
    for (var i = 0; i < particles.length; i++) {
        for (var j = i + 1; j < particles.length; j++) {
            _drawConnectionLine(ctx, particles[i], particles[j], maxDist);
        }
    }
    _updatePulses(ctx);
}

function _drawConnectionLine(ctx, p1, p2, maxDist) {
    var dx = p1.x - p2.x;
    var dy = p1.y - p2.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > maxDist) return;
    var alpha = (1 - dist / maxDist) * 0.3;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.strokeStyle = 'rgba(0, 200, 255, ' + alpha + ')';
    ctx.lineWidth = 0.5;
    ctx.stroke();
}

function _updatePulses(ctx) {
    var activeCount = Object.values(globalState.modules).filter(Boolean).length;
    if (activeCount > 0 && Math.random() < 0.02 * activeCount) {
        _spawnPulse();
    }
    globalState.pulses = globalState.pulses.filter(function(pulse) {
        return _drawAndUpdatePulse(ctx, pulse);
    });
}

function _spawnPulse() {
    var particles = globalState.particles;
    if (particles.length < 2) return;
    var i = Math.floor(Math.random() * particles.length);
    var j = Math.floor(Math.random() * particles.length);
    if (i === j) return;
    globalState.pulses.push({
        x: particles[i].x,
        y: particles[i].y,
        tx: particles[j].x,
        ty: particles[j].y,
        progress: 0,
        speed: 0.03 + Math.random() * 0.02
    });
}

function _drawAndUpdatePulse(ctx, pulse) {
    pulse.progress += pulse.speed;
    if (pulse.progress >= 1) return false;
    var x = pulse.x + (pulse.tx - pulse.x) * pulse.progress;
    var y = pulse.y + (pulse.ty - pulse.y) * pulse.progress;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = globalState.overdrive ? '#ff6b35' : '#00ffb3';
    ctx.globalAlpha = 1 - pulse.progress;
    ctx.fill();
    ctx.globalAlpha = 1;
    return true;
}

// ============================================================
// === CANVAS: CHARTS ===
// ============================================================

function drawCharts() {
    _drawBarCharts();
}

function _drawBarCharts() {
    var barFills = document.querySelectorAll('.bar-fill');
    barFills.forEach(function(bar) {
        var kpiKey = bar.getAttribute('data-kpi');
        if (!kpiKey || !KPI_CONFIG[kpiKey]) return;
        var kpi = KPI_CONFIG[kpiKey];
        var pct = kpi.unit === 'x'
            ? ((kpi.current - kpi.base) / (kpi.max - kpi.base)) * 100
            : (kpi.current / kpi.max) * 100;
        pct = Math.max(0, Math.min(100, pct));
        bar.style.width = pct.toFixed(1) + '%';
        _updateBarColor(bar, pct);
    });
}

function _updateBarColor(bar, pct) {
    if (globalState.overdrive) {
        bar.style.background = 'linear-gradient(90deg, #ff6b35, #ffcc00)';
    } else if (pct > 66) {
        bar.style.background = 'linear-gradient(90deg, #00c8ff, #00ffb3)';
    } else if (pct > 33) {
        bar.style.background = 'linear-gradient(90deg, #7b61ff, #00c8ff)';
    } else {
        bar.style.background = 'linear-gradient(90deg, #7b61ff, #a78bfa)';
    }
}

// ============================================================
// === UI CONTROLLER ===
// ============================================================

function bindModuleToggles() {
    Object.keys(globalState.modules).forEach(function(mod) {
        var toggle = document.getElementById('toggle-' + mod);
        if (!toggle) return;
        toggle.addEventListener('change', function() {
            globalState.modules[mod] = toggle.checked;
            _onModuleChange(mod, toggle.checked);
        });
    });
}

function _onModuleChange(mod, active) {
    calculateTargets();
    _updateModuleCardState(mod, active);
    _addLogEntry(mod, active);
    _updateStatusIndicator();
    _updateOverdriveButton();
}

function _updateModuleCardState(mod, active) {
    var card = document.getElementById('module-card-' + mod);
    if (!card) return;
    if (active) {
        card.classList.add('status-active');
    } else {
        card.classList.remove('status-active');
    }
    var dot = card.querySelector('.status-dot');
    if (dot) {
        dot.classList.toggle('status-active', active);
    }
}

function _addLogEntry(mod, active) {
    var logContainer = document.getElementById('activity-log');
    if (!logContainer) return;
    var entry = document.createElement('div');
    entry.className = 'log-entry';
    var time = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    var modLabel = mod.charAt(0).toUpperCase() + mod.slice(1);
    entry.innerHTML = '<span class="log-time">' + time + '</span> ' +
        '<span class="log-module">' + modLabel + '</span> ' +
        (active ? '<span class="log-action log-on">ACTIVADO</span>' : '<span class="log-action log-off">DESACTIVADO</span>');
    logContainer.insertBefore(entry, logContainer.firstChild);
    _trimLog(logContainer);
}

function _trimLog(logContainer) {
    var entries = logContainer.querySelectorAll('.log-entry:not(.log-entry-system)');
    if (entries.length > 20) {
        for (var i = 20; i < entries.length; i++) {
            entries[i].remove();
        }
    }
}

function _updateStatusIndicator() {
    var activeCount = Object.values(globalState.modules).filter(Boolean).length;
    var statusLabel = document.getElementById('status-label');
    var statusDot = document.querySelector('#status-indicator .status-dot');
    if (statusLabel) {
        if (globalState.overdrive) {
            statusLabel.textContent = 'OVERDRIVE ACTIVO';
        } else if (activeCount === 0) {
            statusLabel.textContent = 'Sistema en espera';
        } else if (activeCount < 3) {
            statusLabel.textContent = 'Parcialmente activo';
        } else if (activeCount < 5) {
            statusLabel.textContent = 'Alta integración';
        } else {
            statusLabel.textContent = 'Integración completa';
        }
    }
    if (statusDot) {
        statusDot.classList.toggle('status-active', activeCount > 0 || globalState.overdrive);
    }
}

function _updateOverdriveButton() {
    var btn = document.getElementById('btn-overdrive');
    if (!btn) return;
    var activeCount = Object.values(globalState.modules).filter(Boolean).length;
    btn.disabled = activeCount < 5;
    if (globalState.overdrive) {
        btn.classList.add('overdrive-active');
    } else {
        btn.classList.remove('overdrive-active');
    }
}

function bindOverdriveButton() {
    var btn = document.getElementById('btn-overdrive');
    if (!btn) return;
    btn.addEventListener('click', function() {
        var activeCount = Object.values(globalState.modules).filter(Boolean).length;
        if (activeCount < 5) return;
        globalState.overdrive = !globalState.overdrive;
        _onOverdriveChange();
    });
}

function _onOverdriveChange() {
    calculateTargets();
    _updateStatusIndicator();
    _updateOverdriveButton();
    _addOverdriveLogEntry();
    var appEl = document.getElementById('app');
    if (appEl) {
        appEl.classList.toggle('overdrive-mode', globalState.overdrive);
    }
}

function _addOverdriveLogEntry() {
    var logContainer = document.getElementById('activity-log');
    if (!logContainer) return;
    var entry = document.createElement('div');
    entry.className = 'log-entry log-entry-system';
    var time = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    entry.innerHTML = '<span class="log-time">' + time + '</span> ' +
        '<span class="log-module">SISTEMA</span> ' +
        (globalState.overdrive
            ? '<span class="log-action log-on">⚡ OVERDRIVE ACTIVADO — Máximo rendimiento</span>'
            : '<span class="log-action log-off">OVERDRIVE DESACTIVADO</span>');
    logContainer.insertBefore(entry, logContainer.firstChild);
}

// ============================================================
// === INIT ===
// ============================================================

function init() {
    var canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    _resizeCanvas(canvas);
    window.addEventListener('resize', function() { _resizeCanvas(canvas); });
    initParticles(canvas);
    bindModuleToggles();
    bindOverdriveButton();
    calculateTargets();
    _updateStatusIndicator();
    _updateOverdriveButton();
    _startAnimationLoop(canvas, ctx);
    _addSystemLogEntry('Sistema inicializado. Todos los módulos en espera.');
}

function _resizeCanvas(canvas) {
    var container = canvas.parentElement;
    if (!container) return;
    canvas.width = container.offsetWidth || window.innerWidth;
    canvas.height = container.offsetHeight || window.innerHeight;
}

function _startAnimationLoop(canvas, ctx) {
    function loop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawParticles(ctx, canvas);
        drawConnections(ctx);
        animateKPIs();
        drawCharts();
        globalState.animationFrameId = requestAnimationFrame(loop);
    }
    globalState.animationFrameId = requestAnimationFrame(loop);
}

function _addSystemLogEntry(message) {
    var logContainer = document.getElementById('activity-log');
    if (!logContainer) return;
    var entry = document.createElement('div');
    entry.className = 'log-entry log-entry-system';
    var time = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    entry.innerHTML = '<span class="log-time">' + time + '</span> ' +
        '<span class="log-module">SISTEMA</span> ' +
        '<span class="log-action">' + message + '</span>';
    logContainer.insertBefore(entry, logContainer.firstChild);
}

window.addEventListener('DOMContentLoaded', init);