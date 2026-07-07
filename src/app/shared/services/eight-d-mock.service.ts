import { Injectable, signal, computed } from '@angular/core';
import {
  EightD, EightD_D1, EightD_D2, EightD_D3, EightD_D4, EightD_D5,
  EightD_D6, EightD_D7, EightD_D8
} from '../interfaces/eight-d.models';

const INITIAL: EightD[] = [
  // ── Record 1 ──────────────────────────────────────────────────────────────
  {
    id: '8D-2026-0042',
    title: 'Excessive brake pedal free-play — Bosch Rastatt field return',
    sourceType: 'Customer Complaint',
    sourceId: 'CMP-2026-0145',
    sourceTitle: 'Customer complaint: excessive brake pedal free-play',
    customer: 'Bosch',
    customerContact: 'Klaus Weber — SQE',
    site: 'Plant-1',
    siteId: 'SITE-001',
    product: 'Brake Pedal Assembly',
    partNumber: 'BPA-4417',
    severity: 'Critical',
    owner: 'Maria Delgado',
    ownerInitials: 'MD',
    ownerColor: '#2563EB',
    dueDate: '2026-07-10',
    createdAt: '2026-05-23',
    status: 'Open',
    activeStep: 'D4',
    completedSteps: ['D1', 'D2', 'D3'],
    onTimeStatus: 'at-risk',
    daysOpen: 22,
    daysInCurrentStep: 5,
    completionPct: 45,
    isCustomerFacing: true,
    isSupplierFacing: false,
    effectivenessPending: false,
    d1: {
      teamLeader: 'Maria Delgado',
      teamLeaderInitials: 'MD',
      teamLeaderColor: '#2563EB',
      champion: 'Sarah Chen',
      championInitials: 'SC',
      championColor: '#0891B2',
      formedAt: '2026-05-23',
      members: [
        { id: 'm1', name: 'Dev Patel', initials: 'DP', color: '#7C3AED', role: 'Quality Engineer', department: 'Quality', email: 'dev.patel@qualvora.com' },
        { id: 'm2', name: 'James Okonkwo', initials: 'JO', color: '#059669', role: 'Manufacturing Engineer', department: 'Manufacturing', email: 'james.okonkwo@qualvora.com' },
        { id: 'm3', name: 'Priya Nair', initials: 'PN', color: '#DC2626', role: 'Process Engineer', department: 'Engineering', email: 'priya.nair@qualvora.com' },
        { id: 'm4', name: 'Tom Braswell', initials: 'TB', color: '#B45309', role: 'Production Supervisor', department: 'Production', email: 'tom.braswell@qualvora.com' },
      ]
    } as EightD_D1,
    d2: {
      what: 'Brake pedal free-play measured at 18–22mm at vehicle assembly, exceeding the 5mm maximum specification per BPA-4417 Rev D drawing.',
      where: 'Detected at Bosch Rastatt vehicle assembly line, Station 14 — brake system installation',
      when: '2026-05-20, during routine in-process inspection at customer plant',
      who: 'Klaus Weber, Bosch SQE, and incoming inspection team',
      howMany: '12 vehicles affected, 47 suspect pedal assemblies in stock at customer',
      howOften: 'Identified in a single batch — Lot W4-0521. No prior history of this defect code on BPA-4417.',
      impact: 'Vehicle line stop at Bosch Rastatt for 4 hours. Customer warranty exposure estimated €28,400. IATF 16949 Customer Notification required within 24 hours.',
      problemStatement: 'Brake pedal assemblies from Lot W4-0521 (Part BPA-4417, Rev D) exhibit free-play of 18–22mm at vehicle level. Specification requires ≤5mm. 12 vehicles affected at Bosch Rastatt; 47 additional units in customer stock quarantined. Root cause under investigation.',
      customerReference: 'BOSCH-SQN-2026-0847',
      attachments: [
        { id: 'a1', name: 'BOSCH-SQN-2026-0847_Customer_Email.pdf', type: 'email', size: '184 KB', uploadedBy: 'Maria Delgado', uploadedAt: '2026-05-23' },
        { id: 'a2', name: 'BPA4417_FreePlay_Measurement_Photos.zip', type: 'photo', size: '8.2 MB', uploadedBy: 'Dev Patel', uploadedAt: '2026-05-24' },
        { id: 'a3', name: 'Torque_Tester_Calibration_Record_CMM02.pdf', type: 'report', size: '312 KB', uploadedBy: 'Priya Nair', uploadedAt: '2026-05-24' },
        { id: 'a4', name: 'BPA4417_Rev_D_Drawing.pdf', type: 'document', size: '1.1 MB', uploadedBy: 'Dev Patel', uploadedAt: '2026-05-23' },
      ]
    } as EightD_D2,
    d3: {
      affectedInventoryQty: 47,
      blockedInventoryQty: 47,
      customerShipmentsHeld: 2,
      containmentEffective: true,
      effectivenessNote: 'All suspect stock identified and quarantined at customer. No additional vehicles entered line.',
      completedAt: '2026-05-25',
      actions: [
        { id: 'c1', action: 'Stop production of BPA-4417 on Line 2 pending root cause investigation', type: 'Production Stop', owner: 'Maria Delgado', ownerInitials: 'MD', ownerColor: '#2563EB', dueDate: '2026-05-23', completedDate: '2026-05-23', status: 'Verified', evidence: 'Line Stop Notice LSN-0523 issued' },
        { id: 'c2', action: 'Segregate and quarantine all BPA-4417 units from Lot W4-0521 in WH-4 (47 units at customer, 23 units in transit)', type: 'Stock Segregation', owner: 'Dev Patel', ownerInitials: 'DP', ownerColor: '#7C3AED', dueDate: '2026-05-24', completedDate: '2026-05-24', status: 'Verified', evidence: 'Quarantine tag QT-2026-0847 applied, confirmed by warehouse' },
        { id: 'c3', action: 'Issue formal customer notification to Bosch SQE per IATF 16949 §10.2.3 within 24 hours', type: 'Customer Notification', owner: 'Maria Delgado', ownerInitials: 'MD', ownerColor: '#2563EB', dueDate: '2026-05-24', completedDate: '2026-05-24', status: 'Verified', evidence: 'Email confirmation received from Klaus Weber 2026-05-24 09:14' },
      ]
    } as EightD_D3,
    d4: {
      method: '5-Why',
      whyRows: [
        { level: 1, why: 'Why did the pedal assembly have excessive free-play?', answer: 'The pivot pin torque was applied below specification (12 Nm vs 28 Nm required per WI-BPA-4417-03).' },
        { level: 2, why: 'Why was the pivot pin torque below specification?', answer: 'The torque tester (TT-07) had an expired calibration certificate — calibration was due 2026-05-06, 14 days before detection.' },
        { level: 3, why: 'Why did the operator use an out-of-calibration torque tester?', answer: 'The calibration due date label on TT-07 was illegible due to solvent exposure. No visual alert or system lock-out existed.' },
        { level: 4, why: 'Why was there no system lock-out for an out-of-calibration instrument?', answer: 'The calibration management system (CMS) did not interface with the production floor tooling. Overdue alerts were sent only to the metrology supervisor email, not to the production line.' },
        { level: 5, why: 'Why was the CMS not integrated with production floor tooling alerts?', answer: 'No poka-yoke requirement existed in the Control Plan for calibration verification at the start of each shift. The gap was not identified during the last PFMEA review (2025-10-12).' },
      ],
      fishbone: { man: [], machine: [], method: [], material: [], measurement: [], environment: [] },
      rootCauseStatement: 'Torque tester TT-07 operated 14 days beyond its calibration due date due to an illegible calibration label and absence of a production floor lock-out mechanism, resulting in pivot pin torque applied at 12 Nm vs the 28 Nm specification for 3 production shifts, producing 58 non-conforming BPA-4417 assemblies.',
      escapePoint: 'In-process torque verification check — Station 7, Line 2',
      escapeRootCause: 'No poka-yoke existed to prevent use of out-of-calibration tooling; in-process audit did not verify instrument calibration status.',
      rootCauseCategory: 'Equipment Failure',
      verifiedBy: 'Dev Patel',
      verifiedAt: '2026-05-28'
    } as EightD_D4,
    linkedRecords: [
      { type: 'Complaint', id: 'CMP-2026-0145', title: 'Bosch: Excessive brake pedal free-play, 12 vehicles', status: 'Under Review', route: '/complaints' },
      { type: 'NCR', id: 'NCR-2026-0131', title: 'BPA-4417 pivot pin torque out of specification', status: 'Open', route: '/ncrs/NCR-2026-0131' },
      { type: 'Control Plan', id: 'DOC-0003', title: 'Control Plan – Brake Pedal Assembly Line 2', status: 'Released', route: '/documents/DOC-0003' },
    ],
    activity: [
      { id: 'av1', actor: 'Maria Delgado', actorInitials: 'MD', actorColor: '#2563EB', action: '8D Initiated', detail: 'Created from customer complaint CMP-2026-0145', timestamp: '2026-05-23T08:31:00', timeAgo: '22 days ago' },
      { id: 'av2', actor: 'Maria Delgado', actorInitials: 'MD', actorColor: '#2563EB', action: 'D1 Completed', detail: 'Team formed — 5 members assigned', discipline: 'D1', timestamp: '2026-05-23T10:14:00', timeAgo: '22 days ago' },
      { id: 'av3', actor: 'Dev Patel', actorInitials: 'DP', actorColor: '#7C3AED', action: 'D2 Completed', detail: '5W2H problem description submitted and approved', discipline: 'D2', timestamp: '2026-05-24T14:22:00', timeAgo: '21 days ago' },
      { id: 'av4', actor: 'Dev Patel', actorInitials: 'DP', actorColor: '#7C3AED', action: 'D3 Completed', detail: '3 containment actions verified — 47 units quarantined', discipline: 'D3', timestamp: '2026-05-25T16:05:00', timeAgo: '20 days ago' },
      { id: 'av5', actor: 'Priya Nair', actorInitials: 'PN', actorColor: '#DC2626', action: 'D4 In Progress', detail: '5-Why analysis initiated — calibration gap identified', discipline: 'D4', timestamp: '2026-05-28T09:50:00', timeAgo: '17 days ago' },
      { id: 'av6', actor: 'Sarah Chen', actorInitials: 'SC', actorColor: '#0891B2', action: 'Customer Update Sent', detail: 'Progress update sent to Klaus Weber (Bosch SQE)', timestamp: '2026-06-02T11:30:00', timeAgo: '12 days ago' },
    ],
    attachments: [
      { id: 'a1', name: 'BOSCH-SQN-2026-0847_Customer_Email.pdf', type: 'email', size: '184 KB', uploadedBy: 'Maria Delgado', uploadedAt: '2026-05-23' },
      { id: 'a2', name: 'BPA4417_FreePlay_Measurement_Photos.zip', type: 'photo', size: '8.2 MB', uploadedBy: 'Dev Patel', uploadedAt: '2026-05-24' },
      { id: 'a3', name: 'Torque_Tester_Calibration_Record_CMM02.pdf', type: 'report', size: '312 KB', uploadedBy: 'Priya Nair', uploadedAt: '2026-05-24' },
      { id: 'a4', name: 'BPA4417_Rev_D_Drawing.pdf', type: 'document', size: '1.1 MB', uploadedBy: 'Dev Patel', uploadedAt: '2026-05-23' },
    ]
  },

  // ── Record 2 ──────────────────────────────────────────────────────────────
  {
    id: '8D-2026-0038',
    title: 'ABS sensor connector housing OD out of tolerance — Continental batch rejection',
    sourceType: 'Supplier NCR',
    sourceId: 'NCR-2026-0287',
    customer: 'Continental',
    site: 'Plant-2',
    siteId: 'SITE-002',
    product: 'ABS Sensor Housing',
    partNumber: 'ABH-2290',
    severity: 'Major',
    owner: 'Dev Patel',
    ownerInitials: 'DP',
    ownerColor: '#7C3AED',
    dueDate: '2026-07-05',
    createdAt: '2026-05-20',
    status: 'Open',
    activeStep: 'D5',
    completedSteps: ['D1', 'D2', 'D3', 'D4'],
    onTimeStatus: 'on-track',
    daysOpen: 25,
    daysInCurrentStep: 3,
    completionPct: 60,
    isCustomerFacing: true,
    isSupplierFacing: true,
    effectivenessPending: false,
    d1: {
      teamLeader: 'Dev Patel',
      teamLeaderInitials: 'DP',
      teamLeaderColor: '#7C3AED',
      champion: 'Maria Delgado',
      championInitials: 'MD',
      championColor: '#2563EB',
      formedAt: '2026-05-21',
      members: [
        { id: 'm1', name: 'Priya Nair', initials: 'PN', color: '#DC2626', role: 'Supplier Quality Engineer', department: 'Supplier Quality', email: 'priya.nair@qualvora.com' },
        { id: 'm2', name: 'James Okonkwo', initials: 'JO', color: '#059669', role: 'Manufacturing Engineer', department: 'Manufacturing', email: 'james.okonkwo@qualvora.com' },
      ]
    } as EightD_D1,
    d2: {
      what: 'ABS sensor connector housing OD measures 14.82–14.88mm vs 15.00±0.05mm specification on 340 units from supplier batch SB-0519.',
      where: 'Detected at Qualvora Plant-2 incoming inspection, CMM Bay 3.',
      when: '2026-05-19, during 100% incoming inspection of batch SB-0519.',
      who: 'James Okonkwo, Incoming Quality Inspector.',
      howMany: '340 of 400 units non-conforming. 60 units conforming and separated.',
      howOften: 'First occurrence for supplier Mold-Tech Solutions on this part. Previous 8 batches were conforming.',
      impact: 'Production line hold on ABS module assembly. Estimated 2-day delay. Continental notified per customer-specific requirement.',
      problemStatement: 'Supplier batch SB-0519 of ABS Sensor Housing ABH-2290 exhibits connector housing OD of 14.82–14.88mm, below the 14.95mm minimum. 340/400 units rejected. Supplier injection mold wear identified as likely cause pending D4 confirmation.',
      customerReference: 'CONT-SQR-2026-0412',
      attachments: [
        { id: 'b1', name: 'ABH2290_CMM_Report_Batch_SB0519.pdf', type: 'report', size: '445 KB', uploadedBy: 'James Okonkwo', uploadedAt: '2026-05-20' },
        { id: 'b2', name: 'Incoming_Inspection_Photos_ABH2290.zip', type: 'photo', size: '5.7 MB', uploadedBy: 'James Okonkwo', uploadedAt: '2026-05-20' },
        { id: 'b3', name: 'Continental_SQR_2026_0412.pdf', type: 'email', size: '92 KB', uploadedBy: 'Dev Patel', uploadedAt: '2026-05-21' },
      ]
    } as EightD_D2,
    d3: {
      affectedInventoryQty: 340,
      blockedInventoryQty: 340,
      customerShipmentsHeld: 1,
      containmentEffective: true,
      completedAt: '2026-05-22',
      actions: [
        { id: 'c1', action: 'Place all 340 non-conforming ABH-2290 units in red-tagged quarantine bin at incoming WH-2', type: 'Quarantine', owner: 'James Okonkwo', ownerInitials: 'JO', ownerColor: '#059669', dueDate: '2026-05-20', completedDate: '2026-05-20', status: 'Verified' },
        { id: 'c2', action: 'Issue Supplier Corrective Action Request (SCAR) to Mold-Tech Solutions within 48 hours', type: 'Supplier Notification', owner: 'Priya Nair', ownerInitials: 'PN', ownerColor: '#DC2626', dueDate: '2026-05-21', completedDate: '2026-05-21', status: 'Verified' },
        { id: 'c3', action: 'Notify Continental SQE of batch rejection and hold on ABS module assembly', type: 'Customer Notification', owner: 'Dev Patel', ownerInitials: 'DP', ownerColor: '#7C3AED', dueDate: '2026-05-21', completedDate: '2026-05-21', status: 'Verified' },
      ]
    } as EightD_D3,
    d4: {
      method: 'Fishbone',
      whyRows: [],
      fishbone: {
        man: [{ id: 'f1', text: 'Operator not informed of mold wear threshold', isRoot: false }],
        machine: [{ id: 'f2', text: 'Injection mold cavity #3 worn 0.12mm beyond maintenance interval', isRoot: true }, { id: 'f3', text: 'Mold PM schedule overdue by 12 production cycles', isRoot: false }],
        method: [{ id: 'f4', text: 'No in-process dimensional check on OD after mold change', isRoot: false }],
        material: [],
        measurement: [{ id: 'f5', text: 'Supplier CMM calibration interval 6 months — dimension drift undetected', isRoot: false }],
        environment: []
      },
      rootCauseStatement: 'Mold-Tech Solutions injection mold tooling (Cavity 3) exceeded its preventive maintenance interval by 12 production cycles, resulting in cavity wear of 0.12mm that caused the ABH-2290 connector housing OD to drop below the 14.95mm minimum. No in-process dimensional monitoring existed to detect the drift.',
      escapePoint: 'Supplier outgoing inspection / dimensional sampling',
      escapeRootCause: 'Supplier sampling plan (AQL 2.5, Level II) had insufficient sensitivity to detect a 0.12mm systematic cavity shift. No SPC chart was maintained on the OD characteristic.',
      rootCauseCategory: 'Equipment Failure',
      verifiedBy: 'Dev Patel',
      verifiedAt: '2026-05-27'
    } as EightD_D4,
    d5: {
      actions: [
        { id: 'a1', description: 'Replace worn mold cavity #3 with new tooling — Mold-Tech to provide dimensional report of new cavity', owner: 'Priya Nair', ownerInitials: 'PN', ownerColor: '#DC2626', dueDate: '2026-06-10', priority: 'Critical', status: 'In Progress' },
        { id: 'a2', description: 'Implement 100% OD dimensional check at supplier using automated gauge — add to Mold-Tech control plan', owner: 'Priya Nair', ownerInitials: 'PN', ownerColor: '#DC2626', dueDate: '2026-06-15', priority: 'High', status: 'Open' },
        { id: 'a3', description: 'Revise Mold-Tech PM schedule from 5,000 cycles to 3,500 cycles for ABH-2290 mold tooling', owner: 'Dev Patel', ownerInitials: 'DP', ownerColor: '#7C3AED', dueDate: '2026-06-12', priority: 'High', status: 'Open' },
        { id: 'a4', description: 'Conduct incoming inspection upgrade to 100% CMM check for ABH-2290 for next 5 batches', owner: 'James Okonkwo', ownerInitials: 'JO', ownerColor: '#059669', dueDate: '2026-06-05', priority: 'Medium', status: 'Complete', completedDate: '2026-06-04' },
      ]
    } as EightD_D5,
    linkedRecords: [
      { type: 'NCR', id: 'NCR-2026-0287', title: 'Supplier NCR: ABH-2290 OD non-conformance — Mold-Tech batch SB-0519', status: 'Under Review', route: '/ncrs/NCR-2026-0287' },
      { type: 'Supplier Issue', id: 'SUPP-2026-0041', title: 'Mold-Tech Solutions — mold tooling maintenance overdue', status: 'Open', route: '/suppliers' },
    ],
    activity: [
      { id: 'bv1', actor: 'Dev Patel', actorInitials: 'DP', actorColor: '#7C3AED', action: '8D Initiated', detail: 'Supplier NCR NCR-2026-0287 escalated to 8D', timestamp: '2026-05-20T13:00:00', timeAgo: '25 days ago' },
      { id: 'bv2', actor: 'Dev Patel', actorInitials: 'DP', actorColor: '#7C3AED', action: 'D1–D3 Completed', detail: 'Team formed, problem described, 340 units quarantined', discipline: 'D3', timestamp: '2026-05-22T17:30:00', timeAgo: '23 days ago' },
      { id: 'bv3', actor: 'Priya Nair', actorInitials: 'PN', actorColor: '#DC2626', action: 'D4 Completed', detail: 'Fishbone analysis — mold wear identified as root cause', discipline: 'D4', timestamp: '2026-05-27T10:45:00', timeAgo: '18 days ago' },
      { id: 'bv4', actor: 'Dev Patel', actorInitials: 'DP', actorColor: '#7C3AED', action: 'D5 In Progress', detail: '4 corrective actions defined, 1 complete', discipline: 'D5', timestamp: '2026-06-01T09:20:00', timeAgo: '13 days ago' },
    ],
    attachments: [
      { id: 'b1', name: 'ABH2290_CMM_Report_Batch_SB0519.pdf', type: 'report', size: '445 KB', uploadedBy: 'James Okonkwo', uploadedAt: '2026-05-20' },
      { id: 'b2', name: 'Incoming_Inspection_Photos_ABH2290.zip', type: 'photo', size: '5.7 MB', uploadedBy: 'James Okonkwo', uploadedAt: '2026-05-20' },
      { id: 'b3', name: 'Continental_SQR_2026_0412.pdf', type: 'email', size: '92 KB', uploadedBy: 'Dev Patel', uploadedAt: '2026-05-21' },
    ]
  },

  // ── Record 3 ──────────────────────────────────────────────────────────────
  {
    id: '8D-2026-0035',
    title: 'Weld porosity on SBA-1089 seat bracket assembly — Magna supplier audit finding',
    sourceType: 'Internal NCR',
    sourceId: 'NCR-2026-0265',
    customer: 'Magna',
    site: 'Plant-1',
    siteId: 'SITE-001',
    product: 'Seat Bracket Assembly',
    partNumber: 'SBA-1089',
    severity: 'Major',
    owner: 'Dev Patel',
    ownerInitials: 'DP',
    ownerColor: '#7C3AED',
    dueDate: '2026-06-28',
    createdAt: '2026-05-13',
    status: 'Open',
    activeStep: 'D6',
    completedSteps: ['D1', 'D2', 'D3', 'D4', 'D5'],
    onTimeStatus: 'overdue',
    daysOpen: 32,
    daysInCurrentStep: 6,
    completionPct: 72,
    isCustomerFacing: true,
    isSupplierFacing: false,
    effectivenessPending: false,
    d6: {
      implementationDate: '2026-06-08',
      overallResult: 'Pending',
      validations: [
        { id: 'v1', method: 'Capability Study', description: 'Cpk study on weld bead geometry post-machine recalibration — target Cpk ≥ 1.67', owner: 'Dev Patel', ownerInitials: 'DP', ownerColor: '#7C3AED', dueDate: '2026-06-22', result: 'Pending', notes: 'Study initiated 2026-06-12. 30-piece sample in progress.' },
        { id: 'v2', method: 'SPC Monitoring', description: 'Implement SPC x-bar/R chart on weld current and travel speed for SBA-1089 on Welder WM-04', owner: 'James Okonkwo', ownerInitials: 'JO', ownerColor: '#059669', dueDate: '2026-06-20', result: 'Pending', notes: 'SPC chart installed. First 15 data points collected.' },
        { id: 'v3', method: 'Audit Verification', description: 'Layer 2 process audit on weld station WM-04 to verify all corrective actions implemented', owner: 'Maria Delgado', ownerInitials: 'MD', ownerColor: '#2563EB', dueDate: '2026-06-18', result: 'Pending', notes: 'Audit scheduled for 2026-06-18.' },
      ]
    } as EightD_D6,
    linkedRecords: [
      { type: 'NCR', id: 'NCR-2026-0265', title: 'SBA-1089 weld porosity — Lot W3-0513, 47 units', status: 'Under Review', route: '/ncrs/NCR-2026-0265' },
      { type: 'PFMEA', id: 'DOC-0018', title: 'PFMEA – Stamping & Weld Line 2', status: 'Released', route: '/documents/DOC-0018' },
    ],
    activity: [
      { id: 'cv1', actor: 'Dev Patel', actorInitials: 'DP', actorColor: '#7C3AED', action: '8D Initiated', detail: 'Weld porosity NCR escalated to 8D per severity threshold', timestamp: '2026-05-13T07:45:00', timeAgo: '32 days ago' },
      { id: 'cv2', actor: 'Dev Patel', actorInitials: 'DP', actorColor: '#7C3AED', action: 'D1–D5 Completed', detail: '5 disciplines completed. Root cause: weld machine WM-04 parameter drift.', timestamp: '2026-06-08T16:00:00', timeAgo: '6 days ago' },
      { id: 'cv3', actor: 'James Okonkwo', actorInitials: 'JO', actorColor: '#059669', action: 'D6 In Progress', detail: '3 validations underway — Cpk study, SPC, process audit', discipline: 'D6', timestamp: '2026-06-09T09:30:00', timeAgo: '5 days ago' },
    ],
    attachments: [
      { id: 'c1', name: 'SBA1089_Porosity_Xray_Report.pdf', type: 'report', size: '2.1 MB', uploadedBy: 'Dev Patel', uploadedAt: '2026-05-14' }
    ]
  },

  // ── Record 4 ──────────────────────────────────────────────────────────────
  {
    id: '8D-2026-0031',
    title: 'Wiring harness incorrect pin assignment — Lear CAN bus fault',
    sourceType: 'Customer Complaint',
    sourceId: 'CMP-2026-0138',
    customer: 'Lear',
    site: 'Plant-3',
    siteId: 'SITE-003',
    product: 'Wiring Harness Connector',
    partNumber: 'WHC-8821',
    severity: 'Critical',
    owner: 'Priya Nair',
    ownerInitials: 'PN',
    ownerColor: '#DC2626',
    dueDate: '2026-06-25',
    createdAt: '2026-05-05',
    status: 'Open',
    activeStep: 'D7',
    completedSteps: ['D1', 'D2', 'D3', 'D4', 'D5', 'D6'],
    onTimeStatus: 'overdue',
    daysOpen: 40,
    daysInCurrentStep: 4,
    completionPct: 85,
    isCustomerFacing: true,
    isSupplierFacing: false,
    effectivenessPending: false,
    d7: {
      completionPct: 71,
      lessonsLearned: 'Pin assignment errors can occur when engineering change orders (ECOs) are not propagated to the assembly floor work instructions within the same revision cycle. The gap between engineering release and shop floor implementation must be reduced to <24 hours with mandatory work instruction update verification before production resumes.',
      horizontalDeployment: 'All wiring harness assemblies (WHC-series) at Plant-3 reviewed for ECO propagation compliance. 3 additional part numbers identified for work instruction update.',
      items: [
        { id: 's1', label: 'PFMEA Updated — pin assignment error mode added with RPN reduction', checked: true, owner: 'Priya Nair', completedDate: '2026-06-08' },
        { id: 's2', label: 'Control Plan Updated — 100% pin continuity test added at end-of-line', checked: true, owner: 'James Okonkwo', completedDate: '2026-06-10' },
        { id: 's3', label: 'Work Instruction Revised — WI-WHC-8821-02 Rev E issued with pin layout diagram', checked: true, owner: 'Tom Braswell', completedDate: '2026-06-09' },
        { id: 's4', label: 'SOP Updated — ECO propagation SOP-ENG-004 revised to include 24-hour WI update requirement', checked: true, owner: 'Sarah Chen', completedDate: '2026-06-11' },
        { id: 's5', label: 'Training Completed — all harness assembly operators re-certified on WHC-8821 Rev E', checked: true, owner: 'Tom Braswell', completedDate: '2026-06-12' },
        { id: 's6', label: 'Supplier Notified — connector supplier informed of updated pin specification', checked: false, owner: 'Priya Nair' },
        { id: 's7', label: 'Lessons Learned Recorded — entry added to Plant-3 quality lessons learned register', checked: false, owner: 'Sarah Chen' },
      ]
    } as EightD_D7,
    linkedRecords: [
      { type: 'Complaint', id: 'CMP-2026-0138', title: 'Lear: CAN bus intermittent fault — pin assignment error', status: 'Under Review', route: '/complaints' },
      { type: 'PFMEA', id: 'DOC-0041', title: 'PFMEA – Wiring Harness Assembly WHC-series', status: 'Released', route: '/documents/DOC-0041' },
      { type: 'Control Plan', id: 'DOC-0021', title: 'Control Plan – WHC-8821 Assembly', status: 'Released', route: '/documents/DOC-0021' },
    ],
    activity: [
      { id: 'dv1', actor: 'Priya Nair', actorInitials: 'PN', actorColor: '#DC2626', action: '8D Initiated', detail: 'Critical customer complaint from Lear — CAN bus fault', timestamp: '2026-05-05T08:00:00', timeAgo: '40 days ago' },
      { id: 'dv2', actor: 'Priya Nair', actorInitials: 'PN', actorColor: '#DC2626', action: 'D1–D6 Completed', detail: 'Root cause confirmed: ECO not propagated to WI. All corrective actions implemented.', timestamp: '2026-06-10T17:00:00', timeAgo: '4 days ago' },
      { id: 'dv3', actor: 'Tom Braswell', actorInitials: 'TB', actorColor: '#B45309', action: 'D7 In Progress', detail: 'Systemic prevention — 5 of 7 items complete', discipline: 'D7', timestamp: '2026-06-11T10:00:00', timeAgo: '3 days ago' },
    ],
    attachments: [
      { id: 'd1', name: 'Lear_CAN_Fault_Log.pdf', type: 'report', size: '780 KB', uploadedBy: 'Priya Nair', uploadedAt: '2026-05-06' }
    ]
  },

  // ── Record 5 ──────────────────────────────────────────────────────────────
  {
    id: '8D-2026-0028',
    title: 'PFMEA not updated after steering knuckle machining process change — ZF audit NC',
    sourceType: 'Audit Finding',
    sourceId: 'AUD-2026-007',
    customer: 'ZF',
    site: 'Plant-1',
    siteId: 'SITE-001',
    product: 'Steering Knuckle',
    partNumber: 'SK-3301',
    severity: 'Major',
    owner: 'Sarah Chen',
    ownerInitials: 'SC',
    ownerColor: '#0891B2',
    dueDate: '2026-06-20',
    createdAt: '2026-04-28',
    status: 'Pending Closure',
    activeStep: 'D8',
    completedSteps: ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'],
    onTimeStatus: 'at-risk',
    daysOpen: 47,
    daysInCurrentStep: 2,
    completionPct: 95,
    isCustomerFacing: true,
    isSupplierFacing: false,
    effectivenessPending: false,
    d8: {
      closureSummary: 'PFMEA for SK-3301 machining process has been fully updated to Rev F, incorporating all process changes made since March 2026. Control plan, work instructions, and operator training records updated in parallel. ZF SQE has reviewed and approved the updated documentation package. No recurrence of documentation gap identified in subsequent process audit.',
      customerApproval: 'Approved',
      customerApprovedBy: 'Rainer Schulz — ZF SQE',
      customerApprovedAt: '2026-06-12',
      lessonsLearned: 'Engineering change orders affecting manufacturing processes must trigger an automatic PFMEA review task assignment within the quality management system. A 72-hour SLA for PFMEA update must be enforced with escalation to Quality Manager if not completed.',
      recognitionNotes: 'Team completed all D7 systemic actions within 10 days. Special recognition to Dev Patel for leading the PFMEA update and securing ZF approval ahead of schedule.',
      teamCelebrated: true
    } as EightD_D8,
    linkedRecords: [
      { type: 'Audit Finding', id: 'AUD-2026-007', title: 'ZF Customer Audit — PFMEA not current', status: 'Closed', route: '/audits/AUD-2026-007' },
      { type: 'PFMEA', id: 'DOC-0018', title: 'PFMEA – SK-3301 Machining Line', status: 'Released', route: '/documents/DOC-0018' },
    ],
    activity: [
      { id: 'ev1', actor: 'Sarah Chen', actorInitials: 'SC', actorColor: '#0891B2', action: '8D Initiated', detail: 'ZF customer audit finding — PFMEA gap', timestamp: '2026-04-28T09:00:00', timeAgo: '47 days ago' },
      { id: 'ev2', actor: 'Sarah Chen', actorInitials: 'SC', actorColor: '#0891B2', action: 'D1–D7 Completed', detail: 'All disciplines completed. ZF approval received.', timestamp: '2026-06-12T15:00:00', timeAgo: '2 days ago' },
      { id: 'ev3', actor: 'Sarah Chen', actorInitials: 'SC', actorColor: '#0891B2', action: 'D8 In Progress', detail: 'Closure summary prepared, pending final QM sign-off', discipline: 'D8', timestamp: '2026-06-13T08:00:00', timeAgo: '1 day ago' },
    ],
    attachments: [
      { id: 'e1', name: 'ZF_Audit_NC_Report_AUD2026007.pdf', type: 'report', size: '1.4 MB', uploadedBy: 'Sarah Chen', uploadedAt: '2026-04-29' }
    ]
  },

  // ── Record 6 ──────────────────────────────────────────────────────────────
  {
    id: '8D-2026-0024',
    title: 'Airbag housing cover surface delamination — Valeo field warranty returns',
    sourceType: 'Warranty Claim',
    sourceId: 'WRN-2026-0019',
    customer: 'Valeo',
    site: 'Plant-2',
    siteId: 'SITE-002',
    product: 'Airbag Housing Cover',
    partNumber: 'AHC-5530',
    severity: 'Critical',
    owner: 'Maria Delgado',
    ownerInitials: 'MD',
    ownerColor: '#2563EB',
    dueDate: '2026-05-30',
    createdAt: '2026-04-14',
    status: 'Closed',
    closedAt: '2026-06-05',
    activeStep: 'D8',
    completedSteps: ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8'],
    onTimeStatus: 'on-track',
    daysOpen: 62,
    daysInCurrentStep: 0,
    completionPct: 100,
    isCustomerFacing: true,
    isSupplierFacing: false,
    effectivenessPending: true,
    effectivenessResult: 'Pass',
    effectiveness: {
      id: 'eff1',
      eightDId: '8D-2026-0024',
      verificationDate: '2026-06-10',
      auditor: 'Maria Delgado',
      auditorInitials: 'MD',
      auditorColor: '#2563EB',
      method: 'Production Run Audit',
      result: 'Pass',
      defectReoccurrence: false,
      customerFeedback: 'Valeo confirmed no further field returns in the 30 days following corrective action implementation. Warranty claim formally closed.',
      notes: '50-piece production sample inspected — zero delamination defects. Surface coating process Cpk = 1.84.'
    },
    d8: {
      closureSummary: 'Surface delamination root cause identified as insufficient surface preparation adhesion energy prior to coating application. Plasma treatment cycle extended from 8s to 14s and process monitoring added. 23 field returns resolved. Valeo warranty claim $47,200 accepted and credited.',
      customerApproval: 'Approved',
      customerApprovedBy: 'Thierry Marchand — Valeo SQE',
      customerApprovedAt: '2026-06-05',
      lessonsLearned: 'Coating adhesion parameters must be included as critical characteristics in the control plan with SPC monitoring. Plasma treatment energy (J/cm²) must be a recorded parameter, not an operator judgment.',
      teamCelebrated: true,
      closedAt: '2026-06-05',
      closedBy: 'Maria Delgado'
    } as EightD_D8,
    linkedRecords: [
      { type: 'Warranty', id: 'WRN-2026-0019', title: 'Valeo field returns — AHC-5530 surface delamination x23', status: 'Closed', route: '/reports' },
    ],
    activity: [
      { id: 'fv1', actor: 'Maria Delgado', actorInitials: 'MD', actorColor: '#2563EB', action: '8D Initiated', detail: 'Warranty claim from Valeo — 23 field returns', timestamp: '2026-04-14T08:30:00', timeAgo: '61 days ago' },
      { id: 'fv2', actor: 'Maria Delgado', actorInitials: 'MD', actorColor: '#2563EB', action: '8D Closed', detail: 'All 8 disciplines complete. Customer approval received.', timestamp: '2026-06-05T16:00:00', timeAgo: '9 days ago' },
      { id: 'fv3', actor: 'Maria Delgado', actorInitials: 'MD', actorColor: '#2563EB', action: 'Effectiveness Verified', detail: 'Pass — no recurrence in 30-day monitoring period', timestamp: '2026-06-10T11:00:00', timeAgo: '4 days ago' },
    ],
    attachments: [
      { id: 'f1', name: 'Valeo_Warranty_Returns_AHC5530.pdf', type: 'report', size: '3.2 MB', uploadedBy: 'Maria Delgado', uploadedAt: '2026-04-15' }
    ]
  },

  // ── Record 7 ──────────────────────────────────────────────────────────────
  {
    id: '8D-2026-0021',
    title: 'Missing ferrite bead on wiring harness — Aptiv EMC test failure',
    sourceType: 'Supplier NCR',
    sourceId: 'NCR-2026-0241',
    customer: 'Aptiv',
    site: 'Plant-3',
    siteId: 'SITE-003',
    product: 'Wiring Harness Subassembly',
    partNumber: 'WHS-4401',
    severity: 'Major',
    owner: 'James Okonkwo',
    ownerInitials: 'JO',
    ownerColor: '#059669',
    dueDate: '2026-07-15',
    createdAt: '2026-06-06',
    status: 'Open',
    activeStep: 'D3',
    completedSteps: ['D1', 'D2'],
    onTimeStatus: 'on-track',
    daysOpen: 8,
    daysInCurrentStep: 2,
    completionPct: 25,
    isCustomerFacing: true,
    isSupplierFacing: true,
    effectivenessPending: false,
    d3: {
      affectedInventoryQty: 120,
      blockedInventoryQty: 120,
      customerShipmentsHeld: 0,
      actions: [
        { id: 'g1', action: 'Sort all WHS-4401 units in WH-1 and WH-2 for missing ferrite bead — 100% visual check', type: 'Sort & Rework', owner: 'James Okonkwo', ownerInitials: 'JO', ownerColor: '#059669', dueDate: '2026-06-10', status: 'Complete', completedDate: '2026-06-09', evidence: '120 units sorted: 118 missing ferrite, 2 conforming' },
        { id: 'g2', action: 'Issue SCAR to harness supplier BT-Connectors Ltd — 48-hour response required', type: 'Supplier Notification', owner: 'James Okonkwo', ownerInitials: 'JO', ownerColor: '#059669', dueDate: '2026-06-08', status: 'Complete', completedDate: '2026-06-08' },
        { id: 'g3', action: 'Notify Aptiv SQE — 120 units quarantined, delivery postponed pending corrective action', type: 'Customer Notification', owner: 'James Okonkwo', ownerInitials: 'JO', ownerColor: '#059669', dueDate: '2026-06-08', status: 'Open' },
      ]
    } as EightD_D3,
    linkedRecords: [
      { type: 'NCR', id: 'NCR-2026-0241', title: 'WHS-4401 missing ferrite bead — EMC failure', status: 'Open', route: '/ncrs/NCR-2026-0241' },
    ],
    activity: [
      { id: 'gv1', actor: 'James Okonkwo', actorInitials: 'JO', actorColor: '#059669', action: '8D Initiated', detail: 'Supplier NCR escalated — Aptiv EMC test failure', timestamp: '2026-06-06T10:00:00', timeAgo: '8 days ago' },
      { id: 'gv2', actor: 'James Okonkwo', actorInitials: 'JO', actorColor: '#059669', action: 'D3 In Progress', detail: 'Sorting complete. SCAR issued to BT-Connectors.', discipline: 'D3', timestamp: '2026-06-09T14:00:00', timeAgo: '5 days ago' },
    ],
    attachments: [
      { id: 'g1a', name: 'Aptiv_EMC_Test_Failure_Report.pdf', type: 'report', size: '914 KB', uploadedBy: 'James Okonkwo', uploadedAt: '2026-06-07' }
    ]
  },

  // ── Record 8 ──────────────────────────────────────────────────────────────
  {
    id: '8D-2026-0019',
    title: 'Incorrect shipping label on BCH-9912 brake caliper housing — OEM logistics issue',
    sourceType: 'Internal NCR',
    sourceId: 'NCR-2026-0234',
    customer: 'Bosch',
    site: 'Plant-1',
    siteId: 'SITE-001',
    product: 'Brake Caliper Housing',
    partNumber: 'BCH-9912',
    severity: 'Minor',
    owner: 'Tom Braswell',
    ownerInitials: 'TB',
    ownerColor: '#B45309',
    dueDate: '2026-06-18',
    createdAt: '2026-05-29',
    status: 'Closed',
    closedAt: '2026-06-10',
    activeStep: 'D8',
    completedSteps: ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8'],
    onTimeStatus: 'on-track',
    daysOpen: 16,
    daysInCurrentStep: 0,
    completionPct: 100,
    isCustomerFacing: false,
    isSupplierFacing: false,
    effectivenessPending: false,
    effectivenessResult: 'Pass',
    effectiveness: {
      id: 'eff2',
      eightDId: '8D-2026-0019',
      verificationDate: '2026-06-12',
      auditor: 'Tom Braswell',
      auditorInitials: 'TB',
      auditorColor: '#B45309',
      method: 'Process Audit',
      result: 'Pass',
      defectReoccurrence: false,
      customerFeedback: 'No further labeling complaints received. Label verification poka-yoke confirmed operational.',
      notes: 'Label scan verification system confirmed working correctly on 100% of shipments for 10 days post-implementation.'
    },
    d8: {
      closureSummary: 'Label printer now integrated with ERP part number verification. Poka-yoke scan gate at shipping dock prevents any box from leaving without correct label scan confirmation. 200 mislabeled containers relabeled and shipped correctly.',
      customerApproval: 'Not Required',
      lessonsLearned: 'Shipping label generation must be tied directly to the production order in ERP — manual label printing must be eliminated. Scan-to-confirm at final ship gate is a simple and effective poka-yoke.',
      teamCelebrated: false,
      closedAt: '2026-06-10',
      closedBy: 'Tom Braswell'
    } as EightD_D8,
    linkedRecords: [
      { type: 'NCR', id: 'NCR-2026-0234', title: 'Incorrect label BCH-9912 shipping containers x200', status: 'Closed', route: '/ncrs/NCR-2026-0234' },
    ],
    activity: [
      { id: 'hv1', actor: 'Tom Braswell', actorInitials: 'TB', actorColor: '#B45309', action: '8D Initiated', detail: 'Labeling NCR escalated to 8D', timestamp: '2026-05-29T11:00:00', timeAgo: '16 days ago' },
      { id: 'hv2', actor: 'Tom Braswell', actorInitials: 'TB', actorColor: '#B45309', action: '8D Closed', detail: 'Label poka-yoke implemented and verified', timestamp: '2026-06-10T15:30:00', timeAgo: '4 days ago' },
    ],
    attachments: [
      { id: 'h1', name: 'BCH9912_Label_Error_Photos.zip', type: 'photo', size: '2.3 MB', uploadedBy: 'Tom Braswell', uploadedAt: '2026-05-30' }
    ]
  },
];

@Injectable({ providedIn: 'root' })
export class EightDMockService {
  private readonly _records = signal<EightD[]>(INITIAL);
  readonly records = this._records.asReadonly();

  getById(id: string): EightD | undefined {
    return this._records().find(r => r.id === id);
  }

  update(id: string, partial: Partial<EightD>): void {
    this._records.update(list => list.map(r => r.id === id ? { ...r, ...partial } : r));
  }
}
