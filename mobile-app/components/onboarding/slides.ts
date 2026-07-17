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
    body: 'A private lock for focus time — built around how you actually sleep, not a generic alarm.',
  },
  {
    key: 'learn',
    eyebrow: 'Step 1',
    title: 'We learn for 2 days',
    body: "We'll watch your natural bed and wake pattern for two days so the schedule fits you — not the other way around.",
  },
  {
    key: 'set-lock',
    eyebrow: 'Step 2',
    title: 'You set it. Then lock it.',
    body: 'Pick your sleep and wake times from what we learned. Once locked, the phone helps you stick to the plan.',
  },
  {
    key: 'ready',
    eyebrow: 'Ready',
    title: 'Start when you are',
    body: "We'll learn your sleep pattern for 2 days, then you set (and lock) your schedule.",
  },
]
