import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/ui/services/toast.service';
import { MockDataService } from '../../../shared/services/mock-data.service';
import { AuthStore } from '../../../core/auth/stores/auth.store';
import { LpaResponse } from '../../../shared/interfaces/models';

type Response = 'yes' | 'no' | 'na' | null;

interface Question {
  id: number;
  questionId: string; // original LpaQuestion.id e.g. 'Q1'
  text: string;
  clause?: string;
}

const FALLBACK_QUESTIONS: Question[] = [
  { id: 1, questionId: 'Q1', text: 'Is the standard work documented and posted at the workstation?', clause: '8.5.1' },
  { id: 2, questionId: 'Q2', text: 'Are operators trained and certified on current revision?', clause: '7.2' },
  { id: 3, questionId: 'Q3', text: 'Is the control plan followed for this operation?', clause: '8.5.1' },
  { id: 4, questionId: 'Q4', text: 'Are gauges calibrated and within calibration due date?', clause: '7.1.5' },
  { id: 5, questionId: 'Q5', text: 'Is the reaction plan for out-of-control conditions defined and accessible?', clause: '8.3.2' },
  { id: 6, questionId: 'Q6', text: 'Is in-process inspection being performed at the required frequency?', clause: '8.6' },
  { id: 7, questionId: 'Q7', text: 'Are defect samples / limit samples available and clearly labeled?', clause: '8.5.1' },
  { id: 8, questionId: 'Q8', text: 'Is the nonconforming material area clearly identified and segregated?', clause: '8.7' },
  { id: 9, questionId: 'Q9', text: 'Is 5S maintained at the cell — sorted, straightened, swept, standardized?', clause: '6.3' },
  { id: 10, questionId: 'Q10', text: 'Are safety signage and PPE requirements followed by all operators?', clause: '7.1.4' },
];

interface FailItem { question: Question; comment: string; }

