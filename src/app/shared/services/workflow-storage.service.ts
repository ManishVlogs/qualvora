import { Injectable, inject } from '@angular/core';
import { MockDataService } from './mock-data.service';
import { DocType, ApprovalChainStep } from '../interfaces/models';

// Default fallback chain used when a doc type has no configured chain.
const DEFAULT_CHAIN: ApprovalChainStep[] = [
  { step: 1, role: 'Author', requiresESign: false },
  { step: 2, role: 'Quality Manager', requiresESign: true },
];

// Fallback tier mapping for doc types not found in storage.
const TIER_FALLBACK: Record<string, number> = {
  'Control Plan': 2,
  'Quality Procedure': 2,
  'PFMEA': 2,
  'Work Instruction': 3,
  'MSA Study': 3,
  'Form': 4,
};

@Injectable({ providedIn: 'root' })
export class WorkflowStorageService {
  private mock = inject(MockDataService);

  getDocType(typeName: string): DocType | undefined {
    return this.mock.docTypes().find(t => t.name === typeName);
  }

  getTier(typeName: string): number {
    return this.getDocType(typeName)?.tier ?? TIER_FALLBACK[typeName] ?? 3;
  }

  getApprovalChain(typeName: string): ApprovalChainStep[] {
    return this.getDocType(typeName)?.approvalChain ?? DEFAULT_CHAIN;
  }

  getAllDocTypes(): DocType[] {
    return this.mock.docTypes();
  }
}
