// ─── Base ─────────────────────────────────────────────────────────────────────

interface BaseEvent {
  /** UUID v4 — unique per event row */
  eventId: string
  userId: string
  /** null for events that occur outside an active learning session */
  sessionId: string | null
  /** Server-assigned ISO 8601 timestamp */
  timestamp: string
  /** Device-side ISO 8601 timestamp — may differ from server timestamp */
  clientTimestamp: string
  /** Monotonically increasing within a session; 0 for non-session events */
  sequenceNumber: number
}

// ─── Shared value types ───────────────────────────────────────────────────────

export type AppOpenSource = 'direct' | 'push_notification' | 'background_resume' | 'deep_link'

export type QuestionFormat = 'multiple_choice' | 'true_false'

export type SessionEndReason = 'completed' | 'abandoned' | 'timeout' | 'backgrounded'

export type LessonAbandonReason = 'navigated_away' | 'session_ended' | 'timeout' | 'backgrounded'

export type SettingsDashboardSource = 'post_onboarding' | 'profile_menu' | 'progress_page'

export type LessonRevisitSource = 'directive' | 'self_initiated' | 'content_library'

export type ReviewTrigger = 'directive' | 'level_completion' | 'self_initiated'

export type OnboardingAbandonStep = 'phone' | 'otp' | 'name' | 'settings'

export type OtpFailReason = 'invalid_code' | 'expired' | 'too_many_attempts'

// ─── Auth & Onboarding ────────────────────────────────────────────────────────

interface PhoneEnteredEvent extends BaseEvent {
  kind: 'phone_entered'
}

interface OtpRequestedEvent extends BaseEvent {
  kind: 'otp_requested'
}

interface OtpSubmittedEvent extends BaseEvent {
  kind: 'otp_submitted'
  attemptNumber: number
}

interface OtpVerifiedEvent extends BaseEvent {
  kind: 'otp_verified'
}

interface OtpFailedEvent extends BaseEvent {
  kind: 'otp_failed'
  attemptNumber: number
  reason: OtpFailReason
}

interface NameSubmittedEvent extends BaseEvent {
  kind: 'name_submitted'
}

/** Settings dashboard shown as part of the initial onboarding flow */
interface OnboardingSettingsViewedEvent extends BaseEvent {
  kind: 'onboarding_settings_viewed'
}

/** Single setting changed while still inside the onboarding flow */
interface OnboardingSettingChangedEvent extends BaseEvent {
  kind: 'onboarding_setting_changed'
  settingKey: string
  previousValue: string | number | boolean | null
  newValue: string | number | boolean | null
}

interface OnboardingCompletedEvent extends BaseEvent {
  kind: 'onboarding_completed'
  totalDurationMs: number
}

interface OnboardingAbandonedEvent extends BaseEvent {
  kind: 'onboarding_abandoned'
  lastStep: OnboardingAbandonStep
}

// ─── App Lifecycle ────────────────────────────────────────────────────────────

interface AppOpenedEvent extends BaseEvent {
  kind: 'app_opened'
  source: AppOpenSource
  /** ID of the notification that triggered the open, if applicable */
  notificationId: string | null
  /** Minutes since the last recorded app open; null on first-ever open */
  minutesSinceLastOpen: number | null
  localHourOfDay: number // 0–23, for timing-signal learning
  localDayOfWeek: number // 0 = Sunday, 6 = Saturday
}

interface AppBackgroundedEvent extends BaseEvent {
  kind: 'app_backgrounded'
  foregroundDurationMs: number
}

interface AppForegroundedEvent extends BaseEvent {
  kind: 'app_foregrounded'
  backgroundDurationMs: number
}

// ─── Session ─────────────────────────────────────────────────────────────────

interface SessionStartedEvent extends BaseEvent {
  kind: 'session_started'
  resumedFromLessonId: string | null // null if brand-new session
}

interface SessionEndedEvent extends BaseEvent {
  kind: 'session_ended'
  durationMs: number
  reason: SessionEndReason
  lessonsAttempted: number
  lessonsCompleted: number
  overallMasteryAtEnd: number // 0–100 snapshot
}

// ─── Settings (post-onboarding) ───────────────────────────────────────────────

interface SettingsDashboardOpenedEvent extends BaseEvent {
  kind: 'settings_dashboard_opened'
  source: SettingsDashboardSource
}

