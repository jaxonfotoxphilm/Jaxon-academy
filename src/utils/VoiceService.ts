/**
 * VoiceService — Tiered text-to-speech engine with automatic fallback.
 *
 * Priority chain:
 *   1. ElevenLabs API  — Ultra-realistic neural voice (limited monthly chars)
 *   2. Web Speech API  — Built-in browser TTS (least natural, always available)
 *
 * Character usage is tracked in localStorage. When ElevenLabs monthly budget
 * is exhausted, subsequent calls silently fall through to Web Speech API.
 */

/** Monthly character budget for the ElevenLabs free tier */
const ELEVENLABS_MONTHLY_LIMIT = 9500; // conservative buffer below 10k

/** localStorage key for tracking ElevenLabs usage */
const USAGE_KEY = 'jaxon-academy-elevenlabs-usage';

interface UsageRecord {
    month: string; // "2026-05"
    chars: number;
}

function getCurrentMonth(): string {
    return new Date().toISOString().slice(0, 7); // "YYYY-MM"
}

function getUsage(): UsageRecord {
    try {
        const raw = localStorage.getItem(USAGE_KEY);
        if (raw) {
            const record: UsageRecord = JSON.parse(raw);
            // Reset if month rolled over
            if (record.month !== getCurrentMonth()) {
                return { month: getCurrentMonth(), chars: 0 };
            }
            return record;
        }
    } catch { /* ignore */ }
    return { month: getCurrentMonth(), chars: 0 };
}

function addUsage(chars: number) {
    const usage = getUsage();
    usage.chars += chars;
    localStorage.setItem(USAGE_KEY, JSON.stringify(usage));
}

function hasElevenLabsBudget(textLength: number): boolean {
    const usage = getUsage();
    return (usage.chars + textLength) < ELEVENLABS_MONTHLY_LIMIT;
}

// Global speak session ID to prevent race conditions
let currentSpeakId = 0;

/** Optional callbacks for talking state sync */
interface SpeakCallbacks {
    onStart?: () => void;
    onEnd?: () => void;
}

/**
 * Attempt speech via ElevenLabs API.
 * Returns true if audio was played successfully.
 */
async function speakElevenLabs(text: string, speakId: number, cb?: SpeakCallbacks): Promise<boolean> {
    const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
    if (!apiKey || !hasElevenLabsBudget(text.length)) return false;

    try {
        const response = await fetch(
            'https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL',
            {
                method: 'POST',
                headers: {
                    'xi-api-key': apiKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text,
                    model_id: 'eleven_turbo_v2_5',
                    voice_settings: {
                        stability: 0.65,
                        similarity_boost: 0.8,
                        style: 0.35,
                    },
                }),
            }
        );

        if (!response.ok) {
            console.warn('[VoiceService] ElevenLabs returned', response.status);
            return false;
        }

        const blob = await response.blob();
        if (currentSpeakId !== speakId) return true; // Abort if a new speak() was called

        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        trackAudio(audio);

        addUsage(text.length);

        return new Promise((resolve) => {
            audio.addEventListener('play', () => cb?.onStart?.());
            audio.onended = () => { cb?.onEnd?.(); URL.revokeObjectURL(url); resolve(true); };
            audio.onerror = () => { cb?.onEnd?.(); URL.revokeObjectURL(url); resolve(false); };
            audio.play().catch(() => resolve(false));
        });
    } catch (err) {
        console.warn('[VoiceService] ElevenLabs error:', err);
        return false;
    }
}

/**
 * Attempt speech via Gemini TTS (Supabase edge function).
 * Returns true if audio was played successfully.
 * Uses the Gemini 2.5 Flash TTS model — realistic and free.
 */
