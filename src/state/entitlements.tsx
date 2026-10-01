import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  presentCustomerCenter as presentCustomerCenterUi,
  presentPaywall as presentPaywallUi,
  type PaywallPresentation,
} from '@/lib/paywallUi';
import {
  fetchCustomerInfo,
  fetchOffering,
  hasPro,
  subscribeToCustomerInfo,
  initialisePurchases,
  purchasePackage,
  restorePurchases,
  tiersFromOffering,
  type BillingAvailability,
  type CustomerInfo,
  type OfferingTier,
  type PurchasesOffering,
  type PurchasesPackage,
} from '@/lib/purchases';

/**
 * Entitlement state for the whole app.
 *
 * `isPremium` is only ever true because RevenueCat said so. Every failure path
 * — Expo Go, unconfigured dashboard, network, SDK error — leaves it false and
 * surfaces the reason, so the app never grants access it cannot verify.
 */

export type EntitlementStatus =
  | 'loading'
  /** SDK is up and the entitlement has been read. */
  | 'ready'
  /** Billing cannot run here; `availability` explains why. */
  | 'unavailable';

interface EntitlementsValue {
  status: EntitlementStatus;
  availability: BillingAvailability | null;
  isPremium: boolean;
  customerInfo: CustomerInfo | null;

  /** The paywall's offering. Null until loaded, or if none is configured. */
  offering: PurchasesOffering | null;
  /** Lifetime / yearly / monthly, only those the offering actually returned. */
  tiers: OfferingTier[];
  offeringStatus: 'idle' | 'loading' | 'ready' | 'error';
  offeringError: string | null;
  loadOffering: () => void;

  /** In-flight flags so the paywall can disable its buttons. */
  purchasing: boolean;
  restoring: boolean;

  /** Resolves to a short outcome the paywall turns into a message. */
  buy: (pkg: PurchasesPackage) => Promise<'purchased' | 'cancelled' | 'error'>;
  restore: () => Promise<'restored' | 'nothing-to-restore' | 'error'>;

  /** RevenueCat's own paywall, laid out in the dashboard. */
  openRevenueCatPaywall: () => Promise<PaywallPresentation>;
  /** RevenueCat's Customer Center for managing an existing subscription. */
  openCustomerCenter: () => Promise<'closed' | 'error'>;
  presentingPaywall: boolean;
  lastError: string | null;
  clearError: () => void;

  refresh: () => void;
}

const EntitlementsContext = createContext<EntitlementsValue | undefined>(undefined);

