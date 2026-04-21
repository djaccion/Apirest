// =============================================================================
// GREETINGS_DATA — Array de datos hardcodeado. Fuente única de verdad.
// =============================================================================

const GREETINGS_DATA = [
  { country: "Argentina",      flag: "🇦🇷", greeting: "¡Buenas, che!",    language: "Español"    },
  { country: "Chile",          flag: "🇨🇱", greeting: "¡Hola, po!",       language: "Español"    },
  { country: "Colombia",       flag: "🇨🇴", greeting: "¡Quiubo, parce!",  language: "Español"    },
  { country: "México",         flag: "🇲🇽", greeting: "¡Qué onda, güey!", language: "Español"    },
  { country: "Perú",           flag: "🇵🇪", greeting: "¡Habla, causa!",   language: "Español"    },
  { country: "Uruguay",        flag: "🇺🇾", greeting: "¡Qué tal, bo!",    language: "Español"    },
  { country: "Brasil",         flag: "🇧🇷", greeting: "E aí, mano!",      language: "Português"  },
  { country: "España",         flag: "🇪🇸", greeting: "¡Buenas, tío!",    language: "Español"    },
  { country: "Estados Unidos", flag: "🇺🇸", greeting: "Hey, what's up!",  language: "English"    }
];

// =============================================================================
// renderGreetings — Construye y monta las tarjetas en #greetings-grid.
// =============================================================================

function renderGreetings() {
  var container = document.getElementById('greetings-grid');

  if (!container) {
    return;
  }

  GREETINGS_DATA.forEach(function (item) {
    var article = document.createElement('article');
    article.className = 'greeting-card';

    var flagSpan = document.createElement('span');
    flagSpan.className = 'card-flag';
    flagSpan.textContent = item.flag;

    var countryHeading = document.createElement('h2');
    countryHeading.className = 'card-country';
    countryHeading.textContent = item.country;

    var greetingParagraph = document.createElement('p');
    greetingParagraph.className = 'card-greeting';
    greetingParagraph.textContent = item.greeting;

    var languageSpan = document.createElement('span');
    languageSpan.className = 'card-language';
    languageSpan.textContent = item.language;

    article.appendChild(flagSpan);
    article.appendChild(countryHeading);
    article.appendChild(greetingParagraph);
    article.appendChild(languageSpan);

    container.appendChild(article);
  });
}

// =============================================================================
// initHamburgerMenu — Controla el toggle del menú hamburguesa en mobile.
// =============================================================================

function initHamburgerMenu() {
  var hamburgerBtn = document.getElementById('hamburger-btn');
  var navMenu      = document.getElementById('nav-menu');

  if (!hamburgerBtn || !navMenu) {
    return;
  }

  hamburgerBtn.addEventListener('click', function () {
    navMenu.classList.toggle('nav-open');
  });
}

// =============================================================================
// Punto de entrada único — Se ejecuta cuando el DOM está completamente listo.
// =============================================================================

document.addEventListener('DOMContentLoaded', function () {
  renderGreetings();
  initHamburgerMenu();
});