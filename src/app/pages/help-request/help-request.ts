import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { apiUrl } from '../../services/api';

interface Report {
  id: number;
  user_id: number;
  userName: string;
  type: string;
  created_at: string;
  content: string;
}

@Component({
  selector: 'app-help-request',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './help-request.html',
  styleUrl: './help-request.css'
})
export class HelpRequest implements OnInit {
  reports: Report[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<Report[]>(apiUrl('/auth/reports'), { withCredentials: true }).subscribe({
      next: (data) => {
        // Sortuj od najnowszych do najstarszych
        this.reports = data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      },
      error: (err) => {
        console.error('Błąd pobierania zgłoszeń:', err);
      }
    });
  }
}
