FROM node:18-alpine as build

WORKDIR /app

# Копируем и устанавливаем зависимости
COPY package*.json ./
RUN npm ci --silent

# Копируем исходники и билдим проект
COPY . .

# Build аргумент для Vite (адрес API)
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# Продакшн-слой через nginx
FROM nginx:alpine

# Копируем билды
COPY --from=build /app/dist /usr/share/nginx/html

# Кастомный nginx для SPA
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
