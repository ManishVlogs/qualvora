// ── 8D Problem Resolution — IATF 16949 §10.2 ────────────────────────────────

export type EightDSourceType =
  | 'Customer Complaint'
  | 'Internal NCR'
  | 'Supplier NCR'
  | 'Audit Finding'
  | 'Warranty Claim'
  | 'Manual';

export type EightDStatus = 'Draft' | 'Open' | 'Pending Closure' | 'Closed' | 'Cancelled';
export type EightDSeverity = 'Critical' | 'Major' | 'Minor';
export type EightDDiscipline = 'D1' | 'D2' | 'D3' | 'D4' | 'D5' | 'D6' | 'D7' | 'D8';
export type OnTimeStatus8D = 'on-track' | 'at-risk' | 'overdue';
export type ValidationResult = 'Pass' | 'Fail' | 'Pending';
export type RootCauseCategory =
  | 'Process Failure'
  | 'Human Error'
  | 'Supplier Issue'
  | 'Design Issue'
  | 'Equipment Failure'
  | 'Training Gap'
  | 'Documentation Gap'
  | 'Measurement System';

export type ActionPriority = 'Critical' | 'High' | 'Medium' | 'Low';
export type ActionStatus8D = 'Open' | 'In Progress' | 'Complete' | 'Verified' | 'Overdue';
export type ValidationType =
  | 'Capability Study'
  | 'Audit Verification'
  | 'SPC Monitoring'
  | 'Customer Approval'
  | 'Trial Run'
  | 'Production Run'
  | 'Lab Test';

export interface EightDTeamMember {
  id: string; name: string; initials: string; color: string;
  role: string; department: string; email: string; isLead?: boolean;
}

export interface EightDAttachment {
  id: string; name: string; type: 'photo' | 'pdf' | 'email' | 'report' | 'document';
  size: string; uploadedBy: string; uploadedAt: string; url?: string;
}

export interface EightDActivity {
  id: string; actor: string; actorInitials: string; actorColor: string;
  action: string; detail?: string; discipline?: EightDDiscipline;
  timestamp: string; timeAgo: string;
}

export interface EightDLinkedRecord {
  type: 'NCR' | 'Complaint' | 'CAPA' | 'Audit Finding' | 'Supplier Issue' | 'PFMEA' | 'Control Plan' | 'Training Record' | 'Warranty';
  id: string; title: string; status: string; route: string;
}

export interface EightD_D1 {
  teamLeader: string; teamLeaderInitials: string; teamLeaderColor: string;
  champion: string; championInitials: string; championColor: string;
  members: EightDTeamMember[]; formedAt: string;
}

export interface EightD_D2 {
  what: string; where: string; when: string; who: string;
  howMany: string; howOften: string; impact: string;
  problemStatement: string; customerReference?: string;
  attachments: EightDAttachment[];
}

export interface EightDContainmentAction {
  id: string; action: string;
  type: 'Production Stop' | 'Stock Segregation' | 'Customer Notification' | 'Supplier Notification' | 'Additional Inspection' | 'Quarantine' | 'Sort & Rework' | 'Other';
  owner: string; ownerInitials: string; ownerColor: string;
  dueDate: string; completedDate?: string; status: 'Open' | 'Complete' | 'Verified'; evidence?: string;
}

export interface EightD_D3 {
  actions: EightDContainmentAction[];
  affectedInventoryQty: number; blockedInventoryQty: number; customerShipmentsHeld: number;
  containmentEffective?: boolean; effectivenessNote?: string; completedAt?: string;
}

export interface EightDWhyRow { level: number; why: string; answer: string; }

export interface EightDFishboneCause { id: string; text: string; isRoot: boolean; }

export interface EightDFishbone {
  man: EightDFishboneCause[]; machine: EightDFishboneCause[]; method: EightDFishboneCause[];
  material: EightDFishboneCause[]; measurement: EightDFishboneCause[]; environment: EightDFishboneCause[];
}

export interface EightD_D4 {
  method: '5-Why' | 'Fishbone' | 'Both';
  whyRows: EightDWhyRow[]; fishbone: EightDFishbone;
  rootCauseStatement: string; escapePoint: string; escapeRootCause: string;
  rootCauseCategory: RootCauseCategory; verifiedBy?: string; verifiedAt?: string;
}

export interface EightDAction {
  id: string; description: string; owner: string; ownerInitials: string; ownerColor: string;
  dueDate: string; completedDate?: string; priority: ActionPriority; status: ActionStatus8D;
  evidence?: string; verifiedBy?: string;
}

export interface EightD_D5 { actions: EightDAction[]; }

export interface EightDValidation {
  id: string; method: ValidationType; description: string;
  owner: string; ownerInitials: string; ownerColor: string;
  dueDate: string; completedDate?: string; result: ValidationResult; notes?: string; evidence?: string;
}

export interface EightD_D6 {
  implementationDate?: string; validations: EightDValidation[];
  overallResult?: ValidationResult; approvedBy?: string; approvedAt?: string;
}

export interface EightDSystematicItem {
  id: string; label: string; checked: boolean; owner?: string; completedDate?: string; evidence?: string;
}

export interface EightD_D7 {
  items: EightDSystematicItem[]; completionPct: number;
  lessonsLearned: string; horizontalDeployment: string; riskAssessment?: string;
}

export interface EightD_D8 {
  closureSummary: string; customerApproval: 'Pending' | 'Approved' | 'Not Required';
  customerApprovedBy?: string; customerApprovedAt?: string;
  lessonsLearned: string; recognitionNotes?: string; teamCelebrated: boolean;
  closedAt?: string; closedBy?: string;
}

export interface EightDEffectiveness {
  id: string; eightDId: string; verificationDate: string;
  auditor: string; auditorInitials: string; auditorColor: string;
  method: string; result: 'Pass' | 'Fail' | 'Pending';
  defectReoccurrence: boolean; reoccurrenceDetails?: string;
  customerFeedback?: string; nextVerificationDate?: string; notes?: string;
}

export interface EightD {
  id: string; title: string; sourceType: EightDSourceType;
  sourceId?: string; sourceTitle?: string; customer?: string; customerContact?: string;
  site: string; siteId: string; product: string; partNumber: string;
  severity: EightDSeverity; owner: string; ownerInitials: string; ownerColor: string;
  dueDate: string; createdAt: string; closedAt?: string;
  status: EightDStatus; activeStep: EightDDiscipline; completedSteps: EightDDiscipline[];
  onTimeStatus: OnTimeStatus8D; daysOpen: number; daysInCurrentStep: number; completionPct: number;
  isCustomerFacing: boolean; isSupplierFacing: boolean;
  effectivenessPending: boolean; effectivenessResult?: 'Pass' | 'Fail';
  linkedRecords: EightDLinkedRecord[]; attachments: EightDAttachment[]; activity: EightDActivity[];
  d1?: EightD_D1; d2?: EightD_D2; d3?: EightD_D3; d4?: EightD_D4;
  d5?: EightD_D5; d6?: EightD_D6; d7?: EightD_D7; d8?: EightD_D8;
  effectiveness?: EightDEffectiveness;
}
