import { Component, signal, computed, inject, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthStore } from '../../../core/auth/stores/auth.store';
import { MockDataService } from '../../../shared/services/mock-data.service';

type Step = 1 | 2 | 3 | 'success';

const RECENT_DEFECTS = [
  'Surface Scratch', 'Dimensional', 'Wrong Material', 'Missing Part',
  'Weld Defect', 'Label Error', 'Assembly Error', 'Contamination',
];

@Component({
  selector: 'app-quick-ncr',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="quick-ncr">
      @if (step() === 'success') {
        <!-- SUCCESS SCREEN -->
        <div class="success-screen">
          <div class="success-check">
            <i class="bi bi-check-lg"></i>
          </div>
          <h2>{{ submittedNcrId }} Logged!</h2>
          <p class="text-muted">Your non-conformance has been recorded and assigned to the QM team.</p>
          <button class="success-btn outlined" (click)="reset()">
            <i class="bi bi-plus-circle me-2"></i>Log Another NCR
          </button>
          <button class="success-btn primary" (click)="viewNcr()">
            <i class="bi bi-eye me-2"></i>View NCR
          </button>
        </div>
      } @else {
        <!-- HEADER -->
        <div class="ncr-header">
          <div class="step-dots">
            @for (s of [1,2,3]; track s) {
              <div class="dot" [class.active]="s === numericStep()" [class.done]="s < numericStep()"></div>
            }
          </div>
          <span class="step-title">{{ stepTitle() }}</span>
          <button class="close-btn" (click)="router.navigate(['/dashboard'])">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <!-- STEP 1 — What -->
        @if (step() === 1) {
          <div class="step-body">
            <button class="scan-btn">
              <i class="bi bi-qr-code-scan me-2"></i>Scan Part QR Code
            </button>
            <p class="or-label">or search part number</p>
            <input class="form-control mb-4" type="text" [(ngModel)]="partNumber"
              placeholder="e.g. PN-48201-A" />

            <label class="field-label">Defect Code</label>
            <input class="form-control form-control-sm mb-2" type="text"
              [(ngModel)]="defectSearch" placeholder="Search defects..." />
            <div class="defect-grid">
              @for (d of filteredDefects(); track d) {
                <button class="defect-tile" [class.selected]="selectedDefect === d"
                  (click)="selectedDefect = d">
                  {{ d }}
                </button>
              }
            </div>

            <label class="field-label mt-4">Quantity</label>
            <div class="qty-row">
              <button class="qty-btn" (click)="decQty()">
                <i class="bi bi-dash-lg"></i>
              </button>
              <span class="qty-value">{{ qty }}</span>
              <button class="qty-btn" (click)="incQty()">
                <i class="bi bi-plus-lg"></i>
              </button>
            </div>
          </div>
          <div class="step-footer">
            <button class="btn-next" (click)="goStep(2)"
              [disabled]="!partNumber && !selectedDefect">
              Next Step <i class="bi bi-arrow-right ms-2"></i>
            </button>
          </div>
        }

        <!-- STEP 2 — Show -->
        @if (step() === 2) {
          <div class="step-body">
            <h2 class="step-section-title">Add photo evidence</h2>
            <div class="camera-area">
              <i class="bi bi-camera fs-1 text-muted mb-2"></i>
              <span class="text-muted">Take Photo</span>
            </div>
            <div class="thumb-row mt-3">
              @for (t of photoThumbs; track t) {
                <div class="thumb">
                  <div class="thumb-img"><i class="bi bi-image"></i></div>
                  <button class="thumb-x"><i class="bi bi-x"></i></button>
                </div>
              }
            </div>
            <button class="voice-btn mt-3">
              <i class="bi bi-mic me-2"></i>Add Voice Note
            </button>
            <div class="mt-3">
              <label class="field-label">Text Note (optional)</label>
              <textarea class="form-control" rows="3" [(ngModel)]="note"
                placeholder="Describe what you observed..."></textarea>
            </div>
          </div>
          <div class="step-footer">
            <button class="btn-back" (click)="goStep(1)">
              <i class="bi bi-arrow-left me-2"></i>Back
            </button>
            <button class="btn-next" (click)="goStep(3)">
              Next Step <i class="bi bi-arrow-right ms-2"></i>
            </button>
          </div>
        }

        <!-- STEP 3 — Confirm -->
        @if (step() === 3) {
          <div class="step-body">
            <div class="summary-card">
              <div class="summary-row">
                <span class="sum-label">Part</span>
                <span class="sum-value">{{ partNumber }}</span>
              </div>
              <div class="summary-row">
                <span class="sum-label">Defect</span>
                <span class="sum-value">{{ selectedDefect }}</span>
              </div>
              <div class="summary-row">
                <span class="sum-label">Quantity</span>
                <span class="sum-value">{{ qty }}</span>
              </div>
              <div class="summary-row">
                <span class="sum-label">Area</span>
                <span class="sum-value">{{ authStore.currentUser()?.workArea ?? '—' }}</span>
              </div>
              <div class="summary-row">
                <span class="sum-label">Reporter</span>
                <span class="sum-value">{{ authStore.fullName() }}</span>
              </div>
              <div class="summary-row">
                <span class="sum-label">Time</span>
                <span class="sum-value">{{ confirmTime }}</span>
              </div>
            </div>
          </div>
          <div class="step-footer">
            <button class="btn-back" (click)="goStep(2)">
              <i class="bi bi-arrow-left me-2"></i>Back
            </button>
            <button class="btn-submit" (click)="submit()">
              <i class="bi bi-check-lg me-2"></i>Submit NCR
            </button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .quick-ncr {
      min-height: 100vh; background: #fff;
      max-width: 390px; margin: 0 auto;
      display: flex; flex-direction: column;
    }

    /* ── HEADER ──────────────────────────────────────────── */
    .ncr-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px; border-bottom: 1px solid #F1F5F9; position: sticky; top: 0;
      background: #fff; z-index: 10;
    }
    .step-dots { display: flex; gap: 6px; }
    .dot {
      width: 8px; height: 8px; border-radius: 50%; background: #E2E8F0;
    }
    .dot.active { background: #2563EB; }
    .dot.done { background: #10B981; }
    .step-title { font-size: 15px; font-weight: 600; color: #1E293B; }
    .close-btn { background: none; border: none; font-size: 18px; color: #64748B; cursor: pointer; }

    /* ── BODY ─────────────────────────────────────────────── */
    .step-body { flex: 1; padding: 20px 16px; overflow-y: auto; }
    .field-label { font-size: 13px; font-weight: 600; color: #374151; display: block; margin-bottom: 6px; }

    /* ── SCAN BTN ─────────────────────────────────────────── */
    .scan-btn {
      width: 100%; height: 56px; border-radius: 14px;
      background: #2563EB; color: #fff; border: none;
      font-size: 16px; font-weight: 600; cursor: pointer; display: flex;
      align-items: center; justify-content: center;
    }
    .or-label { text-align: center; color: #94A3B8; font-size: 13px; margin: 12px 0; }

    /* ── DEFECT GRID ──────────────────────────────────────── */
    .defect-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
    .defect-tile {
      padding: 10px 8px; border: 1px solid #E2E8F0; border-radius: 10px;
      font-size: 13px; background: #F8FAFC; color: #374151; cursor: pointer; text-align: center;
    }
    .defect-tile.selected { border-color: #2563EB; background: #EFF6FF; color: #2563EB; font-weight: 600; }

    /* ── QTY ─────────────────────────────────────────────── */
    .qty-row { display: flex; align-items: center; justify-content: center; gap: 24px; }
    .qty-btn {
      width: 56px; height: 56px; border-radius: 14px; border: 1px solid #E2E8F0;
      background: #F8FAFC; font-size: 20px; cursor: pointer; color: #2563EB;
      display: flex; align-items: center; justify-content: center;
    }
    .qty-value { font-size: 32px; font-weight: 800; color: #0F172A; min-width: 64px; text-align: center; }

    /* ── CAMERA ──────────────────────────────────────────── */
    .camera-area {
      width: 100%; height: 200px; border-radius: 16px; background: #F1F5F9;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      cursor: pointer; border: 2px dashed #CBD5E1;
    }
    .thumb-row { display: flex; gap: 8px; }
    .thumb { position: relative; }
    .thumb-img {
      width: 72px; height: 72px; border-radius: 10px; background: #E2E8F0;
      display: flex; align-items: center; justify-content: center; font-size: 22px; color: #94A3B8;
    }
    .thumb-x {
      position: absolute; top: -6px; right: -6px; width: 20px; height: 20px;
      border-radius: 50%; background: #EF4444; color: #fff; border: none;
      font-size: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center;
    }
    .voice-btn {
      width: 100%; padding: 12px; border: 1px solid #E2E8F0; border-radius: 12px;
      background: #F8FAFC; color: #374151; font-size: 14px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
    }
    .step-section-title { font-size: 20px; font-weight: 700; color: #0F172A; margin-bottom: 16px; }

    /* ── SUMMARY ─────────────────────────────────────────── */
    .summary-card {
      background: #F8FAFC; border-radius: 16px; padding: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }
    .summary-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 10px 0; border-bottom: 1px solid #F1F5F9;
    }
    .summary-row:last-child { border-bottom: none; }
    .sum-label { font-size: 13px; color: #64748B; }
    .sum-value { font-size: 14px; font-weight: 600; color: #1E293B; }

    /* ── FOOTER ──────────────────────────────────────────── */
    .step-footer {
      padding: 16px; border-top: 1px solid #F1F5F9;
      display: flex; gap: 12px;
    }
    .btn-next {
      flex: 1; height: 52px; border-radius: 14px; border: none;
      background: #2563EB; color: #fff; font-size: 15px; font-weight: 600; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
    }
    .btn-next:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-back {
      height: 52px; padding: 0 16px; border-radius: 14px;
      border: 1px solid #E2E8F0; background: #fff; color: #475569;
      font-size: 15px; cursor: pointer; display: flex; align-items: center;
    }
    .btn-submit {
      flex: 1; height: 52px; border-radius: 14px; border: none;
      background: #16A34A; color: #fff; font-size: 15px; font-weight: 600; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
    }

    /* ── SUCCESS ─────────────────────────────────────────── */
    .success-screen {
      flex: 1; display: flex; flex-direction: column; align-items: center;
      justify-content: center; padding: 40px 24px; text-align: center; gap: 16px;
      background: #16A34A; color: #fff; min-height: 100vh;
    }
    .success-check {
      width: 80px; height: 80px; border-radius: 50%; background: rgba(255,255,255,0.2);
      display: flex; align-items: center; justify-content: center;
      font-size: 36px; margin-bottom: 8px;
      animation: popIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275);
    }
    @keyframes popIn { 0% { transform: scale(0); } 100% { transform: scale(1); } }
    .success-screen h2 { font-size: 26px; font-weight: 800; margin: 0; }
    .success-screen p { opacity: 0.85; }
    .success-btn {
      width: 100%; height: 52px; border-radius: 14px;
      font-size: 15px; font-weight: 600; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
    }
    .success-btn.outlined {
      background: transparent; border: 2px solid rgba(255,255,255,0.6); color: #fff;
    }
    .success-btn.primary {
      background: #fff; border: none; color: #16A34A;
    }
  `]
})
export class QuickNcrComponent {
  readonly router = inject(Router);
  readonly authStore = inject(AuthStore);
  readonly mock = inject(MockDataService);

  readonly step = signal<Step>(1);
  partNumber = '';
  selectedDefect = '';
  defectSearch = '';
  qty = 1;
  note = '';
  confirmTime = '';
  submittedNcrId = '';
  readonly photoThumbs = ['t1', 't2'];

  readonly filteredDefects = computed(() =>
    RECENT_DEFECTS.filter(d =>
      !this.defectSearch || d.toLowerCase().includes(this.defectSearch.toLowerCase())
    )
  );

  readonly numericStep = computed(() => {
    const s = this.step();
    return s === 'success' ? 4 : (s as number);
  });

  decQty(): void { if (this.qty > 1) this.qty--; }
  incQty(): void { this.qty++; }

  readonly stepTitle = computed(() => {
    const titles: Record<number, string> = { 1: 'What — Describe the Issue', 2: 'Show — Add Evidence', 3: 'Confirm & Submit' };
    return titles[this.step() as number] ?? '';
  });

  goStep(s: Step): void {
    if (s === 3) {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      this.confirmTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    }
    this.step.set(s);
  }

  submit(): void {
    const user = this.authStore.currentUser();
    const now = new Date();
    const due = new Date(now);
    due.setDate(due.getDate() + 7);
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : '??';

    const ncr = this.mock.addNcr({
      title: `${this.selectedDefect} — ${this.partNumber}`,
      description: this.note || `Quick NCR: ${this.selectedDefect} on part ${this.partNumber}`,
      status: 'Open',
      severity: 'Minor',
      owner: this.authStore.fullName(),
      ownerInitials: initials,
      ownerColor: user?.avatarColor,
      siteId: user?.siteId ?? '',
      createdAt: fmt(now),
      dueDate: fmt(due),
      disposition: '',
      source: 'Internal',
      ageInDays: 0,
      partNumber: this.partNumber,
      defectCode: this.selectedDefect,
      qtyDefective: this.qty,
      area: user?.workArea,
    });
    this.submittedNcrId = ncr.id;
    this.step.set('success');
  }

  reset(): void {
    this.step.set(1);
    this.partNumber = ''; this.selectedDefect = ''; this.qty = 1; this.note = ''; this.confirmTime = ''; this.submittedNcrId = '';
  }

  viewNcr(): void { this.router.navigate(['/ncrs', this.submittedNcrId]); }
}
