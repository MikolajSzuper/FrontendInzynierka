import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../services/toast-service';
import { apiUrl } from '../../services/api';

interface Contractor {
  uuid: string;
  id: number;
  name: string;
  phone: string;
  email: string;
  accountMaganerUsername: string;
}

@Component({
  selector: 'app-contractors',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contractors.html',
  styleUrl: './contractors.css'
})
export class Contractors implements OnInit {
  contractors: Contractor[] = [];
  activeTab: 'list' | 'add' = 'list';
  newContractor: Partial<Contractor> = { name: '', phone: '', email: '' };

  showAddForm: boolean = false;

  editUuid: string | null = null;
  editData: Partial<Contractor> = {};

  constructor(private http: HttpClient, private toast: ToastService) {}

  ngOnInit() {
    this.loadContractors();
  }

  setTab(tab: 'list' | 'add') {
    this.activeTab = tab;
    this.editUuid = null;
    this.editData = {};
    this.newContractor = { name: '', phone: '', email: '' };
    if (tab === 'list') {
      this.loadContractors();
    }
  }

  loadContractors() {
    this.http.get<Contractor[]>(apiUrl('/contractors/'), { withCredentials: true }).subscribe({
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

  addContractor() {
    const required = [
      { value: this.newContractor.name, label: 'Nazwa' },
      { value: this.newContractor.phone, label: 'Telefon' },
      { value: this.newContractor.email, label: 'E-mail' }
    ];
    const missing = required
      .filter(f => f.value === null || f.value === undefined || (typeof f.value === 'string' && f.value.trim() === ''))
      .map(f => f.label);
    if (missing.length > 0) {
      this.toast.show('error', 'Błąd', `Brakuje pól: ${missing.join(', ')}`);
      return;
    }

    const email = String(this.newContractor.email).trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.toast.show('error', 'Błąd', 'Nieprawidłowy format e-mail.');
      return;
    }

    const phone = String(this.newContractor.phone).trim();
    const phoneRegex = /^[0-9+\-\s()]{6,}$/; 
    if (!phoneRegex.test(phone)) {
      this.toast.show('error', 'Błąd', 'Nieprawidłowy numer telefonu.');
      return;
    }

    const payload = {
      name: String(this.newContractor.name).trim(),
      phone,
      email
    };

    this.http.post(apiUrl('/contractors/'), payload, { withCredentials: true }).subscribe({
      next: () => {
        this.showAddForm = false;
        this.newContractor = { name: '', phone: '', email: '' };
        this.loadContractors();
        this.toast.show('success', 'Sukces', 'Kontrahent został dodany.');
      },
      error: (err) => {
        const msg = err?.error?.[0]?.message || 'Wystąpił błąd';
        this.toast.show('error', 'Błąd', msg);
        console.error('Błąd podczas dodawania kontrahenta:', err);
      }
    });
  }

  startEdit(contractor: Contractor) {
    this.editUuid = contractor.uuid;
    this.editData = { ...contractor };
  }

  cancelEdit() {
    this.editUuid = null;
    this.editData = {};
  }

  saveEdit() {
    if (!this.editUuid) return;
    const required = [
      { value: this.editData.name, label: 'Nazwa' },
      { value: this.editData.phone, label: 'Telefon' },
      { value: this.editData.email, label: 'E-mail' }
    ];
    const missing = required
      .filter(f => f.value === null || f.value === undefined || (typeof f.value === 'string' && f.value.trim() === ''))
      .map(f => f.label);
    if (missing.length > 0) {
      this.toast.show('error', 'Błąd', `Brakuje pól: ${missing.join(', ')}`);
      return;
    }

    const email = String(this.editData.email).trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.toast.show('error', 'Błąd', 'Nieprawidłowy format e-mail.');
      return;
    }

    const phone = String(this.editData.phone).trim();
    const phoneRegex = /^[0-9+\-\s()]{6,}$/;
    if (!phoneRegex.test(phone)) {
      this.toast.show('error', 'Błąd', 'Nieprawidłowy numer telefonu.');
      return;
    }

    const payload = {
      name: String(this.editData.name).trim(),
      phone,
      email
    };
    this.http.put(apiUrl(`/contractors/${this.editUuid}`), payload, { withCredentials: true }).subscribe({
      next: () => {
        this.editUuid = null;
        this.editData = {};
        this.loadContractors();
        this.toast.show('success', 'Sukces', 'Kontrahent został zaktualizowany.');
      },
      error: (err) => {
        const msg = err?.error?.[0]?.message || 'Wystąpił błąd';
        this.toast.show('error', 'Błąd', msg);
        console.error('Błąd podczas edycji kontrahenta:', err);
      }
    });
  }

  deleteContractor(uuid: string) {
    if (!confirm('Czy na pewno chcesz usunąć tego kontrahenta?')) return;
    this.http.delete(apiUrl(`/contractors/${uuid}`), { withCredentials: true }).subscribe({
      next: () => {
        this.loadContractors();
        this.toast.show('success', 'Sukces', 'Kontrahent został usunięty.');
      },
      error: (err) => {
        const msg = err?.error?.[0]?.message || 'Wystąpił błąd';
        this.toast.show('error', 'Błąd', msg);
        console.error('Błąd podczas usuwania kontrahenta:', err);
      }
    });
  }
}
