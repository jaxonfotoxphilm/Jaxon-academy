import { useState, useEffect } from 'react';
import { validatePrincipalPin } from '../utils/Auth';
import { SoundManager } from '../utils/SoundManager';
import { AnimatePresence, motion } from 'framer-motion';
import { UserManager, type UserProfile } from '../utils/UserManager';

/**
 * Avatar collection system — Netflix/Disney+ style profile picker.
 * Uses DiceBear API for diverse, high-quality avatar styles.
 * Each collection offers 12 unique options per style category.
 * Selections persist in localStorage per profile.
 */

interface AvatarOption {
  id: string;
  url: string;
}

interface AvatarCollection {
  name: string;
  icon: string;
  style: string;
  seeds: string[];
}

/** Curated avatar collections with diverse representation */
const AVATAR_COLLECTIONS: AvatarCollection[] = [
  {
    name: 'Characters',
    icon: '👤',
    style: 'avataaars',
    seeds: [
      'Felix', 'Aneka', 'Luna', 'Miles', 'Zara', 'Kai',
      'Sage', 'Nova', 'Atlas', 'Ivy', 'Rio', 'Pearl',
    ],
  },
  {
    name: 'Adventurers',
    icon: '⚔️',
    style: 'adventurer',
    seeds: [
      'warrior1', 'mage2', 'rogue3', 'ranger4', 'healer5', 'knight6',
      'wizard7', 'archer8', 'druid9', 'bard10', 'monk11', 'paladin12',
    ],
  },
  {
    name: 'Pixel Art',
    icon: '🕹️',
    style: 'pixel-art',
    seeds: [
      'pixel1', 'pixel2', 'pixel3', 'pixel4', 'pixel5', 'pixel6',
      'pixel7', 'pixel8', 'pixel9', 'pixel10', 'pixel11', 'pixel12',
    ],
  },
  {
    name: 'Fun Shapes',
    icon: '😊',
    style: 'fun-emoji',
    seeds: [
      'happy1', 'cool2', 'smart3', 'brave4', 'kind5', 'silly6',
      'wild7', 'calm8', 'bold9', 'sweet10', 'witty11', 'jazzy12',
    ],
  },
  {
    name: 'Animals',
    icon: '🦊',
    style: 'thumbs',
    seeds: [
      'fox1', 'cat2', 'dog3', 'owl4', 'bear5', 'rabbit6',
      'panda7', 'wolf8', 'lion9', 'deer10', 'eagle11', 'tiger12',
    ],
  },
  {
    name: 'Robots',
    icon: '🤖',
    style: 'bottts',
    seeds: [
      'bot1', 'bot2', 'bot3', 'bot4', 'bot5', 'bot6',
      'bot7', 'bot8', 'bot9', 'bot10', 'bot11', 'bot12',
    ],
  },
];

