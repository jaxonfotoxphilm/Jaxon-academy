const fs = require('fs');

const generateLesson = (id, grade, subject, topic, day, version, objective, agendaStr, hookStr, checkStr) => {
  return `  {
    id: '${id}', grade: '${grade}', subject: '${subject}', topic: '${topic}',
    day: ${day}, duration: 75, version: '${version}',
    objective: '${objective.replace(/'/g, "\\'")}',
    materials: ['Paper', 'Pencil', 'Chromebook', 'Calculator'],
    iepSupports: ['Provide graphic organizers', 'Allow extended time', 'Use text-to-speech', 'Provide guided notes'],
    agenda: [
      { phase: 'warmup', title: 'Do Now', duration: 10, description: 'Quick writing prompt to activate prior knowledge on ${topic.replace(/'/g, "\\'")}.' },
      { phase: 'instruction', title: 'Direct Instruction', duration: 20, description: '${agendaStr.replace(/'/g, "\\'")}' },
      { phase: 'practice', title: 'Guided Practice', duration: 30, description: 'Students work through complex problems or texts in small groups.' },
      { phase: 'review', title: 'Review', duration: 10, description: 'Discuss findings and correct common misconceptions.' },
      { phase: 'exit-ticket', title: 'Exit Ticket', duration: 5, description: 'Demonstrate mastery of the objective.' },
    ],
    teacherScript: {
      hook: "${hookStr.replace(/"/g, '\\"')}",
      transitions: ["Now let's apply this concept to a new scenario. Break into your groups."],
      checkIns: ["${checkStr.replace(/"/g, '\\"')}?"],
      closingWords: "Great analytical work today. We will build on this tomorrow."
    },
    checksForUnderstanding: [
      { type: 'fist-to-five', prompt: 'Rate your understanding of this topic: fist to five.' },
      { type: 'quiz', question: 'Which is the best example?', options: ['A', 'B', 'C', 'D'], correctIndex: 1, feedbackWrong: 'Review your notes on the core concept.' }
    ],
    exitTicket: { prompt: 'Write a brief summary of what you learned.', type: 'write' },
    miniGames: []
  }`;
};

