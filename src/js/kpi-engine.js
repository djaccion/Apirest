/**
 * @fileoverview KPI Engine - Motor de cálculo puro de métricas de negocio.
 * Transforma el estado global y KPI_CONFIG en métricas numéricas formateadas.
 * Sin efectos secundarios. Sin acceso al DOM. Sin dependencias externas.
 */

// =============================================================================
// SECCIÓN 1: CONFIGURACIÓN ESTÁTICA (NO EXPORTADA)
// =============================================================================

const KPI_CONFIG = {
  baseRevenue:          2_400_000,
  baseChurnRate:        0.045,
  baseNPS:              32,
  baseResolutionTime:   48,
  baseAgentUtilization: 0.71,
  baseTicketVolume:     1200,

  multipliers: {
    aiAssist: {
      revenue:        1.18,
      churn:          0.82,
      nps:            1.22,
      resolutionTime: 0.65
    },
    omnichannel: {
      revenue:          1.12,
      agentUtilization: 1.15,
      ticketVolume:     1.20
    },
    analytics: {
      revenue: 1.09,
      nps:     1.14,
      churn:   0.88
    },
    automation: {
      resolutionTime:   0.50,
      agentUtilization: 0.85,
      ticketVolume:     0.70
    },
    selfService: {
      ticketVolume:   0.60,
      resolutionTime: 0.75
    },
    overdrive: {
      revenue: 1.25,
      nps:     1.30
    }
  }
};

// =============================================================================
// SECCIÓN 2: FUNCIONES PRIVADAS (NO EXPORTADAS)
// =============================================================================

/**
 * Aplica una lista de multiplicadores a un valor base.
 * @param {number} baseValue - Valor base sobre el que se opera.
 * @param {number[]} multipliersList - Array de factores activos para este KPI.
 * @param {'multiply'|'add'} operation - Tipo de operación a aplicar.
 * @returns {number} Valor resultante tras aplicar todos los factores.
 */
function _applyMultipliers(baseValue, multipliersList, operation) {
  if (multipliersList.length === 0) {
    return baseValue;
  }

  if (operation === 'multiply') {
    return multipliersList.reduce((acc, factor) => acc * factor, baseValue);
  }

  if (operation === 'add') {
    return multipliersList.reduce((acc, factor) => acc + factor, baseValue);
  }

  return baseValue;
}

/**
 * Recopila los factores activos de KPI_CONFIG.multipliers según el estado actual.
 * @param {Object} state - Estado global de la aplicación (no se muta).
 * @param {string} kpiKey - Clave del KPI a buscar en cada bloque de multiplicadores.
 * @returns {number[]} Array de factores numéricos activos para el KPI dado.
 */
function _collectActiveMultipliers(state, kpiKey) {
  const activeFactors = [];

  for (const [featureKey, multiplierBlock] of Object.entries(KPI_CONFIG.multipliers)) {
    if (state[featureKey] === true && multiplierBlock[kpiKey] !== undefined) {
      activeFactors.push(multiplierBlock[kpiKey]);
    }
  }

  return activeFactors;
}

/**
 * Formatea un valor numérico como cadena de moneda abreviada.
 * @param {number} value - Valor monetario a formatear.
 * @returns {string} Cadena formateada (ej. "$3.8M", "$842.5k", "$320").
 */
