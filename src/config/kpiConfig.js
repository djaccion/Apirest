export const KPI_CONFIG = {
  DEPLOYMENT_FREQUENCY: {
    id: 'DEPLOYMENT_FREQUENCY',
    label: 'Frecuencia de Despliegue',
    unit: 'deploys/día',
    description: 'Número de despliegues a producción realizados por día.',
    baseValue: 0.8,
    maxValue: 10,
    currentValue: 0.8,
    decimals: 1,
    higherIsBetter: true,
    boosts: {
      jira: 2.2,
      confluence: 0.5,
      bitbucket: 1.0,
      jenkins: 3.5,
      sonarqube: 0.8
    },
    domRefs: {
      valueDisplay: 'kpi-deployment-frequency-value',
      progressBar: 'kpi-deployment-frequency-bar',
      widgetContainer: 'kpi-deployment-frequency-widget'
    }
  },

  LEAD_TIME: {
    id: 'LEAD_TIME',
    label: 'Lead Time',
    unit: 'horas',
    description: 'Tiempo transcurrido desde el commit hasta el despliegue en producción.',
    baseValue: 168,
    maxValue: 168,
    currentValue: 168,
    decimals: 1,
    higherIsBetter: false,
    boosts: {
      jira: -18,
      confluence: -8,
      bitbucket: -35,
      jenkins: -55,
      sonarqube: -12
    },
    domRefs: {
      valueDisplay: 'kpi-lead-time-value',
      progressBar: 'kpi-lead-time-bar',
      widgetContainer: 'kpi-lead-time-widget'
    }
  },

  MTTR: {
    id: 'MTTR',
    label: 'MTTR',
    unit: 'min',
    description: 'Tiempo medio de recuperación ante incidentes en producción.',
    baseValue: 480,
    maxValue: 480,
    currentValue: 480,
    decimals: 0,
    higherIsBetter: false,
    boosts: {
      jira: -110,
      confluence: -30,
      bitbucket: -40,
      jenkins: -120,
      sonarqube: -55
    },
    domRefs: {
      valueDisplay: 'kpi-mttr-value',
      progressBar: 'kpi-mttr-bar',
      widgetContainer: 'kpi-mttr-widget'
    }
  },

  CHANGE_FAILURE_RATE: {
    id: 'CHANGE_FAILURE_RATE',
    label: 'Tasa de Fallos',
    unit: '%',
    description: 'Porcentaje de cambios desplegados que causan fallos en producción.',
    baseValue: 45,
    maxValue: 45,
    currentValue: 45,
    decimals: 1,
    higherIsBetter: false,
    boosts: {
      jira: -5,
      confluence: -3,
      bitbucket: -7,
      jenkins: -12,
      sonarqube: -15
    },
    domRefs: {
      valueDisplay: 'kpi-change-failure-rate-value',
      progressBar: 'kpi-change-failure-rate-bar',
      widgetContainer: 'kpi-change-failure-rate-widget'
    }
  },

  CODE_QUALITY: {
    id: 'CODE_QUALITY',
    label: 'Calidad de Código',
    unit: '',
    description: 'Índice compuesto de calidad del código fuente de 0 a 100.',
    baseValue: 30,
    maxValue: 100,
    currentValue: 30,
    decimals: 0,
    higherIsBetter: true,
    boosts: {
      jira: 4,
      confluence: 5,
      bitbucket: 8,
      jenkins: 10,
      sonarqube: 35
    },
    domRefs: {
      valueDisplay: 'kpi-code-quality-value',
      progressBar: 'kpi-code-quality-bar',
      widgetContainer: 'kpi-code-quality-widget'
    }
  },

  TEAM_VELOCITY: {
    id: 'TEAM_VELOCITY',
    label: 'Velocidad del Equipo',
    unit: 'SP/sprint',
    description: 'Story points completados por el equipo en cada sprint.',
    baseValue: 20,
    maxValue: 120,
    currentValue: 20,
    decimals: 0,
    higherIsBetter: true,
    boosts: {
      jira: 28,
      confluence: 22,
      bitbucket: 8,
      jenkins: 10,
      sonarqube: 6
    },
    domRefs: {
      valueDisplay: 'kpi-team-velocity-value',
      progressBar: 'kpi-team-velocity-bar',
      widgetContainer: 'kpi-team-velocity-widget'
    }
  },

  DOCUMENTATION_COVERAGE: {
    id: 'DOCUMENTATION_COVERAGE',
    label: 'Cobertura de Documentación',
    unit: '%',
    description: 'Porcentaje del código y procesos cubiertos por documentación actualizada.',
    baseValue: 10,
    maxValue: 100,
    currentValue: 10,
    decimals: 0,
    higherIsBetter: true,
    boosts: {
      jira: 5,
      confluence: 55,
      bitbucket: 4,
      jenkins: 3,
      sonarqube: 6
    },
    domRefs: {
      valueDisplay: 'kpi-documentation-coverage-value',
      progressBar: 'kpi-documentation-coverage-bar',
      widgetContainer: 'kpi-documentation-coverage-widget'
    }
  }
};

export function calculateCurrentValue(kpiConfig, activeModuleIds) {
  const boostSum = activeModuleIds.reduce((acc, moduleId) => {
    const boost = kpiConfig.boosts[moduleId];
    return acc + (typeof boost === 'number' ? boost : 0);
  }, 0);

  return kpiConfig.baseValue + boostSum;
}