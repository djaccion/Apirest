(function () {
  'use strict';

  /**
   * PASO 7 — Función utilitaria de sanitización DOMPurify
   * Declarada fuera del DOMContentLoaded para disponibilidad global en el archivo.
   */
  function sanitizeHTML(dirty) {
    if (window.DOMPurify && typeof window.DOMPurify.sanitize === 'function') {
      return window.DOMPurify.sanitize(dirty, { USE_PROFILES: { html: true } });
    }
    // Fallback seguro: escapar caracteres peligrosos si DOMPurify no está disponible
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(dirty));
    return div.innerHTML;
  }

  document.addEventListener('DOMContentLoaded', function () {

    // ─────────────────────────────────────────────────────────────────────────
    // PASO 1 — Captura de referencias DOM (bloque único al inicio)
    // ─────────────────────────────────────────────────────────────────────────
    var navToggle    = document.getElementById('nav-toggle');
    var navMenu      = document.getElementById('nav-menu');
    var navLinks     = document.querySelectorAll('.nav__link');
    var sections     = document.querySelectorAll('.section');
    var faqItems     = document.querySelectorAll('.faq__item');
    var cookieBanner = document.getElementById('cookie-banner');
    var cookieAccept = document.getElementById('cookie-accept');
    var cookieReject = document.getElementById('cookie-reject');
    var backToTop    = document.getElementById('back-to-top');

    // ─────────────────────────────────────────────────────────────────────────
    // PASO 2 — Módulo: Navegación móvil (hamburguesa)
    // ─────────────────────────────────────────────────────────────────────────
    function initMobileNav() {
      if (!navToggle || !navMenu) { return; }

      function openMenu() {
        navMenu.classList.add('is-visible');
        document.body.classList.add('has-overlay');
        navToggle.setAttribute('aria-expanded', 'true');
        navToggle.setAttribute('aria-label', 'Cerrar menú');
      }

      function closeMenu() {
        navMenu.classList.remove('is-visible');
        document.body.classList.remove('has-overlay');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Abrir menú');
      }

      navToggle.addEventListener('click', function () {
        if (navToggle.getAttribute('aria-expanded') === 'true') {
          closeMenu();
        } else {
          openMenu();
        }
      });

      navLinks.forEach(function (link) {
        link.addEventListener('click', function () {
          closeMenu();
        });
      });

      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
          closeMenu();
        }
      });

      window.addEventListener('resize', function () {
        if (window.innerWidth >= 768) {
          closeMenu();
        }
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PASO 3 — Módulo: Resaltado activo de navegación por scroll
    // ─────────────────────────────────────────────────────────────────────────
    function initScrollSpy() {
      if (!sections.length || !navLinks.length) { return; }

      window.addEventListener('scroll', function () {
        var activeSectionId = null;

        sections.forEach(function (section) {
          var top = section.getBoundingClientRect().top;
          if (top <= 80) {
            activeSectionId = section.getAttribute('id');
          }
        });

        navLinks.forEach(function (link) {
          link.classList.remove('is-active');
          if (activeSectionId && link.getAttribute('href') === '#' + activeSectionId) {
            link.classList.add('is-active');
          }
        });
      }, { passive: true });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PASO 4 — Módulo: Acordeón FAQ
    // FIX: El panel .faq__answer usa max-height vía CSS (.faq__item.is-open)
    // para su animación. El atributo hidden en .faq__answer colapsaría el
    // elemento con display:none, rompiendo la transición CSS de max-height.
    // Se elimina el uso de hidden en faq__answer y se delega el control
    // de visibilidad exclusivamente a la clase .is-open en el ítem padre,
    // tal como define el CSS. aria-expanded se mantiene en el botón.
    // ─────────────────────────────────────────────────────────────────────────
    function initFaq() {
      if (!faqItems.length) { return; }

      faqItems.forEach(function (item) {
        var button = item.querySelector('.faq__question');
        var panel  = item.querySelector('.faq__answer');

        if (!button || !panel) { return; }

        // Estado inicial: asegurar aria-expanded correcto
        button.setAttribute('aria-expanded', 'false');

        button.addEventListener('click', function () {
          var isOpen = item.classList.contains('is-open');

          // Cerrar=== INICIO archivo: assets/js/main.js ===
(function () {
  'use strict';

  /**
   * PASO 7 — Función utilitaria de sanitización DOMPurify
   * Declarada fuera del DOMContentLoaded para disponibilidad global en el archivo.
   */
  function sanitizeHTML(dirty) {
    if (window.DOMPurify && typeof window.DOMPurify.sanitize === 'function') {
      return window.DOMPurify.sanitize(dirty, { USE_PROFILES: { html: true } });
    }
    // Fallback seguro: escapar caracteres peligrosos si DOMPurify no está disponible
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(dirty));
    return div.innerHTML;
  }

  document.addEventListener('DOMContentLoaded', function () {

    // ─────────────────────────────────────────────────────────────────────────
    // PASO 1 — Captura de referencias DOM (bloque único al inicio)
    // ─────────────────────────────────────────────────────────────────────────
    var navToggle    = document.getElementById('nav-toggle');
    var navMenu      = document.getElementById('nav-menu');
    var navLinks     = document.querySelectorAll('.nav__link');
    var sections     = document.querySelectorAll('.section');
    var faqItems     = document.querySelectorAll('.faq__item');
    var cookieBanner = document.getElementById('cookie-banner');
    var cookieAccept = document.getElementById('cookie-accept');
    var cookieReject = document.getElementById('cookie-reject');
    var backToTop    = document.getElementById('back-to-top');

    // ─────────────────────────────────────────────────────────────────────────
    // PASO 2 — Módulo: Navegación móvil (hamburguesa)
    // ─────────────────────────────────────────────────────────────────────────
    function initMobileNav() {
      if (!navToggle || !navMenu) { return; }

      function openMenu() {
        navMenu.classList.add('is-visible');
        document.body.classList.add('has-overlay');
        navToggle.setAttribute('aria-expanded', 'true');
        navToggle.setAttribute('aria-label', 'Cerrar menú');
      }

      function closeMenu() {
        navMenu.classList.remove('is-visible');
        document.body.classList.remove('has-overlay');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Abrir menú');
      }

      navToggle.addEventListener('click', function () {
        if (navToggle.getAttribute('aria-expanded') === 'true') {
          closeMenu();
        } else {
          openMenu();
        }
      });

      navLinks.forEach(function (link) {
        link.addEventListener('click', function () {
          closeMenu();
        });
      });

      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
          closeMenu();
        }
      });

      window.addEventListener('resize', function () {
        if (window.innerWidth >= 768) {
          closeMenu();
        }
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PASO 3 — Módulo: Resaltado activo de navegación por scroll
    // ─────────────────────────────────────────────────────────────────────────
    function initScrollSpy() {
      if (!sections.length || !navLinks.length) { return; }

      window.addEventListener('scroll', function () {
        var activeSectionId = null;

        sections.forEach(function (section) {
          var top = section.getBoundingClientRect().top;
          if (top <= 80) {
            activeSectionId = section.getAttribute('id');
          }
        });

        navLinks.forEach(function (link) {
          link.classList.remove('is-active');
          if (activeSectionId && link.getAttribute('href') === '#' + activeSectionId) {
            link.classList.add('is-active');
          }
        });
      }, { passive: true });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PASO 4 — Módulo: Acordeón FAQ
    // FIX: El panel .faq__answer usa max-height vía CSS (.faq__item.is-open)
    // para su animación. El atributo hidden en .faq__answer colapsaría el
    // elemento con display:none, rompiendo la transición CSS de max-height.
    // Se elimina el uso de hidden en faq__answer y se delega el control
    // de visibilidad exclusivamente a la clase .is-open en el ítem padre.
    // aria-expanded se mantiene en el botón para accesibilidad.
    // ─────────────────────────────────────────────────────────────────────────
    function initFaq() {
      if (!faqItems.length) { return; }

      faqItems.forEach(function (item) {
        var button = item.querySelector('.faq__question');
        var panel  = item.querySelector('.faq__answer');

        if (!button || !panel) { return; }

        // Estado inicial: asegurar aria-expanded correcto
        button.setAttribute('aria-expanded', 'false');

        button.addEventListener('click', function () {
          var isOpen = item.classList.contains('is-open');

          // Cerrar TODOS los ítems primero
          faqItems.forEach(function (faqItem) {
            var faqQuestion = faqItem.querySelector('.faq__question');
            faqItem.classList.remove('is-open');
            if (faqQuestion) {
              faqQuestion.setAttribute('aria-expanded', 'false');
            }
          });

          // Si el ítem clickeado estaba cerrado, abrirlo
          if (!isOpen) {
            item.classList.add('is-open');
            button.setAttribute('aria-expanded', 'true');
          }
        });
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PASO 5 — Módulo: Banner de cookies
    // FIX #1 y #3: Se reemplaza removeAttribute('hidden') / setAttribute('hidden')
    // por classList.add('is-visible') / classList.remove('is-visible'), que es
    // el mecanismo exclusivo definido por el contrato para componentes con
    // animación CSS de opacity/transform. El atributo hidden NO se usa aquí.
    // ─────────────────────────────────────────────────────────────────────────
    function initCookieBanner() {
      if (!cookieBanner) { return; }

      var consent = localStorage.getItem('cookie_consent');

      if (consent === 'accepted' || consent === 'rejected') {
        // Ya hay decisión previa: el banner permanece oculto (sin .is-visible)
        cookieBanner.classList.remove('is-visible');
      } else {
        // Sin decisión previa: mostrar el banner con animación
        cookieBanner.classList.add('is-visible');
        document.body.classList.add('has-cookie-bar');
      }

      function dismissCookieBanner(decision) {
        localStorage.setItem('cookie_consent', decision);
        cookieBanner.classList.remove('is-visible');
        document.body.classList.remove('has-cookie-bar');
      }

      if (cookieAccept) {
        cookieAccept.addEventListener('click', function () {
          dismissCookieBanner('accepted');
        });
      }

      if (cookieReject) {
        cookieReject.addEventListener('click', function () {
          dismissCookieBanner('rejected');
        });
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PASO 6 — Módulo: Botón Back-to-Top
    // FIX #2 y #3: Se reemplaza removeAttribute('hidden') / setAttribute('hidden')
    // por classList.add('is-visible') / classList.remove('is-visible'), que es
    // el mecanismo exclusivo definido por el contrato para componentes con
    // animación CSS de opacity/transform. El atributo hidden NO se usa aquí.
    // ─────────────────────────────────────────────────────────────────────────
    function initBackToTop() {
      if (!backToTop) { return; }

      window.addEventListener('scroll', function () {
        if (window.scrollY > 300) {
          backToTop.classList.add('is-visible');
        } else {
          backToTop.classList.remove('is-visible');
        }
      }, { passive: true });

      backToTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Inicialización de todos los módulos
    // ─────────────────────────────────────────────────────────────────────────
    initMobileNav();
    initScrollSpy();
    initFaq();
    initCookieBanner();
    initBackToTop();

  });

  // Exponer sanitizeHTML al scope global del archivo por si otros bloques lo necesitan
  window._sanitizeHTML = sanitizeHTML;

}());