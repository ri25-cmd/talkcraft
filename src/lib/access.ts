import type { Progress } from './progress';
import { completedCount } from './progress';

/**
 * What the free tier includes.
 *
 * Free practices are counted from the same local progress record the home
 * screen reads, so the count is honest and survives a restart. Replays of a
 * single moment are not counted — they are part of the practice you already
 * started, and charging for them would take away something that currently
 * works.
 */
export const FREE_PRACTICE_LIMIT = 3;

export interface Access {
  isPremium: boolean;
  /** Completed full practices, free tier only. */
  used: number;
  /** Remaining free practices, or null when unlimited. */
  remaining: number | null;
  /** Whether a new practice can be started right now. */
  canPractise: boolean;
  /** Whether the full saved history is visible (a premium feature). */
  canSeeFullHistory: boolean;
}

export function evaluateAccess(progress: Progress, isPremium: boolean): Access {
  const used = completedCount(progress);
  if (isPremium) {
    return {
      isPremium: true,
      used,
      remaining: null,
      canPractise: true,
      canSeeFullHistory: true,
    };
  }
  const remaining = Math.max(0, FREE_PRACTICE_LIMIT - used);
  return {
    isPremium: false,
    used,
    remaining,
    canPractise: remaining > 0,
    canSeeFullHistory: false,
  };
}

/** Short line for the home screen and the scenario list. */
export function describeAllowance(access: Access): string {
  if (access.isPremium) return 'TalkCraft Pro · unlimited practice';
  if (access.remaining === 0) {
    return `You have used all ${FREE_PRACTICE_LIMIT} free practices`;
  }
  return access.remaining === 1
    ? '1 free practice left'
    : `${access.remaining} of ${FREE_PRACTICE_LIMIT} free practices left`;
}
