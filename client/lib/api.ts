// Demo-only in-memory API. No external calls.

// Types used by UI
type Wine = {
  id: string;
  name: string;
  winery: string;
  vintage: number;
  region?: string;
  type: string;
  price: number;
  inStock: number;
  rating?: number;
  description?: string;
  flavorNotes?: string[];
  image?: string;
  tags?: string[];
};

// Brand
const BRAND = "Foxglove Creek Winery";

// In-memory stores
const demoInventory: Wine[] = [
  {
    id: crypto.randomUUID?.() || `w-${Date.now()}-1`,
    name: "Willamette Valley Pinot Noir",
    winery: BRAND,
    vintage: 2019,
    region: "Oregon, USA",
    type: "Red Wine",
    price: 42,
    inStock: 24,
    rating: 4.6,
    description: "Silky red fruit, rose petal, and forest floor.",
    flavorNotes: ["cherry", "raspberry", "earth", "rose"],
    image: "/placeholder.svg",
    tags: ["pinot", "oregon"],
  },
  {
    id: crypto.randomUUID?.() || `w-${Date.now()}-2`,
    name: "Dry Creek Valley Zinfandel",
    winery: BRAND,
    vintage: 2018,
    region: "California, USA",
    type: "Red Wine",
    price: 28,
    inStock: 40,
    rating: 4.3,
    description: "Bold blackberry, pepper, and vanilla spice.",
    flavorNotes: ["blackberry", "pepper", "vanilla"],
    image: "/placeholder.svg",
    tags: ["zinfandel"],
  },
  {
    id: crypto.randomUUID?.() || `w-${Date.now()}-3`,
    name: "Marlborough Sauvignon Blanc",
    winery: BRAND,
    vintage: 2022,
    region: "New Zealand",
    type: "White Wine",
    price: 19,
    inStock: 36,
    rating: 4.2,
    description: "Citrus, gooseberry, and bright acidity.",
    flavorNotes: ["grapefruit", "gooseberry", "lime"],
    image: "/placeholder.svg",
    tags: ["sauvignon blanc"],
  },
  {
    id: crypto.randomUUID?.() || `w-${Date.now()}-4`,
    name: "Prosecco Superiore",
    winery: BRAND,
    vintage: 2021,
    region: "Veneto, Italy",
    type: "Sparkling Wine",
    price: 17,
    inStock: 50,
    rating: 4.1,
    description: "Crisp green apple and pear with fine mousse.",
    flavorNotes: ["apple", "pear"],
    image: "/placeholder.svg",
    tags: ["sparkling"],
  },
  {
    id: crypto.randomUUID?.() || `w-${Date.now()}-5`,
    name: "Côtes du Rhône Rouge",
    winery: BRAND,
    vintage: 2020,
    region: "Rhône, France",
    type: "Red Wine",
    price: 22,
    inStock: 18,
    rating: 4.0,
    description: "Juicy red fruit and garrigue herbs.",
    flavorNotes: ["strawberry", "herbs"],
    image: "/placeholder.svg",
    tags: ["grenache", "syrah"],
  },
];

let demoOrders: any[] = [];
let demoBatches: any[] = [];

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function notFound(): Response {
  return jsonResponse({ success: false, error: "Endpoint not available in demo" }, 404);
}

function parseBody(init?: RequestInit): any {
  if (!init?.body) return null;
  try {
    return typeof init.body === "string" ? JSON.parse(init.body) : init.body;
  } catch {
    return null;
  }
}

function mapInventoryForCustomer(items: Wine[]) {
  return items
    .filter((i) => (i.inStock || 0) > 0)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((item) => ({
      id: item.id,
      name: item.name,
      winery: item.winery,
      vintage: item.vintage,
      type: item.type,
      price: item.price,
      inStock: item.inStock,
      image: item.image || "/placeholder.svg",
    }));
}

