import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { EndingTone } from '@/content/types';
import type { RunResult, TurnRecord } from '@/lib/conversation';
import {
  EMPTY_PROGRESS,
  clearProgress,
  loadProgress,
  saveRun,
  type Progress,
  type StoredRun,
} from '@/lib/progress';

/**
 * Two pieces of state live here:
 *
 *  - the conversation currently being practised, which is deliberately not
 *    persisted (a half-finished conversation is not progress), and
 *  - saved progress, read once at startup and written after each finished run.
 */

/** A summary of an ending, small enough to carry around in state. */
export interface EndingSummary {
  id: string;
  title: string;
  tone: EndingTone;
}

/** What changed when the user replayed a single moment. */
export interface RetryComparison {
  beat: string;
  before: { text: string; ending: EndingSummary };
  after: { text: string; ending: EndingSummary };
}

interface RetryContext {
  nodeId: string;
  beat: string;
  previousChoiceId: string;
  previousText: string;
  previousEnding: EndingSummary;
}

interface Session {
  scenarioId: string;
  /** The node awaiting a response, or undefined once an ending is reached. */
  currentNodeId?: string;
  turns: TurnRecord[];
  endingId?: string;
  /** Present when this session replays one moment from an earlier run. */
  retry?: RetryContext;
}

export interface AdvanceArgs {
  nodeId: string;
  choiceId: string;
  /** Needed for the retry comparison, which quotes what was said. */
  choiceText: string;
  /** The next node id, or undefined when the choice ends the conversation. */
  nextNodeId?: string;
  /** Present exactly when the choice ends the conversation. */
  ending?: EndingSummary;
}

type ProgressStatus = 'loading' | 'ready' | 'error';

interface PracticeContextValue {
  session?: Session;
  /** Starts a run, or leaves an in-progress run for this scenario untouched. */
  ensureSession: (scenarioId: string, startNodeId: string) => void;
  /** Always starts over from the beginning. */
  restart: (scenarioId: string, startNodeId: string) => void;
  /** Records one response and moves the conversation on. */
  advance: (args: AdvanceArgs) => void;
  /** Abandons the current run without recording it. */
  endSession: () => void;
  /** Rewinds to one node and marks the session as a replay of that moment. */
  beginRetry: (args: {
    scenarioId: string;
    nodeId: string;
    beat: string;
    previousChoiceId: string;
    previousText: string;
    previousEnding: EndingSummary;
  }) => void;

  /** The most recently finished run, read by the debrief screen. */
  lastRun?: RunResult;
  /** Set only when the finished run was a replay. */
  comparison?: RetryComparison;

  progress: Progress;
  progressStatus: ProgressStatus;
  reloadProgress: () => void;
  commitRun: (run: StoredRun) => Promise<void>;
  resetProgress: () => Promise<void>;
}

const PracticeContext = createContext<PracticeContextValue | undefined>(undefined);

export function PracticeProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | undefined>(undefined);
  const [lastRun, setLastRun] = useState<RunResult | undefined>(undefined);
  const [comparison, setComparison] = useState<RetryComparison | undefined>(undefined);

  const [progress, setProgress] = useState<Progress>(EMPTY_PROGRESS);
  const [progressStatus, setProgressStatus] = useState<ProgressStatus>('loading');

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const readProgress = useCallback(() => {
    loadProgress()
      .then((p) => {
        if (!mounted.current) return;
        setProgress(p);
        setProgressStatus('ready');
      })
      .catch(() => {
        if (!mounted.current) return;
        setProgressStatus('error');
      });
  }, []);

  /** Re-read after a failure. Shows the loading state again first. */
  const reloadProgress = useCallback(() => {
    setProgressStatus('loading');
    readProgress();
  }, [readProgress]);

  // The initial read. Status already starts at 'loading', so there is nothing
  // to set synchronously here.
  useEffect(() => {
    readProgress();
  }, [readProgress]);

  const ensureSession = useCallback((scenarioId: string, startNodeId: string) => {
    setSession((current) => {
      if (current && current.scenarioId === scenarioId && !current.endingId) return current;
      return { scenarioId, currentNodeId: startNodeId, turns: [] };
    });
  }, []);

  const restart = useCallback((scenarioId: string, startNodeId: string) => {
    setComparison(undefined);
    setSession({ scenarioId, currentNodeId: startNodeId, turns: [] });
  }, []);

  const advance = useCallback((args: AdvanceArgs) => {
    setSession((current) => {
      if (!current) return current;
      const turns = [...current.turns, { nodeId: args.nodeId, choiceId: args.choiceId }];

      if (!args.ending) {
        return { ...current, currentNodeId: args.nextNodeId, turns };
      }

      // The conversation is over: freeze the run and, if this was a replay,
      // record how the new response changed where it landed.
      setLastRun({
        scenarioId: current.scenarioId,
        turns,
        endingId: args.ending.id,
        finishedAt: Date.now(),
      });

      setComparison(
        current.retry
          ? {
              beat: current.retry.beat,
              before: { text: current.retry.previousText, ending: current.retry.previousEnding },
              after: { text: args.choiceText, ending: args.ending },
            }
          : undefined,
      );

      return { ...current, currentNodeId: undefined, turns, endingId: args.ending.id };
    });
  }, []);

  const endSession = useCallback(() => {
    setSession(undefined);
    setComparison(undefined);
  }, []);

  const beginRetry = useCallback(
    (args: {
      scenarioId: string;
      nodeId: string;
      beat: string;
      previousChoiceId: string;
      previousText: string;
      previousEnding: EndingSummary;
    }) => {
      setComparison(undefined);
      setSession((current) => {
        const turns = current?.turns ?? [];
        const cut = turns.findIndex((t) => t.nodeId === args.nodeId);
        return {
          scenarioId: args.scenarioId,
          currentNodeId: args.nodeId,
          // Everything said before the replayed moment still stands.
          turns: cut >= 0 ? turns.slice(0, cut) : [],
          retry: {
            nodeId: args.nodeId,
            beat: args.beat,
            previousChoiceId: args.previousChoiceId,
            previousText: args.previousText,
            previousEnding: args.previousEnding,
          },
        };
      });
    },
    [],
  );

  const commitRun = useCallback(async (run: StoredRun) => {
    const next = await saveRun(run);
    if (!mounted.current) return;
    setProgress(next);
    setProgressStatus('ready');
  }, []);

  const resetProgress = useCallback(async () => {
    await clearProgress();
    if (!mounted.current) return;
    setProgress(EMPTY_PROGRESS);
    setProgressStatus('ready');
  }, []);

  const value = useMemo<PracticeContextValue>(
    () => ({
      session,
      ensureSession,
      restart,
      advance,
      endSession,
      beginRetry,
      lastRun,
      comparison,
      progress,
      progressStatus,
      reloadProgress,
      commitRun,
      resetProgress,
    }),
    [
      session,
      ensureSession,
      restart,
      advance,
      endSession,
      beginRetry,
      lastRun,
      comparison,
      progress,
      progressStatus,
      reloadProgress,
      commitRun,
      resetProgress,
    ],
  );

  return <PracticeContext.Provider value={value}>{children}</PracticeContext.Provider>;
}

export function usePractice(): PracticeContextValue {
  const ctx = useContext(PracticeContext);
  if (!ctx) throw new Error('usePractice must be used inside a PracticeProvider');
  return ctx;
}
