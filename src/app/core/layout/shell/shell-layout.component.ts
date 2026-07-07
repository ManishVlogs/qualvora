import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SignalRService } from '../../signalr/services/signalr.service';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { ToastContainerComponent } from '../../ui/components/toast-container/toast-container.component';
import { SearchOverlayComponent } from '../../../features/search/search-overlay/search-overlay.component';
import { MobilePreviewService } from '../../ui/services/mobile-preview.service';

@Component({
  selector: 'app-shell-layout',
  standalone: true,
  imports: [RouterOutlet, CommonModule, SidenavComponent, TopbarComponent, ToastContainerComponent, SearchOverlayComponent],
  template: `
    <div class="shell-wrapper" [class.sidenav-collapsed]="sidenavCollapsed()">
      <app-sidenav
        [collapsed]="sidenavCollapsed()"
        (toggleCollapse)="toggleSidenav()">
      </app-sidenav>
      <div class="main-content">
        <app-topbar (menuToggle)="toggleSidenav()"></app-topbar>
        <main class="content-area" [class.mobile-preview-active]="mobilePreview.isActive()">
          @if (mobilePreview.isActive()) {
            <div class="phone-frame-wrap">
              <div class="phone-frame">
                <div class="phone-notch"></div>
                <div class="phone-screen">
                  <router-outlet></router-outlet>
                </div>
              </div>
              <div class="phone-label">
                <i class="bi bi-phone me-1"></i>390 × 844 · Mobile Preview
              </div>
            </div>
          } @else {
            <router-outlet></router-outlet>
          }
        </main>
      </div>
    </div>
    <app-toast-container></app-toast-container>
    <app-search-overlay></app-search-overlay>
  `,
  styleUrl: './shell-layout.component.scss',
})
export class ShellLayoutComponent implements OnInit {
  private signalRService = inject(SignalRService);
  readonly mobilePreview = inject(MobilePreviewService);

  readonly sidenavCollapsed = signal(false);

  ngOnInit(): void {
    this.signalRService.startConnection();
  }

  toggleSidenav(): void {
    this.sidenavCollapsed.update(v => !v);
  }
}
