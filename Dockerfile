# Build stage
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create a non-root user and make the directories nginx needs writable.
RUN adduser -D -u 1000 appuser && \
    mkdir -p /var/cache/nginx /var/log/nginx /run && \
    chown -R appuser:appuser /usr/share/nginx/html /var/cache/nginx /var/log/nginx /run && \
    touch /var/log/nginx/error.log /var/log/nginx/access.log && \
    chown appuser:appuser /var/log/nginx/error.log /var/log/nginx/access.log

USER appuser
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:8080/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
