import type { LearningEvent } from '@adaptive/shared'
import type { GeneratedHistory } from './types'

export interface BehavioralFeatures {
  personaId: string
  /** lesson_abandoned / lesson_started */
  lessonAbandonRate: number
  /** hint_requested / answer_submitted */
  hintRate: number
  /** answer_submitted where isCorrect && !hintUsed && attemptNumber === 1 / total answers */
  correctOnFirstTryRate: number
  /** Median of answer_submitted.answerLatencyMs */
  medianAnswerLatencyMs: number
  /** Median of lesson_content_viewed.viewDurationMs */
  medianContentDwellMs: number
  /** Mean of session_ended.durationMs */
  avgSessionDurationMs: number
  /** summary.activeDays / simulatedDays */
  dailyEngagementRate: number
  /** True if any level_review_started.triggeredBy === 'directive' — experienced-only signal */
  skipBehaviorPresent: boolean
  directiveReviewCount: number
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[mid - 1]! + sorted[mid]!) / 2
    : sorted[mid]!
}

export function extractFeatures(history: GeneratedHistory): BehavioralFeatures {
  const { events } = history

  const lessonStarts = events.filter(e => e.kind === 'lesson_started').length
  const lessonAbandons = events.filter(e => e.kind === 'lesson_abandoned').length

  type AnswerEvent = Extract<LearningEvent, { kind: 'answer_submitted' }>
  const answerEvents = events.filter((e): e is AnswerEvent => e.kind === 'answer_submitted')
  const hintRequests = events.filter(e => e.kind === 'hint_requested').length

  type ContentViewEvent = Extract<LearningEvent, { kind: 'lesson_content_viewed' }>
  const contentViews = events.filter((e): e is ContentViewEvent => e.kind === 'lesson_content_viewed')

  type SessionEndEvent = Extract<LearningEvent, { kind: 'session_ended' }>
  const sessionEnds = events.filter((e): e is SessionEndEvent => e.kind === 'session_ended')

  type ReviewStartEvent = Extract<LearningEvent, { kind: 'level_review_started' }>
  const reviewStarts = events.filter((e): e is ReviewStartEvent => e.kind === 'level_review_started')

  const correctFirstTry = answerEvents.filter(
    e => e.isCorrect && !e.hintUsed && e.attemptNumber === 1,
  ).length

  const directiveReviewCount = reviewStarts.filter(e => e.triggeredBy === 'directive').length

  return {
    personaId: history.personaId,
    lessonAbandonRate: lessonStarts > 0 ? lessonAbandons / lessonStarts : 0,
    hintRate: answerEvents.length > 0 ? hintRequests / answerEvents.length : 0,
    correctOnFirstTryRate: answerEvents.length > 0 ? correctFirstTry / answerEvents.length : 0,
    medianAnswerLatencyMs: median(answerEvents.map(e => e.answerLatencyMs)),
    medianContentDwellMs: median(contentViews.map(e => e.viewDurationMs)),
    avgSessionDurationMs:
      sessionEnds.length > 0
        ? sessionEnds.reduce((sum, e) => sum + e.durationMs, 0) / sessionEnds.length
        : 0,
    dailyEngagementRate:
      history.simulatedDays > 0 ? history.summary.activeDays / history.simulatedDays : 0,
    skipBehaviorPresent: directiveReviewCount > 0,
    directiveReviewCount,
  }
}
