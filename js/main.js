// ─── 1. DATOS ──────────────────────────────────────────────────────────────

const COUNTRIES = [
  { id: 'argentina', flag: '🇦🇷', name: 'Argentina', greeting: '¡Che, bienvenidos a la familia TSOFT!' },
  { id: 'mexico',    flag: '🇲🇽', name: 'México',    greeting: '¡Órale, qué bueno verlos, TSOFT!' },
  { id: 'colombia',  flag: '🇨🇴', name: 'Colombia',  greeting: '¡Quiubo parce, bienvenido a TSOFT!' },
  { id: 'chile',     flag: '🇨🇱', name: 'Chile',     greeting: '¡Cachai, estamos todos en TSOFT!' },
  { id: 'peru',      flag: '🇵🇪', name: 'Perú',      greeting: '¡Causa, qué gusto estar en TSOFT!' },
  { id: 'uruguay',   flag: '🇺🇾', name: 'Uruguay',   greeting: '¡Ta bárbaro, bienvenidos a TSOFT!' }
];

// ─── 2. REFERENCIAS AL DOM ─────────────────────────────────────────────────

const dropdown        = document.querySelector('#country-dropdown');
const dropdownTrigger = document.querySelector('#dropdown-trigger');
const dropdownList    = document.querySelector('#dropdown-list');
const greetingDisplay = document.querySelector('#greeting-display');
const greetingFlag    = document.querySelector('#greeting-flag');
const greetingText    = document.querySelector('#greeting-text');
const greetingCountry = document.querySelector('#greeting-country');

// ─── 3. FUNCIONES PRIVADAS ─────────────────────────────────────────────────

function renderDropdownItems() {
  COUNTRIES.forEach(function(country) {
    var li = document.createElement('li');
    li.classList.add('dropdown-item');
    li.setAttribute('data-country', country.id);

    var spanFlag = document.createElement('span');
    spanFlag.classList.add('dropdown-item__flag');
    spanFlag.textContent = country.flag;

    var spanName = document.createElement('span');
    spanName.classList.add('dropdown-item__name');
    spanName.textContent = country.name;

    li.appendChild(spanFlag);
    li.appendChild(spanName);
    dropdownList.appendChild(li);
  });
}

function selectCountry(countryId) {
  var country = COUNTRIES.find(function(c) { return c.id === countryId; });
  if (!country) return;

  greetingFlag.textContent    = country.flag;
  greetingText.textContent    = country.greeting;
  greetingCountry.textContent = country.name;

  greetingDisplay.classList.add('is-active');

  dropdownList.querySelectorAll('.dropdown-item').forEach(function(item) {
    item.classList.remove('is-selected');
  });

  var selectedItem = dropdownList.querySelector('[data-country="' + countryId + '"]');
  if (selectedItem) {
    selectedItem.classList.add('is-selected');
  }

  closeDropdown();

  dropdownTrigger.textContent = country.flag + ' ' + country.name;
}

function closeDropdown() {
  dropdown.classList.remove('is-open');
}

// ─── 4. INICIALIZACIÓN Y EVENTOS ───────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function() {

  // Bloque A — Renderizado inicial
  renderDropdownItems();

  // Bloque B — Listener del trigger (abrir/cerrar dropdown)
  dropdownTrigger.addEventListener('click', function(event) {
    event.stopPropagation();
    dropdown.classList.toggle('is-open');
  });

  // Bloque C — Listener de selección de país (delegación de eventos)
  dropdownList.addEventListener('click', function(event) {
    var item = event.target.closest('.dropdown-item');
    if (!item) return;
    selectCountry(item.dataset.country);
  });

  // Bloque D — Listener de cierre al hacer clic fuera
  document.addEventListener('click', function(event) {
    if (!dropdown.contains(event.target)) {
      closeDropdown();
    }
  });

});