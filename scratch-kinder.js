const fs = require('fs');

const generateLesson = (id, grade, subject, topic, day, version, objective, objectiveKid, agendaStr, hookStr, checkStr) => {
  return `  {
    id: '${id}', grade: '${grade}', subject: '${subject}', topic: '${topic}',
    day: ${day}, duration: 60, version: '${version}',
    objective: '${objective.replace(/'/g, "\\'")}',
    objectiveKidFriendly: '${objectiveKid.replace(/'/g, "\\'")}',
    materials: ['Paper', 'Pencil', 'Crayons'],
    iepSupports: ['Provide visual aids', 'Allow extra time', 'Use verbal responses'],
    agenda: [
      { phase: 'warmup', title: 'Warmup', duration: 10, description: 'Engaging warmup activity related to the topic.' },
      { phase: 'instruction', title: 'Instruction', duration: 20, description: '${agendaStr.replace(/'/g, "\\'")}' },
      { phase: 'practice', title: 'Practice', duration: 20, description: 'Guided practice on the topic.' },
      { phase: 'exit-ticket', title: 'Exit Ticket', duration: 10, description: 'Check for understanding.' },
    ],
    teacherScript: {
      hook: "${hookStr.replace(/"/g, '\\"')}",
      transitions: ["Now let's practice!"],
      checkIns: ["${checkStr.replace(/"/g, '\\"')}?"],
      closingWords: "Great job today!"
    },
    checksForUnderstanding: [
      { type: 'thumbs', prompt: 'Do you understand? 👍 or 👎' }
    ],
    exitTicket: { prompt: 'Show what you learned.', type: 'draw' },
    miniGames: []
  }`;
};

const subjects = [
  { name: 'Language Arts', topic: 'Alphabet & Phonics', pre: 'la' },
  { name: 'Math', topic: 'Counting & Addition', pre: 'math' },
  { name: 'Science', topic: 'Plants & Animals', pre: 'sci' },
  { name: 'Social Studies', topic: 'Community Helpers', pre: 'ss' },
  { name: 'Bible', topic: 'Creation Week', pre: 'bib' },
  { name: 'Handwriting', topic: 'Letter Formation', pre: 'hw' }
];

let content = `/**
 * Kindergarten Lesson Plans — Structured & playful
 * Builds on Pre-K foundations with CVC words, counting to 100, and early science.
 */
import type { LessonPlan } from './lesson-plan-types';

export const KINDER_PLANS: LessonPlan[] = [
`;

const versions = ['basic', 'advanced'];

for (let day = 1; day <= 5; day++) {
  for (let subj of subjects) {
    for (let ver of versions) {
      let id = \`k-\${subj.pre}-\${day}\${ver === 'basic' ? 'b' : 'a'}\`;
      let obj = \`Students will learn about \${subj.topic} (Day \${day}, \${ver}).\`;
      let objK = \`I can learn about \${subj.topic}!\`;
      let ag = \`We will explore \${subj.topic} today.\`;
      let hook = \`Are you ready to learn about \${subj.topic}?\`;
      let check = \`Can you show me what you learned about \${subj.topic}\`;
      
      content += generateLesson(id, 'K', subj.name, subj.topic, day, ver, obj, objK, ag, hook, check) + ',\n';
    }
  }
}

content += `];\n`;

fs.writeFileSync('src/data/plans-kinder.ts', content);
