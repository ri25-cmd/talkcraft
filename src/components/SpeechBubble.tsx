import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Avatar, Badge, type BadgeTone } from './ui';
import { MOOD_LABEL, type Mood } from '@/content/types';
import { colors, radius, spacing, type } from '@/lib/theme';

const MOOD_TONE: Record<Mood, BadgeTone> = {
  rushed: 'neutral',
  guarded: 'caution',
  defensive: 'critical',
  closed: 'critical',
  open: 'accent',
  warm: 'positive',
};

/**
 * One line from the colleague. Fades in on each new beat so the conversation
 * reads as something arriving rather than a wall of text appearing at once.
 */
export function SpeechBubble({
  name,
  initials,
  mood,
  action,
  line,
  /** Changing this key replays the entrance animation. */
  animationKey,
}: {
  name: string;
  initials: string;
  mood: Mood;
  action?: string;
  line: string;
  animationKey: string;
}) {
  // Created once, and deliberately not a ref: the value is read during render.
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 320,
      useNativeDriver: true,
    }).start();
  }, [animationKey, progress]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });

  return (
    <Animated.View style={{ opacity: progress, transform: [{ translateY }] }}>
      <View style={styles.header}>
        <Avatar initials={initials} />
        <View style={styles.headerText}>
          <Text style={styles.name}>{name}</Text>
          <Badge label={MOOD_LABEL[mood]} tone={MOOD_TONE[mood]} />
        </View>
      </View>

      {action ? <Text style={styles.action}>{action}</Text> : null}

      <View style={styles.bubble}>
        <Text style={styles.line}>{line}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  headerText: {
    gap: spacing.xs,
    flexShrink: 1,
  },
  name: {
    ...type.subheading,
    color: colors.text,
  },
  action: {
    ...type.small,
    color: colors.textFaint,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
  },
  bubble: {
    backgroundColor: colors.speech,
    borderRadius: radius.lg,
    borderTopLeftRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  line: {
    ...type.body,
    fontSize: 17,
    lineHeight: 26,
    color: colors.text,
  },
});
