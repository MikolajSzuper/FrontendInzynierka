import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { apiUrl } from '../../services/api';
import { WAREHOUSE_UUID } from '../../app.config';
import { ToastService } from '../../services/toast-service';

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

  item = {
    id: '',
    name: '',
    category: '',
    hall: '',
    rack: '',
    place: ''
  };

  product = {
    rfid: '',
    name: '',
    category: '',
    description: '',
    weight: null,
    height: null,
    width: null,
    spot: '',
    contractor: ''
  };

  places: Place[] = [];
  halls: number[] = [];
  shelves: { [hall: number]: number[] } = {};
  placesByShelf: { [shelf: number]: Place[] } = {};

  categories: Category[] = [];
  newCategoryName = '';

  newHall = '';
  newShelf = { hall: '', shelf: '' };
  newPlace = { hall: '', shelf: '' };

  hallsInfo: HallInfo[] = [];

  contractors: { id: number, name: string }[] = [];

  constructor(private http: HttpClient, private toast: ToastService) {}

  ngOnInit() {
    this.loadCategories();
    this.loadContractors();
    this.loadPlaces();
  }

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
    this.product = {
      rfid: '',
      name: '',
      category: '',
      description: '',
      weight: null,
      height: null,
      width: null,
      spot: '',
      contractor: ''
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

        this.halls = Array.from(new Set(locations.map((loc: any) => loc.hall_name)));

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

        this.placesByShelf = {};
        for (const shelfName of locations.map((loc: any) => loc.shelf_name)) {
          this.placesByShelf[shelfName] = locations.filter((loc: any) => loc.shelf_name === shelfName);
        }
      },
      error: (err) => {
        const msg = err?.error?.[0]?.message || 'Wystąpił błąd';
        this.toast.show('error', 'Błąd', msg);
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
        this.toast.show('error', 'Błąd', msg);
        console.error('Błąd podczas pobierania kategorii:', err);
      }
    });
  }

  loadContractors() {
    this.http.get<any[]>(apiUrl('/contractors/'), { withCredentials: true }).subscribe({
      next: (data) => {
        this.contractors = data;
      },
      error: (err) => {
        const msg = err?.error?.[0]?.message || 'Wystąpił błąd';
        this.toast.show('error', 'Błąd', msg);
        console.error('Błąd podczas pobierania kontrahentów:', err);
      }
    });
  }

  addCategory() {
    if (!this.newCategoryName.trim()) return;
    this.http.post(apiUrl('/products/categories'), { name: this.newCategoryName.trim() }, { withCredentials: true }).subscribe({
      next: () => {
        this.newCategoryName = '';
        this.loadCategories();
        this.toast.show('success', 'Sukces', 'Kategoria została dodana');
      },
      error: (err) => {
        const msg = err?.error?.[0]?.message || 'Wystąpił błąd';
        this.toast.show('error', 'Błąd', msg);
        console.error('Błąd podczas dodawania kategorii:', err);
      }
    });
  }

  deleteCategory(id: number) {
    if (!confirm('Czy na pewno chcesz usunąć tę kategorię?')) return;
    this.http.delete(apiUrl(`/products/categories/${id}`), { withCredentials: true }).subscribe({
      next: () => {
        this.loadCategories();
        this.toast.show('success', 'Sukces', 'Kategoria została usunięta');
      },
      error: (err) => {
        const msg = err?.error?.[0]?.message || 'Wystąpił błąd';
        this.toast.show('error', 'Błąd', msg);
        console.error('Błąd podczas usuwania kategorii:', err);
      }
    });
  }

  addHall() {
    const hallNumbers = this.halls
      .map(hall => {
        const hallName = String(hall);
        const match = hallName.match(/Hala (\d+)/i);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(n => n > 0);
    const nextNumber = hallNumbers.length > 0 ? Math.max(...hallNumbers) + 1 : 1;
    const newHallName = `Hala ${nextNumber}`;

    this.http.post(
      apiUrl(`/warehouseManagement/warehouses/${WAREHOUSE_UUID}/halls`),
      { name: newHallName },
      { withCredentials: true }
    ).subscribe({
      next: (response: any) => {
        let hallName = newHallName;
        if (response?.message) {
          const match = response.message.match(/Utworzono hale (Hala \d+)/i);
          if (match) {
            hallName = match[1];
          }
        }
        if (response?.uuid) {
          this.addShelf(response.uuid, hallName);
        } else {
          this.loadPlaces();
        }
      },
      error: (err) => {
        const msg = err?.error?.[0]?.message || 'Wystąpił błąd';
        this.toast.show('error', 'Błąd', msg);
        console.error('Błąd dodawania hali:', err);
      }
    });
  }

  addShelf(hall_uuid: string, hall_name?: string) {
    let hallNumber = '1';
    if (hall_name) {
      const hallMatch = hall_name.match(/(\d+)/);
      hallNumber = hallMatch ? hallMatch[1] : '1';
    } else {
      const hall = this.hallsInfo.find(h => h.hall_uuid === hall_uuid);
      if (hall) {
        const hallMatch = hall.hall_name.match(/(\d+)/);
        hallNumber = hallMatch ? hallMatch[1] : '1';
      }
    }

    const hall = this.hallsInfo.find(h => h.hall_uuid === hall_uuid);
    const shelfNumber = hall ? hall.shelves.length + 1 : 1;

    // Nazwa regału w formacie "Regał X.Y"
    const shelfName = `Regał ${hallNumber}.${shelfNumber}`;

    this.http.post(
      apiUrl(`/warehouseManagement/halls/${hall_uuid}/shelves`),
      { name: shelfName },
      { withCredentials: true }
    ).subscribe({
      next: (response: any) => {
        if (response?.uuid) {
          this.addPlace(response.uuid);
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

  addPlace(shelf_uuid: string) {
    const currentPlaces = this.places.filter(p => p.shelf_uuid === shelf_uuid);
    const nextPlaceNumber = currentPlaces.length + 1;
    const spotName = `Miejsce ${nextPlaceNumber}`;
    this.http.post(
      apiUrl(`/warehouseManagement/shelves/${shelf_uuid}/spots`),
      { name: spotName },
      { withCredentials: true }
    ).subscribe({
      next: () => { 
        this.loadPlaces(); 
        this.toast.show('success', 'Sukces', 'Miejsce zostało dodane');
      },
      error: (err) => {
        const msg = err?.error?.[0]?.message || 'Wystąpił błąd';
        this.toast.show('error', 'Błąd', msg);
        console.error('Błąd dodawania miejsca:', err);
      }
    });
  }

  addProduct() {
    const payload = {
      rfid: this.product.rfid,
      name: this.product.name,
      category: Number(this.product.category),
      description: this.product.description,
      weight: this.product.weight,
      height: this.product.height,
      width: this.product.width,
      spot: Number(this.product.spot),
      contractor: Number(this.product.contractor)
    };
    this.http.post(apiUrl('/products'), payload, { withCredentials: true }).subscribe({
      next: () => {
        const spotId = Number(this.product.spot);
        const place = this.places.find(p => p.id === spotId);
        if (place) place._free = false;

        this.clearAllFields();
        this.toast.show('success', 'Sukces', 'Produkt został dodany');
      },
      error: (err) => {
        const msg = err?.error?.message || 'Wystąpił błąd';
        this.toast.show('error', 'Błąd', msg);
        console.error('Błąd dodawania produktu:', err);
      }
    });
  }

  getPlacesForShelf(shelf_uuid: string): Place[] {
    return this.places.filter(p => p.shelf_uuid === shelf_uuid);
  }

  getFreePlaces(): Place[] {
    return this.places.filter(p => p._free);
  }

  deleteHall(hall_uuid: string) {
    if (!confirm('Czy na pewno chcesz usunąć tę halę?')) return;
    this.http.delete(apiUrl(`/warehouseManagement/halls/${hall_uuid}`), { withCredentials: true }).subscribe({
      next: () => {
        this.toast.show('success', 'Sukces', 'Hala została usunięta');
        this.loadPlaces();
      },
      error: (err) => {
        const msg = err?.error?.[0]?.message || 'Wystąpił błąd';
        this.toast.show('error', 'Błąd', msg);
        console.error('Błąd podczas usuwania hali:', err);
      }
    });
  }

  deleteShelf(shelf_uuid: string) {
    if (!confirm('Czy na pewno chcesz usunąć ten regał?')) return;
    this.http.delete(apiUrl(`/warehouseManagement/shelves/${shelf_uuid}`), { withCredentials: true }).subscribe({
      next: () => {
        this.toast.show('success', 'Sukces', 'Regał został usunięty');
        this.loadPlaces();
      },
      error: (err) => {
        const msg = err?.error?.[0]?.message || 'Wystąpił błąd';
        this.toast.show('error', 'Błąd', msg);
        console.error('Błąd podczas usuwania regału:', err);
      }
    });
  }

  deletePlace(spot_uuid: string) {
    if (!confirm('Czy na pewno chcesz usunąć to miejsce?')) return;
    this.http.delete(apiUrl(`/warehouseManagement/spots/${spot_uuid}`), { withCredentials: true }).subscribe({
      next: () => {
        this.toast.show('success', 'Sukces', 'Miejsce zostało usunięte');
        this.loadPlaces();
      },
      error: (err) => {
        const msg = err?.error?.[0]?.message || 'Wystąpił błąd';
        this.toast.show('error', 'Błąd', msg);
        console.error('Błąd podczas usuwania miejsca:', err);
      }
    });
  }
}
