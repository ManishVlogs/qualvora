// ── Users ─────────────────────────────────────────────────────────────────────
export interface QUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: 'QM' | 'QE' | 'Director' | 'Supervisor' | 'Admin' | 'PM' | 'ME' | 'QT' | 'QS' | 'Operator';
  siteId: string;
  initials: string;
  avatarColor: string;
}

// ── Sites ─────────────────────────────────────────────────────────────────────
export interface Site {
  id: string;
  name: string;
  code: string;
  location: string;
  timezone: string;
}

// ── Documents ─────────────────────────────────────────────────────────────────
export type DocumentStatus = 'Draft' | 'In Approval' | 'Released' | 'Superseded' | 'Obsolete';

export interface QDocument {
  id: string;           // DOC-0001
  title: string;
  revision: string;
  type: 'Work Instruction' | 'Control Plan' | 'Quality Procedure' | 'Form' | 'PFMEA' | 'MSA Study';
  status: DocumentStatus;
  owner: string;
  ownerInitials: string;
  lastReviewed: string;
  nextReview: string;
  siteId: string;
  daysUntilReview: number;
  fileUrl?: string;
  // Extended metadata
  clauses?: string[];
  areas?: string;
  parts?: string;
  reviewCycle?: number;
  revisions?: DocRevision[];
  recipients?: DistributionRecipient[];
  history?: DocHistoryItem[];
}

// ── NCRs ──────────────────────────────────────────────────────────────────────
export type NcrStatus = 'Open' | 'Under Review' | 'Dispositioned' | 'Closed' | 'Voided';
export type Severity = 'Major' | 'Minor' | 'OFI';
export type DispositionType = 'Use-As-Is' | 'Rework' | 'Repair' | 'Scrap' | 'Return to Supplier' | 'Regrade' | '';

export interface NCR {
  id: string;           // NCR-2026-0147
  title: string;
  description: string;
  status: NcrStatus;
  severity: Severity;
  owner: string;
  ownerInitials: string;
  ownerColor?: string;
  siteId: string;
  createdAt: string;
  dueDate: string;
  disposition?: DispositionType;
  source: 'Internal' | 'Customer' | 'Supplier' | 'Audit';
  ageInDays: number;
  partNumber?: string;
  defectCode?: string;
  qtyDefective?: number;
  qtyInspected?: number;
  customer?: string;
  customerRef?: string;
  area?: string;
  shift?: string;
  lot?: string;
  isCustomerFacing?: boolean;
  mrbRequired?: boolean;
  capaId?: string;
  complaintId?: string;
}

// ── CAPAs ─────────────────────────────────────────────────────────────────────
export type CapaStatus = 'Open' | 'Closed';

export interface CAPA {
  id: string;           // CAPA-2026-0032
  title: string;
  status: CapaStatus;
  currentStep: string;
  stepNumber: number;
  totalSteps: number;
  owner: string;
  ownerInitials: string;
  siteId: string;
  dueDate: string;
  createdAt: string;
  onTime: boolean;
  ncrId?: string;
  completionPct: number;
}

// ── Audits ────────────────────────────────────────────────────────────────────
export type AuditStatus = 'Planned' | 'In Progress' | 'Completed' | 'Cancelled';

export interface Audit {
  id: string;           // AUD-2026-011
  title: string;
  type: 'Internal Quality' | 'Process' | 'Supplier' | 'Customer' | 'Management Review';
  status: AuditStatus;
  auditor: string;
  auditorInitials: string;
  auditorColor: string;
  scheduledDate: string;
  completedDate?: string;
  siteId: string;
  findingCount: number;
  openFindingCount: number;
}

// ── Findings ──────────────────────────────────────────────────────────────────
export interface Finding {
  id: string;           // FND-2026-0045
  auditId: string;
  title: string;
  severity: Severity;
  status: 'Open' | 'Closed';
  owner: string;
  ownerInitials: string;
  dueDate: string;
  ageInDays: number;
  clauseRef?: string;
}

// ── LPA Runs ─────────────────────────────────────────────────────────────────
export type LpaRunStatus = 'Pending' | 'Completed' | 'Overdue' | 'In Progress';

export interface LpaResponse {
  questionId: string;
  answer: 'Pass' | 'Fail' | 'NA';
  note?: string;
}

export interface LPARun {
  id: string;           // LPA-2026-0088
  title: string;
  status: LpaRunStatus;
  owner: string;
  ownerInitials: string;
  ownerId: string;      // references AuthUser.id — used for per-user filtering
  dueDate: string;
  completedDate?: string;
  completedAt?: string;         // full ISO timestamp — used to display time alongside date
  siteId: string;
  completionRate: number;
  layer: 'L1' | 'L2' | 'L3';
  zone: string;
  responses?: LpaResponse[];    // per-question answers recorded during the run
  source?: 'scheduled' | 'adhoc';
  reviewedBy?: string;          // set when a higher-layer user co-signs another user's run
  reviewedByInitials?: string;
}

