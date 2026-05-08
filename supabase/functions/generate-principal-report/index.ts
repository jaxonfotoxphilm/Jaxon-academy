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
    const { records } = await req.json();

    if (!records || !Array.isArray(records)) {
      return new Response(JSON.stringify({ error: 'Missing records array' }), {
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
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Format the records into a readable string for the AI
    const dataString = records.map(r => `Student: ${r.student_name}, Subject: ${r.subject}, Score: ${r.score}%, Date: ${r.completed_at}`).join('\n');

    const prompt = `
You are an expert educational data analyst assisting the Principal (parent) of a homeschool application.
Here are the recent academic records for the students:

${dataString}

Based on this data, generate a concise, highly insightful "Weekly Analytics Report".
Use Markdown formatting. Do not use huge headers, just bold text and bullet points.
Include the following 3 sections:
1. **Top Achievements**: Highlight the strongest scores or completions.
2. **Areas of Concern**: Highlight any scores below 70% or subjects that students are struggling with. If none, say they are doing great!
3. **Principal's Action Item**: Give ONE specific recommendation for the parent (e.g., "Assign a remedial math lesson for Ayla").

Keep it punchy, professional, and directly actionable.
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return new Response(JSON.stringify({ report: text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error("Principal Report Edge Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
