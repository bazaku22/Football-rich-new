import { createRepository } from './repositories.js';
import type { DatabaseRecord } from './schema.js';

export interface RecoveryCheckpoint extends DatabaseRecord {
  checkpointId: string;
  jobId: string;
  createdAt: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  backupChecksum?: string;
  completedStores: string[];
  totalStores: number;
  note?: string;
}

const checkpoints = createRepository('recovery_checkpoints');

function requireId(value: string, label: string): void {
  if (typeof value !== 'string' || !value.trim()) throw new Error(label + '_REQUIRED');
}

/** Persist resumable recovery progress without modifying business records. */
export async function saveRecoveryCheckpoint(checkpoint: RecoveryCheckpoint): Promise<void> {
  requireId(checkpoint.checkpointId, 'CHECKPOINT_ID');
  requireId(checkpoint.jobId, 'JOB_ID');
  if (!Number.isFinite(Date.parse(checkpoint.createdAt))) throw new Error('INVALID_CHECKPOINT_TIMESTAMP');
  if (!Array.isArray(checkpoint.completedStores) || checkpoint.completedStores.some(name => typeof name !== 'string')) {
    throw new Error('INVALID_COMPLETED_STORES');
  }
  if (!Number.isInteger(checkpoint.totalStores) || checkpoint.totalStores < 0 ||
      checkpoint.completedStores.length > checkpoint.totalStores) throw new Error('INVALID_CHECKPOINT_PROGRESS');
  const existing = await checkpoints.get(checkpoint.checkpointId);
  if (existing) await checkpoints.put(checkpoint);
  else await checkpoints.add(checkpoint);
}

export async function getLatestRecoveryCheckpoint(jobId: string): Promise<RecoveryCheckpoint | undefined> {
  requireId(jobId, 'JOB_ID');
  const rows = await checkpoints.getByIndex('jobId', jobId);
  return rows.sort((a, b) => Date.parse(String(b.createdAt)) - Date.parse(String(a.createdAt)))[0] as RecoveryCheckpoint | undefined;
}

export async function listRecoveryCheckpoints(jobId?: string): Promise<RecoveryCheckpoint[]> {
  const rows = jobId ? await checkpoints.getByIndex('jobId', jobId) : await checkpoints.getAll();
  return rows as RecoveryCheckpoint[];
}
