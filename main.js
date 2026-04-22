const GREETINGS_DATA = [
  { country: 'México',         greeting: '¡Qué onda!',       phonetic: 'ke-ON-da'               },
  { country: 'España',         greeting: '¡Buenas!',         phonetic: 'BWEH-nas'               },
  { country: 'Estados Unidos', greeting: "Hey, what's up?",  phonetic: 'hey wuts up'            },
  { country: 'Brasil',         greeting: 'E aí, tudo bem?',  phonetic: 'ee-ah-EE too-doo beng'  },
  { country: 'Argentina',      greeting: '¡Buenas, che!',    phonetic: 'BWEH-nas cheh'          },
  { country: 'Colombia',       greeting: '¡Quiubo, parce!',  phonetic: 'KYU-bo PAR-seh'         },
  { country: 'Reino Unido',    greeting: 'Alright, mate?',   phonetic: 'ol-RAYT mayt'           },
  { country: 'Alemania',       greeting: "Na, wie läuft's?", phonetic: 'nah vee LOYFS'          },
  { country: 'Francia',        greeting: 'Ça roule ?',       phonetic: 'sah ROOL'               },
  { country: 'India',          greeting: 'Kem cho!',         phonetic: 'kem CHO'                },
  { country: 'Japón',          greeting: 'Ossu!',            phonetic: 'OS-su'                  },
  { country: 'Australia',      greeting: "G'day, mate!",     phonetic: 'guh-DAY mayt'           },
];

const searchInput    = document.getElementById('search-input');
const cardsContainer = document.getElementById('cards-container');
const resultsCount   = document.getElementById('results-count');
const clearBtn       = document.getElementById('clear-btn');

function createCard(item) {
  const card = document.createElement('article');
  card.className = 'greeting-card';

  const country = document.createElement('h2');
  country.className = 'card-country';
  country.textContent = item.country;

  const greeting = document.createElement('p');
  greeting.className = 'card-greeting';
  greeting.textContent = item.greeting;

  const phonetic = document.createElement('p');
  phonetic.className = 'card-phonetic';
  phonetic.textContent = item.phonetic;

  card.appendChild(country);
  card.appendChild(greeting);
  card.appendChild(phonetic);

  return card;
}

function renderCards(data) {
  cardsContainer.replaceChildren();
  resultsCount.textContent = data.length + ' país(es) encontrado(s)';

  if (data.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'No se encontraron resultados.';
    cardsContainer.appendChild(empty);
    return;
  }

  data.forEach(function (item) {
    cardsContainer.appendChild(createCard(item));
  });
}

function filterAndRender() {
  const query = searchInput.value.toLowerCase().trim();
  const filtered = GREETINGS_DATA.filter(function (item) {
    return (
      item.country.toLowerCase().includes(query) ||
      item.greeting.toLowerCase().includes(query) ||
      item.phonetic.toLowerCase().includes(query)
    );
  });
  renderCards(filtered);
}

searchInput.addEventListener('input', filterAndRender);

clearBtn.addEventListener('click', function () {
  searchInput.value = '';
  renderCards(GREETINGS_DATA);
});

renderCards(GREETINGS_DATA);