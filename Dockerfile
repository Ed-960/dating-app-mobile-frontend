FROM node:20-alpine

WORKDIR /app

# Устанавливаем Expo CLI глобально
RUN npm install -g expo-cli@latest

# Копируем package файлы
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install --legacy-peer-deps

# Копируем весь код
COPY . .

# Обновляем все expo-пакеты до версий, совместимых с текущим SDK
# Удаляем node_modules перед обновлением, чтобы избежать конфликтов старых версий
# Настраиваем npm на использование --legacy-peer-deps для решения конфликтов
RUN rm -rf node_modules && \
    npm config set legacy-peer-deps true && \
    npx expo install --fix

# Экспортируем порты для Expo
EXPOSE 8081 19000 19001 19002

# Запускаем Expo dev server
# --host lan позволяет подключаться извне контейнера через локальную сеть
# --tunnel использует Expo tunnel (требует Expo аккаунт, но работает из любой сети)
# Раскомментируйте --tunnel если хотите использовать tunnel режим:
CMD ["npx", "expo", "start", "--host", "lan"]
# Или для tunnel режима (раскомментируйте):
# CMD ["npx", "expo", "start", "--tunnel"]