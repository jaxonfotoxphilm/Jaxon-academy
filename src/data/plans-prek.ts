/**
 * Pre-K Lesson Plans — "Easy Peasy" playful lessons
 * Designed for 4-year-olds with visual games, simple language, and lots of encouragement.
 */
import type { LessonPlan } from './lesson-plan-types';

export const PRE_K_PLANS: LessonPlan[] = [
  // ─── LANGUAGE ARTS ───
  {
    id: 'pk-la-1b', grade: 'PK', subject: 'Language Arts', topic: 'Letter Recognition',
    day: 1, duration: 60, version: 'basic',
    objective: 'Students will identify and name the letters A, B, and C.',
    objectiveKidFriendly: 'I can find the letters A, B, and C! 🔤',
    materials: ['Paper', 'Crayons', 'Letter cards'],
    iepSupports: ['Use large-print letter cards', 'Allow finger tracing before pencil work', 'Provide sensory letters (sandpaper/felt)'],
    agenda: [
      { phase: 'warmup', title: 'ABC Song', duration: 5, description: 'Sing the ABC song together. Clap on A, B, and C!' },
      { phase: 'instruction', title: 'Meet the Letters', duration: 15, description: 'Show big letter cards for A, B, C. Trace each in the air with your finger.' },
      { phase: 'practice', title: 'Letter Hunt', duration: 20, description: 'Circle every A, B, and C you find on the worksheet. Color them your favorite color!' },
      { phase: 'activity', title: 'Letter Art', duration: 10, description: 'Draw something that starts with A (apple), B (ball), or C (cat).' },
      { phase: 'exit-ticket', title: 'Show Me!', duration: 5, description: 'Point to the letter I say. Ready?' },
    ],
    teacherScript: {
      hook: "Good morning, little scholars! 🌟 Today we're going on a LETTER ADVENTURE! We're going to meet three very special letters. Can you guess which ones? Let's sing our ABC song and find out!",
      transitions: [
        "Great singing! Now let's look at our first letter friend — this is the letter A! Can you say 'A'? A says /æ/ like in APPLE! 🍎",
        "Wonderful job! Now grab your crayons. When you see the letter A, B, or C on your paper, circle it! You're letter detectives! 🔍",
      ],
      checkIns: [
        "Hold up your finger and trace the letter A in the air with me. Big swoop up, down, and across!",
        "Can you show me which letter says /b/? Point to it on your paper!",
      ],
      closingWords: "You did AMAZING today! You found A, B, and C all by yourself! Give yourself a big hug — you're a letter superstar! ⭐",
    },
    checksForUnderstanding: [
      { type: 'show-me', prompt: 'Hold up the card that shows the letter B!' },
      { type: 'thumbs', prompt: 'Is this the letter A? 👍 or 👎' },
      { type: 'choral', prompt: "Everyone say the sound that B makes!" },
    ],
    exitTicket: { prompt: 'Circle ALL the letter A shapes you see:', type: 'circle' },
    miniGames: [
      { type: 'letterTrace', items: [{ label: 'A', answer: 'A' }, { label: 'B', answer: 'B' }, { label: 'C', answer: 'C' }] },
      { type: 'matchPairs', pairs: [['A', 'Apple 🍎'], ['B', 'Ball ⚽'], ['C', 'Cat 🐱']] },
    ],
  },
  {
    id: 'pk-la-1a', grade: 'PK', subject: 'Language Arts', topic: 'Letter Recognition',
    day: 1, duration: 60, version: 'advanced',
    objective: 'Students will identify A–F, name their sounds, and match them to picture words.',
    objectiveKidFriendly: 'I can find letters A through F and say their sounds! 🎵',
    materials: ['Paper', 'Crayons', 'Letter cards', 'Picture cards'],
    iepSupports: ['Use large-print letter cards', 'Provide sound cue cards', 'Allow verbal responses instead of written'],
    agenda: [
      { phase: 'warmup', title: 'ABC Song & Stretch', duration: 5, description: 'Sing ABC song. Do a letter pose for A (arms up like an A!)' },
      { phase: 'instruction', title: 'Letter Sounds Safari', duration: 15, description: 'Meet A–F. Learn each letter sound. Find objects in the room that start with each!' },
      { phase: 'practice', title: 'Sound Sorting', duration: 20, description: 'Sort picture cards into letter piles by their beginning sound.' },
      { phase: 'activity', title: 'My Letter Book', duration: 10, description: 'Draw one picture for each letter A–F in your mini-book.' },
      { phase: 'exit-ticket', title: 'Sound Check', duration: 5, description: 'I say a sound, you point to the letter!' },
    ],
    teacherScript: {
      hook: "Hello, brilliant learners! 🧠 Today we're going on a SOUND SAFARI! Every letter has a special sound it makes. Let's discover the sounds of A, B, C, D, E, and F!",
      transitions: [
        "A says /æ/, B says /b/, C says /k/. Now let's keep going — D says /d/ like DINOSAUR! 🦕",
        "Now you're the teacher! Sort these picture cards. Does 'fish' start with F or B? You decide!",
      ],
      checkIns: ["What sound does E make? Show me with your mouth!", "Point to something in this room that starts with the letter D!"],
      closingWords: "Six letters in one day! You're reading superstars in the making! Tomorrow we'll meet even more letter friends! 🌈",
    },
    checksForUnderstanding: [
      { type: 'show-me', prompt: 'Hold up the letter that makes the /k/ sound!' },
      { type: 'choral', prompt: "What letter does ELEPHANT start with?" },
    ],
    exitTicket: { prompt: 'I say a sound, you circle the right letter. Ready? /f/...', type: 'circle' },
    miniGames: [
      { type: 'matchPairs', pairs: [['A', 'Apple 🍎'], ['B', 'Bear 🐻'], ['C', 'Cup ☕'], ['D', 'Dog 🐕'], ['E', 'Egg 🥚'], ['F', 'Fish 🐟']] },
    ],
  },

  // ─── MATH ───
  {
    id: 'pk-math-1b', grade: 'PK', subject: 'Math', topic: 'Counting 1-10',
    day: 1, duration: 60, version: 'basic',
    objective: 'Students will count objects from 1 to 5 with one-to-one correspondence.',
    objectiveKidFriendly: 'I can count to 5! 🖐️',
    materials: ['Counting blocks', 'Paper', 'Crayons'],
    iepSupports: ['Use large manipulatives', 'Allow physical touch-counting', 'Provide number line strip on desk'],
    agenda: [
      { phase: 'warmup', title: 'Counting Song', duration: 5, description: 'Sing "1, 2, 3, 4, 5 — Once I Caught a Fish Alive!"' },
      { phase: 'instruction', title: 'Touch and Count', duration: 15, description: 'Place blocks on the table. Touch each one as you count. One block = one number!' },
      { phase: 'practice', title: 'Count the Pictures', duration: 20, description: 'Count the stars, hearts, and smiley faces on your worksheet. Write the number!' },
      { phase: 'activity', title: 'Build a Tower', duration: 10, description: 'Build a tower of exactly 3 blocks. Then 5 blocks. Then 2 blocks!' },
      { phase: 'exit-ticket', title: 'How Many?', duration: 5, description: 'Count the dots and circle the right number.' },
    ],
    teacherScript: {
      hook: "Good morning, counting champions! 🏆 How many fingers am I holding up? That's RIGHT — 3! Today we're going to become SUPER COUNTERS. We'll count everything!",
      transitions: [
        "Now watch me carefully. I'm going to touch each block and say a number. One... two... three! Each block gets ONE number. Your turn!",
        "Grab your crayons! Count the ⭐ stars on your paper. Touch each one. How many? Write that number!",
      ],
      checkIns: ["Show me 4 fingers! Great! Now show me 2!", "How many blocks are in your tower? Count them out loud for me!"],
      closingWords: "You counted all the way to 5! That's FIVE high-fives! ✋✋✋✋✋ You're a math superstar!",
    },
    checksForUnderstanding: [
      { type: 'show-me', prompt: 'Show me 3 fingers!' },
      { type: 'thumbs', prompt: 'Are there 4 stars? 👍 or 👎' },
    ],
    exitTicket: { prompt: 'Count the dots: ● ● ● ● — Circle the number: 2  3  4  5', type: 'circle' },
    miniGames: [
      { type: 'countObjects', items: [{ label: '⭐⭐⭐', answer: 3 }, { label: '🍎🍎🍎🍎🍎', answer: 5 }, { label: '🐟🐟', answer: 2 }] },
    ],
  },
  {
    id: 'pk-math-1a', grade: 'PK', subject: 'Math', topic: 'Counting 1-10',
    day: 1, duration: 60, version: 'advanced',
    objective: 'Students will count objects from 1 to 10, write numerals 1–5, and compare groups using more/less.',
    objectiveKidFriendly: 'I can count to 10 and tell which group has MORE! 🔢',
    materials: ['Counting blocks', 'Paper', 'Crayons', 'Number cards'],
    iepSupports: ['Provide number formation guide', 'Use ten-frame mats', 'Allow verbal counting before writing'],
    agenda: [
      { phase: 'warmup', title: 'Count & Move', duration: 5, description: 'Jump 10 times while counting!' },
      { phase: 'instruction', title: 'Numbers Tell Us How Many', duration: 15, description: 'Count groups of objects 1–10. Write the numbers 1–5 on your paper.' },
      { phase: 'practice', title: 'More or Less', duration: 20, description: 'Look at two groups. Circle the group that has MORE.' },
      { phase: 'activity', title: 'Number Art', duration: 10, description: 'Draw 7 flowers. Draw 3 butterflies. Which has more?' },
      { phase: 'exit-ticket', title: 'Count & Compare', duration: 5, description: 'Count each group and circle which has more.' },
    ],
    teacherScript: {
      hook: "Mathematicians, today we're going to count ALL the way to TEN! And we're going to learn a secret word: MORE. If I have 5 cookies and you have 3... who has MORE? Let's find out!",
      transitions: ["Now let's compare! This group has 4 stars. This group has 7 stars. Which group has MORE? Point to it!"],
      checkIns: ["Count the blocks. Write the number on your whiteboard. Hold it up!"],
      closingWords: "You counted to 10 AND you can compare! Tomorrow we'll learn about LESS. You're amazing! 🎉",
    },
    checksForUnderstanding: [
      { type: 'show-me', prompt: 'Write the number 4 on your paper and hold it up!' },
      { type: 'thumbs', prompt: 'Does 7 come after 6? 👍 or 👎' },
    ],
    exitTicket: { prompt: 'Group A: 🍎🍎🍎🍎🍎🍎  Group B: 🍎🍎🍎 — Which has MORE? Circle it.', type: 'circle' },
    miniGames: [
      { type: 'countObjects', items: [{ label: '🌟🌟🌟🌟🌟🌟🌟', answer: 7 }, { label: '🎈🎈🎈🎈', answer: 4 }] },
    ],
  },

  // ─── SCIENCE ───
  {
    id: 'pk-sci-1b', grade: 'PK', subject: 'Science', topic: 'My Body',
    day: 1, duration: 60, version: 'basic',
    objective: 'Students will identify and name basic body parts (head, arms, legs, hands, feet).',
    objectiveKidFriendly: 'I can point to my head, arms, legs, hands, and feet! 🦶',
    materials: ['Paper', 'Crayons'],
    iepSupports: ['Use body-part picture cards', 'Allow pointing instead of verbal answers', 'Provide pre-drawn body outline'],
    agenda: [
      { phase: 'warmup', title: 'Head, Shoulders, Knees & Toes', duration: 5, description: 'Sing and point to each body part!' },
      { phase: 'instruction', title: 'My Amazing Body', duration: 15, description: 'Learn the names of 5 body parts. Touch each one as we say it.' },
      { phase: 'practice', title: 'Draw Yourself', duration: 20, description: 'Draw a picture of yourself. Label your head, arms, and legs.' },
      { phase: 'activity', title: 'Simon Says: Body Parts', duration: 10, description: 'Simon says touch your HEAD! Simon says wiggle your FINGERS!' },
      { phase: 'exit-ticket', title: 'Point & Name', duration: 5, description: 'Point to the body part I name.' },
    ],
    teacherScript: {
      hook: "Hello, wonderful friends! 🌞 Look at your hands! Wiggle your fingers! You have an AMAZING body and today we're going to learn the names of all your parts!",
      transitions: ["Touch your head! Now touch your toes! Those are body parts and you already KNOW them!"],
      checkIns: ["Where are your elbows? Can you point to them?"],
      closingWords: "You know your body parts! Head, arms, legs, hands, feet! You're a body-parts expert! 🌟",
    },
    checksForUnderstanding: [
      { type: 'show-me', prompt: 'Touch your shoulders!' },
      { type: 'choral', prompt: 'What do we use to WALK? Shout it out!' },
    ],
    exitTicket: { prompt: 'Draw an arrow to the ARMS on this picture:', type: 'draw' },
    miniGames: [
      { type: 'matchPairs', pairs: [['Head 🧠', 'For thinking!'], ['Legs 🦵', 'For walking!'], ['Hands ✋', 'For grabbing!'], ['Eyes 👀', 'For seeing!']] },
    ],
  },
  {
    id: 'pk-sci-1a', grade: 'PK', subject: 'Science', topic: 'My Body',
    day: 1, duration: 60, version: 'advanced',
    objective: 'Students will identify body parts, state their functions, and explain how to keep them healthy.',
    objectiveKidFriendly: 'I can name my body parts AND tell what they do! 💪',
    materials: ['Paper', 'Crayons', 'Body poster'],
    iepSupports: ['Provide visual function cards', 'Use sentence starters for verbal responses', 'Allow drawing instead of writing'],
    agenda: [
      { phase: 'warmup', title: 'Body Part Dance', duration: 5, description: 'Dance and freeze when I call a body part — then tell me what it DOES!' },
      { phase: 'instruction', title: 'What Does Each Part Do?', duration: 15, description: 'Eyes SEE, ears HEAR, legs WALK, hands GRAB. Learn the jobs of each body part.' },
      { phase: 'practice', title: 'Body Part Jobs', duration: 20, description: 'Draw lines matching body parts to their jobs.' },
      { phase: 'activity', title: 'Healthy Body', duration: 10, description: 'Draw one thing you do to keep your body healthy (eat veggies, run, sleep).' },
      { phase: 'exit-ticket', title: 'Tell Me!', duration: 5, description: 'Name one body part and tell me what it does.' },
    ],
    teacherScript: {
      hook: "Scientists, today we're going to learn something COOL — every part of your body has a JOB! Your eyes have a job, your legs have a job. Let's figure out what they all do!",
      transitions: ["Your eyes SEE, your ears HEAR, your nose SMELLS! Every part has an important job!"],
      checkIns: ["What is the JOB of your legs? Show me by standing up and walking!"],
      closingWords: "You're body scientists now! You know what your body parts do AND how to keep them healthy! 🏆",
    },
    checksForUnderstanding: [
      { type: 'choral', prompt: 'What do your EARS do? Everyone say it!' },
      { type: 'thumbs', prompt: 'Do your legs help you SMELL things? 👍 or 👎' },
    ],
    exitTicket: { prompt: 'Draw your favorite body part and write (or tell me) what it does.', type: 'draw' },
    miniGames: [
      { type: 'matchPairs', pairs: [['Eyes 👀', 'See things'], ['Ears 👂', 'Hear sounds'], ['Nose 👃', 'Smell things'], ['Mouth 👄', 'Taste and talk'], ['Hands ✋', 'Touch and grab']] },
    ],
  },

  // ─── SOCIAL STUDIES ───
  {
    id: 'pk-ss-1b', grade: 'PK', subject: 'Social Studies', topic: 'All About Me',
    day: 1, duration: 60, version: 'basic',
    objective: 'Students will state their full name, age, and one thing they like.',
    objectiveKidFriendly: 'I can tell you my name and something I love! ❤️',
    materials: ['Paper', 'Crayons'],
    iepSupports: ['Provide "About Me" template with picture prompts', 'Accept pointing to pictures instead of verbal answers', 'Allow extra time for drawing'],
    agenda: [
      { phase: 'warmup', title: 'Name Song', duration: 5, description: 'Clap the syllables in your name. Ja-xon = 2 claps!' },
      { phase: 'instruction', title: 'Who Am I?', duration: 15, description: 'Learn to say: My name is ___. I am ___ years old. I like ___.' },
      { phase: 'practice', title: 'Draw Yourself', duration: 20, description: 'Draw a self-portrait and your favorite thing.' },
      { phase: 'activity', title: 'Share Time', duration: 10, description: 'Hold up your drawing. Say your name and what you drew.' },
      { phase: 'exit-ticket', title: 'My Name', duration: 5, description: 'Trace or write your first name.' },
    ],
    teacherScript: {
      hook: "Hey there, superstar! 🌟 Do you know what makes YOU special? YOUR NAME! Let's start today by saying our names in our biggest, proudest voices!",
      transitions: ["Now draw a picture of YOUR face! Big eyes, your hair, your smile! This is ALL ABOUT YOU!"],
      checkIns: ["Can you tell me how old you are? Hold up your fingers!"],
      closingWords: "I love learning about YOU! You are special and one-of-a-kind! 🎨",
    },
    checksForUnderstanding: [
      { type: 'show-me', prompt: 'Hold up fingers to show how old you are!' },
      { type: 'choral', prompt: 'Everyone say your FIRST name as loud as you can!' },
    ],
    exitTicket: { prompt: 'Trace your name: _ _ _ _ _', type: 'draw' },
    miniGames: [
      { type: 'colorMatch', items: [{ label: 'What color are YOUR eyes?', answer: 'brown' }] },
    ],
  },

  // ─── BIBLE ───
  {
    id: 'pk-bib-1b', grade: 'PK', subject: 'Bible', topic: 'God Made Animals',
    day: 1, duration: 60, version: 'basic',
    objective: 'Students will recall that God created animals and name at least 3 animals.',
    objectiveKidFriendly: 'I know God made ALL the animals! 🐘🐟🦅',
    materials: ['Paper', 'Crayons', 'Animal picture cards'],
    iepSupports: ['Use plastic animal figurines for tactile learners', 'Provide pre-drawn animal outlines to color', 'Allow animal sounds instead of names'],
    agenda: [
      { phase: 'warmup', title: 'Animal Sounds', duration: 5, description: 'Make animal sounds! Moo! Baa! Woof! What animals make these sounds?' },
      { phase: 'instruction', title: 'God Made Animals', duration: 15, description: 'God made fish for the sea, birds for the sky, and animals for the land!' },
      { phase: 'practice', title: 'Sort the Animals', duration: 20, description: 'Sort animal pictures: Does it swim, fly, or walk?' },
      { phase: 'activity', title: 'My Favorite Animal', duration: 10, description: 'Draw your favorite animal God made.' },
      { phase: 'exit-ticket', title: 'Name 3!', duration: 5, description: 'Name or point to 3 animals God made.' },
    ],
    teacherScript: {
      hook: "Who likes animals? 🙋 ME TOO! Did you know that GOD made every single animal? The big elephants 🐘, the tiny ants 🐜, and the fast cheetahs! Let's learn about God's amazing animals!",
      transitions: ["Some animals swim in the water — like fish! 🐟 Some fly in the sky — like birds! 🦅 God put each animal in the perfect place!"],
      checkIns: ["Can you name an animal that SWIMS? Shout it out!"],
      closingWords: "God made so many wonderful animals! And He made YOU too — the most special creation of all! 🙏",
    },
    checksForUnderstanding: [
      { type: 'choral', prompt: 'Who made the animals? Everyone say it!' },
      { type: 'thumbs', prompt: 'Do fish live in the sky? 👍 or 👎' },
    ],
    exitTicket: { prompt: 'Draw 3 animals that God made.', type: 'draw' },
    miniGames: [
      { type: 'matchPairs', pairs: [['🐟 Fish', 'Swims in water'], ['🦅 Bird', 'Flies in the sky'], ['🐕 Dog', 'Walks on land'], ['🐛 Worm', 'Lives in the ground']] },
    ],
  },
];
