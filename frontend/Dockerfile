# ==========================================
# Stage 1: Build React/Vite Static Bundle
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies reproducibly
COPY package.json package-lock.json ./
RUN npm ci

# Pass build-time environment variables to Vite
ARG VITE_API_BASE_URL=https://devadmin-api.logicbyroshan.in
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Copy source and build static distribution
COPY . .
RUN npm run build

# ==========================================
# Stage 2: Serve with Lightweight Nginx
# ==========================================
FROM nginx:alpine

# Remove default Nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy build artifacts from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy container Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q --spider http://127.0.0.1:80/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
