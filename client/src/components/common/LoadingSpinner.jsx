import React from 'react';

const SIZE_MAP = {
  small: 24,
  medium: 48,
  large: 72,
};

const DEFAULT_SIZE = 'medium';
const DEFAULT_COLOR = '#4A90D9';
const DEFAULT_ARIA_LABEL = 'Loading content';
const MESSAGE_ID = 'loading-spinner-message';

const spinnerKeyframes = `
  @keyframes loadingSpinnerRotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

function LoadingSpinner({
  size = DEFAULT_SIZE,
  message = '',
  fullScreen = false,
  color = DEFAULT_COLOR,
  ariaLabel = DEFAULT_ARIA_LABEL,
}) {
  const resolvedSize = SIZE_MAP[size] !== undefined ? SIZE_MAP[size] : SIZE_MAP[DEFAULT_SIZE];
  const strokeWidth = Math.max(2, resolvedSize / 12);
  const radius = (resolvedSize - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashArray = circumference;
  const dashOffset = circumference * 0.25;
  const center = resolvedSize / 2;

  const hasMessage = typeof message === 'string' && message.trim().length > 0;

  const containerStyle = fullScreen
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }
    : {
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      };

  const svgStyle = {
    animation: 'loadingSpinnerRotate 0.8s linear infinite',
    display: 'block',
  };

  const messageStyle = {
    marginTop: '12px',
    color: color,
    fontSize: '14px',
    textAlign: 'center',
    maxWidth: '200px',
    wordBreak: 'break-word',
  };

  return (
    <>
      <style>{spinnerKeyframes}</style>
      <div
        role="status"
        aria-label={ariaLabel}
        aria-live="polite"
        aria-describedby={hasMessage ? MESSAGE_ID : undefined}
        style={containerStyle}
      >
        <svg
          aria-hidden="true"
          width={resolvedSize}
          height={resolvedSize}
          viewBox={`0 0 ${resolvedSize} ${resolvedSize}`}
          xmlns="http://www.w3.org/2000/svg"
          style={svgStyle}
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
          />
        </svg>
        {hasMessage && (
          <p id={MESSAGE_ID} style={messageStyle}>
            {message}
          </p>
        )}
      </div>
    </>
  );
}

export default LoadingSpinner;