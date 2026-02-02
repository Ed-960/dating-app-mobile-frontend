import { BACKEND_URL } from '../constants/env';
import * as SecureStore from 'expo-secure-store';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  accessToken?: string | null;
}

export async function apiRequest<T>(
  url: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, accessToken } = options;

  const res = await fetch(`${BACKEND_URL}${url}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let errorMessage = `HTTP_${res.status}`;
    try {
      const text = await res.text();
      if (text) {
        const json = JSON.parse(text);
        errorMessage = json.message || json.error || text;
      }
    } catch {
      // Если не удалось распарсить, используем текст как есть
    }
    const error = new Error(errorMessage);
    (error as Error & { status: number }).status = res.status;
    throw error;
  }

  return res.json();
}

export async function tryRefreshTokens() {
  const refreshToken = await SecureStore.getItemAsync('refreshToken');
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${BACKEND_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return null;

    const tokens = (await res.json()) as {
      accessToken: string;
      refreshToken: string;
    };

    await SecureStore.setItemAsync('accessToken', tokens.accessToken);
    await SecureStore.setItemAsync('refreshToken', tokens.refreshToken);

    return tokens;
  } catch {
    return null;
  }
}
