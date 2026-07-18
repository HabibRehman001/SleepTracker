/** @type {import('tailwindcss').Config} */
const { darkTokens } = require('./theme/tokens.cjs')

module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './native/**/*.{js,jsx,ts,tsx}',
    './services/**/*.{js,jsx,ts,tsx}',
    './store/**/*.{js,jsx,ts,tsx}',
    './theme/**/*.{js,jsx,ts,tsx}',
  ],
  // NativeWind / css-interop: allow manual scheme; avoids web crash on media mode.
  darkMode: 'class',
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: darkTokens.background,
        foreground: darkTokens.foreground,
        card: {
          DEFAULT: darkTokens.card,
          foreground: darkTokens.cardForeground,
        },
        popover: {
          DEFAULT: darkTokens.popover,
          foreground: darkTokens.popoverForeground,
        },
        primary: {
          DEFAULT: darkTokens.primary,
          foreground: darkTokens.primaryForeground,
        },
        secondary: {
          DEFAULT: darkTokens.secondary,
          foreground: darkTokens.secondaryForeground,
        },
        muted: {
          DEFAULT: darkTokens.muted,
          foreground: darkTokens.mutedForeground,
        },
        accent: {
          DEFAULT: darkTokens.accent,
          foreground: darkTokens.accentForeground,
        },
        destructive: darkTokens.destructive,
        border: darkTokens.border,
        input: darkTokens.input,
        ring: darkTokens.ring,
        sidebar: {
          DEFAULT: darkTokens.sidebar,
          foreground: darkTokens.sidebarForeground,
          primary: darkTokens.sidebarPrimary,
          'primary-foreground': darkTokens.sidebarPrimaryForeground,
          accent: darkTokens.sidebarAccent,
          'accent-foreground': darkTokens.sidebarAccentForeground,
          border: darkTokens.sidebarBorder,
          ring: darkTokens.sidebarRing,
        },
      },
      borderRadius: {
        lg: '0.625rem',
        md: '0.5rem',
        sm: '0.375rem',
      },
    },
  },
  plugins: [],
}
