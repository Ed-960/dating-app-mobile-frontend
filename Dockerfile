FROM node:18-alpine

WORKDIR /app

# Устанавливаем Expo CLI глобально
RUN npm install -g expo-cli@latest

# Копируем package файлы
COPY package*.json ./

# Устанавливаем зависимости
# Используем npm install вместо npm ci, так как lock файл может быть не синхронизирован
RUN npm install

# Копируем весь код
COPY . .

# Экспортируем порты для Expo
EXPOSE 8081 19000 19001 19002

# Запускаем Expo dev server
# --host 0.0.0.0 позволяет подключаться извне контейнера
CMD ["npx", "expo", "start", "--host", "0.0.0.0"]
