/**
 * MiniGame Component — Renders interactive educational mini-games inline within lessons.
 * 
 * Supported game types:
 * - "wordScramble"  → Unscramble letters to form the correct word
 * - "fillBlank"     → Type the missing word into a sentence
 * - "matchPairs"    → Drag/click to match terms with definitions
 * - "trueFalse"     → Quick true/false rapid-fire round
 * 
 * Each game automatically awards points on completion and calls onComplete().
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MiniGameProps {
    /** Game type identifier */
    gameType: string;
    /** The topic being studied (used to generate game content) */
    topic: string;
    /** The subject area */
    subject: string;
    /** Student's name for personalization */
    studentName: string;
    /** Called when the student completes the game */
    onComplete: () => void;
    /** Called with score delta (+5 correct, -5 wrong) */
    onScoreChange: (delta: number) => void;
}

/** Scrambles an array using Fisher-Yates */
function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/**
 * Subject-specific mini-game content banks.
 * Maps topic keywords to relevant educational content for each game type.
 */
const CONTENT_BANK: Record<string, { words: string[], pairs: [string,string][], sentences: [string,string][], trueFalse: [string,boolean][] }> = {
    // Language Arts / Grammar
    'Clauses': {
        words: ['CLAUSE', 'PHRASE', 'VERB', 'NOUN', 'IDEA'],
        pairs: [['Independent Clause','Can stand alone as a sentence'],['Dependent Clause','Cannot stand alone'],['Subordinating Conjunction','Introduces a dependent clause'],['Relative Clause','Starts with who, which, that']],
        sentences: [['A ___ clause can stand alone as a complete sentence.','independent'],['A dependent clause begins with a ___ conjunction.','subordinating'],['Every clause must contain a subject and a ___.','predicate']],
        trueFalse: [['A dependent clause can stand alone as a sentence.',false],['An independent clause expresses a complete thought.',true],['The word "because" is a subordinating conjunction.',true],['A clause never contains a verb.',false]]
    },
    'Nouns': {
        words: ['NOUN', 'PLACE', 'THING', 'IDEA', 'WORD'],
        pairs: [['Proper Noun','Names a specific person/place'],['Common Noun','Names a general category'],['Abstract Noun','Names an idea or feeling'],['Collective Noun','Names a group']],
        sentences: [['A ___ noun names a specific person, place, or thing.','proper'],['The plural of "child" is ___.','children'],['A noun that names an idea, like "freedom," is an ___ noun.','abstract']],
        trueFalse: [['A proper noun should always be capitalized.',true],['The word "happiness" is a concrete noun.',false],['Pronouns replace nouns in a sentence.',true],['All nouns are things you can touch.',false]]
    },
    // Math
    'Equations': {
        words: ['SOLVE', 'EQUAL', 'VALUE', 'PLUS', 'SIDE'],
        pairs: [['Variable','Unknown value (x, y)'],['Coefficient','Number multiplied by variable'],['Constant','Fixed number with no variable'],['Equation','Statement that two expressions are equal']],
        sentences: [['In 3x + 5, the number 3 is the ___.','coefficient'],['A letter that represents an unknown value is called a ___.','variable'],['To find the value of x, you must ___ the equation.','solve']],
        trueFalse: [['An equation always has an equals sign.',true],['5x means 5 plus x.',false],['A variable can represent different values.',true],['Constants change depending on x.',false]]
    },
    'Polynomials': {
        words: ['TERM', 'DEGREE', 'FACTOR', 'POWER', 'SUM'],
        pairs: [['Monomial','Polynomial with one term'],['Binomial','Polynomial with two terms'],['Trinomial','Polynomial with three terms'],['Degree','Highest exponent in polynomial']],
        sentences: [['A polynomial with exactly two terms is called a ___.','binomial'],['The ___ of a polynomial is the highest power of the variable.','degree'],['3x² + 2x + 1 is a ___ because it has three terms.','trinomial']],
        trueFalse: [['A monomial has exactly one term.',true],['The degree of 5x³ is 5.',false],['x² + 3x - 7 is a trinomial.',true],['Polynomials cannot have negative exponents in standard form.',true]]
    },
    // Science
    'Ecosystems': {
        words: ['BIOME', 'NICHE', 'PLANT', 'FOOD', 'WEB'],
        pairs: [['Producer','Makes its own food (plants)'],['Consumer','Eats other organisms'],['Decomposer','Breaks down dead matter'],['Food Web','Interconnected food chains']],
        sentences: [['Plants are called ___ because they make their own food through photosynthesis.','producers'],['An animal\'s specific role in an ecosystem is called its ___.','niche'],['A ___ is a large region with specific climate and organisms.','biome']],
        trueFalse: [['All energy in an ecosystem originally comes from the sun.',true],['Decomposers are a type of producer.',false],['A habitat is where an organism lives.',true],['Consumers make their own food.',false]]
    },
    'Cells': {
        words: ['CELL', 'WALL', 'CORE', 'GEL', 'SPLIT'],
        pairs: [['Nucleus','Control center of the cell'],['Cell Membrane','Controls what enters/exits'],['Mitochondria','Powerhouse of the cell'],['Ribosome','Makes proteins']],
        sentences: [['The ___ is often called the control center of the cell.','nucleus'],['Cell division in which one cell becomes two identical cells is called ___.','mitosis'],['The jelly-like substance inside a cell is called ___.','cytoplasm']],
        trueFalse: [['Plant cells have cell walls but animal cells do not.',true],['The mitochondria is called the powerhouse of the cell.',true],['All cells have a nucleus.',false],['Ribosomes are responsible for making proteins.',true]]
    },
    // History
    'Ancient Civilizations': {
        words: ['KING', 'EMPIRE', 'LAW', 'TRADE', 'RIVER'],
        pairs: [['Mesopotamia','Land between Tigris & Euphrates'],['Egypt','Civilization along the Nile'],['Greece','Birthplace of democracy'],['Rome','Founded as a republic']],
        sentences: [['The rulers of ancient Egypt were called ___.','pharaohs'],['___ is often called the cradle of civilization.','Mesopotamia'],['Ancient Greece is known as the birthplace of ___.','democracy']],
        trueFalse: [['The pyramids were built in ancient Rome.',false],['Mesopotamia means "land between two rivers."',true],['Democracy originated in ancient Greece.',true],['The Roman Empire lasted only 50 years.',false]]
    },
    // Literature
    'Mythology': {
        words: ['ODYSSEY', 'OLYMPUS', 'HERO', 'LEGEND', 'ALLEGORY'],
        pairs: [['Zeus','King of the Greek gods'],['Odysseus','Hero of the Odyssey'],['Athena','Goddess of wisdom'],['Mythology','Collection of traditional stories']],
        sentences: [['Mount ___ was the home of the Greek gods.','Olympus'],['Homer wrote the epic poem called the ___.','Odyssey'],['A story that explains natural phenomena through gods is called a ___.','myth']],
        trueFalse: [['Zeus was the king of the Greek gods.',true],['The Odyssey was written by Shakespeare.',false],['Myths often explain natural events.',true],['Athena was the goddess of war, not wisdom.',false]]
    }
};

