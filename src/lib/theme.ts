/**
 * TalkCraft design tokens.
 *
 * One source of truth for colour, spacing, radius and type so every screen
 * reads as the same product. Contrast ratios noted against `bg` / `surface`
 * were checked to stay above WCAG AA for their intended text size.
 */

export const colors = {
  /** Deep navy page background. */
  bg: '#0A1020',
  /** Raised card surface. */
  surface: '#121A2E',
  /** Card surface one step higher (nested cards, selected states). */
  surfaceRaised: '#1A2440',
  /** Hairline borders and dividers. */
  border: '#222F4D',
  borderStrong: '#31406A',

  /** Warm white — primary reading colour. 16.4:1 on bg. */
  text: '#F2EEE6',
  /** Secondary copy. 9.1:1 on bg. */
  textMuted: '#A9B4CC',
  /**
   * Tertiary labels and eyebrows. 5.8:1 on bg, and 4.7:1 on the raised card
   * surface — the worst pairing in the app, and still above AA for 14px text.
   */
  textFaint: '#8A95AE',

  /** Restrained electric blue. Used for one primary action per screen. */
  accent: '#4C7DFF',
  accentPressed: '#3D66DB',
  /** Accent tint for text on dark — 8.9:1 on bg. */
  accentText: '#8FB0FF',
  accentSurface: 'rgba(76, 125, 255, 0.12)',

  /** Feedback semantics. Never used as decoration. */
  positive: '#5FD3A6',
  positiveSurface: 'rgba(95, 211, 166, 0.12)',
  caution: '#F2C14E',
  cautionSurface: 'rgba(242, 193, 78, 0.12)',
  critical: '#F2836B',
  criticalSurface: 'rgba(242, 131, 107, 0.12)',

  /** The colleague's speech bubble. */
  speech: '#1B2540',
} as const;

/** 4pt base scale. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

/**
 * Type scale. System fonts only — no font package needed, and system text
 * respects the user's own rendering settings on both platforms.
 */
export const type = {
  display: { fontSize: 34, lineHeight: 40, fontWeight: '700' },
  title: { fontSize: 26, lineHeight: 32, fontWeight: '700' },
  heading: { fontSize: 20, lineHeight: 26, fontWeight: '600' },
  subheading: { fontSize: 17, lineHeight: 24, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  bodyMedium: { fontSize: 16, lineHeight: 24, fontWeight: '500' },
  small: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  /** Section eyebrows. Always paired with letterSpacing. */
  label: { fontSize: 12, lineHeight: 16, fontWeight: '700', letterSpacing: 1.1 },
} as const;

/** Minimum touch target on both platforms. */
export const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 } as const;
