import { initI18n } from './i18n.js';
import { initContactForm } from './contact.js';

document.addEventListener('DOMContentLoaded', () => {
  initI18n();
  initContactForm();
  initStickyNav();
  const navMenu = initMobileMenu();
  initSmoothScroll(navMenu);
});

function initStickyNav() {
  const header = document.getElementById('main-header');
  if (!header) return;

  window.addEventListener('scroll', () => {
    header.classList.toggle('nav--scrolled', window.scrollY > 80);
  });
}

function initMobileMenu() {
  const toggleBtn = document.getElementById('menu-toggle');
  const navMenu = document.getElementById('nav-menu');
  if (!toggleBtn || !navMenu) return null;

  toggleBtn.addEventListener('click', () => {
    navMenu.classList.toggle('nav-menu--open');
    const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
    toggleBtn.setAttribute('aria-expanded', String(!isExpanded));
  });

  function closeMenuOnOutsideClick(event) {
    if (navMenu.contains(event.target) || toggleBtn.contains(event.target)) return;
    navMenu.classList.remove('nav-menu--open');
    toggleBtn.setAttribute('aria-expanded', 'false');
  }

  document.addEventListener('click', closeMenuOnOutsideClick);

  return navMenu;
}

function initSmoothScroll(navMenu) {
  const anchors = document.querySelectorAll('a[href^="#"]');

  anchors.forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      event.preventDefault();
      const targetId = anchor.getAttribute('href');
      const targetEl = document.querySelector(targetId);
      if (!targetEl) return;

      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

      if (navMenu && navMenu.classList.contains('nav-menu--open')) {
        navMenu.classList.remove('nav-menu--open');
        const toggleBtn = document.getElementById('menu-toggle');
        if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
      }
    });
  });
}