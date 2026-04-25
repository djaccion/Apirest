'use strict';

// ============================================================
// BLOQUE 0 — Constantes globales
// ============================================================

const SECTIONS = ['section-home', 'section-stories', 'section-news'];

const NAV_HASH_MAP = {
  '':         'section-home',
  '#home':    'section-home',
  '#stories': 'section-stories',
  '#news':    'section-news'
};

// ============================================================
// BLOQUE 1 — Utilidad escapeHTML (fuera del listener, pura)
// ============================================================

function escapeHTML(str) {
  var textarea = document.createElement('textarea');
  textarea.textContent = str;
  return textarea.innerHTML;
}

// ============================================================
// BLOQUE 2 — Módulo de Navegación
// ============================================================

function showSection(targetId, navMain, navMobileMenu) {
  SECTIONS.forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.classList.add('is-hidden');
  });

  var target = document.getElementById(targetId);
  if (target) target.classList.remove('is-hidden');

  var navItems = [];
  if (navMain) {
    var mainItems = navMain.querySelectorAll('[data-target]');
    mainItems.forEach(function (item) { navItems.push(item); });
  }
  if (navMobileMenu) {
    var mobileItems = navMobileMenu.querySelectorAll('[data-target]');
    mobileItems.forEach(function (item) { navItems.push(item); });
  }

  navItems.forEach(function (item) {
    if (item.getAttribute('data-target') === targetId) {
      item.classList.add('is-active');
    } else {
      item.classList.remove('is-active');
    }
  });

  window.scrollTo(0, 0);
}

function navigateTo(hash, navMain, navMobileMenu) {
  var targetId = NAV_HASH_MAP[hash] !== undefined
    ? NAV_HASH_MAP[hash]
    : 'section-home';

  showSection(targetId, navMain, navMobileMenu);

  var desiredHash = hash || '#home';
  if (window.location.hash !== desiredHash) {
    history.pushState(null, '', desiredHash);
  }
}

function resolveHashFromDataTarget(dataTarget) {
  if (dataTarget === 'section-home') return '#home';
  return '#' + dataTarget.replace('section-', '');
}

function initNavigation(navMain, navMobileMenu, navMobileToggle) {
  navigateTo(window.location.hash, navMain, navMobileMenu);

  window.addEventListener('popstate', function () {
    navigateTo(window.location.hash, navMain, navMobileMenu);
  });

  function handleNavClick(event) {
    var el = event.target.closest('[data-target]');
    if (!el) return;
    event.preventDefault();
    var dataTarget = el.getAttribute('data-target');
    var hash = resolveHashFromDataTarget(dataTarget);
    navigateTo(hash, navMain, navMobileMenu);
    if (navMobileMenu && !navMobileMenu.classList.contains('is-hidden')) {
      closeMobileMenu(navMobileMenu, navMobileToggle);
    }
  }

  if (navMain) navMain.addEventListener('click', handleNavClick);
  if (navMobileMenu) navMobileMenu.addEventListener('click', handleNavClick);
}

// ============================================================
// BLOQUE 3 — Módulo de Menú Móvil
// ============================================================

function closeMobileMenu(navMobileMenu, navMobileToggle) {
  navMobileMenu.classList.add('is-hidden');
  navMobileToggle.classList.remove('is-open');
  document.body.classList.remove('has-overlay');
}

function initMobileMenu(navMobileMenu, navMobileToggle) {
  navMobileToggle.addEventListener('click', function () {
    if (navMobileMenu.classList.contains('is-hidden')) {
      navMobileMenu.classList.remove('is-hidden');
      navMobileToggle.classList.add('is-open');
      document.body.classList.add('has-overlay');
    } else {
      closeMobileMenu(navMobileMenu, navMobileToggle);
    }
  });
}

// ============================================================
// BLOQUE 4 — Módulo FAQ (acordeón no exclusivo)
// ============================================================

function initFAQ(faqList) {
  if (!faqList) return;

  faqList.addEventListener('click', function (event) {
    var questionBtn = event.target.closest('.faq__question');
    if (!questionBtn) return;

    var item = questionBtn.closest('.faq__item');
    if (!item) return;

    var answer = item.querySelector('.faq__answer');
    if (!answer) return;

    if (item.classList.contains('is-open')) {
      item.classList.remove('is-open');
      answer.classList.add('is-hidden');
      questionBtn.setAttribute('aria-expanded', 'false');
    } else {
      item.classList.add('is-open');
      answer.classList.remove('is-hidden');
      questionBtn.setAttribute('aria-expanded', 'true');
    }
  });
}

// ============================================================
// BLOQUE 5 — Módulo de Búsqueda
// ============================================================

var SEARCH_DATA = [
  {
    id: 1,
    title: 'Metodología Agile: Principios y Valores',
    excerpt: 'Agile es un conjunto de principios para el desarrollo de software que prioriza la colaboración, la adaptación al cambio y la entrega continua de valor.',
    section: 'stories',
    tags: ['agile', 'metodología', 'scrum']
  },
  {
    id: 2,
    title: 'Scrum: El Framework Ágil más Popular',
    excerpt: 'Scrum organiza el trabajo en sprints de duración fija, con roles definidos como Product Owner, Scrum Master y el equipo de desarrollo.',
    section: 'stories',
    tags: ['scrum', 'agile', 'sprints']
  },
  {
    id: 3,
    title: 'Kanban: Visualiza tu Flujo de Trabajo',
    excerpt: 'Kanban utiliza tableros visuales para gestionar el trabajo en progreso y optimizar el flujo de tareas en equipos de TI.',
    section: 'stories',
    tags: ['kanban', 'flujo', 'visualización']
  },
  {
    id: 4,
    title: 'DevOps: Uniendo Desarrollo y Operaciones',
    excerpt: 'DevOps es una cultura y conjunto de prácticas que une los equipos de desarrollo y operaciones para acelerar la entrega de software.',
    section: 'news',
    tags: ['devops', 'ci/cd', 'automatización']
  },
  {
    id: 5,
    title: 'ITIL 4: Gestión de Servicios de TI',
    excerpt: 'ITIL 4 es el marco de referencia más adoptado para la gestión de servicios de TI, con un enfoque en la creación de valor.',
    section: 'news',
    tags: ['itil', 'gestión', 'servicios']
  },
  {
    id: 6,
    title: 'Lean IT: Eliminando el Desperdicio en TI',
    excerpt: 'Lean IT aplica los principios de manufactura esbelta al sector tecnológico para maximizar el valor y minimizar el desperdicio.',
    section: 'stories',
    tags: ['lean', 'eficiencia', 'mejora continua']
  }
];

