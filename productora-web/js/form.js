import { FORMSPREE_ENDPOINT } from './config.js';

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function sanitizeInput(value) {
  const trimmed = value.trim();
  return trimmed.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function showFieldError(inputElement, show) {
  const errorMsg = inputElement.nextElementSibling;
  if (show) {
    inputElement.classList.add('field--error');
    if (errorMsg) errorMsg.style.display = 'block';
  } else {
    inputElement.classList.remove('field--error');
    if (errorMsg) errorMsg.style.display = 'none';
  }
}

function validateForm(formElement) {
  const nameField = formElement.querySelector('[name="name"]');
  const emailField = formElement.querySelector('[name="email"]');
  const messageField = formElement.querySelector('[name="message"]');

  const fields = [nameField, emailField, messageField];
  let isValid = true;

  fields.forEach((field) => {
    const sanitized = sanitizeInput(field.value);
    field.value = sanitized;

    if (field.name === 'email') {
      const fieldValid = sanitized !== '' && isValidEmail(sanitized);
      showFieldError(field, !fieldValid);
      if (!fieldValid) isValid = false;
    } else {
      const fieldValid = sanitized !== '';
      showFieldError(field, !fieldValid);
      if (!fieldValid) isValid = false;
    }
  });

  return isValid;
}

function submitToFormspree(formElement) {
  const formData = new FormData(formElement);
  return fetch(FORMSPREE_ENDPOINT, {
    method: 'POST',
    body: formData,
    headers: { 'Accept': 'application/json' },
  });
}

export function initContactForm() {
  const form = document.querySelector('#contact-form');
  if (!form) return;

  const submitBtn = form.querySelector('[type="submit"]');
  const successMsg = form.querySelector('.form__success-msg');

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!validateForm(form)) return;

    submitBtn.disabled = true;

    submitToFormspree(form)
      .then((response) => {
        if (response.ok) {
          form.reset();
          if (successMsg) successMsg.style.display = 'block';
        } else {
          return response.json().then((data) => {
            throw new Error(data.error || 'Error en el envío');
          });
        }
      })
      .catch((error) => {
        console.error('Error al enviar el formulario:', error);
      })
      .finally(() => {
        submitBtn.disabled = false;
      });
  });
}