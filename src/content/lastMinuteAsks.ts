import type { Conversation } from './types';

/**
 * "Setting boundaries when a colleague repeatedly asks for last-minute help."
 *
 * Priya Raman (they/them) leads delivery on a partner team. They are warm,
 * genuinely stretched, and very good at making each individual request sound
 * small — which is exactly why four of them have landed this week. They are not
 * manipulating anyone on purpose; the leverage they reach for is real shared
 * history.
 *
 * The conversation punishes both failure modes. Say yes and the pattern locks
 * in. Say no bluntly and Priya goes cold and transactional, which costs you the
 * next time you need something at short notice. The strong route holds the
 * boundary while keeping the person.
 */
export const lastMinuteAsksConversation: Conversation = {
  startId: 'open',
  nodes: {
    open: {
      id: 'open',
      beat: 'The ask',
      mood: 'rushed',
      action: 'Priya leans round your monitor at 4:40 on a Thursday, laptop already open.',
      line: `Hey — sorry, I know it's late. Tiny thing. Could you get the Q3 numbers reconciled before the Northbeam call tomorrow? It's honestly twenty minutes for you.`,
      choices: [
        {
          id: 'open_name_pattern',
          text: `I can't do it tonight. And before you go — that's the fourth late ask this week. I'd like to talk about that, not just about tonight.`,
          tone: 'Declines and names the pattern',
          quality: 'strong',
          effects: { clarity: 2, assertiveness: 2, specificity: 2 },
          coachNote: `You gave a clear no and then widened it to the pattern in the same breath. Handling only tonight would have meant having this conversation again on Monday.`,
          next: 'pushback',
        },
        {
          id: 'open_yes',
          text: `Ah — okay. Leave it with me, I'll find the time.`,
          tone: 'Says yes again',
          quality: 'weak',
          effects: { assertiveness: -2, nextSteps: -1 },
          coachNote: `The fourth yes of the week. Each one on its own is a small favour; together they are the reason your own work keeps sliding to the evening.`,
          next: 'yes_again',
        },
        {
          id: 'open_soft_no',
          text: `Tonight's difficult. Is there any chance it could wait until Monday?`,
          tone: 'Asks permission to decline',
          quality: 'mixed',
          effects: { assertiveness: 1, clarity: -1, specificity: -1 },
          coachNote: `Phrasing a no as a question invites Priya to answer it, and they will. You have handed them the decision that was yours to make.`,
          next: 'negotiates_you_down',
        },
      ],
    },

    yes_again: {
      id: 'yes_again',
      beat: 'And one more thing',
      mood: 'warm',
      action: `Priya's shoulders drop about an inch.`,
      line: `You're a lifesaver. Genuinely. I'll send the file over now. And don't hate me, but there might be one more thing on Monday.`,
      choices: [
        {
          id: 'ya_recover',
          text: `Priya — hold on. I've said yes to four of these this week. I'll do tonight's, and then we need to change how this works.`,
          tone: 'Draws the line late',
          quality: 'strong',
          effects: { assertiveness: 2, clarity: 2, specificity: 1 },
          coachNote: `Late, and still worth doing. Honouring tonight while naming the pattern separates the favour from the precedent it was about to set.`,
          next: 'pushback',
        },
        {
          id: 'ya_joke',
          text: `Ha. Of course there is. Go on then.`,
          tone: 'Jokes past it',
          quality: 'weak',
          effects: { assertiveness: -2, clarity: -2 },
          coachNote: `Humour let you feel like you had registered a complaint without actually making one. Priya heard a yes, because that is what it was.`,
          next: 'end:doormat',
        },
        {
          id: 'ya_hint',
          text: `I mean — things are pretty full at the moment, so...`,
          tone: 'Hints instead of saying it',
          quality: 'mixed',
          effects: { assertiveness: -1, clarity: -1 },
          coachNote: `A trailing sentence is not a boundary. Priya has to guess what you meant, and people under pressure guess in their own favour.`,
          next: 'negotiates_you_down',
        },
      ],
    },

    negotiates_you_down: {
      id: 'negotiates_you_down',
      beat: 'The negotiation',
      mood: 'guarded',
      line: `It really is small, though. And you know what Northbeam are like — if they don't see numbers tomorrow, it's my head on it. Half an hour? I'll owe you one.`,
      choices: [
        {
          id: 'nyd_hold',
          text: `I believe you that it's a problem. It's still a no for tonight. What I can do is first thing Monday — and I'd rather we worked out why these keep arriving at 4pm.`,
          tone: 'Acknowledges and holds',
          quality: 'strong',
          effects: { assertiveness: 2, empathy: 1, nextSteps: 1, clarity: 1 },
          coachNote: `You accepted that their problem is real without accepting that it is yours to solve tonight. Offering Monday keeps you helpful without moving the line.`,
          next: 'pushback',
        },
        {
          id: 'nyd_cave',
          text: `...Fine. Half an hour. But this is the last one.`,
          tone: 'Caves with a warning',
          quality: 'weak',
          effects: { assertiveness: -2, clarity: -1 },
          coachNote: `"This is the last one" attached to a yes teaches the opposite of what you intended: that the boundary is a thing you say, not a thing you do.`,
          next: 'end:doormat',
        },
        {
          id: 'nyd_blunt',
          text: `It's not my emergency, Priya.`,
          tone: 'True, and cold',
          quality: 'mixed',
          effects: { assertiveness: 2, empathy: -2 },
          coachNote: `Accurate, and it lands as a door closing. The content of that sentence was fine; delivering it with nothing around it is what does the damage.`,
          next: 'hurt',
        },
      ],
    },

    pushback: {
      id: 'pushback',
      beat: 'The pushback',
      mood: 'defensive',
      action: 'Priya straightens up. The friendliness cools by several degrees.',
      line: `Right. Wow. I didn't realise I was such a problem. I've covered for your team plenty of times, you know — I just didn't keep a list about it.`,
      choices: [
        {
          id: 'pb_repair',
          text: `You have, and I haven't forgotten. This isn't about whether I'll help you — it's about the timing. At 4pm I have to drop something of my own to do it.`,
          tone: 'Separates the person from the pattern',
          quality: 'strong',
          effects: { empathy: 2, clarity: 2, assertiveness: 1 },
          coachNote: `You conceded a true point and then restated the boundary in terms of cost rather than blame. That is what lets someone hear it without having to defend themselves.`,
          next: 'opens',
        },
        {
          id: 'pb_retreat',
          text: `No — sorry, that came out wrong. Forget it, I'll sort tonight's out.`,
          tone: 'Folds under the guilt',
          quality: 'weak',
          effects: { assertiveness: -2, clarity: -2, accountability: -1 },
          coachNote: `The pushback worked, and Priya now knows it works. Withdrawing a fair request the moment someone is upset makes the next one harder to raise.`,
          next: 'end:doormat',
        },
        {
          id: 'pb_defend',
          text: `I'm not saying you're a problem. I'm saying I can't keep doing this.`,
          tone: 'Repeats without connecting',
          quality: 'mixed',
          effects: { assertiveness: 1, empathy: -1 },
          coachNote: `You held the line, which is the harder half. You skipped the part where Priya feels heard, so they hold the line too — just on their side of it.`,
          next: 'cold',
        },
      ],
    },

    hurt: {
      id: 'hurt',
      beat: 'That landed badly',
      mood: 'closed',
      action: 'Priya blinks.',
      line: `No. It isn't. Okay. Forget I asked.`,
      choices: [
        {
          id: 'h_repair',
          text: `Wait — that was blunter than I meant it. I do want to help you. What I can't do is find out at 4pm that you need something by morning.`,
          tone: 'Repairs without folding',
          quality: 'strong',
          effects: { empathy: 2, accountability: 2, assertiveness: 1 },
          coachNote: `Repairing the delivery without retracting the substance is the move. You kept the boundary and gave back the relationship it was about to cost.`,
          next: 'opens',
        },
        {
          id: 'h_let_go',
          text: `Okay. Sorry.`,
          tone: 'Lets them leave',
          quality: 'weak',
          effects: { empathy: -1, nextSteps: -2 },
          coachNote: `Priya leaves with a no and no explanation, which is the version most likely to be retold as "they just refused". Nothing was agreed for next week either.`,
          next: 'end:cold_win',
        },
        {
          id: 'h_double_down',
          text: `I'd rather you did ask. Just earlier.`,
          tone: 'Correct, still cold',
          quality: 'mixed',
          effects: { assertiveness: 1, empathy: -1, nextSteps: 0 },
          coachNote: `The right instruction delivered at the wrong temperature. Priya is not in a state to hear process advice yet, so it reads as a second correction.`,
          next: 'cold',
        },
      ],
    },

    cold: {
      id: 'cold',
      beat: 'Gone formal',
      mood: 'closed',
      action: `Priya's tone flattens into something polite and professional.`,
      line: `Noted. I'll put things in writing in future. Anything else?`,
      choices: [
        {
          id: 'c_repair',
          text: `Honestly? I don't think I've handled this well. I do want this to work — can we spend two minutes on what "earlier" should actually look like?`,
          tone: 'Late repair',
          quality: 'strong',
          effects: { accountability: 2, empathy: 2, nextSteps: 1 },
          coachNote: `Naming your own part and asking for two specific minutes is a small enough request that someone who has gone formal can still say yes to it.`,
          next: 'opens',
        },
        {
          id: 'c_accept',
          text: `No, that's everything. Thanks.`,
          tone: 'Takes the cold win',
          quality: 'weak',
          effects: { empathy: -2, nextSteps: -1 },
          coachNote: `You got what you asked for and let the relationship pay for it. "I'll put things in writing" is a colleague deciding to stop treating you as an ally.`,
          next: 'end:cold_win',
        },
      ],
    },

    opens: {
      id: 'opens',
      beat: 'The real reason',
      mood: 'open',
      action: 'Priya sits on the edge of the desk.',
      line: `...The honest answer is that I don't know either until about three. Northbeam keep moving the call and I find out the same day. So I panic, and I go to whoever I think will say yes. Which is usually you.`,
      choices: [
        {
          id: 'o_process',
          text: `Then let's fix that rather than argue about tonight. Put anything you need from me in the shared tracker by 2pm and I'll commit to same day. Anything after 2pm waits until the next morning.`,
          tone: 'Proposes a rule',
          quality: 'strong',
          effects: { nextSteps: 2, clarity: 2, assertiveness: 2 },
          coachNote: `A boundary with a time on it is one both of you can check. "By 2pm" survives a bad week in a way that "a bit more notice" never does.`,
          next: 'commits',
        },
        {
          id: 'o_vague',
          text: `Well — just try to give me a bit more notice where you can.`,
          tone: 'Asks for nothing checkable',
          quality: 'weak',
          effects: { nextSteps: -2, assertiveness: -1 },
          coachNote: `"Where you can" is doing all the work in that sentence, and it means Priya decides. Next Thursday will look exactly like this one.`,
          next: 'end:vague',
        },
        {
          id: 'o_ask',
          text: `What would actually help you here?`,
          tone: 'Hands it back',
          quality: 'mixed',
          effects: { empathy: 1, nextSteps: 0 },
          coachNote: `A generous question that postpones your own ask. Priya will answer about what they need, and the boundary you came here to set may never get stated.`,
          next: 'asks_back',
        },
      ],
    },

    asks_back: {
      id: 'asks_back',
      beat: 'What they need',
      mood: 'open',
      line: `Honestly? Knowing you'd take one genuine emergency a week would do it. It's not knowing that makes me ask you for everything.`,
      choices: [
        {
          id: 'ab_deal',
          text: `One a week, and you tell me by 2pm. Anything past that goes in the tracker for the next morning. Deal?`,
          tone: 'Turns it into a rule',
          quality: 'strong',
          effects: { nextSteps: 2, assertiveness: 2, clarity: 1 },
          coachNote: `You took what they offered and put a number and a time on it. That is the difference between a good intention and something you can both hold each other to.`,
          next: 'end:clear_boundary',
        },
        {
          id: 'ab_open',
          text: `I'll always try to help where I can.`,
          tone: 'Promises everything',
          quality: 'weak',
          effects: { nextSteps: -2, assertiveness: -2 },
          coachNote: `You were handed a specific, modest request and answered with an unlimited one. Priya will keep asking for everything, because you just said yes to everything.`,
          next: 'end:doormat',
        },
      ],
    },

    commits: {
      id: 'commits',
      beat: 'Closing',
      mood: 'warm',
      line: `Two o'clock. Yeah, I can work with that. Can I ask one thing back? If you're going to say no, say it straight away. The worst bit is waiting all afternoon to find out.`,
      choices: [
        {
          id: 'co_accept',
          text: `That's fair. You'll get a yes or a no within the hour, every time.`,
          tone: 'Commits to something back',
          quality: 'strong',
          effects: { accountability: 2, nextSteps: 2, empathy: 1 },
          coachNote: `You took on an obligation of your own. A boundary where only one person has to change tends to quietly stop being observed.`,
          next: 'end:clear_boundary',
        },
        {
          id: 'co_deflect',
          text: `I'll do my best.`,
          tone: 'One-way deal',
          quality: 'mixed',
          effects: { accountability: -1, nextSteps: 1 },
          coachNote: `Priya agreed to something precise and asked for something precise back, and got a maybe. That asymmetry is usually what wears an agreement out.`,
          next: 'end:one_sided',
        },
      ],
    },
  },

  endings: {
    clear_boundary: {
      id: 'clear_boundary',
      tone: 'strong',
      title: 'A boundary you can both use',
      action: 'Priya writes something on the back of their hand and grins.',
      line: `Two o'clock. Right. I'll stop ambushing you at ten to five.`,
      summary: `You said no to tonight without saying no to Priya, and you both left with a rule specific enough to follow next week. The relationship is intact and so is your evening.`,
    },
    one_sided: {
      id: 'one_sided',
      tone: 'partial',
      title: 'A rule only they have to keep',
      action: `Priya nods, and doesn't quite meet your eye.`,
      line: `Sure. Two o'clock. I'll make it work.`,
      summary: `You got the boundary you needed. Priya asked for one small thing back and didn't get it, which is the kind of detail that decides whether a rule survives a genuinely bad week.`,
    },
    vague: {
      id: 'vague',
      tone: 'partial',
      title: 'Ended without a rule',
      action: 'Priya picks up their laptop, already half somewhere else.',
      line: `Yeah — I'll try to give you more warning.`,
      summary: `Civil, and nothing changed. "More notice where I can" describes what was already happening, so next Thursday at 4:40 will look much like this one.`,
    },
    cold_win: {
      id: 'cold_win',
      tone: 'poor',
      title: 'Boundary held, relationship bruised',
      action: 'Priya is polite all the way out of the room.',
      line: `Understood. I'll put it in writing next time.`,
      summary: `The 4pm asks will stop. So will the informal goodwill — you have turned a colleague who came to you directly into one who files requests, and you will notice that the next time you need something at short notice.`,
    },
    doormat: {
      id: 'doormat',
      tone: 'poor',
      title: 'The pattern continues',
      action: 'Priya is already typing as they walk away.',
      line: `You're a star. I'll send it over in five.`,
      summary: `Tonight's work is yours and nothing was said about the pattern. The next request will arrive on exactly the same terms, and it will be slightly harder to refuse than this one was.`,
    },
  },
};
