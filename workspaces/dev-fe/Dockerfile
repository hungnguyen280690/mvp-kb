# Multi-stage build cho Frontend React
# Usage: docker build -t vdbas-frontend .

# ---- Stage 1: Build ----
FROM node:22-alpine AS builder
WORKDIR /build

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci --prefer-offline

COPY frontend/ ./
RUN npm run build

# ---- Stage 2: Nginx serve ----
FROM nginx:alpine
COPY --from=builder /build/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
