import type { Choice, Conversation, DialogueNode, Ending } from '@/content/types';

/** One decision the user actually made, in order. */
export interface TurnRecord {
  nodeId: string;
  choiceId: string;
}

/** A completed run through a conversation. */
export interface RunResult {
  scenarioId: string;
  turns: TurnRecord[];
  endingId: string;
  /** Epoch ms, so runs can be ordered without a date library. */
  finishedAt: number;
}

const END_PREFIX = 'end:';

export function isEndingRef(next: string): boolean {
  return next.startsWith(END_PREFIX);
}

export function endingIdFromRef(next: string): string {
  return next.slice(END_PREFIX.length);
}

export function getNode(
  conversation: Conversation,
  nodeId: string,
): DialogueNode | undefined {
  return conversation.nodes[nodeId];
}

export function getEnding(
  conversation: Conversation,
  endingId: string,
): Ending | undefined {
  return conversation.endings[endingId];
}

export function getChoice(
  conversation: Conversation,
  nodeId: string,
  choiceId: string,
): Choice | undefined {
  return conversation.nodes[nodeId]?.choices.find((c) => c.id === choiceId);
}

/**
 * Sum of a choice's effects — a rough measure of how much the response moves
 * the conversation forward. Used only to rank alternatives against each other
 * within the same node, never shown to the user as a score.
 */
export function choiceWeight(choice: Choice): number {
  return Object.values(choice.effects).reduce<number>((sum, v) => sum + (v ?? 0), 0);
}

/** The highest-weighted response available at a node. */
export function bestChoiceAt(node: DialogueNode): Choice {
  return node.choices.reduce((best, c) =>
    choiceWeight(c) > choiceWeight(best) ? c : best,
  );
}

/**
 * Walk a recorded path and return the nodes visited, stopping early if the
 * record references something that no longer exists in the content.
 */
export function replayNodes(
  conversation: Conversation,
  turns: TurnRecord[],
): DialogueNode[] {
  const visited: DialogueNode[] = [];
  for (const turn of turns) {
    const node = conversation.nodes[turn.nodeId];
    if (!node) break;
    visited.push(node);
  }
  return visited;
}

/**
 * Development-time integrity check: every `next` must resolve to a real node
 * or a real ending. Runs only under __DEV__ so a typo in content surfaces
 * immediately rather than as a blank screen in the middle of a conversation.
 */
export function findBrokenLinks(conversation: Conversation): string[] {
  const problems: string[] = [];
  for (const node of Object.values(conversation.nodes)) {
    if (node.choices.length === 0) {
      problems.push(`Node "${node.id}" has no choices and no ending.`);
    }
    for (const choice of node.choices) {
      if (isEndingRef(choice.next)) {
        if (!conversation.endings[endingIdFromRef(choice.next)]) {
          problems.push(`Choice "${choice.id}" points at missing ending "${choice.next}".`);
        }
      } else if (!conversation.nodes[choice.next]) {
        problems.push(`Choice "${choice.id}" points at missing node "${choice.next}".`);
      }
    }
  }
  if (!conversation.nodes[conversation.startId]) {
    problems.push(`Start node "${conversation.startId}" does not exist.`);
  }
  return problems;
}
