import type { Conversation } from './types';

/**
 * "Giving feedback to a teammate who repeatedly misses deadlines."
 *
 * Alex Moreno (they/them) is a competent senior engineer who is genuinely
 * overloaded and genuinely has not told anyone. They are not a villain and not
 * a pushover: they push back hard on a vague opening, concede real ground when
 * the manager concedes some first, and go quietly compliant if talked over.
 *
 * Every branch below is hand-written. Dialogue is in template literals only so
 * that apostrophes and speech marks read naturally in the source.
 */
export const missedDeadlinesConversation: Conversation = {
  startId: 'open',
  nodes: {
    open: {
      id: 'open',
      beat: 'The opening',
      mood: 'rushed',
      action: 'Alex drops into the chair opposite, laptop still half open.',
      line: `Hey — you said fifteen minutes? I've got the platform sync at four, so I'm all yours until then.`,
      choices: [
        {
          id: 'open_direct',
          text: `I want to talk about deadlines. The auth migration, the billing fix and the SDK upgrade all landed late — that's three sprints in a row. I'd like to understand what's going on.`,
          tone: 'Direct and specific',
          quality: 'strong',
          effects: { clarity: 2, specificity: 2 },
          coachNote: `You named the three tickets and the pattern. Alex now knows exactly what the conversation is about, which is the only way they can actually respond to it.`,
          next: 'defensive',
        },
        {
          id: 'open_soft',
          text: `No agenda really. Just wanted to check in, see how things are going for you at the moment.`,
          tone: 'Opens a door out',
          quality: 'weak',
          effects: { clarity: -2, specificity: -1 },
          coachNote: `You offered Alex an easy exit, and most people take it. The conversation you meant to have hasn't started yet.`,
          next: 'deflect',
        },
        {
          id: 'open_thirdparty',
          text: `So, a couple of people have mentioned that things have been slipping on your tickets. I wanted to hear your side of it.`,
          tone: 'Borrowed authority',
          quality: 'mixed',
          effects: { clarity: 1, specificity: -1, accountability: -1 },
          coachNote: `Putting it on "a couple of people" makes the problem sound like gossip rather than something you have seen yourself and are willing to own.`,
          next: 'third_party',
        },
      ],
    },

    deflect: {
      id: 'deflect',
      beat: 'The opening',
      mood: 'rushed',
      action: 'Alex closes the laptop halfway and glances at the clock.',
      line: `Yeah, all fine. Busy — but that's normal, right? Was that it? I can give the sync time back to Priya if we're done here.`,
      choices: [
        {
          id: 'deflect_recover',
          text: `Actually, no — I do have something specific. The auth migration, the billing fix and the SDK upgrade all landed after the date we agreed.`,
          tone: 'Late, but honest',
          quality: 'mixed',
          effects: { clarity: 1, specificity: 2 },
          coachNote: `Good recovery. The cost of the soft opening is that Alex now knows you were working up to something, which puts them on guard before you have said anything.`,
          next: 'defensive',
        },
        {
          id: 'deflect_soften',
          text: `Well — how did the SDK upgrade go in the end? It came in a bit later than we'd planned.`,
          tone: 'Hinting',
          quality: 'mixed',
          effects: { clarity: -1, specificity: 1 },
          coachNote: `One ticket instead of the pattern. A single late ticket is easy to explain away, and Alex will explain it away.`,
          next: 'third_party',
        },
        {
          id: 'deflect_abandon',
          text: `Yep, that was it. Thanks — go rescue your sync.`,
          tone: 'Lets it go',
          quality: 'weak',
          effects: { clarity: -2, nextSteps: -2 },
          coachNote: `The conversation didn't happen. Deadlines will keep slipping, and the next attempt is harder because the pattern will be longer.`,
          next: 'end:avoided',
        },
      ],
    },

    third_party: {
      id: 'third_party',
      beat: 'Who says?',
      mood: 'guarded',
      action: 'Alex sits back.',
      line: `A couple of people. Right. Is that Priya, or is that the client? Because if someone has a problem with my work, I'd rather they said it to me.`,
      choices: [
        {
          id: 'tp_own',
          text: `That's fair, and you're right to push back on it. Let me put it properly: I have seen three tickets land late across three sprints. That's my observation, not someone else's.`,
          tone: 'Owns the observation',
          quality: 'strong',
          effects: { accountability: 2, specificity: 2, clarity: 1 },
          coachNote: `Taking the observation back as your own removes the thing Alex was about to argue with, and puts the actual facts on the table instead.`,
          next: 'defensive',
        },
        {
          id: 'tp_vague',
          text: `It's not about any one person. There's just a general sense that things have been slipping.`,
          tone: 'Stays vague',
          quality: 'weak',
          effects: { specificity: -2, accountability: -1 },
          coachNote: `"A general sense" isn't something anyone can act on. Alex can't fix a feeling, and now suspects the conversation has a source you won't name.`,
          next: 'shut_down',
        },
        {
          id: 'tp_reset',
          text: `Nobody is complaining about you. I should have come to you directly instead of framing it that way — that's on me. Can we start again?`,
          tone: 'Resets honestly',
          quality: 'strong',
          effects: { accountability: 2, empathy: 1 },
          coachNote: `Naming your own misstep resets the conversation. It costs you very little and buys back the trust the framing had just spent.`,
          next: 'defensive',
        },
      ],
    },

    defensive: {
      id: 'defensive',
      beat: 'The pushback',
      mood: 'defensive',
      action: `Alex's jaw tightens. The laptop goes fully shut.`,
      line: `Three sprints. So this is a performance conversation. Great. Do you know I've been on call for two of them? And that I'm the only one who'll go near the auth migration, because everyone else is scared of it?`,
      choices: [
        {
          id: 'def_repair',
          text: `You're right, and I hadn't weighted that properly. Walk me through what the last three weeks actually looked like for you.`,
          tone: 'Concedes, then listens',
          quality: 'strong',
          effects: { empathy: 2, accountability: 2 },
          coachNote: `This is the repair. You conceded a true point without dropping the subject, then asked a question you didn't already know the answer to.`,
          next: 'opens',
        },
        {
          id: 'def_hold_line',
          text: `I'd like to keep this to the deadlines. The on-call rota is a separate conversation.`,
          tone: 'Sets the context aside',
          quality: 'weak',
          effects: { empathy: -2, clarity: 1 },
          coachNote: `Procedurally tidy, relationally expensive. Alex just offered you the reason the deadlines slipped and you filed it for later, so they stop offering reasons.`,
          next: 'shut_down',
        },
        {
          id: 'def_reassure',
          text: `It's not a performance conversation. I just want the tickets in on time, that's all.`,
          tone: 'Softens the stakes',
          quality: 'mixed',
          effects: { clarity: -2, empathy: 1 },
          coachNote: `Saying it isn't a performance conversation, when it partly is, leaves Alex guessing how serious this is. Being unclear about stakes is its own kind of unkindness.`,
          next: 'confused',
        },
      ],
    },

    confused: {
      id: 'confused',
      beat: 'So what is this?',
      mood: 'guarded',
      line: `OK. So what is this, then? Are you telling me there's a problem, or telling me there isn't? Because those need fairly different responses from me.`,
      choices: [
        {
          id: 'conf_level',
          text: `There is a problem, and it isn't a formal one. Three late tickets is a pattern I want to understand before it turns into something bigger. I'd much rather we sorted it here.`,
          tone: 'Names the stakes',
          quality: 'strong',
          effects: { clarity: 2, specificity: 1 },
          coachNote: `Clean. Alex now knows the size of the thing, which is the only way they can respond to it proportionately.`,
          next: 'opens',
        },
        {
          id: 'conf_minimise',
          text: `There isn't a problem. Honestly — forget I put it like that.`,
          tone: 'Retreats',
          quality: 'weak',
          effects: { clarity: -2, accountability: -1 },
          coachNote: `You raised something real and then withdrew it. Alex will remember that you flinched, which makes the next attempt harder to start.`,
          next: 'shut_down',
        },
      ],
    },

    shut_down: {
      id: 'shut_down',
      beat: 'The shutter comes down',
      mood: 'closed',
      action: `Alex's tone flattens out. Polite, and completely closed.`,
      line: `Understood. I'll make sure the dates get met. Is there anything else, or can I get to the sync?`,
      choices: [
        {
          id: 'shut_repair',
          text: `Hold on. I think I've handled this badly — I came in with a list instead of a question. The on-call load is real, and I do want to hear about it.`,
          tone: 'Late repair',
          quality: 'strong',
          effects: { accountability: 2, empathy: 2 },
          coachNote: `Repair is still available after a conversation has gone cold, and saying plainly what you got wrong is the quickest way back. It lands less well than it would have two minutes earlier, but it lands.`,
          next: 'repair_late',
        },
        {
          id: 'shut_accept',
          text: `Great — thanks. That's all I needed.`,
          tone: 'Takes the compliance',
          quality: 'weak',
          effects: { empathy: -2, nextSteps: -1 },
          coachNote: `You got agreement without understanding. Alex will hit the next date or quietly miss it, and either way you won't hear about it in advance.`,
          next: 'end:compliance',
        },
        {
          id: 'shut_press',
          text: `Before you go — I do need those dates met. Can I take that as a commitment?`,
          tone: 'Presses for the words',
          quality: 'mixed',
          effects: { nextSteps: 1, empathy: -1 },
          coachNote: `You secured the commitment. You didn't secure the thing that makes a commitment true, which is Alex telling you early when it is about to break.`,
          next: 'end:compliance',
        },
      ],
    },

    repair_late: {
      id: 'repair_late',
      beat: 'Thawing',
      mood: 'guarded',
      action: 'Alex hesitates, then sits back down properly.',
      line: `...Alright. Yeah. The rota has been brutal. But honestly, that's not the whole of it either.`,
      choices: [
        {
          id: 'rl_listen',
          text: `Go on.`,
          tone: 'Makes space',
          quality: 'strong',
          effects: { empathy: 2 },
          coachNote: `Two words, and Alex keeps talking. Silence after someone half-admits something is usually worth more than a follow-up question.`,
          next: 'opens',
        },
        {
          id: 'rl_fill',
          text: `Well, look — whatever it is, we can work around it. Let's just get the next sprint clean.`,
          tone: 'Fills the silence',
          quality: 'weak',
          effects: { empathy: -1, nextSteps: -1 },
          coachNote: `Alex was about to tell you the real cause and you talked over it. You leave with the symptom and without the reason.`,
          next: 'end:vague',
        },
      ],
    },

    opens: {
      id: 'opens',
      beat: 'The real reason',
      mood: 'open',
      action: 'Alex looks at the table for a second.',
      line: `The migration was scoped at five days. It's twelve, easily — the old service is full of things nobody documented. And I kept thinking I'd claw it back by Friday, and then Friday kept moving. I should have told you in week one. I didn't want to be the person who couldn't handle it.`,
      choices: [
        {
          id: 'op_commit',
          text: `Thank you for telling me that — I know it isn't an easy thing to say. Here's what I need: when a date is at risk, I want to hear it the day you know, not the Friday it slips. Can you commit to that?`,
          tone: 'Acknowledges, then specifies',
          quality: 'strong',
          effects: { empathy: 2, clarity: 2, nextSteps: 2 },
          coachNote: `You recognised what it cost Alex to say that, then asked for one concrete, checkable behaviour. That pairing is what makes a commitment hold.`,
          next: 'commit',
        },
        {
          id: 'op_vague',
          text: `I appreciate the honesty. Let's keep an eye on it and see how next sprint goes.`,
          tone: 'Makes no ask',
          quality: 'weak',
          effects: { empathy: 1, nextSteps: -2 },
          coachNote: `Warm, and it changes nothing. "Keep an eye on it" gives Alex no new behaviour, so next sprint will look like the last three.`,
          next: 'end:vague',
        },
        {
          id: 'op_ask',
          text: `That's useful to know. What would actually help here?`,
          tone: 'Hands it back',
          quality: 'mixed',
          effects: { empathy: 1, nextSteps: 0 },
          coachNote: `A generous question, but you asked it instead of saying what you need. Alex will answer about resourcing, and your own ask may never get made.`,
          next: 'asks_for_help',
        },
      ],
    },

    asks_for_help: {
      id: 'asks_for_help',
      beat: 'The ask comes back',
      mood: 'open',
      line: `Take the migration off me, or put someone on it with me. That's what would help. I don't think I can carry that, the rota and the sprint work at the same time.`,
      choices: [
        {
          id: 'afh_trade',
          text: `I'll put Dev on the migration with you from Monday. In return I need the early warning — the day a date looks at risk, not the Friday. Deal?`,
          tone: 'Trades concretely',
          quality: 'strong',
          effects: { nextSteps: 2, clarity: 2, accountability: 1 },
          coachNote: `You answered a specific request with something specific, and attached your own ask to it. Both of you now owe each other something you can check.`,
          next: 'end:clear_agreement',
        },
        {
          id: 'afh_defer',
          text: `Let me see what I can do about resourcing and I'll come back to you.`,
          tone: 'Defers',
          quality: 'weak',
          effects: { nextSteps: -1, accountability: -1 },
          coachNote: `Alex made a specific request and got a maybe. Nothing is different by Monday, and neither of you agreed to change anything.`,
          next: 'end:vague',
        },
      ],
    },

    commit: {
      id: 'commit',
      beat: 'Closing',
      mood: 'warm',
      action: 'Alex nods, slowly.',
      line: `Yeah. I can do that. Can we look at the rota, though? I genuinely don't think it's only hitting me.`,
      choices: [
        {
          id: 'com_take',
          text: `Send me the current rota and I'll come back to you on it before Thursday.`,
          tone: 'Takes a dated action',
          quality: 'strong',
          effects: { accountability: 2, nextSteps: 2 },
          coachNote: `You put a date on your own commitment. That signals accountability runs both ways, which is most of what makes Alex's early-warning promise real.`,
          next: 'end:clear_agreement',
        },
        {
          id: 'com_park',
          text: `Let's park the rota for now and stay focused on the deadlines.`,
          tone: 'One-way agreement',
          quality: 'mixed',
          effects: { accountability: -1, nextSteps: 1 },
          coachNote: `You have Alex's commitment and gave nothing back on the thing they raised. It will hold for a sprint or two, and then quietly stop holding.`,
          next: 'end:agreement_no_trust',
        },
      ],
    },
  },

  endings: {
    clear_agreement: {
      id: 'clear_agreement',
      tone: 'strong',
      title: 'Clear agreement',
      action: `Alex picks up the laptop, but they aren't rushing now.`,
      line: `Right — I'll flag anything at risk the day I see it. And I'll send you the rota tonight.`,
      summary: `Alex told you the real cause, and you both left with one specific thing to do. The early-warning habit has a decent chance of surviving contact with the next sprint.`,
    },
    agreement_no_trust: {
      id: 'agreement_no_trust',
      tone: 'partial',
      title: 'Agreement, one way',
      action: 'Alex stands — agreeable, and a little flat.',
      line: `Sure. I'll flag things earlier.`,
      summary: `You got the commitment you asked for. Because you offered nothing back on the workload Alex raised, it is a promise made under pressure rather than a shared plan.`,
    },
    compliance: {
      id: 'compliance',
      tone: 'poor',
      title: 'Compliance, not agreement',
      action: 'Alex is already at the door.',
      line: `Fine. The dates will get met.`,
      summary: `Alex agreed to the dates and told you nothing about why they were slipping. You have no early warning, and Alex has one more reason not to raise the next problem.`,
    },
    vague: {
      id: 'vague',
      tone: 'partial',
      title: 'Ended without an ask',
      action: 'Alex nods, and the conversation trails off.',
      line: `Yeah. OK. I'll try to be better on the dates.`,
      summary: `The conversation was decent and nothing specific was agreed. "Try to be better" is not a behaviour either of you can check next sprint.`,
    },
    avoided: {
      id: 'avoided',
      tone: 'poor',
      title: 'Conversation not had',
      action: 'Alex is gone in under a minute.',
      line: `Cool. See you at stand-up.`,
      summary: `Nothing was raised, so nothing changes. The pattern will be four sprints long next time you sit down, and harder to open.`,
    },
  },
};
