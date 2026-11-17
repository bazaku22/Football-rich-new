/** Isolated Football rich V2 IndexedDB schema; does not alter or import V1. */
export const DB_NAME = 'football-rich-local-v2';
export const DB_VERSION = 1;
type IndexSpec = readonly [name: string, keyPath: string | readonly string[], unique: boolean];
type StoreSpec = { readonly keyPath: string; readonly indexes: readonly IndexSpec[] };
const ix = (...items: IndexSpec[]) => items;
export const STORE_DEFINITIONS = {
  matches: { keyPath: 'localMatchId', indexes: ix(['sharedMatchId','sharedMatchId',false],['competitionId','competitionId',false],['season','season',false],['homeTeamId','homeTeamId',false],['awayTeamId','awayTeamId',false],['kickoffAt','kickoffAt',false],['matchStatus','matchStatus',false],['competitionSeasonKickoff',['competitionId','season','kickoffAt'],false]) },
  match_revisions: { keyPath: 'matchRevisionId', indexes: ix(['localMatchId','localMatchId',false],['revision','revision',false],['changedAt','changedAt',false],['changeType','changeType',false],['localMatchRevision',['localMatchId','revision'],true]) },
  teams: { keyPath: 'teamId', indexes: ix(['competitionId','competitionId',false],['nameNormalized','nameNormalized',false]) },
  team_identity_mappings: { keyPath: 'mappingId', indexes: ix(['teamId','teamId',false],['providerName','providerName',false],['providerEntity',['providerName','providerEntityId'],true]) },
  competitions: { keyPath: 'competitionId', indexes: ix(['nameNormalized','nameNormalized',false],['countryCode','countryCode',false]) },
  sources: { keyPath: 'sourceId', indexes: ix(['sourceType','sourceType',false],['trustLevel','trustLevel',false]) },
  evidence_records: { keyPath: 'evidenceId', indexes: ix(['localMatchId','localMatchId',false],['sourceId','sourceId',false],['domain','domain',false],['verificationStatus','verificationStatus',false],['capturedAt','capturedAt',false]) },
  evidence_conflicts: { keyPath: 'conflictId', indexes: ix(['localMatchId','localMatchId',false],['status','status',false]) },
  research_records: { keyPath: 'researchId', indexes: ix(['localMatchId','localMatchId',false],['createdAt','createdAt',false]) },
  team_news_records: { keyPath: 'teamNewsId', indexes: ix(['localMatchId','localMatchId',false],['teamId','teamId',false],['status','status',false]) },
  market_odds_snapshots: { keyPath: 'oddsSnapshotId', indexes: ix(['localMatchId','localMatchId',false],['capturedAt','capturedAt',false]) },
  analysis_records: { keyPath: 'analysisId', indexes: ix(['localMatchId','localMatchId',false],['createdAt','createdAt',false],['analysisStage','analysisStage',false],['modelVersionId','modelVersionId',false],['matchCreatedAt',['localMatchId','createdAt'],false]) },
  prediction_records: { keyPath: 'predictionId', indexes: ix(['analysisId','analysisId',false],['localMatchId','localMatchId',false],['predictionType','predictionType',false]) },
  adjustment_ledger: { keyPath: 'adjustmentId', indexes: ix(['localMatchId','localMatchId',false],['analysisId','analysisId',false],['status','status',false]) },
  team_strength_snapshots: { keyPath: 'teamStrengthSnapshotId', indexes: ix(['teamId','teamId',false],['competitionId','competitionId',false],['capturedAt','capturedAt',false]) },
  poisson_calculations: { keyPath: 'poissonCalculationId', indexes: ix(['analysisId','analysisId',false],['localMatchId','localMatchId',false]) },
  handicap_calculations: { keyPath: 'handicapCalculationId', indexes: ix(['analysisId','analysisId',false],['localMatchId','localMatchId',false],['handicapLine','handicapLine',false]) },
  model_versions: { keyPath: 'modelVersionId', indexes: ix(['modelVersionCode','modelVersionCode',true],['status','status',false]) },
  model_reliability_snapshots: { keyPath: 'reliabilitySnapshotId', indexes: ix(['modelVersionId','modelVersionId',false],['competitionId','competitionId',false],['capturedAt','capturedAt',false]) },
  result_references: { keyPath: 'resultReferenceId', indexes: ix(['localMatchId','localMatchId',false],['sourceSystem','sourceSystem',false],['sourceResultId','sourceResultId',false],['revision','revision',false]) },
  import_batches: { keyPath: 'importBatchId', indexes: ix(['importType','importType',false],['status','status',false],['createdAt','createdAt',false]) },
  evaluation_runs: { keyPath: 'evaluationRunId', indexes: ix(['modelVersionId','modelVersionId',false],['startedAt','startedAt',false],['status','status',false]) },
  evaluation_records: { keyPath: 'evaluationRecordId', indexes: ix(['evaluationRunId','evaluationRunId',false],['localMatchId','localMatchId',false],['metricType','metricType',false]) },
  data_quality_reports: { keyPath: 'dataQualityReportId', indexes: ix(['localMatchId','localMatchId',false],['createdAt','createdAt',false],['severity','severity',false]) },
  coverage_snapshots: { keyPath: 'coverageSnapshotId', indexes: ix(['localMatchId','localMatchId',false],['competitionId','competitionId',false],['capturedAt','capturedAt',false]) },
  match_confidence_records: { keyPath: 'matchConfidenceId', indexes: ix(['localMatchId','localMatchId',false],['analysisId','analysisId',false],['capturedAt','capturedAt',false]) },
  system_settings: { keyPath: 'settingId', indexes: ix(['key','key',true]) },
  migration_runs: { keyPath: 'migrationRunId', indexes: ix(['status','status',false],['startedAt','startedAt',false]) },
  legacy_archive: { keyPath: 'legacyArchiveId', indexes: ix(['legacyStore','legacyStore',false],['legacyRecordId','legacyRecordId',false],['archivedAt','archivedAt',false]) },
  analysis_jobs: { keyPath: 'analysisJobId', indexes: ix(['status','status',false],['localMatchId','localMatchId',false],['updatedAt','updatedAt',false]) },
  recovery_checkpoints: { keyPath: 'checkpointId', indexes: ix(['jobId','jobId',false],['createdAt','createdAt',false]) },
  operation_logs: { keyPath: 'operationLogId', indexes: ix(['operationType','operationType',false],['createdAt','createdAt',false],['localMatchId','localMatchId',false]) }
} as const satisfies Record<string, StoreSpec>;
export type StoreName = keyof typeof STORE_DEFINITIONS;
export const STORE_NAMES = Object.freeze(Object.keys(STORE_DEFINITIONS) as StoreName[]);
export type EvidenceStatus = 'VERIFIED'|'CONFIRMED'|'PREDICTED'|'PENDING'|'CONFLICT'|'UNAVAILABLE';
export type ImportStatus = 'PENDING'|'VALIDATING'|'PREVIEW_READY'|'COMMITTING'|'COMPLETED'|'FAILED'|'CANCELLED'|'PARTIAL';
export type AnalysisStage = 'PRELIMINARY'|'FINAL';
export type JobStatus = 'PENDING'|'RUNNING'|'FAILED'|'RECOVERABLE'|'COMPLETED'|'CANCELLED';
export type ModelStatus = 'DRAFT'|'VALIDATING'|'ACTIVE'|'RETIRED';
export interface DatabaseRecord { [key: string]: unknown }
