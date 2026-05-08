import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';

export const GrammarGuardian: React.FC<{ playerName: string }> = ({ playerName }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [victory, setVictory] = useState(false);

    // Advanced Game State
    const gameState = useRef({
        player: { x: 400, y: 300, width: 30, height: 30, speed: 6 },
        grammarParticles: [
            { x: 200, y: 150, active: true, radius: 10, pulse: 0 },
            { x: 600, y: 400, active: true, radius: 10, pulse: 0 },
            { x: 150, y: 450, active: true, radius: 10, pulse: 0 },
            { x: 650, y: 150, active: true, radius: 10, pulse: 0 }
        ],
        glitches: [
            { x: 100, y: 100, speedX: 3, speedY: 2, size: 20 },
            { x: 700, y: 500, speedX: -2, speedY: -4, size: 25 },
            { x: 400, y: 100, speedX: 4, speedY: -3, size: 15 }
        ],
        visualParticles: [] as {x: number, y: number, vx: number, vy: number, life: number, color: string}[],
        keys: { w: false, a: false, s: false, d: false },
        frame: 0
    });

    // Keyboard Controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'KeyW' || e.code === 'ArrowUp') gameState.current.keys.w = true;
            if (e.code === 'KeyA' || e.code === 'ArrowLeft') gameState.current.keys.a = true;
            if (e.code === 'KeyS' || e.code === 'ArrowDown') gameState.current.keys.s = true;
            if (e.code === 'KeyD' || e.code === 'ArrowRight') gameState.current.keys.d = true;
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'KeyW' || e.code === 'ArrowUp') gameState.current.keys.w = false;
            if (e.code === 'KeyA' || e.code === 'ArrowLeft') gameState.current.keys.a = false;
            if (e.code === 'KeyS' || e.code === 'ArrowDown') gameState.current.keys.s = false;
            if (e.code === 'KeyD' || e.code === 'ArrowRight') gameState.current.keys.d = false;
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
                    { student_name: playerName, subject: 'Grammar Guardian', score, level_reached: 1 }
                ]);
            };
            saveRecord();
        }
    }, [gameOver, playerName, score]);

    useEffect(() => {
        if (gameOver) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: false }); // Optimize
        if (!ctx) return;

        let animationId: number;

        const createExplosion = (x: number, y: number, color: string) => {
            for(let i=0; i<15; i++) {
                gameState.current.visualParticles.push({
                    x, y,
                    vx: (Math.random() - 0.5) * 10,
                    vy: (Math.random() - 0.5) * 10,
                    life: 1.0,
                    color
                });
            }
        };

        const update = () => {
            const state = gameState.current;
            state.frame++;

            // Movement
            if (state.keys.w && state.player.y > 0) state.player.y -= state.player.speed;
            if (state.keys.s && state.player.y < canvas.height - state.player.height) state.player.y += state.player.speed;
            if (state.keys.a && state.player.x > 0) state.player.x -= state.player.speed;
            if (state.keys.d && state.player.x < canvas.width - state.player.width) state.player.x += state.player.speed;

            // Glitches
            state.glitches.forEach(glitch => {
                glitch.x += glitch.speedX;
                glitch.y += glitch.speedY;
                if (glitch.x <= 0 || glitch.x >= canvas.width - glitch.size) glitch.speedX *= -1;
                if (glitch.y <= 0 || glitch.y >= canvas.height - glitch.size) glitch.speedY *= -1;

                // Collision with player
                if (
                    state.player.x < glitch.x + glitch.size &&
                    state.player.x + state.player.width > glitch.x &&
                    state.player.y < glitch.y + glitch.size &&
                    state.player.y + state.player.height > glitch.y
                ) {
                    createExplosion(state.player.x + 15, state.player.y + 15, '#EF4444');
                    setVictory(false);
                    setGameOver(true);
                }
            });

            // Particles
            let particlesActive = 0;
            state.grammarParticles.forEach(particle => {
                if (particle.active) {
                    particlesActive++;
                    particle.pulse = Math.sin(state.frame * 0.1) * 3;
                    
                    if (
                        state.player.x < particle.x + particle.radius * 2 &&
                        state.player.x + state.player.width > particle.x - particle.radius &&
                        state.player.y < particle.y + particle.radius * 2 &&
                        state.player.y + state.player.height > particle.y - particle.radius
                    ) {
                        particle.active = false;
                        createExplosion(particle.x, particle.y, '#FBBF24');
                        setScore(prev => prev + 25); // 4 particles = 100%
                    }
                }
            });

            // Update visual particles
            state.visualParticles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.02;
            });
            state.visualParticles = state.visualParticles.filter(p => p.life > 0);

            if (particlesActive === 0) {
                setVictory(true);
                setGameOver(true);
            }
        };

        const draw = () => {
            const state = gameState.current;
            
            // Dark trail effect for smooth motion blur
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = 'rgba(15, 23, 42, 0.4)'; // slate-900 with alpha
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.globalCompositeOperation = 'lighter';

            // Draw visual particles
            state.visualParticles.forEach(p => {
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.life;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1.0;

            // Draw Grammar Particles (Collectibles)
            state.grammarParticles.forEach(p => {
                if (p.active) {
                    // Glow
                    const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius + p.pulse + 10);
                    gradient.addColorStop(0, 'rgba(251, 191, 36, 1)'); // Amber 400
                    gradient.addColorStop(1, 'rgba(251, 191, 36, 0)');
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.radius + p.pulse + 10, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = '#FFFFFF';
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.radius * 0.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            // Draw Glitches (Enemies)
            state.glitches.forEach(g => {
                ctx.fillStyle = '#EF4444'; // Red 500
                ctx.shadowBlur = 20;
                ctx.shadowColor = '#EF4444';
                ctx.fillRect(g.x, g.y, g.size, g.size);
                
                // Glitch core
                ctx.fillStyle = '#FFFFFF';
                ctx.shadowBlur = 0;
                ctx.fillRect(g.x + g.size*0.25, g.y + g.size*0.25, g.size*0.5, g.size*0.5);
            });

            // Draw Player (Guardian)
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#8B5CF6'; // Purple 500
            ctx.fillStyle = '#8B5CF6';
            ctx.fillRect(state.player.x, state.player.y, state.player.width, state.player.height);
            
            // Player Core
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#C4B5FD';
            ctx.fillRect(state.player.x + 5, state.player.y + 5, state.player.width - 10, state.player.height - 10);

            ctx.globalCompositeOperation = 'source-over'; // reset
        };

        const loop = () => {
            update();
            draw();
            animationId = requestAnimationFrame(loop);
        };

        loop();
        return () => cancelAnimationFrame(animationId);
    }, [gameOver]);

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-500">
            {/* Header */}
            <div className="flex justify-between items-center bg-white/10 backdrop-blur-md p-6 rounded-[2rem] shadow-xl border border-white/20">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-fuchsia-400 to-purple-600 rounded-xl flex items-center justify-center text-2xl shadow-lg">
                        ✨
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Grammar Guardian</h2>
                        <p className="text-fuchsia-300 font-medium">Capture the particles, avoid the glitches!</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-sm text-slate-400 uppercase tracking-widest font-bold">Grammar Score</div>
                    <div className="text-3xl font-extrabold text-white">{score}%</div>
                </div>
            </div>

            {/* Game Area */}
            <div className="relative w-full h-[600px] bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white/10">
                
                {gameOver && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-30 animate-in fade-in zoom-in duration-500">
                        {victory ? (
                            <>
                                <div className="text-7xl mb-6 animate-bounce">🏆</div>
                                <h2 className="text-5xl font-extrabold text-fuchsia-400 mb-4 tracking-tight drop-shadow-lg">Module Complete!</h2>
                                <p className="text-xl text-white mb-8 font-medium">Excellence Score: {score}% saved to the Principal's Desk.</p>
                            </>
                        ) : (
                            <>
                                <div className="text-7xl mb-6">💥</div>
                                <h2 className="text-5xl font-extrabold text-rose-500 mb-4 tracking-tight drop-shadow-lg">System Glitch!</h2>
                                <p className="text-xl text-white mb-8 font-medium">You were caught by a syntax error. Score: {score}%.</p>
                            </>
                        )}
                        <button onClick={() => window.location.reload()} className="bg-gradient-to-r from-fuchsia-500 to-purple-500 px-8 py-4 rounded-2xl text-white font-bold hover:scale-105 hover:shadow-[0_0_20px_rgba(217,70,239,0.5)] transition-all duration-300">Play Again</button>
                    </div>
                )}

                <canvas ref={canvasRef} width={800} height={600} className="w-full h-full object-cover" />
                
                {/* Mobile controls hint */}
                <div className="absolute bottom-4 left-0 w-full text-center pointer-events-none opacity-50">
                    <p className="text-slate-400 font-mono text-sm tracking-widest">USE W A S D OR ARROWS TO MOVE</p>
                </div>
            </div>
        </div>
    );
};