/** Build a DiceBear avatar URL from style and seed */
function buildAvatarUrl(style: string, seed: string): string {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=transparent`;
}

/** Get avatars for a collection */
function getCollectionAvatars(collection: AvatarCollection): AvatarOption[] {
  return collection.seeds.map(seed => ({
    id: `${collection.style}:${seed}`,
    url: buildAvatarUrl(collection.style, seed),
  }));
}

// ─── Avatar Picker Modal ───
const AvatarPickerModal = ({ 
  profileName, 
  currentAvatar,
  themeColor,
  onSelect, 
  onClose 
}: { 
  profileName: string;
  currentAvatar: string;
  themeColor: string;
  onSelect: (url: string) => void; 
  onClose: () => void;
}) => {
  const [activeCollection, setActiveCollection] = useState(0);
  const [hoveredAvatar, setHoveredAvatar] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState(currentAvatar);
  const avatars = getCollectionAvatars(AVATAR_COLLECTIONS[activeCollection]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-xl p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 40 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-[hsl(228,40%,6%)] border border-[var(--border-subtle)] rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 md:p-8 pb-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Live preview */}
            <div 
              className="w-16 h-16 rounded-full p-[2px] profile-ring shrink-0"
              style={{ '--ring-color': themeColor } as React.CSSProperties}
            >
              <div className="w-full h-full rounded-full overflow-hidden bg-[hsl(228,40%,10%)]">
                <img src={hoveredAvatar || previewUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Choose Avatar
              </h2>
              <p className="text-[var(--text-secondary)] text-sm">{profileName}'s profile picture</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white text-xl transition-all"
          >
            ✕
          </button>
        </div>

        {/* Collection Tabs */}
        <div className="px-6 md:px-8 py-3 flex gap-2 overflow-x-auto scrollbar-none border-b border-[var(--border-subtle)]">
          {AVATAR_COLLECTIONS.map((col, i) => (
            <button
              key={col.name}
              onClick={() => { SoundManager.playClick(); setActiveCollection(i); }}
              onMouseEnter={() => SoundManager.playHover()}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all shrink-0 ${
                activeCollection === i
                  ? 'bg-[var(--accent-indigo)] text-white shadow-[0_0_20px_var(--glow-indigo)]'
                  : 'bg-white/5 text-[var(--text-secondary)] hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="text-lg">{col.icon}</span>
              {col.name}
            </button>
          ))}
        </div>

        {/* Avatar Grid */}
        <div className="p-6 md:p-8 overflow-y-auto max-h-[50vh]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCollection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-4 sm:grid-cols-6 gap-3 md:gap-4"
            >
              {avatars.map(avatar => {
                const isActive = previewUrl === avatar.url;
                return (
                  <button
                    key={avatar.id}
                    onMouseEnter={() => { SoundManager.playHover(); setHoveredAvatar(avatar.url); }}
                    onMouseLeave={() => setHoveredAvatar(null)}
                    onClick={() => {
                      SoundManager.playClick();
                      setPreviewUrl(avatar.url);
                    }}
                    className={`relative aspect-square rounded-2xl overflow-hidden transition-all duration-300 group ${
                      isActive
                        ? 'ring-3 ring-[var(--accent-blue)] ring-offset-2 ring-offset-[hsl(228,40%,6%)] scale-105 shadow-[0_0_20px_var(--glow-blue)]'
                        : 'hover:scale-105 hover:ring-2 hover:ring-white/20'
                    }`}
                  >
                    <div className={`w-full h-full p-2 transition-all ${
                      isActive ? 'bg-[hsla(224,76%,58%,0.15)]' : 'bg-white/5 group-hover:bg-white/10'
                    }`}>
                      <img 
                        src={avatar.url} 
                        alt="Avatar option" 
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    </div>
                    {isActive && (
                      <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[var(--accent-blue)] flex items-center justify-center text-[10px] font-black animate-in zoom-in duration-200">
                        ✓
                      </div>
                    )}
                  </button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="p-6 md:p-8 pt-4 border-t border-[var(--border-subtle)] flex justify-between items-center gap-4">
          <button
            onClick={onClose}
            className="px-6 py-3 text-[var(--text-secondary)] hover:text-white font-bold rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              SoundManager.playReward();
              onSelect(previewUrl);
            }}
            className="px-8 py-3 bg-[var(--accent-blue)] hover:bg-[hsl(224,76%,65%)] text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_var(--glow-blue)]"
          >
            Save Avatar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Main Login Component ───
export const Login = ({ onLogin }: { onLogin: (profile: string) => void }) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [editingProfile, setEditingProfile] = useState<string | null>(null);
  const [pinTarget, setPinTarget] = useState<string | null>(null);
  const [pinValue, setPinValue] = useState('');
  const [pinError, setPinError] = useState(false);

  // The Principal PIN is read from the environment via Auth utility
  // Validation will be performed with Auth.validatePrincipalPin

  // Load saved profiles on mount
  useEffect(() => {
    UserManager.getProfiles().then(setProfiles);
  }, []);

  const handleSelect = (profile: UserProfile) => {
    SoundManager.playClick();
    if (profile.role === 'principal' || profile.role === 'teacher') {
      // Require PIN before granting Admin access
      setPinTarget(profile.name);
      setPinValue('');
      setPinError(false);
      return;
    }
    setSelected(profile.name);
    setTimeout(() => {
      SoundManager.playCinematicChime();
      onLogin(profile.name);
    }, 700);
  };

  const handleAvatarChange = async (name: string, url: string) => {
    await UserManager.updateAvatar(name, url);
    const updatedProfiles = await UserManager.getProfiles();
    setProfiles(updatedProfiles);
    setEditingProfile(null);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-transparent text-white overflow-hidden relative grain-overlay">
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
          {profiles.map(profile => {
            const isSelected = selected === profile.name;
            const color = profile.themeColor;
            const avatar = profile.avatarUrl;
            return (
              <div 
                key={profile.name} 
                className={`flex flex-col items-center group cursor-pointer transition-all duration-500 ${
                  selected && !isSelected ? 'opacity-30 scale-90 blur-sm' : ''
                }`}
                onMouseEnter={() => SoundManager.playHover()}
                onClick={() => !selected && !editingProfile && handleSelect(profile)}
              >
                {/* Avatar with ring */}
                <div className={`relative transition-all duration-500 ${
                  isSelected ? 'scale-110' : 'group-hover:scale-105'
                }`}>
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
                        alt={`${profile.name}'s Avatar`} 
                        className={`w-full h-full object-cover transition-all duration-500 ${
                          isSelected ? 'scale-105' : 'grayscale-[20%] group-hover:grayscale-0'
                        }`}
                      />
                    </div>
                  </div>
                  
                  {/* Edit pencil icon — appears on hover */}
                  {!selected && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        SoundManager.playClick();
                        setEditingProfile(profile.name);
                      }}
                      className="absolute -bottom-1 -right-1 w-8 h-8 md:w-9 md:h-9 rounded-full bg-[hsl(228,40%,15%)] border-2 border-[var(--border-subtle)] flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 hover:bg-[var(--accent-indigo)] hover:border-[var(--accent-indigo)] shadow-lg z-10"
                      title="Change avatar"
                    >
                      ✏️
                    </button>
                  )}

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
                  {profile.name} {profile.role !== 'student' && <span className="text-xs uppercase tracking-widest text-indigo-400 block text-center">({profile.role})</span>}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Avatar Picker Modal */}
      <AnimatePresence>
        {editingProfile && (
          <AvatarPickerModal
            profileName={editingProfile}
            themeColor={profiles.find(p => p.name === editingProfile)?.themeColor || 'hsl(224, 76%, 58%)'}
            currentAvatar={profiles.find(p => p.name === editingProfile)?.avatarUrl || ''}
            onSelect={(url) => handleAvatarChange(editingProfile, url)}
            onClose={() => setEditingProfile(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Principal PIN Modal ── */}
      <AnimatePresence>
        {pinTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4"
            onClick={() => setPinTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.85, y: 30 }}
              animate={{ scale: 1, y: 0, x: pinError ? [-8, 8, -8, 8, 0] : 0 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="bg-[hsl(228,40%,6%)] border border-[var(--border-subtle)] rounded-3xl p-8 w-full max-w-xs shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-4xl mb-4">🏛️</div>
              <h2 className="text-2xl font-black text-white mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Principal Access
              </h2>
              <p className="text-[var(--text-secondary)] text-sm mb-6">Enter your admin PIN to continue</p>

              {/* PIN dots */}
              <div className="flex justify-center gap-4 mb-6">
                {[0,1,2,3].map(i => (
                  <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                    pinValue.length > i
                      ? pinError ? 'bg-rose-500 border-rose-400' : 'bg-white border-white'
                      : 'bg-transparent border-slate-600'
                  }`} />
                ))}
              </div>

              {/* PIN Keypad */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((key, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (key === '⌫') { setPinValue(v => v.slice(0, -1)); return; }
                      if (key === '') return;
                      const next = pinValue + String(key);
                      setPinValue(next);
                      if (next.length === 4) {
                        setTimeout(() => {
                          if (validatePrincipalPin(next)) {
                            setPinTarget(null); setSelected('Principal');
                            setTimeout(() => { SoundManager.playCinematicChime(); onLogin('Principal'); }, 500);
                          } else {
                            setPinError(true); setPinValue('');
                            setTimeout(() => setPinError(false), 600);
                          }
                        }, 100);
                      }
                    }}
                    className={`py-4 rounded-xl text-xl font-bold transition-all active:scale-95 ${
                      key === '' ? 'cursor-default' :
                      key === '⌫' ? 'bg-white/5 hover:bg-white/10 text-slate-400 text-base' :
                      'bg-white/8 hover:bg-white/15 text-white border border-white/10'
                    }`}
                    style={{ background: key === '' ? 'transparent' : undefined }}
                  >
                    {key}
                  </button>
                ))}
              </div>

              {pinError && (
                <p className="text-rose-400 text-sm font-bold animate-in fade-in duration-200">Incorrect PIN. Try again.</p>
              )}
              <button onClick={() => setPinTarget(null)} className="mt-4 text-slate-500 hover:text-white text-sm transition-colors">Cancel</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};