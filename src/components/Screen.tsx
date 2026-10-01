import React from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, type } from '@/lib/theme';

/**
 * Page chrome: safe areas, consistent horizontal rhythm, an optional back bar
 * and an optional sticky footer that sits above the home indicator.
 *
 * Native stack headers are switched off app-wide so that every screen shares
 * this one treatment rather than two competing header styles.
 */
export function Screen({
  children,
  title,
  onBack,
  backLabel = 'Back',
  footer,
  scroll = true,
  contentStyle,
}: {
  children: React.ReactNode;
  title?: string;
  onBack?: () => void;
  backLabel?: string;
  footer?: React.ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();

  const body = (
    <View style={[styles.content, contentStyle]}>{children}</View>
  );

  return (
    <View style={styles.root}>
      <View style={{ height: insets.top }} />

      {onBack ? (
        <View style={styles.navBar}>
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel={backLabel}
            hitSlop={12}
            style={({ pressed }) => [styles.backButton, pressed ? styles.backPressed : null]}
          >
            <Text style={styles.backChevron}>{'‹'}</Text>
            <Text style={styles.backText}>{backLabel}</Text>
          </Pressable>
          {title ? (
            <Text style={styles.navTitle} numberOfLines={1}>
              {title}
            </Text>
          ) : null}
        </View>
      ) : null}

      {scroll ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: footer ? spacing.lg : insets.bottom + spacing.xxl },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {body}
        </ScrollView>
      ) : (
        <View style={styles.scroll}>{body}</View>
      )}

      {footer ? (
        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, spacing.lg) },
          ]}
        >
          {footer}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  navBar: {
    height: 48,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: spacing.sm,
  },
  backPressed: {
    backgroundColor: colors.surface,
  },
  backChevron: {
    color: colors.accentText,
    fontSize: 26,
    lineHeight: Platform.OS === 'ios' ? 28 : 30,
    marginTop: Platform.OS === 'ios' ? -2 : -4,
  },
  backText: {
    ...type.body,
    color: colors.accentText,
  },
  navTitle: {
    ...type.small,
    color: colors.textFaint,
    flex: 1,
    textAlign: 'right',
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
});
