/**
 * @fileoverview ui-controller.js
 * Orquestador de eventos DOM. Escucha acciones del usuario y delega al estado y callbacks.
 * No calcula, no renderiza: solo escucha y delega.
 */

// ─── Cache de nodos DOM (se popula una sola vez en _cacheNodes) ───────────────
const _nodes = {
  overdriveToggle: null,
  resetBtn: null,
  sliders: {
    dealSize: { input: null, display: null },
    winRate:  { input: null, display: null },
    cycle:    { input: null, display: null }
  },
  kpiToggles: null
};

// ─── Mapa de sliders: clave interna → IDs del DOM ────────────────────────────
const _SLIDER_MAP = {
  dealSize: { inputId: '#slider-deal-size',       displayId: '#slider-deal-size-value' },
  winRate:  { inputId: '#slider-win-rate',        displayId: '#slider-win-rate-value'  },
  cycle:    { inputId: '#slider-cycle',           displayId: '#slider-cycle-value'     }
};

// ─── PASO 3: _cacheNodes ──────────────────────────────────────────────────────
/**
 * Popula _nodes con referencias a los elementos del DOM.
 * Emite console.warn por cada nodo faltante; nunca lanza Error.
 * @private
 */
function _cacheNodes() {
  // Nodos simples
  const simpleMap = {
    overdriveToggle: '#overdrive-toggle',
    resetBtn:        '#reset-btn'
  };

  for (const [key, selector] of Object.entries(simpleMap)) {
    const el = document.querySelector(selector);
    if (!el) {
      console.warn(`[ui-controller] Nodo no encontrado en el DOM: "${selector}"`);
    }
    _nodes[key] = el;
  }

  // Sliders
  for (const [key, ids] of Object.entries(_SLIDER_MAP)) {
    const inputEl   = document.querySelector(ids.inputId);
    const displayEl = document.querySelector(ids.displayId);

    if (!inputEl) {
      console.warn(`[ui-controller] Nodo no encontrado en el DOM: "${ids.inputId}"`);
    }
    if (!displayEl) {
      console.warn(`[ui-controller] Nodo no encontrado en el DOM: "${ids.displayId}"`);
    }

    _nodes.sliders[key].input   = inputEl;
    _nodes.sliders[key].display = displayEl;
  }

  // KPI toggles (NodeList, no se convierte a Array aquí)
  const kpiToggles = document.querySelectorAll('[data-kpi-toggle]');
  if (!kpiToggles || kpiToggles.length === 0) {
    console.warn('[ui-controller] No se encontraron elementos con [data-kpi-toggle] en el DOM.');
  }
  _nodes.kpiToggles = kpiToggles;
}

// ─── PASO 4: _bindSliders ─────────────────────────────────────────────────────
/**
 * Registra listeners 'input' en cada slider.
 * Sincroniza el display con el valor inicial sin disparar el callback.
 * Usa data-state-key del input para mapear al objeto state.
 * @private
 * @param {Object} stateRef - Referencia directa al objeto de estado global.
 * @param {Function} onChangeCallback - Callback a invocar tras cada cambio.
 */
function _bindSliders(stateRef, onChangeCallback) {
  for (const [, slider] of Object.entries(_nodes.sliders)) {
    const { input, display } = slider;

    if (!input || !display) continue;

    // Sincronización inicial sin disparar callback
    display.textContent = input.value;

    input.addEventListener('input', () => {
      const parsed   = parseFloat(input.value);
      const stateKey = input.getAttribute('data-state-key');

      if (stateKey && stateKey in stateRef) {
        stateRef[stateKey] = parsed;
      } else {
        console.warn(
          `[ui-controller] data-state-key "${stateKey}" no existe en stateRef.`
        );
      }

      display.textContent = parsed;
      onChangeCallback();
    });
  }
}

// ─── PASO 5: _bindToggles ─────────────────────────────────────────────────────
/**
 * Registra listeners 'click' en cada botón [data-kpi-toggle].
 * Alterna la propiedad booleana correspondiente en stateRef usando data-kpi-toggle
 * como clave. Refleja el estado activo/inactivo mediante classList.
 * @private
 * @param {Object} stateRef - Referencia directa al objeto de estado global.
 * @param {Function} onChangeCallback - Callback a invocar tras cada cambio.
 */
