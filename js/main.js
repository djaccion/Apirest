(function () {
  'use strict';

  const TSOFT_GREETINGS = {
    ar: {
      flag: '🇦🇷',
      country: 'Argentina',
      greeting: '¡Che, bienvenido al palo a TSOFT!'
    },
    mx: {
      flag: '🇲🇽',
      country: 'México',
      greeting: '¡Qué onda wey, bienvenido a TSOFT!'
    },
    co: {
      flag: '🇨🇴',
      country: 'Colombia',
      greeting: '¡Quiubo parce, bienvenido a TSOFT!'
    },
    cl: {
      flag: '🇨🇱',
      country: 'Chile',
      greeting: '¡Cachai, bienvenido a TSOFT, po!'
    },
    pe: {
      flag: '🇵🇪',
      country: 'Perú',
      greeting: '¡Causa, bienvenido a TSOFT!'
    },
    uy: {
      flag: '🇺🇾',
      country: 'Uruguay',
      greeting: '¡Bienvenido a TSOFT, ta buenísimo!'
    },
    br: {
      flag: '🇧🇷',
      country: 'Brasil',
      greeting: '¡Oi, bem-vindo à TSOFT!'
    },
    us: {
      flag: '🇺🇸',
      country: 'USA',
      greeting: 'Hey there, welcome to TSOFT!'
    }
  };

  var selectCountry   = document.getElementById('country-select');
  var greetingDisplay = document.getElementById('greeting-display');
  var flagDisplay     = document.getElementById('flag-display');
  var countryDisplay  = document.getElementById('country-display');

  function updateGreeting(countryCode) {
    var data = TSOFT_GREETINGS[countryCode];

    if (!data) {
      return;
    }

    flagDisplay.textContent     = data.flag;
    countryDisplay.textContent  = data.country;
    greetingDisplay.textContent = data.greeting;
  }

  selectCountry.addEventListener('change', function () {
    updateGreeting(selectCountry.value);
  });

})();