import { createClient } from "@supabase/supabase-js";

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

export async function getBatches() {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("Batches")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, batches: data || [] };
  } catch (err) {
    return { success: false, error: "Failed to fetch batches" };
  }
}

export async function createBatch(batchData: any) {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("Batches")
      .insert([batchData])
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, batch: data };
  } catch (err) {
    return { success: false, error: "Failed to create batch" };
  }
}

export async function updateBatch(id: string, updateData: any) {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("Batches")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, batch: data };
  } catch (err) {
    return { success: false, error: "Failed to update batch" };
  }
}

export async function deleteBatch(id: string) {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from("Batches").delete().eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: "Failed to delete batch" };
  }
}
