/**
 * Welcome / onboarding copy (Step 133).
 * Throughline: learn sleep for 2 days → set & lock schedule.
 */
export type OnboardingSlide = {
  key: string
  eyebrow: string
  title: string
  body: string
}

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    key: 'welcome',
    eyebrow: 'Sleep Lock',
    title: 'Your nights, protected',
    body: 'Create an account, allow a few permissions, and Sleep Lock learns your sleep stats — then helps you stick to them.',
  },
  {
    key: 'learn',
    eyebrow: 'Step 1',
    title: 'We learn from your stats',
    body: "Location, motion, and notifications let us understand your nights. Soft lock features follow those stats — not a generic alarm.",
  },
  {
    key: 'set-lock',
    eyebrow: 'Step 2',
    title: 'Soft lock from your schedule',
    body: 'Reminders and the in-app sleep lock screen help you stick to bed and wake times — on every device where you sign in.',
  },
  {
    key: 'ready',
    eyebrow: 'Ready',
    title: 'Account, then allow',
    body: 'Next: create your account, allow permissions, set home — then the app runs from your stats.',
  },
]