@Component({
  selector: 'app-lpa-runner',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="lpa-runner">
      @if (finished()) {
        <!-- FINISH / REVIEW SCREEN -->
        <div class="finish-screen">
          <div class="finish-header">
            <span class="fw-bold">{{ reviewMode ? 'LPA Review' : 'LPA Complete' }}</span>
            <button class="close-btn" (click)="location.back()">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          @if (reviewMode) {
            <div class="review-banner">
              <i class="bi bi-person-check me-1"></i>
              Submitted by <strong>{{ runOwner }}</strong>
              @if (runCompletedAt) {
                <span class="review-date"> · {{ runCompletedAt | date:'MMM d, y · h:mm a' }}</span>
              } @else if (runCompletedDate) {
                <span class="review-date"> · {{ runCompletedDate }}</span>
              }
            </div>
          }

          <div class="donut-wrap">
            <svg viewBox="0 0 80 80" width="120" height="120">
              <circle cx="40" cy="40" r="30" fill="none" stroke="#E2E8F0" stroke-width="8"/>
              <circle cx="40" cy="40" r="30" fill="none" stroke="#10B981" stroke-width="8"
                [attr.stroke-dasharray]="donutDash()"
                [attr.stroke-dashoffset]="donutOffset()"
                stroke-linecap="round" transform="rotate(-90 40 40)"/>
            </svg>
            <div class="donut-label">
              <div class="donut-pct">{{ passRate() }}%</div>
              <div class="donut-sub">Pass Rate</div>
            </div>
          </div>

          <div class="finish-stats">
            <div class="stat-pill pass">
              <span class="stat-count">{{ passCount() }}</span>
              <span class="stat-label">Pass</span>
            </div>
            <div class="stat-pill fail">
              <span class="stat-count">{{ failItems().length }}</span>
              <span class="stat-label">Fail</span>
            </div>
            <div class="stat-pill na">
              <span class="stat-count">{{ naCount() }}</span>
              <span class="stat-label">N/A</span>
            </div>
          </div>

          @if (reviewMode) {
            <!-- Show every question and what was selected -->
            <div class="review-list">
              <h6 class="fail-list-title">All Responses</h6>
              @for (item of allItems(); track item.question.id) {
                <div class="review-item"
                     [class.review-item-fail]="item.response === 'no'"
                     [class.review-item-na]="item.response === 'na'">
                  <div class="review-q-row">
                    <span class="review-badge"
                          [class.badge-pass]="item.response === 'yes'"
                          [class.badge-fail]="item.response === 'no'"
                          [class.badge-na]="item.response === 'na'"
                          [class.badge-blank]="!item.response">
                      {{ item.response === 'yes' ? 'Pass' : item.response === 'no' ? 'Fail' : item.response === 'na' ? 'N/A' : '—' }}
                    </span>
                    <span class="review-q-text">Q{{ item.question.id }}: {{ item.question.text }}</span>
                  </div>
                  @if (item.comment) {
                    <div class="fail-comment">"{{ item.comment }}"</div>
                  }
                </div>
              }
            </div>
          } @else {
            @if (failItems().length > 0) {
              <div class="fail-list">
                <h6 class="fail-list-title">Nonconformities</h6>
                @for (f of failItems(); track f.question.id) {
                  <div class="fail-item">
                    <div class="fail-q">Q{{ f.question.id }}: {{ f.question.text }}</div>
                    @if (f.comment) {
                      <div class="fail-comment">"{{ f.comment }}"</div>
                    }
                  </div>
                }
              </div>
            }
          }

          <div class="finish-actions">
            @if (reviewMode) {
              <button class="submit-btn back-btn" (click)="location.back()">
                <i class="bi bi-arrow-left me-2"></i>Back to Dashboard
              </button>
            } @else {
              <button class="submit-btn" (click)="submitRun()">
                <i class="bi bi-check-lg me-2"></i>Submit LPA Run
              </button>
            }
          </div>
        </div>
      } @else {
        <!-- QUESTION SCREEN -->
        <div class="runner-header">
          <span class="run-title">LPA Run — {{ runTitle }}</span>
          <button class="close-btn" (click)="location.back()">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <!-- Progress dots -->
        <div class="progress-area">
          <div class="progress-label">Question {{ currentIdx() + 1 }} of {{ totalQuestions }}</div>
          <div class="progress-dots">
            @for (q of questions; track q.id; let i = $index) {
              <div class="pdot"
                [class.answered]="responses()[i] !== null && responses()[i] !== undefined"
                [class.current]="i === currentIdx()"
                [class.fail-dot]="responses()[i] === 'no'">
              </div>
            }
          </div>
        </div>

        <!-- Question -->
        <div class="question-area">
          @if (currentQuestion().clause) {
            <div class="clause-tag">Clause {{ currentQuestion().clause }}</div>
          }
          <p class="question-text">{{ currentQuestion().text }}</p>
        </div>

        <!-- Response buttons -->
        <div class="response-buttons">
          <button class="resp-btn yes" [class.selected]="currentResponse() === 'yes'"
            (click)="setResponse('yes')">
            <i class="bi bi-check-circle me-2"></i>Yes — Conforms
          </button>
          <button class="resp-btn no" [class.selected]="currentResponse() === 'no'"
            (click)="setResponse('no')">
            <i class="bi bi-x-circle me-2"></i>No — Nonconformity
          </button>
          <button class="resp-btn na" [class.selected]="currentResponse() === 'na'"
            (click)="setResponse('na')">
            <i class="bi bi-dash-circle me-2"></i>N/A — Not Applicable
          </button>
        </div>

        <!-- Expanded NC detail -->
        @if (currentResponse() === 'no') {
          <div class="nc-detail">
            <label class="field-label">Comment <span class="req">*</span></label>
            <textarea class="form-control nc-textarea" rows="3"
              [(ngModel)]="ncComment"
              (blur)="saveProgress()"
              placeholder="Describe the nonconformity observed..."></textarea>
            <button class="photo-btn mt-2">
              <i class="bi bi-camera me-2"></i>Take Photo
            </button>
            <div class="ncr-toggle mt-3">
              <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" [(ngModel)]="createNcr" />
                <label class="form-check-label">Create NCR from this finding</label>
              </div>
            </div>
          </div>
        }

        <!-- Navigation -->
        <div class="runner-footer">
          <button class="nav-btn prev" (click)="prev()" [disabled]="currentIdx() === 0">
            <i class="bi bi-chevron-left me-1"></i>Prev
          </button>
          @if (currentIdx() < totalQuestions - 1) {
            <button class="nav-btn next" (click)="next()"
              [disabled]="currentResponse() === null || (currentResponse() === 'no' && !ncComment)">
              Next <i class="bi bi-chevron-right ms-1"></i>
            </button>
          } @else {
            <button class="nav-btn finish" (click)="finish()"
              [disabled]="currentResponse() === null || (currentResponse() === 'no' && !ncComment)">
              Finish <i class="bi bi-check ms-1"></i>
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .lpa-runner {
      min-height: 100vh; background: #fff;
      max-width: 390px; margin: 0 auto;
      display: flex; flex-direction: column;
    }

    /* ── HEADER ──────────────────────────────────────────── */
    .runner-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px; border-bottom: 1px solid #F1F5F9;
      position: sticky; top: 0; background: #fff; z-index: 10;
    }
    .run-title { font-size: 14px; font-weight: 600; color: #1E293B; }
    .close-btn { background: none; border: none; font-size: 18px; color: #64748B; cursor: pointer; }

    /* ── PROGRESS ─────────────────────────────────────────── */
    .progress-area { padding: 12px 16px; border-bottom: 1px solid #F8FAFC; }
    .progress-label { font-size: 12px; color: #94A3B8; margin-bottom: 8px; }
    .progress-dots { display: flex; gap: 4px; flex-wrap: wrap; }
    .pdot {
      width: 20px; height: 6px; border-radius: 3px; background: #E2E8F0; transition: background 0.2s;
    }
    .pdot.current { background: #2563EB; }
    .pdot.answered { background: #94A3B8; }
    .pdot.fail-dot { background: #EF4444; }

    /* ── QUESTION ─────────────────────────────────────────── */
    .question-area { padding: 20px 16px; flex: 1; }
    .clause-tag {
      display: inline-block; font-size: 11px; font-weight: 600;
      background: #F1F5F9; color: #64748B; padding: 2px 8px; border-radius: 4px; margin-bottom: 10px;
    }
    .question-text {
      font-size: 18px; font-weight: 500; color: #1E293B; line-height: 1.5;
    }

    /* ── RESPONSE BUTTONS ────────────────────────────────── */
    .response-buttons { padding: 0 16px; display: flex; flex-direction: column; gap: 8px; }
    .resp-btn {
      width: 100%; height: 56px; border-radius: 14px; border: 2px solid transparent;
      font-size: 15px; font-weight: 600; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.15s;
    }
    .resp-btn.yes { background: #F0FDF4; color: #16A34A; border-color: #86EFAC; }
    .resp-btn.yes.selected { background: #16A34A; color: #fff; border-color: #16A34A; }
    .resp-btn.no { background: #FFF1F2; color: #DC2626; border-color: #FCA5A5; }
    .resp-btn.no.selected { background: #DC2626; color: #fff; border-color: #DC2626; }
    .resp-btn.na { background: #F8FAFC; color: #64748B; border-color: #CBD5E1; }
    .resp-btn.na.selected { background: #64748B; color: #fff; border-color: #64748B; }

    /* ── NC DETAIL ───────────────────────────────────────── */
    .nc-detail {
      padding: 16px; background: #FFF1F2; margin: 12px 16px; border-radius: 12px;
      border: 1px solid #FCA5A5;
    }
    .nc-textarea { border-radius: 8px; font-size: 14px; }
    .field-label { font-size: 13px; font-weight: 600; color: #374151; display: block; margin-bottom: 6px; }
    .req { color: #EF4444; }
    .photo-btn {
      width: 100%; padding: 10px; border: 1px solid #FCA5A5; border-radius: 10px;
      background: #fff; color: #DC2626; font-size: 14px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
    }

    /* ── FOOTER ──────────────────────────────────────────── */
    .runner-footer {
      padding: 16px; border-top: 1px solid #F1F5F9;
      display: flex; gap: 12px; position: sticky; bottom: 0; background: #fff;
    }
    .nav-btn {
      flex: 1; height: 52px; border-radius: 14px;
      font-size: 15px; font-weight: 600; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
    }
    .nav-btn.prev { background: #F8FAFC; border: 1px solid #E2E8F0; color: #475569; }
    .nav-btn.next { background: #2563EB; border: none; color: #fff; }
    .nav-btn.finish { background: #16A34A; border: none; color: #fff; }
    .nav-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    /* ── FINISH SCREEN ───────────────────────────────────── */
    .finish-screen { display: flex; flex-direction: column; min-height: 100vh; }
    .finish-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px; border-bottom: 1px solid #F1F5F9;
    }
    .donut-wrap {
      display: flex; flex-direction: column; align-items: center; padding: 24px 16px 16px;
      position: relative;
    }
    .donut-label {
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) translateY(12px);
      text-align: center;
    }
    .donut-pct { font-size: 22px; font-weight: 800; color: #0F172A; }
    .donut-sub { font-size: 11px; color: #94A3B8; }
    .finish-stats { display: flex; gap: 12px; padding: 0 16px 16px; }
    .stat-pill {
      flex: 1; border-radius: 12px; padding: 12px; text-align: center;
    }
    .stat-pill.pass { background: #F0FDF4; }
    .stat-pill.fail { background: #FFF1F2; }
    .stat-pill.na { background: #F8FAFC; }
    .stat-count { display: block; font-size: 24px; font-weight: 800; color: #1E293B; }
    .stat-label { font-size: 12px; color: #64748B; }
    .fail-list { padding: 0 16px; flex: 1; }
    .fail-list-title { font-size: 13px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px; }
    .fail-item { background: #FFF1F2; border-radius: 10px; padding: 12px; margin-bottom: 8px; }
    .fail-q { font-size: 13px; color: #1E293B; font-weight: 500; }
    .fail-comment { font-size: 12px; color: #64748B; margin-top: 4px; font-style: italic; }
    .finish-actions { padding: 16px; }
    .submit-btn {
      width: 100%; height: 52px; border-radius: 14px; border: none;
      background: #16A34A; color: #fff; font-size: 15px; font-weight: 600; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
    }
    .back-btn { background: #2563EB; }

    /* ── REVIEW MODE ─────────────────────────────────────────── */
    .review-banner {
      margin: 0 16px 4px; padding: 10px 14px; background: #EFF6FF;
      border: 1px solid #BFDBFE; border-radius: 10px;
      font-size: 13px; color: #1D4ED8;
    }
    .review-date { color: #64748B; }
    .review-list { padding: 0 16px; flex: 1; }
    .review-item {
      padding: 10px 12px; border-radius: 10px; margin-bottom: 6px;
      background: #F8FAFC; border: 1px solid #E2E8F0;
    }
    .review-item-fail { background: #FFF1F2; border-color: #FCA5A5; }
    .review-item-na   { background: #F8FAFC; border-color: #E2E8F0; }
    .review-q-row { display: flex; align-items: flex-start; gap: 8px; }
    .review-badge {
      flex-shrink: 0; font-size: 10px; font-weight: 700; padding: 2px 7px;
      border-radius: 6px; margin-top: 1px; text-transform: uppercase; letter-spacing: 0.04em;
    }
    .badge-pass  { background: #DCFCE7; color: #166534; }
    .badge-fail  { background: #FEE2E2; color: #DC2626; }
    .badge-na    { background: #F1F5F9; color: #475569; }
    .badge-blank { background: #F1F5F9; color: #94A3B8; }
    .review-q-text { font-size: 13px; color: #1E293B; line-height: 1.4; }
  `]
})
export class LpaRunnerComponent implements OnInit {
  readonly router = inject(Router);
  readonly location = inject(Location);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);
  private mock = inject(MockDataService);
  private auth = inject(AuthStore);

  questions: Question[] = [...FALLBACK_QUESTIONS];
  get totalQuestions(): number { return this.questions.length; }
  runTitle = 'Cell 7 Daily';
  runOwner = '';
  runCompletedDate = '';
  runCompletedAt = '';
  reviewMode = false;
  private runId = '';
  readonly currentIdx = signal(0);
  readonly responses = signal<(Response | undefined)[]>(new Array(FALLBACK_QUESTIONS.length).fill(undefined));
  readonly finished = signal(false);
  createNcr = false;
  private runStarted = false;

  readonly currentQuestion = computed(() => this.questions[this.currentIdx()]);
  readonly currentResponse = computed(() => this.responses()[this.currentIdx()] ?? null);
  readonly donutCircumference = 2 * Math.PI * 30;

  // Stores one comment string per question index — persists across prev/next navigation
  private readonly ncComments = new Map<number, string>();
  get ncComment(): string { return this.ncComments.get(this.currentIdx()) ?? ''; }
  set ncComment(v: string) { this.ncComments.set(this.currentIdx(), v); }

  readonly passCount = computed(() => this.responses().filter(r => r === 'yes').length);
  readonly naCount = computed(() => this.responses().filter(r => r === 'na').length);
  readonly passRate = computed(() => {
    const answered = this.responses().filter(r => r !== null && r !== undefined).length;
    if (answered === 0) return 0;
    const pass = this.passCount();
    return Math.round((pass / answered) * 100);
  });
  readonly donutDash = computed(() => this.donutCircumference.toFixed(2));
  readonly donutOffset = computed(() => {
    const offset = this.donutCircumference * (1 - this.passRate() / 100);
    return offset.toFixed(2);
  });
  readonly failItems = computed((): FailItem[] =>
    this.questions
      .map((q, i) => ({ question: q, comment: this.ncComments.get(i) ?? '' }))
      .filter((_, i) => this.responses()[i] === 'no')
  );

  readonly allItems = computed(() =>
    this.questions.map((q, i) => ({
      question: q,
      response: this.responses()[i] as Response | undefined,
      comment: this.ncComments.get(i) ?? '',
    }))
  );

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.runId = id;

    // For synthesized IDs (LPA-SCH-*) the run doesn't exist in the store yet —
    // startLpaRun creates it so the look-up below can find it.
    // For existing runs we do NOT mark In Progress here; we do it lazily on the
    // first response so that opening then cancelling leaves the status unchanged.
    if (id.startsWith('LPA-SCH-')) {
      this.mock.startLpaRun(id);
    }

    const run = this.mock.lpaRuns.find(r => r.id === id);
    if (run) {
      this.runTitle = run.title;
      this.runOwner = run.owner;
      this.runCompletedDate = run.completedDate ?? '';
      this.runCompletedAt = run.completedAt ?? '';
      const templateQs = this.mock.getQuestionsForRun(id);
      if (templateQs) {
        this.questions = templateQs.map((q, i) => ({ id: i + 1, questionId: q.id, text: q.text, clause: q.clause }));
        this.responses.set(new Array(this.questions.length).fill(undefined));
      }

      // Restore stored responses (completed run or mid-run resume)
      if (run.responses?.length) {
        const restored = this.questions.map(q => {
          const saved = run.responses!.find(r => r.questionId === q.questionId);
          if (!saved) return undefined;
          return saved.answer === 'Pass' ? 'yes' : saved.answer === 'Fail' ? 'no' : 'na';
        });
        this.responses.set(restored as (Response | undefined)[]);
        run.responses.forEach(r => {
          if (r.answer === 'Fail' && r.note) {
            const idx = this.questions.findIndex(q => q.questionId === r.questionId);
            if (idx >= 0) this.ncComments.set(idx, r.note);
          }
        });
      }

      // Completed runs open directly in review mode — no re-submission allowed
      if (run.status === 'Completed') {
        this.reviewMode = true;
        this.finished.set(true);
      }

      // In-progress resume: jump to the first unanswered question
      if (run.status === 'In Progress') {
        this.runStarted = true;
        const firstUnanswered = this.responses().findIndex(r => r === undefined || r === null);
        if (firstUnanswered > 0) this.currentIdx.set(firstUnanswered);
      }
    } else {
      this.runTitle = `Run ${id}`;
    }
  }

  setResponse(r: Response): void {
    if (!this.runStarted) {
      this.mock.startLpaRun(this.runId);
      this.runStarted = true;
    }
    if (r !== 'no') this.ncComments.delete(this.currentIdx());
    this.responses.update(arr => {
      const copy = [...arr];
      copy[this.currentIdx()] = r;
      return copy;
    });
    this.saveProgress();
  }

  saveProgress(): void {
    if (!this.runId || this.reviewMode) return;
    const answered = this.responses().filter(r => r !== null && r !== undefined).length;
    const completionRate = this.totalQuestions > 0
      ? Math.round((answered / this.totalQuestions) * 100)
      : 0;
    this.mock.saveLpaResponses(this.runId, this.buildLpaResponses(), completionRate);
  }

  private buildLpaResponses(): LpaResponse[] {
    return this.questions
      .map((q, i) => {
        const r = this.responses()[i];
        if (r == null) return null;
        const answer = r === 'yes' ? 'Pass' : r === 'no' ? 'Fail' : 'NA';
        const note = r === 'no' ? (this.ncComments.get(i) || undefined) : undefined;
        return { questionId: q.questionId, answer, note } as LpaResponse;
      })
      .filter((x): x is LpaResponse => x !== null);
  }

  next(): void {
    if (this.currentIdx() < this.totalQuestions - 1)
      this.currentIdx.update(i => i + 1);
  }

  prev(): void {
    if (this.currentIdx() > 0)
      this.currentIdx.update(i => i - 1);
  }

  finish(): void { this.finished.set(true); }

  submitRun(): void {
    if (this.runId) {
      const currentUser = this.auth.currentUser();
      const run = this.mock.lpaRuns.find(r => r.id === this.runId);
      const isReviewing = currentUser && run && run.ownerId !== currentUser.id;

      this.mock.completeLpaRun(
        this.runId,
        this.passRate(),
        isReviewing ? `${currentUser!.firstName} ${currentUser!.lastName}` : undefined,
        isReviewing ? `${currentUser!.firstName[0]}${currentUser!.lastName[0]}` : undefined,
        this.buildLpaResponses(),
      );
    }
    this.toast.show('LPA Run submitted', 'success');
    setTimeout(() => this.location.back(), 1000);
  }
}
