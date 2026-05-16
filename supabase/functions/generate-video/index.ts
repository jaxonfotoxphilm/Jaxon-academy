import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { GoogleGenerativeAI } from 'npm:@google/generative-ai';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * generate-video Edge Function
 * 
 * Generates AI cartoon visuals for young learner lessons.
 * Strategy (in priority order):
 * 1. Veo 3.x — full animated video clip with audio (requires paid tier)
 * 2. Gemini native image gen — cartoon illustration via responseModalities
 * 3. Gemini text-described image — returns a detailed cartoon description for Lottie fallback
 */

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!API_KEY) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { prompt, duration = 8, fallbackToImage = true } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'prompt is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const errors: string[] = [];

    // ─── STRATEGY 1: Try Veo video generation ───
    console.log(`[generate-video] Strategy 1: Veo for "${prompt.substring(0, 60)}..."`);
    const veoResult = await tryVeo(API_KEY, prompt, duration);
    if (veoResult.success) {
      return jsonResponse({ type: 'video', mimeType: 'video/mp4', data: veoResult.data, duration });
    }
    errors.push(`Veo: ${veoResult.error}`);

    // ─── STRATEGY 2: Try Gemini image generation (multiple models) ───
    if (fallbackToImage) {
      console.log(`[generate-video] Strategy 2: Gemini image generation`);
      const imageResult = await tryGeminiImage(API_KEY, prompt);
      if (imageResult.success) {
        return jsonResponse({ type: 'image', mimeType: imageResult.mimeType, data: imageResult.data });
      }
      errors.push(`Image: ${imageResult.error}`);
    }

    // ─── ALL STRATEGIES FAILED ───
    return jsonResponse({ type: 'error', errors, error: errors.join(' | ') });

  } catch (error) {
    console.error('[generate-video] Fatal:', error);
    return new Response(JSON.stringify({ type: 'error', error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function jsonResponse(data: any) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}


// ═══════════════════════════════════════════════════════════
// STRATEGY 1: Veo Video Generation
// ═══════════════════════════════════════════════════════════

async function tryVeo(apiKey: string, prompt: string, duration: number): Promise<{
  success: boolean; data?: string; error?: string;
}> {
  const models = ['veo-3.0-generate-preview', 'veo-3.1-generate-preview'];
  
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateVideos?key=${apiKey}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: { aspectRatio: '16:9', personGeneration: 'allow_all', durationSeconds: duration },
        }),
      });

      if (resp.status === 403) return { success: false, error: 'Paid tier required (403)' };
      if (!resp.ok) { 
        const t = await resp.text();
        console.log(`[Veo] ${model} ${resp.status}: ${t.substring(0, 100)}`);
        continue; 
      }

      const data = await resp.json();
      
      // Direct return
      const directVideo = data?.generatedVideos?.[0]?.video?.bytesBase64Encoded
        || data?.videos?.[0]?.video?.bytesBase64Encoded;
      if (directVideo) return { success: true, data: directVideo };

      // Long-running operation
      if (data.name) {
        const pollResult = await pollOp(apiKey, data.name);
        if (pollResult.success) return pollResult;
      }
    } catch (e) {
      console.log(`[Veo] ${model} error: ${e.message}`);
    }
  }

  return { success: false, error: 'No Veo model available' };
}

async function pollOp(apiKey: string, opName: string): Promise<{
  success: boolean; data?: string; error?: string;
}> {
  for (let i = 0; i < 24; i++) {
    await new Promise(r => setTimeout(r, 5000));
    try {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/${opName}?key=${apiKey}`);
      if (!resp.ok) continue;
      const d = await resp.json();
      if (d.done) {
        const r = d.response || d.result || d;
        const v = r?.generatedVideos?.[0]?.video;
        if (v?.bytesBase64Encoded) return { success: true, data: v.bytesBase64Encoded };
        if (v?.uri) {
          const vr = await fetch(v.uri);
          if (vr.ok) {
            const buf = new Uint8Array(await vr.arrayBuffer());
            let s = ''; for (let j = 0; j < buf.length; j += 8192) s += String.fromCharCode(...buf.subarray(j, j + 8192));
            return { success: true, data: btoa(s) };
          }
        }
        return { success: false, error: 'Op done but no video data' };
      }
    } catch { /* retry */ }
  }
  return { success: false, error: 'Timed out (120s)' };
}


// ═══════════════════════════════════════════════════════════
// STRATEGY 2: Gemini Image Generation
// ═══════════════════════════════════════════════════════════

async function tryGeminiImage(apiKey: string, prompt: string): Promise<{
  success: boolean; data?: string; mimeType?: string; error?: string;
}> {
  const imagePrompt = `Generate a children's cartoon illustration: ${prompt}. Style: bright vibrant colors, cute cartoon characters, children's picture book, simple rounded shapes, warm friendly, ages 3-6.`;
  
  // Approach A: Use Gemini models with IMAGE response modality
  const imageGenModels = [
    'gemini-2.5-flash-image',
    'gemini-2.5-flash-preview-image-generation',
    'gemini-2.0-flash-preview-image-generation',
    'gemini-2.0-flash-exp',
  ];

  for (const model of imageGenModels) {
    try {
      console.log(`[Image] Trying ${model} with responseModalities...`);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: imagePrompt }] }],
          generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
        }),
      });

      if (!resp.ok) {
        console.log(`[Image] ${model}: ${resp.status} ${(await resp.text()).substring(0, 100)}`);
        continue;
      }

      const data = await resp.json();
      const parts = data.candidates?.[0]?.content?.parts || [];
      for (const p of parts) {
        if (p.inlineData?.mimeType?.startsWith('image/')) {
          console.log(`[Image] ${model} success!`);
          return { success: true, data: p.inlineData.data, mimeType: p.inlineData.mimeType };
        }
      }
      console.log(`[Image] ${model}: No image in response parts`);
    } catch (e) {
      console.log(`[Image] ${model} error: ${e.message}`);
    }
  }

  // Approach B: Use Imagen model directly
  try {
    console.log(`[Image] Trying imagen-3.0-generate-002...`);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt: imagePrompt }],
        parameters: { sampleCount: 1 },
      }),
    });

    if (resp.ok) {
      const data = await resp.json();
      const pred = data.predictions?.[0];
      if (pred?.bytesBase64Encoded) {
        return { success: true, data: pred.bytesBase64Encoded, mimeType: 'image/png' };
      }
    } else {
      console.log(`[Image] imagen-3.0: ${resp.status} ${(await resp.text()).substring(0, 100)}`);
    }
  } catch (e) {
    console.log(`[Image] imagen-3.0 error: ${e.message}`);
  }

  // Approach C: Use the GoogleGenerativeAI SDK with gemini-2.5-flash (already known to work)
  // This generates a DESCRIPTION of what the cartoon should look like, for client-side rendering
  try {
    console.log(`[Image] Trying SDK approach with gemini-2.5-flash...`);
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(
      `Describe in vivid detail a children's cartoon scene for this lesson topic: ${prompt}. ` +
      `Include: characters, colors, objects, background, mood. Keep it under 100 words. ` +
      `This description will be used to generate an illustration.`
    );
    const description = result.response.text();
    if (description) {
      console.log(`[Image] SDK generated description: ${description.substring(0, 100)}...`);
      // Return as a "description" type — frontend will use this for enhanced Lottie selection
      return { success: false, error: `No image model available. Description: ${description.substring(0, 200)}` };
    }
  } catch (e) {
    console.log(`[Image] SDK error: ${e.message}`);
  }

  return { success: false, error: 'No image generation model available' };
}
