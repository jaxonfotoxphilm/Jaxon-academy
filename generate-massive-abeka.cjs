const fs = require('fs');

const pkTo2 = [
    { name: "Phonics & Word Study", icon: "🅰️", color: "from-fuchsia-600 to-purple-600", topics: ["Alphabet", "Vowels", "Consonants", "Blending", "Rhyming"] },
    { name: "Reading Comprehension", icon: "📖", color: "from-blue-500 to-indigo-600", topics: ["Story Elements", "Main Idea", "Characters", "Setting", "Fables"] },
    { name: "Manuscript Penmanship", icon: "✍️", color: "from-orange-400 to-red-500", topics: ["Letter Tracing", "Spacing", "Punctuation Marks", "Capitalization", "Neatness"] },
    { name: "Arithmetic Fundamentals", icon: "➗", color: "from-emerald-600 to-teal-700", topics: ["Counting", "Addition", "Subtraction", "Time", "Money"] },
    { name: "God's World (Science)", icon: "🌱", color: "from-green-500 to-emerald-600", topics: ["Plants", "Animals", "Seasons", "Weather", "Five Senses"] },
    { name: "Community History", icon: "🏘️", color: "from-amber-600 to-orange-600", topics: ["Neighborhood", "Community Helpers", "American Symbols", "Maps", "Transportation"] },
    { name: "Health & Safety", icon: "🍎", color: "from-red-500 to-rose-600", topics: ["Hygiene", "Nutrition", "Exercise", "Safety Rules", "Dental Care"] },
    { name: "Art & Colors", icon: "🎨", color: "from-pink-500 to-rose-500", topics: ["Primary Colors", "Shapes", "Drawing", "Painting", "Crafts"] },
    { name: "Bible Stories", icon: "📜", color: "from-yellow-500 to-amber-600", topics: ["Creation", "Noah's Ark", "Moses", "David", "Life of Jesus"] }
];

const grades3to5 = [
    { name: "Language Arts", icon: "📝", color: "from-fuchsia-600 to-purple-600", topics: ["Nouns", "Verbs", "Adjectives", "Sentence Structure", "Paragraphs"] },
    { name: "Spelling & Poetry", icon: "🗣️", color: "from-indigo-500 to-violet-600", topics: ["Phonetic Rules", "Prefixes", "Suffixes", "Memorization", "Rhyme Schemes"] },
    { name: "Cursive Penmanship", icon: "✒️", color: "from-orange-500 to-red-600", topics: ["Lowercase", "Uppercase", "Connecting Letters", "Speed", "Legibility"] },
    { name: "Arithmetic & Logic", icon: "➗", color: "from-emerald-600 to-teal-700", topics: ["Multiplication", "Division", "Fractions", "Decimals", "Geometry Basics"] },
    { name: "Science & Biology", icon: "🔬", color: "from-green-600 to-emerald-700", topics: ["Ecosystems", "Human Body", "Solar System", "Matter", "Energy"] },
    { name: "American History", icon: "🦅", color: "from-red-600 to-rose-700", topics: ["Colonial America", "Revolutionary War", "Pioneers", "Civil War", "Industrial Revolution"] },
    { name: "World Geography", icon: "🌍", color: "from-cyan-500 to-blue-600", topics: ["Continents", "Oceans", "Landforms", "Climate Zones", "Cultures"] },
    { name: "Health & Human Body", icon: "🏃", color: "from-rose-400 to-red-500", topics: ["Digestive System", "Muscles", "Bones", "First Aid", "Healthy Habits"] },
    { name: "Journey Through Scripture", icon: "📜", color: "from-amber-600 to-orange-700", topics: ["Genesis", "Exodus", "Kings of Israel", "Prophets", "Gospels"] }
];

const grades6to8 = [
    { name: "Grammar & Composition", icon: "✍️", color: "from-purple-600 to-indigo-700", topics: ["Clauses", "Phrases", "Essays", "Research Papers", "Debate"] },
    { name: "World Literature", icon: "📚", color: "from-blue-600 to-indigo-600", topics: ["Mythology", "Folklore", "Classic Novels", "Poetry Analysis", "Drama"] },
    { name: "Vocabulary & Spelling", icon: "📖", color: "from-violet-500 to-purple-600", topics: ["Latin Roots", "Greek Roots", "Synonyms", "Antonyms", "Context Clues"] },
    { name: "Pre-Algebra / Algebra 1", icon: "📐", color: "from-teal-600 to-cyan-700", topics: ["Equations", "Inequalities", "Functions", "Polynomials", "Graphing"] },
    { name: "Earth & Space Science", icon: "🪐", color: "from-indigo-600 to-blue-700", geology: ["Geology", "Meteorology", "Oceanography", "Astronomy", "Environmental Science"] },
    { name: "Life Science", icon: "🧬", color: "from-emerald-500 to-green-600", topics: ["Cells", "Genetics", "Evolution Theory", "Classification", "Ecology"] },
    { name: "World History", icon: "🏛️", color: "from-amber-600 to-red-700", topics: ["Ancient Civilizations", "Middle Ages", "Renaissance", "Age of Discovery", "Modern Era"] },
    { name: "Civics & Government", icon: "⚖️", color: "from-slate-600 to-slate-800", topics: ["Constitution", "Branches of Government", "Elections", "Citizenship", "Law"] },
    { name: "Life of Christ & Acts", icon: "✝️", color: "from-yellow-600 to-amber-700", topics: ["Miracles", "Parables", "Crucifixion", "Resurrection", "Early Church"] }
];

