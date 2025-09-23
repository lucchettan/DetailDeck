import { useState, useEffect, useCallback } from 'react';

/**
 * Hook pour persister automatiquement les données de formulaire
 * Sauvegarde dans localStorage et restaure automatiquement
 */
export function useFormPersistence<T>(
  formKey: string,
  initialState: T,
  options: {
    debounceMs?: number;
    clearOnSubmit?: boolean;
  } = {}
) {
  const { debounceMs = 500, clearOnSubmit = true } = options;
  
  // Clé unique pour localStorage
  const storageKey = `form_${formKey}`;
  
  // État du formulaire
  const [formData, setFormDataState] = useState<T>(() => {
    // Restaurer depuis localStorage au démarrage
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          // Merger avec l'état initial pour avoir les nouvelles propriétés
          return { ...initialState, ...parsed };
        }
      } catch (error) {
        console.warn('Erreur lors de la restauration du formulaire:', error);
      }
    }
    return initialState;
  });

  // Debounced save to localStorage
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(storageKey, JSON.stringify(formData));
        } catch (error) {
          console.warn('Erreur lors de la sauvegarde du formulaire:', error);
        }
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [formData, storageKey, debounceMs]);

  // Fonction pour mettre à jour les données du formulaire
  const setFormData = useCallback((
    newData: T | ((prevData: T) => T)
  ) => {
    setFormDataState(newData);
  }, []);

  // Fonction pour vider le cache
  const clearPersistedData = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(storageKey);
    }
    setFormDataState(initialState);
  }, [storageKey, initialState]);

  // Fonction à appeler lors de la soumission réussie
  const handleSubmitSuccess = useCallback(() => {
    if (clearOnSubmit) {
      clearPersistedData();
    }
  }, [clearOnSubmit, clearPersistedData]);

  // Vérifier s'il y a des données persistées
  const hasPersistedData = useCallback(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(storageKey) !== null;
    }
    return false;
  }, [storageKey]);

  return {
    formData,
    setFormData,
    clearPersistedData,
    handleSubmitSuccess,
    hasPersistedData: hasPersistedData()
  };
}

/**
 * Hook simplifié pour les champs individuels
 */
export function usePersistedInput(
  key: string,
  initialValue: string = '',
  debounceMs: number = 300
) {
  const storageKey = `input_${key}`;
  
  const [value, setValue] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(storageKey) || initialValue;
    }
    return initialValue;
  });

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (typeof window !== 'undefined') {
        if (value) {
          localStorage.setItem(storageKey, value);
        } else {
          localStorage.removeItem(storageKey);
        }
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [value, storageKey, debounceMs]);

  const clearValue = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(storageKey);
    }
    setValue(initialValue);
  }, [storageKey, initialValue]);

  return [value, setValue, clearValue] as const;
}
