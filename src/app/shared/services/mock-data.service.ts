import { Injectable, PLATFORM_ID, inject, signal, computed } from '@angular/core';
import { SiteStore } from '../../core/stores/site.store';
import { isPlatformBrowser } from '@angular/common';
import {
  QUser,
  Site,
  QDocument,
  NCR,
  CAPA,
  Audit,
  Finding,
  LPARun,
  WorkItem,
  ActivityFeedItem,
  CustomerComplaint,
  ContainmentAction,
  NcrHistoryEvent,
  NcrAttachment,
  DocType,
  CAPA8D,
  AuditDetail,
  AuditFindingDetail,
  AuditChecklistSection,
  AuditHistoryItem,
  AuditProgramEntry,
  LpaTemplate,
  LpaQuestion,
  LpaScheduleEntry,
  LpaResponse,
} from '../interfaces/models';
import { AppNotification } from '../../core/notifications/stores/notification.store';

// ── Storage key ───────────────────────────────────────────────────────────────
const STORAGE_KEY = 'qualvora_demo_v2';

// ── Initial data constants ────────────────────────────────────────────────────

const INITIAL_USERS: QUser[] = [
  {
    id: 'USR-001',
    email: 'maria.delgado@qualvora.com',
    firstName: 'Maria',
    lastName: 'Delgado',
    fullName: 'Maria Delgado',
    role: 'QM',
    siteId: 'SITE-001',
    initials: 'MD',
    avatarColor: '#2563EB',
  },
  {
    id: 'USR-002',
    email: 'dev.patel@qualvora.com',
    firstName: 'Dev',
    lastName: 'Patel',
    fullName: 'Dev Patel',
    role: 'QE',
    siteId: 'SITE-001',
    initials: 'DP',
    avatarColor: '#7C3AED',
  },
  {
    id: 'USR-003',
    email: 'sarah.chen@qualvora.com',
    firstName: 'Sarah',
    lastName: 'Chen',
    fullName: 'Sarah Chen',
    role: 'Director',
    siteId: 'SITE-001',
    initials: 'SC',
    avatarColor: '#0891B2',
  },
  {
    id: 'USR-004',
    email: 'james.okonkwo@qualvora.com',
    firstName: 'James',
    lastName: 'Okonkwo',
    fullName: 'James Okonkwo',
    role: 'Supervisor',
    siteId: 'SITE-002',
    initials: 'JO',
    avatarColor: '#059669',
  },
  {
    id: 'USR-005',
    email: 'priya.nair@qualvora.com',
    firstName: 'Priya',
    lastName: 'Nair',
    fullName: 'Priya Nair',
    role: 'QE',
    siteId: 'SITE-002',
    initials: 'PN',
    avatarColor: '#DC2626',
  },
  {
    id: 'USR-006',
    email: 'tom.braswell@qualvora.com',
    firstName: 'Tom',
    lastName: 'Braswell',
    fullName: 'Tom Braswell',
    role: 'QM',
    siteId: 'SITE-003',
    initials: 'TB',
    avatarColor: '#B45309',
  },
  {
    id: 'USR-007',
    email: 'carlos.mendez@qualvora.com',
    firstName: 'Carlos',
    lastName: 'Mendez',
    fullName: 'Carlos Mendez',
    role: 'PM',
    siteId: 'SITE-002',
    initials: 'CM',
    avatarColor: '#0369A1',
  },
  {
    id: 'USR-008',
    email: 'aisha.williams@qualvora.com',
    firstName: 'Aisha',
    lastName: 'Williams',
    fullName: 'Aisha Williams',
    role: 'ME',
    siteId: 'SITE-003',
    initials: 'AW',
    avatarColor: '#7C3AED',
  },
  {
    id: 'USR-009',
    email: 'ravi.kumar@qualvora.com',
    firstName: 'Ravi',
    lastName: 'Kumar',
    fullName: 'Ravi Kumar',
    role: 'QT',
    siteId: 'SITE-001',
    initials: 'RK',
    avatarColor: '#059669',
  },
  {
    id: 'USR-010',
    email: 'lisa.park@qualvora.com',
    firstName: 'Lisa',
    lastName: 'Park',
    fullName: 'Lisa Park',
    role: 'Operator',
    siteId: 'SITE-002',
    initials: 'LP',
    avatarColor: '#DC2626',
  },
  // Plant-1 additions
  {
    id: 'USR-011',
    email: 'kevin.torres@qualvora.com',
    firstName: 'Kevin',
    lastName: 'Torres',
    fullName: 'Kevin Torres',
    role: 'PM',
    siteId: 'SITE-001',
    initials: 'KT',
    avatarColor: '#16A34A',
  },
  {
    id: 'USR-012',
    email: 'nina.brown@qualvora.com',
    firstName: 'Nina',
    lastName: 'Brown',
    fullName: 'Nina Brown',
    role: 'QS',
    siteId: 'SITE-001',
    initials: 'NB',
    avatarColor: '#D97706',
  },
  {
    id: 'USR-013',
    email: 'omar.hassan@qualvora.com',
    firstName: 'Omar',
    lastName: 'Hassan',
    fullName: 'Omar Hassan',
    role: 'ME',
    siteId: 'SITE-001',
    initials: 'OH',
    avatarColor: '#6366F1',
  },
  {
    id: 'USR-014',
    email: 'elena.petrov@qualvora.com',
    firstName: 'Elena',
    lastName: 'Petrov',
    fullName: 'Elena Petrov',
    role: 'Operator',
    siteId: 'SITE-001',
    initials: 'EP',
    avatarColor: '#0E7490',
  },
  // Plant-2 additions
  {
    id: 'USR-015',
    email: 'michael.zhang@qualvora.com',
    firstName: 'Michael',
    lastName: 'Zhang',
    fullName: 'Michael Zhang',
    role: 'Director',
    siteId: 'SITE-002',
    initials: 'MZ',
    avatarColor: '#1D4ED8',
  },
  {
    id: 'USR-016',
    email: 'sandra.kim@qualvora.com',
    firstName: 'Sandra',
    lastName: 'Kim',
    fullName: 'Sandra Kim',
    role: 'QM',
    siteId: 'SITE-002',
    initials: 'SK',
    avatarColor: '#7E22CE',
  },
  {
    id: 'USR-017',
    email: 'raj.sharma@qualvora.com',
    firstName: 'Raj',
    lastName: 'Sharma',
    fullName: 'Raj Sharma',
    role: 'ME',
    siteId: 'SITE-002',
    initials: 'RS',
    avatarColor: '#BE123C',
  },
  {
    id: 'USR-018',
    email: 'fatima.ali@qualvora.com',
    firstName: 'Fatima',
    lastName: 'Ali',
    fullName: 'Fatima Ali',
    role: 'QT',
    siteId: 'SITE-002',
    initials: 'FA',
    avatarColor: '#C2410C',
  },
  // Plant-3 additions
  {
    id: 'USR-019',
    email: 'david.osei@qualvora.com',
    firstName: 'David',
    lastName: 'Osei',
    fullName: 'David Osei',
    role: 'Director',
    siteId: 'SITE-003',
    initials: 'DO',
    avatarColor: '#065F46',
  },
  {
    id: 'USR-020',
    email: 'claire.novak@qualvora.com',
    firstName: 'Claire',
    lastName: 'Novak',
    fullName: 'Claire Novak',
    role: 'PM',
    siteId: 'SITE-003',
    initials: 'CN',
    avatarColor: '#9D174D',
  },
  {
    id: 'USR-021',
    email: 'wei.tanaka@qualvora.com',
    firstName: 'Wei',
    lastName: 'Tanaka',
    fullName: 'Wei Tanaka',
    role: 'QE',
    siteId: 'SITE-003',
    initials: 'WT',
    avatarColor: '#4338CA',
  },
  {
    id: 'USR-022',
    email: 'hana.brooks@qualvora.com',
    firstName: 'Hana',
    lastName: 'Brooks',
    fullName: 'Hana Brooks',
    role: 'QS',
    siteId: 'SITE-003',
    initials: 'HB',
    avatarColor: '#155E75',
  },
  {
    id: 'USR-023',
    email: 'dante.reyes@qualvora.com',
    firstName: 'Dante',
    lastName: 'Reyes',
    fullName: 'Dante Reyes',
    role: 'QT',
    siteId: 'SITE-003',
    initials: 'DR',
    avatarColor: '#7F1D1D',
  },
  {
    id: 'USR-024',
    email: 'yuki.stone@qualvora.com',
    firstName: 'Yuki',
    lastName: 'Stone',
    fullName: 'Yuki Stone',
    role: 'Operator',
    siteId: 'SITE-003',
    initials: 'YS',
    avatarColor: '#3730A3',
  },
];

const INITIAL_SITES: Site[] = [
  { id: 'SITE-001', name: 'Plant-1', code: 'P1', location: 'Detroit, MI', timezone: 'US/Eastern' },
  { id: 'SITE-002', name: 'Plant-2', code: 'P2', location: 'Toledo, OH', timezone: 'US/Eastern' },
  { id: 'SITE-003', name: 'Plant-3', code: 'P3', location: 'Lansing, MI', timezone: 'US/Eastern' },
];

const INITIAL_DOCUMENTS: QDocument[] = [
  {
    id: 'DOC-0001',
    title: 'Weld Station 4 Work Instruction',
    revision: 'C',
    type: 'Work Instruction',
    status: 'Released',
    owner: 'Dev Patel',
    ownerInitials: 'DP',
    lastReviewed: '2026-01-15',
    nextReview: '2027-01-15',
    siteId: 'SITE-001',
    daysUntilReview: 216,
    clauses: ['8.5.1', '8.5.6', '7.5.3'],
    areas: 'Weld Zone A',
    parts: 'Part 4471, Part 4472',
    reviewCycle: 24,
  },
  {
    id: 'DOC-0003',
    title: 'Control Plan – Body Side Assembly',
    revision: 'B',
    type: 'Control Plan',
    status: 'Released',
    owner: 'Maria Delgado',
    ownerInitials: 'MD',
    lastReviewed: '2025-11-20',
    nextReview: '2026-06-20',
    siteId: 'SITE-001',
    daysUntilReview: 7,
    clauses: ['8.5.2', '8.3.3', '7.1.5'],
    areas: 'Assembly Line 1',
    parts: 'Part 7810, Part 7811',
    reviewCycle: 12,
  },
  {
    id: 'DOC-0007',
    title: 'IATF 16949 Internal Audit Procedure',
    revision: 'A',
    type: 'Quality Procedure',
    status: 'In Approval',
    owner: 'Sarah Chen',
    ownerInitials: 'SC',
    lastReviewed: '2025-12-01',
    nextReview: '2026-12-01',
    siteId: 'SITE-001',
    daysUntilReview: 171,
    clauses: ['9.2', '4.1', '4.2'],
    areas: 'Quality Office',
    reviewCycle: 12,
  },
  {
    id: 'DOC-0012',
    title: 'MSA Study – Caliper Measurement',
    revision: 'D',
    type: 'MSA Study',
    status: 'Released',
    owner: 'Priya Nair',
    ownerInitials: 'PN',
    lastReviewed: '2025-10-10',
    nextReview: '2026-10-10',
    siteId: 'SITE-002',
    daysUntilReview: 119,
    clauses: ['7.1.5', '7.5.3'],
    areas: 'CMM Area',
    parts: 'Part 1147',
    reviewCycle: 24,
  },
  {
    id: 'DOC-0015',
    title: 'Dimensional Inspection Form – Part 1147',
    revision: 'A',
    type: 'Form',
    status: 'Draft',
    owner: 'Dev Patel',
    ownerInitials: 'DP',
    lastReviewed: '',
    nextReview: '',
    siteId: 'SITE-001',
    daysUntilReview: -1,
    clauses: ['8.6', '7.1.5'],
    areas: 'CMM Area',
    parts: 'Part 1147',
    reviewCycle: 12,
  },
  {
    id: 'DOC-0018',
    title: 'PFMEA – Stamping Line 2',
    revision: 'C',
    type: 'PFMEA',
    status: 'Released',
    owner: 'Tom Braswell',
    ownerInitials: 'TB',
    lastReviewed: '2025-09-05',
    nextReview: '2026-09-05',
    siteId: 'SITE-003',
    daysUntilReview: 84,
    clauses: ['8.3.3', '8.5.6'],
    areas: 'Stamping',
    parts: 'Part 9001, Part 9002',
    reviewCycle: 24,
  },
  {
    id: 'DOC-0021',
    title: 'Incoming Inspection Procedure',
    revision: 'B',
    type: 'Quality Procedure',
    status: 'Released',
    owner: 'James Okonkwo',
    ownerInitials: 'JO',
    lastReviewed: '2026-02-01',
    nextReview: '2027-02-01',
    siteId: 'SITE-002',
    daysUntilReview: 233,
    clauses: ['8.4.1', '8.2.3'],
    areas: 'Receiving Dock',
    reviewCycle: 12,
  },
  {
    id: 'DOC-0024',
    title: 'Customer Complaint Handling Procedure',
    revision: 'E',
    type: 'Quality Procedure',
    status: 'Superseded',
    owner: 'Maria Delgado',
    ownerInitials: 'MD',
    lastReviewed: '2025-06-01',
    nextReview: '2026-06-01',
    siteId: 'SITE-001',
    daysUntilReview: -12,
    clauses: ['10.2', '8.2.3'],
    areas: 'Quality Office',
    reviewCycle: 12,
  },
  {
    id: 'DOC-0030',
    title: 'Control Plan – Chassis Frame Weld',
    revision: 'A',
    type: 'Control Plan',
    status: 'In Approval',
    owner: 'Dev Patel',
    ownerInitials: 'DP',
    lastReviewed: '2026-05-01',
    nextReview: '2027-05-01',
    siteId: 'SITE-001',
    daysUntilReview: 352,
    clauses: ['8.5.2', '8.3.3'],
    areas: 'Weld Zone B',
    parts: 'Part 3300, Part 3301',
    reviewCycle: 12,
  },
  {
    id: 'DOC-0033',
    title: 'Paint Line SPC Procedure',
    revision: 'B',
    type: 'Quality Procedure',
    status: 'Released',
    owner: 'Priya Nair',
    ownerInitials: 'PN',
    lastReviewed: '2025-08-14',
    nextReview: '2026-08-14',
    siteId: 'SITE-002',
    daysUntilReview: 62,
    clauses: ['8.2.3', '7.5.3'],
    areas: 'Paint Shop',
    reviewCycle: 12,
  },
  {
    id: 'DOC-0037',
    title: 'Calibration Record Form – CMM-01',
    revision: 'A',
    type: 'Form',
    status: 'Released',
    owner: 'Tom Braswell',
    ownerInitials: 'TB',
    lastReviewed: '2026-03-20',
    nextReview: '2027-03-20',
    siteId: 'SITE-003',
    daysUntilReview: 280,
    clauses: ['7.1.5', '7.5.3'],
    areas: 'CMM Area',
    reviewCycle: 12,
  },
  {
    id: 'DOC-0041',
    title: 'New Supplier Qualification Procedure',
    revision: 'C',
    type: 'Quality Procedure',
    status: 'Draft',
    owner: 'Sarah Chen',
    ownerInitials: 'SC',
    lastReviewed: '',
    nextReview: '',
    siteId: 'SITE-001',
    daysUntilReview: -1,
    clauses: ['8.4.1', '6.1'],
    areas: 'Supply Chain Office',
    reviewCycle: 24,
  },
  {
    id: 'DOC-0042',
    title: 'Weld Parameter Spec – MIG Stations',
    revision: 'D',
    type: 'Work Instruction',
    status: 'Released',
    owner: 'Dev Patel',
    ownerInitials: 'DP',
    lastReviewed: '14 May 2026',
    nextReview: '2027-04-10',
    siteId: 'SITE-001',
    daysUntilReview: 301,
    clauses: ['8.5.1', '8.5.6', '7.5.3'],
    areas: 'Weld Zone A, Weld Zone B',
    parts: 'Part 4471, Part 4472',
    reviewCycle: 24,
    revisions: [
      { rev: 'D', status: 'Released', releasedDate: '14 May 2026', releasedBy: 'Dev Patel', changeSummary: 'Updated weld params Section 3.2; added post-weld check per NCR-2026-0100' },
      { rev: 'C', status: 'Superseded', releasedDate: '14 Nov 2025', releasedBy: 'Dev Patel', changeSummary: 'Revised wire feed speed range; added Layer 2 LPA reference' },
      { rev: 'B', status: 'Superseded', releasedDate: '2 Feb 2025', releasedBy: 'Dev Patel', changeSummary: 'Added MSA reference to calibration section' },
      { rev: 'A', status: 'Superseded', releasedDate: '14 Sep 2024', releasedBy: 'Maria Delgado', changeSummary: 'Initial release of weld parameter work instruction' },
    ],
    recipients: [
      { id: 'R1', name: 'James Okonkwo', role: 'Supervisor', initials: 'JO', color: '#059669', ackDate: '16 May 2026', status: 'Acknowledged' },
      { id: 'R2', name: 'Dev Patel', role: 'QE', initials: 'DP', color: '#7C3AED', ackDate: '15 May 2026', status: 'Acknowledged' },
      { id: 'R3', name: 'Priya Nair', role: 'QE', initials: 'PN', color: '#DC2626', ackDate: undefined, status: 'Overdue' },
      { id: 'R4', name: 'Tom Braswell', role: 'QM', initials: 'TB', color: '#B45309', ackDate: '18 May 2026', status: 'Acknowledged' },
      { id: 'R5', name: 'Sarah Chen', role: 'Director', initials: 'SC', color: '#0891B2', ackDate: undefined, status: 'Pending' },
    ],
    history: [
      { id: 'H1', actor: 'Dev Patel', actorInitials: 'DP', actorColor: '#7C3AED', action: 'released document', detail: 'Rev D', timestamp: '14 May 2026, 11:35' },
      { id: 'H2', actor: 'Maria Delgado', actorInitials: 'MD', actorColor: '#2563EB', action: 'e-signed approval', detail: 'QM Approved Rev D', timestamp: '14 May 2026, 11:32' },
      { id: 'H3', actor: 'Dev Patel', actorInitials: 'DP', actorColor: '#7C3AED', action: 'submitted for approval', detail: 'Rev D', timestamp: '12 May 2026, 09:14' },
      { id: 'H4', actor: 'Dev Patel', actorInitials: 'DP', actorColor: '#7C3AED', action: 'uploaded revised content', detail: 'Rev D draft', timestamp: '10 May 2026, 15:40' },
      { id: 'H5', actor: 'Dev Patel', actorInitials: 'DP', actorColor: '#7C3AED', action: 'created revision', detail: 'Rev D from Rev C', timestamp: '10 May 2026, 15:22' },
    ],
  },
  {
    id: 'DOC-0045',
    title: 'End-of-Line Audit Checklist v3',
    revision: 'B',
    type: 'Form',
    status: 'Obsolete',
    owner: 'James Okonkwo',
    ownerInitials: 'JO',
    lastReviewed: '2024-12-01',
    nextReview: '2025-12-01',
    siteId: 'SITE-002',
    daysUntilReview: -195,
    clauses: ['8.6', '9.2'],
    areas: 'Assembly Line 2',
    reviewCycle: 12,
  },
  {
    id: 'DOC-0048',
    title: 'Torque Verification Work Instruction',
    revision: 'A',
    type: 'Work Instruction',
    status: 'In Approval',
    owner: 'Maria Delgado',
    ownerInitials: 'MD',
    lastReviewed: '2026-05-20',
    nextReview: '2027-05-20',
    siteId: 'SITE-001',
    daysUntilReview: 341,
    clauses: ['8.5.1', '8.2.3'],
    areas: 'Assembly Line 1',
    parts: 'Part 5501',
    reviewCycle: 24,
  },
  {
    id: 'DOC-0050',
    title: 'Assembly Station 3 – Operation Work Instruction',
    revision: 'B',
    type: 'Work Instruction',
    status: 'Released',
    owner: 'Priya Nair',
    ownerInitials: 'PN',
    lastReviewed: '2026-03-10',
    nextReview: '2027-03-10',
    siteId: 'SITE-002',
    daysUntilReview: 269,
    clauses: ['8.5.1', '7.5.3'],
    areas: 'Assembly Line 1',
    parts: 'Part 8820, Part 8821',
    reviewCycle: 24,
  },
  {
    id: 'DOC-0051',
    title: 'Paint Line Pre-Coat Surface Prep Work Instruction',
    revision: 'C',
    type: 'Work Instruction',
    status: 'Released',
    owner: 'James Okonkwo',
    ownerInitials: 'JO',
    lastReviewed: '2026-02-18',
    nextReview: '2027-02-18',
    siteId: 'SITE-002',
    daysUntilReview: 249,
    clauses: ['8.5.1', '8.5.6'],
    areas: 'Paint Shop',
    reviewCycle: 24,
  },
];

const INITIAL_COMPLAINTS: CustomerComplaint[] = [
  {
    id: 'CC-2026-0001',
    customer: 'Ford Motor Company',
    customerRef: 'FORD-CR-44821',
    description: 'Paint delamination on rear door outer panel, 6 vehicles returned',
    receivedDate: '2026-06-03',
    dueDate: '2026-06-24',
    ncrId: 'NCR-2026-0131',
    status: 'Under Review',
    ageInDays: 10,
  },
  {
    id: 'CC-2026-0002',
    customer: 'Stellantis',
    customerRef: 'STLA-QN-0938',
    description: 'Dimensional non-conformance on door hinge bracket, 120 units affected',
    receivedDate: '2026-05-15',
    dueDate: '2026-06-05',
    ncrId: 'NCR-2026-0103',
    status: 'Open',
    ageInDays: 29,
  },
  {
    id: 'CC-2026-0003',
    customer: 'GM',
    customerRef: 'GM-SQP-2214',
    description: 'Torque spec failure on seat rail fasteners, warranty claim $14,200',
    receivedDate: '2026-05-22',
    dueDate: '2026-06-12',
    ncrId: 'NCR-2026-0115',
    status: 'Closed',
    ageInDays: 22,
  },
  {
    id: 'CC-2026-0004',
    customer: 'BMW Group',
    customerRef: 'BMW-NC-1047',
    description: 'Surface finish outside Ra spec on inner roof panels, 14 units',
    receivedDate: '2026-05-20',
    dueDate: '2026-06-10',
    ncrId: 'NCR-2026-0112',
    status: 'Open',
    ageInDays: 24,
  },
  {
    id: 'CC-2026-0005',
    customer: 'Toyota',
    customerRef: 'TNA-SQR-5521',
    description: 'Weld bead geometry OOT on hood inner panels, 11 units',
    receivedDate: '2026-06-12',
    dueDate: '2026-06-26',
    ncrId: 'NCR-2026-0147',
    status: 'Open',
    ageInDays: 1,
  },
  {
    id: 'CC-2026-0006',
    customer: 'Ford Motor Company',
    customerRef: 'FORD-CR-44912',
    description: 'Misaligned door gap on BIW batch 44, 8 units',
    receivedDate: '2026-06-09',
    dueDate: '2026-06-23',
    ncrId: 'NCR-2026-0140',
    status: 'Under Review',
    ageInDays: 4,
  },
  {
    id: 'CC-2026-0007',
    customer: 'Stellantis',
    customerRef: 'STLA-QN-1002',
    description: 'Coating thickness below minimum on instrument panel brackets',
    receivedDate: '2026-05-28',
    dueDate: '2026-06-18',
    ncrId: 'NCR-2026-0122',
    status: 'Open',
    ageInDays: 16,
  },
  {
    id: 'CC-2026-0008',
    customer: 'Rivian',
    customerRef: 'RVN-QC-0041',
    description: 'Incorrect label on shipping containers, 200 units affected',
    receivedDate: '2026-05-25',
    dueDate: '2026-06-15',
    ncrId: 'NCR-2026-0119',
    status: 'Open',
    ageInDays: 19,
  },
  {
    id: 'CC-2026-0009',
    customer: 'GM',
    customerRef: 'GM-SQP-2301',
    description: 'Hardness test failure on heat treat batch HT-0612',
    receivedDate: '2026-06-01',
    dueDate: '2026-06-22',
    ncrId: 'NCR-2026-0128',
    status: 'Under Review',
    ageInDays: 12,
  },
];

