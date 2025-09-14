import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { apiUrl } from '../../services/api';
import { ToastService } from '../../services/toast-service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Product {
  uuid: string;
  rfid: string;
  name: string;
  category: { id: number; name: string };
  spot: { id: number; name: string };
  contractor: string;
  updated_at: string;
  weight?: number;
  height?: number;
  width?: number;
  description?: string;
}

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search.html',
  styleUrl: './search.css'
})
export class Search implements OnInit {
  products: Product[] = [];
  totalPages = 0;
  currentPage = 0;
  pageSize = 10;

  // Filtry
  filter = {
    uuid: '',
    rfid: '',
    name: '',
    category: '',
    spot: '',
    contractor: '',
    updated_at: ''
  };

  editProductUuid: string | null = null;
  editProductData: any = {};

  contractors: { id: number, name: string }[] = [];
  places: { id: number, spot_name: string, hall_name: string, shelf_name: string, _free: boolean }[] = [];
  categories: { id: number, name: string }[] = [];

  constructor(private http: HttpClient, private toast: ToastService) {}

  ngOnInit() {
    this.loadProducts();
    this.loadContractors();
    this.loadPlaces();
    this.loadCategories(); // Dodaj ładowanie kategorii
  }

  buildQueryParams(): string {
    const params = [];
    Object.entries(this.filter).forEach(([key, value]) => {
      if (value && value !== '') params.push(`${key}=${encodeURIComponent(value)}`);
    });
    params.push(`page=${this.currentPage}`);
    params.push(`size=${this.pageSize}`);
    return params.length ? '?' + params.join('&') : '';
  }

  loadProducts() {
    const url = apiUrl('/products' + this.buildQueryParams());
    this.http.get<any>(url, { withCredentials: true }).subscribe({
      next: async (data) => {
        // Pobierz szczegóły dla każdego produktu równolegle
        const productsWithDetails = await Promise.all(
          data.content.map(async (product: Product) => {
            try {
              const details = await this.http.get<any>(apiUrl(`/products/${product.uuid}`), { withCredentials: true }).toPromise();
              return {
                ...product,
                description: details.description,
                weight: details.weight,
                height: details.height,
                width: details.width
              };
            } catch {
              return product;
            }
          })
        );
        this.products = productsWithDetails;
        this.totalPages = data.totalPages;
        this.currentPage = data.pageable.pageNumber;
      },
      error: (err) => {
        this.products = [];
        this.toast.show('error', 'Błąd', 'Nie udało się pobrać produktów');
      }
    });
  }

  loadContractors() {
    this.http.get<{ id: number, name: string }[]>(apiUrl('/contractors/'), { withCredentials: true }).subscribe({
      next: (data) => { this.contractors = data; },
      error: (err) => {
        const msg = err?.error?.[0]?.message || 'Wystąpił błąd';
        this.toast.show('error', 'Błąd', msg);
        console.error('Błąd podczas pobierania kontrahentów:', err);
      }
    });
  }

  loadPlaces() {
    this.http.get<any[]>(apiUrl('/warehouseManagement/warehouses/cfb67e8f-6ccd-4016-b355-6cf02ce511ac'), { withCredentials: true }).subscribe({
      next: (data) => { this.places = data.filter(p => p._free); },
      error: () => { this.toast.show('error', 'Błąd', 'Nie udało się pobrać miejsc'); }
    });
  }

  loadCategories() {
    this.http.get<{ id: number, name: string }[]>(apiUrl('/products/categories'), { withCredentials: true }).subscribe({
      next: (data) => { this.categories = data; },
      error: (err) => {
        const msg = err?.error?.[0]?.message || 'Wystąpił błąd';
        this.toast.show('error', 'Błąd', msg);
        console.error('Błąd podczas pobierania kategorii:', err);
      }
    });
  }

  onFilterChange() {
    this.currentPage = 0;
    this.loadProducts();
  }

  goToPage(page: number) {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.loadProducts();
  }

  startEditProduct(product: Product) {
    this.editProductUuid = product.uuid;
    this.http.get<any>(apiUrl(`/products/${product.uuid}`), { withCredentials: true }).subscribe({
      next: (details) => {
        this.editProductData = {
          rfid: product.rfid,
          name: product.name,
          category: product.category.id,
          description: details.description || '',
          weight: details.weight ?? null,
          height: details.height ?? null,
          width: details.width ?? null,
          contractor: product.contractor, // jeśli to id, jeśli nie: znajdź id po nazwie
          spot: product.spot.id
        };
      },
      error: () => {
        this.toast.show('error', 'Błąd', 'Nie udało się pobrać szczegółów produktu');
      }
    });
  }

  cancelEditProduct() {
    this.editProductUuid = null;
    this.editProductData = {};
  }

  saveEditProduct() {
    if (!this.editProductUuid) return;
    const payload = {
      rfid: this.editProductData.rfid,
      name: this.editProductData.name,
      category: Number(this.editProductData.category),
      description: this.editProductData.description,
      weight: Number(this.editProductData.weight),
      height: Number(this.editProductData.height),
      width: Number(this.editProductData.width),
      contractor: Number(this.editProductData.contractor),
      spot: Number(this.editProductData.spot)
    };
    this.http.put(apiUrl(`/products/${this.editProductUuid}`), payload, { withCredentials: true }).subscribe({
      next: () => {
        this.editProductUuid = null;
        this.editProductData = {};
        this.loadProducts();
        this.toast.show('success', 'Sukces', 'Produkt został pomyślnie edytowany.');
      },
      error: (err) => {
        const msg = err?.error?.message || 'Wystąpił błąd';
        this.toast.show('error', 'Błąd', msg);
        console.error('Błąd podczas edycji produktu:', err);
      }
    });
  }

  deleteProduct(uuid: string) {
    if (!confirm('Czy na pewno chcesz usunąć ten produkt?')) return;
    this.http.delete(apiUrl(`/products/${uuid}`), { withCredentials: true }).subscribe({
      next: () => {
        this.loadProducts();
        this.toast.show('success', 'Sukces', 'Produkt został pomyślnie usunięty.');
      },
      error: (err) => {
        const msg = err?.error?.message || 'Wystąpił błąd';
        this.toast.show('error', 'Błąd', msg);
        console.error('Błąd podczas usuwania produktu:', err);
      }
    });
  }

  getPageNumbers(): number[] {
    if (this.totalPages <= 4) {
      return Array.from({ length: this.totalPages }, (_, i) => i);
    }
    const pages: number[] = [];
    const visiblePages = 2;
    pages.push(0);
    let windowStart = this.currentPage - Math.floor(visiblePages / 2);
    if (windowStart < 1) windowStart = 1;
    else if (windowStart > this.totalPages - visiblePages - 1) windowStart = Math.max(this.totalPages - visiblePages - 1, 1);
    if (windowStart > 1) pages.push(-1);
    for (let i = 0; i < visiblePages; i++) {
      const pageNum = windowStart + i;
      if (pageNum > 0 && pageNum < this.totalPages - 1) pages.push(pageNum);
    }
    if (windowStart + visiblePages < this.totalPages - 1) pages.push(-2);
    if (this.totalPages > 1) pages.push(this.totalPages - 1);
    return pages;
  }

  getFreePlaces(): { id: number, spot_name: string, hall_name: string, shelf_name: string, _free: boolean }[] {
    return this.places.filter(p => p._free);
  }
}
