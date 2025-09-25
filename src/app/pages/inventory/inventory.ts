import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { apiUrl } from '../../services/api';
import { ToastService } from '../../services/toast-service';
import { WAREHOUSE_UUID } from '../../app.config';

interface Location {
  id: number;
  shelf_name: string;
  hall_uuid: string;
  hall_name: string;
}

interface InventoryProduct {
  uuid: string;
  name: string;
  category: string;
  spot: number;
  contractor: string;
  updated_at: string;
  note: string;
  isCorrect: boolean;
  rfid: string;
}

@Component({
  selector: 'app-inventory',
  templateUrl: './inventory.html',
  styleUrl: './inventory.css',
  imports: [CommonModule, FormsModule]
})
export class Inventory implements OnInit {
  halls: { uuid: string; name: string }[] = [];
  selectedHallUuid: string | null = null;
  shelves: string[] = [];
  inventory: { [shelf: string]: InventoryProduct[] } = {};
  loading = false;
  generalNote: string = '';
  showNoteInput: boolean = false;

  constructor(private http: HttpClient, private toast: ToastService) {}

  ngOnInit() {
    this.loadHalls();
  }

  loadHalls() {
    this.http.get<any>(apiUrl(`/warehouseManagement/warehouses/${WAREHOUSE_UUID}`), { withCredentials: true }).subscribe({
      next: (data) => {
        const hallsMap = new Map<string, string>();
        for (const loc of data.locations) {
          hallsMap.set(loc.hall_uuid, loc.hall_name);
        }
        this.halls = Array.from(hallsMap.entries()).map(([uuid, name]) => ({ uuid, name }));
        if (this.halls.length) {
          this.selectHall(this.halls[0].uuid);
        }
      }
    });
  }

  selectHall(hallUuid: string) {
    this.selectedHallUuid = hallUuid;
    this.loading = true;
    this.http.get<any>(apiUrl(`/products/inventories/${hallUuid}`), { withCredentials: true }).subscribe({
      next: (data) => {
        this.inventory = data.inventory;
        this.shelves = Object.keys(this.inventory);
        this.generalNote = data.note || '';
        this.loading = false;
      },
      error: () => { 
        this.loading = false;   
      }
    });
  }

  setCorrect(shelf: string, idx: number, value: boolean) {
    this.inventory[shelf][idx].isCorrect = value;
    if (value) this.inventory[shelf][idx].note = '';
  }

  saveInventory() {
    if (!this.selectedHallUuid) return;
    const endpoint = apiUrl(`/products/inventories/${this.selectedHallUuid}`);
    const payload = { inventory: this.inventory, note: this.generalNote };
    this.http.post(endpoint, payload, { withCredentials: true, responseType: 'blob' }).subscribe({
      next: (blob: Blob) => {
        const filename = 'inwentaryzacja.xlsx';
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
        this.toast.show('success', 'Sukces', 'Inwentaryzacja została zapisana, plik został pobrany.');
      },
      error: (err) => {
        this.toast.show('error', 'Błąd', err?.error?.message || 'Błąd przy zapisie inwentaryzacji.');
        console.error(err);
      }
    });
  }

  hasIncorrectProduct(shelf: string): boolean {
    return Array.isArray(this.inventory[shelf]) && this.inventory[shelf].some(prod => !prod.isCorrect);
  }
}
