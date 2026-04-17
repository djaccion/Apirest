import React, { useState, useCallback, useMemo } from 'react';
import FlagCard from './FlagCard';
import FlagGridSkeleton from './FlagGridSkeleton';
import useGreetings from '../../hooks/useGreetings';
import { useLanguage } from '../../context/LanguageContext';
import './FlagGrid.css';

const FlagGrid = () => {
  const { greetings, isLoading, error, refetch } = useGreetings();
  const { selectedCountry, setSelectedCountry } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGreetings = useMemo(() => {
    const activeGreetings = greetings.filter((greeting) => greeting.isActive === true);
    if (!searchTerm) {
      return activeGreetings;
    }
    return activeGreetings.filter((greeting) =>
      greeting.countryName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [greetings, searchTerm]);

  const handleFlagSelect = useCallback(
    (countryData) => {
      setSelectedCountry(countryData);
    },
    [setSelectedCountry]
  );

  const handleSearchChange = (event) => {
    const sanitized = event.target.value.slice(0, 50);
    setSearchTerm(sanitized);
  };

  const totalActive = useMemo(
    () => greetings.filter((greeting) => greeting.isActive === true).length,
    [greetings]
  );

  return (
    <div className="flag-grid-container">
      <div className="flag-grid-search">
        <input
          type="text"
          placeholder="Buscar países..."
          value={searchTerm}
          onChange={handleSearchChange}
          maxLength={50}
          aria-label="Buscar países por nombre"
          className="flag-grid-search-input"
        />
      </div>

      {isLoading && <FlagGridSkeleton count={12} />}

      {!isLoading && error !== null && (
        <div className="flag-grid-error" role="alert">
          <p>{error}</p>
          <button onClick={refetch}>Reintentar</button>
        </div>
      )}

      {!isLoading && !error && filteredGreetings.length === 0 && searchTerm !== '' && (
        <div className="flag-grid-empty">
          <p>No se encontraron resultados para "{searchTerm}"</p>
        </div>
      )}

      {!isLoading && !error && filteredGreetings.length > 0 && (
        <div className="flag-grid" role="list" aria-label="Grilla de banderas de países">
          {filteredGreetings.map((greeting) => (
            <FlagCard
              key={greeting.countryCode}
              countryCode={greeting.countryCode}
              countryName={greeting.countryName}
              flagUrl={greeting.flagUrl}
              isSelected={
                selectedCountry !== null &&
                selectedCountry !== undefined &&
                selectedCountry.countryCode === greeting.countryCode
              }
              onSelect={handleFlagSelect}
            />
          ))}
        </div>
      )}

      <p className="flag-grid-count" aria-live="polite">
        Mostrando {filteredGreetings.length} de {totalActive} países
      </p>
    </div>
  );
};

export default FlagGrid;