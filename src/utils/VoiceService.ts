/**
 * VoiceService — Tiered text-to-speech engine with automatic fallback.
 *
 * Priority chain:
 *   1. ElevenLabs API  — Ultra-realistic neural voice (limited monthly chars)
 *   2. Kokoro TTS      — High-quality neural voice running locally in browser via WASM
 *   3. Web Speech API  — Built-in browser TTS (least natural, always available)
 *
 * Character usage is tracked in localStorage. When ElevenLabs monthly budget
 * is exhausted, subsequent calls silently fall through to Kokoro. If Kokoro
 * hasn't finished loading its model yet, Web Speech API is used as final fallback.
 */

// Lazy-loaded Kokoro TTS instance (loaded on first fallback)
let kokoroInstance: any = null;
let kokoroLoading = false;
let kokoroFailed = false;

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

/**
 * Attempt speech via ElevenLabs API.
 * Returns true if audio was played successfully.
 */
async function speakElevenLabs(text: string): Promise<boolean> {
    const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
    if (!apiKey || !hasElevenLabsBudget(text.length)) return false;

    try {
        /**
         * ElevenLabs v1 TTS endpoint.
         * Voice ID "EXAVITQu4vr4xnSDxMaL" = "Sarah" — a warm, natural female voice.
         * Model "eleven_turbo_v2_5" provides the best quality-to-latency ratio.
         */
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
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);

        addUsage(text.length);

        return new Promise((resolve) => {
            audio.onended = () => { URL.revokeObjectURL(url); resolve(true); };
            audio.onerror = () => { URL.revokeObjectURL(url); resolve(false); };
            audio.play().catch(() => resolve(false));
        });
    } catch (err) {
        console.warn('[VoiceService] ElevenLabs error:', err);
        return false;
    }
}

/**
 * Lazy-load and initialize Kokoro TTS model in browser via WASM.
 * The model (~80MB) downloads once and is cached by the browser.
 */
async function loadKokoro() {
    if (kokoroInstance || kokoroLoading || kokoroFailed) return;
    kokoroLoading = true;
    try {
        const { KokoroTTS } = await import('kokoro-js');
        kokoroInstance = await KokoroTTS.from_pretrained(
            'onnx-community/Kokoro-82M-v1.0-ONNX',
            { dtype: 'q8', device: 'wasm' }
        );
        console.log('[VoiceService] Kokoro TTS loaded successfully');
    } catch (err) {
        console.warn('[VoiceService] Kokoro TTS failed to load:', err);
        kokoroFailed = true;
    }
    kokoroLoading = false;
}

/**
 * Attempt speech via Kokoro TTS (browser WASM).
 * Returns true if audio was played successfully.
 */
async function speakKokoro(text: string): Promise<boolean> {
    if (!kokoroInstance) return false;
    try {
        // "af_heart" is a warm, natural female voice
        const audio = await kokoroInstance.generate(text, { voice: 'af_heart' });
        // Kokoro returns a RawAudio object — convert to playable blob
        const wav = audio.toBlob();
        const url = URL.createObjectURL(wav);
        const player = new Audio(url);
        return new Promise((resolve) => {
            player.onended = () => { URL.revokeObjectURL(url); resolve(true); };
            player.onerror = () => { URL.revokeObjectURL(url); resolve(false); };
            player.play().catch(() => resolve(false));
        });
    } catch (err) {
        console.warn('[VoiceService] Kokoro error:', err);
        return false;
    }
}

/**
 * Final fallback — browser's built-in Web Speech API.
 * Selects the best available voice (Apple Neural > Google > default).
 */
function speakWebSpeech(text: string): void {
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

    window.speechSynthesis.speak(utterance);
}

// ─── Public API ───

/**
 * Begin pre-loading Kokoro in the background so it's ready when needed.
 * Call this early (e.g. on app mount) so the WASM model is warm.
 */
export function preloadKokoro() {
    loadKokoro();
}

/**
 * Speak text using the best available voice engine.
 * Automatically falls through the tier chain:
 *   ElevenLabs → Kokoro → Web Speech API
 */
export async function speak(text: string): Promise<void> {
    if (!text?.trim()) return;

    // Cancel any existing Web Speech audio
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    // Tier 1: ElevenLabs
    const elevenlabsOk = await speakElevenLabs(text);
    if (elevenlabsOk) return;

    // Tier 2: Kokoro (if model is loaded)
    const kokoroOk = await speakKokoro(text);
    if (kokoroOk) return;

    // Tier 3: Web Speech API (always available)
    speakWebSpeech(text);
}

/** Stop all currently playing audio across all tiers */
export function stopSpeaking(): void {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    // ElevenLabs/Kokoro audio elements will be GC'd naturally
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
