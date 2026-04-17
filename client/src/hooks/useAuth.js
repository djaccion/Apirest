import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const verifyStoredToken = (token) => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Token malformado');
      }

      const payload = JSON.parse(atob(parts[1]));

      const currentTime = Date.now() / 1000;
      if (payload.exp && payload.exp < currentTime) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminRefreshToken');
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      setUser({
        username: payload.username,
        role: payload.role,
      });
      setIsAuthenticated(true);
    } catch (err) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminRefreshToken');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('adminToken');

    if (token) {
      verifyStoredToken(token);
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }

    setIsLoading(false);
  }, []);

  const login = useCallback(async (username, password) => {
    if (!username || username.trim() === '') {
      setError('El nombre de usuario no puede estar vacío.');
      return;
    }

    if (!password || password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.login({ username: username.trim(), password });

      const { token, refreshToken, user: userData } = response.data;

      localStorage.setItem('adminToken', token);

      if (refreshToken) {
        localStorage.setItem('adminRefreshToken', refreshToken);
      }

      setUser(userData);
      setIsAuthenticated(true);

      navigate('/admin/dashboard');
    } catch (err) {
      const serverMessage =
        err?.response?.data?.message || err?.response?.data?.error || null;

      const safeMessage =
        serverMessage && typeof serverMessage === 'string' && serverMessage.length < 200
          ? serverMessage
          : 'Credenciales inválidas. Por favor, verifica tu usuario y contraseña.';

      setError(safeMessage);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const logout = useCallback(() => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRefreshToken');

    setUser(null);
    setIsAuthenticated(false);
    setError(null);

    try {
      authService.logout().catch(() => {});
    } catch (_) {}

    navigate('/admin/login', { replace: true });
  }, [navigate]);

  const refreshAccessToken = useCallback(async () => {
    const storedRefreshToken = localStorage.getItem('adminRefreshToken');

    if (!storedRefreshToken) {
      logout();
      return null;
    }

    try {
      const response = await authService.refreshToken(storedRefreshToken);

      const { token: newToken } = response.data;

      localStorage.setItem('adminToken', newToken);

      return newToken;
    } catch (err) {
      logout();
      return null;
    }
  }, [logout]);

  const getAuthHeader = () => {
    const token = localStorage.getItem('adminToken');

    if (!token) {
      return {};
    }

    return {
      Authorization: `Bearer ${token}`,
    };
  };

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    refreshAccessToken,
    getAuthHeader,
    clearError,
  };
};

export default useAuth;