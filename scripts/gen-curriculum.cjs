#!/usr/bin/env node
/**
 * Generates curriculum-structure.json with real, Time4Learning-inspired content.
 * 4 core subjects per grade: Language Arts, Math, Science, Social Studies
 * Plus Bible for faith-based homeschool track.
 * 180 lessons per subject, organized into chapters with real topic progression.
 */
const fs = require('fs');
const path = require('path');

// Real scope & sequence per grade — each subject has chapters with topic names
const GRADES = {
  'grade-PK': { label: 'Pre-K', subjects: [
    { name: 'Language Arts', icon: '📖', chapters: ['Letter Recognition','Uppercase Letters','Lowercase Letters','Letter Sounds','Rhyming Words','Listening Skills','Story Time','Print Concepts','Name Writing','Simple Words'] },
    { name: 'Math', icon: '🔢', chapters: ['Counting 1-10','Number Recognition','Shapes','Colors','Sorting','Patterns','Comparing Sizes','Counting 11-20','Position Words','Simple Addition'] },
    { name: 'Science', icon: '🌱', chapters: ['My Five Senses','Living vs Nonliving','Weather','Seasons','Plants','Animals','Water','Day and Night','My Body','Earth'] },
    { name: 'Social Studies', icon: '🏠', chapters: ['All About Me','My Family','My School','My Community','Helpers in Our Town','Rules and Safety','Maps','Holidays','Sharing','Being Kind'] },
    { name: 'Bible', icon: '📜', chapters: ['God Made the World','God Made Animals','God Made People','Noah and the Ark','Abraham','Joseph','Baby Moses','David the Shepherd','Jonah','Jesus is Born'] },
  ]},
  'grade-K': { label: 'Kindergarten', subjects: [
    { name: 'Language Arts', icon: '📖', chapters: ['Alphabet Mastery','Consonant Sounds','Vowel Sounds','CVC Words','Sight Words','Sentence Awareness','Reading Readiness','Story Elements','Writing Letters','Journaling'] },
    { name: 'Math', icon: '🔢', chapters: ['Counting to 100','Number Writing','Addition to 5','Subtraction to 5','Shapes & Geometry','Measurement','Comparing Numbers','Addition to 10','Patterns & Sorting','Word Problems'] },
    { name: 'Science', icon: '🔬', chapters: ['Plants & Seeds','Animal Habitats','Weather Patterns','States of Matter','Push and Pull','Sound','Light','Earth Materials','Healthy Habits','Seasons & Climate'] },
    { name: 'Social Studies', icon: '🌎', chapters: ['Community Helpers','Maps & Globes','American Symbols','National Holidays','Families Around World','Needs vs Wants','Good Citizens','Past & Present','Transportation','Cultural Traditions'] },
    { name: 'Bible', icon: '📜', chapters: ['Creation Week','Garden of Eden','Cain and Abel','Noah Obeys God','Tower of Babel','God Calls Abraham','Isaac is Born','Jacob and Esau','Joseph in Egypt','Moses and Pharaoh'] },
  ]},
  'grade-1': { label: '1st Grade', subjects: [
    { name: 'Language Arts', icon: '📖', chapters: ['Short Vowels','Long Vowels','Blends & Digraphs','Fluency Practice','Comprehension Skills','Nouns & Verbs','Sentences','Writing Paragraphs','Spelling Patterns','Poetry & Rhyme'] },
    { name: 'Math', icon: '➕', chapters: ['Addition to 20','Subtraction to 20','Place Value','Comparing Numbers','Measurement & Length','Time to the Hour','Shapes & Attributes','Data & Graphs','Word Problems','Mental Math'] },
    { name: 'Science', icon: '🔬', chapters: ['Life Cycles','Animal Groups','Plant Parts','Weather & Seasons','Properties of Matter','Force & Motion','Sound & Light','Earth & Sky','Natural Resources','Health & Nutrition'] },
    { name: 'Social Studies', icon: '🌎', chapters: ['My Community','Maps & Directions','American History Basics','Government & Leaders','Economics Basics','Geography','Culture & Traditions','Historical Figures','Civic Responsibility','World Communities'] },
    { name: 'Bible', icon: '📜', chapters: ['Ten Commandments','Crossing Red Sea','Joshua and Jericho','Gideon','Ruth and Naomi','Samuel Listens','David and Goliath','Solomon\'s Wisdom','Elijah','Daniel in Lions Den'] },
  ]},
  'grade-2': { label: '2nd Grade', subjects: [
    { name: 'Language Arts', icon: '📖', chapters: ['Phonics Review','Vocabulary Building','Reading Comprehension','Parts of Speech','Capitalization & Punctuation','Writing Process','Narrative Writing','Informational Text','Prefixes & Suffixes','Book Reports'] },
    { name: 'Math', icon: '➕', chapters: ['Addition & Subtraction to 100','Place Value to 1000','Skip Counting','Money','Time','Measurement','Arrays & Groups','Basic Fractions','Geometry','Problem Solving'] },
    { name: 'Science', icon: '🔬', chapters: ['Habitats & Ecosystems','Animal Adaptations','Plant Growth','Rocks & Minerals','Water Cycle','Simple Machines','Magnets','Solar System','Health Systems','Scientific Method'] },
    { name: 'Social Studies', icon: '🌎', chapters: ['Map Skills','U.S. Regions','Native Americans','Colonial Life','American Revolution Intro','Branches of Government','Economics & Trade','World Cultures','Citizenship','Famous Americans'] },
    { name: 'Bible', icon: '📜', chapters: ['Life of Jesus','Parables of Jesus','Miracles of Jesus','Sermon on Mount','Jesus and Children','Last Supper','Crucifixion','Resurrection','Great Commission','Acts of Apostles'] },
  ]},
  'grade-3': { label: '3rd Grade', subjects: [
    { name: 'Language Arts', icon: '📝', chapters: ['Reading Strategies','Main Idea & Details','Character Analysis','Grammar & Clauses','Verb Tenses','Writing Organization','Research Skills','Persuasive Writing','Figurative Language','Literature Circles'] },
    { name: 'Math', icon: '✖️', chapters: ['Multiplication Facts','Division Facts','Multi-digit Addition','Multi-digit Subtraction','Fractions','Measurement & Data','Area & Perimeter','Patterns','Rounding & Estimation','Problem Solving'] },
    { name: 'Science', icon: '🔬', chapters: ['Ecosystems','Food Chains','Weather & Climate','Rocks & Soil','States of Matter','Energy & Heat','Light & Sound','Forces & Motion','Life Cycles','Engineering Design'] },
    { name: 'Social Studies', icon: '🗺️', chapters: ['Geography & Maps','U.S. Regions','Native American Cultures','Exploration & Settlement','Colonial America','American Revolution','Constitution Basics','Economics','World Geography','Civic Virtues'] },
    { name: 'Bible', icon: '📜', chapters: ['Old Testament Survey','Psalms & Proverbs','Prophets','Life of David','Kings of Israel','Exile & Return','Gospels Overview','Parables','Epistles Intro','Revelation'] },
  ]},
  'grade-4': { label: '4th Grade', subjects: [
    { name: 'Language Arts', icon: '📝', chapters: ['Text Structures','Inference & Evidence','Poetry Analysis','Complex Sentences','Writing Arguments','Research Papers','Vocabulary Roots','Point of View','Literary Genres','Public Speaking'] },
    { name: 'Math', icon: '✖️', chapters: ['Multi-digit Multiplication','Long Division','Factors & Multiples','Fractions Equivalence','Decimal Introduction','Measurement Conversion','Angles & Lines','Symmetry','Data Analysis','Algebraic Thinking'] },
    { name: 'Science', icon: '🔬', chapters: ['Body Systems','Earth\'s Surface','Weathering & Erosion','Water Cycle','Energy Transfer','Electricity','Waves','Plant & Animal Structures','Natural Disasters','Space Science'] },
    { name: 'Social Studies', icon: '🗺️', chapters: ['State History','Westward Expansion','Civil War Intro','Immigration','Industrial Growth','Map & Globe Skills','Government Structure','Economics & Resources','Geography Skills','Cultural Diversity'] },
    { name: 'Bible', icon: '📜', chapters: ['Genesis Deep Dive','Exodus & Law','Tabernacle','Judges & Ruth','1 & 2 Samuel','1 & 2 Kings','Poetry Books','Major Prophets','Minor Prophets','Intertestamental Period'] },
  ]},
  'grade-5': { label: '5th Grade', subjects: [
    { name: 'Language Arts', icon: '📝', chapters: ['Advanced Comprehension','Theme & Summary','Comparative Literature','Grammar Mastery','Essay Writing','Research Methods','Debate & Discussion','Narrative Techniques','Vocabulary in Context','Literary Analysis'] },
    { name: 'Math', icon: '📐', chapters: ['Decimals Operations','Fraction Operations','Volume','Coordinate Plane','Order of Operations','Numerical Patterns','Measurement Systems','Data & Statistics','Geometry Concepts','Problem Solving Strategies'] },
    { name: 'Science', icon: '🔬', chapters: ['Matter & Chemistry','Mixtures & Solutions','Earth Systems','Oceans & Atmosphere','Ecosystems & Biomes','Food Webs','Human Body Systems','Genetics Basics','Earth\'s History','Technology & Engineering'] },
    { name: 'Social Studies', icon: '🗺️', chapters: ['Early Americans','Age of Exploration','Colonization','Road to Revolution','American Revolution','New Nation','Constitution & Bill of Rights','Westward Movement','Civil War','Reconstruction'] },
    { name: 'Bible', icon: '📜', chapters: ['Matthew','Mark','Luke','John','Acts','Romans','Corinthians','Galatians & Ephesians','Philippians & Colossians','Thessalonians to Revelation'] },
  ]},
  'grade-6': { label: '6th Grade', subjects: [
    { name: 'Language Arts', icon: '📝', chapters: ['Analytical Reading','Argumentative Writing','Narrative Craft','Grammar & Usage','Vocabulary Development','Research Projects','Media Literacy','Poetry & Drama','Informational Writing','Speaking & Listening'] },
    { name: 'Math', icon: '📐', chapters: ['Ratios & Rates','Fractions Division','Integers','Expressions & Equations','Area & Surface Area','Volume','Statistical Thinking','Data Distributions','Coordinate Geometry','Mathematical Reasoning'] },
    { name: 'Science', icon: '🔬', chapters: ['Cells & Organisms','Body Systems','Genetics & Heredity','Ecosystems','Earth\'s Structure','Plate Tectonics','Weather Systems','Climate','Space & Solar System','Scientific Investigation'] },
    { name: 'Social Studies', icon: '🌍', chapters: ['Ancient Civilizations','Mesopotamia','Ancient Egypt','Ancient Greece','Ancient Rome','Ancient India','Ancient China','Medieval World','Renaissance','World Religions'] },
    { name: 'Bible', icon: '📜', chapters: ['Biblical Geography','Old Testament Timeline','Creation & Fall','Patriarchs','Exodus & Wilderness','Conquest & Judges','United Kingdom','Divided Kingdom','Exile & Restoration','Messianic Prophecies'] },
  ]},
  'grade-7': { label: '7th Grade', subjects: [
    { name: 'Language Arts', icon: '📝', chapters: ['Literary Analysis','Argumentative Essays','Research Writing','Grammar Review','Vocabulary Strategies','Novel Studies','Informational Text','Creative Writing','Rhetoric & Persuasion','Oral Presentations'] },
    { name: 'Pre-Algebra', icon: '📐', chapters: ['Integers & Rational Numbers','Expressions','Equations','Inequalities','Proportional Relationships','Percentages','Geometry Fundamentals','Area & Volume','Probability','Statistics'] },
    { name: 'Life Science', icon: '🧬', chapters: ['Cell Structure','Cell Processes','Genetics','DNA & Heredity','Evolution','Classification','Ecology','Populations','Human Body','Health & Disease'] },
    { name: 'World History', icon: '🌍', chapters: ['Medieval Europe','Byzantine Empire','Islamic Civilization','African Kingdoms','Asian Empires','Mongol Empire','Renaissance','Reformation','Age of Exploration','Scientific Revolution'] },
    { name: 'Bible', icon: '📜', chapters: ['Gospel of John','Acts of the Apostles','Paul\'s Journeys','Prison Epistles','Pastoral Letters','General Epistles','Revelation','Christian Ethics','Apologetics Intro','Worldview'] },
  ]},
  'grade-8': { label: '8th Grade', subjects: [
    { name: 'Language Arts', icon: '📝', chapters: ['Critical Reading','Thesis Writing','Advanced Grammar','Rhetorical Analysis','Research Methods','American Literature','Poetry Analysis','Drama & Shakespeare','Technical Writing','Debate'] },
    { name: 'Pre-Algebra II', icon: '📐', chapters: ['Real Numbers','Linear Equations','Functions','Slope & Intercept','Systems of Equations','Exponents','Scientific Notation','Pythagorean Theorem','Transformations','Data Analysis'] },
    { name: 'Physical Science', icon: '⚛️', chapters: ['Matter & Atoms','Elements & Periodic Table','Chemical Reactions','Forces & Motion','Newton\'s Laws','Energy','Waves','Electricity','Magnetism','Earth in Space'] },
    { name: 'U.S. History', icon: '🇺🇸', chapters: ['Colonial America','American Revolution','Constitution','Early Republic','Westward Expansion','Civil War','Reconstruction','Industrial Age','Progressive Era','World Wars'] },
    { name: 'Bible', icon: '📜', chapters: ['Hermeneutics','Old Testament Survey','New Testament Survey','Church History','Reformation','Great Awakening','Modern Church','Ethics & Morality','Comparative Religion','Personal Faith'] },
  ]},
  'grade-9': { label: '9th Grade', subjects: [
    { name: 'English I', icon: '📖', chapters: ['Short Stories','Novel Study','Poetry','Drama','Narrative Writing','Expository Writing','Grammar & Mechanics','Vocabulary','Research Paper','Literary Criticism'] },
    { name: 'Algebra I', icon: '📐', chapters: ['Foundations','Linear Equations','Inequalities','Functions','Linear Functions','Systems of Equations','Exponents & Polynomials','Factoring','Quadratics','Data & Statistics'] },
    { name: 'Biology', icon: '🧬', chapters: ['Scientific Method','Biochemistry','Cell Biology','Genetics','DNA & Protein Synthesis','Evolution','Ecology','Classification','Human Biology','Biotechnology'] },
    { name: 'World Geography', icon: '🌍', chapters: ['Map Skills','Physical Geography','Climate & Weather','Population','Culture','North America','South America','Europe','Asia & Africa','Oceania'] },
    { name: 'Bible', icon: '📜', chapters: ['Pentateuch','Historical Books','Wisdom Literature','Major Prophets','Minor Prophets','Gospels','Acts & Early Church','Pauline Epistles','General Letters','Eschatology'] },
  ]},
  'grade-10': { label: '10th Grade', subjects: [
    { name: 'English II', icon: '📖', chapters: ['World Literature','Epic Poetry','Shakespeare','Rhetoric','Persuasive Writing','Research Skills','Vocabulary Roots','Drama Analysis','Comparative Essays','Media Analysis'] },
    { name: 'Geometry', icon: '📐', chapters: ['Foundations of Geometry','Parallel & Perpendicular Lines','Triangles','Congruence','Similarity','Right Triangles & Trigonometry','Quadrilaterals','Circles','Area & Volume','Coordinate Geometry'] },
    { name: 'Chemistry', icon: '⚗️', chapters: ['Atomic Structure','Periodic Table','Chemical Bonding','Chemical Reactions','Stoichiometry','States of Matter','Solutions','Acids & Bases','Thermochemistry','Nuclear Chemistry'] },
    { name: 'World History', icon: '🌍', chapters: ['Ancient Civilizations Review','Classical Era','Medieval Period','Renaissance & Reformation','Enlightenment','Revolutions','Imperialism','World War I','World War II','Modern World'] },
    { name: 'Bible', icon: '📜', chapters: ['Biblical Theology','Covenant Theology','Kingdom of God','Christology','Pneumatology','Ecclesiology','Sanctification','Christian Worldview','Apologetics','Mission & Service'] },
  ]},
  'grade-11': { label: '11th Grade', subjects: [
    { name: 'English III', icon: '📖', chapters: ['American Literature Early','Transcendentalism','Realism & Naturalism','Harlem Renaissance','Modern American Lit','Contemporary Literature','Advanced Composition','Research Thesis','Critical Theory','SAT/ACT Prep Reading'] },
    { name: 'Algebra II', icon: '📐', chapters: ['Linear & Absolute Value','Quadratic Functions','Polynomial Functions','Rational Functions','Radical Functions','Exponential & Logarithmic','Sequences & Series','Trigonometry','Conic Sections','Probability & Statistics'] },
    { name: 'Physics', icon: '⚛️', chapters: ['Kinematics','Newton\'s Laws','Work & Energy','Momentum','Circular Motion','Gravitation','Waves & Sound','Light & Optics','Electricity','Magnetism'] },
    { name: 'U.S. History', icon: '🇺🇸', chapters: ['Foundations of America','Constitution & Government','Jacksonian Era','Manifest Destiny','Civil War & Reconstruction','Gilded Age','Progressive Era','World War I','Roaring 20s & Depression','World War II to Present'] },
    { name: 'Bible', icon: '📜', chapters: ['Systematic Theology I','Systematic Theology II','Philosophy & Faith','Ethics in Society','Bioethics','Social Justice','Leadership','Spiritual Disciplines','Mentorship','Senior Thesis'] },
  ]},
  'grade-12': { label: '12th Grade', subjects: [
    { name: 'English IV', icon: '📖', chapters: ['British Literature Early','Shakespeare Deep Dive','Romantic Period','Victorian Literature','Modern British Lit','World Literature Survey','College Essay Writing','Advanced Research','Literary Criticism','Capstone Project'] },
    { name: 'Pre-Calculus', icon: '📐', chapters: ['Functions Review','Polynomial & Rational','Exponential & Log','Trigonometric Functions','Analytical Trigonometry','Vectors','Polar Coordinates','Sequences & Series','Limits Introduction','Calculus Preview'] },
    { name: 'Environmental Science', icon: '🌿', chapters: ['Ecosystems','Biodiversity','Population Ecology','Water Resources','Air & Atmosphere','Land & Soil','Energy Resources','Climate Change','Sustainability','Environmental Policy'] },
    { name: 'Government & Economics', icon: '🏛️', chapters: ['Foundations of Government','Constitution','Federal Government','State & Local Government','Civil Liberties','Economic Principles','Supply & Demand','Market Systems','Global Economics','Personal Finance'] },
    { name: 'Bible', icon: '📜', chapters: ['Worldview Capstone','Theology Review','Church History Survey','Missions & Outreach','Marriage & Family','Vocation & Calling','Stewardship','Apologetics Defense','Faith & Culture','Graduation Reflection'] },
  ]},
};

