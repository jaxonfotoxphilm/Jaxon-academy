import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { GoogleGenerativeAI } from 'npm:@google/generative-ai';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    if (!text) {
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

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.3, // Low temp for factual quizzes
        }
    });

    const prompt = `
You are Professor Grace. A student just tried to skip the reading! I need you to generate a 1-question multiple-choice reading comprehension quiz based EXCLUSIVELY on the text provided below.

TEXT:
"""
\${text}
"""

Rules for the Quiz:
- The question MUST BE VERY INTENSE AND DIFFICULT. It should test a very specific, minor detail from the text that they would only know if they actually read it carefully. We are teaching them a lesson about skipping!
- Provide exactly 4 options.
- The wrong options should be highly plausible and tricky, using words from the text to confuse students who just skimmed or skipped.
- Do NOT include "I don't understand" or "All of the above" as an option.
- Output ONLY a JSON object with this exact format:
{
  "question": "The intense question here?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctIndex": 0 // index of correct option (0-3)
}
`;

    const result = await model.generateContent(prompt);
    let resultText = result.response.text();
    resultText = resultText.replace(/\`\`\`json\n?|\`\`\`\n?/g, '').trim();

    return new Response(resultText, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error generating skip quiz:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
