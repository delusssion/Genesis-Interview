# Stage: deps
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage: build
FROM base AS build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
COPY . .
RUN npm run build

# Stage: nginx minimal
FROM nginx:alpine AS prod
WORKDIR /usr/share/nginx/html
COPY --from=build /app/dist ./

COPY nginx.conf /etc/nginx/conf.d/default.conf

HEALTHCHECK --interval=20s --timeout=3s \
  CMD wget --spider -q http://localhost/ || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