function matchesQuery(article, query) {
  var q = query.toLowerCase().trim();
  if (!q) return false;
  var inTitle   = article.title.toLowerCase().indexOf(q) !== -1;
  var inExcerpt = article.excerpt.toLowerCase().indexOf(q) !== -1;
  var inTags    = article.tags.some(function (tag) {
    return tag.toLowerCase().indexOf(q) !== -1;
  });
  return inTitle || inExcerpt || inTags;
}

function buildResultHTML(article) {
  var safeTitle   = escapeHTML(article.title);
  var safeExcerpt = escapeHTML(article.excerpt);
  var safeSection = escapeHTML(article.section);
  var safeTag     = escapeHTML(article.tags[0] || '');

  return '<article class="card">' +
    '<div class="card__body">' +
      '<span class="card__tag">' + safeTag + '</span>' +
      '<h3 class="card__title">' + safeTitle + '</h3>' +
      '<p class="card__excerpt">' + safeExcerpt + '</p>' +
      '<a href="#' + safeSection + '" class="card__link" data-target="section-' + safeSection + '">' +
        'Ver sección' +
      '</a>' +
    '</div>' +
  '</article>';
}

function renderSearchResults(results, searchResults) {
  if (!searchResults) return;

  if (results.length === 0) {
    searchResults.innerHTML = DOMPurify.sanitize(
      '<p class="search__no-results">No se encontraron resultados.</p>'
    );
    searchResults.classList.remove('is-hidden');
    return;
  }

  var html = results.map(buildResultHTML).join('');
  searchResults.innerHTML = DOMPurify.sanitize(html);
  searchResults.classList.remove('is-hidden');
}

function performSearch(searchInput, searchResults) {
  var rawQuery = searchInput ? searchInput.value : '';
  var query    = rawQuery.trim();

  if (!query) {
    if (searchResults) searchResults.classList.add('is-hidden');
    return;
  }

  var results = SEARCH_DATA.filter(function (article) {
    return matchesQuery(article, query);
  });

  renderSearchResults(results, searchResults);
}

function initSearch(searchInput, searchBtn, searchResults) {
  if (!searchBtn || !searchInput) return;

  searchBtn.addEventListener('click', function () {
    performSearch(searchInput, searchResults);
  });

  searchInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      performSearch(searchInput, searchResults);
    }
  });
}

// ============================================================
// BLOQUE 6 — Módulo de Cookies y Google Analytics
// ============================================================

var GA_ID = 'G-XXXXXXXXXX';

function loadGoogleAnalytics() {
  var script = document.createElement('script');
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  script.async = true;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA_ID, { anonymize_ip: true });
}

function hideCookieBanner(cookieBanner) {
  if (cookieBanner) cookieBanner.classList.add('is-hidden');
}

function initCookieBanner(cookieBanner, cookieAcceptBtn, cookieRejectBtn) {
  if (!cookieBanner) return;

  var consent = localStorage.getItem('cookie-consent');

  if (consent === 'accepted') {
    hideCookieBanner(cookieBanner);
    loadGoogleAnalytics();
    return;
  }

  if (consent === 'rejected') {
    hideCookieBanner(cookieBanner);
    return;
  }

  cookieBanner.classList.remove('is-hidden');

  if (cookieAcceptBtn) {
    cookieAcceptBtn.addEventListener('click', function () {
      localStorage.setItem('cookie-consent', 'accepted');
      hideCookieBanner(cookieBanner);
      loadGoogleAnalytics();
    });
  }

  if (cookieRejectBtn) {
    cookieRejectBtn.addEventListener('click', function () {
      localStorage.setItem('cookie-consent', 'rejected');
      hideCookieBanner(cookieBanner);
    });
  }
}

// ============================================================
// BLOQUE 7 — Bootstrap: DOMContentLoaded
// ============================================================

document.addEventListener('DOMContentLoaded', function () {
  var navMain         = document.getElementById('nav-main');
  var navMobileToggle = document.getElementById('nav-mobile-toggle');
  var navMobileMenu   = document.getElementById('nav-mobile-menu');
  var cookieBanner    = document.getElementById('cookie-banner');
  var cookieAcceptBtn = document.getElementById('cookie-accept-btn');
  var cookieRejectBtn = document.getElementById('cookie-reject-btn');
  var faqList         = document.getElementById('faq-list');
  var searchInput     = document.getElementById('search-input');
  var searchBtn       = document.getElementById('search-btn');
  var searchResults   = document.getElementById('search-results');

  initNavigation(navMain, navMobileMenu, navMobileToggle);
  initMobileMenu(navMobileMenu, navMobileToggle);
  initFAQ(faqList);
  initSearch(searchInput, searchBtn, searchResults);
  initCookieBanner(cookieBanner, cookieAcceptBtn, cookieRejectBtn);
});