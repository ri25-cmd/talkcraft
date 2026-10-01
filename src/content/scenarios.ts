import { lastMinuteAsksConversation } from './lastMinuteAsks';
import { missedDeadlinesConversation } from './missedDeadlines';
import { scopeCreepConversation } from './scopeCreep';
import type { Scenario } from './types';

/**
 * The scenario catalogue.
 *
 * A scenario is playable only once its `conversation` is written. All three are
 * written; the gate stays in place so that adding a fourth entry without its
 * dialogue degrades honestly instead of opening a broken screen.
 */
export const SCENARIOS: Scenario[] = [
  {
    id: 'missed-deadlines',
    title: 'The deadlines that keep slipping',
    description:
      'A senior engineer on your team has delivered three sprints late in a row. They are capable, well liked, and have not mentioned that anything is wrong.',
    objective:
      'Name the pattern clearly, find out what is actually causing it, and leave with one specific thing that changes next sprint.',
    counterpart: { name: 'Alex Moreno', role: 'Senior engineer, on your team', initials: 'AM' },
    estimatedTurns: 4,
    conversation: missedDeadlinesConversation,
  },
  {
    id: 'last-minute-asks',
    title: 'The colleague who always needs it today',
    description:
      'A peer from another team keeps dropping urgent requests on you at 4pm. Each one is reasonable on its own, and together they have eaten most of your week.',
    objective:
      'Hold a boundary without damaging a relationship you still need, and agree how genuinely urgent work should reach you in future.',
    counterpart: { name: 'Priya Raman', role: 'Delivery lead, partner team', initials: 'PR' },
    estimatedTurns: 4,
    conversation: lastMinuteAsksConversation,
  },
  {
    id: 'scope-creep',
    title: 'The client asking for one more thing',
    description:
      'A client has asked for a change that sits outside the statement of work. They have framed it as a small favour, and they are the account your team depends on.',
    objective:
      'Say no to the free work without saying no to the client, and put the request back on a footing you can both live with.',
    counterpart: { name: 'Tom Halvorsen', role: 'Client, Northbeam Retail', initials: 'TH' },
    estimatedTurns: 4,
    conversation: scopeCreepConversation,
  },
];

export function getScenario(id: string | undefined): Scenario | undefined {
  if (!id) return undefined;
  return SCENARIOS.find((s) => s.id === id);
}

/** A scenario is playable only if someone has actually written its dialogue. */
export function isPlayable(scenario: Scenario): boolean {
  return scenario.conversation !== undefined;
}
