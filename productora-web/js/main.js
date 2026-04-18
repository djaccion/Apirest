const NAVBAR_SCROLL_THRESHOLD = 50;
const ANIMATION_THRESHOLD = 0.15;
const DEFAULT_LANG = 'es';

const TRANSLATIONS = {
  es: {
    'nav.home':        'Inicio',
    'nav.servicios':   'Servicios',
    'nav.nosotros':    'Nosotros',
    'nav.contacto':    'Contacto',
    'hero.title':      'Creamos experiencias visuales que impactan',
    'hero.subtitle':   'Producción audiovisual profesional para marcas que quieren destacar.',
    'hero.cta':        'Hablemos',
    'servicios.title': 'Nuestros Servicios',
    'servicios.subtitle': 'Todo lo que necesitas para contar tu historia.',
    'servicio.video.title': 'Video Corporativo',
    'servicio.video.desc':  'Producción integral de videos institucionales, comerciales y de producto.',
    'servicio.foto.title':  'Fotografía',
    'servicio.foto.desc':   'Sesiones fotográficas profesionales para productos, eventos y equipos.',
    'servicio.motion.title':'Motion Graphics',
    'servicio.motion.desc': 'Animaciones y gráficos en movimiento para potenciar tu comunicación digital.',
    'servicio.live.title':  'Transmisión en Vivo',
    'servicio.live.desc':   'Cobertura y streaming profesional de eventos corporativos y lanzamientos.',
    'about.title':     'Quiénes Somos',
    'about.text':      'Somos una productora audiovisual con más de 10 años de experiencia creando contenido de alto impacto para empresas líderes en distintas industrias. Nuestro equipo combina talento creativo con tecnología de punta para entregar resultados que superan expectativas.',
    'stat.proyectos':  'Proyectos',
    'stat.clientes':   'Clientes',
    'stat.anos':       'Años de experiencia',
    'contacto.title':  'Contáctanos',
    'contacto.subtitle': 'Cuéntanos tu proyecto y te respondemos en menos de 24 horas.',
    'form.nombre':     'Nombre',
    'form.email':      'Correo electrónico',
    'form.mensaje':    'Mensaje',
    'form.submit':     'Enviar mensaje',
    'footer.rights':   'Todos los derechos reservados.',
  },
  en: {
    'nav.home':        'Home',
    'nav.servicios':   'Services',
    'nav.nosotros':    'About',
    'nav.contacto':    'Contact',
    'hero.title':      'We create visual experiences that make an impact',
    'hero.subtitle':   'Professional audiovisual production for brands that want to stand out.',
    'hero.cta':        'Let\'s talk',
    'servicios.title': 'Our Services',
    'servicios.subtitle': 'Everything you need to tell your story.',
    'servicio.video.title': 'Corporate Video',
    'servicio.video.desc':  'Full production of institutional, commercial and product videos.',
    'servicio.foto.title':  'Photography',
    'servicio.foto.desc':   'Professional photo sessions for products, events and teams.',
    'servicio.motion.title':'Motion Graphics',
    'servicio.motion.desc': 'Animations and motion graphics to boost your digital communication.',
    'servicio.live.title':  'Live Streaming',
    'servicio.live.desc':   'Professional coverage and streaming for corporate events and launches.',
    'about.title':     'About Us',
    'about.text':      'We are an audiovisual production company with over 10 years of experience creating high-impact content for leading companies across different industries. Our team combines creative talent with cutting-edge technology to deliver results that exceed expectations.',
    'stat.proyectos':  'Projects',
    'stat.clientes':   'Clients',
    'stat.anos':       'Years of experience',
    'contacto.title':  'Contact Us',
    'contacto.subtitle': 'Tell us about your project and we\'ll get back to you within 24 hours.',
    'form.nombre':     'Name',
    'form.email':      'Email address',
    'form.mensaje':    'Message',
    'form.submit':     'Send message',
    'footer.rights':   'All rights reserved.',
  }
};

function initNavbar() {
  var navbar = document.querySelector('.navbar');
  if (!navbar) return;

  window.addEventListener('scroll', function () {
    if (window.scrollY > NAVBAR_SCROLL_THRESHOLD) {
      navbar.classList.add('navbar--scrolled');
    } else {
      navbar.classList.remove('navbar--scrolled');
    }
  });
}

function initSmoothScroll() {
  var links = document.querySelectorAll('a[href^="#"]');

  links.forEach(function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault();
      var href = link.getAttribute('href');
      var target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

function initScrollAnimations() {
  var elements = document.querySelectorAll('.animate-on-scroll');
  if (elements.length === 0) return;

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: ANIMATION_THRESHOLD });

  elements.forEach(function (element) {
    observer.observe(element);
  });
}

function initLangToggle() {
  var currentLang = DEFAULT_LANG;
  var toggleBtn = document.querySelector('.navbar__lang-toggle');
  if (!toggleBtn) return;

  function applyTranslations(lang) {
    var nodes = document.querySelectorAll('[data-i18n]');
    nodes.forEach(function (node) {
      var key = node.getAttribute('data-i18n');
      var translation = TRANSLATIONS[lang] && TRANSLATIONS[lang][key];
      if (translation !== undefined) {
        node.textContent = translation;
      }
    });

    var placeholderNodes = document.querySelectorAll('[data-i18n-placeholder]');
    placeholderNodes.forEach(function (node) {
      var key = node.getAttribute('data-i18n-placeholder');
      var translation = TRANSLATIONS[lang] && TRANSLATIONS[lang][key];
      if (translation !== undefined) {
        node.setAttribute('placeholder', translation);
      }
    });
  }

  toggleBtn.addEventListener('click', function () {
    currentLang = currentLang === 'es' ? 'en' : 'es';
    toggleBtn.textContent = currentLang === 'es' ? 'EN' : 'ES';
    applyTranslations(currentLang);
  });

  applyTranslations(currentLang);
}

function initMobileMenu() {
  var toggleBtn = document.querySelector('.navbar__toggle');
  var menu = document.querySelector('.navbar__menu');
  if (!toggleBtn || !menu) return;

  toggleBtn.addEventListener('click', function () {
    var isOpen = menu.classList.toggle('navbar__menu--open');
    toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  var menuLinks = menu.querySelectorAll('a');
  menuLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      menu.classList.remove('navbar__menu--open');
      toggleBtn.setAttribute('aria-expanded', 'false');
    });
  });
}

document.addEventListener('DOMContentLoaded', function () {
  initNavbar();
  initSmoothScroll();
  initScrollAnimations();
  initLangToggle();
  initMobileMenu();

  if (typeof initContactForm === 'function') {
    initContactForm();
  }
});