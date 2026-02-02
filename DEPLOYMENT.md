# Инструкция по деплою приложения

## 📱 Подготовка к деплою

### 1. Установка EAS CLI (Expo Application Services)

```bash
npm install -g eas-cli
eas login
```

### 2. Инициализация EAS в проекте

```bash
cd frontend
eas build:configure
```

Это создаст файл `eas.json` с конфигурацией сборок.

## 🔧 Настройка переменных окружения

### Для разработки (локально)

Создайте файл `.env` в папке `frontend/`:

```env
BACKEND_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your_web_client_id.apps.googleusercontent.com
NODE_ENV=development
```

### Для production

В EAS Build используйте секреты:

```bash
# Установка секретов для production
eas secret:create --scope project --name BACKEND_URL --value https://your-backend-api.com
eas secret:create --scope project --name GOOGLE_CLIENT_ID --value your_production_client_id
```

Или используйте переменные окружения в `eas.json`:

```json
{
  "build": {
    "production": {
      "env": {
        "BACKEND_URL": "https://your-backend-api.com",
        "GOOGLE_CLIENT_ID": "your_production_client_id"
      }
    }
  }
}
```

## 🏗️ Деплой бэкенда

### Вариант 1: Railway

1. **Установка Railway CLI:**
```bash
npm install -g @railway/cli
railway login
```

2. **Инициализация проекта:**
```bash
cd backend
railway init
```

3. **Настройка переменных окружения:**
```bash
railway variables set DATABASE_URL=postgresql://...
railway variables set REDIS_URL=redis://...
railway variables set JWT_SECRET=your-secret-key
railway variables set GOOGLE_CLIENT_ID=your_client_id
railway variables set GOOGLE_CLIENT_SECRET=your_client_secret
railway variables set PORT=3000
railway variables set CORS_ORIGIN=*
```

4. **Деплой:**
```bash
railway up
```

5. **Получение URL:**
```bash
railway domain
```

### Вариант 2: Render

