import { useState } from 'react';
import { SoundManager } from '../utils/SoundManager';

const FamilyMembers = [
  { name: 'Principal', avatar: '/assets/avatar_knight.png', color: 'hsl(224, 76%, 58%)' },
  { name: 'Ayla', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Ayla&top=longButNotTooLong&hairColor=d6b370&facialHairProbability=0&backgroundColor=ffb6b9', color: 'hsl(340, 65%, 60%)' },
  { name: 'Aria', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Aria&top=straight01&hairColor=724133&facialHairProbability=0&backgroundColor=b5ead7', color: 'hsl(160, 50%, 55%)' },
  { name: 'Ana', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Ana&top=straight02&hairColor=2c1b18&facialHairProbability=0&backgroundColor=c7ceea', color: 'hsl(246, 60%, 65%)' },
  { name: 'Donyale', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Donyale&top=shortFlat&hairColor=2c1b18&facialHairProbability=0&backgroundColor=ffdfbf', color: 'hsl(30, 70%, 55%)' },
  { name: 'Aiko', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Aiko&top=shortRound&hairColor=724133&facialHairProbability=0&backgroundColor=e2f0cb', color: 'hsl(90, 45%, 55%)' },
  { name: 'Ace', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Ace&top=shortWaved&hairColor=d6b370&facialHairProbability=0&backgroundColor=b6e3f4', color: 'hsl(200, 65%, 58%)' }
];

export const Login = ({ onLogin }: { onLogin: (name: string) => void }) => {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (name: string) => {
    SoundManager.playClick();
    setSelected(name);
    setTimeout(() => {
      SoundManager.playCinematicChime();
      onLogin(name);
    }, 700);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--bg-primary)] text-white overflow-hidden relative grain-overlay">
      {/* Cinematic ambient background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] bg-[hsla(224,76%,58%,0.06)] rounded-full blur-[150px] ambient-glow"></div>
        <div className="absolute bottom-[-10%] right-[15%] w-[500px] h-[500px] bg-[hsla(280,60%,50%,0.05)] rounded-full blur-[140px] ambient-glow-delay"></div>
        <div className="absolute top-[40%] left-[60%] w-[400px] h-[400px] bg-[hsla(160,60%,45%,0.04)] rounded-full blur-[120px] ambient-glow"></div>
      </div>

      <div className="z-10 flex flex-col items-center px-4">
        {/* Logo */}
        <div className="mb-6 animate-in fade-in duration-1000 flex items-center gap-3">
          <div className="text-4xl">🏛️</div>
          <h2 className="text-2xl font-extrabold tracking-[0.15em] uppercase text-white/60">
            Jaxon<span className="text-[var(--accent-blue)] font-light">Academy</span>
          </h2>
        </div>

        <h1 className="text-4xl md:text-6xl font-black mb-3 tracking-tight text-center animate-in fade-in slide-in-from-bottom-6 duration-700" 
            style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
          Who's Learning Today?
        </h1>
        <p className="text-[var(--text-secondary)] text-lg mb-14 animate-in fade-in duration-1000 delay-200">
          Select your profile to begin
        </p>
        
        <div className="flex flex-wrap justify-center gap-6 md:gap-10 max-w-5xl">
          {FamilyMembers.map(({ name, avatar, color }) => {
            const isSelected = selected === name;
            return (
              <div 
                key={name} 
                className={`flex flex-col items-center group cursor-pointer transition-all duration-500 ${
                  selected && !isSelected ? 'opacity-30 scale-90 blur-sm' : ''
                }`}
                onMouseEnter={() => SoundManager.playHover()}
                onClick={() => !selected && handleSelect(name)}
              >
                {/* Animated ring container */}
                <div className={`relative transition-all duration-500 ${
                  isSelected ? 'scale-110' : 'group-hover:scale-105'
                }`}>
                  {/* Rotating gradient ring */}
                  <div 
                    className={`w-28 h-28 md:w-36 md:h-36 rounded-full p-[3px] transition-all duration-500 ${
                      isSelected ? 'profile-ring shadow-[0_0_50px_var(--ring-color)]' :
                      'bg-[hsla(230,30%,30%,0.3)] group-hover:bg-[hsla(230,30%,40%,0.5)]'
                    }`}
                    style={{ '--ring-color': color } as React.CSSProperties}
                  >
                    <div className="w-full h-full rounded-full overflow-hidden bg-[var(--bg-primary)]">
                      <img 
                        src={avatar} 
                        alt={`${name}'s Avatar`} 
                        className={`w-full h-full object-cover transition-all duration-500 ${
                          isSelected ? 'scale-105' : 'grayscale-[20%] group-hover:grayscale-0'
                        }`}
                      />
                    </div>
                  </div>
                  
                  {/* Selection checkmark */}
                  {isSelected && (
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-sm font-black animate-in zoom-in duration-300 shadow-lg"
                         style={{ backgroundColor: color }}>
                      ✓
                    </div>
                  )}
                </div>

                <span className={`mt-4 text-lg md:text-xl font-bold tracking-wide transition-all duration-300 ${
                  isSelected ? 'text-white' : 'text-[var(--text-secondary)] group-hover:text-white'
                }`}>
                  {name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};