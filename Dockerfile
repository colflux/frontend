# ── stage 1: build ──────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

ARG VITE_API_BASE_URL
ARG VITE_GEO_API_BASE_URL
ARG VITE_REPORTES_API_BASE_URL
ARG VITE_API_URL
ARG VITE_MAP_STYLE
ARG VITE_BASE_PATH=/
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_GEO_API_BASE_URL=$VITE_GEO_API_BASE_URL
ENV VITE_REPORTES_API_BASE_URL=$VITE_REPORTES_API_BASE_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_MAP_STYLE=$VITE_MAP_STYLE
ENV VITE_BASE_PATH=$VITE_BASE_PATH

RUN npm run build

# ── stage 2: serve con nginx ─────────────────────────────────────
FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
