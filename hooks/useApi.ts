import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest, tryRefreshTokens } from '../api/client';

export function useApi<TData = unknown>(
  url: string,
  options?: Omit<UseQueryOptions<TData, Error, TData, string[]>, 'queryKey' | 'queryFn'>,
) {
  const { tokens, signOut } = useAuth();

  return useQuery<TData, Error>({
    queryKey: [url],
    enabled: !!tokens?.accessToken,
    queryFn: async () => {
      if (!tokens?.accessToken) {
        throw new Error('Unauthorized');
      }

      try {
        return await apiRequest<TData>(url, {
          accessToken: tokens.accessToken,
        });
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const status =
          error && typeof error === 'object' && 'status' in error
            ? (error as { status: number }).status
            : null;

        if (status === 401 || errorMessage.includes('HTTP_401') || errorMessage === 'Unauthorized') {
          const newTokens = await tryRefreshTokens();
          if (!newTokens) {
            await signOut();
            throw new Error('Session expired');
          }
          return apiRequest<TData>(url, {
            accessToken: newTokens.accessToken,
          });
        }
        throw error;
      }
    },
    ...options,
  });
}
