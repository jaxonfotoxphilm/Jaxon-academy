/**
 * Middle School Lesson Plans (6th, 7th, 8th Grade)
 * Rigorous academic content with Bloom's taxonomy, calculator use, written analysis.
 */
import type { LessonPlan } from './lesson-plan-types';

export const MIDDLE_SCHOOL_PLANS: LessonPlan[] = [
  // ═══ 6TH GRADE ═══
  {
    id: 'g6-la-1b', grade: '6', subject: 'Language Arts', topic: 'Analytical Reading',
    day: 1, duration: 75, version: 'basic',
    objective: 'Students will identify the main idea and supporting details in an informational passage.',
    materials: ['Paper', 'Pencil'],
    iepSupports: ['Provide graphic organizer for main idea/details', 'Highlight key sentences', 'Chunk reading into paragraphs with check-ins'],
    agenda: [
      { phase: 'warmup', title: 'Do Now', duration: 10, description: 'Read the short paragraph on the board. Write one sentence summarizing it.' },
      { phase: 'instruction', title: 'Main Idea vs Details', duration: 15, description: 'The main idea is the BIG point. Details are the evidence that supports it. Model with a sample passage.' },
      { phase: 'practice', title: 'Passage Analysis', duration: 30, description: 'Read the passage independently. Underline the main idea. Number 3 supporting details.' },
      { phase: 'review', title: 'Share & Discuss', duration: 10, description: 'Compare your main idea statement with the answer key. Did you capture it?' },
      { phase: 'exit-ticket', title: 'Exit Ticket', duration: 5, description: 'Read a new short paragraph. Write the main idea in ONE sentence.' },
    ],
    teacherScript: {
      hook: "If I told you a 10-minute story about my weekend, could you summarize it in ONE sentence? That sentence would be the MAIN IDEA. Today you'll learn to find the main idea in anything you read — a skill you'll use for the rest of your life.",
      transitions: ["Now apply this to the passage. Read carefully. The main idea is usually in the first or last paragraph. Supporting details are the PROOF."],
      checkIns: ["Before you move on — can you state the main idea WITHOUT looking at the text? If not, re-read."],
      closingWords: "Main idea + supporting details = the foundation of all reading comprehension. Master this and everything else in Language Arts gets easier.",
    },
    checksForUnderstanding: [
      { type: 'fist-to-five', prompt: 'Show me: fist = lost, 5 = I could teach this.' },
      { type: 'quiz', question: 'Which is a MAIN IDEA vs a DETAIL?', options: ['Dogs are popular pets.', 'Golden Retrievers are friendly.', '70% of Americans own dogs — making dogs the most popular pet in America.', 'Puppies need training.'], correctIndex: 2, feedbackWrong: 'A main idea is the broadest statement that all details support. The statistic + claim is the main idea here.' },
    ],
    exitTicket: { prompt: 'Read the paragraph. Write the main idea in ONE complete sentence.', type: 'write' },
    miniGames: [
      { type: 'matchPairs', pairs: [['Main Idea', 'The central point of a passage'], ['Supporting Detail', 'Evidence that backs up the main idea'], ['Summary', 'A brief retelling of key points'], ['Inference', 'A conclusion drawn from evidence']] },
      { type: 'trueFalse', trueFalse: [['The main idea is always the first sentence.', false], ['Supporting details provide evidence for the main idea.', true], ['A paragraph can only have one supporting detail.', false], ['The main idea answers: What is this passage mostly about?', true]] },
    ],
  },
  {
    id: 'g6-math-1b', grade: '6', subject: 'Math', topic: 'Ratios',
    day: 1, duration: 75, version: 'basic',
    objective: 'Students will define a ratio, write ratios in three forms, and solve basic ratio problems.',
    materials: ['Paper', 'Pencil', 'Calculator'],
    iepSupports: ['Provide ratio formula reference card', 'Use visual models (tape diagrams)', 'Allow calculator for all computation'],
    agenda: [
      { phase: 'warmup', title: 'Do Now', duration: 10, description: 'There are 12 boys and 8 girls. How would you compare these numbers?' },
      { phase: 'instruction', title: 'What is a Ratio?', duration: 15, description: 'A ratio compares two quantities. Three forms: 12:8, 12 to 8, 12/8. Simplify like fractions!' },
      { phase: 'practice', title: 'Ratio Problems', duration: 30, description: 'Write ratios for real scenarios. Simplify each. Use calculator to check.' },
      { phase: 'review', title: 'Check & Correct', duration: 10, description: 'Review answers. Common mistake: order matters in ratios!' },
      { phase: 'exit-ticket', title: 'Exit Ticket', duration: 5, description: 'Write and simplify 2 ratios from a given scenario.' },
    ],
    teacherScript: {
      hook: "In a bag of candy, there are 6 red and 9 blue. If I said 'the ratio of red to blue is 6 to 9,' I just used math to describe that relationship. Today you'll learn to write ratios — a tool used in cooking, sports, science, and business.",
      transitions: ["Ratios can be simplified just like fractions. 6:9 becomes 2:3. Use your calculator: 6÷3=2, 9÷3=3."],
      checkIns: ["Quick check: what's the ratio of wheels to cars if there are 20 wheels and 5 cars? Use your calculator."],
      closingWords: "Ratios are everywhere — recipes, map scales, speed. You now have a tool to describe any comparison precisely.",
    },
    checksForUnderstanding: [
      { type: 'fist-to-five', prompt: 'Rate your confidence with ratios: fist to five.' },
      { type: 'quiz', question: 'Simplify the ratio 15:25.', options: ['3:5', '5:3', '1:2', '15:25'], correctIndex: 0, feedbackWrong: 'GCF of 15 and 25 is 5. Divide both: 15÷5=3, 25÷5=5. Answer: 3:5.' },
    ],
    exitTicket: { prompt: 'A classroom has 14 boys and 21 girls. Write the ratio of boys to girls in simplest form.', type: 'solve', expectedAnswer: '2:3' },
    miniGames: [
      { type: 'matchPairs', pairs: [['Ratio', 'Comparison of two quantities'], ['Simplify', 'Divide both parts by GCF'], ['Equivalent Ratios', 'Ratios that represent the same relationship'], ['Rate', 'Ratio comparing different units']] },
      { type: 'fillBlank', sentences: [['A ratio compares two ___.', 'quantities'], ['To simplify a ratio, divide by the ___.', 'GCF'], ['The ratio 8:12 simplifies to ___.', '2:3']] },
    ],
  },
  {
    id: 'g6-sci-1b', grade: '6', subject: 'Science', topic: 'Cells & Organisms',
    day: 1, duration: 75, version: 'basic',
    objective: 'Students will identify the parts of an animal cell and describe the function of each organelle.',
    materials: ['Paper', 'Colored pencils'],
    iepSupports: ['Provide labeled cell diagram', 'Focus on 4 main organelles', 'Use analogy chart (cell = city)'],
    agenda: [
      { phase: 'warmup', title: 'Do Now', duration: 10, description: 'What is the smallest living thing? Write your best guess.' },
      { phase: 'instruction', title: 'The Cell — Building Block of Life', duration: 15, description: 'Every living thing is made of cells. Animal cells have organelles — each with a job.' },
      { phase: 'practice', title: 'Cell Diagram', duration: 30, description: 'Draw and label an animal cell: nucleus, mitochondria, cell membrane, ribosome, cytoplasm.' },
      { phase: 'review', title: 'Cell City Analogy', duration: 10, description: 'If a cell were a city: nucleus = mayor, mitochondria = power plant. Complete the analogy.' },
      { phase: 'exit-ticket', title: 'Exit Ticket', duration: 5, description: 'Name the organelle and its function for 3 parts.' },
    ],
    teacherScript: {
      hook: "You are made of approximately 37 TRILLION cells. Each one is a tiny factory with its own power plant, recycling center, and command center. Today we're going INSIDE a cell.",
      transitions: ["Think of the cell as a city. The nucleus is the mayor — it controls everything. The mitochondria? That's the power plant — it makes energy."],
      checkIns: ["Without looking at your notes — what does the mitochondria do? If you said 'makes energy' or 'powerhouse,' you're right."],
      closingWords: "Every organelle has a critical job. Remove one and the cell can't survive. That's teamwork at the microscopic level.",
    },
    checksForUnderstanding: [
      { type: 'fist-to-five', prompt: 'How well can you label a cell diagram? Fist to five.' },
      { type: 'quiz', question: 'Which organelle is called the "powerhouse of the cell"?', options: ['Nucleus', 'Ribosome', 'Mitochondria', 'Cell Membrane'], correctIndex: 2, feedbackWrong: 'Mitochondria convert glucose into ATP — the cell\'s energy currency.' },
    ],
    exitTicket: { prompt: 'Name 3 organelles and their functions.', type: 'write' },
    miniGames: [
      { type: 'matchPairs', pairs: [['Nucleus', 'Control center'], ['Mitochondria', 'Makes energy (ATP)'], ['Cell Membrane', 'Controls entry/exit'], ['Ribosome', 'Makes proteins'], ['Cytoplasm', 'Jelly-like filler']] },
    ],
  },

  // ═══ 7TH GRADE ═══
  {
    id: 'g7-la-1b', grade: '7', subject: 'Language Arts', topic: 'Literary Analysis',
    day: 1, duration: 75, version: 'basic',
    objective: 'Students will analyze character motivation using textual evidence and explain how it drives the plot.',
    materials: ['Paper', 'Pencil'],
    iepSupports: ['Provide character motivation graphic organizer', 'Pre-highlight key dialogue passages', 'Use sentence starters for written responses'],
    agenda: [
      { phase: 'warmup', title: 'Do Now', duration: 10, description: 'Think of a character from any book/movie. Why did they do what they did? Write 2 sentences.' },
      { phase: 'instruction', title: 'Character Motivation', duration: 15, description: 'Motivation = WHY a character acts. Look for clues in dialogue, actions, and thoughts.' },
      { phase: 'practice', title: 'Evidence Hunt', duration: 30, description: 'Read the passage. Find 3 pieces of evidence that reveal the character\'s motivation. Write a claim.' },
      { phase: 'review', title: 'Peer Check', duration: 10, description: 'Trade papers. Does their evidence actually support their claim?' },
      { phase: 'exit-ticket', title: 'Exit Ticket', duration: 5, description: 'In 2-3 sentences: What motivates the main character? Cite one piece of evidence.' },
    ],
    teacherScript: {
      hook: "Every character in every story wants something. That WANT drives everything they do. Today you'll learn to dig beneath the surface and figure out WHY characters make the choices they make.",
      transitions: ["Don't just tell me WHAT happened — tell me WHY. 'She ran away' is plot. 'She ran away because she feared being caught' is ANALYSIS."],
      checkIns: ["Read your claim out loud. Does it answer WHY, not just WHAT?"],
      closingWords: "Understanding motivation is the difference between reading a story and truly ANALYZING it. You're thinking like literary scholars now.",
    },
    checksForUnderstanding: [
      { type: 'fist-to-five', prompt: 'How confident are you identifying character motivation? Show me.' },
      { type: 'quiz', question: 'Which statement best shows character MOTIVATION?', options: ['She walked to school.', 'She walked to school because she wanted to prove she was independent.', 'The school was nearby.', 'It was Monday morning.'], correctIndex: 1, feedbackWrong: 'Motivation answers WHY — "because she wanted to prove independence" reveals her inner drive.' },
    ],
    exitTicket: { prompt: 'What motivates the main character? Cite one piece of textual evidence.', type: 'write' },
    miniGames: [
      { type: 'matchPairs', pairs: [['Motivation', 'Why a character acts'], ['Evidence', 'Proof from the text'], ['Claim', 'Your argument/thesis'], ['Characterization', 'How an author reveals character']] },
    ],
  },
  {
    id: 'g7-math-1b', grade: '7', subject: 'Pre-Algebra', topic: 'Equations',
    day: 1, duration: 75, version: 'basic',
    objective: 'Students will solve one-step and two-step equations using inverse operations.',
    materials: ['Paper', 'Pencil', 'Calculator'],
    iepSupports: ['Provide inverse operations reference card', 'Color-code steps (undo addition=red, undo multiplication=blue)', 'Allow calculator for arithmetic'],
    agenda: [
      { phase: 'warmup', title: 'Do Now', duration: 10, description: 'What number makes this true? ___ + 7 = 15. How did you figure it out?' },
      { phase: 'instruction', title: 'Inverse Operations', duration: 15, description: 'To solve equations, UNDO operations. Addition undoes subtraction. Multiplication undoes division.' },
      { phase: 'practice', title: 'Equation Practice', duration: 30, description: 'Solve 10 equations. Show ALL steps. Check by substituting your answer back in.' },
      { phase: 'review', title: 'Error Analysis', duration: 10, description: 'Find the mistake in these 3 worked-out problems.' },
      { phase: 'exit-ticket', title: 'Exit Ticket', duration: 5, description: 'Solve: 3x + 5 = 20. Show your work.' },
    ],
    teacherScript: {
      hook: "An equation is a BALANCE SCALE. Whatever you do to one side, you MUST do to the other. Today you'll learn the most powerful tool in algebra: inverse operations.",
      transitions: ["Step 1: Undo addition/subtraction. Step 2: Undo multiplication/division. ALWAYS work backward from order of operations."],
      checkIns: ["Solve 2x - 4 = 10. What's your first step? If you said 'add 4 to both sides,' you're on track."],
      closingWords: "You just solved algebraic equations. This is the foundation of ALL higher math. Every equation is just a puzzle waiting for your inverse operations.",
    },
    checksForUnderstanding: [
      { type: 'fist-to-five', prompt: 'Rate your equation-solving confidence.' },
      { type: 'quiz', question: 'Solve: 4x - 3 = 13', options: ['x = 2.5', 'x = 4', 'x = 10', 'x = 3'], correctIndex: 1, feedbackWrong: 'Add 3: 4x = 16. Divide by 4: x = 4. Check: 4(4)-3 = 13 ✓' },
    ],
    exitTicket: { prompt: 'Solve: 3x + 5 = 20. Show all steps.', type: 'solve', expectedAnswer: 'x = 5' },
    miniGames: [
      { type: 'matchPairs', pairs: [['Addition', 'Undo with subtraction'], ['Multiplication', 'Undo with division'], ['Variable', 'Unknown value'], ['Inverse Operation', 'Opposite operation to isolate x']] },
      { type: 'fillBlank', sentences: [['To solve 5x = 35, divide both sides by ___.', '5'], ['The inverse of adding 9 is ___ 9.', 'subtracting'], ['In 2x + 3 = 11, the first step is to subtract ___.', '3']] },
    ],
  },

  // ═══ 8TH GRADE ═══
  {
    id: 'g8-la-1b', grade: '8', subject: 'Language Arts', topic: 'American Literature',
    day: 1, duration: 75, version: 'basic',
    objective: 'Students will analyze theme in American literature and support their analysis with textual evidence using the C-E-R framework (Claim-Evidence-Reasoning).',
    materials: ['Paper', 'Pencil'],
    iepSupports: ['Provide C-E-R graphic organizer', 'Pre-select evidence passages', 'Allow verbal responses recorded by teacher'],
    agenda: [
      { phase: 'warmup', title: 'Do Now', duration: 10, description: 'What is the difference between a TOPIC and a THEME? Write your definition of each.' },
      { phase: 'instruction', title: 'Theme = Topic + Message', duration: 15, description: 'Topic = one word (courage). Theme = a statement (True courage means standing up even when afraid).' },
      { phase: 'practice', title: 'C-E-R Analysis', duration: 30, description: 'Read the excerpt. Write a Claim about the theme. Find Evidence. Explain your Reasoning.' },
      { phase: 'review', title: 'Strengthen Your Reasoning', duration: 10, description: 'Swap papers. Does the reasoning CONNECT the evidence to the claim? Give feedback.' },
      { phase: 'exit-ticket', title: 'Exit Ticket', duration: 5, description: 'State the theme in one sentence. Cite one piece of evidence.' },
    ],
    teacherScript: {
      hook: "A TOPIC is one word — like 'freedom.' A THEME is what the author is SAYING about that topic — 'Freedom requires sacrifice.' That distinction is what separates a summary from an analysis. Today you'll learn to find themes like a literary critic.",
      transitions: ["Your claim must be arguable. 'The story is about friendship' is a topic. 'The story argues that true friendship requires honesty, even when it's painful' is a THEME."],
      checkIns: ["Read your claim back. Is it a full sentence? Does it make an argument about the topic? If it's just one word, revise."],
      closingWords: "C-E-R is the backbone of analytical writing. You'll use this framework in every essay, every class, and eventually every professional argument you make.",
    },
    checksForUnderstanding: [
      { type: 'fist-to-five', prompt: 'Can you distinguish topic from theme? Show me.' },
      { type: 'quiz', question: 'Which is a THEME, not a topic?', options: ['Friendship', 'Courage', 'True courage means acting despite fear, not the absence of it.', 'War'], correctIndex: 2, feedbackWrong: 'Topics are single words. Themes are complete statements about what the author believes about that topic.' },
    ],
    exitTicket: { prompt: 'Write the theme of the passage in one sentence. Include one piece of textual evidence.', type: 'write' },
    miniGames: [
      { type: 'matchPairs', pairs: [['Topic', 'One-word subject (courage, love)'], ['Theme', 'Author\'s message about the topic'], ['Claim', 'Your arguable statement'], ['Evidence', 'Quote or detail from the text'], ['Reasoning', 'Explains HOW evidence supports claim']] },
    ],
  },
  {
    id: 'g8-math-1b', grade: '8', subject: 'Pre-Algebra II', topic: 'Linear Equations',
    day: 1, duration: 75, version: 'basic',
    objective: 'Students will graph linear equations in slope-intercept form (y = mx + b) and interpret slope and y-intercept in context.',
    materials: ['Graph paper', 'Pencil', 'Calculator', 'Ruler'],
    iepSupports: ['Provide pre-labeled coordinate grid', 'Use slope formula card', 'Allow graphing calculator app for verification'],
    agenda: [
      { phase: 'warmup', title: 'Do Now', duration: 10, description: 'Plot these points: (0,2), (1,5), (2,8). What pattern do you see?' },
      { phase: 'instruction', title: 'y = mx + b Decoded', duration: 15, description: 'm = slope (rise/run). b = y-intercept (where line crosses y-axis). Graph by starting at b, then using m.' },
      { phase: 'practice', title: 'Graph 5 Equations', duration: 30, description: 'Graph each equation. Label the slope and y-intercept. Verify with calculator.' },
      { phase: 'review', title: 'Real-World Connection', duration: 10, description: 'A phone plan costs $20/month + $0.10/text. Write and graph the equation.' },
      { phase: 'exit-ticket', title: 'Exit Ticket', duration: 5, description: 'Graph y = 2x - 3. Label slope and y-intercept.' },
    ],
    teacherScript: {
      hook: "Every straight line in the universe can be described with just TWO numbers — the slope and the y-intercept. That's it. Two numbers capture infinite points. Today you'll learn to decode and graph any linear equation.",
      transitions: ["Start at b on the y-axis. That's your starting point. Then use m — rise over run — to find the next point. Connect with a ruler. Done."],
      checkIns: ["In y = 3x + 1, what's the slope? What's the y-intercept? If you said m=3, b=1, you've got it."],
      closingWords: "Linear equations model real relationships — cost vs quantity, distance vs time, temperature vs altitude. You now have the tool to visualize any linear relationship.",
    },
    checksForUnderstanding: [
      { type: 'fist-to-five', prompt: 'Can you graph y = mx + b? Rate yourself.' },
      { type: 'quiz', question: 'In y = -2x + 5, what is the slope?', options: ['5', '-2', '2', '-5'], correctIndex: 1, feedbackWrong: 'In y = mx + b, m is the coefficient of x. Here m = -2 (the line goes DOWN 2 for every 1 right).' },
    ],
    exitTicket: { prompt: 'Graph y = 2x - 3 on the grid. Label the slope and y-intercept.', type: 'solve', expectedAnswer: 'slope=2, y-int=-3' },
    miniGames: [
      { type: 'matchPairs', pairs: [['Slope (m)', 'Rate of change / steepness'], ['Y-intercept (b)', 'Where line crosses y-axis'], ['Rise/Run', 'How to calculate slope'], ['Linear', 'Makes a straight line']] },
      { type: 'fillBlank', sentences: [['In y = mx + b, the letter m represents the ___.', 'slope'], ['The y-intercept is where the line crosses the ___-axis.', 'y'], ['A slope of 3 means the line rises ___ units for every 1 unit right.', '3']] },
    ],
  },
  {
    id: 'g8-sci-1b', grade: '8', subject: 'Physical Science', topic: 'Chemical Reactions',
    day: 1, duration: 75, version: 'basic',
    objective: 'Students will identify signs of a chemical reaction and distinguish chemical changes from physical changes.',
    materials: ['Paper', 'Pencil'],
    iepSupports: ['Provide chemical vs physical change T-chart', 'Use visual examples with photographs', 'Limit vocabulary to 5 key terms'],
    agenda: [
      { phase: 'warmup', title: 'Do Now', duration: 10, description: 'Is melting ice a chemical or physical change? Is burning wood? Explain your reasoning.' },
      { phase: 'instruction', title: 'Chemical vs Physical', duration: 15, description: 'Physical = same substance, different form. Chemical = NEW substance formed. Signs: gas, color change, heat, precipitate.' },
      { phase: 'practice', title: 'Sort & Classify', duration: 30, description: 'Sort 15 examples into chemical or physical changes. Write the sign that proves it.' },
      { phase: 'review', title: 'Tricky Cases', duration: 10, description: 'Dissolving sugar: chemical or physical? Debate using evidence.' },
      { phase: 'exit-ticket', title: 'Exit Ticket', duration: 5, description: 'Give one example of each and explain how you know.' },
    ],
    teacherScript: {
      hook: "When you toast bread, it turns brown and smells different. Can you UN-toast it? No! That's because a CHEMICAL REACTION happened — the bread became a new substance. Today we'll learn to spot chemical reactions everywhere.",
      transitions: ["Remember the 4 signs: gas bubbles, color change, temperature change, precipitate (solid forming in liquid). If you see ANY of these, a chemical reaction likely occurred."],
      checkIns: ["Rust forming on iron — chemical or physical? What SIGN tells you? Color change + new substance (iron oxide) = chemical."],
      closingWords: "Chemical reactions are happening inside your body RIGHT NOW — digestion, respiration, even thinking. Chemistry isn't just in a lab; it's literally keeping you alive.",
    },
    checksForUnderstanding: [
      { type: 'fist-to-five', prompt: 'Can you distinguish chemical from physical changes? Show me.' },
      { type: 'quiz', question: 'Which is a sign of a chemical reaction?', options: ['Change in shape', 'Change in size', 'Production of gas bubbles', 'Dissolving'], correctIndex: 2, feedbackWrong: 'Gas production (bubbling) indicates a new gaseous substance is forming — a chemical change.' },
    ],
    exitTicket: { prompt: 'Give one example of a chemical change and one physical change. Explain how you know.', type: 'write' },
    miniGames: [
      { type: 'matchPairs', pairs: [['Chemical Change', 'New substance formed'], ['Physical Change', 'Same substance, different form'], ['Precipitate', 'Solid forming in a liquid'], ['Reactant', 'Starting substance in a reaction']] },
      { type: 'trueFalse', trueFalse: [['Burning wood is a chemical change.', true], ['Melting ice is a chemical change.', false], ['Rusting iron produces a new substance.', true], ['Cutting paper is a chemical change.', false]] },
    ],
  },
];
