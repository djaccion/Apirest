import React, { useContext, useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LanguageContext } from '../../context/LanguageContext';
import { AuthContext } from '../../context/AuthContext';
import styles from './Navbar.module.css';

const Navbar = () => {
  const { selectedCountry, selectedLanguage } = useContext(LanguageContext);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getNavLinkClass = ({ isActive }) =>
    isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink;

  const languageIndicator = selectedCountry || selectedLanguage || null;

  return (
    <nav
      role="navigation"
      aria-label="Navegación principal"
      className={styles.navbar}
    >
      <a href="#main-content" className={styles.skipLink}>
        Saltar al contenido principal
      </a>

      <div className={styles.container}>
        <div className={styles.brand}>
          <Link to="/">Tsoft Greetings</Link>
        </div>

        <button
          className={styles.hamburger}
          onClick={toggleMenu}
          aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-controls="main-nav-list"
          aria-expanded={isMenuOpen}
          type="button"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <ul
          id="main-nav-list"
          className={`${styles.navList} ${isMenuOpen ? styles.menuOpen : ''}`}
          aria-expanded={isMenuOpen}
          role="list"
        >
          <li className={styles.navItem}>
            <NavLink to="/" end className={getNavLinkClass}>
              Home
            </NavLink>
          </li>
          <li className={styles.navItem}>
            <NavLink to="/explore" className={getNavLinkClass}>
              Explore
            </NavLink>
          </li>
          <li className={styles.navItem}>
            <NavLink to="/about" className={getNavLinkClass}>
              About
            </NavLink>
          </li>
        </ul>

        <div className={styles.controls}>
          {languageIndicator && (
            <span
              className={styles.languageIndicator}
              role="status"
              aria-live="polite"
            >
              {languageIndicator}
            </span>
          )}

          {user ? (
            <>
              <span className={styles.userGreeting}>
                {user.username ? `Hola, ${user.username}` : 'Admin'}
              </span>
              <NavLink
                to="/admin/dashboard"
                className={getNavLinkClass}
                aria-label="Ir al panel de administración"
              >
                Dashboard
              </NavLink>
              <button
                type="button"
                onClick={handleLogout}
                className={styles.logoutButton}
                aria-label="Cerrar sesión"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <NavLink
              to="/admin/login"
              className={`${styles.navLink} ${styles.adminLink}`}
              aria-label="Acceso administrador"
            >
              Admin
            </NavLink>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;