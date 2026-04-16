(function() {
  'use strict';

  // =========================================================================
  // CONSTANTES DE CONFIGURACIÓN
  // =========================================================================

  const API_ENDPOINT = '/api/validate-rut';
  const RUT_REGEX = /^\d{7,8}-[\dK]$/;
  const RUT_MAX_LENGTH = 10;
  const DEBOUNCE_DELAY = 500;

  // =========================================================================
  // FUNCIONES DE FORMATEO Y SANITIZACIÓN
  // =========================================================================

  function formatearRut(valorCrudo) {
    if (!valorCrudo || typeof valorCrudo !== 'string') {
      return '';
    }

    let limpio = valorCrudo.replace(/[^0-9kK]/g, '').toUpperCase();

    if (limpio.length > RUT_MAX_LENGTH - 1) {
      limpio = limpio.slice(0, RUT_MAX_LENGTH - 1);
    }

    if (limpio.length <= 1) {
      return limpio;
    }

    const cuerpo = limpio.slice(0, -1);
    const dv = limpio.slice(-1);
    const formateado = cuerpo + '-' + dv;

    return formateado;
  }

  function sanitizarRut(valorFormateado) {
    if (!valorFormateado || typeof valorFormateado !== 'string') {
      return null;
    }

    const limpio = valorFormateado.replace(/[^0-9\-K]/g, '');

    if (!limpio || limpio.length === 0) {
      return null;
    }

    return limpio;
  }

  // =========================================================================
  // FUNCIONES DE VALIDACIÓN CLIENT-SIDE DE FORMATO
  // =========================================================================

  function validarFormatoRut(rutSanitizado) {
    if (!rutSanitizado || typeof rutSanitizado !== 'string') {
      return false;
    }

    return RUT_REGEX.test(rutSanitizado);
  }

  // =========================================================================
  // FUNCIONES DE COMUNICACIÓN CON LA API
  // =========================================================================

  async function validarRutEnServidor(rutSanitizado) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rut: rutSanitizado }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.status === 429) {
        return {
          success: false,
          data: null,
          error: 'Has realizado demasiadas solicitudes. Por favor espera unos momentos antes de reintentar.'
        };
      }

      if (response.status === 500) {
        return {
          success: false,
          data: null,
          error: 'Ocurrió un error en el servidor. Por favor intenta más tarde.'
        };
      }

      let responseData = null;

      try {
        responseData = await response.json();
      } catch {
        return {
          success: false,
          data: null,
          error: 'La respuesta del servidor no es válida.'
        };
      }

      if (response.status === 400) {
        const mensajeError = (responseData && responseData.message)
          ? responseData.message
          : 'El formato del RUT ingresado no es válido.';

        return {
          success: false,
          data: null,
          error: mensajeError
        };
      }

      if (!response.ok) {
        return {
          success: false,
          data: null,
          error: 'Ocurrió un error inesperado. Por favor intenta más tarde.'
        };
      }

      return {
        success: true,
        data: responseData,
        error: null
      };

    } catch (err) {
      clearTimeout(timeoutId);

      if (err.name === 'AbortError') {
        return {
          success: false,
          data: null,
          error: 'La solicitud tardó demasiado tiempo. Por favor verifica tu conexión e intenta nuevamente.'
        };
      }

      return {
        success: false,
        data: null,
        error: 'No se pudo conectar con el servidor. Por favor verifica tu conexión a internet.'
      };
    }
  }

  // =========================================================================
  // FUNCIONES DE MANIPULACIÓN DEL DOM Y FEEDBACK VISUAL
  // =========================================================================

  function mostrarCargando(estado) {
    const boton = document.getElementById('btn-validar');
    const formulario = document.getElementById('form-rut');

    if (!boton || !formulario) {
      return;
    }

    if (estado) {
      boton.disabled = true;
      boton.dataset.textoOriginal = boton.textContent;
      boton.textContent = 'Validando...';
      formulario.classList.add('loading');
    } else {
      boton.disabled = false;
      if (boton.dataset.textoOriginal) {
        boton.textContent = boton.dataset.textoOriginal;
      }
      formulario.classList.remove('loading');
    }
  }

  function mostrarResultado(respuesta) {
    const contenedor = document.getElementById('resultado-validacion');

    if (!contenedor) {
      return;
    }

    contenedor.classList.remove('resultado-exito', 'resultado-error', 'resultado-oculto');

    while (contenedor.firstChild) {
      contenedor.removeChild(contenedor.firstChild);
    }

    if (respuesta && respuesta.success && respuesta.data) {
      const data = respuesta.data;
      const esValido = data.valid === true;

      if (esValido) {
        contenedor.classList.add('resultado-exito');

        if (data.rut_formateado) {
          const spanRut = document.createElement('span');
          spanRut.className = 'resultado-rut';
          spanRut.textContent = 'RUT: ' + data.rut_formateado;
          contenedor.appendChild(spanRut);
        }

        const spanMensaje = document.createElement('span');
        spanMensaje.className = 'resultado-mensaje';
        spanMensaje.textContent = data.message || 'El RUT ingresado es válido.';
        contenedor.appendChild(spanMensaje);

      } else {
        contenedor.classList.add('resultado-error');

        const spanMensaje = document.createElement('span');
        spanMensaje.className = 'resultado-mensaje';
        spanMensaje.textContent = data.message || 'El RUT ingresado no es válido.';
        contenedor.appendChild(spanMensaje);
      }

    } else {
      contenedor.classList.add('resultado-error');

      const spanMensaje = document.createElement('span');
      spanMensaje.className = 'resultado-mensaje';
      spanMensaje.textContent = (respuesta && respuesta.error)
        ? respuesta.error
        : 'Ocurrió un error al procesar la solicitud.';
      contenedor.appendChild(spanMensaje);
    }
  }

  // =========================================================================
  // INICIALIZACIÓN Y BINDING DE EVENTOS
  // =========================================================================

  function debounce(fn, delay) {
    let timer = null;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  function manejarInputRut(evento) {
    const input = evento.target;
    const posicionCursor = input.selectionStart;
    const longitudAnterior = input.value.length;

    const valorFormateado = formatearRut(input.value);
    input.value = valorFormateado;

    const longitudNueva = input.value.length;
    const diferencia = longitudNueva - longitudAnterior;
    const nuevaPosicion = Math.max(0, posicionCursor + diferencia);
    input.setSelectionRange(nuevaPosicion, nuevaPosicion);
  }

  async function manejarSubmitFormulario(evento) {
    evento.preventDefault();

    const inputRut = document.getElementById('input-rut');

    if (!inputRut) {
      return;
    }

    const valorInput = inputRut.value;
    const rutSanitizado = sanitizarRut(valorInput);

    if (!rutSanitizado) {
      mostrarResultado({
        success: false,
        data: null,
        error: 'Por favor ingresa un RUT antes de validar.'
      });
      return;
    }

    if (!validarFormatoRut(rutSanitizado)) {
      mostrarResultado({
        success: false,
        data: null,
        error: 'El formato del RUT no es correcto. Debe tener el formato XXXXXXXX-X.'
      });
      return;
    }

    mostrarCargando(true);

    const respuesta = await validarRutEnServidor(rutSanitizado);

    mostrarCargando(false);
    mostrarResultado(respuesta);
  }

  function inicializar() {
    const inputRut = document.getElementById('input-rut');
    const formulario = document.getElementById('form-rut');

    if (!inputRut || !formulario) {
      return;
    }

    inputRut.setAttribute('maxlength', String(RUT_MAX_LENGTH));
    inputRut.setAttribute('autocomplete', 'off');
    inputRut.setAttribute('spellcheck', 'false');

    inputRut.addEventListener('input', manejarInputRut);
    inputRut.addEventListener('input', debounce(function() {
      const rutSanitizado = sanitizarRut(inputRut.value);
      if (rutSanitizado && !validarFormatoRut(rutSanitizado)) {
        inputRut.setAttribute('aria-invalid', 'true');
      } else {
        inputRut.removeAttribute('aria-invalid');
      }
    }, DEBOUNCE_DELAY));

    formulario.addEventListener('submit', manejarSubmitFormulario);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializar);
  } else {
    inicializar();
  }

  window.RutHandler = {
    formatearRut,
    sanitizarRut,
    validarFormatoRut
  };

}());