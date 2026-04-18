const formulario      = document.getElementById('contact-form');
const campoNombre     = document.getElementById('contact-nombre');
const campoEmail      = document.getElementById('contact-email');
const campoMensaje    = document.getElementById('contact-mensaje');
const mensajeFeedback = document.getElementById('contact-feedback');

function sanitizarCampo(valor) {
  return valor.trim().replace(/[<>]/g, '');
}

function validarFormulario(nombre, email, mensaje) {
  const errores = [];

  if (nombre.length < 2) {
    errores.push('El nombre debe tener al menos 2 caracteres.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errores.push('Ingresa un correo electrónico válido.');
  }
  if (mensaje.length < 10) {
    errores.push('El mensaje debe tener al menos 10 caracteres.');
  }

  return { esValido: errores.length === 0, errores };
}

function mostrarFeedback(tipo, texto) {
  mensajeFeedback.textContent = texto;
  mensajeFeedback.classList.remove('feedback--exito', 'feedback--error');
  mensajeFeedback.classList.add('feedback--' + tipo);
}

function setBloqueoBtnEnvio(bloqueado) {
  const btnEnvio = formulario.querySelector('button[type="submit"]');
  if (bloqueado) {
    btnEnvio.disabled = true;
    btnEnvio.textContent = 'Enviando...';
  } else {
    btnEnvio.disabled = false;
    btnEnvio.textContent = 'Enviar mensaje';
  }
}

function manejarEnvio(evento) {
  evento.preventDefault();

  const nombre  = sanitizarCampo(campoNombre.value);
  const email   = sanitizarCampo(campoEmail.value);
  const mensaje = sanitizarCampo(campoMensaje.value);

  const { esValido, errores } = validarFormulario(nombre, email, mensaje);

  if (!esValido) {
    mostrarFeedback('error', errores.join(' '));
    return;
  }

  setBloqueoBtnEnvio(true);
  mensajeFeedback.textContent = '';
  mensajeFeedback.classList.remove('feedback--exito', 'feedback--error');

  emailjs.send(
    'SERVICE_ID',
    'TEMPLATE_ID',
    {
      nombre:  nombre,
      email:   email,
      mensaje: mensaje
    }
  )
  .then(function () {
    mostrarFeedback('exito', 'Tu mensaje fue enviado correctamente. ¡Nos pondremos en contacto pronto!');
    formulario.reset();
  })
  .catch(function () {
    mostrarFeedback('error', 'Ocurrió un error al enviar el mensaje. Por favor, inténtalo de nuevo.');
  })
  .then(function () {
    setBloqueoBtnEnvio(false);
  });
}

formulario.addEventListener('submit', manejarEnvio);