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
    const { imageBase64, mimeType, question } = await req.json();

    if (!imageBase64 || !question) {
      return new Response(JSON.stringify({ error: 'Missing imageBase64 or question' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const API_KEY = Deno.env.get('GOOGLE_CLOUD_API_KEY');
    if (!API_KEY) {
      return new Response(JSON.stringify({ error: 'Missing Gemini API Key' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    // Use the latest vision-capable model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
You are Professor Grace, an elite, encouraging AI tutor.
The student has uploaded a photo of their handwritten work for the following question:
"${question}"

Analyze the handwriting in the image. Identify the steps they took.
If they made a mistake, point out exactly where they went wrong in a supportive, gentle manner without just giving them the final answer.
If they are correct, praise them!

Respond directly to the student in 2-3 sentences.
`;

    const result = await model.generateContent([
        prompt,
        {
            inlineData: {
                data: imageBase64,
                mimeType: mimeType || "image/jpeg"
            }
        }
    ]);

    const responseText = result.response.text();

    return new Response(JSON.stringify({ response: responseText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error("Vision Grader Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
