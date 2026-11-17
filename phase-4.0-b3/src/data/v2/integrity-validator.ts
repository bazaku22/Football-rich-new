import { STORE_DEFINITIONS, type DatabaseRecord, type StoreName } from './schema.js';

export type IntegritySeverity = 'ERROR' | 'WARNING';
export interface IntegrityIssue {
  code: string;
  severity: IntegritySeverity;
  storeName: StoreName;
  recordId?: string;
  field?: string;
  message: string;
}

const ISO_DATE_FIELDS = new Set(['kickoffAt','createdAt','changedAt','capturedAt','startedAt','updatedAt','archivedAt']);
const REFERENCE_FIELDS: Partial<Record<StoreName, Record<string, StoreName>>> = {
  matches: { competitionId: 'competitions', homeTeamId: 'teams', awayTeamId: 'teams' },
  match_revisions: { localMatchId: 'matches' },
  team_identity_mappings: { teamId: 'teams' },
  evidence_records: { localMatchId: 'matches', sourceId: 'sources' },
  evidence_conflicts: { localMatchId: 'matches' },
  research_records: { localMatchId: 'matches' },
  team_news_records: { localMatchId: 'matches', teamId: 'teams' },
  market_odds_snapshots: { localMatchId: 'matches' },
  analysis_records: { localMatchId: 'matches', modelVersionId: 'model_versions' },
  prediction_records: { analysisId: 'analysis_records', localMatchId: 'matches' },
  adjustment_ledger: { localMatchId: 'matches', analysisId: 'analysis_records' },
  team_strength_snapshots: { teamId: 'teams', competitionId: 'competitions' },
  poisson_calculations: { analysisId: 'analysis_records', localMatchId: 'matches' },
  handicap_calculations: { analysisId: 'analysis_records', localMatchId: 'matches' },
  model_reliability_snapshots: { modelVersionId: 'model_versions', competitionId: 'competitions' },
  result_references: { localMatchId: 'matches' },
  evaluation_runs: { modelVersionId: 'model_versions' },
  evaluation_records: { evaluationRunId: 'evaluation_runs', localMatchId: 'matches' },
  data_quality_reports: { localMatchId: 'matches' },
  coverage_snapshots: { localMatchId: 'matches', competitionId: 'competitions' },
  match_confidence_records: { localMatchId: 'matches', analysisId: 'analysis_records' },
  recovery_checkpoints: { jobId: 'analysis_jobs' },
  operation_logs: { localMatchId: 'matches' }
};

function issue(storeName: StoreName, code: string, message: string, field?: string, recordId?: string): IntegrityIssue {
  return { code, severity: 'ERROR', storeName, message, ...(field ? { field } : {}), ...(recordId ? { recordId } : {}) };
}

function isIsoDate(value: unknown): boolean {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(value)) return false;
  return Number.isFinite(Date.parse(value));
}

/** Pure validation: no database writes and no mutation of the supplied record. */
export function validateRecord(storeName: StoreName, record: DatabaseRecord): IntegrityIssue[] {
  const issues: IntegrityIssue[] = [];
  const definition = STORE_DEFINITIONS[storeName];
  const keyPath = definition.keyPath;
  const id = typeof keyPath === 'string' && typeof record[keyPath] === 'string' ? String(record[keyPath]) : undefined;

  if (typeof keyPath !== 'string' || typeof record[keyPath] !== 'string' || !String(record[keyPath]).trim()) {
    issues.push(issue(storeName, 'REQUIRED_PRIMARY_KEY', `${storeName} requires a non-empty string primary key.`, String(keyPath), id));
    return issues;
  }

  for (const field of ISO_DATE_FIELDS) {
    if (field in record && !isIsoDate(record[field])) {
      issues.push(issue(storeName, 'INVALID_TIMESTAMP', `${field} must be a valid ISO 8601 timestamp with a time component.`, field, id));
    }
  }

  if (storeName === 'matches') {
    if (record.homeTeamId && record.awayTeamId && record.homeTeamId === record.awayTeamId) {
      issues.push(issue(storeName, 'SAME_HOME_AWAY_TEAM', 'A match cannot use the same team as both home and away.', 'awayTeamId', id));
    }
    if (record.revision !== undefined && (!Number.isInteger(record.revision) || Number(record.revision) < 1)) {
      issues.push(issue(storeName, 'INVALID_REVISION', 'Match revision must be a positive integer.', 'revision', id));
    }
  }

  if (storeName === 'match_revisions') {
    if (!Number.isInteger(record.revision) || Number(record.revision) < 1) {
      issues.push(issue(storeName, 'INVALID_REVISION', 'Revision must be a positive integer.', 'revision', id));
    }
    if (!record.beforeSnapshot || typeof record.beforeSnapshot !== 'object' ||
        !record.afterSnapshot || typeof record.afterSnapshot !== 'object') {
      issues.push(issue(storeName, 'INVALID_REVISION_SNAPSHOT', 'A revision requires beforeSnapshot and afterSnapshot objects.', undefined, id));
    }
  }

  if (storeName === 'analysis_records') {
    if (!record.inputSnapshot || typeof record.inputSnapshot !== 'object') {
      issues.push(issue(storeName, 'MISSING_INPUT_SNAPSHOT', 'An analysis record requires its immutable inputSnapshot.', 'inputSnapshot', id));
    }
  }

  return issues;
}

export interface ReferenceIndex {
  [storeName: string]: ReadonlySet<string>;
}

/** Check foreign-key-like references against caller-supplied ID sets. */
export function validateReferences(storeName: StoreName, record: DatabaseRecord, references: ReferenceIndex): IntegrityIssue[] {
  const issues: IntegrityIssue[] = [];
  const mapping = REFERENCE_FIELDS[storeName] ?? {};
  const keyPath = STORE_DEFINITIONS[storeName].keyPath;
  const recordId = typeof keyPath === 'string' && typeof record[keyPath] === 'string' ? String(record[keyPath]) : undefined;

  for (const [field, targetStore] of Object.entries(mapping)) {
    const value = record[field];
    if (value === undefined || value === null || value === '') continue;
    if (typeof value !== 'string' || !references[targetStore]?.has(value)) {
      issues.push(issue(storeName, 'BROKEN_REFERENCE', `${field} references a missing or invalid ${targetStore} record.`, field, recordId));
    }
  }
  return issues;
}

export function validateRecordIntegrity(
  storeName: StoreName,
  record: DatabaseRecord,
  references: ReferenceIndex = {}
): IntegrityIssue[] {
  return [...validateRecord(storeName, record), ...validateReferences(storeName, record, references)];
}
