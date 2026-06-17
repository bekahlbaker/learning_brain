import type {
  LearningEvent,
  LearnerPersona,
  LessonMasteryScore,
  PersonaId,
} from '@adaptive/shared'
import type {
  Curriculum,
  CurriculumLesson,
  CurriculumLevelReview,
  CurriculumQuestion,
} from '@adaptive/shared'
import type { GeneratedHistory, GeneratedSummary, SimulatorConfig } from './types'
import { Prng } from './prng'

// ─── Internal state ───────────────────────────────────────────────────────────

interface MutableLessonMastery {
  correctOnFirstTry: number
  correctAfterHint: number
  correctAfterReview: number
  incorrect: number
  totalAttempts: number
  score: number
  lastAttemptAt: string | null
}

interface SimState {
  readonly personaId: PersonaId
  readonly userId: string
  // Curriculum position
  workQueueIndex: number
  currentLevelId: string | null
  levelStartMs: number
  lessonsCompletedInLevel: number
  // Mastery
  lessonMastery: Map<string, MutableLessonMastery>
  // Counters
  activeDays: number
  totalSessions: number
  totalLessons: number
  // Time
  wallClock: number
  lastOpenedAt: number | null
  // Event sequencing
  globalSeq: number
}

// ─── Work queue ───────────────────────────────────────────────────────────────

type WorkItem =
  | { kind: 'lesson'; levelId: string; lesson: CurriculumLesson }
  | { kind: 'review'; levelId: string; review: CurriculumLevelReview; regularLessonCount: number }

function buildWorkQueue(persona: LearnerPersona, curriculum: Curriculum): WorkItem[] {
  const queue: WorkItem[] = []
  for (const level of curriculum.levels) {
    if (persona.coldStart.firstDirective === 'skip_to_level_quiz') {
      // Experienced: skip regular lessons, go straight to level review
      queue.push({ kind: 'review', levelId: level.id, review: level.review, regularLessonCount: level.lessons.length })
    } else {
      for (const lesson of level.lessons) {
        queue.push({ kind: 'lesson', levelId: level.id, lesson })
      }
      queue.push({ kind: 'review', levelId: level.id, review: level.review, regularLessonCount: level.lessons.length })
    }
  }
  return queue
}

// ─── Event factories ──────────────────────────────────────────────────────────

function nextBase(
  state: SimState,
  sessionId: string | null,
): {
  eventId: string
  userId: string
  sessionId: string | null
  timestamp: string
  clientTimestamp: string
  sequenceNumber: number
} {
  state.globalSeq++
  const clientTimestamp = new Date(state.wallClock).toISOString()
  return {
    eventId: `sim_${state.personaId}_${String(state.globalSeq).padStart(6, '0')}`,
    userId: state.userId,
    sessionId,
    timestamp: clientTimestamp,
    clientTimestamp,
    sequenceNumber: state.globalSeq,
  }
}

function makeAppOpened(
  state: SimState,
  prng: Prng,
  minutesSinceLastOpen: number | null,
  localHourOfDay: number,
  localDayOfWeek: number,
): LearningEvent {
  return {
    ...nextBase(state, null),
    kind: 'app_opened',
    source: prng.chance(0.9) ? 'direct' : 'push_notification',
    notificationId: null,
    minutesSinceLastOpen,
    localHourOfDay,
    localDayOfWeek,
  }
}

function makeAppBackgrounded(state: SimState, foregroundDurationMs: number): LearningEvent {
  return {
    ...nextBase(state, null),
    kind: 'app_backgrounded',
    foregroundDurationMs,
  }
}

function makeSessionStarted(
  state: SimState,
  sessionId: string,
  resumedFromLessonId: string | null,
): LearningEvent {
  return {
    ...nextBase(state, sessionId),
    kind: 'session_started',
    resumedFromLessonId,
  }
}

function makeSessionEnded(
  state: SimState,
  sessionId: string,
  durationMs: number,
  reason: 'completed' | 'abandoned' | 'timeout' | 'backgrounded',
  lessonsAttempted: number,
  lessonsCompleted: number,
  overallMastery: number,
): LearningEvent {
  return {
    ...nextBase(state, sessionId),
    kind: 'session_ended',
    durationMs,
    reason,
    lessonsAttempted,
    lessonsCompleted,
    overallMasteryAtEnd: overallMastery,
  }
}

