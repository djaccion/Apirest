const FORMSPREE_ENDPOINT = 'https://formspree.io/f/XXXXXXXX';

function isNotEmpty(value) {
  return value.trim().length > 0;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPhone(value) {
  if (value.trim() === '') return true;
  return /^[\d\s\+\-\(\)]{7,15}$/.test(value);
}

function isNotTooLong(value, max) {
  return value.trim().length <= max;
}

function sanitize(value) {
  return value.trim();
}

function showFieldError(fieldId, message) {
  const el = document.getElementById(fieldId + '-error');
  if (!el) return;
  el.textContent = message;
}

function clearAllErrors(formElement) {
  formElement.querySelectorAll('[id$="-error"]').forEach(function (el) {
    el.textContent = '';
  });
}

function validateForm(data) {
  const errors = {};

  if (!isNotEmpty(data.name)) {
    errors.name = 'El nombre no puede estar vacío.';
  } else if (!isNotTooLong(data.name, 100)) {
    errors.name = 'El nombre no puede superar los 100 caracteres.';
  }

  if (!isNotEmpty(data.email)) {
    errors.email = 'El correo electrónico no puede estar vacío.';
  } else if (!isValidEmail(data.email)) {
    errors.email = 'Ingresa un correo electrónico válido.';
  }

  if (!isValidPhone(data.phone)) {
    errors.phone = 'Ingresa un número de teléfono válido.';
  }

  if (!isNotEmpty(data.message)) {
    errors.message = 'El mensaje no puede estar vacío.';
  } else if (!isNotTooLong(data.message, 1000)) {
    errors.message = 'El mensaje no puede superar los 1000 caracteres.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors: errors
  };
}

function setLoadingState(submitButton, isLoading) {
  if (isLoading === true) {
    submitButton.disabled = true;
    submitButton.textContent = 'Enviando...';
  } else {
    submitButton.disabled = false;
    submitButton.textContent = 'Enviar mensaje';
  }
}

async function handleSubmit(event) {
  event.preventDefault();

  const form = event.target;
  const submitButton = form.querySelector('[type="submit"]');

  clearAllErrors(form);

  const data = {
    name: sanitize(form.querySelector('#contact-name').value),
    email: sanitize(form.querySelector('#contact-email').value),
    phone: sanitize(form.querySelector('#contact-phone').value),
    message: sanitize(form.querySelector('#contact-message').value)
  };

  const validation = validateForm(data);

  if (!validation.isValid) {
    Object.keys(validation.errors).forEach(function (field) {
      showFieldError('contact-' + field, validation.errors[field]);
    });
    return;
  }

  setLoadingState(submitButton, true);

  try {
    const response = await fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      const successEl = document.getElementById('contact-success');
      if (successEl) {
        successEl.textContent = 'Tu mensaje fue enviado correctamente. ¡Nos pondremos en contacto pronto!';
      }
      form.reset();
    } else {
      const errorEl = document.getElementById('contact-form-error');
      if (errorEl) {
        errorEl.textContent = 'Hubo un problema al enviar el mensaje. Por favor, intenta nuevamente.';
      }
    }
  } catch (networkError) {
    const errorEl = document.getElementById('contact-form-error');
    if (errorEl) {
      errorEl.textContent = 'No se pudo conectar con el servidor. Verifica tu conexión e intenta nuevamente.';
    }
  } finally {
    setLoadingState(submitButton, false);
  }
}

function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  form.addEventListener('submit', handleSubmit);
}

document.addEventListener('DOMContentLoaded', initContactForm);