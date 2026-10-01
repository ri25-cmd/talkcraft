import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { ErrorState, LoadingState } from '@/components/StateView';
import { Badge, Card, Divider, Eyebrow } from '@/components/ui';
import { FREE_PRACTICE_LIMIT } from '@/lib/access';
import type { OfferingTier, PurchasesPackage } from '@/lib/purchases';
import { colors, radius, spacing, type } from '@/lib/theme';
import { describeUnavailability, useEntitlements } from '@/state/entitlements';

/**
 * The TalkCraft Pro upgrade screen.
 *
 * The purchase itself happens on RevenueCat's own paywall, which is laid out in
 * the dashboard and presented natively. This screen is the entry point to it,
 * in the app's own design, and doubles as a fallback list if that paywall
 * cannot be shown.
 *
 * Nothing commercial is hard-coded: every price and product name comes from
 * RevenueCat, because anything written here would be a claim the store has not
 * agreed to.
 */
export default function PaywallScreen() {
  const router = useRouter();
  const {
    status,
    isPremium,
    tiers,
    offering,
    offeringStatus,
    offeringError,
    loadOffering,
    purchasing,
    restoring,
    presentingPaywall,
    buy,
    restore,
    openRevenueCatPaywall,
    openCustomerCenter,
    lastError,
    clearError,
    refresh,
  } = useEntitlements();

  const [notice, setNotice] = useState<string | null>(null);
  /** Shown only once RevenueCat's own paywall has failed to present. */
  const [showFallback, setShowFallback] = useState(false);
  const [chosen, setChosen] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'ready' && offeringStatus === 'idle') loadOffering();
  }, [status, offeringStatus, loadOffering]);

  const selected = chosen ?? tiers[0]?.pkg.identifier ?? null;

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const onOpenRevenueCatPaywall = async () => {
    setNotice(null);
    const result = await openRevenueCatPaywall();
    switch (result.kind) {
      case 'purchased':
      case 'restored':
        close();
        break;
      case 'cancelled':
        setNotice('Closed without subscribing. Nothing was charged.');
        break;
      case 'not-presented':
        setNotice('You already have TalkCraft Pro on this account.');
        break;
      case 'error':
        // Fall back to buying in-app rather than leaving a dead end.
        setShowFallback(true);
        break;
    }
  };

  const onBuy = async (pkg: PurchasesPackage) => {
    setNotice(null);
    const result = await buy(pkg);
    if (result === 'purchased') close();
    else if (result === 'cancelled') setNotice('Purchase cancelled. Nothing was charged.');
  };

  const onRestore = async () => {
    setNotice(null);
    clearError();
    const result = await restore();
    if (result === 'restored') close();
    else if (result === 'nothing-to-restore') {
      setNotice('No previous purchase was found on this store account.');
    }
  };

  const onManage = async () => {
    setNotice(null);
    await openCustomerCenter();
  };

  const busy = purchasing || restoring || presentingPaywall;

  return (
    <Screen title="TalkCraft Pro" onBack={close} backLabel="Close">
      <Text style={styles.heading}>Practise as much as you need</Text>
      <Text style={styles.subheading}>
        The free version includes {FREE_PRACTICE_LIMIT} full practice conversations. TalkCraft Pro
        removes that limit and keeps your whole practice history.
      </Text>

      <Card style={styles.benefits}>
        <Benefit
          title="Unlimited practice"
          body="Replay any scenario as many times as you like, and take different routes through the same conversation."
        />
        <Divider style={styles.benefitDivider} />
        <Benefit
          title="Your full history"
          body="Keep every debrief you have worked through, not just the most recent one."
        />
        <Divider style={styles.benefitDivider} />
        <Benefit
          title="All three scenarios"
          body="Missed deadlines, last-minute asks and out-of-scope client requests — included free and on Pro alike."
        />
      </Card>

      {isPremium ? (
        <View style={styles.section}>
          <Card style={styles.activeCard}>
            <Badge label="TalkCraft Pro active" tone="positive" />
            <Text style={styles.activeText}>
              Your subscription is active on this store account.
            </Text>
          </Card>
          <Button
            label="Manage subscription"
            variant="secondary"
            onPress={() => void onManage()}
            accessibilityHint="Opens the RevenueCat Customer Center to change, cancel or get help with your subscription"
            style={styles.manage}
          />
        </View>
      ) : status === 'loading' ? (
        <LoadingState label="Checking your subscription" />
      ) : status === 'unavailable' ? (
        <UnavailableCard onRetry={refresh} />
      ) : (
        <View style={styles.section}>
          <Button
            label="See plans and subscribe"
            caption="Opens the secure store checkout"
            busy={presentingPaywall}
            disabled={purchasing || restoring}
            onPress={() => void onOpenRevenueCatPaywall()}
          />

          {showFallback ? (
            <View style={styles.fallback}>
              <Eyebrow>Choose a plan</Eyebrow>
              <Text style={styles.fallbackNote}>
                The full plan screen could not be shown, so here are the options directly.
              </Text>

              {offeringStatus === 'loading' || offeringStatus === 'idle' ? (
                <LoadingState label="Loading plans" />
              ) : offeringStatus === 'error' ? (
                <ErrorState
                  title="Couldn't load the plans"
                  body={offeringError ?? 'The store did not return any subscription options.'}
                  onRetry={loadOffering}
                />
              ) : !offering ? (
                <ErrorState
                  title="No offering available"
                  body="RevenueCat has no current offering configured. Add one in the dashboard and mark it current."
                  onRetry={loadOffering}
                />
              ) : tiers.length === 0 ? (
                <ErrorState
                  title="No plans in this offering"
                  body="The current offering returned no lifetime, yearly or monthly package. Check the packages attached to it in the dashboard."
                  onRetry={loadOffering}
                />
              ) : (
                <>
                  <View style={styles.tiers}>
                    {tiers.map((tier) => (
                      <TierRow
                        key={tier.pkg.identifier}
                        tier={tier}
                        selected={selected === tier.pkg.identifier}
                        disabled={busy}
                        onSelect={() => setChosen(tier.pkg.identifier)}
                      />
                    ))}
                  </View>
                  <Button
                    label="Subscribe"
                    busy={purchasing}
                    disabled={!selected || restoring || presentingPaywall}
                    onPress={() => {
                      const tier = tiers.find((t) => t.pkg.identifier === selected);
                      if (tier) void onBuy(tier.pkg);
                    }}
                  />
                </>
              )}
            </View>
          ) : null}

          <Button
            label="Restore purchases"
            variant="secondary"
            busy={restoring}
            disabled={purchasing || presentingPaywall}
            onPress={() => void onRestore()}
            accessibilityHint="Checks this store account for a subscription you have already bought"
            style={styles.restore}
          />

          <Button
            label="Manage subscription"
            variant="ghost"
            disabled={busy}
            onPress={() => void onManage()}
            accessibilityHint="Opens the RevenueCat Customer Center"
          />
        </View>
      )}

      {notice ? (
        <Card style={styles.noticeCard}>
          <Text style={styles.noticeText}>{notice}</Text>
        </Card>
      ) : null}

      {lastError ? (
        <View style={styles.section}>
          <ErrorState title="That didn't go through" body={lastError} />
        </View>
      ) : null}

      <Text style={styles.legal}>
        Payment is taken by the App Store or Google Play. Subscriptions renew until cancelled, and
        can be cancelled at any time from your store account or from Manage subscription above.
      </Text>
    </Screen>
  );
}

