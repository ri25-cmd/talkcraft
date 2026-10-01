import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  PACKAGE_TYPE,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesError,
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases';

/**
 * Thin wrapper around the RevenueCat SDK.
 *
 * Everything the app needs to know about billing goes through here so that the
 * ways this can legitimately be unavailable are handled in one place:
 *
 *  - `expo-go`        the native module isn't in Expo Go, so nothing can run
 *  - `not-configured` the public SDK key placeholder is still in place
 *  - `bad-key`        a secret key was supplied where a public one belongs
 *  - `test-key-in-release` a Test Store key outside a debug build
 *  - `error`          the SDK loaded but configuring or fetching failed
 *
 * None of these are treated as "the user is Pro". They are reported as-is, so a
 * build that cannot verify a purchase never pretends that it can.
 */

export type BillingAvailability =
  | { kind: 'ready' }
  | { kind: 'expo-go' }
  | { kind: 'not-configured'; missing: string[] }
  | { kind: 'bad-key'; message: string }
  /** A Test Store key in a release build, which the SDK refuses to run with. */
  | { kind: 'test-key-in-release' }
  | { kind: 'error'; message: string };

interface RevenueCatConfig {
  iosApiKey: string | null;
  androidApiKey: string | null;
  entitlementId: string | null;
  offeringId: string | null;
}

/** Values still carrying this prefix have not been filled in yet. */
const PLACEHOLDER_PREFIX = 'REPLACE_WITH_';

/**
 * RevenueCat secret keys start with `sk_`. They authorise server-side calls
 * against the whole account and must never be shipped in an app binary, so a
 * key that looks like one is refused rather than used.
 */
const SECRET_KEY_PREFIX = 'sk_';

/**
 * RevenueCat's Test Store keys. Supported from react-native-purchases 9.5.4
 * (installed: 10.10.2), and the same key is used for both platforms.
 *
 * They are debug-only by design: configuring the SDK with one in a release
 * build makes it log an error, show an alert and then crash on purpose. This
 * app checks for that case first so it degrades into an explained, unavailable
 * state instead of taking the whole app down.
 */
const TEST_STORE_KEY_PREFIX = 'test_';

export function isTestStoreKey(key: string | null): boolean {
  return key !== null && key.startsWith(TEST_STORE_KEY_PREFIX);
}

function asString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  return trimmed.startsWith(PLACEHOLDER_PREFIX) ? null : trimmed;
}

/**
 * Public SDK keys, preferring the environment over app.json so they can be kept
 * out of the repository. Expo only inlines `process.env.EXPO_PUBLIC_*` when the
 * reference is written out literally, hence no dynamic lookup here.
 */
function envKeyForPlatform(): string | null {
  return Platform.OS === 'ios'
    ? asString(process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY)
    : asString(process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY);
}

function readConfig(): RevenueCatConfig {
  const raw = (Constants.expoConfig?.extra?.revenuecat ?? {}) as Record<string, unknown>;
  return {
    iosApiKey: asString(raw.iosApiKey),
    androidApiKey: asString(raw.androidApiKey),
    entitlementId: asString(raw.entitlementId),
    offeringId: asString(raw.offeringId),
  };
}

/**
 * The entitlement this app checks for. Configured in app.json and must match
 * the entitlement identifier in the RevenueCat dashboard exactly.
 */
export function entitlementId(): string | null {
  return readConfig().entitlementId;
}

function apiKeyForPlatform(config: RevenueCatConfig): string | null {
  return envKeyForPlatform() ?? (Platform.OS === 'ios' ? config.iosApiKey : config.androidApiKey);
}

/**
 * True when running somewhere the RevenueCat native module cannot exist.
 * Expo Go ships a fixed set of native modules and this is not one of them.
 */
