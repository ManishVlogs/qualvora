import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-placeholder-page',
  standalone: true,
  template: `
    <div class="page-wrapper">
      <div class="placeholder-container">
        <div class="placeholder-icon">
          <i class="bi bi-grid-3x3-gap"></i>
        </div>
        <div class="screen-code">SCR-XXX</div>
        <h1 class="screen-name">{{ screenName }}</h1>
        <p class="coming-soon">Coming Soon</p>
        <p class="description">This module is part of the Qualvora roadmap and will be available in an upcoming release.</p>
        <button class="btn btn-outline-secondary btn-sm" (click)="goBack()">
          <i class="bi bi-arrow-left me-1"></i> Back
        </button>
      </div>
    </div>
  `,
  styles: [`
    .page-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: calc(100vh - 56px);
      padding: 2rem;
    }
    .placeholder-container {
      text-align: center;
      max-width: 420px;
    }
    .placeholder-icon {
      width: 80px;
      height: 80px;
      background: #F1F5F9;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
      font-size: 2rem;
      color: #94A3B8;
    }
    .screen-code {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #94A3B8;
      margin-bottom: 0.5rem;
    }
    h1.screen-name {
      font-size: 1.5rem;
      font-weight: 700;
      color: #0F172A;
      margin-bottom: 0.5rem;
    }
    .coming-soon {
      display: inline-block;
      background: #FEF9C3;
      color: #B45309;
      font-size: 12px;
      font-weight: 700;
      padding: 3px 12px;
      border-radius: 20px;
      margin-bottom: 1rem;
    }
    .description {
      color: #64748B;
      font-size: 0.875rem;
      margin-bottom: 1.5rem;
      line-height: 1.6;
    }
  `]
})
export class PlaceholderPageComponent {
  private router = inject(Router);

  get screenName(): string {
    const path = this.router.url.split('/').filter(Boolean);
    if (!path.length) return 'Page';
    const last = path[path.length - 1];
    return last
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
