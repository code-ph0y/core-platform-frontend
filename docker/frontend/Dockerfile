
# ----------------- Build Stage -----------------
FROM node:24-alpine AS build

WORKDIR /app

# Install dependencies first for Docker layer caching
COPY package*.json ./
RUN npm ci

# Copy Angular source
COPY . .

# Build Angular
ARG BUILD_CONFIG=production
RUN npm run build -- --configuration=${BUILD_CONFIG}

# Normalise Angular build output
# Supports both standard and newer browser subdirectories
RUN mkdir -p /app/site && \
    if [ -f dist/core-platform/browser/index.html ]; then \
      cp -a dist/core-platform/browser/. /app/site/; \
    elif [ -f dist/core-platform/index.html ]; then \
      cp -a dist/core-platform/. /app/site/; \
    else \
      echo "Angular build output not found. Check angular.json outputPath."; \
      exit 1; \
    fi

# ----------------- Runtime Stage -----------------
FROM nginx:1.27-alpine

COPY --from=build /app/site/ /usr/share/nginx/html/

COPY docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