function Benefit({ title, body }: { title: string; body: string }) {
  return (
    <View>
      <Text style={styles.benefitTitle}>{title}</Text>
      <Text style={styles.benefitBody}>{body}</Text>
    </View>
  );
}

function UnavailableCard({ onRetry }: { onRetry: () => void }) {
  const { availability } = useEntitlements();
  const { title, body } = describeUnavailability(availability);
  return (
    <View style={styles.section}>
      <ErrorState title={title} body={body} onRetry={onRetry} />
    </View>
  );
}

/**
 * One plan. The tier label is ours; the product name and price are whatever the
 * store returned through RevenueCat.
 */
function TierRow({
  tier,
  selected,
  disabled,
  onSelect,
}: {
  tier: OfferingTier;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  const product = tier.pkg.product;
  return (
    <Pressable
      onPress={onSelect}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={`${tier.label}. ${product.title}, ${product.priceString}`}
      style={({ pressed }) => [
        styles.tier,
        selected ? styles.tierSelected : null,
        pressed && !disabled ? styles.tierPressed : null,
        disabled ? styles.tierDisabled : null,
      ]}
    >
      <View style={styles.tierText}>
        <Text style={styles.tierLabel}>{tier.label}</Text>
        <Text style={styles.tierProduct} numberOfLines={1}>
          {product.title}
        </Text>
      </View>
      <Text style={[styles.tierPrice, selected ? styles.tierPriceSelected : null]}>
        {product.priceString}
      </Text>
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
  subheading: {
    ...type.body,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  benefits: {
    marginBottom: spacing.xxl,
  },
  benefitDivider: {
    marginVertical: spacing.lg,
  },
  benefitTitle: {
    ...type.subheading,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  benefitBody: {
    ...type.small,
    color: colors.textMuted,
  },
  section: {
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  fallback: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  fallbackNote: {
    ...type.small,
    color: colors.textFaint,
  },
  tiers: {
    gap: spacing.md,
  },
  tier: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    minHeight: 64,
  },
  tierSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSurface,
  },
  tierPressed: {
    backgroundColor: colors.surfaceRaised,
  },
  tierDisabled: {
    opacity: 0.5,
  },
  tierText: {
    flex: 1,
    gap: 2,
  },
  tierLabel: {
    ...type.bodyMedium,
    color: colors.text,
  },
  tierProduct: {
    ...type.small,
    color: colors.textFaint,
  },
  tierPrice: {
    ...type.subheading,
    color: colors.textMuted,
  },
  tierPriceSelected: {
    color: colors.accentText,
  },
  restore: {
    marginTop: spacing.sm,
  },
  activeCard: {
    gap: spacing.md,
  },
  activeText: {
    ...type.body,
    color: colors.textMuted,
  },
  manage: {
    marginTop: spacing.sm,
  },
  noticeCard: {
    marginBottom: spacing.lg,
  },
  noticeText: {
    ...type.small,
    color: colors.textMuted,
  },
  legal: {
    ...type.small,
    color: colors.textFaint,
    marginTop: spacing.sm,
    marginBottom: spacing.xxl,
  },
});
