import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useQueryClient } from '@tanstack/react-query';
import { Alert, Platform } from 'react-native';
import { BACKEND_URL, GOOGLE_CLIENT_ID, GOOGLE_IOS_CLIENT_ID } from '../constants/env';
import { apiRequest, tryRefreshTokens } from '../api/client';

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

interface User {
  id: string;
  email: string;
  name?: string;
  picture?: string;
}

interface AuthContextType {
  user: User | null;
  tokens: Tokens | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean;
  isAuthenticating: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [tokens, setTokens] = useState<Tokens | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const queryClient = useQueryClient();

  // Инициализация Google Sign-In
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: GOOGLE_CLIENT_ID, // Web Client ID для верификации id_token
      iosClientId: GOOGLE_IOS_CLIENT_ID, // iOS Client ID (опционально, но рекомендуется)
      offlineAccess: false, // Не нужен refresh_token от Google, используем свои JWT
      forceCodeForRefreshToken: false,
    });
  }, []);

  const loadTokens = useCallback(async () => {
    try {
      const accessToken = await SecureStore.getItemAsync('accessToken');
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      if (accessToken && refreshToken) {
        setTokens({ accessToken, refreshToken });
      }
    } catch (error) {
      console.error('Failed to load tokens:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signIn = useCallback(async () => {
    setIsAuthenticating(true);
    try {
      // Проверяем, установлены ли Google Play Services (Android)
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }

      // Выполняем вход через Google
      await GoogleSignin.signIn();
      const userInfo = await GoogleSignin.signInSilently();

      if (!userInfo.idToken) {
        throw new Error('No ID token received from Google');
      }

      // Отправляем id_token на бэкенд для верификации
      const res = await fetch(`${BACKEND_URL}/auth/google-id-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: userInfo.idToken }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Token verification failed:', errorText);
        throw new Error('Authentication failed');
      }

      const receivedTokens = (await res.json()) as Tokens;

      // Сохраняем токены
      await SecureStore.setItemAsync('accessToken', receivedTokens.accessToken);
      await SecureStore.setItemAsync('refreshToken', receivedTokens.refreshToken);

      setTokens(receivedTokens);
    } catch (error: any) {
      console.error('Sign in error:', error);

      // Игнорируем ошибку отмены пользователем
      if (error.code === 'SIGN_IN_CANCELLED') {
        console.log('User cancelled sign in');
        return;
      }

      if (error.code === 'IN_PROGRESS') {
        Alert.alert('Error', 'Sign in already in progress');
        return;
      }

      if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        Alert.alert('Error', 'Google Play Services not available');
        return;
      }

      Alert.alert('Error', 'Failed to sign in. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      // Выход из Google аккаунта
      await GoogleSignin.signOut();

      // Выход из бэкенда
      if (tokens?.accessToken) {
        await fetch(`${BACKEND_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        }).catch(() => undefined);
      }

      // Удаляем токены
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');

      setTokens(null);
      setUser(null);
      queryClient.clear();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, [tokens, queryClient]);

  useEffect(() => {
    const loadUser = async () => {
      if (!tokens?.accessToken) {
        setUser(null);
        return;
      }

      try {
        const me = await apiRequest<User>('/auth/me', {
          accessToken: tokens.accessToken,
        });
        setUser(me);
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
            return;
          }
          setTokens(newTokens);
          const me = await apiRequest<User>('/auth/me', {
            accessToken: newTokens.accessToken,
          });
          setUser(me);
        } else {
          console.error('Failed to fetch user:', error);
        }
      }
    };

    loadUser();
  }, [tokens, signOut]);

  useEffect(() => {
    loadTokens();
  }, [loadTokens]);

  const value: AuthContextType = {
    user,
    tokens,
    signIn,
    signOut,
    isLoading,
    isAuthenticating,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
