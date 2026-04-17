import React, { useState, useEffect, useCallback, Suspense, useContext } from 'react';
import FlagSelector from '../components/FlagSelector';
import GreetingDisplay from '../components/GreetingDisplay';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import useGreeting from '../hooks/useGreeting';
import { AppContext } from '../context/AppContext';
import './HomePage.css';

const HomePage = () => {
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  const { currentLanguage, setCurrentLanguage } = useContext(AppContext);

  const { greetingData, isLoading, error, refetch } = useGreeting(selectedCountry?.countryCode);

  useEffect(() => {
    if (greetingData && greetingData.language) {
      setCurrentLanguage(greetingData.language);
    }
  }, [greetingData, setCurrentLanguage]);

  useEffect(() => {
    if (selectedCountry !== null) {
      setHasInteracted(true);
    }
  }, [selectedCountry]);

  const handleCountrySelect = useCallback((country) => {
    setSelectedCountry(country);
  }, []);

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <main className="home-page" role="main">
      <section
        className="hero-section"
        aria-label="Tsoft Greetings - Aplicación para descubrir saludos de diferentes países del mundo"
      >
        <h1 className="app-title">Tsoft Greetings</h1>
        <p className="app-subtitle">
          Selecciona un país para descubrir cómo se saluda en su idioma y cultura
        </p>
      </section>

      <section
        className="selector-section"
        aria-label="Selecciona un país para ver su saludo"
      >
        <Suspense fallback={<LoadingSpinner />}>
          <FlagSelector
            onCountrySelect={handleCountrySelect}
            selectedCountryCode={selectedCountry?.countryCode}
          />
        </Suspense>
      </section>

      {hasInteracted && (
        <section
          className="greeting-section"
          aria-live="polite"
        >
          {isLoading && <LoadingSpinner />}
          {error && !isLoading && (
            <ErrorMessage
              message={error.message}
              onRetry={handleRetry}
            />
          )}
          {greetingData && !error && !isLoading && (
            <GreetingDisplay
              greetingData={greetingData}
              countryName={selectedCountry?.countryName}
            />
          )}
        </section>
      )}
    </main>
  );
};

export default HomePage;