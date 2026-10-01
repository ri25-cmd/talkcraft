import type { Choice, Conversation, DialogueNode, Ending, SkillKey } from '@/content/types';
import { SKILL_KEYS, SKILL_META } from '@/content/types';
import { bestChoiceAt, choiceWeight, type RunResult } from './conversation';

/**
 * Turning a recorded run into a debrief.
 *
 * Everything below is derived from choices the user actually made. There is no
 * inference about the person — only statements about what was said in this
 * conversation and what else was on offer at the same moment.
 */

export type SkillBand = 'strong' | 'solid' | 'mixed' | 'weak' | 'untested';

export const BAND_LABEL: Record<SkillBand, string> = {
  strong: 'Strong',
  solid: 'Solid',
  mixed: 'Mixed',
  weak: 'Needs work',
  untested: 'Not tested',
};

export interface SkillResult {
  key: SkillKey;
  label: string;
  blurb: string;
  band: SkillBand;
  /** 0–1, used only to fill a meter. Never shown as a number. */
  fill: number;
  /** A sentence pointing at the specific moment this is based on. */
  note: string;
}

export interface Strength {
  beat: string;
  tone: string;
  line: string;
  note: string;
}

export interface MissedMoment {
  nodeId: string;
  beat: string;
  /** What the colleague had just said. */
  promptLine: string;
  /** What the user chose. */
  yourChoiceId: string;
  yourLine: string;
  yourNote: string;
  /** The stronger response that was available at the same moment. */
  betterChoiceId: string;
  betterLine: string;
  betterNote: string;
}

export interface Debrief {
  ending: Ending;
  turnCount: number;
  strengths: Strength[];
  /** Absent only when every choice made was the best one available. */
  missed?: MissedMoment;
  skills: SkillResult[];
  /** Honest one-liner when nothing in the run was a strong move. */
  noStrengthsNote?: string;
}

interface ResolvedTurn {
  node: DialogueNode;
  choice: Choice;
}

function resolveTurns(conversation: Conversation, run: RunResult): ResolvedTurn[] {
  const resolved: ResolvedTurn[] = [];
  for (const turn of run.turns) {
    const node = conversation.nodes[turn.nodeId];
    const choice = node?.choices.find((c) => c.id === turn.choiceId);
    if (node && choice) resolved.push({ node, choice });
  }
  return resolved;
}

function bandFor(fill: number): SkillBand {
  if (fill >= 0.85) return 'strong';
  if (fill >= 0.6) return 'solid';
  if (fill >= 0.35) return 'mixed';
  return 'weak';
}

/**
 * Score one dimension against what was actually available.
 *
 * A dimension is only scored if at least one response on the user's path
 * exercised it. Scoring is relative to the best and worst responses that were
 * on offer at those same moments, so the result answers "compared to what you
 * could have said here" rather than an absolute standard.
 */
function scoreSkill(key: SkillKey, turns: ResolvedTurn[]): SkillResult {
  let got = 0;
  let best = 0;
  let worst = 0;
  let inPlay = false;

  let peak: { turn: ResolvedTurn; delta: number } | undefined;
  let trough: { turn: ResolvedTurn; delta: number } | undefined;

  for (const turn of turns) {
    const numeric = turn.node.choices.map((c) => c.effects[key] ?? 0);
    const chosen = turn.choice.effects[key] ?? 0;

    // A turn counts towards a dimension only if there was a real chance to
    // show it (some response there improved it), or if the response actually
    // given moved it. Without the first condition, a turn whose only variation
    // was a penalty would award full marks for simply avoiding the penalty —
    // which reads as praise for having done nothing.
    const wasAnOpportunity = Math.max(...numeric) > 0;
    if (!wasAnOpportunity && chosen === 0) continue;
    inPlay = true;

    best += Math.max(...numeric);
    worst += Math.min(...numeric);
    got += chosen;

    if (!peak || chosen > peak.delta) peak = { turn, delta: chosen };
    if (!trough || chosen < trough.delta) trough = { turn, delta: chosen };
  }

  const meta = SKILL_META[key];

  if (!inPlay) {
    return {
      key,
      label: meta.label,
      blurb: meta.blurb,
      band: 'untested',
      fill: 0,
      note: 'This route through the conversation never put this to the test.',
    };
  }

  const fill = best === worst ? 1 : Math.min(1, Math.max(0, (got - worst) / (best - worst)));
  const band = bandFor(fill);

  let note: string;
  if (band === 'strong' || band === 'solid') {
    const moment = peak && peak.delta > 0 ? peak : undefined;
    note = moment
      ? `Best at "${moment.turn.node.beat}", where you went ${lowerFirst(moment.turn.choice.tone)}.`
      : 'Steady across the conversation, without a standout moment.';
  } else {
    const moment = trough && trough.delta < 0 ? trough : undefined;
    note = moment
      ? `Slipped most at "${moment.turn.node.beat}", where you went ${lowerFirst(moment.turn.choice.tone)}.`
      : 'Nothing here went wrong, but nothing pushed it forward either.';
  }

  return { key, label: meta.label, blurb: meta.blurb, band, fill, note };
}

