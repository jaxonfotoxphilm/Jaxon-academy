/**
 * Lesson Plan Type Definitions
 * 
 * Structured lesson plan system following teacher-coach format:
 * objective → agenda → teacher script → checks for understanding → exit ticket
 */

export type GradeLevel = 'PK' | 'K' | '6' | '7' | '8';

export interface AgendaItem {
  phase: 'warmup' | 'instruction' | 'practice' | 'activity' | 'review' | 'exit-ticket';
  title: string;
  duration: number; // minutes
  description: string;
}

export interface TeacherScript {
  hook: string;
  transitions: string[];
  checkIns: string[];
  closingWords: string;
}

export interface CheckForUnderstanding {
  type: 'thumbs' | 'choral' | 'quiz' | 'show-me' | 'fist-to-five';
  prompt?: string;
  /** For quiz type */
  question?: string;
  options?: string[];
  correctIndex?: number;
  feedbackWrong?: string;
}

export interface ExitTicket {
  prompt: string;
  type: 'draw' | 'circle' | 'write' | 'solve' | 'multiple-choice';
  /** For multiple-choice exit tickets */
  options?: string[];
  correctIndex?: number;
  /** Expected answer for written/solve types */
  expectedAnswer?: string;
}

export interface MiniGameConfig {
  type: 'wordScramble' | 'matchPairs' | 'fillBlank' | 'trueFalse' | 'colorMatch' | 'countObjects' | 'rhymeMatch' | 'letterTrace';
  /** Content passed directly — no more static lookup */
  words?: string[];
  pairs?: [string, string][];
  sentences?: [string, string][];
  trueFalse?: [string, boolean][];
  /** For PK/K visual games */
  items?: { label: string; answer: string | number }[];
}

export interface LessonPlan {
  id: string;
  grade: GradeLevel;
  subject: string;
  topic: string;
  day: number;
  duration: number;

  objective: string;
  objectiveKidFriendly?: string; // simplified "I can..." for PK/K
  materials: string[];
  iepSupports: string[];

  agenda: AgendaItem[];
  teacherScript: TeacherScript;
  checksForUnderstanding: CheckForUnderstanding[];
  exitTicket: ExitTicket;

  miniGames: MiniGameConfig[];
  version: 'basic' | 'advanced';
}

/** Helper to find a lesson plan by grade + subject + day */
export function findLessonPlan(
  plans: LessonPlan[],
  grade: GradeLevel,
  subject: string,
  day: number,
  version: 'basic' | 'advanced' = 'basic'
): LessonPlan | undefined {
  return plans.find(
    p => p.grade === grade &&
      p.subject.toLowerCase().includes(subject.toLowerCase()) &&
      p.day === day &&
      p.version === version
  );
}

/** Get the best matching plan for a dynamic query string */
export function findPlanByQuery(
  plans: LessonPlan[],
  gradeLevel: string,
  query: string,
  version: 'basic' | 'advanced' = 'basic'
): LessonPlan | undefined {
  const gradeMap: Record<string, GradeLevel> = {
    'pre-k': 'PK', 'prek': 'PK', 'pk': 'PK',
    'kindergarten': 'K', 'kinder': 'K', 'k': 'K',
    '6th grade': '6', 'grade 6': '6', '6': '6',
    '7th grade': '7', 'grade 7': '7', '7': '7',
    '8th grade': '8', 'grade 8': '8', '8': '8',
  };
  const grade = gradeMap[gradeLevel.toLowerCase()] || '6';
  const topicClean = query.replace('dynamic:', '').toLowerCase();

  return plans.find(
    p => p.grade === grade &&
      p.version === version &&
      (p.topic.toLowerCase().includes(topicClean) ||
       topicClean.includes(p.topic.toLowerCase()) ||
       p.subject.toLowerCase().includes(topicClean))
  );
}
