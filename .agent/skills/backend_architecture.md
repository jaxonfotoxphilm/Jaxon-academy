# Skill: Supabase & Deno Edge Function Standards

Context: Building a comprehensive homeschooling app backend for curriculum and admin tracking.
Stack: Supabase, Deno Edge Functions, Gemini API.
Rules:
Storage: All curriculum materials (PDFs/guides) must route to Supabase public storage buckets. Do not store files in the database.

Language: Enforce strict TypeScript for all Deno Edge Functions. No vanilla JS.

Testing: Isolate unit tests for all edge functions.

AI: Keep Gemini API prompt structures modular and separated from routing logic.
