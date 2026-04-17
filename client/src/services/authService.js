import axios from 'axios';
import DOMPurify from 'dompurify';

const TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';

const authAxios = axios.create({
  baseURL: `${process.env.REACT_APP_API_URL}/api/auth`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

authAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

authAxios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        const newAccessToken = await refreshToken();
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return authAxios(originalRequest);
      } catch (refreshError) {
        logout();
        return Promise.reject(new Error('Session expired. Please log in again.'));
      }
    }

    const message =
      error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : 'An unexpected error occurred. Please try again.';

    return Promise.reject(new Error(message));
  }
);

export const login = async (username, password) => {
  const sanitizedUsername = DOMPurify.sanitize(username);
  const sanitizedPassword = DOMPurify.sanitize(password);

  const response = await authAxios.post('/login', {
    username: sanitizedUsername,
    password: sanitizedPassword,
  });

  const { accessToken, refreshToken: receivedRefreshToken, user } = response.data;

  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, receivedRefreshToken);

  return {
    username: user.username,
    role: user.role,
  };
};

export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);

  (async () => {
    try {
      await authAxios.post('/logout');
    } catch (_error) {
    }
  })();
};

const refreshToken = async () => {
  const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

  if (!storedRefreshToken) {
    return Promise.reject(new Error('No active session found.'));
  }

  const response = await authAxios.post('/refresh', {
    refreshToken: storedRefreshToken,
  });

  const { accessToken, refreshToken: rotatedRefreshToken } = response.data;

  localStorage.setItem(TOKEN_KEY, accessToken);

  if (rotatedRefreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, rotatedRefreshToken);
  }

  return accessToken;
};

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY) || null;
};

export const isAuthenticated = () => {
  const token = getToken();

  if (!token) {
    return false;
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }

    const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payloadJson = atob(payloadBase64);
    const payload = JSON.parse(payloadJson);

    const currentTimestampInSeconds = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp > currentTimestampInSeconds) {
      return true;
    }

    return false;
  } catch (_error) {
    return false;
  }
};