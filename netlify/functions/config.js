exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
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

  // Only allow GET requests
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        success: false,
        error: "Method not allowed",
      }),
    };
  }

  try {
    let path = event.path || "";
    if (path.startsWith("/.netlify/functions/config")) {
      path = path.replace("/.netlify/functions/config", "");
    } else if (path.startsWith("/api/config")) {
      path = path.replace("/api/config", "");
    }

    if (path === "/supabase") {
      // Check for both non-VITE and VITE prefixed environment variables
      const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
      const key =
        process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          isConfigured: Boolean(url && key),
          isInsecureUrl: Boolean(url && String(url).startsWith("http://")),
          url: url ? url : undefined,
          anonKey: key ? key : undefined,
        }),
      };
    }

    if (path === "/email") {
      const fromEmail = process.env.VITE_FROM_EMAIL;
      const hasVerifiedDomain = fromEmail && !fromEmail.includes("resend.dev");
      const isProductionReady =
        hasVerifiedDomain && process.env.NODE_ENV === "production";

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          isConfigured: Boolean(fromEmail),
          hasVerifiedDomain,
          isProductionReady,
          isDevelopment: !isProductionReady,
          status: !fromEmail
            ? "Email not configured"
            : !isProductionReady
              ? "Development mode - emails redirected to test address"
              : "Production mode - emails sent to actual recipients",
        }),
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({
        success: false,
        error: "Config endpoint not found",
      }),
    };
  } catch (error) {
    console.error("Config error:", error);
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
