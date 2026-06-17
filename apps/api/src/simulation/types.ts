import type { LearningEvent, LessonMasteryScore, PersonaId } from '@adaptive/shared'

export interface SimulatorConfig {
  seed: number
  /** Number of calendar days to simulate. Default: 30 */
  days: number
  /** ISO 8601 date string for day 0, e.g. "2026-05-17" */
  startDate: string
}

export interface GeneratedSummary {
  activeDays: number
  totalSessions: number
  totalLessons: number
  totalEvents: number
  finalOverallMastery: number
  /** Per-lesson mastery keyed by lessonId */
  lessonMastery: Record<string, LessonMasteryScore>
}

export interface GeneratedHistory {
  personaId: PersonaId
  seed: number
  simulatedDays: number
  startDate: string
  /** ISO 8601 timestamp of when this file was produced — stamped by the CLI caller */
  generatedAt: string
  summary: GeneratedSummary
  events: LearningEvent[]
}
