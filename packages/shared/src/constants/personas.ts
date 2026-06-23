import type { LearnerPersona, PersonaId } from '../types/brain'

// ─── Experienced ──────────────────────────────────────────────────────────────
// High confidence, 3+ years in restaurants, renewing certification.
// Brain starts with lessons; after 2 consecutive correct answers in a level it
// issues skip_to_level_quiz. Tone is direct, no scaffolding.
// Demo journey: rapid progress through each level's first 2 lessons, then jumps
// straight to the review.

const EXPERIENCED_PERSONA: LearnerPersona = {
  personaId: 'experienced',
  label: 'Experienced',
  description:
    'A seasoned restaurant manager renewing their ServSafe. Knows the material well — the brain skips to the level review after 2 consecutive correct answers and keeps explanations brief.',
  onboardingAnswers: {
    profile: {
      name: 'Alex Chen',
      phone: '+15555550101',
      otpStep: 'verified',
    },
    schedule: {
      preferredTimeOfDay: 'morning',
      completionDeadline: null,
      dailyMinutes: 10,
      daysPerWeek: 3,
    },
    priorKnowledge: {
      confidenceLevel: 9,
      restaurantExperience: '3-plus-years',
      currentRole: 'manager',
      hasExistingCertification: true,
    },
    motivation: {
      courseReason: 'renewing-certification',
      learningStyle: 'dive-straight-in',
    },
  },
  coldStart: {
    teachingTone: 'challenging',
    explanationDepth: 'brief',
    firstDirective: 'continue_with_plan',
  },
  behaviorProfile: {
    baseCorrectRate: 0.85,
    hintFrequency: 0.05,
    abandonRate: 0.05,
    answerLatencyMs: { min: 2_000, max: 8_000 },
    contentDwellMs: { min: 3_000, max: 10_000 },
    sessionFrequency: 3,
    sessionDurationMinutes: { min: 8, max: 15 },
    dailyEngagementRate: 0.6,
    masteryGrowthRate: 'fast',
    skipToReviewAfterCorrect: 2,
  },
}

// ─── New ──────────────────────────────────────────────────────────────────────
// No prior food-safety knowledge, low confidence, brand-new hire.
// Brain starts slow: detailed explanations, encouraging tone, every lesson in order.
// Demo journey: steady but careful progress, frequent hints, persistence despite misses.

const NEW_PERSONA: LearnerPersona = {
  personaId: 'new',
  label: 'New',
  description:
    'A first-time food handler required to complete training for a new job. No background in the subject — the brain moves carefully, offers detail, and keeps the tone warm.',
  onboardingAnswers: {
    profile: {
      name: 'Jamie Rivera',
      phone: '+15555550102',
      otpStep: 'verified',
    },
    schedule: {
      preferredTimeOfDay: 'evening',
      completionDeadline: null,
      dailyMinutes: 20,
      daysPerWeek: 5,
    },
    priorKnowledge: {
      confidenceLevel: 2,
      restaurantExperience: 'never',
      currentRole: 'new-hire',
      hasExistingCertification: false,
    },
    motivation: {
      courseReason: 'required-by-employer',
      learningStyle: 'step-by-step',
    },
  },
  coldStart: {
    teachingTone: 'encouraging',
    explanationDepth: 'detailed',
    firstDirective: 'continue_with_plan',
  },
  behaviorProfile: {
    baseCorrectRate: 0.45,
    hintFrequency: 0.55,
    abandonRate: 0.08,
    answerLatencyMs: { min: 8_000, max: 30_000 },
    contentDwellMs: { min: 20_000, max: 60_000 },
    sessionFrequency: 5,
    sessionDurationMinutes: { min: 15, max: 25 },
    dailyEngagementRate: 0.75,
    masteryGrowthRate: 'slow',
    skipToReviewAfterCorrect: null,
  },
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export const ALL_PERSONAS: LearnerPersona[] = [
  EXPERIENCED_PERSONA,
  NEW_PERSONA,
]

export const PERSONAS_BY_ID: Record<PersonaId, LearnerPersona> = {
  experienced: EXPERIENCED_PERSONA,
  new: NEW_PERSONA,
}

export { EXPERIENCED_PERSONA, NEW_PERSONA }
