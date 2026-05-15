// =============================================================================
// main.js — XP-14 Página Web Metodologías TI
// Controlador único de comportamiento (SFA)
// =============================================================================

// =============================================================================
// PASO 1 — Helpers de visibilidad
// =============================================================================

function showElement(el) { el.classList.remove('is-hidden'); }
function hideElement(el) { el.classList.add('is-hidden');    }

// =============================================================================
// PASO 2 — Cache de referencias al DOM
// =============================================================================

var navLinks     = document.querySelectorAll('.nav__link');
var sections     = document.querySelectorAll('main > section');
var navToggle    = document.getElementById('nav-toggle');
var navMenu      = document.getElementById('nav-menu');
var faqContainer = document.getElementById('faq-container');
var cookieBanner = document.getElementById('cookie-banner');
var acceptBtn    = document.getElementById('cookie-accept-btn');
var rejectBtn    = document.getElementById('cookie-reject-btn');
var footerYear   = document.getElementById('footer-year');

// =============================================================================
// PASO 3 — Función de navegación entre secciones
// =============================================================================

function navigateTo(targetId) {
  var i;

  // 1. Ocultar todas las secciones
  for (i = 0; i < sections.length; i++) {
    hideElement(sections[i]);
  }

  // 2. Desactivar todos los nav links
  for (i = 0; i < navLinks.length; i++) {
    navLinks[i].classList.remove('is-active');
  }

  // 3. Mostrar la sección objetivo
  var targetSection = document.getElementById(targetId);
  if (targetSection) {
    showElement(targetSection);
  }

  // 4. Activar el nav link correspondiente
  for (i = 0; i < navLinks.length; i++) {
    if (navLinks[i].dataset.target === targetId) {
      navLinks[i].classList.add('is-active');
      break;
    }
  }

  // 5. Ir al tope de la página
  window.scrollTo(0, 0);

  // 6. Cerrar el menú móvil si está abierto
  if (navMenu && !navMenu.classList.contains('is-hidden')) {
    hideElement(navMenu);
    if (navToggle) {
      navToggle.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Abrir menú de navegación');
    }
  }
}

// =============================================================================
// PASO 4 — Listeners de navegación
// =============================================================================

for (var n = 0; n < navLinks.length; n++) {
  navLinks[n].addEventListener('click', function(e) {
    e.preventDefault();
    var target = this.dataset.target;
    if (target) { navigateTo(target); }
  });
}

// =============================================================================
// PASO 5 — Toggle del menú móvil
// =============================================================================

if (navToggle) {
  navToggle.addEventListener('click', function() {
    var isCurrentlyHidden = navMenu.classList.contains('is-hidden');

    navMenu.classList.toggle('is-hidden');
    navToggle.classList.toggle('is-open');

    // Sincronizar aria-expanded con el nuevo estado del menú:
    // si estaba oculto (isCurrentlyHidden=true) ahora se abre → expanded=true
    // si estaba visible (isCurrentlyHidden=false) ahora se cierra → expanded=false
    if (isCurrentlyHidden) {
      navToggle.setAttribute('aria-expanded', 'true');
      navToggle.setAttribute('aria-label', 'Cerrar menú de navegación');
    } else {
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Abrir menú de navegación');
    }
  });
}

// =============================================================================
// PASO 6 — Acordeón FAQ
// =============================================================================

function initFaq() {
  if (!faqContainer) { return; }

  var questions = faqContainer.querySelectorAll('.faq__question');

  for (var i = 0; i < questions.length; i++) {
    questions[i].addEventListener('click', function() {
      var parentItem = this.parentElement;
      var answer     = parentItem.querySelector('.faq__answer');
      var isOpen     = parentItem.classList.contains('is-open');

      // Cerrar todos los items abiertos
      var allItems = faqContainer.querySelectorAll('.faq__item');
      for (var j = 0; j < allItems.length; j++) {
        allItems[j].classList.remove('is-open');
        var openQuestion = allItems[j].querySelector('.faq__question');
        if (openQuestion) { openQuestion.setAttribute('aria-expanded', 'false'); }
        var openAnswer = allItems[j].querySelector('.faq__answer');
        if (openAnswer) { hideElement(openAnswer); }
      }

      // Si el item clicado NO estaba abierto, abrirlo
      if (!isOpen) {
        parentItem.classList.add('is-open');
        this.setAttribute('aria-expanded', 'true');
        if (answer) { showElement(answer); }
      }
    });
  }
}

// =============================================================================
// PASO 7 — Gestión del banner de cookies
// =============================================================================

function initCookieBanner() {
  var consent = localStorage.getItem('cookie_consent');

  if (consent === 'accepted' || consent === 'rejected') {
    // El banner ya inicia con is-hidden en el HTML; no es necesario ocultarlo
    // de nuevo, pero se llama hideElement por robustez ante cualquier estado.
    if (cookieBanner) { hideElement(cookieBanner); }
    if (consent === 'accepted') { activateAnalytics(); }
    return;
  }

  // Sin consentimiento previo: mostrar el banner
  if (cookieBanner) { showElement(cookieBanner); }

  if (acceptBtn) {
    acceptBtn.addEventListener('click', function() {
      localStorage.setItem('cookie_consent', 'accepted');
      hideElement(cookieBanner);
      document.body.classList.add('has-consent');
      activateAnalytics();
    });
  }

  if (rejectBtn) {
    rejectBtn.addEventListener('click', function() {
      localStorage.setItem('cookie_consent', 'rejected');
      hideElement(cookieBanner);
    });
  }
}

