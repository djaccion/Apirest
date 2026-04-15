const GREETINGS_DATA = {
  metadata: {
    version: "1.0.0",
    lastUpdated: "2025-01-31",
    totalCountries: 9,
    supportedLanguages: ["es", "en"],
    author: "TSOFT Dev Team"
  },
  countries: [
    {
      id: "mexico",
      countryCode: "MX",
      flag: "🇲🇽",
      names: {
        es: "México",
        en: "Mexico"
      },
      greeting: {
        es: "¿Qué onda, cuate?",
        en: "What's up, buddy?"
      },
      subgreeting: {
        es: "¡Órale, bienvenido al equipo!",
        en: "Alright, welcome to the team!"
      },
      region: "latam",
      accentColor: "#006847"
    },
    {
      id: "colombia",
      countryCode: "CO",
      flag: "🇨🇴",
      names: {
        es: "Colombia",
        en: "Colombia"
      },
      greeting: {
        es: "¿Quiubo, parce?",
        en: "What's good, pal?"
      },
      subgreeting: {
        es: "¡Todo bien, bacano el trabajo!",
        en: "All good, this job is awesome!"
      },
      region: "latam",
      accentColor: "#FCD116"
    },
    {
      id: "argentina",
      countryCode: "AR",
      flag: "🇦🇷",
      names: {
        es: "Argentina",
        en: "Argentina"
      },
      greeting: {
        es: "¿Todo bien, che?",
        en: "All good, mate?"
      },
      subgreeting: {
        es: "¡Bienvenido, pibe, acá laburamos bien!",
        en: "Welcome, pal, we work hard here!"
      },
      region: "latam",
      accentColor: "#74ACDF"
    },
    {
      id: "chile",
      countryCode: "CL",
      flag: "🇨🇱",
      names: {
        es: "Chile",
        en: "Chile"
      },
      greeting: {
        es: "¿Cómo estái, po?",
        en: "How are you doing, eh?"
      },
      subgreeting: {
        es: "¡Bienvenido al equipo, causa!",
        en: "Welcome to the team, friend!"
      },
      region: "latam",
      accentColor: "#D52B1E"
    },
    {
      id: "peru",
      countryCode: "PE",
      flag: "🇵🇪",
      names: {
        es: "Perú",
        en: "Peru"
      },
      greeting: {
        es: "¿Qué tal, causa?",
        en: "What's up, buddy?"
      },
      subgreeting: {
        es: "¡Hola, pata, bienvenido a la familia!",
        en: "Hey friend, welcome to the family!"
      },
      region: "latam",
      accentColor: "#C8102E"
    },
    {
      id: "ecuador",
      countryCode: "EC",
      flag: "🇪🇨",
      names: {
        es: "Ecuador",
        en: "Ecuador"
      },
      greeting: {
        es: "¿Qué más, ñaño?",
        en: "What's new, bro?"
      },
      subgreeting: {
        es: "¡Buenas, mano, qué gusto tenerte aquí!",
        en: "Hey man, great to have you here!"
      },
      region: "latam",
      accentColor: "#FFD100"
    },
    {
      id: "venezuela",
      countryCode: "VE",
      flag: "🇻🇪",
      names: {
        es: "Venezuela",
        en: "Venezuela"
      },
      greeting: {
        es: "¡Épale, chamo!",
        en: "Hey there, buddy!"
      },
      subgreeting: {
        es: "¿Qué es la vaina? ¡Bienvenido al equipo!",
        en: "What's going on? Welcome to the team!"
      },
      region: "latam",
      accentColor: "#CF8A00"
    },
    {
      id: "espana",
      countryCode: "ES",
      flag: "🇪🇸",
      names: {
        es: "España",
        en: "Spain"
      },
      greeting: {
        es: "¿Qué pasa, tío?",
        en: "What's up, mate?"
      },
      subgreeting: {
        es: "¡Buenas, macho, bienvenido al equipo!",
        en: "Hey man, welcome to the team!"
      },
      region: "europe",
      accentColor: "#AA151B"
    },
    {
      id: "usa_hisp",
      countryCode: "US",
      flag: "🇺🇸",
      names: {
        es: "USA Hispano",
        en: "Hispanic USA"
      },
      greeting: {
        es: "¿Qué pasó, hermano?",
        en: "What's up, brother?"
      },
      subgreeting: {
        es: "¡Bienvenido, mano, aquí somos familia!",
        en: "Welcome, bro, we are family here!"
      },
      region: "north_america",
      accentColor: "#B22234"
    }
  ]
};

window.GREETINGS_DATA = GREETINGS_DATA;