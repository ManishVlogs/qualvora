// Configuration interfaces for the Document Detail page.
// All UI structure (tabs, actions, metadata fields, statuses) is defined here
// so the page renders from data rather than hardcoded logic.
// ConfigurationStorageService returns DocumentDetailPageConfig; swap in an API
// endpoint later without touching a single component line.

export interface TabConfig {
  key: string;
  label: string;
  icon: string;
  tooltip: string;
  requiredPermission?: string;
  showBadge?: boolean;
}

export interface ActionConfig {
  key: string;
  label: string;
  icon: string;
  tooltip: string;
  disabledTooltip: string;
  disabledStatusTooltip?: string;
  variant: 'primary' | 'secondary' | 'danger' | 'warning';
  requiredPermission: string;
  allowedStatuses?: string[];
  isOverflow?: boolean;
}

export interface MetadataFieldConfig {
  key: string;
  label: string;
  tooltip: string;
  section: 'details' | 'review';
  format: 'text' | 'date' | 'tier-badge' | 'user' | 'number-unit' | 'review-indicator';
  unit?: string;
  order: number;
}

export interface StatusBadgeConfig {
  value: string;
  chipClass: string;
  label: string;
  icon: string;
}

export interface WorkflowStageConfig {
  key: string;
  label: string;
  icon: string;
  statuses: string[];
  order: number;
  isTerminal?: boolean;
}

export interface ComplianceTagConfig {
  id: string;
  shortLabel: string;
  fullLabel: string;
  tooltip: string;
  colorClass: string;
}

export interface PdfViewerConfig {
  showToolbar: boolean;
  allowDownload: boolean;
  allowPrint: boolean;
  showWatermark: boolean;
  watermarkText: string;
}

export interface DocumentDetailPageConfig {
  tabs: TabConfig[];
  primaryActions: ActionConfig[];
  overflowActions: ActionConfig[];
  metadataFields: MetadataFieldConfig[];
  statuses: StatusBadgeConfig[];
  workflowStages: WorkflowStageConfig[];
  complianceTags: ComplianceTagConfig[];
  pdfViewer: PdfViewerConfig;
  maxContentWidth: string;
  showWorkflowBar: boolean;
  showComplianceTags: boolean;
  showHelpDrawer: boolean;
}
