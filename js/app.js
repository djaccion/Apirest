/* ============================================================
   SECCIÓN 1 — CONSTANTES Y REFERENCIAS AL DOM
   ============================================================ */

const cardsContainer = document.getElementById('cards-container');
const langButtonsContainer = document.getElementById('lang-buttons-container');
const langButtons = document.querySelectorAll('[data-lang]');
const mainTitle = document.querySelector('h1');

let currentLanguage = 'es';

/* ============================================================
   SECCIÓN 2 — FUNCIÓN DE RENDERIZADO DE TARJETAS
   ============================================================ */

function renderCards(lang) {
    cardsContainer.textContent = '';

    const countries = GREETINGS_DATA[lang];

    if (!countries || countries.length === 0) {
        const errorMsg = document.createElement('p');
        errorMsg.setAttribute('role', 'alert');
        errorMsg.textContent = `No se encontraron datos para el idioma: ${lang}`;
        cardsContainer.appendChild(errorMsg);
        return;
    }

    countries.forEach(function (country) {
        const card = buildCard(country);
        cardsContainer.appendChild(card);
    });
}

/* ============================================================
   SECCIÓN 3 — FUNCIÓN DE CONSTRUCCIÓN DE TARJETA INDIVIDUAL
   ============================================================ */

function buildCard(country) {
    const article = document.createElement('article');
    article.setAttribute('class', 'country-card');
    article.setAttribute('role', 'region');
    article.setAttribute('aria-label', `${country.name}`);

    const flagSpan = document.createElement('span');
    flagSpan.setAttribute('class', 'country-flag');
    flagSpan.textContent = country.flag;

    const nameH2 = document.createElement('h2');
    nameH2.setAttribute('class', 'country-name');
    nameH2.textContent = country.name;

    const greetingP = document.createElement('p');
    greetingP.setAttribute('class', 'country-greeting');
    greetingP.textContent = country.greeting;

    const regionSpan = document.createElement('span');
    regionSpan.setAttribute('class', 'country-region');
    regionSpan.textContent = country.region;

    article.appendChild(flagSpan);
    article.appendChild(nameH2);
    article.appendChild(greetingP);
    article.appendChild(regionSpan);

    return article;
}

/* ============================================================
   SECCIÓN 4 — FUNCIÓN DE FILTRADO POR IDIOMA
   ============================================================ */

function setActiveLanguage(lang) {
    currentLanguage = lang;

    langButtons.forEach(function (btn) {
        btn.classList.remove('active');
    });

    const activeBtn = document.querySelector(`[data-lang="${lang}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }

    renderCards(lang);

    document.documentElement.setAttribute('lang', lang);
}

/* ============================================================
   SECCIÓN 5 — MANEJADORES DE EVENTOS
   ============================================================ */

function handleLangButtonClick(event) {
    const target = event.target;

    if (event.cancelable) {
        event.preventDefault();
    }

    if (!target.dataset.lang) {
        return;
    }

    setActiveLanguage(target.dataset.lang);
}

/* ============================================================
   SECCIÓN 6 — FUNCIÓN DE INICIALIZACIÓN
   ============================================================ */

function init() {
    if (typeof GREETINGS_DATA === 'undefined' || GREETINGS_DATA === null) {
        console.error('Error crítico: GREETINGS_DATA no está disponible en el scope global. Verificar que greetings-data.js se carga antes que app.js.');
        return;
    }

    if (!langButtonsContainer) {
        console.error('Error crítico: El contenedor de botones de idioma (lang-buttons-container) no existe en el DOM. Verificar el HTML.');
        return;
    }

    setActiveLanguage(currentLanguage);

    langButtonsContainer.addEventListener('click', handleLangButtonClick);
}

/* ============================================================
   SECCIÓN 7 — PUNTO DE ENTRADA
   ============================================================
   Se invoca init() directamente sin DOMContentLoaded ni window.onload
   porque el atributo defer en la etiqueta <script> del HTML garantiza
   que el DOM está completamente parseado antes de que este script se ejecute.
   ============================================================ */

init();