function makeLevelStarted(
  state: SimState,
  sessionId: string,
  levelId: string,
): LearningEvent {
  return {
    ...nextBase(state, sessionId),
    kind: 'level_started',
    levelId,
    isRestart: false,
  }
}

function makeLevelCompleted(
  state: SimState,
  sessionId: string,
  levelId: string,
  masteryScore: number,
  durationMs: number,
  lessonsCompleted: number,
  lessonsSkipped: number,
): LearningEvent {
  return {
    ...nextBase(state, sessionId),
    kind: 'level_completed',
    levelId,
    masteryScore,
    durationMs,
    lessonsCompleted,
    lessonsSkipped,
  }
}

function makeLessonStarted(
  state: SimState,
  sessionId: string,
  lessonId: string,
  levelId: string,
  isRevisit: boolean,
): LearningEvent {
  return {
    ...nextBase(state, sessionId),
    kind: 'lesson_started',
    lessonId,
    levelId,
    isRevisit,
    directiveInEffect: null,
  }
}

function makeLessonContentViewed(
  state: SimState,
  sessionId: string,
  lessonId: string,
  levelId: string,
  contentType: 'text' | 'image',
  viewDurationMs: number,
): LearningEvent {
  return {
    ...nextBase(state, sessionId),
    kind: 'lesson_content_viewed',
    lessonId,
    levelId,
    contentType,
    viewDurationMs,
  }
}

function makeQuestionShown(
  state: SimState,
  sessionId: string,
  lessonId: string,
  levelId: string,
  questionFormat: 'multiple_choice' | 'true_false',
  attemptNumber: number,
): LearningEvent {
  return {
    ...nextBase(state, sessionId),
    kind: 'question_shown',
    lessonId,
    levelId,
    questionFormat,
    attemptNumber,
  }
}

function makeHintRequested(
  state: SimState,
  sessionId: string,
  lessonId: string,
  levelId: string,
  attemptNumber: number,
  timeInQuestionMs: number,
): LearningEvent {
  return {
    ...nextBase(state, sessionId),
    kind: 'hint_requested',
    lessonId,
    levelId,
    attemptNumber,
    timeInQuestionMs,
  }
}

function makeHintShown(
  state: SimState,
  sessionId: string,
  lessonId: string,
  levelId: string,
): LearningEvent {
  return {
    ...nextBase(state, sessionId),
    kind: 'hint_shown',
    lessonId,
    levelId,
  }
}

function makeAnswerSubmitted(
  state: SimState,
  sessionId: string,
  lessonId: string,
  levelId: string,
  questionFormat: 'multiple_choice' | 'true_false',
  selectedOptionId: string | null,
  selectedBooleanAnswer: boolean | null,
  isCorrect: boolean,
  attemptNumber: number,
  hintUsed: boolean,
  answerLatencyMs: number,
  pointsAwarded: number,
): LearningEvent {
  return {
    ...nextBase(state, sessionId),
    kind: 'answer_submitted',
    lessonId,
    levelId,
    questionFormat,
    selectedOptionId,
    selectedBooleanAnswer,
    isCorrect,
    attemptNumber,
    hintUsed,
    answerLatencyMs,
    pointsAwarded,
  }
}

function makeExplanationViewed(
  state: SimState,
  sessionId: string,
  lessonId: string,
  levelId: string,
  wasCorrect: boolean,
  viewDurationMs: number,
): LearningEvent {
  return {
    ...nextBase(state, sessionId),
    kind: 'explanation_viewed',
    lessonId,
    levelId,
    wasCorrect,
    viewDurationMs,
  }
}

function makeLessonCompleted(
  state: SimState,
  sessionId: string,
  lessonId: string,
  levelId: string,
  passed: boolean,
  durationMs: number,
  attemptNumber: number,
  hintUsed: boolean,
  reviewTaken: boolean,
  pointsAwarded: number,
  masteryScoreAfter: number,
): LearningEvent {
  return {
    ...nextBase(state, sessionId),
    kind: 'lesson_completed',
    lessonId,
    levelId,
    passed,
    durationMs,
    attemptNumber,
    hintUsed,
    reviewTaken,
    pointsAwarded,
    masteryScoreAfter,
  }
}

