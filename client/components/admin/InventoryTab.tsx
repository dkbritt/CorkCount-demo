import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchBar } from "@/components/SearchBar";
import {
  Edit,
  Trash2,
  Plus,
  Filter,
  ArrowUpDown,
  AlertTriangle,
  CheckCircle,
  Package,
  X,
  Save,
  Loader2,
  Grape,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { formatError } from "@/lib/errors";
import { autoTagWine, sanitizeTags } from "@/lib/autoTagger";
import { WineImageUpload } from "@/components/admin/WineImageUpload";

interface InventoryItem {
  id: string;
  name: string;
  winery: string;
  vintage: number;
  type: string;
  quantity: number;
  price: number;
  status: "in-stock" | "low-stock" | "out-of-stock";
  lastUpdated: string;
  flavorNotes?: string;
  batchId?: string;
  location?: string;
  image?: string;
  tags?: string[];
}

interface AddInventoryForm {
  bottleName: string;
  type: string;
  vintage: string;
  quantity: string;
  price: string;
  flavorNotes: string;
  batchLink: string;
  status: string;
  location: string;
  image: string;
}

interface BatchItem {
  id: string;
  name: string;
}

// Batch data will be fetched from Supabase

const mockInventory: InventoryItem[] = [
  {
    id: "inv-001",
    name: "Château Margaux",
    winery: "Château Margaux",
    vintage: 2015,
    type: "Red Wine",
    quantity: 12,
    price: 450.0,
    status: "in-stock",
    lastUpdated: "2024-01-15",
    location: "Wine Cellar - Section A",
    image:
      "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=400&h=600&fit=crop",
  },
  {
    id: "inv-002",
    name: "Dom Pérignon Vintage",
    winery: "Dom Pérignon",
    vintage: 2012,
    type: "Sparkling",
    quantity: 8,
    price: 280.0,
    status: "in-stock",
    lastUpdated: "2024-01-14",
    location: "Refrigerator - Top Shelf",
    image:
      "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=600&fit=crop",
  },
  {
    id: "inv-003",
    name: "Opus One",
    winery: "Opus One Winery",
    vintage: 2018,
    type: "Red Wine",
    quantity: 15,
    price: 380.0,
    status: "in-stock",
    lastUpdated: "2024-01-13",
    location: "Wine Cellar - Section B",
    image:
      "https://images.unsplash.com/photo-1566995147102-a84a5b4b8b0a?w=400&h=600&fit=crop",
  },
  {
    id: "inv-004",
    name: "Barolo Brunate",
    winery: "Giuseppe Mascarello",
    vintage: 2017,
    type: "Red Wine",
    quantity: 3,
    price: 120.0,
    status: "low-stock",
    lastUpdated: "2024-01-12",
    location: "Dining Room Cabinet",
    image:
      "https://images.unsplash.com/photo-1510972527921-ce03766a1cf1?w=400&h=600&fit=crop",
  },
  {
    id: "inv-005",
    name: "Sancerre Les Monts Damnés",
    winery: "Henri Bourgeois",
    vintage: 2020,
    type: "White Wine",
    quantity: 36,
    price: 85.0,
    status: "in-stock",
    lastUpdated: "2024-01-11",
    location: "Kitchen Wine Fridge",
    image:
      "https://images.unsplash.com/photo-1571613316887-6f8d5cbf7ef7?w=400&h=600&fit=crop",
  },
  {
    id: "inv-006",
    name: "Châteauneuf-du-Pape",
    winery: "Château de Beaucastel",
    vintage: 2019,
    type: "Red Wine",
    quantity: 2,
    price: 95.0,
    status: "low-stock",
    lastUpdated: "2024-01-10",
    location: "Basement Storage",
    image:
      "https://images.unsplash.com/photo-1574282248091-7e8bfcef9e8d?w=400&h=600&fit=crop",
  },
  {
    id: "inv-007",
    name: "Whispering Angel Rosé",
    winery: "Château d'Esclans",
    vintage: 2022,
    type: "Rosé",
    quantity: 48,
    price: 25.0,
    status: "in-stock",
    lastUpdated: "2024-01-09",
    location: "Pantry Rack",
    image:
      "https://images.unsplash.com/photo-1569235186275-626cb8f3c7be?w=400&h=600&fit=crop",
  },
  {
    id: "inv-008",
    name: "Riesling Spätlese",
    winery: "Dr. Loosen",
    vintage: 2021,
    type: "Dessert Wine",
    quantity: 0,
    price: 45.0,
    status: "out-of-stock",
    lastUpdated: "2024-01-08",
    location: "Wine Cellar - Section C",
    image:
      "https://images.unsplash.com/photo-1547595628-c61a29f496f0?w=400&h=600&fit=crop",
  },
];

interface InventoryTabProps {
  settings?: {
    lowStockThreshold: number;
    outOfStockThreshold: number;
  };
  onSetAddCallback?: (callback: () => void) => void;
}

export function InventoryTab({
  settings,
  onSetAddCallback,
}: InventoryTabProps = {}) {
  const { lowStockThreshold = 5, outOfStockThreshold = 0 } = settings || {};
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<keyof InventoryItem>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState<AddInventoryForm>({
    bottleName: "",
    type: "",
    vintage: "",
    quantity: "",
    price: "",
    flavorNotes: "",
    batchLink: "",
    status: "Active",
    location: "",
    image: "",
  });
  const [formErrors, setFormErrors] = useState<Partial<AddInventoryForm>>({});
  const [availableBatches, setAvailableBatches] = useState<BatchItem[]>([]);

  // Fetch inventory and batches from Supabase
  useEffect(() => {
    const fetchData = async () => {
      // Fetch inventory
      await fetchInventory();
      // Fetch batches
      await fetchBatches();
    };

    const fetchInventory = async () => {
      try {
        setLoading(true);
        const response = await apiFetch("/inventory?admin=true");

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        let result;
        try {
          result = await response.json();
        } catch (jsonError) {
          throw new Error("Failed to parse response as JSON");
        }

        if (!result.success) {
          console.error("Error fetching inventory:", result.error);
          toast({
            title: "Error",
            description: `Failed to load inventory: ${result.error}`,
            variant: "destructive",
          });
          return;
        }

        // Convert API data to InventoryItem format
        const inventoryItems: InventoryItem[] = (result.inventory || []).map(
          (item: any) => ({
            id: item.id,
            name: item.name || "Unnamed Wine",
            winery: item.winery || "Unknown Winery",
            vintage: item.vintage || new Date().getFullYear(),
            type: item.type || "Red Wine",
            quantity: parseInt(item.quantity) || 0,
            price: parseFloat(item.price) || 0,
            status: getInventoryStatus(item.quantity),
            lastUpdated:
              item.last_updated ||
              item.created_at ||
              new Date().toISOString().split("T")[0],
            flavorNotes: item.flavor_notes || "",
            batchId: item.batch_id || "",
            location: item.location || "",
            image: item.image_url || item.image || "",
            tags: item.tags || [],
          }),
        );

        setInventory(inventoryItems);
      } catch (err: any) {
        console.error("Error fetching inventory:", formatError(err));
        toast({
          title: "Error",
          description: "An unexpected error occurred while loading inventory.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    const fetchBatches = async () => {
      try {
        const response = await apiFetch("/batches");

        if (!response.ok) {
          console.error("Error fetching batches: API request failed");
          return;
        }

        let result;
        try {
          result = await response.json();
        } catch (jsonError) {
          console.error("Error fetching batches: Invalid JSON response");
          return;
        }

        if (result.success) {
          const batchItems: BatchItem[] = (result.batches || []).map(
            (batch: any) => ({
              id: batch.id,
              name: batch.name || "Unnamed Batch",
            }),
          );
          setAvailableBatches(batchItems);
        } else {
          console.error("Error fetching batches:", result.error);
        }
      } catch (err) {
        console.error("Error fetching batches:", formatError(err));
      }
    };

    fetchData();
  }, [toast]);

  // Set up floating action button callback
  useEffect(() => {
    if (onSetAddCallback) {
      onSetAddCallback(() => {
        setShowAddForm(true);
        window.scrollTo(0, 0);
      });
    }
  }, [onSetAddCallback]);

  // Helper function to determine status based on quantity
  const getInventoryStatus = (
    quantity: number,
  ): "in-stock" | "low-stock" | "out-of-stock" => {
    if (quantity <= outOfStockThreshold) return "out-of-stock";
    if (quantity <= lowStockThreshold) return "low-stock";
    return "in-stock";
  };

  const getStatusBadge = (item: InventoryItem) => {
    // Use dynamic thresholds to determine status
    if (item.quantity <= outOfStockThreshold) {
      return (
        <Badge className="bg-red-100 text-red-800 gap-1">
          <Package className="h-3 w-3" />
          Out of Stock
        </Badge>
      );
    } else if (item.quantity <= lowStockThreshold) {
      return (
        <Badge className="bg-orange-100 text-orange-800 gap-1">
          <AlertTriangle className="h-3 w-3" />
          Low Stock
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-green-100 text-green-800 gap-1">
          <CheckCircle className="h-3 w-3" />
          In Stock
        </Badge>
      );
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<AddInventoryForm> = {};

    if (!formData.bottleName.trim()) {
      errors.bottleName = "Bottle name is required";
    }

    if (!formData.type) {
      errors.type = "Type is required";
    }

    if (!formData.vintage) {
      errors.vintage = "Vintage is required";
    } else {
      const year = parseInt(formData.vintage);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 1800 || year > currentYear + 5) {
        errors.vintage = "Please enter a valid vintage year";
      }
    }

    if (!formData.quantity) {
      errors.quantity = "Quantity is required";
    } else if (
      isNaN(parseInt(formData.quantity)) ||
      parseInt(formData.quantity) < 0
    ) {
      errors.quantity = "Please enter a valid quantity";
    }

    if (!formData.price) {
      errors.price = "Price is required";
    } else if (
      isNaN(parseFloat(formData.price)) ||
      parseFloat(formData.price) < 0
    ) {
      errors.price = "Please enter a valid price";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setFormLoading(true);

    try {
      const quantity = parseInt(formData.quantity);

      // Generate auto-tags from flavor notes and wine data
      const autoTags = autoTagWine({
        flavorNotes: formData.flavorNotes,
        description: formData.flavorNotes, // Use flavorNotes as the description for tagging
        name: formData.bottleName,
        type: formData.type,
      });
      const sanitizedTags = sanitizeTags(autoTags);

      const inventoryData = {
        name: formData.bottleName,
        winery: "Foxglove Creek Winery", // Default winery
        vintage: parseInt(formData.vintage),
        type: formData.type,
        quantity: quantity,
        price: parseFloat(formData.price),
        flavor_notes: formData.flavorNotes,
        batch_id: formData.batchLink || null,
        location: formData.location,
        image_url: formData.image,
        tags: sanitizedTags, // Add auto-generated tags
        last_updated: new Date().toISOString(),
      };

      if (editingItem) {
        // Update existing item
        const response = await apiFetch(`/inventory/${editingItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(inventoryData),
        });

        // Handle response with proper error checking
        if (!response.ok) {
          let errorMessage = "Failed to update inventory item";
          try {
            const errorResult = await response.json();
            errorMessage = errorResult.error || errorMessage;
          } catch {
            errorMessage = response.statusText || errorMessage;
          }

          console.error("Error updating inventory:", errorMessage);
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
          return;
        }

        // Parse successful response
        let result;
        try {
          result = await response.json();
        } catch (jsonError) {
          console.error("Invalid response format:", jsonError);
          toast({
            title: "Error",
            description: "Invalid response from server. Please try again.",
            variant: "destructive",
          });
          return;
        }

        if (!result.success) {
          console.error("Error updating inventory:", result.error);
          toast({
            title: "Error",
            description: result.error || "Failed to update inventory item",
            variant: "destructive",
          });
          return;
        }

        // Update local state
        const updatedItem: InventoryItem = {
          ...editingItem,
          name: formData.bottleName,
          vintage: parseInt(formData.vintage),
          type: formData.type,
          quantity: quantity,
          price: parseFloat(formData.price),
          status: getInventoryStatus(quantity),
          lastUpdated: new Date().toISOString().split("T")[0],
          flavorNotes: formData.flavorNotes,
          batchId: formData.batchLink,
          location: formData.location,
          image: formData.image,
          tags: sanitizedTags,
        };

        setInventory(
          inventory.map((item) =>
            item.id === editingItem.id ? updatedItem : item,
          ),
        );

        toast({
          title: "Success",
          description: "Inventory item updated successfully.",
        });
      } else {
        // Add new item
        const response = await apiFetch("/inventory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(inventoryData),
        });

        // Handle response with proper error checking
        if (!response.ok) {
          let errorMessage = "Failed to add inventory item";
          try {
            const errorResult = await response.json();
            errorMessage = errorResult.error || errorMessage;
          } catch {
            errorMessage = response.statusText || errorMessage;
          }

          console.error("Error adding inventory:", errorMessage);
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
          return;
        }

        // Parse successful response
        let result;
        try {
          result = await response.json();
        } catch (jsonError) {
          console.error("Invalid response format:", jsonError);
          toast({
            title: "Error",
            description: "Invalid response from server. Please try again.",
            variant: "destructive",
          });
          return;
        }

        if (!result.success) {
          console.error("Error adding inventory:", result.error);
          toast({
            title: "Error",
            description: result.error || "Failed to add inventory item",
            variant: "destructive",
          });
          return;
        }

        // Add to local state
        const newItem: InventoryItem = {
          id: result.item.id,
          name: formData.bottleName,
          winery: "KB Winery",
          vintage: parseInt(formData.vintage),
          type: formData.type,
          quantity: quantity,
          price: parseFloat(formData.price),
          status: getInventoryStatus(quantity),
          lastUpdated: new Date().toISOString().split("T")[0],
          flavorNotes: formData.flavorNotes,
          batchId: formData.batchLink,
          location: formData.location,
          image: formData.image,
          tags: sanitizedTags,
        };

        setInventory([...inventory, newItem]);

        toast({
          title: "Success",
          description: "Inventory item added successfully.",
        });
      }

      // Reset form
      resetForm();
    } catch (err: any) {
      console.error("Error submitting form:", formatError(err));
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      bottleName: "",
      type: "",
      vintage: "",
      quantity: "",
      price: "",
      flavorNotes: "",
      batchLink: "",
      status: "Active",
      location: "",
      image: "",
    });
    setFormErrors({});
    setShowAddForm(false);
    setEditingItem(null);
  };

  const handleFormCancel = () => {
    resetForm();
  };

  const handleEditItem = (item: InventoryItem) => {
    // Convert inventory status back to form status
    const getFormStatus = (status: string): string => {
      switch (status) {
        case "low-stock":
          return "Low Stock";
        case "out-of-stock":
          return "Archived";
        default:
          return "Active";
      }
    };

    setFormData({
      bottleName: item.name,
      type: item.type,
      vintage: item.vintage.toString(),
      quantity: item.quantity.toString(),
      price: item.price.toString(),
      flavorNotes: item.flavorNotes || "",
      batchLink: item.batchId || "",
      status: getFormStatus(item.status),
      location: item.location || "",
      image: item.image || "", // Explicitly preserve existing image_url
    });
    setEditingItem(item);
    setShowAddForm(true);
    window.scrollTo(0, 0);
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const response = await apiFetch(`/inventory/${itemId}`, {
        method: "DELETE",
      });

      // Handle response with proper error checking
      if (!response.ok) {
        let errorMessage = "Failed to delete inventory item";
        try {
          const errorResult = await response.json();
          errorMessage = errorResult.error || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }

        console.error("Error deleting inventory item:", errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      // Parse successful response (DELETE might not return JSON)
      let result = { success: true };
      try {
        if (
          response.headers.get("content-type")?.includes("application/json")
        ) {
          result = await response.json();
        }
      } catch (jsonError) {
        // If no JSON response, assume success since response was OK
        result = { success: true };
      }

      if (result.success === false) {
        console.error("Error deleting inventory item:", result.error);
        toast({
          title: "Error",
          description: result.error || "Failed to delete inventory item",
          variant: "destructive",
        });
        return;
      }

      // Update local state
      setInventory(inventory.filter((item) => item.id !== itemId));

      toast({
        title: "Success",
        description: "Inventory item deleted successfully.",
      });
    } catch (err: any) {
      console.error("Error deleting inventory item:", formatError(err));
      toast({
        title: "Error",
        description: "An unexpected error occurred while deleting item.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: keyof AddInventoryForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const filteredInventory = inventory
    .filter((item) => {
      const matchesSearch =
        searchQuery === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.winery.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.type.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

  const handleSort = (field: keyof InventoryItem) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 md:w-12 md:h-12 bg-wine rounded-lg flex items-center justify-center">
              <Grape className="h-6 w-6 md:h-6 md:w-6 text-white" />
            </div>
            <h1 className="font-playfair text-2xl md:text-3xl font-bold text-wine">
              Inventory Management
            </h1>
          </div>
          <p className="text-gray-600 ml-15">
            Manage your wine collection and track stock levels
          </p>
        </div>
        <Button
          variant="accent"
          className="gap-2"
          onClick={() => {
            setShowAddForm(true);
            window.scrollTo(0, 0);
          }}
        >
          <Plus className="h-4 w-4" />
          Add Wine
        </Button>
      </div>

      {/* Add Inventory Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm mx-auto max-w-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-playfair text-xl font-semibold text-gray-900">
              {editingItem ? "Edit Inventory Item" : "Add New Inventory"}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFormCancel}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Bottle Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bottle Name *
                </label>
                <input
                  type="text"
                  value={formData.bottleName}
                  onChange={(e) =>
                    handleInputChange("bottleName", e.target.value)
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-federal/20 focus:border-federal ${
                    formErrors.bottleName ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Enter bottle name"
                />
                {formErrors.bottleName && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.bottleName}
                  </p>
                )}
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange("type", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-federal/20 focus:border-federal ${
                    formErrors.type ? "border-red-300" : "border-gray-300"
                  }`}
                >
                  <option value="">Select wine type</option>
                  <option value="Red">Red</option>
                  <option value="White">White</option>
                  <option value="Rosé">Rosé</option>
                  <option value="Sparkling">Sparkling</option>
                  <option value="Dessert">Dessert</option>
                </select>
                {formErrors.type && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.type}</p>
                )}
              </div>

              {/* Vintage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vintage *
                </label>
                <input
                  type="number"
                  value={formData.vintage}
                  onChange={(e) => handleInputChange("vintage", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-federal/20 focus:border-federal ${
                    formErrors.vintage ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="2023"
                  min="1800"
                  max={new Date().getFullYear() + 5}
                />
                {formErrors.vintage && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.vintage}
                  </p>
                )}
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity *
                </label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) =>
                    handleInputChange("quantity", e.target.value)
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-federal/20 focus:border-federal ${
                    formErrors.quantity ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="12"
                  min="0"
                />
                {formErrors.quantity && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.quantity}
                  </p>
                )}
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-federal/20 focus:border-federal ${
                      formErrors.price ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="45.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                {formErrors.price && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.price}
                  </p>
                )}
              </div>

              {/* Batch Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batch Link
                </label>
                <select
                  value={formData.batchLink}
                  onChange={(e) =>
                    handleInputChange("batchLink", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-federal/20 focus:border-federal"
                >
                  <option value="">Select a batch (optional)</option>
                  {availableBatches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange("status", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-federal/20 focus:border-federal"
                >
                  <option value="Active">Active</option>
                  <option value="Archived">Archived</option>
                  <option value="Low Stock">Low Stock</option>
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    handleInputChange("location", e.target.value)
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-federal/20 focus:border-federal ${
                    formErrors.location ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="e.g., Wine Cellar - Section A"
                />
                {formErrors.location && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.location}
                  </p>
                )}
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wine Image
                </label>
                <WineImageUpload
                  value={formData.image}
                  onChange={(imageUrl) => handleInputChange("image", imageUrl)}
                  onError={(error) =>
                    setFormErrors((prev) => ({ ...prev, image: error }))
                  }
                  disabled={formLoading}
                />
                {formErrors.image && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.image}
                  </p>
                )}
              </div>

              {/* Flavor Notes */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Flavor Notes
                </label>
                <textarea
                  value={formData.flavorNotes}
                  onChange={(e) =>
                    handleInputChange("flavorNotes", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-federal/20 focus:border-federal"
                  placeholder="Describe the wine's flavor profile, tasting notes, and characteristics..."
                  rows={3}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={handleFormCancel}
                className="bg-smoke hover:bg-gray-100"
                disabled={formLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="accent"
                className="gap-2"
                disabled={formLoading}
              >
                {formLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {formLoading
                  ? editingItem
                    ? "Updating..."
                    : "Adding..."
                  : editingItem
                    ? "Update Bottle"
                    : "Add Bottle"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            onSearch={setSearchQuery}
            onClear={() => setSearchQuery("")}
            placeholder="Search wines by name or by type"
            variant="admin"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-federal/20 focus:border-federal"
          >
            <option value="all">All Status</option>
            <option value="in-stock">In Stock</option>
            <option value="low-stock">Low Stock</option>
            <option value="out-of-stock">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Loader2 className="h-12 w-12 text-gray-400 animate-spin mx-auto mb-4" />
          <h3 className="font-playfair text-lg font-medium text-gray-900 mb-2">
            Loading inventory...
          </h3>
          <p className="text-gray-600">
            Please wait while we fetch your wine collection.
          </p>
        </div>
      )}

      {/* Inventory Table - Desktop */}
      {!loading && (
        <div className="hidden lg:block bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left w-20">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Image
                    </span>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("name")}
                      className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                    >
                      Wine Name
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("vintage")}
                      className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                    >
                      Vintage
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("type")}
                      className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                    >
                      Type
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("quantity")}
                      className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                    >
                      Quantity
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </span>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("price")}
                      className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                    >
                      Price
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </span>
                  </th>
                  <th className="px-4 py-3 text-center">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInventory.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <div className="flex-shrink-0">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-12 w-12 rounded-lg object-cover border border-gray-200"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.svg";
                            }}
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                            <span className="text-gray-400 text-xs">
                              No image
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <div className="font-playfair font-medium text-gray-900">
                          {item.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.winery}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {item.vintage}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {item.type}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {item.quantity} bottles
                    </td>
                    <td className="px-4 py-4">{getStatusBadge(item)}</td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">
                      ${item.price.toFixed(2)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {item.location || "Not specified"}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleEditItem(item)}
                          title="Edit item"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteItem(item.id)}
                          title="Delete item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inventory Cards - Mobile/Tablet */}
      {!loading && (
        <div className="lg:hidden space-y-4">
          {filteredInventory.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg border border-gray-200 p-4"
            >
              <div className="flex items-start gap-4 mb-3">
                <div className="flex-shrink-0">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-16 w-16 rounded-lg object-cover border border-gray-200"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg";
                      }}
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                      <span className="text-gray-400 text-xs text-center">
                        No
                        <br />
                        image
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-playfair font-medium text-gray-900 truncate">
                    {item.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {item.winery} • {item.vintage}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleEditItem(item)}
                    title="Edit item"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    onClick={() => handleDeleteItem(item.id)}
                    title="Delete item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Type:</span>
                  <div className="font-medium">{item.type}</div>
                </div>
                <div>
                  <span className="text-gray-500">Quantity:</span>
                  <div className="font-medium">{item.quantity} bottles</div>
                </div>
                <div>
                  <span className="text-gray-500">Price:</span>
                  <div className="font-medium text-wine">
                    ${item.price.toFixed(2)}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <div className="mt-1">{getStatusBadge(item)}</div>
                </div>
              </div>

              {item.location && (
                <div className="mt-3 text-sm">
                  <span className="text-gray-500">Location:</span>
                  <div className="font-medium">{item.location}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Results Summary */}
      <div className="text-sm text-gray-500">
        Showing {filteredInventory.length} of {inventory.length} wines
      </div>
    </div>
  );
}
