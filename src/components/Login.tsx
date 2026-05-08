import { useState } from 'react';
import { SoundManager } from '../utils/SoundManager';

const FamilyMembers = [
  { name: 'Principal', avatar: '/assets/avatar_knight.png' },
  { name: 'Ayla', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Ayla&top=longButNotTooLong&hairColor=d6b370&facialHairProbability=0&backgroundColor=ffb6b9' },
  { name: 'Aria', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Aria&top=straight01&hairColor=724133&facialHairProbability=0&backgroundColor=b5ead7' },
  { name: 'Ana', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Ana&top=straight02&hairColor=2c1b18&facialHairProbability=0&backgroundColor=c7ceea' },
  { name: 'Donyale', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Donyale&top=shortFlat&hairColor=2c1b18&facialHairProbability=0&backgroundColor=ffdfbf' },
  { name: 'Aiko', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Aiko&top=shortRound&hairColor=724133&facialHairProbability=0&backgroundColor=e2f0cb' },
  { name: 'Ace', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Ace&top=shortWaved&hairColor=d6b370&facialHairProbability=0&backgroundColor=b6e3f4' }
];

export const Login = ({ onLogin }: { onLogin: (name: string) => void }) => {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (name: string) => {
    SoundManager.playClick();
    setSelected(name);
    // Add a slight delay for the animation to play out before switching view
    setTimeout(() => {
      onLogin(name);
    }, 600);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#040714] text-white overflow-hidden relative">
      {/* Cinematic Background Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800/40 via-[#040714] to-[#040714] pointer-events-none"></div>

      <div className="z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 flex flex-col items-center">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-12 tracking-wide text-slate-100 drop-shadow-2xl">
          Who's Learning?
        </h1>
        
        <div className="flex flex-wrap justify-center gap-8 md:gap-12 px-4">
          {FamilyMembers.map(({ name, avatar }) => (
            <div 
              key={name} 
              className="flex flex-col items-center group cursor-pointer"
              onMouseEnter={() => SoundManager.playHover()}
              onClick={() => handleSelect(name)}
            >
              <div 
                className={`w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-transparent transition-all duration-300 ease-out transform shadow-2xl relative
                  ${selected === name ? 'scale-110 border-white shadow-[0_0_40px_rgba(255,255,255,0.6)]' : 'group-hover:scale-105 group-hover:border-white group-hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]'}
                `}
              >
                {/* Image overlay for a slight darkening effect that lifts on hover */}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300 z-10"></div>
                <img 
                  src={avatar} 
                  alt={`${name}'s Avatar`} 
                  className="w-full h-full object-cover"
                />
              </div>
              <span className={`mt-6 text-xl md:text-2xl font-bold tracking-wider transition-colors duration-300 ${selected === name ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
                {name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};