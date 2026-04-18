const TRANSLATIONS = {
  es: {
    "nav.home": "Inicio",
    "nav.services": "Servicios",
    "nav.about": "Quiénes Somos",
    "nav.contact": "Contacto",

    "home.hero.title": "Creamos Historias que Impactan",
    "home.hero.subtitle": "Producción audiovisual de alto impacto para marcas que quieren dejar huella.",
    "home.hero.cta": "Conoce Nuestros Servicios",

    "services.section.title": "Nuestros Servicios",
    "services.card1.title": "Producción Audiovisual",
    "services.card1.description": "Desarrollamos proyectos de video desde la concepción creativa hasta la entrega final, con estándares de calidad cinematográfica.",
    "services.card2.title": "Fotografía Comercial",
    "services.card2.description": "Capturamos la esencia de tu marca con sesiones fotográficas profesionales para campañas digitales y medios impresos.",
    "services.card3.title": "Postproducción",
    "services.card3.description": "Edición, colorización, motion graphics y mezcla de audio para llevar tu contenido al siguiente nivel.",

    "about.section.title": "Quiénes Somos",
    "about.paragraph1": "Somos un equipo apasionado de creativos, directores y técnicos con más de una década de experiencia en la industria audiovisual. Nacimos con la misión de contar historias que conecten marcas con personas.",
    "about.paragraph2": "Trabajamos con clientes de distintos sectores, desde startups hasta grandes corporaciones, adaptando nuestra propuesta creativa a cada visión y presupuesto. La calidad no es una opción, es nuestro estándar.",

    "contact.section.title": "Contáctanos",
    "contact.label.name": "Nombre",
    "contact.label.email": "Correo Electrónico",
    "contact.label.message": "Mensaje",
    "contact.button.send": "Enviar Mensaje",
    "contact.success.message": "¡Mensaje enviado con éxito! Nos pondremos en contacto contigo pronto.",
    "contact.error.message": "Ocurrió un error al enviar el mensaje. Por favor, inténtalo de nuevo.",

    "footer.rights": "Todos los derechos reservados.",
  },
  en: {
    "nav.home": "Home",
    "nav.services": "Services",
    "nav.about": "About Us",
    "nav.contact": "Contact",

    "home.hero.title": "We Create Stories that Make an Impact",
    "home.hero.subtitle": "High-impact audiovisual production for brands that want to leave a mark.",
    "home.hero.cta": "Discover Our Services",

    "services.section.title": "Our Services",
    "services.card1.title": "Audiovisual Production",
    "services.card1.description": "We develop video projects from creative conception to final delivery, with cinematic quality standards.",
    "services.card2.title": "Commercial Photography",
    "services.card2.description": "We capture the essence of your brand with professional photo sessions for digital campaigns and print media.",
    "services.card3.title": "Post-Production",
    "services.card3.description": "Editing, color grading, motion graphics and audio mixing to take your content to the next level.",

    "about.section.title": "About Us",
    "about.paragraph1": "We are a passionate team of creatives, directors and technicians with over a decade of experience in the audiovisual industry. We were born with the mission of telling stories that connect brands with people.",
    "about.paragraph2": "We work with clients from different sectors, from startups to large corporations, adapting our creative approach to each vision and budget. Quality is not an option, it is our standard.",

    "contact.section.title": "Contact Us",
    "contact.label.name": "Name",
    "contact.label.email": "Email Address",
    "contact.label.message": "Message",
    "contact.button.send": "Send Message",
    "contact.success.message": "Message sent successfully! We will get in touch with you soon.",
    "contact.error.message": "An error occurred while sending the message. Please try again.",

    "footer.rights": "All rights reserved.",
  },
};

function applyLanguage(lang) {
  if (lang !== "es" && lang !== "en") {
    console.warn("[i18n] Idioma no soportado: " + lang);
    return;
  }

  const elements = document.querySelectorAll("[data-i18n]");

  elements.forEach(function (element) {
    const key = element.getAttribute("data-i18n");
    const translation = TRANSLATIONS[lang][key];

    if (translation !== undefined) {
      element.textContent = translation;
    } else {
      console.warn("[i18n] Clave no encontrada: " + key);
    }
  });

  localStorage.setItem("siteLang", lang);
  document.documentElement.setAttribute("lang", lang);
}

function getStoredLanguage() {
  const stored = localStorage.getItem("siteLang");

  if (stored === "es" || stored === "en") {
    return stored;
  }

  return "es";
}

export { TRANSLATIONS, applyLanguage, getStoredLanguage };