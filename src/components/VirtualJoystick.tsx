import React from 'react';
interface GamepadProps { onPress: (key: string) => void; onRelease: (key: string) => void; }
export const VirtualJoystick: React.FC<GamepadProps> = ({ onPress, onRelease }) => {
  if (!('ontouchstart' in window)) return null;
  const btnStyle = "w-16 h-16 bg-white/20 rounded-full flex items-center justify-center border border-white/30 active:bg-white/40 touch-none select-none text-2xl";
  return (
    <div className="absolute bottom-8 w-full flex justify-between px-10 pointer-events-none z-50">
      <div className="flex gap-4 pointer-events-auto">
        <button className={btnStyle} onTouchStart={(e) => { e.preventDefault(); onPress('ArrowLeft'); }} onTouchEnd={(e) => { e.preventDefault(); onRelease('ArrowLeft'); }}>⬅️</button>
        <button className={btnStyle} onTouchStart={(e) => { e.preventDefault(); onPress('ArrowRight'); }} onTouchEnd={(e) => { e.preventDefault(); onRelease('ArrowRight'); }}>➡️</button>
      </div>
      <div className="pointer-events-auto">
        <button className="w-20 h-20 bg-blue-500/40 rounded-full flex items-center justify-center border-2 border-blue-300 active:bg-blue-400 touch-none select-none font-bold text-white" onTouchStart={(e) => { e.preventDefault(); onPress('Space'); }} onTouchEnd={(e) => { e.preventDefault(); onRelease('Space'); }}>JUMP</button>
      </div>
    </div>
  );
};