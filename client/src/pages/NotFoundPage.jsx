import React from 'react';
import { useNavigate } from 'react-router-dom';

function NotFoundPage() {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  const styles = {
    main: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '2rem',
      textAlign: 'center',
      boxSizing: 'border-box',
      fontFamily: 'sans-serif',
      backgroundColor: '#f9f9f9',
      color: '#333',
    },
    errorCode: {
      fontSize: 'clamp(6rem, 20vw, 12rem)',
      fontWeight: '900',
      lineHeight: '1',
      margin: '0 0 0.5rem 0',
      color: '#2c3e50',
      letterSpacing: '-0.02em',
    },
    title: {
      fontSize: 'clamp(1.2rem, 4vw, 2rem)',
      fontWeight: '600',
      margin: '0 0 1rem 0',
      color: '#2c3e50',
      lineHeight: '1.4',
    },
    description: {
      fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)',
      margin: '0 0 2rem 0',
      maxWidth: '480px',
      lineHeight: '1.6',
      color: '#555',
    },
    button: {
      padding: '0.85rem 2.2rem',
      fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)',
      fontWeight: '600',
      backgroundColor: '#2c3e50',
      color: '#ffffff',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease',
      minWidth: '180px',
    },
    decorative: {
      marginTop: '2.5rem',
      fontSize: 'clamp(2rem, 6vw, 3.5rem)',
      lineHeight: '1',
    },
  };

  return (
    <main style={styles.main}>
      <p style={styles.errorCode} aria-label="Error 404">
        404
      </p>
      <h1 style={styles.title}>
        Página no encontrada · Page Not Found
      </h1>
      <p style={styles.description}>
        La página que buscas no existe o fue movida.
        <br />
        The page you are looking for does not exist or has been moved.
      </p>
      <button
        style={styles.button}
        onClick={handleGoHome}
        type="button"
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#1a252f';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = '#2c3e50';
        }}
      >
        Volver al inicio · Go Home
      </button>
      <span
        style={styles.decorative}
        role="img"
        aria-label="Globo terráqueo"
      >
        🌍
      </span>
    </main>
  );
}

export default NotFoundPage;