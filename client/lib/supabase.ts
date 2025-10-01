// Legacy Supabase client - now replaced with secure API endpoints
// This file maintains compatibility while preventing environment variable exposure

import {
  secureSupabase,
  isSupabaseConfigured as secureIsConfigured,
  isSupabaseInsecureUrl as secureIsInsecureUrl,
} from "./secureSupabase";

// Redirect to secure client
export const supabase = secureSupabase;

// Configuration helpers that use secure API checks
export async function isSupabaseConfigured(): Promise<boolean> {
  return await secureIsConfigured();
}

export async function isSupabaseInsecureUrl(): Promise<boolean> {
  return await secureIsInsecureUrl();
}

// Check if Supabase is configured (for legacy compatibility)
export function checkSupabaseConfig() {
  return secureSupabase.checkSupabaseConfig();
}

// Note: All environment variables have been moved to serverless functions
// This ensures no sensitive configuration is bundled into the client
