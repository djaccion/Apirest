import { useState, useEffect, useCallback, lazy, Suspense, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import greetingsService from '../services/greetingsService';
import DOMPurify from 'dompurify';
import styles from './AdminPage.module.css';

const GreetingTable = lazy(() => import('../components/GreetingTable'));
const GreetingFormModal = lazy(() => import('../components/GreetingFormModal'));
const ConfirmDeleteModal = lazy(() => import('../components/ConfirmDeleteModal'));

function AdminPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user, logout } = useAuth();

  const [greetings, setGreetings] = useState([]);
  const [loadingState, setLoadingState] = useState('idle');
  const [errorMessage, setErrorMessage] = useState(null);
  const [selectedGreeting, setSelectedGreeting] = useState(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [greetingToDelete, setGreetingToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
    }
  }, []);

  const fetchGreetings = useCallback(async (signal) => {
    setLoadingState('loading');
    setErrorMessage(null);
    try {
      const data = await greetingsService.getAll(token, { page: currentPage }, signal);
      const sanitized = data.map((item) => ({
        ...item,
        countryName: DOMPurify.sanitize(item.countryName || ''),
        countryCode: DOMPurify.sanitize(item.countryCode || ''),
        language: DOMPurify.sanitize(item.language || ''),
        greeting: DOMPurify.sanitize(item.greeting || ''),
        formalGreeting: DOMPurify.sanitize(item.formalGreeting || ''),
        flagUrl: DOMPurify.sanitize(item.flagUrl || ''),
      }));
      setGreetings(sanitized);
      setLoadingState('success');
    } catch (error) {
      if (error.name === 'AbortError') {
        return;
      }
      if (error.status === 401 || error.message === '401') {
        logout();
        navigate('/login');
        return;
      }
      setErrorMessage('Ha ocurrido un error al cargar los saludos. Por favor, inténtalo de nuevo.');
      setLoadingState('error');
    }
  }, [currentPage, token]);

  useEffect(() => {
    const controller = new AbortController();
    fetchGreetings(controller.signal);
    return () => {
      controller.abort();
    };
  }, [fetchGreetings, currentPage]);

  const handleCreateNew = () => {
    setSelectedGreeting(null);
    setIsFormModalOpen(true);
  };

  const handleEdit = (greeting) => {
    setSelectedGreeting({ ...greeting });
    setIsFormModalOpen(true);
  };

  const handleDeleteRequest = (id) => {
    setGreetingToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await greetingsService.delete(greetingToDelete, token);
      setIsDeleteModalOpen(false);
      setGreetingToDelete(null);
      fetchGreetings();
    } catch (error) {
      if (error.status === 401 || error.message === '401') {
        logout();
        navigate('/login');
        return;
      }
      setErrorMessage('No se pudo eliminar el saludo. Por favor, inténtalo de nuevo.');
    }
  };

  const handleFormSubmit = async (formData) => {
    const sanitizedData = {
      ...formData,
      countryName: DOMPurify.sanitize(formData.countryName || ''),
      countryCode: DOMPurify.sanitize(formData.countryCode || ''),
      language: DOMPurify.sanitize(formData.language || ''),
      greeting: DOMPurify.sanitize(formData.greeting || ''),
      formalGreeting: DOMPurify.sanitize(formData.formalGreeting || ''),
      flagUrl: DOMPurify.sanitize(formData.flagUrl || ''),
    };

    try {
      if (selectedGreeting) {
        await greetingsService.update(selectedGreeting._id, sanitizedData, token);
      } else {
        await greetingsService.create(sanitizedData, token);
      }
      setIsFormModalOpen(false);
      setSelectedGreeting(null);
      fetchGreetings();
    } catch (error) {
      if (error.status === 401 || error.message === '401') {
        logout();
        navigate('/login');
        return;
      }
      setErrorMessage('No se pudo guardar el saludo. Por favor, inténtalo de nuevo.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearchChange = (e) => {
    const value = DOMPurify.sanitize(e.target.value);
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const filteredGreetings = useMemo(() => {
    if (!searchTerm.trim()) {
      return greetings;
    }
    const term = searchTerm.toLowerCase();
    return greetings.filter(
      (g) =>
        (g.countryName && g.countryName.toLowerCase().includes(term)) ||
        (g.countryCode && g.countryCode.toLowerCase().includes(term)) ||
        (g.greeting && g.greeting.toLowerCase().includes(term))
    );
  }, [greetings, searchTerm]);

  return (
    <div className={styles.adminPage}>
      <header className={styles.adminHeader}>
        <h1 className={styles.adminTitle}>Panel de Administración</h1>
        <div className={styles.adminHeaderActions}>
          {user && (
            <span className={styles.adminUser}>
              {DOMPurify.sanitize(user.username || '')}
            </span>
          )}
          <button
            className={styles.logoutButton}
            onClick={handleLogout}
            type="button"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className={styles.adminMain}>
        <div className={styles.adminToolbar}>
          <div className={styles.searchContainer}>
            <label htmlFor="search-input" className={styles.searchLabel}>
              Buscar:
            </label>
            <input
              id="search-input"
              type="text"
              className={styles.searchInput}
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="País, código o saludo..."
              aria-label="Buscar saludos"
            />
          </div>
          <button
            className={styles.createButton}
            onClick={handleCreateNew}
            type="button"
          >
            + Nuevo Saludo
          </button>
        </div>

        {errorMessage && (
          <div className={styles.errorBanner} role="alert" aria-live="assertive">
            <p>{errorMessage}</p>
            <button
              type="button"
              className={styles.errorDismiss}
              onClick={() => setErrorMessage(null)}
              aria-label="Cerrar mensaje de error"
            >
              ×
            </button>
          </div>
        )}

        {loadingState === 'loading' && (
          <div className={styles.loadingContainer} role="status" aria-live="polite">
            <p>Cargando saludos...</p>
          </div>
        )}

        {loadingState !== 'loading' && (
          <Suspense
            fallback={
              <div className={styles.loadingContainer} role="status">
                <p>Cargando tabla...</p>
              </div>
            }
          >
            <GreetingTable
              greetings={filteredGreetings}
              onEdit={handleEdit}
              onDeleteRequest={handleDeleteRequest}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </Suspense>
        )}
      </main>

      <Suspense fallback={null}>
        {isFormModalOpen && (
          <GreetingFormModal
            isOpen={isFormModalOpen}
            greeting={selectedGreeting}
            onSubmit={handleFormSubmit}
            onClose={() => {
              setIsFormModalOpen(false);
              setSelectedGreeting(null);
            }}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {isDeleteModalOpen && (
          <ConfirmDeleteModal
            isOpen={isDeleteModalOpen}
            onConfirm={handleDeleteConfirm}
            onCancel={() => {
              setIsDeleteModalOpen(false);
              setGreetingToDelete(null);
            }}
          />
        )}
      </Suspense>
    </div>
  );
}

export default AdminPage;