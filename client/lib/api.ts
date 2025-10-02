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
    image: "https://images.pexels.com/photos/14088714/pexels-photo-14088714.jpeg",
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
    image: "https://images.pexels.com/photos/14088708/pexels-photo-14088708.jpeg",
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
    image: "https://images.pexels.com/photos/4825746/pexels-photo-4825746.jpeg",
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
    image: "https://images.pexels.com/photos/26837415/pexels-photo-26837415.jpeg",
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
    image: "https://images.pexels.com/photos/12582790/pexels-photo-12582790.jpeg",
    tags: ["grenache", "syrah"],
  },
  {
    id: crypto.randomUUID?.() || `w-${Date.now()}-6`,
    name: "Napa Valley Cabernet Sauvignon",
    winery: BRAND,
    vintage: 2017,
    region: "California, USA",
    type: "Red Wine",
    price: 65,
    inStock: 12,
    rating: 4.7,
    description: "Blackcurrant, cedar, and cocoa with firm tannins.",
    flavorNotes: ["blackcurrant", "cedar", "cocoa"],
    image: "https://images.pexels.com/photos/373067/pexels-photo-373067.jpeg",
    tags: ["cabernet", "napa"],
  },
  {
    id: crypto.randomUUID?.() || `w-${Date.now()}-7`,
    name: "Chablis Premier Cru",
    winery: BRAND,
    vintage: 2020,
    region: "Burgundy, France",
    type: "White Wine",
    price: 39,
    inStock: 20,
    rating: 4.5,
    description: "Mineral-driven with green apple and lemon zest.",
    flavorNotes: ["minerality", "green apple", "lemon"],
    image: "https://images.pexels.com/photos/1407852/pexels-photo-1407852.jpeg",
    tags: ["chardonnay", "chablis"],
  },
  {
    id: crypto.randomUUID?.() || `w-${Date.now()}-8`,
    name: "Cava Brut Reserva",
    winery: BRAND,
    vintage: 2021,
    region: "Penedès, Spain",
    type: "Sparkling Wine",
    price: 15,
    inStock: 60,
    rating: 4.0,
    description: "Crisp citrus and almond, fine bubbles.",
    flavorNotes: ["citrus", "almond"],
    image: "https://images.pexels.com/photos/26837415/pexels-photo-26837415.jpeg",
    tags: ["cava"],
  },
  {
    id: crypto.randomUUID?.() || `w-${Date.now()}-9`,
    name: "Rioja Crianza",
    winery: BRAND,
    vintage: 2019,
    region: "Rioja, Spain",
    type: "Red Wine",
    price: 24,
    inStock: 34,
    rating: 4.2,
    description: "Tempranillo with red cherry, vanilla, and spice.",
    flavorNotes: ["cherry", "vanilla", "spice"],
    image: "/placeholder.svg",
    tags: ["tempranillo", "rioja"],
  },
  {
    id: crypto.randomUUID?.() || `w-${Date.now()}-10`,
    name: "Provence Rosé",
    winery: BRAND,
    vintage: 2023,
    region: "Provence, France",
    type: "Rosé",
    price: 18,
    inStock: 42,
    rating: 4.1,
    description: "Strawberry, melon, and fresh herbs; dry finish.",
    flavorNotes: ["strawberry", "melon", "herbs"],
    image: "/placeholder.svg",
    tags: ["rosé"],
  },
  {
    id: crypto.randomUUID?.() || `w-${Date.now()}-11`,
    name: "Barolo DOCG",
    winery: BRAND,
    vintage: 2016,
    region: "Piedmont, Italy",
    type: "Red Wine",
    price: 89,
    inStock: 8,
    rating: 4.8,
    description: "Nebbiolo with tar and roses; powerful structure.",
    flavorNotes: ["tar", "rose", "licorice"],
    image: "/placeholder.svg",
    tags: ["nebbiolo", "barolo"],
  },
  {
    id: crypto.randomUUID?.() || `w-${Date.now()}-12`,
    name: "Moscato d'Asti",
    winery: BRAND,
    vintage: 2022,
    region: "Piedmont, Italy",
    type: "Dessert Wine",
    price: 14,
    inStock: 25,
    rating: 4.0,
    description: "Lightly sparkling, sweet peach and orange blossom.",
    flavorNotes: ["peach", "orange blossom"],
    image: "/placeholder.svg",
    tags: ["moscato", "dessert"],
  },
  {
    id: crypto.randomUUID?.() || `w-${Date.now()}-13`,
    name: "Sancerre Blanc",
    winery: BRAND,
    vintage: 2021,
    region: "Loire, France",
    type: "White Wine",
    price: 27,
    inStock: 30,
    rating: 4.3,
    description: "Flinty minerality, lemon, and gooseberry.",
    flavorNotes: ["lemon", "gooseberry", "flint"],
    image: "/placeholder.svg",
    tags: ["sauvignon blanc", "sancerre"],
  },
  {
    id: crypto.randomUUID?.() || `w-${Date.now()}-14`,
    name: "Chianti Classico",
    winery: BRAND,
    vintage: 2019,
    region: "Tuscany, Italy",
    type: "Red Wine",
    price: 21,
    inStock: 28,
    rating: 4.1,
    description: "Sangiovese with cherry, tobacco, and spice.",
    flavorNotes: ["cherry", "tobacco", "spice"],
    image: "/placeholder.svg",
    tags: ["sangiovese", "chianti"],
  },
  {
    id: crypto.randomUUID?.() || `w-${Date.now()}-15`,
    name: "German Riesling Kabinett",
    winery: BRAND,
    vintage: 2021,
    region: "Mosel, Germany",
    type: "White Wine",
    price: 23,
    inStock: 22,
    rating: 4.2,
    description: "Green apple, lime, and slate with bright acidity.",
    flavorNotes: ["green apple", "lime", "slate"],
    image: "/placeholder.svg",
    tags: ["riesling", "mosel"],
  },
  {
    id: crypto.randomUUID?.() || `w-${Date.now()}-16`,
    name: "Porto Ruby",
    winery: BRAND,
    vintage: 2017,
    region: "Douro, Portugal",
    type: "Dessert Wine",
    price: 26,
    inStock: 15,
    rating: 4.1,
    description: "Rich berry, chocolate, and spice; fortified.",
    flavorNotes: ["berry", "chocolate", "spice"],
    image: "/placeholder.svg",
    tags: ["port", "dessert"],
  },
];

