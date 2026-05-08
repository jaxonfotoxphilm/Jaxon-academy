const fs = require('fs');

const pkTo2 = [
    { id: "dynamic:Phonics", name: "Phonics & Word Study", icon: "🅰️", color: "from-fuchsia-600 to-purple-600" },
    { id: "dynamic:Reading", name: "Reading Comprehension", icon: "📖", color: "from-blue-500 to-indigo-600" },
    { id: "dynamic:Penmanship", name: "Manuscript Penmanship", icon: "✍️", color: "from-orange-400 to-red-500" },
    { id: "dynamic:Arithmetic", name: "Arithmetic Fundamentals", icon: "➗", color: "from-emerald-600 to-teal-700" },
    { id: "dynamic:Science", name: "God's World (Science)", icon: "🌱", color: "from-green-500 to-emerald-600" },
    { id: "dynamic:History", name: "Community History", icon: "🏘️", color: "from-amber-600 to-orange-600" },
    { id: "dynamic:Health", name: "Health & Safety", icon: "🍎", color: "from-red-500 to-rose-600" },
    { id: "dynamic:Art", name: "Art & Colors", icon: "🎨", color: "from-pink-500 to-rose-500" },
    { id: "dynamic:Bible", name: "Bible Stories", icon: "📜", color: "from-yellow-500 to-amber-600" }
];

const grades3to5 = [
    { id: "dynamic:Language Arts", name: "Language Arts", icon: "📝", color: "from-fuchsia-600 to-purple-600" },
    { id: "dynamic:Spelling", name: "Spelling & Poetry", icon: "🗣️", color: "from-indigo-500 to-violet-600" },
    { id: "dynamic:Cursive", name: "Cursive Penmanship", icon: "✒️", color: "from-orange-500 to-red-600" },
    { id: "dynamic:Mathematics", name: "Arithmetic & Logic", icon: "➗", color: "from-emerald-600 to-teal-700" },
    { id: "dynamic:Biology", name: "Science & Biology", icon: "🔬", color: "from-green-600 to-emerald-700" },
    { id: "dynamic:United States History", name: "American History", icon: "🦅", color: "from-red-600 to-rose-700" },
    { id: "dynamic:Geography", name: "World Geography", icon: "🌍", color: "from-cyan-500 to-blue-600" },
    { id: "dynamic:Health", name: "Health & Human Body", icon: "🏃", color: "from-rose-400 to-red-500" },
    { id: "dynamic:Theology", name: "Journey Through Scripture", icon: "📜", color: "from-amber-600 to-orange-700" }
];

const grades6to8 = [
    { id: "dynamic:Grammar", name: "Grammar & Composition", icon: "✍️", color: "from-purple-600 to-indigo-700" },
    { id: "dynamic:Literature", name: "World Literature", icon: "📚", color: "from-blue-600 to-indigo-600" },
    { id: "dynamic:Vocabulary", name: "Vocabulary & Spelling", icon: "📖", color: "from-violet-500 to-purple-600" },
    { id: "dynamic:Pre-algebra", name: "Pre-Algebra / Algebra 1", icon: "📐", color: "from-teal-600 to-cyan-700" },
    { id: "dynamic:Earth science", name: "Earth & Space Science", icon: "🪐", color: "from-indigo-600 to-blue-700" },
    { id: "dynamic:Life science", name: "Life Science", icon: "🧬", color: "from-emerald-500 to-green-600" },
    { id: "dynamic:World history", name: "World History", icon: "🏛️", color: "from-amber-600 to-red-700" },
    { id: "dynamic:Civics", name: "Civics & Government", icon: "⚖️", color: "from-slate-600 to-slate-800" },
    { id: "dynamic:Christianity", name: "Life of Christ & Acts", icon: "✝️", color: "from-yellow-600 to-amber-700" }
];

const grades9to12 = [
    { id: "dynamic:English literature", name: "Advanced Literature", icon: "✒️", color: "from-indigo-700 to-violet-800" },
    { id: "dynamic:Composition", name: "Composition & Rhetoric", icon: "📝", color: "from-purple-700 to-fuchsia-800" },
    { id: "dynamic:Algebra", name: "Algebra II / Geometry", icon: "∑", color: "from-cyan-700 to-blue-800" },
    { id: "dynamic:Calculus", name: "Pre-Calculus / Calculus", icon: "∫", color: "from-blue-700 to-indigo-900" },
    { id: "dynamic:Chemistry", name: "Chemistry", icon: "🧪", color: "from-emerald-700 to-green-800" },
    { id: "dynamic:Physics", name: "Physics", icon: "⚡", color: "from-yellow-500 to-amber-600" },
    { id: "dynamic:Economics", name: "Economics", icon: "📈", color: "from-green-600 to-emerald-800" },
    { id: "dynamic:United States History", name: "US History & Gov", icon: "🦅", color: "from-red-700 to-rose-800" },
    { id: "dynamic:Foreign language", name: "Foreign Language", icon: "🗣️", color: "from-pink-600 to-rose-700" },
    { id: "dynamic:Christian apologetics", name: "Advanced Apologetics", icon: "🛡️", color: "from-amber-700 to-orange-800" }
];

const grades = [];

for (let i = 0; i <= 12; i++) {
    const label = i === 0 ? "Kindergarten" : `${i}${i === 1 ? 'st' : i === 2 ? 'nd' : i === 3 ? 'rd' : 'th'} Grade`;
    const id = `grade-${i === 0 ? 'K' : i}`;
    
    let subjects = [];
    if (i <= 2) subjects = pkTo2;
    else if (i <= 5) subjects = grades3to5;
    else if (i <= 8) subjects = grades6to8;
    else subjects = grades9to12;

    grades.push({ id, label, subjects });
}

// Add Pre-K just in case
grades.unshift({
    id: "grade-PK",
    label: "Pre-K",
    subjects: pkTo2
});

const output = { grades };
fs.writeFileSync('src/data/curriculum-structure.json', JSON.stringify(output, null, 2));
console.log("Successfully overloaded the curriculum structure!");
