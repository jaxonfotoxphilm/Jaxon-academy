import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const lessonsPath = path.join(__dirname, '../src/data/lessons.json');
const currStructPath = path.join(__dirname, '../src/data/curriculum-structure.json');

const fetchWikipedia = (title) => {
    return new Promise((resolve, reject) => {
        // Use Simple English Wikipedia to make the vocabulary digestible for elementary kids!
        const url = `https://simple.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=true&titles=${encodeURIComponent(title)}&format=json`;
        https.get(url, { headers: { 'User-Agent': 'AbekaScholar/1.0 (test@example.com)' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    const pages = parsed.query.pages;
                    const pageId = Object.keys(pages)[0];
                    if (pageId === '-1') resolve('');
                    else resolve(pages[pageId].extract || '');
                } catch (e) { resolve(''); }
            });
        }).on('error', (e) => resolve(''));
    });
};

const mapSubjectToWiki = (id) => {
    const l = id.toLowerCase();
    if (l.includes('math') || l.includes('arithmetic')) return ['Mathematics', 'Arithmetic', 'Algebra', 'Geometry', 'Calculus', 'Trigonometry'];
    if (l.includes('science')) return ['Science', 'Biology', 'Physics', 'Chemistry', 'Earth_science', 'Astronomy'];
    if (l.includes('history')) return ['History', 'History_of_the_United_States', 'History_of_the_world', 'Ancient_history', 'American_Revolution'];
    if (l.includes('reading') || l.includes('phonics') || l.includes('literature')) return ['Reading', 'Literature', 'English_literature', 'Poetry', 'Fairy_tale'];
    if (l.includes('grammar') || l.includes('spelling') || l.includes('writing') || l.includes('composition')) return ['Grammar', 'English_grammar', 'Linguistics', 'Syntax', 'Writing'];
    if (l.includes('bible')) return ['Bible', 'Christianity', 'Theology', 'Old_Testament', 'New_Testament'];
    if (l.includes('art') || l.includes('penmanship')) return ['Art', 'History_of_art', 'Painting', 'Calligraphy', 'Drawing'];
    return ['Education', 'Knowledge', 'Academic_discipline'];
};

const getVisualType = (id) => {
    const l = id.toLowerCase();
    if (l.includes('math') || l.includes('arithmetic')) return 'math-geometry';
    if (l.includes('science')) return 'teaching-board';
    if (l.includes('history')) return 'reading-book';
    return 'thinking';
};

