const fs = require('fs');
const path = require('path');

const pdfsDir = path.join(__dirname, '../public/curriculum-pdfs');
const outputJson = path.join(__dirname, '../src/data/pdf-list.json');

const files = fs.readdirSync(pdfsDir).filter(f => f.endsWith('.pdf'));

const library = {
    "Elementary": [],
    "Middle School": [],
    "High School": [],
    "Grade Specific": []
};

files.forEach(file => {
    const item = {
        id: file,
        name: file.replace('.pdf', '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        path: `/curriculum-pdfs/${file}`
    };

    if (file.startsWith('elem-')) {
        library["Elementary"].push(item);
    } else if (file.startsWith('ms-')) {
        library["Middle School"].push(item);
    } else if (file.startsWith('hs-')) {
        library["High School"].push(item);
    } else if (file.startsWith('subj-grade-')) {
        library["Grade Specific"].push(item);
    } else {
        // default
        library["Grade Specific"].push(item);
    }
});

// Write to JSON
fs.writeFileSync(outputJson, JSON.stringify(library, null, 2));
console.log(`Indexed ${files.length} PDFs into src/data/pdf-list.json`);
