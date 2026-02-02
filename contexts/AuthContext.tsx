import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { BACKEND_URL, GOOGLE_CLIENT_ID, REDIRECT_URI } from '../constants/env';
import { apiRequest, tryRefreshTokens } from '../api/client';

WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

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

  const codeVerifierRef = useRef<string | null>(null);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      redirectUri: REDIRECT_URI,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
    },
    discovery,
  );

  useEffect(() => {
    if (request?.codeVerifier) {
      codeVerifierRef.current = request.codeVerifier;
    }
  }, [request]);

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

  const handleAuthResponse = useCallback(
    async (authResponse: AuthSession.AuthSessionResult) => {
      if (authResponse.type === 'success') {
        const code = authResponse.params.code;
        const codeVerifier = codeVerifierRef.current;

        if (!code || !codeVerifier) {
          Alert.alert('Error', 'Invalid authentication response');
          return;
        }

        try {
          const res = await fetch(`${BACKEND_URL}/auth/google/code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, codeVerifier }),
          });

          if (!res.ok) {
            const errorText = await res.text();
            console.error('Token exchange failed:', errorText);
            throw new Error('Authentication failed');
          }

          const receivedTokens = (await res.json()) as Tokens;

          await SecureStore.setItemAsync('accessToken', receivedTokens.accessToken);
          await SecureStore.setItemAsync('refreshToken', receivedTokens.refreshToken);

          setTokens(receivedTokens);
        } catch (error) {
          console.error('Auth exchange error:', error);
          Alert.alert('Error', 'Failed to complete authentication');
        }
      } else if (authResponse.type === 'error') {
        console.error('Auth error:', authResponse.errorCode, authResponse.params);
        Alert.alert(
          'Authentication Error',
          authResponse.params?.error_description || 'An error occurred during sign in',
        );
      } else if (authResponse.type === 'dismiss') {
        console.log('User dismissed auth');
      } else if (authResponse.type === 'locked') {
        Alert.alert('Error', 'Another authentication session is in progress');
      }
    },
    [],
  );

  const signIn = useCallback(async () => {
    if (!request) {
      Alert.alert('Error', 'Authentication not ready. Please try again.');
      return;
    }

    setIsAuthenticating(true);
    try {
      const result = await promptAsync();
      await handleAuthResponse(result);
    } catch (error) {
      console.error('Sign in error:', error);
      Alert.alert('Error', 'Failed to sign in. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  }, [request, promptAsync, handleAuthResponse]);

  const signOut = useCallback(async () => {
    try {
      if (tokens?.accessToken) {
        await fetch(`${BACKEND_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        }).catch(() => undefined);
      }

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
    if (response && !isAuthenticating) {
      handleAuthResponse(response);
    }
  }, [response, isAuthenticating, handleAuthResponse]);

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