function _formatCurrency(value) {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}k`;
  }
  return `$${Math.round(value)}`;
}

/**
 * Calcula y formatea el delta entre un valor actual y su base de referencia.
 * @param {number} currentValue - Valor calculado con los multiplicadores activos.
 * @param {number} baseValue - Valor base sin modificadores.
 * @param {string} unit - Unidad de medida para el texto del delta (ej. '%', 'h', 'pts').
 * @param {boolean} higherIsBetter - true si un valor mayor es favorable para el negocio.
 * @returns {{ text: string, positive: boolean|null }} Objeto con texto formateado e indicador de mejora.
 */
function _formatDelta(currentValue, baseValue, unit, higherIsBetter) {
  const delta = currentValue - baseValue;
  const deltaPercent = (delta / baseValue) * 100;

  if (delta === 0) {
    return { text: '—', positive: null };
  }

  const sign = delta > 0 ? '+' : '';
  const positive = higherIsBetter ? delta > 0 : delta < 0;

  let text;
  if (unit === '%') {
    text = `${sign}${deltaPercent.toFixed(1)}%`;
  } else {
    text = `${sign}${delta.toFixed(1)} ${unit}`;
  }

  return { text, positive };
}

// =============================================================================
// SECCIÓN 3: FUNCIONES EXPORTADAS — CÁLCULO DE KPIs
// =============================================================================

/**
 * Calcula el KPI de Revenue (Ingresos Anuales).
 * @param {Object} state - Estado global de la aplicación.
 * @returns {{ value: string, delta: { text: string, positive: boolean|null }, raw: number }}
 */
export function calculateRevenue(state) {
  const factors = _collectActiveMultipliers(state, 'revenue');
  const raw = _applyMultipliers(KPI_CONFIG.baseRevenue, factors, 'multiply');

  return {
    value: _formatCurrency(raw),
    delta: _formatDelta(raw, KPI_CONFIG.baseRevenue, '%', true),
    raw
  };
}

/**
 * Calcula el KPI de Churn Rate (Tasa de Abandono de Clientes).
 * Un valor menor es mejor para el negocio.
 * @param {Object} state - Estado global de la aplicación.
 * @returns {{ value: string, delta: { text: string, positive: boolean|null }, raw: number }}
 */
export function calculateChurnRate(state) {
  const factors = _collectActiveMultipliers(state, 'churn');
  const raw = _applyMultipliers(KPI_CONFIG.baseChurnRate, factors, 'multiply');
  const displayValue = `${(raw * 100).toFixed(2)}%`;

  return {
    value: displayValue,
    delta: _formatDelta(raw * 100, KPI_CONFIG.baseChurnRate * 100, '%', false),
    raw
  };
}

/**
 * Calcula el KPI de NPS (Net Promoter Score).
 * @param {Object} state - Estado global de la aplicación.
 * @returns {{ value: string, delta: { text: string, positive: boolean|null }, raw: number }}
 */
export function calculateNPS(state) {
  const factors = _collectActiveMultipliers(state, 'nps');
  const raw = _applyMultipliers(KPI_CONFIG.baseNPS, factors, 'multiply');
  const rounded = Math.round(raw);

  return {
    value: `${rounded}`,
    delta: _formatDelta(rounded, KPI_CONFIG.baseNPS, 'pts', true),
    raw: rounded
  };
}

/**
 * Calcula el KPI de Resolution Time (Tiempo Medio de Resolución de Tickets).
 * Un valor menor es mejor para el negocio.
 * @param {Object} state - Estado global de la aplicación.
 * @returns {{ value: string, delta: { text: string, positive: boolean|null }, raw: number }}
 */
export function calculateResolutionTime(state) {
  const factors = _collectActiveMultipliers(state, 'resolutionTime');
  const raw = _applyMultipliers(KPI_CONFIG.baseResolutionTime, factors, 'multiply');
  const rounded = Math.round(raw);

  return {
    value: `${rounded}h`,
    delta: _formatDelta(rounded, KPI_CONFIG.baseResolutionTime, 'h', false),
    raw: rounded
  };
}

/**
 * Calcula el KPI de Agent Utilization (Utilización de Agentes).
 * Un valor mayor indica mayor eficiencia operativa y es favorable para el negocio.
 * @param {Object} state - Estado global de la aplicación.
 * @returns {{ value: string, delta: { text: string, positive: boolean|null }, raw: number }}
 */
export function calculateAgentUtilization(state) {
  const factors = _collectActiveMultipliers(state, 'agentUtilization');
  const raw = _applyMultipliers(KPI_CONFIG.baseAgentUtilization, factors, 'multiply');
  const capped = Math.min(raw, 1.0);
  const displayValue = `${(capped * 100).toFixed(1)}%`;

  return {
    value: displayValue,
    delta: _formatDelta(capped * 100, KPI_CONFIG.baseAgentUtilization * 100, '%', true),
    raw: capped
  };
}

/**
 * Calcula el KPI de Ticket Volume (Volumen de Tickets Entrantes).
 * Un valor menor indica mayor deflexión y es favorable para el negocio.
 * @param {Object} state - Estado global de la aplicación.
 * @returns {{ value: string, delta: { text: string, positive: boolean|null }, raw: number }}
 */
export function calculateTicketVolume(state) {
  const factors = _collectActiveMultipliers(state, 'ticketVolume');
  const raw = _applyMultipliers(KPI_CONFIG.baseTicketVolume, factors, 'multiply');
  const rounded = Math.round(raw);

  return {
    value: `${rounded.toLocaleString('en-US')}`,
    delta: _formatDelta(rounded, KPI_CONFIG.baseTicketVolume, 'tickets', false),
    raw: rounded
  };
}

/**
 * Ejecuta todos los cálculos de KPI en una sola llamada.
 * Punto de entrada principal para el renderer.
 * @param {Object} state - Estado global de la aplicación.
 * @returns {{
 *   revenue:          ReturnType<typeof calculateRevenue>,
 *   churnRate:        ReturnType<typeof calculateChurnRate>,
 *   nps:              ReturnType<typeof calculateNPS>,
 *   resolutionTime:   ReturnType<typeof calculateResolutionTime>,
 *   agentUtilization: ReturnType<typeof calculateAgentUtilization>,
 *   ticketVolume:     ReturnType<typeof calculateTicketVolume>
 * }}
 */
export function computeAllKPIs(state) {
  return {
    revenue:          calculateRevenue(state),
    churnRate:        calculateChurnRate(state),
    nps:              calculateNPS(state),
    resolutionTime:   calculateResolutionTime(state),
    agentUtilization: calculateAgentUtilization(state),
    ticketVolume:     calculateTicketVolume(state)
  };
}