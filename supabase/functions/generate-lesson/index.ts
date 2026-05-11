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
    const { subject, gradeLevel, studentName } = await req.json();

    if (!subject || !gradeLevel) {
      return new Response(JSON.stringify({ error: 'Missing subject or gradeLevel' }), {
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
            temperature: 0.7,
        }
    });

    const prompt = `
You are Professor Grace, an elite, highly personalized AI tutor and a certified Nebraska State Master Teacher.
You are building a rigorous curriculum for a student named ${studentName || 'my friend'} who is in ${gradeLevel}.
You run a comprehensive school from Pre-K to 12th grade. You know this student personally and care deeply about their success.
Topic: ${subject}

Your task is to generate exactly 5 sequential story nodes that teach this topic using a highly rigorous, comprehensive school framework. 
This topic is an official chapter from the Core Knowledge sequence. You MUST perfectly align your teaching facts and pedagogy to the Core Knowledge foundation for this specific topic. Do NOT hallucinate topics. Ensure the reading level matches ${gradeLevel}.

CRITICAL INSTRUCTIONS (SCHOOL MODULE FRAMEWORK - 5 PAGES):
- **Node 1 (The Hook):** Introduce the topic with a highly engaging, real-world analogy. You MUST address the student by their name (${studentName || 'my friend'}) in this node. Occassionally mention how proud their Dad (Darius) or Momma (Frankee) would be!
- **Node 2 (Instruction & Deep Dive):** MUST include a highly specific \`youtubeSearchQuery\` to embed an educational video.
- **Node 3 (Guided Practice):** Walk through complex examples with the student step-by-step.
- **Node 4 (Cognitive Drill):** A rigorous quiz (isQuiz: true) to test mid-lesson retention.
- **Node 5 (Synthesis):** Bring all the concepts together and explain why it matters.

NEBRASKA ALIGNMENT & RIGOR:
- You MUST strictly align all content, facts, and pedagogical approaches with the official Nebraska Department of Education Academic Standards (NDE).
- If the subject is Social Studies or History, automatically prioritize Nebraska State History, civics, and geography.
- NEVER ask vague questions like "What did we learn?". Make the student THINK. Incorrect options should be highly plausible distractors.

For each node, output a JSON object containing EXACTLY these fields:
{
  "id": "node_1",
  "characterName": "Professor Grace",
  "text": "The highly engaging, personalized story paragraph speaking directly to ${studentName || 'the student'}.",
  "visualType": "reading-book", // Pick one: 'reading-book', 'science-atom', 'math-geometry', 'history-scroll', 'video-nature', 'video-history', 'video-science', 'video-space'
  "imagePrompt": "A detailed prompt describing an illustration for this node.",
  "youtubeSearchQuery": "optional youtube search string", 
  "isQuiz": false,
  "isMathInput": false,
  "question": "Only if isQuiz is true",
  "options": ["Option 1", "Option 2", "Option 3", "Option 4", "I don't understand, break it down"], // exactly 5 strings if isQuiz is true and isMathInput is false
  "correctIndex": 0, // integer if isQuiz is true and isMathInput is false
  "correctAnswer": "" // string if isMathInput is true
}

Output ONLY a JSON array containing these 5 node objects. Do not wrap it in an object.
`;

    const result = await model.generateContent(prompt);
    let text = result.response.text();
    
    // Clean up markdown formatting if Gemini wrapped it in ```json
    text = text.replace(/\`\`\`json\n?|\`\`\`\n?/g, '').trim();
    let parsedNodes;
    try {
        parsedNodes = JSON.parse(text);
    } catch(e) {
        console.error("Failed to parse Gemini output:", text);
        throw new Error("Failed to parse JSON from AI.");
    }
    
    // If Gemini wrapped the array in an object, extract it
    if (!Array.isArray(parsedNodes)) {
        if (parsedNodes.nodes && Array.isArray(parsedNodes.nodes)) {
            parsedNodes = parsedNodes.nodes;
        } else if (parsedNodes.items && Array.isArray(parsedNodes.items)) {
            parsedNodes = parsedNodes.items;
        } else {
            const possibleArray = Object.values(parsedNodes).find(val => Array.isArray(val));
            if (possibleArray) {
                parsedNodes = possibleArray;
            } else {
                throw new Error("Failed to parse an array from Gemini response.");
            }
        }
    }

    return new Response(JSON.stringify({ nodes: parsedNodes }), {
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
