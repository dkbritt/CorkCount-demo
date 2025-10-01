import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  Calendar,
  User,
  Mail,
  Phone,
  CreditCard,
  FileText,
  X,
  Clock,
  CheckCircle,
  Package,
  XCircle,
  Loader2,
  Search,
  Filter,
  Trash2,
  ShoppingBag,
} from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { formatError } from "@/lib/errors";
import { sendStatusUpdateEmail } from "@/lib/email";

interface Order {
  id: string;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
  };
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  status: "pending" | "ready-for-pickup" | "picked-up" | "cancelled";
  orderDate: string;
  pickupDate?: string;
  pickupTime?: string;
  paymentMethod?: string;
  phone?: string;
  orderNotes?: string;
}

const mockOrders: Order[] = [
  {
    id: "ord-001",
    orderNumber: "ORD-20240115-001",
    customer: {
      name: "Sarah Wilson",
      email: "sarah.wilson@email.com",
    },
    items: [
      { name: "Château Margaux 2015", quantity: 1, price: 450.0 },
      { name: "Dom Pérignon Vintage 2012", quantity: 2, price: 280.0 },
    ],
    total: 1010.0,
    status: "pending",
    orderDate: "2024-01-15T14:30:00Z",
    pickupDate: "2024-01-18",
    pickupTime: "2:00 PM",
    paymentMethod: "zelle",
    phone: "(555) 123-4567",
    orderNotes: "Please hold until pickup confirmation",
  },
  {
    id: "ord-002",
    orderNumber: "ORD-20240114-001",
    customer: {
      name: "John Smith",
      email: "john.smith@email.com",
    },
    items: [
      { name: "Opus One 2018", quantity: 1, price: 380.0 },
      { name: "Barolo Brunate 2017", quantity: 2, price: 120.0 },
    ],
    total: 620.0,
    status: "ready-for-pickup",
    orderDate: "2024-01-14T09:15:00Z",
    pickupDate: "2024-01-16",
    pickupTime: "4:00 PM",
    paymentMethod: "cashapp",
  },
  {
    id: "ord-003",
    orderNumber: "ORD-20240112-001",
    customer: {
      name: "Emily Davis",
      email: "emily.davis@email.com",
    },
    items: [
      { name: "Sancerre Les Monts Damnés 2020", quantity: 3, price: 85.0 },
    ],
    total: 255.0,
    status: "picked-up",
    orderDate: "2024-01-12T16:45:00Z",
    pickupDate: "2024-01-15",
    pickupTime: "11:00 AM",
    paymentMethod: "cash",
  },
];

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "ready-for-pickup", label: "Ready for Pickup" },
  { value: "picked-up", label: "Picked Up" },
  { value: "cancelled", label: "Cancelled" },
];

const paymentMethodLabels: Record<string, string> = {
  zelle: "Zelle",
  cashapp: "CashApp",
  cash: "Cash",
};