const INITIAL_CONTAINMENT_ACTIONS: ContainmentAction[] = [
  {
    id: 'CA-001',
    ncrId: 'NCR-2026-0100',
    what: 'Sort and segregate all suspect units in WH-3',
    owner: 'Dev Patel',
    ownerInitials: 'DP',
    ownerColor: '#7C3AED',
    qty: 47,
    status: 'Verified',
    completedDate: '2026-06-12',
  },
  {
    id: 'CA-002',
    ncrId: 'NCR-2026-0100',
    what: 'Stop shipment of Lot W4-0613 pending disposition',
    owner: 'Maria Delgado',
    ownerInitials: 'MD',
    ownerColor: '#2563EB',
    qty: 11,
    status: 'Verified',
    completedDate: '2026-06-12',
  },
  {
    id: 'CA-003',
    ncrId: 'NCR-2026-0147',
    what: 'Notify customer of potential impact (11 hoods)',
    owner: 'Maria Delgado',
    ownerInitials: 'MD',
    ownerColor: '#2563EB',
    status: 'Open',
  },
  {
    id: 'CA-004',
    ncrId: 'NCR-2026-0147',
    what: 'Adjust weld machine WM-07 parameters back to spec',
    owner: 'Dev Patel',
    ownerInitials: 'DP',
    ownerColor: '#7C3AED',
    status: 'Open',
  },
];

const INITIAL_NCRS: NCR[] = [
  {
    id: 'NCR-2026-0100',
    title: 'Weld porosity detected on B-pillar assemblies',
    description:
      'Weld porosity found during final inspection on 23 B-pillar assemblies from Lot 442.',
    status: 'Open',
    severity: 'Major',
    owner: 'Dev Patel',
    ownerInitials: 'DP',
    ownerColor: '#7C3AED',
    siteId: 'SITE-001',
    createdAt: '2026-05-10',
    dueDate: '2026-06-10',
    source: 'Internal',
    ageInDays: 34,
    partNumber: 'BPIL-0044',
    defectCode: 'WLD-001',
    qtyDefective: 23,
    qtyInspected: 200,
    area: 'Weld Zone A',
    shift: 'Day',
    lot: 'LOT-442',
    capaId: 'CAPA-2026-0021',
  },
  {
    id: 'NCR-2026-0103',
    title: 'Dimensional non-conformance – door hinge bracket',
    description: 'Hole diameter 0.4mm over tolerance per Part 1147 drawing rev D.',
    status: 'Under Review',
    severity: 'Minor',
    owner: 'Maria Delgado',
    ownerInitials: 'MD',
    ownerColor: '#2563EB',
    siteId: 'SITE-001',
    createdAt: '2026-05-15',
    dueDate: '2026-06-15',
    source: 'Customer',
    ageInDays: 29,
    partNumber: 'HNG-1147',
    defectCode: 'DIM-003',
    qtyDefective: 120,
    qtyInspected: 500,
    customer: 'Stellantis',
    customerRef: 'STLA-QN-0938',
    area: 'Stamping',
    isCustomerFacing: true,
    capaId: 'CAPA-2026-0032',
    complaintId: 'CC-2026-0002',
  },
  {
    id: 'NCR-2026-0108',
    title: 'Incorrect material certification – Steel coil batch C-7',
    description: 'Supplier certification shows grade S355 but batch tested as S275.',
    status: 'Under Review',
    severity: 'Major',
    owner: 'Priya Nair',
    ownerInitials: 'PN',
    ownerColor: '#DC2626',
    siteId: 'SITE-002',
    createdAt: '2026-05-18',
    dueDate: '2026-06-18',
    source: 'Supplier',
    ageInDays: 26,
    partNumber: 'COIL-C7',
    defectCode: 'MAT-002',
    qtyDefective: 1,
    qtyInspected: 1,
    area: 'Incoming',
    lot: 'COIL-C7',
    mrbRequired: true,
  },
  {
    id: 'NCR-2026-0112',
    title: 'Surface finish non-conformance – inner roof panel',
    description: 'Orange peel texture outside of Ra 1.6µm specification on 14 panels.',
    status: 'Open',
    severity: 'Minor',
    owner: 'James Okonkwo',
    ownerInitials: 'JO',
    ownerColor: '#059669',
    siteId: 'SITE-002',
    createdAt: '2026-05-20',
    dueDate: '2026-06-20',
    source: 'Customer',
    ageInDays: 24,
    partNumber: 'ROOF-INN-2',
    defectCode: 'SRF-005',
    qtyDefective: 14,
    qtyInspected: 80,
    customer: 'BMW Group',
    customerRef: 'BMW-NC-1047',
    isCustomerFacing: true,
    complaintId: 'CC-2026-0004',
  },
  {
    id: 'NCR-2026-0115',
    title: 'Torque below spec on seat rail fasteners',
    description: '4 of 120 audited seat rail M10 fasteners below 28 Nm specification.',
    status: 'Dispositioned',
    severity: 'Major',
    owner: 'Tom Braswell',
    ownerInitials: 'TB',
    ownerColor: '#B45309',
    siteId: 'SITE-003',
    createdAt: '2026-05-22',
    dueDate: '2026-06-22',
    source: 'Audit',
    ageInDays: 22,
    partNumber: 'SRAIL-M10',
    defectCode: 'TRQ-001',
    qtyDefective: 4,
    qtyInspected: 120,
    area: 'Assembly Line 1',
    disposition: 'Rework',
    customer: 'GM',
    isCustomerFacing: true,
    complaintId: 'CC-2026-0003',
  },
  {
    id: 'NCR-2026-0119',
    title: 'Incorrect label applied – Part No 88-4712',
    description: 'Wrong part number label on shipping containers, 200 units affected.',
    status: 'Open',
    severity: 'Minor',
    owner: 'Dev Patel',
    ownerInitials: 'DP',
    ownerColor: '#7C3AED',
    siteId: 'SITE-001',
    createdAt: '2026-05-25',
    dueDate: '2026-06-25',
    source: 'Supplier',
    ageInDays: 19,
    partNumber: 'PKG-88-4712',
    defectCode: 'LBL-002',
    qtyDefective: 200,
    qtyInspected: 200,
    area: 'Shipping',
    lot: 'SHIP-052526',
    isCustomerFacing: true,
    complaintId: 'CC-2026-0008',
  },
  {
    id: 'NCR-2026-0122',
    title: 'Coating thickness below minimum on instrument panel bracket',
    description: 'Electrostatic coating measured at 55µm vs 80µm minimum.',
    status: 'Open',
    severity: 'OFI',
    owner: 'Maria Delgado',
    ownerInitials: 'MD',
    ownerColor: '#2563EB',
    siteId: 'SITE-001',
    createdAt: '2026-05-28',
    dueDate: '2026-06-28',
    source: 'Internal',
    ageInDays: 16,
    partNumber: 'IPBKT-0077',
    defectCode: 'CTG-004',
    qtyDefective: 12,
    qtyInspected: 60,
    area: 'Paint Shop',
    lot: 'COAT-0528',
    complaintId: 'CC-2026-0007',
  },
  {
    id: 'NCR-2026-0125',
    title: 'Missing process sign-off on weld traveler cards',
    description: 'Traveler cards for production run W4-2026-05-29 lack QE signature.',
    status: 'Closed',
    severity: 'Minor',
    owner: 'Sarah Chen',
    ownerInitials: 'SC',
    ownerColor: '#0891B2',
    siteId: 'SITE-001',
    createdAt: '2026-05-29',
    dueDate: '2026-06-29',
    source: 'Internal',
    ageInDays: 15,
    partNumber: 'WLD-TRV',
    defectCode: 'DOC-001',
    qtyDefective: 0,
    qtyInspected: 0,
    area: 'Weld Zone A',
    shift: 'Night',
    disposition: 'Use-As-Is',
  },
  {
    id: 'NCR-2026-0128',
    title: 'Hardness test failure – heat treat batch HT-0612',
    description: 'Rockwell HRC reading 38 vs 42–48 specification on 3 sample pieces.',
    status: 'Under Review',
    severity: 'Major',
    owner: 'Priya Nair',
    ownerInitials: 'PN',
    ownerColor: '#DC2626',
    siteId: 'SITE-002',
    createdAt: '2026-06-01',
    dueDate: '2026-07-01',
    source: 'Internal',
    ageInDays: 12,
    partNumber: 'HT-0612',
    defectCode: 'HRD-003',
    qtyDefective: 3,
    qtyInspected: 30,
    area: 'Heat Treat',
    lot: 'HT-0612',
    mrbRequired: true,
    complaintId: 'CC-2026-0009',
  },
  {
    id: 'NCR-2026-0131',
    title: 'Customer complaint – paint delamination on rear door outer',
    description: 'Field return from OEM customer, 6 vehicles affected, warranty claim submitted.',
    status: 'Under Review',
    severity: 'Major',
    owner: 'Dev Patel',
    ownerInitials: 'DP',
    ownerColor: '#7C3AED',
    siteId: 'SITE-001',
    createdAt: '2026-06-03',
    dueDate: '2026-07-03',
    source: 'Customer',
    ageInDays: 10,
    partNumber: 'DOOR-OUT-R',
    defectCode: 'CTG-004',
    qtyDefective: 6,
    qtyInspected: 6,
    customer: 'Ford Motor Company',
    customerRef: 'FORD-CR-44821',
    area: 'Paint Shop',
    isCustomerFacing: true,
    capaId: 'CAPA-2026-0020',
    complaintId: 'CC-2026-0001',
    mrbRequired: true,
  },
  {
    id: 'NCR-2026-0134',
    title: 'OFI – improve visual inspection lighting at station 12',
    description: 'Lighting below 1000 lux recommendation in QMS visual inspection procedure.',
    status: 'Open',
    severity: 'OFI',
    owner: 'Tom Braswell',
    ownerInitials: 'TB',
    ownerColor: '#B45309',
    siteId: 'SITE-003',
    createdAt: '2026-06-05',
    dueDate: '2026-07-05',
    source: 'Audit',
    ageInDays: 8,
    defectCode: 'ENV-001',
    area: 'Assembly Line 2',
    shift: 'Day',
  },
  {
    id: 'NCR-2026-0137',
    title: 'Non-conforming fasteners in incoming lot – vendor ACE Hardware',
    description: 'Thread gauging failure rate 4.2%, above 0.5% AQL.',
    status: 'Open',
    severity: 'Minor',
    owner: 'James Okonkwo',
    ownerInitials: 'JO',
    ownerColor: '#059669',
    siteId: 'SITE-002',
    createdAt: '2026-06-07',
    dueDate: '2026-07-07',
    source: 'Supplier',
    ageInDays: 6,
    partNumber: 'FAST-M10-ACE',
    defectCode: 'DIM-003',
    qtyDefective: 42,
    qtyInspected: 1000,
    area: 'Incoming',
    lot: 'ACE-FAST-0607',
    mrbRequired: true,
  },
  {
    id: 'NCR-2026-0140',
    title: 'Misaligned door gap – body-in-white rework required',
    description: 'Gap variation exceeds ±1.5mm tolerance band on 8 units in BIW batch 44.',
    status: 'Dispositioned',
    severity: 'Major',
    owner: 'Maria Delgado',
    ownerInitials: 'MD',
    ownerColor: '#2563EB',
    siteId: 'SITE-001',
    createdAt: '2026-06-09',
    dueDate: '2026-07-09',
    source: 'Customer',
    ageInDays: 4,
    partNumber: 'BIW-DOOR-L',
    defectCode: 'DIM-003',
    qtyDefective: 8,
    qtyInspected: 44,
    customer: 'Ford Motor Company',
    customerRef: 'FORD-CR-44912',
    area: 'Assembly Line 1',
    isCustomerFacing: true,
    disposition: 'Rework',
    capaId: 'CAPA-2026-0030',
    complaintId: 'CC-2026-0006',
  },
  {
    id: 'NCR-2026-0143',
    title: 'Expired calibration certificate – CMM-03',
    description:
      'CMM-03 calibration expired 2026-06-01, all measurements from June 1–8 require re-evaluation.',
    status: 'Voided',
    severity: 'Minor',
    owner: 'Dev Patel',
    ownerInitials: 'DP',
    ownerColor: '#7C3AED',
    siteId: 'SITE-001',
    createdAt: '2026-06-11',
    dueDate: '2026-06-18',
    source: 'Internal',
    ageInDays: 2,
    defectCode: 'CAL-002',
    area: 'CMM Area',
  },
  {
    id: 'NCR-2026-0147',
    title: 'Weld bead geometry out of spec – hood inner panel lot',
    description: 'Bead width 6.8mm exceeds 6.0mm max per WI-DOC-0042 on 11 hoods in batch W4-0613.',
    status: 'Open',
    severity: 'Minor',
    owner: 'Dev Patel',
    ownerInitials: 'DP',
    ownerColor: '#7C3AED',
    siteId: 'SITE-001',
    createdAt: '2026-06-12',
    dueDate: '2026-06-26',
    source: 'Customer',
    ageInDays: 1,
    partNumber: 'HOOD-INN-2',
    defectCode: 'WLD-001',
    qtyDefective: 11,
    qtyInspected: 44,
    customer: 'Toyota',
    customerRef: 'TNA-SQR-5521',
    area: 'Weld Zone B',
    shift: 'Day',
    lot: 'W4-0613',
    isCustomerFacing: true,
    complaintId: 'CC-2026-0005',
  },
  {
    id: 'NCR-2026-0148',
    title: 'Incomplete PPAP documentation for Part 6622-B',
    description: 'PPAP submission missing dimensional study and process flow diagram for new part.',
    status: 'Open',
    severity: 'Major',
    owner: 'Sarah Chen',
    ownerInitials: 'SC',
    ownerColor: '#0891B2',
    siteId: 'SITE-001',
    createdAt: '2026-06-13',
    dueDate: '2026-06-27',
    source: 'Customer',
    ageInDays: 0,
    partNumber: '6622-B',
    defectCode: 'DOC-001',
    qtyDefective: 0,
    qtyInspected: 0,
    customer: 'GM',
    area: 'Quality',
    isCustomerFacing: true,
  },
  {
    id: 'NCR-2026-0149',
    title: 'Wrong revision level on production floor drawing – Station 8',
    description:
      'Operators using Rev B drawing; current release is Rev D. 3-day production run affected.',
    status: 'Open',
    severity: 'Major',
    owner: 'Dev Patel',
    ownerInitials: 'DP',
    ownerColor: '#7C3AED',
    siteId: 'SITE-001',
    createdAt: '2026-06-13',
    dueDate: '2026-06-20',
    source: 'Internal',
    ageInDays: 0,
    defectCode: 'DOC-001',
    qtyDefective: 0,
    qtyInspected: 0,
    area: 'Assembly Line 2',
  },
  {
    id: 'NCR-2026-0150',
    title: 'Porosity in casting – Bracket Part 3390',
    description: 'Subsurface porosity found by X-ray on 7 cast brackets. Suspected gas entrapment.',
    status: 'Open',
    severity: 'Major',
    owner: 'Priya Nair',
    ownerInitials: 'PN',
    ownerColor: '#DC2626',
    siteId: 'SITE-002',
    createdAt: '2026-06-13',
    dueDate: '2026-06-27',
    source: 'Supplier',
    ageInDays: 0,
    partNumber: 'BKTS-3390',
    defectCode: 'SRF-005',
    qtyDefective: 7,
    qtyInspected: 50,
    area: 'Incoming',
    lot: 'CAST-0613',
    mrbRequired: true,
  },
];

const INITIAL_NCR_ATTACHMENTS: NcrAttachment[] = [
  { id: 'ATT-001', ncrId: 'NCR-2026-0100', name: 'defect_photo_1.jpg',      size: '2.1 MB',  icon: 'bi-image',              color: '#059669', uploadedBy: 'Dev Patel',    uploadedAt: '2026-05-22' },
  { id: 'ATT-002', ncrId: 'NCR-2026-0100', name: 'measurement_report.pdf',  size: '345 KB',  icon: 'bi-file-earmark-pdf',   color: '#DC2626', uploadedBy: 'Dev Patel',    uploadedAt: '2026-05-22' },
  { id: 'ATT-003', ncrId: 'NCR-2026-0131', name: 'customer_complaint.pdf',  size: '1.2 MB',  icon: 'bi-file-earmark-pdf',   color: '#DC2626', uploadedBy: 'Maria Delgado',uploadedAt: '2026-06-15' },
  { id: 'ATT-004', ncrId: 'NCR-2026-0131', name: 'paint_delamination.jpg',  size: '3.4 MB',  icon: 'bi-image',              color: '#059669', uploadedBy: 'James Okonkwo',uploadedAt: '2026-06-15' },
  { id: 'ATT-005', ncrId: 'NCR-2026-0147', name: 'weld_geometry_scan.jpg',  size: '1.8 MB',  icon: 'bi-image',              color: '#059669', uploadedBy: 'Dev Patel',    uploadedAt: '2026-06-24' },
  { id: 'ATT-006', ncrId: 'NCR-2026-0140', name: 'door_gap_measurement.pdf',size: '890 KB',  icon: 'bi-file-earmark-pdf',   color: '#DC2626', uploadedBy: 'James Okonkwo',uploadedAt: '2026-06-20' },
];

