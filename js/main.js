(function () {

  const COUNTRIES = [
    {
      emoji: '🇦🇷',
      nameLocal: 'Argentina',
      phraseLocal: '¡Che, bienvenido a la familia TSOFT!',
      phraseEn: 'Hey mate, welcome to the TSOFT family!'
    },
    {
      emoji: '🇲🇽',
      nameLocal: 'México',
      phraseLocal: '¡Órale cuate, qué bueno verte!',
      phraseEn: 'Hey buddy, great to see you!'
    },
    {
      emoji: '🇨🇴',
      nameLocal: 'Colombia',
      phraseLocal: '¡Quiubo parce, bienvenido a TSOFT!',
      phraseEn: "What's up friend, welcome to TSOFT!"
    },
    {
      emoji: '🇨🇱',
      nameLocal: 'Chile',
      phraseLocal: '¡Cachai po, TSOFT te da la bienvenida!',
      phraseEn: 'You get it right, TSOFT welcomes you!'
    },
    {
      emoji: '🇵🇪',
      nameLocal: 'Perú',
      phraseLocal: '¡Causa, bienvenido a la familia TSOFT!',
      phraseEn: 'Buddy, welcome to the TSOFT family!'
    },
    {
      emoji: '🇺🇾',
      nameLocal: 'Uruguay',
      phraseLocal: '¡Bienvenido, gurí, TSOFT te espera!',
      phraseEn: 'Welcome, kid, TSOFT is waiting for you!'
    }
  ];

  const triggerBtn    = document.getElementById('dropdown-trigger');
  const selectedFlag  = document.getElementById('selected-flag');
  const selectedName  = document.getElementById('selected-country-name');
  const listbox       = document.getElementById('country-listbox');
  const greetingCard  = document.getElementById('greeting-card');
  const greetingFlag  = document.getElementById('greeting-flag');
  const greetingLabel = document.getElementById('greeting-label');
  const greetingText  = document.getElementById('greeting-text');
  const greetingTrans = document.getElementById('greeting-translation');
  const greetingHolder = document.getElementById('greeting-placeholder');
  const langToggle    = document.getElementById('lang-toggle');
  const footerYear    = document.getElementById('footer-year');

  let currentCountryIndex = -1;
  let isEnglish = false;

  function renderDropdownItems() {
    listbox.innerHTML = '';
    COUNTRIES.forEach(function (country, index) {
      var li = document.createElement('li');
      li.setAttribute('role', 'option');
      li.setAttribute('data-index', index);
      li.classList.add('country-list');

      var spanEmoji = document.createElement('span');
      spanEmoji.textContent = country.emoji;
      li.appendChild(spanEmoji);

      var spanName = document.createElement('span');
      spanName.textContent = country.nameLocal;
      li.appendChild(spanName);

      listbox.appendChild(li);
    });
  }

  function updateGreetingText() {
    if (currentCountryIndex === -1) return;
    var country = COUNTRIES[currentCountryIndex];
    if (isEnglish) {
      greetingText.textContent = country.phraseEn;
      greetingTrans.textContent = country.phraseLocal;
    } else {
      greetingText.textContent = country.phraseLocal;
      greetingTrans.textContent = country.phraseEn;
    }
  }

  function openDropdown() {
    listbox.hidden = false;
    triggerBtn.setAttribute('aria-expanded', 'true');
  }

  function closeDropdown() {
    listbox.hidden = true;
    triggerBtn.setAttribute('aria-expanded', 'false');
  }

  function selectCountry(index) {
    currentCountryIndex = index;
    var country = COUNTRIES[index];

    selectedFlag.textContent = country.emoji;
    selectedName.textContent = country.nameLocal;

    greetingHolder.hidden = true;
    greetingCard.hidden = false;
    greetingFlag.textContent = country.emoji;
    greetingLabel.textContent = country.nameLocal;
    updateGreetingText();

    closeDropdown();
  }

  triggerBtn.addEventListener('click', function () {
    var isOpen = listbox.hidden === false;
    if (isOpen) {
      closeDropdown();
    } else {
      openDropdown();
    }
  });

  listbox.addEventListener('click', function (event) {
    var item = event.target.closest('[data-index]');
    if (!item) return;
    var index = parseInt(item.getAttribute('data-index'), 10);
    selectCountry(index);
  });

  langToggle.addEventListener('click', function () {
    isEnglish = !isEnglish;
    langToggle.textContent = isEnglish ? 'ES' : 'EN';
    updateGreetingText();
  });

  document.addEventListener('click', function (event) {
    var insideDropdown = triggerBtn.contains(event.target) || listbox.contains(event.target);
    if (!insideDropdown) {
      closeDropdown();
    }
  });

  if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
  }

  renderDropdownItems();

}());