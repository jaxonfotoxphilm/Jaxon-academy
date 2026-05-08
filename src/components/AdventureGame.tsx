import React, { useRef, useEffect, useState } from 'react';
import { VirtualJoystick } from './VirtualJoystick';
import { supabase } from '../supabaseClient';

export const AdventureGame: React.FC<{ playerName: string }> = ({ playerName }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // Input Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keysRef.current[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keysRef.current[e.code] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, []);
  
  const handleManualInput = (key: string, isPressed: boolean) => { keysRef.current[key] = isPressed; };

  // Core Game Loop
  useEffect(() => {
    if (gameOver) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let animationId: number;

    // Game Entities
    const player = { x: 50, y: 300, width: 30, height: 40, speed: 5, vy: 0, gravity: 0.6, jumpPower: -12, isGrounded: false };
    const goal = { x: 720, y: 240, width: 60, height: 100 }; // The Ark
    const scrolls = [
      { x: 250, y: 260, active: true, width: 20, height: 20 },
      { x: 400, y: 180, active: true, width: 20, height: 20 },
      { x: 550, y: 260, active: true, width: 20, height: 20 }
    ];

    const checkCollision = (r1: any, r2: any) => {
      return r1.x < r2.x + r2.width && r1.x + r1.width > r2.x && r1.y < r2.y + r2.height && r1.y + r1.height > r2.y;
    };

    const update = () => {
      const keys = keysRef.current;
      // Physics & Movement
      if (keys['ArrowLeft'] || keys['KeyA']) player.x -= player.speed;
      if (keys['ArrowRight'] || keys['KeyD']) player.x += player.speed;
      
      if (keys['Space'] && player.isGrounded) {
        player.vy = player.jumpPower;
        player.isGrounded = false;
      }

      player.vy += player.gravity;
      player.y += player.vy;

      // Floor Collision
      if (player.y >= 300) {
        player.y = 300;
        player.vy = 0;
        player.isGrounded = true;
      }

      // Wall Bounds
      player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));

      // Check Collectibles
      scrolls.forEach(scroll => {
        if (scroll.active && checkCollision(player, scroll)) {
          scroll.active = false;
          setScore(prev => prev + 33); // 3 scrolls = ~100%
        }
      });

      // Check Goal
      if (checkCollision(player, goal)) {
        setGameOver(true);
        return;
      }

      // Draw Environment
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#87CEEB'; ctx.fillRect(0, 0, canvas.width, canvas.height); // Sky
      ctx.fillStyle = '#22c55e'; ctx.fillRect(0, 340, canvas.width, canvas.height - 340); // Grass

      // Draw Goal (Ark)
      ctx.fillStyle = '#8B4513'; ctx.fillRect(goal.x, goal.y, goal.width, goal.height);
      ctx.fillStyle = 'white'; ctx.font = 'bold 16px sans-serif'; ctx.fillText('ARK', goal.x + 12, goal.y + 50);

      // Draw Collectibles
      ctx.fillStyle = '#FFD700'; // Gold Scrolls
      scrolls.forEach(scroll => {
        if (scroll.active) {
          ctx.beginPath();
          ctx.arc(scroll.x + 10, scroll.y + 10, 10, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Draw Player
      ctx.fillStyle = '#3b82f6'; ctx.fillRect(player.x, player.y, player.width, player.height);

      animationId = requestAnimationFrame(update);
    };

    update();
    return () => cancelAnimationFrame(animationId);
  }, [gameOver]);

  // Auto-Save Score when game ends
  useEffect(() => {
    if (gameOver) {
      const finalScore = score >= 99 ? 100 : score;
      const saveRecord = async () => {
        await supabase.from('student_progress').insert([
          { student_name: playerName, subject: 'Biblical Adventures', score: finalScore, level_reached: 1 }
        ]);
      };
      saveRecord();
    }
  }, [gameOver, playerName, score]);

  return (
    <div className="flex flex-col gap-4 w-full max-w-4xl mx-auto">
      <div className="flex justify-between items-center bg-slate-800 p-4 rounded-lg shadow-md border border-slate-700">
        <h2 className="text-2xl font-bold text-white">Path to the Ark</h2>
        <div className="text-xl font-bold text-yellow-400">Score: {score >= 99 ? 100 : score}%</div>
      </div>
      
      <div className="relative w-full h-[400px] bg-slate-900 border-4 border-slate-800 rounded-lg overflow-hidden shadow-2xl">
        {gameOver && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10">
            <h2 className="text-5xl font-bold text-green-400 mb-4">Level Complete!</h2>
            <p className="text-xl text-white mb-6">Excellence Score: {score >= 99 ? 100 : score}% saved to the Principal's Desk.</p>
            <button onClick={() => window.location.reload()} className="bg-blue-600 px-6 py-3 rounded-lg text-white font-bold hover:bg-blue-500 transition-all">Play Again</button>
          </div>
        )}
        <canvas ref={canvasRef} width={800} height={400} className="w-full h-full object-cover" />
        <VirtualJoystick onPress={(key) => handleManualInput(key, true)} onRelease={(key) => handleManualInput(key, false)} />
      </div>
    </div>
  );
};