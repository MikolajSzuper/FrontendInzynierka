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
  spot_uuid: string;
  spot_name: string;
  shelf_uuid: string;
  shelf_name: string;
  hall_uuid: string;
  hall_name: string;
  warehouse_uuid: string;
  warehouse_name: string;
  _free: boolean;
}

type ShelfInfo = {
  shelf_name: string;
  shelf_uuid: string;
};

type HallInfo = {
  hall_name: string;
  hall_uuid: string;
  shelves: ShelfInfo[];
};

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

  hallsInfo: HallInfo[] = [];

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
        const locations = data.locations;
        this.places = locations.map((loc: any) => ({ ...loc }));

        // Grupowanie hal z regałami (z UUID)
        const hallsMap: { [hall_uuid: string]: HallInfo } = {};
        for (const loc of locations) {
          if (!hallsMap[loc.hall_uuid]) {
            hallsMap[loc.hall_uuid] = {
              hall_name: loc.hall_name,
              hall_uuid: loc.hall_uuid,
              shelves: []
            };
          }
          if (!hallsMap[loc.hall_uuid].shelves.some(s => s.shelf_uuid === loc.shelf_uuid)) {
            hallsMap[loc.hall_uuid].shelves.push({
              shelf_name: loc.shelf_name,
              shelf_uuid: loc.shelf_uuid
            });
          }
        }
        this.hallsInfo = Object.values(hallsMap);

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

  addShelf(hall_uuid: string, shelfNumber: number) {
    const shelfName = `Regał ${shelfNumber}`;
    this.http.post(
      apiUrl(`/warehouseManagement/halls/${hall_uuid}/shelves`),
      { name: shelfName },
      { withCredentials: true }
    ).subscribe({
      next: (response: any) => {
        // Po utworzeniu regału, automatycznie dodaj miejsce "Miejsce 1"
        if (response?.uuid) {
          this.http.post(
            apiUrl(`/warehouseManagement/shelves/${response.uuid}/spots`),
            { name: 'Miejsce 1' },
            { withCredentials: true }
          ).subscribe({
            next: () => this.loadPlaces(),
            error: (err) => {
              const msg = err?.error?.[0]?.message || 'Wystąpił błąd';
              console.error('Błąd dodawania miejsca:', err);
            }
          });
        } else {
          this.loadPlaces();
        }
      },
      error: (err) => {
        const msg = err?.error?.[0]?.message || 'Wystąpił błąd';
        console.error('Błąd dodawania regału:', err);
      }
    });
  }

  addPlace(shelf_uuid: string, placeNumber: number) {
    const spotName = `Miejsce ${placeNumber}`;
    this.http.post(
      apiUrl(`/warehouseManagement/shelves/${shelf_uuid}/spots`),
      { name: spotName },
      { withCredentials: true }
    ).subscribe({
      next: () => this.loadPlaces(),
      error: (err) => {
        const msg = err?.error?.[0]?.message || 'Wystąpił błąd';
        console.error('Błąd dodawania miejsca:', err);
      }
    });
  }

  getPlacesForShelf(shelf_uuid: string): Place[] {
    return this.places.filter(p => p.shelf_uuid === shelf_uuid);
  }
}
