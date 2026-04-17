import React, { useState, useEffect, useCallback } from 'react';
import DOMPurify from 'dompurify';

const GreetingForm = ({ initialData, onSubmit, onCancel, isLoading, error }) => {
  const defaultFormData = {
    countryCode: '',
    countryName: '',
    language: '',
    greeting: '',
    formalGreeting: '',
    flagUrl: '',
    isActive: true,
  };

  const [formData, setFormData] = useState(defaultFormData);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        countryCode: initialData.countryCode || '',
        countryName: initialData.countryName || '',
        language: initialData.language || '',
        greeting: initialData.greeting || '',
        formalGreeting: initialData.formalGreeting || '',
        flagUrl: initialData.flagUrl || '',
        isActive: initialData.isActive !== undefined ? initialData.isActive : true,
      });
    } else {
      setFormData(defaultFormData);
    }
    setFieldErrors({});
    setIsDirty(false);
  }, [initialData]);

  const validateField = (name, value) => {
    switch (name) {
      case 'countryCode': {
        if (!value || value.trim() === '') return 'El código de país es requerido.';
        if (!/^[A-Z]{2}$/.test(value)) return 'El código de país debe tener exactamente 2 letras mayúsculas (A-Z).';
        return '';
      }
      case 'countryName': {
        if (!value || value.trim() === '') return 'El nombre del país es requerido.';
        if (value.trim().length < 2) return 'El nombre del país debe tener al menos 2 caracteres.';
        if (value.trim().length > 100) return 'El nombre del país no puede superar los 100 caracteres.';
        if (/[<>"'`;&]/.test(value)) return 'El nombre del país contiene caracteres no permitidos.';
        return '';
      }
      case 'language': {
        if (!value || value.trim() === '') return 'El idioma es requerido.';
        if (value.trim().length < 2) return 'El idioma debe tener al menos 2 caracteres.';
        if (value.trim().length > 50) return 'El idioma no puede superar los 50 caracteres.';
        return '';
      }
      case 'greeting': {
        if (!value || value.trim() === '') return 'El saludo es requerido.';
        if (value.trim().length < 1) return 'El saludo debe tener al menos 1 carácter.';
        if (value.trim().length > 200) return 'El saludo no puede superar los 200 caracteres.';
        return '';
      }
      case 'formalGreeting': {
        if (!value || value.trim() === '') return 'El saludo formal es requerido.';
        if (value.trim().length < 1) return 'El saludo formal debe tener al menos 1 carácter.';
        if (value.trim().length > 200) return 'El saludo formal no puede superar los 200 caracteres.';
        return '';
      }
      case 'flagUrl': {
        if (!value || value.trim() === '') return 'La URL de la bandera es requerida.';
        if (/^javascript:/i.test(value.trim())) return 'La URL de la bandera no es válida.';
        if (/^data:/i.test(value.trim())) return 'La URL de la bandera no es válida.';
        if (!/^https:\/\/.+/.test(value.trim())) return 'La URL de la bandera debe comenzar con https://.';
        try {
          new URL(value.trim());
        } catch {
          return 'La URL de la bandera no es una URL válida.';
        }
        return '';
      }
      case 'isActive':
        return '';
      default:
        return '';
    }
  };

  const validateAllFields = () => {
    const errors = {};
    let isValid = true;

    Object.keys(formData).forEach((fieldName) => {
      const value = formData[fieldName];
      const errorMsg = validateField(fieldName, value);
      if (errorMsg) {
        errors[fieldName] = errorMsg;
        isValid = false;
      } else {
        errors[fieldName] = '';
      }
    });

    return { errors, isValid };
  };

  const handleChange = useCallback((event) => {
    const { name, value, type, checked } = event.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: fieldValue,
    }));

    const errorMsg = validateField(name, fieldValue);
    setFieldErrors((prev) => ({
      ...prev,
      [name]: errorMsg,
    }));

    setIsDirty(true);
  }, []);

  const handleBlur = useCallback((event) => {
    const { name, value, type, checked } = event.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    const errorMsg = validateField(name, fieldValue);
    setFieldErrors((prev) => ({
      ...prev,
      [name]: errorMsg,
    }));
  }, []);

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();

      const { errors, isValid } = validateAllFields();

      if (!isValid) {
        setFieldErrors(errors);
        return;
      }

      const sanitizeOptions = { ALLOWED_TAGS: [], ALLOWED_ATTR: [] };

      const sanitizedData = {
        countryCode: DOMPurify.sanitize(formData.countryCode, sanitizeOptions),
        countryName: DOMPurify.sanitize(formData.countryName, sanitizeOptions),
        language: DOMPurify.sanitize(formData.language, sanitizeOptions),
        greeting: DOMPurify.sanitize(formData.greeting, sanitizeOptions),
        formalGreeting: DOMPurify.sanitize(formData.formalGreeting, sanitizeOptions),
        flagUrl: DOMPurify.sanitize(formData.flagUrl, sanitizeOptions),
        isActive: formData.isActive,
      };

      onSubmit(sanitizedData);
    },
    [formData, onSubmit]
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="greeting-form">
      <h2>{initialData ? 'Editar Saludo' : 'Nuevo Saludo'}</h2>

      {error && (
        <div className="greeting-form__error-banner" role="alert">
          {error}
        </div>
      )}

      <div className="greeting-form__field-group">
        <label htmlFor="countryCode" className="greeting-form__label">
          Código de País
        </label>
        <input
          type="text"
          id="countryCode"
          name="countryCode"
          value={formData.countryCode}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={isLoading}
          maxLength={2}
          placeholder="Ej: ES"
          className={`greeting-form__input ${fieldErrors.countryCode ? 'greeting-form__input--error' : ''}`}
          aria-describedby={fieldErrors.countryCode ? 'countryCode-error' : undefined}
          aria-invalid={!!fieldErrors.countryCode}
        />
        {fieldErrors.countryCode && (
          <span id="countryCode-error" className="greeting-form__field-error" role="alert">
            {fieldErrors.countryCode}
          </span>
        )}
      </div>

      <div className="greeting-form__field-group">
        <label htmlFor="countryName" className="greeting-form__label">
          Nombre del País
        </label>
        <input
          type="text"
          id="countryName"
          name="countryName"
          value={formData.countryName}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={isLoading}
          maxLength={100}
          placeholder="Ej: España"
          className={`greeting-form__input ${fieldErrors.countryName ? 'greeting-form__input--error' : ''}`}
          aria-describedby={fieldErrors.countryName ? 'countryName-error' : undefined}
          aria-invalid={!!fieldErrors.countryName}
        />
        {fieldErrors.countryName && (
          <span id="countryName-error" className="greeting-form__field-error" role="alert">
            {fieldErrors.countryName}
          </span>
        )}
      </div>

      <div className="greeting-form__field-group">
        <label htmlFor="language" className="greeting-form__label">
          Idioma
        </label>
        <input
          type="text"
          id="language"
          name="language"
          value={formData.language}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={isLoading}
          maxLength={50}
          placeholder="Ej: Español"
          className={`greeting-form__input ${fieldErrors.language ? 'greeting-form__input--error' : ''}`}
          aria-describedby={fieldErrors.language ? 'language-error' : undefined}
          aria-invalid={!!fieldErrors.language}
        />
        {fieldErrors.language && (
          <span id="language-error" className="greeting-form__field-error" role="alert">
            {fieldErrors.language}
          </span>
        )}
      </div>

      <div className="greeting-form__field-group">
        <label htmlFor="greeting" className="greeting-form__label">
          Saludo
        </label>
        <textarea
          id="greeting"
          name="greeting"
          value={formData.greeting}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={isLoading}
          maxLength={200}
          placeholder="Ej: Hola"
          rows={3}
          className={`greeting-form__textarea ${fieldErrors.greeting ? 'greeting-form__textarea--error' : ''}`}
          aria-describedby={fieldErrors.greeting ? 'greeting-error' : undefined}
          aria-invalid={!!fieldErrors.greeting}
        />
        {fieldErrors.greeting && (
          <span id="greeting-error" className="greeting-form__field-error" role="alert">
            {fieldErrors.greeting}
          </span>
        )}
      </div>

      <div className="greeting-form__field-group">
        <label htmlFor="formalGreeting" className="greeting-form__label">
          Saludo Formal
        </label>
        <textarea
          id="formalGreeting"
          name="formalGreeting"
          value={formData.formalGreeting}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={isLoading}
          maxLength={200}
          placeholder="Ej: Buenos días"
          rows={3}
          className={`greeting-form__textarea ${fieldErrors.formalGreeting ? 'greeting-form__textarea--error' : ''}`}
          aria-describedby={fieldErrors.formalGreeting ? 'formalGreeting-error' : undefined}
          aria-invalid={!!fieldErrors.formalGreeting}
        />
        {fieldErrors.formalGreeting && (
          <span id="formalGreeting-error" className="greeting-form__field-error" role="alert">
            {fieldErrors.formalGreeting}
          </span>
        )}
      </div>

      <div className="greeting-form__field-group">
        <label htmlFor="flagUrl" className="greeting-form__label">
          URL de la Bandera
        </label>
        <input
          type="url"
          id="flagUrl"
          name="flagUrl"
          value={formData.flagUrl}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={isLoading}
          placeholder="https://ejemplo.com/bandera.svg"
          className={`greeting-form__input ${fieldErrors.flagUrl ? 'greeting-form__input--error' : ''}`}
          aria-describedby={fieldErrors.flagUrl ? 'flagUrl-error' : undefined}
          aria-invalid={!!fieldErrors.flagUrl}
        />
        {fieldErrors.flagUrl && (
          <span id="flagUrl-error" className="greeting-form__field-error" role="alert">
            {fieldErrors.flagUrl}
          </span>
        )}
      </div>

      <div className="greeting-form__field-group greeting-form__field-group--checkbox">
        <label htmlFor="isActive" className="greeting-form__label greeting-form__label--checkbox">
          <input
            type="checkbox"
            id="isActive"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isLoading}
            className="greeting-form__checkbox"
          />
          Activo
        </label>
      </div>

      <div className="greeting-form__actions">
        <button
          type="submit"
          disabled={isLoading}
          className="greeting-form__button greeting-form__button--submit"
        >
          {isLoading ? 'Guardando...' : initialData ? 'Actualizar Saludo' : 'Crear Saludo'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="greeting-form__button greeting-form__button--cancel"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
};

export default GreetingForm;