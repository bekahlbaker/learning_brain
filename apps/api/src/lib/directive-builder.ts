import type { LearnerProfile as PrismaLearnerProfile, LessonMastery as PrismaLessonMastery } from '@prisma/client'
import type {
  BrainDirective,
  BrainFlags,
  BrainRequest,
  DirectiveType,
  ExplanationDepth,
  LessonMasteryScore,
  PersonaId,
  TeachingTone,
} from '@adaptive/shared'
import { PERSONAS_BY_ID } from '@adaptive/shared'

export function buildDirective(
  profile: PrismaLearnerProfile,
  masteryRows: PrismaLessonMastery[],
  request: BrainRequest
): BrainDirective {
  const isColdStart = masteryRows.length === 0 || masteryRows.every(m => m.totalAttempts === 0)

  let directiveType: DirectiveType
  let teachingTone: TeachingTone
  let explanationDepth: ExplanationDepth
  let rationale: string

  if (isColdStart && profile.personaId) {
    const persona = PERSONAS_BY_ID[profile.personaId as PersonaId]
    if (persona) {
      directiveType = persona.coldStart.firstDirective
      teachingTone = persona.coldStart.teachingTone
      explanationDepth = persona.coldStart.explanationDepth
      rationale = `Cold start — applying "${persona.label}" persona defaults. ${persona.description}`
    } else {
      directiveType = 'continue_with_plan'
      teachingTone = 'neutral'
      explanationDepth = 'standard'
      rationale = 'Cold start — no matching persona found, using neutral defaults'
    }
  } else {
    directiveType = 'continue_with_plan'
    teachingTone = profile.teachingTone as TeachingTone
    explanationDepth = profile.explanationDepth as ExplanationDepth
    rationale = `Profile-driven — tone: ${teachingTone}, depth: ${explanationDepth}, overall mastery: ${profile.overallMastery}`
  }

  const masteryScores: Record<string, LessonMasteryScore> = {}
  for (const row of masteryRows) {
    masteryScores[row.lessonId] = {
      lessonId: row.lessonId,
      score: row.score,
      correctOnFirstTry: row.correctOnFirstTry,
      correctAfterHint: row.correctAfterHint,
      correctAfterReview: row.correctAfterReview,
      incorrect: row.incorrect,
      totalAttempts: row.totalAttempts,
      lastAttemptAt: row.lastAttemptAt?.toISOString() ?? null,
    }
  }

  const overallMastery = computeOverallMastery(masteryRows)

  const flags: BrainFlags = {
    suggestBreak: false,
    flaggedForReview: Object.values(masteryScores).some(m => m.score > 0 && m.score < 50),
    progressStalled: false,
    disengagementRisk: false,
  }

  return {
    directiveType,
    targetLessonId: null,
    targetLevelId: null,
    teachingTone,
    explanationDepth,
    masteryScores,
    overallMastery,
    recommendedNextLessonId: null,
    flags,
    rationale,
    issuedAt: new Date().toISOString(),
  }
}

function computeOverallMastery(rows: PrismaLessonMastery[]): number {
  const attempted = rows.filter(r => r.totalAttempts > 0)
  if (attempted.length === 0) return 0
  return Math.round(attempted.reduce((sum, r) => sum + r.score, 0) / attempted.length)
}
