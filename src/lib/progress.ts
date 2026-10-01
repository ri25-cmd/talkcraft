import Storage from 'expo-sqlite/kv-store';
import type { TurnRecord } from './conversation';

/**
 * Local progress. Nothing leaves the device and there is no account — this is
 * a single key in the on-device key-value store that ships with expo-sqlite.
 */

const KEY = 'talkcraft.progress.v1';
const MAX_RUNS = 20;

export interface StoredRun {
  scenarioId: string;
  scenarioTitle: string;
  endingId: string;
  endingTitle: string;
  /** The one-line summary shown as "latest feedback" on the home screen. */
  headline: string;
  finishedAt: number;
  turns: TurnRecord[];
  /** True when this run was a replay of a specific moment rather than a full run. */
  wasRetry: boolean;
}

export interface Progress {
  version: 1;
  /** Most recent first. */
  runs: StoredRun[];
}

export const EMPTY_PROGRESS: Progress = { version: 1, runs: [] };

function isProgress(value: unknown): value is Progress {
  if (typeof value !== 'object' || value === null) return false;
  const p = value as Partial<Progress>;
  return p.version === 1 && Array.isArray(p.runs);
}

/**
 * Read progress from disk.
 *
 * Throws if the store itself is unavailable so the caller can show an error
 * state; unreadable *contents* are treated as "no progress yet", because a
 * corrupt blob should not lock the user out of the app.
 */
export async function loadProgress(): Promise<Progress> {
  const raw = await Storage.getItem(KEY);
  if (!raw) return EMPTY_PROGRESS;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isProgress(parsed) ? parsed : EMPTY_PROGRESS;
  } catch {
    return EMPTY_PROGRESS;
  }
}

export async function saveRun(run: StoredRun): Promise<Progress> {
  let current: Progress;
  try {
    current = await loadProgress();
  } catch {
    current = EMPTY_PROGRESS;
  }
  const next: Progress = {
    version: 1,
    runs: [run, ...current.runs].slice(0, MAX_RUNS),
  };
  await Storage.setItem(KEY, JSON.stringify(next));
  return next;
}

export async function clearProgress(): Promise<void> {
  await Storage.removeItem(KEY);
}

/** Full runs only — retries of a single moment are not separate practices. */
export function completedCount(progress: Progress): number {
  return progress.runs.filter((r) => !r.wasRetry).length;
}

export function latestRun(progress: Progress): StoredRun | undefined {
  return progress.runs[0];
}
