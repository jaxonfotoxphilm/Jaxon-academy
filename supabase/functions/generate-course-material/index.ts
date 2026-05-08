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
    const { gradeLevel, subject, topic } = await req.json();

    if (!gradeLevel || !subject || !topic) {
      return new Response(JSON.stringify({ error: 'Missing gradeLevel, subject, or topic' }), {
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

    const prompt = `
You are the Chief Curriculum Architect for the Nebraska Virtual Academy.
Your task is to generate the official textbook reading material for a student.

Target Student: ${gradeLevel}
Subject Area: ${subject}
Specific Module/Topic: ${topic}

CRITICAL INSTRUCTIONS:
- You MUST strictly align all content, facts, and pedagogical approaches with the official Nebraska Department of Education Academic Standards (NDE) for this exact grade level and subject.
- **STATE MANDATE**: You MUST explicitly cite the exact Nebraska NDE Standard Code (e.g., SS 4.3.1.a) you are fulfilling at the very top of the document under the main title.
- If the subject is Social Studies or History, automatically prioritize Nebraska State History, civics, geography, and economics as required by state law.
- Calibrate your vocabulary, tone, and pacing perfectly for a ${gradeLevel} student.
- DO NOT act like a chatbot. Write this as a highly engaging, professional, and rigorous digital textbook chapter.
- Use Markdown formatting. Include a main title (#), section headers (##), bold text for key terms, and bullet points.
- Include a "Key Vocabulary" section at the end.
- Include a "Critical Thinking Prompt" at the very end to prepare them for their lesson.

Write the comprehensive chapter now.
`;

    const result = await model.generateContent(prompt);
    const content = result.response.text();

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error("Generate Course Material Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