function makeLessonAbandoned(
  state: SimState,
  sessionId: string,
  lessonId: string,
  levelId: string,
  timeInLessonMs: number,
  reachedQuestion: boolean,
): LearningEvent {
  return {
    ...nextBase(state, sessionId),
    kind: 'lesson_abandoned',
    lessonId,
    levelId,
    reason: 'session_ended',
    timeInLessonMs,
    reachedQuestion,
  }
}

function makeLevelReviewStarted(
  state: SimState,
  sessionId: string,
  levelId: string,
  reviewId: string,
  triggeredBy: 'directive' | 'level_completion' | 'self_initiated',
): LearningEvent {
  return {
    ...nextBase(state, sessionId),
    kind: 'level_review_started',
    levelId,
    reviewId,
    triggeredBy,
  }
}

function makeReviewCardShown(
  state: SimState,
  sessionId: string,
  levelId: string,
  reviewId: string,
  lessonId: string,
  cardOrder: number,
): LearningEvent {
  return {
    ...nextBase(state, sessionId),
    kind: 'review_card_shown',
    levelId,
    reviewId,
    lessonId,
    cardOrder,
  }
}

function makeReviewAnswerSubmitted(
  state: SimState,
  sessionId: string,
  levelId: string,
  reviewId: string,
  lessonId: string,
  questionFormat: 'multiple_choice' | 'true_false',
  selectedOptionId: string | null,
  selectedBooleanAnswer: boolean | null,
  isCorrect: boolean,
  answerLatencyMs: number,
): LearningEvent {
  return {
    ...nextBase(state, sessionId),
    kind: 'review_answer_submitted',
    levelId,
    reviewId,
    lessonId,
    questionFormat,
    selectedOptionId,
    selectedBooleanAnswer,
    isCorrect,
    hintUsed: false,
    answerLatencyMs,
  }
}

function makeLevelReviewCompleted(
  state: SimState,
  sessionId: string,
  levelId: string,
  reviewId: string,
  passed: boolean,
  durationMs: number,
  masteryScoreAfter: number,
): LearningEvent {
  return {
    ...nextBase(state, sessionId),
    kind: 'level_review_completed',
    levelId,
    reviewId,
    passed,
    durationMs,
    masteryScoreAfter,
  }
}

// ─── Mastery helpers ──────────────────────────────────────────────────────────

function getOrInitMastery(state: SimState, lessonId: string): MutableLessonMastery {
  if (!state.lessonMastery.has(lessonId)) {
    state.lessonMastery.set(lessonId, {
      correctOnFirstTry: 0,
      correctAfterHint: 0,
      correctAfterReview: 0,
      incorrect: 0,
      totalAttempts: 0,
      score: 0,
      lastAttemptAt: null,
    })
  }
  return state.lessonMastery.get(lessonId)!
}

function recordLessonAnswer(
  state: SimState,
  lessonId: string,
  isCorrect: boolean,
  didHint: boolean,
  isRevisit: boolean,
): MutableLessonMastery {
  const m = getOrInitMastery(state, lessonId)
  m.totalAttempts++
  m.lastAttemptAt = new Date(state.wallClock).toISOString()

  if (isCorrect && !didHint && !isRevisit) {
    m.correctOnFirstTry++
    m.score = Math.max(m.score, 100)
  } else if (isCorrect && didHint) {
    m.correctAfterHint++
    m.score = Math.max(m.score, 70)
  } else if (isCorrect && isRevisit) {
    m.correctAfterReview++
    m.score = Math.max(m.score, 50)
  } else {
    m.incorrect++
    // score unchanged on incorrect
  }

  return m
}

function computeOverallMastery(state: SimState): number {
  const attempted = Array.from(state.lessonMastery.values()).filter(m => m.totalAttempts > 0)
  if (attempted.length === 0) return 0
  return Math.round(attempted.reduce((sum, m) => sum + m.score, 0) / attempted.length)
}

// ─── Behavior helpers ─────────────────────────────────────────────────────────

const MASTERY_BOOST_PER_SESSION: Record<string, number> = {
  fast: 0.03,
  moderate: 0.015,
  slow: 0.005,
  stalled: 0,
}

function effectiveCorrectRate(persona: LearnerPersona, state: SimState): number {
  const boost = MASTERY_BOOST_PER_SESSION[persona.behaviorProfile.masteryGrowthRate] ?? 0
  return Math.min(0.95, persona.behaviorProfile.baseCorrectRate + state.totalSessions * boost)
}

