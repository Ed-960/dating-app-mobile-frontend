module.exports = ({ config }) => {
  const isDev = process.env.NODE_ENV !== 'production';
  
  // В Expo переменные окружения доступны через process.env во время сборки
  // Для production используйте EAS секреты или установите через переменные окружения
  return {
    ...config,
    expo: {
      ...config.expo,
      name: isDev ? 'Dating App (Dev)' : 'Dating App',
      extra: {
        ...config.expo.extra,
        // BACKEND_URL берется из app.json или из переменной окружения при сборке
        BACKEND_URL: process.env.BACKEND_URL || config.expo.extra?.BACKEND_URL || 'http://localhost:3000',
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || config.expo.extra?.GOOGLE_CLIENT_ID || 'your_web_client_id.apps.googleusercontent.com',
      },
    },
  };
};
