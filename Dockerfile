# Stage 1: Build
FROM node:22-alpine AS build

WORKDIR /app

# Kopiuj pliki package.json i package-lock.json
COPY package*.json ./

# Instaluj zależności
RUN npm ci

# Kopiuj resztę plików projektu
COPY . .

# Buduj aplikację do produkcji
RUN npm run build

# Stage 2: Production
FROM nginx:alpine

# Kopiuj zbudowaną aplikację do katalogu nginx
COPY --from=build /app/dist/ng-tw-4-client/browser /usr/share/nginx/html

# Kopiuj konfigurację nginx (opcjonalnie)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Eksponuj port 80
EXPOSE 80

# Uruchom nginx
CMD ["nginx", "-g", "daemon off;"]