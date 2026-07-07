import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  DocumentDetailPageConfig,
  TabConfig,
  ActionConfig,
  MetadataFieldConfig,
  StatusBadgeConfig,
  WorkflowStageConfig,
  ComplianceTagConfig,
  PdfViewerConfig,
} from '../interfaces/document-detail.config';

const CONFIG_KEY = 'q_doc_detail_config_v1';

// ── Default configuration ────────────────────────────────────────────────────
// Every tab, action, metadata field, status badge, and compliance tag is defined
// here. The component reads this object — nothing is hardcoded in the template.
// An admin can push config overrides to localStorage; a future API can replace
// the whole object without touching component code.

const DEFAULT_CONFIG: DocumentDetailPageConfig = {
  // ── Tabs ─────────────────────────────────────────────────────────────────
  tabs: [
    {
      key: 'content', label: 'Content', icon: 'bi-file-text',
      tooltip: 'View the document PDF and key metadata — owner, review due date, site, IATF clause references, and related documents.',
    },
    {
      key: 'revisions', label: 'Revisions', icon: 'bi-clock-history',
      tooltip: 'Full revision history: what changed, when it was released, and who authorized each version.',
    },
    {
      key: 'approvals', label: 'Approvals', icon: 'bi-patch-check',
      tooltip: 'Approval workflow for the current revision including e-signature records. Compliant with FDA 21 CFR Part 11.',
    },
    {
      key: 'distribution', label: 'Distribution & Receipts', icon: 'bi-send-check',
      tooltip: 'Controlled distribution — who received the document and who has formally acknowledged it. Required per IATF 16949 §7.5.3.',
      showBadge: true,
    },
    {
      key: 'clauses', label: 'Clauses & Links', icon: 'bi-link-45deg',
      tooltip: 'IATF 16949 clause references and cross-links to related documents in the quality document hierarchy.',
    },
    {
      key: 'history', label: 'Audit Trail', icon: 'bi-journal-text',
      tooltip: 'Immutable, tamper-evident log of every action on this document. Required for ISO 9001 §7.5 compliance.',
    },
  ] satisfies TabConfig[],

  // ── Primary toolbar actions ───────────────────────────────────────────────
  primaryActions: [
    {
      key: 'approve', label: 'Approve', icon: 'bi-patch-check-fill',
      tooltip: 'Review and provide a legally-binding e-signature. Required for this document to reach Released status (IATF 16949 §7.5.2).',
      disabledTooltip: 'Approving documents requires the Quality Manager or Director role. Contact your administrator to request this access.',
      disabledStatusTooltip: 'Approve is only available when the document is In Approval. This document is not yet in the approval queue — the document owner must submit it for approval first.',
      variant: 'primary', requiredPermission: 'doc.approve', allowedStatuses: ['In Approval'],
    },
    {
      key: 'revise', label: 'Revise', icon: 'bi-pencil',
      tooltip: 'Initiate a new revision. A draft copy is created for editing and must complete the full approval workflow before release.',
      disabledTooltip: 'Starting a revision requires the Quality Engineer, Manufacturing Engineer, Quality Manager, or Director role.',
      disabledStatusTooltip: 'Revise is only available on Released documents. This document must complete its current approval process and reach Released status before a new revision can be started.',
      variant: 'secondary', requiredPermission: 'doc.revise', allowedStatuses: ['Released'],
    },
    {
      key: 'distribute', label: 'Distribute', icon: 'bi-send',
      tooltip: 'Send controlled copies to designated personnel and track acknowledgments. Required per IATF 16949 §7.5.3.',
      disabledTooltip: 'Distributing documents requires QE, ME, QM, QS, or Director role.',
      variant: 'secondary', requiredPermission: 'doc.distribute',
    },
    {
      key: 'print', label: 'Print', icon: 'bi-printer',
      tooltip: 'Print a controlled copy. A "CONTROLLED COPY" watermark is applied per the document control procedure.',
      disabledTooltip: 'Printing requires the Document View permission.',
      variant: 'secondary', requiredPermission: 'doc.print',
    },
    {
      key: 'mobile', label: 'QR View', icon: 'bi-qr-code',
      tooltip: 'Open mobile/QR view. Post the QR code at the workstation so operators can scan to access the current revision.',
      disabledTooltip: 'Mobile view requires the Document View permission.',
      variant: 'secondary', requiredPermission: 'doc.mobile',
    },
  ] satisfies ActionConfig[],

  // ── Overflow (⋯) menu actions ─────────────────────────────────────────────
  overflowActions: [
    {
      key: 'compare', label: 'Compare Revisions', icon: 'bi-subtract',
      tooltip: 'Open a side-by-side diff of any two revisions to see exactly what changed.',
      disabledTooltip: 'Revision comparison requires the Document View permission.',
      variant: 'secondary', requiredPermission: 'doc.compare', isOverflow: true,
    },
    {
      key: 'export', label: 'Export Metadata', icon: 'bi-box-arrow-up',
      tooltip: 'Export document metadata to CSV for audit reporting or regulatory submissions.',
      disabledTooltip: 'Export requires the Quality Engineer or higher role.',
      variant: 'secondary', requiredPermission: 'doc.export', isOverflow: true,
    },
    {
      key: 'obsolete', label: 'Mark as Obsolete', icon: 'bi-archive',
      tooltip: 'Retire this document. It moves to the Obsolete archive and is no longer valid for production use.',
      disabledTooltip: 'Marking documents obsolete requires the Quality Manager role.',
      disabledStatusTooltip: 'A document can only be marked Obsolete when it is Released or Superseded. Draft and In Approval documents must first complete or be withdrawn from the approval workflow.',
      variant: 'danger', requiredPermission: 'doc.obsolete',
      allowedStatuses: ['Released', 'Superseded'], isOverflow: true,
    },
  ] satisfies ActionConfig[],

  // ── Metadata fields ───────────────────────────────────────────────────────
  metadataFields: [
    { key: 'type',       label: 'Document Type', section: 'details', format: 'text',             order: 1, tooltip: 'Category of this document in the QMS hierarchy (Work Instruction, Control Plan, etc.).' },
    { key: 'tier',       label: 'Tier',          section: 'details', format: 'tier-badge',        order: 2, tooltip: 'T2 = Quality Procedures & Control Plans · T3 = Work Instructions & MSA · T4 = Forms. Defined in the Document Control Procedure §4.1.' },
    { key: 'owner',      label: 'Owner',         section: 'details', format: 'user',              order: 3, tooltip: 'Responsible for maintaining this document, initiating revisions, and ensuring accuracy. Per IATF 16949 §7.5.2.' },
    { key: 'site',       label: 'Site',          section: 'details', format: 'text',              order: 4, tooltip: 'Manufacturing site or facility where this document is applicable and must be controlled.' },
    { key: 'areas',      label: 'Areas',         section: 'details', format: 'text',              order: 5, tooltip: 'Work areas or manufacturing zones within the site where this document applies.' },
    { key: 'parts',      label: 'Part Numbers',  section: 'details', format: 'text',              order: 6, tooltip: 'Specific part numbers or product families governed by this document.' },
    { key: 'nextReview', label: 'Review Due',    section: 'review',  format: 'review-indicator',  order: 7, tooltip: 'Document must be reviewed and reconfirmed or revised by this date. Required per ISO 9001 §7.5 and IATF 16949.' },
    { key: 'reviewCycle',label: 'Review Cycle',  section: 'review',  format: 'number-unit',       order: 8, unit: 'months', tooltip: 'How often this document must be formally reviewed, based on document criticality and change risk.' },
  ] satisfies MetadataFieldConfig[],

  // ── Status badges ─────────────────────────────────────────────────────────
  statuses: [
    { value: 'Draft',       chipClass: 'chip-minor',       label: 'Draft',       icon: 'bi-pencil-square'    },
    { value: 'In Approval', chipClass: 'chip-in-approval', label: 'In Approval', icon: 'bi-hourglass-split'  },
    { value: 'Released',    chipClass: 'chip-released',    label: 'Released',    icon: 'bi-check-circle-fill'},
    { value: 'Superseded',  chipClass: 'chip-superseded',  label: 'Superseded',  icon: 'bi-arrow-repeat'     },
    { value: 'Obsolete',    chipClass: 'chip-obsolete',    label: 'Obsolete',    icon: 'bi-archive-fill'     },
  ] satisfies StatusBadgeConfig[],

  // ── Workflow lifecycle stages ─────────────────────────────────────────────
  workflowStages: [
    { key: 'draft',    label: 'Draft',    icon: 'bi-pencil',           statuses: ['Draft'],                   order: 1 },
    { key: 'approval', label: 'Approval', icon: 'bi-hourglass-split',  statuses: ['In Approval'],             order: 2 },
    { key: 'released', label: 'Released', icon: 'bi-check-circle-fill',statuses: ['Released'],                order: 3 },
    { key: 'archived', label: 'Archived', icon: 'bi-archive',          statuses: ['Superseded', 'Obsolete'], order: 4, isTerminal: true },
  ] satisfies WorkflowStageConfig[],

  // ── Compliance standard tags ──────────────────────────────────────────────
  complianceTags: [
    {
      id: 'iatf', shortLabel: 'IATF 16949', fullLabel: 'IATF 16949:2016',
      tooltip: 'Governed under IATF 16949:2016 — Automotive Quality Management System. Document control per §7.5.',
      colorClass: 'tag-iatf',
    },
    {
      id: 'iso', shortLabel: 'ISO 9001', fullLabel: 'ISO 9001:2015',
      tooltip: 'Meets ISO 9001:2015 §7.5 documented information requirements: version control, approval authority, and controlled distribution.',
      colorClass: 'tag-iso',
    },
    {
      id: 'fda', shortLabel: '21 CFR §11', fullLabel: 'FDA 21 CFR Part 11',
      tooltip: 'Electronic signatures comply with FDA 21 CFR Part 11: unique user IDs, audit trail integrity, and timestamp authentication.',
      colorClass: 'tag-fda',
    },
  ] satisfies ComplianceTagConfig[],

  // ── PDF viewer options ────────────────────────────────────────────────────
  pdfViewer: {
    showToolbar: true,
    allowDownload: true,
    allowPrint: true,
    showWatermark: true,
    watermarkText: 'CONTROLLED COPY',
  } satisfies PdfViewerConfig,

  // ── Layout ────────────────────────────────────────────────────────────────
  maxContentWidth: '1400px',
  showWorkflowBar: true,
  showComplianceTags: true,
  showHelpDrawer: true,
};

// ── Service ──────────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class ConfigurationStorageService {
  private platformId = inject(PLATFORM_ID);

  private readonly _config = signal<DocumentDetailPageConfig>(this._load());

  readonly documentDetailConfig = this._config.asReadonly();

  private _load(): DocumentDetailPageConfig {
    if (!isPlatformBrowser(this.platformId)) return DEFAULT_CONFIG;
    try {
      const raw = localStorage.getItem(CONFIG_KEY);
      if (!raw) return DEFAULT_CONFIG;
      // Deep-merge stored overrides with defaults so new config keys always exist
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    } catch { return DEFAULT_CONFIG; }
  }

  saveOverrides(partial: Partial<DocumentDetailPageConfig>): void {
    const merged = { ...this._config(), ...partial };
    this._config.set(merged);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(merged));
    }
  }

  resetToDefaults(): void {
    this._config.set(DEFAULT_CONFIG);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(CONFIG_KEY);
    }
  }
}
