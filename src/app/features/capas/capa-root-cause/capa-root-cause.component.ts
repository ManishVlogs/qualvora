import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MockDataService } from '../../../shared/services/mock-data.service';
import { CAPA8D, CapaFishboneCause } from '../../../shared/interfaces/models';

type RcTab = '5why' | 'fishbone';

const FISHBONE_CATS: { key: keyof import('../../../shared/interfaces/models').CapaFishbone; label: string; color: string }[] = [
  { key: 'man',         label: 'Man',         color: '#2563EB' },
  { key: 'machine',     label: 'Machine',     color: '#7C3AED' },
  { key: 'method',      label: 'Method',      color: '#0891B2' },
  { key: 'material',    label: 'Material',    color: '#059669' },
  { key: 'measurement', label: 'Measurement', color: '#D97706' },
  { key: 'nature',      label: 'Environment', color: '#DC2626' },
];

@Component({
  selector: 'app-capa-root-cause',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (capa(); as c) {
    <div class="rc-layout">

      <!-- Header -->
      <div class="rc-header">
        <button class="back-btn" (click)="router.navigate(['/capas', c.id])">
          <i class="bi bi-arrow-left me-1"></i> Back to {{ c.id }}
        </button>
        <div class="header-row">
          <div>
            <h1 class="page-title">Root Cause Analysis Tools</h1>
            <p class="page-sub">{{ c.id }} · {{ c.title }}</p>
          </div>
        </div>

        <!-- Tab bar -->
        <div class="tab-bar">
          <button class="tab-btn" [class.active]="activeTab() === '5why'" (click)="activeTab.set('5why')">
            <i class="bi bi-diagram-3 me-1"></i> 5-Why Analysis
          </button>
          <button class="tab-btn" [class.active]="activeTab() === 'fishbone'" (click)="activeTab.set('fishbone')">
            <i class="bi bi-git me-1"></i> Fishbone Diagram
          </button>
        </div>
      </div>

      <!-- Body -->
      <div class="rc-body">

        <!-- 5-Why tab -->
        @if (activeTab() === '5why') {
          <div class="tab-content">

            <!-- Problem statement callout -->
            @if (c.d2?.problemStatement) {
              <div class="problem-callout">
                <span class="callout-label">Problem Statement (from D2)</span>
                <p class="callout-text">{{ c.d2!.problemStatement }}</p>
              </div>
            }

            <!-- Why chain -->
            <div class="why-chain-full">
              @for (row of whyRows(c); track $index) {
                <div class="why-block">
                  <div class="why-num">Why {{ $index + 1 }}</div>
                  <div class="why-fields">
                    <textarea class="form-control form-control-sm" rows="2"
                              [ngModel]="row.why" (ngModelChange)="updateWhy(c, $index, 'why', $event)"
                              placeholder="State the why question…"></textarea>
                    <div class="arrow-connector"><i class="bi bi-arrow-down-short"></i></div>
                    <textarea class="form-control form-control-sm" rows="2"
                              [ngModel]="row.answer" (ngModelChange)="updateWhy(c, $index, 'answer', $event)"
                              placeholder="Answer / finding…"></textarea>
                  </div>
                  @if ($index < whyRows(c).length - 1) {
                    <div class="chain-arrow"><i class="bi bi-arrow-down fs-5 text-muted"></i></div>
                  }
                </div>
              }

              @if (whyRows(c).length < 5) {
                <button class="btn btn-outline-secondary btn-sm mt-3" (click)="addWhy(c)">
                  <i class="bi bi-plus me-1"></i> Add Another Why
                </button>
              }
            </div>

            <!-- Auto summary -->
            @if (lastAnswer(c)) {
              <div class="summary-section">
                <label class="summary-label">Root Cause Summary (auto-filled from last answer)</label>
                <div class="summary-box">{{ lastAnswer(c) }}</div>
              </div>
            }

            <div class="save-row">
              <button class="btn btn-primary" (click)="saveToD4(c)">
                <i class="bi bi-check2 me-1"></i> Save to D4
              </button>
            </div>
          </div>
        }

        <!-- Fishbone tab -->
        @if (activeTab() === 'fishbone') {
          <div class="tab-content">
            <p class="fishbone-subtitle">Click a category card to add potential causes. Mark the confirmed root cause with the radio button.</p>

            <div class="fishbone-grid">
              @for (cat of fishboneCats; track cat.key) {
                <div class="fishbone-card">
                  <div class="cat-header" [style.background]="cat.color">
                    {{ cat.label }}
                    <button class="add-cause-btn" (click)="addCause(c, cat.key)">
                      <i class="bi bi-plus"></i> Add Cause
                    </button>
                  </div>
                  <div class="cause-list">
                    @for (cause of getCauses(c, cat.key); track cause.id) {
                      <div class="cause-item">
                        <input type="radio" name="rootCause" class="cause-radio"
                               [checked]="cause.isRoot"
                               (change)="setRootCause(c, cat.key, cause.id)"
                               title="Mark as root cause" />
                        <span class="cause-text" [class.is-root]="cause.isRoot">{{ cause.text }}</span>
                        <button class="rm-cause" (click)="removeCause(c, cat.key, cause.id)">
                          <i class="bi bi-x"></i>
                        </button>
                      </div>
                    }
                    @if (getCauses(c, cat.key).length === 0) {
                      <span class="no-cause">No causes added</span>
                    }
                  </div>
                </div>
              }
            </div>

            @if (rootCauseFromFishbone(c)) {
              <div class="summary-section">
                <label class="summary-label">Selected Root Cause</label>
                <div class="summary-box">{{ rootCauseFromFishbone(c) }}</div>
              </div>
            }

            <div class="save-row">
              <button class="btn btn-primary" (click)="saveFishboneToD4(c)">
                <i class="bi bi-check2 me-1"></i> Save to D4
              </button>
            </div>
          </div>
        }

      </div>
    </div>
    }

    @if (!capa()) {
      <div style="padding:40px;text-align:center;color:#94A3B8">CAPA not found.</div>
    }

    @if (toast()) {
      <div class="toast-pill">{{ toast() }}</div>
    }
  `,
  styles: [`
    .rc-layout { display:flex; flex-direction:column; height:100%; }
    .rc-header { background:#fff; border-bottom:1px solid #E2E8F0; padding:16px 32px 0; flex-shrink:0; }
    .back-btn { background:none; border:none; color:#2563EB; font-size:.82rem; cursor:pointer; padding:0 0 10px; display:flex; align-items:center; }
    .header-row { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:12px; }
    .page-title { font-size:1.3rem; font-weight:700; color:#0F172A; margin:0 0 2px; }
    .page-sub { font-size:.83rem; color:#64748B; margin:0; }

    .tab-bar { display:flex; gap:0; border-bottom:none; }
    .tab-btn { background:none; border:none; border-bottom:3px solid transparent; padding:10px 18px; font-size:.87rem; color:#64748B; cursor:pointer; transition:all .15s; }
    .tab-btn.active { color:#2563EB; border-bottom-color:#2563EB; font-weight:600; }
    .tab-btn:hover { color:#374151; }

    .rc-body { flex:1; overflow-y:auto; padding:28px 32px; background:#F8FAFC; }
    .tab-content { max-width:960px; }

    /* Problem callout */
    .problem-callout { background:#EFF6FF; border:1px solid #BFDBFE; border-radius:8px; padding:12px 16px; margin-bottom:24px; }
    .callout-label { font-size:.72rem; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:#1D4ED8; display:block; margin-bottom:4px; }
    .callout-text { font-size:.87rem; color:#1E293B; margin:0; line-height:1.6; }

    /* 5-Why chain */
    .why-chain-full { max-width:680px; }
    .why-block { display:flex; gap:16px; align-items:flex-start; }
    .why-num { font-size:.8rem; font-weight:700; color:#1E40AF; background:#EFF6FF; padding:4px 10px; border-radius:6px; white-space:nowrap; margin-top:4px; min-width:52px; text-align:center; }
    .why-fields { flex:1; display:flex; flex-direction:column; gap:4px; }
    .arrow-connector { text-align:center; color:#94A3B8; font-size:1.1rem; }
    .chain-arrow { text-align:center; margin:8px 0; color:#94A3B8; }

    .summary-section { margin-top:24px; background:#fff; border-radius:8px; padding:16px; border:1px solid #E2E8F0; }
    .summary-label { font-size:.72rem; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:#64748B; display:block; margin-bottom:8px; }
    .summary-box { background:#EFF6FF; border:1px solid #BFDBFE; border-radius:6px; padding:10px 14px; font-size:.87rem; color:#1D4ED8; line-height:1.6; }

    .save-row { margin-top:20px; }

    /* Fishbone */
    .fishbone-subtitle { font-size:.85rem; color:#64748B; margin-bottom:20px; }
    .fishbone-grid { display:grid; grid-template-columns:repeat(3, 1fr); gap:16px; margin-bottom:24px; }
    .fishbone-card { background:#fff; border-radius:8px; border:1px solid #E2E8F0; overflow:hidden; }
    .cat-header { padding:8px 12px; display:flex; align-items:center; justify-content:space-between; color:#fff; font-size:.83rem; font-weight:700; }
    .add-cause-btn { background:rgba(255,255,255,.2); border:none; color:#fff; font-size:.72rem; cursor:pointer; padding:2px 8px; border-radius:99px; }
    .add-cause-btn:hover { background:rgba(255,255,255,.35); }
    .cause-list { padding:8px 10px; min-height:60px; }
    .cause-item { display:flex; align-items:center; gap:6px; padding:4px 0; border-bottom:1px solid #F1F5F9; }
    .cause-item:last-child { border-bottom:none; }
    .cause-radio { accent-color:#059669; cursor:pointer; }
    .cause-text { font-size:.8rem; color:#374151; flex:1; }
    .cause-text.is-root { color:#059669; font-weight:600; }
    .rm-cause { background:none; border:none; color:#CBD5E1; cursor:pointer; font-size:.8rem; padding:0; }
    .rm-cause:hover { color:#DC2626; }
    .no-cause { font-size:.77rem; color:#CBD5E1; font-style:italic; }

    .toast-pill {
      position:fixed; bottom:24px; right:24px; z-index:9999;
      background:#1E293B; color:#fff; padding:10px 20px; border-radius:8px;
      font-size:.87rem; box-shadow:0 4px 16px rgba(0,0,0,.2);
    }
  `],
})
export class CapaRootCauseComponent {
  readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly mock = inject(MockDataService);

  activeTab = signal<RcTab>('5why');
  toast = signal('');
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  readonly fishboneCats = FISHBONE_CATS;

  readonly capa = computed(() => {
    const id = this.route.snapshot.paramMap.get('id');
    return id ? this.mock.getCapa8d(id) : undefined;
  });

  whyRows(c: CAPA8D) { return c.d4?.whyRows ?? []; }

  addWhy(c: CAPA8D): void {
    const whyRows = [...this.whyRows(c), { why: '', answer: '' }];
    this.mock.updateCapa8d(c.id, { d4: { ...(c.d4!), whyRows } });
  }

  updateWhy(c: CAPA8D, idx: number, field: string, val: string): void {
    const whyRows = this.whyRows(c).map((r, i) => i === idx ? { ...r, [field]: val } : r);
    this.mock.updateCapa8d(c.id, { d4: { ...(c.d4!), whyRows } });
  }

  lastAnswer(c: CAPA8D): string {
    const rows = this.whyRows(c);
    for (let i = rows.length - 1; i >= 0; i--) {
      if (rows[i].answer) return rows[i].answer;
    }
    return '';
  }

  saveToD4(c: CAPA8D): void {
    const rootCauseStatement = this.lastAnswer(c) || c.d4?.rootCauseStatement || '';
    this.mock.updateCapa8d(c.id, { d4: { ...(c.d4!), rootCauseStatement } });
    this.showToast('5-Why analysis saved to D4.');
  }

  getCauses(c: CAPA8D, cat: keyof import('../../../shared/interfaces/models').CapaFishbone): CapaFishboneCause[] {
    return c.d4?.fishbone?.[cat] ?? [];
  }

  addCause(c: CAPA8D, cat: keyof import('../../../shared/interfaces/models').CapaFishbone): void {
    const causes = [...this.getCauses(c, cat), { id: 'fb_' + Date.now(), text: 'New cause', isRoot: false }];
    const fishbone = { ...(c.d4?.fishbone ?? { man:[], machine:[], method:[], material:[], measurement:[], nature:[] }), [cat]: causes };
    this.mock.updateCapa8d(c.id, { d4: { ...(c.d4!), fishbone } });
  }

  removeCause(c: CAPA8D, cat: keyof import('../../../shared/interfaces/models').CapaFishbone, id: string): void {
    const causes = this.getCauses(c, cat).filter((ca: CapaFishboneCause) => ca.id !== id);
    const fishbone = { ...(c.d4!.fishbone), [cat]: causes };
    this.mock.updateCapa8d(c.id, { d4: { ...(c.d4!), fishbone } });
  }

  setRootCause(c: CAPA8D, cat: keyof import('../../../shared/interfaces/models').CapaFishbone, id: string): void {
    const allCats: (keyof import('../../../shared/interfaces/models').CapaFishbone)[] = ['man', 'machine', 'method', 'material', 'measurement', 'nature'];
    const fishbone = { ...c.d4!.fishbone };
    allCats.forEach(k => {
      fishbone[k] = (fishbone[k] ?? []).map((ca: CapaFishboneCause) => ({ ...ca, isRoot: k === cat && ca.id === id }));
    });
    this.mock.updateCapa8d(c.id, { d4: { ...(c.d4!), fishbone } });
  }

  rootCauseFromFishbone(c: CAPA8D): string {
    const allCats: (keyof import('../../../shared/interfaces/models').CapaFishbone)[] = ['man', 'machine', 'method', 'material', 'measurement', 'nature'];
    for (const k of allCats) {
      const root = (c.d4?.fishbone?.[k] ?? []).find((ca: CapaFishboneCause) => ca.isRoot);
      if (root) return root.text;
    }
    return '';
  }

  saveFishboneToD4(c: CAPA8D): void {
    const rootCauseStatement = this.rootCauseFromFishbone(c) || c.d4?.rootCauseStatement || '';
    this.mock.updateCapa8d(c.id, { d4: { ...(c.d4!), rootCauseStatement } });
    this.showToast('Fishbone analysis saved to D4.');
  }

  showToast(msg: string): void {
    this.toast.set(msg);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(''), 3000);
  }
}
