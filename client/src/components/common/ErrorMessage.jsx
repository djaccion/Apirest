import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './ErrorMessage.css';

const ICONS = {
  error: '✖',
  warning: '⚠',
  info: 'ℹ',
};

const ARIA_LIVE = {
  error: 'assertive',
  warning: 'polite',
  info: 'polite',
};

function ErrorMessage({ message, type, dismissible, onDismiss, testId }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (message && message.trim() !== '') {
      setIsVisible(true);
    }
  }, [message]);

  if (!message || message.trim() === '') {
    return null;
  }

  if (!isVisible) {
    return null;
  }

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const containerClass = `error-message error-message--${type}`;
  const ariaLive = ARIA_LIVE[type] || 'polite';
  const icon = ICONS[type] || ICONS.error;

  return (
    <div
      className={containerClass}
      role="alert"
      aria-live={ariaLive}
      data-testid={testId ? `${testId}-container` : undefined}
    >
      <span className="error-message__icon" aria-hidden="true">
        {icon}
      </span>
      <span className="error-message__text">{message}</span>
      {dismissible && (
        <button
          className="error-message__dismiss"
          aria-label="Cerrar mensaje de error"
          onClick={handleDismiss}
          data-testid={testId ? `${testId}-dismiss-button` : undefined}
          type="button"
        >
          ✕
        </button>
      )}
    </div>
  );
}

ErrorMessage.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['error', 'warning', 'info']),
  dismissible: PropTypes.bool,
  onDismiss: PropTypes.func,
  testId: PropTypes.string,
};

ErrorMessage.defaultProps = {
  type: 'error',
  dismissible: false,
  onDismiss: undefined,
  testId: undefined,
};

export default ErrorMessage;