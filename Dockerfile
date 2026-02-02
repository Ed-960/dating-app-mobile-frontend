FROM node:20-alpine

WORKDIR /app

# Копируем package файлы
COPY package*.json ./

# Устанавливаем зависимости с --legacy-peer-deps для решения конфликтов
RUN npm install --legacy-peer-deps

# Копируем весь код
COPY . .

# Экспортируем порты для Expo
EXPOSE 8081 19000 19001 19002

# Запускаем Expo dev server
# --host lan позволяет подключаться извне контейнера через локальную сеть
# --tunnel использует Expo tunnel (требует Expo аккаунт, но работает из любой сети)
# Раскомментируйте --tunnel если хотите использовать tunnel режим:
CMD ["npx", "expo", "start", "--host", "lan"]
# Или для tunnel режима (раскомментируйте):
# CMD ["npx", "expo", "start", "--tunnel"]