function pickAnswer(
  question: CurriculumQuestion,
  isCorrect: boolean,
  prng: Prng,
): { selectedOptionId: string | null; selectedBooleanAnswer: boolean | null } {
  if (question.type === 'multiple_choice') {
    if (isCorrect) {
      return { selectedOptionId: question.correctOptionId, selectedBooleanAnswer: null }
    }
    const wrongIds = question.options.map(o => o.id).filter(id => id !== question.correctOptionId)
    return { selectedOptionId: prng.pick(wrongIds), selectedBooleanAnswer: null }
  }
  return {
    selectedOptionId: null,
    selectedBooleanAnswer: isCorrect ? question.correctAnswer : !question.correctAnswer,
  }
}

function preferredHourOfDay(persona: LearnerPersona, prng: Prng): number {
  const pref = persona.onboardingAnswers.schedule.preferredTimeOfDay
  switch (pref) {
    case 'morning': return prng.intBetween(6, 10)
    case 'afternoon': return prng.intBetween(12, 17)
    case 'evening': return prng.intBetween(17, 22)
    default: return prng.intBetween(8, 21)
  }
}

// ─── Lesson simulation ────────────────────────────────────────────────────────

function simulateLesson(
  persona: LearnerPersona,
  state: SimState,
  sessionId: string,
  levelId: string,
  lesson: CurriculumLesson,
  prng: Prng,
): { events: LearningEvent[]; completed: boolean } {
  const events: LearningEvent[] = []
  const bp = persona.behaviorProfile
  const lessonStartMs = state.wallClock
  const isRevisit = (state.lessonMastery.get(lesson.id)?.totalAttempts ?? 0) > 0

  events.push(makeLessonStarted(state, sessionId, lesson.id, levelId, isRevisit))

  // Pre-content abandon (rare)
  if (prng.chance(bp.abandonRate * 0.2)) {
    events.push(makeLessonAbandoned(state, sessionId, lesson.id, levelId, state.wallClock - lessonStartMs, false))
    return { events, completed: false }
  }

  // Content dwell
  const contentDwell = prng.intBetween(bp.contentDwellMs.min, bp.contentDwellMs.max)
  state.wallClock += contentDwell
  events.push(makeLessonContentViewed(state, sessionId, lesson.id, levelId, lesson.content.type, contentDwell))

  // Post-content / pre-question abandon
  if (prng.chance(bp.abandonRate * 0.3)) {
    events.push(makeLessonAbandoned(state, sessionId, lesson.id, levelId, state.wallClock - lessonStartMs, false))
    return { events, completed: false }
  }

  const qFormat = lesson.question.type === 'multiple_choice' ? 'multiple_choice' : 'true_false'
  events.push(makeQuestionShown(state, sessionId, lesson.id, levelId, qFormat, 1))

  // Hint
  const didHint = prng.chance(bp.hintFrequency)
  if (didHint) {
    const timeBeforeHint = prng.intBetween(3_000, 15_000)
    state.wallClock += timeBeforeHint
    events.push(makeHintRequested(state, sessionId, lesson.id, levelId, 1, timeBeforeHint))
    events.push(makeHintShown(state, sessionId, lesson.id, levelId))
  }

  // Post-question abandon
  if (prng.chance(bp.abandonRate * 0.5)) {
    events.push(makeLessonAbandoned(state, sessionId, lesson.id, levelId, state.wallClock - lessonStartMs, true))
    return { events, completed: false }
  }

  // Answer
  const correct = prng.chance(effectiveCorrectRate(persona, state))
  const latency = prng.intBetween(bp.answerLatencyMs.min, bp.answerLatencyMs.max)
  state.wallClock += latency

  const points = correct ? (didHint ? 7 : 10) : 0
  const { selectedOptionId, selectedBooleanAnswer } = pickAnswer(lesson.question, correct, prng)
  events.push(makeAnswerSubmitted(state, sessionId, lesson.id, levelId, qFormat, selectedOptionId, selectedBooleanAnswer, correct, 1, didHint, latency, points))

  // Update mastery
  const mastery = recordLessonAnswer(state, lesson.id, correct, didHint, isRevisit)

  // Explanation view (occasional)
  if (prng.chance(0.35)) {
    const viewDuration = prng.intBetween(5_000, 20_000)
    state.wallClock += viewDuration
    events.push(makeExplanationViewed(state, sessionId, lesson.id, levelId, correct, viewDuration))
  }

  const duration = state.wallClock - lessonStartMs
  events.push(makeLessonCompleted(state, sessionId, lesson.id, levelId, correct, duration, 1, didHint, isRevisit, points, mastery.score))

  return { events, completed: true }
}

