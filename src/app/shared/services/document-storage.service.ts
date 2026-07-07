import { Injectable, inject, computed } from '@angular/core';
import { MockDataService } from './mock-data.service';
import { QDocument, QUser, Site } from '../interfaces/models';

// Repository wrapper for documents.
// All document reads go through here; swap the body of each method for HTTP
// calls when the backend is ready — no component changes required.
@Injectable({ providedIn: 'root' })
export class DocumentStorageService {
  private mock = inject(MockDataService);

  readonly allDocuments = this.mock.documents;

  getById(id: string) {
    return computed(() => this.mock.documents().find(d => d.id === id));
  }

  getRelatedDocuments(docId: string, limit = 5): Array<{ id: string; title: string; rev: string; rel: string }> {
    const doc = this.mock.documents().find(d => d.id === docId);
    if (!doc) return [];

    const myClauses = new Set(doc.clauses ?? []);
    const complement: Record<string, string> = {
      'Work Instruction': 'Control Plan',
      'Control Plan': 'Work Instruction',
      'Quality Procedure': 'Form',
      'Form': 'Quality Procedure',
      'PFMEA': 'Control Plan',
    };

    return this.mock.documents()
      .filter(x =>
        x.id !== docId &&
        x.siteId === doc.siteId &&
        x.status !== 'Obsolete' &&
        ((x.clauses ?? []).some(c => myClauses.has(c)) || x.type === complement[doc.type])
      )
      .slice(0, limit)
      .map(x => ({
        id: x.id,
        title: x.title,
        rev: x.revision,
        rel: x.type === complement[doc.type] ? 'References' : 'Related',
      }));
  }

  getSite(siteId: string): Site | undefined {
    return this.mock.sites.find(s => s.id === siteId);
  }

  getSiteName(siteId: string): string {
    return this.getSite(siteId)?.name ?? siteId;
  }

  getUserByInitials(initials: string): QUser | undefined {
    return this.mock.users.find(u => u.initials === initials);
  }

  getUserBySiteAndRole(siteId: string, role: string): QUser | undefined {
    return this.mock.users.find(u => u.siteId === siteId && u.role === role);
  }

  // Stub for sending distribution nudges — replace body with HTTP POST
  sendNudge(docId: string, recipientIds: string[]): void {
    console.log('[DocumentStorageService] nudge sent', { docId, recipientIds });
  }
}
