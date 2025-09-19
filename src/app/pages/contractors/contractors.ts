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
    this.http.post(apiUrl('/contractors/'), this.newContractor, { withCredentials: true }).subscribe({
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
    const payload = {
      name: this.editData.name,
      phone: this.editData.phone,
      email: this.editData.email
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
