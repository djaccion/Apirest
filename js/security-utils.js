/**
 * @file security-utils.js
 * @description Utilería de seguridad transversal para HOLA TSOFT (XP-8).
 *              Debe cargarse ANTES que cualquier otro archivo JavaScript.
 * @version v1.0.0
 * @project HOLA TSOFT
 * @architecture Component-Based Static Architecture
 * @security Mitiga XSS, DOM Injection, Prototype Pollution y manipulación de atributos.
 *           No tiene dependencias externas. No usa eval, innerHTML ni document.write.
 */

(function (global) {
  'use strict';

  /* =========================================================================
   * BLOQUE 1 — SANITIZACIÓN DE TEXTO
   * =========================================================================
   * Propósito: Garantizar que cualquier valor de origen externo o dinámico
   * sea convertido a un string seguro antes de ser usado en el DOM o en
   * lógica de la aplicación.
   * Vector mitigado: XSS por inyección de caracteres de control y strings
   * maliciosos de longitud arbitraria.
   * ========================================================================= */

  /**
   * Sanitiza un valor de cualquier tipo y devuelve un string seguro.
   *
   * @param {*} value - Valor de cualquier tipo a sanitizar.
   * @returns {string} String limpio, sin caracteres de control, recortado y
   *                   limitado a 500 caracteres.
   * @security Mitiga XSS por inyección de caracteres de control Unicode y
   *           strings de longitud arbitraria que podrían saturar el DOM.
   */
  function sanitizeText(value) {
    if (value === null || value === undefined) {
      return '';
    }

    var result = String(value);

    result = result.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');

    result = result.trim();

    if (result.length > 500) {
      result = result.substring(0, 500);
    }

    return result;
  }

  /* =========================================================================
   * BLOQUE 2 — VALIDACIÓN DE DATOS DE ENTRADA
   * =========================================================================
   * Propósito: Verificar que los objetos de saludo cumplan el esquema
   * esperado antes de ser renderizados, descartando datos malformados o
   * potencialmente maliciosos de forma silenciosa.
   * Vector mitigado: Prototype Pollution, inyección de propiedades inesperadas
   * y datos de estructura incorrecta que podrían romper el renderizado.
   * ========================================================================= */

  /**
   * Valida que un objeto candidato cumpla el esquema mínimo de saludo de país.
   *
   * @param {*} candidate - Objeto candidato a validar.
   * @returns {boolean} true si el objeto es válido, false en cualquier otro caso.
   * @security Mitiga Prototype Pollution y renderizado de datos malformados
   *           que podrían introducir contenido inesperado en el DOM.
   */
  function validateGreetingObject(candidate) {
    try {
      if (typeof candidate !== 'object' || candidate === null) {
        return false;
      }

      var requiredProps = ['country', 'flag', 'greeting', 'author'];

      for (var i = 0; i < requiredProps.length; i++) {
        var prop = requiredProps[i];

        if (!Object.prototype.hasOwnProperty.call(candidate, prop)) {
          return false;
        }

        if (typeof candidate[prop] !== 'string') {
          return false;
        }

        if (candidate[prop].trim().length === 0) {
          return false;
        }
      }

      var flagLength = Array.from(candidate.flag).length;
      if (flagLength < 1 || flagLength >= 10) {
        return false;
      }

      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Filtra un array de candidatos y retorna únicamente los objetos válidos
   * según el esquema de saludo de país.
   *
   * @param {Array} arr - Array de objetos candidatos a filtrar.
   * @returns {Array} Array con únicamente los objetos que pasaron la validación.
   * @security Mitiga la introducción de datos malformados o maliciosos en el
   *           pipeline de renderizado. Los elementos inválidos se descartan
   *           silenciosamente para no interrumpir el flujo de la aplicación.
   */
  function validateGreetingsArray(arr) {
    if (!Array.isArray(arr)) {
      console.warn('[SecurityUtils] validateGreetingsArray: el argumento recibido no es un Array. Se retorna array vacío.');
      return [];
    }

    var valid = [];

    for (var i = 0; i < arr.length; i++) {
      if (validateGreetingObject(arr[i])) {
        valid.push(arr[i]);
      } else {
        console.warn(
          '[SecurityUtils] validateGreetingsArray: elemento en índice ' +
          i +
          ' descartado por no cumplir el esquema de saludo esperado.',
          arr[i]
        );
      }
    }

    return valid;
  }

  /* =========================================================================
   * BLOQUE 3 — ESCRITURA SEGURA AL DOM
   * =========================================================================
   * Propósito: Proveer funciones que garanticen que toda escritura al DOM
   * se realice mediante APIs seguras (textContent, setAttribute con lista
   * blanca), nunca mediante innerHTML, insertAdjacentHTML ni eval.
   * Vector mitigado: XSS por inyección de HTML arbitrario en el DOM,
   * inyección de atributos de evento (onclick, onerror, etc.) y
   * manipulación de atributos fuera del esquema esperado.
   * ========================================================================= */

  /**
   * Asigna texto de forma segura al contenido de un elemento del DOM.
   *
   * @param {HTMLElement} element - Elemento del DOM destino.
   * @param {string} content - Contenido de texto a asignar.
   * @returns {void}
   * @security Mitiga XSS al usar exclusivamente textContent, nunca innerHTML
   *           ni insertAdjacentHTML. Sanitiza el contenido antes de asignarlo.
   */
  function safeSetText(element, content) {
    if (!(element instanceof HTMLElement)) {
      return;
    }

    element.textContent = sanitizeText(content);
  }

  /**
   * Asigna un atributo de forma segura a un elemento del DOM usando lista blanca.
   *
   * @param {HTMLElement} element - Elemento del DOM destino.
   * @param {string} attrName - Nombre del atributo a asignar.
   * @param {string} attrValue - Valor del atributo a asignar.
   * @returns {void}
   * @security Mitiga inyección de atributos de evento (onclick, onerror, href
   *           con javascript:, etc.) mediante lista blanca explícita de atributos
   *           permitidos. Sanitiza el valor antes de asignarlo.
   */
  function safeSetAttribute(element, attrName, attrValue) {
    if (!(element instanceof HTMLElement)) {
      return;
    }

    var allowedAttributes = [
      'aria-label',
      'title',
      'lang',
      'data-country',
      'data-index',
      'class',
      'id'
    ];

    if (allowedAttributes.indexOf(attrName) === -1) {
      console.warn(
        '[SecurityUtils] safeSetAttribute: atributo rechazado por no estar en la lista blanca: "' +
        attrName +
        '"'
      );
      return;
    }

    element.setAttribute(attrName, sanitizeText(attrValue));
  }

  /* =========================================================================
   * BLOQUE 4 — INICIALIZACIÓN Y EXPOSICIÓN GLOBAL
   * =========================================================================
   * Propósito: Construir el objeto público SecurityUtils, congelarlo para
   * prevenir modificaciones en tiempo de ejecución y exponerlo en window
   * para que esté disponible globalmente sin necesidad de bundler o módulos.
   * Vector mitigado: Sobreescritura o extensión maliciosa del objeto de
   * utilidades desde consola o desde scripts de terceros.
   * ========================================================================= */

  var SecurityUtils = Object.freeze({
    sanitizeText: sanitizeText,
    validateGreetingObject: validateGreetingObject,
    validateGreetingsArray: validateGreetingsArray,
    safeSetText: safeSetText,
    safeSetAttribute: safeSetAttribute
  });

  global.SecurityUtils = SecurityUtils;

  console.info('[SecurityUtils] Módulo de seguridad cargado correctamente. Versión: v1.0.0');

}(window));