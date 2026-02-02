module.exports = ({ config }) => {
  const isDev = process.env.NODE_ENV !== 'production';
  
  // В Expo переменные окружения доступны через process.env во время сборки
  // Для production используйте EAS секреты или установите через переменные окружения
  const baseConfig = config || {};
  const baseExpo = baseConfig.expo || {};
  const baseExtra = baseExpo.extra || {};
  
  return {
    ...baseConfig,
    expo: {
      ...baseExpo,
      name: isDev ? 'Dating App (Dev)' : 'Dating App',
      extra: {
        ...baseExtra,
        // BACKEND_URL берется из app.json или из переменной окружения при сборке
        BACKEND_URL: process.env.BACKEND_URL || baseExtra.BACKEND_URL || 'http://localhost:3000',
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || baseExtra.GOOGLE_CLIENT_ID || 'your_web_client_id.apps.googleusercontent.com',
      },
    },
  };
};
