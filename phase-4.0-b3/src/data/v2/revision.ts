import { runTransaction, DatabaseOperationError } from './transaction.js';
import { validateRecordIntegrity } from './integrity-validator.js';
import type { DatabaseRecord } from './schema.js';

export interface CreateMatchRevisionInput {
  localMatchId: string;
  matchRevisionId: string;
  expectedRevision: number;
  changeType: string;
  changedAt: string;
  afterSnapshot: DatabaseRecord;
}

export interface MatchRevisionResult {
  match: DatabaseRecord;
  revision: DatabaseRecord;
}

export class RevisionConflictError extends Error {
  readonly code = 'DB_REVISION_CONFLICT';
  constructor(message: string) {
    super(message);
    this.name = 'RevisionConflictError';
  }
}

/**
 * Atomically update a match and append its immutable revision record.
 * expectedRevision is compared inside the same readwrite transaction.
 */
export async function createMatchRevision(input: CreateMatchRevisionInput): Promise<MatchRevisionResult> {
  if (!input.localMatchId.trim() || !input.matchRevisionId.trim() ||
      !Number.isInteger(input.expectedRevision) || input.expectedRevision < 0 ||
      !input.changeType.trim() || !Number.isFinite(Date.parse(input.changedAt))) {
    throw new DatabaseOperationError('DB_VALIDATION_FAILED', 'Revision input is incomplete or invalid.');
  }
  if (!input.afterSnapshot || typeof input.afterSnapshot !== 'object' ||
      input.afterSnapshot.localMatchId !== input.localMatchId) {
    throw new DatabaseOperationError('DB_VALIDATION_FAILED', 'afterSnapshot must describe the same localMatchId.');
  }

  let conflict: RevisionConflictError | undefined;
  let result: MatchRevisionResult | undefined;

  try {
    await runTransaction(['matches', 'match_revisions'], 'readwrite', (tx) => {
      const matches = tx.objectStore('matches');
      const revisions = tx.objectStore('match_revisions');
      const request = matches.get(input.localMatchId);

      request.onsuccess = () => {
        const current = request.result as DatabaseRecord | undefined;
        if (!current) {
          conflict = new RevisionConflictError('Cannot revise a match that does not exist.');
          tx.abort();
          return;
        }
        const currentRevision = Number.isInteger(current.revision) ? Number(current.revision) : 0;
        if (currentRevision !== input.expectedRevision) {
          conflict = new RevisionConflictError(
            `Revision conflict: expected ${input.expectedRevision}, current revision is ${currentRevision}.`
          );
          tx.abort();
          return;
        }

        const nextRevision = currentRevision + 1;
        const nextMatch: DatabaseRecord = { ...input.afterSnapshot, localMatchId: input.localMatchId, revision: nextRevision };
        const revisionRecord: DatabaseRecord = {
          matchRevisionId: input.matchRevisionId,
          localMatchId: input.localMatchId,
          revision: nextRevision,
          changeType: input.changeType,
          changedAt: input.changedAt,
          beforeSnapshot: structuredClone(current),
          afterSnapshot: structuredClone(nextMatch)
        };
        const matchIssues = validateRecordIntegrity('matches', nextMatch);
        const revisionIssues = validateRecordIntegrity('match_revisions', revisionRecord);
        if (matchIssues.length || revisionIssues.length) {
          conflict = new RevisionConflictError(
            [...matchIssues, ...revisionIssues].map(item => item.message).join(' ')
          );
          tx.abort();
          return;
        }

        matches.put(nextMatch);
        revisions.add(revisionRecord);
        result = { match: nextMatch, revision: revisionRecord };
      };
    });
  } catch (error) {
    if (conflict) throw conflict;
    throw error;
  }

  if (!result) throw new DatabaseOperationError('DB_TRANSACTION_ABORTED', 'Revision transaction completed without a result.');
  return result;
}
