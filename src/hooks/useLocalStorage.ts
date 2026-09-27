import { useCallback, useState } from "react";

/**
 * Stato persistito in localStorage con salvataggio immediato.
 * Usato per il taccuino e per qualunque dato che deve sopravvivere a un refresh.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [stored, setStored] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item !== null ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStored((prev) => {
        const next = value instanceof Function ? value(prev) : value;
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // storage pieno o non disponibile: lo stato in memoria resta comunque valido
        }
        return next;
      });
    },
    [key],
  );

  return [stored, setValue] as const;
}