function isExpoGo(): boolean {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

let configured = false;

/**
 * Configure the SDK once per app launch. Safe to call repeatedly.
 * Returns why billing is unavailable rather than throwing.
 */
export async function initialisePurchases(): Promise<BillingAvailability> {
  if (Platform.OS === 'web') {
    return { kind: 'error', message: 'In-app purchases are not available on web.' };
  }
  if (isExpoGo()) return { kind: 'expo-go' };

  const config = readConfig();
  const apiKey = apiKeyForPlatform(config);

  const missing: string[] = [];
  if (!apiKey) {
    missing.push(
      Platform.OS === 'ios'
        ? 'EXPO_PUBLIC_REVENUECAT_IOS_KEY (or extra.revenuecat.iosApiKey)'
        : 'EXPO_PUBLIC_REVENUECAT_ANDROID_KEY (or extra.revenuecat.androidApiKey)',
    );
  }
  if (!config.entitlementId) missing.push('extra.revenuecat.entitlementId');
  if (missing.length > 0) return { kind: 'not-configured', missing };

  if (apiKey && apiKey.startsWith(SECRET_KEY_PREFIX)) {
    return {
      kind: 'bad-key',
      message:
        'That looks like a RevenueCat secret key (sk_...). Secret keys must never ship inside an app. Use the public SDK key for this platform instead.',
    };
  }

  // Checked before configure(): the SDK crashes deliberately in this case.
  if (isTestStoreKey(apiKey) && !__DEV__) {
    return { kind: 'test-key-in-release' };
  }

  if (configured) return { kind: 'ready' };

  try {
    if (__DEV__) await Purchases.setLogLevel(LOG_LEVEL.WARN);
    Purchases.configure({ apiKey: apiKey as string });
    configured = true;
    return { kind: 'ready' };
  } catch (error) {
    return { kind: 'error', message: describeError(error) };
  }
}

/** Whether the SDK has been configured in this process. */
export function isConfigured(): boolean {
  return configured;
}

/** Reads the entitlement straight from RevenueCat. Never assumed optimistically. */
export function hasPro(info: CustomerInfo | null): boolean {
  const id = entitlementId();
  if (!info || !id) return false;
  return info.entitlements.active[id]?.isActive === true;
}

export async function fetchCustomerInfo(): Promise<CustomerInfo> {
  return Purchases.getCustomerInfo();
}

/**
 * Subscribe to entitlement changes pushed by RevenueCat.
 *
 * This is what keeps Pro accurate while the app is open: renewals, expiries,
 * and changes made outside the app (cancelling in the Play Store, or anything
 * done in the Customer Center) all arrive here without the app polling.
 *
 * Returns an unsubscribe function. A no-op if the SDK is not configured.
 */
export function subscribeToCustomerInfo(
  onChange: (info: CustomerInfo) => void,
): () => void {
  if (!configured) return () => undefined;
  Purchases.addCustomerInfoUpdateListener(onChange);
  return () => {
    Purchases.removeCustomerInfoUpdateListener(onChange);
  };
}

/**
 * The offering to show. Uses the dashboard's current offering unless a specific
 * one is named in app.json.
 */
export async function fetchOffering(): Promise<PurchasesOffering | null> {
  const offerings = await Purchases.getOfferings();
  const wanted = readConfig().offeringId;
  if (wanted) return offerings.all[wanted] ?? null;
  return offerings.current;
}

/** A tier the app knows how to label, paired with whatever the offering holds. */
export interface OfferingTier {
  key: 'lifetime' | 'yearly' | 'monthly';
  label: string;
  pkg: PurchasesPackage;
}

/**
 * Lifetime, yearly and monthly, read from the offering.
 *
 * Nothing is assumed to exist: RevenueCat's typed accessors are checked first,
 * then any remaining packages are matched by package type, and only tiers the
 * dashboard actually returned are included. An offering holding just a monthly
 * package yields exactly one tier.
 */
export function tiersFromOffering(offering: PurchasesOffering | null): OfferingTier[] {
  if (!offering) return [];

  const byType = (packageType: PACKAGE_TYPE): PurchasesPackage | null =>
    offering.availablePackages.find((p) => p.packageType === packageType) ?? null;

  const candidates: {
    key: OfferingTier['key'];
    label: string;
    pkg: PurchasesPackage | null;
  }[] = [
    { key: 'lifetime', label: 'Lifetime', pkg: offering.lifetime ?? byType(PACKAGE_TYPE.LIFETIME) },
    { key: 'yearly', label: 'Yearly', pkg: offering.annual ?? byType(PACKAGE_TYPE.ANNUAL) },
    { key: 'monthly', label: 'Monthly', pkg: offering.monthly ?? byType(PACKAGE_TYPE.MONTHLY) },
  ];

  const tiers: OfferingTier[] = [];
  for (const candidate of candidates) {
    if (candidate.pkg) {
      tiers.push({ key: candidate.key, label: candidate.label, pkg: candidate.pkg });
    }
  }
  return tiers;
}

/**
 * Packages in the offering that are not one of the three known tiers, so a
 * dashboard using custom identifiers still shows everything it offers.
 */
export function otherPackages(offering: PurchasesOffering | null): PurchasesPackage[] {
  if (!offering) return [];
  const known = new Set(tiersFromOffering(offering).map((t) => t.pkg.identifier));
  return offering.availablePackages.filter((p) => !known.has(p.identifier));
}

export type PurchaseOutcome =
  | { kind: 'purchased'; info: CustomerInfo }
  | { kind: 'cancelled' }
  | { kind: 'error'; message: string };

/**
 * Buy a package. A user backing out of the store sheet is a normal outcome,
 * not an error, so it gets its own result rather than an error message.
 */
export async function purchasePackage(pkg: PurchasesPackage): Promise<PurchaseOutcome> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { kind: 'purchased', info: customerInfo };
  } catch (error) {
    if (isCancellation(error)) return { kind: 'cancelled' };
    return { kind: 'error', message: describeError(error) };
  }
}

export type RestoreOutcome =
  | { kind: 'restored'; info: CustomerInfo }
  | { kind: 'error'; message: string };

export async function restorePurchases(): Promise<RestoreOutcome> {
  try {
    const info = await Purchases.restorePurchases();
    return { kind: 'restored', info };
  } catch (error) {
    return { kind: 'error', message: describeError(error) };
  }
}

function isCancellation(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const e = error as Partial<PurchasesError>;
  if (e.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) return true;
  // Older SDK payloads only carried the boolean.
  return e.userCancelled === true;
}

/** Network problems deserve a different suggestion from a store rejection. */
export function isNetworkError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  return (error as Partial<PurchasesError>).code === PURCHASES_ERROR_CODE.NETWORK_ERROR;
}

export function describeError(error: unknown): string {
  if (isNetworkError(error)) {
    return 'Could not reach the store. Check your connection and try again.';
  }
  if (typeof error === 'object' && error !== null) {
    const e = error as Partial<PurchasesError> & { message?: string };
    if (typeof e.message === 'string' && e.message.length > 0) return e.message;
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong talking to the store.';
}

export type { CustomerInfo, PurchasesOffering, PurchasesPackage };
