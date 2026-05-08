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

Your task is to generate exactly 10 sequential story nodes that teach this topic using a highly rigorous, comprehensive school framework. This is a complete module. You must provide exactly 10 nodes.

CRITICAL INSTRUCTIONS (SCHOOL MODULE FRAMEWORK - 10 PAGES):
- **Node 1 (The Hook):** Introduce the topic with a highly engaging, real-world analogy. You MUST address the student by their name (${studentName || 'my friend'}) in this node. Occassionally mention how proud their Dad (Darius) or Momma (Frankee) would be, or relate the topic to their brothers and sisters!
- **Node 2, 4, 7 (Instruction & Deep Dive):** MUST include a highly specific \`youtubeSearchQuery\` to embed an educational video.
- **Node 3, 5 (Guided Practice):** Walk through complex examples with the student step-by-step.
- **Node 6, 8 (Cognitive Drills):** Two rigorous quizzes (isQuiz: true) to test mid-lesson retention.
- **Node 9 (Synthesis):** Bring all the concepts together and explain why it matters.
- **Node 10 (Mastery Assessment):** One final, highly rigorous NSCAS-aligned quiz (isQuiz: true) to prove mastery.

NEBRASKA ALIGNMENT & RIGOR:
- You MUST strictly align all content, facts, and pedagogical approaches with the official Nebraska Department of Education Academic Standards (NDE).
- **STATE MANDATE**: You MUST explicitly cite the exact Nebraska NDE Standard Code (e.g., SS 4.3.1.a or MA 2.1.2) you are fulfilling in the text of Node 1.
- If the subject is Social Studies or History, automatically prioritize Nebraska State History, civics, and geography as required by state law.
- NEVER ask vague questions like "What did we learn?". Make the student THINK. Incorrect options should be highly plausible distractors.

For each node, output a JSON object containing:
- "id": string (unique ID)
- "characterName": "Professor Grace"
- "text": The highly engaging, personalized story paragraph speaking directly to ${studentName || 'the student'}.
- "visualType": Pick one: 'reading-book', 'science-atom', 'math-geometry', 'history-scroll', 'video-nature', 'video-history', 'video-science', 'video-space'
- "imagePrompt": A detailed prompt describing an illustration for this node.
- "youtubeSearchQuery": string (REQUIRED on Nodes 2, 4, 7, 10, and 15, optional elsewhere. Provide the exact search term to find the best educational YouTube video for this specific node's content)
- "isQuiz": boolean (make at least 3 nodes a quiz/drill)
- "isMathInput": boolean (make at least 1 or 2 nodes an interactive fill-in-the-blank or math equation input instead of multiple choice. If true, do NOT provide options. Student must type the exact answer)
- "question": string (only if isQuiz or isMathInput is true, this MUST be a highly specific, rigorous test of knowledge)
- "options": array of EXACTLY 5 strings (only if isQuiz is true and isMathInput is false. Option 5 MUST be "I don't understand, break it down")
- "correctIndex": integer (0, 1, 2, or 3) (only if isQuiz is true and isMathInput is false)
- "correctAnswer": string (only if isMathInput is true. This must be the exact string the student needs to type, e.g., "5", "gravity", "x=2")

Output ONLY valid JSON. The root must be an array of objects.

`;

    const result = await model.generateContent(prompt);
    let text = result.response.text();
    
    // Clean up markdown formatting if Gemini wrapped it in ```json
    text = text.replace(/```json\n?|```\n?/g, '').trim();
    let parsedNodes = JSON.parse(text);
    // If Gemini wrapped the array in an object, extract it
    if (!Array.isArray(parsedNodes)) {
        if (parsedNodes.nodes && Array.isArray(parsedNodes.nodes)) {
            parsedNodes = parsedNodes.nodes;
        } else if (parsedNodes.items && Array.isArray(parsedNodes.items)) {
            parsedNodes = parsedNodes.items;
        } else {
            // Attempt to find the first array in the object values
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
