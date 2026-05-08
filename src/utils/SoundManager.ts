// Base64 encoded tiny audio blips
// Hover: A soft tick
// Empty placeholder to avoid huge strings, I'll use Web Audio API instead for cleaner sounds!

class SoundManagerClass {
    private audioCtx: AudioContext | null = null;
    private audioEnabled: boolean = true;
    private currentUser: string = 'default';
    private listeners: (() => void)[] = [];
    private unlocked: boolean = false;
    private voicesLoaded: boolean = false;

    private init() {
        if (!this.audioCtx && this.audioEnabled) {
            this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (!this.voicesLoaded && 'speechSynthesis' in window) {
            window.speechSynthesis.getVoices();
            window.speechSynthesis.onvoiceschanged = () => {
                window.speechSynthesis.getVoices();
                this.voicesLoaded = true;
            };
        }
    }

    private unlockAudio() {
        if (this.unlocked) return;
        this.init();
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(' ');
            utterance.volume = 0;
            utterance.rate = 10;
            window.speechSynthesis.speak(utterance);
        }
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
        this.unlocked = true;
    }

    public setUser(username: string) {
        this.currentUser = username;
        const savedPref = localStorage.getItem(`jaxonAcademy_audioPref_${username}`);
        if (savedPref !== null) {
            this.audioEnabled = savedPref === 'true';
        } else {
            this.audioEnabled = true; // default to true
        }
        this.notifyListeners();
    }

    public toggleAudio() {
        this.audioEnabled = !this.audioEnabled;
        localStorage.setItem(`jaxonAcademy_audioPref_${this.currentUser}`, String(this.audioEnabled));
        if (!this.audioEnabled) {
            this.stopAll();
        }
        this.notifyListeners();
    }

    public isAudioEnabled() {
        return this.audioEnabled;
    }

    public subscribe(listener: () => void) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notifyListeners() {
        this.listeners.forEach(l => l());
    }

    public stopAll() {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    }

    public playHover() {
        if (!this.audioEnabled) return;
        this.unlockAudio();
        this.init();
        if (!this.audioCtx) return;
        
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, this.audioCtx.currentTime + 0.05);
        
        gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.05);
        
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.05);
    }

    public playClick() {
        if (!this.audioEnabled) return;
        this.unlockAudio();
        this.init();
        if (!this.audioCtx) return;
        
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.audioCtx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.1);
        
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.1);
    }

    public playCinematicChime() {
        if (!this.audioEnabled) return;
        this.unlockAudio();
        this.init();
        if (!this.audioCtx) return;
        
        const ctx = this.audioCtx;
        const rootFreq = 261.63; // C4
        const chord = [1, 1.25, 1.5, 1.8877]; // C E G B (Major 7th)
        
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0, ctx.currentTime);
        masterGain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 1.5);
        masterGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 4.0);
        masterGain.connect(ctx.destination);
        
        // Add a simple convolution reverb or just use multiple oscillators to sound thick
        chord.forEach((ratio, index) => {
            const osc = ctx.createOscillator();
            const oscGain = ctx.createGain();
            
            osc.type = index % 2 === 0 ? 'sine' : 'triangle';
            // slight detune for thickness
            osc.frequency.setValueAtTime(rootFreq * ratio * (1 + (index * 0.002)), ctx.currentTime);
            
            // Sweep pitch slightly up
            osc.frequency.exponentialRampToValueAtTime(rootFreq * ratio * 1.05, ctx.currentTime + 3.0);
            
            // Stagger entrances for arpeggio effect
            const startTime = ctx.currentTime + (index * 0.15);
            
            oscGain.gain.setValueAtTime(0, startTime);
            oscGain.gain.linearRampToValueAtTime(0.3 / chord.length, startTime + 0.5);
            oscGain.gain.exponentialRampToValueAtTime(0.001, startTime + 3.5);
            
            osc.connect(oscGain);
            oscGain.connect(masterGain);
            
            osc.start(startTime);
            osc.stop(startTime + 4.0);
        });
    }

    public playReward() {
        if (!this.audioEnabled) return;
        this.unlockAudio();
        this.init();
        if (!this.audioCtx) return;
        
        const ctx = this.audioCtx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    }

    public playLevelUp() {
        if (!this.audioEnabled) return;
        this.unlockAudio();
        this.init();
        if (!this.audioCtx) return;
        
        const ctx = this.audioCtx;
        const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5 (A major arpeggio)
        
        notes.forEach((freq, index) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + (index * 0.1));
            
            gain.gain.setValueAtTime(0, ctx.currentTime + (index * 0.1));
            gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + (index * 0.1) + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (index * 0.1) + 0.3);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(ctx.currentTime + (index * 0.1));
            osc.stop(ctx.currentTime + (index * 0.1) + 0.3);
        });
    }

    public playCharacterVoice(text: string, voiceType: 'narrator' | 'professor' | 'hero' = 'narrator') {
        if (!this.audioEnabled || !('speechSynthesis' in window)) return;
        
        // Stop any currently playing speech so it doesn't overlap messily
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Try to load voices
        const voices = window.speechSynthesis.getVoices();
        
        // Pitch and rate modifiers based on character
        if (voiceType === 'professor') {
            utterance.pitch = 1.0; // Natural female pitch
            utterance.rate = 0.9;  // Slower, storytelling pacing
            // Professor Grace is female, grab the absolute best available voices.
            // Google UK English Female is an amazing storytelling voice on Chrome. Samantha is great on Apple.
            const premiumVoices = ['Google UK English Female', 'Samantha', 'Karen', 'Tessa', 'Microsoft Zira'];
            let profVoice = null;
            for (const vName of premiumVoices) {
                profVoice = voices.find(v => v.name === vName);
                if (profVoice) break;
            }
            if (!profVoice) profVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Woman'));
            if (profVoice) utterance.voice = profVoice;
        } else if (voiceType === 'hero') {
            utterance.pitch = 1.2; // higher and energetic
            utterance.rate = 1.1;  // slightly faster
            const heroVoice = voices.find(v => v.name.includes('Samantha') || v.name.includes('Female'));
            if (heroVoice) utterance.voice = heroVoice;
        } else {
            // Narrator defaults
            utterance.pitch = 1.0;
            utterance.rate = 1.0;
        }
        
        window.speechSynthesis.speak(utterance);
    }
}

export const SoundManager = new SoundManagerClass();