function handleInventory(path: string, init?: RequestInit): Response {
  const method = (init?.method || "GET").toUpperCase();
  if (method === "GET") {
    const isAdmin = /admin=true/.test(path);
    if (isAdmin) {
      return jsonResponse({ success: true, inventory: demoInventory });
    }
    const wines = mapInventoryForCustomer(demoInventory);
    return jsonResponse({ success: true, wines, pagination: { page: 1, limit: wines.length, total: wines.length, totalPages: 1, hasMore: false } });
  }
  if (method === "POST") {
    const body = parseBody(init) || {};
    const newItem: Wine = {
      id: crypto.randomUUID?.() || `w-${Date.now()}`,
      name: body.name || "New Wine",
      winery: body.winery || BRAND,
      vintage: Number(body.vintage) || new Date().getFullYear(),
      region: body.region || "",
      type: body.type || "Red Wine",
      price: Number(body.price) || 0,
      inStock: Number(body.quantity ?? body.inStock ?? 0),
      rating: Number(body.rating) || 0,
      description: body.description || "",
      flavorNotes: body.flavor_notes || body.flavorNotes || [],
      image: body.image_url || body.image || "/placeholder.svg",
      tags: body.tags || [],
    };
    demoInventory.unshift(newItem);
    return jsonResponse({ success: true, item: newItem });
  }
  if (method === "PUT") {
    const m = path.match(/\/inventory\/(.+)$/);
    if (m) {
      const id = m[1];
      const body = parseBody(init) || {};
      const idx = demoInventory.findIndex((i) => i.id === id);
      if (idx === -1) return jsonResponse({ success: false, error: "Item not found" }, 404);
      const updated: Wine = {
        ...demoInventory[idx],
        ...body,
        inStock: Number(body.quantity ?? body.inStock ?? demoInventory[idx].inStock),
        image: body.image_url || body.image || demoInventory[idx].image,
        flavorNotes: body.flavor_notes || body.flavorNotes || demoInventory[idx].flavorNotes,
      };
      demoInventory[idx] = updated;
      return jsonResponse({ success: true, item: updated });
    }
    if (path.includes("/inventory/update")) {
      const body = parseBody(init) || {};
      const updates: Array<{ id: string; newQuantity: number }> = body.updates || [];
      const results = updates.map((u) => {
        const item = demoInventory.find((i) => i.id === u.id);
        if (!item) return { id: u.id, success: false, error: "Item not found" };
        item.inStock = Number(u.newQuantity);
        return { id: u.id, success: true };
      });
      const allSuccessful = results.every((r) => r.success);
      return jsonResponse({ success: allSuccessful, results, error: allSuccessful ? undefined : "Some inventory updates failed" });
    }
  }
  if (method === "DELETE") {
    const m = path.match(/\/inventory\/(.+)$/);
    if (m) {
      const id = m[1];
      const before = demoInventory.length;
      const remained = demoInventory.filter((i) => i.id !== id);
      if (remained.length === before) return jsonResponse({ success: false, error: "Item not found" }, 404);
      (demoInventory as any).length = 0;
      (demoInventory as any).push(...remained);
      return jsonResponse({ success: true });
    }
  }
  return notFound();
}

function handleOrders(path: string, init?: RequestInit): Response {
  const method = (init?.method || "GET").toUpperCase();
  if (method === "GET") {
    return jsonResponse({ success: true, orders: demoOrders });
  }
  if (method === "POST") {
    const body = parseBody(init) || {};
    const order = {
      id: crypto.randomUUID?.() || `o-${Date.now()}`,
      order_number: body.orderNumber,
      customer_name: body.customerName,
      email: body.email,
      phone: body.phone || null,
      pickup_date: body.pickupDate,
      pickup_time: body.pickupTime,
      payment_method: body.paymentMethod,
      status: "pending",
      notes: body.orderNotes || null,
      bottles_ordered: body.bottlesOrdered || [],
      created_at: new Date().toISOString(),
    };
    demoOrders.unshift(order);
    return jsonResponse({ success: true, order });
  }
  if (method === "PUT" && /\/orders\/.+\/status$/.test(path)) {
    const id = path.split("/orders/")[1].split("/status")[0];
    const body = parseBody(init) || {};
    const idx = demoOrders.findIndex((o) => o.id === id);
    if (idx === -1) return jsonResponse({ success: false, error: "Order not found" }, 404);
    demoOrders[idx] = { ...demoOrders[idx], status: body.status, admin_notes: body.note || demoOrders[idx].admin_notes };
    return jsonResponse({ success: true, order: demoOrders[idx] });
  }
  if (method === "DELETE") {
    const id = path.split("/orders/")[1];
    const before = demoOrders.length;
    demoOrders = demoOrders.filter((o) => o.id !== id);
    if (demoOrders.length === before) return jsonResponse({ success: false, error: "Order not found" }, 404);
    return jsonResponse({ success: true });
  }
  return notFound();
}

