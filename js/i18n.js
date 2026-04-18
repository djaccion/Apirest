const TRANSLATIONS = {
  es: {
    nav: {
      home: "Inicio",
      services: "Servicios",
      about: "Nosotros",
      contact: "Contacto"
    },
    hero: {
      title: "Creamos historias que impactan",
      subtitle: "Producción audiovisual con visión creativa y resultados reales",
      cta: "Descubre nuestro trabajo"
    },
    services: {
      title: "Nuestros Servicios",
      subtitle: "Soluciones creativas para cada etapa de tu proyecto",
      card1: {
        title: "Producción de Video",
        description: "Desde el concepto hasta la pantalla, producimos contenido audiovisual que conecta con tu audiencia."
      },
      card2: {
        title: "Fotografía Comercial",
        description: "Imágenes que comunican la esencia de tu marca con precisión y estética profesional."
      },
      card3: {
        title: "Postproducción",
        description: "Edición, colorización y efectos visuales que elevan cada pieza al siguiente nivel."
      }
    },
    about: {
      title: "Quiénes Somos",
      subtitle: "Un equipo apasionado por contar historias",
      body: "Somos una productora audiovisual con más de una década de experiencia creando contenido que trasciende. Trabajamos con marcas, agencias y artistas para dar vida a ideas que dejan huella."
    },
    contact: {
      title: "Hablemos",
      subtitle: "Cuéntanos sobre tu próximo proyecto",
      label: {
        name: "Nombre",
        email: "Correo electrónico",
        message: "Mensaje"
      },
      button: {
        send: "Enviar mensaje"
      },
      success: "¡Mensaje enviado con éxito! Nos pondremos en contacto pronto.",
      error: "Ocurrió un error al enviar el mensaje. Por favor, inténtalo de nuevo."
    },
    footer: {
      rights: "Todos los derechos reservados."
    }
  },
  en: {
    nav: {
      home: "Home",
      services: "Services",
      about: "About",
      contact: "Contact"
    },
    hero: {
      title: "We create stories that make an impact",
      subtitle: "Audiovisual production with creative vision and real results",
      cta: "Discover our work"
    },
    services: {
      title: "Our Services",
      subtitle: "Creative solutions for every stage of your project",
      card1: {
        title: "Video Production",
        description: "From concept to screen, we produce audiovisual content that connects with your audience."
      },
      card2: {
        title: "Commercial Photography",
        description: "Images that communicate the essence of your brand with precision and professional aesthetics."
      },
      card3: {
        title: "Post-Production",
        description: "Editing, color grading and visual effects that take every piece to the next level."
      }
    },
    about: {
      title: "Who We Are",
      subtitle: "A team passionate about telling stories",
      body: "We are an audiovisual production company with over a decade of experience creating content that transcends. We work with brands, agencies and artists to bring ideas to life that leave a mark."
    },
    contact: {
      title: "Let's Talk",
      subtitle: "Tell us about your next project",
      label: {
        name: "Name",
        email: "Email address",
        message: "Message"
      },
      button: {
        send: "Send message"
      },
      success: "Message sent successfully! We will get in touch soon.",
      error: "An error occurred while sending the message. Please try again."
    },
    footer: {
      rights: "All rights reserved."
    }
  }
};

let _currentLang = 'es';

function _resolveKey(obj, dotPath) {
  return dotPath.split('.').reduce((acc, segment) => (acc !== undefined && acc !== null ? acc[segment] : undefined), obj);
}

function applyTranslations(lang) {
  if (!TRANSLATIONS[lang]) return;
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(function (element) {
    const key = element.getAttribute('data-i18n');
    const value = _resolveKey(TRANSLATIONS[lang], key);
    if (value !== undefined) {
      element.textContent = value;
    }
  });
}

export function setLanguage(lang) {
  if (lang !== 'es' && lang !== 'en') return;
  _currentLang = lang;
  applyTranslations(lang);
  document.documentElement.setAttribute('lang', lang);
}

export function getCurrentLang() {
  return _currentLang;
}

export function getTranslation(key) {
  return _resolveKey(TRANSLATIONS[_currentLang], key);
}

// Auto-init: aplica el idioma por defecto al cargar
applyTranslations(_currentLang);