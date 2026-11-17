import type { StoreName } from './schema.js';

export type IntakeImportType = 'FIXTURE_UPDATE'|'ANALYSIS_UPDATE'|'MATCH_RESULT_UPDATE'|'EVIDENCE_UPDATE';
export type IntakeSeverity = 'CRITICAL'|'WARNING'|'INFO';
export type IntakeDecision = 'ADD'|'DUPLICATE'|'VERSION_REQUIRED'|'BLOCKED';
export interface IntakeRecord { store: StoreName; key: string; value: Record<string, unknown>; }
export interface IntakeEnvelope {
  format: 'football-rich-data'; schemaVersion: string; exportedAt: string;
  sourceSystem: string; targetSystem: 'FOOTBALL_RICH'; importType: IntakeImportType;
  batchId: string; payloadHash?: string; recordCount: number; records: IntakeRecord[];
}
export interface IntakeIssue { code: string; severity: IntakeSeverity; recordKey?: string; message: string; }
export interface IntakePreviewRow { store: StoreName; key: string; decision: IntakeDecision; reason: string; }
export interface IntakePreview {
  valid: boolean; canCommit: boolean; rows: IntakePreviewRow[]; issues: IntakeIssue[];
  counts: { total: number; add: number; duplicate: number; versionRequired: number; blocked: number };
}
const allowedStores = new Set<StoreName>(['matches','teams','competitions','sources','evidence_records','research_records','team_news_records','market_odds_snapshots','result_references']);
const keyFields: Partial<Record<StoreName,string>> = {
  matches:'localMatchId', teams:'teamId', competitions:'competitionId', sources:'sourceId',
  evidence_records:'evidenceId', research_records:'researchId', team_news_records:'teamNewsId',
  market_odds_snapshots:'oddsSnapshotId', result_references:'resultReferenceId'
};
const requiredByStore: Partial<Record<StoreName,string[]>> = {
  matches:['localMatchId','homeTeamId','awayTeamId','kickoffAt','competitionId'],
  teams:['teamId','nameNormalized'], competitions:['competitionId','nameNormalized'],
  sources:['sourceId','sourceType','trustLevel'],
  evidence_records:['evidenceId','sourceId','domain','verificationStatus','capturedAt'],
  result_references:['resultReferenceId','localMatchId','sourceSystem','revision']
};
const iso = (v: unknown) => typeof v === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(v) && Number.isFinite(Date.parse(v));
const stable = (v: unknown): string => {
  if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']';
  if (v && typeof v === 'object') return '{' + Object.keys(v as object).sort().map(k => JSON.stringify(k)+':'+stable((v as Record<string,unknown>)[k])).join(',') + '}';
  return JSON.stringify(v);
};
export function validateIntakeEnvelope(input: unknown): { envelope?: IntakeEnvelope; issues: IntakeIssue[] } {
  const issues: IntakeIssue[] = [];
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { issues:[{code:'INVALID_ENVELOPE',severity:'CRITICAL',message:'Import must be a JSON object.'}] };
  const e = input as Partial<IntakeEnvelope>;
  if (e.format !== 'football-rich-data') issues.push({code:'INVALID_FORMAT',severity:'CRITICAL',message:'Unsupported data format.'});
  if (typeof e.schemaVersion !== 'string' || !/^2\.\d+\.\d+$/.test(e.schemaVersion)) issues.push({code:'INVALID_SCHEMA_VERSION',severity:'CRITICAL',message:'Schema version must use 2.x.x.'});
  if (!iso(e.exportedAt)) issues.push({code:'INVALID_EXPORTED_AT',severity:'CRITICAL',message:'exportedAt must be timezone-aware ISO 8601.'});
  if (!e.sourceSystem?.trim()) issues.push({code:'MISSING_SOURCE_SYSTEM',severity:'CRITICAL',message:'sourceSystem is required.'});
  if (e.targetSystem !== 'FOOTBALL_RICH') issues.push({code:'INVALID_TARGET',severity:'CRITICAL',message:'targetSystem must be FOOTBALL_RICH.'});
  if (!['FIXTURE_UPDATE','ANALYSIS_UPDATE','MATCH_RESULT_UPDATE','EVIDENCE_UPDATE'].includes(String(e.importType))) issues.push({code:'INVALID_IMPORT_TYPE',severity:'CRITICAL',message:'Unknown import type.'});
  if (e.importType === 'MATCH_RESULT_UPDATE' && e.sourceSystem !== 'FOOTBALL_TIME') {
    issues.push({code:'MATCH_RESULT_SOURCE_NOT_FOOTBALL_TIME',severity:'CRITICAL',message:'Official match results must be referenced from Football Time.'});
  }
  if (e.importType === 'MATCH_RESULT_UPDATE' && Array.isArray(e.records)) {
    for (const record of e.records) {
      if (!record || record.store !== 'result_references') {
        issues.push({code:'MATCH_RESULT_STORE_NOT_ALLOWED',severity:'CRITICAL',recordKey:record?.key,message:'Match result updates may import references only; Football rich cannot author official results.'});
        continue;
      }
      if (record.value?.sourceSystem !== 'FOOTBALL_TIME') {
        issues.push({code:'MATCH_RESULT_RECORD_PROVENANCE_MISMATCH',severity:'CRITICAL',recordKey:record.key,message:'Each result reference must identify Football Time as its source.'});
      }
    }
  }
  if (!e.batchId?.trim()) issues.push({code:'MISSING_BATCH_ID',severity:'CRITICAL',message:'batchId is required.'});
  if (!Array.isArray(e.records)) issues.push({code:'INVALID_RECORDS',severity:'CRITICAL',message:'records must be an array.'});
  else if (e.recordCount !== e.records.length) issues.push({code:'RECORD_COUNT_MISMATCH',severity:'CRITICAL',message:'recordCount does not match records length.'});
  if (issues.some(x=>x.severity==='CRITICAL')) return { issues };
  return { envelope:e as IntakeEnvelope, issues };
}
export function assessIntakeCoverage(matchId: string, records: IntakeRecord[], capturedAt = new Date().toISOString()) {
  const matchRecords = records.filter(r => r.value.localMatchId === matchId || r.key === matchId);
  const matchRecord = matchRecords.find(r => r.store === 'matches');
  const linkedTeamIds = matchRecord ? [matchRecord.value.homeTeamId, matchRecord.value.awayTeamId] : [];
  const linkedTeamRecords = records.filter(r => r.store === 'teams' && linkedTeamIds.includes(r.key));
  const domains = ['FIXTURE','TEAM_IDENTITY','FORM','HOME_AWAY_SPLITS','AVAILABILITY','OFFICIAL_LINEUP','MARKET_SNAPSHOT','RESULT'];
  const present: Record<string,boolean> = {
    FIXTURE: matchRecords.some(r=>r.store==='matches'),
    TEAM_IDENTITY: linkedTeamRecords.length === 2,
    FORM: matchRecords.some(r=>r.store==='research_records' && r.value.domain==='FORM'),
    HOME_AWAY_SPLITS: matchRecords.some(r=>r.store==='research_records' && r.value.domain==='HOME_AWAY_SPLITS'),
    AVAILABILITY: matchRecords.some(r=>r.store==='team_news_records'),
    OFFICIAL_LINEUP: matchRecords.some(r=>r.store==='evidence_records' && r.value.domain==='LINEUP' && r.value.verificationStatus==='VERIFIED'),
    MARKET_SNAPSHOT: matchRecords.some(r=>r.store==='market_odds_snapshots'),
    RESULT: matchRecords.some(r=>r.store==='result_references')
  };
  const available = domains.filter(d=>present[d]).length;
  return { localMatchId:matchId, capturedAt, availableDomains:available, expectedDomains:domains.length,
    coverageRatio:available/domains.length, domains:domains.map(domain=>({domain,status:present[domain]?'AVAILABLE':'MISSING'})),
    analysisReady:present.FIXTURE && present.TEAM_IDENTITY && present.FORM && present.HOME_AWAY_SPLITS };
}
export function createIntakePreview(envelope: IntakeEnvelope, existing: Partial<Record<StoreName,Record<string,Record<string,unknown>>>> = {}): IntakePreview {
  const issues: IntakeIssue[] = [];
  const rows: IntakePreviewRow[] = [];
  for (const record of envelope.records) {
    const keyField = keyFields[record.store];
    if (!allowedStores.has(record.store) || !keyField) {
      issues.push({code:'STORE_NOT_IMPORTABLE',severity:'CRITICAL',recordKey:record.key,message:'This store cannot be written through the intake pipeline.'});
      rows.push({store:record.store,key:record.key,decision:'BLOCKED',reason:'Store is not importable.'}); continue;
    }
    const missing = (requiredByStore[record.store]||[]).filter(k=>record.value[k]===undefined || record.value[k]===null || record.value[k]==='');
    if (record.value[keyField] !== record.key || missing.length) {
      issues.push({code:'RECORD_IDENTITY_OR_FIELDS_INVALID',severity:'CRITICAL',recordKey:record.key,message:'Primary key mismatch or required fields missing: '+missing.join(', ')});
      rows.push({store:record.store,key:record.key,decision:'BLOCKED',reason:'Primary key or required fields invalid.'}); continue;
    }
    if (record.store==='matches' && record.value.homeTeamId===record.value.awayTeamId) {
      issues.push({code:'MATCH_TEAM_COLLISION',severity:'CRITICAL',recordKey:record.key,message:'Home and away teams must differ.'});
      rows.push({store:record.store,key:record.key,decision:'BLOCKED',reason:'Home and away team are identical.'}); continue;
    }
    const prior = existing[record.store]?.[record.key];
    if (!prior) rows.push({store:record.store,key:record.key,decision:'ADD',reason:'No existing record with this key.'});
    else if (stable(prior)===stable(record.value)) rows.push({store:record.store,key:record.key,decision:'DUPLICATE',reason:'Existing record has identical content; safe to skip.'});
    else rows.push({store:record.store,key:record.key,decision:'VERSION_REQUIRED',reason:'Same key has different content; preserve both versions and request user choice.'});
  }
  const counts = {total:rows.length,add:rows.filter(x=>x.decision==='ADD').length,duplicate:rows.filter(x=>x.decision==='DUPLICATE').length,versionRequired:rows.filter(x=>x.decision==='VERSION_REQUIRED').length,blocked:rows.filter(x=>x.decision==='BLOCKED').length};
  return {valid:!issues.some(x=>x.severity==='CRITICAL'),canCommit:!issues.some(x=>x.severity==='CRITICAL') && counts.blocked===0,rows,issues,counts};
}
