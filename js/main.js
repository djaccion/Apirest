// ─── DATA LAYER ──────────────────────────────────────────────────────────────
var GREETINGS_DATA = {
  "ar": {
    countryName : "Argentina",
    flag        : "🇦🇷",
    greeting    : "¡Hola desde Argentina!",
    lang        : "es-AR"
  },
  "co": {
    countryName : "Colombia",
    flag        : "🇨🇴",
    greeting    : "¡Hola desde Colombia!",
    lang        : "es-CO"
  },
  "pe": {
    countryName : "Perú",
    flag        : "🇵🇪",
    greeting    : "¡Hola desde Perú!",
    lang        : "es-PE"
  },
  "mx": {
    countryName : "México",
    flag        : "🇲🇽",
    greeting    : "¡Hola desde México!",
    lang        : "es-MX"
  },
  "us": {
    countryName : "USA",
    flag        : "🇺🇸",
    greeting    : "Hello from the USA!",
    lang        : "en-US"
  },
  "es": {
    countryName : "España",
    flag        : "🇪🇸",
    greeting    : "¡Hola desde España!",
    lang        : "es-ES"
  }
};

// ─── DOM REFERENCES ───────────────────────────────────────────────────────────
var dropdownTrigger  = document.getElementById('dropdown-trigger');
var dropdownPanel    = document.getElementById('dropdown-panel');
var greetingDisplay  = document.getElementById('greeting-display');
var greetingText     = document.getElementById('greeting-text');
var greetingCountry  = document.getElementById('greeting-country');
var greetingFlag     = document.getElementById('greeting-flag');
var dropdownOptions  = document.querySelectorAll('.dropdown-option');

// ─── FUNCTIONS ────────────────────────────────────────────────────────────────
function updateGreeting(countryId) {
  var data = GREETINGS_DATA[countryId];
  if (!data) { return; }
  greetingText.textContent    = data.greeting;
  greetingCountry.textContent = data.countryName;
  greetingFlag.textContent    = data.flag;
  greetingDisplay.setAttribute('lang', data.lang);
}

function closeDropdown() {
  dropdownPanel.classList.remove('is-active');
  dropdownTrigger.classList.remove('is-active');
  dropdownTrigger.setAttribute('aria-expanded', 'false');
}

function toggleDropdown() {
  dropdownPanel.classList.toggle('is-active');
  dropdownTrigger.classList.toggle('is-active');
  var isOpen = dropdownPanel.classList.contains('is-active');
  dropdownTrigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
}

function handleOptionClick(event) {
  var clickedOption = event.currentTarget;
  var countryId     = clickedOption.getAttribute('data-country-id');
  updateGreeting(countryId);
  closeDropdown();
  for (var i = 0; i < dropdownOptions.length; i++) {
    dropdownOptions[i].classList.remove('is-active');
  }
  clickedOption.classList.add('is-active');
}

function handleOutsideClick(event) {
  var countrySelector = document.getElementById('country-selector');
  if (countrySelector.contains(event.target)) { return; }
  if (dropdownPanel.classList.contains('is-active')) {
    closeDropdown();
  }
}

function init() {
  dropdownTrigger.addEventListener('click', toggleDropdown);

  for (var i = 0; i < dropdownOptions.length; i++) {
    dropdownOptions[i].addEventListener('click', handleOptionClick);
  }

  document.addEventListener('click', handleOutsideClick);

  updateGreeting('ar');
}

// ─── ENTRY POINT ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);