// ============================================================
// productora-web/js/contact.js
// Módulo de lógica del formulario de contacto.
// Dependencia externa: emailjs (cargado vía CDN en index.html)
// ============================================================

// --- Paso 1: Constantes de configuración EmailJS ---
const EMAILJS_SERVICE_ID  = 'TU_SERVICE_ID';   // TODO: reemplazar con valor real del dashboard EmailJS
const EMAILJS_TEMPLATE_ID = 'TU_TEMPLATE_ID';  // TODO: reemplazar con valor real del dashboard EmailJS
const EMAILJS_PUBLIC_KEY  = 'TU_PUBLIC_KEY';   // TODO: reemplazar con valor real del dashboard EmailJS

// --- Paso 2: Sanitización de input ---
function sanitizeInput(value) {
  return value
    .trim()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// --- Paso 3: Validación de campos ---
function validateFields(name, email, message) {
  if (!name) {
    return { isValid: false, errorMessage: 'El nombre es obligatorio.' };
  }
  if (!email) {
    return { isValid: false, errorMessage: 'El correo es obligatorio.' };
  }
  if (!(/\S+@\S+\.\S+/).test(email)) {
    return { isValid: false, errorMessage: 'Ingresa un correo válido.' };
  }
  if (!message) {
    return { isValid: false, errorMessage: 'El mensaje es obligatorio.' };
  }
  if (message.length < 10) {
    return { isValid: false, errorMessage: 'El mensaje debe tener al menos 10 caracteres.' };
  }
  return { isValid: true, errorMessage: '' };
}

// --- Paso 4: Feedback visual ---
function setFormStatus(statusElement, message, type) {
  // Limpiar clases de estado anteriores
  statusElement.classList.remove(
    'form-status--success',
    'form-status--error',
    'form-status--loading'
  );

  if (type === 'idle') {
    statusElement.textContent = '';
    return;
  }

  statusElement.textContent = message;

  if (type === 'success') {
    statusElement.classList.add('form-status--success');
  } else if (type === 'error') {
    statusElement.classList.add('form-status--error');
  } else if (type === 'loading') {
    statusElement.classList.add('form-status--loading');
  }
}

// --- Paso 5: Envío con EmailJS ---
function sendEmail(templateParams, submitButton, statusElement, form) {
  submitButton.disabled = true;
  setFormStatus(statusElement, 'Enviando...', 'loading');

  emailjs
    .send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY)
    .then(function () {
      setFormStatus(
        statusElement,
        '¡Mensaje enviado! Nos pondremos en contacto pronto.',
        'success'
      );
      form.reset();
      submitButton.disabled = false;
    })
    .catch(function () {
      setFormStatus(
        statusElement,
        'Error al enviar. Por favor intenta de nuevo o escríbenos directamente.',
        'error'
      );
      submitButton.disabled = false;
    });
}

// --- Función pública de inicialización ---
function initContactForm() {
  var form = document.querySelector('.contact-form');
  if (!form) return;

  var submitButton  = form.querySelector('.contact-form__submit');
  var statusElement = form.querySelector('.contact-form__feedback-msg');

  if (!submitButton || !statusElement) return;

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    // Leer valores crudos desde los atributos name estándar
    var rawName    = form.elements['name']    ? form.elements['name'].value    : '';
    var rawEmail   = form.elements['email']   ? form.elements['email'].value   : '';
    var rawMessage = form.elements['message'] ? form.elements['message'].value : '';

    // Sanitizar
    var cleanName    = sanitizeInput(rawName);
    var cleanEmail   = sanitizeInput(rawEmail);
    var cleanMessage = sanitizeInput(rawMessage);

    // Validar
    var validation = validateFields(cleanName, cleanEmail, cleanMessage);

    if (!validation.isValid) {
      setFormStatus(statusElement, validation.errorMessage, 'error');
      return;
    }

    // Limpiar estado previo y enviar
    setFormStatus(statusElement, '', 'idle');

    var templateParams = {
      from_name   : cleanName,
      from_email  : cleanEmail,
      message     : cleanMessage
    };

    sendEmail(templateParams, submitButton, statusElement, form);
  });
}