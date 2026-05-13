/**
 * Kindergarten Lesson Plans — Structured & playful
 * Builds on Pre-K foundations with CVC words, counting to 100, and early science.
 */
import type { LessonPlan } from './lesson-plan-types';

export const KINDER_PLANS: LessonPlan[] = [
  // ─── LANGUAGE ARTS ───
  {
    id: 'k-la-1b', grade: 'K', subject: 'Language Arts', topic: 'Alphabet Mastery',
    day: 1, duration: 60, version: 'basic',
    objective: 'Students will identify all 26 uppercase letters and produce their sounds.',
    objectiveKidFriendly: 'I can say ALL my letters and the sounds they make! 🎶',
    materials: ['Alphabet chart', 'Paper', 'Pencil'],
    iepSupports: ['Provide alphabet strip on desk', 'Focus on 10 letters at a time', 'Use multisensory letter cards'],
    agenda: [
      { phase: 'warmup', title: 'Alphabet Rap', duration: 5, description: 'Rap through the alphabet with hand motions!' },
      { phase: 'instruction', title: 'Letter Sound Review', duration: 15, description: 'Flash each letter card. Say the letter name AND its sound together.' },
      { phase: 'practice', title: 'Sound Match', duration: 20, description: 'Match uppercase letters to pictures that start with their sound.' },
      { phase: 'activity', title: 'Letter Bingo', duration: 10, description: 'Play letter bingo — cover the letter when you hear its sound!' },
      { phase: 'exit-ticket', title: 'Quick Check', duration: 5, description: 'Write 5 letters I call out.' },
    ],
    teacherScript: {
      hook: "Good morning, reading rockstars! 🎸 You already know your letters — but today we're going to be LETTER EXPERTS. Every letter has a name AND a secret sound. Let's unlock them all!",
      transitions: ["Now YOU'RE the teacher! I'll show a picture, and you tell ME what letter it starts with!"],
      checkIns: ["What sound does M make? /m/ like MONKEY! 🐒 Show me with your mouth!"],
      closingWords: "26 letters, 26 sounds — and you know them ALL! You're reading-ready! 📚",
    },
    checksForUnderstanding: [
      { type: 'show-me', prompt: 'Write the letter that makes the /s/ sound on your whiteboard!' },
      { type: 'choral', prompt: 'What letter does TIGER start with? Everyone!' },
    ],
    exitTicket: { prompt: 'Write these letters: M, S, T, P, R', type: 'write', expectedAnswer: 'M S T P R' },
    miniGames: [
      { type: 'matchPairs', pairs: [['M', 'Moon 🌙'], ['S', 'Sun ☀️'], ['T', 'Tree 🌳'], ['P', 'Pig 🐷'], ['R', 'Rain 🌧️'], ['D', 'Duck 🦆']] },
    ],
  },
  {
    id: 'k-la-1a', grade: 'K', subject: 'Language Arts', topic: 'CVC Words',
    day: 2, duration: 60, version: 'advanced',
    objective: 'Students will blend consonant-vowel-consonant (CVC) words and read simple sentences.',
    objectiveKidFriendly: 'I can sound out words like C-A-T and read them! 🐱',
    materials: ['Letter tiles', 'CVC word cards', 'Paper', 'Pencil'],
    iepSupports: ['Use color-coded vowels (red) and consonants (blue)', 'Provide word family lists', 'Allow finger tracking under words'],
    agenda: [
      { phase: 'warmup', title: 'Sound It Out', duration: 5, description: 'Blend sounds: /c/ /a/ /t/ = CAT! Try 3 words together.' },
      { phase: 'instruction', title: 'Building Words', duration: 15, description: 'Use letter tiles to build CVC words. Change one letter to make new words!' },
      { phase: 'practice', title: 'Read & Draw', duration: 20, description: 'Read a CVC word. Draw a picture of it. (cat, dog, sun, hat, bug)' },
      { phase: 'activity', title: 'Word Scramble', duration: 10, description: 'Unscramble 3-letter words by putting tiles in order.' },
      { phase: 'exit-ticket', title: 'Read to Me', duration: 5, description: 'Read 3 CVC words aloud to the teacher.' },
    ],
    teacherScript: {
      hook: "Guess what? You're going to READ today! Real words! We'll put sounds together like puzzle pieces. /d/ + /o/ + /g/ = ? That's right — DOG! 🐕",
      transitions: ["Change the first letter! If I change /c/ in CAT to /b/, what word do I get? BAT! 🦇"],
      checkIns: ["Sound out this word with me: /r/ /u/ /n/. What word? RUN! 🏃"],
      closingWords: "You READ words today! Cat, dog, sun, hat — you're officially a READER! 📖✨",
    },
    checksForUnderstanding: [
      { type: 'show-me', prompt: 'Build the word HOP with your letter tiles. Hold it up!' },
      { type: 'thumbs', prompt: 'Does P-I-G spell PIG? 👍 or 👎' },
    ],
    exitTicket: { prompt: 'Read these words: CAT  HOP  BUG', type: 'write', expectedAnswer: 'cat hop bug' },
    miniGames: [
      { type: 'wordScramble', words: ['CAT', 'DOG', 'SUN', 'HAT', 'BUG'] },
      { type: 'matchPairs', pairs: [['CAT', '🐱'], ['DOG', '🐕'], ['SUN', '☀️'], ['HAT', '🎩'], ['BUG', '🐛']] },
    ],
  },

  // ─── MATH ───
  {
    id: 'k-math-1b', grade: 'K', subject: 'Math', topic: 'Addition to 5',
    day: 1, duration: 60, version: 'basic',
    objective: 'Students will solve addition problems with sums up to 5 using objects and pictures.',
    objectiveKidFriendly: 'I can add numbers together to make 5 or less! ➕',
    materials: ['Counting blocks', 'Paper', 'Crayons'],
    iepSupports: ['Provide number line 0–10 on desk', 'Use physical blocks for every problem', 'Allow extra time'],
    agenda: [
      { phase: 'warmup', title: 'Counting Fingers', duration: 5, description: 'Hold up 2 fingers on one hand, 1 on the other. How many total?' },
      { phase: 'instruction', title: 'Putting Together', duration: 15, description: 'Addition means PUTTING TOGETHER. 2 blocks + 1 block = 3 blocks!' },
      { phase: 'practice', title: 'Draw & Add', duration: 20, description: 'Draw the circles, count them all. 2 + 3 = ?' },
      { phase: 'activity', title: 'Block Adding', duration: 10, description: 'Use blocks to solve 5 addition problems.' },
      { phase: 'exit-ticket', title: 'Solve 3', duration: 5, description: 'Solve: 1+2=  2+2=  3+1=' },
    ],
    teacherScript: {
      hook: "Mathematicians! 🧮 If I have 2 apples 🍎🍎 and you give me 1 more 🍎... how many do I have NOW? Let's find out! This is called ADDITION — putting things TOGETHER!",
      transitions: ["Now draw 2 circles. Draw 3 more circles. Count ALL the circles. That's addition!"],
      checkIns: ["Use your blocks. Show me 2 + 1. How many total?"],
      closingWords: "You can ADD! 2+1=3, 2+3=5! You're a math wizard! 🧙‍♂️",
    },
    checksForUnderstanding: [
      { type: 'show-me', prompt: 'Show me 2+2 with your fingers!' },
      { type: 'thumbs', prompt: 'Does 1+1 = 3? 👍 or 👎' },
    ],
    exitTicket: { prompt: 'Solve: 1+2=___  2+2=___  3+1=___', type: 'solve', expectedAnswer: '3, 4, 4' },
    miniGames: [
      { type: 'countObjects', items: [{ label: '🍎🍎 + 🍎 = ?', answer: 3 }, { label: '⭐⭐ + ⭐⭐ = ?', answer: 4 }, { label: '🐟 + 🐟🐟🐟 = ?', answer: 4 }] },
    ],
  },

  // ─── SCIENCE ───
  {
    id: 'k-sci-1b', grade: 'K', subject: 'Science', topic: 'Plants & Seeds',
    day: 1, duration: 60, version: 'basic',
    objective: 'Students will identify the parts of a plant (roots, stem, leaves, flower) and explain that plants need water and sunlight.',
    objectiveKidFriendly: 'I know the parts of a plant and what plants need to grow! 🌱',
    materials: ['Paper', 'Crayons', 'Real plant or picture'],
    iepSupports: ['Provide pre-labeled plant diagram', 'Use real plant for tactile exploration', 'Limit to 3 parts for IEP students'],
    agenda: [
      { phase: 'warmup', title: 'Plant Yoga', duration: 5, description: 'Be a seed (curl up). Grow roots (spread feet). Grow a stem (stand tall). Open leaves (spread arms)!' },
      { phase: 'instruction', title: 'Parts of a Plant', duration: 15, description: 'Roots drink water, stems hold the plant up, leaves catch sunlight, flowers make seeds!' },
      { phase: 'practice', title: 'Label the Plant', duration: 20, description: 'Color the plant. Label: roots, stem, leaf, flower.' },
      { phase: 'activity', title: 'What Do Plants Need?', duration: 10, description: 'Draw a sun and water drops next to your plant. Plants need BOTH!' },
      { phase: 'exit-ticket', title: 'Plant Parts', duration: 5, description: 'Point to the roots, stem, and leaves.' },
    ],
    teacherScript: {
      hook: "Scientists! 🔬 Look at this plant! It's ALIVE! But how does it eat? It doesn't have a mouth! Today we'll discover how plants get their food — it's like MAGIC! ✨",
      transitions: ["The ROOTS are underground like straws, drinking up water! The STEM is like an elevator, carrying water UP!"],
      checkIns: ["Point to the part of the plant that catches sunlight. Yes! The LEAVES! 🍃"],
      closingWords: "You know all about plants now! Roots, stem, leaves, flower — and they need water + sunlight! You're a plant scientist! 🌻",
    },
    checksForUnderstanding: [
      { type: 'show-me', prompt: 'Point to the ROOTS on your plant picture!' },
      { type: 'thumbs', prompt: 'Do plants need sunlight to grow? 👍 or 👎' },
    ],
    exitTicket: { prompt: 'Draw a plant with roots, stem, and leaves. Draw the sun and water.', type: 'draw' },
    miniGames: [
      { type: 'matchPairs', pairs: [['Roots 🌱', 'Drink water from soil'], ['Stem 🌿', 'Holds the plant up'], ['Leaves 🍃', 'Catch sunlight'], ['Flower 🌸', 'Makes seeds']] },
    ],
  },

  // ─── SOCIAL STUDIES ───
  {
    id: 'k-ss-1b', grade: 'K', subject: 'Social Studies', topic: 'Community Helpers',
    day: 1, duration: 60, version: 'basic',
    objective: 'Students will identify 4 community helpers and describe how they help us.',
    objectiveKidFriendly: 'I know who helps our town and what they do! 🚒👩‍⚕️',
    materials: ['Paper', 'Crayons', 'Community helper picture cards'],
    iepSupports: ['Use picture cards with helper names', 'Allow role-play instead of writing', 'Provide sentence frames'],
    agenda: [
      { phase: 'warmup', title: 'Who Helps?', duration: 5, description: 'If your house is on fire, who do you call? If you\'re sick, who helps?' },
      { phase: 'instruction', title: 'Meet the Helpers', duration: 15, description: 'Firefighters, doctors, police officers, and teachers — what does each one do?' },
      { phase: 'practice', title: 'Match the Helper', duration: 20, description: 'Draw a line from each helper to their tool (stethoscope, fire hose, badge, book).' },
      { phase: 'activity', title: 'When I Grow Up', duration: 10, description: 'Draw yourself as a community helper. What would YOU be?' },
      { phase: 'exit-ticket', title: 'Name 2 Helpers', duration: 5, description: 'Name 2 community helpers and what they do.' },
    ],
    teacherScript: {
      hook: "Who keeps us SAFE? Who helps when we're SICK? Today we'll learn about the amazing people in our town who help us every day! They're called COMMUNITY HELPERS! 🦸",
      transitions: ["Firefighters are SO brave! They put out fires and rescue people. What tool do they use? A FIRE HOSE! 🚒"],
      checkIns: ["Who helps us when we're sick? Yes! A DOCTOR! 👩‍⚕️ What tool do they use?"],
      closingWords: "Community helpers make our town safe and happy. And guess what? YOU can be a helper too — by being kind! 💛",
    },
    checksForUnderstanding: [
      { type: 'choral', prompt: 'Who puts out fires? Everyone say it!' },
      { type: 'thumbs', prompt: 'Does a doctor use a fire hose? 👍 or 👎' },
    ],
    exitTicket: { prompt: 'Draw your favorite community helper and their tool.', type: 'draw' },
    miniGames: [
      { type: 'matchPairs', pairs: [['👩‍⚕️ Doctor', 'Helps sick people'], ['🚒 Firefighter', 'Puts out fires'], ['👮 Police', 'Keeps us safe'], ['👩‍🏫 Teacher', 'Helps us learn']] },
    ],
  },

  // ─── BIBLE ───
  {
    id: 'k-bib-1b', grade: 'K', subject: 'Bible', topic: 'Creation Week',
    day: 1, duration: 60, version: 'basic',
    objective: 'Students will recall the 7 days of creation in order and identify what God made each day.',
    objectiveKidFriendly: 'I can tell you what God made on each day of creation! 🌍',
    materials: ['Paper', 'Crayons', 'Creation day cards'],
    iepSupports: ['Provide picture sequence cards', 'Focus on days 1-4 for modified goal', 'Use hand motions for each day'],
    agenda: [
      { phase: 'warmup', title: 'Creation Song', duration: 5, description: 'Sing a creation song with hand motions for each day.' },
      { phase: 'instruction', title: '7 Amazing Days', duration: 15, description: 'Day 1: Light! Day 2: Sky! Day 3: Land & Plants! Day 4: Sun, Moon, Stars! Day 5: Fish & Birds! Day 6: Animals & People! Day 7: REST!' },
      { phase: 'practice', title: 'Creation Book', duration: 20, description: 'Draw a picture for each day of creation in your mini-book.' },
      { phase: 'activity', title: 'Order the Days', duration: 10, description: 'Put the creation cards in the right order!' },
      { phase: 'exit-ticket', title: 'What Day?', duration: 5, description: 'What did God make on Day 3? On Day 6?' },
    ],
    teacherScript: {
      hook: "In the very beginning, there was NOTHING — just darkness! And then God said, 'Let there be LIGHT!' and BOOM — light appeared! 💡 Let's find out what God made on ALL 7 days!",
      transitions: ["Day 4 is my favorite — God made the SUN ☀️, the MOON 🌙, and ALL the STARS ⭐! Can you count the stars? There are too many!"],
      checkIns: ["What did God make on Day 5? Fish and BIRDS! Can you flap your wings like a bird? 🦅"],
      closingWords: "God made EVERYTHING — and on Day 7, He rested! Even God takes rest days. What an amazing Creator! 🙏",
    },
    checksForUnderstanding: [
      { type: 'show-me', prompt: 'Hold up the card for Day 3. What did God make?' },
      { type: 'choral', prompt: 'What did God do on Day 7? Everyone say it!' },
    ],
    exitTicket: { prompt: 'Draw what God made on Day 4 (sun, moon, stars).', type: 'draw' },
    miniGames: [
      { type: 'matchPairs', pairs: [['Day 1', 'Light 💡'], ['Day 2', 'Sky ☁️'], ['Day 3', 'Land & Plants 🌱'], ['Day 4', 'Sun, Moon, Stars ⭐'], ['Day 5', 'Fish & Birds 🐟🦅'], ['Day 6', 'Animals & People 🐘👫'], ['Day 7', 'God Rested 😴']] },
    ],
  },
];
