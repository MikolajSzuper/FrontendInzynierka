# System Zarządzania Magazynem

Praca inżynierska: System zarządzania magazynem z tagami RFID. - frontend

## 🚀 Funkcjonalność

### Panel Administratora
- 👥 **Zarządzanie użytkownikami** - dodawanie, edycja, usuwanie kont
- 📊 **Zgłoszenia pomocy** - przeglądanie i obsługa zgłoszeń

### Panel Użytkownika/Supervisora
- 🏢 **Hale** - przeglądanie struktury magazynu (hale, regały, miejsca)
- ⚙️ **Zarządzanie** - dodawanie produktów, kategorii oraz struktury magazynu
- 📦 **Przyjęcia/Wydania** - rejestracja ruchu towarów z dokumentami
- 🔍 **Wyszukiwanie** - wyszukiwanie i edycja produktów (ID, nazwa, kategoria, RFID)
- 🤝 **Kontrahenci** - zarządzanie bazą kontrahentów
- 📋 **Inwentaryzacja** - przeprowadzanie kontroli stanu magazynu
- 📜 **Historia produktów** - śledzenie wszystkich akcji na produktach

## 🛠️ Technologie

- **Frontend**: Angular 20 + Tailwind CSS
- **Autoryzacja**: JWT (JSON Web Tokens)
- **Konteneryzacja**: Docker

## 📋 Wymagania

- Node.js 18+
- Angular CLI 20.0.5+
- Docker (opcjonalnie)

## 💻 Instalacja

### Lokalnie

```bash
git clone <repository-url>

npm install

npm start
```

Aplikacja dostępna pod adresem: `http://localhost:4200`

### Docker

```bash
docker build -t magazynex-frontend .

docker run -p 4200:80 magazynex-frontend
```

### Docker Compose

```bash
docker-compose up -d
```

## ⚙️ Konfiguracja

URL API można skonfigurować w pliku `src/app/services/api.ts`:

```typescript
export const API_BASE_URL = 'http://localhost:8080/api';
```

## 🔨 Budowanie

### Środowisko deweloperskie
```bash
npm start
```

### Wersja produkcyjna
```bash
npm run build
```

### Testy

```bash
ng test --include='src/app/login/login.spec.ts'

ng test --include='src/app/login/login.integration.spec.ts'
```

## 👤 Role użytkowników

| Rola | Uprawnienia |
|------|-------------|
| **ADMIN** | Zarządzanie użytkownikami, zgłoszenia, pełne raporty |
| **SUPERVISOR** | Pełny dostęp do magazynu + zarządzanie strukturą |
| **USER** | Podstawowe operacje magazynowe |

## 📝 Licencja

Praca inżynierska - Politechnika Lubelska