// ─── Level review simulation ──────────────────────────────────────────────────

function simulateLevelReview(
  persona: LearnerPersona,
  state: SimState,
  sessionId: string,
  levelId: string,
  review: CurriculumLevelReview,
  triggeredBy: 'directive' | 'level_completion',
  prng: Prng,
): { events: LearningEvent[]; passed: boolean } {
  const events: LearningEvent[] = []
  const bp = persona.behaviorProfile
  const reviewStartMs = state.wallClock

  events.push(makeLevelReviewStarted(state, sessionId, levelId, review.id, triggeredBy))

  let correct = 0
  for (let i = 0; i < review.lessons.length; i++) {
    const card = review.lessons[i]
    events.push(makeReviewCardShown(state, sessionId, levelId, review.id, card.id, i + 1))

    const isCorrect = prng.chance(effectiveCorrectRate(persona, state))
    const latency = prng.intBetween(bp.answerLatencyMs.min, bp.answerLatencyMs.max)
    state.wallClock += latency

    if (isCorrect) correct++

    const qFormat = card.question.type === 'multiple_choice' ? 'multiple_choice' : 'true_false'
    const { selectedOptionId, selectedBooleanAnswer } = pickAnswer(card.question, isCorrect, prng)
    events.push(makeReviewAnswerSubmitted(state, sessionId, levelId, review.id, card.id, qFormat, selectedOptionId, selectedBooleanAnswer, isCorrect, latency))

    // Track mastery for review cards so experienced persona has non-zero overall mastery
    recordLessonAnswer(state, card.id, isCorrect, false, false)

    // Brief dwell between cards
    state.wallClock += prng.intBetween(2_000, 8_000)
  }

  const passed = correct >= Math.ceil(review.lessons.length * 0.67)
  const duration = state.wallClock - reviewStartMs
  const overallMastery = computeOverallMastery(state)

  events.push(makeLevelReviewCompleted(state, sessionId, levelId, review.id, passed, duration, overallMastery))

  return { events, passed }
}

// ─── Session simulation ───────────────────────────────────────────────────────

