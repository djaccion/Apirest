document.addEventListener('DOMContentLoaded', function () {
  const toggleBtn = document.getElementById('menu-toggle');
  const navMenu   = document.getElementById('nav-menu');

  if (!toggleBtn || !navMenu) return;

  toggleBtn.addEventListener('click', function () {
    navMenu.classList.toggle('nav-open');
    const isOpen = navMenu.classList.contains('nav-open');
    toggleBtn.setAttribute('aria-expanded', String(isOpen));
  });

  document.addEventListener('click', function (event) {
    if (!navMenu.classList.contains('nav-open')) return;
    if (navMenu.contains(event.target) || toggleBtn.contains(event.target)) return;
    navMenu.classList.remove('nav-open');
    toggleBtn.setAttribute('aria-expanded', 'false');
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 768) {
      navMenu.classList.remove('nav-open');
      toggleBtn.setAttribute('aria-expanded', 'false');
    }
  });
});