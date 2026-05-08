const fs = require('fs');

// We use the native fetch API available in Node 18+

const topicMap = {
    // Math
    "elem-math": { topic: "Arithmetic", visual: "math-geometry" },
    "ms-math": { topic: "Algebra", visual: "math-geometry" },
    "hs-math": { topic: "Calculus", visual: "math-geometry" },
    "elem-arithmetic": { topic: "Number_theory", visual: "math-geometry" },
    "ms-arithmetic": { topic: "Mathematics", visual: "math-geometry" },
    "hs-arithmetic": { topic: "Mathematical_analysis", visual: "math-geometry" },
    
    // Science
    "elem-science": { topic: "Atom", visual: "science-atom" },
    "ms-science": { topic: "Chemistry", visual: "science-atom" },
    "hs-science": { topic: "Quantum_mechanics", visual: "science-atom" },
    
    // History
    "elem-history": { topic: "Ancient_Egypt", visual: "history-scroll" },
    "ms-history": { topic: "Roman_Empire", visual: "history-scroll" },
    "hs-history": { topic: "World_War_II", visual: "history-scroll" },
    
    // English / Reading
    "elem-reading": { topic: "Children's_literature", visual: "reading-book" },
    "ms-reading": { topic: "Novel", visual: "reading-book" },
    "hs-reading": { topic: "William_Shakespeare", visual: "reading-book" },
    "elem-grammar": { topic: "Grammar", visual: "reading-book" },
    "ms-grammar": { topic: "Syntax", visual: "reading-book" },
    "hs-grammar": { topic: "Linguistics", visual: "reading-book" },
    "elem-phonics": { topic: "Phonics", visual: "reading-book" },
    "ms-phonics": { topic: "Phonology", visual: "reading-book" },
    "hs-phonics": { topic: "Phonetics", visual: "reading-book" },
    "elem-spelling": { topic: "Orthography", visual: "reading-book" },
    "ms-spelling": { topic: "English_orthography", visual: "reading-book" },
    "hs-spelling": { topic: "Etymology", visual: "reading-book" },
    "elem-penmanship": { topic: "Penmanship", visual: "reading-book" },
    "ms-penmanship": { topic: "Calligraphy", visual: "reading-book" },
    "hs-penmanship": { topic: "Handwriting", visual: "reading-book" },

    // Electives
    "elem-art": { topic: "Art", visual: "history-scroll" },
    "ms-art": { topic: "Renaissance_art", visual: "history-scroll" },
    "hs-art": { topic: "Modern_art", visual: "history-scroll" },
    "elem-bible": { topic: "Bible", visual: "history-scroll" },
    "ms-bible": { topic: "Theology", visual: "history-scroll" },
    "hs-bible": { topic: "Apologetics", visual: "history-scroll" }
};

const CHUNK_SIZE = 400; // rough character target per node

async function fetchWikipediaData(topic) {
    const url = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&titles=${encodeURIComponent(topic)}&format=json`;
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'JaxonAcademy/1.0 (contact@jaxonacademy.edu) Node-Fetch'
            }
        });
        const data = await response.json();
        const pages = data.query.pages;
        const pageId = Object.keys(pages)[0];
        if (pageId === "-1") return "Data not found.";
        return pages[pageId].extract;
    } catch (e) {
        console.error("Error fetching " + topic, e);
        return "Error fetching data.";
    }
}

const delay = (ms) => new Promise(res => setTimeout(res, ms));

function splitTextIntoChunks(text) {
    // split by sentences roughly, don't break in middle of sentence
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const chunks = [];
    let currentChunk = "";

    for (let sentence of sentences) {
        // clean up newlines
        sentence = sentence.replace(/\n/g, ' ').trim();
        if (!sentence) continue;

        if ((currentChunk.length + sentence.length) > CHUNK_SIZE && currentChunk.length > 0) {
            chunks.push(currentChunk.trim());
            currentChunk = sentence + " ";
        } else {
            currentChunk += sentence + " ";
        }
    }
    if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
    }
    return chunks;
}

async function buildCurriculum() {
    console.log("Starting massive curriculum scrape...");
    const lessonsData = {};
    let totalDataSize = 0;

    for (const [subjectId, meta] of Object.entries(topicMap)) {
        console.log(`Scraping ${meta.topic} for ${subjectId}...`);
        const rawText = await fetchWikipediaData(meta.topic);
        await delay(1000); // 1 second delay to avoid rate limiting
        
        // Let's grab up to a massive amount (first 100,000 characters)
        const truncatedText = rawText.substring(0, 100000); 
        totalDataSize += truncatedText.length;

        const chunks = splitTextIntoChunks(truncatedText);
        
        // Let's cap at 150 nodes per subject. 
        const nodeLimit = Math.min(chunks.length, 150);

        const nodes = [];
        
        // Introduction Node
        nodes.push({
            id: `${subjectId}-intro`,
            characterName: "Professor",
            text: `Welcome to our advanced study module on ${meta.topic.replace(/_/g, ' ')}. We have a massive amount of material to cover. Let us begin.`,
            voiceType: "professor",
            visualType: meta.visual,
            isQuiz: false
        });

        for (let i = 0; i < nodeLimit; i++) {
            nodes.push({
                id: `${subjectId}-node-${i}`,
                characterName: "Professor",
                text: chunks[i],
                voiceType: "professor",
                visualType: meta.visual,
                isQuiz: false
            });
            
            // Inject a quiz every 15 nodes just to keep it interactive
            if (i > 0 && i % 15 === 0) {
                nodes.push({
                    id: `${subjectId}-quiz-${i}`,
                    characterName: "Professor",
                    text: `Let us assess your comprehension thus far regarding ${meta.topic.replace(/_/g, ' ')}.`,
                    voiceType: "professor",
                    visualType: meta.visual,
                    isQuiz: true,
                    question: `Are you keeping up with the extensive material on ${meta.topic.replace(/_/g, ' ')}?`,
                    options: [
                        "I am confused.",
                        "I understand perfectly.",
                        "I need a break.",
                        "What is this?"
                    ],
                    correctIndex: 1,
                    nextNodeId: (i === nodeLimit - 1) ? `${subjectId}-end` : `${subjectId}-node-${i+1}`
                });
            }
        }

        nodes.push({
            id: `${subjectId}-end`,
            characterName: "System",
            text: `Comprehensive Module on ${meta.topic.replace(/_/g, ' ')} Complete. You have assimilated a massive amount of real-world academic data.`,
            voiceType: "narrator",
            visualType: meta.visual,
            isQuiz: false,
            nextNodeId: "end"
        });

        lessonsData[subjectId] = nodes;
    }

    // Default catch-all
    lessonsData["default"] = [
        {
            id: "def1",
            characterName: "Professor",
            text: "Welcome. Our servers are fetching terabytes of academic data. Please explore the other modules while this one initializes.",
            voiceType: "professor",
            visualType: "reading-book",
            isQuiz: false,
            nextNodeId: "end"
        }
    ];

    fs.writeFileSync('src/data/lessons.json', JSON.stringify(lessonsData, null, 2));
    console.log(`\nSuccess! Wrote ${(totalDataSize / 1024).toFixed(2)} KB of pure academic text across ${Object.keys(lessonsData).length} subjects.`);
}

buildCurriculum();
