document.addEventListener('DOMContentLoaded', function () {

  // ─── UTILIDAD PRIVADA: escapeHTML ───────────────────────────────────────────
  function escapeHTML(str) {
    const textarea = document.createElement('textarea');
    textarea.textContent = str;
    return textarea.innerHTML;
  }

  // ─── FUNCIÓN PÚBLICA POR HOISTING: closeHamburger ──────────────────────────
  function closeHamburger() {
    const navMain   = document.getElementById('nav-main');
    const navToggle = document.getElementById('nav-toggle');
    if (navMain)   navMain.classList.remove('is-open');
    if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
    if (navToggle) navToggle.setAttribute('aria-label', 'Abrir menú');
    document.body.classList.remove('is-nav-open');
  }

  // ─── PASO 3: ROUTER HASH ────────────────────────────────────────────────────
  function initRouter() {
    const SECTION_IDS = [
      'section-home',
      'section-stories',
      'section-news',
      'section-faq'
    ];

    const HASH_MAP = {
      '#home':      'section-home',
      '#historias': 'section-stories',
      '#noticias':  'section-news',
      '#faq':       'section-faq'
    };

    function showSection(sectionId) {
      // Paso a: mostrar/ocultar secciones
      SECTION_IDS.forEach(function (id) {
        const el = document.getElementById(id);
        if (!el) return;
        if (id === sectionId) {
          el.removeAttribute('hidden');
        } else {
          el.setAttribute('hidden', '');
        }
      });

      // Paso b: actualizar nav items
      const navItems = document.querySelectorAll('.nav-main__item');
      navItems.forEach(function (item) {
        const link = item.querySelector('.nav-main__link');
        if (!link) return;
        if (link.dataset.section === sectionId) {
          item.classList.add('is-active');
          link.setAttribute('aria-current', 'page');
        } else {
          item.classList.remove('is-active');
          link.removeAttribute('aria-current');
        }
      });

      // Paso c: scroll al inicio de la sección visible
      const target = document.getElementById(sectionId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    function handleHash() {
      const hash = window.location.hash;
      const sectionId = HASH_MAP[hash] || 'section-home';
      showSection(sectionId);
    }

    // Registrar listeners
    window.addEventListener('hashchange', handleHash);
    handleHash(); // estado inicial

    // Cerrar menú móvil al navegar
    const navLinks = document.querySelectorAll('.nav-main__link');
    navLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        closeHamburger();
      });
    });
  }

  // ─── PASO 4: MENÚ HAMBURGUESA ───────────────────────────────────────────────
  function initHamburger() {
    const navToggle = document.getElementById('nav-toggle');
    const navMain   = document.getElementById('nav-main');

    if (!navToggle || !navMain) return;

    // Toggle al hacer click en el botón
    navToggle.addEventListener('click', function () {
      if (navMain.classList.contains('is-open')) {
        closeHamburger();
      } else {
        navMain.classList.add('is-open');
        navToggle.setAttribute('aria-expanded', 'true');
        navToggle.setAttribute('aria-label', 'Cerrar menú');
        document.body.classList.add('is-nav-open');
      }
    });

    // Cierre al hacer click fuera del nav
    document.addEventListener('click', function (event) {
      const navMainEl   = document.getElementById('nav-main');
      const navToggleEl = document.getElementById('nav-toggle');
      if (
        navMainEl &&
        navMainEl.classList.contains('is-open') &&
        !navMainEl.contains(event.target) &&
        event.target !== navToggleEl
      ) {
        closeHamburger();
      }
    });
  }

  // ─── PASO 5: ACORDEÓN FAQ ───────────────────────────────────────────────────
  function initFAQ() {
    const faqItems = document.querySelectorAll('.faq__item');

    faqItems.forEach(function (item) {
      const question = item.querySelector('.faq__question');
      if (!question) return;

      // Soporte de teclado: Enter y Space
      question.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          question.click();
        }
      });

      question.addEventListener('click', function () {
        // Paso a: determinar si ya está abierto
        const isOpen = item.classList.contains('is-open');

        // Paso b: cerrar todos los items
        faqItems.forEach(function (faqItem) {
          faqItem.classList.remove('is-open');
          const q = faqItem.querySelector('.faq__question');
          if (q) q.setAttribute('aria-expanded', 'false');
        });

        // Paso c: abrir el clickeado si estaba cerrado
        if (!isOpen) {
          item.classList.add('is-open');
          question.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  // ─── PASO 6: BANNER DE COOKIES ──────────────────────────────────────────────
  function initCookieBanner() {
    const COOKIE_KEY    = 'xp14_cookie_consent';
    const banner        = document.getElementById('cookie-banner');
    const btnAccept     = banner ? banner.querySelector('.cookie-banner__btn-accept') : null;
    const btnReject     = banner ? banner.querySelector('.cookie-banner__btn-reject') : null;

    if (!banner) return;

    const storedConsent = localStorage.getItem(COOKIE_KEY);

    if (storedConsent === 'accepted' || storedConsent === 'rejected') {
      // Ya decidió: ocultar banner
      banner.setAttribute('hidden', '');
      banner.setAttribute('aria-hidden', 'true');

      // Si aceptó previamente, cargar GA
      if (storedConsent === 'accepted') {
        loadGoogleAnalytics();
      }
      return;
    }

    // Mostrar banner (no hay decisión previa)
    banner.removeAttribute('hidden');
    banner.removeAttribute('aria-hidden');

    if (btnAccept) {
      btnAccept.addEventListener('click', function () {
        localStorage.setItem(COOKIE_KEY, 'accepted');
        banner.setAttribute('hidden', '');
        banner.setAttribute('aria-hidden', 'true');
        loadGoogleAnalytics();
      });
    }

    if (btnReject) {
      btnReject.addEventListener('click', function () {
        localStorage.setItem(COOKIE_KEY, 'rejected');
        banner.setAttribute('hidden', '');
        banner.setAttribute('aria-hidden', 'true');
      });
    }
  }

  // ─── PASO 7: CARGA CONDICIONAL DE GOOGLE ANALYTICS ─────────────────────────
  function loadGoogleAnalytics() {
    // GA solo se carga tras consentimiento explícito
    // Sustituir 'G-XXXXXXXXXX' por el Measurement ID real del proyecto
    const GA_ID = 'G-XXXXXXXXXX';

    // Evitar doble carga si ya existe el script
    if (document.querySelector('script[data-ga-loaded]')) return;

    const script = document.createElement('script');
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + escapeHTML(GA_ID);
    script.async = true;
    script.setAttribute('data-ga-loaded', 'true');
    document.head.appendChild(script);

    script.onload = function () {
      window.dataLayer = window.dataLayer || [];
      function gtag() {
        window.dataLayer.push(arguments);
      }
      gtag('js', new Date());
      gtag('config', GA_ID);
    };
  }

  // ─── PUNTO DE ENTRADA: inicialización ordenada ──────────────────────────────
  initRouter();
  initHamburger();
  initFAQ();
  initCookieBanner();

});