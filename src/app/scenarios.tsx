import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Avatar, Badge, Divider, Eyebrow } from '@/components/ui';
import { SCENARIOS, isPlayable } from '@/content/scenarios';
import type { Scenario } from '@/content/types';
import { describeAllowance, evaluateAccess } from '@/lib/access';
import { colors, radius, spacing, type } from '@/lib/theme';
import { useEntitlements } from '@/state/entitlements';
import { usePractice } from '@/state/practice';

export default function ScenariosScreen() {
  const router = useRouter();
  const { progress } = usePractice();
  const { isPremium } = useEntitlements();

  const access = evaluateAccess(progress, isPremium);

  // Every scenario stays open. What the free tier limits is how many practices
  // you can complete, so the paywall sits in front of starting another one —
  // never in front of a conversation already under way.
  const start = (scenarioId: string) => {
    if (!access.canPractise) router.push('/paywall');
    else router.push(`/practice/${scenarioId}`);
  };

  return (
    <Screen title="Scenarios" onBack={() => router.back()}>
      <Text style={styles.heading}>Choose a conversation</Text>
      <Text style={styles.intro}>
        You play a new manager in each of these. There is no script to follow and no single right
        answer — the other person responds to whichever line you pick.
      </Text>

      <Pressable
        onPress={() => router.push('/paywall')}
        accessibilityRole="button"
        accessibilityLabel={`${describeAllowance(access)}. View TalkCraft Pro options.`}
        style={({ pressed }) => [styles.allowance, pressed ? styles.allowancePressed : null]}
      >
        <Badge
          label={describeAllowance(access)}
          tone={access.isPremium ? 'positive' : access.canPractise ? 'accent' : 'caution'}
        />
        {!access.isPremium ? <Text style={styles.allowanceLink}>See TalkCraft Pro</Text> : null}
      </Pressable>

      <View style={styles.list}>
        {SCENARIOS.map((scenario) => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            locked={!access.canPractise}
            onPress={() => start(scenario.id)}
          />
        ))}
      </View>
    </Screen>
  );
}

function ScenarioCard({
  scenario,
  onPress,
  locked,
}: {
  scenario: Scenario;
  onPress: () => void;
  /** Free practices are used up — tapping opens the paywall instead. */
  locked?: boolean;
}) {
  const playable = isPlayable(scenario);

  return (
    <Pressable
      onPress={playable ? onPress : undefined}
      disabled={!playable}
      accessibilityRole="button"
      accessibilityLabel={scenario.title}
      accessibilityHint={
        !playable
          ? 'This scenario is not available to practise yet'
          : locked
            ? 'You have used your free practices. Opens premium options.'
            : `Practise this conversation with ${scenario.counterpart.name}`
      }
      accessibilityState={{ disabled: !playable }}
      style={({ pressed }) => [
        styles.card,
        pressed && playable ? styles.cardPressed : null,
        !playable ? styles.cardUnavailable : null,
      ]}
    >
      <View style={styles.cardHeader}>
        <Avatar initials={scenario.counterpart.initials} size={40} />
        <View style={styles.cardHeaderText}>
          <Text style={styles.counterpartName}>{scenario.counterpart.name}</Text>
          <Text style={styles.counterpartRole}>{scenario.counterpart.role}</Text>
        </View>
        {!playable ? (
          <Badge label="Not built yet" tone="caution" />
        ) : locked ? (
          <Badge label="Pro" tone="accent" />
        ) : (
          <Badge label={`${scenario.estimatedTurns} exchanges`} tone="neutral" />
        )}
      </View>

      <Text style={styles.cardTitle}>{scenario.title}</Text>
      <Text style={styles.cardDescription}>{scenario.description}</Text>

      <Divider style={styles.cardDivider} />

      <Eyebrow>Your objective</Eyebrow>
      <Text style={styles.objective}>{scenario.objective}</Text>

      {playable ? (
        <Text style={styles.cta}>
          {locked ? 'Unlock with TalkCraft Pro' : 'Start this conversation'}
        </Text>
      ) : (
        <Text style={styles.unavailableNote}>
          Written and scoped, but the dialogue for this one is not implemented yet — so it is not
          playable in this build.
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  heading: {
    ...type.title,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  intro: {
    ...type.body,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  allowance: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
  },
  allowancePressed: {
    opacity: 0.7,
  },
  allowanceLink: {
    ...type.small,
    color: colors.accentText,
    fontWeight: '600',
  },
  list: {
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  cardPressed: {
    borderColor: colors.accent,
    backgroundColor: colors.surfaceRaised,
  },
  cardUnavailable: {
    backgroundColor: 'transparent',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  cardHeaderText: {
    flex: 1,
  },
  counterpartName: {
    ...type.bodyMedium,
    color: colors.text,
  },
  counterpartRole: {
    ...type.small,
    color: colors.textFaint,
  },
  cardTitle: {
    ...type.heading,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  cardDescription: {
    ...type.body,
    color: colors.textMuted,
  },
  cardDivider: {
    marginVertical: spacing.lg,
  },
  objective: {
    ...type.small,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  cta: {
    ...type.bodyMedium,
    color: colors.accentText,
  },
  unavailableNote: {
    ...type.small,
    color: colors.textFaint,
    fontStyle: 'italic',
  },
});