const INITIAL_WORK_ITEMS: WorkItem[] = [
  // ── Plant-1 · Detroit (SITE-001) ──────────────────────────────────────────
  {
    id: 'WI-001',
    type: 'Document Approval',
    entityId: 'DOC-0048',
    title: 'Approve – Torque Verification Work Instruction',
    owner: 'Maria Delgado',
    ownerInitials: 'MD',
    ownerColor: '#2563EB',
    ownerId: 'USR-001',
    siteId: 'SITE-001',
    dueDate: '2026-06-10',
    dueCategory: 'overdue',
    ageDays: 3,
    actionLabel: 'Approve',
    route: '/documents/DOC-0048',
  },
  {
    id: 'WI-002',
    type: 'NCR Disposition',
    entityId: 'NCR-2026-0147',
    title: 'Disposition required – Weld bead geometry OOT',
    owner: 'Dev Patel',
    ownerInitials: 'DP',
    ownerColor: '#7C3AED',
    ownerId: 'USR-002',
    siteId: 'SITE-001',
    dueDate: '2026-06-11',
    dueCategory: 'overdue',
    ageDays: 2,
    actionLabel: 'Disposition',
    route: '/ncrs/NCR-2026-0147',
  },
  {
    id: 'WI-003',
    type: 'CAPA Review',
    entityId: 'CAPA-2026-0021',
    title: 'Review CAPA step – B-pillar weld containment',
    owner: 'Omar Hassan',
    ownerInitials: 'OH',
    ownerColor: '#6366F1',
    ownerId: 'USR-013',
    siteId: 'SITE-001',
    dueDate: '2026-06-11',
    dueCategory: 'overdue',
    ageDays: 2,
    actionLabel: 'Review',
    route: '/capas/CAPA-2026-0021',
  },
  {
    id: 'WI-004',
    type: 'Document Approval',
    entityId: 'DOC-0030',
    title: 'Approve – Control Plan Chassis Frame Weld',
    owner: 'Maria Delgado',
    ownerInitials: 'MD',
    ownerColor: '#2563EB',
    ownerId: 'USR-001',
    siteId: 'SITE-001',
    dueDate: '2026-06-13',
    dueCategory: 'today',
    ageDays: 0,
    actionLabel: 'Approve',
    route: '/documents/DOC-0030',
  },
  {
    id: 'WI-005',
    type: 'NCR Disposition',
    entityId: 'NCR-2026-0119',
    title: 'Disposition – Incorrect label applied, Part No 88-4712',
    owner: 'Dev Patel',
    ownerInitials: 'DP',
    ownerColor: '#7C3AED',
    ownerId: 'USR-002',
    siteId: 'SITE-001',
    dueDate: '2026-06-13',
    dueCategory: 'today',
    ageDays: 0,
    actionLabel: 'Disposition',
    route: '/ncrs/NCR-2026-0119',
  },
  {
    id: 'WI-006',
    type: 'Finding Response',
    entityId: 'FND-2026-0055',
    title: 'Respond to finding – Customer requirements flow-down',
    owner: 'Nina Brown',
    ownerInitials: 'NB',
    ownerColor: '#D97706',
    ownerId: 'USR-012',
    siteId: 'SITE-001',
    dueDate: '2026-06-13',
    dueCategory: 'today',
    ageDays: 0,
    actionLabel: 'Respond',
    route: '/audits/AUD-2026-007',
  },
  {
    id: 'WI-007',
    type: 'Document Approval',
    entityId: 'DOC-0007',
    title: 'Approve – IATF 16949 Internal Audit Procedure',
    owner: 'Sarah Chen',
    ownerInitials: 'SC',
    ownerColor: '#0891B2',
    ownerId: 'USR-003',
    siteId: 'SITE-001',
    dueDate: '2026-06-16',
    dueCategory: 'this-week',
    ageDays: -3,
    actionLabel: 'Approve',
    route: '/documents/DOC-0007',
  },
  {
    id: 'WI-008',
    type: 'CAPA Review',
    entityId: 'CAPA-2026-0024',
    title: 'Review CAPA implementation – calibration management upgrade',
    owner: 'Kevin Torres',
    ownerInitials: 'KT',
    ownerColor: '#16A34A',
    ownerId: 'USR-011',
    siteId: 'SITE-001',
    dueDate: '2026-06-16',
    dueCategory: 'this-week',
    ageDays: -3,
    actionLabel: 'Review',
    route: '/capas/CAPA-2026-0024',
  },
  {
    id: 'WI-009',
    type: 'LPA Run',
    entityId: 'LPA-SCH-P1-RK',
    title: 'Complete L1 Daily QT LPA – Plant 1',
    owner: 'Ravi Kumar',
    ownerInitials: 'RK',
    ownerColor: '#059669',
    ownerId: 'USR-009',
    siteId: 'SITE-001',
    dueDate: '2026-06-17',
    dueCategory: 'this-week',
    ageDays: -4,
    actionLabel: 'Run LPA',
    route: '/lpa',
  },
  {
    id: 'WI-010',
    type: 'LPA Run',
    entityId: 'LPA-SCH-P1-EP',
    title: 'Complete L1 Daily Operator LPA – Plant 1',
    owner: 'Elena Petrov',
    ownerInitials: 'EP',
    ownerColor: '#0E7490',
    ownerId: 'USR-014',
    siteId: 'SITE-001',
    dueDate: '2026-06-18',
    dueCategory: 'this-week',
    ageDays: -5,
    actionLabel: 'Run LPA',
    route: '/lpa',
  },

  // ── Plant-2 · Chicago (SITE-002) ──────────────────────────────────────────
  {
    id: 'WI-011',
    type: 'NCR Disposition',
    entityId: 'NCR-2026-0112',
    title: 'Disposition – Surface finish non-conformance, inner roof panel',
    owner: 'James Okonkwo',
    ownerInitials: 'JO',
    ownerColor: '#059669',
    ownerId: 'USR-004',
    siteId: 'SITE-002',
    dueDate: '2026-06-09',
    dueCategory: 'overdue',
    ageDays: 4,
    actionLabel: 'Disposition',
    route: '/ncrs/NCR-2026-0112',
  },
  {
    id: 'WI-012',
    type: 'CAPA Review',
    entityId: 'CAPA-2026-0022',
    title: 'Review CAPA – supplier steel certification audit response',
    owner: 'Priya Nair',
    ownerInitials: 'PN',
    ownerColor: '#DC2626',
    ownerId: 'USR-005',
    siteId: 'SITE-002',
    dueDate: '2026-06-12',
    dueCategory: 'overdue',
    ageDays: 1,
    actionLabel: 'Review',
    route: '/capas/CAPA-2026-0022',
  },
  {
    id: 'WI-013',
    type: 'NCR Disposition',
    entityId: 'NCR-2026-0108',
    title: 'Disposition – Incorrect material certification, steel coil batch C-7',
    owner: 'Priya Nair',
    ownerInitials: 'PN',
    ownerColor: '#DC2626',
    ownerId: 'USR-005',
    siteId: 'SITE-002',
    dueDate: '2026-06-13',
    dueCategory: 'today',
    ageDays: 0,
    actionLabel: 'Disposition',
    route: '/ncrs/NCR-2026-0108',
  },
  {
    id: 'WI-014',
    type: 'CAPA Review',
    entityId: 'CAPA-2026-0025',
    title: 'Review CAPA – incoming inspection AQL tightening, fasteners',
    owner: 'Raj Sharma',
    ownerInitials: 'RS',
    ownerColor: '#BE123C',
    ownerId: 'USR-017',
    siteId: 'SITE-002',
    dueDate: '2026-06-13',
    dueCategory: 'today',
    ageDays: 0,
    actionLabel: 'Review',
    route: '/capas/CAPA-2026-0025',
  },
  {
    id: 'WI-015',
    type: 'NCR Disposition',
    entityId: 'NCR-2026-0137',
    title: 'Disposition – open non-conformance follow-up',
    owner: 'James Okonkwo',
    ownerInitials: 'JO',
    ownerColor: '#059669',
    ownerId: 'USR-004',
    siteId: 'SITE-002',
    dueDate: '2026-06-16',
    dueCategory: 'this-week',
    ageDays: -3,
    actionLabel: 'Disposition',
    route: '/ncrs/NCR-2026-0137',
  },
  {
    id: 'WI-016',
    type: 'LPA Run',
    entityId: 'LPA-SCH-P2-FA',
    title: 'Complete L1 Daily QT LPA – Plant 2',
    owner: 'Fatima Ali',
    ownerInitials: 'FA',
    ownerColor: '#C2410C',
    ownerId: 'USR-018',
    siteId: 'SITE-002',
    dueDate: '2026-06-17',
    dueCategory: 'this-week',
    ageDays: -4,
    actionLabel: 'Run LPA',
    route: '/lpa',
  },
  {
    id: 'WI-017',
    type: 'LPA Run',
    entityId: 'LPA-SCH-P2-LP',
    title: 'Complete L1 Daily Operator LPA – Plant 2',
    owner: 'Lisa Park',
    ownerInitials: 'LP',
    ownerColor: '#DC2626',
    ownerId: 'USR-010',
    siteId: 'SITE-002',
    dueDate: '2026-06-18',
    dueCategory: 'this-week',
    ageDays: -5,
    actionLabel: 'Run LPA',
    route: '/lpa',
  },

  // ── Plant-3 · Cleveland (SITE-003) ────────────────────────────────────────
  {
    id: 'WI-018',
    type: 'NCR Disposition',
    entityId: 'NCR-2026-0134',
    title: 'Disposition required – open non-conformance review',
    owner: 'Wei Tanaka',
    ownerInitials: 'WT',
    ownerColor: '#4338CA',
    ownerId: 'USR-021',
    siteId: 'SITE-003',
    dueDate: '2026-06-11',
    dueCategory: 'overdue',
    ageDays: 2,
    actionLabel: 'Disposition',
    route: '/ncrs/NCR-2026-0134',
  },
  {
    id: 'WI-019',
    type: 'CAPA Review',
    entityId: 'CAPA-2026-0023',
    title: 'Review CAPA – seat rail torque SPC monitoring implementation',
    owner: 'Hana Brooks',
    ownerInitials: 'HB',
    ownerColor: '#155E75',
    ownerId: 'USR-022',
    siteId: 'SITE-003',
    dueDate: '2026-06-12',
    dueCategory: 'overdue',
    ageDays: 1,
    actionLabel: 'Review',
    route: '/capas/CAPA-2026-0023',
  },
  {
    id: 'WI-020',
    type: 'CAPA Review',
    entityId: 'CAPA-2026-0026',
    title: 'Review CAPA – visual inspection lighting upgrade, station 12',
    owner: 'Aisha Williams',
    ownerInitials: 'AW',
    ownerColor: '#7C3AED',
    ownerId: 'USR-008',
    siteId: 'SITE-003',
    dueDate: '2026-06-13',
    dueCategory: 'today',
    ageDays: 0,
    actionLabel: 'Review',
    route: '/capas/CAPA-2026-0026',
  },
  {
    id: 'WI-021',
    type: 'LPA Run',
    entityId: 'LPA-SCH-P3-DO',
    title: 'Complete L3 Monthly Director LPA – Plant 3',
    owner: 'David Osei',
    ownerInitials: 'DO',
    ownerColor: '#065F46',
    ownerId: 'USR-019',
    siteId: 'SITE-003',
    dueDate: '2026-06-13',
    dueCategory: 'today',
    ageDays: 0,
    actionLabel: 'Run LPA',
    route: '/lpa',
  },
  {
    id: 'WI-022',
    type: 'LPA Run',
    entityId: 'LPA-SCH-P3-CN',
    title: 'Complete L3 Monthly PM LPA – Plant 3',
    owner: 'Claire Novak',
    ownerInitials: 'CN',
    ownerColor: '#9D174D',
    ownerId: 'USR-020',
    siteId: 'SITE-003',
    dueDate: '2026-06-16',
    dueCategory: 'this-week',
    ageDays: -3,
    actionLabel: 'Run LPA',
    route: '/lpa',
  },
  {
    id: 'WI-023',
    type: 'LPA Run',
    entityId: 'LPA-SCH-P3-DR',
    title: 'Complete L1 Daily QT LPA – Plant 3',
    owner: 'Dante Reyes',
    ownerInitials: 'DR',
    ownerColor: '#7F1D1D',
    ownerId: 'USR-023',
    siteId: 'SITE-003',
    dueDate: '2026-06-17',
    dueCategory: 'this-week',
    ageDays: -4,
    actionLabel: 'Run LPA',
    route: '/lpa',
  },
  {
    id: 'WI-024',
    type: 'LPA Run',
    entityId: 'LPA-SCH-P3-YS',
    title: 'Complete L1 Daily Operator LPA – Plant 3',
    owner: 'Yuki Stone',
    ownerInitials: 'YS',
    ownerColor: '#3730A3',
    ownerId: 'USR-024',
    siteId: 'SITE-003',
    dueDate: '2026-06-18',
    dueCategory: 'this-week',
    ageDays: -5,
    actionLabel: 'Run LPA',
    route: '/lpa',
  },
];

const INITIAL_CAPAS_8D: CAPA8D[] = [
  {
    id: 'CAPA-2026-0020',
    title: 'Paint delamination root cause – OEM warranty complaint',
    status: 'Open',
    ncrId: 'NCR-2026-0131',
    complaintId: 'CC-2026-0001',
    champion: 'Dev Patel',
    championInitials: 'DP',
    championColor: '#7C3AED',
    teamAvatars: [
      { initials: 'MD', color: '#2563EB' },
      { initials: 'SC', color: '#0891B2' },
    ],
    siteId: 'SITE-001',
    dueDate: '2026-07-15',
    createdAt: '2026-06-03',
    source: 'CC-2026-0001',
    sourceType: 'Customer Complaint',
    completedSteps: ['D0', 'D1'],
    activeStep: 'D2',
    daysInCurrentStep: 4,
    daysOpen: 10,
    onTimeStatus: 'on-track',
    completionPct: 30,
    d0: {
      title: 'Paint delamination root cause – OEM warranty complaint',
      source: 'CC-2026-0001',
      customer: 'Ford Motor Company',
      customerRef: 'FORD-CR-44821',
      severity: 'Major',
      dueDate: '2026-07-15',
    },
    d1: {
      champion: 'Dev Patel',
      team: [
        { id: 't1', name: 'Maria Delgado', role: 'Quality Manager' },
        { id: 't2', name: 'Sarah Chen', role: 'Director (Sponsor)' },
        { id: 't3', name: 'Priya Nair', role: 'QE – Paint Shop' },
      ],
    },
  },
  {
    id: 'CAPA-2026-0021',
    title: 'B-pillar weld porosity – process improvement',
    status: 'Open',
    ncrId: 'NCR-2026-0100',
    champion: 'Maria Delgado',
    championInitials: 'MD',
    championColor: '#2563EB',
    teamAvatars: [
      { initials: 'DP', color: '#7C3AED' },
      { initials: 'SC', color: '#0891B2' },
    ],
    siteId: 'SITE-001',
    dueDate: '2026-06-25',
    createdAt: '2026-05-12',
    source: 'NCR-2026-0100',
    sourceType: 'NCR',
    completedSteps: ['D0'],
    activeStep: 'D1',
    daysInCurrentStep: 14,
    daysOpen: 32,
    onTimeStatus: 'overdue',
    completionPct: 20,
    d0: {
      title: 'B-pillar weld porosity – process improvement',
      source: 'NCR-2026-0100',
      severity: 'Major',
      dueDate: '2026-06-25',
    },
  },
  {
    id: 'CAPA-2026-0022',
    title: 'Supplier steel certification audit response',
    status: 'Open',
    ncrId: 'NCR-2026-0108',
    champion: 'Priya Nair',
    championInitials: 'PN',
    championColor: '#DC2626',
    teamAvatars: [
      { initials: 'MD', color: '#2563EB' },
      { initials: 'JO', color: '#059669' },
    ],
    siteId: 'SITE-002',
    dueDate: '2026-07-01',
    createdAt: '2026-05-20',
    source: 'NCR-2026-0108',
    sourceType: 'NCR',
    completedSteps: ['D0', 'D1', 'D2'],
    activeStep: 'D3',
    daysInCurrentStep: 5,
    daysOpen: 24,
    onTimeStatus: 'on-track',
    completionPct: 50,
  },
  {
    id: 'CAPA-2026-0023',
    title: 'Seat rail torque SPC monitoring implementation',
    status: 'Open',
    champion: 'Tom Braswell',
    championInitials: 'TB',
    championColor: '#B45309',
    teamAvatars: [{ initials: 'MD', color: '#2563EB' }],
    siteId: 'SITE-003',
    dueDate: '2026-07-10',
    createdAt: '2026-05-25',
    source: 'Audit – AUD-2026-004',
    sourceType: 'Audit',
    completedSteps: ['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6'],
    activeStep: 'D7',
    daysInCurrentStep: 3,
    daysOpen: 19,
    onTimeStatus: 'on-track',
    completionPct: 70,
  },
  {
    id: 'CAPA-2026-0024',
    title: 'Calibration management system upgrade',
    status: 'Open',
    champion: 'Dev Patel',
    championInitials: 'DP',
    championColor: '#7C3AED',
    teamAvatars: [{ initials: 'SC', color: '#0891B2' }],
    siteId: 'SITE-001',
    dueDate: '2026-06-30',
    createdAt: '2026-05-28',
    source: 'Internal',
    sourceType: 'Internal',
    completedSteps: ['D0', 'D1'],
    activeStep: 'D2',
    daysInCurrentStep: 8,
    daysOpen: 16,
    onTimeStatus: 'on-track',
    completionPct: 30,
  },
  {
    id: 'CAPA-2026-0025',
    title: 'Incoming inspection AQL tightening – fasteners',
    status: 'Open',
    champion: 'James Okonkwo',
    championInitials: 'JO',
    championColor: '#059669',
    teamAvatars: [
      { initials: 'PN', color: '#DC2626' },
      { initials: 'MD', color: '#2563EB' },
    ],
    siteId: 'SITE-002',
    dueDate: '2026-07-20',
    createdAt: '2026-06-01',
    source: 'NCR-2026-0137',
    sourceType: 'NCR',
    completedSteps: ['D0', 'D1', 'D2'],
    activeStep: 'D3',
    daysInCurrentStep: 7,
    daysOpen: 12,
    onTimeStatus: 'on-track',
    completionPct: 55,
  },
  {
    id: 'CAPA-2026-0026',
    title: 'Visual inspection lighting upgrade – station 12',
    status: 'Open',
    champion: 'Tom Braswell',
    championInitials: 'TB',
    championColor: '#B45309',
    teamAvatars: [{ initials: 'JO', color: '#059669' }],
    siteId: 'SITE-003',
    dueDate: '2026-07-05',
    createdAt: '2026-06-05',
    source: 'NCR-2026-0134',
    sourceType: 'NCR',
    completedSteps: ['D0', 'D1', 'D2', 'D3', 'D4'],
    activeStep: 'D5',
    daysInCurrentStep: 6,
    daysOpen: 8,
    onTimeStatus: 'on-track',
    completionPct: 65,
  },
  {
    id: 'CAPA-2026-0027',
    title: 'Traveler card sign-off SOP revision',
    status: 'Open',
    champion: 'Sarah Chen',
    championInitials: 'SC',
    championColor: '#0891B2',
    teamAvatars: [{ initials: 'DP', color: '#7C3AED' }],
    siteId: 'SITE-001',
    dueDate: '2026-07-15',
    createdAt: '2026-06-06',
    source: 'NCR-2026-0125',
    sourceType: 'NCR',
    completedSteps: ['D0'],
    activeStep: 'D1',
    daysInCurrentStep: 10,
    daysOpen: 7,
    onTimeStatus: 'at-risk',
    completionPct: 10,
  },
  {
    id: 'CAPA-2026-0028',
    title: 'Heat treat process revalidation after hardness failure',
    status: 'Open',
    ncrId: 'NCR-2026-0128',
    champion: 'Priya Nair',
    championInitials: 'PN',
    championColor: '#DC2626',
    teamAvatars: [
      { initials: 'TB', color: '#B45309' },
      { initials: 'JO', color: '#059669' },
    ],
    siteId: 'SITE-002',
    dueDate: '2026-07-01',
    createdAt: '2026-06-02',
    source: 'NCR-2026-0128',
    sourceType: 'NCR',
    completedSteps: ['D0', 'D1'],
    activeStep: 'D2',
    daysInCurrentStep: 9,
    daysOpen: 11,
    onTimeStatus: 'at-risk',
    completionPct: 35,
  },
  {
    id: 'CAPA-2026-0029',
    title: 'Label printer configuration – part number error prevention',
    status: 'Open',
    ncrId: 'NCR-2026-0119',
    champion: 'Dev Patel',
    championInitials: 'DP',
    championColor: '#7C3AED',
    teamAvatars: [{ initials: 'MD', color: '#2563EB' }],
    siteId: 'SITE-001',
    dueDate: '2026-06-28',
    createdAt: '2026-05-26',
    source: 'NCR-2026-0119',
    sourceType: 'NCR',
    completedSteps: ['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6'],
    activeStep: 'D7',
    daysInCurrentStep: 2,
    daysOpen: 18,
    onTimeStatus: 'overdue',
    completionPct: 75,
  },
  {
    id: 'CAPA-2026-0030',
    title: 'Door gap alignment fixture adjustment program',
    status: 'Open',
    ncrId: 'NCR-2026-0140',
    champion: 'Maria Delgado',
    championInitials: 'MD',
    championColor: '#2563EB',
    teamAvatars: [
      { initials: 'JO', color: '#059669' },
      { initials: 'DP', color: '#7C3AED' },
    ],
    siteId: 'SITE-001',
    dueDate: '2026-07-20',
    createdAt: '2026-06-10',
    source: 'NCR-2026-0140',
    sourceType: 'NCR',
    completedSteps: ['D0', 'D1'],
    activeStep: 'D2',
    daysInCurrentStep: 4,
    daysOpen: 3,
    onTimeStatus: 'at-risk',
    completionPct: 25,
  },
  {
    id: 'CAPA-2026-0031',
    title: 'Electrostatic coating parameter review',
    status: 'Open',
    ncrId: 'NCR-2026-0122',
    champion: 'Maria Delgado',
    championInitials: 'MD',
    championColor: '#2563EB',
    teamAvatars: [{ initials: 'PN', color: '#DC2626' }],
    siteId: 'SITE-001',
    dueDate: '2026-07-10',
    createdAt: '2026-05-30',
    source: 'NCR-2026-0122',
    sourceType: 'NCR',
    completedSteps: ['D0', 'D1', 'D2', 'D3'],
    activeStep: 'D4',
    daysInCurrentStep: 11,
    daysOpen: 14,
    onTimeStatus: 'overdue',
    completionPct: 50,
  },
  {
    id: 'CAPA-2026-0032',
    title: 'Dimension deviation prevention – hinge bracket die maintenance',
    status: 'Open',
    ncrId: 'NCR-2026-0103',
    champion: 'Dev Patel',
    championInitials: 'DP',
    championColor: '#7C3AED',
    teamAvatars: [
      { initials: 'MD', color: '#2563EB' },
      { initials: 'JO', color: '#059669' },
      { initials: 'PN', color: '#DC2626' },
    ],
    siteId: 'SITE-001',
    dueDate: '2026-07-05',
    createdAt: '2026-05-16',
    source: 'NCR-2026-0103',
    sourceType: 'NCR',
    completedSteps: ['D0', 'D1', 'D2', 'D3'],
    activeStep: 'D4',
    daysInCurrentStep: 7,
    daysOpen: 28,
    onTimeStatus: 'at-risk',
    completionPct: 68,
    d0: {
      title: 'Dimension deviation prevention – hinge bracket die maintenance',
      source: 'NCR-2026-0103',
      customer: 'Stellantis',
      customerRef: 'STLA-QN-0938',
      severity: 'Minor',
      dueDate: '2026-07-05',
    },
    d1: {
      champion: 'Dev Patel',
      team: [
        { id: 't1', name: 'Maria Delgado', role: 'Quality Manager' },
        { id: 't2', name: 'James Okonkwo', role: 'Production Supervisor' },
        { id: 't3', name: 'Priya Nair', role: 'QE – Stamping' },
        { id: 't4', name: 'Tom Braswell', role: 'Tooling Engineer' },
        { id: 't5', name: 'Sarah Chen', role: 'Director (Sponsor)' },
      ],
    },
    d2: {
      isWhat: 'Hole diameter on HNG-1147 is 12.4mm vs. 12.0mm spec (+0/−0.05mm tolerance)',
      isNotWhat: 'Other features on HNG-1147 are within spec',
      isWhere: 'Stamping line, Die #D-144, Station 3',
      isNotWhere: 'Die #D-145 and #D-146 at same station',
      isWhen: 'First detected 2026-05-15; recurred across 3 production runs',
      isNotWhen: 'Not present before die rework on 2026-04-28',
      problemStatement:
        'Hole diameter on Part HNG-1147 measures 12.4mm vs. 12.0mm (+0/−0.05mm) spec. First detected at Stellantis incoming inspection on 2026-05-15. Affects 120 units across 3 production runs. Root cause suspected in die wear following maintenance on 2026-04-28 when material grade was upgraded to S355 steel.',
    },
    d3: {
      actions: [
        {
          id: 'c1',
          action: 'Sort and quarantine all HNG-1147 in WH-3 pending re-inspection',
          owner: 'Dev Patel',
          qty: 120,
          verified: true,
          verifiedDate: '2026-05-16',
        },
        {
          id: 'c2',
          action: 'Stop shipment of open orders to Stellantis until re-inspection complete',
          owner: 'Maria Delgado',
          qty: 0,
          verified: true,
          verifiedDate: '2026-05-16',
        },
        {
          id: 'c3',
          action: 'Issue 8D customer notification to Stellantis per requirement 8.3.4',
          owner: 'Maria Delgado',
          qty: 0,
          verified: false,
        },
      ],
    },
    d4: {
      method: '5-Why',
      whyRows: [
        {
          why: 'Why is the hole diameter 0.4mm over tolerance?',
          answer: 'Die punch tip is worn beyond allowable tolerance.',
        },
        {
          why: 'Why did the die punch tip wear excessively?',
          answer:
            'Die maintenance interval was not reduced after material change to S355 steel (harder grade).',
        },
        {
          why: 'Why was the maintenance interval not adjusted?',
          answer:
            'No formal process exists to re-evaluate die maintenance schedules when input material changes.',
        },
        {
          why: 'Why is there no formal process for this?',
          answer:
            'Die maintenance procedure DOC-0018 was not updated to include a material-change trigger criteria.',
        },
        { why: 'Why was DOC-0018 not updated?', answer: '' },
      ],
      fishbone: {
        man: [
          {
            id: 'f1',
            text: 'Operator unaware of material spec change impact on die life',
            isRoot: false,
          },
        ],
        machine: [{ id: 'f2', text: 'Die punch worn beyond dimensional limits', isRoot: true }],
        method: [
          {
            id: 'f3',
            text: 'Maintenance interval not reviewed after material grade change',
            isRoot: false,
          },
        ],
        material: [
          {
            id: 'f4',
            text: 'S355 steel is harder than previous grade — increases tool wear rate',
            isRoot: false,
          },
        ],
        measurement: [],
        nature: [],
      },
      rootCauseStatement:
        'Die maintenance procedure DOC-0018 lacks a material-change impact review gate, allowing the punch tip to wear beyond tolerance after input material was upgraded to S355 grade steel.',
      escapePoint:
        'Outgoing inspection did not detect the deviation because CMM inspection frequency was reduced to 1-in-50; critical features require 1-in-20 sampling.',
    },
    d7: {
      criteria: [
        {
          id: 'e1',
          text: 'Dimensional measurements on HNG-1147 within spec for 30 days post-implementation',
          checked: false,
        },
        {
          id: 'e2',
          text: 'No recurrence of NCR-2026-0103 type defects over monitoring period',
          checked: false,
        },
        {
          id: 'e3',
          text: 'Revised die maintenance schedule followed for 2 complete cycles',
          checked: false,
        },
        { id: 'e4', text: 'Operator re-training records completed and filed', checked: false },
        { id: 'e5', text: 'PFMEA updated to reflect new control plan revision', checked: false },
      ],
      monitorStart: '2026-07-05',
      monitorEnd: '2026-08-04',
      monitorStatus: 'Not Started',
    },
    d8: {
      lessons: '',
      docsUpdated: [false, false, false, false, false],
      teamNote: '',
      closed: false,
    },
  },
];

