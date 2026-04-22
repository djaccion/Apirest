(function () {
  'use strict';

  // ─── BLOQUE A: Datos ────────────────────────────────────────────────────────
  const COUNTRIES = [
    { id: 'ar', flag: '🇦🇷', name: 'Argentina', phrase: '¡Che, bienvenidos a TSOFT!' },
    { id: 'cl', flag: '🇨🇱', name: 'Chile',     phrase: '¡Bienvenidos po, esto es TSOFT!' },
    { id: 'pe', flag: '🇵🇪', name: 'Perú',      phrase: '¡Causa, bienvenidos a TSOFT!' },
    { id: 'co', flag: '🇨🇴', name: 'Colombia',  phrase: '¡Quiubo parce, bienvenidos a TSOFT!' },
    { id: 'mx', flag: '🇲🇽', name: 'México',    phrase: '¡Órale, bienvenidos a TSOFT!' },
    { id: 'uy', flag: '🇺🇾', name: 'Uruguay',   phrase: '¡Bienvenidos gurises, esto es TSOFT!' },
    { id: 'br', flag: '🇧🇷', name: 'Brasil',    phrase: 'Bem-vindos ao TSOFT, mano!' },
    { id: 'es', flag: '🇪🇸', name: 'España',    phrase: '¡Tío, bienvenidos a TSOFT!' }
  ];

  // ─── BLOQUE B: Referencias DOM ──────────────────────────────────────────────
  const dropdown        = document.getElementById('country-dropdown');
  const trigger         = document.getElementById('dropdown-trigger');
  const menu            = document.getElementById('dropdown-menu');
  const greetingDisplay = document.getElementById('greeting-display');

  // ─── BLOQUE C: Funciones privadas auxiliares ────────────────────────────────

  function buildMenu() {
    COUNTRIES.forEach(function (country) {
      // Construye el <li> del dropdown
      const li = document.createElement('li');
      li.className = 'dropdown-option';
      li.dataset.country = country.id;

      const flagSpan = document.createElement('span');
      flagSpan.className = 'dropdown-flag';
      flagSpan.textContent = country.flag;

      const labelSpan = document.createElement('span');
      labelSpan.className = 'dropdown-label';
      labelSpan.textContent = country.name;

      li.appendChild(flagSpan);
      li.appendChild(labelSpan);
      menu.appendChild(li);

      // Construye el <article> de saludo
      const article = document.createElement('article');
      article.className = 'greeting-card';
      article.dataset.country = country.id;

      const flagP = document.createElement('p');
      flagP.className = 'greeting-flag';
      flagP.textContent = country.flag;

      const phraseP = document.createElement('p');
      phraseP.className = 'greeting-phrase';
      phraseP.textContent = country.phrase;

      const countryP = document.createElement('p');
      countryP.className = 'greeting-country';
      countryP.textContent = country.name;

      article.appendChild(flagP);
      article.appendChild(phraseP);
      article.appendChild(countryP);
      greetingDisplay.appendChild(article);
    });
  }

  function selectCountry(countryId) {
    // Paso 1: Cierra el dropdown
    dropdown.classList.remove('is-open');

    // Paso 2: Quita .is-selected de todas las opciones
    menu.querySelectorAll('.dropdown-option').forEach(function (el) {
      el.classList.remove('is-selected');
    });

    // Paso 3: Marca como seleccionada la opción del país elegido
    const selectedOption = menu.querySelector('[data-country="' + countryId + '"]');
    if (selectedOption) {
      selectedOption.classList.add('is-selected');
    }

    // Paso 4: Quita .is-active de todas las tarjetas de saludo
    greetingDisplay.querySelectorAll('.greeting-card').forEach(function (el) {
      el.classList.remove('is-active');
    });

    // Paso 5: Activa la tarjeta del país elegido
    const activeCard = greetingDisplay.querySelector('[data-country="' + countryId + '"]');
    if (activeCard) {
      activeCard.classList.add('is-active');
    }

    // Paso 6: Actualiza el texto del botón trigger
    const country = COUNTRIES.find(function (c) { return c.id === countryId; });
    if (country) {
      trigger.textContent = country.flag + ' ' + country.name;
    }
  }

  function toggleDropdown() {
    dropdown.classList.toggle('is-open');
  }

  // ─── BLOQUE D: Handlers de eventos ─────────────────────────────────────────

  // Handler 1: Clic en el botón trigger
  trigger.addEventListener('click', function (e) {
    e.stopPropagation();
    toggleDropdown();
  });

  // Handler 2: Clic en una opción del menú (delegación de eventos)
  menu.addEventListener('click', function (e) {
    const option = e.target.closest('.dropdown-option');
    if (!option) return;
    selectCountry(option.dataset.country);
  });

  // Handler 3: Clic fuera del dropdown (cierre automático)
  document.addEventListener('click', function () {
    dropdown.classList.remove('is-open');
  });

  // ─── BLOQUE E: Inicialización ───────────────────────────────────────────────
  buildMenu();
  selectCountry('ar');

})();