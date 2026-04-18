function getActivePage() {
  const page = window.location.pathname.split('/').pop();
  if (page === '' || page === 'index.html') {
    return 'index.html';
  }
  return page;
}

function buildNavLinks(activePage) {
  const links = [
    { href: 'index.html', label: 'Home' },
    { href: 'servicios.html', label: 'Servicios' },
    { href: 'quienes-somos.html', label: 'Quiénes Somos' },
    { href: 'contacto.html', label: 'Contacto' },
  ];

  return links
    .map((item) => {
      const isActive = item.href === activePage;
      const activeAttr = isActive
        ? ' class="nav__link nav__link--active" aria-current="page"'
        : ' class="nav__link"';
      return `<li><a href="${item.href}"${activeAttr}>${item.label}</a></li>`;
    })
    .join('');
}

export function renderNavbar() {
  const placeholder = document.getElementById('navbar-placeholder');
  if (!placeholder) {
    return;
  }

  const activePage = getActivePage();
  const navLinks = buildNavLinks(activePage);

  placeholder.innerHTML = `
<nav class="navbar" role="navigation" aria-label="Navegación principal">
  <div class="navbar__brand">
    <a href="index.html">
      <img
        src="https://placehold.co/140x40"
        alt="Logo Productora"
        width="140"
        height="40"
      />
    </a>
  </div>
  <ul class="navbar__links" role="list">
    ${navLinks}
  </ul>
  <button
    class="navbar__toggle"
    aria-expanded="false"
    aria-controls="navbar__links"
    aria-label="Abrir menú"
    type="button"
  >
    <span class="navbar__toggle-icon" aria-hidden="true"></span>
  </button>
</nav>`;
}