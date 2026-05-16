import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { GoogleGenerativeAI } from 'npm:@google/generative-ai';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Scrape a Core Knowledge teacher guide page to extract real curriculum content.
 * Extracts: unit description, key topics, lesson count, PDF download links.
 * Returns null if the page can't be fetched (the AI will still generate, just without context).
 */
async function scrapeTeacherGuide(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'JaxonAcademy/1.0 (Educational Curriculum Scraper)' },
    });
    clearTimeout(timeout);

    if (!response.ok) return null;
    const html = await response.text();

    // Extract the main content area — everything between the resource title and the footer
    const mainContent = html
      // Strip HTML tags but preserve text
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#8217;/g, "'")
      .replace(/&#8220;|&#8221;/g, '"')
      .replace(/&#8211;|&#8212;/g, '—')
      .replace(/\s+/g, ' ')
      .trim();

    // Find the relevant curriculum section — look for key phrases
    const focusMatch = mainContent.match(/Focus:\s*([\s\S]{50,800}?)(?:Note:|Number of Lessons:|Students will|Additional Search)/i);
    const lessonsMatch = mainContent.match(/Number of Lessons:\s*(\d+)/i);
    const timeMatch = mainContent.match(/Instruction Time:\s*(.*?)(?:\.|Additional)/i);
    const searchTermsMatch = mainContent.match(/Additional Search Terms:\s*(.*?)(?:Download|Individual)/i);
    const studentsWillMatch = mainContent.match(/Students will\s*([\s\S]{20,400}?)(?:Note:|Number of Lessons:|Additional Search)/i);

    /**
     * Extract ALL PDF links from the page, then categorize them.
     * Core Knowledge uses varied naming: TG (Teacher Guide), AB (Activity Book),
     * AP (Activity Pages), FB (Flip Book), Online-Resources, etc.
     */
    const allPdfLinks = [...html.matchAll(/href="([^"]*\.pdf)"/gi)].map(m => m[1]);
    
    // Categorize: Teacher Guide vs Student Material (Activity Book / Student Book / Student Reader)
    let tgPdf = '';
    let abPdf = '';
    for (const link of allPdfLinks) {
      const filename = link.split('/').pop()?.toUpperCase() || '';
      // Skip supplemental/online-resources PDFs
      if (filename.includes('ONLINE') || filename.includes('_ORG')) continue;
      
      if (!tgPdf && (filename.includes('_TG') || filename.includes('TEACHER'))) {
        tgPdf = link;
      }
      // Student-facing material: Activity Book (_AB), Activity Pages (_AP), Student Book (_SB),
      // Student Reader (_SR), Flip Book (_FB)
      if (!abPdf && (filename.includes('_AB') || filename.includes('_AP') || filename.includes('_SB') || filename.includes('_SR') || filename.includes('ACTIVITY') || filename.includes('_FB'))) {
        abPdf = link;
      }
    }

    if (!focusMatch && !studentsWillMatch && !tgPdf && !abPdf) return null;

    let context = `=== CORE KNOWLEDGE TEACHER GUIDE CONTENT ===\n`;
    if (focusMatch) context += `\nUNIT DESCRIPTION:\n${focusMatch[1].trim()}\n`;
    if (studentsWillMatch) context += `\nSTUDENT OBJECTIVES:\nStudents will ${studentsWillMatch[1].trim()}\n`;
    if (lessonsMatch) context += `\nNUMBER OF LESSONS: ${lessonsMatch[1]}\n`;
    if (timeMatch) context += `INSTRUCTION TIME: ${timeMatch[1].trim()}\n`;
    if (searchTermsMatch) context += `KEY VOCABULARY/TOPICS: ${searchTermsMatch[1].trim()}\n`;
    if (tgPdf) context += `\nTEACHER GUIDE PDF: ${tgPdf}\n`;
    if (abPdf) context += `ACTIVITY BOOK PDF: ${abPdf}\n`;
    context += `\n=== END TEACHER GUIDE CONTENT ===`;

    return context;
  } catch (err) {
    console.warn('[generate-lesson] Failed to scrape teacher guide:', err);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { subject, gradeLevel, studentName, teacherGuideUrl } = await req.json();

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

    // Scrape real teacher guide content if URL is provided
    let teacherGuideContext = '';
    if (teacherGuideUrl) {
      const scraped = await scrapeTeacherGuide(teacherGuideUrl);
      if (scraped) {
        teacherGuideContext = scraped;
        console.log('[generate-lesson] Successfully scraped teacher guide content');
      } else {
        console.warn('[generate-lesson] Could not scrape teacher guide, generating without context');
      }
    }
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.7,
        }
    });

    // Build the prompt — with or without teacher guide context
    const hasContext = teacherGuideContext.length > 0;

    // Extract PDF links from scraped context — these get embedded in the UI, NOT in the text
    const tgPdfUrl = teacherGuideContext.match(/TEACHER GUIDE PDF:\s*(.*)/)?.[1]?.trim() || '';
    const abPdfUrl = teacherGuideContext.match(/ACTIVITY BOOK PDF:\s*(.*)/)?.[1]?.trim() || '';

    // Strip PDF lines from the context passed to the AI so it doesn't mention them
    let cleanedContext = teacherGuideContext
      .replace(/TEACHER GUIDE PDF:.*\n?/i, '')
      .replace(/ACTIVITY BOOK PDF:.*\n?/i, '');

    // Detect young learner grades for age-appropriate lesson format
    const isYoungLearner = gradeLevel.toLowerCase().includes('pre-k') || 
                           gradeLevel.toLowerCase().includes('kindergarten') ||
                           gradeLevel === 'PK' || gradeLevel === 'K' ||
                           gradeLevel === 'grade-PK' || gradeLevel === 'grade-K';

    let prompt: string;

    if (isYoungLearner) {
      /**
       * YOUNG LEARNER PROMPT — Pre-K & Kindergarten
       * Visual-first, audio-driven, minimal reading required.
       * Uses interactionType for game nodes instead of text-heavy quizzes.
       */
      prompt = `
You are Professor Grace — a super fun, warm, silly teacher for very young children (ages 3–6).
Student name: ${studentName || 'sweetie'}
Grade: ${gradeLevel}
Topic: ${subject}

${hasContext ? `
USE THIS REAL CURRICULUM DATA to build the lesson. Do NOT invent topics outside of it.
${cleanedContext}
` : `
Align to the Core Knowledge curriculum for ${gradeLevel}. Stick to real facts for this topic.
`}

CRITICAL RULES FOR YOUNG LEARNERS:
- The student CANNOT READ. Every single word you write will be READ ALOUD to them by a voice engine.
- Each node's "text" MUST be 3–5 short sentences (30–60 words). Talk like you're speaking to a 4-year-old, but tell a much richer, longer story.
- Use simple words: "big", "small", "happy", "look!" — not "observe", "identify", "characteristics".
- Be SILLY and FUN. Use sound effects in your speech: "Whoooosh!", "Splash!", "Roarrr!"
- Ask the child to DO things: "Can you clap your hands?", "Point to the red one!", "Let's count together!"
- NEVER mention reading, Activity Books, PDFs, textbooks, downloads, teachers, parents, or curriculum.
- NEVER use bullet points or lists — just speak naturally.

LESSON STRUCTURE — Generate exactly 48 nodes (making the lesson an epic, incredibly comprehensive journey):

- **Node 1 (🎉 Hello!):** Greet ${studentName} with EXCITEMENT. "Hey ${studentName}! Guess what we get to learn about today?" Tell them the topic. interactionType: "listen"
- **Node 2-15 (🎵 Story/Song):** Tell an epic, massive, engaging story or sing a very long multi-part song about the topic. Make it silly and memorable. Take your time building the narrative across these 14 nodes. interactionType: "listen"
- **Node 16-30 (👀 Look & Learn):** Teach multiple simple concepts with vivid descriptions the child can picture. Break the concepts down across these 15 nodes. interactionType: "listen"
- **Node 31-38 (🎮 Game Time!):** Interactive tap-to-match games. Ask simple questions with 4 picture-based options. interactionType: "tap-match". The questions should be about what they just learned.
- **Node 39-44 (🔢 Count/Sort & Learn More!):** Counting or sorting games. interactionType: "tap-count".
- **Node 45-47 (🌟 Fun Facts!):** Three more extremely fun, silly facts to wrap up the lesson. interactionType: "listen".
- **Node 48 (🎊 You Did It!):** Celebrate! "Wow ${studentName}, you are SO SMART! You learned about ___! Give yourself a big hug!" interactionType: "listen"

JSON FORMAT — output ONLY a JSON array of exactly 48 objects with these EXACT fields:
{
  "id": "node_1",
  "characterName": "Professor Grace",
  "text": "Very short text spoken aloud to the child.",
  "imagePrompt": "DETAILED cartoon illustration description. Use: bright colors, cute cartoon style, large simple shapes, friendly animal characters, children's picture book aesthetic. Example: 'A cheerful cartoon sun smiling over a green hill with three colorful flowers — one red, one yellow, one blue. Cute ladybug sitting on a leaf. Children's picture book illustration, bright saturated colors, simple rounded shapes.'",
  "interactionType": "listen",
  "isQuiz": false,
  "question": "",
  "options": [],
  "correctIndex": 0,
  "interactionData": {}
}

For "tap-match" nodes (Node 4): set isQuiz to true, put a simple question in "question" (e.g., "Which one is a plant?"), provide exactly 4 options that are SHORT (1-3 words each, like "🌱 Plant", "🐟 Fish", "🚗 Car", "⭐ Star"), set correctIndex (0-3). Also set interactionData: { "type": "tap-match" }.

For "tap-count" nodes (Node 5): set isQuiz to true, put a counting question in "question" (e.g., "How many butterflies do you see?"), provide 4 number options as strings (e.g., ["1", "2", "3", "4"]), set correctIndex. Also set interactionData: { "type": "tap-count", "correctAnswer": 3 }.

Output ONLY the JSON array. No wrapper object. No markdown.
`;
    } else {
      // Standard prompt for older students (Grades 1-8)
      prompt = `
You are Professor Grace — a warm, encouraging tutor who speaks directly to the student like a favorite teacher.
Student name: ${studentName || 'my friend'}
Grade: ${gradeLevel}
Topic: ${subject}

${hasContext ? `
USE THIS REAL CURRICULUM DATA to build the lesson. Do NOT invent topics outside of it.
${cleanedContext}
` : `
Align to the Core Knowledge curriculum for ${gradeLevel}. Stick to real facts for this topic.
`}

TONE & LENGTH RULES (CRITICAL — READ CAREFULLY):
- You are talking TO the student, not writing an essay. Be warm, clear, and direct.
- Each node's "text" must be 4–8 full paragraphs (150–300 words total for younger grades, 200–400 words for middle school). We need LONG, comprehensive, very detailed lessons!
- Use simple sentences, but explain things deeply and thoroughly.
- NEVER mention "teacher guide", "teacher", "parent", "prep metrics", "curriculum", "download", or "PDF".
- NEVER say "In this lesson you will learn..." — just START teaching.
- Use encouraging language: "Great question!", "You're doing amazing!", "Let's figure this out together!"
- When referring to reading materials, say "your Activity Book" (it's already open for them in the app).
- You MUST reference specific lesson numbers and sections. Based on the curriculum data, identify which Lesson number this topic corresponds to.

LESSON STRUCTURE — Generate exactly 48 nodes:

- **Node 1 (📋 Welcome):** Greet ${studentName} warmly. Tell them what today's topic is. Tell them which Lesson number to open in their Activity Book.
- **Node 2-5 (🎯 Hook & Context):** A fun, relatable hook and incredibly deep context. Paint a vivid picture of why this matters across 4 nodes.
- **Node 6-30 (📖 Learn — Deep Dive):** Teach the CORE content exhaustively across these 25 nodes. Real facts, real vocabulary, real knowledge. Go extremely deep into the subject matter. Cover every angle.
- **Node 31-36 (🤔 Check):** Six quiz questions (isQuiz: true) testing what was just taught. Start with: "You can check your Activity Book if you need to look something up!" Make wrong answers plausible. Last option MUST be "I don't understand yet, can you explain again?"
- **Node 37-47 (✍️ Practice & Application):** Guide the student through extensive examples or activities. Reference the Activity Book: "Try the practice exercise in your Activity Book for this section." Walk them through it step-by-step across 11 nodes.
- **Node 48 (🎓 Wrap Up):** Celebrate what they learned. Summarize the biggest takeaways in bullet points. End with encouragement.

JSON FORMAT — output ONLY a JSON array of exactly 48 objects, each with these exact fields:
{
  "id": "node_1",
  "characterName": "Professor Grace",
  "text": "Detailed, friendly content.",
  "visualType": "reading-book",
  "imagePrompt": "A detailed illustration prompt for this node.",
  "isQuiz": false,
  "isMathInput": false,
  "question": "",
  "options": [],
  "correctIndex": 0,
  "correctAnswer": ""
}

For quiz nodes (Node 4): set isQuiz to true, put the question in "question", provide exactly 5 options, and set correctIndex (0-3). Option 5 is always "I don't understand yet, can you explain again?"

Output ONLY the JSON array. No wrapper object. No markdown.
`;
    }

    const result = await model.generateContent(prompt);
    let text = result.response.text();
    
    // Clean up markdown formatting if Gemini wrapped it in \`\`\`json
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

    /**
     * Build lesson-level PDF resources for the frontend to embed in a persistent panel.
     * The AI never sees these URLs — they're handled purely in the UI layer.
     */
    // Only the Activity Book goes to the student. Teacher Guide is for the principal/parent only.
    const pdfResources: { label: string; url: string }[] = [];
    if (abPdfUrl) pdfResources.push({ label: 'Activity Book', url: abPdfUrl });

    /**
     * Extract lesson/chapter info so the materials panel can show navigation hints.
     * The subject name often contains the unit/domain number (e.g., "CKLA Domain 3" or "Unit 2").
     */
    const unitMatch = subject.match(/(?:Unit|Domain)\s*(\d+)/i);
    const lessonsCountMatch = teacherGuideContext.match(/NUMBER OF LESSONS:\s*(\d+)/i);
    const lessonInfo = {
      unitName: subject,
      unitNumber: unitMatch ? unitMatch[1] : '1',
      totalLessons: lessonsCountMatch ? parseInt(lessonsCountMatch[1]) : null,
      chapterHint: `This is ${unitMatch ? `Unit ${unitMatch[1]}` : subject}. Your Activity Book follows the same lesson order — start at Lesson 1 and work through each section.`,
    };

    return new Response(JSON.stringify({ nodes: parsedNodes, pdfResources, lessonInfo }), {
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
