const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase client server-side
function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for storage operations

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("Missing Supabase configuration for storage operations");
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

const BUCKET_NAME = "bottle-images";

// Create bucket if it doesn't exist
async function ensureBucketExists(supabase) {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } =
      await supabase.storage.listBuckets();

    if (listError) {
      console.error("Error listing buckets:", listError);
      return { success: false, error: listError.message };
    }

    const bucketExists = buckets.some((bucket) => bucket.name === BUCKET_NAME);

    if (!bucketExists) {
      // Create bucket
      const { data, error: createError } = await supabase.storage.createBucket(
        BUCKET_NAME,
        {
          public: true,
          allowedMimeTypes: [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
          ],
          fileSizeLimit: 5242880, // 5MB
        },
      );

      if (createError) {
        console.error("Error creating bucket:", createError);
        return { success: false, error: createError.message };
      }

      console.log(`Created bucket: ${BUCKET_NAME}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error ensuring bucket exists:", error);
    return { success: false, error: error.message };
  }
}

// Upload file to storage
async function uploadFile(supabase, file, filename) {
  try {
    // Ensure bucket exists
    const bucketResult = await ensureBucketExists(supabase);
    if (!bucketResult.success) {
      return bucketResult;
    }

    // Upload file
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Storage upload error:", error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filename);

    return {
      success: true,
      data: data,
      publicUrl: urlData.publicUrl,
    };
  } catch (error) {
    console.error("Upload error:", error);
    return { success: false, error: error.message };
  }
}

// Delete file from storage
async function deleteFile(supabase, filename) {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filename]);

    if (error) {
      console.error("Storage delete error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Delete error:", error);
    return { success: false, error: error.message };
  }
}

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
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
    const supabase = getSupabaseClient();

    // Handle different routes
    let path = event.path || "";
    if (path.startsWith("/.netlify/functions/storage")) {
      path = path.replace("/.netlify/functions/storage", "");
    } else if (path.startsWith("/api/storage")) {
      path = path.replace("/api/storage", "");
    }

    const method = event.httpMethod;

    // GET /storage/health - Health check
    if (method === "GET" && path === "/health") {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          storage: supabase ? "ready" : "not_configured",
          bucket: BUCKET_NAME,
          message: supabase
            ? "Supabase storage ready"
            : "Supabase not configured - external URLs only",
        }),
      };
    }

    // Return early if Supabase is not configured for operations that need it
    if (!supabase && (method === "POST" || method === "DELETE")) {
      return {
        statusCode: 503,
        headers,
        body: JSON.stringify({
          success: false,
          error:
            "Supabase storage not configured. Only external URLs are supported.",
        }),
      };
    }

    // POST /storage/upload - Upload image
    if (method === "POST" && path === "/upload") {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error:
            "Direct file upload not supported yet. Please use external URLs for now.",
        }),
      };
    }

    // DELETE /storage/delete - Delete image
    if (method === "DELETE" && path === "/delete") {
      let body = {};
      try {
        body = JSON.parse(event.body || "{}");
      } catch (error) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: "Invalid JSON in request body",
          }),
        };
      }

      const { filename } = body;
      if (!filename) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: "Filename is required",
          }),
        };
      }

      if (!supabase) {
        return {
          statusCode: 503,
          headers,
          body: JSON.stringify({
            success: false,
            error: "Supabase storage not configured",
          }),
        };
      }

      const result = await deleteFile(supabase, filename);

      if (result.success) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
          }),
        };
      } else {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            success: false,
            error: result.error,
          }),
        };
      }
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({
        success: false,
        error: `Storage endpoint not found: ${method} ${path}`,
      }),
    };
  } catch (error) {
    console.error("Storage function error:", error);
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
