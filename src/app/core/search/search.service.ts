import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SearchService {
  readonly isOpen = signal(false);
  readonly query = signal('');

  open(q = ''): void {
    this.query.set(q);
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }
}
