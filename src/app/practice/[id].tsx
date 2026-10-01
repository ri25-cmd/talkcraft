import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect } from 'react';
import { Alert, BackHandler, Platform, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { ChoiceCard } from '@/components/ChoiceCard';
import { Screen } from '@/components/Screen';
import { SpeechBubble } from '@/components/SpeechBubble';
import { EmptyState, ErrorState } from '@/components/StateView';
import { Badge, Card, Eyebrow } from '@/components/ui';
import { getScenario } from '@/content/scenarios';
import type { Choice } from '@/content/types';
import { evaluateAccess } from '@/lib/access';
import { endingIdFromRef, isEndingRef } from '@/lib/conversation';
import { colors, spacing, type } from '@/lib/theme';
import { useEntitlements } from '@/state/entitlements';
import { usePractice } from '@/state/practice';

export default function PracticeScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, ensureSession, restart, advance, endSession, progress } = usePractice();
  const { isPremium } = useEntitlements();

  const scenario = getScenario(id);
  const conversation = scenario?.conversation;

  // The scenario list already gates on the free allowance; this covers arriving
  // here directly by deep link. A session that already exists is never blocked,
  // so replaying a moment and finishing a conversation in progress both work
  // after the allowance runs out.
  const outOfAllowance = !evaluateAccess(progress, isPremium).canPractise && !session;

  // Start a run for this scenario, unless one is already under way (which is
  // the case when arriving here from "Try that moment again").
  useEffect(() => {
    if (!scenario || !conversation) return;
    ensureSession(scenario.id, conversation.startId);
  }, [scenario, conversation, ensureSession]);

  // Plain lookups: a map access per render is cheaper than memoising it.
  const currentNodeId = session?.currentNodeId;
  const endingId = session?.endingId;
  const node = conversation && currentNodeId ? conversation.nodes[currentNodeId] : undefined;

  useEffect(() => {
    if (outOfAllowance) router.replace('/paywall');
  }, [outOfAllowance, router]);
  const ending = conversation && endingId ? conversation.endings[endingId] : undefined;

  const leave = useCallback(() => {
    endSession();
    router.dismissTo('/scenarios');
  }, [endSession, router]);

  const confirmExit = useCallback(() => {
    if (!session || session.turns.length === 0) {
      leave();
      return;
    }
    Alert.alert(
      'Leave this practice?',
      'The conversation so far will be discarded and nothing will be saved.',
      [
        { text: 'Keep going', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: leave },
      ],
    );
  }, [session, leave]);

  // Android's hardware back should ask the same question the Exit button does,
  // instead of silently throwing away a conversation that is under way.
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        const inProgress = session && session.turns.length > 0 && !session.endingId;
        if (!inProgress) return false;
        confirmExit();
        return true;
      });
      return () => sub.remove();
    }, [session, confirmExit]),
  );

  const confirmRestart = () => {
    if (!scenario || !conversation) return;
    if (!session || session.turns.length === 0) {
      restart(scenario.id, conversation.startId);
      return;
    }
    Alert.alert('Start this conversation again?', 'You will go back to the opening line.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Start again',
        style: 'destructive',
        onPress: () => restart(scenario.id, conversation.startId),
      },
    ]);
  };

  // ---- Failure states -------------------------------------------------

  if (!scenario) {
    return (
      <Screen title="Practice" onBack={() => router.back()}>
        <ErrorState
          title="Scenario not found"
          body={`There is no scenario with the id "${String(id)}". It may have been renamed.`}
          onRetry={() => router.replace('/scenarios')}
        />
      </Screen>
    );
  }

  if (!conversation) {
    return (
      <Screen title={scenario.title} onBack={() => router.back()}>
        <EmptyState
          title="Not built yet"
          body={`The dialogue for "${scenario.title}" has not been written yet, so there is nothing to practise here. Every other scenario in the list is playable.`}
          action={{ label: 'Back to scenarios', onPress: () => router.replace('/scenarios') }}
        />
      </Screen>
    );
  }

  const handleChoice = (choice: Choice) => {
    if (isEndingRef(choice.next)) {
      const endingId = endingIdFromRef(choice.next);
      const reached = conversation.endings[endingId];
      if (!reached) return; // Guarded by findBrokenLinks in development.
      advance({
        nodeId: node!.id,
        choiceId: choice.id,
        choiceText: choice.text,
        ending: { id: reached.id, title: reached.title, tone: reached.tone },
      });
      return;
    }
    advance({
      nodeId: node!.id,
      choiceId: choice.id,
      choiceText: choice.text,
      nextNodeId: choice.next,
    });
  };

  // ---- The conversation has finished ----------------------------------

  if (ending) {
    return (
      <Screen
        title={scenario.title}
        onBack={confirmExit}
        backLabel="Exit"
        footer={
          <>
            <Button label="See your coaching debrief" onPress={() => router.push('/debrief')} />
            <Button label="Start this conversation again" variant="ghost" onPress={confirmRestart} />
          </>
        }
      >
        <View style={styles.beatRow}>
          <Eyebrow>How it ended</Eyebrow>
        </View>

        <SpeechBubble
          name={scenario.counterpart.name}
          initials={scenario.counterpart.initials}
          mood={ending.tone === 'strong' ? 'warm' : ending.tone === 'partial' ? 'guarded' : 'closed'}
          action={ending.action}
          line={ending.line ?? ''}
          animationKey={`ending-${ending.id}`}
        />

        <Card style={styles.endingCard}>
          <Badge
            label={ending.title}
            tone={ending.tone === 'strong' ? 'positive' : ending.tone === 'partial' ? 'caution' : 'critical'}
          />
          <Text style={styles.endingSummary}>{ending.summary}</Text>
        </Card>
      </Screen>
    );
  }

  // ---- Waiting for the session to initialise --------------------------

  if (!node) {
    return (
      <Screen title={scenario.title} onBack={confirmExit} backLabel="Exit">
        <EmptyState
          title="Setting up the conversation"
          body="If this does not clear in a moment, go back and start the scenario again."
          action={{ label: 'Start again', onPress: confirmRestart }}
        />
      </Screen>
    );
  }

  // ---- The live conversation ------------------------------------------

  const exchangeNumber = (session?.turns.length ?? 0) + 1;
  const isReplay = Boolean(session?.retry);

  return (
    <Screen
      title={scenario.counterpart.name}
      onBack={confirmExit}
      backLabel="Exit"
      footer={
        <Button
          label="Start this conversation again"
          variant="ghost"
          onPress={confirmRestart}
          accessibilityHint="Discards this conversation and returns to the opening line"
        />
      }
    >
      <View style={styles.beatRow}>
        <Eyebrow>{`Exchange ${exchangeNumber} · ${node.beat}`}</Eyebrow>
        {isReplay ? <Badge label="Replaying this moment" tone="accent" /> : null}
      </View>

      <SpeechBubble
        name={scenario.counterpart.name}
        initials={scenario.counterpart.initials}
        mood={node.mood}
        action={node.action}
        line={node.line}
        animationKey={`${node.id}-${exchangeNumber}`}
      />

      <Text style={styles.prompt}>You say</Text>

      <View style={styles.choices}>
        {node.choices.map((choice, index) => (
          <ChoiceCard
            key={choice.id}
            choice={choice}
            index={index}
            onPress={handleChoice}
            previouslyChosen={
              isReplay &&
              session?.retry?.nodeId === node.id &&
              session.retry.previousChoiceId === choice.id
            }
          />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  beatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  prompt: {
    ...type.label,
    color: colors.textFaint,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  choices: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  endingCard: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  endingSummary: {
    ...type.body,
    color: colors.textMuted,
  },
});
