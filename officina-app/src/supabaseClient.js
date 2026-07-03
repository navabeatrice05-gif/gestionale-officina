import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Variabili d'ambiente Supabase mancanti. Crea un file .env con VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (vedi .env.example)."
  );
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");