const INITIAL_DOC_TYPES: DocType[] = [
  {
    id: 'DT-001',
    name: 'Work Instruction',
    tier: 3,
    approvalChain: [
      { step: 1, role: 'QE', requiresESign: false },
      { step: 2, role: 'QM', requiresESign: true },
    ],
  },
  {
    id: 'DT-002',
    name: 'Control Plan',
    tier: 2,
    approvalChain: [
      { step: 1, role: 'QE', requiresESign: false },
      { step: 2, role: 'QM', requiresESign: true },
      { step: 3, role: 'Director', requiresESign: true },
    ],
  },
  {
    id: 'DT-003',
    name: 'Quality Procedure',
    tier: 2,
    approvalChain: [
      { step: 1, role: 'QM', requiresESign: true },
      { step: 2, role: 'Director', requiresESign: true },
    ],
  },
  {
    id: 'DT-004',
    name: 'Form',
    tier: 4,
    approvalChain: [{ step: 1, role: 'QE', requiresESign: false }],
  },
  {
    id: 'DT-005',
    name: 'PFMEA',
    tier: 2,
    approvalChain: [
      { step: 1, role: 'QE', requiresESign: false },
      { step: 2, role: 'QM', requiresESign: true },
    ],
  },
  {
    id: 'DT-006',
    name: 'MSA Study',
    tier: 3,
    approvalChain: [
      { step: 1, role: 'QE', requiresESign: false },
      { step: 2, role: 'QM', requiresESign: true },
    ],
  },
];

// ── Persisted state shape ─────────────────────────────────────────────────────
interface PersistedState {
  documents: QDocument[];
  ncrs: NCR[];
  complaints: CustomerComplaint[];
  containmentActions: ContainmentAction[];
  ncrEvents: NcrHistoryEvent[];
  ncrAttachments: NcrAttachment[];
  workItems: WorkItem[];
  docTypes: DocType[];
  capas8d: CAPA8D[];
  lpaRuns: LPARun[];
  ncrCounter: number;
  docCounter: number;
  complaintCounter: number;
  caCounter: number;
  ncrEventCounter: number;
  capaCounter?: number;
}

// ── Audit Detail Data ─────────────────────────────────────────────────────────

const CHECKLIST_SECTIONS_PROCESS: AuditChecklistSection[] = [
  {
    id: 'S1',
    title: 'Process Documentation & Control Plan',
    clauseGroup: '8.5',
    items: [
      {
        id: 'I1',
        text: 'Control plan is current revision and signed off',
        clauseRef: '8.5.1',
        guidance:
          'Verify revision level matches PPAP submission. Look for approver signature and date.',
        response: 'Conforms',
      },
      {
        id: 'I2',
        text: 'Work instructions are posted at point-of-use',
        clauseRef: '8.5.1',
        guidance:
          'Instructions must be visible from operator position. Check revision level matches document control.',
        response: 'Conforms',
      },
      {
        id: 'I3',
        text: 'Setup approval is recorded before first-off',
        clauseRef: '8.5.1',
        guidance:
          'First Article Inspection (FAI) record must be signed by QE before production run starts.',
        response: 'Nonconformity',
        findingId: 'FND-2026-0061',
        note: 'Setup sheets for last 3 runs lacked QE sign-off.',
      },
      {
        id: 'I4',
        text: 'Process parameters are within documented tolerances',
        clauseRef: '8.5.2',
        guidance: 'Review SPC charts or parameter logs. Compare actual vs. specified ranges.',
        response: 'Conforms',
      },
    ],
  },
  {
    id: 'S2',
    title: 'Customer Requirements Flow-Down',
    clauseGroup: '8.2',
    items: [
      {
        id: 'I5',
        text: 'Customer-specific requirements are identified and documented',
        clauseRef: '8.2.3',
        guidance:
          'CSR matrix should reference each OEM requirement to the relevant control method.',
        response: 'Conforms',
      },
      {
        id: 'I6',
        text: 'Engineering changes are communicated to operations',
        clauseRef: '8.2.4',
        guidance: 'Check engineering change log against current drawing revisions on the floor.',
        response: 'N/A',
      },
      {
        id: 'I7',
        text: 'Drawing revisions on the floor match document control system',
        clauseRef: '8.2.4',
        guidance: 'Verify any hardcopy drawings are current revision stamped and dated.',
        response: 'Conforms',
      },
    ],
  },
  {
    id: 'S3',
    title: 'Measurement & Monitoring',
    clauseGroup: '9.1',
    items: [
      {
        id: 'I8',
        text: 'Gauges and measuring equipment have valid calibration stickers',
        clauseRef: '7.1.5',
        guidance:
          'Check calibration expiry dates on all gauges used in this process. Reject any expired.',
        response: 'Conforms',
      },
      {
        id: 'I9',
        text: 'Inspection records are complete and traceable',
        clauseRef: '9.1.1',
        guidance:
          'First-off, in-process, and final inspection records should be retrievable by lot number.',
        response: 'Conforms',
      },
      {
        id: 'I10',
        text: 'Non-conforming product is clearly identified and segregated',
        clauseRef: '8.7.1',
        guidance:
          'Red tags or red-outlined hold area must be in use. Counts in system should match physical.',
        response: 'Nonconformity',
        findingId: 'FND-2026-0062',
        note: 'Hold rack unlabeled, 4 suspect units mixed with production stock.',
      },
    ],
  },
  {
    id: 'S4',
    title: 'Personnel Competency',
    clauseGroup: '7.2',
    items: [
      {
        id: 'I11',
        text: 'Operators are trained and training records are current',
        clauseRef: '7.2',
        guidance:
          'Training matrix should show each operator trained on current revision of work instructions.',
        response: 'Conforms',
      },
      {
        id: 'I12',
        text: 'Skills matrix is posted and up to date',
        clauseRef: '7.2',
        guidance:
          'Look for a posted visual matrix showing which operators are qualified for each station.',
        response: 'Conforms',
      },
    ],
  },
];

const AUDIT_FINDINGS_DETAIL: AuditFindingDetail[] = [
  {
    id: 'FND-2026-0055',
    auditId: 'AUD-2026-007',
    description:
      'Customer-specific requirements not flowed down to work instructions. OEM CSR matrix references WI-DOC-0042 Rev C but floor copy is Rev B.',
    grade: 'Major',
    clauseRef: '8.2.3',
    status: 'Open',
    owner: 'Dev Patel',
    ownerInitials: 'DP',
    ownerColor: '#7C3AED',
    dueDate: '2026-07-10',
    ageInDays: 3,
    capaId: 'CAPA-2026-0032',
    evidenceCount: 2,
  },
  {
    id: 'FND-2026-0056',
    auditId: 'AUD-2026-007',
    description:
      'OEM change notification log not maintained since March 2026. 3 change notices received with no documented review.',
    grade: 'Minor',
    clauseRef: '8.2.4',
    status: 'Open',
    owner: 'Maria Delgado',
    ownerInitials: 'MD',
    ownerColor: '#2563EB',
    dueDate: '2026-07-10',
    ageInDays: 3,
    evidenceCount: 1,
  },
  {
    id: 'FND-2026-0061',
    auditId: 'AUD-2026-011',
    description:
      'Setup approval records missing QE sign-off for 3 of last 5 production runs at weld station 6. Nonconformance to 8.5.1 setup requirements.',
    grade: 'Major',
    clauseRef: '8.5.1',
    status: 'Open',
    owner: 'Dev Patel',
    ownerInitials: 'DP',
    ownerColor: '#7C3AED',
    dueDate: '2026-08-10',
    ageInDays: 0,
    capaId: 'CAPA-2026-0023',
    evidenceCount: 3,
  },
  {
    id: 'FND-2026-0062',
    auditId: 'AUD-2026-011',
    description:
      'Non-conforming product hold area lacked identification tags. 4 suspect bracket units found unsegregated in production stock.',
    grade: 'Minor',
    clauseRef: '8.7.1',
    status: 'Open',
    owner: 'James Okonkwo',
    ownerInitials: 'JO',
    ownerColor: '#059669',
    dueDate: '2026-08-10',
    ageInDays: 0,
    evidenceCount: 2,
  },
  {
    id: 'FND-2026-0035',
    auditId: 'AUD-2026-003',
    description:
      'Supplier control plan not updated after process change notification received 2026-04-08. Delta PPAP not submitted.',
    grade: 'Major',
    clauseRef: '8.4.1',
    status: 'Open',
    owner: 'Maria Delgado',
    ownerInitials: 'MD',
    ownerColor: '#2563EB',
    dueDate: '2026-06-22',
    ageInDays: 54,
    evidenceCount: 2,
  },
  {
    id: 'FND-2026-0036',
    auditId: 'AUD-2026-003',
    description:
      'PPAP documentation missing for 3 of 8 new supplier parts. Part numbers: FAST-M8-ACE, FAST-M12-ACE, CLIP-007.',
    grade: 'Major',
    clauseRef: '8.3.4',
    status: 'Open',
    owner: 'Priya Nair',
    ownerInitials: 'PN',
    ownerColor: '#DC2626',
    dueDate: '2026-06-22',
    ageInDays: 54,
    evidenceCount: 1,
  },
  {
    id: 'FND-2026-0040',
    auditId: 'AUD-2026-004',
    description:
      'Die maintenance intervals not tracked in system. Last PM recorded manually; no systematic tracking against stroke count.',
    grade: 'Minor',
    clauseRef: '8.5.1',
    status: 'Open',
    owner: 'Tom Braswell',
    ownerInitials: 'TB',
    ownerColor: '#B45309',
    dueDate: '2026-07-06',
    ageInDays: 39,
    capaId: 'CAPA-2026-0032',
    evidenceCount: 0,
  },
];

const AUDIT_HISTORY_011: AuditHistoryItem[] = [
  {
    id: 'AH-001',
    actor: 'Sarah Chen',
    actorInitials: 'SC',
    actorColor: '#0891B2',
    action: 'Audit scheduled',
    detail: 'Scheduled Q3 Production Process Audit for 2026-07-10',
    timestamp: '2026-06-01T09:00:00Z',
  },
  {
    id: 'AH-002',
    actor: 'Sarah Chen',
    actorInitials: 'SC',
    actorColor: '#0891B2',
    action: 'Checklist assigned',
    detail: 'Process Audit Standard checklist v2.3 assigned',
    timestamp: '2026-06-02T10:15:00Z',
  },
  {
    id: 'AH-003',
    actor: 'Dev Patel',
    actorInitials: 'DP',
    actorColor: '#7C3AED',
    action: 'Audit started',
    detail: 'Execution workspace opened, 12 items answered',
    timestamp: '2026-07-10T08:00:00Z',
  },
  {
    id: 'AH-004',
    actor: 'Dev Patel',
    actorInitials: 'DP',
    actorColor: '#7C3AED',
    action: 'Finding recorded',
    detail: 'FND-2026-0061 — Major: Setup approval missing (8.5.1)',
    timestamp: '2026-07-10T10:22:00Z',
  },
  {
    id: 'AH-005',
    actor: 'Dev Patel',
    actorInitials: 'DP',
    actorColor: '#7C3AED',
    action: 'Finding recorded',
    detail: 'FND-2026-0062 — Minor: Non-conforming product not segregated (8.7.1)',
    timestamp: '2026-07-10T11:05:00Z',
  },
  {
    id: 'AH-006',
    actor: 'Dev Patel',
    actorInitials: 'DP',
    actorColor: '#7C3AED',
    action: 'Audit closed',
    detail: 'All 12 checklist items answered. Audit closed.',
    timestamp: '2026-07-10T14:30:00Z',
  },
];

const AUDIT_DETAILS: AuditDetail[] = [
  {
    id: 'AUD-2026-011',
    title: 'Q3 Production Process Audit',
    type: 'Process',
    status: 'Completed',
    auditor: 'J. Kowalski',
    auditorInitials: 'JK',
    auditorColor: '#0891B2',
    auditee: 'Rosa Mendez',
    auditeeInitials: 'RM',
    auditeeColor: '#7C3AED',
    scheduledDate: '2026-07-10',
    completedDate: '2026-07-10',
    siteId: 'SITE-001',
    scope:
      'Weld Zone A and Assembly Line 2 operations — process controls, documentation, and nonconforming product handling.',
    objectives:
      'Verify conformance to IATF 16949 Clause 8.5 production process controls, Clause 8.2 customer requirements, and Clause 8.7 nonconforming output handling.',
    standard: 'IATF 16949:2016',
    sections: CHECKLIST_SECTIONS_PROCESS,
    findings: AUDIT_FINDINGS_DETAIL.filter((f) => f.auditId === 'AUD-2026-011'),
    history: AUDIT_HISTORY_011,
  },
  {
    id: 'AUD-2026-007',
    title: 'Customer Requirements Audit – OEM Clauses 8.4',
    type: 'Customer',
    status: 'In Progress',
    auditor: 'Maria Delgado',
    auditorInitials: 'MD',
    auditorColor: '#2563EB',
    auditee: 'Dev Patel',
    auditeeInitials: 'DP',
    auditeeColor: '#7C3AED',
    scheduledDate: '2026-06-10',
    siteId: 'SITE-001',
    scope:
      'OEM customer-specific requirements (CSR) flow-down verification for Ford, Stellantis supply chain.',
    objectives:
      'Verify all CSR are documented, flowed to operations, and monitored per IATF Clause 8.2 and 8.4 requirements.',
    standard: 'IATF 16949:2016 + FORD Q1 CSR',
    sections: CHECKLIST_SECTIONS_PROCESS.slice(0, 2),
    findings: AUDIT_FINDINGS_DETAIL.filter((f) => f.auditId === 'AUD-2026-007'),
    history: [
      {
        id: 'AH-101',
        actor: 'Maria Delgado',
        actorInitials: 'MD',
        actorColor: '#2563EB',
        action: 'Audit scheduled',
        detail: 'Scheduled for 2026-06-10',
        timestamp: '2026-05-20T09:00:00Z',
      },
      {
        id: 'AH-102',
        actor: 'Maria Delgado',
        actorInitials: 'MD',
        actorColor: '#2563EB',
        action: 'Audit started',
        detail: 'Execution workspace opened',
        timestamp: '2026-06-10T08:30:00Z',
      },
    ],
  },
];

// ── Audit Program Grid ────────────────────────────────────────────────────────

const AUDIT_PROGRAM_ENTRIES: AuditProgramEntry[] = [
  {
    auditId: 'AUD-2026-001',
    title: 'Q1 Internal Quality System Audit',
    type: 'System',
    auditorInitials: 'SC',
    processArea: 'Management & Planning',
    month: 3,
  },
  {
    auditId: 'AUD-2026-002',
    title: 'Weld Process Audit – Station 4 & 6',
    type: 'Process',
    auditorInitials: 'DP',
    processArea: 'Weld Zone Operations',
    month: 4,
  },
  {
    auditId: 'AUD-2026-003',
    title: 'Supplier Audit – ACE Fasteners',
    type: 'Process',
    auditorInitials: 'MD',
    processArea: 'Customer & Supplier',
    month: 4,
  },
  {
    auditId: 'AUD-2026-004',
    title: 'Stamping Line Process Audit',
    type: 'Process',
    auditorInitials: 'TB',
    processArea: 'Stamping & Forming',
    month: 5,
  },
  {
    auditId: 'AUD-2026-005',
    title: 'Management Review – Q1 2026',
    type: 'System',
    auditorInitials: 'SC',
    processArea: 'Management & Planning',
    month: 5,
  },
  {
    auditId: 'AUD-2026-006',
    title: 'Incoming Inspection Process Audit',
    type: 'Process',
    auditorInitials: 'PN',
    processArea: 'Incoming Inspection',
    month: 5,
  },
  {
    auditId: 'AUD-2026-007',
    title: 'Customer Requirements Audit',
    type: 'Process',
    auditorInitials: 'MD',
    processArea: 'Customer & Supplier',
    month: 6,
  },
  {
    auditId: 'AUD-2026-008',
    title: 'Paint Shop Process Audit',
    type: 'Process',
    auditorInitials: 'JO',
    processArea: 'Assembly Operations',
    month: 6,
  },
  {
    auditId: 'AUD-2026-009',
    title: 'Supplier Audit – Nova Steel',
    type: 'Process',
    auditorInitials: 'PN',
    processArea: 'Incoming Inspection',
    month: 6,
  },
  {
    auditId: 'AUD-2026-010',
    title: 'Internal Quality Audit – Plant 3',
    type: 'System',
    auditorInitials: 'TB',
    processArea: 'Management & Planning',
    month: 7,
  },
  {
    auditId: 'AUD-2026-011',
    title: 'Q3 Production Process Audit',
    type: 'Process',
    auditorInitials: 'SC',
    processArea: 'Weld Zone Operations',
    month: 7,
  },
  {
    auditId: 'AUD-2026-P01',
    title: 'Assembly Line LPA Audit',
    type: 'LPA',
    auditorInitials: 'JO',
    processArea: 'Assembly Operations',
    month: 8,
  },
  {
    auditId: 'AUD-2026-P02',
    title: 'Supplier Performance Review',
    type: 'System',
    auditorInitials: 'MD',
    processArea: 'Customer & Supplier',
    month: 8,
  },
  {
    auditId: 'AUD-2026-P03',
    title: 'Product Audit – BIW Panels',
    type: 'Product',
    auditorInitials: 'DP',
    processArea: 'Stamping & Forming',
    month: 9,
  },
  {
    auditId: 'AUD-2026-P04',
    title: 'Weld Zone LPA Audit',
    type: 'LPA',
    auditorInitials: 'JO',
    processArea: 'Weld Zone Operations',
    month: 9,
  },
  {
    auditId: 'AUD-2026-P05',
    title: 'Q3 Full System Internal Audit',
    type: 'System',
    auditorInitials: 'SC',
    processArea: 'Management & Planning',
    month: 10,
  },
  {
    auditId: 'AUD-2026-P06',
    title: 'Incoming Inspection Audit',
    type: 'Process',
    auditorInitials: 'PN',
    processArea: 'Incoming Inspection',
    month: 10,
  },
  {
    auditId: 'AUD-2026-P07',
    title: 'Customer Dock Audit – Ford',
    type: 'Product',
    auditorInitials: 'MD',
    processArea: 'Customer & Supplier',
    month: 11,
  },
  {
    auditId: 'AUD-2026-P08',
    title: 'Assembly Process Audit',
    type: 'Process',
    auditorInitials: 'DP',
    processArea: 'Assembly Operations',
    month: 11,
  },
  {
    auditId: 'AUD-2026-P09',
    title: 'Management Review – Q3/Q4',
    type: 'System',
    auditorInitials: 'SC',
    processArea: 'Management & Planning',
    month: 12,
  },
  {
    auditId: 'AUD-2026-P10',
    title: 'Year-End Product Audit',
    type: 'Product',
    auditorInitials: 'TB',
    processArea: 'Stamping & Forming',
    month: 12,
  },
];

// ── LPA Question Banks (same questions across all layers for the same area) ────

const WELD_QUESTIONS: LpaQuestion[] = [
  {
    id: 'Q1',
    text: 'Are weld parameters (current, voltage, wire speed) set to approved specifications?',
    clause: '8.5.1',
  },
  {
    id: 'Q2',
    text: 'Is the work instruction posted at the workstation and at current revision?',
    clause: '8.5.1',
  },
  {
    id: 'Q3',
    text: 'Are welding fixtures and jigs free from damage and set correctly?',
    clause: '8.5.1',
  },
  {
    id: 'Q4',
    text: 'Are gauges and measuring equipment calibrated and within expiry date?',
    clause: '7.1.5',
  },
  {
    id: 'Q5',
    text: 'Is PPE (welding gloves, face shield, apron) worn correctly by all operators?',
    clause: '7.1.4',
  },
  {
    id: 'Q6',
    text: 'Are non-conforming parts properly tagged and segregated from production stock?',
    clause: '8.7',
  },
  {
    id: 'Q7',
    text: 'Are first-off weld samples inspected and records completed before production run?',
    clause: '8.6',
  },
  {
    id: 'Q8',
    text: 'Is 5S maintained at the weld cell — area clean, tools in designated places?',
    clause: '7.1.4',
  },
];

const ASSEMBLY_QUESTIONS: LpaQuestion[] = [
  {
    id: 'Q1',
    text: 'Is the assembly work instruction posted and at current revision?',
    clause: '8.5.1',
  },
  {
    id: 'Q2',
    text: 'Are all torque tools calibrated and set to specified torque values?',
    clause: '7.1.5',
  },
  {
    id: 'Q3',
    text: 'Are operators working from the correct revision of assembly drawings?',
    clause: '8.5.1',
  },
  {
    id: 'Q4',
    text: 'Are mistake-proofing (poka-yoke) devices functional and verified at shift start?',
    clause: '8.5.1',
  },
  { id: 'Q5', text: 'Is PPE being worn correctly by all assembly operators?', clause: '7.1.4' },
  {
    id: 'Q6',
    text: 'Are non-conforming parts properly tagged and segregated from production stock?',
    clause: '8.7',
  },
  {
    id: 'Q7',
    text: 'Are in-process inspection records completed at the required frequency?',
    clause: '8.6',
  },
  { id: 'Q8', text: 'Is 5S maintained at the assembly station?', clause: '7.1.4' },
];

