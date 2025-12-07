FROM node:18-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci --silent

# ========================================
# Сборка фронта
# ========================================
FROM node:18-alpine AS builder

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build аргумент для Vite (адрес API)
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# ========================================
# Продакшн-слой через nginx
# ========================================
FROM nginx:alpine AS production

WORKDIR /usr/share/nginx/html

COPY --from=builder /app/dist ./
COPY nginx.conf /etc/nginx/conf.d/default.conf

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --spider -q http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