const MORE_CONTENT: Record<string, { words: string[], pairs: [string,string][], sentences: [string,string][], trueFalse: [string,boolean][] }> = {
    'Genetics': {
        words: ['ALLELE', 'GENOTYPE', 'PHENOTYPE', 'DOMINANT', 'RECESSIVE'],
        pairs: [['Genotype','Genetic makeup (e.g., Aa)'],['Phenotype','Physical appearance'],['Dominant','Trait expressed when present'],['Recessive','Trait hidden by dominant']],
        sentences: [['An organism\'s physical appearance is its ___.','phenotype'],['A ___ allele is only expressed when two copies are present.','recessive'],['A Punnett ___ predicts offspring genotypes.','square']],
        trueFalse: [['A dominant allele always masks a recessive allele.',true],['Two brown-eyed parents can never have a blue-eyed child.',false],['DNA contains the instructions for building proteins.',true],['Genotype and phenotype always match.',false]]
    },
    'Addition': {
        words: ['ADDEND', 'TOTAL', 'CARRY', 'REGROUP', 'COLUMN'],
        pairs: [['Addend','Number being added'],['Sum','Result of addition'],['Regrouping','Carrying to the next place'],['Commutative','Order doesn\'t matter']],
        sentences: [['When adding 8 + 7, you get 15 so you write 5 and ___ the 1.','carry'],['The numbers you add together are called ___.','addends'],['Addition is ___ because 3+5 equals 5+3.','commutative']],
        trueFalse: [['The order of addends does not change the sum.',true],['You can only add two numbers at a time.',false],['Regrouping means carrying to the next column.',true],['147 + 0 = 0.',false]]
    },
    'Subtraction': {
        words: ['DIFFERENCE', 'BORROW', 'REGROUP', 'MINUEND', 'SUBTRAHEND'],
        pairs: [['Minuend','Number being subtracted FROM'],['Subtrahend','Number being subtracted'],['Difference','Answer to subtraction'],['Borrowing','Regrouping from a higher place']],
        sentences: [['The answer to a subtraction problem is called the ___.','difference'],['When the top digit is smaller, you must ___ from the next column.','borrow'],['In 15 - 7 = 8, the number 15 is the ___.','minuend']],
        trueFalse: [['Subtraction is the inverse of addition.',true],['The order in subtraction does not matter.',false],['You sometimes need to borrow when subtracting.',true],['100 - 100 = 1.',false]]
    },
    'Counting': {
        words: ['NUMBER', 'DIGIT', 'SEQUENCE', 'PATTERN', 'SKIP'],
        pairs: [['Counting On','Starting from a number and adding'],['Skip Counting','Counting by 2s, 5s, 10s'],['Number Line','Visual tool for counting'],['Sequence','Numbers in order']],
        sentences: [['Counting by 5s is called ___ counting.','skip'],['The numbers 2, 4, 6, 8 show a ___.','pattern'],['A ___ line helps you visualize number order.','number']],
        trueFalse: [['The number after 99 is 100.',true],['Skip counting by 2 always gives odd numbers.',false],['Zero is a number.',true],['Counting backward means subtracting 1 each time.',true]]
    },
    'Mythology': {
        words: ['OLYMPUS', 'ODYSSEY', 'ALLEGORY', 'TITAN', 'MORTAL'],
        pairs: [['Zeus','King of the gods, lightning'],['Athena','Goddess of wisdom and war'],['Poseidon','God of the sea'],['Hades','God of the underworld']],
        sentences: [['The Greek gods lived on Mount ___.','Olympus'],['A story with a hidden moral lesson is an ___.','allegory'],['The ___ were ancient beings who ruled before the Olympians.','Titans']],
        trueFalse: [['Myths were only created for entertainment.',false],['The Minotaur lived in a labyrinth on Crete.',true],['Prometheus gave fire to humans.',true],['All Greek myths have happy endings.',false]]
    },
};

