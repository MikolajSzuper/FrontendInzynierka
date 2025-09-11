import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { apiUrl } from '../../services/api';
import { FormsModule } from '@angular/forms';

interface UserResponse {
  content: User[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  numberOfElements: number;
  empty: boolean;
}

interface User {
  name: string;
  surname: string;
  username: string;
  email: string;
  userType: string;
  enabled: boolean;
  lock: boolean;
  uuid: string;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.html',
  styleUrl: './users.css'
})
export class Users implements OnInit {
  users: User[] = [];
  currentPage = 0;
  totalPages = 0;
  searchQuery = '';
  searchType: 'id' | 'name' = 'id';
  pageSize = 5; // domyślna liczba wyników na stronę

  newUser: Partial<User> & { password?: string } = {
    name: '',
    surname: '',
    username: '',
    email: '',
    userType: 'USER',
    password: ''
  };
  showAddUserForm = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.http.get<UserResponse>(
      apiUrl(`/auth/users?page=${this.currentPage}&size=${this.pageSize}`),
      { withCredentials: true }
    ).subscribe({
      next: (response) => {
        this.users = response.content;
        this.totalPages = response.totalPages;
        this.currentPage = response.pageable.pageNumber;
      },
      error: (err) => {
        console.error('Błąd podczas pobierania użytkowników:', err);
      }
    });
  }

  setSearchType(type: 'id' | 'name') {
    this.searchType = type;
  }

  search() {
    const searchParam = this.searchType === 'id' ? 'uuid' : 'surname';
    const url = apiUrl(
      `api/auth/users?page=${this.currentPage}&size=${this.pageSize}&${searchParam}=${this.searchQuery}`
    );
  this.http.get<UserResponse>(url, { withCredentials: true }).subscribe({
      next: (response) => {
        this.users = response.content;
        this.totalPages = response.totalPages;
        this.currentPage = response.pageable.pageNumber;
      },
      error: (err) => {
        console.error('Błąd podczas wyszukiwania użytkowników:', err);
      }
    });
  }

  goToPage(page: number) {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.loadUsers();
  }

  getPageNumbers(): number[] {
    if (this.totalPages <= 5) {
      // Jeśli jest 5 lub mniej stron, pokaż wszystkie
      return Array.from({ length: this.totalPages }, (_, i) => i);
    }

    const pages: number[] = [];
    const visiblePages = 3; // Liczba widocznych stron (bez pierwszej/ostatniej i wielokroka)
    
    // Zawsze dodaj pierwszą stronę
    pages.push(0);
    
    // Ustal środek "okna" paginacji
    let windowStart = this.currentPage - Math.floor(visiblePages / 2);
    
    // Upewnij się, że okno nie wykracza poza granice
    if (windowStart < 1) {
      windowStart = 1;
    } else if (windowStart > this.totalPages - visiblePages - 1) {
      windowStart = Math.max(this.totalPages - visiblePages - 1, 1);
    }
    
    // Dodaj wielokropek po pierwszej stronie, jeśli potrzeba
    if (windowStart > 1) {
      pages.push(-1); // -1 oznacza wielokropek
    }
    
    // Dodaj strony z "okna"
    for (let i = 0; i < visiblePages; i++) {
      const pageNum = windowStart + i;
      if (pageNum > 0 && pageNum < this.totalPages - 1) {
        pages.push(pageNum);
      }
    }
    
    // Dodaj wielokropek przed ostatnią stroną, jeśli potrzeba
    if (windowStart + visiblePages < this.totalPages - 1) {
      pages.push(-2); // -2 oznacza drugi wielokropek
    }
    
    // Zawsze dodaj ostatnią stronę, jeśli jest więcej niż jedna strona
    if (this.totalPages > 1) {
      pages.push(this.totalPages - 1);
    }
    
    return pages;
  }

  addUser() {
    const payload = {
      name: this.newUser.name,
      surname: this.newUser.surname,
      username: this.newUser.username,
      email: this.newUser.email,
      userType: this.newUser.userType,
      password: this.newUser.password
    };
    this.http.post(apiUrl('/auth/users'), payload).subscribe({
      next: () => {
        this.showAddUserForm = false;
        this.loadUsers();
        this.newUser = {
          name: '',
          surname: '',
          username: '',
          email: '',
          userType: 'USER',
          password: ''
        };
      },
      error: (err) => {
        console.error('Błąd podczas dodawania użytkownika:', err);
      }
    });
  }

  deleteUser(uuid: string) {
    if (!confirm('Czy na pewno chcesz usunąć tego użytkownika?')) return;
    this.http.delete(apiUrl(`/auth/users/${uuid}`), { withCredentials: true }).subscribe({
      next: () => {
        this.loadUsers();
      },
      error: (err) => {
        console.error('Błąd podczas usuwania użytkownika:', err);
      }
    });
  }
}