export function OrdersTab() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [statusUpdates, setStatusUpdates] = useState<Record<string, string>>(
    {},
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null,
  );

  // Fetch orders from Supabase
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);

        const response = await apiFetch("/orders");
        const result = await response.json();

        if (!response.ok || !result.success) {
          console.error("Error fetching orders from API:", result.error);
          // Fallback to localStorage if API fails
          loadOrdersFromStorage();
          return;
        }

        // Convert API orders to admin order format
        const convertedOrders = (result.orders || []).map((order: any) => ({
          id: order.id,
          orderNumber: order.order_number,
          customer: {
            name: order.customer_name,
            email: order.email,
          },
          items: (order.bottles_ordered || []).map((bottle: any) => ({
            name: `${bottle.wine_name} ${bottle.wine_vintage || ""}`,
            quantity: bottle.quantity,
            price: bottle.price_per_bottle,
          })),
          total: computeOrderTotal(order),
          status: order.status || "pending",
          orderDate: order.created_at,
          pickupDate: order.pickup_date,
          pickupTime: order.pickup_time,
          paymentMethod: order.payment_method,
          phone: order.phone,
          orderNotes: order.notes,
        }));

        // When Supabase is available, use it as the primary source of truth
        // Only include localStorage orders if they're very recent (last 24 hours) and not in Supabase
        const localOrders = loadOrdersFromStorage();
        const now = new Date().getTime();
        const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

        const allOrderNumbers = new Set(
          convertedOrders.map((o) => o.orderNumber),
        );
        const recentLocalOrders = localOrders.filter((o) => {
          // Only include if order is recent and not already in Supabase
          const orderDate = new Date(o.orderDate).getTime();
          return (
            !allOrderNumbers.has(o.orderNumber) &&
            orderDate > twentyFourHoursAgo
          );
        });

        const allOrders = [...convertedOrders, ...recentLocalOrders];
        setOrders(allOrders);

        // Clean up localStorage: remove orders that are now in Supabase or older than 7 days
        try {
          const checkoutOrders = JSON.parse(
            localStorage.getItem("corkCountOrders") || "[]",
          );
          const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
          const cleanedOrders = checkoutOrders.filter((order: any) => {
            const orderDate = new Date(order.orderDate).getTime();
            const isRecent = orderDate > sevenDaysAgo;
            const notInSupabase = !allOrderNumbers.has(order.orderNumber);
            return isRecent && notInSupabase;
          });

          if (cleanedOrders.length !== checkoutOrders.length) {
            localStorage.setItem(
              "corkCountOrders",
              JSON.stringify(cleanedOrders),
            );
            console.log(
              `Cleaned localStorage: removed ${checkoutOrders.length - cleanedOrders.length} old/synced orders`,
            );
          }
        } catch (e) {
          console.warn("Error cleaning localStorage:", e);
        }

        // Initialize status updates for all orders
        const initialStatusUpdates: Record<string, string> = {};
        allOrders.forEach((order) => {
          initialStatusUpdates[order.id] = order.status;
        });
        setStatusUpdates(initialStatusUpdates);
      } catch (err: any) {
        console.error("Error in fetchOrders:", formatError(err));
        toast({
          title: "Error",
          description: `Failed to load orders: ${formatError(err)}. Showing local data only.`,
          variant: "destructive",
        });
        // Fallback to localStorage
        loadOrdersFromStorage();
      } finally {
        setLoading(false);
      }
    };

    const loadOrdersFromStorage = () => {
      try {
        const checkoutOrders = JSON.parse(
          localStorage.getItem("corkCountOrders") || "[]",
        );

        // Convert checkout orders to admin order format
        return checkoutOrders.map((checkoutOrder: any) => ({
          id: checkoutOrder.orderNumber
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "-"),
          orderNumber: checkoutOrder.orderNumber,
          customer: {
            name: checkoutOrder.customerName,
            email: checkoutOrder.email,
          },
          items: checkoutOrder.items.map((item: any) => ({
            name: `${item.wine.name} ${item.wine.vintage || ""}`,
            quantity: item.quantity,
            price: item.wine.price,
          })),
          total: checkoutOrder.totalPrice,
          status:
            checkoutOrder.status === "pending"
              ? "pending"
              : checkoutOrder.status,
          orderDate: checkoutOrder.orderDate,
          pickupDate: checkoutOrder.pickupDate,
          pickupTime: checkoutOrder.pickupTime,
          paymentMethod: checkoutOrder.paymentMethod,
          phone: checkoutOrder.phone,
          orderNotes: checkoutOrder.orderNotes,
        }));
      } catch (error: any) {
        console.error(
          "Error loading orders from localStorage:",
          error.message || error,
        );
        return mockOrders;
      }
    };

    fetchOrders();
  }, [toast]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case "ready-for-pickup":
        return (
          <Badge className="bg-blue-100 text-blue-800 gap-1">
            <Package className="h-3 w-3" />
            Ready for Pickup
          </Badge>
        );
      case "picked-up":
        return (
          <Badge className="bg-green-100 text-green-800 gap-1">
            <CheckCircle className="h-3 w-3" />
            Picked Up
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-100 text-red-800 gap-1">
            <XCircle className="h-3 w-3" />
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatPickupDateTime = (date?: string, time?: string) => {
    if (!date) return "Not scheduled";
    const formattedDate = formatDate(date);
    return time ? `${formattedDate} at ${time}` : formattedDate;
  };

  const getTotalBottles = (items: Order["items"]) => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const computeOrderTotal = (order: any) => {
    const direct = (order as any).total_amount ?? (order as any).total_price;
    if (direct != null && direct !== "") return parseFloat(direct);
    const bottles = (order as any).bottles_ordered || [];
    return bottles.reduce((sum: number, b: any) => {
      const perBottle =
        parseFloat(b.total_price) ||
        (parseFloat(b.price_per_bottle) || 0) * (parseInt(b.quantity) || 0);
      return sum + perBottle;
    }, 0);
  };

  // Manual cleanup function to remove stale localStorage orders
  const cleanupLocalStorage = () => {
    try {
      const checkoutOrders = JSON.parse(
        localStorage.getItem("corkCountOrders") || "[]",
      );
      const currentOrderNumbers = new Set(orders.map((o) => o.orderNumber));
      const now = new Date().getTime();
      const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;

      const cleanedOrders = checkoutOrders.filter((order: any) => {
        const orderDate = new Date(order.orderDate).getTime();
        const isRecent = orderDate > threeDaysAgo;
        const isCurrentlyDisplayed = currentOrderNumbers.has(order.orderNumber);
        return isRecent && isCurrentlyDisplayed;
      });

      localStorage.setItem("corkCountOrders", JSON.stringify(cleanedOrders));
      const removedCount = checkoutOrders.length - cleanedOrders.length;

      if (removedCount > 0) {
        toast({
          title: "Cleanup completed",
          description: `Removed ${removedCount} stale orders from local storage.`,
        });
        // Refresh the orders list
        window.location.reload();
      } else {
        toast({
          title: "No cleanup needed",
          description: "Local storage is already clean.",
        });
      }
    } catch (error: any) {
      console.error("Error during cleanup:", error);
      toast({
        title: "Cleanup failed",
        description: "Failed to clean local storage.",
        variant: "destructive",
      });
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const handleCloseModal = () => {
    setShowOrderModal(false);
    setSelectedOrder(null);
  };

  const handleStatusChange = (orderId: string, newStatus: string) => {
    setStatusUpdates((prev) => ({
      ...prev,
      [orderId]: newStatus,
    }));
  };

  // Filter orders based on search and status
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      searchQuery === "" ||
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleDeleteOrder = async (orderId: string) => {
    const isUuid = (v: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        v,
      );
    try {
      // Try to delete from Supabase by id if UUID, otherwise by order_number
      const targetOrder = orders.find((o) => o.id === orderId);
      let supabaseErr: any = null;
      try {
        if (isUuid(orderId)) {
          const response = await apiFetch(`/orders/${orderId}`, {
            method: "DELETE",
          });
          const result = await response.json().catch(() => ({}));
          supabaseErr =
            !response.ok || result.success === false
              ? result.error || "Failed to delete order"
              : null;
        } else if (targetOrder?.orderNumber) {
          const response = await apiFetch(
            `/orders/by-number/${encodeURIComponent(targetOrder.orderNumber)}`,
            {
              method: "DELETE",
            },
          );
          const result = await response.json().catch(() => ({}));
          supabaseErr =
            !response.ok || result.success === false
              ? result.error || "Failed to delete order"
              : null;
        }
      } catch (e: any) {
        supabaseErr = e;
      }

      if (supabaseErr) {
        console.error(
          "Error deleting order from Supabase:",
          formatError(supabaseErr),
        );
        toast({
          title: "Warning",
          description:
            "Order deleted locally but failed to sync with database.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Order deleted successfully.",
        });
      }

      // Update local state
      setOrders((prev) => prev.filter((order) => order.id !== orderId));

      // Also remove from localStorage backup by order number
      try {
        const targetOrder = orders.find((o) => o.id === orderId);
        const checkoutOrders = JSON.parse(
          localStorage.getItem("corkCountOrders") || "[]",
        );
        const updatedCheckoutOrders = checkoutOrders.filter((order: any) => {
          // Remove by both normalized ID and exact order number match
          const orderId_normalized = order.orderNumber
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "-");
          const exactOrderMatch =
            order.orderNumber === targetOrder?.orderNumber;
          return orderId_normalized !== orderId && !exactOrderMatch;
        });

        if (updatedCheckoutOrders.length !== checkoutOrders.length) {
          localStorage.setItem(
            "corkCountOrders",
            JSON.stringify(updatedCheckoutOrders),
          );
          console.log(
            `Removed order ${targetOrder?.orderNumber} from localStorage`,
          );
        }
      } catch (error: any) {
        console.error("Error updating localStorage:", formatError(error));
      }
    } catch (err: any) {
      console.error("Error deleting order:", formatError(err));
      toast({
        title: "Error",
        description: "Failed to delete order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setShowDeleteConfirm(null);
    }
  };

  const handleUpdateStatus = async (orderId: string) => {
    const newStatus = statusUpdates[orderId];

    try {
      const isUuid = (v: string) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          v,
        );
      const targetOrder = orders.find((order) => order.id === orderId);

      // Update in Supabase first (by id if UUID, otherwise by order_number)
      let error: any = null;
      try {
        if (isUuid(orderId)) {
          const response = await apiFetch(`/orders/${orderId}/status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
          });
          const result = await response.json();
          error =
            !response.ok || !result.success
              ? result.error || "Failed to update order status"
              : null;
        } else if (targetOrder?.orderNumber) {
          // For non-UUID orders, we need to find by order number first
          // This is a more complex operation, so we'll use the same endpoint approach
          const response = await apiFetch(`/orders/${orderId}/status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
          });
          const result = await response.json();
          error =
            !response.ok || !result.success
              ? result.error || "Failed to update order status"
              : null;
        }
      } catch (e: any) {
        error = e;
      }

      if (error) {
        console.error(
          "Error updating order status in Supabase:",
          formatError(error),
        );
        // Still update locally but show warning
        toast({
          title: "Warning",
          description:
            "Status updated locally but failed to sync with database.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Order status updated successfully.",
        });
      }

      // Find the order being updated for email
      const orderBeingUpdated = targetOrder;
      const oldStatus = orderBeingUpdated?.status || "pending";

      // Update local state
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? { ...order, status: newStatus as Order["status"] }
            : order,
        ),
      );

      // Send status update email if database update was successful and customer email exists
      if (!error && orderBeingUpdated?.customer?.email) {
        try {
          const emailResult = await sendStatusUpdateEmail({
            orderNumber: orderBeingUpdated.orderNumber,
            customerName: orderBeingUpdated.customer.name,
            customerEmail: orderBeingUpdated.customer.email,
            oldStatus,
            newStatus,
          });

          if (emailResult.success) {
            toast({
              title: "Status updated & email sent!",
              description: `Customer has been notified of the status change.`,
            });
          } else {
            toast({
              title: "Status updated",
              description:
                "Status updated but customer email notification failed to send.",
              variant: "destructive",
            });
          }
        } catch (emailError) {
          console.warn("Status update email failed:", emailError);
          toast({
            title: "Status updated",
            description:
              "Status updated but customer email notification failed to send.",
            variant: "destructive",
          });
        }
      }

      // Update localStorage as backup
      try {
        const checkoutOrders = JSON.parse(
          localStorage.getItem("corkCountOrders") || "[]",
        );
        const updatedCheckoutOrders = checkoutOrders.map((order: any) => {
          const orderId_normalized = order.orderNumber
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "-");
          return orderId_normalized === orderId
            ? { ...order, status: newStatus }
            : order;
        });
        localStorage.setItem(
          "corkCountOrders",
          JSON.stringify(updatedCheckoutOrders),
        );
      } catch (error: any) {
        console.error(
          "Error updating order status in localStorage:",
          formatError(error),
        );
      }
    } catch (err: any) {
      console.error("Error updating order status:", formatError(err));
      toast({
        title: "Error",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCloseModal();
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 md:w-12 md:h-12 bg-wine rounded-lg flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 md:h-6 md:w-6 text-white" />
            </div>
            <h1 className="font-playfair text-2xl md:text-3xl font-bold text-wine">
              Customer Orders
            </h1>
          </div>
          <p className="text-gray-600 ml-15">
            View and manage customer pickup orders
          </p>
        </div>

        {/* Loading State */}
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Loader2 className="h-16 w-16 text-gray-400 mx-auto mb-4 animate-spin" />
          <h2 className="font-playfair text-xl font-semibold text-gray-900 mb-2">
            Loading orders...
          </h2>
          <p className="text-gray-600">
            Please wait while we fetch customer orders.
          </p>
        </div>
      </div>
    );
  }

  // Empty state
  if (orders.length === 0) {
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 md:w-12 md:h-12 bg-wine rounded-lg flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 md:h-6 md:w-6 text-white" />
            </div>
            <h1 className="font-playfair text-2xl md:text-3xl font-bold text-wine">
              Customer Orders
            </h1>
          </div>
          <p className="text-gray-600 ml-15">
            View and manage customer pickup orders
          </p>
        </div>

        {/* Empty State */}
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="font-playfair text-xl font-semibold text-gray-900 mb-2">
            No orders yet — corks are still popping!
          </h2>
          <p className="text-gray-600">
            Customer orders will appear here once they complete checkout.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 md:w-12 md:h-12 bg-wine rounded-lg flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 md:h-6 md:w-6 text-white" />
            </div>
            <h1 className="font-playfair text-2xl md:text-3xl font-bold text-wine">
              Customer Orders
            </h1>
          </div>
          <p className="text-gray-600 ml-15">
            View and manage customer pickup orders
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button
            variant="outline"
            size="sm"
            onClick={cleanupLocalStorage}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Clean Up Orders
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            onSearch={setSearchQuery}
            onClear={() => setSearchQuery("")}
            placeholder="Search orders by order #, customer name, or email..."
            variant="admin"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-federal/20 focus:border-federal appearance-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="ready-for-pickup">Ready for Pickup</option>
              <option value="picked-up">Picked Up</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results summary */}
      {(searchQuery || statusFilter !== "all") && (
        <div className="text-sm text-gray-600">
          Showing {filteredOrders.length} of {orders.length} orders
          {searchQuery && ` matching "${searchQuery}"`}
          {statusFilter !== "all" && ` with status "${statusFilter}"`}
        </div>
      )}

      {/* Orders Cards - All Screen Sizes */}
      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <div
            key={order.id}
            className="bg-white rounded-lg border border-gray-200 p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 font-mono text-sm">
                  {order.orderNumber}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {order.customer.name}
                </p>
                <div className="mt-2">{getStatusBadge(order.status)}</div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewOrder(order)}
                  className="h-8 w-8 p-0 flex-shrink-0"
                  title="View order details"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(order.id)}
                  className="h-8 w-8 p-0 flex-shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  title="Delete order"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
              <div>
                <span className="text-gray-500">Order Date:</span>
                <div className="font-medium">{formatDate(order.orderDate)}</div>
              </div>
              <div>
                <span className="text-gray-500">Bottles:</span>
                <div className="font-medium">
                  {getTotalBottles(order.items)} bottles
                </div>
              </div>
              <div>
                <span className="text-gray-500">Pickup:</span>
                <div className="font-medium text-xs">
                  {formatPickupDateTime(order.pickupDate, order.pickupTime)}
                </div>
              </div>
              <div>
                <span className="text-gray-500">Payment:</span>
                <div className="font-medium text-xs">
                  {order.paymentMethod
                    ? paymentMethodLabels[order.paymentMethod] ||
                      order.paymentMethod
                    : "Not specified"}
                </div>
              </div>
            </div>

            {/* Status Update - Mobile */}
            <div className="flex items-center gap-2">
              <select
                value={statusUpdates[order.id] || order.status}
                onChange={(e) => handleStatusChange(order.id, e.target.value)}
                className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-federal/20 focus:border-federal"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                variant="accent"
                onClick={() => handleUpdateStatus(order.id)}
                disabled={statusUpdates[order.id] === order.status}
                className="px-3 py-1 text-xs"
              >
                Update
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Results Summary */}
      {!searchQuery && statusFilter === "all" && (
        <div className="text-sm text-gray-500">
          Showing {filteredOrders.length} order
          {filteredOrders.length !== 1 ? "s" : ""}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Delete Order</h3>
                  <p className="text-sm text-gray-600">
                    This action cannot be undone.
                  </p>
                </div>
              </div>
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete this order? This will
                permanently remove the order from both the database and local
                storage.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteOrder(showDeleteConfirm)}
                  className="flex-1"
                >
                  Delete Order
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50"
          onClick={handleBackdropClick}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-3 sm:p-6 border-b border-gray-200">
              <h2 className="font-playfair text-xl font-semibold text-gray-900">
                Order Details
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseModal}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
              {/* Order Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">
                    Order Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Order #:</span>
                      <span className="ml-2 font-mono font-medium">
                        {selectedOrder.orderNumber}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Order Date:</span>
                      <span className="ml-2">
                        {formatDate(selectedOrder.orderDate)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <span className="ml-2">
                        {getStatusBadge(selectedOrder.status)}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-3">
                    Customer Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span>{selectedOrder.customer.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{selectedOrder.customer.email}</span>
                    </div>
                    {selectedOrder.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{selectedOrder.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Pickup & Payment Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">
                    Pickup Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>
                        {formatPickupDateTime(
                          selectedOrder.pickupDate,
                          selectedOrder.pickupTime,
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-3">
                    Payment Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-gray-400" />
                      <span>
                        {selectedOrder.paymentMethod
                          ? paymentMethodLabels[selectedOrder.paymentMethod]
                          : "Not specified"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottle List */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Bottle List</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Item
                          </th>
                          <th className="px-2 sm:px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase w-16">
                            Qty
                          </th>
                          <th className="px-2 sm:px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase w-20">
                            Price
                          </th>
                          <th className="px-2 sm:px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase w-24">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedOrder.items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-2 sm:px-4 py-2 text-sm text-gray-900">
                              {item.name}
                            </td>
                            <td className="px-2 sm:px-4 py-2 text-sm text-gray-900 text-center">
                              {item.quantity}
                            </td>
                            <td className="px-2 sm:px-4 py-2 text-sm text-gray-900 text-right">
                              ${item.price.toFixed(2)}
                            </td>
                            <td className="px-2 sm:px-4 py-2 text-sm font-medium text-gray-900 text-right">
                              ${(item.price * item.quantity).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50">
                          <td
                            colSpan={3}
                            className="px-2 sm:px-4 py-2 text-sm font-medium text-gray-900 text-right"
                          >
                            Total:
                          </td>
                          <td className="px-2 sm:px-4 py-2 text-sm font-bold text-wine text-right">
                            ${selectedOrder.total.toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Order Notes */}
              {selectedOrder.orderNotes && (
                <div>
                  <h3 className="flex items-center gap-2 font-medium text-gray-900 mb-3">
                    <FileText className="h-4 w-4" />
                    Order Notes
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedOrder.orderNotes}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 p-3 sm:p-6">
              <div className="flex justify-end">
                <Button variant="outline" onClick={handleCloseModal}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
