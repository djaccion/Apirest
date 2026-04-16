src/canvas/connectionRenderer.js

```javascript
import { AppState } from '../state/appState.js';
import { MODULE_CONFIG } from '../config/moduleConfig.js';
import { lerp } from '../utils/mathHelpers.js';

// ─────────────────────────────────────────────
// 1. POOL DE PULSOS DE DATOS
// ─────────────────────────────────────────────

const MAX_PULSES = 50;

const pulsePool = Array.from({ length: MAX_PULSES }, () => ({
    active: false,
    nodeIndex: 0,
    t: 0,
    speed: 0,
    color: '#ffffff',
    size: 3,
    opacity: 1.0
}));

function acquirePulse() {
    for (let i = 0; i < pulsePool.length; i++) {
        if (!pulsePool[i].active) {
            pulsePool[i].active = true;
            return pulsePool[i];
        }
    }
    return null;
}

function releasePulse(pulse) {
    pulse.active = false;
}

// ─────────────────────────────────────────────
// 2. GENERADOR DE PULSOS
// ─────────────────────────────────────────────

const pulseTimers = {
    0: 0,
    1: 0,
    2: 0,
    3: 0,
    4: 0
};

function spawnPulses(timestamp, nodePositions, corePosition) {
    const isOverdrive = AppState.overdrive;
    const spawnInterval = isOverdrive ? 400 : 1200;
    const baseSpeed = isOverdrive ? 0.018 : 0.008;

    for (let i = 0; i < 5; i++) {
        const moduleKey = MODULE_CONFIG[i].key;
        const isActive = AppState.modules[moduleKey];

        if (!isActive) continue;

        const lastSpawn = pulseTimers[i];
        if (timestamp - lastSpawn < spawnInterval) continue;

        const pulse = acquirePulse();
        if (!pulse) continue;

        pulse.nodeIndex = i;
        pulse.t = 0;
        pulse.speed = baseSpeed + (Math.random() * 0.004 - 0.002);
        pulse.color = MODULE_CONFIG[i].color;
        pulse.size = 3 + Math.random() * 2;
        pulse.opacity = 1.0;

        pulseTimers[i] = timestamp;
    }
}

// ─────────────────────────────────────────────
// 3. ACTUALIZADOR DE PULSOS
// ─────────────────────────────────────────────

function updatePulses(deltaTime) {
    for (let i = 0; i < pulsePool.length; i++) {
        const pulse = pulsePool[i];
        if (!pulse.active) continue;

        pulse.t += pulse.speed;

        if (pulse.t > 1.0) {
            releasePulse(pulse);
            continue;
        }

        if (pulse.t > 0.8) {
            const fadeProgress = (pulse.t - 0.8) / 0.2;
            pulse.opacity = 1.0 - fadeProgress;
        } else {
            pulse.opacity = 1.0;
        }
    }
}

// ─────────────────────────────────────────────
// 4. CALCULADOR DE PUNTOS DE CONTROL BEZIER
// ─────────────────────────────────────────────

function getControlPoints(nodePos, corePos, nodeIndex) {
    const dx = corePos.x - nodePos.x;
    const dy = corePos.y - nodePos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const perpMagnitude = distance * 0.35;
    const normX = dx / distance;
    const normY = dy / distance;

    const perpX = -normY;
    const perpY = normX;

    const sign = nodeIndex % 2 === 0 ? 1 : -1;

    const cp1 = {
        x: nodePos.x + dx * 0.4 + perpX * perpMagnitude * sign,
        y: nodePos.y + dy * 0.4 + perpY * perpMagnitude * sign
    };

    const cp2 = {
        x: corePos.x - normX * distance * 0.25,
        y: corePos.y - normY * distance * 0.25
    };

    return { cp1, cp2 };
}

// ─────────────────────────────────────────────
// 5. EVALUADOR DE PUNTO SOBRE BEZIER
// ─────────────────────────────────────────────

function getBezierPoint(p0, p1, p2, p3, t) {
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    const t2 = t * t;
    const t3 = t2 * t;

    return {
        x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
        y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y
    };
}

// ─────────────────────────────────────────────
// 6. RENDERER DE CONEXIONES ESTÁTICAS
// ─────────────────────────────────────────────

function drawConnections(ctx, nodePositions, corePosition) {
    const isOverdrive = AppState.overdrive;

    for (let i = 0; i < 5; i++) {
        const nodePos = nodePositions[i];
        const moduleKey = MODULE_CONFIG[i].key;
        const isActive = AppState.modules[moduleKey];
        const color = MODULE_CONFIG[i].color;
        const { cp1, cp2 } = getControlPoints(nodePos, corePosition, i);

        if (!isActive) {
            ctx.beginPath();
            ctx.moveTo(nodePos.x, nodePos.y);
            ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, corePosition.x, corePosition.y);
            ctx.strokeStyle = '#1a1a2e';
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.3;
            ctx.shadowBlur = 0;
            ctx.stroke();
            ctx.globalAlpha = 1.0;
        } else {
            // Primera pasada: glow difuso
            ctx.beginPath();
            ctx.moveTo(nodePos.x, nodePos.y);
            ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, corePosition.x, corePosition.y);
            ctx.strokeStyle = color;
            ctx.lineWidth = 6;
            ctx.globalAlpha = 0.2;
            ctx.shadowBlur = 0;
            ctx.stroke();

            // Segunda pasada: línea principal
            ctx.beginPath();
            ctx.moveTo(nodePos.x, nodePos.y);
            ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, corePosition.x, corePosition.y);
            ctx.strokeStyle = color;
            ctx.lineWidth = isOverdrive ? 2.5 : 1.5;
            ctx.globalAlpha = 0.8;
            ctx.shadowBlur = isOverdrive ? 20 : 8;
            ctx.shadowColor = color;
            ctx.stroke();

            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1.0;
        }
    }
}

// ─────────────────────────────────────────────
// 7. RENDERER DE PULSOS
// ─────────────────────────────────────────────

function drawPulses(ctx, nodePositions, corePosition) {
    const isOverdrive = AppState.overdrive;

    for (let i = 0; i < pulsePool.length; i++) {
        const pulse = pulsePool[i];
        if (!pulse.active) continue;

        const nodePos = nodePositions[pulse.nodeIndex];
        const { cp1, cp2 } = getControlPoints(nodePos, corePosition, pulse.nodeIndex);

        const point = getBezierPoint(nodePos, cp1, cp2, corePosition, pulse.t);

        const glowSize = isOverdrive ? pulse.size * 2.5 : pulse.size * 1.8;

        // Glow exterior
        const glowGradient = ctx.createRadialGradient(
            point.x, point.y, 0,
            point.x, point.y, glowSize
        );
        glowGradient.addColorStop(0, pulse.color);
        glowGradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(point.x, point.y, glowSize, 0, Math.PI * 2);
        ctx.fillStyle = glowGradient;
        ctx.globalAlpha = pulse.opacity * 0.4;
        ctx.fill();

        // Núcleo del pulso
        ctx.beginPath();
        ctx.arc(point.x, point.y, pulse.size, 0, Math.PI * 2);
        ctx.fillStyle = pulse.color;
        ctx.globalAlpha = pulse.opacity;

        if (isOverdrive) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = pulse.color;
        }

        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;
    }
}

// ─────────────────────────────────────────────
// FUNCIÓN PRINCIPAL DE RENDER
// ─────────────────────────────────────────────

export function renderConnections(ctx, nodePositions, corePosition, timestamp, deltaTime) {
    spawnPulses(timestamp, nodePositions, corePosition);
    updatePulses(deltaTime);
    drawConnections(ctx, nodePositions, corePosition);
    drawPulses(ctx, nodePositions, corePosition);
}

export { getBezierPoint, getControlPoints };