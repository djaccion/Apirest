'use strict';

/* ==========================================================================
   BLOQUE 1 — CONSTANTES DE CONFIGURACIÓN
   ========================================================================== */

const CONTAINER = document.getElementById('greetings-container');
const LANGUAGE_SELECTOR = document.getElementById('language-selector');
const MAIN_TITLE = document.getElementById('main-title');
const MAIN_SUBTITLE = document.getElementById('main-subtitle');
const DEFAULT_LANG = 'es';

/* ==========================================================================
   BLOQUE 2 — FUNCIONES DE CREACIÓN DE ELEMENTOS DOM
   ========================================================================== */

function createGreetingCard(greetingData) {
    var countryCode = greetingData.countryCode;
    var countryName = greetingData.countryName;
    var flag = greetingData.flag;
    var greeting = greetingData.greeting;
    var formalGreeting = greetingData.formalGreeting;
    var region = greetingData.region;

    var article = document.createElement('article');
    article.className = 'card';
    article.setAttribute('data-country', countryCode);
    article.setAttribute('data-region', region);

    var header = document.createElement('div');
    header.className = 'card__header';

    var flagSpan = document.createElement('span');
    flagSpan.className = 'card__flag';
    flagSpan.textContent = flag;

    var countryHeading = document.createElement('h2');
    countryHeading.className = 'card__country-name';
    countryHeading.textContent = countryName;

    header.appendChild(flagSpan);
    header.appendChild(countryHeading);

    var body = document.createElement('div');
    body.className = 'card__body';

    var greetingParagraph = document.createElement('p');
    greetingParagraph.className = 'card__greeting';
    greetingParagraph.textContent = greeting;

    var formalParagraph = document.createElement('p');
    formalParagraph.className = 'card__formal';
    formalParagraph.textContent = formalGreeting;

    body.appendChild(greetingParagraph);
    body.appendChild(formalParagraph);

    var footer = document.createElement('footer');
    footer.className = 'card__footer';

    var regionSpan = document.createElement('span');
    regionSpan.className = 'card__region';
    regionSpan.textContent = region;

    footer.appendChild(regionSpan);

    article.appendChild(header);
    article.appendChild(body);
    article.appendChild(footer);

    return article;
}

function createErrorMessage(message) {
    var paragraph = document.createElement('p');
    paragraph.className = 'error-message';
    paragraph.textContent = message;
    return paragraph;
}

/* ==========================================================================
   BLOQUE 3 — FUNCIONES DE RENDERIZADO PRINCIPAL
   ========================================================================== */

function renderGreetings(lang) {
    if (CONTAINER === null) {
        console.error('renderer.js: El contenedor con ID "greetings-container" no existe en el DOM. No se puede renderizar.');
        return;
    }

    if (typeof GREETINGS_DATA === 'undefined' || GREETINGS_DATA === null || !GREETINGS_DATA.hasOwnProperty(lang)) {
        var errorMsg = createErrorMessage(
            'No se encontraron datos de saludos para el idioma "' + lang + '". Verifique que greetings-data.js esté cargado correctamente.'
        );
        CONTAINER.appendChild(errorMsg);
        return;
    }

    while (CONTAINER.firstChild) {
        CONTAINER.removeChild(CONTAINER.firstChild);
    }

    var greetingsArray = GREETINGS_DATA[lang];

    var fragment = document.createDocumentFragment();

    greetingsArray.forEach(function (greetingItem) {
        var card = createGreetingCard(greetingItem);
        fragment.appendChild(card);
    });

    CONTAINER.appendChild(fragment);

    if (
        GREETINGS_DATA.ui &&
        GREETINGS_DATA.ui[lang]
    ) {
        var uiTexts = GREETINGS_DATA.ui[lang];

        if (MAIN_TITLE !== null && uiTexts.title) {
            MAIN_TITLE.textContent = uiTexts.title;
        }

        if (MAIN_SUBTITLE !== null && uiTexts.subtitle) {
            MAIN_SUBTITLE.textContent = uiTexts.subtitle;
        }
    }
}

function filterByRegion(region) {
    var cards = CONTAINER.querySelectorAll('article.card');

    cards.forEach(function (card) {
        var cardRegion = card.getAttribute('data-region');

        if (region === 'all' || cardRegion === region) {
            card.classList.remove('hidden');
        } else {
            card.classList.add('hidden');
        }
    });
}

/* ==========================================================================
   BLOQUE 4 — INICIALIZACIÓN Y EVENT LISTENERS
   ========================================================================== */

function init() {
    renderGreetings(DEFAULT_LANG);

    if (LANGUAGE_SELECTOR !== null) {
        LANGUAGE_SELECTOR.value = DEFAULT_LANG;

        LANGUAGE_SELECTOR.addEventListener('change', function (event) {
            var selectedLang = event.target.value;
            renderGreetings(selectedLang);
        });
    }
}

document.addEventListener('DOMContentLoaded', init);