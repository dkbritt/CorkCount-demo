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

export async function getMetricsData() {
  try {
    const supabase = getSupabaseClient();

    const [invRes, ordRes, batRes] = await Promise.all([
      supabase
        .from("Inventory")
        .select("id,name,type,quantity,created_at,last_updated"),
      supabase
        .from("Orders")
        .select(
          "id,order_number,customer_name,email,bottles_ordered,status,created_at,pickup_date,pickup_time,payment_method,phone,notes",
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("Batches")
        .select(
          "id,name,type,vintage,quantity,aging_notes:aging_notes,created_at,date_started,estimated_aging_time,estimated_aging_unit,status,estimated_bottling",
        ),
    ]);

    const errors: string[] = [];
    if (invRes.error) errors.push(`Inventory: ${invRes.error.message}`);
    if (ordRes.error) errors.push(`Orders: ${ordRes.error.message}`);
    if (batRes.error) errors.push(`Batches: ${batRes.error.message}`);

    return {
      success: errors.length === 0,
      inventory: invRes.data || [],
      orders: ordRes.data || [],
      batches: batRes.data || [],
      error: errors.length ? errors.join("; ") : undefined,
    };
  } catch (err) {
    console.error("Error in getMetricsData:", err);
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to fetch metrics data",
    };
  }
}
