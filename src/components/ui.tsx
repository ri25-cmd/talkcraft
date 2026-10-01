import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, spacing, type } from '@/lib/theme';

/** Small uppercase section label. Always paired with a heading beneath it. */
export function Eyebrow({ children, tint }: { children: string; tint?: string }) {
  return <Text style={[styles.eyebrow, tint ? { color: tint } : null]}>{children.toUpperCase()}</Text>;
}

export function Card({
  children,
  style,
  raised,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  raised?: boolean;
}) {
  return (
    <View style={[styles.card, raised ? styles.cardRaised : null, style]}>{children}</View>
  );
}

export type BadgeTone = 'neutral' | 'accent' | 'positive' | 'caution' | 'critical';

const BADGE_COLORS: Record<BadgeTone, { bg: string; fg: string }> = {
  neutral: { bg: colors.surfaceRaised, fg: colors.textMuted },
  accent: { bg: colors.accentSurface, fg: colors.accentText },
  positive: { bg: colors.positiveSurface, fg: colors.positive },
  caution: { bg: colors.cautionSurface, fg: colors.caution },
  critical: { bg: colors.criticalSurface, fg: colors.critical },
};

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: BadgeTone }) {
  const palette = BADGE_COLORS[tone];
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.badgeText, { color: palette.fg }]}>{label}</Text>
    </View>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.divider, style]} />;
}

/**
 * A qualitative meter. It is deliberately unlabelled with a number — the fill
 * shows relative position and the sentence next to it carries the meaning.
 */
export function Meter({ fill, tone }: { fill: number; tone: BadgeTone }) {
  const clamped = Math.min(1, Math.max(0, fill));
  return (
    <View
      style={styles.meterTrack}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      <View
        style={[
          styles.meterFill,
          { width: `${Math.max(4, clamped * 100)}%`, backgroundColor: BADGE_COLORS[tone].fg },
        ]}
      />
    </View>
  );
}

/** Initials only. No invented photographs of people who do not exist. */
export function Avatar({ initials, size = 44 }: { initials: string; size?: number }) {
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.avatarText, { fontSize: size * 0.36 }]}>{initials}</Text>
    </View>
  );
}

/** A labelled block of quoted speech, used throughout the debrief. */
export function Quote({
  label,
  text,
  tone = 'neutral',
}: {
  label: string;
  text: string;
  tone?: BadgeTone;
}) {
  const palette = BADGE_COLORS[tone];
  return (
    <View style={[styles.quote, { borderLeftColor: palette.fg }]}>
      <Text style={[styles.quoteLabel, { color: palette.fg }]}>{label.toUpperCase()}</Text>
      <Text style={styles.quoteText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    ...type.label,
    color: colors.textFaint,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  cardRaised: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  badgeText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  meterTrack: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceRaised,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  avatar: {
    backgroundColor: colors.accentSurface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.accentText,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  quote: {
    borderLeftWidth: 3,
    paddingLeft: spacing.lg,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  quoteLabel: {
    ...type.label,
  },
  quoteText: {
    ...type.body,
    color: colors.text,
    fontStyle: 'italic',
  },
});
