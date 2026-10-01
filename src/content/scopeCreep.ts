import type { Conversation } from './types';

/**
 * "Handling a client who requests work outside the agreed scope."
 *
 * Tom Halvorsen is an experienced client contact at Northbeam Retail. He is
 * affable and entirely sincere, which is what makes him effective: he frames
 * two weeks of work as a checkbox, and reaches for the renewal only when the
 * polite framing stops working.
 *
 * He is not a bully. Given a clear line and a real route to what he needs, he
 * takes it. Given a yes, he takes that too — and the line moves permanently.
 * Given correctness with no warmth, he goes formal, which costs more over a
 * year than the two weeks would have.
 */
export const scopeCreepConversation: Conversation = {
  startId: 'open',
  nodes: {
    open: {
      id: 'open',
      beat: 'The ask',
      mood: 'warm',
      action: 'Tom joins the call two minutes late, cheerful, camera on.',
      line: `Before we get into the status — small thing. The team mentioned the new dashboard could show store-level breakdowns as well as regional. That's in there already, isn't it? Feels like it ought to be a checkbox.`,
      choices: [
        {
          id: 'open_clear',
          text: `It isn't in there, and it isn't a checkbox — store-level needs a different data model underneath. It's real work, and it sits outside what we agreed in the statement of work.`,
          tone: 'Names it plainly',
          quality: 'strong',
          effects: { clarity: 2, specificity: 2, assertiveness: 2 },
          coachNote: `You corrected the "checkbox" framing immediately and said why. Every minute that framing survives makes the eventual no sound like a change of heart rather than a fact.`,
          next: 'pressure',
        },
        {
          id: 'open_maybe',
          text: `I'd have to check. It might be doable — let me see what we can do.`,
          tone: 'Leaves the door open',
          quality: 'weak',
          effects: { clarity: -2, assertiveness: -2 },
          coachNote: `"Let me see what we can do" is heard as a soft yes by everyone who has ever commissioned work. Tom will now plan around it.`,
          next: 'assumes_yes',
        },
        {
          id: 'open_hedge',
          text: `That's probably a bit more involved than a checkbox. Can I come back to you on it?`,
          tone: 'Defers the answer',
          quality: 'mixed',
          effects: { clarity: -1, assertiveness: 1, specificity: -1 },
          coachNote: `"A bit more involved" understates two weeks of work, and deferring means the no arrives later, in writing, with less room to shape it.`,
          next: 'presses',
        },
      ],
    },

    assumes_yes: {
      id: 'assumes_yes',
      beat: 'It becomes a commitment',
      mood: 'warm',
      action: 'Tom makes a note, visibly moving on to the next thing.',
      line: `Great — I'll let the board know it's coming. They're reviewing the dashboard on the 14th, so if it's in by then, that's perfect.`,
      choices: [
        {
          id: 'ay_correct',
          text: `I need to stop you there — I said I'd check, not that it's coming. As it stands it's outside the statement of work, and it will not be ready for the 14th.`,
          tone: 'Corrects the record now',
          quality: 'strong',
          effects: { clarity: 2, assertiveness: 2, accountability: 1 },
          coachNote: `Interrupting to correct an assumption is uncomfortable for about four seconds. Letting it reach a board paper is uncomfortable for a quarter.`,
          next: 'pressure',
        },
        {
          id: 'ay_let_ride',
          text: `...Right. I'll see what we can do.`,
          tone: 'Lets a false promise stand',
          quality: 'weak',
          effects: { clarity: -2, assertiveness: -2, accountability: -2 },
          coachNote: `A commitment you never made is now in front of Tom's board with your name on it. The conversation you avoided has become a much worse one on the 15th.`,
          next: 'end:free_work',
        },
        {
          id: 'ay_soften',
          text: `I'll try. I can't promise the 14th.`,
          tone: 'Half-corrects',
          quality: 'mixed',
          effects: { assertiveness: 1, clarity: -1 },
          coachNote: `You corrected the date and left the commitment standing. Tom heard "it's coming, possibly late", which is not what you meant.`,
          next: 'presses',
        },
      ],
    },

    presses: {
      id: 'presses',
      beat: 'Where is the line?',
      mood: 'guarded',
      line: `Look, I'm not trying to make your life difficult. But from our side this just looks like part of the dashboard. Where's the line, out of interest?`,
      choices: [
        {
          id: 'p_line',
          text: `Fair question. The statement of work covers regional totals. Store-level means a new data model, new queries and a fresh round of testing — about two weeks. That's the line, and I'd rather show you than argue about it.`,
          tone: 'Shows the line',
          quality: 'strong',
          effects: { clarity: 2, specificity: 2, assertiveness: 1 },
          coachNote: `Answering the question properly turns a negotiation about willingness into a conversation about work. Clients argue with reluctance; they rarely argue with a data model.`,
          next: 'pressure',
        },
        {
          id: 'p_apologetic',
          text: `I know, I'm sorry, it's awkward — procurement are quite strict about this sort of thing.`,
          tone: 'Hides behind procurement',
          quality: 'weak',
          effects: { assertiveness: -2, accountability: -2 },
          coachNote: `Blaming an absent department tells Tom the rule is arbitrary and that the right pressure, applied elsewhere, will move it. It also makes you sound like someone without authority.`,
          next: 'pressure',
        },
        {
          id: 'p_stall',
          text: `Let me get you a proper answer by Friday.`,
          tone: 'Buys time',
          quality: 'mixed',
          effects: { clarity: 1, nextSteps: -1, assertiveness: -1 },
          coachNote: `You know the answer now. Three days of silence lets Tom's expectation harden, and you will be arguing against a plan rather than a question.`,
          next: 'pressure',
        },
      ],
    },

    pressure: {
      id: 'pressure',
      beat: 'The renewal card',
      mood: 'defensive',
      action: `Tom's tone stays friendly. The content does not.`,
      line: `Alright, I'll be straight with you, because I think we're past the polite stage. We're up for renewal in March. I've been the one arguing internally that you lot are worth the money. It would help me enormously if this didn't turn into a change request.`,
      choices: [
        {
          id: 'pr_hold_warm',
          text: `I appreciate you saying that, and I'd rather not spend your goodwill on this. A change request isn't me being difficult — it's the thing that protects both of us if the 14th slips.`,
          tone: 'Names the leverage, stays warm',
          quality: 'strong',
          effects: { empathy: 2, assertiveness: 2, clarity: 1 },
          coachNote: `You acknowledged the leverage without pretending it wasn't leverage, and reframed the paperwork as mutual protection. That lets Tom back down without losing face.`,
          next: 'opens',
        },
        {
          id: 'pr_cave',
          text: `...Understood. Let's not make it a change request. We'll absorb it.`,
          tone: 'Buys the renewal with free work',
          quality: 'weak',
          effects: { assertiveness: -2, nextSteps: -1 },
          coachNote: `You have paid for a renewal with two weeks of unpaid work, and taught Tom the price. The next out-of-scope request starts from the assumption that you will absorb it too.`,
          next: 'end:free_work',
        },
        {
          id: 'pr_rigid',
          text: `Renewal is a separate conversation. This is out of scope and it needs a change request.`,
          tone: 'Correct, and cold',
          quality: 'mixed',
          effects: { assertiveness: 2, empathy: -2 },
          coachNote: `Every word of that is right. Said with nothing around it, it tells your internal advocate that advocating for you is thankless work.`,
          next: 'cools',
        },
      ],
    },

    cools: {
      id: 'cools',
      beat: 'The room cools',
      mood: 'closed',
      action: 'Tom sits back. The warmth is gone.',
      line: `Right. Well. I'll raise it through the proper channel, then. Is that everything?`,
      choices: [
        {
          id: 'cl_repair',
          text: `That came out more rigid than I meant it. I do want to get you something for the 14th — can I show you what we could do by then inside the scope we've got?`,
          tone: 'Repairs without giving ground',
          quality: 'strong',
          effects: { empathy: 2, accountability: 2, nextSteps: 1 },
          coachNote: `You apologised for the delivery, not the position, and immediately offered a route. That is how you climb back down from correct-but-cold without conceding anything.`,
          next: 'opens',
        },
        {
          id: 'cl_accept',
          text: `That's everything. Thanks, Tom.`,
          tone: 'Ends it cold',
          quality: 'weak',
          effects: { empathy: -2, nextSteps: -1 },
          coachNote: `The scope is intact and the relationship is not. "The proper channel" means every future request arrives formally, which is slower and more expensive for both of you.`,
          next: 'end:formal_freeze',
        },
        {
          id: 'cl_soften_ground',
          text: `Look — we could probably do a bit of it as a gesture.`,
          tone: 'Partial cave under chill',
          quality: 'mixed',
          effects: { assertiveness: -2, clarity: -1 },
          coachNote: `Conceding the moment someone goes cold rewards the coldness. "A bit of it" is also undefined, which means it will be defined later by whoever needs more.`,
          next: 'end:free_work',
        },
      ],
    },

    opens: {
      id: 'opens',
      beat: 'The real driver',
      mood: 'open',
      action: 'Tom glances off-screen, then back.',
      line: `Between us — the store-level thing isn't mine. My director asked for it in front of the board and I said yes before I understood what it involved. So I'm not really negotiating with you. I'm trying not to look like an idiot on the 14th.`,
      choices: [
        {
          id: 'o_trade',
          text: `That I can work with. For the 14th we ship regional totals plus a store-level view for your three largest stores — that's inside scope. The full rollout goes in a change request for April.`,
          tone: 'Solves his problem inside scope',
          quality: 'strong',
          effects: { nextSteps: 2, clarity: 2, specificity: 2, empathy: 1 },
          coachNote: `You solved the problem Tom actually has, which was reputational and not technical, without moving the commercial line. That is the outcome this conversation was available for the whole time.`,
          next: 'agrees',
        },
        {
          id: 'o_sympathy',
          text: `That's a horrible position to be in. Let's see what we can do for you.`,
          tone: 'Sympathy instead of a plan',
          quality: 'weak',
          effects: { empathy: 2, assertiveness: -2, nextSteps: -2 },
          coachNote: `Warmth without a proposal converts straight into commitment. Tom did not need you to feel for him — he needed something he could show on the 14th.`,
          next: 'end:free_work',
        },
        {
          id: 'o_ask',
          text: `What do you actually need on screen on the 14th?`,
          tone: 'Asks before proposing',
          quality: 'mixed',
          effects: { empathy: 1, specificity: 1, nextSteps: 0 },
          coachNote: `A good question, slightly late. It gets you the information you need, but it leaves Tom to define the deliverable rather than you.`,
          next: 'asks_back',
        },
      ],
    },

    asks_back: {
      id: 'asks_back',
      beat: 'What he actually needs',
      mood: 'open',
      line: `Honestly? Three stores. Our three biggest. If the board can see it works for those, nobody is going to ask whether it works for all four hundred.`,
      choices: [
        {
          id: 'ab_scope',
          text: `Then that's inside what we already agreed. Three stores for the 14th, and the full rollout as a change request for April. I'll put both in writing today.`,
          tone: 'Closes it in writing',
          quality: 'strong',
          effects: { nextSteps: 2, clarity: 2, assertiveness: 1 },
          coachNote: `You matched his real need to existing scope and dated the paperwork. Putting it in writing the same day is what stops "three stores" growing back into four hundred.`,
          next: 'end:scoped_deal',
        },
        {
          id: 'ab_all',
          text: `We'll get you all of them. Somehow.`,
          tone: 'Overpromises',
          quality: 'weak',
          effects: { assertiveness: -2, nextSteps: -1, specificity: -2 },
          coachNote: `He asked for three and you promised four hundred. "Somehow" is a word that gets paid for by your team in a fortnight of evenings.`,
          next: 'end:free_work',
        },
      ],
    },

    agrees: {
      id: 'agrees',
      beat: 'Closing',
      mood: 'warm',
      action: 'Tom writes it down.',
      line: `That... would actually do it. Yeah. And the April piece — is that going to be a big number?`,
      choices: [
        {
          id: 'a_honest',
          text: `I'll have a figure with you by Thursday, and I'll walk you through it before it goes anywhere near procurement. No surprises.`,
          tone: 'Dated and transparent',
          quality: 'strong',
          effects: { accountability: 2, nextSteps: 2, clarity: 1 },
          coachNote: `A date and an offer to pre-brief him. Clients rarely object to a number they saw coming; they object to being ambushed by one in front of their own finance team.`,
          next: 'end:scoped_deal',
        },
        {
          id: 'a_vague',
          text: `Let's worry about that nearer the time.`,
          tone: 'Leaves the number hanging',
          quality: 'mixed',
          effects: { nextSteps: -1, clarity: -1 },
          coachNote: `You had his attention and a direct question about money, and postponed it. "Nearer the time" is when the number becomes a shock instead of a plan.`,
          next: 'end:soft_close',
        },
      ],
    },
  },

  endings: {
    scoped_deal: {
      id: 'scoped_deal',
      tone: 'strong',
      title: 'Scope held, client helped',
      action: 'Tom looks visibly lighter than he did ten minutes ago.',
      line: `Send it over. And — thanks for not just saying no.`,
      summary: `Tom has something real for the 14th, your team is not doing two weeks of unpaid work, and the rest is on a commercial footing. March's renewal conversation is now about value rather than favours owed.`,
    },
    soft_close: {
      id: 'soft_close',
      tone: 'partial',
      title: 'Solved today, unresolved tomorrow',
      action: 'Tom nods and moves on to the next agenda item.',
      line: `Alright. We'll pick the April piece up later.`,
      summary: `You protected both the 14th and the scope, and left the commercial conversation unopened. "Nearer the time" tends to mean the number arrives as a surprise, which is where the goodwill you just earned gets spent.`,
    },
    formal_freeze: {
      id: 'formal_freeze',
      tone: 'poor',
      title: 'Correct, and frozen',
      action: 'Tom ends the call a few minutes early.',
      line: `I'll raise it through the proper channel.`,
      summary: `You held the scope exactly as you should have, and paid for it with the relationship. Everything now arrives formally, which is slower for both sides — and Tom is no longer the person arguing internally that you are worth renewing.`,
    },
    free_work: {
      id: 'free_work',
      tone: 'poor',
      title: 'You absorbed it',
      action: 'Tom is cheerful again within seconds.',
      line: `Brilliant. I'll let the board know it's in hand.`,
      summary: `Two weeks of work entered the project with nothing agreed about who pays for it. The more expensive part is the precedent: the next request outside scope now starts from the assumption that you will absorb that too.`,
    },
  },
};
