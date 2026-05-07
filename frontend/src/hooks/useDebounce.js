import { useEffect, useRef, useState } from 'react';

/**
 * Custom debounce hook that prevents unnecessary state updates
 * and multiple re-renders during rapid input changes
 */
export function useDebounce(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timeoutRef = useRef(null);
  const lastValueRef = useRef(value);

  useEffect(() => {
    // Skip if value hasn't actually changed
    if (lastValueRef.current === value) return;
    
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      lastValueRef.current = value;
      setDebouncedValue(value);
    }, delay);

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
}