const contentMap = {
  'Language Arts': {
    topics: ['Analytical Reading', 'Literary Analysis', 'American Literature', 'Argumentative Writing', 'Poetry'],
    hooks: [
      "If I told you a 10-minute story, could you summarize it in ONE sentence?",
      "Every character in every story wants something. That WANT drives everything they do.",
      "A topic is one word. A theme is what the author is SAYING about that topic.",
      "How do you convince someone you are right? With EVIDENCE.",
      "Poetry is painting pictures with words. Let's look at the brushstrokes."
    ],
    agendas: [
      "The main idea is the BIG point. Details are the evidence.",
      "Motivation = WHY a character acts. Look for clues in dialogue.",
      "Topic = one word. Theme = a statement. Let's analyze.",
      "A strong claim needs solid textual evidence and reasoning.",
      "Analyze metaphors and similes in the given stanza."
    ],
    checks: [
      "Can you state the main idea WITHOUT looking at the text",
      "Read your claim out loud. Does it answer WHY",
      "Read your claim back. Is it a full sentence",
      "Does your evidence actually support your claim",
      "What is the hidden meaning of this metaphor"
    ]
  },
  'Math': {
    topics: ['Ratios', 'Equations', 'Linear Equations', 'Fractions', 'Geometry'],
    hooks: [
      "In a bag of candy, there are 6 red and 9 blue. How do we compare them mathematically?",
      "An equation is a BALANCE SCALE. Whatever you do to one side, you MUST do to the other.",
      "Every straight line in the universe can be described with just TWO numbers.",
      "Fractions are just division problems waiting to happen.",
      "Look around the room. Everything is built using geometric principles."
    ],
    agendas: [
      "A ratio compares two quantities. Simplify like fractions!",
      "To solve equations, UNDO operations. Addition undoes subtraction.",
      "m = slope (rise/run). b = y-intercept. Graph by starting at b.",
      "Find a common denominator before adding or subtracting.",
      "Calculate the area and perimeter of complex shapes."
    ],
    checks: [
      "What's the ratio of wheels to cars if there are 20 wheels and 5 cars",
      "Solve 2x - 4 = 10. What's your first step",
      "In y = 3x + 1, what's the slope",
      "How do you convert a mixed number to an improper fraction",
      "What is the formula for the area of a triangle"
    ]
  },
  'Science': {
    topics: ['Cells', 'Genetics', 'Chemical Reactions', 'Ecosystems', 'Forces'],
    hooks: [
      "You are made of approximately 37 TRILLION cells. Let's look inside.",
      "Why do you look like your parents? It's all in the DNA.",
      "When you toast bread, it turns brown. Can you UN-toast it?",
      "Everything in an ecosystem is connected. Remove one piece and it falls apart.",
      "For every action, there is an equal and opposite reaction. Let's test it."
    ],
    agendas: [
      "Animal cells have organelles — each with a job. Nucleus, mitochondria, etc.",
      "Punnett squares help us predict the probability of traits.",
      "Physical = same substance. Chemical = NEW substance formed.",
      "Construct a food web showing the flow of energy.",
      "Calculate force using F = ma."
    ],
    checks: [
      "What does the mitochondria do",
      "What is the difference between dominant and recessive",
      "Rust forming on iron — chemical or physical",
      "What happens if the apex predator is removed",
      "If mass increases, what happens to acceleration"
    ]
  },
  'History': {
    topics: ['Ancient Civilizations', 'World History', 'US History', 'Geography', 'Government'],
    hooks: [
      "Thousands of years ago, people built pyramids without modern tools. How?",
      "The world changed forever during the Renaissance. Let's travel back.",
      "The Revolutionary War was a fight for an idea. Was it worth it?",
      "Mountains and rivers shape human history. Let's look at the map.",
      "Who has the power in a democracy? YOU do."
    ],
    agendas: [
      "Examine the geography and social structure of Ancient Egypt.",
      "Analyze the causes and effects of the Industrial Revolution.",
      "Read primary sources from the Constitutional Convention.",
      "Map out trade routes and physical features of Asia.",
      "Understand the three branches of government and checks and balances."
    ],
    checks: [
      "Why did civilzations form near rivers",
      "What was one major impact of the printing press",
      "Why did the colonists want independence",
      "How does geography affect trade",
      "What is the purpose of the judicial branch"
    ]
  },
  'Health': {
    topics: ['Nutrition', 'Mental Wellness', 'Physical Fitness', 'First Aid', 'Healthy Habits'],
    hooks: [
      "You are what you eat! What did you eat for breakfast today?",
      "Your brain needs rest and care just like your muscles do.",
      "How many minutes of exercise do you need every day? Let's find out.",
      "If someone gets hurt, do you know what to do?",
      "Small habits today create big results tomorrow."
    ],
    agendas: [
      "Analyze food labels and understand macronutrients.",
      "Discuss strategies for managing stress and anxiety.",
      "Design a personal weekly workout plan.",
      "Learn the basics of CPR and treating minor wounds.",
      "Track daily water intake and sleep patterns."
    ],
    checks: [
      "What is the difference between a carb and a protein",
      "Name one healthy coping mechanism for stress",
      "What is your target heart rate",
      "What is the first step in emergency response",
      "How many hours of sleep should a teenager get"
    ]
  }
};

const curriculum = {
  '6': ['Language Arts', 'Math', 'Science', 'History'],
  '7': ['Language Arts', 'Math', 'Science', 'History'],
  '8': ['Language Arts', 'Math', 'Science', 'Health']
};

let content = `/**
 * Middle School Lesson Plans (6th, 7th, 8th Grade)
 * Rigorous academic content with Bloom's taxonomy, calculator use, written analysis.
 */
import type { LessonPlan } from './lesson-plan-types';

export const MIDDLE_SCHOOL_PLANS: LessonPlan[] = [
`;

for (let grade of ['6', '7', '8']) {
  content += `  // ═══ ${grade}TH GRADE ═══\n`;
  let subjects = curriculum[grade];
  
  for (let day = 1; day <= 4; day++) {
    for (let subj of subjects) {
      for (let ver of ['basic', 'advanced']) {
        let subjData = contentMap[subj];
        let tIndex = (day - 1) % subjData.topics.length;
        
        let topic = subjData.topics[tIndex];
        let hook = subjData.hooks[tIndex];
        let agenda = subjData.agendas[tIndex];
        let check = subjData.checks[tIndex];
        
        let id = `g${grade}-${subj.substring(0,3).toLowerCase()}-${day}${ver === 'basic' ? 'b' : 'a'}`;
        
        let obj = `Students will master ${topic} and apply it to real-world scenarios.`;
        if (ver === 'advanced') {
          obj = `Students will synthesize information about ${topic} and create an original project.`;
        }
        
        content += generateLesson(id, grade, subj, topic, day, ver, obj, agenda, hook, check) + ',\n';
      }
    }
  }
}

content += `];\n`;

fs.writeFileSync('src/data/plans-middle.ts', content);
