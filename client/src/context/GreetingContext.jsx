import { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import DOMPurify from 'dompurify';

const GreetingContext = createContext(undefined);
const GreetingDispatchContext = createContext(undefined);

const ACTIONS = {
  SET_GREETINGS_LIST: 'SET_GREETINGS_LIST',
  SELECT_COUNTRY: 'SELECT_COUNTRY',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  TOGGLE_FORMAL_MODE: 'TOGGLE_FORMAL_MODE',
  RESET_SELECTION: 'RESET_SELECTION',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

const initialState = {
  selectedCountry: null,
  greetingsList: [],
  loadingStatus: 'idle',
  errorMessage: null,
  activeLanguage: null,
  isFormalMode: false,
};

function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_GREETINGS_LIST:
      return {
        ...state,
        greetingsList: action.payload,
        loadingStatus: 'success',
      };
    case ACTIONS.SELECT_COUNTRY:
      return {
        ...state,
        selectedCountry: action.payload,
        activeLanguage: action.payload ? action.payload.language : null,
      };
    case ACTIONS.SET_LOADING:
      return {
        ...state,
        loadingStatus: action.payload,
      };
    case ACTIONS.SET_ERROR:
      return {
        ...state,
        loadingStatus: 'error',
        errorMessage: DOMPurify.sanitize(action.payload),
      };
    case ACTIONS.TOGGLE_FORMAL_MODE:
      return {
        ...state,
        isFormalMode: !state.isFormalMode,
      };
    case ACTIONS.RESET_SELECTION:
      return {
        ...state,
        selectedCountry: null,
        activeLanguage: null,
      };
    case ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        errorMessage: null,
        loadingStatus: 'idle',
      };
    default:
      return state;
  }
}

const COUNTRY_CODE_REGEX = /^[A-Z]{2}$/;
const FLAG_URL_REGEX = /^https/;

function sanitizeCountryObject(country) {
  if (!country) return null;

  const sanitized = { ...country };

  if (sanitized.greeting !== undefined) {
    sanitized.greeting = DOMPurify.sanitize(sanitized.greeting);
  }
  if (sanitized.formalGreeting !== undefined) {
    sanitized.formalGreeting = DOMPurify.sanitize(sanitized.formalGreeting);
  }
  if (sanitized.countryName !== undefined) {
    sanitized.countryName = DOMPurify.sanitize(sanitized.countryName);
  }
  if (sanitized.language !== undefined) {
    sanitized.language = DOMPurify.sanitize(sanitized.language);
  }
  if (sanitized.countryCode !== undefined) {
    sanitized.countryCode = COUNTRY_CODE_REGEX.test(sanitized.countryCode)
      ? sanitized.countryCode
      : '';
  }
  if (sanitized.flagUrl !== undefined) {
    sanitized.flagUrl = FLAG_URL_REGEX.test(sanitized.flagUrl)
      ? sanitized.flagUrl
      : '';
  }

  return sanitized;
}

function sanitizeGreetingsList(list) {
  if (!Array.isArray(list)) return [];

  return list.map((item) => {
    const sanitized = { ...item };

    if (sanitized.greeting !== undefined) {
      sanitized.greeting = DOMPurify.sanitize(sanitized.greeting);
    }
    if (sanitized.formalGreeting !== undefined) {
      sanitized.formalGreeting = DOMPurify.sanitize(sanitized.formalGreeting);
    }
    if (sanitized.countryName !== undefined) {
      sanitized.countryName = DOMPurify.sanitize(sanitized.countryName);
    }
    if (sanitized.language !== undefined) {
      sanitized.language = DOMPurify.sanitize(sanitized.language);
    }
    if (sanitized.countryCode !== undefined) {
      sanitized.countryCode = COUNTRY_CODE_REGEX.test(sanitized.countryCode)
        ? sanitized.countryCode
        : '';
    }
    if (sanitized.flagUrl !== undefined) {
      sanitized.flagUrl = FLAG_URL_REGEX.test(sanitized.flagUrl)
        ? sanitized.flagUrl
        : '';
    }

    return sanitized;
  });
}

export function GreetingProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const loadGreetings = useCallback(
    (greetingsArray) => {
      const sanitizedList = sanitizeGreetingsList(greetingsArray);
      dispatch({ type: ACTIONS.SET_GREETINGS_LIST, payload: sanitizedList });
    },
    [dispatch]
  );

  const selectCountry = useCallback(
    (countryObject) => {
      const sanitized = sanitizeCountryObject(countryObject);
      dispatch({ type: ACTIONS.SELECT_COUNTRY, payload: sanitized });
    },
    [dispatch]
  );

  const setLoading = useCallback(
    (isLoading) => {
      dispatch({
        type: ACTIONS.SET_LOADING,
        payload: isLoading ? 'loading' : 'idle',
      });
    },
    [dispatch]
  );

  const setError = useCallback(
    (message) => {
      dispatch({ type: ACTIONS.SET_ERROR, payload: message });
    },
    [dispatch]
  );

  const toggleFormalMode = useCallback(() => {
    dispatch({ type: ACTIONS.TOGGLE_FORMAL_MODE });
  }, [dispatch]);

  const resetSelection = useCallback(() => {
    dispatch({ type: ACTIONS.RESET_SELECTION });
  }, [dispatch]);

  const clearError = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_ERROR });
  }, [dispatch]);

  const actions = useMemo(
    () => ({
      loadGreetings,
      selectCountry,
      setLoading,
      setError,
      toggleFormalMode,
      resetSelection,
      clearError,
    }),
    [
      loadGreetings,
      selectCountry,
      setLoading,
      setError,
      toggleFormalMode,
      resetSelection,
      clearError,
    ]
  );

  const stateValue = useMemo(() => state, [state]);

  const dispatchValue = useMemo(
    () => ({ dispatch, actions }),
    [dispatch, actions]
  );

  return (
    <GreetingContext.Provider value={stateValue}>
      <GreetingDispatchContext.Provider value={dispatchValue}>
        {children}
      </GreetingDispatchContext.Provider>
    </GreetingContext.Provider>
  );
}

export function useGreetingState() {
  const context = useContext(GreetingContext);
  if (context === undefined) {
    throw new Error(
      'useGreetingState debe usarse dentro de un GreetingProvider'
    );
  }
  return context;
}

export function useGreetingActions() {
  const context = useContext(GreetingDispatchContext);
  if (context === undefined) {
    throw new Error(
      'useGreetingActions debe usarse dentro de un GreetingProvider'
    );
  }
  return context.actions;
}

export function useSelectedCountry() {
  const context = useContext(GreetingContext);
  if (context === undefined) {
    throw new Error(
      'useSelectedCountry debe usarse dentro de un GreetingProvider'
    );
  }
  return context.selectedCountry;
}

export function useGreetingsList() {
  const context = useContext(GreetingContext);
  if (context === undefined) {
    throw new Error(
      'useGreetingsList debe usarse dentro de un GreetingProvider'
    );
  }
  return context.greetingsList;
}

export function useLoadingStatus() {
  const context = useContext(GreetingContext);
  if (context === undefined) {
    throw new Error(
      'useLoadingStatus debe usarse dentro de un GreetingProvider'
    );
  }
  return {
    loadingStatus: context.loadingStatus,
    errorMessage: context.errorMessage,
  };
}