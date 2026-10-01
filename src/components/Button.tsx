import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, radius, spacing, type } from '@/lib/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  busy?: boolean;
  /** Supporting line under the label, e.g. "4 exchanges, about 3 minutes". */
  caption?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  busy,
  caption,
  style,
  accessibilityHint,
}: ButtonProps) {
  const inactive = disabled || busy;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={caption ? `${label}. ${caption}` : label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactive, busy: !!busy }}
      style={({ pressed }) => [
        styles.base,
        VARIANT_STYLE[variant],
        pressed && !inactive ? VARIANT_PRESSED[variant] : null,
        inactive ? styles.inactive : null,
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={variant === 'primary' ? colors.bg : colors.accentText} />
      ) : (
        <View style={styles.labels}>
          <Text style={[styles.label, VARIANT_TEXT[variant]]}>{label}</Text>
          {caption ? (
            <Text style={[styles.caption, VARIANT_CAPTION[variant]]}>{caption}</Text>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  labels: {
    alignItems: 'center',
    gap: 2,
  },
  label: {
    ...type.bodyMedium,
    fontWeight: '600',
    textAlign: 'center',
  },
  caption: {
    ...type.small,
    fontSize: 13,
    textAlign: 'center',
  },
  inactive: {
    opacity: 0.45,
  },
});

const VARIANT_STYLE: Record<ButtonVariant, ViewStyle> = {
  primary: { backgroundColor: colors.accent, borderColor: colors.accent },
  secondary: { backgroundColor: colors.surfaceRaised, borderColor: colors.borderStrong },
  ghost: { backgroundColor: 'transparent', borderColor: 'transparent', minHeight: 44 },
  danger: { backgroundColor: 'transparent', borderColor: colors.criticalSurface },
};

const VARIANT_PRESSED: Record<ButtonVariant, ViewStyle> = {
  primary: { backgroundColor: colors.accentPressed, borderColor: colors.accentPressed },
  secondary: { backgroundColor: colors.border },
  ghost: { backgroundColor: colors.surface },
  danger: { backgroundColor: colors.criticalSurface },
};

const VARIANT_TEXT = StyleSheet.create({
  primary: { color: '#08101F' },
  secondary: { color: colors.text },
  ghost: { color: colors.textMuted },
  danger: { color: colors.critical },
});

const VARIANT_CAPTION = StyleSheet.create({
  primary: { color: 'rgba(8, 16, 31, 0.72)' },
  secondary: { color: colors.textFaint },
  ghost: { color: colors.textFaint },
  danger: { color: colors.textFaint },
});
