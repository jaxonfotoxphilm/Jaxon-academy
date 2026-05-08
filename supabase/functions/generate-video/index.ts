import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();

    if (!query) {
      return new Response(JSON.stringify({ error: 'Missing query' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const API_KEY = Deno.env.get('PEXELS_API_KEY');
    if (!API_KEY) {
      return new Response(JSON.stringify({ error: 'PEXELS_API_KEY not configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Fetch from Pexels Video API
    const response = await fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`, {
      headers: {
        'Authorization': API_KEY
      }
    });

    if (!response.ok) {
        throw new Error(`Pexels API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Extract the highest quality HD video link
    let videoUrl = null;
    if (data.videos && data.videos.length > 0) {
        const videoFiles = data.videos[0].video_files;
        // Sort by quality (hd first)
        videoFiles.sort((a: any, b: any) => b.width - a.width);
        videoUrl = videoFiles[0].link;
    }

    return new Response(JSON.stringify({ videoUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error("Pexels Edge Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
