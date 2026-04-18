/**
 * EDITABLE: Archivo de configuración central del proyecto.
 * Reemplaza los valores marcados con "REEMPLAZAR_CON_*" antes del deploy.
 * NO modifiques la estructura de claves. Solo modifica los valores string.
 */
const APP_CONFIG = {
  formspree: {
    endpoint: "https://formspree.io/f/REEMPLAZAR_CON_FORM_ID",
    method: "POST"
  },
  placeholders: {
    baseUrl: "https://placehold.co",
    altUrl: "https://picsum.photos"
  },
  i18n: {
    defaultLang: "es",
    supportedLangs: ["es", "en"]
  },
  site: {
    name: "Productora 2",
    contactEmail: "REEMPLAZAR_CON_EMAIL_CONTACTO",
    currentYear: new Date().getFullYear()
  }
};