import DOMPurify from 'dompurify';

/**
 * @module sanitize
 * @description Módulo utilitario de sanitización del lado cliente.
 * Centraliza todas las funciones de limpieza y validación de datos antes de
 * renderizarlos en el DOM o enviarlos al backend.
 * Librería utilizada: DOMPurify
 *
 * ⚠️  ADVERTENCIA: Este archivo es crítico para la seguridad XSS del cliente.
 * Cualquier modificación debe ser revisada exhaustivamente antes de aplicarse.
 */

const sanitizeHTML = (input) => {
  if (typeof input !== 'string') {
    return '';
  }

  try {
    const config = {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'span'],
      ALLOWED_ATTR: ['class'],
      FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick', 'onmouseover'],
      ALLOW_DATA_ATTR: false,
      FORBID_CONTENTS: ['script', 'style'],
      FORCE_BODY: false,
    };

    return DOMPurify.sanitize(input, config);
  } catch {
    return '';
  }
};

const sanitizeText = (input) => {
  if (typeof input !== 'string') {
    return '';
  }

  try {
    const config = {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true,
    };

    const sanitized = DOMPurify.sanitize(input, config);
    return sanitized.trim();
  } catch {
    return '';
  }
};

const sanitizeCountryCode = (input) => {
  if (typeof input !== 'string') {
    return '';
  }

  const uppercased = input.toUpperCase();
  const trimmed = uppercased.trim();
  const pattern = /^[A-Z]{2}$/;

  if (!pattern.test(trimmed)) {
    return '';
  }

  return trimmed;
};

const sanitizeGreetingText = (input) => {
  if (typeof input !== 'string') {
    return '';
  }

  try {
    const cleaned = sanitizeText(input);
    const limited = cleaned.length > 200 ? cleaned.slice(0, 200) : cleaned;
    return limited;
  } catch {
    return '';
  }
};

const sanitizeAdminInput = (input) => {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    return {};
  }

  try {
    const sanitized = {};

    for (const key of Object.keys(input)) {
      const value = input[key];

      if (typeof value === 'string') {
        sanitized[key] = sanitizeText(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  } catch {
    return {};
  }
};

export {
  sanitizeHTML,
  sanitizeText,
  sanitizeCountryCode,
  sanitizeGreetingText,
  sanitizeAdminInput,
};