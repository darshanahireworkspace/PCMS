import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://pxemynoflshyfygtpuha.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4ZW15bm9mbHNoeWZ5Z3RwdWhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzODE3NjIsImV4cCI6MjEwMTk1Nzc2Mn0.ZzcROWlTgMNAFm1vdyNyuRhRDzMci-xKkm5VOUAz5Wk";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
