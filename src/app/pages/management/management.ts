import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { apiUrl } from '../../services/api';
import { WAREHOUSE_UUID } from '../../app.config';

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
    this.http.get<any>(
      apiUrl(`/warehouseManagement/warehouses/${WAREHOUSE_UUID}`),
      { withCredentials: true }
    ).subscribe({
      next: (data) => {
        // locations zawiera pełne obiekty z nazwami
        const locations = data.locations;
        this.places = locations.map((loc: any) => ({
          id: loc.id,
          shelf: loc.shelf,
          hall: loc.hall,
          warehouse: loc.warehouse,
          spot_name: loc.spot_name,
          shelf_name: loc.shelf_name,
          hall_name: loc.hall_name
        }));

        // Grupa hal po nazwie
        this.halls = Array.from(new Set(locations.map((loc: any) => loc.hall_name)));

        // Grupa półek po nazwie dla każdej hali
        this.shelves = {};
        for (const hallName of this.halls) {
          this.shelves[hallName] = Array.from(
            new Set(
              locations
                .filter((loc: any) => loc.hall_name === hallName)
                .map((loc: any) => loc.shelf_name)
            )
          );
        }

        // Grupa miejsc po nazwie półki
        this.placesByShelf = {};
        for (const shelfName of locations.map((loc: any) => loc.shelf_name)) {
          this.placesByShelf[shelfName] = locations.filter((loc: any) => loc.shelf_name === shelfName);
        }
      },
      error: (err) => {
        const msg = err?.error?.[0]?.message || 'Wystąpił błąd';
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
    const hallNumbers = this.halls
    .map(hall => {
      const hallName = String(hall);
      const match = hallName.match(/hala (\d+)/i);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(n => n > 0);
  const nextNumber = hallNumbers.length > 0 ? Math.max(...hallNumbers) + 1 : 1;
  const newHallName = `hala ${nextNumber}`;

  this.http.post(
    apiUrl(`/warehouseManagement/warehouses/${WAREHOUSE_UUID}/halls`),
    { name: newHallName },
    { withCredentials: true }
  ).subscribe({
    next: () => {
      this.loadPlaces();
    },
    error: (err) => {
      const msg = err?.error?.[0]?.message || 'Wystąpił błąd';
      console.error('Błąd dodawania hali:', err);
      // this.toast?.show('error', 'Błąd', msg);
    }
  });
  }

  addShelf() {

  }

  addPlace() {

  }
}
