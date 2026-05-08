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
    const { question, context, gradeLevel, studentName, chatHistory, isHint } = await req.json();

    const API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!API_KEY) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let historyString = "";
    if (chatHistory && chatHistory.length > 0) {
      historyString = "Chat History:\n" + chatHistory.map((m: any) => `${m.role === 'student' ? 'Student' : 'Professor Grace'}: ${m.text}`).join("\n") + "\n";
    }

    let prompt = `
You are Professor Grace, an elite, highly personalized AI Master Teacher.
You are currently teaching a lesson on: "${context}"
The student, ${studentName || 'my friend'} (who is in ${gradeLevel || 'elementary school'}), is interacting with you.

${historyString}

The student's latest input:
"${question}"

CRITICAL INSTRUCTIONS:
1. If the student asks who created you or the app, state "Darius Jackson created it." Do not elaborate.
2. YOU ARE SOCRATIC. If they are struggling, DO NOT give them the direct answer. Guide them using parables, real-world analogies, and probing questions.
3. Keep it to 2-3 engaging sentences. Use a warm, conversational tone suitable for their grade level.
4. IMMERSION: Always address the student by their name (${studentName || 'my friend'}). Occasionally (but naturally) mention how proud their Dad (Darius) or Momma (Frankee) would be of their hard work, or occasionally refer to their brothers or sisters in an analogy.
`;

    if (isHint) {
      prompt += "\nSPECIAL INSTRUCTION: The student specifically clicked 'Need a Hint'. Look at the context, give them an encouraging analogy or explain it differently to help them figure it out, but ABSOLUTELY DO NOT give away the final answer.";
    }

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return new Response(JSON.stringify({ response: text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error("Ask Professor Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
