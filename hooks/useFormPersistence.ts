import { useState, useEffect } from 'react';

interface UseFormPersistenceOptions {
  key: string;
  defaultData?: any;
  debounceMs?: number;
}

export const useFormPersistence = <T>({
  key,
  defaultData,
  debounceMs = 1000
}: UseFormPersistenceOptions) => {
  const [data, setData] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultData;
    } catch {
      return defaultData;
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  // Save to localStorage with debounce
  useEffect(() => {
    if (!data) return;

    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (error) {
        console.warn('Failed to save form data:', error);
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [data, key, debounceMs]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsedData = JSON.parse(saved);
        setData(parsedData);
      }
    } catch (error) {
      console.warn('Failed to load form data:', error);
    }
  }, [key]);

  const updateData = (newData: Partial<T>) => {
    setData(prev => ({ ...prev, ...newData }));
  };

  const clearData = () => {
    try {
      localStorage.removeItem(key);
      setData(defaultData);
    } catch (error) {
      console.warn('Failed to clear form data:', error);
    }
  };

  const hasUnsavedChanges = () => {
    try {
      const saved = localStorage.getItem(key);
      return saved && JSON.stringify(data) !== saved;
    } catch {
      return false;
    }
  };

  return {
    data,
    setData,
    updateData,
    clearData,
    hasUnsavedChanges,
    isLoading
  };
};