// Merge all content banks
const ALL_CONTENT = { ...CONTENT_BANK, ...MORE_CONTENT };

/** Fallback content for topics not in the bank — still subject-aware */
function getDefaultContent(topic: string) {
    const t = topic.toUpperCase().slice(0, 8);
    return {
        words: [t, 'ANALYZE', 'EVIDENCE', 'COMPARE', 'CONCLUDE'],
        pairs: [['Key Concept','Central idea that connects to broader knowledge'],['Evidence','Facts or data that support a conclusion'],['Analysis','Breaking down information to understand it'],['Synthesis','Combining ideas to form new understanding']],
        sentences: [[`A strong understanding of ${topic} requires critical ___.`,'thinking'], [`The most important skill in studying ${topic} is finding ___.`,'evidence'], [`Scholars support their arguments with ___ and reasoning.`,'facts']],
        trueFalse: [[`Understanding ${topic} requires analyzing relationships, not just memorizing facts.`,true],[`The best way to learn ${topic} is to read notes once and never review.`,false],[`Asking "why" and "how" deepens understanding more than just "what."`,true],[`${topic} has no connection to any other subject area.`,false]] as [string,boolean][]
    };
}

export const MiniGame: React.FC<MiniGameProps> = ({ gameType, topic, studentName, onComplete, onScoreChange }) => {
    const content = ALL_CONTENT[topic] || getDefaultContent(topic);

    switch (gameType) {
        case 'wordScramble': return <WordScrambleGame content={content} studentName={studentName} onComplete={onComplete} onScoreChange={onScoreChange} />;
        case 'matchPairs':   return <MatchPairsGame content={content} studentName={studentName} onComplete={onComplete} onScoreChange={onScoreChange} />;
        case 'fillBlank':    return <FillBlankGame content={content} studentName={studentName} onComplete={onComplete} onScoreChange={onScoreChange} />;
        case 'trueFalse':    return <TrueFalseGame content={content} studentName={studentName} onComplete={onComplete} onScoreChange={onScoreChange} />;
        default:             return <WordScrambleGame content={content} studentName={studentName} onComplete={onComplete} onScoreChange={onScoreChange} />;
    }
};

