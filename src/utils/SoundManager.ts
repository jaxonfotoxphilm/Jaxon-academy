/**
 * SoundManager — Premium Web Audio API sound engine.
 *
 * Every sound uses layered oscillators with reverb simulation for a rich,
 * warm audio experience. Frequencies are tuned to musically pleasing intervals.
 *
 * Sound palette:
 *   - Hover:    Soft crystalline tick (glass tap)
 *   - Click:    Warm pop with harmonic tail
 *   - Chime:    Cinematic Cmaj7 arpeggio with delay reverb
 *   - Reward:   Bright ascending triad fanfare
 *   - Level Up: Sweeping pentatonic staircase with shimmer
 *   - Error:    Gentle descending minor 2nd nudge
 *   - Success:  Satisfying major 5th resolution
 */

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

    /**
     * Creates a simple reverb-like effect by adding delayed copies of the signal.
     * Returns a GainNode to connect oscillators into.
     */
    private createReverbBus(duration: number = 0.8, wetMix: number = 0.15): GainNode {
        const ctx = this.audioCtx!;
        const dry = ctx.createGain();
        dry.gain.setValueAtTime(1 - wetMix, ctx.currentTime);
        dry.connect(ctx.destination);

        // Simulated reverb via staggered delays
        const delays = [0.03, 0.07, 0.12];
        delays.forEach(d => {
            const delay = ctx.createDelay(1);
            delay.delayTime.setValueAtTime(d, ctx.currentTime);
            const feedback = ctx.createGain();
            feedback.gain.setValueAtTime(wetMix * (1 - d), ctx.currentTime);
            feedback.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
            dry.connect(delay);
            delay.connect(feedback);
            feedback.connect(ctx.destination);
        });

        return dry;
    }

    public setUser(username: string) {
        this.currentUser = username;
        const savedPref = localStorage.getItem(`jaxonAcademy_audioPref_${username}`);
        if (savedPref !== null) {
            this.audioEnabled = savedPref === 'true';
        } else {
            this.audioEnabled = true;
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

    public isAudioEnabled() { return this.audioEnabled; }

    public subscribe(listener: () => void) {
        this.listeners.push(listener);
        return () => { this.listeners = this.listeners.filter(l => l !== listener); };
    }

    private notifyListeners() { this.listeners.forEach(l => l()); }

    public stopAll() {
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        import('./VoiceService').then(({ stopSpeaking }) => stopSpeaking());
    }

    /** Soft crystalline tick — like tapping glass */
    public playHover() {
        if (!this.audioEnabled) return;
        this.unlockAudio(); this.init();
        if (!this.audioCtx) return;
        const ctx = this.audioCtx;
        const t = ctx.currentTime;

        // Two layered sine tones for warmth
        [1800, 2400].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t);
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(0.04 - i * 0.015, t + 0.008);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
            osc.connect(g);
            g.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.06);
        });
    }

    /** Warm pop with harmonic overtone */
    public playClick() {
        if (!this.audioEnabled) return;
        this.unlockAudio(); this.init();
        if (!this.audioCtx) return;
        const ctx = this.audioCtx;
        const t = ctx.currentTime;
        const bus = this.createReverbBus(0.3, 0.1);

        // Fundamental pop
        const osc1 = ctx.createOscillator();
        const g1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(520, t);
        osc1.frequency.exponentialRampToValueAtTime(680, t + 0.04);
        g1.gain.setValueAtTime(0, t);
        g1.gain.linearRampToValueAtTime(0.15, t + 0.005);
        g1.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        osc1.connect(g1);
        g1.connect(bus);
        osc1.start(t);
        osc1.stop(t + 0.12);

        // Harmonic shimmer
        const osc2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1040, t);
        g2.gain.setValueAtTime(0, t);
        g2.gain.linearRampToValueAtTime(0.04, t + 0.01);
        g2.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        osc2.connect(g2);
        g2.connect(bus);
        osc2.start(t);
        osc2.stop(t + 0.08);
    }

    /** Cinematic Cmaj7 arpeggio with delay reverb — plays on login / major transitions */
    public playCinematicChime() {
        if (!this.audioEnabled) return;
        this.unlockAudio(); this.init();
        if (!this.audioCtx) return;
        const ctx = this.audioCtx;
        const t = ctx.currentTime;

        // C4, E4, G4, B4 (Cmaj7 — warm, sophisticated)
        const notes = [261.63, 329.63, 392.00, 493.88];
        const bus = this.createReverbBus(2.5, 0.25);
        const master = ctx.createGain();
        master.gain.setValueAtTime(0, t);
        master.gain.linearRampToValueAtTime(0.2, t + 0.8);
        master.gain.exponentialRampToValueAtTime(0.001, t + 4.0);
        master.connect(bus);

        notes.forEach((freq, i) => {
            const delay = i * 0.18;
            // Main tone
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = i % 2 === 0 ? 'sine' : 'triangle';
            osc.frequency.setValueAtTime(freq * (1 + i * 0.001), t + delay);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.003, t + delay + 3.0);
            g.gain.setValueAtTime(0, t + delay);
            g.gain.linearRampToValueAtTime(0.25 / notes.length, t + delay + 0.3);
            g.gain.exponentialRampToValueAtTime(0.001, t + delay + 3.5);
            osc.connect(g);
            g.connect(master);
            osc.start(t + delay);
            osc.stop(t + delay + 4.0);

            // Octave shimmer (very quiet)
            const osc2 = ctx.createOscillator();
            const g2 = ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(freq * 2, t + delay);
            g2.gain.setValueAtTime(0, t + delay);
            g2.gain.linearRampToValueAtTime(0.03, t + delay + 0.5);
            g2.gain.exponentialRampToValueAtTime(0.001, t + delay + 2.5);
            osc2.connect(g2);
            g2.connect(master);
            osc2.start(t + delay);
            osc2.stop(t + delay + 3.0);
        });
    }

    /** Bright ascending triad — correct answer / reward */
    public playReward() {
        if (!this.audioEnabled) return;
        this.unlockAudio(); this.init();
        if (!this.audioCtx) return;
        const ctx = this.audioCtx;
        const t = ctx.currentTime;
        const bus = this.createReverbBus(0.5, 0.2);

        // C5, E5, G5 ascending quickly
        const notes = [523.25, 659.25, 783.99];
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t + i * 0.08);
            g.gain.setValueAtTime(0, t + i * 0.08);
            g.gain.linearRampToValueAtTime(0.18, t + i * 0.08 + 0.015);
            g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.4);
            osc.connect(g);
            g.connect(bus);
            osc.start(t + i * 0.08);
            osc.stop(t + i * 0.08 + 0.4);
        });
    }

    /** Sweeping pentatonic staircase with shimmer — lesson complete / level up */
    public playLevelUp() {
        if (!this.audioEnabled) return;
        this.unlockAudio(); this.init();
        if (!this.audioCtx) return;
        const ctx = this.audioCtx;
        const t = ctx.currentTime;
        const bus = this.createReverbBus(1.0, 0.3);

        // A major pentatonic ascending: A4, B4, C#5, E5, F#5, A5
        const notes = [440, 493.88, 554.37, 659.25, 739.99, 880];
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = i < 3 ? 'triangle' : 'sine';
            osc.frequency.setValueAtTime(freq, t + i * 0.1);
            g.gain.setValueAtTime(0, t + i * 0.1);
            g.gain.linearRampToValueAtTime(0.12, t + i * 0.1 + 0.02);
            g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.5);
            osc.connect(g);
            g.connect(bus);
            osc.start(t + i * 0.1);
            osc.stop(t + i * 0.1 + 0.5);
        });

        // Final shimmer chord (A5 + C#6)
        const shimmerDelay = notes.length * 0.1;
        [880, 1108.73].forEach(freq => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t + shimmerDelay);
            g.gain.setValueAtTime(0, t + shimmerDelay);
            g.gain.linearRampToValueAtTime(0.08, t + shimmerDelay + 0.05);
            g.gain.exponentialRampToValueAtTime(0.001, t + shimmerDelay + 1.2);
            osc.connect(g);
            g.connect(bus);
            osc.start(t + shimmerDelay);
            osc.stop(t + shimmerDelay + 1.2);
        });
    }

    /** Gentle descending minor 2nd — wrong answer / error nudge */
    public playError() {
        if (!this.audioEnabled) return;
        this.unlockAudio(); this.init();
        if (!this.audioCtx) return;
        const ctx = this.audioCtx;
        const t = ctx.currentTime;

        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, t);
        osc.frequency.exponentialRampToValueAtTime(380, t + 0.15);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.12, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.25);
    }

    /** Satisfying major 5th resolution — success confirmation */
    public playSuccess() {
        if (!this.audioEnabled) return;
        this.unlockAudio(); this.init();
        if (!this.audioCtx) return;
        const ctx = this.audioCtx;
        const t = ctx.currentTime;
        const bus = this.createReverbBus(0.6, 0.15);

        // C5 → G5 (perfect 5th = pure satisfaction)
        [523.25, 783.99].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t + i * 0.12);
            g.gain.setValueAtTime(0, t + i * 0.12);
            g.gain.linearRampToValueAtTime(0.15, t + i * 0.12 + 0.01);
            g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.5);
            osc.connect(g);
            g.connect(bus);
            osc.start(t + i * 0.12);
            osc.stop(t + i * 0.12 + 0.5);
        });
    }

    /**
     * Plays character dialogue using the tiered VoiceService.
     * Falls through: ElevenLabs → Kokoro TTS → Web Speech API.
     */
    public playCharacterVoice(text: string, _voiceType: 'narrator' | 'professor' | 'hero' = 'narrator') {
        if (!this.audioEnabled) return;
        import('./VoiceService').then(({ speak }) => { speak(text); });
    }

    /**
     * Pre-loads the Kokoro TTS WASM model in the background.
     */
    public preloadVoiceModels() {
        import('./VoiceService').then(({ preloadKokoro }) => { preloadKokoro(); });
    }

    /** Soft directional whoosh — page/view transitions */
    public playPageTransition() {
        if (!this.audioEnabled) return;
        this.unlockAudio(); this.init();
        if (!this.audioCtx) return;
        const ctx = this.audioCtx;
        const t = ctx.currentTime;

        // White noise burst shaped into a swoosh
        const bufferSize = ctx.sampleRate * 0.15;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.3;
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;

        // Bandpass filter for a warm swoosh tone
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, t);
        filter.frequency.exponentialRampToValueAtTime(2000, t + 0.08);
        filter.frequency.exponentialRampToValueAtTime(400, t + 0.15);
        filter.Q.setValueAtTime(1.5, t);

        const g = ctx.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.06, t + 0.03);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

        source.connect(filter);
        filter.connect(g);
        g.connect(ctx.destination);
        source.start(t);
        source.stop(t + 0.15);
    }

    /** Warm welcoming tone — lesson start */
    public playLessonStart() {
        if (!this.audioEnabled) return;
        this.unlockAudio(); this.init();
        if (!this.audioCtx) return;
        const ctx = this.audioCtx;
        const t = ctx.currentTime;
        const bus = this.createReverbBus(1.5, 0.2);

        // D4 → F#4 → A4 (D major — warm, inviting)
        const notes = [293.66, 369.99, 440];
        notes.forEach((freq, i) => {
            const delay = i * 0.15;
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, t + delay);
            g.gain.setValueAtTime(0, t + delay);
            g.gain.linearRampToValueAtTime(0.1, t + delay + 0.04);
            g.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.8);
            osc.connect(g);
            g.connect(bus);
            osc.start(t + delay);
            osc.stop(t + delay + 0.8);
        });
    }

    /** Quick celebratory trill — streak/consecutive correct answers */
    public playStreakNotification() {
        if (!this.audioEnabled) return;
        this.unlockAudio(); this.init();
        if (!this.audioCtx) return;
        const ctx = this.audioCtx;
        const t = ctx.currentTime;
        const bus = this.createReverbBus(0.4, 0.15);

        // Rapid ascending: E5 → G#5 → B5 → E6
        const notes = [659.25, 830.61, 987.77, 1318.51];
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t + i * 0.05);
            g.gain.setValueAtTime(0, t + i * 0.05);
            g.gain.linearRampToValueAtTime(0.1, t + i * 0.05 + 0.01);
            g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.2);
            osc.connect(g);
            g.connect(bus);
            osc.start(t + i * 0.05);
            osc.stop(t + i * 0.05 + 0.2);
        });
    }
}

export const SoundManager = new SoundManagerClass();
