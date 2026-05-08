import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    
    // We expect the request to be multipart/form-data
    if (!req.headers.get('content-type')?.includes('multipart/form-data')) {
        return new Response(JSON.stringify({ error: 'Content-Type must be multipart/form-data' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file uploaded' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    if (file.type !== 'application/pdf') {
        return new Response(JSON.stringify({ error: 'Only PDF files are allowed' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: authHeader ? { Authorization: authHeader } : {},
        },
    });

    // Generate a unique filename using crypto.randomUUID
    const fileExt = file.name.split('.').pop();
    const uniqueFilename = `${crypto.randomUUID()}.${fileExt}`;

    // Upload the file to the curriculum-assets bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('curriculum-assets')
        .upload(uniqueFilename, file, {
            contentType: file.type,
            upsert: false
        });

    if (uploadError) {
        console.error("Upload Error:", uploadError);
        return new Response(JSON.stringify({ error: 'Failed to upload file to storage', details: uploadError }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }

    // Retrieve the public URL
    const { data: { publicUrl } } = supabase.storage
        .from('curriculum-assets')
        .getPublicUrl(uniqueFilename);

    return new Response(JSON.stringify({ url: publicUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error("Function Error:", error);
    return new Response(JSON.stringify({ error: error.message || 'An unexpected error occurred' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