/* ─── Word Scramble Game (Tile-based — no typing required) ─── */
function WordScrambleGame({ content, studentName, onComplete, onScoreChange }: { content: any, studentName: string, onComplete: () => void, onScoreChange: (d:number)=>void }) {
    // Only use short words (≤6 letters) to keep it manageable
    const shortWords = (content.words as string[]).filter(w => w.length <= 6);
    const word = shortWords.length > 0
        ? shortWords[Math.floor(Math.random() * shortWords.length)]
        : content.words[0].slice(0, 6); // fallback: first 6 letters of any word

    // Each tile has an id so duplicates are tracked correctly
    const [tiles] = useState<{id: number, letter: string}[]>(() =>
        shuffle(word.split('').map((letter: string, i: number) => ({ id: i, letter })))
    );

    // Which tile IDs the student has placed (in order)
    const [placed, setPlaced] = useState<number[]>([]);
    const [solved, setSolved] = useState(false);
    const [wrong, setWrong] = useState(false);

    const handleTilePick = (id: number) => {
        if (solved || placed.includes(id)) return;
        const next = [...placed, id];
        setPlaced(next);

        // Auto-check when all letters placed
        if (next.length === word.length) {
            const attempt = next.map(tid => tiles.find(t => t.id === tid)!.letter).join('');
            if (attempt === word) {
                setSolved(true);
                onScoreChange(5);
                setTimeout(onComplete, 1800);
            } else {
                setWrong(true);
                setTimeout(() => { setPlaced([]); setWrong(false); }, 800);
            }
        }
    };

    const handleRemove = (placedIdx: number) => {
        if (solved) return;
        setPlaced(prev => prev.filter((_, i) => i !== placedIdx));
    };

    return (
        <div className="bg-gradient-to-br from-indigo-950/80 to-purple-950/80 backdrop-blur-xl border border-indigo-400/30 rounded-2xl p-6 mt-4 animate-in slide-in-from-bottom-4 duration-500">
            <h4 className="text-lg font-bold text-indigo-300 mb-1 tracking-widest uppercase">🔤 Word Scramble</h4>
            <p className="text-slate-400 text-sm mb-4">Tap the letters in the right order to spell the word, {studentName}!</p>

            {/* Answer slots — tap to remove */}
            <div className="flex gap-2 justify-center mb-5 min-h-[56px]">
                {Array.from({ length: word.length }).map((_, i) => {
                    const tileId = placed[i];
                    const letter = tileId !== undefined ? tiles.find(t => t.id === tileId)!.letter : null;
                    return (
                        <motion.div
                            key={i}
                            onClick={() => letter && handleRemove(i)}
                            animate={wrong ? { x: [0, -6, 6, -4, 4, 0] } : {}}
                            transition={{ duration: 0.4 }}
                            className={`w-12 h-14 rounded-lg flex items-center justify-center text-2xl font-black cursor-pointer border-2 transition-all
                                ${solved ? 'bg-emerald-700/60 border-emerald-400 text-white shadow-[0_0_15px_rgba(52,211,153,0.5)]' :
                                  wrong ? 'bg-red-800/60 border-red-400 text-white' :
                                  letter ? 'bg-white/20 border-indigo-400 text-white hover:border-red-400/80' :
                                  'bg-white/5 border-white/20 text-transparent'}`}
                        >
                            {letter ?? '·'}
                        </motion.div>
                    );
                })}
            </div>

            {/* Scrambled tiles — tap to place */}
            <div className="flex gap-2 justify-center flex-wrap mb-2">
                {tiles.map(tile => {
                    const isPlaced = placed.includes(tile.id);
                    return (
                        <motion.button
                            key={tile.id}
                            onClick={() => handleTilePick(tile.id)}
                            whileTap={{ scale: 0.9 }}
                            disabled={isPlaced || solved}
                            className={`w-12 h-14 rounded-lg text-2xl font-black border-2 transition-all
                                ${isPlaced ? 'opacity-20 bg-white/5 border-white/10 text-white cursor-default' :
                                  'bg-indigo-600/60 border-indigo-400/70 text-white hover:bg-indigo-500/80 hover:scale-110 shadow-[0_0_10px_rgba(99,102,241,0.4)]'}`}
                        >
                            {tile.letter}
                        </motion.button>
                    );
                })}
            </div>

            {solved && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-emerald-400 font-bold text-center text-lg mt-3">
                    🎉 Correct! The word is <span className="text-white">{word}</span>!
                </motion.p>
            )}
        </div>
    );
}