1. **Создайте новый Web Service** на [render.com](https://render.com)

2. **Подключите репозиторий** или загрузите код

3. **Настройки сборки:**
   - Build Command: `cd backend && npm install && npm run build`
   - Start Command: `cd backend && npm run start:prod`

4. **Переменные окружения:**
   - `DATABASE_URL`
   - `REDIS_URL`
   - `JWT_SECRET`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `PORT=3000`
   - `CORS_ORIGIN=*`

5. **База данных:**
   - Создайте PostgreSQL database на Render
   - Скопируйте `DATABASE_URL` в переменные окружения

6. **Redis:**
   - Создайте Redis instance на Render
   - Скопируйте `REDIS_URL` в переменные окружения

### Вариант 3: Heroku

1. **Установка Heroku CLI:**
```bash
npm install -g heroku
heroku login
```

2. **Создание приложения:**
```bash
cd backend
heroku create your-app-name
```

3. **Добавление аддонов:**
```bash
heroku addons:create heroku-postgresql:mini
heroku addons:create heroku-redis:mini
```

4. **Переменные окружения:**
```bash
heroku config:set JWT_SECRET=your-secret-key
heroku config:set GOOGLE_CLIENT_ID=your_client_id
heroku config:set GOOGLE_CLIENT_SECRET=your_client_secret
heroku config:set CORS_ORIGIN=*
```

5. **Деплой:**
```bash
git push heroku main
```

6. **Миграции:**
```bash
heroku run npm run prisma:migrate
```

### Вариант 4: DigitalOcean App Platform

1. **Создайте новое приложение** на DigitalOcean

2. **Подключите репозиторий**

3. **Настройки:**
   - Source Directory: `backend`
   - Build Command: `npm install && npm run build`
   - Run Command: `npm run start:prod`

4. **Добавьте базу данных:**
   - PostgreSQL Managed Database
   - Redis Managed Database

5. **Переменные окружения:**
   - Добавьте все необходимые переменные в настройках приложения

## 📦 Сборка мобильного приложения

### Android

1. **Настройка Google OAuth:**
   - В Google Cloud Console добавьте Android OAuth Client ID
   - Добавьте SHA-1 fingerprint вашего приложения

2. **Сборка APK (для тестирования):**
```bash
cd frontend
eas build --platform android --profile preview
```

3. **Сборка AAB (для Google Play):**
```bash
eas build --platform android --profile production
```

4. **Публикация в Google Play:**
```bash
eas submit --platform android
```

### iOS

1. **Настройка Apple Developer:**
   - Зарегистрируйтесь на [developer.apple.com](https://developer.apple.com)
   - Создайте App ID и Provisioning Profile

2. **Настройка Google OAuth:**
   - В Google Cloud Console добавьте iOS OAuth Client ID
   - Добавьте Bundle ID вашего приложения

3. **Сборка для TestFlight:**
```bash
cd frontend
eas build --platform ios --profile preview
```

4. **Сборка для App Store:**
```bash
eas build --platform ios --profile production
```

5. **Публикация в App Store:**
```bash
eas submit --platform ios
```

## 🔐 Настройка Google OAuth

### 1. Создание OAuth Client IDs

В [Google Cloud Console](https://console.cloud.google.com/):

1. **Web Client ID** (для бэкенда):
   - Authorized redirect URIs: `datingapp://oauth2redirect`
   - Используется в бэкенде

2. **Android Client ID**:
   - Package name: `com.yourcompany.datingapp`
   - SHA-1 certificate fingerprint (получите через `keytool`)

3. **iOS Client ID**:
   - Bundle ID: `com.yourcompany.datingapp`

### 2. Обновление конфигурации

В `app.config.js` или через EAS секреты добавьте соответствующие Client IDs для каждой платформы.

## 📝 Файл eas.json (пример)

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "BACKEND_URL": "http://localhost:3000",
        "NODE_ENV": "development"
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "BACKEND_URL": "https://your-staging-api.com",
        "NODE_ENV": "production"
      }
    },
    "production": {
      "env": {
        "BACKEND_URL": "https://your-production-api.com",
        "NODE_ENV": "production"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

## 🚀 Процесс деплоя (полный цикл)

### 1. Деплой бэкенда

```bash
cd backend
# Выберите один из вариантов выше (Railway, Render, Heroku, etc.)
```

### 2. Обновление URL бэкенда

После деплоя бэкенда получите его URL и обновите:

```bash
# В EAS секретах
eas secret:create --scope project --name BACKEND_URL --value https://your-backend-api.com
```

### 3. Сборка приложения

```bash
cd frontend
eas build --platform all --profile production
```

### 4. Тестирование

- Android: Установите APK на устройство
- iOS: Используйте TestFlight

### 5. Публикация

```bash
eas submit --platform all
```

## 🔍 Проверка после деплоя

1. **Проверьте health check:**
```bash
curl https://your-backend-api.com/health
```

2. **Проверьте Swagger:**
```
https://your-backend-api.com/api
```

3. **Проверьте авторизацию:**
   - Запустите приложение
   - Попробуйте войти через Google
   - Проверьте получение данных пользователя

## 📚 Полезные команды

```bash
# Просмотр логов сборки
eas build:list

# Просмотр статуса сборки
eas build:view [BUILD_ID]

# Отмена сборки
eas build:cancel [BUILD_ID]

# Просмотр секретов
eas secret:list

# Обновление секрета
eas secret:update --name BACKEND_URL --value https://new-url.com
```

## ⚠️ Важные замечания

1. **Безопасность:**
   - Никогда не коммитьте `.env` файлы
   - Используйте секреты для production
   - Обновляйте JWT_SECRET в production

2. **База данных:**
   - Сделайте резервную копию перед миграциями
   - Используйте managed databases в production

3. **CORS:**
   - Настройте `CORS_ORIGIN` на бэкенде для вашего домена

4. **Google OAuth:**
   - Используйте разные Client IDs для dev и production
   - Обновите redirect URIs в Google Console

## 🆘 Troubleshooting

### Проблема: Приложение не подключается к бэкенду

**Решение:**
- Проверьте `BACKEND_URL` в секретах EAS
- Убедитесь, что бэкенд доступен публично
- Проверьте CORS настройки

### Проблема: OAuth не работает

**Решение:**
- Проверьте Client IDs в Google Console
- Убедитесь, что redirect URI правильный
- Проверьте Bundle ID / Package name

### Проблема: Ошибки сборки

**Решение:**
- Проверьте логи: `eas build:view [BUILD_ID]`
- Убедитесь, что все зависимости установлены
- Проверьте версии Node.js и других инструментов
