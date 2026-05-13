/**
 * Lesson Plans — Master Index
 * Aggregates all grade-level lesson plans into a single exportable collection.
 */
export { findLessonPlan, findPlanByQuery } from './lesson-plan-types';
export type { LessonPlan, GradeLevel, AgendaItem, TeacherScript, CheckForUnderstanding, ExitTicket, MiniGameConfig } from './lesson-plan-types';

import { PRE_K_PLANS } from './plans-prek';
import { KINDER_PLANS } from './plans-kinder';
import { MIDDLE_SCHOOL_PLANS } from './plans-middle';

import type { LessonPlan } from './lesson-plan-types';

/** All lesson plans across all grades */
export const ALL_LESSON_PLANS: LessonPlan[] = [
  ...PRE_K_PLANS,
  ...KINDER_PLANS,
  ...MIDDLE_SCHOOL_PLANS,
];
