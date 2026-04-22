(function () {
  'use strict';

  const COUNTRIES = [
    {
      id: 'mexico',
      lang: 'es-MX',
      flag: '🇲🇽',
      name: 'México',
      greeting: '¡Qué onda wey, bienvenido al equipo!'
    },
    {
      id: 'colombia',
      lang: 'es-CO',
      flag: '🇨🇴',
      name: 'Colombia',
      greeting: '¡Quiubo parce, todo bien con vos!'
    },
    {
      id: 'argentina',
      lang: 'es-AR',
      flag: '🇦🇷',
      name: 'Argentina',
      greeting: '¡Che boludo, re copado laburar acá!'
    },
    {
      id: 'chile',
      lang: 'es-CL',
      flag: '🇨🇱',
      name: 'Chile',
      greeting: '¡Cachai po, bienvenido a la wea!'
    },
    {
      id: 'peru',
      lang: 'es-PE',
      flag: '🇵🇪',
      name: 'Perú',
      greeting: '¡Causa, qué bacán estar con ustedes!'
    },
    {
      id: 'usa',
      lang: 'en-US',
      flag: '🇺🇸',
      name: 'USA',
      greeting: "Hey y'all, mighty glad you're here!"
    },
    {
      id: 'españa',
      lang: 'es-ES',
      flag: '🇪🇸',
      name: 'España',
      greeting: '¡Tío, qué guay molar en este equipo!'
    }
  ];

  const toggleBtn       = document.querySelector('#country-dropdown .dropdown__toggle');
  const toggleFlag      = document.querySelector('#country-dropdown .dropdown__toggle-flag');
  const toggleLabel     = document.querySelector('#country-dropdown .dropdown__toggle-label');
  const dropdownMenu    = document.querySelector('#country-dropdown .dropdown__menu');
  const greetingDisplay = document.querySelector('#greeting-display');
  const greetingFlag    = document.querySelector('#greeting-display .greeting__flag');
  const greetingPhrase  = document.querySelector('#greeting-display .greeting__phrase');
  const greetingCountry = document.querySelector('#greeting-display .greeting__country');

  function updateGreeting(country) {
    greetingFlag.textContent    = country.flag;
    greetingPhrase.textContent  = country.greeting;
    greetingCountry.textContent = country.name;
    document.documentElement.setAttribute('lang', country.lang);
    greetingDisplay.classList.add('is-active');
  }

  function closeDropdown() {
    dropdownMenu.classList.remove('is-active');
    toggleBtn.classList.remove('is-active');
  }

  function handleItemClick(event) {
    var item      = event.currentTarget;
    var countryId = item.dataset.countryId;
    var country   = COUNTRIES.find(function (c) { return c.id === countryId; });
    if (!country) { return; }
    toggleFlag.textContent  = country.flag;
    toggleLabel.textContent = country.name;
    updateGreeting(country);
    closeDropdown();
  }

  function handleToggleClick() {
    dropdownMenu.classList.toggle('is-active');
    toggleBtn.classList.toggle('is-active');
  }

  function handleDocumentClick(event) {
    var dropdown = document.querySelector('#country-dropdown');
    if (!dropdown.contains(event.target)) {
      closeDropdown();
    }
  }

  function init() {
    toggleBtn.addEventListener('click', handleToggleClick);

    var items = dropdownMenu.querySelectorAll('.dropdown__item');
    items.forEach(function (item) {
      item.addEventListener('click', handleItemClick);
    });

    document.addEventListener('click', handleDocumentClick);
  }

  init();

})();