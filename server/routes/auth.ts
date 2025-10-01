import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client server-side
function getSupabaseClient() {
  // Check for both non-VITE and VITE prefixed environment variables
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase configuration");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

// Admin login endpoint
export async function handleAdminLogin(email: string, password: string) {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    });

    if (error) {
      return {
        success: false,
        error: error.message || "Invalid email or password",
      };
    }

    if (data.user) {
      return {
        success: true,
        user: data.user,
        session: data.session,
      };
    }

    return {
      success: false,
      error: "Authentication failed",
    };
  } catch (err) {
    return {
      success: false,
      error: "An unexpected error occurred during login",
    };
  }
}
