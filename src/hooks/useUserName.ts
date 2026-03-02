import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'pokoqc_user_name';

export function useUserName(): [string, (name: string) => void, boolean] {
  const [name, setNameState] = useState('');
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored?.trim()) {
      setNameState(stored.trim().slice(0, 20));
    }
    setHasChecked(true);
  }, []);

  const setName = useCallback((newName: string) => {
    const trimmed = newName.trim().slice(0, 20);
    setNameState(trimmed);
    if (trimmed) {
      localStorage.setItem(STORAGE_KEY, trimmed.slice(0, 20));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return [name, setName, hasChecked];
}
