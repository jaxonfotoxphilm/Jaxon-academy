const fs = require('fs');

const curriculum = JSON.parse(fs.readFileSync('src/data/curriculum-structure.json', 'utf8'));

const library = {};

const generateBooks = (subjectName) => {
    return [
        {
            id: `book-${Date.now()}-1`,
            title: `The Fundamentals of ${subjectName}`,
            author: "Abeka Scholar Press",
            year: "2024",
            coverColor: "from-blue-600 to-indigo-800",
            chapters: [
                { id: "c1", title: "Introduction & Context", content: `This text covers the fundamental principles of ${subjectName}. It is designed for students seeking a rigorous understanding of the topic.` },
                { id: "c2", title: "Core Methodologies", content: `The methodology behind ${subjectName} relies heavily on consistent practice and memorization of key concepts.` },
                { id: "c3", title: "Review Questions", content: `1. Define the main concepts of ${subjectName}.\n2. How does this apply to real-world scenarios?` }
            ]
        },
        {
            id: `book-${Date.now()}-2`,
            title: `${subjectName}: Advanced Study Guide`,
            author: "Dr. Grace",
            year: "2023",
            coverColor: "from-amber-600 to-orange-800",
            chapters: [
                { id: "c1", title: "Study Tips", content: `To master ${subjectName}, review your notes daily and complete all practice problems.` },
                { id: "c2", title: "Common Mistakes", content: `Students often confuse the primary rules of ${subjectName}. Remember to double-check your work.` }
            ]
        },
        {
            id: `book-${Date.now()}-3`,
            title: `Historical Context of ${subjectName}`,
            author: "Institute of Learning",
            year: "2021",
            coverColor: "from-emerald-600 to-teal-800",
            chapters: [
                { id: "c1", title: "Origins", content: `The origins of ${subjectName} can be traced back centuries, evolving through continuous academic study.` }
            ]
        }
    ];
};

// Loop through all grades and subjects
curriculum.grades.forEach(grade => {
    grade.subjects.forEach(subject => {
        library[subject.id] = generateBooks(subject.name);
    });
});

fs.writeFileSync('src/data/library-data.json', JSON.stringify(library, null, 2));
console.log(`Generated massive library database! File size: ${fs.statSync('src/data/library-data.json').size} bytes.`);
