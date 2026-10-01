import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Choice } from '@/content/types';
import { colors, radius, spacing, type } from '@/lib/theme';

/**
 * One response the user can give.
 *
 * Only the words are shown. How strong a response is stays hidden until the
 * debrief — judging that in the moment is the whole exercise, and labelling
 * the options would give the answer away.
 */
export function ChoiceCard({
  choice,
  index,
  onPress,
  disabled,
  /** Marks the response chosen last time, when replaying a moment. */
  previouslyChosen,
}: {
  choice: Choice;
  index: number;
  onPress: (choice: Choice) => void;
  disabled?: boolean;
  previouslyChosen?: boolean;
}) {
  return (
    <Pressable
      onPress={() => onPress(choice)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`Option ${index + 1}. ${choice.text}`}
      accessibilityHint={
        previouslyChosen
          ? 'This is what you said last time'
          : 'Say this and continue the conversation'
      }
      style={({ pressed }) => [
        styles.card,
        previouslyChosen ? styles.previous : null,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
      ]}
    >
      <View style={styles.row}>
        <Text style={styles.index}>{index + 1}</Text>
        <Text style={styles.text}>{choice.text}</Text>
      </View>
      {previouslyChosen ? (
        <Text style={styles.previousLabel}>What you said last time</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  previous: {
    borderColor: colors.borderStrong,
    borderStyle: 'dashed',
  },
  pressed: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.accent,
  },
  disabled: {
    opacity: 0.5,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  index: {
    ...type.small,
    color: colors.accentText,
    fontWeight: '700',
    minWidth: 16,
    marginTop: 2,
  },
  text: {
    ...type.body,
    color: colors.text,
    flex: 1,
  },
  previousLabel: {
    ...type.label,
    color: colors.textFaint,
    marginLeft: 28,
  },
});
