const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase client server-side
function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase configuration");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

// Get all batches
async function getBatches() {
  try {
    const supabase = getSupabaseClient();

    const { data: batches, error } = await supabase
      .from("Batches")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return {
        success: false,
        error: error.message || "Failed to fetch batches",
      };
    }

    return {
      success: true,
      batches: batches || [],
    };
  } catch (error) {
    console.error("Error in getBatches:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Create new batch
async function createBatch(batchData) {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("Batches")
      .insert([batchData])
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: error.message || "Failed to create batch",
      };
    }

    return {
      success: true,
      batch: data,
    };
  } catch (error) {
    console.error("Error in createBatch:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Update batch
async function updateBatch(id, batchData) {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("Batches")
      .update(batchData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: error.message || "Failed to update batch",
      };
    }

    return {
      success: true,
      batch: data,
    };
  } catch (error) {
    console.error("Error in updateBatch:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Delete batch
async function deleteBatch(id) {
  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase.from("Batches").delete().eq("id", id);

    if (error) {
      return {
        success: false,
        error: error.message || "Failed to delete batch",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error in deleteBatch:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

exports.handler = async (event, context) => {
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
      body: "",
    };
  }

  try {
    // Handle both direct calls and redirected calls
    let path = event.path || "";
    if (path.startsWith("/.netlify/functions/batches")) {
      path = path.replace("/.netlify/functions/batches", "");
    } else if (path.startsWith("/api/batches")) {
      path = path.replace("/api/batches", "");
    }

    const method = event.httpMethod;
    const body = event.body ? JSON.parse(event.body) : {};

    // GET /batches
    if (method === "GET" && (path === "" || path === "/")) {
      const result = await getBatches();

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

    // POST /batches (create new batch)
    if (method === "POST" && (path === "" || path === "/")) {
      const result = await createBatch(body);

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

    // PUT /batches/:id (update batch)
    if (method === "PUT" && path.startsWith("/")) {
      const id = path.substring(1); // Remove leading slash
      const result = await updateBatch(id, body);

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

    // DELETE /batches/:id
    if (method === "DELETE" && path.startsWith("/")) {
      const id = path.substring(1); // Remove leading slash
      const result = await deleteBatch(id);

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
        error: "Batches endpoint not found",
      }),
    };
  } catch (error) {
    console.error("Batches error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: "Internal server error",
      }),
    };
  }
};
