const { createClient } = require("@supabase/supabase-js");

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

// Get all inventory for admin dashboard with pagination
async function getAllInventory(page = 1, limit = 50) {
  try {
    const supabase = getSupabaseClient();

    // Calculate offset
    const offset = (page - 1) * limit;

    // Get all fields for admin dashboard to support editing
    const {
      data: inventory,
      error,
      count,
    } = await supabase
      .from("Inventory")
      .select("*", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return {
        success: false,
        error: error.message || "Failed to fetch inventory",
      };
    }

    return {
      success: true,
      inventory: inventory || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasMore: (count || 0) > offset + limit,
      },
    };
  } catch (error) {
    console.error("Error in getAllInventory:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Get available inventory for public shop with pagination and essential fields
async function getAvailableInventory(page = 1, limit = 50, detailed = false) {
  try {
    const supabase = getSupabaseClient();

    // Calculate offset
    const offset = (page - 1) * limit;

    // Select fields based on whether detailed info is requested
    const selectFields =
      detailed === true
        ? "id, name, winery, vintage, region, type, price, quantity, rating, description, flavor_notes, image_url, tags"
        : "id, name, winery, vintage, type, price, quantity, image_url, flavor_notes";

    const {
      data: wines,
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
        error: error.message || "Failed to fetch wines",
      };
    }

    // Transform data to match expected wine format
    const transformedWines = (wines || []).map((wine) => {
      // Safe JSON parsing function (only for detailed requests)
      const safeParseJSON = (jsonString, fallback = []) => {
        try {
          if (!jsonString) return fallback;
          if (Array.isArray(jsonString)) return jsonString;
          return JSON.parse(jsonString);
        } catch (error) {
          console.warn("Invalid JSON in database field:", jsonString);
          return fallback;
        }
      };

      // Transform based on what fields were actually selected from database
      if (detailed === true) {
        return {
          id: wine.id,
          name: wine.name,
          winery: wine.winery || "KB Winery",
          vintage: wine.vintage,
          region: wine.region || "",
          type: wine.type,
          price: wine.price,
          inStock: wine.quantity,
          rating: wine.rating || 0,
          description: wine.description || "",
          flavorNotes: wine.flavor_notes || "",
          image: wine.image_url || "/placeholder.svg",
          tags: safeParseJSON(wine.tags, []),
        };
      }

      // Basic mode: only return fields we selected from database (minimal payload)
      return {
        id: wine.id,
        name: wine.name,
        winery: wine.winery || "KB Winery",
        vintage: wine.vintage,
        type: wine.type,
        price: wine.price,
        inStock: wine.quantity,
        image: wine.image_url || "/placeholder.svg",
        flavorNotes: wine.flavor_notes || "",
        description: wine.flavor_notes || "", // Use flavorNotes as description for shop
      };
    });

    return {
      success: true,
      wines: transformedWines,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasMore: (count || 0) > offset + limit,
      },
    };
  } catch (error) {
    console.error("Error in getAvailableInventory:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Get single wine with full details
async function getWineDetails(id) {
  try {
    const supabase = getSupabaseClient();

    const { data: wine, error } = await supabase
      .from("Inventory")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return {
        success: false,
        error: error.message || "Failed to fetch wine details",
      };
    }

    if (!wine) {
      return {
        success: false,
        error: "Wine not found",
      };
    }

    // Safe JSON parsing function
    const safeParseJSON = (jsonString, fallback = []) => {
      try {
        if (!jsonString) return fallback;
        if (Array.isArray(jsonString)) return jsonString;
        return JSON.parse(jsonString);
      } catch (error) {
        console.warn("Invalid JSON in database field:", jsonString);
        return fallback;
      }
    };

    const transformedWine = {
      id: wine.id,
      name: wine.name,
      winery: wine.winery || "KB Winery",
      vintage: wine.vintage,
      region: wine.region || "",
      type: wine.type,
      price: wine.price,
      inStock: wine.quantity,
      rating: wine.rating || 0,
      description: wine.description || "",
      flavorNotes: safeParseJSON(wine.flavor_notes, []),
      image: wine.image_url || "/placeholder.svg",
      tags: safeParseJSON(wine.tags, []),
    };

    return {
      success: true,
      wine: transformedWine,
    };
  } catch (error) {
    console.error("Error in getWineDetails:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Add new inventory item
async function addInventoryItem(itemData) {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("Inventory")
      .insert([itemData])
      .select("id, name, winery, vintage, type, price, quantity")
      .single();

    if (error) {
      return {
        success: false,
        error: error.message || "Failed to add inventory item",
      };
    }

    return {
      success: true,
      item: data,
    };
  } catch (error) {
    console.error("Error in addInventoryItem:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Update inventory item
async function updateInventoryItem(id, itemData) {
  try {
    console.log(
      "Updating inventory item:",
      id,
      "with data keys:",
      Object.keys(itemData),
    );

    const supabase = getSupabaseClient();

    // Validate required fields
    if (!id) {
      return {
        success: false,
        error: "Item ID is required for update",
      };
    }

    // Check if image_url is too large (if it's a data URL)
    if (
      itemData.image_url &&
      typeof itemData.image_url === "string" &&
      itemData.image_url.startsWith("data:")
    ) {
      const sizeInMB = (itemData.image_url.length * 0.75) / (1024 * 1024); // Rough base64 size calculation
      console.log("Image data size:", Math.round(sizeInMB * 100) / 100, "MB");

      if (sizeInMB > 5) {
        console.warn("Large image detected, may cause issues");
      }
    }

    const { data, error } = await supabase
      .from("Inventory")
      .update(itemData)
      .eq("id", id)
      .select(
        "id, name, winery, vintage, type, price, quantity, flavor_notes, batch_id, location, image_url, tags, created_at",
      )
      .single();

    if (error) {
      console.error("Supabase update error:", error);
      return {
        success: false,
        error: error.message || "Failed to update inventory item",
      };
    }

    if (!data) {
      return {
        success: false,
        error: "No item found with the provided ID",
      };
    }

    console.log("Successfully updated inventory item:", data.id);
    return {
      success: true,
      item: data,
    };
  } catch (error) {
    console.error("Error in updateInventoryItem:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Delete inventory item
async function deleteInventoryItem(id) {
  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase.from("Inventory").delete().eq("id", id);

    if (error) {
      return {
        success: false,
        error: error.message || "Failed to delete inventory item",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error in deleteInventoryItem:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Update inventory quantities (bulk update)
async function updateInventoryQuantities(updates) {
  try {
    const supabase = getSupabaseClient();
    const results = [];

    for (const update of updates) {
      const { data, error } = await supabase
        .from("Inventory")
        .update({ quantity: update.newQuantity })
        .eq("id", update.id)
        .select("id, name, quantity")
        .single();

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
          item: data,
        });
      }
    }

    const failedUpdates = results.filter((r) => !r.success);

    return {
      success: failedUpdates.length === 0,
      results,
      errors: failedUpdates.map((f) => f.error),
    };
  } catch (error) {
    console.error("Error in updateInventoryQuantities:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export const handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Content-Type": "application/json",
  };

  // Handle preflight requests
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true }),
    };
  }

  try {
    // Handle both direct calls and redirected calls
    let path = event.path || "";
    if (path.startsWith("/.netlify/functions/inventory")) {
      path = path.replace("/.netlify/functions/inventory", "");
    } else if (path.startsWith("/api/inventory")) {
      path = path.replace("/api/inventory", "");
    }

    const method = event.httpMethod;
    const queryParams = event.queryStringParameters || {};

    // Safe body parsing
    let body = {};
    if (event.body) {
      try {
        body = JSON.parse(event.body);
      } catch (error) {
        console.error("Invalid JSON in request body:", error);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: "Invalid JSON in request body",
          }),
        };
      }
    }

    // GET /inventory/:id (get single wine details)
    if (
      method === "GET" &&
      path.startsWith("/") &&
      path !== "/" &&
      path.length > 1
    ) {
      const id = path.substring(1); // Remove leading slash
      // Check if this looks like a UUID (basic validation)
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      if (uuidRegex.test(id)) {
        const result = await getWineDetails(id);

        if (result.success) {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(result),
          };
        } else {
          return {
            statusCode: result.error === "Wine not found" ? 404 : 500,
            headers,
            body: JSON.stringify(result),
          };
        }
      }
    }

    // GET /inventory (list wines with pagination)
    if (method === "GET" && (path === "" || path === "/")) {
      const {
        admin,
        page = "1",
        limit = "50",
        detailed = "false",
      } = queryParams;

      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50)); // Max 100 items per page
      const isDetailed = detailed === "true" || detailed === true;

      const result =
        admin === "true"
          ? await getAllInventory(pageNum, limitNum)
          : await getAvailableInventory(pageNum, limitNum, isDetailed);

      if (result.success) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result),
        };
      } else {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify(result),
        };
      }
    }

    // POST /inventory (add new item)
    if (method === "POST" && (path === "" || path === "/")) {
      const result = await addInventoryItem(body);

      if (result.success) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result),
        };
      } else {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify(result),
        };
      }
    }

    // PUT /inventory/update (bulk update quantities)
    if (method === "PUT" && path === "/update") {
      const { updates } = body;

      if (!Array.isArray(updates)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: "Updates must be an array",
          }),
        };
      }

      const result = await updateInventoryQuantities(updates);

      if (result.success) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result),
        };
      } else {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify(result),
        };
      }
    }

    // PUT /inventory/:id (update specific item)
    if (method === "PUT" && path.startsWith("/") && path !== "/update") {
      const id = path.substring(1); // Remove leading slash
      const result = await updateInventoryItem(id, body);

      if (result.success) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result),
        };
      } else {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify(result),
        };
      }
    }

    // DELETE /inventory/:id
    if (method === "DELETE" && path.startsWith("/")) {
      const id = path.substring(1); // Remove leading slash
      const result = await deleteInventoryItem(id);

      if (result.success) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result),
        };
      } else {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify(result),
        };
      }
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({
        success: false,
        error: `Inventory endpoint not found: ${method} ${path || "/"}`,
      }),
    };
  } catch (error) {
    console.error("Inventory error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      }),
    };
  }
};