// =============================================================================
// PASO 8 — Activación de Google Analytics 4
// =============================================================================

function activateAnalytics() {
  if (window._gaActivated) { return; }
  window._gaActivated = true;

  var GA_ID = 'G-XXXXXXXXXX';

  // Inyectar el script de gtag.js
  var script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(script);

  // Inicializar dataLayer y gtag
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA_ID);
}

// =============================================================================
// PASO 9 — Datos hardcodeados: Historias
// =============================================================================

var historias = [
  {
    id:      'hist-001',
    titulo:  'Agile en la práctica: lecciones del campo',
    excerpt: 'Cómo los equipos de desarrollo adoptaron Scrum y transformaron su flujo de trabajo en menos de tres meses.',
    imagen:  'https://placehold.co/400x220',
    link:    '#'
  },
  {
    id:      'hist-002',
    titulo:  'DevOps: de la teoría al pipeline real',
    excerpt: 'Un equipo de infraestructura comparte su experiencia implementando CI/CD desde cero sin herramientas de pago.',
    imagen:  'https://placehold.co/400x220',
    link:    '#'
  },
  {
    id:      'hist-003',
    titulo:  'Kanban para equipos no técnicos',
    excerpt: 'La metodología Kanban no es exclusiva del software. Descubre cómo un equipo de marketing la adoptó con éxito.',
    imagen:  'https://placehold.co/400x220',
    link:    '#'
  }
];

// =============================================================================
// PASO 10 — Datos hardcodeados: Noticias
// =============================================================================

var noticias = [
  {
    id:      'news-001',
    titulo:  'ISO 27001:2022 — Novedades clave para equipos TI',
    excerpt: 'La nueva versión del estándar de seguridad de la información trae cambios estructurales que afectan a toda la industria.',
    fecha:   '10 Jun 2025',
    imagen:  'https://placehold.co/400x220',
    link:    '#'
  },
  {
    id:      'news-002',
    titulo:  'ITIL 4 y la gestión de servicios en la nube',
    excerpt: 'Cómo el marco ITIL 4 se adapta a entornos cloud-native y qué implica para los equipos de operaciones modernos.',
    fecha:   '05 Jun 2025',
    imagen:  'https://placehold.co/400x220',
    link:    '#'
  },
  {
    id:      'news-003',
    titulo:  'El auge de los marcos de trabajo híbridos en 2025',
    excerpt: 'Scrum, SAFe y Kanban conviven en organizaciones que buscan escalar sin perder agilidad. Un análisis del mercado actual.',
    fecha:   '01 Jun 2025',
    imagen:  'https://placehold.co/400x220',
    link:    '#'
  }
];

// =============================================================================
// PASO 11 — Renderizado de tarjetas
// =============================================================================

function renderCards(data, containerId, tipo) {
  var container = document.getElementById(containerId);
  if (!container) { return; }

  // Limpiar el contenedor antes de insertar
  container.innerHTML = '';

  for (var i = 0; i < data.length; i++) {
    var item = data[i];

    // Crear el article
    var article = document.createElement('article');
    article.className = 'card';
    article.id = DOMPurify.sanitize(item.id);

    // Imagen con lazy loading preservado (atributo nativo, no afectado por sanitización)
    var img = document.createElement('img');
    img.className = 'card__image';
    img.src = DOMPurify.sanitize(item.imagen);
    img.alt = DOMPurify.sanitize(item.titulo);
    img.loading = 'lazy';
    article.appendChild(img);

    // Cuerpo de la tarjeta
    var body = document.createElement('div');
    body.className = 'card__body';

    // Fecha (solo noticias)
    if (tipo === 'noticia' && item.fecha) {
      var dateSpan = document.createElement('span');
      dateSpan.className = 'card__date';
      dateSpan.textContent = DOMPurify.sanitize(item.fecha);
      body.appendChild(dateSpan);
    }

    // Título
    var title = document.createElement('h3');
    title.className = 'card__title';
    title.textContent = DOMPurify.sanitize(item.titulo);
    body.appendChild(title);

    // Excerpt
    var excerpt = document.createElement('p');
    excerpt.className = 'card__excerpt';
    excerpt.textContent = DOMPurify.sanitize(item.excerpt);
    body.appendChild(excerpt);

    // Enlace
    var link = document.createElement('a');
    link.className = 'card__link';
    link.href = DOMPurify.sanitize(item.link);
    link.textContent = 'Leer más';
    body.appendChild(link);

    article.appendChild(body);
    container.appendChild(article);
  }
}

// =============================================================================
// PASO 12 — Actualización del año en el footer
// =============================================================================

function updateFooterYear() {
  if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
  }
}

// =============================================================================
// PASO 13 — Inicialización
// =============================================================================

(function init() {
  // Renderizar contenido dinámico en los contenedores con ID correcto
  renderCards(historias, 'historias-grid', 'historia');
  renderCards(noticias,  'noticias-grid',  'noticia');

  // Actualizar año del footer
  updateFooterYear();

  // Inicializar componentes
  initFaq();
  initCookieBanner();

  // Establecer sección inicial
  navigateTo('section-home');
})();