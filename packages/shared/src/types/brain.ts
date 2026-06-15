import type { LearningEvent } from './events'
import type { OnboardingAnswers } from './onboarding'

// ─── Directive types ──────────────────────────────────────────────────────────

export type DirectiveType =
  /** Proceed to the next planned lesson in sequence */
  | 'continue_with_plan'
  /** Go back to the first lesson of the current level */
  | 'restart_level'
  /** Revisit the immediately prior lesson before continuing */
  | 'review_previous_lesson'
  /** Jump to the level review section — learner has demonstrated readiness */
  | 'skip_to_level_quiz'
  /** Retry the current lesson — learner struggled significantly */
  | 'repeat_current_lesson'
  /** Surface an expanded explanation for the current concept before moving on */
  | 'provide_additional_explanation'
  /** Switch question format for variety or to probe understanding differently */
  | 'change_question_format'
  /** Prompt the learner to take a short break — session is long or engagement is declining */
  | 'suggest_break'
  /** Recommend ending the session — disengagement signals are strong */
  | 'end_session'

// ─── Teaching parameters (returned with every directive) ──────────────────────

export type TeachingTone =
  | 'encouraging' // warm, affirming — for nervous or struggling learners
  | 'neutral'     // default
  | 'challenging' // direct, demanding — for confident or experienced learners
  | 'patient'     // slow, no pressure — for repeated misses or low confidence

export type ExplanationDepth =
  | 'brief'    // skip scaffolding — experienced learner, fast pace
  | 'standard' // default
  | 'detailed' // more examples and context — struggling or new learner

// ─── Mastery ──────────────────────────────────────────────────────────────────

export interface LessonMasteryScore {
  lessonId: string
  /** 0–100 derived from the mastery table (correct first try +10, after hint +7, after review +5, incorrect +0) */
  score: number
  correctOnFirstTry: number
  correctAfterHint: number
  correctAfterReview: number
  incorrect: number
  totalAttempts: number
  /** ISO 8601; null if this lesson has never been attempted */
  lastAttemptAt: string | null
}

// ─── Flags ────────────────────────────────────────────────────────────────────

export interface BrainFlags {
  /** Session is long or recent engagement signals are dropping */
  suggestBreak: boolean
  /** One or more concepts have scores below the review threshold */
  flaggedForReview: boolean
  /** No meaningful mastery gain across the most recent N lessons */
  progressStalled: boolean
  /** Behavioral signals (short dwell times, repeated abandons) suggest disengagement */
  disengagementRisk: boolean
}

// ─── Personas ─────────────────────────────────────────────────────────────────

/** The three seeded cold-start personas used for demo and development */
export type PersonaId = 'experienced' | 'new' | 'disengaged'

/**
 * Describes how a persona behaves during a session and across time.
 * Consumed by the synthetic event generator (B5) to produce the simulated
 * 30-day history shown in the admin dashboard.
 */
export interface PersonaBehaviorProfile {
  /** 0.0–1.0 probability of answering correctly on the first attempt */
  baseCorrectRate: number
  /** 0.0–1.0 probability of requesting a hint before submitting an answer */
  hintFrequency: number
  /** 0.0–1.0 probability of abandoning a lesson before completing it */
  abandonRate: number
  /** Milliseconds from question shown to answer submitted */
  answerLatencyMs: { min: number; max: number }
  /** Milliseconds spent on lesson content before reaching the question */
  contentDwellMs: { min: number; max: number }
  /** Average learning sessions per week */
  sessionFrequency: number
  /** Duration of a typical session in minutes */
  sessionDurationMinutes: { min: number; max: number }
  /** 0.0–1.0 probability the learner opens the app on any given day */
  dailyEngagementRate: number
  /** How quickly mastery scores climb per session */
  masteryGrowthRate: 'fast' | 'moderate' | 'slow' | 'stalled'
}

export interface LearnerPersona {
  personaId: PersonaId
  label: string
  description: string
  /** Pre-populated onboarding answers, as if this persona completed the flow */
  onboardingAnswers: OnboardingAnswers
  /** Brain parameters applied at cold start, before any behavioral events exist */
  coldStart: {
    teachingTone: TeachingTone
    explanationDepth: ExplanationDepth
    firstDirective: DirectiveType
  }
  /** Behavioral characteristics used by the synthetic event generator */
  behaviorProfile: PersonaBehaviorProfile
}

// ─── Brain response (Brain → Loop) ───────────────────────────────────────────

export interface BrainDirective {
  directiveType: DirectiveType
  /** The specific lesson to navigate to. null = defer to the loop's default next lesson */
  targetLessonId: string | null
  /** The specific level to navigate to. null = stay on the current level */
  targetLevelId: string | null
  teachingTone: TeachingTone
  explanationDepth: ExplanationDepth
  /** Per-lesson mastery scores keyed by lessonId */
  masteryScores: Record<string, LessonMasteryScore>
  /** Weighted 0–100 mastery across all lessons the learner has attempted */
  overallMastery: number
  /** The lesson the brain recommends after the current one resolves */
  recommendedNextLessonId: string | null
  flags: BrainFlags
  /**
   * Human-readable explanation of why this directive was issued.
   * Rendered in the admin/debug dashboard; never shown to the learner.
   */
  rationale: string
  /** ISO 8601 */
  issuedAt: string
}

// ─── Brain request (Loop → Brain) ────────────────────────────────────────────

export interface BrainRequest {
  userId: string
  sessionId: string
  currentLessonId: string
  currentLevelId: string
  /** All learning events emitted since the previous directive was issued */
  recentEvents: LearningEvent[]
  /** ISO 8601 */
  requestedAt: string
}
