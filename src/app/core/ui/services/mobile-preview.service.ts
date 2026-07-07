import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MobilePreviewService {
  readonly isActive = signal(false);
  toggle(): void { this.isActive.update(v => !v); }
  enable(): void { this.isActive.set(true); }
  disable(): void { this.isActive.set(false); }
}
