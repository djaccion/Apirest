'use strict';

const NAV_LINKS = ['#home', '#servicios', '#quienes-somos', '#contacto'];

const _closeMenu = (menuEl, toggleEl) => {
  menuEl.classList.remove('nav-menu--open');
  toggleEl.setAttribute('aria-expanded', 'false');
};

const initMobileMenu = () => {
  const toggleEl = document.getElementById('nav-toggle');
  const menuEl = document.getElementById('nav-menu');

  if (!toggleEl || !menuEl) return;

  toggleEl.addEventListener('click', (event) => {
    event.stopPropagation();
    const isExpanded = toggleEl.getAttribute('aria-expanded') === 'true';
    if (isExpanded) {
      _closeMenu(menuEl, toggleEl);
    } else {
      menuEl.classList.add('nav-menu--open');
      toggleEl.setAttribute('aria-expanded', 'true');
    }
  });

  document.addEventListener('click', (event) => {
    const clickedInsideMenu = event.target.closest('#nav-menu');
    const clickedToggle = event.target.closest('#nav-toggle');
    if (!clickedInsideMenu && !clickedToggle) {
      _closeMenu(menuEl, toggleEl);
    }
  });
};

const _setActiveLink = (activeSectionId) => {
  const links = document.querySelectorAll('#nav-menu a');
  links.forEach((link) => {
    if (link.getAttribute('href') === '#' + activeSectionId) {
      link.classList.add('nav-link--active');
      link.setAttribute('aria-current', 'page');
    } else {
      link.classList.remove('nav-link--active');
      link.removeAttribute('aria-current');
    }
  });
};

const initActiveNavHighlight = () => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          _setActiveLink(entry.target.id);
        }
      });
    },
    {
      threshold: 0.4,
      rootMargin: '-80px 0px 0px 0px',
    }
  );

  NAV_LINKS.forEach((selector) => {
    const sectionEl = document.querySelector(selector);
    if (sectionEl) {
      observer.observe(sectionEl);
    }
  });
};