const grades9to12 = [
    { name: "Advanced Literature", icon: "✒️", color: "from-indigo-700 to-violet-800", topics: ["American Lit", "British Lit", "Shakespeare", "Modernism", "Literary Criticism"] },
    { name: "Composition & Rhetoric", icon: "📝", color: "from-purple-700 to-fuchsia-800", topics: ["Persuasion", "Logic", "Expository Writing", "Creative Writing", "Journalism"] },
    { name: "Algebra II / Geometry", icon: "∑", color: "from-cyan-700 to-blue-800", topics: ["Trigonometry", "Logarithms", "Proofs", "Conic Sections", "Matrices"] },
    { name: "Pre-Calculus / Calculus", icon: "∫", color: "from-blue-700 to-indigo-900", topics: ["Limits", "Derivatives", "Integrals", "Series", "Differential Equations"] },
    { name: "Chemistry", icon: "🧪", color: "from-emerald-700 to-green-800", topics: ["Atomic Structure", "Periodic Table", "Bonding", "Stoichiometry", "Thermodynamics"] },
    { name: "Physics", icon: "⚡", color: "from-yellow-500 to-amber-600", topics: ["Mechanics", "Kinematics", "Electromagnetism", "Optics", "Quantum Physics"] },
    { name: "Economics", icon: "📈", color: "from-green-600 to-emerald-800", topics: ["Microeconomics", "Macroeconomics", "Supply and Demand", "Markets", "Personal Finance"] },
    { name: "US History & Gov", icon: "🦅", color: "from-red-700 to-rose-800", topics: ["Founding Documents", "Civil Rights", "Cold War", "Foreign Policy", "Supreme Court"] },
    { name: "Foreign Language", icon: "🗣️", color: "from-pink-600 to-rose-700", topics: ["Vocabulary", "Conjugation", "Conversation", "Culture", "Translation"] },
    { name: "Advanced Apologetics", icon: "🛡️", color: "from-amber-700 to-orange-800", topics: ["Worldviews", "Historical Evidence", "Philosophy of Religion", "Ethics", "Theodicy"] }
];

const generateLessons = (subjectName, topics) => {
    const lessons = [];
    // Ensure we have an array to work with
    const safeTopics = Array.isArray(topics) ? topics : ["Introduction", "Core Concepts", "Advanced Principles", "Review", "Final Exam"];
    
    for (let day = 1; day <= 170; day++) {
        // Pick a topic based on how far through the year we are
        const topicIndex = Math.floor(((day - 1) / 170) * safeTopics.length);
        const topic = safeTopics[topicIndex];
        
        let title = `Lesson ${day}: `;
        if (day % 30 === 0) {
            title += `Unit Test - ${topic}`;
        } else if (day % 15 === 0) {
            title += `Quiz & Review - ${topic}`;
        } else {
            title += `Exploring ${topic} (Part ${(day % 15) || 15})`;
        }
        
        // This will trigger the dynamic Wikipedia fetch engine
        const dynamicId = `dynamic:${subjectName} ${topic}`;

        lessons.push({
            id: `l${day}`,
            day: day,
            title: title,
            dynamicQuery: dynamicId
        });
    }
    return lessons;
};

const grades = [];

for (let i = 0; i <= 12; i++) {
    const label = i === 0 ? "Kindergarten" : `${i}${i === 1 ? 'st' : i === 2 ? 'nd' : i === 3 ? 'rd' : 'th'} Grade`;
    const gradeId = `grade-${i === 0 ? 'K' : i}`;
    
    let templateSubjects = [];
    if (i <= 2) templateSubjects = pkTo2;
    else if (i <= 5) templateSubjects = grades3to5;
    else if (i <= 8) templateSubjects = grades6to8;
    else templateSubjects = grades9to12;

    const subjects = templateSubjects.map(ts => ({
        id: `subj-${gradeId}-${ts.name.replace(/\\s+/g, '-').toLowerCase()}`,
        name: ts.name,
        icon: ts.icon,
        color: ts.color,
        lessons: generateLessons(ts.name, ts.topics || ts.geology)
    }));

    grades.push({ id: gradeId, label, subjects });
}

// Add Pre-K
grades.unshift({
    id: "grade-PK",
    label: "Pre-K",
    subjects: pkTo2.map(ts => ({
        id: `subj-grade-PK-${ts.name.replace(/\\s+/g, '-').toLowerCase()}`,
        name: ts.name,
        icon: ts.icon,
        color: ts.color,
        lessons: generateLessons(ts.name, ts.topics)
    }))
});

const output = { grades };
fs.writeFileSync('src/data/curriculum-structure.json', JSON.stringify(output, null, 2));
console.log(`Successfully generated massive 170-day curriculum! File size is now ${fs.statSync('src/data/curriculum-structure.json').size} bytes.`);
