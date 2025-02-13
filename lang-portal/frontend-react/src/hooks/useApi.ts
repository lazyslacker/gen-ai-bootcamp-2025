import { useState, useEffect, useCallback } from 'react';
import { APIError } from '@/services/api';

interface UseApiOptions<T> {
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    dependencies?: any[];
}

export function useApi<T>(
    fetchFn: () => Promise<T>,
    options: UseApiOptions<T> = {}
) {
    const [data, setData] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const { onSuccess, onError, dependencies = [] } = options;

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const result = await fetchFn();
            setData(result);
            onSuccess?.(result);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('An error occurred');
            setError(error);
            onError?.(error);
        } finally {
            setIsLoading(false);
        }
    }, [fetchFn, onSuccess, onError]);

    useEffect(() => {
        fetchData();
    }, [...dependencies, fetchData]);

    return { 
        data, 
        isLoading, 
        error, 
        refetch: fetchData 
    };
} 