/* ─── Match Pairs Game ─── */
function MatchPairsGame({ content, studentName, onComplete, onScoreChange }: { content: any, studentName: string, onComplete: () => void, onScoreChange: (d:number)=>void }) {
    const pairs: [string,string][] = content.pairs.slice(0, 4);
    const [shuffledDefs] = useState(() => shuffle(pairs.map(p => p[1])));
    const [selectedTerm, setSelectedTerm] = useState<number | null>(null);
    const [matched, setMatched] = useState<Set<number>>(new Set());
    const [wrongFlash, setWrongFlash] = useState<number | null>(null);

    const handleDefClick = (defIdx: number) => {
        if (selectedTerm === null) return;
        const correctDef = pairs[selectedTerm][1];
        if (shuffledDefs[defIdx] === correctDef) {
            setMatched(prev => new Set([...prev, selectedTerm]));
            onScoreChange(3);
            setSelectedTerm(null);
            if (matched.size + 1 === pairs.length) {
                setTimeout(onComplete, 1500);
            }
        } else {
            setWrongFlash(defIdx);
            onScoreChange(-2);
            setTimeout(() => setWrongFlash(null), 600);
        }
    };

    return (
        <div className="bg-gradient-to-br from-emerald-950/80 to-teal-950/80 backdrop-blur-xl border border-emerald-400/30 rounded-2xl p-6 mt-4 animate-in slide-in-from-bottom-4 duration-500">
            <h4 className="text-lg font-bold text-emerald-300 mb-1 tracking-widest uppercase">🔗 Match the Pairs</h4>
            <p className="text-slate-400 text-sm mb-4">Click a term, then click its matching definition, {studentName}!</p>

            {matched.size === pairs.length ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center py-4">
                    <div className="text-5xl mb-2">✨</div>
                    <p className="text-emerald-400 font-bold text-xl">All pairs matched! Great job!</p>
                </motion.div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-3">
                        <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Terms</p>
                        {pairs.map((pair, idx) => (
                            <button
                                key={idx}
                                onClick={() => !matched.has(idx) && setSelectedTerm(idx)}
                                disabled={matched.has(idx)}
                                className={`p-3 rounded-xl text-left text-sm font-semibold transition-all border ${
                                    matched.has(idx) ? 'bg-emerald-800/40 border-emerald-500/50 text-emerald-300 opacity-60' :
                                    selectedTerm === idx ? 'bg-white/20 border-white/60 text-white scale-105 shadow-lg' :
                                    'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                                }`}
                            >
                                {matched.has(idx) ? '✓ ' : ''}{pair[0]}
                            </button>
                        ))}
                    </div>
                    <div className="flex flex-col gap-3">
                        <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Definitions</p>
                        {shuffledDefs.map((def: string, idx: number) => (
                            <button
                                key={idx}
                                onClick={() => handleDefClick(idx)}
                                disabled={[...matched].some(m => pairs[m][1] === def)}
                                className={`p-3 rounded-xl text-left text-sm transition-all border ${
                                    [...matched].some(m => pairs[m][1] === def) ? 'bg-emerald-800/40 border-emerald-500/50 text-emerald-300 opacity-60' :
                                    wrongFlash === idx ? 'bg-red-800/60 border-red-400/60 text-red-200 animate-shake' :
                                    'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                                }`}
                            >
                                {def}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ─── Fill in the Blank Game ─── */
function FillBlankGame({ content, studentName, onComplete, onScoreChange }: { content: any, studentName: string, onComplete: () => void, onScoreChange: (d:number)=>void }) {
    const sentences: [string,string][] = content.sentences.slice(0, 3);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answer, setAnswer] = useState('');
    const [feedback, setFeedback] = useState<'correct'|'wrong'|null>(null);
    const [completed, setCompleted] = useState(0);

    const handleCheck = () => {
        const correct = sentences[currentIdx][1].toLowerCase().trim();
        if (answer.toLowerCase().trim() === correct) {
            setFeedback('correct');
            onScoreChange(5);
            setCompleted(c => c + 1);
            setTimeout(() => {
                setFeedback(null);
                setAnswer('');
                if (currentIdx < sentences.length - 1) {
                    setCurrentIdx(i => i + 1);
                } else {
                    onComplete();
                }
            }, 1500);
        } else {
            setFeedback('wrong');
            onScoreChange(-3);
            setTimeout(() => setFeedback(null), 1500);
        }
    };

    if (completed === sentences.length) {
        return (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-gradient-to-br from-amber-950/80 to-orange-950/80 backdrop-blur-xl border border-amber-400/30 rounded-2xl p-6 mt-4 text-center">
                <div className="text-5xl mb-2">📝</div>
                <p className="text-amber-400 font-bold text-xl">All blanks filled! Excellent work!</p>
            </motion.div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-amber-950/80 to-orange-950/80 backdrop-blur-xl border border-amber-400/30 rounded-2xl p-6 mt-4 animate-in slide-in-from-bottom-4 duration-500">
            <h4 className="text-lg font-bold text-amber-300 mb-1 tracking-widest uppercase">📝 Fill in the Blank</h4>
            <p className="text-slate-400 text-sm mb-4">Complete the sentence, {studentName}! ({currentIdx + 1}/{sentences.length})</p>

            <AnimatePresence mode="wait">
                <motion.div key={currentIdx} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                    <p className="text-xl text-white mb-4 leading-relaxed">
                        {sentences[currentIdx][0].split('___').map((part, i, arr) => (
                            <span key={i}>
                                {part}
                                {i < arr.length - 1 && <span className="inline-block w-32 border-b-2 border-amber-400/60 mx-1" />}
                            </span>
                        ))}
                    </p>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={answer}
                            onChange={e => setAnswer(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleCheck(); }}
                            placeholder="Type the missing word..."
                            className="flex-1 bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white text-lg focus:outline-none focus:border-amber-400"
                            autoFocus
                        />
                        <button onClick={handleCheck} className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl font-bold text-white hover:scale-105 transition-transform">
                            Check
                        </button>
                    </div>
                    {feedback === 'correct' && <p className="text-emerald-400 font-bold mt-3 animate-pulse">✅ Correct!</p>}
                    {feedback === 'wrong' && <p className="text-amber-400 font-bold mt-3 animate-pulse">Not quite — hint: the answer starts with "{sentences[currentIdx][1][0].toUpperCase()}"</p>}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

/* ─── True/False Game ─── */
function TrueFalseGame({ content, studentName, onComplete, onScoreChange }: { content: any, studentName: string, onComplete: () => void, onScoreChange: (d:number)=>void }) {
    const questions: [string,boolean][] = content.trueFalse.slice(0, 4);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [feedback, setFeedback] = useState<'correct'|'wrong'|null>(null);
    const [streak, setStreak] = useState(0);

    const handleAnswer = (answer: boolean) => {
        if (answer === questions[currentIdx][1]) {
            setFeedback('correct');
            setStreak(s => s + 1);
            onScoreChange(4);
            setTimeout(() => {
                setFeedback(null);
                if (currentIdx < questions.length - 1) {
                    setCurrentIdx(i => i + 1);
                } else {
                    onComplete();
                }
            }, 1200);
        } else {
            setFeedback('wrong');
            setStreak(0);
            onScoreChange(-3);
            setTimeout(() => setFeedback(null), 1200);
        }
    };

    if (currentIdx >= questions.length) {
        return (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-gradient-to-br from-rose-950/80 to-pink-950/80 backdrop-blur-xl border border-rose-400/30 rounded-2xl p-6 mt-4 text-center">
                <div className="text-5xl mb-2">⚡</div>
                <p className="text-rose-400 font-bold text-xl">Lightning round complete!</p>
            </motion.div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-rose-950/80 to-pink-950/80 backdrop-blur-xl border border-rose-400/30 rounded-2xl p-6 mt-4 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-1">
                <h4 className="text-lg font-bold text-rose-300 tracking-widest uppercase">⚡ True or False</h4>
                {streak > 1 && <span className="text-amber-400 font-bold text-sm animate-bounce">🔥 {streak} streak!</span>}
            </div>
            <p className="text-slate-400 text-sm mb-4">Quick-fire round, {studentName}! ({currentIdx + 1}/{questions.length})</p>

            <AnimatePresence mode="wait">
                <motion.div key={currentIdx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                    <p className="text-xl text-white mb-6 leading-relaxed font-medium">"{questions[currentIdx][0]}"</p>
                    <div className="flex gap-4">
                        <button
                            onClick={() => handleAnswer(true)}
                            disabled={feedback !== null}
                            className="flex-1 py-4 bg-emerald-800/40 hover:bg-emerald-700/60 border border-emerald-400/40 rounded-xl text-emerald-200 font-bold text-xl transition-all hover:scale-105 disabled:opacity-50"
                        >
                            ✅ True
                        </button>
                        <button
                            onClick={() => handleAnswer(false)}
                            disabled={feedback !== null}
                            className="flex-1 py-4 bg-red-800/40 hover:bg-red-700/60 border border-red-400/40 rounded-xl text-red-200 font-bold text-xl transition-all hover:scale-105 disabled:opacity-50"
                        >
                            ❌ False
                        </button>
                    </div>
                    {feedback === 'correct' && <p className="text-emerald-400 font-bold mt-4 text-center text-lg animate-pulse">Correct! 🎯</p>}
                    {feedback === 'wrong' && <p className="text-rose-400 font-bold mt-4 text-center text-lg animate-pulse">The answer was {questions[currentIdx][1] ? 'True' : 'False'}. Keep going!</p>}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
