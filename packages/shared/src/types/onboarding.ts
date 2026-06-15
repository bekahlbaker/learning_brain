// ─── Profile & Authentication ────────────────────────────────────────────────

export type OtpStep = 'enter-phone' | 'enter-code' | 'verified';

export interface OnboardingProfile {
  name: string;
  /** E.164-formatted US phone number, e.g. "+15555550100" */
  phone: string;
  otpStep: OtpStep;
}

// ─── Learning Schedule ───────────────────────────────────────────────────────

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'no-preference';

export type DailyMinutes = 5 | 10 | 15 | 20 | 25 | 30;

export type DaysPerWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface OnboardingSchedule {
  preferredTimeOfDay: TimeOfDay;
  /** ISO date string ("YYYY-MM-DD") or null if the learner skipped this field */
  completionDeadline: string | null;
  dailyMinutes: DailyMinutes;
  daysPerWeek: DaysPerWeek;
}

// ─── Prior Knowledge ─────────────────────────────────────────────────────────

/** 1 = no confidence, 10 = fully confident */
export type ConfidenceLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type RestaurantExperience =
  | 'never'
  | 'less-than-a-year'
  | '1-3-years'
  | '3-plus-years';

export type CurrentRole =
  | 'server'
  | 'cook-or-prep-cook'
  | 'manager'
  | 'new-hire'
  | 'not-yet-working';

export interface OnboardingPriorKnowledge {
  confidenceLevel: ConfidenceLevel;
  restaurantExperience: RestaurantExperience;
  currentRole: CurrentRole;
  hasExistingCertification: boolean;
}

// ─── Motivation ──────────────────────────────────────────────────────────────

export type CourseReason =
  | 'required-by-employer'
  | 'want-to-learn'
  | 'renewing-certification'
  | 'preparing-for-new-job';

export type LearningStyle =
  | 'step-by-step'
  | 'dive-straight-in'
  | 'quick-overview-first';

export interface OnboardingMotivation {
  courseReason: CourseReason;
  learningStyle: LearningStyle;
}

// ─── Composed ────────────────────────────────────────────────────────────────

export interface OnboardingAnswers {
  profile: OnboardingProfile;
  schedule: OnboardingSchedule;
  priorKnowledge: OnboardingPriorKnowledge;
  motivation: OnboardingMotivation;
}
