import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { apiUrl } from '../../services/api';
import { ToastService } from '../../services/toast-service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Product {
  uuid: string;
  name: string;
  category: { id: number; name: string };
  spot: {
    id: number;
    name: string;
    shelf: { name: string; hall: { name: string } };
  };
  contractor: string;
  updated_at: string;
  rfid: string;
}

interface Contractor {
  id: number;
  name: string;
}

@Component({
  selector: 'app-receipts',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './receipts.html',
  styleUrl: './receipts.css'
})
export class Receipts implements OnInit {
  tab: 'add' | 'list' = 'add';

  products: Product[] = [];
  contractors: Contractor[] = [];
  selectedProducts: Set<string> = new Set();
  selectedContractor: number | '' = '';

  receiptsList: any[] = [];
  selectedReceipt: any = null;
  loadingReceipts = false;
  loadingReceiptDetails = false;

  editReceiptUuid: string | null = null;
  editReceiptData: any = {};

  productsToAdd: { [uuid: string]: boolean } = {};

  isSupervisor = localStorage.getItem('user_type') === 'SUPERVISOR';

  constructor(private http: HttpClient, private toast: ToastService) {}

  ngOnInit() {
    this.loadProducts();
    this.loadContractors();
  }

  loadProducts() {
    this.http.get<any>(apiUrl('/products?is_active=false&issued=false'), { withCredentials: true }).subscribe({
      next: (data) => {
        this.products = data.content ?? [];
      },
      error: (err) => {
        if (err.status === 400) {
          this.products = [];
        } else {
          this.toast.show('error', 'Błąd', 'Nie udało się pobrać produktów');
        }
      }
    });
  }

  loadContractors() {
    this.http.get<Contractor[]>(apiUrl('/contractors/'), { withCredentials: true }).subscribe({
      next: (data) => {
        this.contractors = data;
      },
      error: () => {
        this.toast.show('error', 'Błąd', 'Nie udało się pobrać kontrahentów');
      }
    });
  }

  toggleProduct(uuid: string, checked: boolean) {
    if (checked) {
      this.selectedProducts.add(uuid);
    } else {
      this.selectedProducts.delete(uuid);
    }
  }

  addReceipt() {
    if (!this.selectedContractor || this.selectedProducts.size === 0) return;
    const payload = {
      contractor: String(this.selectedContractor),
      products: Array.from(this.selectedProducts)
    };
    this.http.post(apiUrl('/productService/receipts'), payload, {
      withCredentials: true,
      responseType: 'blob'
    }).subscribe({
      next: (blob: Blob) => {
        const filename = 'przyjecie.docx';
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
        this.toast.show('success', 'Sukces', 'Przyjęcie zostało dodane, plik został pobrany.');
        this.selectedProducts.clear();
        this.selectedContractor = '';
        this.loadProducts();
      },
      error: (err) => {
        if (err.status === 200 && err.error instanceof Blob) {
          const filename = 'przyjecie.docx';
          const url = window.URL.createObjectURL(err.error);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          a.click();
          window.URL.revokeObjectURL(url);
          this.toast.show('success', 'Sukces', 'Przyjęcie zostało dodane, plik został pobrany.');
          this.selectedProducts.clear();
          this.selectedContractor = '';
          this.loadProducts();
          return;
        }
        if (err.status === 400 && err.error instanceof Blob) {
          err.error.text().then((msg: string) => {
            this.toast.show('error', 'Błąd', msg);
            console.error('Błąd dodawania produktu:', msg);
          });
          return;
        }
        this.toast.show('error', 'Błąd', 'Nie udało się dodać przyjęcia');
        console.error('Błąd dodawania produktu:', err);
      }
    });
  }

  setTab(tab: 'add' | 'list') {
    this.tab = tab;
    if (tab === 'list') {
      this.fetchReceiptsList();
    }
    if (tab === 'add') {
      this.selectedReceipt = null;
    }
  }

  fetchReceiptsList() {
    this.loadingReceipts = true;
    this.http.get<any[]>(apiUrl('/productService/receipts'), { withCredentials: true }).subscribe({
      next: (data) => {
        this.receiptsList = data ?? [];
        this.loadingReceipts = false;
      },
      error: () => {
        this.receiptsList = [];
        this.loadingReceipts = false;
        this.toast.show('error', 'Błąd', 'Nie udało się pobrać listy przyjęć');
      }
    });
  }