let demoOrders: any[] = [
  {
    id: crypto.randomUUID?.() || `o-${Date.now()}-1`,
    order_number: "FCW-10001",
    customer_name: "Ava Thompson",
    email: "ava@example.com",
    phone: "555-0101",
    pickup_date: new Date().toISOString(),
    pickup_time: "4:30 PM",
    payment_method: "zelle",
    status: "pending",
    notes: "Please include gift receipt.",
    bottles_ordered: [
      { wine_id: demoInventory[0].id, wine_name: demoInventory[0].name, wine_vintage: demoInventory[0].vintage, wine_winery: demoInventory[0].winery, quantity: 2, price_per_bottle: demoInventory[0].price, total_price: demoInventory[0].price * 2 },
    ],
    created_at: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID?.() || `o-${Date.now()}-2`,
    order_number: "FCW-10002",
    customer_name: "Liam Martinez",
    email: "liam@example.com",
    pickup_date: new Date().toISOString(),
    pickup_time: "1:00 PM",
    payment_method: "cash",
    status: "ready-for-pickup",
    bottles_ordered: [
      { wine_id: demoInventory[3].id, wine_name: demoInventory[3].name, wine_vintage: demoInventory[3].vintage, wine_winery: demoInventory[3].winery, quantity: 3, price_per_bottle: demoInventory[3].price, total_price: demoInventory[3].price * 3 },
    ],
    created_at: new Date().toISOString(),
  },
];
let demoBatches: any[] = [
  {
    id: crypto.randomUUID?.() || `b-${Date.now()}-1`,
    name: "FCW Pinot Noir 2019 - Batch A",
    status: "aging",
    created_at: new Date().toISOString(),
    notes: "Lot 12, barrel aging in French oak.",
  },
  {
    id: crypto.randomUUID?.() || `b-${Date.now()}-2`,
    name: "FCW Prosecco 2021 - Tirage",
    status: "bottled",
    created_at: new Date().toISOString(),
    notes: "Secondary fermentation complete.",
  },
];

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
