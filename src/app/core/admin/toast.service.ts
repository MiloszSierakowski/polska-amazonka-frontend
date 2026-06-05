import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'warning';

export interface ToastMessage {
  id: number;
  type: ToastType;
  text: string;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly durationMs = 5000;
  private sequence = 0;
  private readonly messagesSubject = new BehaviorSubject<ToastMessage[]>([]);
  readonly messages$ = this.messagesSubject.asObservable();

  success(message: string): void {
    this.show('success', message);
  }

  error(message: string): void {
    this.show('error', message);
  }

  warning(message: string): void {
    this.show('warning', message);
  }

  dismiss(id: number): void {
    this.messagesSubject.next(this.messagesSubject.value.filter((item) => item.id !== id));
  }

  private show(type: ToastType, text: string): void {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }
    const id = ++this.sequence;
    const next = [...this.messagesSubject.value, { id, type, text: trimmed }];
    this.messagesSubject.next(next);
    window.setTimeout(() => this.dismiss(id), this.durationMs);
  }
}
