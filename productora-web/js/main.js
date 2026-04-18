document.addEventListener('DOMContentLoaded', function () {

  // ─── PASO 1: Leer configuración de idioma desde la URL ───────────────────
  var params = new URLSearchParams(window.location.search);
  var currentLang = params.get('lang') === 'en' ? 'en' : 'es';

  // ─── PASO 2: Menú hamburguesa ─────────────────────────────────────────────
  var menuToggle = document.getElementById('menu-toggle');
  var mainNav = document.getElementById('main-nav');

  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', function () {
      var isOpen = mainNav.classList.toggle('nav--open');
      menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    var navLinks = mainNav.querySelectorAll('a');
    navLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        mainNav.classList.remove('nav--open');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ─── PASO 3: Scroll suave hacia anclas internas ───────────────────────────
  var anchorLinks = document.querySelectorAll('a[href^="#"]');
  anchorLinks.forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      var targetId = anchor.getAttribute('href').slice(1);
      var targetEl = document.getElementById(targetId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ─── PASO 4: Animaciones de entrada por scroll ────────────────────────────
  var animatedEls = document.querySelectorAll('.animate-on-scroll');
  if (animatedEls.length > 0) {
    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    animatedEls.forEach(function (el) {
      observer.observe(el);
    });
  }

  // ─── PASO 5: Marcar enlace de navegación activo ───────────────────────────
  var currentPath = window.location.pathname;
  if (mainNav) {
    var allNavLinks = mainNav.querySelectorAll('a');
    allNavLinks.forEach(function (link) {
      var linkHref = link.getAttribute('href');
      if (linkHref && (currentPath === linkHref || currentPath.endsWith(linkHref))) {
        link.classList.add('nav__link--active');
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  // ─── PASO 6: Switcher de idioma ───────────────────────────────────────────
  function buildLangUrl(lang) {
    var base = window.location.pathname;
    return lang === 'en' ? base + '?lang=en' : base;
  }

  var langSwitcher = document.getElementById('lang-switcher');
  if (langSwitcher) {
    langSwitcher.textContent = currentLang === 'es' ? 'EN' : 'ES';

    langSwitcher.addEventListener('click', function (e) {
      e.preventDefault();
      var targetLang = currentLang === 'es' ? 'en' : 'es';
      window.location.href = buildLangUrl(targetLang);
    });
  }

});