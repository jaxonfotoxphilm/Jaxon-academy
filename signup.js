import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wqdutfydbpauecefaswi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxZHV0ZnlkYnBhdWVjZWZhc3dpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MzE3NDEsImV4cCI6MjA5MzUwNzc0MX0.Kb6_vdG3Xza8hWe_HQBm-vCGt58iW0TQikUhkkUWR6g';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function signUp() {
  const { data, error } = await supabase.auth.signUp({
    email: 'demo2@jaxon.com',
    password: 'password123',
  });
  console.log('Signup result:', { data, error });
}

signUp();
