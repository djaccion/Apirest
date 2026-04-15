const TRANSLATIONS = {
  es: {
    nav: {
      title: 'Hola TSOFT',
      subtitle: 'Saludos desde cada rincón del mundo donde estamos presentes'
    },
    hero: {
      heading: '¡Bienvenidos a TSOFT!',
      description: 'Descubre cómo se saluda en cada país donde TSOFT tiene presencia. Una celebración de nuestra diversidad cultural y nuestra familia global.',
      langToggle: 'English'
    },
    grid: {
      sectionTitle: 'Saludos por País',
      subtitle: 'Explora las expresiones coloquiales de cada región donde operamos',
      emptyState: 'No hay saludos disponibles en este momento.'
    },
    card: {
      flagAriaLabel: 'Bandera de',
      coloquialLabel: 'Saludo coloquial',
      regionLabel: 'Región'
    },
    footer: {
      copyright: '© 2024 TSOFT. Todos los derechos reservados.',
      securityPolicy: 'Política de Seguridad',
      credits: 'Hecho con dedicación por el equipo TSOFT'
    },
    a11y: {
      langChangeAnnouncement: 'Idioma cambiado a español',
      langSelectorLabel: 'Selector de idioma',
      pageDescription: 'Página de saludos internacionales de TSOFT, mostrando expresiones coloquiales de cada país donde la empresa tiene presencia.'
    }
  },
  en: {
    nav: {
      title: 'Hello TSOFT',
      subtitle: 'Greetings from every corner of the world where we are present'
    },
    hero: {
      heading: 'Welcome to TSOFT!',
      description: 'Discover how people greet each other in every country where TSOFT has a presence. A celebration of our cultural diversity and our global family.',
      langToggle: 'Español'
    },
    grid: {
      sectionTitle: 'Greetings by Country',
      subtitle: 'Explore the colloquial expressions from each region where we operate',
      emptyState: 'No greetings available at this time.'
    },
    card: {
      flagAriaLabel: 'Flag of',
      coloquialLabel: 'Colloquial greeting',
      regionLabel: 'Region'
    },
    footer: {
      copyright: '© 2024 TSOFT. All rights reserved.',
      securityPolicy: 'Security Policy',
      credits: 'Made with dedication by the TSOFT team'
    },
    a11y: {
      langChangeAnnouncement: 'Language changed to English',
      langSelectorLabel: 'Language selector',
      pageDescription: 'TSOFT international greetings page, showcasing colloquial expressions from each country where the company has a presence.'
    }
  }
};

let currentLanguage = 'es';

const getCurrentLanguage = () => {
  return currentLanguage;
};

const setLanguage = (lang) => {
  if (lang !== 'es' && lang !== 'en') {
    throw new Error(
      `Idioma no válido: "${lang}". Los valores válidos son: 'es' o 'en'.`
    );
  }
  currentLanguage = lang;
};

const getTranslation = (section, key) => {
  const langObj = TRANSLATIONS[currentLanguage];

  if (!langObj) {
    return `[${section}.${key}]`;
  }

  const sectionObj = langObj[section];

  if (!sectionObj) {
    return `[${section}.${key}]`;
  }

  const value = sectionObj[key];

  if (value === undefined || value === null) {
    return `[${section}.${key}]`;
  }

  return value;
};

const getAllTranslations = () => {
  return TRANSLATIONS[currentLanguage];
};

const toggleLanguage = () => {
  const newLang = currentLanguage === 'es' ? 'en' : 'es';
  setLanguage(newLang);
  return currentLanguage;
};

window.i18n = {
  getCurrentLanguage,
  setLanguage,
  getTranslation,
  getAllTranslations,
  toggleLanguage
};