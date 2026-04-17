import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { getGreetings, deleteGreeting, toggleGreetingStatus } from '../../services/greetingService';
import ConfirmModal from './ConfirmModal';

const GreetingTable = () => {
  const [greetings, setGreetings] = useState([]);
  const [filteredGreetings, setFilteredGreetings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGreeting, setSelectedGreeting] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchGreetings();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredGreetings(greetings);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = greetings.filter((greeting) => {
        return (
          (greeting.countryName && greeting.countryName.toLowerCase().includes(term)) ||
          (greeting.countryCode && greeting.countryCode.toLowerCase().includes(term)) ||
          (greeting.language && greeting.language.toLowerCase().includes(term))
        );
      });
      setFilteredGreetings(filtered);
    }
    setCurrentPage(1);
  }, [searchTerm, greetings]);

  const fetchGreetings = async () => {
    try {
      const token = localStorage.getItem('token');
      const data = await getGreetings(token);
      setGreetings(data);
      setFilteredGreetings(data);
    } catch (err) {
      setError(err.message || 'Error al cargar los saludos');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(filteredGreetings.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredGreetings.slice(indexOfFirstItem, indexOfLastItem);

  const handleSearch = (e) => {
    const sanitized = DOMPurify.sanitize(e.target.value);
    const limited = sanitized.slice(0, 50);
    setSearchTerm(limited);
  };

  const handleDeleteClick = (greeting) => {
    setSelectedGreeting(greeting);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      await deleteGreeting(selectedGreeting._id, token);
      setGreetings((prev) => prev.filter((g) => g._id !== selectedGreeting._id));
      setShowConfirmModal(false);
      setSelectedGreeting(null);
    } catch (err) {
      setError(err.message || 'Error al eliminar el saludo');
    }
  };

  const handleToggleStatus = async (greeting) => {
    try {
      const token = localStorage.getItem('token');
      const updated = await toggleGreetingStatus(greeting._id, !greeting.isActive, token);
      setGreetings((prev) =>
        prev.map((g) =>
          g._id === greeting._id ? { ...g, isActive: updated.isActive } : g
        )
      );
    } catch (err) {
      setError(err.message || 'Error al cambiar el estado del saludo');
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const activeCount = greetings.filter((g) => g.isActive === true).length;

  return (
    <div className="greeting-table-container">
      <div className="greeting-table-header">
        <h2>Gestión de Saludos</h2>
        <p>Total de registros activos: <strong>{activeCount}</strong></p>
      </div>

      <div className="greeting-table-controls">
        <input
          type="text"
          placeholder="Buscar por país, código o idioma..."
          value={searchTerm}
          onChange={handleSearch}
          maxLength={50}
          aria-label="Buscar saludos por país, código o idioma"
          className="greeting-search-input"
        />
      </div>

      {error && (
        <div role="alert" className="error-message">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            aria-label="Cerrar mensaje de error"
            className="error-close-btn"
          >
            &times;
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading-spinner" aria-live="polite" aria-busy="true">
          <span className="sr-only">Cargando saludos...</span>
          <div className="spinner" aria-hidden="true"></div>
        </div>
      ) : (
        <>
          {filteredGreetings.length === 0 ? (
            <p className="no-results">No se encontraron registros.</p>
          ) : (
            <div className="table-wrapper">
              <table className="greeting-table">
                <thead>
                  <tr>
                    <th scope="col">Bandera</th>
                    <th scope="col">País</th>
                    <th scope="col">Código</th>
                    <th scope="col">Idioma</th>
                    <th scope="col">Saludo Informal</th>
                    <th scope="col">Saludo Formal</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((greeting) => (
                    <tr key={greeting._id}>
                      <td>
                        {greeting.flagUrl ? (
                          <img
                            src={DOMPurify.sanitize(greeting.flagUrl)}
                            alt={`Bandera de ${DOMPurify.sanitize(greeting.countryName || '')}`}
                            className="flag-img"
                            width="32"
                            height="24"
                            loading="lazy"
                          />
                        ) : (
                          <span aria-label="Sin bandera">—</span>
                        )}
                      </td>
                      <td>{DOMPurify.sanitize(greeting.countryName || '')}</td>
                      <td>{DOMPurify.sanitize(greeting.countryCode || '')}</td>
                      <td>{DOMPurify.sanitize(greeting.language || '')}</td>
                      <td>{DOMPurify.sanitize(greeting.greeting || '')}</td>
                      <td>{DOMPurify.sanitize(greeting.formalGreeting || '')}</td>
                      <td>
                        <span
                          className={`status-badge ${greeting.isActive ? 'status-active' : 'status-inactive'}`}
                        >
                          {greeting.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="actions-cell">
                        <button
                          onClick={() => handleToggleStatus(greeting)}
                          className={`btn btn-toggle ${greeting.isActive ? 'btn-deactivate' : 'btn-activate'}`}
                          aria-label={`${greeting.isActive ? 'Desactivar' : 'Activar'} saludo de ${greeting.countryName}`}
                        >
                          {greeting.isActive ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          onClick={() => handleDeleteClick(greeting)}
                          className="btn btn-delete"
                          aria-label={`Eliminar saludo de ${greeting.countryName}`}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <nav className="pagination" aria-label="Paginación de saludos">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Página anterior"
                className="pagination-btn"
              >
                &laquo; Anterior
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`pagination-btn ${currentPage === page ? 'pagination-btn-active' : ''}`}
                  aria-label={`Ir a página ${page}`}
                  aria-current={currentPage === page ? 'page' : undefined}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Página siguiente"
                className="pagination-btn"
              >
                Siguiente &raquo;
              </button>
            </nav>
          )}
        </>
      )}

      {showConfirmModal && selectedGreeting && (
        <ConfirmModal
          message={`¿Estás seguro de que deseas eliminar el saludo de "${DOMPurify.sanitize(selectedGreeting.countryName || '')}"? Esta acción no se puede deshacer.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setShowConfirmModal(false);
            setSelectedGreeting(null);
          }}
        />
      )}
    </div>
  );
};

export default GreetingTable;