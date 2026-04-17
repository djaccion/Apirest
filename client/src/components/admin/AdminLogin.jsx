import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);

  const navigate = useNavigate();

  const validateForm = () => {
    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      return 'El nombre de usuario no puede estar vacío.';
    }

    if (trimmedUsername.length < 3 || trimmedUsername.length > 50) {
      return 'El nombre de usuario debe tener entre 3 y 50 caracteres.';
    }

    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(trimmedUsername)) {
      return 'El nombre de usuario solo puede contener letras, números, guiones y guiones bajos.';
    }

    if (!password) {
      return 'La contraseña no puede estar vacía.';
    }

    if (password.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres.';
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrorMessage(null);

    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    if (isBlocked) {
      setErrorMessage('Demasiados intentos fallidos. Por favor espere 30 segundos antes de intentar nuevamente.');
      return;
    }

    if (attemptCount >= 5) {
      setErrorMessage('Demasiados intentos fallidos. Por favor espere 30 segundos antes de intentar nuevamente.');
      setIsBlocked(true);
      setTimeout(() => {
        setIsBlocked(false);
        setAttemptCount(0);
        setErrorMessage(null);
      }, 30000);
      return;
    }

    const sanitizedUsername = DOMPurify.sanitize(username.trim());

    setIsLoading(true);

    try {
      const apiUrl = process.env.REACT_APP_API_URL || '';
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: sanitizedUsername,
          password: password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const token = data.token;
        sessionStorage.setItem('adminToken', token);
        sessionStorage.setItem('adminUser', sanitizedUsername);
        navigate('/admin/dashboard');
      } else {
        setAttemptCount((prev) => prev + 1);
        let errorMsg = 'Credenciales incorrectas. Por favor verifique sus datos.';
        try {
          const errorData = await response.json();
          if (errorData && errorData.message) {
            errorMsg = errorData.message;
          }
        } catch {
          // usar mensaje genérico
        }
        setErrorMessage(errorMsg);
      }
    } catch (networkError) {
      setAttemptCount((prev) => prev + 1);
      setErrorMessage('No se pudo conectar con el servidor. Por favor verifique su conexión e intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f0f2f5',
        padding: '16px',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12)',
          padding: '40px',
          width: '100%',
          maxWidth: '420px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#1a1a2e',
              margin: '0 0 8px 0',
            }}
          >
            Tsoft Greetings
          </h1>
          <p
            style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: '0',
            }}
          >
            Panel de Administración
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="username"
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '6px',
              }}
            >
              Usuario
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              aria-describedby={errorMessage ? 'error-message' : undefined}
              disabled={isLoading || isBlocked}
              placeholder="Ingrese su usuario"
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '14px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                outline: 'none',
                boxSizing: 'border-box',
                backgroundColor: isLoading || isBlocked ? '#f9fafb' : '#ffffff',
                color: '#111827',
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '6px',
              }}
            >
              Contraseña
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                aria-describedby={errorMessage ? 'error-message' : undefined}
                disabled={isLoading || isBlocked}
                placeholder="Ingrese su contraseña"
                style={{
                  width: '100%',
                  padding: '10px 44px 10px 14px',
                  fontSize: '14px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  backgroundColor: isLoading || isBlocked ? '#f9fafb' : '#ffffff',
                  color: '#111827',
                }}
              />
              <button
                type="button"
                onClick={toggleShowPassword}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                disabled={isLoading || isBlocked}
                style={{
                  position: 'absolute',
                  right: '10px',
                  background: 'none',
                  border: 'none',
                  cursor: isLoading || isBlocked ? 'not-allowed' : 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6b7280',
                }}
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {errorMessage && (
            <div
              id="error-message"
              role="alert"
              aria-live="assertive"
              style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '20px',
                fontSize: '13px',
                color: '#dc2626',
              }}
            >
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || isBlocked}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '15px',
              fontWeight: '600',
              color: '#ffffff',
              backgroundColor: isLoading || isBlocked ? '#9ca3af' : '#4f46e5',
              border: 'none',
              borderRadius: '8px',
              cursor: isLoading || isBlocked ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background-color 0.2s ease',
            }}
          >
            {isLoading ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  style={{
                    animation: 'spin 1s linear infinite',
                  }}
                >
                  <line x1="12" y1="2" x2="12" y2="6" />
                  <line x1="12" y1="18" x2="12" y2="22" />
                  <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                  <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                  <line x1="2" y1="12" x2="6" y2="12" />
                  <line x1="18" y1="12" x2="22" y2="12" />
                  <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
                  <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
                </svg>
                Verificando...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default AdminLogin;