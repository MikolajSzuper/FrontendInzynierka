import { Injectable } from '@angular/core';

export type ToastType = 'success' | 'error';

@Injectable({ providedIn: 'root' })
export class ToastService {
  message = '';
  title = '';
  type: ToastType = 'success';
  visible = false;
  private timeoutId: any;

  show(type: ToastType, title: string, msg: string, duration = 3000) {
    this.type = type;
    this.title = title;
    this.message = msg;
    this.visible = true;

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      this.visible = false;
      this.message = '';
      this.title = '';
      this.type = 'success';
      this.timeoutId = null;
    }, duration);
  }

  close() {
    this.visible = false;
    this.message = '';
    this.title = '';
    this.type = 'success';
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}