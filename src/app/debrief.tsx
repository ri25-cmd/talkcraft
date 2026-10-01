import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { EmptyState } from '@/components/StateView';
import { Badge, Card, Divider, Eyebrow, Meter, Quote, type BadgeTone } from '@/components/ui';
import { getScenario } from '@/content/scenarios';
import type { EndingTone } from '@/content/types';
import { BAND_LABEL, buildDebrief, headlineFor, type SkillBand, type SkillResult } from '@/lib/debrief';
import { colors, radius, spacing, type } from '@/lib/theme';
import { usePractice, type RetryComparison } from '@/state/practice';

const ENDING_TONE: Record<EndingTone, BadgeTone> = {
  strong: 'positive',
  partial: 'caution',
  poor: 'critical',
};

const BAND_TONE: Record<SkillBand, BadgeTone> = {
  strong: 'positive',
  solid: 'positive',
  mixed: 'caution',
  weak: 'critical',
  untested: 'neutral',
};

export default function DebriefScreen() {
  const router = useRouter();
  const { lastRun, comparison, beginRetry, commitRun, endSession } = usePractice();

  const scenario = getScenario(lastRun?.scenarioId);
  const conversation = scenario?.conversation;

  const debrief = useMemo(() => {
    if (!conversation || !lastRun) return undefined;
    return buildDebrief(conversation, lastRun);
  }, [conversation, lastRun]);

  // Save the finished run exactly once. Keyed on the run's timestamp so a
  // re-render never writes a duplicate, and a genuinely new run always writes.
  const savedAt = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!lastRun || !scenario || !debrief) return;
    if (savedAt.current === lastRun.finishedAt) return;
    savedAt.current = lastRun.finishedAt;

    void commitRun({
      scenarioId: scenario.id,
      scenarioTitle: scenario.title,
      endingId: debrief.ending.id,
      endingTitle: debrief.ending.title,
      headline: headlineFor(debrief),
      finishedAt: lastRun.finishedAt,
      turns: lastRun.turns,
      wasRetry: Boolean(comparison),
    }).catch(() => {
      // Saving is best-effort: a storage failure must not block the debrief.
      // The home screen surfaces its own error state if the store is broken.
    });
  }, [lastRun, scenario, debrief, comparison, commitRun]);

  if (!lastRun || !scenario || !debrief) {
    return (
      <Screen title="Debrief" onBack={() => router.back()}>
        <EmptyState
          title="No conversation to review"
          body="A debrief is built from a conversation you have just finished. Play one through and it will appear here."
          action={{ label: 'Choose a scenario', onPress: () => router.dismissTo('/scenarios') }}
        />
      </Screen>
    );
  }

  const { ending, missed, skills, strengths, noStrengthsNote, turnCount } = debrief;

  const retryThatMoment = () => {
    if (!missed) return;
    beginRetry({
      scenarioId: scenario.id,
      nodeId: missed.nodeId,
      beat: missed.beat,
      previousChoiceId: missed.yourChoiceId,
      previousText: missed.yourLine,
      previousEnding: { id: ending.id, title: ending.title, tone: ending.tone },
    });
    // The practice screen is still on the stack beneath this one; going back
    // to it picks up the session that beginRetry has just rewound.
    router.back();
  };

  const finish = () => {
    endSession();
    router.dismissTo('/');
  };

  return (
    <Screen
      title={scenario.title}
      onBack={() => router.back()}
      backLabel="Conversation"
      footer={
        <>
          {missed ? (
            <Button
              label="Try that moment again"
              caption={`Replay "${missed.beat}" with a different response`}
              onPress={retryThatMoment}
            />
          ) : null}
          <Button label="Done" variant={missed ? 'ghost' : 'primary'} onPress={finish} />
        </>
      }
    >
      <Text style={styles.heading}>How that went</Text>
      <Text style={styles.subheading}>
        Everything below comes from the {turnCount}{' '}
        {turnCount === 1 ? 'response you gave' : 'responses you gave'} in this conversation, and
        from the other options that were on the screen at the same time. It is a read on the
        choices, not on you.
      </Text>

      {comparison ? <ComparisonCard comparison={comparison} /> : null}

      <Section label="Where it landed">
        <Card>
          <Badge label={ending.title} tone={ENDING_TONE[ending.tone]} />
          <Text style={styles.endingSummary}>{ending.summary}</Text>
        </Card>
      </Section>

      <Section label="What you handled well">
        {strengths.length > 0 ? (
          <View style={styles.stack}>
            {strengths.map((s, i) => (
              <Card key={`${s.beat}-${i}`}>
                <Text style={styles.momentBeat}>
                  {s.beat} · {s.tone}
                </Text>
                <Quote label="You said" text={s.line} tone="positive" />
                <Text style={styles.note}>{s.note}</Text>
              </Card>
            ))}
          </View>
        ) : (
          <Card>
            <Text style={styles.note}>{noStrengthsNote}</Text>
          </Card>
        )}
      </Section>

      {missed ? (
        <Section label="One missed opportunity">
          <Card>
            <Text style={styles.momentBeat}>{missed.beat}</Text>
            <Quote label={`${scenario.counterpart.name} said`} text={missed.promptLine} />

            <Divider style={styles.innerDivider} />

            <Quote label="You said" text={missed.yourLine} tone="caution" />
            <Text style={styles.note}>{missed.yourNote}</Text>

            <Divider style={styles.innerDivider} />

            <Quote label="A stronger option you had" text={missed.betterLine} tone="positive" />
            <Text style={styles.note}>{missed.betterNote}</Text>
          </Card>
        </Section>
      ) : (
        <Section label="Missed opportunities">
          <Card>
            <Text style={styles.note}>
              At every turn you picked the strongest response that was available. There is no
              missed moment to replay from this run — try a different route through the
              conversation to see how else it can go.
            </Text>
          </Card>
        </Section>
      )}

      <Section label="What the debrief looks at">
        <Text style={styles.sectionIntro}>
          These describe what your responses did in this conversation. They are not a test score
          and they say nothing about you as a manager beyond these few minutes.
        </Text>
        <View style={styles.stack}>
          {skills.map((skill) => (
            <SkillRow key={skill.key} skill={skill} />
          ))}
        </View>
      </Section>
    </Screen>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Eyebrow>{label}</Eyebrow>
      {children}
    </View>
  );
}

