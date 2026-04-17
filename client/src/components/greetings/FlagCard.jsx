import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';

export const FlagCard = ({
  countryCode,
  countryName,
  greeting,
  formalGreeting,
  flagUrl,
  isActive,
  isSelected,
  onSelect,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleClick = useCallback(() => {
    if (!isActive) return;
    onSelect({ countryCode, countryName, greeting, formalGreeting });
  }, [isActive, onSelect, countryCode, countryName, greeting, formalGreeting]);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  const handleImageError = () => {
    setImgError(true);
  };

  const rootClassName = [
    'flag-card',
    isSelected ? 'flag-card--selected' : '',
    isHovered ? 'flag-card--hovered' : '',
    isActive ? 'flag-card--active' : 'flag-card--disabled',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={rootClassName}
      role="button"
      tabIndex={isActive ? 0 : -1}
      aria-label={`Seleccionar ${countryName} saludo: ${greeting}`}
      aria-pressed={isSelected}
      aria-disabled={!isActive}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flag-card__image-container">
        {!imgError ? (
          <img
            src={flagUrl}
            alt={`Bandera de ${countryName}`}
            loading="lazy"
            onError={handleImageError}
            className="flag-card__image"
          />
        ) : (
          <div className="flag-card__image-placeholder">
            {countryCode}
          </div>
        )}
      </div>

      <div className="flag-card__content">
        <h3 className="flag-card__country-name">{countryName}</h3>
        <p className="flag-card__greeting">
          <span className="flag-card__label">Saludo:</span> {greeting}
        </p>
        <p className="flag-card__formal-greeting">
          <span className="flag-card__label">Formal:</span> {formalGreeting}
        </p>
      </div>

      {isSelected && (
        <div className="flag-card__selected-indicator">
          ✓ Seleccionado
        </div>
      )}
    </div>
  );
};

FlagCard.propTypes = {
  countryCode: PropTypes.string.isRequired,
  countryName: PropTypes.string.isRequired,
  greeting: PropTypes.string.isRequired,
  formalGreeting: PropTypes.string.isRequired,
  flagUrl: PropTypes.string.isRequired,
  isActive: PropTypes.bool.isRequired,
  isSelected: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
};

FlagCard.defaultProps = {
  isSelected: false,
  onSelect: () => {},
};

export default FlagCard;