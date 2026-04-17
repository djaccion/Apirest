const _DEFAULT_STATE = {
  teamSize:        5,
  avgSalary:       75000,
  automationLevel: 3,
  overdriveActive: false,
  aiAssistActive:  false,
  deepScanActive:  false,
};

const _state = { ..._DEFAULT_STATE };

const _clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export function getState() {
  return { ..._state };
}

export function setState(patch) {
  Object.keys(patch).forEach((key) => {
    if (!(key in _state)) return;

    if (key === 'teamSize') {
      _state[key] = _clamp(patch[key], 1, 50);
    } else if (key === 'avgSalary') {
      _state[key] = _clamp(patch[key], 30000, 200000);
    } else if (key === 'automationLevel') {
      _state[key] = _clamp(patch[key], 1, 10);
    } else {
      _state[key] = Boolean(patch[key]);
    }
  });
}

export function resetState() {
  Object.assign(_state, { ..._DEFAULT_STATE });
}

export function getToggleStates() {
  return {
    overdriveActive: _state.overdriveActive,
    aiAssistActive:  _state.aiAssistActive,
    deepScanActive:  _state.deepScanActive,
  };
}