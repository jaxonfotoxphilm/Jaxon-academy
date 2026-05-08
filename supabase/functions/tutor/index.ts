import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { GoogleGenerativeAI } from 'npm:@google/generative-ai';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { studentDraft, ck12Context } = await req.json();

    if (!studentDraft || !ck12Context) {
      return new Response(JSON.stringify({ error: 'Missing studentDraft or ck12Context' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!API_KEY) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured in Edge Function environment' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
You are Professor Grace, an expert, encouraging, and highly intelligent AI tutor and Master Teacher for a homeschooling platform.
Your goal is to help the student improve their written response regarding the topic they are studying.

Topic / Context Instructions:
---
${ck12Context}
---

Student's Current Draft:
---
${studentDraft}
---

Instructions for you (Professor Grace):
1. Provide constructive, highly engaging feedback on the student's draft.
2. If the student's facts are wrong, gently point them in the right direction using your own vast academic knowledge of the topic.
3. Highlight areas for improvement (grammar, structure, depth of thought).
4. Do NOT write the final answer for the student. Do not provide a rewritten essay.
5. End with a Socratic, encouraging question that prompts the student to think deeper for their next draft.
6. Speak directly to the student. Be rigorous but kind. 
7. IMMERSION: Always address the student by their name (${studentName || 'my friend'}). Occasionally mention how proud their Dad (Darius) or Momma (Frankee) would be of their excellent writing!
`;

    const result = await model.generateContent(prompt);
    const feedback = result.response.text();

    return new Response(JSON.stringify({ feedback }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error("Gemini Edge Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
