Magazynex - System Zarządzania Magazynem
Aplikacja webowa do zarządzania magazynem, umożliwiająca śledzenie produktów, zarządzanie użytkownikami oraz przeprowadzanie inwentaryzacji.

Funkcjonalność
Panel Administratora
Zarządzanie użytkownikami - dodawanie, edycja i usuwanie kont
Dostęp do pełnych raportów - przegląd wszystkich operacji w magazynie
Panel Użytkownika
Hale - przegląd hal magazynowych i regałów
Zarządzanie - dodawanie, edycja i usuwanie produktów
Wyszukiwanie - szybkie wyszukiwanie produktów po ID lub nazwie
Inwentaryzacja - wsparcie procesu inwentaryzacji
Technologie
Frontend: Angular 20 z Tailwind CSS
Backend: Spring Boot z bazą danych PostgreSQL
Autoryzacja: JWT (JSON Web Tokens)
Wymagania
Node.js 18+ i npm
Angular CLI 20.0.5+
Serwer API na porcie 3000
Instalacja
Sklonuj repozytorium

Zainstaluj zależności

Uruchom aplikację w trybie deweloperskim

Otwórz przeglądarkę pod adresem http://localhost:4200

Konfiguracja
Aplikacja używa pliku .env do konfiguracji adresu API:

Budowanie do produkcji
Pliki produkcyjne będą dostępne w katalogu dist/.

Role użytkowników
ADMIN: dostęp do panelu zarządzania użytkownikami
USER: dostęp do modułów magazynowych (hale, zarządzanie, wyszukiwanie, inwentaryzacja)