/** Single setting changed from the post-onboarding settings dashboard */
interface SettingUpdatedEvent extends BaseEvent {
  kind: 'setting_updated'
  settingKey: string
  previousValue: string | number | boolean | null
  newValue: string | number | boolean | null
}

// ─── Level ────────────────────────────────────────────────────────────────────

interface LevelStartedEvent extends BaseEvent {
  kind: 'level_started'
  levelId: string
  isRestart: boolean
}

interface LevelCompletedEvent extends BaseEvent {
  kind: 'level_completed'
  levelId: string
  masteryScore: number // 0–100
  durationMs: number
  lessonsCompleted: number
  lessonsSkipped: number
}

// ─── Lesson ───────────────────────────────────────────────────────────────────

interface LessonStartedEvent extends BaseEvent {
  kind: 'lesson_started'
  lessonId: string
  levelId: string
  isRevisit: boolean
  /** DirectiveType string that triggered navigation to this lesson, if any */
  directiveInEffect: string | null
}

/** Fired once the content pane has been fully rendered and the learner dwells */
interface LessonContentViewedEvent extends BaseEvent {
  kind: 'lesson_content_viewed'
  lessonId: string
  levelId: string
  contentType: 'text' | 'image'
  viewDurationMs: number
}

interface LessonCompletedEvent extends BaseEvent {
  kind: 'lesson_completed'
  lessonId: string
  levelId: string
  passed: boolean
  durationMs: number
  attemptNumber: number
  hintUsed: boolean
  reviewTaken: boolean
  pointsAwarded: number // 0, 5, 7, or 10 per mastery table
  masteryScoreAfter: number // 0–100 for this lesson after completion
}

interface LessonAbandonedEvent extends BaseEvent {
  kind: 'lesson_abandoned'
  lessonId: string
  levelId: string
  reason: LessonAbandonReason
  timeInLessonMs: number
  reachedQuestion: boolean
}

interface LessonRevisitedEvent extends BaseEvent {
  kind: 'lesson_revisited'
  lessonId: string
  levelId: string
  source: LessonRevisitSource
  daysSinceLastAttempt: number | null
}

// ─── Question & Answer ────────────────────────────────────────────────────────

interface QuestionShownEvent extends BaseEvent {
  kind: 'question_shown'
  lessonId: string
  levelId: string
  questionFormat: QuestionFormat
  attemptNumber: number
}

interface AnswerSubmittedEvent extends BaseEvent {
  kind: 'answer_submitted'
  lessonId: string
  levelId: string
  questionFormat: QuestionFormat
  /** The option ID chosen; null for true_false */
  selectedOptionId: string | null
  /** The boolean chosen; null for multiple_choice */
  selectedBooleanAnswer: boolean | null
  isCorrect: boolean
  attemptNumber: number
  hintUsed: boolean
  /** Milliseconds from question_shown to this submission */
  answerLatencyMs: number
  pointsAwarded: number
}

interface HintRequestedEvent extends BaseEvent {
  kind: 'hint_requested'
  lessonId: string
  levelId: string
  attemptNumber: number
  /** Time elapsed since question_shown before hint was requested */
  timeInQuestionMs: number
}

interface HintShownEvent extends BaseEvent {
  kind: 'hint_shown'
  lessonId: string
  levelId: string
}

interface ExplanationViewedEvent extends BaseEvent {
  kind: 'explanation_viewed'
  lessonId: string
  levelId: string
  wasCorrect: boolean
  viewDurationMs: number
}

// ─── Level Review ─────────────────────────────────────────────────────────────

interface LevelReviewStartedEvent extends BaseEvent {
  kind: 'level_review_started'
  levelId: string
  reviewId: string
  triggeredBy: ReviewTrigger
}

interface LevelReviewCompletedEvent extends BaseEvent {
  kind: 'level_review_completed'
  levelId: string
  reviewId: string
  passed: boolean
  durationMs: number
  masteryScoreAfter: number // 0–100
}

interface ReviewCardShownEvent extends BaseEvent {
  kind: 'review_card_shown'
  levelId: string
  reviewId: string
  lessonId: string
  cardOrder: number
}

interface ReviewAnswerSubmittedEvent extends BaseEvent {
  kind: 'review_answer_submitted'
  levelId: string
  reviewId: string
  lessonId: string
  questionFormat: QuestionFormat
  selectedOptionId: string | null
  selectedBooleanAnswer: boolean | null
  isCorrect: boolean
  hintUsed: boolean
  answerLatencyMs: number
}