function _bindToggles(stateRef, onChangeCallback) {
  if (!_nodes.kpiToggles || _nodes.kpiToggles.length === 0) return;

  _nodes.kpiToggles.forEach((btn) => {
    const stateKey = btn.getAttribute('data-kpi-toggle');

    if (!stateKey) {
      console.warn('[ui-controller] Botón [data-kpi-toggle] sin valor de atributo.', btn);
      return;
    }

    // Sincronización inicial del estado visual
    if (stateRef[stateKey]) {
      btn.classList.add('is-active');
    } else {
      btn.classList.remove('is-active');
    }

    btn.addEventListener('click', () => {
      if (!(stateKey in stateRef)) {
        console.warn(
          `[ui-controller] data-kpi-toggle "${stateKey}" no existe en stateRef.`
        );
        return;
      }

      stateRef[stateKey] = !stateRef[stateKey];

      if (stateRef[stateKey]) {
        btn.classList.add('is-active');
      } else {
        btn.classList.remove('is-active');
      }

      onChangeCallback();
    });
  });
}

// ─── PASO 6: _bindOverdrive ───────────────────────────────────────────────────
/**
 * Registra el listener 'click' en el toggle de modo Overdrive.
 * Alterna stateRef.overdrive y refleja el estado en classList del botón.
 * @private
 * @param {Object} stateRef - Referencia directa al objeto de estado global.
 * @param {Function} onChangeCallback - Callback a invocar tras cada cambio.
 */
function _bindOverdrive(stateRef, onChangeCallback) {
  const btn = _nodes.overdriveToggle;
  if (!btn) return;

  // Sincronización inicial
  if (stateRef.overdrive) {
    btn.classList.add('is-active');
  } else {
    btn.classList.remove('is-active');
  }

  btn.addEventListener('click', () => {
    stateRef.overdrive = !stateRef.overdrive;

    if (stateRef.overdrive) {
      btn.classList.add('is-active');
    } else {
      btn.classList.remove('is-active');
    }

    onChangeCallback();
  });
}

// ─── PASO 7: _bindReset ───────────────────────────────────────────────────────
/**
 * Registra el listener 'click' en el botón de reset global.
 * Delega el reset al callback; no conoce los valores por defecto.
 * Tras el reset, re-sincroniza los displays de los sliders con los valores
 * que el estado haya recuperado, y actualiza classList de toggles.
 * @private
 * @param {Object} stateRef - Referencia directa al objeto de estado global.
 * @param {Function} onChangeCallback - Callback a invocar tras cada cambio.
 */
function _bindReset(stateRef, onChangeCallback) {
  const btn = _nodes.resetBtn;
  if (!btn) return;

  btn.addEventListener('click', () => {
    // El callback es responsable de restaurar stateRef a sus valores iniciales
    onChangeCallback('reset');

    // Re-sincronizar displays de sliders con los valores restaurados en stateRef
    for (const [, slider] of Object.entries(_nodes.sliders)) {
      const { input, display } = slider;
      if (!input || !display) continue;

      const stateKey = input.getAttribute('data-state-key');
      if (stateKey && stateKey in stateRef) {
        input.value         = stateRef[stateKey];
        display.textContent = stateRef[stateKey];
      }
    }

    // Re-sincronizar classList de KPI toggles
    if (_nodes.kpiToggles && _nodes.kpiToggles.length > 0) {
      _nodes.kpiToggles.forEach((toggleBtn) => {
        const stateKey = toggleBtn.getAttribute('data-kpi-toggle');
        if (!stateKey || !(stateKey in stateRef)) return;

        if (stateRef[stateKey]) {
          toggleBtn.classList.add('is-active');
        } else {
          toggleBtn.classList.remove('is-active');
        }
      });
    }

    // Re-sincronizar Overdrive toggle
    if (_nodes.overdriveToggle) {
      if (stateRef.overdrive) {
        _nodes.overdriveToggle.classList.add('is-active');
      } else {
        _nodes.overdriveToggle.classList.remove('is-active');
      }
    }
  });
}

// ─── PASO 2: initUIController (exportada) ────────────────────────────────────
/**
 * Punto de entrada único del módulo.
 * Cachea nodos y registra todos los listeners de la UI.
 *
 * @param {Object}   stateRef         - Referencia directa al objeto de estado global (state.js).
 * @param {Function} onChangeCallback - Función invocada tras cualquier cambio de control.
 *                                      Puede recibir un string opcional ('reset') como hint.
 */
export function initUIController(stateRef, onChangeCallback) {
  _cacheNodes();
  _bindSliders(stateRef, onChangeCallback);
  _bindToggles(stateRef, onChangeCallback);
  _bindOverdrive(stateRef, onChangeCallback);
  _bindReset(stateRef, onChangeCallback);
}