// ── Notifications ─────────────────────────────────────────────────────────────
// (uses AppNotification from notification.store)

// ── Work Items ────────────────────────────────────────────────────────────────
export type WorkItemType =
  | 'Document Approval'
  | 'NCR Disposition'
  | 'CAPA Review'
  | 'LPA Run'
  | 'Finding Response';

export type DueCategory = 'overdue' | 'today' | 'this-week';

export interface WorkItem {
  id: string;
  type: WorkItemType;
  entityId: string;
  title: string;
  owner: string;
  ownerInitials: string;
  ownerColor: string;
  ownerId: string;      // references QUser.id — used for per-user filtering
  siteId: string;
  dueDate: string;
  dueCategory: DueCategory;
  ageDays: number;
  actionLabel: string;
  route: string;
}

// ── Customer Complaints ───────────────────────────────────────────────────────
export type ComplaintStatus = 'Open' | 'Under Review' | 'Closed' | 'Rejected';

export interface CustomerComplaint {
  id: string;        // CC-2026-0001
  customer: string;
  customerRef: string;
  description: string;
  receivedDate: string;
  dueDate: string;
  ncrId?: string;
  status: ComplaintStatus;
  ageInDays: number;
}

// ── NCR Attachments ───────────────────────────────────────────────────────────
export interface NcrAttachment {
  id: string;
  ncrId: string;
  name: string;
  size: string;
  icon: string;
  color: string;
  uploadedBy: string;
  uploadedAt: string;
}

// ── NCR History Events ────────────────────────────────────────────────────────
export interface NcrHistoryEvent {
  id: string;
  ncrId: string;
  actor: string;
  initials: string;
  color: string;
  action: string;
  detail?: string;
  timestamp: string;
}

// ── NCR Containment Actions ───────────────────────────────────────────────────
export interface ContainmentAction {
  id: string;
  ncrId?: string;
  what: string;
  owner: string;
  ownerInitials: string;
  ownerColor: string;
  qty?: number;
  status: 'Open' | 'Verified';
  dueDate?: string;
  location?: string;
  completedDate?: string;
}

// ── Document Revisions ────────────────────────────────────────────────────────
export interface DocRevision {
  rev: string;
  status: DocumentStatus;
  releasedBy?: string;
  releasedDate?: string;
  changeSummary: string;
  title?: string;
  owner?: string;
  type?: string;
  reviewCycle?: number;
  clauses?: string[];
  areas?: string;
  siteId?: string;
}

// ── Approval Steps ────────────────────────────────────────────────────────────
export interface ApprovalStep {
  step: number;
  role: string;
  approver: string;
  approverInitials: string;
  approverColor: string;
  status: 'pending' | 'approved' | 'rejected';
  comment?: string;
  signedAt?: string;
}

// ── Distribution Recipients ───────────────────────────────────────────────────
export interface DistributionRecipient {
  id: string;
  name: string;
  role: string;
  initials: string;
  color: string;
  ackDate?: string;
  status: 'Acknowledged' | 'Pending' | 'Overdue';
}

// ── Document History ──────────────────────────────────────────────────────────
export interface DocHistoryItem {
  id: string;
  actor: string;
  actorInitials: string;
  actorColor: string;
  action: string;
  detail?: string;
  timestamp: string;
}

// ── Document Types & Chains ───────────────────────────────────────────────────
export interface ApprovalChainStep {
  step: number;
  role: string;
  requiresESign: boolean;
}

export interface DocType {
  id: string;
  name: string;
  tier: number;
  approvalChain: ApprovalChainStep[];
}

// ── CAPA 8D Extended Model ────────────────────────────────────────────────────
export type DStep = 'D0' | 'D1' | 'D2' | 'D3' | 'D4' | 'D5' | 'D6' | 'D7' | 'D8';
export type CapaOnTimeStatus = 'on-track' | 'at-risk' | 'overdue';

export interface CapaTeamMember { id: string; name: string; role: string; }
export interface CapaContainmentRow { id: string; action: string; owner: string; qty?: number; verified: boolean; verifiedDate?: string; }
export interface CapaWhyRow { why: string; answer: string; }
export interface CapaFishboneCause { id: string; text: string; isRoot: boolean; }
export interface CapaFishbone {
  man: CapaFishboneCause[]; machine: CapaFishboneCause[]; method: CapaFishboneCause[];
  material: CapaFishboneCause[]; measurement: CapaFishboneCause[]; nature: CapaFishboneCause[];
}
export interface CapaActionRow { id: string; description: string; owner: string; due: string; evidence?: string; }
export interface CapaEffCriteria { id: string; text: string; checked: boolean; evidence?: string; }

