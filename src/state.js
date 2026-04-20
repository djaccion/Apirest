const _state = {
  activeNodes: ['gitlab', 'ci', 'xray', 'datadog', 'rovo'],
  isOverdriveActive: false,
  overdriveMultiplier: 1,
  particleCapMax: 120,
  isTabVisible: true
};

const _KPI_CONFIG = {
  deployFrequency: {
    label: 'Deploy Frequency',
    baseValue: 4,
    unit: 'deploys/day',
    nodeWeights: {
      gitlab: 0.35,
      ci: 0.40,
      xray: 0.10,
      datadog: 0.10,
      rovo: 0.05
    },
    overdriveBonus: 2.5
  },
  leadTime: {
    label: 'Lead Time for Changes',
    baseValue: 48,
    unit: 'hours',
    nodeWeights: {
      gitlab: 0.20,
      ci: 0.30,
      xray: 0.25,
      datadog: 0.10,
      rovo: 0.15
    },
    overdriveBonus: 0.4
  },
  changeFailureRate: {
    label: 'Change Failure Rate',
    baseValue: 15,
    unit: '%',
    nodeWeights: {
      gitlab: 0.10,
      ci: 0.20,
      xray: 0.45,
      datadog: 0.20,
      rovo: 0.05
    },
    overdriveBonus: 0.3
  },
  mttr: {
    label: 'MTTR',
    baseValue: 120,
    unit: 'minutes',
    nodeWeights: {
      gitlab: 0.05,
      ci: 0.10,
      xray: 0.20,
      datadog: 0.50,
      rovo: 0.15
    },
    overdriveBonus: 0.35
  },
  roiIndex: {
    label: 'ROI Index',
    baseValue: 1.0,
    unit: 'x',
    nodeWeights: {
      gitlab: 0.20,
      ci: 0.20,
      xray: 0.20,
      datadog: 0.20,
      rovo: 0.20
    },
    overdriveBonus: 3.2
  }
};

export function getActiveNodes() {
  return [..._state.activeNodes];
}

export function isOverdriveActive() {
  return _state.isOverdriveActive;
}

export function getOverdriveMultiplier() {
  return _state.overdriveMultiplier;
}

export function getParticleCap() {
  return _state.particleCapMax;
}

export function isTabVisible() {
  return _state.isTabVisible;
}

export function toggleNode(nodeId) {
  const index = _state.activeNodes.indexOf(nodeId);
  if (index === -1) {
    _state.activeNodes.push(nodeId);
  } else {
    _state.activeNodes.splice(index, 1);
  }
}

export function setOverdrive(isActive) {
  _state.isOverdriveActive = Boolean(isActive);
  _state.overdriveMultiplier = _state.isOverdriveActive ? 2 : 1;
}

export function setParticleCap(value) {
  _state.particleCapMax = value;
}

export function setTabVisible(isVisible) {
  _state.isTabVisible = Boolean(isVisible);
}

export function getKpiConfig() {
  return JSON.parse(JSON.stringify(_KPI_CONFIG));
}

export function getKpiConfigEntry(kpiKey) {
  if (!Object.prototype.hasOwnProperty.call(_KPI_CONFIG, kpiKey)) {
    return null;
  }
  return JSON.parse(JSON.stringify(_KPI_CONFIG[kpiKey]));
}

export function getKpiKeys() {
  return Object.keys(_KPI_CONFIG);
}