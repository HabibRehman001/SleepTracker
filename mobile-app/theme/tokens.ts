/**
 * Dark theme tokens mirrored from web-app/src/index.css `.dark` (Step 122).
 * Hex approximations of oklch values so NativeWind / RN stay consistent.
 * Source of truth for “one product” look across web-app + mobile-app.
 */
export const darkTokens = {
  background: '#0a0a0a',
  foreground: '#fafafa',
  card: '#343434',
  cardForeground: '#fafafa',
  popover: '#343434',
  popoverForeground: '#fafafa',
  primary: '#ebebeb',
  primaryForeground: '#343434',
  secondary: '#444444',
  secondaryForeground: '#fafafa',
  muted: '#444444',
  mutedForeground: '#b5b5b5',
  accent: '#444444',
  accentForeground: '#fafafa',
  destructive: '#e07070',
  border: 'rgba(255,255,255,0.10)',
  input: 'rgba(255,255,255,0.15)',
  ring: '#8e8e8e',
  sidebar: '#343434',
  sidebarForeground: '#fafafa',
  /** Matches web --sidebar-primary (violet accent) */
  sidebarPrimary: '#6d5cff',
  sidebarPrimaryForeground: '#fafafa',
  sidebarAccent: '#444444',
  sidebarAccentForeground: '#fafafa',
  sidebarBorder: 'rgba(255,255,255,0.10)',
  sidebarRing: '#8e8e8e',
} as const

export type DarkTokenName = keyof typeof darkTokens
