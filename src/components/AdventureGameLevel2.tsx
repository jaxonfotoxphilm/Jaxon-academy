import React, { useEffect, useRef, useState } from 'react';
import { ProfessorGraceTrivia } from './ProfessorGraceTrivia';
import { supabase } from '../supabaseClient';
import curriculum from '../data/curriculum.json';

const TRIVIA_QUESTIONS = curriculum.history;

export const AdventureGameLevel2: React.FC<{ playerName: string }> = ({ playerName }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isPaused, setIsPaused] = useState(false);
    const [showTrivia, setShowTrivia] = useState(false);
    const [excellenceScore, setExcellenceScore] = useState(80); // Base score carried over
    const [gameOver, setGameOver] = useState(false);
    const [currentTrivia, setCurrentTrivia] = useState(TRIVIA_QUESTIONS[0]);

    // Game state refs (to avoid stale closures in the animation frame)
    const gameState = useRef({
        player: { x: 50, y: 200, width: 30, height: 30, dy: 0, jumpPower: -10, grounded: false },
        door: { x: 600, y: 180, width: 40, height: 50, locked: true },
        obstacle: { x: 300, y: 210, width: 20, height: 20 },
        goal: { x: 750, y: 180, width: 40, height: 50 },
        gravity: 0.5,
        keys: { right: false, left: false, up: false }
    });

    // Keyboard Controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'ArrowRight' || e.code === 'KeyD') gameState.current.keys.right = true;
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') gameState.current.keys.left = true;
            if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
                if (gameState.current.player.grounded) {
                    gameState.current.player.dy = gameState.current.player.jumpPower;
                    gameState.current.player.grounded = false;
                }
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'ArrowRight' || e.code === 'KeyD') gameState.current.keys.right = false;
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') gameState.current.keys.left = false;
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
    }, []);

    // Auto-Save to Supabase
    useEffect(() => {
        if (gameOver) {
            const saveRecord = async () => {
                await supabase.from('student_progress').insert([
                    { student_name: playerName, subject: 'Biblical Adventures', score: excellenceScore, level_reached: 2 }
                ]);
            };
            saveRecord();
        }
    }, [gameOver, playerName, excellenceScore]);

    useEffect(() => {
        if (gameOver) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;

        const update = () => {
            if (isPaused) return; // Pause physics

            const state = gameState.current;

            // Apply Gravity
            state.player.dy += state.gravity;
            state.player.y += state.player.dy;

            // Ground collision
            if (state.player.y + state.player.height > canvas.height - 50) {
                state.player.y = canvas.height - 50 - state.player.height;
                state.player.dy = 0;
                state.player.grounded = true;
            }

            // Lateral movement
            if (state.keys.right) state.player.x += 4;
            if (state.keys.left) state.player.x -= 4;

            // Check Goal Collision (Win State)
            if (
                !state.door.locked &&
                state.player.x < state.goal.x + state.goal.width &&
                state.player.x + state.player.width > state.goal.x
            ) {
                setGameOver(true);
            }

            // Door collision checking (Trigger Trivia)
            if (
                state.door.locked &&
                state.player.x < state.door.x + state.door.width &&
                state.player.x + state.player.width > state.door.x &&
                state.player.y < state.door.y + state.door.height &&
                state.player.y + state.player.height > state.door.y
            ) {
                setIsPaused(true);
                setCurrentTrivia(TRIVIA_QUESTIONS[Math.floor(Math.random() * TRIVIA_QUESTIONS.length)]);
                setShowTrivia(true);
            }
        };

        const draw = () => {
            const state = gameState.current;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw Ground
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(0, canvas.height - 50, canvas.width, 50);

            // Draw Player
            ctx.fillStyle = '#3B82F6';
            ctx.fillRect(state.player.x, state.player.y, state.player.width, state.player.height);

            // Draw Obstacle (Dodging mechanic)
            ctx.fillStyle = '#EF4444';
            ctx.fillRect(state.obstacle.x, state.obstacle.y, state.obstacle.width, state.obstacle.height);

            // Draw Locked Door
            ctx.fillStyle = state.door.locked ? '#F59E0B' : '#10B981'; // Red if locked, Green if open
            ctx.fillRect(state.door.x, state.door.y, state.door.width, state.door.height);

            // Draw Goal Point (Ark Room)
            if (!state.door.locked) {
                ctx.fillStyle = '#9333EA';
                ctx.fillRect(state.goal.x, state.goal.y, state.goal.width, state.goal.height);
            }
        };

        const loop = () => {
            update();
            draw();
            animationId = requestAnimationFrame(loop);
        };

        loop();

        return () => cancelAnimationFrame(animationId);
    }, [isPaused, gameOver]);

    const handleTriviaAnswer = (isCorrect: boolean) => {
        setShowTrivia(false);
        setIsPaused(false);

        if (isCorrect) {
            setExcellenceScore(prev => prev + 20);
            gameState.current.door.locked = false; // Unlock door!
        } else {
            // Push player back
            gameState.current.player.x -= 100;
        }
    };

    return (
        <div className="relative w-full max-w-4xl mx-auto">
            <div className="absolute top-4 right-4 bg-white px-4 py-2 rounded shadow font-bold text-gray-700">
                Score: {excellenceScore} | Player: {playerName}
            </div>

            {gameOver && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10">
                    <h2 className="text-5xl font-bold text-green-400 mb-4">Level 2 Complete!</h2>
                    <p className="text-xl text-white mb-6">Excellence Score: {excellenceScore}% saved to the Principal's Desk.</p>
                    <button onClick={() => window.location.reload()} className="bg-blue-600 px-6 py-3 rounded-lg text-white font-bold hover:bg-blue-500 transition-all">Play Again</button>
                </div>
            )}

            <canvas ref={canvasRef} width={800} height={300} className="bg-sky-200 border-4 border-gray-800 rounded-lg w-full" />

            {showTrivia && (
                <ProfessorGraceTrivia
                    question={currentTrivia.question}
                    options={currentTrivia.options}
                    correctIndex={currentTrivia.correctIndex}
                    onAnswer={handleTriviaAnswer}
                />
            )}
        </div>
    );
};