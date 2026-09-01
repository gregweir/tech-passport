#!/usr/bin/env bash
# Verify production nginx caching and security headers.
# Builds and runs the Docker image locally, then curls key paths.
# Requires Docker and curl.

set -euo pipefail

PORT=8080
IMAGE=tech-passport
CONTAINER=tech-passport-header-check

cleanup() {
  docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "Building Docker image..."
docker build -t "$IMAGE" .

echo "Starting container on port $PORT..."
docker run -d --name "$CONTAINER" -p "$PORT:$PORT" "$IMAGE"

BASE="http://localhost:$PORT"

echo "Waiting for server..."
for i in $(seq 1 30); do
  if curl -sf "$BASE/" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo ""
echo "=== Fetching key paths and headers ==="
echo ""

# Find a hashed JS and CSS asset from the built dist inside the container.
JS_ASSET=$(docker exec "$CONTAINER" sh -c 'ls /usr/share/nginx/html/assets/*.js 2>/dev/null | head -1 | xargs -n1 basename')
CSS_ASSET=$(docker exec "$CONTAINER" sh -c 'ls /usr/share/nginx/html/assets/*.css 2>/dev/null | head -1 | xargs -n1 basename')

show() {
  local path="$1"
  echo "--- $path ---"
  curl -sI "$BASE$path" | grep -iE 'HTTP/|cache-control|expires|pragma|content-security-policy|x-content-type-options|x-frame-options|referrer-policy|permissions-policy' || true
  echo ""
}

show "/"
show "/index.html"
show "/assets/$JS_ASSET"
show "/assets/$CSS_ASSET"
show "/sw.js"
show "/manifest.json"

echo "=== Verification complete ==="