function simulateSession(
  persona: LearnerPersona,
  state: SimState,
  workQueue: WorkItem[],
  prng: Prng,
): LearningEvent[] {
  const events: LearningEvent[] = []
  const sessionId = `sim_sess_${persona.personaId}_${String(state.totalSessions).padStart(4, '0')}`
  state.totalSessions++

  const sessionStartMs = state.wallClock
  const sessionDurationMs = prng.intBetween(
    persona.behaviorProfile.sessionDurationMinutes.min * 60_000,
    persona.behaviorProfile.sessionDurationMinutes.max * 60_000,
  )

  const firstItem = workQueue[state.workQueueIndex]
  const resumedFrom = firstItem?.kind === 'lesson' ? firstItem.lesson.id : null
  events.push(makeSessionStarted(state, sessionId, resumedFrom))

  let lessonsAttempted = 0
  let lessonsCompleted = 0
  let sessionAbandoned = false

  while (
    state.workQueueIndex < workQueue.length &&
    state.wallClock < sessionStartMs + sessionDurationMs
  ) {
    const item = workQueue[state.workQueueIndex]

    // Fire level_started when entering a new level
    if (item.levelId !== state.currentLevelId) {
      state.currentLevelId = item.levelId
      state.levelStartMs = state.wallClock
      state.lessonsCompletedInLevel = 0
      events.push(makeLevelStarted(state, sessionId, item.levelId))
    }

    if (item.kind === 'lesson') {
      const { events: lessonEvents, completed } = simulateLesson(
        persona, state, sessionId, item.levelId, item.lesson, prng,
      )
      events.push(...lessonEvents)
      lessonsAttempted++

      if (completed) {
        lessonsCompleted++
        state.lessonsCompletedInLevel++
        state.totalLessons++
        state.workQueueIndex++
      } else {
        // Abandon ends the session
        sessionAbandoned = true
        break
      }
    } else {
      // Review — always attempt, no mid-review abandon in B5
      const triggeredBy = persona.coldStart.firstDirective === 'skip_to_level_quiz'
        ? 'directive'
        : 'level_completion'

      const { events: reviewEvents, passed } = simulateLevelReview(
        persona, state, sessionId, item.levelId, item.review, triggeredBy, prng,
      )
      events.push(...reviewEvents)
      lessonsAttempted++
      if (passed) lessonsCompleted++

      const levelDurationMs = state.wallClock - state.levelStartMs
      const skipped = persona.coldStart.firstDirective === 'skip_to_level_quiz'
        ? item.regularLessonCount
        : 0
      events.push(makeLevelCompleted(state, sessionId, item.levelId, computeOverallMastery(state), levelDurationMs, state.lessonsCompletedInLevel, skipped))

      state.workQueueIndex++
    }

    // Small transition gap between work items
    state.wallClock += prng.intBetween(2_000, 5_000)
  }

  const sessionDurationActual = state.wallClock - sessionStartMs
  const reason = sessionAbandoned ? 'abandoned' : 'completed'

  events.push(makeSessionEnded(state, sessionId, sessionDurationActual, reason, lessonsAttempted, lessonsCompleted, computeOverallMastery(state)))

  return events
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function generateHistory(
  persona: LearnerPersona,
  curriculum: Curriculum,
  config: SimulatorConfig,
  generatedAt: string,
): GeneratedHistory {
  const prng = new Prng(config.seed)
  const startTs = Date.parse(config.startDate)

  const state: SimState = {
    personaId: persona.personaId,
    userId: `sim_${persona.personaId}`,
    workQueueIndex: 0,
    currentLevelId: null,
    levelStartMs: startTs,
    lessonsCompletedInLevel: 0,
    lessonMastery: new Map(),
    activeDays: 0,
    totalSessions: 0,
    totalLessons: 0,
    wallClock: startTs,
    lastOpenedAt: null,
    globalSeq: 0,
  }

  const workQueue = buildWorkQueue(persona, curriculum)
  const events: LearningEvent[] = []

  const DAY_MS = 86_400_000
  const HOUR_MS = 3_600_000

  for (let day = 0; day < config.days; day++) {
    if (state.workQueueIndex >= workQueue.length) break // course complete

    if (!prng.chance(persona.behaviorProfile.dailyEngagementRate)) continue

    state.activeDays++
    const dayStart = startTs + day * DAY_MS
    const hour = preferredHourOfDay(persona, prng)
    state.wallClock = dayStart + hour * HOUR_MS

    const minutesSinceLastOpen = state.lastOpenedAt !== null
      ? (state.wallClock - state.lastOpenedAt) / 60_000
      : null

    const localDayOfWeek = new Date(dayStart).getDay()

    events.push(makeAppOpened(state, prng, minutesSinceLastOpen, hour, localDayOfWeek))

    const appOpenMs = state.wallClock
    const sessionEvents = simulateSession(persona, state, workQueue, prng)
    events.push(...sessionEvents)

    events.push(makeAppBackgrounded(state, state.wallClock - appOpenMs))

    state.lastOpenedAt = state.wallClock
  }

  // Build summary
  const lessonMastery: Record<string, LessonMasteryScore> = {}
  for (const [lessonId, m] of state.lessonMastery.entries()) {
    lessonMastery[lessonId] = {
      lessonId,
      score: m.score,
      correctOnFirstTry: m.correctOnFirstTry,
      correctAfterHint: m.correctAfterHint,
      correctAfterReview: m.correctAfterReview,
      incorrect: m.incorrect,
      totalAttempts: m.totalAttempts,
      lastAttemptAt: m.lastAttemptAt,
    }
  }

  const summary: GeneratedSummary = {
    activeDays: state.activeDays,
    totalSessions: state.totalSessions,
    totalLessons: state.totalLessons,
    totalEvents: events.length,
    finalOverallMastery: computeOverallMastery(state),
    lessonMastery,
  }

  return {
    personaId: persona.personaId,
    seed: config.seed,
    simulatedDays: config.days,
    startDate: config.startDate,
    generatedAt,
    summary,
    events,
  }
}
