export const AppState = {
  // ─── Sección 1: Estado de módulos ───────────────────────────────────────────
  modules: {
    confluence: false,
    github: false,
    sonarqube: false,
    datadog: false,
    testrail: false,
  },

  // ─── Sección 2: Flag Overdrive (derivado, cacheado) ─────────────────────────
  overdriveActive: false,

  // ─── Sección 3: Valores actuales de KPIs (escala 0-100) ─────────────────────
  kpiValues: {
    velocity: 0,
    quality: 0,
    coverage: 0,
    deployFreq: 0,
    leadTime: 0,
    mttr: 0,
    changeFailRate: 0,
  },

  // ─── Sección 4: Configuración de boosts por herramienta ─────────────────────
  // Cada herramienta impacta principalmente en 2-3 KPIs (20-35 pts)
  // y tiene impacto menor en los demás (5-15 pts).
  // Con las 5 herramientas activas, todos los KPIs alcanzan entre 85 y 100.
  kpiBoosts: {
    confluence: {
      velocity: 25,      // impacto principal: documentación acelera al equipo
      leadTime: 30,      // impacto principal: reduce tiempo de onboarding/handoff
      quality: 10,       // impacto menor
      coverage: 5,       // impacto menor
      deployFreq: 10,    // impacto menor
      mttr: 8,           // impacto menor
      changeFailRate: 7, // impacto menor
    },
    github: {
      deployFreq: 30,    // impacto principal: CI/CD y automatización de releases
      velocity: 25,      // impacto principal: flujo de trabajo ágil con PRs
      leadTime: 15,      // impacto menor
      quality: 10,       // impacto menor
      coverage: 5,       // impacto menor
      mttr: 8,           // impacto menor
      changeFailRate: 7, // impacto menor
    },
    sonarqube: {
      quality: 35,       // impacto principal: análisis estático de código
      coverage: 30,      // impacto principal: cobertura de tests integrada
      changeFailRate: 15,// impacto menor: menos bugs en producción
      velocity: 5,       // impacto menor
      deployFreq: 5,     // impacto menor
      leadTime: 5,       // impacto menor
      mttr: 5,           // impacto menor
    },
    datadog: {
      mttr: 35,          // impacto principal: observabilidad acelera resolución
      changeFailRate: 25,// impacto principal: detección temprana de fallos
      deployFreq: 10,    // impacto menor: confianza para deployar más seguido
      quality: 10,       // impacto menor
      velocity: 5,       // impacto menor
      leadTime: 5,       // impacto menor
      coverage: 5,       // impacto menor
    },
    testrail: {
      coverage: 30,      // impacto principal: gestión centralizada de test cases
      changeFailRate: 20,// impacto principal: trazabilidad reduce fallos
      quality: 15,       // impacto menor
      mttr: 12,          // impacto menor
      velocity: 8,       // impacto menor
      deployFreq: 5,     // impacto menor
      leadTime: 5,       // impacto menor
    },
  },
};

// ─── Sección 5: Registro de suscriptores (privado, no exportado) ─────────────
// Array interno que almacena los callbacks registrados via subscribe().
// No se expone fuera de este módulo para evitar manipulación externa.
const _subscribers = [];

// ─── Función interna: recalculateKPIs ────────────────────────────────────────
// Recalcula todos los valores de KPI desde cero sumando los boosts
// de cada módulo activo. Aplica clamp [0, 100] al resultado final.
function recalculateKPIs() {
  // Resetear todos los KPIs a 0 antes de recalcular
  for (const key in AppState.kpiValues) {
    AppState.kpiValues[key] = 0;
  }

  // Sumar boosts de cada módulo que esté activo
  for (const moduleName in AppState.modules) {
    if (AppState.modules[moduleName] === true) {
      const boosts = AppState.kpiBoosts[moduleName];
      for (const kpiKey in boosts) {
        if (kpiKey in AppState.kpiValues) {
          AppState.kpiValues[kpiKey] += boosts[kpiKey];
        }
      }
    }
  }

  // Aplicar clamp [0, 100] a cada valor resultante
  for (const key in AppState.kpiValues) {
    AppState.kpiValues[key] = Math.min(100, Math.max(0, AppState.kpiValues[key]));
  }
}

// ─── Función interna: recalculateOverdrive ───────────────────────────────────
// Determina si el modo Overdrive está activo evaluando si todos los módulos
// están habilitados. Cachea el resultado en AppState.overdriveActive.
function recalculateOverdrive() {
  AppState.overdriveActive = Object.values(AppState.modules).every(
    (isActive) => isActive === true
  );
}

// ─── Función interna: notifySubscribers ──────────────────────────────────────
// Notifica a todos los suscriptores registrados pasándoles una copia del estado.
// Cada llamada está envuelta en try-catch para aislar errores de suscriptores
// individuales y no interrumpir la cadena de notificaciones.
function notifySubscribers() {
  const currentState = getState();
  for (const callback of _subscribers) {
    try {
      callback(currentState);
    } catch (error) {
      console.error(
        '[AppState] Error en suscriptor durante notifySubscribers:',
        error
      );
    }
  }
}

// ─── toggleModule ─────────────────────────────────────────────────────────────
// Invierte el estado booleano de un módulo por nombre.
// Dispara recálculo de KPIs, Overdrive y notificación a suscriptores.
export function toggleModule(moduleName) {
  if (!(moduleName in AppState.modules)) {
    throw new Error(
      `[AppState] toggleModule: el módulo "${moduleName}" no existe. ` +
      `Módulos válidos: ${Object.keys(AppState.modules).join(', ')}.`
    );
  }

  // Invertir el estado booleano del módulo indicado
  AppState.modules[moduleName] = !AppState.modules[moduleName];

  // Recalcular KPIs y Overdrive tras el cambio
  recalculateKPIs();
  recalculateOverdrive();

  // Notificar a todos los suscriptores con el nuevo estado
  notifySubscribers();
}

// ─── getState ─────────────────────────────────────────────────────────────────
// Retorna una copia superficial del AppState sin incluir el array _subscribers.
// Previene mutaciones accidentales del estado desde módulos externos.
// Nota: los sub-objetos (modules, kpiValues, kpiBoosts) son referencias;
// los módulos de render de alta frecuencia pueden leer AppState directamente
// para evitar el overhead de la copia.
export function getState() {
  const { ...stateCopy } = AppState;
  return stateCopy;
}

// ─── subscribe ────────────────────────────────────────────────────────────────
// Registra un callback que será invocado cada vez que el estado cambie.
// Retorna una función de unsubscribe para cleanup cuando el módulo se destruya.
export function subscribe(callback) {
  if (typeof callback !== 'function') {
    throw new Error(
      '[AppState] subscribe: el argumento debe ser una función. ' +
      `Se recibió: ${typeof callback}.`
    );
  }

  _subscribers.push(callback);

  // Retornar función de unsubscribe que elimina este callback del array
  return function unsubscribe() {
    const index = _subscribers.indexOf(callback);
    if (index !== -1) {
      _subscribers.splice(index, 1);
    }
  };
}

// ─── resetState ───────────────────────────────────────────────────────────────
// Restablece el estado completo a sus valores iniciales.
// Útil para testing y para reinicialización de la aplicación.
export function resetState() {
  // Resetear todos los módulos a false
  for (const key in AppState.modules) {
    AppState.modules[key] = false;
  }

  // Resetear todos los KPIs a 0
  for (const key in AppState.kpiValues) {
    AppState.kpiValues[key] = 0;
  }

  // Resetear flag Overdrive
  AppState.overdriveActive = false;

  // Notificar a suscriptores del reset
  notifySubscribers();
}