const run = async () => {
    console.log('Building MASSIVE Curriculum...');
    
    // Get all subjects
    let subjects = [];
    try {
        const structure = JSON.parse(fs.readFileSync(currStructPath, 'utf8'));
        structure.grades.forEach(g => {
            g.subjects.forEach(s => subjects.push(s.id));
        });
    } catch(e) {
        console.error('Failed to parse curriculum-structure.json');
        return;
    }
    
    // De-dupe subjects
    subjects = [...new Set(subjects)];
    
    const lessonsData = {};
    const wikiCache = {}; // Cache to store fetched texts and avoid rate-limiting
    
    for (const subjectId of subjects) {
        console.log(`\nFetching huge content for ${subjectId}...`);
        
        const topics = mapSubjectToWiki(subjectId);
        let massiveText = "";
        
        for (const topic of topics) {
            if (!wikiCache[topic]) {
                console.log(`  -> Downloading ${topic} from Wikipedia...`);
                wikiCache[topic] = await fetchWikipedia(topic);
            } else {
                console.log(`  -> Using cached ${topic}...`);
            }
            massiveText += wikiCache[topic] + "\n\n";
        }
        
        // Clean and chunk the text
        const rawParagraphs = massiveText.split('\n').map(p => p.trim()).filter(p => p.length > 50 && !p.startsWith('==') && !p.includes('may refer to'));
        
        // We want about 100-200 nodes per subject.
        const paragraphs = rawParagraphs.slice(0, 150);
        
        let contentNodes = [];
        let pIndex = 0;
        let lessonIdCounter = 1;
        
        const visualTypes = ['reading-book', 'science-atom', 'math-geometry', 'history-scroll', 'video-nature', 'video-history', 'video-science', 'video-space'];
        
        const storyPrefixes = [
            "Imagine we are going on an amazing adventure to learn about this! ",
            "Let me tell you a fascinating story. ",
            "Did you know? ",
            "Here's a really cool secret about this topic: ",
            "Close your eyes and picture this... ",
            "This is one of my favorite things to teach! ",
        ];

        // Intro Node
        contentNodes.push({
            id: `${subjectId}-intro`,
            characterName: "Professor Grace",
            text: `Welcome to our amazing journey into ${subjectId.split('-').pop()}! We have so many fun things to discover today. Let's get started!`,
            voiceType: "professor",
            visualType: visualTypes[Math.floor(Math.random() * visualTypes.length)],
            isQuiz: false,
            nextNodeId: `${subjectId}-${lessonIdCounter}`
        });

        while (pIndex < paragraphs.length) {
            const visual = visualTypes[Math.floor(Math.random() * visualTypes.length)];
            const useStoryPrefix = Math.random() > 0.6;
            let paragraphText = paragraphs[pIndex];
            
            if (useStoryPrefix) {
                const prefix = storyPrefixes[Math.floor(Math.random() * storyPrefixes.length)];
                paragraphText = prefix + paragraphText;
            }
            
            const nodeId = `${subjectId}-${lessonIdCounter}`;
            let nextNodeId = `${subjectId}-${lessonIdCounter + 1}`;
            
            // Every 8 paragraphs, inject a meaningful Mini-Quiz checkpoint
            if (pIndex > 0 && pIndex % 8 === 0 && pIndex !== paragraphs.length - 1) {
                const prevWords = paragraphs[pIndex-1].split(' ').filter(w => w.length > 5);
                const keyword = prevWords.length > 0 ? prevWords[Math.floor(Math.random() * prevWords.length)].replace(/[^a-zA-Z]/g, '') : "the concepts";
                
                const quizId = `${subjectId}-quiz-${lessonIdCounter}`;
                const failNodeId = `${quizId}-fail`;
                
                nextNodeId = quizId;
                
                contentNodes.push({
                    id: nodeId,
                    characterName: "Professor Grace",
                    text: paragraphText,
                    visualType: visual,
                    nextNodeId: nextNodeId
                });
                
                contentNodes.push({
                    id: quizId,
                    characterName: "Professor Grace",
                    isQuiz: true,
                    question: `Let's pause our story! Which of these is closely related to what we just discussed about ${keyword}?`,
                    options: [
                        `Something exactly related to ${keyword}`,
                        `A completely different idea`,
                        `Wait, I don't understand, please explain it simpler.`
                    ],
                    correctAnswer: 0,
                    visualType: visual,
                    branchTargets: [`${subjectId}-${lessonIdCounter + 1}`, failNodeId, failNodeId]
                });
                
                contentNodes.push({
                    id: failNodeId,
                    characterName: "Professor Grace",
                    isBranch: true,
                    text: `That's completely okay! Think of it like a fun puzzle. ${keyword} is simply like when you build a tower of blocks—each piece supports the other. Do you want to try answering again, or just continue the story?`,
                    options: ["Let's try again!", "I'll just continue reading!"],
                    branchTargets: [quizId, `${subjectId}-${lessonIdCounter + 1}`],
                    visualType: 'teaching-board'
                });
                
            } else {
                contentNodes.push({
                    id: nodeId,
                    characterName: "Professor Grace",
                    text: paragraphText,
                    visualType: visual,
                    nextNodeId: nextNodeId
                });
            }
            
            pIndex++;
            lessonIdCounter++;
        }
        
        // Fix the last node's nextNodeId to point to end
        if (contentNodes.length > 0) {
            contentNodes[contentNodes.length - 1].nextNodeId = `${subjectId}-end`;
        }
        
        // Outro
        contentNodes.push({
            id: `${subjectId}-end`,
            characterName: "Professor Grace",
            text: `You did an incredible job! We learned so much today. I'm very proud of you!`,
            voiceType: "narrator",
            visualType: visualTypes[Math.floor(Math.random() * visualTypes.length)],
            isQuiz: false,
            nextNodeId: "end"
        });
        
        lessonsData[subjectId] = contentNodes;
        console.log(`  -> Built ${contentNodes.length} amazing story nodes!`);
    }
    
    // Add default fallback
    lessonsData['default'] = [{
        id: "def1",
        characterName: "Professor Grace",
        text: "Welcome to our academic session. I am preparing the specific curriculum modules for your review. Let's proceed to the interactive tutoring session.",
        voiceType: "professor",
        visualType: "teaching-board",
        isQuiz: false,
        nextNodeId: "end"
    }];
    
    fs.writeFileSync(lessonsPath, JSON.stringify(lessonsData, null, 2), 'utf8');
    console.log('\nSUCCESS! lessons.json flooded with massive amounts of real academic text!');
};

run();
