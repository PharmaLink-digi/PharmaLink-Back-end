import { createClient } from "@supabase/supabase-js";
import { config } from "../config/env.js";

if (!config.supabase.url || !config.supabase.key) {
  console.warn("Missing Supabase URL or Key. Please check your .env file.");
}

export const supabase = createClient(
  config.supabase.url || "https://placeholder.supabase.co", 
  config.supabase.key || "placeholder_key"
);
