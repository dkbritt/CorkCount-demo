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

export interface OrderData {
  orderNumber: string;
  customerName: string;
  email: string;
  phone?: string;
  pickupDate: string;
  pickupTime: string;
  paymentMethod: string;
  orderNotes?: string;
  bottlesOrdered: Array<{
    wine_id: string;
    wine_name: string;
    wine_vintage: number;
    wine_winery: string;
    quantity: number;
    price_per_bottle: number;
    total_price: number;
  }>;
}

// Create a new order
export async function createOrder(orderData: OrderData) {
  try {
    const supabase = getSupabaseClient();

    const { data: supabaseOrder, error } = await supabase
      .from("Orders")
      .insert([
        {
          order_number: orderData.orderNumber,
          customer_name: orderData.customerName,
          email: orderData.email,
          phone: orderData.phone || null,
          pickup_date: orderData.pickupDate,
          pickup_time: orderData.pickupTime,
          payment_method: orderData.paymentMethod,
          status: "pending",
          notes: orderData.orderNotes || null,
          bottles_ordered: orderData.bottlesOrdered,
          created_at: new Date().toISOString(),
        },
      ])
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
      order: supabaseOrder,
    };
  } catch (err) {
    return {
      success: false,
      error: "An unexpected error occurred while creating order",
    };
  }
}

// Get orders (for admin dashboard)
export async function getOrders() {
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
  } catch (err) {
    return {
      success: false,
      error: "An unexpected error occurred while fetching orders",
    };
  }
}

// Update order status
export async function updateOrderStatus(
  orderId: string,
  status: string,
  note?: string,
) {
  try {
    const supabase = getSupabaseClient();

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (note) {
      updateData.admin_notes = note;
    }

    const { data: updatedOrder, error } = await supabase
      .from("Orders")
      .update(updateData)
      .eq("id", orderId)
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
      order: updatedOrder,
    };
  } catch (err) {
    return {
      success: false,
      error: "An unexpected error occurred while updating order status",
    };
  }
}

// Delete order
export async function deleteOrder(orderId: string) {
  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase.from("Orders").delete().eq("id", orderId);

    if (error) {
      return {
        success: false,
        error: error.message || "Failed to delete order",
      };
    }

    return {
      success: true,
    };
  } catch (err) {
    return {
      success: false,
      error: "An unexpected error occurred while deleting order",
    };
  }
}

// Delete order by order number
export async function deleteOrderByNumber(orderNumber: string) {
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
  } catch (err) {
    return {
      success: false,
      error: "An unexpected error occurred while deleting order",
    };
  }
}
