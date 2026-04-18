// REEMPLAZAR: Sustituir YOUR_FORM_ID con el ID real del proyecto en formspree.io
export const FORMSPREE_ENDPOINT = "https://formspree.io/f/YOUR_FORM_ID";

// Idioma por defecto del sitio. Valores válidos: "es" | "en"
export const DEFAULT_LANG = "es";

// REEMPLAZAR: Nombre oficial de la productora
export const SITE_NAME = "Productora";

// Límite mensual de envíos correspondiente al tier gratuito de Formspree (50 envíos/mes)
export const FORM_MONTHLY_LIMIT = 50;

// Tiempo de debounce en milisegundos para prevenir envíos duplicados por doble-click
export const FORM_DEBOUNCE_MS = 800;

// ⚠️ ÚNICAS fuentes de imágenes autorizadas hasta la entrega de assets finales.
// Ningún otro archivo puede referenciar rutas locales sin aprobación del Arquitecto.
export const PLACEHOLDER_BASE_URL = "https://placehold.co";
export const PICSUM_BASE_URL = "https://picsum.photos";