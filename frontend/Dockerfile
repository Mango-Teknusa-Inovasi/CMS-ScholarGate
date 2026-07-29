# ── Stage 1: Build React ──────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install deps dulu (cache layer)
COPY package*.json ./
RUN npm ci

# Copy source dan build
COPY . .

# VITE_API_URL bisa di-override via docker-compose build args
ARG VITE_API_URL=https://api-cms.smage.my.id
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ── Stage 2: Serve dengan Nginx ───────────────────────────────
FROM nginx:1.27-alpine

# Hapus default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy hasil build
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config untuk SPA
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
