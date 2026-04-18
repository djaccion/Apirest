// --- COMPONENTES ---

function injectNavbar() {
  const placeholder = document.querySelector('#navbar-placeholder');
  if (!placeholder) return;

  placeholder.innerHTML = `
    <nav>
      <a href="./index.html" class="nav-logo">
        <img src="https://placehold.co/120x40" alt="Logo Productora">
      </a>
      <ul class="nav-links">
        <li><a href="./index.html" data-i18n="nav_home">Inicio</a></li>
        <li><a href="./servicios.html" data-i18n="nav_services">Servicios</a></li>
        <li><a href="./quienes-somos.html" data-i18n="nav_about">Quiénes Somos</a></li>
        <li><a href="./contacto.html" data-i18n="nav_contact">Contacto</a></li>
      </ul>
      <button id="lang-switcher">EN</button>
    </nav>
  `;

  setActiveNavLink();
}

function setActiveNavLink() {
  const pathname = window.location.pathname;
  const links = document.querySelectorAll('#navbar-placeholder nav a');

  links.forEach(function (link) {
    const href = link.getAttribute('href');
    if (!href) return;

    const normalizedHref = href.replace('./', '');
    const isRoot = pathname.endsWith('/') || pathname.endsWith('/index.html') || pathname === '';
    const isIndexLink = normalizedHref === 'index.html';

    if (isRoot && isIndexLink) {
      link.classList.add('nav-link--active');
    } else if (!isIndexLink && pathname.includes(normalizedHref)) {
      link.classList.add('nav-link--active');
    } else {
      link.classList.remove('nav-link--active');
    }
  });
}

function injectFooter() {
  const placeholder = document.querySelector('#footer-placeholder');
  if (!placeholder) return;

  placeholder.innerHTML = `
    <footer>
      <p class="footer-brand" data-i18n="footer_brand">Productora</p>
      <p class="footer-copy">&copy; ${new Date().getFullYear()}</p>
      <ul class="footer-social">
        <li><a href="#" data-i18n="footer_instagram">Instagram</a></li>
        <li><a href="#" data-i18n="footer_facebook">Facebook</a></li>
        <li><a href="#" data-i18n="footer_youtube">YouTube</a></li>
      </ul>
    </footer>
  `;
}

// --- IDIOMA ---

function applyLanguage(lang) {
  const elements = document.querySelectorAll('[data-i18n]');

  elements.forEach(function (element) {
    const key = element.getAttribute('data-i18n');
    const translation = window.TRANSLATIONS?.[lang]?.[key];
    if (translation !== undefined) {
      element.textContent = translation;
    }
  });

  localStorage.setItem('lang', lang);

  const switcher = document.querySelector('#lang-switcher');
  if (switcher) {
    switcher.textContent = lang === 'es' ? 'EN' : 'ES';
  }
}

function initLanguage() {
  const stored = localStorage.getItem('lang');
  const lang = (stored === 'es' || stored === 'en') ? stored : 'es';

  applyLanguage(lang);

  const switcher = document.querySelector('#lang-switcher');
  if (!switcher) return;

  switcher.addEventListener('click', function () {
    const current = localStorage.getItem('lang') || 'es';
    const next = current === 'es' ? 'en' : 'es';
    applyLanguage(next);
  });
}

// --- FORMULARIO ---

function sanitizeInput(value) {
  return value.trim().replace(/[<>]/g, '');
}

function showFormMessage(container, message, isError) {
  container.textContent = message;
  container.className = isError ? 'form-message form-message--error' : 'form-message form-message--success';
  container.removeAttribute('hidden');
}

async function handleContactForm() {
  const form = document.querySelector('#contact-form');
  if (!form) return;

  const messageContainer = document.querySelector('#form-message');
  if (!messageContainer) return;

  form.addEventListener('submit', async function (event) {
    event.preventDefault();

    const nameField = form.querySelector('[name="name"]');
    const emailField = form.querySelector('[name="email"]');
    const messageField = form.querySelector('[name="message"]');

    const name = sanitizeInput(nameField?.value || '');
    const email = sanitizeInput(emailField?.value || '');
    const message = sanitizeInput(messageField?.value || '');

    if (!name || !email || !message) {
      showFormMessage(messageContainer, 'Por favor, completá todos los campos.', true);
      return;
    }

    const submitButton = form.querySelector('[type="submit"]');
    if (submitButton) submitButton.disabled = true;

    const formspreeEndpoint = window.CONFIG?.formspreeEndpoint;
    if (!formspreeEndpoint) {
      showFormMessage(messageContainer, 'Error de configuración. Intentá más tarde.', true);
      if (submitButton) submitButton.disabled = false;
      return;
    }

    try {
      const response = await fetch(formspreeEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ name, email, message })
      });

      if (response.ok) {
        showFormMessage(messageContainer, 'Mensaje enviado correctamente. ¡Gracias!', false);
        form.reset();
      } else {
        showFormMessage(messageContainer, 'Hubo un error al enviar. Intentá nuevamente.', true);
      }
    } catch (error) {
      showFormMessage(messageContainer, 'No se pudo conectar. Revisá tu conexión e intentá de nuevo.', true);
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
}

// --- INIT ---

function init() {
  injectNavbar();
  injectFooter();
  initLanguage();
  handleContactForm();
}

document.addEventListener('DOMContentLoaded', init);