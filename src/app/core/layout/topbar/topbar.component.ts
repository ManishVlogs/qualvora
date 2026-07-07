import { Component, Output, EventEmitter, inject, signal, HostListener, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthStore } from '../../auth/stores/auth.store';
import { NotificationStore } from '../../notifications/stores/notification.store';
import { SearchService } from '../../search/search.service';
import { MobilePreviewService } from '../../ui/services/mobile-preview.service';
import { SiteStore } from '../../stores/site.store';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent {
  @Output() menuToggle = new EventEmitter<void>();

  readonly authStore = inject(AuthStore);
  readonly notificationStore = inject(NotificationStore);
  readonly searchService = inject(SearchService);
  readonly mobilePreview = inject(MobilePreviewService);
  readonly siteStore = inject(SiteStore);
  private router = inject(Router);

  @HostListener('document:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      this.searchService.open();
    }
  }

  openSearch(): void { this.searchService.open(); }

  readonly showCreateMenu = signal(false);
  readonly showUserMenu = signal(false);
  readonly showNotifPanel = signal(false);
  readonly showSiteMenu = signal(false);

  readonly isOperator = computed(() => {
    const roles = this.authStore.currentUser()?.roles ?? [];
    return roles.includes('Operator') || roles.includes('QT');
  });

  readonly userProfile = computed(() => {
    const user = this.authStore.currentUser();
    if (!user) return null;

    const roleCode = user.roles[0] ?? '';
    const lpaRole  = user.roles.find(r => r.startsWith('lpa:'))?.slice(4) ?? '';

    const roleMeta: Record<string, { label: string; color: string; bg: string }> = {
      Director: { label: 'Plant Director',        color: '#0E7490', bg: '#CFFAFE' },
      QM:       { label: 'Quality Manager',        color: '#1E40AF', bg: '#DBEAFE' },
      PM:       { label: 'Production Manager',     color: '#0F766E', bg: '#CCFBF1' },
      QE:       { label: 'Quality Engineer',       color: '#5B21B6', bg: '#EDE9FE' },
      QS:       { label: 'Quality Supervisor',     color: '#166534', bg: '#DCFCE7' },
      ME:       { label: 'Mfg. Engineer',          color: '#6B21A8', bg: '#F3E8FF' },
      QT:       { label: 'Quality Technician',     color: '#B45309', bg: '#FEF9C3' },
      Operator: { label: 'Production Operator',    color: '#1D4ED8', bg: '#EFF6FF' },
    };

    const lpaMeta: Record<string, { label: string; color: string; bg: string; layer: string }> = {
      manager:    { label: 'L3 · Manager',    color: '#166534', bg: '#DCFCE7', layer: 'L3' },
      supervisor: { label: 'L2 · Supervisor', color: '#1D4ED8', bg: '#DBEAFE', layer: 'L2' },
      operator:   { label: 'L1 · Operator',   color: '#5B21B6', bg: '#EDE9FE', layer: 'L1' },
    };

    const roleInfo = roleMeta[roleCode] ?? { label: roleCode, color: '#475569', bg: '#F1F5F9' };
    const lpaInfo  = lpaMeta[lpaRole]   ?? { label: lpaRole,  color: '#475569', bg: '#F1F5F9', layer: '—' };

    const initials = [user.firstName?.[0] ?? '', user.lastName?.[0] ?? ''].join('').toUpperCase();
    const avatarColor = user.avatarColor ?? '#2563EB';
    const jobTitle    = user.jobTitle ?? roleInfo.label;

    return { roleCode, roleInfo, lpaInfo, initials, avatarColor, jobTitle };
  });

  readonly sites = ['Plant-1', 'Plant-2', 'Plant-3'];

  readonly canSwitchSite = computed(() =>
    this.authStore.currentUser()?.roles.includes('Director') ?? false
  );

  selectSite(site: string): void {
    if (!this.canSwitchSite()) return;
    this.siteStore.switchSite(site);
    this.showSiteMenu.set(false);
  }

  closeAllMenus(): void {
    this.showCreateMenu.set(false);
    this.showUserMenu.set(false);
    this.showNotifPanel.set(false);
    this.showSiteMenu.set(false);
  }

  toggleMenu(menu: 'create' | 'user' | 'notif' | 'site'): void {
    const states = {
      create: this.showCreateMenu,
      user: this.showUserMenu,
      notif: this.showNotifPanel,
      site: this.showSiteMenu,
    };
    const current = states[menu]();
    this.closeAllMenus();
    if (!current) states[menu].set(true);
  }

  navigateTo(path: string): void {
    this.closeAllMenus();
    this.router.navigate([path]);
  }

  markAllRead(): void {
    this.notificationStore.markAllAsRead();
  }

  logout(): void {
    this.authStore.clearAuth();
    this.router.navigate(['/signin']);
  }
}