function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

/**
 * The single moment where the gap between what was said and the best available
 * alternative was widest. This is the moment the retry flow replays.
 */
function findMissedMoment(turns: ResolvedTurn[]): MissedMoment | undefined {
  let widest: { turn: ResolvedTurn; better: Choice; gap: number } | undefined;

  for (const turn of turns) {
    const better = bestChoiceAt(turn.node);
    if (better.id === turn.choice.id) continue;
    const gap = choiceWeight(better) - choiceWeight(turn.choice);
    if (gap <= 0) continue;
    if (!widest || gap > widest.gap) widest = { turn, better, gap };
  }

  if (!widest) return undefined;

  return {
    nodeId: widest.turn.node.id,
    beat: widest.turn.node.beat,
    promptLine: widest.turn.node.line,
    yourChoiceId: widest.turn.choice.id,
    yourLine: widest.turn.choice.text,
    yourNote: widest.turn.choice.coachNote,
    betterChoiceId: widest.better.id,
    betterLine: widest.better.text,
    betterNote: widest.better.coachNote,
  };
}

function findStrengths(turns: ResolvedTurn[]): {
  strengths: Strength[];
  noStrengthsNote?: string;
} {
  const strong = turns.filter((t) => t.choice.quality === 'strong');

  if (strong.length > 0) {
    return {
      strengths: strong.slice(0, 2).map((t) => ({
        beat: t.node.beat,
        tone: t.choice.tone,
        line: t.choice.text,
        note: t.choice.coachNote,
      })),
    };
  }

  // No strong move was made. Rather than inventing praise, surface the best
  // thing that did happen — but only if it was actually net positive.
  const bestMade = turns.reduce<ResolvedTurn | undefined>((acc, t) => {
    if (!acc) return t;
    return choiceWeight(t.choice) > choiceWeight(acc.choice) ? t : acc;
  }, undefined);

  if (bestMade && choiceWeight(bestMade.choice) > 0) {
    return {
      strengths: [
        {
          beat: bestMade.node.beat,
          tone: bestMade.choice.tone,
          line: bestMade.choice.text,
          note: bestMade.choice.coachNote,
        },
      ],
    };
  }

  return {
    strengths: [],
    noStrengthsNote:
      'No single response in this run moved the conversation forward. That is worth knowing rather than glossing over — the retry below is the place to change it.',
  };
}

export function buildDebrief(
  conversation: Conversation,
  run: RunResult,
): Debrief | undefined {
  const ending = conversation.endings[run.endingId];
  if (!ending) return undefined;

  const turns = resolveTurns(conversation, run);
  const { strengths, noStrengthsNote } = findStrengths(turns);

  return {
    ending,
    turnCount: turns.length,
    strengths,
    noStrengthsNote,
    missed: findMissedMoment(turns),
    skills: SKILL_KEYS.map((key) => scoreSkill(key, turns)),
  };
}

/**
 * A short, honest headline for a finished run, reused on the home screen.
 * Based on the ending reached, not on a judgement about the user.
 */
export function headlineFor(debrief: Debrief): string {
  const tested = debrief.skills.filter((s) => s.band !== 'untested');
  const weakest = tested
    .slice()
    .sort((a, b) => a.fill - b.fill)
    .find((s) => s.band === 'weak' || s.band === 'mixed');

  if (weakest) return `${debrief.ending.title} — ${weakest.label.toLowerCase()} was the weak point.`;
  return `${debrief.ending.title} — no obvious weak point in that run.`;
}
