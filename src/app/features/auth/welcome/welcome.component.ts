import { Component, signal, computed, inject, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;

interface Site { name: string; address: string; }
interface Invite { email: string; role: string; site: string; }

const ROLES = ['Quality Manager', 'Quality Engineer', 'Supervisor', 'Director', 'Auditor', 'Guest'];
const ROLE_DESCRIPTIONS: Record<string, string> = {
  'Quality Manager': 'Full access to QMS features, can approve documents',
  'Quality Engineer': 'Create NCRs, CAPAs and run audits',
  'Supervisor': 'View dashboards, approve containment actions',
  'Director': 'Executive dashboards and reports',
  'Auditor': 'Conduct audits and raise findings',
  'Guest': 'Read-only access to assigned areas',
};
const DEFECT_CHIPS = [
  'Dimensional Out-of-Spec','Surface Scratch','Wrong Material','Missing Component',
  'Weld Defect','Paint Adhesion','Torque Non-Conformance','Contamination',
  'Label Error','Packaging Damage','Wrong Color','Assembly Error',
  'Crack / Fracture','Porosity','Burr / Sharp Edge','Delamination',
  'Excess Flash','Undercut','Pitting','Rust / Corrosion',
  'Thread Damage','Warpage','Short Shot','Sink Mark',
  'Flow Line','Void','Knit Line','Silver Streak',
  'Blister','Jetting','Burn Mark','Deformation',
  'Mis-alignment','Chipping','Staining','Oil Contamination',
  'Incorrect Hardness','Surface Porosity','Dimensional Drift','Process Deviation',
];
const DOC_TYPES = ['Control Plan','PFMEA','Work Instruction','Quality Plan','Inspection Report','Procedure','Form'];
const AREAS = [
  { name: 'Stamping', children: ['Cell 1','Cell 2','Cell 3'] },
  { name: 'Welding', children: ['MIG Station','Spot Weld Line'] },
  { name: 'Assembly', children: ['Line A','Line B','Final Assembly'] },
  { name: 'Inspection', children: ['Incoming','In-Process','Final'] },
];
const TEMPLATE_PACKS = [
  { id: 'tp1', name: 'IATF 16949 Audit Checklist', desc: '320 clauses, cross-reference index', checked: true, locked: false, count: 0 },
  { id: 'tp2', name: 'Document Control Procedure', desc: 'ISO-aligned doc lifecycle templates', checked: true, locked: false, count: 0 },
  { id: 'tp3', name: 'AIAG FMEA Worksheets', desc: 'D-FMEA and P-FMEA base templates', checked: false, locked: false, count: 0 },
  { id: 'tp4', name: 'SPC Control Charts', desc: 'Xbar-R, Xbar-S, p-chart templates', checked: false, locked: true, count: 0 },
];
const TIMEZONES = [
  'America/New_York','America/Chicago','America/Denver','America/Los_Angeles',
  'Europe/London','Europe/Berlin','Europe/Paris','Asia/Tokyo','Asia/Singapore','Australia/Sydney',
];

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (showCelebration()) {
      <div class="celebration-overlay">
        <div class="confetti-container">
          @for (c of confettiPieces; track c.id) {
            <div class="confetti-piece"
              [style.left.%]="c.x"
              [style.background]="c.color"
              [style.animation-delay.ms]="c.delay"
              [style.animation-duration.ms]="c.duration"
              [style.width.px]="c.size"
              [style.height.px]="c.size * 0.4">
            </div>
          }
        </div>
        <div class="celebration-card">
          <div class="celebration-check">
            <i class="bi bi-check-lg"></i>
          </div>
          <h1>You're activated!</h1>
          <p>Your Qualvora workspace is ready. Let's build quality together.</p>
          <button class="btn btn-primary btn-lg px-5" (click)="goDashboard()">
            <i class="bi bi-house-door me-2"></i>Go to Dashboard
          </button>
        </div>
      </div>
    } @else {
      <div class="wizard-page">
        <!-- Header -->
        <div class="wizard-topbar">
          <div class="wizard-logo">
            <div class="logo-mark"><span>Q</span></div>
            <span class="brand">Qualvora</span>
          </div>
          <div class="wizard-meta">
            <span class="step-counter">{{ completedCount() }} of 6 steps complete</span>
            <span class="step-label-top">Step {{ currentStep() }} of 6 — {{ stepTitle() }}</span>
          </div>
        </div>

        <!-- Progress bar -->
        <div class="wizard-progress-bar">
          @for (s of [1,2,3,4,5,6]; track s) {
            <div class="prog-seg" [class.done]="s < currentStep()" [class.active]="s === currentStep()"></div>
          }
        </div>

        <div class="wizard-body">
          <!-- STEP 1: Company Profile -->
          @if (currentStep() === 1) {
            <div class="step-content">
              <h2 class="step-heading">Company Profile</h2>
              <p class="step-sub">Set up your organization's basic details.</p>

              <div class="logo-upload-zone" (click)="logoZoneClick()">
                @if (logoFile()) {
                  <div class="logo-preview-text">
                    <i class="bi bi-image text-primary" style="font-size:28px"></i>
                    <span>{{ logoFile() }}</span>
                  </div>
                } @else {
                  <i class="bi bi-cloud-upload fs-2 text-muted"></i>
                  <p class="mb-0 mt-2 text-muted">Drag & drop your logo or <span class="text-primary">browse</span></p>
                  <small class="text-muted">PNG, SVG · Max 2MB</small>
                }
              </div>

              <div class="row g-3 mt-1">
                <div class="col-md-6">
                  <label class="form-label">Timezone</label>
                  <select class="form-select" [(ngModel)]="timezone">
                    @for (tz of timezones; track tz) {
                      <option [value]="tz">{{ tz }}</option>
                    }
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Country</label>
                  <select class="form-select" [(ngModel)]="country">
                    <option>United States</option>
                    <option>Canada</option>
                    <option>Germany</option>
                    <option>Mexico</option>
                    <option>United Kingdom</option>
                  </select>
                </div>
                <div class="col-12">
                  <label class="form-label">Street Address</label>
                  <input class="form-control" type="text" [(ngModel)]="address" placeholder="123 Quality Drive" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">City</label>
                  <input class="form-control" type="text" [(ngModel)]="city" placeholder="Detroit" />
                </div>
                <div class="col-md-3">
                  <label class="form-label">State</label>
                  <input class="form-control" type="text" [(ngModel)]="state" placeholder="MI" />
                </div>
                <div class="col-md-3">
                  <label class="form-label">ZIP</label>
                  <input class="form-control" type="text" [(ngModel)]="zip" placeholder="48201" />
                </div>
              </div>
            </div>
          }

          <!-- STEP 2: Sites -->
          @if (currentStep() === 2) {
            <div class="step-content">
              <h2 class="step-heading">Your Sites</h2>
              <p class="step-sub">Add all manufacturing or office locations. You can add more from Settings later.</p>

              <table class="table table-bordered align-middle mt-3">
                <thead class="table-light">
                  <tr>
                    <th>Site Name</th>
                    <th>Address</th>
                    <th style="width:48px"></th>
                  </tr>
                </thead>
                <tbody>
                  @for (site of sites; track $index; let i = $index) {
                    <tr>
                      <td>
                        <input class="form-control form-control-sm" type="text"
                          [(ngModel)]="site.name" />
                      </td>
                      <td>
                        <input class="form-control form-control-sm" type="text"
                          [(ngModel)]="site.address" placeholder="City, State" />
                      </td>
                      <td>
                        @if (sites.length > 1) {
                          <button class="btn btn-sm btn-outline-danger" (click)="removeSite(i)">
                            <i class="bi bi-x"></i>
                          </button>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
              <button class="btn btn-outline-primary btn-sm" (click)="addSite()">
                <i class="bi bi-plus me-1"></i>Add Site
              </button>
            </div>
          }

          <!-- STEP 3: Invite Team -->
          @if (currentStep() === 3) {
            <div class="step-content">
              <h2 class="step-heading">Invite Your Team</h2>
              <p class="step-sub">Add colleagues now or skip — you can invite from Settings > Users anytime.</p>

              <table class="table table-bordered align-middle mt-3">
                <thead class="table-light">
                  <tr>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Site</th>
                    <th style="width:48px"></th>
                  </tr>
                </thead>
                <tbody>
                  @for (inv of invites; track $index; let i = $index) {
                    <tr>
                      <td>
                        <input class="form-control form-control-sm" type="email"
                          [(ngModel)]="inv.email" placeholder="colleague@company.com" />
                      </td>
                      <td style="position:relative">
                        <select class="form-select form-select-sm" [(ngModel)]="inv.role">
                          @for (r of roles; track r) {
                            <option [value]="r">{{ r }}</option>
                          }
                        </select>
                      </td>
                      <td>
                        <select class="form-select form-select-sm" [(ngModel)]="inv.site">
                          @for (s of sites; track s.name) {
                            <option [value]="s.name">{{ s.name }}</option>
                          }
                        </select>
                      </td>
                      <td>
                        <button class="btn btn-sm btn-outline-danger" (click)="removeInvite(i)">
                          <i class="bi bi-x"></i>
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
              <button class="btn btn-outline-primary btn-sm" (click)="addInvite()">
                <i class="bi bi-plus me-1"></i>Add Person
              </button>

              @if (invites.length > 0 && invites[0].email) {
                <div class="preview-line mt-3">
                  <i class="bi bi-eye me-1 text-muted"></i>
                  <em>{{ invites[0].email.split('@')[0] }} gets a <strong>{{ invites[0].role }}</strong> invite for <strong>{{ invites[0].site }}</strong></em>
                </div>
              }
            </div>
          }

          <!-- STEP 4: Taxonomies -->
          @if (currentStep() === 4) {
            <div class="step-content">
              <h2 class="step-heading">Review Taxonomies</h2>

              <div class="alert alert-info d-flex align-items-center gap-2 mb-4">
                <i class="bi bi-info-circle-fill text-primary"></i>
                AIAG-standard defaults loaded. Edit anytime in Settings.
              </div>

              <ul class="nav nav-tabs mb-3">
                @for (tab of ['Defect Codes','Document Types','Areas']; track tab) {
                  <li class="nav-item">
                    <button class="nav-link" [class.active]="taxTab() === tab"
                      (click)="taxTab.set(tab)">{{ tab }}</button>
                  </li>
                }
              </ul>

              @if (taxTab() === 'Defect Codes') {
                <div class="chips-grid">
                  @for (chip of defectCodes; track chip) {
                    <span class="chip">{{ chip }} <i class="bi bi-x chip-x"></i></span>
                  }
                  <span class="chip chip-add"><i class="bi bi-plus"></i> Add</span>
                </div>
              }
              @if (taxTab() === 'Document Types') {
                <ul class="list-group">
                  @for (dt of docTypes; track dt) {
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                      {{ dt }}
                      <i class="bi bi-x text-muted" style="cursor:pointer"></i>
                    </li>
                  }
                  <li class="list-group-item text-primary" style="cursor:pointer">
                    <i class="bi bi-plus me-1"></i>Add Document Type
                  </li>
                </ul>
              }
              @if (taxTab() === 'Areas') {
                <ul class="list-group">
                  @for (area of areas; track area.name) {
                    <li class="list-group-item">
                      <div class="fw-semibold text-dark">{{ area.name }}</div>
                      <ul class="list-unstyled ms-3 mt-1 mb-0">
                        @for (child of area.children; track child) {
                          <li class="text-muted small py-1">
                            <i class="bi bi-dash me-1"></i>{{ child }}
                          </li>
                        }
                      </ul>
                    </li>
                  }
                </ul>
              }
            </div>
          }

          <!-- STEP 5: Templates -->
          @if (currentStep() === 5) {
            <div class="step-content">
              <h2 class="step-heading">Load Templates</h2>
              <p class="step-sub">Select template packs to pre-load into your library.</p>

              <div class="template-list">
                @for (pack of templatePacks; track pack.id) {
                  <div class="template-item" [class.locked]="pack.locked">
                    <div class="template-check">
                      @if (!pack.locked) {
                        <input type="checkbox" class="form-check-input"
                          [(ngModel)]="pack.checked" />
                      } @else {
                        <i class="bi bi-lock-fill text-warning"></i>
                      }
                    </div>
                    <div class="template-info">
                      <div class="template-name">{{ pack.name }}
                        @if (pack.locked) {
                          <span class="badge bg-warning text-dark ms-2" style="font-size:10px">Pro</span>
                        }
                      </div>
                      <div class="template-desc">{{ pack.desc }}</div>
                    </div>
                    @if (pack.count > 0) {
                      <div class="template-badge">
                        <span class="badge bg-success">{{ pack.count }} loaded</span>
                      </div>
                    }
                  </div>
                }
              </div>

              <button class="btn btn-primary mt-4" (click)="loadTemplates()"
                [disabled]="loadingTemplates() || !hasSelectedTemplates()">
                @if (loadingTemplates()) {
                  <span class="spinner-border spinner-border-sm me-2"></span>Loading...
                } @else {
                  <i class="bi bi-download me-2"></i>Load Selected
                }
              </button>
            </div>
          }

          <!-- STEP 6: First Document -->
          @if (currentStep() === 6) {
            <div class="step-content">
              <h2 class="step-heading">Create Your First Document</h2>
              <p class="step-sub">Start with a document or skip to the dashboard.</p>

              <div class="mb-3">
                <label class="form-label">Document Title <span class="req">*</span></label>
                <input class="form-control" type="text" [(ngModel)]="firstDocTitle"
                  placeholder="e.g. Quality Manual Rev A" />
              </div>
              <div class="mb-3">
                <label class="form-label">Document Type</label>
                <select class="form-select" [(ngModel)]="firstDocType">
                  @for (dt of docTypes; track dt) {
                    <option [value]="dt">{{ dt }}</option>
                  }
                </select>
              </div>
              <div class="upload-zone">
                <i class="bi bi-file-earmark-arrow-up fs-2 text-muted"></i>
                <p class="text-muted mt-2 mb-0">Drag & drop file or <span class="text-primary">browse</span></p>
                <small class="text-muted">PDF, DOCX, XLSX · Max 50MB</small>
              </div>
              <div class="mt-3">
                <a href="#" class="text-primary text-decoration-none"
                  (click)="$event.preventDefault(); router.navigate(['/documents/import'])">
                  <i class="bi bi-file-earmark-arrow-up me-1"></i>
                  Import Existing Documents instead
                </a>
              </div>
            </div>
          }
        </div>

        <!-- Navigation -->
        <div class="wizard-footer">
          <button class="btn btn-outline-secondary" (click)="prevStep()"
            [disabled]="currentStep() === 1">
            <i class="bi bi-arrow-left me-1"></i>Back
          </button>
          <div class="step-dots">
            @for (s of [1,2,3,4,5,6]; track s) {
              <div class="dot" [class.active]="s === currentStep()" (click)="goToStep(s)"></div>
            }
          </div>
          @if (currentStep() < 6) {
            <button class="btn btn-primary" (click)="nextStep()">
              Next <i class="bi bi-arrow-right ms-1"></i>
            </button>
          } @else {
            <button class="btn btn-success" (click)="finishSetup()">
              <i class="bi bi-check-lg me-1"></i>Finish Setup
            </button>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }

    /* ── CELEBRATION ─────────────────────────────────────── */
    .celebration-overlay {
      position: fixed; inset: 0; background: rgba(15,23,42,0.85);
      display: flex; align-items: center; justify-content: center;
      z-index: 9999; overflow: hidden;
    }
    .confetti-container { position: fixed; inset: 0; pointer-events: none; overflow: hidden; }
    .confetti-piece {
      position: absolute; top: -20px; border-radius: 2px;
      animation: confettiFall linear forwards;
    }
    @keyframes confettiFall {
      0% { top: -20px; transform: rotate(0deg) translateX(0); opacity: 1; }
      100% { top: 110vh; transform: rotate(720deg) translateX(40px); opacity: 0.3; }
    }
    .celebration-card {
      background: #fff; border-radius: 24px; padding: 48px 40px;
      text-align: center; max-width: 420px; width: 100%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3); position: relative; z-index: 1;
    }
    .celebration-check {
      width: 72px; height: 72px; border-radius: 50%; background: #10B981;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 20px; font-size: 32px; color: #fff;
      animation: popIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275);
    }
    @keyframes popIn {
      0% { transform: scale(0); } 100% { transform: scale(1); }
    }
    .celebration-card h1 { font-size: 28px; font-weight: 800; color: #0F172A; margin-bottom: 10px; }
    .celebration-card p { color: #64748B; margin-bottom: 28px; }

    /* ── WIZARD LAYOUT ───────────────────────────────────── */
    .wizard-page {
      min-height: 100vh; background: #F8FAFC;
      display: flex; flex-direction: column;
    }
    .wizard-topbar {
      padding: 16px 32px; background: #fff; border-bottom: 1px solid #E2E8F0;
      display: flex; align-items: center; justify-content: space-between;
    }
    .wizard-logo { display: flex; align-items: center; gap: 10px; }
    .logo-mark {
      width: 32px; height: 32px; background: #2563EB; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      font-size: 16px; font-weight: 800; color: #fff;
    }
    .brand { font-size: 18px; font-weight: 700; color: #0F172A; }
    .wizard-meta { text-align: right; }
    .step-counter {
      display: block; font-size: 13px; font-weight: 600; color: #2563EB;
      background: #EFF6FF; border-radius: 20px; padding: 4px 12px; margin-bottom: 4px;
    }
    .step-label-top { font-size: 13px; color: #64748B; }

    .wizard-progress-bar {
      display: flex; gap: 4px; padding: 0; height: 4px;
    }
    .prog-seg {
      flex: 1; background: #E2E8F0; transition: background 0.3s;
    }
    .prog-seg.done { background: #10B981; }
    .prog-seg.active { background: #2563EB; }

    .wizard-body {
      flex: 1; display: flex; justify-content: center; padding: 40px 16px;
    }
    .step-content { width: 100%; max-width: 640px; }
    .step-heading { font-size: 24px; font-weight: 700; color: #0F172A; margin-bottom: 6px; }
    .step-sub { color: #64748B; margin-bottom: 24px; }
    .req { color: #EF4444; }

    /* ── LOGO UPLOAD ─────────────────────────────────────── */
    .logo-upload-zone {
      border: 2px dashed #CBD5E1; border-radius: 12px; padding: 32px;
      text-align: center; cursor: pointer; transition: border-color 0.2s;
      background: #F8FAFC;
    }
    .logo-upload-zone:hover { border-color: #2563EB; }
    .logo-preview-text { display: flex; align-items: center; justify-content: center; gap: 12px; }

    /* ── CHIPS ───────────────────────────────────────────── */
    .chips-grid { display: flex; flex-wrap: wrap; gap: 8px; }
    .chip {
      display: inline-flex; align-items: center; gap: 4px;
      background: #F1F5F9; border: 1px solid #E2E8F0; border-radius: 20px;
      padding: 4px 10px; font-size: 12px; color: #334155; cursor: default;
    }
    .chip-x { cursor: pointer; opacity: 0.5; }
    .chip-x:hover { opacity: 1; color: #EF4444; }
    .chip-add {
      background: #EFF6FF; border-color: #93C5FD; color: #2563EB; cursor: pointer;
    }

    /* ── TEMPLATE PACK ───────────────────────────────────── */
    .template-list { display: flex; flex-direction: column; gap: 12px; }
    .template-item {
      display: flex; align-items: center; gap: 16px;
      padding: 16px; background: #fff; border: 1px solid #E2E8F0;
      border-radius: 10px;
    }
    .template-item.locked { opacity: 0.65; }
    .template-check { flex-shrink: 0; }
    .template-info { flex: 1; }
    .template-name { font-size: 14px; font-weight: 600; color: #1E293B; }
    .template-desc { font-size: 13px; color: #64748B; }
    .template-badge { flex-shrink: 0; }

    /* ── UPLOAD ZONE ─────────────────────────────────────── */
    .upload-zone {
      border: 2px dashed #CBD5E1; border-radius: 12px; padding: 32px;
      text-align: center; background: #F8FAFC;
    }

    /* ── FOOTER NAV ──────────────────────────────────────── */
    .wizard-footer {
      padding: 20px 32px; background: #fff; border-top: 1px solid #E2E8F0;
      display: flex; align-items: center; justify-content: space-between;
    }
    .step-dots { display: flex; gap: 8px; }
    .dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: #CBD5E1; cursor: pointer; transition: background 0.2s;
    }
    .dot.active { background: #2563EB; transform: scale(1.3); }

    .preview-line { font-size: 13px; color: #475569; }
  `]
})
export class WelcomeComponent {
  readonly router = inject(Router);

  readonly currentStep = signal<WizardStep>(1);
  readonly showCelebration = signal(false);
  readonly taxTab = signal('Defect Codes');
  readonly loadingTemplates = signal(false);
  readonly logoFile = signal<string | null>(null);

  // Step 1
  timezone = 'America/Detroit';
  country = 'United States';
  address = '';
  city = '';
  state = '';
  zip = '';
  readonly timezones = TIMEZONES;

  // Step 2
  sites: Site[] = [{ name: 'Plant-1', address: 'Detroit, MI' }];

  // Step 3
  readonly roles = ROLES;
  readonly roleDescriptions = ROLE_DESCRIPTIONS;
  invites: Invite[] = [{ email: '', role: 'Quality Engineer', site: 'Plant-1' }];

  // Step 4
  defectCodes = [...DEFECT_CHIPS];
  docTypes = [...DOC_TYPES];
  areas = AREAS;

  // Step 5
  templatePacks = TEMPLATE_PACKS.map(p => ({ ...p }));

  // Step 6
  firstDocTitle = '';
  firstDocType = 'Procedure';

  readonly completedCount = computed(() => Math.max(0, this.currentStep() - 1));

  readonly stepTitle = computed(() => {
    const titles: Record<number, string> = {
      1: 'Company Profile', 2: 'Your Sites', 3: 'Invite Team',
      4: 'Review Taxonomies', 5: 'Load Templates', 6: 'First Document',
    };
    return titles[this.currentStep()] ?? '';
  });

  readonly hasSelectedTemplates = computed(() =>
    this.templatePacks.some(p => p.checked && !p.locked)
  );

  logoZoneClick(): void {
    this.logoFile.set('company-logo.png');
  }

  addSite(): void {
    this.sites.push({ name: `Plant-${this.sites.length + 1}`, address: '' });
  }

  removeSite(i: number): void {
    this.sites.splice(i, 1);
  }

  addInvite(): void {
    this.invites.push({ email: '', role: 'Quality Engineer', site: this.sites[0]?.name ?? 'Plant-1' });
  }

  removeInvite(i: number): void {
    this.invites.splice(i, 1);
  }

  loadTemplates(): void {
    this.loadingTemplates.set(true);
    setTimeout(() => {
      this.templatePacks.forEach(p => {
        if (p.checked && !p.locked) p.count = Math.floor(Math.random() * 50) + 10;
      });
      this.loadingTemplates.set(false);
    }, 1500);
  }

  goToStep(s: number): void {
    if (s >= 1 && s <= 6) this.currentStep.set(s as WizardStep);
  }

  nextStep(): void {
    if (this.currentStep() < 6) this.currentStep.update(s => (s + 1) as WizardStep);
  }

  prevStep(): void {
    if (this.currentStep() > 1) this.currentStep.update(s => (s - 1) as WizardStep);
  }

  finishSetup(): void {
    this.showCelebration.set(true);
  }

  goDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  readonly confettiPieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: ['#2563EB','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#06B6D4'][i % 7],
    delay: Math.random() * 2000,
    duration: 2500 + Math.random() * 2000,
    size: 8 + Math.random() * 8,
  }));
}
