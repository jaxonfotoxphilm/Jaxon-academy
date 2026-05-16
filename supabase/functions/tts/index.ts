import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * TTS Edge Function — Uses Gemini 2.5 Flash TTS for realistic voice synthesis.
 * Returns proper WAV audio that the frontend can play directly.
 * 
 * This replaces ElevenLabs (which has a 10k char/month free limit)
 * with Gemini TTS (which uses the same API key as lesson generation).
 */

/** Helper to write ASCII strings into a DataView (for WAV header) */
function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    if (!text?.trim()) {
      return new Response(JSON.stringify({ error: 'Missing text' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!API_KEY) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Truncate very long text to prevent excessive API usage
    const truncated = text.slice(0, 1500);

    /**
     * Creative direction prompt: tells the TTS model HOW to speak.
     * Using inline emotion/style tags supported by Gemini TTS.
     */
    const ttsPrompt = `[cheerful, warm, gentle teacher speaking to young children] Read this aloud with warmth and enthusiasm, like a kind kindergarten teacher: ${truncated}`;

    /**
     * Try multiple TTS model names since Google frequently updates them.
     * Priority: newest → oldest
     */
    const ttsModels = [
      'gemini-2.5-flash-tts',
      'gemini-3.1-flash-tts-preview',
      'gemini-2.5-flash-preview-tts',
    ];

    let response: Response | null = null;
    let usedModel = '';

    for (const model of ttsModels) {
      try {
        console.log(`[tts] Trying model: ${model}`);
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: ttsPrompt }] }],
              generationConfig: {
                response_modalities: ['AUDIO'],
                speech_config: {
                  voice_config: {
                    prebuilt_voice_config: {
                      voice_name: 'Aoede' // Warm, expressive female — great for a teacher
                    }
                  }
                }
              }
            }),
          }
        );

        if (r.ok) {
          response = r;
          usedModel = model;
          break;
        }
        console.log(`[tts] ${model} returned ${r.status}`);
      } catch (e) {
        console.log(`[tts] ${model} error: ${e.message}`);
      }
    }

    if (!response || !response.ok) {
      const errorBody = response ? await response.text() : 'No TTS model available';
      console.error('[tts] Gemini TTS error:', response?.status, errorBody);
      return new Response(JSON.stringify({ error: 'TTS generation failed', details: errorBody.substring(0, 200) }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    console.log(`[tts] ✅ Using model: ${usedModel}`);

    const data = await response.json();
    const audioData = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    const mimeType = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType || 'audio/wav';

    if (!audioData) {
      return new Response(JSON.stringify({ error: 'No audio data returned' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Decode base64 PCM audio from Gemini
    const binaryString = atob(audioData);
    const pcmBytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      pcmBytes[i] = binaryString.charCodeAt(i);
    }

    /**
     * Gemini TTS returns raw PCM (audio/L16, 24kHz, mono, 16-bit).
     * Browsers can't play raw PCM — we must wrap it in a WAV header.
     */
    const sampleRate = 24000;
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    const dataSize = pcmBytes.length;
    const headerSize = 44;

    const wavBuffer = new ArrayBuffer(headerSize + dataSize);
    const view = new DataView(wavBuffer);

    // RIFF header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');

    // fmt sub-chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);        // sub-chunk size
    view.setUint16(20, 1, true);         // PCM format
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);

    // data sub-chunk
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Copy PCM data after the header
    const wavBytes = new Uint8Array(wavBuffer);
    wavBytes.set(pcmBytes, headerSize);

    return new Response(wavBytes, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/wav',
        'Cache-Control': 'public, max-age=3600',
      },
      status: 200,
    });
  } catch (error: any) {
    console.error('[tts] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