async function speakGeminiTTS(text: string, speakId: number, cb?: SpeakCallbacks): Promise<boolean> {
    try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        if (!supabaseUrl || !supabaseKey) return false;

        const response = await fetch(`${supabaseUrl}/functions/v1/tts`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text }),
        });

        if (!response.ok) {
            const errBody = await response.text().catch(() => '');
            console.warn('[VoiceService] Gemini TTS returned', response.status, errBody);
            return false;
        }

        const rawBlob = await response.blob();
        if (currentSpeakId !== speakId) return true; // Abort if a new speak() was called

        // Force the correct MIME type — the edge function returns audio/wav
        const wavBlob = new Blob([rawBlob], { type: 'audio/wav' });
        console.log('[VoiceService] ✅ Gemini TTS audio received:', wavBlob.size, 'bytes');

        const url = URL.createObjectURL(wavBlob);
        const audio = new Audio(url);
        trackAudio(audio);

        return new Promise((resolve) => {
            audio.addEventListener('play', () => { console.log('[VoiceService] ▶ Gemini audio playing'); cb?.onStart?.(); });
            audio.onended = () => { cb?.onEnd?.(); URL.revokeObjectURL(url); resolve(true); };
            audio.onerror = (e) => { console.error('[VoiceService] ❌ Gemini audio error:', e); cb?.onEnd?.(); URL.revokeObjectURL(url); resolve(false); };
            audio.play().catch((e) => { console.error('[VoiceService] ❌ Play failed:', e); resolve(false); });
        });
    } catch (err) {
        console.warn('[VoiceService] Gemini TTS error:', err);
        return false;
    }
}

// --- Kokoro removed to prevent main thread blocking ---

/**
 * Final fallback — browser's built-in Web Speech API.
 * Selects the best available voice (Apple Neural > Google > default).
 */
function speakWebSpeech(text: string, cb?: SpeakCallbacks): void {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();

    const findVoice = (preferred: string[]): SpeechSynthesisVoice | null => {
        for (const name of preferred) {
            const v = voices.find(v => v.name.includes(name));
            if (v) return v;
        }
        return null;
    };

    utterance.pitch = 1.05;
    utterance.rate = 0.92;
    const voice = findVoice([
        'Zoe', 'Ava', 'Fiona', 'Samantha', 'Karen',
        'Google UK English Female', 'Microsoft Zira',
    ]) || voices.find(v => v.lang.startsWith('en'));
    if (voice) utterance.voice = voice;

    utterance.onstart = () => cb?.onStart?.();
    utterance.onend = () => cb?.onEnd?.();

    window.speechSynthesis.speak(utterance);
}

// ─── Public API ───

/**
 * Pre-load resources if needed.
 */
export function preloadKokoro() {
    // Kokoro removed
}

/**
 * Speak text using the best available voice engine.
 * Automatically falls through the tier chain:
 *   Gemini TTS → ElevenLabs → Web Speech API
 */
export async function speak(text: string, callbacks?: { onStart?: () => void; onEnd?: () => void }): Promise<void> {
    if (!text?.trim()) return;

    // Cancel any existing audio (Web Speech, ElevenLabs, Gemini) to prevent overlap
    stopSpeaking();
    
    currentSpeakId++;
    const mySpeakId = currentSpeakId;

    // Tier 1: Gemini TTS (unlimited, realistic)
    const geminiOk = await speakGeminiTTS(text, mySpeakId, callbacks);
    if (geminiOk) return;

    // Tier 2: ElevenLabs (limited monthly chars)
    if (currentSpeakId === mySpeakId) {
        const elevenlabsOk = await speakElevenLabs(text, mySpeakId, callbacks);
        if (elevenlabsOk) return;
    }

    // Tier 3: Web Speech API (always available fallback)
    if (currentSpeakId === mySpeakId) {
        speakWebSpeech(text, callbacks);
    }
}

/** Global registry of active audio elements across all tiers */
const activeAudioElements: HTMLAudioElement[] = [];

function trackAudio(audio: HTMLAudioElement) {
    activeAudioElements.push(audio);
    audio.addEventListener('ended', () => {
        const idx = activeAudioElements.indexOf(audio);
        if (idx !== -1) activeAudioElements.splice(idx, 1);
    });
}

/** Stop all currently playing audio across all tiers */
export function stopSpeaking(): void {
    // Kill Web Speech
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    // Kill all tracked Audio elements (ElevenLabs / Kokoro)
    while (activeAudioElements.length > 0) {
        const a = activeAudioElements.pop();
        if (a) { try { a.pause(); a.currentTime = 0; } catch {} }
    }
}

/** Returns current month's ElevenLabs character usage info */
export function getElevenLabsUsage(): { used: number; limit: number; remaining: number } {
    const usage = getUsage();
    return {
        used: usage.chars,
        limit: ELEVENLABS_MONTHLY_LIMIT,
        remaining: Math.max(0, ELEVENLABS_MONTHLY_LIMIT - usage.chars),
    };
}
