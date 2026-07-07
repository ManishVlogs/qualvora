import { Component, signal, computed, inject, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

type PlanKey = 'starter' | 'professional' | 'enterprise';
type Region = 'US' | 'EU' | 'APAC';
type WizardStep = 1 | 2 | 'provisioning';

const PROVISIONING_MESSAGES = [
  'Creating your tenant...',
  'Loading IATF clause library...',
  'Seeding AIAG quality templates...',
  'Done! Welcome to Qualvora.',
];

const INDUSTRIES = [
  'Automotive', 'Aerospace', 'Medical Devices', 'Electronics',
  'Defense', 'Industrial Equipment', 'Consumer Goods', 'Other',
];

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (step() === 'provisioning') {
      <div class="prov-screen">
        <div class="prov-center">
          <div class="prov-logo" [class.pulse]="provProgress() < 100">
            <span class="q-mark">Q</span>
          </div>
          <h2 class="prov-heading">Setting up your workspace</h2>
          <div class="prov-bar-wrap">
            <div class="prov-bar" [style.width.%]="provProgress()"></div>
          </div>
          <p class="prov-msg">{{ provMessage() }}</p>
        </div>
      </div>
    } @else {
      <div class="signup-page">
        <div class="signup-header">
          <div class="logo-mark"><span>Q</span></div>
          <span class="brand-name">Qualvora</span>
        </div>

        <div class="signup-card">
          <!-- Step indicator -->
          <div class="step-tabs">
            <div class="step-tab" [class.active]="step() === 1" [class.done]="step() === 2">
              <span class="step-num">1</span>
              <span class="step-label">Company Details</span>
            </div>
            <div class="step-connector"></div>
            <div class="step-tab" [class.active]="step() === 2">
              <span class="step-num">2</span>
              <span class="step-label">Admin Account</span>
            </div>
          </div>

          @if (step() === 1) {
            <div class="form-section">
              <h1 class="card-title">Tell us about your company</h1>
              <p class="card-sub">Start your 14-day free trial. No credit card required.</p>

              <div class="mb-3">
                <label class="form-label">Company Name <span class="req">*</span></label>
                <input class="form-control" type="text" [(ngModel)]="companyName"
                  placeholder="Acme Manufacturing Co." />
              </div>

              <div class="mb-3">
                <label class="form-label">Industry</label>
                <select class="form-select" [(ngModel)]="industry">
                  @for (ind of industries; track ind) {
                    <option [value]="ind">{{ ind }}</option>
                  }
                </select>
              </div>

              <div class="mb-3">
                <label class="form-label">Subdomain <span class="req">*</span></label>
                <div class="subdomain-wrap">
                  <input class="form-control subdomain-input" type="text" [(ngModel)]="subdomain"
                    (ngModelChange)="onSubdomainChange($event)"
                    placeholder="yourcompany" />
                  <span class="subdomain-suffix">.qualvora.com</span>
                </div>
                @if (subdomain) {
                  <div class="subdomain-preview">
                    <i class="bi bi-link-45deg"></i>
                    {{ subdomainSlug }}.qualvora.com
                  </div>
                }
              </div>

              <div class="mb-3">
                <label class="form-label">Region <span class="req">*</span></label>
                <div class="region-radios">
                  @for (r of regions; track r.key) {
                    <label class="region-card" [class.selected]="region() === r.key"
                      (click)="region.set(r.key)">
                      <input type="radio" [value]="r.key" [checked]="region() === r.key"
                        class="visually-hidden" />
                      <span class="region-flag">{{ r.flag }}</span>
                      <span class="region-name">{{ r.label }}</span>
                      <span class="region-note">{{ r.note }}</span>
                    </label>
                  }
                </div>
              </div>

              <div class="mb-4">
                <label class="form-label">Select a Plan <span class="req">*</span></label>
                <div class="plan-cards">
                  <div class="plan-card" [class.selected]="selectedPlan() === 'starter'"
                    (click)="selectedPlan.set('starter')">
                    <div class="plan-name">Starter</div>
                    <div class="plan-price">$299<span>/mo</span></div>
                    <ul class="plan-features">
                      <li><i class="bi bi-check-lg"></i> Up to 25 users</li>
                      <li><i class="bi bi-check-lg"></i> NCR & CAPA</li>
                      <li><i class="bi bi-check-lg"></i> Document Control</li>
                      <li><i class="bi bi-check-lg"></i> Basic Audits</li>
                    </ul>
                    @if (selectedPlan() === 'starter') {
                      <div class="plan-badge"><i class="bi bi-check-circle-fill"></i> Selected</div>
                    }
                  </div>
                  <div class="plan-card featured" [class.selected]="selectedPlan() === 'professional'"
                    (click)="selectedPlan.set('professional')">
                    <div class="plan-badge-top">Most Popular</div>
                    <div class="plan-name">Professional</div>
                    <div class="plan-price">$799<span>/mo</span></div>
                    <ul class="plan-features">
                      <li><i class="bi bi-check-lg"></i> Unlimited users</li>
                      <li><i class="bi bi-check-lg"></i> Full QMS suite</li>
                      <li><i class="bi bi-check-lg"></i> LPA & SPC</li>
                      <li><i class="bi bi-check-lg"></i> Advanced Reports</li>
                    </ul>
                    @if (selectedPlan() === 'professional') {
                      <div class="plan-badge"><i class="bi bi-check-circle-fill"></i> Selected</div>
                    }
                  </div>
                  <div class="plan-card" [class.selected]="selectedPlan() === 'enterprise'"
                    (click)="selectedPlan.set('enterprise')">
                    <div class="plan-name">Enterprise</div>
                    <div class="plan-price enterprise-price">Contact us</div>
                    <ul class="plan-features">
                      <li><i class="bi bi-check-lg"></i> Multi-site</li>
                      <li><i class="bi bi-check-lg"></i> SSO / SAML</li>
                      <li><i class="bi bi-check-lg"></i> SLA guarantee</li>
                      <li><i class="bi bi-check-lg"></i> Dedicated CSM</li>
                    </ul>
                    @if (selectedPlan() === 'enterprise') {
                      <div class="plan-badge"><i class="bi bi-check-circle-fill"></i> Selected</div>
                    }
                  </div>
                </div>
              </div>

              <button class="btn btn-primary w-100 btn-lg" (click)="goToStep2()"
                [disabled]="!step1Valid">
                Continue <i class="bi bi-arrow-right"></i>
              </button>
            </div>
          }

          @if (step() === 2) {
            <div class="form-section">
              <h1 class="card-title">Create your admin account</h1>
              <p class="card-sub">You'll be the primary administrator for {{ companyName || 'your organization' }}.</p>

              <div class="mb-3">
                <label class="form-label">Full Name <span class="req">*</span></label>
                <input class="form-control" type="text" [(ngModel)]="fullName"
                  placeholder="Maria Chen" />
              </div>

              <div class="mb-3">
                <label class="form-label">Work Email <span class="req">*</span></label>
                <input class="form-control" type="email" [(ngModel)]="workEmail"
                  placeholder="maria@acme.com" />
              </div>

              <div class="mb-3">
                <label class="form-label">Password <span class="req">*</span></label>
                <div class="password-wrap">
                  <input class="form-control" [type]="showPw() ? 'text' : 'password'"
                    [(ngModel)]="password" placeholder="Min 8 characters" />
                  <button class="pw-toggle" type="button" (click)="toggleShowPw()">
                    <i [class]="showPw() ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                  </button>
                </div>
                @if (password) {
                  <div class="pw-strength">
                    <div class="pw-bar" [class]="pwStrengthClass"></div>
                    <span class="pw-label">{{ pwStrengthLabel }}</span>
                  </div>
                }
              </div>

              <div class="mb-4">
                <label class="form-label">Confirm Password <span class="req">*</span></label>
                <input class="form-control" [type]="showPw() ? 'text' : 'password'"
                  [(ngModel)]="confirmPassword" placeholder="Re-enter password"
                  [class.is-invalid]="confirmPassword && confirmPassword !== password" />
                @if (confirmPassword && confirmPassword !== password) {
                  <div class="invalid-feedback d-block">Passwords do not match.</div>
                }
              </div>

              <div class="mb-4 terms-row">
                <input type="checkbox" class="form-check-input" id="terms"
                  [(ngModel)]="agreedToTerms" />
                <label class="form-check-label" for="terms">
                  I agree to the <a href="#" (click)="$event.preventDefault()">Terms of Service</a>
                  and <a href="#" (click)="$event.preventDefault()">Privacy Policy</a>
                </label>
              </div>

              <button class="btn btn-primary w-100 btn-lg fw-semibold" (click)="submitSignup()"
                [disabled]="!step2Valid">
                <i class="bi bi-rocket-takeoff me-2"></i>Start Free Trial
              </button>
              <p class="trial-label">14-day free trial · No credit card required</p>

              <button class="btn btn-link w-100 mt-2" (click)="step.set(1)">
                <i class="bi bi-arrow-left me-1"></i>Back to Company Details
              </button>
            </div>
          }
        </div>

        <p class="signin-link">Already have an account?
          <a routerLink="/signin">Sign in</a>
        </p>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }

    /* ── PROVISIONING ─────────────────────────────────────── */
    .prov-screen {
      min-height: 100vh;
      background: linear-gradient(135deg, #1E40AF 0%, #1D4ED8 50%, #2563EB 100%);
      display: flex; align-items: center; justify-content: center;
    }
    .prov-center { text-align: center; color: #fff; }
    .prov-logo {
      width: 80px; height: 80px; border-radius: 20px;
      background: rgba(255,255,255,0.15); backdrop-filter: blur(10px);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 24px; font-size: 36px; font-weight: 800;
      border: 2px solid rgba(255,255,255,0.3);
      transition: transform 0.3s;
    }
    .prov-logo.pulse { animation: logoPulse 1.2s ease-in-out infinite; }
    @keyframes logoPulse {
      0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,255,255,0.3); }
      50% { transform: scale(1.05); box-shadow: 0 0 0 12px rgba(255,255,255,0); }
    }
    .q-mark { color: #fff; }
    .prov-heading { font-size: 24px; font-weight: 700; margin-bottom: 32px; }
    .prov-bar-wrap {
      width: 320px; height: 6px; background: rgba(255,255,255,0.2);
      border-radius: 3px; margin: 0 auto 20px; overflow: hidden;
    }
    .prov-bar {
      height: 100%; background: #fff; border-radius: 3px;
      transition: width 0.6s ease;
    }
    .prov-msg { font-size: 15px; opacity: 0.85; min-height: 24px; }

    /* ── PAGE SHELL ───────────────────────────────────────── */
    .signup-page {
      min-height: 100vh;
      background: #F8FAFC;
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; padding: 40px 16px;
    }
    .signup-header {
      display: flex; align-items: center; gap: 10px; margin-bottom: 28px;
    }
    .logo-mark {
      width: 36px; height: 36px; background: #2563EB; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; font-weight: 800; color: #fff;
    }
    .brand-name { font-size: 22px; font-weight: 700; color: #0F172A; }

    /* ── CARD ─────────────────────────────────────────────── */
    .signup-card {
      width: 100%; max-width: 520px;
      background: #fff; border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      padding: 32px;
    }
    .step-tabs {
      display: flex; align-items: center; gap: 8px; margin-bottom: 28px;
    }
    .step-tab {
      display: flex; align-items: center; gap: 8px;
      flex: 1;
    }
    .step-num {
      width: 28px; height: 28px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 600;
      background: #E2E8F0; color: #64748B;
      flex-shrink: 0;
    }
    .step-tab.active .step-num { background: #2563EB; color: #fff; }
    .step-tab.done .step-num { background: #10B981; color: #fff; }
    .step-label { font-size: 13px; font-weight: 500; color: #94A3B8; }
    .step-tab.active .step-label { color: #1E293B; font-weight: 600; }
    .step-tab.done .step-label { color: #10B981; }
    .step-connector { flex: 1; height: 1px; background: #E2E8F0; }

    .card-title { font-size: 22px; font-weight: 700; color: #0F172A; margin-bottom: 6px; }
    .card-sub { font-size: 14px; color: #64748B; margin-bottom: 24px; }
    .req { color: #EF4444; }

    /* ── SUBDOMAIN ────────────────────────────────────────── */
    .subdomain-wrap { display: flex; align-items: stretch; }
    .subdomain-input { border-radius: 8px 0 0 8px; border-right: none; }
    .subdomain-suffix {
      padding: 8px 12px; background: #F1F5F9; border: 1px solid #CBD5E1;
      border-radius: 0 8px 8px 0; font-size: 14px; color: #64748B;
      white-space: nowrap; display: flex; align-items: center;
    }
    .subdomain-preview {
      margin-top: 6px; font-size: 13px; color: #2563EB; font-weight: 500;
    }

    /* ── REGION ───────────────────────────────────────────── */
    .region-radios { display: flex; gap: 12px; }
    .region-card {
      flex: 1; border: 2px solid #E2E8F0; border-radius: 10px;
      padding: 12px 8px; text-align: center; cursor: pointer;
      transition: all 0.15s;
      display: flex; flex-direction: column; align-items: center; gap: 4px;
    }
    .region-card.selected { border-color: #2563EB; background: #EFF6FF; }
    .region-flag { font-size: 22px; }
    .region-name { font-size: 13px; font-weight: 600; color: #1E293B; }
    .region-note { font-size: 11px; color: #94A3B8; }

    /* ── PLAN CARDS ───────────────────────────────────────── */
    .plan-cards { display: flex; gap: 12px; }
    .plan-card {
      flex: 1; border: 2px solid #E2E8F0; border-radius: 12px;
      padding: 16px 12px; cursor: pointer; transition: all 0.15s;
      position: relative;
    }
    .plan-card:hover { border-color: #93C5FD; }
    .plan-card.selected { border-color: #2563EB; background: #EFF6FF; }
    .plan-card.featured { border-color: #2563EB; }
    .plan-badge-top {
      position: absolute; top: -11px; left: 50%; transform: translateX(-50%);
      background: #2563EB; color: #fff; font-size: 11px; font-weight: 600;
      padding: 2px 10px; border-radius: 20px; white-space: nowrap;
    }
    .plan-name { font-size: 14px; font-weight: 700; color: #1E293B; margin-bottom: 4px; }
    .plan-price {
      font-size: 22px; font-weight: 800; color: #2563EB; margin-bottom: 10px;
    }
    .plan-price span { font-size: 13px; font-weight: 500; color: #64748B; }
    .enterprise-price { font-size: 16px; font-weight: 700; color: #7C3AED; }
    .plan-features { list-style: none; padding: 0; margin: 0; }
    .plan-features li {
      font-size: 12px; color: #475569; padding: 2px 0;
      display: flex; align-items: center; gap: 4px;
    }
    .plan-features .bi-check-lg { color: #10B981; font-size: 11px; }
    .plan-badge {
      margin-top: 10px; font-size: 12px; color: #2563EB; font-weight: 600;
    }

    /* ── PASSWORD ─────────────────────────────────────────── */
    .password-wrap { position: relative; }
    .pw-toggle {
      position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
      background: none; border: none; color: #94A3B8; cursor: pointer; padding: 4px;
    }
    .pw-strength { margin-top: 6px; display: flex; align-items: center; gap: 8px; }
    .pw-bar {
      flex: 1; height: 4px; border-radius: 2px; background: #E2E8F0;
      position: relative; overflow: hidden;
    }
    .pw-bar::after {
      content: ''; position: absolute; inset: 0; border-radius: 2px;
    }
    .pw-bar.weak::after { width: 33%; background: #EF4444; }
    .pw-bar.fair::after { width: 66%; background: #F59E0B; }
    .pw-bar.strong::after { width: 100%; background: #10B981; }
    .pw-label { font-size: 12px; color: #64748B; white-space: nowrap; }

    /* ── TERMS ────────────────────────────────────────────── */
    .terms-row { display: flex; align-items: flex-start; gap: 10px; }
    .terms-row .form-check-input { margin-top: 2px; flex-shrink: 0; }
    .terms-row .form-check-label { font-size: 13px; color: #475569; }
    .terms-row a { color: #2563EB; text-decoration: none; }

    .trial-label { text-align: center; font-size: 13px; color: #94A3B8; margin-top: 10px; }
    .signin-link { margin-top: 20px; font-size: 14px; color: #64748B; }
    .signin-link a { color: #2563EB; text-decoration: none; font-weight: 500; }
  `]
})
export class SignupComponent implements OnDestroy {
  private router = inject(Router);

  readonly step = signal<WizardStep>(1);
  readonly industries = INDUSTRIES;
  readonly regions = [
    { key: 'US' as Region, label: 'US', flag: '🇺🇸', note: 'Virginia' },
    { key: 'EU' as Region, label: 'EU', flag: '🇪🇺', note: 'Frankfurt' },
    { key: 'APAC' as Region, label: 'APAC', flag: '🌏', note: 'Singapore' },
  ];

  // Step 1
  companyName = '';
  industry = 'Automotive';
  subdomain = '';
  readonly region = signal<Region>('US');
  readonly selectedPlan = signal<PlanKey>('professional');

  // Step 2
  fullName = '';
  workEmail = '';
  password = '';
  confirmPassword = '';
  agreedToTerms = false;
  readonly showPw = signal(false);
  toggleShowPw(): void { this.showPw.update(v => !v); }

  // Provisioning
  readonly provProgress = signal(0);
  readonly provMsgIndex = signal(0);
  readonly provMessage = computed(() => PROVISIONING_MESSAGES[this.provMsgIndex()]);
  private provInterval: ReturnType<typeof setInterval> | null = null;

  get subdomainSlug(): string {
    return this.subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }

  onSubdomainChange(val: string): void {
    this.subdomain = val;
  }

  get step1Valid(): boolean {
    return this.companyName.trim().length > 0 && this.subdomain.trim().length > 0;
  }

  get step2Valid(): boolean {
    return this.fullName.trim().length > 0 &&
      this.workEmail.trim().length > 0 &&
      this.password.length >= 8 &&
      this.password === this.confirmPassword &&
      this.agreedToTerms;
  }

  get pwStrengthClass(): string {
    const p = this.password;
    if (p.length < 8) return 'weak';
    if (p.length >= 12 && /[A-Z]/.test(p) && /[0-9]/.test(p)) return 'strong';
    return 'fair';
  }

  get pwStrengthLabel(): string {
    return this.pwStrengthClass === 'weak' ? 'Weak' : this.pwStrengthClass === 'fair' ? 'Fair' : 'Strong';
  }

  goToStep2(): void {
    if (this.step1Valid) this.step.set(2);
  }

  submitSignup(): void {
    if (!this.step2Valid) return;
    this.step.set('provisioning');
    this.startProvisioning();
  }

  private startProvisioning(): void {
    let progress = 0;
    let msgIdx = 0;
    this.provProgress.set(0);
    this.provMsgIndex.set(0);

    this.provInterval = setInterval(() => {
      progress += 4;
      if (progress <= 100) this.provProgress.set(progress);

      const newMsgIdx = Math.min(Math.floor(progress / 25), 3);
      if (newMsgIdx !== msgIdx) {
        msgIdx = newMsgIdx;
        this.provMsgIndex.set(msgIdx);
      }

      if (progress >= 100) {
        clearInterval(this.provInterval!);
        this.provInterval = null;
        setTimeout(() => this.router.navigate(['/welcome']), 800);
      }
    }, 120);
  }

  ngOnDestroy(): void {
    if (this.provInterval) clearInterval(this.provInterval);
  }
}
