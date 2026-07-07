import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthStore, AuthUser } from '../../../core/auth/stores/auth.store';
import { NotificationStore } from '../../../core/notifications/stores/notification.store';
import { MockDataService } from '../../../shared/services/mock-data.service';
import { SiteStore, SITE_ID_TO_NAME } from '../../../core/stores/site.store';

interface MockUser {
  password: string;
  initials: string;
  color: string;
  jobTitle: string;
  site: string;
  lpaLayers: string[];
  authUser: AuthUser;
}

const MOCK_USERS: MockUser[] = [
  // ── Plant-1 · Detroit ────────────────────────────────────────────────────
  { password: 'Qualvora@1', initials: 'SC', color: '#0891B2', jobTitle: 'Plant Director',        site: 'Plant-1 · Detroit',   lpaLayers: ['Director'],
    authUser: { id: 'USR-003', email: 'sarah.chen@qualvora.com',     firstName: 'Sarah',   lastName: 'Chen',     tenantId: 'TENANT-001', companyId: 'COMP-001', siteId: 'SITE-001', roles: ['Director', 'lpa:manager'],    workArea: 'Plant Management — Detroit'   } },
  { password: 'Qualvora@1', initials: 'MD', color: '#2563EB', jobTitle: 'Quality Manager',       site: 'Plant-1 · Detroit',   lpaLayers: ['Manager'],
    authUser: { id: 'USR-001', email: 'maria.delgado@qualvora.com',  firstName: 'Maria',   lastName: 'Delgado',  tenantId: 'TENANT-001', companyId: 'COMP-001', siteId: 'SITE-001', roles: ['QM',       'lpa:manager'],    workArea: 'Quality Control — Detroit'    } },
  { password: 'Qualvora@1', initials: 'KT', color: '#16A34A', jobTitle: 'Production Manager',    site: 'Plant-1 · Detroit',   lpaLayers: ['Manager'],
    authUser: { id: 'USR-011', email: 'kevin.torres@qualvora.com',   firstName: 'Kevin',   lastName: 'Torres',   tenantId: 'TENANT-001', companyId: 'COMP-001', siteId: 'SITE-001', roles: ['PM',       'lpa:manager'],    workArea: 'Production — Detroit'         } },
  { password: 'Qualvora@1', initials: 'DP', color: '#7C3AED', jobTitle: 'Quality Engineer',      site: 'Plant-1 · Detroit',   lpaLayers: ['Supervisor'],
    authUser: { id: 'USR-002', email: 'dev.patel@qualvora.com',      firstName: 'Dev',     lastName: 'Patel',    tenantId: 'TENANT-001', companyId: 'COMP-001', siteId: 'SITE-001', roles: ['QE',       'lpa:supervisor'], workArea: 'Line C — Inspection'          } },
  { password: 'Qualvora@1', initials: 'NB', color: '#D97706', jobTitle: 'Quality Supervisor',    site: 'Plant-1 · Detroit',   lpaLayers: ['Supervisor'],
    authUser: { id: 'USR-012', email: 'nina.brown@qualvora.com',     firstName: 'Nina',    lastName: 'Brown',    tenantId: 'TENANT-001', companyId: 'COMP-001', siteId: 'SITE-001', roles: ['QS',       'lpa:supervisor'], workArea: 'Line A — Assembly'            } },
  { password: 'Qualvora@1', initials: 'OH', color: '#6366F1', jobTitle: 'Manufacturing Engineer', site: 'Plant-1 · Detroit',  lpaLayers: ['Supervisor'],
    authUser: { id: 'USR-013', email: 'omar.hassan@qualvora.com',    firstName: 'Omar',    lastName: 'Hassan',   tenantId: 'TENANT-001', companyId: 'COMP-001', siteId: 'SITE-001', roles: ['ME',       'lpa:supervisor'], workArea: 'Line D — Machining'           } },
  { password: 'Qualvora@1', initials: 'RK', color: '#EA580C', jobTitle: 'Quality Technician',    site: 'Plant-1 · Detroit',   lpaLayers: ['Operator'],
    authUser: { id: 'USR-009', email: 'ravi.kumar@qualvora.com',     firstName: 'Ravi',    lastName: 'Kumar',    tenantId: 'TENANT-001', companyId: 'COMP-001', siteId: 'SITE-001', roles: ['QT',       'lpa:operator'],   workArea: 'Line B — Welding'             } },
  { password: 'Qualvora@1', initials: 'EP', color: '#0E7490', jobTitle: 'Production Operator',   site: 'Plant-1 · Detroit',   lpaLayers: ['Operator'],
    authUser: { id: 'USR-014', email: 'elena.petrov@qualvora.com',   firstName: 'Elena',   lastName: 'Petrov',   tenantId: 'TENANT-001', companyId: 'COMP-001', siteId: 'SITE-001', roles: ['Operator', 'lpa:operator'],   workArea: 'Line C — Assembly'            } },

  // ── Plant-2 · Chicago ────────────────────────────────────────────────────
  { password: 'Qualvora@1', initials: 'MZ', color: '#1D4ED8', jobTitle: 'Plant Director',        site: 'Plant-2 · Chicago',   lpaLayers: ['Director'],
    authUser: { id: 'USR-015', email: 'michael.zhang@qualvora.com',  firstName: 'Michael', lastName: 'Zhang',    tenantId: 'TENANT-001', companyId: 'COMP-001', siteId: 'SITE-002', roles: ['Director', 'lpa:manager'],    workArea: 'Plant Management — Chicago'   } },
  { password: 'Qualvora@1', initials: 'SK', color: '#7E22CE', jobTitle: 'Quality Manager',       site: 'Plant-2 · Chicago',   lpaLayers: ['Manager'],
    authUser: { id: 'USR-016', email: 'sandra.kim@qualvora.com',     firstName: 'Sandra',  lastName: 'Kim',      tenantId: 'TENANT-001', companyId: 'COMP-001', siteId: 'SITE-002', roles: ['QM',       'lpa:manager'],    workArea: 'Quality Control — Chicago'    } },
  { password: 'Qualvora@1', initials: 'CM', color: '#0F766E', jobTitle: 'Production Manager',    site: 'Plant-2 · Chicago',   lpaLayers: ['Manager'],
    authUser: { id: 'USR-007', email: 'carlos.mendez@qualvora.com',  firstName: 'Carlos',  lastName: 'Mendez',   tenantId: 'TENANT-001', companyId: 'COMP-001', siteId: 'SITE-002', roles: ['PM',       'lpa:manager'],    workArea: 'Production — Chicago'         } },
  { password: 'Qualvora@1', initials: 'PN', color: '#DC2626', jobTitle: 'Quality Engineer',      site: 'Plant-2 · Chicago',   lpaLayers: ['Supervisor'],
    authUser: { id: 'USR-005', email: 'priya.nair@qualvora.com',     firstName: 'Priya',   lastName: 'Nair',     tenantId: 'TENANT-001', companyId: 'COMP-001', siteId: 'SITE-002', roles: ['QE',       'lpa:supervisor'], workArea: 'Line B — Finishing'           } },
  { password: 'Qualvora@1', initials: 'JO', color: '#059669', jobTitle: 'Quality Supervisor',    site: 'Plant-2 · Chicago',   lpaLayers: ['Supervisor'],
    authUser: { id: 'USR-004', email: 'james.okonkwo@qualvora.com',  firstName: 'James',   lastName: 'Okonkwo',  tenantId: 'TENANT-001', companyId: 'COMP-001', siteId: 'SITE-002', roles: ['QS',       'lpa:supervisor'], workArea: 'Line A — Assembly'            } },
  { password: 'Qualvora@1', initials: 'RS', color: '#BE123C', jobTitle: 'Manufacturing Engineer', site: 'Plant-2 · Chicago',  lpaLayers: ['Supervisor'],
    authUser: { id: 'USR-017', email: 'raj.sharma@qualvora.com',     firstName: 'Raj',     lastName: 'Sharma',   tenantId: 'TENANT-001', companyId: 'COMP-001', siteId: 'SITE-002', roles: ['ME',       'lpa:supervisor'], workArea: 'Line C — Fabrication'         } },
  { password: 'Qualvora@1', initials: 'FA', color: '#C2410C', jobTitle: 'Quality Technician',    site: 'Plant-2 · Chicago',   lpaLayers: ['Operator'],
    authUser: { id: 'USR-018', email: 'fatima.ali@qualvora.com',     firstName: 'Fatima',  lastName: 'Ali',      tenantId: 'TENANT-001', companyId: 'COMP-001', siteId: 'SITE-002', roles: ['QT',       'lpa:operator'],   workArea: 'Line D — Inspection'          } },
  { password: 'Qualvora@1', initials: 'LP', color: '#0369A1', jobTitle: 'Production Operator',   site: 'Plant-2 · Chicago',   lpaLayers: ['Operator'],
    authUser: { id: 'USR-010', email: 'lisa.park@qualvora.com',      firstName: 'Lisa',    lastName: 'Park',     tenantId: 'TENANT-001', companyId: 'COMP-001', siteId: 'SITE-002', roles: ['Operator', 'lpa:operator'],   workArea: 'Line A — Assembly'            } },

  // ── Plant-3 · Cleveland ──────────────────────────────────────────────────
  { password: 'Qualvora@1', initials: 'DO', color: '#065F46', jobTitle: 'Plant Director',        site: 'Plant-3 · Cleveland', lpaLayers: ['Director'],
    authUser: { id: 'USR-019', email: 'david.osei@qualvora.com',     firstName: 'David',   lastName: 'Osei',     tenantId: 'TENANT-001', companyId: 'COMP-001', siteId: 'SITE-003', roles: ['Director', 'lpa:manager'],    workArea: 'Plant Management — Cleveland' } },
  { password: 'Qualvora@1', initials: 'TB', color: '#B45309', jobTitle: 'Quality Manager',       site: 'Plant-3 · Cleveland', lpaLayers: ['Manager'],
    authUser: { id: 'USR-006', email: 'tom.braswell@qualvora.com',   firstName: 'Tom',     lastName: 'Braswell', tenantId: 'TENANT-001', companyId: 'COMP-001', siteId: 'SITE-003', roles: ['QM',       'lpa:manager'],    workArea: 'Quality Control — Cleveland'  } },
  { password: 'Qualvora@1', initials: 'CN', color: '#9D174D', jobTitle: 'Production Manager',    site: 'Plant-3 · Cleveland', lpaLayers: ['Manager'],
    authUser: { id: 'USR-020', email: 'claire.novak@qualvora.com',   firstName: 'Claire',  lastName: 'Novak',    tenantId: 'TENANT-001', companyId: 'COMP-001', siteId: 'SITE-003', roles: ['PM',       'lpa:manager'],    workArea: 'Production — Cleveland'       } },
  { password: 'Qualvora@1', initials: 'WT', color: '#4338CA', jobTitle: 'Quality Engineer',      site: 'Plant-3 · Cleveland', lpaLayers: ['Supervisor'],
    authUser: { id: 'USR-021', email: 'wei.tanaka@qualvora.com',     firstName: 'Wei',     lastName: 'Tanaka',   tenantId: 'TENANT-001', companyId: 'COMP-001', siteId: 'SITE-003', roles: ['QE',       'lpa:supervisor'], workArea: 'Line A — Inspection'          } },
  { password: 'Qualvora@1', initials: 'HB', color: '#155E75', jobTitle: 'Quality Supervisor',    site: 'Plant-3 · Cleveland', lpaLayers: ['Supervisor'],
    authUser: { id: 'USR-022', email: 'hana.brooks@qualvora.com',    firstName: 'Hana',    lastName: 'Brooks',   tenantId: 'TENANT-001', companyId: 'COMP-001', siteId: 'SITE-003', roles: ['QS',       'lpa:supervisor'], workArea: 'Line B — Assembly'            } },
  { password: 'Qualvora@1', initials: 'AW', color: '#9333EA', jobTitle: 'Manufacturing Engineer', site: 'Plant-3 · Cleveland', lpaLayers: ['Supervisor'],
    authUser: { id: 'USR-008', email: 'aisha.williams@qualvora.com', firstName: 'Aisha',   lastName: 'Williams', tenantId: 'TENANT-001', companyId: 'COMP-001', siteId: 'SITE-003', roles: ['ME',       'lpa:supervisor'], workArea: 'Line D — Fabrication'         } },
  { password: 'Qualvora@1', initials: 'DR', color: '#7F1D1D', jobTitle: 'Quality Technician',    site: 'Plant-3 · Cleveland', lpaLayers: ['Operator'],
    authUser: { id: 'USR-023', email: 'dante.reyes@qualvora.com',    firstName: 'Dante',   lastName: 'Reyes',    tenantId: 'TENANT-001', companyId: 'COMP-001', siteId: 'SITE-003', roles: ['QT',       'lpa:operator'],   workArea: 'Line C — Welding'             } },
  { password: 'Qualvora@1', initials: 'YS', color: '#3730A3', jobTitle: 'Production Operator',   site: 'Plant-3 · Cleveland', lpaLayers: ['Operator'],
    authUser: { id: 'USR-024', email: 'yuki.stone@qualvora.com',     firstName: 'Yuki',    lastName: 'Stone',    tenantId: 'TENANT-001', companyId: 'COMP-001', siteId: 'SITE-003', roles: ['Operator', 'lpa:operator'],   workArea: 'Line D — Finishing'           } },
];

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="signin-bg">
      <div class="signin-card">
        <!-- Logo -->
        <div class="brand-mark">
          <div class="q-icon">Q</div>
          <span class="brand-text">Qualvora</span>
        </div>
        <h1 class="signin-title">Sign in to Qualvora</h1>
        <p class="signin-subtitle">Enterprise Automotive Quality Management</p>

        <form (ngSubmit)="onSubmit()" #signinForm="ngForm" class="signin-form" novalidate>
          <!-- Email -->
          <div class="form-group">
            <label class="form-label" for="email">Email address</label>
            <input
              id="email"
              type="email"
              class="form-control q-input"
              placeholder="you@company.com"
              [(ngModel)]="email"
              name="email"
              required
              autocomplete="email"
            />
          </div>

          <!-- Password -->
          <div class="form-group">
            <label class="form-label" for="password">Password</label>
            <div class="input-wrap">
              <input
                id="password"
                [type]="showPassword() ? 'text' : 'password'"
                class="form-control q-input"
                placeholder="Enter your password"
                [(ngModel)]="password"
                name="password"
                required
                autocomplete="current-password"
              />
              <button type="button" class="toggle-pw" (click)="showPassword.set(!showPassword())">
                <i class="bi" [class.bi-eye]="!showPassword()" [class.bi-eye-slash]="showPassword()"></i>
              </button>
            </div>
          </div>

          @if (errorMsg()) {
            <div class="error-msg">
              <i class="bi bi-exclamation-circle me-1"></i>{{ errorMsg() }}
            </div>
          }

          <!-- Sign In button -->
          <button type="submit" class="btn btn-primary sign-in-btn" [disabled]="loading()">
            @if (loading()) {
              <span class="spinner-border spinner-border-sm me-2"></span>
            }
            Sign In
          </button>

          <!-- Forgot password -->
          <div class="text-center mt-2">
            <a href="#" class="forgot-link" (click)="$event.preventDefault()">Forgot password?</a>
          </div>

          <!-- Divider -->
          <div class="divider"><span>or quick login</span></div>

          <!-- Quick login panel (wireframe) -->
          <div class="ql-section">
            @for (u of mockUsers; track u.authUser.id) {
              <button type="button" class="ql-row" (click)="quickLogin(u)">
                <div class="ql-avatar" [style.background]="u.color">{{ u.initials }}</div>
                <div class="ql-meta">
                  <span class="ql-name">{{ u.authUser.firstName }} {{ u.authUser.lastName }}</span>
                  <span class="ql-job">{{ u.jobTitle }} &nbsp;·&nbsp; {{ u.site }}</span>
                </div>
                <div class="ql-layers">
                  @for (layer of u.lpaLayers; track layer) {
                    <span class="ql-layer ql-{{ layer.toLowerCase() }}">{{ layer }}</span>
                  }
                </div>
              </button>
            }
          </div>
        </form>
      </div>

      <p class="signup-prompt">
        New to Qualvora?
        <a href="#" (click)="$event.preventDefault(); router.navigate(['/signup'])">Start a free trial</a>
      </p>

      <p class="signin-footer">
        &copy; 2026 Qualvora Inc. &nbsp;·&nbsp;
        <a href="#">Privacy</a> &nbsp;·&nbsp;
        <a href="#">Terms</a>
      </p>
    </div>
  `,
  styles: [`
    .signin-bg {
      min-height: 100vh;
      background: linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
    }

    .signin-card {
      width: 100%;
      max-width: 480px;
      background: #fff;
      border-radius: 1rem;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      padding: 2.5rem;
    }

    .brand-mark {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      justify-content: center;
      margin-bottom: 1.5rem;
    }

    .q-icon {
      width: 40px;
      height: 40px;
      background: #2563EB;
      color: #fff;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      font-weight: 800;
    }

    .brand-text {
      font-size: 1.5rem;
      font-weight: 700;
      color: #0F172A;
    }

    .signin-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #0F172A;
      text-align: center;
      margin: 0 0 0.25rem;
    }

    .signin-subtitle {
      font-size: 0.8125rem;
      color: #94A3B8;
      text-align: center;
      margin-bottom: 1.75rem;
    }

    .signin-form {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #334155;
      margin-bottom: 0.375rem;
      display: block;
    }

    .q-input {
      border-radius: 6px;
      border: 1.5px solid #E2E8F0;
      padding: 0.625rem 0.875rem;
      font-size: 0.875rem;
      transition: border-color 150ms ease, box-shadow 150ms ease;

      &:focus {
        border-color: #2563EB;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        outline: none;
      }
    }

    .input-wrap {
      position: relative;
    }

    .input-wrap .q-input {
      padding-right: 2.75rem;
      width: 100%;
    }

    .toggle-pw {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: #94A3B8;
      cursor: pointer;
      padding: 0;
      font-size: 1rem;

      &:hover { color: #475569; }
    }

    .error-msg {
      background: #FEE2E2;
      color: #DC2626;
      border-radius: 6px;
      padding: 0.5rem 0.75rem;
      font-size: 0.8125rem;
      margin-bottom: 0.75rem;
    }

    .sign-in-btn {
      width: 100%;
      height: 48px;
      font-size: 0.9375rem;
      font-weight: 600;
      border-radius: 8px;
      margin-top: 0.25rem;
      background: #2563EB;
      border: none;

      &:hover:not(:disabled) { background: #1E40AF; }
      &:disabled { opacity: 0.7; cursor: not-allowed; }
    }

    .forgot-link {
      font-size: 0.8125rem;
      color: #2563EB;
      text-decoration: none;
      &:hover { text-decoration: underline; }
    }

    .divider {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin: 1.25rem 0;
      color: #94A3B8;
      font-size: 0.8125rem;

      &::before,
      &::after {
        content: '';
        flex: 1;
        border-top: 1px solid #E2E8F0;
      }
    }

    .ql-section {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .ql-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0.625rem;
      border: 1.5px solid #E2E8F0;
      border-radius: 10px;
      background: #FAFAFA;
      cursor: pointer;
      text-align: left;
      transition: all 0.15s ease;
      width: 100%;

      &:hover {
        background: #F1F5F9;
        border-color: #CBD5E1;
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        transform: translateY(-1px);
      }
      &:active { transform: translateY(0); }
    }

    .ql-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.6875rem;
      font-weight: 700;
      color: #fff;
      flex-shrink: 0;
    }

    .ql-meta {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .ql-name {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #0F172A;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .ql-job {
      font-size: 0.6875rem;
      color: #94A3B8;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .ql-layers {
      display: flex;
      gap: 0.25rem;
      flex-shrink: 0;
    }

    .ql-layer {
      font-size: 0.5625rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      padding: 0.125rem 0.375rem;
      border-radius: 4px;
    }
    .ql-director   { background: #CFFAFE; color: #0E7490; }
    .ql-manager    { background: #DCFCE7; color: #15803D; }
    .ql-supervisor { background: #DBEAFE; color: #1D4ED8; }
    .ql-operator   { background: #EDE9FE; color: #5B21B6; }

    .signup-prompt {
      margin-top: 1.25rem;
      font-size: 0.875rem;
      color: rgba(255,255,255,0.6);
      text-align: center;

      a {
        color: #93C5FD;
        text-decoration: none;
        font-weight: 600;
        &:hover { color: #fff; text-decoration: underline; }
      }
    }

    .signin-footer {
      margin-top: 2rem;
      font-size: 0.75rem;
      color: rgba(255,255,255,0.4);
      text-align: center;

      a {
        color: rgba(255,255,255,0.55);
        text-decoration: none;
        &:hover { color: rgba(255,255,255,0.8); }
      }
    }
  `]
})
export class SigninComponent {
  readonly router = inject(Router);
  private authStore = inject(AuthStore);
  private siteStore = inject(SiteStore);
  private notificationStore = inject(NotificationStore);
  private mockData = inject(MockDataService);

  email = '';
  password = '';
  readonly showPassword = signal(false);
  readonly loading = signal(false);
  readonly errorMsg = signal('');
  readonly mockUsers = MOCK_USERS;

  quickLogin(u: MockUser): void {
    this.loading.set(true);
    setTimeout(() => {
      this.authStore.setAuth(
        { ...u.authUser, avatarColor: u.color, jobTitle: u.jobTitle },
        'mock-access-token', 'mock-refresh-token', ['*']
      );
      this.siteStore.switchSite(SITE_ID_TO_NAME[u.authUser.siteId] ?? 'Plant-1');
      this.notificationStore.setNotifications(this.mockData.notifications);
      this.loading.set(false);
      this.router.navigate(['/dashboard']);
    }, 400);
  }

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.errorMsg.set('Please enter your email and password.');
      return;
    }
    const found = MOCK_USERS.find(
      u => u.authUser.email === this.email.trim().toLowerCase() && u.password === this.password
    );
    if (!found) {
      this.errorMsg.set('Invalid email or password. Use Qualvora@1 as password.');
      return;
    }
    this.errorMsg.set('');
    this.quickLogin(found);
  }
}
