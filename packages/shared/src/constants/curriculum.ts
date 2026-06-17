import type { Curriculum, CurriculumFile } from '../types/curriculum'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const raw = require('./curriculum.json') as CurriculumFile

export const CURRICULUM_DATA: CurriculumFile = raw
export const CURRICULUM: Curriculum = raw.curriculum

export function allLessonIds(curriculum: Curriculum): string[] {
  return curriculum.levels.flatMap(level => level.lessons.map(l => l.id))
}

export function allReviewCardIds(curriculum: Curriculum): string[] {
  return curriculum.levels.flatMap(level => level.review.lessons.map(l => l.id))
}