function generateLessons(chapters, totalDays = 180) {
  const lessons = [];
  const daysPerChapter = Math.floor(totalDays / chapters.length);
  const remainder = totalDays % chapters.length;
  
  let day = 1;
  for (let ci = 0; ci < chapters.length; ci++) {
    const chapterName = chapters[ci];
    const chapterDays = daysPerChapter + (ci < remainder ? 1 : 0);
    
    for (let li = 0; li < chapterDays; li++) {
      const lessonInChapter = li + 1;
      let phase;
      if (lessonInChapter <= Math.ceil(chapterDays * 0.3)) phase = 'Introduction';
      else if (lessonInChapter <= Math.ceil(chapterDays * 0.6)) phase = 'Practice';
      else if (lessonInChapter <= Math.ceil(chapterDays * 0.85)) phase = 'Application';
      else phase = 'Review & Assessment';

      lessons.push({
        id: `l${day}`,
        day,
        title: `${chapterName}: ${phase} (Lesson ${lessonInChapter})`,
        dynamicQuery: `dynamic:${chapterName}`
      });
      day++;
    }
  }
  return lessons;
}

const curriculum = {
  grades: Object.entries(GRADES).map(([id, grade]) => ({
    id,
    label: grade.label,
    subjects: grade.subjects.map(subj => ({
      id: `subj-${id}-${subj.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name: subj.name,
      icon: subj.icon,
      lessons: generateLessons(subj.chapters)
    }))
  }))
};

const outPath = path.join(__dirname, '..', 'src', 'data', 'curriculum-structure.json');
fs.writeFileSync(outPath, JSON.stringify(curriculum, null, 2));
console.log(`✅ Generated curriculum: ${curriculum.grades.length} grades`);
curriculum.grades.forEach(g => {
  console.log(`  ${g.label}: ${g.subjects.length} subjects, ${g.subjects[0].lessons.length} lessons each`);
});
const stats = fs.statSync(outPath);
console.log(`  File size: ${(stats.size / 1024).toFixed(0)} KB`);
