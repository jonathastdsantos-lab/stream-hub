import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://bhulwmlylatmxkiajjrn.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJodWx3bWx5bGF0bXhraWFqanJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMzMzNTMsImV4cCI6MjA5NDYwOTM1M30.NbdVSowy1mEYDMGcT9yGP4LfCg2PAS1hp-DHvRIQhgc";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
