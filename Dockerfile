# Stage 1: Build aplikasi
FROM node:20-alpine AS builder
WORKDIR /app

# Copy file dependency
COPY package.json package-lock.json* ./
RUN npm install

# Copy seluruh source code dan build
COPY . .
RUN npm run build

# Stage 2: Serve aplikasi dengan Nginx
FROM nginx:alpine
# Copy konfigurasi custom Nginx untuk React Router
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copy hasil build dari Stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]