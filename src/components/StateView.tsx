import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { colors, radius, spacing, type } from '@/lib/theme';

/**
 * The three states every data-backed surface needs. Kept in one place so
 * loading, empty and error never drift apart visually.
 */

export function LoadingState({ label = 'Loading' }: { label?: string }) {
  return (
    <View style={styles.block} accessibilityRole="progressbar" accessibilityLabel={label}>
      <ActivityIndicator color={colors.accentText} />
      <Text style={styles.body}>{label}</Text>
    </View>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { label: string; onPress: () => void };
}) {
  return (
    <View style={styles.block}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {action ? (
        <Button label={action.label} onPress={action.onPress} variant="secondary" />
      ) : null}
    </View>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  body,
  onRetry,
}: {
  title?: string;
  body: string;
  onRetry?: () => void;
}) {
  return (
    <View style={[styles.block, styles.errorBlock]} accessibilityRole="alert">
      <Text style={[styles.title, styles.errorTitle]}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {onRetry ? <Button label="Try again" onPress={onRetry} variant="secondary" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'flex-start',
  },
  errorBlock: {
    borderColor: colors.criticalSurface,
    backgroundColor: colors.criticalSurface,
  },
  title: {
    ...type.subheading,
    color: colors.text,
  },
  errorTitle: {
    color: colors.critical,
  },
  body: {
    ...type.small,
    color: colors.textMuted,
  },
});
