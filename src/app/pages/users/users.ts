import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { apiUrl } from '../../services/api';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../services/toast-service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

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
  pageSize = 10; // domyślna liczba wyników na stronę

  newUser: Partial<User> & { password?: string } = {
    name: '',
    surname: '',
    username: '',
    email: '',
    userType: 'USER',
    password: ''
  };
  showAddUserForm = false;

  editUserUuid: string | null = null;
  editUserData: Partial<User> & { password?: string } = {};

  private searchSubject = new Subject<string>();

  constructor(private http: HttpClient, private toast: ToastService) {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe((query) => {
      if (query.length > 2) {
        this.performSearch(query);
      } else {
        this.loadUsers();
      }
    });
  }

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
        const msg = err?.error?.[0]?.message || 'Wystąpił błąd';
        this.toast.show('error', 'Błąd', msg);
        console.error('Błąd podczas pobierania użytkowników:', err);
      }
    });
  }

  setSearchType(type: 'id' | 'name') {
    this.searchType = type;
  }

  onSearchQueryChange(query: string) {
    this.searchSubject.next(query);
  }

  performSearch(query: string) {
    const searchParam = this.searchType === 'id' ? 'uuid' : 'surname';
    const url = apiUrl(
      `/auth/users?page=${this.currentPage}&size=${this.pageSize}&${searchParam}=${query}`
    );
    this.http.get<UserResponse>(url, { withCredentials: true }).subscribe({
      next: (response) => {
        this.users = Array.isArray(response?.content) ? response.content : [];
        this.totalPages = Array.isArray(response?.totalPages) ? response.totalPages : 0;
        this.currentPage = Array.isArray(response?.pageable?.pageNumber) ? response.pageable.pageNumber : 0;
      },
      error: (err) => {
        const msg = err?.error?.[0]?.message || 'Wystąpił błąd';
        this.toast.show('error', 'Błąd', msg);
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
    if (this.totalPages <= 4) {
      // Jeśli jest 4 lub mniej stron, pokaż wszystkie
      return Array.from({ length: this.totalPages }, (_, i) => i);
    }

    const pages: number[] = [];
    const visiblePages = 2; // Liczba widocznych stron (bez pierwszej/ostatniej i wielokroka)
    
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
    console.log('Dodawanie użytkownika z danymi:', payload);
    this.http.post(apiUrl('/auth/users'), payload, { withCredentials: true }).subscribe({
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
        this.toast.show('success', 'Sukces', 'Użytkownik został pomyślnie dodany.');
      },
      error: (err) => {
        const msg = err?.error?.[0]?.message || 'Wystąpił błąd';
        this.toast.show('error', 'Błąd', msg);
        console.error('Błąd podczas dodawania użytkownika:', err);
      }
    });
  }

  deleteUser(uuid: string) {
    if (!confirm('Czy na pewno chcesz usunąć tego użytkownika?')) return;
    this.http.delete(apiUrl(`/auth/users/${uuid}`), { withCredentials: true }).subscribe({
      next: () => {
        this.loadUsers();
        this.toast.show('success', 'Sukces', 'Użytkownik został pomyślnie usunięty.');
      },
      error: (err) => {
        const msg = err?.error?.[0]?.message || 'Wystąpił błąd';
        this.toast.show('error', 'Błąd', msg);
        console.error('Błąd podczas usuwania użytkownika:', err);
      }
    });
  }

  startEditUser(user: User) {
    this.editUserUuid = user.uuid;
    this.editUserData = {
      name: user.name,
      surname: user.surname,
      username: user.username,
      email: user.email,
      userType: user.userType,
      enabled: user.enabled, 
      password: ''
    };
  }

  cancelEditUser() {
    this.editUserUuid = null;
    this.editUserData = {};
  }

  saveEditUser() {
    if (!this.editUserUuid) return;
    const payload: any = {
      name: this.editUserData.name,
      surname: this.editUserData.surname,
      username: this.editUserData.username,
      email: this.editUserData.email,
      userType: this.editUserData.userType,
      isEnable: this.editUserData.enabled 
    };
    if (this.editUserData.password && this.editUserData.password.trim() !== '') {
      payload.password = this.editUserData.password;
    }
    this.http.put(apiUrl(`/auth/users/${this.editUserUuid}`), payload, { withCredentials: true }).subscribe({
      next: () => {
        this.editUserUuid = null;
        this.editUserData = {};
        this.loadUsers();
        this.toast.show('success', 'Sukces', 'Użytkownik został pomyślnie edytowany.');
      },
      error: (err) => {
        const msg = err?.error?.[0]?.message || 'Wystąpił błąd';
        this.toast.show('error', 'Błąd', msg);
        console.error('Błąd podczas edycji użytkownika:', err);
      }
    });
  }
}
