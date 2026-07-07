# Qualvora — Role & User Reference

## LPA Layers

LPA (Layered Process Audit) has exactly **3 layers**, standard per IATF 16949 / Ford / GM LPA programs.

| Layer | Audit Scope | Typical Frequency |
|---|---|---|
| **Operator** (Layer 1) | Frontline — the people doing the work check their own station | Daily |
| **Supervisor** (Layer 2) | Mid-level — engineers and supervisors verify process compliance | Weekly |
| **Manager** (Layer 3) | Leadership — managers and directors review the system | Monthly |

---

## Job Titles → LPA Layer Mapping

| Job Title | Code | LPA Layer | Notes |
|---|---|---|---|
| Plant Director | `Director` | Manager | Plant-wide oversight, exclusive `/dashboard/director` |
| Quality Manager | `QM` | Manager | Owns the quality management system |
| Production Manager | `PM` | Manager | Oversees production operations |
| Quality Engineer | `QE` | Supervisor | Process compliance audits, Layer 2 |
| Quality Supervisor | `QS` | Supervisor | Direct floor supervision |
| Manufacturing Engineer | `ME` | Supervisor | Process improvement, shares QE dashboard |
| Quality Technician | `QT` | Operator | Inspection and daily checks |
| Production Operator | `Operator` | Operator | Frontline daily station checks |

---

## Mock Users

| ID | Name | Initials | Job Title | Code | LPA Layer | Site | Email | Password |
|---|---|---|---|---|---|---|---|---|
| USR-001 | Maria Delgado | MD | Quality Manager | `QM` | Manager | Plant-1 · Detroit | maria.delgado@qualvora.com | Qualvora@1 |
| USR-003 | Sarah Chen | SC | Plant Director | `Director` | Director | Plant-1 · Detroit | sarah.chen@qualvora.com | Qualvora@1 |
| USR-011 | Kevin Torres | KT | Production Manager | `PM` | Manager | Plant-1 · Detroit | kevin.torres@qualvora.com | Qualvora@1 |
| USR-002 | Dev Patel | DP | Quality Engineer | `QE` | Supervisor | Plant-1 · Detroit | dev.patel@qualvora.com | Qualvora@1 |
| USR-012 | Nina Brown | NB | Quality Supervisor | `QS` | Supervisor | Plant-1 · Detroit | nina.brown@qualvora.com | Qualvora@1 |
| USR-013 | Omar Hassan | OH | Manufacturing Engineer | `ME` | Supervisor | Plant-1 · Detroit | omar.hassan@qualvora.com | Qualvora@1 |
| USR-009 | Ravi Kumar | RK | Quality Technician | `QT` | Operator | Plant-1 · Detroit | ravi.kumar@qualvora.com | Qualvora@1 |
| USR-014 | Elena Petrov | EP | Production Operator | `Operator` | Operator | Plant-1 · Detroit | elena.petrov@qualvora.com | Qualvora@1 |
| USR-015 | Michael Zhang | MZ | Plant Director | `Director` | Director | Plant-2 · Chicago | michael.zhang@qualvora.com | Qualvora@1 |
| USR-016 | Sandra Kim | SK | Quality Manager | `QM` | Manager | Plant-2 · Chicago | sandra.kim@qualvora.com | Qualvora@1 |
| USR-007 | Carlos Mendez | CM | Production Manager | `PM` | Manager | Plant-2 · Chicago | carlos.mendez@qualvora.com | Qualvora@1 |
| USR-005 | Priya Nair | PN | Quality Engineer | `QE` | Supervisor | Plant-2 · Chicago | priya.nair@qualvora.com | Qualvora@1 |
| USR-004 | James Okonkwo | JO | Quality Supervisor | `QS` | Supervisor | Plant-2 · Chicago | james.okonkwo@qualvora.com | Qualvora@1 |
| USR-017 | Raj Sharma | RS | Manufacturing Engineer | `ME` | Supervisor | Plant-2 · Chicago | raj.sharma@qualvora.com | Qualvora@1 |
| USR-018 | Fatima Ali | FA | Quality Technician | `QT` | Operator | Plant-2 · Chicago | fatima.ali@qualvora.com | Qualvora@1 |
| USR-010 | Lisa Park | LP | Production Operator | `Operator` | Operator | Plant-2 · Chicago | lisa.park@qualvora.com | Qualvora@1 |
| USR-019 | David Osei | DO | Plant Director | `Director` | Director | Plant-3 · Cleveland | david.osei@qualvora.com | Qualvora@1 |
| USR-006 | Tom Braswell | TB | Quality Manager | `QM` | Manager | Plant-3 · Cleveland | tom.braswell@qualvora.com | Qualvora@1 |
| USR-020 | Claire Novak | CN | Production Manager | `PM` | Manager | Plant-3 · Cleveland | claire.novak@qualvora.com | Qualvora@1 |
| USR-021 | Wei Tanaka | WT | Quality Engineer | `QE` | Supervisor | Plant-3 · Cleveland | wei.tanaka@qualvora.com | Qualvora@1 |
| USR-022 | Hana Brooks | HB | Quality Supervisor | `QS` | Supervisor | Plant-3 · Cleveland | hana.brooks@qualvora.com | Qualvora@1 |
| USR-008 | Aisha Williams | AW | Manufacturing Engineer | `ME` | Supervisor | Plant-3 · Cleveland | aisha.williams@qualvora.com | Qualvora@1 |
| USR-023 | Dante Reyes | DR | Quality Technician | `QT` | Operator | Plant-3 · Cleveland | dante.reyes@qualvora.com | Qualvora@1 |
| USR-024 | Yuki Stone | YS | Production Operator | `Operator` | Operator | Plant-3 · Cleveland | yuki.stone@qualvora.com | Qualvora@1 |

---

## Dashboard Routing

| Role Code | User(s) | Lands On | Component |
|---|---|---|---|
| `QM` | Maria, Tom | `/dashboard` | QmDashboardComponent |
| `PM` | Carlos | `/dashboard` | QmDashboardComponent *(shares QM view)* |
| `Director` | Sarah | `/dashboard/director` | DirectorDashboardComponent |
| `QE` | Dev, Priya | `/dashboard/qe` | QeDashboardComponent |
| `QS` | James | `/dashboard/supervisor` | SupervisorDashboardComponent |
| `ME` | Aisha | `/dashboard/qe` | QeDashboardComponent *(shares QE view)* |
| `QT` | Ravi | `/dashboard/supervisor` | SupervisorDashboardComponent *(placeholder)* |
| `Operator` | Lisa | `/dashboard/supervisor` | SupervisorDashboardComponent *(placeholder)* |

> **TODO:** Create a dedicated `/dashboard/operator` (OperatorDashboardComponent) for `QT` and `Operator` roles.

---

## Sites

| ID | Name | Location |
|---|---|---|
| SITE-001 | Plant-1 | Detroit, MI |
| SITE-002 | Plant-2 | Chicago, IL |
| SITE-003 | Plant-3 | Cleveland, OH |

---

## AuthUser Roles Array Convention

Each `AuthUser.roles` contains two entries:
1. **Job title code** (`QM`, `QE`, `Director`, `PM`, `QS`, `ME`, `QT`, `Operator`) — used for dashboard routing
2. **LPA layer** (`lpa:manager`, `lpa:supervisor`, `lpa:operator`) — used for LPA access control

```typescript
// Example
roles: ['QE', 'lpa:supervisor']
```

The dashboard redirect guard iterates `roles[]` in order and matches on the job title code first.

---

*Last updated: 2026-06-25*
