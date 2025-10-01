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

// Create new order
async function createOrder(orderData) {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("Orders")
      .insert([orderData])
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: error.message || "Failed to create order",
      };
    }

    return {
      success: true,
      order: data,
    };
  } catch (error) {
    console.error("Error in createOrder:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Get all orders
async function getOrders() {
  try {
    const supabase = getSupabaseClient();

    const { data: orders, error } = await supabase
      .from("Orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return {
        success: false,
        error: error.message || "Failed to fetch orders",
      };
    }

    return {
      success: true,
      orders: orders || [],
    };
  } catch (error) {
    console.error("Error in getOrders:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Update order status
async function updateOrderStatus(id, status, note) {
  try {
    const supabase = getSupabaseClient();

    const updateData = { status };
    if (note) {
      updateData.notes = note;
    }

    const { data, error } = await supabase
      .from("Orders")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: error.message || "Failed to update order status",
      };
    }

    return {
      success: true,
      order: data,
    };
  } catch (error) {
    console.error("Error in updateOrderStatus:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Delete order by ID
async function deleteOrder(id) {
  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase.from("Orders").delete().eq("id", id);

    if (error) {
      return {
        success: false,
        error: error.message || "Failed to delete order",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error in deleteOrder:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Delete order by order number
async function deleteOrderByNumber(orderNumber) {
  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from("Orders")
      .delete()
      .eq("order_number", orderNumber);

    if (error) {
      return {
        success: false,
        error: error.message || "Failed to delete order",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error in deleteOrderByNumber:", error);
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
    if (path.startsWith("/.netlify/functions/orders")) {
      path = path.replace("/.netlify/functions/orders", "");
    } else if (path.startsWith("/api/orders")) {
      path = path.replace("/api/orders", "");
    }

    const method = event.httpMethod;
    const body = event.body ? JSON.parse(event.body) : {};

    // GET /orders
    if (method === "GET" && (path === "" || path === "/")) {
      const result = await getOrders();

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

    // POST /orders (create new order)
    if (method === "POST" && (path === "" || path === "/")) {
      if (!body.orderNumber || !body.customerName || !body.email) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: "Order number, customer name, and email are required",
          }),
        };
      }

      // Calculate total price from bottles ordered if not provided
      let totalPrice = body.totalPrice;
      if (
        !totalPrice &&
        body.bottlesOrdered &&
        Array.isArray(body.bottlesOrdered)
      ) {
        totalPrice = body.bottlesOrdered.reduce((sum, bottle) => {
          return (
            sum +
            (bottle.total_price ||
              bottle.price_per_bottle * bottle.quantity ||
              0)
          );
        }, 0);
      }

      // Map camelCase frontend fields to snake_case database fields
      const orderData = {
        order_number: body.orderNumber,
        customer_name: body.customerName,
        email: body.email,
        phone: body.phone,
        pickup_date: body.pickupDate,
        pickup_time: body.pickupTime,
        payment_method: body.paymentMethod,
        notes: body.orderNotes,
        bottles_ordered: body.bottlesOrdered, // Map bottlesOrdered to bottles_ordered
        status: "Pending",
        total_price: totalPrice,
      };

      const result = await createOrder(orderData);

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

    // PUT /orders/:id/status
    if (method === "PUT" && path.includes("/status")) {
      const id = path.split("/")[1]; // Extract ID from path like /abc123/status
      const { status, note } = body;

      if (!status) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: "Status is required",
          }),
        };
      }

      const result = await updateOrderStatus(id, status, note);

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

    // DELETE /orders/:id
    if (
      method === "DELETE" &&
      path.startsWith("/") &&
      !path.includes("/by-number/")
    ) {
      const id = path.substring(1); // Remove leading slash
      const result = await deleteOrder(id);

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

    // DELETE /orders/by-number/:orderNumber
    if (method === "DELETE" && path.startsWith("/by-number/")) {
      const orderNumber = decodeURIComponent(
        path.substring("/by-number/".length),
      );
      const result = await deleteOrderByNumber(orderNumber);

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
        error: "Orders endpoint not found",
      }),
    };
  } catch (error) {
    console.error("Orders error:", error);
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
