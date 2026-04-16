import { AppState, initState, toggleModule } from './state/appState.js';
import { KPI_CONFIG } from './config/kpiConfig.js';
import { MODULE_CONFIG } from './config/moduleConfig.js';
import { initParticleSystem, updateParticles } from './canvas/particleSystem.js';
import { initConnectionRenderer, renderConnections, updateConnectionPositions } from './canvas/connectionRenderer.js';
import { initCoreRenderer, renderCore } from './canvas/coreRenderer.js';
import { initKpiPanel, updateKpiPanel } from './ui/kpiPanel.js';
import { initSpeedometer, renderSpeedometer } from './ui/speedometer.js';
import { initRadarChart, renderRadarChart } from './ui/radarChart.js';
import { initNodeRing, renderNodeRing, updateNodeRingPositions } from './ui/nodeRing.js';
import { initOverdriveOverlay, updateOverdriveOverlay } from './ui/overdriveOverlay.js';
import { initDoraBar, updateDoraBar } from './ui/doraBar.js';
import { animateValue } from './utils/animation.js';
import { calculateNodePositions } from './utils/mathHelpers.js';

let animationFrameId = null;
let lastTimestamp = 0;
let isVisible = true;
let nodePositions = [];

let particleCanvas = null;
let connectionCanvas = null;
let dashboardContainer = null;

function initApp() {
    particleCanvas = document.getElementById('particleCanvas');
    connectionCanvas = document.getElementById('connectionCanvas');
    dashboardContainer = document.getElementById('dashboard');

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const centerX = viewportWidth / 2;
    const centerY = viewportHeight / 2;

    nodePositions = calculateNodePositions(viewportWidth, viewportHeight, MODULE_CONFIG);

    initState(KPI_CONFIG);

    initParticleSystem(particleCanvas, MODULE_CONFIG.particleConfig);
    initConnectionRenderer(connectionCanvas, nodePositions, { x: centerX, y: centerY });
    initCoreRenderer(connectionCanvas, { x: centerX, y: centerY });

    initKpiPanel(KPI_CONFIG);
    initSpeedometer();
    initRadarChart();
    initNodeRing(nodePositions, MODULE_CONFIG);
    initOverdriveOverlay();
    initDoraBar(KPI_CONFIG);

    const moduleNodes = document.querySelectorAll('.module-node');
    moduleNodes.forEach((node, index) => {
        node.addEventListener('click', () => {
            toggleModule(index);
            updateKpiPanel(AppState);
            updateDoraBar(AppState);
        });
    });

    let resizeTimer = null;
    window.addEventListener('resize', () => {
        if (resizeTimer) {
            clearTimeout(resizeTimer);
        }
        resizeTimer = setTimeout(() => {
            const newWidth = window.innerWidth;
            const newHeight = window.innerHeight;
            const newCenterX = newWidth / 2;
            const newCenterY = newHeight / 2;

            nodePositions = calculateNodePositions(newWidth, newHeight, MODULE_CONFIG);
            updateConnectionPositions(nodePositions, { x: newCenterX, y: newCenterY });
            updateNodeRingPositions(nodePositions);
        }, 150);
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.intersectionRatio > 0.1) {
                isVisible = true;
                if (animationFrameId === null) {
                    startLoop();
                }
            } else {
                isVisible = false;
                if (animationFrameId !== null) {
                    cancelAnimationFrame(animationFrameId);
                    animationFrameId = null;
                }
            }
        });
    }, { threshold: [0.1] });

    observer.observe(dashboardContainer);

    startLoop();
}

function startLoop() {
    animationFrameId = requestAnimationFrame(masterLoop);
}

function masterLoop(timestamp) {
    let deltaTime = timestamp - lastTimestamp;
    lastTimestamp = timestamp;
    if (deltaTime > 50) {
        deltaTime = 50;
    }

    const currentState = AppState;

    const pWidth = particleCanvas.width;
    const pHeight = particleCanvas.height;
    const cWidth = connectionCanvas.width;
    const cHeight = connectionCanvas.height;

    const pCtx = particleCanvas.getContext('2d');
    const cCtx = connectionCanvas.getContext('2d');

    pCtx.clearRect(0, 0, pWidth, pHeight);
    cCtx.clearRect(0, 0, cWidth, cHeight);

    updateParticles(deltaTime, currentState);
    renderConnections(deltaTime, currentState);
    renderCore(deltaTime, currentState);
    renderNodeRing(currentState);
    renderSpeedometer(currentState);
    renderRadarChart(currentState);
    updateOverdriveOverlay(currentState);

    animationFrameId = requestAnimationFrame(masterLoop);
}

document.addEventListener('DOMContentLoaded', initApp);