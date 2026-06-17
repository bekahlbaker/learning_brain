// ─── Content ──────────────────────────────────────────────────────────────────

export interface TextContent {
  type: 'text'
  body: string
}

export interface ImageContent {
  type: 'image'
  imageUrl: string
  imageAlt: string
}

export type LessonContent = TextContent | ImageContent

// ─── Questions ────────────────────────────────────────────────────────────────

export interface QuestionOption {
  id: string
  text: string
}

export interface MultipleChoiceQuestion {
  type: 'multiple_choice'
  prompt: string
  options: QuestionOption[]
  correctOptionId: string
}

export interface TrueFalseQuestion {
  type: 'true_false'
  prompt: string
  correctAnswer: boolean
}

export type CurriculumQuestion = MultipleChoiceQuestion | TrueFalseQuestion

// ─── Lesson ───────────────────────────────────────────────────────────────────

export interface CurriculumLesson {
  id: string
  order: number
  title: string
  content: LessonContent
  hint: string
  question: CurriculumQuestion
}

// ─── Level Review ─────────────────────────────────────────────────────────────

export interface CurriculumLevelReview {
  id: string
  title: string
  description: string
  lessons: CurriculumLesson[]
}

// ─── Level ────────────────────────────────────────────────────────────────────

export interface CurriculumLevel {
  id: string
  order: number
  title: string
  description: string
  lessons: CurriculumLesson[]
  review: CurriculumLevelReview
}

// ─── Curriculum ───────────────────────────────────────────────────────────────

export interface Curriculum {
  id: string
  title: string
  description: string
  standard: string
  version: string
  /** Documents how correctOptionId and correctAnswer map to the right answer per question type */
  answerEncoding: Record<string, string>
  levels: CurriculumLevel[]
}

/** Matches the shape of curriculum.json at the file root */
export interface CurriculumFile {
  curriculum: Curriculum
}
