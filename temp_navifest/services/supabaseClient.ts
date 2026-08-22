import { createClient } from '@supabase/supabase-js';

// Credentials provided
const PROVIDED_URL = 'https://nmmneftndifrxfuwwwdo.supabase.co';
const PROVIDED_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tbW5lZnRuZGlmcnhmdXd3d2RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NTAxNTksImV4cCI6MjA4MTEyNjE1OX0.rjIwG2OieEe00djG2RJjZQMZchbkV2DI7_VMsJkyvHI';

// Force usage of provided keys if env vars are missing
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || PROVIDED_URL;
const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || PROVIDED_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase URL or Key is missing!");
}

// Create and export client directly
export const supabase = createClient(supabaseUrl, supabaseKey);