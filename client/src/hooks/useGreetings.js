import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import DOMPurify from 'dompurify';

const useGreetings = () => {
  const [greetings, setGreetings] = useState([]);
  const [selectedGreeting, setSelectedGreeting] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const abortControllerRef = useRef(null);

  const fetchGreetings = useCallback(async () => {
    const apiUrl = process.env.REACT_APP_API_URL;

    if (!apiUrl) {
      setError('API URL no configurada');
      return;
    }

    setLoading(true);
    setError(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch(`${apiUrl}/api/greetings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();

      const sanitizedData = data.map((item) => ({
        ...item,
        greeting: DOMPurify.sanitize(item.greeting),
        formalGreeting: DOMPurify.sanitize(item.formalGreeting),
        countryName: DOMPurify.sanitize(item.countryName),
      }));

      setGreetings(sanitizedData);
    } catch (err) {
      if (err.name === 'AbortError') {
        return;
      }
      setError('No se pudieron cargar los saludos. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, []);

  const selectGreeting = useCallback(
    (countryCode) => {
      const found = greetings.find((item) => item.countryCode === countryCode);
      if (found) {
        setSelectedGreeting(found);
      } else {
        setSelectedGreeting(null);
        console.warn(`Greeting not found for countryCode: ${countryCode}`);
      }
    },
    [greetings]
  );

  const clearSelection = () => {
    setSelectedGreeting(null);
    setSearchTerm('');
  };

  const handleSearch = useCallback((term) => {
    const sanitized = DOMPurify.sanitize(term);
    const processed = sanitized.toLowerCase().trim();
    setSearchTerm(processed);
  }, []);

  const filteredGreetings = useMemo(() => {
    if (!searchTerm) {
      return greetings;
    }
    return greetings.filter(
      (item) =>
        (item.countryName && item.countryName.toLowerCase().includes(searchTerm)) ||
        (item.language && item.language.toLowerCase().includes(searchTerm)) ||
        (item.greeting && item.greeting.toLowerCase().includes(searchTerm))
    );
  }, [greetings, searchTerm]);

  useEffect(() => {
    fetchGreetings();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchGreetings]);

  return {
    greetings: filteredGreetings,
    selectedGreeting,
    loading,
    error,
    searchTerm,
    fetchGreetings,
    selectGreeting,
    clearSelection,
    handleSearch,
  };
};

export default useGreetings;