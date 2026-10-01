/**
 * Types for scenario content and the branching conversation graph.
 *
 * Conversations are plain data: a map of nodes, each with a line from the
 * colleague and the responses available to the user. Nothing is generated at
 * runtime, so every branch in the app is a branch someone wrote and can read.
 */

/**
 * What the debrief comments on. These are conversational moves that can be
 * observed in a transcript — not personality traits or any kind of
 * psychological measure.
 *
 * A dimension a given conversation never puts to the test is reported as
 * "Not tested" rather than silently scored, so the boundary-setting scenarios
 * can lean on assertiveness without distorting the feedback on the others.
 */
export type SkillKey =
  | 'clarity'
  | 'assertiveness'
  | 'empathy'
  | 'specificity'
  | 'accountability'
  | 'nextSteps';

export const SKILL_KEYS: SkillKey[] = [
  'clarity',
  'assertiveness',
  'empathy',
  'specificity',
  'accountability',
  'nextSteps',
];

export const SKILL_META: Record<
  SkillKey,
  { label: string; blurb: string }
> = {
  clarity: {
    label: 'Clarity',
    blurb: 'Whether the other person could tell what the conversation was about.',
  },
  assertiveness: {
    label: 'Assertiveness',
    blurb:
      'Whether you said what you needed plainly — without softening it into nothing, or hardening it into a fight.',
  },
  empathy: {
    label: 'Empathy',
    blurb: 'Whether you showed you had heard them before moving on.',
  },
  specificity: {
    label: 'Specificity',
    blurb: 'Whether you pointed at concrete events rather than general impressions.',
  },
  accountability: {
    label: 'Accountability',
    blurb: 'Whether you owned your share of the situation.',
  },
  nextSteps: {
    label: 'Agreeing next steps',
    blurb: 'Whether the conversation ended with something specific to do.',
  },
};

/** How strong a response is, used for ordering alternatives in the debrief. */
export type ChoiceQuality = 'strong' | 'mixed' | 'weak';

export interface Choice {
  id: string;
  /** What the user says, verbatim. */
  text: string;
  /** Two or three word summary of the move, e.g. "Direct and specific". */
  tone: string;
  quality: ChoiceQuality;
  /**
   * Effect on each skill, from -2 to +2. Only dimensions this response
   * actually exercises are listed.
   */
  effects: Partial<Record<SkillKey, number>>;
  /** Plain-language note on what this response does to the conversation. */
  coachNote: string;
  next: string;
}

/** How the colleague is holding themselves at this point. */
export type Mood = 'rushed' | 'guarded' | 'defensive' | 'closed' | 'open' | 'warm';

export const MOOD_LABEL: Record<Mood, string> = {
  rushed: 'In a hurry',
  guarded: 'Guarded',
  defensive: 'Defensive',
  closed: 'Shut down',
  open: 'Opening up',
  warm: 'Engaged',
};

export interface DialogueNode {
  id: string;
  /** The beat of the conversation, shown as a quiet progress label. */
  beat: string;
  /** What the colleague says. */
  line: string;
  /** Optional stage direction shown in smaller type above the line. */
  action?: string;
  mood: Mood;
  choices: Choice[];
}

export type EndingTone = 'strong' | 'partial' | 'poor';

export interface Ending {
  id: string;
  /** Closing line from the colleague, if the conversation reached one. */
  line?: string;
  action?: string;
  /** Short name for this outcome, e.g. "Clear agreement". */
  title: string;
  /** One sentence on where the relationship and the work actually landed. */
  summary: string;
  tone: EndingTone;
}

export interface Conversation {
  /** Node the conversation opens on. */
  startId: string;
  nodes: Record<string, DialogueNode>;
  endings: Record<string, Ending>;
}

export interface Scenario {
  id: string;
  title: string;
  /** One line shown on the selection card. */
  description: string;
  /** What the user is trying to achieve. Shown before they start. */
  objective: string;
  /** The person on the other side of the table. */
  counterpart: {
    name: string;
    role: string;
    /** Initials for the avatar. No photos, no invented faces. */
    initials: string;
  };
  /** Roughly how long a run takes. */
  estimatedTurns: number;
  /** Conversations that are written; the rest are honestly marked unbuilt. */
  conversation?: Conversation;
}
