import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import {
  describeError,
  entitlementId,
  isConfigured,
  type PurchasesOffering,
} from './purchases';

/**
 * RevenueCat's own Paywall and Customer Center, from `react-native-purchases-ui`.
 *
 * Both are native screens presented over the app, laid out from the RevenueCat
 * dashboard rather than in this codebase. No native Swift or Kotlin is written
 * here — this is only the JavaScript entry point the SDK exposes.
 *
 * Every call is guarded on the SDK actually being configured, because
 * presenting either surface before `Purchases.configure()` has run throws.
 */

export type PaywallPresentation =
  /** Finished with the customer now entitled. */
  | { kind: 'purchased' }
  | { kind: 'restored' }
  /** The user closed it without buying. Normal, not an error. */
  | { kind: 'cancelled' }
  /** `presentPaywallIfNeeded` found the entitlement already active. */
  | { kind: 'not-presented' }
  | { kind: 'error'; message: string };

function mapResult(result: PAYWALL_RESULT): PaywallPresentation {
  switch (result) {
    case PAYWALL_RESULT.PURCHASED:
      return { kind: 'purchased' };
    case PAYWALL_RESULT.RESTORED:
      return { kind: 'restored' };
    case PAYWALL_RESULT.CANCELLED:
      return { kind: 'cancelled' };
    case PAYWALL_RESULT.NOT_PRESENTED:
      return { kind: 'not-presented' };
    case PAYWALL_RESULT.ERROR:
    default:
      return {
        kind: 'error',
        message: 'The store could not show the subscription options. Please try again.',
      };
  }
}

const NOT_READY: PaywallPresentation = {
  kind: 'error',
  message: 'Subscriptions are not ready on this device yet.',
};

/**
 * Show the dashboard-configured paywall.
 *
 * Passing the offering explicitly keeps this consistent with the offering the
 * rest of the app read, rather than letting the native side pick separately.
 */
export async function presentPaywall(
  offering?: PurchasesOffering | null,
): Promise<PaywallPresentation> {
  if (!isConfigured()) return NOT_READY;
  try {
    const result = await RevenueCatUI.presentPaywall(
      offering ? { offering } : undefined,
    );
    return mapResult(result);
  } catch (error) {
    return { kind: 'error', message: describeError(error) };
  }
}

/**
 * Show the paywall only if the entitlement is not already active. Returns
 * `not-presented` when the customer is already entitled.
 */
export async function presentPaywallIfNeeded(
  offering?: PurchasesOffering | null,
): Promise<PaywallPresentation> {
  if (!isConfigured()) return NOT_READY;
  const requiredEntitlementIdentifier = entitlementId();
  if (!requiredEntitlementIdentifier) return NOT_READY;

  try {
    const result = await RevenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier,
      ...(offering ? { offering } : {}),
    });
    return mapResult(result);
  } catch (error) {
    return { kind: 'error', message: describeError(error) };
  }
}

export type CustomerCenterOutcome =
  | { kind: 'closed' }
  | { kind: 'error'; message: string };

/**
 * RevenueCat's Customer Center: the standard place for someone to manage,
 * cancel or get help with an existing subscription.
 *
 * It resolves when the customer closes it. Whatever they changed in there is
 * picked up by re-reading customer info afterwards, which the caller does.
 */
export async function presentCustomerCenter(): Promise<CustomerCenterOutcome> {
  if (!isConfigured()) {
    return { kind: 'error', message: 'Subscriptions are not ready on this device yet.' };
  }
  try {
    await RevenueCatUI.presentCustomerCenter();
    return { kind: 'closed' };
  } catch (error) {
    return { kind: 'error', message: describeError(error) };
  }
}
