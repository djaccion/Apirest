const MAX_PARTICLES = 120;

const particlePool = [];
let canvas = null;
let ctx = null;
let isOverdrive = false;

function resetParticle(particle) {
    particle.x = Math.random() * canvas.width;
    particle.y = Math.random() * canvas.height;
    particle.vx = (Math.random() - 0.5) * 0.6;
    particle.vy = (Math.random() - 0.5) * 0.6;
    particle.radius = 1 + Math.random() * 2;
    particle.alpha = 0.1 + Math.random() * 0.5;
    particle.alphaDecay = 0.001 + Math.random() * 0.003;

    let hue;
    if (isOverdrive) {
        hue = 160 + Math.random() * 40;
    } else {
        hue = 180 + Math.random() * 80;
    }

    particle.color = `hsl(${Math.round(hue)}, 70%, 60%)`;
    particle.alive = true;
}

function initParticleSystem(canvasElement) {
    canvas = canvasElement;
    ctx = canvas.getContext('2d');

    particlePool.length = 0;

    for (let i = 0; i < MAX_PARTICLES; i++) {
        const particle = {
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            radius: 1,
            alpha: 0,
            alphaDecay: 0,
            color: 'hsl(180, 70%, 60%)',
            alive: false
        };
        resetParticle(particle);
        particlePool.push(particle);
    }
}

function updateParticles() {
    for (let i = 0; i < particlePool.length; i++) {
        const p = particlePool[i];

        if (!p.alive) continue;

        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.alphaDecay;

        if (
            p.alpha < 0.01 ||
            p.x < -10 ||
            p.x > canvas.width + 10 ||
            p.y < -10 ||
            p.y > canvas.height + 10
        ) {
            p.alive = false;
            resetParticle(p);
        }
    }
}

function drawParticles() {
    ctx.shadowBlur = 6;

    for (let i = 0; i < particlePool.length; i++) {
        const p = particlePool[i];

        if (!p.alive) continue;

        const hslMatch = p.color.match(/hsl\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)/);
        let fillColor;
        if (hslMatch) {
            fillColor = `hsla(${hslMatch[1]}, ${hslMatch[2]}%, ${hslMatch[3]}%, ${p.alpha})`;
        } else {
            fillColor = `hsla(200, 70%, 60%, ${p.alpha})`;
        }

        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = fillColor;
        ctx.fill();
    }

    ctx.shadowBlur = 0;
}

function setOverdriveMode(active) {
    isOverdrive = active;

    if (active) {
        for (let i = 0; i < particlePool.length; i++) {
            const p = particlePool[i];
            if (p.alive) {
                const hue = 160 + Math.random() * 40;
                p.color = `hsl(${Math.round(hue)}, 70%, 60%)`;
            }
        }
    }
}

function resizeParticleCanvas(width, height) {
    canvas.width = width;
    canvas.height = height;

    for (let i = 0; i < particlePool.length; i++) {
        resetParticle(particlePool[i]);
    }
}

export {
    initParticleSystem,
    updateParticles,
    drawParticles,
    setOverdriveMode,
    resizeParticleCanvas
};