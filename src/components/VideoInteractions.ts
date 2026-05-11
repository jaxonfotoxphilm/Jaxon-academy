// src/components/VideoInteractions.ts
// Maps subject visual types to interactive overlay points (quizzes & info).

interface QuizData {
    question: string;
    options: string[];
    correctIndex: number;
    feedback?: string;
}

interface InteractionPoint {
    time: number;
    type: 'quiz' | 'info';
    content: string | QuizData;
}

/**
 * VIDEO_INTERACTIONS – Timestamped interaction overlays keyed by visualType.
 * Each entry is an array of InteractionPoints that pause the video at a
 * specific second and display either an informational overlay or a quiz.
 */
export const VIDEO_INTERACTIONS: Record<string, InteractionPoint[]> = {
    'video-science': [
        { time: 10, type: 'info', content: '🔬 Did you know? All matter is made up of tiny particles called atoms!' },
        {
            time: 30, type: 'quiz', content: {
                question: 'What are the three main parts of an atom?',
                options: ['Protons, Neutrons, Electrons', 'Cells, Molecules, Atoms', 'Solids, Liquids, Gases'],
                correctIndex: 0,
                feedback: 'Correct! Protons and neutrons form the nucleus, while electrons orbit around it.'
            }
        },
        { time: 55, type: 'info', content: '⚡ Electrons carry a negative charge and orbit the nucleus at incredible speeds.' },
    ],
    'video-math': [
        { time: 8, type: 'info', content: '🔢 Mathematics is the language of patterns. Let\'s explore!' },
        {
            time: 25, type: 'quiz', content: {
                question: 'What is the value of 7 × 8?',
                options: ['54', '56', '64', '48'],
                correctIndex: 1,
                feedback: 'Great work! 7 × 8 = 56.'
            }
        },
        { time: 50, type: 'info', content: '📐 Geometry helps us understand shapes, angles, and spatial relationships.' },
    ],
    'video-history': [
        { time: 12, type: 'info', content: '📜 History teaches us about the events and people that shaped our world.' },
        {
            time: 35, type: 'quiz', content: {
                question: 'Which ancient civilization built the pyramids?',
                options: ['The Romans', 'The Egyptians', 'The Greeks', 'The Persians'],
                correctIndex: 1,
                feedback: 'Correct! The ancient Egyptians built the pyramids as tombs for their pharaohs.'
            }
        },
    ],
    'video-reading': [
        { time: 10, type: 'info', content: '📖 Reading comprehension means understanding what you read, not just decoding words.' },
        {
            time: 30, type: 'quiz', content: {
                question: 'What is the "main idea" of a paragraph?',
                options: ['The first sentence', 'The most important point the author is making', 'The longest sentence', 'A random detail'],
                correctIndex: 1,
                feedback: 'Exactly! The main idea is the central point the author wants you to understand.'
            }
        },
    ],
    'video-nature': [
        { time: 15, type: 'info', content: '🌿 Ecosystems are communities of living organisms interacting with their environment.' },
        {
            time: 40, type: 'quiz', content: {
                question: 'What do plants need to perform photosynthesis?',
                options: ['Sunlight, water, and carbon dioxide', 'Soil, oxygen, and heat', 'Wind, rain, and darkness'],
                correctIndex: 0,
                feedback: 'Correct! Plants use sunlight, water, and CO₂ to produce glucose and oxygen.'
            }
        },
    ],
};
