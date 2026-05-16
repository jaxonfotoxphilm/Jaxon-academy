/**
 * LottieAnimationMap — Maps lesson content keywords to curated Lottie animations.
 * 
 * Each animation is a free, CDN-hosted Lottie JSON file from LottieFiles.
 * Animations are categorized by topic to match Pre-K / Kindergarten curriculum.
 * 
 * Usage: getLottieUrl(nodeText, nodeIndex) → returns a Lottie JSON URL
 */

interface AnimationEntry {
    url: string;
    keywords: string[];
    label: string;
}

/**
 * Curated library of free Lottie animations for young learner lessons.
 * Each entry maps to specific lesson content via keyword matching.
 */
const LOTTIE_LIBRARY: AnimationEntry[] = [
    // ─── People & Self ───
    {
        url: 'https://assets2.lottiefiles.com/packages/lf20_jcikwtux.json',
        keywords: ['hello', 'hi', 'welcome', 'greet', 'me', 'myself', 'about me', 'body', 'face'],
        label: 'Waving Character'
    },
    {
        url: 'https://assets10.lottiefiles.com/packages/lf20_v1yudlrx.json',
        keywords: ['dance', 'move', 'exercise', 'play', 'fun', 'jump', 'active', 'healthy'],
        label: 'Dancing Kid'
    },
    {
        url: 'https://assets4.lottiefiles.com/packages/lf20_x62chJ.json',
        keywords: ['happy', 'smile', 'feel', 'emotion', 'sense', 'touch', 'hear', 'see', 'eyes', 'ears'],
        label: 'Happy Face'
    },
    // ─── Nature & Animals ───
    {
        url: 'https://assets10.lottiefiles.com/packages/lf20_syqnfe7c.json',
        keywords: ['cat', 'pet', 'animal', 'dog', 'kitten', 'puppy', 'farm', 'barn'],
        label: 'Cute Cat'
    },
    {
        url: 'https://assets8.lottiefiles.com/packages/lf20_1pxqjqps.json',
        keywords: ['butterfly', 'insect', 'bug', 'fly', 'wing', 'garden', 'flower', 'spring'],
        label: 'Butterfly'
    },
    {
        url: 'https://assets5.lottiefiles.com/packages/lf20_4kx2q32n.json',
        keywords: ['plant', 'grow', 'seed', 'tree', 'leaf', 'nature', 'green', 'forest', 'habitat'],
        label: 'Growing Plant'
    },
    {
        url: 'https://assets7.lottiefiles.com/packages/lf20_xlky4kvh.json',
        keywords: ['sun', 'weather', 'sky', 'day', 'morning', 'warm', 'sunshine', 'bright', 'light'],
        label: 'Sunshine'
    },
    {
        url: 'https://assets2.lottiefiles.com/packages/lf20_puciaact.json',
        keywords: ['earth', 'world', 'map', 'country', 'continent', 'globe', 'planet', 'community', 'people'],
        label: 'Earth Globe'
    },
    // ─── Learning & School ───
    {
        url: 'https://assets3.lottiefiles.com/packages/lf20_tutvdkg0.json',
        keywords: ['book', 'read', 'story', 'tale', 'letter', 'word', 'write', 'language', 'library'],
        label: 'Reading Book'
    },
    {
        url: 'https://assets6.lottiefiles.com/packages/lf20_jR229r.json',
        keywords: ['think', 'learn', 'idea', 'brain', 'smart', 'question', 'wonder', 'curious', 'science'],
        label: 'Thinking'
    },
    {
        url: 'https://assets3.lottiefiles.com/packages/lf20_3rwasyjy.json',
        keywords: ['game', 'play', 'quiz', 'match', 'tap', 'pick', 'choose', 'find'],
        label: 'Game Controller'
    },
    // ─── Music & Art ───
    {
        url: 'https://assets6.lottiefiles.com/packages/lf20_ikk4jhps.json',
        keywords: ['music', 'song', 'sing', 'sound', 'listen', 'note', 'rhyme', 'rhythm'],
        label: 'Music Notes'
    },
    // ─── Math & Numbers ───
    {
        url: 'https://assets5.lottiefiles.com/packages/lf20_obhph3sh.json',
        keywords: ['count', 'number', 'math', 'add', 'how many', 'shape', 'circle', 'square', 'triangle'],
        label: 'Numbers & Stars'
    },
    // ─── Celebrations ───
    {
        url: 'https://assets9.lottiefiles.com/packages/lf20_kyu7xb1v.json',
        keywords: ['trophy', 'win', 'done', 'finish', 'complete', 'great job', 'amazing', 'proud', 'champion'],
        label: 'Trophy'
    },
    {
        url: 'https://assets4.lottiefiles.com/packages/lf20_cbrbre30.json',
        keywords: ['love', 'heart', 'family', 'friend', 'care', 'kind', 'hug', 'share'],
        label: 'Hearts'
    },
    {
        url: 'https://assets1.lottiefiles.com/packages/lf20_u4yrau.json',
        keywords: ['celebrate', 'confetti', 'party', 'hooray', 'yay', 'wow', 'woohoo'],
        label: 'Confetti'
    },
    {
        url: 'https://assets3.lottiefiles.com/packages/lf20_lk80fpsm.json',
        keywords: ['correct', 'right', 'yes', 'check', 'good', 'nice'],
        label: 'Checkmark'
    },
];

/**
 * Step-based fallback animations — used when no keyword match is found.
 * Maps to the 6-node lesson structure: Hello → Story → Learn → Game → Count → Done
 */
const STEP_FALLBACKS = [
    'https://assets2.lottiefiles.com/packages/lf20_jcikwtux.json', // Hello — waving
    'https://assets3.lottiefiles.com/packages/lf20_tutvdkg0.json', // Story — book
    'https://assets6.lottiefiles.com/packages/lf20_jR229r.json',   // Learn — thinking
    'https://assets3.lottiefiles.com/packages/lf20_3rwasyjy.json', // Game — controller
    'https://assets5.lottiefiles.com/packages/lf20_obhph3sh.json', // Count — stars/numbers
    'https://assets9.lottiefiles.com/packages/lf20_kyu7xb1v.json', // Done — trophy
];

/**
 * Get the best matching Lottie animation URL for a given lesson node.
 * Matches against node text and image prompt using keyword scoring.
 */
export function getLottieUrl(nodeText: string, imagePrompt: string, nodeIndex: number): string {
    const searchText = `${nodeText} ${imagePrompt}`.toLowerCase();

    // Score each animation by keyword match count
    let bestMatch: AnimationEntry | null = null;
    let bestScore = 0;

    for (const entry of LOTTIE_LIBRARY) {
        let score = 0;
        for (const keyword of entry.keywords) {
            if (searchText.includes(keyword)) {
                score += keyword.length; // Longer matches are more specific
            }
        }
        if (score > bestScore) {
            bestScore = score;
            bestMatch = entry;
        }
    }

    // Return best match or fall back to step-based animation
    if (bestMatch && bestScore > 3) {
        return bestMatch.url;
    }
    return STEP_FALLBACKS[nodeIndex % STEP_FALLBACKS.length];
}

/** Get the celebration animation URL (confetti) */
export const CELEBRATION_LOTTIE = 'https://assets1.lottiefiles.com/packages/lf20_u4yrau.json';

/** Get the correct answer animation URL (checkmark) */
export const CORRECT_LOTTIE = 'https://assets3.lottiefiles.com/packages/lf20_lk80fpsm.json';
