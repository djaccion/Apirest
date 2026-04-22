const GREETINGS = {
  pe: { flag: "🇵🇪", country: "Perú",      message: "¡Hola desde Lima! Bienvenido a TSOFT Perú." },
  cl: { flag: "🇨🇱", country: "Chile",     message: "¡Hola po! Bienvenido a TSOFT Chile." },
  co: { flag: "🇨🇴", country: "Colombia",  message: "¡Quiubo! Bienvenido a TSOFT Colombia." },
  mx: { flag: "🇲🇽", country: "México",    message: "¡Qué onda! Bienvenido a TSOFT México." },
  ar: { flag: "🇦🇷", country: "Argentina", message: "¡Buenas! Bienvenido a TSOFT Argentina." },
  es: { flag: "🇪🇸", country: "España",    message: "¡Hola! Bienvenido a TSOFT España." }
};

function updateGreeting(countryCode) {
  var data      = GREETINGS[countryCode];
  var flagEl    = document.getElementById("greeting-flag");
  var countryEl = document.getElementById("greeting-country");
  var messageEl = document.getElementById("greeting-message");

  if (!data || !flagEl || !countryEl || !messageEl) {
    if (flagEl)    { flagEl.textContent    = ""; }
    if (countryEl) { countryEl.textContent = ""; }
    if (messageEl) { messageEl.textContent = ""; }
    return;
  }

  flagEl.textContent    = data.flag;
  countryEl.textContent = data.country;
  messageEl.textContent = data.message;
}

function init() {
  var selectEl = document.getElementById("country-select");

  if (!selectEl) {
    return;
  }

  selectEl.addEventListener("change", function (event) {
    updateGreeting(event.target.value);
  });

  updateGreeting(selectEl.value);
}

document.addEventListener("DOMContentLoaded", init);