import { MODULE_CONFIG } from '../config/moduleConfig.js';
import { getAppState } from '../state/appState.js';
import { polarToCartesian } from '../utils/mathHelpers.js';

const nodeElements = new Map();
const previousStates = {};
let previousOverdrive = false;

export function initNodeRing(containerElement) {
    MODULE_CONFIG.forEach((moduleConf) => {
        const nodeDiv = document.createElement('div');
        nodeDiv.classList.add('node-item');
        nodeDiv.setAttribute('data-module-id', moduleConf.id);
        nodeDiv.style.position = 'absolute';

        const iconEl = document.createElement('div');
        iconEl.classList.add('node-icon');

        if (moduleConf.icon && moduleConf.icon.startsWith('<svg')) {
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(moduleConf.icon, 'image/svg+xml');
            const svgEl = svgDoc.documentElement;
            iconEl.appendChild(svgEl);
        } else {
            iconEl.textContent = moduleConf.icon || '';
        }

        const labelEl = document.createElement('div');
        labelEl.classList.add('node-label');
        labelEl.textContent = moduleConf.label;

        const glowEl = document.createElement('div');
        glowEl.classList.add('node-glow');
        glowEl.style.setProperty('--node-color', moduleConf.color);
        glowEl.style.setProperty('--node-glow-color', moduleConf.glowColor);

        nodeDiv.appendChild(iconEl);
        nodeDiv.appendChild(labelEl);
        nodeDiv.appendChild(glowEl);

        nodeDiv.style.setProperty('--node-color', moduleConf.color);
        nodeDiv.style.setProperty('--node-glow-color', moduleConf.glowColor);

        containerElement.appendChild(nodeDiv);
        nodeElements.set(moduleConf.id, nodeDiv);

        previousStates[moduleConf.id] = false;
    });

    positionNodes();
}

export function positionNodes(viewportWidth, viewportHeight) {
    const vw = viewportWidth !== undefined ? viewportWidth : window.innerWidth;
    const vh = viewportHeight !== undefined ? viewportHeight : window.innerHeight;

    const centerX = vw / 2;
    const centerY = vh / 2;

    const minDimension = Math.min(vw, vh);
    let radius = minDimension * 0.32;
    if (radius < 160) radius = 160;
    if (radius > 280) radius = 280;

    MODULE_CONFIG.forEach((moduleConf) => {
        const nodeDiv = nodeElements.get(moduleConf.id);
        if (!nodeDiv) return;

        const angleRad = (moduleConf.baseAngle * Math.PI) / 180;
        const coords = polarToCartesian(centerX, centerY, radius, angleRad);

        nodeDiv.style.left = `${coords.x}px`;
        nodeDiv.style.top = `${coords.y}px`;
        nodeDiv.style.transform = 'translate(-50%, -50%)';
    });
}

export function updateNodeStates() {
    const state = getAppState();
    const currentOverdrive = state.overdrive || false;

    MODULE_CONFIG.forEach((moduleConf) => {
        const nodeDiv = nodeElements.get(moduleConf.id);
        if (!nodeDiv) return;

        const currentActive = state.modules ? (state.modules[moduleConf.id] || false) : false;
        const wasActive = previousStates[moduleConf.id];

        if (currentActive !== wasActive) {
            if (currentActive) {
                nodeDiv.classList.add('node-active');
                nodeDiv.classList.add('node-activating');
                setTimeout(() => {
                    nodeDiv.classList.remove('node-activating');
                }, 600);
            } else {
                nodeDiv.classList.remove('node-active');
                nodeDiv.classList.remove('node-overdrive');
            }
            previousStates[moduleConf.id] = currentActive;
        }

        if (currentOverdrive !== previousOverdrive) {
            if (currentOverdrive && currentActive) {
                nodeDiv.classList.add('node-overdrive');
            } else if (!currentOverdrive) {
                nodeDiv.classList.remove('node-overdrive');
            }
        } else if (currentOverdrive && currentActive && !nodeDiv.classList.contains('node-overdrive')) {
            nodeDiv.classList.add('node-overdrive');
        } else if (currentOverdrive && !currentActive) {
            nodeDiv.classList.remove('node-overdrive');
        }
    });

    previousOverdrive = currentOverdrive;
}

function getNodeElement(moduleId) {
    return nodeElements.get(moduleId) || null;
}

export function getNodeCenter(moduleId) {
    const el = getNodeElement(moduleId);
    if (!el) return null;

    const rect = el.getBoundingClientRect();
    return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
    };
}