export function EntitlementsProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<EntitlementStatus>('loading');
  const [availability, setAvailability] = useState<BillingAvailability | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);

  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [offeringStatus, setOfferingStatus] =
    useState<EntitlementsValue['offeringStatus']>('idle');
  const [offeringError, setOfferingError] = useState<string | null>(null);

  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [presentingPaywall, setPresentingPaywall] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const bootstrap = useCallback(async () => {
    const result = await initialisePurchases();
    if (!mounted.current) return;
    setAvailability(result);

    if (result.kind !== 'ready') {
      setStatus('unavailable');
      return;
    }

    try {
      const info = await fetchCustomerInfo();
      if (!mounted.current) return;
      setCustomerInfo(info);
      setStatus('ready');
    } catch (error) {
      if (!mounted.current) return;
      setAvailability({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Could not read your subscription.',
      });
      setStatus('unavailable');
    }
  }, []);

  // Kicked off in a promise chain rather than called directly, so no state is
  // set during the effect's synchronous body.
  useEffect(() => {
    Promise.resolve().then(bootstrap);
  }, [bootstrap]);

  const loadOffering = useCallback(() => {
    setOfferingStatus('loading');
    setOfferingError(null);
    fetchOffering()
      .then((result) => {
        if (!mounted.current) return;
        setOffering(result);
        setOfferingStatus('ready');
      })
      .catch((error: unknown) => {
        if (!mounted.current) return;
        setOfferingError(
          error instanceof Error ? error.message : 'Could not load subscription options.',
        );
        setOfferingStatus('error');
      });
  }, []);

  const buy = useCallback(async (pkg: PurchasesPackage) => {
    setPurchasing(true);
    setLastError(null);
    try {
      const outcome = await purchasePackage(pkg);
      // Report what actually happened even if the screen has gone away; an
      // error must not be reported to the caller as a cancellation.
      if (!mounted.current) return outcome.kind;

      if (outcome.kind === 'purchased') {
        setCustomerInfo(outcome.info);
        return 'purchased';
      }
      if (outcome.kind === 'cancelled') return 'cancelled';

      setLastError(outcome.message);
      return 'error';
    } finally {
      if (mounted.current) setPurchasing(false);
    }
  }, []);

  const restore = useCallback(async () => {
    setRestoring(true);
    setLastError(null);
    try {
      const outcome = await restorePurchases();
      if (!mounted.current) return 'error' as const;

      if (outcome.kind === 'error') {
        setLastError(outcome.message);
        return 'error' as const;
      }

      setCustomerInfo(outcome.info);
      // Restoring succeeds even when there was nothing to restore, so the
      // distinction the user cares about is whether they are premium now.
      return hasPro(outcome.info) ? ('restored' as const) : ('nothing-to-restore' as const);
    } finally {
      if (mounted.current) setRestoring(false);
    }
  }, []);

  const refresh = useCallback(() => {
    setStatus('loading');
    void bootstrap();
  }, [bootstrap]);

  /**
   * Re-read the entitlement without flipping the whole screen back to loading.
   * Returns whether the read succeeded, because a failure straight after a
   * purchase is the difference between "you have Pro" and "you paid and the app
   * still says free".
   */
  const syncCustomerInfo = useCallback(async (): Promise<boolean> => {
    try {
      const info = await fetchCustomerInfo();
      if (mounted.current) setCustomerInfo(info);
      return true;
    } catch {
      return false;
    }
  }, []);

  // Keep the entitlement current while the app is open. Without this, a
  // subscription that expires or is cancelled outside the app would keep
  // showing as active until the next launch.
  useEffect(() => {
    if (status !== 'ready') return;
    return subscribeToCustomerInfo((info) => {
      if (mounted.current) setCustomerInfo(info);
    });
  }, [status]);

  const openRevenueCatPaywall = useCallback(async () => {
    setPresentingPaywall(true);
    setLastError(null);
    try {
      const result = await presentPaywallUi(offering);
      // The native paywall performs the purchase itself, so the only reliable
      // source of truth afterwards is a fresh read of customer info.
      if (result.kind === 'purchased' || result.kind === 'restored') {
        const synced = await syncCustomerInfo();
        if (!synced) {
          setLastError(
            'Your purchase went through, but the app could not confirm it just now. Tap "Restore purchases" in a moment and it will unlock.',
          );
        }
      } else if (result.kind === 'error') {
        setLastError(result.message);
      }
      return result;
    } finally {
      if (mounted.current) setPresentingPaywall(false);
    }
  }, [offering, syncCustomerInfo]);

  const openCustomerCenter = useCallback(async () => {
    setLastError(null);
    const result = await presentCustomerCenterUi();
    if (result.kind === 'error') {
      setLastError(result.message);
      return 'error' as const;
    }
    // They may have cancelled or changed plan in there.
    await syncCustomerInfo();
    return 'closed' as const;
  }, [syncCustomerInfo]);

  const clearError = useCallback(() => setLastError(null), []);

  const isPremium = status === 'ready' && hasPro(customerInfo);

  const value = useMemo<EntitlementsValue>(
    () => ({
      status,
      availability,
      isPremium,
      customerInfo,
      offering,
      tiers: tiersFromOffering(offering),
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
    }),
    [
      status,
      availability,
      isPremium,
      customerInfo,
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
    ],
  );

  return <EntitlementsContext.Provider value={value}>{children}</EntitlementsContext.Provider>;
}

export function useEntitlements(): EntitlementsValue {
  const ctx = useContext(EntitlementsContext);
  if (!ctx) throw new Error('useEntitlements must be used inside an EntitlementsProvider');
  return ctx;
}

/** Plain-language explanation of why billing cannot run, for the paywall. */
export function describeUnavailability(availability: BillingAvailability | null): {
  title: string;
  body: string;
} {
  switch (availability?.kind) {
    case 'expo-go':
      return {
        title: 'Purchases need a development build',
        body: 'RevenueCat ships native code, which Expo Go cannot load. Everything else in the app works here — run a development build to test subscriptions.',
      };
    case 'not-configured':
      return {
        title: 'Subscriptions are not configured yet',
        body: `This build still has placeholder values for: ${availability.missing.join(', ')}. Fill them in from the RevenueCat dashboard in app.json and rebuild.`,
      };
    case 'bad-key':
      return { title: 'Wrong kind of API key', body: availability.message };
    case 'test-key-in-release':
      return {
        title: 'Test Store key in a release build',
        body: 'Test Store keys only work in development builds. Swap in the real platform keys (goog_… / appl_…) before making a release build, or run a development build to keep testing.',
      };
    case 'error':
      return { title: 'Could not reach the store', body: availability.message };
    default:
      return {
        title: 'Subscriptions are unavailable',
        body: 'The app could not start the billing SDK on this device.',
      };
  }
}
