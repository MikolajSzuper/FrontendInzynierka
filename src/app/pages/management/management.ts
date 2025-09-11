import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { apiUrl } from '../../services/api';

interface Place {
  id: number;
  shelf: number;
  hall: number;
  warehouse: number;
}

interface Category {
  id: number;
  name: string;
}

@Component({
  selector: 'app-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './management.html',
  styleUrl: './management.css'
})
export class Management {
  activeTab: 'addItem' | 'halls' | 'categories' = 'addItem';
  isSupervisor = localStorage.getItem('user_type') === 'SUPERVISOR';

  // Dane do dodawania towaru
  item = {
    id: '',
    name: '',
    category: '',
    hall: '',
    rack: '',
    place: ''
  };

  // Dane do widoku hal
  places: Place[] = [];
  halls: number[] = [];
  shelves: { [hall: number]: number[] } = {};
  placesByShelf: { [shelf: number]: Place[] } = {};

  // Kategorie
  categories: Category[] = [];
  newCategoryName = '';

  // Formularze dodawania
  newHall = '';
  newShelf = { hall: '', shelf: '' };
  newPlace = { hall: '', shelf: '' };

  constructor(private http: HttpClient) {}

  setTab(tab: 'addItem' | 'halls' | 'categories') {
    this.activeTab = tab;
    this.clearAllFields();
    if (tab === 'halls' && this.isSupervisor) {
      this.loadPlaces();
    }
    if (tab === 'categories' && this.isSupervisor) {
      this.loadCategories();
    }
  }

  clearField(field: keyof typeof this.item) {
    this.item[field] = '';
  }

  clearAllFields() {
    this.item = {
      id: '',
      name: '',
      category: '',
      hall: '',
      rack: '',
      place: ''
    };
  }

  loadPlaces() {
    this.http.get<Place[]>(
      apiUrl('/warehouseManagement/warehouses/788e28b6-18fa-423d-9d36-a58ad6c3a4a9'),
      { withCredentials: true }
    ).subscribe({
      next: (data) => {
        this.places = data;
        this.halls = Array.from(new Set(data.map(p => p.hall)));
        this.shelves = {};
        this.placesByShelf = {};
        for (const hall of this.halls) {
          this.shelves[hall] = Array.from(new Set(data.filter(p => p.hall === hall).map(p => p.shelf)));
        }
        for (const shelf of data.map(p => p.shelf)) {
          this.placesByShelf[shelf] = data.filter(p => p.shelf === shelf);
        }
      },
      error: (err) => {
        const msg = err?.error?.[0]?.message || 'Wystąpił błąd';
        // Jeśli masz toast service, użyj go tutaj:
        // this.toast.show('error', 'Błąd', msg);
        console.error('Błąd podczas pobierania miejsc:', err);
      }
    });
  }

  loadCategories() {
    this.http.get<Category[]>(apiUrl('/products/categories'), { withCredentials: true }).subscribe({
      next: (data) => {
        this.categories = data;
      },
      error: (err) => {
        const msg = err?.error?.[0]?.message || 'Wystąpił błąd';
        // this.toast?.show('error', 'Błąd', msg);
        console.error('Błąd podczas pobierania kategorii:', err);
      }
    });
  }

  addCategory() {
    if (!this.newCategoryName.trim()) return;
    this.http.post(apiUrl('/products/categories'), { name: this.newCategoryName.trim() }, { withCredentials: true }).subscribe({
      next: () => {
        this.newCategoryName = '';
        this.loadCategories();
      },
      error: (err) => {
        const msg = err?.error?.[0]?.message || 'Wystąpił błąd';
        // this.toast?.show('error', 'Błąd', msg);
        console.error('Błąd podczas dodawania kategorii:', err);
      }
    });
  }

  deleteCategory(id: number) {
    if (!confirm('Czy na pewno chcesz usunąć tę kategorię?')) return;
    this.http.delete(apiUrl(`/products/categories/${id}`), { withCredentials: true }).subscribe({
      next: () => {
        this.loadCategories();
      },
      error: (err) => {
        const msg = err?.error?.[0]?.message || 'Wystąpił błąd';
        // this.toast?.show('error', 'Błąd', msg);
        console.error('Błąd podczas usuwania kategorii:', err);
      }
    });
  }

  addHall() {
    // Przykład wysłania nowej hali

  }

  addShelf() {

  }

  addPlace() {

  }
}
