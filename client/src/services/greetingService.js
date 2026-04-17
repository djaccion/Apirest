import axios from 'axios';

/**
 * @module greetingService
 * @description Capa de servicio responsable de toda la comunicación HTTP con el backend
 * para operaciones relacionadas con saludos y países. Actúa como abstracción entre los
 * componentes React y la API REST, centralizando la lógica de llamadas HTTP, manejo de
 * errores de red y transformación de respuestas.
 *
 * PATRÓN DE MANEJO DE ERRORES:
 * Este módulo NO utiliza bloques try/catch en las funciones del servicio.
 * El manejo de errores se delega completamente al interceptor de respuesta configurado
 * en la instancia de axios. Los componentes React que consuman estas funciones son
 * responsables de capturar y manejar los errores normalizados que el interceptor produce.
 * El objeto de error normalizado tiene la forma:
 * { message: string, statusCode: number|null, isNetworkError: boolean, originalError: Error }
 */

if (!process.env.REACT_APP_API_URL) {
  throw new Error(
    '[greetingService] La variable de entorno REACT_APP_API_URL no está definida. ' +
    'Por favor, configura REACT_APP_API_URL en tu archivo .env antes de iniciar la aplicación.'
  );
}

const apiClient = axios.create({
  baseURL: `${process.env.REACT_APP_API_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalizedError = {
      message: error.response
        ? `Error del servidor: ${error.response.data?.message || error.response.statusText || 'Error desconocido'}`
        : 'Error de red: No se pudo conectar con el servidor. Verifica tu conexión a internet.',
      statusCode: error.response ? error.response.status : null,
      isNetworkError: !error.response,
      originalError: error,
    };

    return Promise.reject(normalizedError);
  }
);

/**
 * Obtiene todos los saludos disponibles en el sistema.
 * @returns {Promise<Array<Object>>} Promise que resuelve a un array de objetos greeting
 * con la estructura { countryCode, countryName, language, greeting, formalGreeting, flagUrl, isActive }.
 * @throws {{ message: string, statusCode: number|null, isNetworkError: boolean, originalError: Error }}
 * Objeto de error normalizado si la petición falla.
 */
const getAllGreetings = async () => {
  const response = await apiClient.get('/greetings');
  return response.data;
};

/**
 * Obtiene un saludo específico por código de país.
 * @param {string} countryCode - Código de país en formato ISO 3166-1 alpha-2 (ej: 'ES', 'US').
 * @returns {Promise<Object>} Promise que resuelve al objeto greeting correspondiente al país
 * con la estructura { countryCode, countryName, language, greeting, formalGreeting, flagUrl, isActive }.
 * @throws {{ message: string, statusCode: number|null, isNetworkError: boolean, originalError: Error }}
 * Objeto de error normalizado si la petición falla o si el parámetro es inválido.
 */
const getGreetingByCountryCode = async (countryCode) => {
  if (countryCode === null || countryCode === undefined || String(countryCode).trim() === '') {
    return Promise.reject({
      message: 'El parámetro countryCode es requerido y no puede estar vacío.',
      statusCode: null,
      isNetworkError: false,
      originalError: new Error('Parámetro countryCode inválido o ausente.'),
    });
  }

  const sanitizedCountryCode = String(countryCode).trim().toUpperCase();
  const response = await apiClient.get(`/greetings/${sanitizedCountryCode}`);
  return response.data;
};

/**
 * Obtiene únicamente los saludos que están activos en el sistema.
 * @returns {Promise<Array<Object>>} Promise que resuelve a un array de objetos greeting activos
 * con la estructura { countryCode, countryName, language, greeting, formalGreeting, flagUrl, isActive }.
 * @throws {{ message: string, statusCode: number|null, isNetworkError: boolean, originalError: Error }}
 * Objeto de error normalizado si la petición falla.
 */
const getActiveGreetings = async () => {
  const response = await apiClient.get('/greetings', {
    params: {
      isActive: true,
    },
  });
  return response.data;
};

/**
 * Busca saludos filtrados por idioma.
 * @param {string} language - Nombre o código del idioma por el cual filtrar (ej: 'Spanish', 'es').
 * @returns {Promise<Array<Object>>} Promise que resuelve a un array de objetos greeting
 * que coinciden con el idioma especificado.
 * @throws {{ message: string, statusCode: number|null, isNetworkError: boolean, originalError: Error }}
 * Objeto de error normalizado si la petición falla o si el parámetro es inválido.
 */
const searchGreetingsByLanguage = async (language) => {
  if (language === null || language === undefined || String(language).trim() === '') {
    return Promise.reject({
      message: 'El parámetro language es requerido y no puede estar vacío.',
      statusCode: null,
      isNetworkError: false,
      originalError: new Error('Parámetro language inválido o ausente.'),
    });
  }

  const sanitizedLanguage = String(language).trim();
  const response = await apiClient.get('/greetings/search', {
    params: {
      language: sanitizedLanguage,
    },
  });
  return response.data;
};

/**
 * Verifica el estado de salud y conectividad del backend.
 * @returns {Promise<Object>} Promise que resuelve al objeto de estado del servidor
 * con información sobre la disponibilidad del servicio.
 * @throws {{ message: string, statusCode: number|null, isNetworkError: boolean, originalError: Error }}
 * Objeto de error normalizado si la petición falla o el servidor no está disponible.
 */
const getHealthStatus = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};

export {
  getAllGreetings,
  getGreetingByCountryCode,
  getActiveGreetings,
  searchGreetingsByLanguage,
  getHealthStatus,
};