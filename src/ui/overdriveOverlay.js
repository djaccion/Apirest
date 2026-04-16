src/ui/overdriveOverlay.js

```javascript
import { animateValue, easeOutCubic } from '../utils/animation.js';

// ─── Constantes de color Overdrive ───────────────────────────────────────────
const OD_ACCENT_PRIMARY   = '#00f5ff';
const OD_GLOW_INTENSITY   = '3';
const OD_BORDER_COLOR     = 'rgba(0, 245, 255, 0.4)';
const OD_TEXT_GLOW        = '0 0 8px #00f5ff, 0 0 16px #00f5ff, 0 0 32px #00f5ff';

// ─── Constantes baseline (valores de reposo) ──────────────────────────────────
const BASE_ACCENT_PRIMARY = '#7c3aed';
const BASE_GLOW_INTENSITY = '1';
const BASE_BORDER_COLOR   = 'rgba(124, 58, 237, 0.3)';
const BASE_TEXT_GLOW      = '0 0 4px rgba(124, 58, 237, 0.6)';

const OVERDRIVE_REST_OPACITY = 0.1;
const PARTICLE_COUNT         = 40;
const CYAN_NEON              = '#00f5ff';

// ─── Estado privado del módulo ────────────────────────────────────────────────
let overlayEl        = null;
let scanCanvas       = null;
let scanCtx          = null;
let rafId            = null;
let energyParticles  = [];
let resizeObserver   = null;
let currentOpacity   = 0;

// ─── Helpers internos ─────────────────────────────────────────────────────────

function createEnergyParticle() {
    const side = Math.floor(Math.random() * 4);
    const w    = window.innerWidth;
    const h    = window.innerHeight;
    const cx   = w / 2;
    const cy   = h / 2;

    let x, y;
    switch (side) {
        case 0: x = Math.random() * w; y = 0;          break; // top
        case 1: x = Math.random() * w; y = h;          break; // bottom
        case 2: x = 0;                 y = Math.random() * h; break; // left
        default: x = w;               y = Math.random() * h; break; // right
    }

    const baseAngle    = Math.atan2(cy - y, cx - x);
    const angleOffset  = (Math.random() * 30 - 15) * (Math.PI / 180);
    const angle        = baseAngle + angleOffset;
    const speed        = 1.5 + Math.random() * 2.5;

    return {
        x,
        y,
        vx:      Math.cos(angle) * speed,
        vy:      Math.sin(angle) * speed,
        opacity: 0.6 + Math.random() * 0.4,
        size:    1 + Math.random() * 2,
        color:   CYAN_NEON,
        life:    60 + Math.floor(Math.random() * 61),
        maxLife: 0,
    };
}

function populateParticles() {
    energyParticles.length = 0;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p  = createEnergyParticle();
        p.maxLife = p.life;
        energyParticles.push(p);
    }
}

function setScanCanvasSize() {
    if (!scanCanvas || !overlayEl) return;
    scanCanvas.width  = overlayEl.offsetWidth  || window.innerWidth;
    scanCanvas.height = overlayEl.offsetHeight || window.innerHeight;
}

function setOverlayOpacity(value) {
    currentOpacity = value;
    if (overlayEl) overlayEl.style.opacity = String(value);
}

function transitionProperty(prop, fromValue, toValue, durationMs) {
    // Para propiedades CSS que son strings/colores usamos una interpolación
    // temporal basada en animateValue con un proxy numérico 0→1
    animateValue(
        0,
        1,
        durationMs,
        (t) => {
            // Interpolación lineal simple para el progreso
            // Para valores de color/string simplemente hacemos el swap al 50%
            if (t >= 0.5) {
                document.documentElement.style.setProperty(prop, toValue);
            }
        },
        easeOutCubic
    );
}

// ─── Loop de animación interno ────────────────────────────────────────────────

function renderOverdriveFrame(timestamp) {
    if (!scanCtx || !scanCanvas) {
        rafId = requestAnimationFrame(renderOverdriveFrame);
        return;
    }

    const w = scanCanvas.width;
    const h = scanCanvas.height;

    // 1. Limpiar canvas
    scanCtx.clearRect(0, 0, w, h);

    // 2. Scanlines horizontales
    const scanOffset = (timestamp * 0.02) % 4;
    scanCtx.save();
    scanCtx.strokeStyle = `rgba(0, 245, 255, 0.03)`;
    scanCtx.lineWidth   = 1;
    for (let y = -4 + scanOffset; y < h; y += 4) {
        scanCtx.beginPath();
        scanCtx.moveTo(0, y);
        scanCtx.lineTo(w, y);
        scanCtx.stroke();
    }
    scanCtx.restore();

    // 3. Ruido visual (noise grain)
    const noiseCount = Math.floor(w * h * 0.0008);
    scanCtx.save();
    for (let i = 0; i < noiseCount; i++) {
        const nx      = Math.random() * w;
        const ny      = Math.random() * h;
        const alpha   = Math.random() * 0.08;
        const nsize   = Math.random() < 0.8 ? 1 : 2;
        scanCtx.fillStyle = `rgba(0, 245, 255, ${alpha})`;
        scanCtx.fillRect(nx, ny, nsize, nsize);
    }
    scanCtx.restore();

    // 4. Partículas de energía
    scanCtx.save();
    for (let i = energyParticles.length - 1; i >= 0; i--) {
        const p = energyParticles[i];

        p.x    += p.vx;
        p.y    += p.vy;
        p.life -= 1;

        const lifeRatio = p.life / p.maxLife;
        const alpha     = p.opacity * lifeRatio;

        scanCtx.globalAlpha = alpha;
        scanCtx.fillStyle   = p.color;
        scanCtx.shadowColor = p.color;
        scanCtx.shadowBlur  = 6;
        scanCtx.beginPath();
        scanCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        scanCtx.fill();

        if (p.life <= 0) {
            const replacement  = createEnergyParticle();
            replacement.maxLife = replacement.life;
            energyParticles[i]  = replacement;
        }
    }
    scanCtx.restore();

    // 5. Vignette sutil cyan en los bordes
    const gradient = scanCtx.createRadialGradient(
        w / 2, h / 2, Math.min(w, h) * 0.3,
        w / 2, h / 2, Math.max(w, h) * 0.75
    );
    gradient.addColorStop(0, 'rgba(0, 245, 255, 0)');
    gradient.addColorStop(1, 'rgba(0, 245, 255, 0.06)');
    scanCtx.save();
    scanCtx.fillStyle = gradient;
    scanCtx.fillRect(0, 0, w, h);
    scanCtx.restore();

    rafId = requestAnimationFrame(renderOverdriveFrame);
}

// ─── API pública ──────────────────────────────────────────────────────────────

export function initOverdriveOverlay() {
    overlayEl = document.getElementById('overdrive-overlay');
    if (!overlayEl) {
        console.warn('[overdriveOverlay] Elemento #overdrive-overlay no encontrado.');
        return;
    }

    // Asegurar estilos base del overlay
    overlayEl.style.opacity       = '0';
    overlayEl.style.pointerEvents = 'none';

    // Crear canvas interno para scanlines y ruido
    scanCanvas        = document.createElement('canvas');
    scanCanvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;display:block;';
    overlayEl.appendChild(scanCanvas);
    scanCtx = scanCanvas.getContext('2d');

    setScanCanvasSize();

    // ResizeObserver para actualizar dimensiones del canvas interno
    resizeObserver = new ResizeObserver(() => {
        setScanCanvasSize();
    });
    resizeObserver.observe(overlayEl);

    // Inicializar array de partículas vacío
    energyParticles = [];
}

export function activateOverdrive() {
    if (!overlayEl) return;

    // Paso 1: Clase CSS
    overlayEl.classList.add('overdrive-active');

    // Paso 2: CSS Custom Properties → tema neón cyan
    document.documentElement.style.setProperty('--accent-primary', OD_ACCENT_PRIMARY);
    document.documentElement.style.setProperty('--glow-intensity',  OD_GLOW_INTENSITY);
    document.documentElement.style.setProperty('--border-color',    OD_BORDER_COLOR);
    document.documentElement.style.setProperty('--text-glow',       OD_TEXT_GLOW);

    // Paso 3: Iniciar loop interno
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(renderOverdriveFrame);

    // Paso 4: Poblar partículas
    populateParticles();

    // Paso 5: Flash inicial 0 → 0.4 → 0.1 en 300ms
    setOverlayOpacity(0);
    animateValue(
        0,
        0.4,
        150,
        (v) => setOverlayOpacity(v),
        easeOutCubic,
        () => {
            animateValue(
                0.4,
                OVERDRIVE_REST_OPACITY,
                150,
                (v) => setOverlayOpacity(v),
                easeOutCubic
            );
        }
    );
}

export function deactivateOverdrive() {
    // Paso 1: Cancelar loop interno
    if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
    }

    // Paso 2: Vaciar partículas
    energyParticles.length = 0;

    // Paso 3: Remover clase CSS
    if (overlayEl) overlayEl.classList.remove('overdrive-active');

    // Paso 4: Revertir CSS Custom Properties con transición suave
    transitionProperty('--accent-primary', OD_ACCENT_PRIMARY, BASE_ACCENT_PRIMARY, 600);
    transitionProperty('--glow-intensity',  OD_GLOW_INTENSITY,  BASE_GLOW_INTENSITY,  600);
    transitionProperty('--border-color',    OD_BORDER_COLOR,    BASE_BORDER_COLOR,    600);
    transitionProperty('--text-glow',       OD_TEXT_GLOW,       BASE_TEXT_GLOW,       600);

    // Paso 5: Animar opacidad del overlay a 0 en 500ms
    const fromOpacity = currentOpacity;
    animateValue(
        fromOpacity,
        0,
        500,
        (v) => setOverlayOpacity(v),
        easeOutCubic,
        () => {
            // Limpiar canvas interno al finalizar
            if (scanCtx && scanCanvas) {
                scanCtx.clearRect(0, 0, scanCanvas.width, scanCanvas.height);
            }
        }
    );
}