const STAMPING_QUESTIONS: LpaQuestion[] = [
  {
    id: 'Q1',
    text: 'Are press parameters (tonnage, speed, stroke) set to approved specifications?',
    clause: '8.5.1',
  },
  {
    id: 'Q2',
    text: 'Is the stamping work instruction posted and at current revision?',
    clause: '8.5.1',
  },
  {
    id: 'Q3',
    text: 'Are stamping dies inspected for wear or damage before production start?',
    clause: '8.5.1',
  },
  {
    id: 'Q4',
    text: 'Are measuring and gauging tools calibrated and within expiry date?',
    clause: '7.1.5',
  },
  {
    id: 'Q5',
    text: 'Is PPE (hearing protection, gloves, safety glasses) being worn correctly?',
    clause: '7.1.4',
  },
  {
    id: 'Q6',
    text: 'Are non-conforming stamped parts tagged and segregated immediately?',
    clause: '8.7',
  },
  {
    id: 'Q7',
    text: 'Are first-off stamped parts dimensionally inspected and records completed?',
    clause: '8.6',
  },
  {
    id: 'Q8',
    text: 'Is the die maintenance log current and PM schedule being followed?',
    clause: '8.5.1',
  },
];

const PAINT_QUESTIONS: LpaQuestion[] = [
  {
    id: 'Q1',
    text: 'Are paint application parameters (target thickness, viscosity, booth temperature) within spec?',
    clause: '8.5.1',
  },
  {
    id: 'Q2',
    text: 'Is the paint shop work instruction posted and at current revision?',
    clause: '8.5.1',
  },
  {
    id: 'Q3',
    text: 'Are paint thickness gauges calibrated and within expiry date?',
    clause: '7.1.5',
  },
  {
    id: 'Q4',
    text: 'Is PPE (respirator, chemical-resistant gloves, coveralls) being worn correctly?',
    clause: '7.1.4',
  },
  {
    id: 'Q5',
    text: 'Are non-conforming painted parts tagged and segregated from approved stock?',
    clause: '8.7',
  },
  {
    id: 'Q6',
    text: 'Are painted panels inspected for thickness and appearance at required frequency?',
    clause: '8.6',
  },
  {
    id: 'Q7',
    text: 'Are booth temperature and humidity within the specified environmental conditions?',
    clause: '7.1.4',
  },
  { id: 'Q8', text: 'Is 5S maintained in the paint booth and mixing area?', clause: '7.1.4' },
];

const INCOMING_QUESTIONS: LpaQuestion[] = [
  {
    id: 'Q1',
    text: 'Are incoming parts inspected per the approved inspection plan and AQL level?',
    clause: '8.4.3',
  },
  {
    id: 'Q2',
    text: 'Are measuring instruments used for incoming inspection calibrated?',
    clause: '7.1.5',
  },
  {
    id: 'Q3',
    text: 'Are non-conforming received parts immediately quarantined and tagged?',
    clause: '8.7',
  },
  {
    id: 'Q4',
    text: 'Are supplier certifications (CoC, material certs) verified and filed for each lot?',
    clause: '8.4.3',
  },
  {
    id: 'Q5',
    text: 'Are received parts traceable to supplier lot number and receiving record?',
    clause: '8.5.2',
  },
  {
    id: 'Q6',
    text: 'Is the approved supplier list (ASL) verified before accepting each delivery?',
    clause: '8.4.1',
  },
  {
    id: 'Q7',
    text: 'Are receiving area and inspection station organized and clearly labeled?',
    clause: '7.1.4',
  },
  {
    id: 'Q8',
    text: 'Are inspection records completed and signed off for each received lot?',
    clause: '8.4.3',
  },
];

const QUALITY_GATE_QUESTIONS: LpaQuestion[] = [
  {
    id: 'Q1',
    text: 'Are all final inspection checks being performed per the current control plan?',
    clause: '8.6',
  },
  {
    id: 'Q2',
    text: 'Are measuring instruments used for final inspection calibrated and within expiry?',
    clause: '7.1.5',
  },
  {
    id: 'Q3',
    text: 'Is the final inspection form at current revision and fully completed?',
    clause: '8.6',
  },
  {
    id: 'Q4',
    text: 'Are non-conforming finished products tagged and segregated before shipment?',
    clause: '8.7',
  },
  {
    id: 'Q5',
    text: 'Are customer-specific inspection requirements clearly documented and being met?',
    clause: '8.2.3',
  },
  {
    id: 'Q6',
    text: 'Are inspection records traceable to production lot and batch number?',
    clause: '8.5.2',
  },
  {
    id: 'Q7',
    text: 'Is release authority approval in place before any product is shipped?',
    clause: '8.6',
  },
  {
    id: 'Q8',
    text: 'Is 5S maintained at the final inspection and shipping staging area?',
    clause: '7.1.4',
  },
];

const FULL_PLANT_SUPERVISOR_QUESTIONS: LpaQuestion[] = [
  {
    id: 'Q1',
    text: 'Are all open NCRs assigned and being actively worked across all areas?',
    clause: '10.2',
  },
  {
    id: 'Q2',
    text: 'Are process control charts being monitored and acted upon in all areas?',
    clause: '9.1.1',
  },
  {
    id: 'Q3',
    text: 'Are operator training records current and skills matrices up to date?',
    clause: '7.2',
  },
  {
    id: 'Q4',
    text: 'Are customer-specific requirements visible at point-of-use across all lines?',
    clause: '8.2.3',
  },
  { id: 'Q5', text: 'Are all open CAPA actions progressing on schedule?', clause: '10.2' },
  {
    id: 'Q6',
    text: 'Are mistake-proofing devices verified as functional across all production areas?',
    clause: '8.5.1',
  },
  { id: 'Q7', text: 'Is the quality alert log current and all alerts actioned?', clause: '9.1.1' },
  {
    id: 'Q8',
    text: 'Are all calibration records current with no overdue instruments plant-wide?',
    clause: '7.1.5',
  },
];

const FULL_PLANT_MANAGER_QUESTIONS: LpaQuestion[] = [
  {
    id: 'Q1',
    text: 'Are quality objectives being met per the current quality plan?',
    clause: '9.1.3',
  },
  {
    id: 'Q2',
    text: 'Is the internal audit schedule on track and findings being closed on time?',
    clause: '9.2',
  },
  {
    id: 'Q3',
    text: 'Are all overdue CAPAs escalated with a documented recovery plan?',
    clause: '10.2',
  },
  {
    id: 'Q4',
    text: 'Are customer scorecards reviewed and improvement actions in place?',
    clause: '8.2.1',
  },
  {
    id: 'Q5',
    text: 'Is the management review meeting scheduled and agenda prepared?',
    clause: '9.3',
  },
  {
    id: 'Q6',
    text: 'Are key performance indicators (KPIs) reviewed and trend analysis current?',
    clause: '9.1.3',
  },
  {
    id: 'Q7',
    text: 'Are all supplier performance issues being tracked and actioned?',
    clause: '8.4.2',
  },
  {
    id: 'Q8',
    text: 'Is the risk register current and high-risk items being actively mitigated?',
    clause: '6.1',
  },
];

// ── LPA Templates ─────────────────────────────────────────────────────────────
// Same questions for L1/L2/L3 of the same area — independent verification is the point

const LPA_TEMPLATES: LpaTemplate[] = [
  // Weld Zone — L1 / L2 / L3
  {
    id: 'LPAT-001',
    name: 'Weld Zone – Operator Daily Check',
    layer: 'Operator',
    frequency: 'Daily',
    areas: ['Weld Zone A', 'Weld Zone B'],
    questions: WELD_QUESTIONS,
  },
  {
    id: 'LPAT-002',
    name: 'Weld Zone – Supervisor Weekly Review',
    layer: 'Supervisor',
    frequency: 'Weekly',
    areas: ['Weld Zone A', 'Weld Zone B'],
    questions: WELD_QUESTIONS,
  },
  {
    id: 'LPAT-003',
    name: 'Weld Zone – Manager Monthly Review',
    layer: 'Manager',
    frequency: 'Monthly',
    areas: ['Weld Zone A', 'Weld Zone B'],
    questions: WELD_QUESTIONS,
  },
  // Assembly Line — L1 / L2 / L3
  {
    id: 'LPAT-004',
    name: 'Assembly Line – Operator Daily Check',
    layer: 'Operator',
    frequency: 'Daily',
    areas: ['Assembly Line 1', 'Assembly Line 2'],
    questions: ASSEMBLY_QUESTIONS,
  },
  {
    id: 'LPAT-005',
    name: 'Assembly Line – Supervisor Weekly Review',
    layer: 'Supervisor',
    frequency: 'Weekly',
    areas: ['Assembly Line 1', 'Assembly Line 2'],
    questions: ASSEMBLY_QUESTIONS,
  },
  {
    id: 'LPAT-006',
    name: 'Assembly Line – Manager Monthly Review',
    layer: 'Manager',
    frequency: 'Monthly',
    areas: ['Assembly Line 1', 'Assembly Line 2'],
    questions: ASSEMBLY_QUESTIONS,
  },
  // Stamping — L1 / L2 / L3
  {
    id: 'LPAT-007',
    name: 'Stamping – Operator Daily Check',
    layer: 'Operator',
    frequency: 'Daily',
    areas: ['Stamping'],
    questions: STAMPING_QUESTIONS,
  },
  {
    id: 'LPAT-008',
    name: 'Stamping – Supervisor Weekly Review',
    layer: 'Supervisor',
    frequency: 'Weekly',
    areas: ['Stamping'],
    questions: STAMPING_QUESTIONS,
  },
  {
    id: 'LPAT-009',
    name: 'Stamping – Manager Monthly Review',
    layer: 'Manager',
    frequency: 'Monthly',
    areas: ['Stamping'],
    questions: STAMPING_QUESTIONS,
  },
  // Paint Shop — L1 / L2 / L3
  {
    id: 'LPAT-010',
    name: 'Paint Shop – Operator Daily Check',
    layer: 'Operator',
    frequency: 'Daily',
    areas: ['Paint Shop'],
    questions: PAINT_QUESTIONS,
  },
  {
    id: 'LPAT-011',
    name: 'Paint Shop – Supervisor Weekly Review',
    layer: 'Supervisor',
    frequency: 'Weekly',
    areas: ['Paint Shop'],
    questions: PAINT_QUESTIONS,
  },
  {
    id: 'LPAT-012',
    name: 'Paint Shop – Manager Monthly Review',
    layer: 'Manager',
    frequency: 'Monthly',
    areas: ['Paint Shop'],
    questions: PAINT_QUESTIONS,
  },
  // Incoming Inspection — L1 / L2 / L3
  {
    id: 'LPAT-013',
    name: 'Incoming Inspection – Operator Daily Check',
    layer: 'Operator',
    frequency: 'Daily',
    areas: ['Incoming Inspection'],
    questions: INCOMING_QUESTIONS,
  },
  {
    id: 'LPAT-014',
    name: 'Incoming Inspection – Supervisor Weekly Review',
    layer: 'Supervisor',
    frequency: 'Weekly',
    areas: ['Incoming Inspection'],
    questions: INCOMING_QUESTIONS,
  },
  {
    id: 'LPAT-015',
    name: 'Incoming Inspection – Manager Monthly Review',
    layer: 'Manager',
    frequency: 'Monthly',
    areas: ['Incoming Inspection'],
    questions: INCOMING_QUESTIONS,
  },
  // Quality Gate — L1 / L2 / L3
  {
    id: 'LPAT-016',
    name: 'Quality Gate – Operator Daily Check',
    layer: 'Operator',
    frequency: 'Daily',
    areas: ['Quality Gate'],
    questions: QUALITY_GATE_QUESTIONS,
  },
  {
    id: 'LPAT-017',
    name: 'Quality Gate – Supervisor Weekly Review',
    layer: 'Supervisor',
    frequency: 'Weekly',
    areas: ['Quality Gate'],
    questions: QUALITY_GATE_QUESTIONS,
  },
  {
    id: 'LPAT-018',
    name: 'Quality Gate – Manager Monthly Review',
    layer: 'Manager',
    frequency: 'Monthly',
    areas: ['Quality Gate'],
    questions: QUALITY_GATE_QUESTIONS,
  },
  // Full Plant — L2 / L3 only (plant-wide management reviews)
  {
    id: 'LPAT-019',
    name: 'Full Plant – Supervisor Weekly Review',
    layer: 'Supervisor',
    frequency: 'Weekly',
    areas: ['Full Plant'],
    questions: FULL_PLANT_SUPERVISOR_QUESTIONS,
  },
  {
    id: 'LPAT-020',
    name: 'Full Plant – Manager Monthly Review',
    layer: 'Manager',
    frequency: 'Monthly',
    areas: ['Full Plant'],
    questions: FULL_PLANT_MANAGER_QUESTIONS,
  },
];

const LPA_SCHEDULES: LpaScheduleEntry[] = [
  // ── Plant-1 · Detroit (Weld Zone, Assembly Line, Quality Gate) ────────────
  // Weld Zone A — Operator: Ravi Kumar (QT)  |  Supervisor: Dev Patel (QE)  |  Manager: Maria Delgado (QM)
  {
    id: 'LPAS-001',
    templateId: 'LPAT-001',
    templateName: 'Weld Zone – Operator Daily Check',
    layer: 'Operator',
    area: 'Weld Zone A',
    startDate: '2026-01-06',
    assignee: 'Ravi Kumar',
    assigneeInitials: 'RK',
    assigneeColor: '#EA580C',
  },
  {
    id: 'LPAS-002',
    templateId: 'LPAT-002',
    templateName: 'Weld Zone – Supervisor Weekly Review',
    layer: 'Supervisor',
    area: 'Weld Zone A',
    startDate: '2026-01-06',
    assignee: 'Dev Patel',
    assigneeInitials: 'DP',
    assigneeColor: '#7C3AED',
  },
  {
    id: 'LPAS-003',
    templateId: 'LPAT-003',
    templateName: 'Weld Zone – Manager Monthly Review',
    layer: 'Manager',
    area: 'Weld Zone A',
    startDate: '2026-01-20',
    assignee: 'Maria Delgado',
    assigneeInitials: 'MD',
    assigneeColor: '#2563EB',
  },
  // Weld Zone B — Operator: Ravi Kumar (QT)  |  Supervisor: Dev Patel (QE)  |  Manager: Maria Delgado (QM)
  {
    id: 'LPAS-004',
    templateId: 'LPAT-001',
    templateName: 'Weld Zone – Operator Daily Check',
    layer: 'Operator',
    area: 'Weld Zone B',
    startDate: '2026-01-06',
    assignee: 'Ravi Kumar',
    assigneeInitials: 'RK',
    assigneeColor: '#EA580C',
  },
  {
    id: 'LPAS-005',
    templateId: 'LPAT-002',
    templateName: 'Weld Zone – Supervisor Weekly Review',
    layer: 'Supervisor',
    area: 'Weld Zone B',
    startDate: '2026-01-06',
    assignee: 'Dev Patel',
    assigneeInitials: 'DP',
    assigneeColor: '#7C3AED',
  },
  {
    id: 'LPAS-006',
    templateId: 'LPAT-003',
    templateName: 'Weld Zone – Manager Monthly Review',
    layer: 'Manager',
    area: 'Weld Zone B',
    startDate: '2026-01-20',
    assignee: 'Maria Delgado',
    assigneeInitials: 'MD',
    assigneeColor: '#2563EB',
  },
  // Assembly Line 1 — Operator: Ravi Kumar (QT)  |  Supervisor: Dev Patel (QE)  |  Manager: Maria Delgado (QM)
  {
    id: 'LPAS-007',
    templateId: 'LPAT-004',
    templateName: 'Assembly Line – Operator Daily Check',
    layer: 'Operator',
    area: 'Assembly Line 1',
    startDate: '2026-01-06',
    assignee: 'Ravi Kumar',
    assigneeInitials: 'RK',
    assigneeColor: '#EA580C',
  },
  {
    id: 'LPAS-008',
    templateId: 'LPAT-005',
    templateName: 'Assembly Line – Supervisor Weekly Review',
    layer: 'Supervisor',
    area: 'Assembly Line 1',
    startDate: '2026-01-06',
    assignee: 'Dev Patel',
    assigneeInitials: 'DP',
    assigneeColor: '#7C3AED',
  },
  {
    id: 'LPAS-009',
    templateId: 'LPAT-006',
    templateName: 'Assembly Line – Manager Monthly Review',
    layer: 'Manager',
    area: 'Assembly Line 1',
    startDate: '2026-01-20',
    assignee: 'Maria Delgado',
    assigneeInitials: 'MD',
    assigneeColor: '#2563EB',
  },
  // Assembly Line 2 — Operator: Ravi Kumar (QT)  |  Supervisor: Dev Patel (QE)  |  Manager: Maria Delgado (QM)
  {
    id: 'LPAS-010',
    templateId: 'LPAT-004',
    templateName: 'Assembly Line – Operator Daily Check',
    layer: 'Operator',
    area: 'Assembly Line 2',
    startDate: '2026-01-06',
    assignee: 'Ravi Kumar',
    assigneeInitials: 'RK',
    assigneeColor: '#EA580C',
  },
  {
    id: 'LPAS-011',
    templateId: 'LPAT-005',
    templateName: 'Assembly Line – Supervisor Weekly Review',
    layer: 'Supervisor',
    area: 'Assembly Line 2',
    startDate: '2026-01-06',
    assignee: 'Dev Patel',
    assigneeInitials: 'DP',
    assigneeColor: '#7C3AED',
  },
  {
    id: 'LPAS-012',
    templateId: 'LPAT-006',
    templateName: 'Assembly Line – Manager Monthly Review',
    layer: 'Manager',
    area: 'Assembly Line 2',
    startDate: '2026-01-20',
    assignee: 'Maria Delgado',
    assigneeInitials: 'MD',
    assigneeColor: '#2563EB',
  },
  // Quality Gate — Operator: Ravi Kumar (QT)  |  Supervisor: Dev Patel (QE)  |  Manager: Maria Delgado (QM)
  {
    id: 'LPAS-022',
    templateId: 'LPAT-016',
    templateName: 'Quality Gate – Operator Daily Check',
    layer: 'Operator',
    area: 'Quality Gate',
    startDate: '2026-01-06',
    assignee: 'Ravi Kumar',
    assigneeInitials: 'RK',
    assigneeColor: '#EA580C',
  },
  {
    id: 'LPAS-023',
    templateId: 'LPAT-017',
    templateName: 'Quality Gate – Supervisor Weekly Review',
    layer: 'Supervisor',
    area: 'Quality Gate',
    startDate: '2026-01-06',
    assignee: 'Dev Patel',
    assigneeInitials: 'DP',
    assigneeColor: '#7C3AED',
  },
  {
    id: 'LPAS-024',
    templateId: 'LPAT-018',
    templateName: 'Quality Gate – Manager Monthly Review',
    layer: 'Manager',
    area: 'Quality Gate',
    startDate: '2026-01-20',
    assignee: 'Maria Delgado',
    assigneeInitials: 'MD',
    assigneeColor: '#2563EB',
  },

  // ── Plant-2 · Chicago (Paint Shop, Incoming Inspection) ───────────────────
  // Paint Shop — Operator: Lisa Park (Operator)  |  Supervisor: Priya Nair (QE)  |  Manager: Carlos Mendez (PM)
  {
    id: 'LPAS-016',
    templateId: 'LPAT-010',
    templateName: 'Paint Shop – Operator Daily Check',
    layer: 'Operator',
    area: 'Paint Shop',
    startDate: '2026-01-06',
    assignee: 'Lisa Park',
    assigneeInitials: 'LP',
    assigneeColor: '#0369A1',
  },
  {
    id: 'LPAS-017',
    templateId: 'LPAT-011',
    templateName: 'Paint Shop – Supervisor Weekly Review',
    layer: 'Supervisor',
    area: 'Paint Shop',
    startDate: '2026-01-06',
    assignee: 'Priya Nair',
    assigneeInitials: 'PN',
    assigneeColor: '#DC2626',
  },
  {
    id: 'LPAS-018',
    templateId: 'LPAT-012',
    templateName: 'Paint Shop – Manager Monthly Review',
    layer: 'Manager',
    area: 'Paint Shop',
    startDate: '2026-01-20',
    assignee: 'Carlos Mendez',
    assigneeInitials: 'CM',
    assigneeColor: '#0F766E',
  },
  // Incoming Inspection — Operator: Lisa Park (Operator)  |  Supervisor: James Okonkwo (QS)  |  Manager: Carlos Mendez (PM)
  {
    id: 'LPAS-019',
    templateId: 'LPAT-013',
    templateName: 'Incoming Inspection – Operator Daily Check',
    layer: 'Operator',
    area: 'Incoming Inspection',
    startDate: '2026-01-06',
    assignee: 'Lisa Park',
    assigneeInitials: 'LP',
    assigneeColor: '#0369A1',
  },
  {
    id: 'LPAS-020',
    templateId: 'LPAT-014',
    templateName: 'Incoming Inspection – Supervisor Weekly Review',
    layer: 'Supervisor',
    area: 'Incoming Inspection',
    startDate: '2026-01-06',
    assignee: 'James Okonkwo',
    assigneeInitials: 'JO',
    assigneeColor: '#059669',
  },
  {
    id: 'LPAS-021',
    templateId: 'LPAT-015',
    templateName: 'Incoming Inspection – Manager Monthly Review',
    layer: 'Manager',
    area: 'Incoming Inspection',
    startDate: '2026-01-20',
    assignee: 'Carlos Mendez',
    assigneeInitials: 'CM',
    assigneeColor: '#0F766E',
  },

  // ── Plant-3 · Cleveland (Stamping) ────────────────────────────────────────
  // Stamping — Operator: Lisa Park (Operator)  |  Supervisor: Aisha Williams (ME)  |  Manager: Tom Braswell (QM)
  {
    id: 'LPAS-013',
    templateId: 'LPAT-007',
    templateName: 'Stamping – Operator Daily Check',
    layer: 'Operator',
    area: 'Stamping',
    startDate: '2026-01-06',
    assignee: 'Lisa Park',
    assigneeInitials: 'LP',
    assigneeColor: '#0369A1',
  },
  {
    id: 'LPAS-014',
    templateId: 'LPAT-008',
    templateName: 'Stamping – Supervisor Weekly Review',
    layer: 'Supervisor',
    area: 'Stamping',
    startDate: '2026-01-06',
    assignee: 'Aisha Williams',
    assigneeInitials: 'AW',
    assigneeColor: '#9333EA',
  },
  {
    id: 'LPAS-015',
    templateId: 'LPAT-009',
    templateName: 'Stamping – Manager Monthly Review',
    layer: 'Manager',
    area: 'Stamping',
    startDate: '2026-01-20',
    assignee: 'Tom Braswell',
    assigneeInitials: 'TB',
    assigneeColor: '#B45309',
  },

  // ── Cross-Plant (Full Plant) ───────────────────────────────────────────────
  // Full Plant — no Operator layer  |  Supervisor: Dev Patel (QE)  |  Manager: Maria Delgado (QM)
  {
    id: 'LPAS-025',
    templateId: 'LPAT-019',
    templateName: 'Full Plant – Supervisor Weekly Review',
    layer: 'Supervisor',
    area: 'Full Plant',
    startDate: '2026-01-05',
    assignee: 'Dev Patel',
    assigneeInitials: 'DP',
    assigneeColor: '#7C3AED',
  },
  {
    id: 'LPAS-026',
    templateId: 'LPAT-020',
    templateName: 'Full Plant – Manager Monthly Review',
    layer: 'Manager',
    area: 'Full Plant',
    startDate: '2026-01-20',
    assignee: 'Maria Delgado',
    assigneeInitials: 'MD',
    assigneeColor: '#2563EB',
  },
];