// ─── Navigation & Progress ────────────────────────────────────────────────────

interface ProgressDashboardViewedEvent extends BaseEvent {
  kind: 'progress_dashboard_viewed'
}

interface RoadmapViewedEvent extends BaseEvent {
  kind: 'roadmap_viewed'
}

interface ContentLibraryViewedEvent extends BaseEvent {
  kind: 'content_library_viewed'
}

interface RecommendedNextTappedEvent extends BaseEvent {
  kind: 'recommended_next_tapped'
  recommendedLessonId: string
  recommendedLevelId: string
}

// ─── AI Teacher ───────────────────────────────────────────────────────────────

interface AiResponseStartedEvent extends BaseEvent {
  kind: 'ai_response_started'
  lessonId: string
  /** DirectiveType string that shaped the prompt */
  directiveType: string
  teachingTone: string
  explanationDepth: string
}

interface AiResponseCompletedEvent extends BaseEvent {
  kind: 'ai_response_completed'
  lessonId: string
  durationMs: number
  /** null if the model doesn't return a usage count */
  outputTokenCount: number | null
}

interface AiResponseErrorEvent extends BaseEvent {
  kind: 'ai_response_error'
  lessonId: string
  errorCode: string
  retryAttempt: number
}

// ─── Brain ────────────────────────────────────────────────────────────────────

/** Fired when the loop receives a directive back from the brain */
interface DirectiveReceivedEvent extends BaseEvent {
  kind: 'directive_received'
  directiveType: string // mirrors DirectiveType; string to avoid circular import
  targetLessonId: string | null
  targetLevelId: string | null
  overallMasteryInDirective: number
  rationale: string
}

/** Fired once the loop has acted on the directive and changed the UI */
interface DirectiveAppliedEvent extends BaseEvent {
  kind: 'directive_applied'
  directiveType: string
  targetLessonId: string | null
  targetLevelId: string | null
}

// ─── Admin / Debug ────────────────────────────────────────────────────────────

interface AdminDashboardOpenedEvent extends BaseEvent {
  kind: 'admin_dashboard_opened'
}

interface SimulatedHistoryViewedEvent extends BaseEvent {
  kind: 'simulated_history_viewed'
  personaId: string | null
}

interface PersonaSwitchedEvent extends BaseEvent {
  kind: 'persona_switched'
  fromPersonaId: string | null
  toPersonaId: string
}

// ─── Discriminated union ──────────────────────────────────────────────────────

export type LearningEvent =
  // Auth & Onboarding
  | PhoneEnteredEvent
  | OtpRequestedEvent
  | OtpSubmittedEvent
  | OtpVerifiedEvent
  | OtpFailedEvent
  | NameSubmittedEvent
  | OnboardingSettingsViewedEvent
  | OnboardingSettingChangedEvent
  | OnboardingCompletedEvent
  | OnboardingAbandonedEvent
  // App Lifecycle
  | AppOpenedEvent
  | AppBackgroundedEvent
  | AppForegroundedEvent
  // Session
  | SessionStartedEvent
  | SessionEndedEvent
  // Settings
  | SettingsDashboardOpenedEvent
  | SettingUpdatedEvent
  // Level
  | LevelStartedEvent
  | LevelCompletedEvent
  // Lesson
  | LessonStartedEvent
  | LessonContentViewedEvent
  | LessonCompletedEvent
  | LessonAbandonedEvent
  | LessonRevisitedEvent
  // Question & Answer
  | QuestionShownEvent
  | AnswerSubmittedEvent
  | HintRequestedEvent
  | HintShownEvent
  | ExplanationViewedEvent
  // Level Review
  | LevelReviewStartedEvent
  | LevelReviewCompletedEvent
  | ReviewCardShownEvent
  | ReviewAnswerSubmittedEvent
  // Navigation & Progress
  | ProgressDashboardViewedEvent
  | RoadmapViewedEvent
  | ContentLibraryViewedEvent
  | RecommendedNextTappedEvent
  // AI Teacher
  | AiResponseStartedEvent
  | AiResponseCompletedEvent
  | AiResponseErrorEvent
  // Brain
  | DirectiveReceivedEvent
  | DirectiveAppliedEvent
  // Admin / Debug
  | AdminDashboardOpenedEvent
  | SimulatedHistoryViewedEvent
  | PersonaSwitchedEvent

export type LearningEventKind = LearningEvent['kind']
