import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiError } from '@/lib/api/client';

export interface UseApiOptions {
  immediate?: boolean; // Auto-fetch on mount
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export function useApi<T>(
  apiCall: () => Promise<T>,
  options: UseApiOptions = { immediate: false }
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Use refs to store latest values without causing re-renders
  const apiCallRef = useRef(apiCall);
  const optionsRef = useRef(options);
  
  // Update refs when values change
  useEffect(() => {
    apiCallRef.current = apiCall;
    optionsRef.current = options;
  }, [apiCall, options]);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiCallRef.current();
      setData(result);
      optionsRef.current.onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      optionsRef.current.onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []); // Empty deps - execute never changes

  useEffect(() => {
    if (options.immediate) {
      execute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.immediate]); // Only depend on immediate flag

  return {
    data,
    loading,
    error,
    execute,
    reset: () => {
      setData(null);
      setError(null);
      setLoading(false);
    },
  };
}
