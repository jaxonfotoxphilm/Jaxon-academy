import "jsr:@supabase/functions-js/edge-runtime.d.ts"

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
    const { draftText } = await req.json();

    if (!draftText) {
      return new Response(JSON.stringify({ error: 'Missing draftText' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // In a real implementation, you would use: Deno.env.get('COPYLEAKS_API_KEY')
    // and make a fetch call to the Copyleaks API here.
    
    // Simulate checking logic. 
    // If text is super short, it fails.
    if (draftText.length < 50) {
        return new Response(JSON.stringify({
            originalityScore: 0,
            aiProbability: 0,
            status: 'fail',
            feedback: "Text is too short to accurately assess. Please provide a full draft."
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Simulate random but generally positive results for this demo
    const originality = Math.floor(Math.random() * 20) + 80; // 80-100%
    const aiProb = Math.floor(Math.random() * 15); // 0-15% AI

    const report = {
        originalityScore: originality,
        aiProbability: aiProb,
        status: originality > 50 && aiProb < 30 ? 'pass' : 'fail',
        feedback: `Your draft scored ${originality}% human originality and ${aiProb}% AI probability. Great job!`
    };

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error("Copyleaks Edge Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
