import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateView';
import { Badge, Card, Divider, Eyebrow } from '@/components/ui';
import { describeAllowance, evaluateAccess } from '@/lib/access';
import { colors, spacing, type } from '@/lib/theme';
import { completedCount, latestRun, type StoredRun } from '@/lib/progress';
import { useEntitlements } from '@/state/entitlements';
import { usePractice } from '@/state/practice';

export default function HomeScreen() {
  const router = useRouter();
  const { progress, progressStatus, reloadProgress, resetProgress } = usePractice();
  const { isPremium, openCustomerCenter } = useEntitlements();

  const completed = completedCount(progress);
  const latest = latestRun(progress);
  const access = evaluateAccess(progress, isPremium);

  // Free users see the most recent debrief; premium keeps the whole history.
  const history = access.canSeeFullHistory ? progress.runs.filter((r) => !r.wasRetry) : [];

  return (
    <Screen
      footer={
        <Button
          label={access.canPractise ? 'Start practising' : 'See TalkCraft Pro'}
          caption={
            access.canPractise
              ? 'Pick a conversation and play it through'
              : describeAllowance(access)
          }
          onPress={() => router.push(access.canPractise ? '/scenarios' : '/paywall')}
        />
      }
    >
      <View style={styles.masthead}>
        <Text style={styles.wordmark}>TalkCraft</Text>
      </View>

      <Text style={styles.headline}>Hard conversations.{'\n'}Better outcomes.</Text>

      <Text style={styles.supporting}>
        Practise the workplace conversations you have been putting off — giving hard feedback,
        holding a boundary, pushing back on a client. You play the manager, the other person
        reacts to what you actually say, and afterwards you get a plain-language read on how it
        went.
      </Text>

      <View style={styles.section}>
        <Eyebrow>Your progress</Eyebrow>

        {progressStatus === 'loading' ? (
          <LoadingState label="Reading your saved practices" />
        ) : progressStatus === 'error' ? (
          <ErrorState
            title="Couldn't read your progress"
            body="Your saved practices are stored on this device and could not be opened. You can still practise — this run just might not be saved."
            onRetry={reloadProgress}
          />
        ) : completed === 0 ? (
          <EmptyState
            title="No practices yet"
            body="Once you finish a conversation, your count and your most recent feedback will show up here. Nothing is sent anywhere — it is all stored on this device."
          />
        ) : (
          <Card>
            <View style={styles.statRow}>
              <View>
                <Text style={styles.statValue}>{completed}</Text>
                <Text style={styles.statLabel}>
                  {completed === 1 ? 'practice completed' : 'practices completed'}
                </Text>
              </View>
              <Badge
                label={describeAllowance(access)}
                tone={access.isPremium ? 'positive' : access.canPractise ? 'neutral' : 'caution'}
              />
            </View>

            {latest ? (
              <>
                <Divider style={styles.divider} />
                <Eyebrow>Latest feedback</Eyebrow>
                <Text style={styles.latestScenario}>{latest.scenarioTitle}</Text>
                <Text style={styles.latestHeadline}>{latest.headline}</Text>
                <Text style={styles.latestMeta}>{describeWhen(latest.finishedAt)}</Text>
              </>
            ) : null}

            {history.length > 1 ? (
              <>
                <Divider style={styles.divider} />
                <Eyebrow>Your practice history</Eyebrow>
                {history.slice(1).map((run) => (
                  <HistoryRow key={`${run.finishedAt}-${run.scenarioId}`} run={run} />
                ))}
              </>
            ) : null}
          </Card>
        )}
      </View>

      <View style={styles.spacer} />

      {isPremium ? (
        <Button
          label="Manage subscription"
          variant="ghost"
          onPress={() => {
            void openCustomerCenter();
          }}
          accessibilityHint="Opens the RevenueCat Customer Center to change, cancel or get help with your subscription"
        />
      ) : null}

      {completed > 0 ? (
        <Button
          label="Clear saved progress"
          variant="ghost"
          onPress={() => {
            void resetProgress();
          }}
          accessibilityHint="Deletes every practice saved on this device"
        />
      ) : null}
    </Screen>
  );
}

/** One earlier practice. Premium only — free users see the latest run alone. */
function HistoryRow({ run }: { run: StoredRun }) {
  return (
    <View style={styles.historyRow}>
      <View style={styles.historyText}>
        <Text style={styles.historyScenario} numberOfLines={1}>
          {run.scenarioTitle}
        </Text>
        <Text style={styles.historyEnding} numberOfLines={1}>
          {run.endingTitle}
        </Text>
      </View>
      <Text style={styles.historyWhen}>{describeWhen(run.finishedAt)}</Text>
    </View>
  );
}

/** Relative day labels without pulling in a date library. */
function describeWhen(timestamp: number): string {
  const then = new Date(timestamp);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  const time = then.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  if (timestamp >= startOfToday) return `Today, ${time}`;
  if (timestamp >= startOfToday - dayMs) return `Yesterday, ${time}`;
  return then.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

const styles = StyleSheet.create({
  masthead: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  wordmark: {
    ...type.subheading,
    color: colors.text,
    letterSpacing: 0.4,
  },
  headline: {
    ...type.display,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  supporting: {
    ...type.body,
    color: colors.textMuted,
    marginBottom: spacing.xxl,
  },
  section: {
    marginBottom: spacing.lg,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  statValue: {
    ...type.display,
    color: colors.accentText,
  },
  statLabel: {
    ...type.small,
    color: colors.textMuted,
  },
  divider: {
    marginVertical: spacing.lg,
  },
  latestScenario: {
    ...type.small,
    color: colors.textFaint,
    marginBottom: spacing.xs,
  },
  latestHeadline: {
    ...type.bodyMedium,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  latestMeta: {
    ...type.small,
    color: colors.textFaint,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  historyText: {
    flex: 1,
  },
  historyScenario: {
    ...type.small,
    color: colors.text,
  },
  historyEnding: {
    ...type.small,
    color: colors.textFaint,
  },
  historyWhen: {
    ...type.small,
    color: colors.textFaint,
  },
  spacer: {
    flex: 1,
    minHeight: spacing.lg,
  },
});
