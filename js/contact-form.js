(function () {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const nameInput    = document.getElementById('input-name');
  const emailInput   = document.getElementById('input-email');
  const messageInput = document.getElementById('input-message');
  const submitBtn    = document.getElementById('btn-submit');
  const feedbackEl   = document.getElementById('form-feedback');

  function sanitizeInput(str) {
    return str
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;')
      .replace(/'/g,  '&#x27;');
  }

  function validateFields(name, email, message) {
    if (name.trim() === '') {
      return { isValid: false, errorMessage: 'El nombre no puede estar vacío.' };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { isValid: false, errorMessage: 'El correo electrónico no tiene un formato válido.' };
    }
    if (message.trim().length < 10) {
      return { isValid: false, errorMessage: 'El mensaje debe tener al menos 10 caracteres.' };
    }
    return { isValid: true, errorMessage: '' };
  }

  function setUIState(state) {
    switch (state) {
      case 'idle':
        submitBtn.disabled    = false;
        submitBtn.textContent = 'Enviar';
        feedbackEl.className  = '';
        feedbackEl.textContent = '';
        break;
      case 'loading':
        submitBtn.disabled    = true;
        submitBtn.textContent = 'Enviando...';
        feedbackEl.className  = 'feedback--loading';
        feedbackEl.textContent = '';
        break;
      case 'success':
        submitBtn.disabled    = true;
        feedbackEl.className  = 'feedback--success';
        feedbackEl.textContent = 'Tu mensaje ha sido enviado correctamente. ¡Gracias por contactarnos!';
        break;
      case 'error':
        submitBtn.disabled    = false;
        submitBtn.textContent = 'Enviar';
        feedbackEl.className  = 'feedback--error';
        break;
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const name    = sanitizeInput(nameInput.value);
    const email   = sanitizeInput(emailInput.value);
    const message = sanitizeInput(messageInput.value);

    const { isValid, errorMessage } = validateFields(name, email, message);

    if (!isValid) {
      setUIState('error');
      feedbackEl.textContent = errorMessage;
      return;
    }

    const endpoint =
      window.APP_CONFIG && window.APP_CONFIG.FORMSPREE_ENDPOINT
        ? window.APP_CONFIG.FORMSPREE_ENDPOINT
        : null;

    if (!endpoint) {
      setUIState('error');
      feedbackEl.textContent = 'Error de configuración: no se encontró el endpoint de envío.';
      return;
    }

    setUIState('loading');

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });

      if (response.ok) {
        setUIState('success');
        form.reset();
      } else {
        const data = await response.json().catch(() => ({}));
        setUIState('error');
        feedbackEl.textContent =
          (data && data.error) ||
          'Ocurrió un error al enviar el mensaje. Por favor, inténtalo de nuevo.';
      }
    } catch (_networkError) {
      setUIState('error');
      feedbackEl.textContent =
        'No se pudo conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.';
    }
  }

  form.addEventListener('submit', handleSubmit);
})();