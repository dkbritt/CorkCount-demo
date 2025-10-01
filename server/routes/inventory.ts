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

// Get all inventory for admin dashboard
export async function getAllInventory() {
  try {
    const supabase = getSupabaseClient();

    const { data: inventory, error } = await supabase
      .from("Inventory")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return {
        success: false,
        error: error.message || "Failed to fetch inventory",
      };
    }

    return {
      success: true,
      inventory: inventory || [],
    };
  } catch (err) {
    console.error("Error in getAllInventory:", err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while fetching inventory",
    };
  }
}

// Get available inventory with pagination and field optimization
export async function getAvailableInventory(
  page = 1,
  limit = 50,
  detailed = false,
) {
  try {
    const supabase = getSupabaseClient();

    // Calculate offset
    const offset = (page - 1) * limit;

    // Select fields based on whether detailed info is requested
    const selectFields =
      detailed === true
        ? "id, name, winery, vintage, region, type, price, quantity, rating, description, flavor_notes, image_url, tags"
        : "id, name, winery, vintage, type, price, quantity, image_url";

    const {
      data: inventory,
      error,
      count,
    } = await supabase
      .from("Inventory")
      .select(selectFields, { count: "exact" })
      .gt("quantity", 0)
      .order("name", { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      return {
        success: false,
        error: error.message || "Failed to fetch inventory",
      };
    }

    // Safe JSON parsing function
    const safeParseJSON = (jsonString: any, fallback = []) => {
      try {
        if (!jsonString) return fallback;
        if (Array.isArray(jsonString)) return jsonString;
        return JSON.parse(jsonString);
      } catch (error) {
        console.warn("Invalid JSON in database field:", jsonString);
        return fallback;
      }
    };

    // Convert Supabase inventory data to Wine format
    const wines = (inventory || []).map((item: any) => {
      // Transform based on what fields were actually selected from database
      if (detailed === true) {
        return {
          id: item.id,
          name: item.name || "Unnamed Wine",
          winery: item.winery || "Unknown Winery",
          vintage: item.vintage || new Date().getFullYear(),
          region: item.region || "",
          type: item.type || "Red Wine",
          price: parseFloat(item.price) || 0,
          inStock: parseInt(item.quantity) || 0,
          rating: item.rating || 0,
          description: item.description || "A wonderful wine experience",
          flavorNotes: safeParseJSON(item.flavor_notes, []),
          image: item.image_url || "/placeholder.svg",
          tags: safeParseJSON(item.tags, []),
        };
      }

      // Basic mode: only return fields we selected from database (minimal payload)
      return {
        id: item.id,
        name: item.name || "Unnamed Wine",
        winery: item.winery || "Unknown Winery",
        vintage: item.vintage || new Date().getFullYear(),
        type: item.type || "Red Wine",
        price: parseFloat(item.price) || 0,
        inStock: parseInt(item.quantity) || 0,
        image: item.image_url || "/placeholder.svg",
      };
    });

    return {
      success: true,
      wines,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasMore: (count || 0) > offset + limit,
      },
    };
  } catch (err) {
    console.error("Error in getAvailableInventory:", err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while fetching inventory",
    };
  }
}

// Update inventory quantities (for order processing)
export async function updateInventoryQuantities(
  updates: Array<{ id: string; newQuantity: number }>,
) {
  try {
    const supabase = getSupabaseClient();

    const results = [];
    for (const update of updates) {
      const { error } = await supabase
        .from("Inventory")
        .update({ quantity: update.newQuantity })
        .eq("id", update.id);

      if (error) {
        results.push({
          id: update.id,
          success: false,
          error: error.message,
        });
      } else {
        results.push({
          id: update.id,
          success: true,
        });
      }
    }

    const allSuccessful = results.every((r) => r.success);
    return {
      success: allSuccessful,
      results,
      error: allSuccessful ? undefined : "Some inventory updates failed",
    };
  } catch (err) {
    return {
      success: false,
      error: "An unexpected error occurred while updating inventory",
    };
  }
}

// Add single inventory item
export async function addInventoryItem(itemData: any) {
  try {
    const supabase = getSupabaseClient();

    const { data: newItem, error } = await supabase
      .from("Inventory")
      .insert([
        {
          ...itemData,
          created_at: new Date().toISOString(),
          last_updated: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: error.message || "Failed to add inventory item",
      };
    }

    return {
      success: true,
      item: newItem,
    };
  } catch (err) {
    return {
      success: false,
      error: "An unexpected error occurred while adding inventory item",
    };
  }
}

// Update single inventory item
export async function updateInventoryItem(itemId: string, itemData: any) {
  try {
    const supabase = getSupabaseClient();

    const { data: updatedItem, error } = await supabase
      .from("Inventory")
      .update({
        ...itemData,
        last_updated: new Date().toISOString(),
      })
      .eq("id", itemId)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: error.message || "Failed to update inventory item",
      };
    }

    return {
      success: true,
      item: updatedItem,
    };
  } catch (err) {
    return {
      success: false,
      error: "An unexpected error occurred while updating inventory item",
    };
  }
}

// Delete single inventory item
export async function deleteInventoryItem(itemId: string) {
  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from("Inventory")
      .delete()
      .eq("id", itemId);

    if (error) {
      return {
        success: false,
        error: error.message || "Failed to delete inventory item",
      };
    }

    return {
      success: true,
    };
  } catch (err) {
    return {
      success: false,
      error: "An unexpected error occurred while deleting inventory item",
    };
  }
}