function SkillRow({ skill }: { skill: SkillResult }) {
  const tone = BAND_TONE[skill.band];
  return (
    <Card>
      <View style={styles.skillHeader}>
        <Text style={styles.skillLabel}>{skill.label}</Text>
        <Badge label={BAND_LABEL[skill.band]} tone={tone} />
      </View>
      {skill.band === 'untested' ? null : <Meter fill={skill.fill} tone={tone} />}
      <Text style={styles.skillBlurb}>{skill.blurb}</Text>
      <Text style={styles.note}>{skill.note}</Text>
    </Card>
  );
}

function ComparisonCard({ comparison }: { comparison: RetryComparison }) {
  const changed = comparison.before.ending.id !== comparison.after.ending.id;

  return (
    <Card raised style={styles.comparison}>
      <Badge label="Replay comparison" tone="accent" />
      <Text style={styles.comparisonBeat}>{comparison.beat}</Text>

      <Quote label="First time you said" text={comparison.before.text} tone="caution" />
      <Text style={styles.comparisonEnding}>
        Ended at: <Text style={styles.comparisonEndingValue}>{comparison.before.ending.title}</Text>
      </Text>

      <Divider style={styles.innerDivider} />

      <Quote label="This time you said" text={comparison.after.text} tone="positive" />
      <Text style={styles.comparisonEnding}>
        Ended at: <Text style={styles.comparisonEndingValue}>{comparison.after.ending.title}</Text>
      </Text>

      <Text style={styles.note}>
        {changed
          ? 'Changing that one response changed where the conversation finished.'
          : 'The conversation finished in the same place. The route there was different, but the outcome was not.'}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  heading: {
    ...type.title,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  subheading: {
    ...type.small,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionIntro: {
    ...type.small,
    color: colors.textFaint,
    marginBottom: spacing.md,
  },
  stack: {
    gap: spacing.md,
  },
  endingSummary: {
    ...type.body,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  momentBeat: {
    ...type.label,
    color: colors.textFaint,
    marginBottom: spacing.md,
  },
  note: {
    ...type.small,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  innerDivider: {
    marginVertical: spacing.lg,
  },
  skillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  skillLabel: {
    ...type.subheading,
    color: colors.text,
    flexShrink: 1,
  },
  skillBlurb: {
    ...type.small,
    color: colors.textFaint,
    marginTop: spacing.md,
  },
  comparison: {
    marginBottom: spacing.xxl,
    borderRadius: radius.xl,
  },
  comparisonBeat: {
    ...type.heading,
    color: colors.text,
    marginVertical: spacing.md,
  },
  comparisonEnding: {
    ...type.small,
    color: colors.textFaint,
    marginTop: spacing.sm,
  },
  comparisonEndingValue: {
    color: colors.text,
    fontWeight: '600',
  },
});
