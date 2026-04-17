import React, { useState, useEffect, useCallback } from 'react';
import DOMPurify from 'dompurify';

const GreetingDisplay = ({ countryCode, countryName, onError }) => {
  const [greetingData, setGreetingData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryTrigger, setRetryTrigger] = useState(0);

  const sanitizeGreetingData = (data) => {
    if (!data || typeof data !== 'object') return null;

    const sanitizedGreeting = DOMPurify.sanitize(data.greeting || '');
    const sanitizedFormalGreeting = DOMPurify.sanitize(data.formalGreeting || '');
    const sanitizedLanguage = DOMPurify.sanitize(data.language || '');
    const sanitizedCountryName = DOMPurify.sanitize(data.countryName || countryName || '');

    let validatedFlagUrl = '';
    if (data.flagUrl && typeof data.flagUrl === 'string' && data.flagUrl.startsWith('https://')) {
      validatedFlagUrl = data.flagUrl;
    }

    return {
      greeting: sanitizedGreeting,
      formalGreeting: sanitizedFormalGreeting,
      language: sanitizedLanguage,
      countryName: sanitizedCountryName,
      flagUrl: validatedFlagUrl,
    };
  };

  useEffect(() => {
    if (!countryCode || countryCode.trim() === '') {
      setGreetingData(null);
      return;
    }

    const abortController = new AbortController();
    const { signal } = abortController;

    const fetchGreeting = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const apiUrl = process.env.REACT_APP_API_URL;
        const url = `${apiUrl}/api/greetings/${countryCode}`;

        const response = await fetch(url, { signal });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('No se encontró información de saludo para el país seleccionado.');
          } else if (response.status >= 500) {
            throw new Error('El servidor no está disponible en este momento. Por favor, intenta más tarde.');
          } else {
            throw new Error('No se pudo obtener el saludo. Por favor, intenta nuevamente.');
          }
        }

        const data = await response.json();

        if (!data || typeof data !== 'object') {
          throw new Error('La respuesta del servidor no tiene el formato esperado.');
        }

        const sanitized = sanitizeGreetingData(data);

        if (!signal.aborted) {
          setGreetingData(sanitized);
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          return;
        }

        const userMessage = err.message || 'Ocurrió un error inesperado. Por favor, intenta nuevamente.';

        if (!signal.aborted) {
          setError(userMessage);
          if (typeof onError === 'function') {
            onError(err);
          }
        }
      } finally {
        if (!signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchGreeting();

    return () => {
      abortController.abort();
    };
  }, [countryCode, retryTrigger]);

  const handleRetry = useCallback(() => {
    setError(null);
    setRetryTrigger((prev) => prev + 1);
  }, []);

  if (isLoading) {
    return (
      <div
        className="greeting-display greeting-display--loading"
        aria-live="polite"
        role="status"
        aria-label="Cargando información del saludo"
      >
        <div className="greeting-display__spinner" aria-hidden="true"></div>
        <p className="greeting-display__loading-text">Cargando saludo...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="greeting-display greeting-display--error"
        aria-live="polite"
        role="alert"
      >
        <p className="greeting-display__error-message">{error}</p>
        <button
          className="greeting-display__retry-button"
          onClick={handleRetry}
          type="button"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (greetingData) {
    const displayCountryName = DOMPurify.sanitize(countryName || greetingData.countryName || '');

    return (
      <div
        className="greeting-display greeting-display--success"
        aria-live="polite"
      >
        <div className="greeting-display__card">
          <header className="greeting-display__header">
            {greetingData.flagUrl && (
              <img
                src={greetingData.flagUrl}
                alt={`Bandera de ${displayCountryName}`}
                className="greeting-display__flag"
              />
            )}
            <h2 className="greeting-display__country-name">{displayCountryName}</h2>
          </header>

          <div className="greeting-display__body">
            <div className="greeting-display__greeting-section">
              <p className="greeting-display__label">Saludo informal</p>
              <p
                className="greeting-display__greeting greeting-display__greeting--informal"
                lang={greetingData.language || undefined}
              >
                {greetingData.greeting}
              </p>
            </div>

            <div className="greeting-display__greeting-section">
              <p className="greeting-display__label">Saludo formal</p>
              <p
                className="greeting-display__greeting greeting-display__greeting--formal"
                lang={greetingData.language || undefined}
              >
                {greetingData.formalGreeting}
              </p>
            </div>
          </div>

          <footer className="greeting-display__footer">
            <p className="greeting-display__language">
              Idioma: {greetingData.language}
            </p>
          </footer>
        </div>
      </div>
    );
  }

  return (
    <div
      className="greeting-display greeting-display--empty"
      aria-live="polite"
    >
      <p className="greeting-display__empty-message">
        Selecciona un país para ver su saludo correspondiente.
      </p>
    </div>
  );
};

export default GreetingDisplay;