@Injectable({ providedIn: 'root' })
export class MockDataService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  readonly siteStore = inject(SiteStore);

  // ── ID counters ────────────────────────────────────────────────────────────
  private ncrCounter = signal(150);
  private docCounter = signal(49);
  private complaintCounter = signal(9);
  private caCounter = signal(4);
  private ncrEventCounter = signal(0);
  private capaCounter = signal(32);

  // ── Reactive mutable state ─────────────────────────────────────────────────
  private _documents = signal<QDocument[]>([...INITIAL_DOCUMENTS]);
  private _ncrs = signal<NCR[]>([...INITIAL_NCRS]);
  private _complaints = signal<CustomerComplaint[]>([...INITIAL_COMPLAINTS]);
  private _containmentActions = signal<ContainmentAction[]>([...INITIAL_CONTAINMENT_ACTIONS]);
  private _workItems = signal<WorkItem[]>([...INITIAL_WORK_ITEMS]);
  private _docTypes = signal<DocType[]>([...INITIAL_DOC_TYPES]);
  private _capas8d = signal<CAPA8D[]>([...INITIAL_CAPAS_8D]);
  private _ncrEvents = signal<NcrHistoryEvent[]>([]);
  private _ncrAttachments = signal<NcrAttachment[]>([...INITIAL_NCR_ATTACHMENTS]);

  // ── Public readonly signals ────────────────────────────────────────────────
  readonly documents = this._documents.asReadonly();
  readonly ncrs = this._ncrs.asReadonly();
  readonly complaints = this._complaints.asReadonly();
  readonly containmentActions = this._containmentActions.asReadonly();
  readonly workItems = this._workItems.asReadonly();
  readonly docTypes = this._docTypes.asReadonly();
  readonly capas8d = this._capas8d.asReadonly();
  readonly ncrEvents = this._ncrEvents.asReadonly();
  readonly ncrAttachments = this._ncrAttachments.asReadonly();

  // ── Site-filtered computed signals ────────────────────────────────────────
  readonly siteNcrs = computed(() => {
    const id = this.siteStore.currentSiteId();
    return this._ncrs().filter((n) => n.siteId === id);
  });

  readonly siteDocuments = computed(() => {
    const id = this.siteStore.currentSiteId();
    return this._documents().filter((d) => d.siteId === id);
  });

  readonly siteComplaints = computed(() => {
    const siteNcrIds = new Set(this.siteNcrs().map((n) => n.id));
    return this._complaints().filter((c) => siteNcrIds.has(c.ncrId!));
  });

  readonly siteCapas = computed(() => {
    const id = this.siteStore.currentSiteId();
    return this.capas.filter((c) => c.siteId === id);
  });

  readonly siteAudits = computed(() => {
    const id = this.siteStore.currentSiteId();
    return this.audits.filter((a) => a.siteId === id);
  });

  readonly siteWorkItems = computed(() => {
    const id = this.siteStore.currentSiteId();
    return this._workItems().filter((w) => w.siteId === id);
  });

  // ── Static (non-mutable for demo) data ────────────────────────────────────
  readonly users: QUser[] = INITIAL_USERS;
  readonly sites: Site[] = INITIAL_SITES;

  readonly capas: CAPA[] = [
    {
      id: 'CAPA-2026-0020',
      title: 'Paint delamination root cause – OEM complaint',
      status: 'Open',
      currentStep: 'Root Cause Analysis',
      stepNumber: 2,
      totalSteps: 5,
      owner: 'Dev Patel',
      ownerInitials: 'DP',
      siteId: 'SITE-001',
      dueDate: '2026-07-15',
      createdAt: '2026-06-03',
      onTime: true,
      ncrId: 'NCR-2026-0131',
      completionPct: 30,
    },
    {
      id: 'CAPA-2026-0021',
      title: 'B-pillar weld porosity – process improvement',
      status: 'Open',
      currentStep: 'Containment',
      stepNumber: 1,
      totalSteps: 5,
      owner: 'Maria Delgado',
      ownerInitials: 'MD',
      siteId: 'SITE-001',
      dueDate: '2026-06-25',
      createdAt: '2026-05-12',
      onTime: false,
      ncrId: 'NCR-2026-0100',
      completionPct: 20,
    },
    {
      id: 'CAPA-2026-0022',
      title: 'Supplier steel certification audit response',
      status: 'Open',
      currentStep: 'Corrective Action Plan',
      stepNumber: 3,
      totalSteps: 5,
      owner: 'Priya Nair',
      ownerInitials: 'PN',
      siteId: 'SITE-002',
      dueDate: '2026-07-01',
      createdAt: '2026-05-20',
      onTime: true,
      ncrId: 'NCR-2026-0108',
      completionPct: 50,
    },
    {
      id: 'CAPA-2026-0023',
      title: 'Seat rail torque SPC monitoring implementation',
      status: 'Open',
      currentStep: 'Verification',
      stepNumber: 4,
      totalSteps: 5,
      owner: 'Tom Braswell',
      ownerInitials: 'TB',
      siteId: 'SITE-003',
      dueDate: '2026-07-10',
      createdAt: '2026-05-25',
      onTime: true,
      completionPct: 70,
    },
    {
      id: 'CAPA-2026-0024',
      title: 'Calibration management system upgrade',
      status: 'Open',
      currentStep: 'Root Cause Analysis',
      stepNumber: 2,
      totalSteps: 5,
      owner: 'Dev Patel',
      ownerInitials: 'DP',
      siteId: 'SITE-001',
      dueDate: '2026-06-30',
      createdAt: '2026-05-28',
      onTime: true,
      completionPct: 30,
    },
    {
      id: 'CAPA-2026-0025',
      title: 'Incoming inspection AQL tightening – fasteners',
      status: 'Open',
      currentStep: 'Corrective Action Plan',
      stepNumber: 3,
      totalSteps: 5,
      owner: 'James Okonkwo',
      ownerInitials: 'JO',
      siteId: 'SITE-002',
      dueDate: '2026-07-20',
      createdAt: '2026-06-01',
      onTime: true,
      completionPct: 55,
    },
    {
      id: 'CAPA-2026-0026',
      title: 'Visual inspection lighting upgrade – station 12',
      status: 'Open',
      currentStep: 'Implementation',
      stepNumber: 4,
      totalSteps: 5,
      owner: 'Tom Braswell',
      ownerInitials: 'TB',
      siteId: 'SITE-003',
      dueDate: '2026-07-05',
      createdAt: '2026-06-05',
      onTime: true,
      completionPct: 65,
    },
    {
      id: 'CAPA-2026-0027',
      title: 'Traveler card sign-off SOP revision',
      status: 'Open',
      currentStep: 'Containment',
      stepNumber: 1,
      totalSteps: 5,
      owner: 'Sarah Chen',
      ownerInitials: 'SC',
      siteId: 'SITE-001',
      dueDate: '2026-07-15',
      createdAt: '2026-06-06',
      onTime: true,
      completionPct: 10,
    },
    {
      id: 'CAPA-2026-0028',
      title: 'Heat treat process revalidation after hardness failure',
      status: 'Open',
      currentStep: 'Root Cause Analysis',
      stepNumber: 2,
      totalSteps: 5,
      owner: 'Priya Nair',
      ownerInitials: 'PN',
      siteId: 'SITE-002',
      dueDate: '2026-07-01',
      createdAt: '2026-06-02',
      onTime: true,
      completionPct: 35,
    },
    {
      id: 'CAPA-2026-0029',
      title: 'Label printer configuration – part number error prevention',
      status: 'Open',
      currentStep: 'Verification',
      stepNumber: 4,
      totalSteps: 5,
      owner: 'Dev Patel',
      ownerInitials: 'DP',
      siteId: 'SITE-001',
      dueDate: '2026-06-28',
      createdAt: '2026-05-26',
      onTime: false,
      completionPct: 75,
    },
    {
      id: 'CAPA-2026-0030',
      title: 'Door gap alignment fixture adjustment program',
      status: 'Open',
      currentStep: 'Root Cause Analysis',
      stepNumber: 2,
      totalSteps: 5,
      owner: 'Maria Delgado',
      ownerInitials: 'MD',
      siteId: 'SITE-001',
      dueDate: '2026-07-20',
      createdAt: '2026-06-10',
      onTime: true,
      ncrId: 'NCR-2026-0140',
      completionPct: 25,
    },
    {
      id: 'CAPA-2026-0031',
      title: 'Electrostatic coating parameter review',
      status: 'Open',
      currentStep: 'Corrective Action Plan',
      stepNumber: 3,
      totalSteps: 5,
      owner: 'Maria Delgado',
      ownerInitials: 'MD',
      siteId: 'SITE-001',
      dueDate: '2026-07-10',
      createdAt: '2026-05-30',
      onTime: true,
      completionPct: 50,
    },
    {
      id: 'CAPA-2026-0032',
      title: 'Dimension deviation prevention – hinge bracket die maintenance',
      status: 'Open',
      currentStep: 'Implementation',
      stepNumber: 4,
      totalSteps: 5,
      owner: 'Dev Patel',
      ownerInitials: 'DP',
      siteId: 'SITE-001',
      dueDate: '2026-07-05',
      createdAt: '2026-05-16',
      onTime: false,
      ncrId: 'NCR-2026-0103',
      completionPct: 68,
    },
  ];

  readonly audits: Audit[] = [
    {
      id: 'AUD-2026-001',
      title: 'Q1 Internal Quality System Audit – IATF 16949',
      type: 'Internal Quality',
      status: 'Completed',
      auditor: 'Sarah Chen',
      auditorInitials: 'SC',
      auditorColor: '#0891B2',
      scheduledDate: '2026-03-15',
      completedDate: '2026-03-17',
      siteId: 'SITE-001',
      findingCount: 5,
      openFindingCount: 1,
    },
    {
      id: 'AUD-2026-002',
      title: 'Weld Process Audit – Station 4 & 6',
      type: 'Process',
      status: 'Completed',
      auditor: 'Dev Patel',
      auditorInitials: 'DP',
      auditorColor: '#7C3AED',
      scheduledDate: '2026-04-02',
      completedDate: '2026-04-02',
      siteId: 'SITE-001',
      findingCount: 3,
      openFindingCount: 0,
    },
    {
      id: 'AUD-2026-003',
      title: 'Supplier Audit – ACE Fasteners Inc.',
      type: 'Supplier',
      status: 'Completed',
      auditor: 'Maria Delgado',
      auditorInitials: 'MD',
      auditorColor: '#2563EB',
      scheduledDate: '2026-04-20',
      completedDate: '2026-04-22',
      siteId: 'SITE-002',
      findingCount: 7,
      openFindingCount: 3,
    },
    {
      id: 'AUD-2026-004',
      title: 'Stamping Line Process Audit – Plant 3',
      type: 'Process',
      status: 'Completed',
      auditor: 'Tom Braswell',
      auditorInitials: 'TB',
      auditorColor: '#B45309',
      scheduledDate: '2026-05-05',
      completedDate: '2026-05-06',
      siteId: 'SITE-003',
      findingCount: 4,
      openFindingCount: 2,
    },
    {
      id: 'AUD-2026-005',
      title: 'Management Review – Q1 2026',
      type: 'Management Review',
      status: 'Completed',
      auditor: 'Sarah Chen',
      auditorInitials: 'SC',
      auditorColor: '#0891B2',
      scheduledDate: '2026-05-12',
      completedDate: '2026-05-12',
      siteId: 'SITE-001',
      findingCount: 2,
      openFindingCount: 0,
    },
    {
      id: 'AUD-2026-006',
      title: 'Incoming Inspection Process Audit – Plant 2',
      type: 'Process',
      status: 'Completed',
      auditor: 'Priya Nair',
      auditorInitials: 'PN',
      auditorColor: '#DC2626',
      scheduledDate: '2026-05-20',
      completedDate: '2026-05-21',
      siteId: 'SITE-002',
      findingCount: 6,
      openFindingCount: 4,
    },
    {
      id: 'AUD-2026-007',
      title: 'Customer Requirements Audit – OEM Clauses 8.4',
      type: 'Customer',
      status: 'In Progress',
      auditor: 'Maria Delgado',
      auditorInitials: 'MD',
      auditorColor: '#2563EB',
      scheduledDate: '2026-06-10',
      siteId: 'SITE-001',
      findingCount: 2,
      openFindingCount: 2,
    },
    {
      id: 'AUD-2026-008',
      title: 'Paint Shop Process Audit – Plant 2',
      type: 'Process',
      status: 'Planned',
      auditor: 'James Okonkwo',
      auditorInitials: 'JO',
      auditorColor: '#059669',
      scheduledDate: '2026-06-18',
      siteId: 'SITE-002',
      findingCount: 0,
      openFindingCount: 0,
    },
    {
      id: 'AUD-2026-009',
      title: 'Supplier Audit – Nova Steel Components',
      type: 'Supplier',
      status: 'Planned',
      auditor: 'Priya Nair',
      auditorInitials: 'PN',
      auditorColor: '#DC2626',
      scheduledDate: '2026-06-25',
      siteId: 'SITE-002',
      findingCount: 0,
      openFindingCount: 0,
    },
    {
      id: 'AUD-2026-010',
      title: 'Internal Quality Audit – Plant 3 Scope',
      type: 'Internal Quality',
      status: 'Planned',
      auditor: 'Tom Braswell',
      auditorInitials: 'TB',
      auditorColor: '#B45309',
      scheduledDate: '2026-07-08',
      siteId: 'SITE-003',
      findingCount: 0,
      openFindingCount: 0,
    },
    {
      id: 'AUD-2026-011',
      title: 'Q2 Full System Internal Audit – IATF 16949',
      type: 'Internal Quality',
      status: 'Planned',
      auditor: 'Sarah Chen',
      auditorInitials: 'SC',
      auditorColor: '#0891B2',
      scheduledDate: '2026-07-15',
      siteId: 'SITE-001',
      findingCount: 0,
      openFindingCount: 0,
    },
  ];

  readonly findings: Finding[] = [
    {
      id: 'FND-2026-0031',
      auditId: 'AUD-2026-001',
      title: 'Calibration records not maintained per procedure CAL-001',
      severity: 'Minor',
      status: 'Open',
      owner: 'Dev Patel',
      ownerInitials: 'DP',
      dueDate: '2026-06-30',
      ageInDays: 89,
      clauseRef: '7.1.5',
    },
    {
      id: 'FND-2026-0035',
      auditId: 'AUD-2026-003',
      title: 'Supplier control plan not updated after process change',
      severity: 'Major',
      status: 'Open',
      owner: 'Maria Delgado',
      ownerInitials: 'MD',
      dueDate: '2026-06-22',
      ageInDays: 54,
      clauseRef: '8.4.1',
    },
    {
      id: 'FND-2026-0036',
      auditId: 'AUD-2026-003',
      title: 'PPAP documentation missing for 3 out of 8 new parts',
      severity: 'Major',
      status: 'Open',
      owner: 'Priya Nair',
      ownerInitials: 'PN',
      dueDate: '2026-06-22',
      ageInDays: 54,
      clauseRef: '8.3.4',
    },
    {
      id: 'FND-2026-0037',
      auditId: 'AUD-2026-003',
      title: 'Corrective action response time exceeded SLA 3 times',
      severity: 'Minor',
      status: 'Open',
      owner: 'James Okonkwo',
      ownerInitials: 'JO',
      dueDate: '2026-06-22',
      ageInDays: 54,
      clauseRef: '10.2',
    },
    {
      id: 'FND-2026-0040',
      auditId: 'AUD-2026-004',
      title: 'Die maintenance intervals not tracked in system',
      severity: 'Minor',
      status: 'Open',
      owner: 'Tom Braswell',
      ownerInitials: 'TB',
      dueDate: '2026-07-06',
      ageInDays: 39,
      clauseRef: '8.5.1',
    },
    {
      id: 'FND-2026-0041',
      auditId: 'AUD-2026-004',
      title: 'Press setup approvals not signed before run',
      severity: 'Major',
      status: 'Open',
      owner: 'Tom Braswell',
      ownerInitials: 'TB',
      dueDate: '2026-07-06',
      ageInDays: 39,
      clauseRef: '8.5.1',
    },
    {
      id: 'FND-2026-0048',
      auditId: 'AUD-2026-006',
      title: 'Incoming inspection sampling plan not AQL-indexed',
      severity: 'Minor',
      status: 'Open',
      owner: 'Priya Nair',
      ownerInitials: 'PN',
      dueDate: '2026-07-10',
      ageInDays: 24,
      clauseRef: '8.4.3',
    },
    {
      id: 'FND-2026-0049',
      auditId: 'AUD-2026-006',
      title: 'Receiving area lacks temperature control for coatings',
      severity: 'Minor',
      status: 'Open',
      owner: 'James Okonkwo',
      ownerInitials: 'JO',
      dueDate: '2026-07-10',
      ageInDays: 24,
      clauseRef: '7.1.4',
    },
    {
      id: 'FND-2026-0050',
      auditId: 'AUD-2026-006',
      title: 'Supplier delivery performance KPI not visible to team',
      severity: 'OFI',
      status: 'Open',
      owner: 'Priya Nair',
      ownerInitials: 'PN',
      dueDate: '2026-07-10',
      ageInDays: 24,
      clauseRef: '8.4.2',
    },
    {
      id: 'FND-2026-0051',
      auditId: 'AUD-2026-006',
      title: 'No documented risk assessment for new sub-supplier',
      severity: 'Major',
      status: 'Open',
      owner: 'James Okonkwo',
      ownerInitials: 'JO',
      dueDate: '2026-07-10',
      ageInDays: 24,
      clauseRef: '8.4.1',
    },
    {
      id: 'FND-2026-0055',
      auditId: 'AUD-2026-007',
      title: 'Customer-specific requirements not flowed down to work instructions',
      severity: 'Major',
      status: 'Open',
      owner: 'Dev Patel',
      ownerInitials: 'DP',
      dueDate: '2026-07-10',
      ageInDays: 3,
      clauseRef: '8.2.3',
    },
    {
      id: 'FND-2026-0056',
      auditId: 'AUD-2026-007',
      title: 'OEM change notification log not maintained since March',
      severity: 'Minor',
      status: 'Open',
      owner: 'Maria Delgado',
      ownerInitials: 'MD',
      dueDate: '2026-07-10',
      ageInDays: 3,
      clauseRef: '8.2.4',
    },
  ];

  private _lpaRuns = signal<LPARun[]>([
    // ── Completed (history) ───────────────────────────────────────────────────
    {
      id: 'LPA-2026-0080',
      title: 'L1 Daily – Weld Zone A – Week 23',
      status: 'Completed',
      owner: 'Ravi Kumar',
      ownerInitials: 'RK',
      ownerId: 'USR-009',
      dueDate: '2026-06-06',
      completedDate: '2026-06-06',
      siteId: 'SITE-001',
      completionRate: 100,
      layer: 'L1',
      zone: 'Weld Zone A',
      responses: [
        { questionId: 'Q1', answer: 'Pass' },
        { questionId: 'Q2', answer: 'Pass' },
        { questionId: 'Q3', answer: 'Pass' },
        { questionId: 'Q4', answer: 'Pass' },
        { questionId: 'Q5', answer: 'Pass' },
        { questionId: 'Q6', answer: 'Pass' },
        { questionId: 'Q7', answer: 'Pass' },
        { questionId: 'Q8', answer: 'Pass' },
      ],
    },
    {
      id: 'LPA-2026-0081',
      title: 'L1 Daily – Assembly Line 2 – Week 23',
      status: 'Completed',
      owner: 'Ravi Kumar',
      ownerInitials: 'RK',
      ownerId: 'USR-009',
      dueDate: '2026-06-06',
      completedDate: '2026-06-06',
      siteId: 'SITE-001',
      completionRate: 100,
      layer: 'L1',
      zone: 'Assembly Line 2',
      responses: [
        { questionId: 'Q1', answer: 'Pass' },
        { questionId: 'Q2', answer: 'Pass' },
        { questionId: 'Q3', answer: 'Pass' },
        { questionId: 'Q4', answer: 'Pass' },
        { questionId: 'Q5', answer: 'Pass' },
        { questionId: 'Q6', answer: 'NA', note: 'No non-conforming parts identified this shift' },
        { questionId: 'Q7', answer: 'Pass' },
        { questionId: 'Q8', answer: 'Pass' },
      ],
    },
    {
      id: 'LPA-2026-0082',
      title: 'L2 Weekly – Full Plant – Week 23',
      status: 'Completed',
      owner: 'Dev Patel',
      ownerInitials: 'DP',
      ownerId: 'USR-002',
      dueDate: '2026-06-07',
      completedDate: '2026-06-08',
      siteId: 'SITE-001',
      completionRate: 100,
      layer: 'L2',
      zone: 'Full Plant',
      responses: [
        { questionId: 'Q1', answer: 'Pass' },
        { questionId: 'Q2', answer: 'Pass' },
        { questionId: 'Q3', answer: 'Pass' },
        { questionId: 'Q4', answer: 'Pass' },
        { questionId: 'Q5', answer: 'Pass' },
        { questionId: 'Q6', answer: 'Pass' },
        { questionId: 'Q7', answer: 'Pass' },
        { questionId: 'Q8', answer: 'Pass' },
      ],
    },
    {
      id: 'LPA-2026-0083',
      title: 'L1 Daily – Stamping – Week 23',
      status: 'Completed',
      owner: 'Lisa Park',
      ownerInitials: 'LP',
      ownerId: 'USR-010',
      dueDate: '2026-06-07',
      completedDate: '2026-06-07',
      siteId: 'SITE-003',
      completionRate: 100,
      layer: 'L1',
      zone: 'Stamping',
      responses: [
        { questionId: 'Q1', answer: 'Pass' },
        { questionId: 'Q2', answer: 'Pass' },
        { questionId: 'Q3', answer: 'Pass' },
        { questionId: 'Q4', answer: 'Pass' },
        { questionId: 'Q5', answer: 'Pass' },
        { questionId: 'Q6', answer: 'NA', note: 'No non-conforming parts this shift' },
        { questionId: 'Q7', answer: 'Pass' },
        { questionId: 'Q8', answer: 'Pass' },
      ],
    },
    {
      id: 'LPA-2026-0084',
      title: 'L1 Daily – Weld Zone A – Week 24',
      status: 'Completed',
      owner: 'Ravi Kumar',
      ownerInitials: 'RK',
      ownerId: 'USR-009',
      dueDate: '2026-06-13',
      completedDate: '2026-06-13',
      siteId: 'SITE-001',
      completionRate: 100,
      layer: 'L1',
      zone: 'Weld Zone A',
      responses: [
        { questionId: 'Q1', answer: 'Pass' },
        { questionId: 'Q2', answer: 'Pass' },
        { questionId: 'Q3', answer: 'Pass' },
        { questionId: 'Q4', answer: 'Pass' },
        { questionId: 'Q5', answer: 'Pass' },
        { questionId: 'Q6', answer: 'Pass' },
        { questionId: 'Q7', answer: 'Pass' },
        { questionId: 'Q8', answer: 'Pass' },
      ],
    },
    {
      id: 'LPA-2026-0090',
      title: 'L1 Daily – Weld Zone B – Week 23',
      status: 'Completed',
      owner: 'Ravi Kumar',
      ownerInitials: 'RK',
      ownerId: 'USR-009',
      dueDate: '2026-06-07',
      completedDate: '2026-06-07',
      siteId: 'SITE-001',
      completionRate: 100,
      layer: 'L1',
      zone: 'Weld Zone B',
      responses: [
        { questionId: 'Q1', answer: 'Pass' },
        { questionId: 'Q2', answer: 'Pass' },
        { questionId: 'Q3', answer: 'Pass' },
        { questionId: 'Q4', answer: 'Pass' },
        { questionId: 'Q5', answer: 'Pass' },
        { questionId: 'Q6', answer: 'Pass' },
        { questionId: 'Q7', answer: 'Pass' },
        { questionId: 'Q8', answer: 'Pass' },
      ],
    },
    {
      id: 'LPA-2026-0091',
      title: 'L1 Daily – Assembly Line 1 – Week 23',
      status: 'Completed',
      owner: 'Ravi Kumar',
      ownerInitials: 'RK',
      ownerId: 'USR-009',
      dueDate: '2026-06-06',
      completedDate: '2026-06-06',
      siteId: 'SITE-001',
      completionRate: 100,
      layer: 'L1',
      zone: 'Assembly Line 1',
      responses: [
        { questionId: 'Q1', answer: 'Pass' },
        { questionId: 'Q2', answer: 'Pass' },
        { questionId: 'Q3', answer: 'Pass' },
        { questionId: 'Q4', answer: 'Pass' },
        { questionId: 'Q5', answer: 'Pass' },
        { questionId: 'Q6', answer: 'Pass' },
        { questionId: 'Q7', answer: 'Pass' },
        { questionId: 'Q8', answer: 'Pass' },
      ],
    },

    // ── Active / Due (current week) ───────────────────────────────────────────
    // L1 — Ravi Kumar (QT, Plant-1)
    {
      id: 'LPA-2026-0085',
      title: 'L1 Daily – Assembly Line 2 – Week 24',
      status: 'Pending',
      owner: 'Ravi Kumar',
      ownerInitials: 'RK',
      ownerId: 'USR-009',
      dueDate: '2026-06-13',
      siteId: 'SITE-001',
      completionRate: 0,
      layer: 'L1',
      zone: 'Assembly Line 2',
    },
    {
      id: 'LPA-2026-0092',
      title: 'L1 Daily – Assembly Line 1 – Week 24',
      status: 'Pending',
      owner: 'Ravi Kumar',
      ownerInitials: 'RK',
      ownerId: 'USR-009',
      dueDate: '2026-06-14',
      siteId: 'SITE-001',
      completionRate: 0,
      layer: 'L1',
      zone: 'Assembly Line 1',
    },
    {
      id: 'LPA-2026-0096',
      title: 'L1 Daily – Quality Gate – Week 24',
      status: 'Pending',
      owner: 'Ravi Kumar',
      ownerInitials: 'RK',
      ownerId: 'USR-009',
      dueDate: '2026-06-14',
      siteId: 'SITE-001',
      completionRate: 0,
      layer: 'L1',
      zone: 'Quality Gate',
    },
    // L1 — Lisa Park (Operator, Plant-2 + Plant-3)
    {
      id: 'LPA-2026-0088',
      title: 'L1 Daily – Paint Shop – Week 24',
      status: 'Overdue',
      owner: 'Lisa Park',
      ownerInitials: 'LP',
      ownerId: 'USR-010',
      dueDate: '2026-06-12',
      siteId: 'SITE-002',
      completionRate: 0,
      layer: 'L1',
      zone: 'Paint Shop',
    },
    {
      id: 'LPA-2026-0094',
      title: 'L1 Daily – Incoming Inspection – Week 24',
      status: 'Pending',
      owner: 'Lisa Park',
      ownerInitials: 'LP',
      ownerId: 'USR-010',
      dueDate: '2026-06-14',
      siteId: 'SITE-002',
      completionRate: 0,
      layer: 'L1',
      zone: 'Incoming Inspection',
    },
    {
      id: 'LPA-2026-0089',
      title: 'L1 Daily – Stamping – Week 24',
      status: 'Pending',
      owner: 'Lisa Park',
      ownerInitials: 'LP',
      ownerId: 'USR-010',
      dueDate: '2026-06-14',
      siteId: 'SITE-003',
      completionRate: 0,
      layer: 'L1',
      zone: 'Stamping',
    },
    // L2 — Dev Patel (QE, Plant-1)
    {
      id: 'LPA-2026-0086',
      title: 'L2 Weekly – Full Plant – Week 24',
      status: 'Pending',
      owner: 'Dev Patel',
      ownerInitials: 'DP',
      ownerId: 'USR-002',
      dueDate: '2026-06-14',
      siteId: 'SITE-001',
      completionRate: 0,
      layer: 'L2',
      zone: 'Full Plant',
    },
    {
      id: 'LPA-2026-0097',
      title: 'L2 Weekly – Quality Gate – Week 24',
      status: 'Pending',
      owner: 'Dev Patel',
      ownerInitials: 'DP',
      ownerId: 'USR-002',
      dueDate: '2026-06-14',
      siteId: 'SITE-001',
      completionRate: 0,
      layer: 'L2',
      zone: 'Quality Gate',
    },
    // L2 — Priya Nair (QE, Plant-2 — Paint Shop)
    {
      id: 'LPA-2026-0093',
      title: 'L2 Weekly – Paint Shop – Week 24',
      status: 'Overdue',
      owner: 'Priya Nair',
      ownerInitials: 'PN',
      ownerId: 'USR-005',
      dueDate: '2026-06-11',
      siteId: 'SITE-002',
      completionRate: 0,
      layer: 'L2',
      zone: 'Paint Shop',
    },
    // L2 — James Okonkwo (QS, Plant-2 — Incoming Inspection)
    {
      id: 'LPA-2026-0095',
      title: 'L2 Weekly – Incoming Inspection – Week 24',
      status: 'Overdue',
      owner: 'James Okonkwo',
      ownerInitials: 'JO',
      ownerId: 'USR-004',
      dueDate: '2026-06-11',
      siteId: 'SITE-002',
      completionRate: 0,
      layer: 'L2',
      zone: 'Incoming Inspection',
    },
    // L2 — Aisha Williams (ME, Plant-3 — Stamping)
    {
      id: 'LPA-2026-0101',
      title: 'L2 Weekly – Stamping – Week 24',
      status: 'Pending',
      owner: 'Aisha Williams',
      ownerInitials: 'AW',
      ownerId: 'USR-008',
      dueDate: '2026-06-14',
      siteId: 'SITE-003',
      completionRate: 0,
      layer: 'L2',
      zone: 'Stamping',
    },
    // L3 — Maria Delgado (QM, Plant-1)
    {
      id: 'LPA-2026-0087',
      title: 'L3 Monthly – Full Plant – June',
      status: 'Pending',
      owner: 'Maria Delgado',
      ownerInitials: 'MD',
      ownerId: 'USR-001',
      dueDate: '2026-06-20',
      siteId: 'SITE-001',
      completionRate: 0,
      layer: 'L3',
      zone: 'Full Plant',
    },
    {
      id: 'LPA-2026-0098',
      title: 'L3 Monthly – Weld Zone A – June',
      status: 'Pending',
      owner: 'Maria Delgado',
      ownerInitials: 'MD',
      ownerId: 'USR-001',
      dueDate: '2026-06-20',
      siteId: 'SITE-001',
      completionRate: 0,
      layer: 'L3',
      zone: 'Weld Zone A',
    },
    // L3 — Tom Braswell (QM, Plant-3 — Stamping)
    {
      id: 'LPA-2026-0099',
      title: 'L3 Monthly – Stamping – June',
      status: 'Pending',
      owner: 'Tom Braswell',
      ownerInitials: 'TB',
      ownerId: 'USR-006',
      dueDate: '2026-06-20',
      siteId: 'SITE-003',
      completionRate: 0,
      layer: 'L3',
      zone: 'Stamping',
    },
    // L3 — Carlos Mendez (PM, Plant-2)
    {
      id: 'LPA-2026-0100',
      title: 'L3 Monthly – Paint Shop – June',
      status: 'Pending',
      owner: 'Carlos Mendez',
      ownerInitials: 'CM',
      ownerId: 'USR-007',
      dueDate: '2026-06-20',
      siteId: 'SITE-002',
      completionRate: 0,
      layer: 'L3',
      zone: 'Paint Shop',
    },
  ]);

  /** Backward-compatible array accessor — existing .find()/.filter() calls still work. */
  get lpaRuns(): LPARun[] {
    return this._lpaRuns();
  }

  /** Reactive signal — use inside computed() for dashboard KPIs that must stay live. */
  readonly lpaRunsSignal = this._lpaRuns.asReadonly();

  /** Resolve a display name → AuthUser.id for synthetic LPARun construction. */
  private readonly userIdByName: Record<string, string> = {
    'Maria Delgado': 'USR-001',
    'Dev Patel': 'USR-002',
    'Sarah Chen': 'USR-003',
    'James Okonkwo': 'USR-004',
    'Priya Nair': 'USR-005',
    'Tom Braswell': 'USR-006',
    'Carlos Mendez': 'USR-007',
    'Aisha Williams': 'USR-008',
    'Ravi Kumar': 'USR-009',
    'Lisa Park': 'USR-010',
  };

  readonly notifications: AppNotification[] = [
    {
      id: 'NOTIF-001',
      title: 'NCR Assigned to You',
      message: 'NCR-2026-0147 has been assigned for disposition',
      type: 'warning',
      entityType: 'NCR',
      entityId: 'NCR-2026-0147',
      link: '/ncrs/NCR-2026-0147',
      isRead: false,
      createdAt: '2026-06-13T08:30:00Z',
    },
    {
      id: 'NOTIF-002',
      title: 'Document Approval Required',
      message: 'DOC-0048 "Torque Verification WI" is awaiting your approval',
      type: 'info',
      entityType: 'Document',
      entityId: 'DOC-0048',
      link: '/documents/DOC-0048',
      isRead: false,
      createdAt: '2026-06-13T07:15:00Z',
    },
    {
      id: 'NOTIF-003',
      title: 'CAPA Step Overdue',
      message: 'CAPA-2026-0021 containment step is 3 days overdue',
      type: 'error',
      entityType: 'CAPA',
      entityId: 'CAPA-2026-0021',
      link: '/capas/CAPA-2026-0021',
      isRead: false,
      createdAt: '2026-06-13T06:00:00Z',
    },
    {
      id: 'NOTIF-004',
      title: 'Audit Scheduled',
      message: 'AUD-2026-011 has been scheduled for 2026-07-15',
      type: 'info',
      entityType: 'Audit',
      entityId: 'AUD-2026-011',
      link: '/audits/AUD-2026-011',
      isRead: true,
      createdAt: '2026-06-12T14:00:00Z',
    },
    {
      id: 'NOTIF-005',
      title: 'Finding Response Due Soon',
      message: 'FND-2026-0035 response due in 9 days',
      type: 'warning',
      entityType: 'Finding',
      entityId: 'FND-2026-0035',
      link: '/audits/AUD-2026-003',
      isRead: true,
      createdAt: '2026-06-12T09:30:00Z',
    },
    {
      id: 'NOTIF-006',
      title: 'Document Approved',
      message: 'DOC-0042 was approved by Dev Patel',
      type: 'success',
      entityType: 'Document',
      entityId: 'DOC-0042',
      link: '/documents/DOC-0042',
      isRead: true,
      createdAt: '2026-06-11T16:45:00Z',
    },
    {
      id: 'NOTIF-007',
      title: 'LPA Run Overdue',
      message: 'LPA-2026-0088 Paint Shop daily LPA is overdue',
      type: 'error',
      entityType: 'LPA',
      entityId: 'LPA-2026-0088',
      link: '/lpa',
      isRead: false,
      createdAt: '2026-06-13T08:00:00Z',
    },
  ];

  readonly activityFeed: ActivityFeedItem[] = [
    {
      id: 'ACT-001',
      actor: 'Dev Patel',
      actorInitials: 'DP',
      actorColor: '#7C3AED',
      action: 'approved',
      entityId: 'DOC-0042',
      entityType: 'Document',
      timeAgo: '2h ago',
      createdAt: '2026-06-13T06:15:00Z',
    },
    {
      id: 'ACT-002',
      actor: 'Priya Nair',
      actorInitials: 'PN',
      actorColor: '#DC2626',
      action: 'opened',
      entityId: 'NCR-2026-0147',
      entityType: 'NCR',
      timeAgo: '3h ago',
      createdAt: '2026-06-13T05:30:00Z',
    },
    {
      id: 'ACT-003',
      actor: 'Tom Braswell',
      actorInitials: 'TB',
      actorColor: '#B45309',
      action: 'completed step on',
      entityId: 'CAPA-2026-0023',
      entityType: 'CAPA',
      timeAgo: '5h ago',
      createdAt: '2026-06-13T03:00:00Z',
    },
    {
      id: 'ACT-004',
      actor: 'Sarah Chen',
      actorInitials: 'SC',
      actorColor: '#0891B2',
      action: 'scheduled',
      entityId: 'AUD-2026-011',
      entityType: 'Audit',
      timeAgo: '1d ago',
      createdAt: '2026-06-12T14:00:00Z',
    },
    {
      id: 'ACT-005',
      actor: 'James Okonkwo',
      actorInitials: 'JO',
      actorColor: '#059669',
      action: 'closed finding on',
      entityId: 'FND-2026-0031',
      entityType: 'Finding',
      timeAgo: '1d ago',
      createdAt: '2026-06-12T10:30:00Z',
    },
  ];

  readonly ncrTrendWeeks: { week: string; count: number }[] = [
    { week: 'W3', count: 8 },
    { week: 'W4', count: 11 },
    { week: 'W5', count: 9 },
    { week: 'W6', count: 13 },
    { week: 'W7', count: 10 },
    { week: 'W8', count: 7 },
    { week: 'W9', count: 12 },
    { week: 'W10', count: 15 },
    { week: 'W11', count: 11 },
    { week: 'W12', count: 9 },
    { week: 'W13', count: 13 },
    { week: 'W14', count: 14 },
  ];

  constructor() {
    this.loadFromStorage();
    if (this.isBrowser) {
      window.addEventListener('storage', (e: StorageEvent) => {
        if (e.key === STORAGE_KEY) this.loadFromStorage();
      });
    }
  }

  // ── LocalStorage persistence ───────────────────────────────────────────────
  private loadFromStorage(): void {
    if (!this.isBrowser) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const state: PersistedState = JSON.parse(raw);
      if (state.documents) this._documents.set(state.documents);
      if (state.ncrs) this._ncrs.set(state.ncrs);
      if (state.complaints) this._complaints.set(state.complaints);
      if (state.containmentActions) this._containmentActions.set(state.containmentActions);
      if (state.ncrEvents) this._ncrEvents.set(state.ncrEvents);
      if (state.ncrAttachments) this._ncrAttachments.set(state.ncrAttachments);
      if (state.workItems) this._workItems.set(state.workItems);
      if (state.docTypes) this._docTypes.set(state.docTypes);
      if (state.capas8d) this._capas8d.set(state.capas8d);
      if (state.lpaRuns) this._lpaRuns.set(state.lpaRuns);
      if (state.ncrCounter) this.ncrCounter.set(state.ncrCounter);
      if (state.docCounter) this.docCounter.set(state.docCounter);
      if (state.complaintCounter) this.complaintCounter.set(state.complaintCounter);
      if (state.caCounter) this.caCounter.set(state.caCounter);
      if (state.ncrEventCounter) this.ncrEventCounter.set(state.ncrEventCounter);
      if (state.capaCounter) this.capaCounter.set(state.capaCounter);
    } catch {
      // corrupted storage — ignore and use defaults
    }
  }

  private persist(): void {
    if (!this.isBrowser) return;
    try {
      const state: PersistedState = {
        documents: this._documents(),
        ncrs: this._ncrs(),
        complaints: this._complaints(),
        containmentActions: this._containmentActions(),
        ncrEvents: this._ncrEvents(),
        ncrAttachments: this._ncrAttachments(),
        workItems: this._workItems(),
        docTypes: this._docTypes(),
        capas8d: this._capas8d(),
        lpaRuns: this._lpaRuns(),
        ncrCounter: this.ncrCounter(),
        docCounter: this.docCounter(),
        complaintCounter: this.complaintCounter(),
        caCounter: this.caCounter(),
        ncrEventCounter: this.ncrEventCounter(),
        capaCounter: this.capaCounter(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage quota — silently ignore
    }
  }

  resetToDefaults(): void {
    this._documents.set([...INITIAL_DOCUMENTS]);
    this._ncrs.set([...INITIAL_NCRS]);
    this._complaints.set([...INITIAL_COMPLAINTS]);
    this._containmentActions.set([...INITIAL_CONTAINMENT_ACTIONS]);
    this._ncrEvents.set([]);
    this._ncrAttachments.set([...INITIAL_NCR_ATTACHMENTS]);
    this._workItems.set([...INITIAL_WORK_ITEMS]);
    this._docTypes.set([...INITIAL_DOC_TYPES]);
    this._capas8d.set([...INITIAL_CAPAS_8D]);
    this.ncrCounter.set(150);
    this.docCounter.set(49);
    this.complaintCounter.set(9);
    this.caCounter.set(4);
    this.capaCounter.set(32);
    this.ncrEventCounter.set(0);
    // if (this.isBrowser) localStorage.removeItem(STORAGE_KEY);
  }

  // ── ID generators ──────────────────────────────────────────────────────────
  private nextNcrId(): string {
    const next = this.ncrCounter() + 1;
    this.ncrCounter.set(next);
    return `NCR-2026-0${next}`;
  }

  private nextDocId(): string {
    const next = this.docCounter() + 1;
    this.docCounter.set(next);
    return `DOC-${String(next).padStart(4, '0')}`;
  }

  private nextComplaintId(): string {
    const next = this.complaintCounter() + 1;
    this.complaintCounter.set(next);
    return `CC-2026-0${String(next).padStart(3, '0')}`;
  }

  private nextCaId(): string {
    const next = this.caCounter() + 1;
    this.caCounter.set(next);
    return `CA-${String(next).padStart(3, '0')}`;
  }

  private nextCapaId(): string {
    const next = this.capaCounter() + 1;
    this.capaCounter.set(next);
    return `CAPA-2026-${String(next).padStart(4, '0')}`;
  }

  addCapa(partial: {
    title: string;
    ncrId: string;
    siteId: string;
    dueDate: string;
    champion: string;
    championInitials: string;
    championColor: string;
    severity: string;
  }): string {
    const id = this.nextCapaId();
    const today = new Date().toISOString().split('T')[0];

    const newCapa: CAPA = {
      id,
      title: partial.title,
      status: 'Open',
      currentStep: 'Problem Definition',
      stepNumber: 1,
      totalSteps: 5,
      owner: partial.champion,
      ownerInitials: partial.championInitials,
      siteId: partial.siteId,
      dueDate: partial.dueDate,
      createdAt: today,
      onTime: true,
      ncrId: partial.ncrId,
      completionPct: 0,
    };

    const newCapa8d: CAPA8D = {
      id,
      title: partial.title,
      status: 'Open',
      ncrId: partial.ncrId,
      champion: partial.champion,
      championInitials: partial.championInitials,
      championColor: partial.championColor,
      teamAvatars: [],
      siteId: partial.siteId,
      dueDate: partial.dueDate,
      createdAt: today,
      source: partial.ncrId,
      sourceType: 'NCR',
      completedSteps: [],
      activeStep: 'D0',
      daysInCurrentStep: 0,
      daysOpen: 0,
      onTimeStatus: 'on-track',
      completionPct: 0,
      d0: {
        title: partial.title,
        source: partial.ncrId,
        severity: partial.severity,
        dueDate: partial.dueDate,
      },
    };

    // capas is a plain array — push is safe even though the field is readonly (readonly prevents reassignment, not mutation)
    (this.capas as CAPA[]).unshift(newCapa);
    this._capas8d.update(list => [newCapa8d, ...list]);
    this.persist();
    return id;
  }

  // ── NCR History ────────────────────────────────────────────────────────────
  getNcrEvents(ncrId: string): NcrHistoryEvent[] {
    return this._ncrEvents().filter(e => e.ncrId === ncrId);
  }

  getNcrAttachments(ncrId: string): NcrAttachment[] {
    return this._ncrAttachments().filter(a => a.ncrId === ncrId);
  }

  addNcrEvent(partial: Omit<NcrHistoryEvent, 'id'>): void {
    const next = this.ncrEventCounter() + 1;
    this.ncrEventCounter.set(next);
    const event: NcrHistoryEvent = { id: `NE-${String(next).padStart(4, '0')}`, ...partial };
    this._ncrEvents.update(list => [event, ...list]);
    this.persist();
  }

  // ── NCR CRUD ───────────────────────────────────────────────────────────────
  addNcr(partial: Omit<NCR, 'id'>): NCR {
    const ncr: NCR = { id: this.nextNcrId(), ...partial };
    this._ncrs.update((list) => [ncr, ...list]);
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const ts = `${ncr.createdAt}, ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    this.addNcrEvent({
      ncrId: ncr.id,
      actor: ncr.owner,
      initials: ncr.ownerInitials,
      color: ncr.ownerColor ?? '#64748B',
      action: 'opened NCR',
      detail: ncr.id,
      timestamp: ts,
    });
    return ncr;
  }

  updateNcr(id: string, changes: Partial<NCR>): void {
    this._ncrs.update((list) => list.map((n) => (n.id === id ? { ...n, ...changes } : n)));
    this.persist();
  }

  // ── Document CRUD ──────────────────────────────────────────────────────────
  addDocument(partial: Omit<QDocument, 'id'>): QDocument {
    const doc: QDocument = { id: this.nextDocId(), ...partial };
    this._documents.update((list) => [doc, ...list]);
    this.persist();
    return doc;
  }

  addDocuments(partials: Omit<QDocument, 'id'>[]): QDocument[] {
    const docs = partials.map((p) => ({ id: this.nextDocId(), ...p }) as QDocument);
    this._documents.update((list) => [...docs, ...list]);
    this.persist();
    return docs;
  }

  updateDocument(id: string, changes: Partial<QDocument>): void {
    this._documents.update((list) => list.map((d) => (d.id === id ? { ...d, ...changes } : d)));
    this.persist();
  }

  // ── Complaint CRUD ─────────────────────────────────────────────────────────
  addComplaint(partial: Omit<CustomerComplaint, 'id'>): CustomerComplaint {
    const complaint: CustomerComplaint = { id: this.nextComplaintId(), ...partial };
    this._complaints.update((list) => [complaint, ...list]);
    this.persist();
    return complaint;
  }

  updateComplaint(id: string, changes: Partial<CustomerComplaint>): void {
    this._complaints.update((list) => list.map((c) => (c.id === id ? { ...c, ...changes } : c)));
    this.persist();
  }

  // ── Containment Action CRUD ────────────────────────────────────────────────
  addContainmentAction(partial: Omit<ContainmentAction, 'id'>): ContainmentAction {
    const ca: ContainmentAction = { id: this.nextCaId(), ...partial };
    this._containmentActions.update((list) => [...list, ca]);
    this.persist();
    return ca;
  }

  updateContainmentAction(id: string, changes: Partial<ContainmentAction>): void {
    this._containmentActions.update((list) =>
      list.map((a) => (a.id === id ? { ...a, ...changes } : a)),
    );
    this.persist();
  }

  getContainmentActions(ncrId: string): ContainmentAction[] {
    return this._containmentActions().filter((a) => a.ncrId === ncrId);
  }

  deleteContainmentAction(id: string): void {
    this._containmentActions.update((list) => list.filter((a) => a.id !== id));
    this.persist();
  }

  // ── Work Item CRUD ─────────────────────────────────────────────────────────
  removeWorkItem(id: string): void {
    this._workItems.update((list) => list.filter((w) => w.id !== id));
    this.persist();
  }

  // ── Doc Type CRUD ──────────────────────────────────────────────────────────
  addDocType(partial: Omit<DocType, 'id'>): DocType {
    const next = this._docTypes().length + 1;
    const dt: DocType = { id: `DT-${String(next).padStart(3, '0')}`, ...partial };
    this._docTypes.update((list) => [...list, dt]);
    this.persist();
    return dt;
  }

  // ── CAPA 8D CRUD ───────────────────────────────────────────────────────────
  updateCapa8d(id: string, changes: Partial<CAPA8D>): void {
    this._capas8d.update((list) => list.map((c) => (c.id === id ? { ...c, ...changes } : c)));
    this.persist();
  }

  getCapa8d(id: string): CAPA8D | undefined {
    return this._capas8d().find((c) => c.id === id);
  }

  // ── Computed accessors ─────────────────────────────────────────────────────
  getOpenNCRs(): NCR[] {
    return this._ncrs().filter((n) => n.status === 'Open');
  }
  getOpenCAPAs(): CAPA[] {
    return this.capas.filter((c) => c.status === 'Open');
  }
  getOverdueCAPAs(): CAPA[] {
    return this.capas.filter((c) => !c.onTime && c.status === 'Open');
  }
  getUpcomingAudits(): Audit[] {
    return this.audits.filter((a) => a.status === 'Planned').slice(0, 3);
  }
  getOverdueDocuments(): QDocument[] {
    return this._documents().filter(
      (d) =>
        d.status !== 'Draft' &&
        (d.daysUntilReview < 0 || (d.daysUntilReview >= 0 && d.daysUntilReview <= 14)),
    );
  }
  getWorkItemsByCategory(cat: 'overdue' | 'today' | 'this-week'): WorkItem[] {
    return this._workItems().filter((w) => w.dueCategory === cat);
  }

  getCAPAOnTimePct(): number {
    const open = this._capas8d().filter((c) => c.status === 'Open');
    if (!open.length) return 100;
    const onTime = open.filter((c) => c.onTimeStatus !== 'overdue').length;
    return Math.round((onTime / open.length) * 100);
  }

  getLPACompletionPct(): number {
    const runs = this._lpaRuns();
    const completed = runs.filter((r) => r.status === 'Completed').length;
    return Math.round((completed / runs.length) * 100);
  }

  getOpenComplaintsCount(): number {
    return this._complaints().filter((c) => c.status !== 'Closed').length;
  }

  getAuditCompletionStats(): { completed: number; total: number } {
    const completed = this.audits.filter((a) => a.status === 'Completed').length;
    return { completed, total: this.audits.length };
  }

  getOpenNcrsForSite(siteId: string): number {
    return this._ncrs().filter((n) => n.siteId === siteId && n.status === 'Open').length;
  }

  getCAPAOnTimePctForSite(siteId: string): number {
    const siteCAPAs = this._capas8d().filter((c) => c.siteId === siteId && c.status === 'Open');
    if (!siteCAPAs.length) return 100;
    const onTime = siteCAPAs.filter((c) => c.onTimeStatus !== 'overdue').length;
    return Math.round((onTime / siteCAPAs.length) * 100);
  }

  getLPACompletionPctForSite(siteId: string): number {
    const siteRuns = this._lpaRuns().filter((r) => r.siteId === siteId);
    if (!siteRuns.length) return 100;
    const completed = siteRuns.filter((r) => r.status === 'Completed').length;
    return Math.round((completed / siteRuns.length) * 100);
  }

  getAuditScoreForSite(siteId: string): number {
    const scores: Record<string, number> = { 'SITE-001': 82, 'SITE-002': 74, 'SITE-003': 88 };
    return scores[siteId] ?? 80;
  }

  getSiteStatus(siteId: string): string {
    const onTime = this.getCAPAOnTimePctForSite(siteId);
    const openNcrs = this.getOpenNcrsForSite(siteId);
    if (onTime >= 80 && openNcrs < 3) return 'On Track';
    return 'At Risk';
  }

  getSiteData(): Array<{
    name: string;
    location: string;
    openNcrs: number;
    capaOnTime: number;
    lpaCompletion: number;
    auditScore: number;
    status: string;
  }> {
    return this.sites.map((s) => ({
      name: s.name,
      location: s.location,
      openNcrs: this.getOpenNcrsForSite(s.id),
      capaOnTime: this.getCAPAOnTimePctForSite(s.id),
      lpaCompletion: this.getLPACompletionPctForSite(s.id),
      auditScore: this.getAuditScoreForSite(s.id),
      status: this.getSiteStatus(s.id),
    }));
  }

  getEscalations(): Array<{
    id: string;
    title: string;
    site: string;
    severity: string;
    ageText: string;
    color: string;
    route: string;
  }> {
    const siteNames: Record<string, string> = {
      'SITE-001': 'Plant-1',
      'SITE-002': 'Plant-2',
      'SITE-003': 'Plant-3',
    };
    return this._ncrs()
      .filter(
        (n) =>
          n.severity === 'Major' &&
          n.status !== 'Closed' &&
          n.status !== 'Voided' &&
          n.status !== 'Dispositioned',
      )
      .sort((a, b) => b.ageInDays - a.ageInDays)
      .slice(0, 4)
      .map((n) => ({
        id: n.id,
        title: n.title,
        site: siteNames[n.siteId] ?? n.siteId,
        severity: n.severity,
        ageText: n.ageInDays > 0 ? `${n.ageInDays}d open` : 'Today',
        color: n.ageInDays > 20 ? '#DC2626' : '#F97316',
        route: `/ncrs/${n.id}`,
      }));
  }

  // ── Audit Module Methods ───────────────────────────────────────────────────

  getAuditDetail(id: string): AuditDetail | undefined {
    return AUDIT_DETAILS.find((a) => a.id === id);
  }

  getAuditFindingDetail(id: string): AuditFindingDetail | undefined {
    return AUDIT_FINDINGS_DETAIL.find((f) => f.id === id);
  }

  getAuditProgramEntries(): AuditProgramEntry[] {
    return AUDIT_PROGRAM_ENTRIES;
  }

  getQuestionsForRun(runId: string): LpaQuestion[] | null {
    const run = this.lpaRuns.find((r) => r.id === runId);
    if (!run) return null;
    const layerMap: Record<string, LpaTemplate['layer']> = {
      L1: 'Operator',
      L2: 'Supervisor',
      L3: 'Manager',
    };
    const tplLayer = layerMap[run.layer];
    // 1st: schedule with exact zone + layer match
    const schedule =
      LPA_SCHEDULES.find((s) => s.area === run.zone && s.layer === tplLayer) ??
      // 2nd: schedule with zone match only (different layer — use zone's questions)
      LPA_SCHEDULES.find((s) => s.area === run.zone);
    if (schedule) {
      const tpl = LPA_TEMPLATES.find((t) => t.id === schedule.templateId);
      if (tpl) return tpl.questions;
    }
    // 3rd: template matching zone + layer exactly (catches adhoc runs and unscheduled zones)
    const byAreaAndLayer = LPA_TEMPLATES.find(
      (t) => t.areas.includes(run.zone) && t.layer === tplLayer,
    );
    if (byAreaAndLayer) return byAreaAndLayer.questions;
    // 4th: any template covering this zone (layer-agnostic fallback)
    const byArea = LPA_TEMPLATES.find((t) => t.areas.includes(run.zone));
    if (byArea) return byArea.questions;
    // 5th: layer-only fallback
    return LPA_TEMPLATES.find((t) => t.layer === tplLayer)?.questions ?? null;
  }

  // ── LPA Run lifecycle ─────────────────────────────────────────────────────

  /**
   * Marks a run as In Progress. For synthesized IDs (LPA-SCH-*) that don't
   * exist in the store yet, creates the run so the runner can look it up.
   */
  startLpaRun(runId: string): void {
    const existing = this._lpaRuns().find((r) => r.id === runId);
    if (existing) {
      if (existing.status === 'Pending' || existing.status === 'Overdue') {
        this._lpaRuns.update((runs) =>
          runs.map((r) => (r.id === runId ? { ...r, status: 'In Progress' as const } : r)),
        );
        this.persist();
      }
      return;
    }

    // Synthesized run — derive from the schedule and add to the store
    if (runId.startsWith('LPA-SCH-')) {
      const scheduleId = runId.replace('LPA-SCH-', '');
      const schedule = LPA_SCHEDULES.find((s) => s.id === scheduleId);
      if (!schedule) return;
      const layerMap: Record<string, 'L1' | 'L2' | 'L3'> = {
        Operator: 'L1',
        Supervisor: 'L2',
        Manager: 'L3',
      };
      const layer = layerMap[schedule.layer] ?? 'L1';
      const template = LPA_TEMPLATES.find((t) => t.id === schedule.templateId);
      const freqLabel = template?.frequency ?? 'Daily';
      const today = new Date().toISOString().split('T')[0];
      const siteId =
        this._lpaRuns().find((r) => r.owner === schedule.assignee)?.siteId ?? 'SITE-001';
      const run: LPARun = {
        id: runId,
        title: `${layer} ${freqLabel} – ${schedule.area}`,
        status: 'In Progress',
        owner: schedule.assignee,
        ownerInitials: schedule.assigneeInitials,
        ownerId: this.userIdByName[schedule.assignee] ?? '',
        dueDate: today,
        siteId,
        completionRate: 0,
        layer,
        zone: schedule.area,
      };
      this._lpaRuns.update((runs) => [run, ...runs]);
      this.persist();
    }
  }

  /**
   * Marks a run as Completed with the given pass rate.
   * Triggers reactive re-render of all dashboards using getLpaDueToday().
   */
  completeLpaRun(
    runId: string,
    completionRate: number,
    reviewedBy?: string,
    reviewedByInitials?: string,
    responses?: LpaResponse[],
  ): void {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    this._lpaRuns.update((runs) =>
      runs.map((r) => {
        if (r.id !== runId) return r;
        const updated: typeof r = { ...r, status: 'Completed' as const, completionRate, completedDate: today, completedAt: now.toISOString() };
        if (reviewedBy) {
          updated.reviewedBy = reviewedBy;
          updated.reviewedByInitials = reviewedByInitials;
        }
        if (responses) updated.responses = responses;
        return updated;
      }),
    );
    this.persist();
  }

  saveLpaResponses(runId: string, responses: LpaResponse[], completionRate: number): void {
    this._lpaRuns.update((runs) =>
      runs.map((r) => r.id !== runId ? r : { ...r, responses, completionRate }),
    );
    this.persist();
  }

  createAdhocRun(
    zone: string,
    layer: 'L1' | 'L2' | 'L3',
    ownerName: string,
    ownerInitials: string,
    ownerId: string,
    siteId: string,
  ): string {
    const seq = String(this._lpaRuns().length + 1).padStart(4, '0');
    const id = `LPA-AH-${seq}`;
    const today = new Date().toISOString().split('T')[0];
    const layerLabel: Record<string, string> = { L1: 'L1', L2: 'L2', L3: 'L3' };
    const run: LPARun = {
      id,
      title: `${layerLabel[layer]} Ad-hoc – ${zone}`,
      status: 'In Progress',
      owner: ownerName,
      ownerInitials,
      ownerId,
      dueDate: today,
      siteId,
      completionRate: 0,
      layer,
      zone,
      source: 'adhoc',
    };
    this._lpaRuns.update((runs) => [run, ...runs]);
    this.persist();
    return id;
  }

  getLpaTemplates(): LpaTemplate[] {
    return LPA_TEMPLATES;
  }

  getLpaSchedules(): LpaScheduleEntry[] {
    return LPA_SCHEDULES;
  }

  /**
   * Returns the current L2 (Supervisor) LPA status for every area a manager
   * is responsible for, so the manager can cross-verify their supervisors' work.
   *
   * Mirrors getTeamL1Completions but walks the Manager → Supervisor edge instead
   * of the Supervisor → Operator edge.
   */
  getTeamL2Completions(managerName: string): Array<{
    run: LPARun;
    supervisorName: string;
    supervisorInitials: string;
    supervisorColor: string;
  }> {
    const allRuns = this._lpaRuns();
    const today = new Date().toISOString().split('T')[0];

    return LPA_SCHEDULES.filter((s) => s.assignee === managerName && s.layer === 'Manager').flatMap(
      (mgrSchedule) => {
        const supSchedule = LPA_SCHEDULES.find(
          (s) => s.area === mgrSchedule.area && s.layer === 'Supervisor',
        );
        if (!supSchedule) return [];

        const runsForArea = allRuns.filter(
          (r) =>
            r.owner === supSchedule.assignee && r.zone === mgrSchedule.area && r.layer === 'L2',
        );

        const activeRun = runsForArea.find(
          (r) => r.status === 'Pending' || r.status === 'In Progress' || r.status === 'Overdue',
        );
        if (activeRun) {
          return [
            {
              run: activeRun,
              supervisorName: supSchedule.assignee,
              supervisorInitials: supSchedule.assigneeInitials,
              supervisorColor: supSchedule.assigneeColor,
            },
          ];
        }

        const completedRun = runsForArea
          .filter((r) => r.status === 'Completed')
          .sort((a, b) => (b.completedDate ?? '').localeCompare(a.completedDate ?? ''))[0];
        if (completedRun) {
          return [
            {
              run: completedRun,
              supervisorName: supSchedule.assignee,
              supervisorInitials: supSchedule.assigneeInitials,
              supervisorColor: supSchedule.assigneeColor,
            },
          ];
        }

        const siteId =
          runsForArea[0]?.siteId ??
          allRuns.find((r) => r.owner === supSchedule.assignee)?.siteId ??
          'SITE-001';
        const pending: LPARun = {
          id: `LPA-SCH-${supSchedule.id}`,
          title: `L2 Weekly – ${mgrSchedule.area}`,
          status: 'Pending',
          owner: supSchedule.assignee,
          ownerInitials: supSchedule.assigneeInitials,
          ownerId: this.userIdByName[supSchedule.assignee] ?? '',
          dueDate: today,
          siteId,
          completionRate: 0,
          layer: 'L2',
          zone: mgrSchedule.area,
        };
        return [
          {
            run: pending,
            supervisorName: supSchedule.assignee,
            supervisorInitials: supSchedule.assigneeInitials,
            supervisorColor: supSchedule.assigneeColor,
          },
        ];
      },
    );
  }

  /**
   * Returns the current L1 (Operator) LPA status for every area a supervisor
   * is responsible for, so the supervisor can cross-verify their team's work.
   *
   * For each area covered by the supervisor's L2 schedule:
   *   1. If an active (Pending / In Progress / Overdue) L1 run exists → return it.
   *   2. If the operator completed their check today → return it.
   *   3. Otherwise synthesize a Pending entry so the supervisor always sees a
   *      complete picture of every area, not just areas where runs were logged.
   */
  getTeamL1Completions(supervisorName: string): Array<{
    run: LPARun;
    operatorName: string;
    operatorInitials: string;
    operatorColor: string;
  }> {
    const allRuns = this._lpaRuns();
    const today = new Date().toISOString().split('T')[0];

    return LPA_SCHEDULES.filter(
      (s) => s.assignee === supervisorName && s.layer === 'Supervisor',
    ).flatMap((supSchedule) => {
      const opSchedule = LPA_SCHEDULES.find(
        (s) => s.area === supSchedule.area && s.layer === 'Operator',
      );
      if (!opSchedule) return [];

      const runsForArea = allRuns.filter(
        (r) => r.owner === opSchedule.assignee && r.zone === supSchedule.area && r.layer === 'L1',
      );

      const activeRun = runsForArea.find(
        (r) => r.status === 'Pending' || r.status === 'In Progress' || r.status === 'Overdue',
      );
      if (activeRun) {
        return [
          {
            run: activeRun,
            operatorName: opSchedule.assignee,
            operatorInitials: opSchedule.assigneeInitials,
            operatorColor: opSchedule.assigneeColor,
          },
        ];
      }

      const completedRun = runsForArea
        .filter((r) => r.status === 'Completed')
        .sort((a, b) => (b.completedDate ?? '').localeCompare(a.completedDate ?? ''))[0];
      if (completedRun) {
        return [
          {
            run: completedRun,
            operatorName: opSchedule.assignee,
            operatorInitials: opSchedule.assigneeInitials,
            operatorColor: opSchedule.assigneeColor,
          },
        ];
      }

      const siteId =
        runsForArea[0]?.siteId ??
        allRuns.find((r) => r.owner === opSchedule.assignee)?.siteId ??
        'SITE-001';
      const pending: LPARun = {
        id: `LPA-SCH-${opSchedule.id}`,
        title: `L1 Daily – ${supSchedule.area}`,
        status: 'Pending',
        owner: opSchedule.assignee,
        ownerInitials: opSchedule.assigneeInitials,
        ownerId: this.userIdByName[opSchedule.assignee] ?? '',
        dueDate: today,
        siteId,
        completionRate: 0,
        layer: 'L1',
        zone: supSchedule.area,
      };
      return [
        {
          run: pending,
          operatorName: opSchedule.assignee,
          operatorInitials: opSchedule.assigneeInitials,
          operatorColor: opSchedule.assigneeColor,
        },
      ];
    });
  }

  /**
   * Returns all LPA checks due today for a given assignee, derived from the
   * Active Schedules as the single source of truth.
   *
   * For each schedule assigned to the user:
   *   1. Return the existing run if one is already active (Pending / In Progress / Overdue).
   *   2. Skip if a run was already completed today.
   *   3. Otherwise synthesize a new Pending run so the dashboard is always complete.
   */
  getLpaDueToday(assigneeName: string): LPARun[] {
    const today = new Date().toISOString().split('T')[0];
    const layerMap: Record<string, 'L1' | 'L2' | 'L3'> = {
      Operator: 'L1',
      Supervisor: 'L2',
      Manager: 'L3',
    };

    // Read the signal so this method is tracked as a reactive dependency
    const allRuns = this._lpaRuns();

    // Infer the user's primary site from their existing runs (fallback: SITE-001)
    const userRuns = allRuns.filter((r) => r.owner === assigneeName);
    const siteId = userRuns[0]?.siteId ?? 'SITE-001';

    return LPA_SCHEDULES.filter((s) => s.assignee === assigneeName).flatMap((schedule) => {
      const layer = layerMap[schedule.layer] ?? 'L1';

      // 1. Existing active run (any date) — return as-is
      const activeRun = allRuns.find(
        (r) =>
          r.owner === assigneeName &&
          r.zone === schedule.area &&
          r.layer === layer &&
          (r.status === 'Pending' || r.status === 'In Progress' || r.status === 'Overdue'),
      );
      if (activeRun) return [activeRun];

      // 2. Already completed (any date) — nothing to show. The run is done.
      const completedRun = allRuns.find(
        (r) =>
          r.owner === assigneeName &&
          r.zone === schedule.area &&
          r.layer === layer &&
          r.status === 'Completed',
      );
      if (completedRun) return [];

      // 3. No run exists for today → synthesize a Pending run from the schedule
      const template = LPA_TEMPLATES.find((t) => t.id === schedule.templateId);
      const freqLabel = template?.frequency ?? 'Daily';
      const run: LPARun = {
        id: `LPA-SCH-${schedule.id}`,
        title: `${layer} ${freqLabel} – ${schedule.area}`,
        status: 'Pending',
        owner: assigneeName,
        ownerInitials: schedule.assigneeInitials,
        ownerId: this.userIdByName[assigneeName] ?? '',
        dueDate: today,
        siteId,
        completionRate: 0,
        layer,
        zone: schedule.area,
      };
      return [run];
    });
  }
}