export interface CapaD0 { title: string; source: string; champion?: string; customer?: string; customerRef?: string; severity: string; dueDate: string; }
export interface CapaD1 { champion: string; team: CapaTeamMember[]; }
export interface CapaD2 {
  isWhat?: string; isNotWhat?: string; isWhere?: string; isNotWhere?: string;
  isWhen?: string; isNotWhen?: string; problemStatement: string;
}
export interface CapaD3 { actions: CapaContainmentRow[]; }
export interface CapaD4 { method: '5-Why' | 'Fishbone' | 'Other'; whyRows: CapaWhyRow[]; fishbone: CapaFishbone; rootCauseStatement: string; escapePoint: string; }
export interface CapaD5 { actions: CapaActionRow[]; }
export interface CapaD6 { actions: CapaActionRow[]; }
export interface CapaD7 { criteria: CapaEffCriteria[]; monitorStart?: string; monitorEnd?: string; monitorStatus?: string; results?: string; approvedBy?: string; approvedAt?: string; }
export interface CapaD8 { lessons: string; docsUpdated: boolean[]; teamNote: string; closed: boolean; closedAt?: string; }

export interface CAPA8D {
  id: string;
  title: string;
  status: 'Open' | 'Closed';
  ncrId?: string;
  complaintId?: string;
  champion: string;
  championInitials: string;
  championColor: string;
  teamAvatars: { initials: string; color: string }[];
  siteId: string;
  dueDate: string;
  createdAt: string;
  source: string;
  sourceType: 'NCR' | 'Customer Complaint' | 'Audit' | 'Internal';
  completedSteps: DStep[];
  activeStep: DStep;
  daysInCurrentStep: number;
  daysOpen: number;
  onTimeStatus: CapaOnTimeStatus;
  completionPct: number;
  d0?: CapaD0;
  d1?: CapaD1;
  d2?: CapaD2;
  d3?: CapaD3;
  d4?: CapaD4;
  d5?: CapaD5;
  d6?: CapaD6;
  d7?: CapaD7;
  d8?: CapaD8;
}

// ── Activity Feed ─────────────────────────────────────────────────────────────
export interface ActivityFeedItem {
  id: string;
  actor: string;
  actorInitials: string;
  actorColor: string;
  action: string;
  entityId: string;
  entityType: string;
  timeAgo: string;
  createdAt: string;
}

// ── Audit Module Extended Types (Phase 5) ─────────────────────────────────────
export type FindingGrade = 'Major' | 'Minor' | 'OFI';
export type FindingDetailStatus = 'Open' | 'Submitted' | 'Verified' | 'Closed';
export type AuditProgramType = 'System' | 'Process' | 'Product' | 'LPA';

export interface AuditFindingDetail {
  id: string;
  auditId: string;
  description: string;
  grade: FindingGrade;
  clauseRef: string;
  status: FindingDetailStatus;
  owner: string;
  ownerInitials: string;
  ownerColor: string;
  dueDate: string;
  ageInDays: number;
  response?: string;
  capaId?: string;
  evidenceCount: number;
}

export interface AuditChecklistItem {
  id: string;
  text: string;
  clauseRef: string;
  guidance: string;
  response: 'Conforms' | 'Nonconformity' | 'N/A' | null;
  findingId?: string;
  note?: string;
}

export interface AuditChecklistSection {
  id: string;
  title: string;
  clauseGroup: string;
  items: AuditChecklistItem[];
}

export interface AuditHistoryItem {
  id: string;
  actor: string;
  actorInitials: string;
  actorColor: string;
  action: string;
  detail?: string;
  timestamp: string;
}

export interface AuditDetail {
  id: string;
  title: string;
  type: string;
  status: AuditStatus;
  auditor: string;
  auditorInitials: string;
  auditorColor: string;
  auditee: string;
  auditeeInitials: string;
  auditeeColor: string;
  scheduledDate: string;
  completedDate?: string;
  siteId: string;
  scope: string;
  objectives: string;
  standard: string;
  sections: AuditChecklistSection[];
  findings: AuditFindingDetail[];
  history: AuditHistoryItem[];
}

export interface AuditProgramEntry {
  auditId: string;
  title: string;
  type: AuditProgramType;
  auditorInitials: string;
  processArea: string;
  month: number;
}

// ── LPA Extended Types (Phase 5) ──────────────────────────────────────────────
export interface LpaQuestion {
  id: string;
  text: string;
  clause?: string;
}

export interface LpaTemplate {
  id: string;
  name: string;
  layer: 'Operator' | 'Supervisor' | 'Manager';
  frequency: 'Daily' | 'Weekly' | 'Monthly';
  areas: string[];
  questions: LpaQuestion[];
}

export interface LpaScheduleEntry {
  id: string;
  templateId: string;
  templateName: string;
  layer: 'Operator' | 'Supervisor' | 'Manager';
  area: string;
  startDate: string;
  assignee: string;
  assigneeInitials: string;
  assigneeColor: string;
}