function handleBatches(path: string, init?: RequestInit): Response {
  const method = (init?.method || "GET").toUpperCase();
  if (method === "GET") {
    return jsonResponse({ success: true, batches: demoBatches });
  }
  if (method === "POST") {
    const body = parseBody(init) || {};
    const batch = { id: crypto.randomUUID?.() || `b-${Date.now()}`, created_at: new Date().toISOString(), ...body };
    demoBatches.unshift(batch);
    return jsonResponse({ success: true, batch });
  }
  if (method === "PUT") {
    const id = path.split("/batches/")[1];
    const body = parseBody(init) || {};
    const idx = demoBatches.findIndex((b) => b.id === id);
    if (idx === -1) return jsonResponse({ success: false, error: "Batch not found" }, 404);
    demoBatches[idx] = { ...demoBatches[idx], ...body };
    return jsonResponse({ success: true, batch: demoBatches[idx] });
  }
  if (method === "DELETE") {
    const id = path.split("/batches/")[1];
    const before = demoBatches.length;
    demoBatches = demoBatches.filter((b) => b.id !== id);
    if (demoBatches.length === before) return jsonResponse({ success: false, error: "Batch not found" }, 404);
    return jsonResponse({ success: true });
  }
  return notFound();
}

function handleMetrics(): Response {
  const inventory = [...demoInventory];
  const orders = [...demoOrders];
  const batches = [...demoBatches];
  return jsonResponse({ success: true, inventory, orders, batches });
}

function handleConfig(path: string): Response {
  if (path.endsWith("/supabase")) {
    return jsonResponse({ isConfigured: false, isInsecureUrl: false });
  }
  if (path.endsWith("/email")) {
    return jsonResponse({ isConfigured: false, isProductionReady: false, isDevelopment: true, status: "Email service disabled in demo mode" });
  }
  return notFound();
}

function handleEmail(init?: RequestInit): Response {
  // Simulate success without sending
  return jsonResponse({ success: true, emailsSent: 1, customerSuccess: true, adminSuccess: false, message: "Simulated in demo mode" });
}

function handleAuth(init?: RequestInit): Response {
  // This path is unused when AdminLoginModal is switched to hardcoded demo auth.
  // Return failure to discourage remote auth usage.
  return jsonResponse({ success: false, error: "Auth disabled in demo mode" }, 403);
}

export async function apiFetch(inputPath: string, init?: RequestInit): Promise<Response> {
  const path = inputPath.startsWith("/") ? inputPath : `/${inputPath}`;
  const method = (init?.method || "GET").toUpperCase();
  console.log(`🔄 Demo API: ${method} ${path}`);

  if (path.startsWith("/inventory")) return handleInventory(path, init);
  if (path.startsWith("/orders")) return handleOrders(path, init);
  if (path.startsWith("/batches")) return handleBatches(path, init);
  if (path.startsWith("/metrics")) return handleMetrics();
  if (path.startsWith("/config/")) return handleConfig(path);
  if (path.startsWith("/email")) return handleEmail(init);
  if (path.startsWith("/auth/")) return handleAuth(init);
  if (path.startsWith("/ping")) return jsonResponse({ status: "ok", message: "Demo API available" });

  return notFound();
}
