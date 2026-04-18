document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('contact-form');
  const submitBtn = document.getElementById('submit-btn');
  const feedbackContainer = document.getElementById('form-feedback');

  if (!form || !submitBtn || !feedbackContainer) return;

  const FORMSPREE_ENDPOINT = window.AppConfig && window.AppConfig.FORMSPREE_ENDPOINT
    ? window.AppConfig.FORMSPREE_ENDPOINT
    : null;

  function sanitizeInput(value) {
    return value.trim();
  }

  function showFeedback(message, isError) {
    feedbackContainer.textContent = message;
    if (isError) {
      feedbackContainer.classList.add('feedback--error');
      feedbackContainer.classList.remove('feedback--success');
    } else {
      feedbackContainer.classList.add('feedback--success');
      feedbackContainer.classList.remove('feedback--error');
    }
    feedbackContainer.classList.remove('hidden');
  }

  function setLoadingState(isLoading) {
    if (isLoading) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando...';
    } else {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Enviar mensaje';
    }
  }

  function buildPayload(formData) {
    return {
      name: sanitizeInput(formData.get('name') || ''),
      email: sanitizeInput(formData.get('email') || ''),
      message: sanitizeInput(formData.get('message') || '')
    };
  }

  function handleContactSubmit(event) {
    event.preventDefault();

    if (!FORMSPREE_ENDPOINT) {
      showFeedback('Error de configuración. Contacta al administrador.', true);
      return;
    }

    setLoadingState(true);

    var payload = buildPayload(new FormData(event.target));
    var targetForm = event.target;

    fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
      .then(function (response) {
        if (response.ok) {
          showFeedback('Mensaje enviado. Te contactaremos pronto.', false);
          targetForm.reset();
        } else {
          showFeedback('Error al enviar. Intenta nuevamente.', true);
        }
      })
      .catch(function () {
        showFeedback('Sin conexión. Verifica tu red e intenta de nuevo.', true);
      })
      .finally(function () {
        setLoadingState(false);
      });
  }

  form.addEventListener('submit', handleContactSubmit);
});