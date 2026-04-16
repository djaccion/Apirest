export const BASE_ORBIT_RADIUS = 220;
export const NODE_BASE_SIZE = 36;
export const TOTAL_NODES = 5;
export const ANGLE_STEP = 72;
export const START_ANGLE = 270;

export const MODULE_CONFIG = [
    {
        id: 'confluence',
        label: 'Confluence',
        shortLabel: 'CON',
        angleOffset: 270,
        orbitRadius: BASE_ORBIT_RADIUS,
        color: '#1868DB',
        colorRGB: '24,104,219',
        glowIntensity: 0.8,
        icon: '📘',
        nodeSize: 32,
        pulseSpeed: 0.018,
        connectionWidth: 2,
        cssClass: 'node-confluence',
        activationSound: 'tone-mid',
        kpiBoostKeys: ['docCoverage', 'teamVelocity', 'knowledgeTransfer', 'onboardingTime']
    },
    {
        id: 'github',
        label: 'GitHub',
        shortLabel: 'GIT',
        angleOffset: 342,
        orbitRadius: BASE_ORBIT_RADIUS,
        color: '#F0F6FF',
        colorRGB: '240,246,255',
        glowIntensity: 0.5,
        icon: '🐙',
        nodeSize: NODE_BASE_SIZE,
        pulseSpeed: 0.025,
        connectionWidth: 2,
        cssClass: 'node-github',
        activationSound: 'tone-high',
        kpiBoostKeys: ['deployFrequency', 'leadTime', 'changeFailureRate', 'prCycleTime']
    },
    {
        id: 'slack',
        label: 'Slack',
        shortLabel: 'SLK',
        angleOffset: 54,
        orbitRadius: BASE_ORBIT_RADIUS,
        color: '#E01E5A',
        colorRGB: '224,30,90',
        glowIntensity: 0.9,
        icon: '💬',
        nodeSize: NODE_BASE_SIZE,
        pulseSpeed: 0.032,
        connectionWidth: 2,
        cssClass: 'node-slack',
        activationSound: 'tone-high',
        kpiBoostKeys: ['teamVelocity', 'incidentResponse', 'collaborationScore', 'blockerResolution']
    },
    {
        id: 'datadog',
        label: 'Datadog',
        shortLabel: 'DDG',
        angleOffset: 126,
        orbitRadius: BASE_ORBIT_RADIUS,
        color: '#774AA4',
        colorRGB: '119,74,164',
        glowIntensity: 0.85,
        icon: '🐶',
        nodeSize: NODE_BASE_SIZE,
        pulseSpeed: 0.021,
        connectionWidth: 2,
        cssClass: 'node-datadog',
        activationSound: 'tone-low',
        kpiBoostKeys: ['mttr', 'incidentResponse', 'systemUptime', 'changeFailureRate']
    },
    {
        id: 'figma',
        label: 'Figma',
        shortLabel: 'FIG',
        angleOffset: 198,
        orbitRadius: BASE_ORBIT_RADIUS,
        color: '#A259FF',
        colorRGB: '162,89,255',
        glowIntensity: 0.75,
        icon: '🎨',
        nodeSize: NODE_BASE_SIZE,
        pulseSpeed: 0.015,
        connectionWidth: 2,
        cssClass: 'node-figma',
        activationSound: 'tone-mid',
        kpiBoostKeys: ['designHandoff', 'iterationSpeed', 'teamVelocity', 'userSatisfaction']
    }
];