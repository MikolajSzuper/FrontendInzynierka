import { Component } from '@angular/core';
import { NgClass} from '@angular/common';
import { ToastService } from '../services/toast-service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [NgClass],
  templateUrl: './toast.html',
  styleUrl: './toast.css'
})
export class Toast {
  constructor(public toast: ToastService) {}
}