import Constants from 'expo-constants';

// Получаем URL бэкенда из переменных окружения или конфигурации
const getBackendUrl = (): string => {
  // В production используем переменную окружения или конфиг
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL;
  }
  
  // В Expo используем extra конфигурацию
  if (Constants.expoConfig?.extra?.BACKEND_URL) {
    return Constants.expoConfig.extra.BACKEND_URL;
  }
  
  // Fallback для разработки
  return __DEV__ ? 'http://localhost:3000' : 'https://your-backend-url.com';
};

export const BACKEND_URL = getBackendUrl();

export const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID ??
  Constants.expoConfig?.extra?.GOOGLE_CLIENT_ID ??
  'your_web_client_id.apps.googleusercontent.com';

export const REDIRECT_URI = 'datingapp://oauth2redirect';

// Логирование для отладки (только в dev режиме)
if (__DEV__) {
  console.log('🔧 Environment Config:', {
    BACKEND_URL,
    GOOGLE_CLIENT_ID: GOOGLE_CLIENT_ID.substring(0, 20) + '...',
    NODE_ENV: process.env.NODE_ENV || 'development',
  });
}
