import Constants from 'expo-constants';

// В React Native/Expo переменные окружения доступны через Constants.expoConfig?.extra
// Они настраиваются в app.json или app.config.js

export const BACKEND_URL =
  Constants.expoConfig?.extra?.BACKEND_URL || 'http://localhost:3000';

export const GOOGLE_CLIENT_ID =
  Constants.expoConfig?.extra?.GOOGLE_CLIENT_ID ||
  'your_web_client_id.apps.googleusercontent.com';

export const REDIRECT_URI = 'datingapp://oauth2redirect';

// Логирование для отладки (только в dev режиме)
if (__DEV__) {
  console.log('🔧 Environment Config:', {
    BACKEND_URL,
    GOOGLE_CLIENT_ID: GOOGLE_CLIENT_ID.substring(0, 30) + '...',
  });
}
