import { Component, signal, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-document-viewer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mobile-viewer">
      <!-- Top bar -->
      <div class="viewer-topbar">
        <button class="back-btn" onclick="history.back()">
          <i class="bi bi-arrow-left"></i>
        </button>
        <div class="topbar-logo">
          <div class="logo-mark"><span>Q</span></div>
          <span>Qualvora</span>
        </div>
        <div style="width:40px"></div>
      </div>

      <!-- Document header -->
      <div class="doc-header">
        <h1 class="doc-title">{{ docTitle }}</h1>
        <div class="doc-meta">
          <span class="meta-badge">Rev {{ docRev }}</span>
          <span class="meta-badge meta-released">Released</span>
          <span class="meta-date">{{ docDate }}</span>
        </div>
      </div>

      <!-- PDF placeholder -->
      <div class="pdf-area">
        <div class="pdf-placeholder">
          <i class="bi bi-file-earmark-pdf"></i>
          <p>{{ docTitle }}.pdf</p>
          <small>Pinch to zoom · Swipe to scroll</small>
        </div>
      </div>

      <!-- Acknowledge bar (sticky bottom) -->
      @if (pendingAck() && !acknowledged()) {
        <div class="ack-bar">
          <div class="ack-text">
            <i class="bi bi-info-circle me-2 text-primary"></i>
            Acknowledge you have read Rev {{ docRev }}
          </div>
          <button class="ack-btn" (click)="acknowledge()">
            Acknowledge
          </button>
        </div>
      }

      @if (acknowledged()) {
        <div class="ack-done">
          <div class="ack-check">
            <i class="bi bi-check-lg"></i>
          </div>
          <span class="ack-confirmed">Acknowledged</span>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .mobile-viewer {
      min-height: 100vh; background: #F8FAFC;
      display: flex; flex-direction: column;
      max-width: 390px; margin: 0 auto;
      position: relative;
    }

    /* ── TOP BAR ─────────────────────────────────────────── */
    .viewer-topbar {
      height: 56px; background: #fff; border-bottom: 1px solid #E2E8F0;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 16px; position: sticky; top: 0; z-index: 10;
    }
    .back-btn {
      width: 40px; height: 40px; border: none; background: none;
      font-size: 20px; color: #1E293B; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      border-radius: 8px;
    }
    .back-btn:hover { background: #F1F5F9; }
    .topbar-logo {
      display: flex; align-items: center; gap: 8px;
      font-size: 16px; font-weight: 700; color: #0F172A;
    }
    .logo-mark {
      width: 28px; height: 28px; background: #2563EB; border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; font-weight: 800; color: #fff;
    }

    /* ── DOC HEADER ──────────────────────────────────────── */
    .doc-header {
      padding: 16px; background: #fff; border-bottom: 1px solid #F1F5F9;
    }
    .doc-title { font-size: 18px; font-weight: 700; color: #0F172A; margin-bottom: 8px; }
    .doc-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .meta-badge {
      display: inline-block; font-size: 12px; font-weight: 600;
      padding: 2px 8px; border-radius: 4px; background: #E2E8F0; color: #475569;
    }
    .meta-released { background: #DCFCE7; color: #15803D; }
    .meta-date { font-size: 12px; color: #94A3B8; }

    /* ── PDF AREA ─────────────────────────────────────────── */
    .pdf-area {
      flex: 1; display: flex; align-items: center; justify-content: center;
      padding: 16px; min-height: 60vh;
    }
    .pdf-placeholder {
      width: 100%; aspect-ratio: 210/297;
      background: #E2E8F0; border-radius: 8px;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 8px; color: #94A3B8;
    }
    .pdf-placeholder i { font-size: 40px; }
    .pdf-placeholder p { font-size: 13px; margin: 0; font-weight: 500; }
    .pdf-placeholder small { font-size: 11px; }

    /* ── ACKNOWLEDGE BAR ─────────────────────────────────── */
    .ack-bar {
      position: sticky; bottom: 0; background: #fff;
      box-shadow: 0 -4px 16px rgba(0,0,0,0.1);
      padding: 16px;
    }
    .ack-text { font-size: 13px; color: #475569; margin-bottom: 12px; }
    .ack-btn {
      width: 100%; height: 52px; border: none; border-radius: 12px;
      background: #16A34A; color: #fff; font-size: 16px; font-weight: 700;
      cursor: pointer; transition: background 0.2s;
    }
    .ack-btn:hover { background: #15803D; }

    .ack-done {
      position: sticky; bottom: 0; background: #F0FDF4;
      padding: 16px; display: flex; align-items: center; justify-content: center; gap: 10px;
      border-top: 1px solid #86EFAC;
    }
    .ack-check {
      width: 32px; height: 32px; border-radius: 50%; background: #16A34A;
      display: flex; align-items: center; justify-content: center;
      font-size: 16px; color: #fff;
    }
    .ack-confirmed { font-size: 15px; font-weight: 600; color: #15803D; }
  `]
})
export class DocumentViewerComponent implements OnInit {
  private route = inject(ActivatedRoute);

  docTitle = 'Assembly Work Instruction Rev C';
  docRev = 'C';
  docDate = 'Released 14 May 2026';
  readonly pendingAck = signal(true);
  readonly acknowledged = signal(false);

  ngOnInit(): void {
    const qr = this.route.snapshot.paramMap.get('qr');
    if (qr) {
      this.docTitle = qr.startsWith('WI-') ? 'Work Instruction — ' + qr : 'Document — ' + qr;
    }
  }

  acknowledge(): void {
    this.acknowledged.set(true);
  }
}
