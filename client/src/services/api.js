import axios from 'axios';

if (!process.env.REACT_APP_API_URL) {
  console.error('[api.js] ERROR: La variable de entorno REACT_APP_API_URL no está definida. Las llamadas a la API fallarán.');
}

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    let normalizedError = {
      message: 'Error desconocido',
      status: null,
      data: null,
    };

    if (error.response) {
      const { status, data } = error.response;

      if (status === 401) {
        localStorage.removeItem('authToken');
        window.location.href = '/admin/login';
      } else if (status === 403) {
        console.error('[api.js] Acceso denegado: No tienes permisos para realizar esta acción.');
      } else if (status === 429) {
        console.warn('[api.js] Rate limit excedido: Has realizado demasiadas solicitudes. Por favor, espera unos momentos antes de reintentar.');
      } else if (status >= 500) {
        console.error('[api.js] Error del servidor:', data);
      }

      normalizedError = {
        message: (data && data.message) ? data.message : `Error HTTP ${status}`,
        status: status,
        data: data || null,
      };
    } else if (error.request) {
      console.error('[api.js] Error de red: El servidor no respondió. Puede ser un problema de conexión o timeout.');
      normalizedError = {
        message: 'No se pudo conectar con el servidor. Verifica tu conexión a internet o intenta más tarde.',
        status: null,
        data: null,
      };
    } else {
      console.error('[api.js] Error de configuración de axios:', error.message);
      normalizedError = {
        message: error.message || 'Error de configuración en la solicitud HTTP.',
        status: null,
        data: null,
      };
    }

    return Promise.reject(normalizedError);
  }
);

export const getAllGreetings = () => {
  return apiClient.get('/api/greetings');
};

export const getGreetingByCountry = (countryCode) => {
  if (countryCode === null || countryCode === undefined || String(countryCode).trim() === '') {
    return Promise.reject({
      message: 'El parámetro countryCode es requerido y no puede estar vacío.',
      status: null,
      data: null,
    });
  }

  const normalizedCode = String(countryCode).toUpperCase();
  return apiClient.get(`/api/greetings/${normalizedCode}`);
};

export const checkHealth = () => {
  return apiClient.get('/api/health');
};

export const loginAdmin = (credentials) => {
  if (
    !credentials ||
    !credentials.username ||
    typeof credentials.username !== 'string' ||
    credentials.username.trim() === '' ||
    !credentials.password ||
    typeof credentials.password !== 'string' ||
    credentials.password.trim() === ''
  ) {
    return Promise.reject({
      message: 'Las credenciales son inválidas. Se requieren username y password como strings no vacíos.',
      status: null,
      data: null,
    });
  }

  return apiClient.post('/api/auth/login', credentials).then((responseData) => {
    if (responseData && responseData.token) {
      localStorage.setItem('authToken', responseData.token);
    }
    return responseData;
  });
};

export const logoutAdmin = () => {
  localStorage.removeItem('authToken');
};

export const createGreeting = (greetingData) => {
  return apiClient.post('/api/greetings', greetingData);
};

export const updateGreeting = (countryCode, greetingData) => {
  if (countryCode === null || countryCode === undefined || String(countryCode).trim() === '') {
    return Promise.reject({
      message: 'El parámetro countryCode es requerido para actualizar un saludo.',
      status: null,
      data: null,
    });
  }

  const normalizedCode = String(countryCode).toUpperCase();
  return apiClient.put(`/api/greetings/${normalizedCode}`, greetingData);
};

export const deleteGreeting = (countryCode) => {
  if (countryCode === null || countryCode === undefined || String(countryCode).trim() === '') {
    return Promise.reject({
      message: 'El parámetro countryCode es requerido para eliminar un saludo.',
      status: null,
      data: null,
    });
  }

  const normalizedCode = String(countryCode).toUpperCase();
  return apiClient.delete(`/api/greetings/${normalizedCode}`);
};

export default apiClient;