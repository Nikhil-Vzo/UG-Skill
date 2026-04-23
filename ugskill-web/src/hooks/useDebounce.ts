import { useState, useEffect } from 'react';

/**
 * Delays updating a value until `delay` ms have passed without change.
 * Used for search inputs to avoid hammering the API on every keystroke.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