  showReceiptDetails(uuid: string) {
    this.loadingReceiptDetails = true;
    this.selectedReceipt = null;
    this.http.get<any>(apiUrl(`/productService/receipts/${uuid}`), { withCredentials: true }).subscribe({
      next: (data) => {
        this.selectedReceipt = data;
        this.loadingReceiptDetails = false;
      },
      error: () => {
        this.selectedReceipt = null;
        this.loadingReceiptDetails = false;
        this.toast.show('error', 'Błąd', 'Nie udało się pobrać szczegółów przyjęcia');
      }
    });
  }

  closeReceiptDetails() {
    this.selectedReceipt = null;
  }

  removedProducts: Set<string> = new Set();

  get availableProductsForEdit() {
    const usedUuids = new Set([
      ...(this.selectedReceipt?.products?.map((p: any) => p.uuid) ?? []),
      ...Array.from(this.removedProducts)
    ]);
    return this.products.filter(p => !usedUuids.has(p.uuid));
  }

  startEditReceipt(receipt: any) {
    this.editReceiptUuid = receipt.uuid;
    let contractorId = this.contractors.find(c => c.name === receipt.contractor)?.id;
    if (!contractorId && typeof receipt.contractor === 'number') {
      contractorId = receipt.contractor;
    }
    this.editReceiptData = {
      contractor: contractorId ?? '',
      products: receipt.products.map((p: any) => p.uuid)
    };
    this.removedProducts = new Set();
    this.productsToAdd = {};
  }

  removeProductFromEdit(uuid: string) {
    if (this.removedProducts.has(uuid)) {
      this.removedProducts.delete(uuid);
    } else {
      this.removedProducts.add(uuid);
    }
  }

  cancelEditReceipt() {
    this.editReceiptUuid = null;
    this.editReceiptData = {};
    this.removedProducts = new Set();
    this.productsToAdd = {};
  }

  saveEditReceipt() {
    if (!this.editReceiptUuid) return;
    const original = this.selectedReceipt.products.map((p: any) => p.uuid);
    const kept: string[] = original.filter((uuid: string) => !this.removedProducts.has(uuid));
    const added = Object.entries(this.productsToAdd)
      .filter(([uuid, checked]) => checked)
      .map(([uuid]) => uuid);
    const payload = {
      contractor: String(this.editReceiptData.contractor),
      products: [...kept, ...added]
    };
    this.http.put(apiUrl(`/productService/receipts/${this.editReceiptUuid}`), payload, {
      withCredentials: true,
      responseType: 'blob'
    }).subscribe({
      next: (blob: Blob) => {
        const filename = 'przyjecie.docx';
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);

        this.editReceiptUuid = null;
        this.editReceiptData = {};
        this.removedProducts = new Set();
        this.productsToAdd = {};
        this.showReceiptDetails(this.selectedReceipt.uuid);
        this.fetchReceiptsList();
        this.loadProducts();
        this.toast.show('success', 'Sukces', 'Przyjęcie zostało zaktualizowane, plik został pobrany.');
      },
      error: (err) => {
        if (err.status === 200 && err.error instanceof Blob) {
          const filename = 'przyjecie.docx';
          const url = window.URL.createObjectURL(err.error);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          a.click();
          window.URL.revokeObjectURL(url);

          this.editReceiptUuid = null;
          this.editReceiptData = {};
          this.removedProducts = new Set();
          this.productsToAdd = {};
          this.showReceiptDetails(this.selectedReceipt.uuid);
          this.fetchReceiptsList();
          this.loadProducts();
          this.toast.show('success', 'Sukces', 'Przyjęcie zostało zaktualizowane, plik został pobrany.');
          return;
        }
        const msg = err?.error?.message || 'Wystąpił błąd';
        this.toast.show('error', 'Błąd', msg);
        console.error('Błąd podczas edycji przyjęcia:', err);
      }
    });
  }

  deleteReceipt(uuid: string) {
    if (!confirm('Czy na pewno chcesz usunąć to przyjęcie?')) return;
    this.http.delete(apiUrl(`/productService/receipts/${uuid}`), { withCredentials: true }).subscribe({
      next: () => {
        this.selectedReceipt = null;
        this.fetchReceiptsList();
        this.loadProducts();
        this.toast.show('success', 'Sukces', 'Przyjęcie zostało usunięte.');
      },
      error: (err) => {
        const msg = err?.error?.message || 'Wystąpił błąd';
        this.toast.show('error', 'Błąd', msg);
        console.error('Błąd podczas usuwania przyjęcia:', err);
      }
    });
  }
}
