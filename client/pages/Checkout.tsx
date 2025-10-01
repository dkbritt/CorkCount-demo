import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  CreditCard,
  User,
  Mail,
  Phone,
  FileText,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";
import { CartItem } from "@/components/CartModal";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { formatError } from "@/lib/errors";
import { sendOrderConfirmationEmail } from "@/lib/email";
import {
  validateEmail,
  normalizeEmail,
  validateCheckoutForm,
  type CheckoutFormData as ValidatedCheckoutFormData,
} from "@/lib/validation";

interface CheckoutFormData {
  customerName: string;
  email: string;
  phone: string;
  pickupDate: string;
  pickupTime: string;
  paymentMethod: string;
  orderNotes: string;
}

interface PaymentInstruction {
  method: string;
  instruction: string;
}

const timeSlots = [
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
];

const paymentMethods = [
  { value: "zelle", label: "Zelle" },
  { value: "cashapp", label: "CashApp" },
  { value: "cash", label: "Cash" },
];

const paymentInstructions: Record<string, string> = {
  zelle:
    "Send payment to KelvinB1@gmail.com before pickup. Include order # in the memo.",
  cashapp:
    "Send payment to $kbritt4u before pickup. Include order # in the notes.",
  cash: "Please bring exact change to pickup.",
};

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const cartItems: CartItem[] = location.state?.cartItems || [];
  const { toast } = useToast();

  const [formData, setFormData] = useState<CheckoutFormData>({
    customerName: "",
    email: "",
    phone: "",
    pickupDate: "",
    pickupTime: "",
    paymentMethod: "",
    orderNotes: "",
  });

  const [formErrors, setFormErrors] = useState<Partial<CheckoutFormData>>({});
  const [showPaymentInstruction, setShowPaymentInstruction] = useState(false);
  const [currentInstruction, setCurrentInstruction] = useState("");

  // Redirect if no cart items
  useEffect(() => {
    if (cartItems.length === 0) {
      navigate("/");
    }
  }, [cartItems, navigate]);

  // Scroll to top when checkout form opens
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.wine.price * item.quantity,
    0,
  );

  const validateForm = (): boolean => {
    // Use Zod-based validation
    const validation = validateCheckoutForm(formData);

    // Add custom validation for pickup date (not in past)
    const errors = { ...validation.errors };
    if (formData.pickupDate) {
      const selectedDate = new Date(formData.pickupDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        errors.pickupDate = "Pickup date cannot be in the past";
      }
    }

    setFormErrors(errors);
    return validation.isValid && !errors.pickupDate;
  };

  const generateOrderNumber = (): string => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
    const timeStr = Date.now().toString().slice(-3);
    return `ORD-${dateStr}-${timeStr}`;
  };

  const handleInputChange = (field: keyof CheckoutFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }

    // Real-time email validation using Zod
    if (field === "email" && value.trim()) {
      const emailValidation = validateEmail(value);
      if (!emailValidation.isValid) {
        setFormErrors((prev) => ({ ...prev, email: emailValidation.error }));
      }
    }

    // Handle payment method selection
    if (field === "paymentMethod" && value) {
      setCurrentInstruction(paymentInstructions[value]);
      setShowPaymentInstruction(true);
      setTimeout(() => setShowPaymentInstruction(false), 5000); // Hide after 5 seconds
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const orderNumber = generateOrderNumber();
    const orderData = {
      orderNumber,
      ...formData,
      items: cartItems,
      totalPrice,
      orderDate: new Date().toISOString(),
      status: "pending",
    };

    try {
      // Prepare bottles_ordered data for API
      const bottlesOrdered = cartItems.map((item) => ({
        wine_id: item.wine.id,
        wine_name: item.wine.name,
        wine_vintage: item.wine.vintage,
        wine_winery: item.wine.winery,
        quantity: item.quantity,
        price_per_bottle: item.wine.price,
        total_price: item.wine.price * item.quantity,
      }));

      // Create order via secure API (apiFetch handles routing automatically)

      const orderResponse = await apiFetch("/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber,
          customerName: formData.customerName.trim(),
          email: normalizeEmail(formData.email),
          phone: formData.phone?.trim() || null,
          pickupDate: formData.pickupDate,
          pickupTime: formData.pickupTime,
          paymentMethod: formData.paymentMethod,
          orderNotes: formData.orderNotes?.trim() || null,
          bottlesOrdered,
        }),
      });

      const orderResult = await orderResponse.json();

      if (!orderResponse.ok || !orderResult.success) {
        console.error("Order API error:", orderResult.error);
        toast({
          title: "Order failed",
          description:
            "There was an error processing your order. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Update inventory quantities after successful order
      try {
        const inventoryUpdates = cartItems.map((item) => ({
          id: item.wine.id,
          newQuantity: item.wine.inStock - item.quantity,
        }));

        const inventoryResponse = await apiFetch("/inventory/update", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ updates: inventoryUpdates }),
        });

        const inventoryResult = await inventoryResponse.json();

        if (!inventoryResponse.ok || !inventoryResult.success) {
          console.warn("Inventory update API error:", inventoryResult.error);
          // Don't fail the order for inventory update issues
        }
      } catch (inventoryError) {
        console.warn("Error updating inventory:", formatError(inventoryError));
        // Don't fail the order for inventory update issues
      }

      toast({
        title: "Order placed successfully!",
        description: `Your order ${orderNumber} has been submitted.`,
      });

      // Send order confirmation email
      try {
        const emailResult = await sendOrderConfirmationEmail({
          orderNumber,
          customerName: formData.customerName.trim(),
          customerEmail: normalizeEmail(formData.email),
          phone: formData.phone?.trim() || "",
          pickupDate: formData.pickupDate,
          pickupTime: formData.pickupTime,
          paymentMethod: formData.paymentMethod,
          items: cartItems,
          totalPrice,
          orderNotes: formData.orderNotes?.trim() || "",
        });

        if (emailResult.success) {
          const emailsSent = emailResult.emailsSent || 1;
          const adminSent = emailResult.adminSuccess;
          const customerSent = emailResult.customerSuccess;

          if (customerSent && adminSent) {
            toast({
              title: "Confirmation emails sent!",
              description: `Order confirmation sent to you and our team. Check your email for pickup details.`,
            });
          } else if (customerSent) {
            toast({
              title: "Customer confirmation sent!",
              description:
                "Check your email for order details. Admin notification may have failed.",
            });
          } else if (adminSent) {
            toast({
              title: "Admin notified!",
              description:
                "Our team was notified, but your confirmation email failed. Please contact us.",
              variant: "destructive",
            });
          }
        } else if (emailResult.partialSuccess) {
          toast({
            title: "Partial email success",
            description:
              emailResult.error ||
              "Some emails were sent, but not all. Please contact us if you don't receive confirmation.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Email delivery failed",
            description:
              emailResult.error ||
              "Order was created successfully, but confirmation emails failed to send.",
            variant: "destructive",
          });
        }
      } catch (emailError) {
        console.warn("Email sending failed:", emailError);
        const errorMessage =
          emailError instanceof Error ? emailError.message : "Unknown error";
        toast({
          title: "Email delivery error",
          description: `Order created successfully, but email failed: ${errorMessage}. Please save your order number: ${orderNumber}`,
          variant: "destructive",
        });
      }

      // Also save to localStorage as backup (minimized and bounded)
      const minimizeOrderForStorage = (o: typeof orderData) => ({
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        email: o.email,
        phone: o.phone || null,
        pickupDate: o.pickupDate,
        pickupTime: o.pickupTime,
        paymentMethod: o.paymentMethod,
        status: o.status,
        orderDate: o.orderDate,
        orderNotes: o.orderNotes || null,
        totalPrice: o.totalPrice,
        items: o.items.map((ci: CartItem) => ({
          quantity: ci.quantity,
          wine: {
            name: ci.wine.name,
            vintage: ci.wine.vintage,
            price: ci.wine.price,
          },
        })),
      });

      try {
        const existing = JSON.parse(
          localStorage.getItem("corkCountOrders") || "[]",
        );
        const pruned = existing.slice(0, 49); // keep at most 50
        pruned.unshift(minimizeOrderForStorage(orderData));
        localStorage.setItem("corkCountOrders", JSON.stringify(pruned));
      } catch (e1: any) {
        // Try with a much smaller list
        try {
          const fallbackList = [minimizeOrderForStorage(orderData)];
          localStorage.setItem("corkCountOrders", JSON.stringify(fallbackList));
        } catch (e2) {
          console.warn(
            "Skipping local backup of orders due to storage limits:",
            e2,
          );
          toast({
            title: "Order saved",
            description:
              "Local backup not saved due to storage limits. This will not affect your order.",
          });
        }
      }

      // Clear cart (new + legacy keys)
      localStorage.removeItem("kbCart");
      localStorage.removeItem("corkCountCart");

      // Navigate to confirmation
      navigate("/checkout/confirmation", {
        state: { orderData },
        replace: true,
      });
    } catch (error) {
      console.error("Error submitting order:", formatError(error));
      toast({
        title: "Order failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    navigate("/");
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split("T")[0];

  if (cartItems.length === 0) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-smoke">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="font-playfair text-2xl font-bold text-gray-900">
              Checkout
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Customer Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="flex items-center gap-2 font-playfair text-lg font-semibold text-gray-900 mb-4">
              <User className="h-5 w-5" />
              Customer Information
            </h2>

            <div className="space-y-4">
              {/* Customer Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) =>
                    handleInputChange("customerName", e.target.value)
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-federal/20 focus:border-federal ${
                    formErrors.customerName
                      ? "border-red-300"
                      : "border-gray-300"
                  }`}
                  placeholder="Enter your full name"
                />
                {formErrors.customerName && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.customerName}
                  </p>
                )}
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-federal/20 focus:border-federal ${
                    formErrors.email ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Enter your email address"
                  required
                  autoComplete="email"
                />
                <p className="mt-1 text-xs text-gray-500">
                  You'll receive order confirmation and pickup notifications at
                  this email. Accepts all standard formats including periods
                  (e.g., user.name@domain.com)
                </p>
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.email}
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number <span className="text-gray-500">(optional)</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-federal/20 focus:border-federal"
                  placeholder="Enter your phone number"
                />
              </div>
            </div>
          </div>

          {/* Pickup Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="flex items-center gap-2 font-playfair text-lg font-semibold text-gray-900 mb-4">
              <Calendar className="h-5 w-5" />
              Pickup Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pickup Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pickup Date *
                </label>
                <input
                  type="date"
                  value={formData.pickupDate}
                  onChange={(e) =>
                    handleInputChange("pickupDate", e.target.value)
                  }
                  min={today}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-federal/20 focus:border-federal ${
                    formErrors.pickupDate ? "border-red-300" : "border-gray-300"
                  }`}
                />
                {formErrors.pickupDate && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.pickupDate}
                  </p>
                )}
              </div>

              {/* Pickup Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pickup Time *
                </label>
                <select
                  value={formData.pickupTime}
                  onChange={(e) =>
                    handleInputChange("pickupTime", e.target.value)
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-federal/20 focus:border-federal ${
                    formErrors.pickupTime ? "border-red-300" : "border-gray-300"
                  }`}
                >
                  <option value="">Select pickup time</option>
                  {timeSlots.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
                {formErrors.pickupTime && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.pickupTime}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="flex items-center gap-2 font-playfair text-lg font-semibold text-gray-900 mb-4">
              <CreditCard className="h-5 w-5" />
              Payment Method
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method *
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) =>
                  handleInputChange("paymentMethod", e.target.value)
                }
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-federal/20 focus:border-federal ${
                  formErrors.paymentMethod
                    ? "border-red-300"
                    : "border-gray-300"
                }`}
              >
                <option value="">Select payment method</option>
                {paymentMethods.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
              {formErrors.paymentMethod && (
                <p className="mt-1 text-sm text-red-600">
                  {formErrors.paymentMethod}
                </p>
              )}

              {/* Payment Instructions Popup */}
              {showPaymentInstruction && currentInstruction && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-800">
                      {currentInstruction}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottle Summary */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="flex items-center gap-2 font-playfair text-lg font-semibold text-gray-900 mb-4">
              <FileText className="h-5 w-5" />
              Order Summary
            </h2>

            <div className="space-y-3 mb-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      {item.wine.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {item.wine.winery} • {item.wine.vintage}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        Qty: {item.quantity}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        ${item.wine.price.toFixed(2)} each
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      ${(item.wine.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-3">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900">
                  Total ({totalItems} item{totalItems !== 1 ? "s" : ""}):
                </span>
                <span className="font-bold text-xl text-wine">
                  ${totalPrice.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Order Notes */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="flex items-center gap-2 font-playfair text-lg font-semibold text-gray-900 mb-4">
              <FileText className="h-5 w-5" />
              Order Notes
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Instructions{" "}
                <span className="text-gray-500">(optional)</span>
              </label>
              <textarea
                value={formData.orderNotes}
                onChange={(e) =>
                  handleInputChange("orderNotes", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-federal/20 focus:border-federal"
                placeholder="Any special requests or notes for your order..."
                rows={3}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="flex-1 bg-smoke hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button type="submit" variant="accent" className="flex-1">
              Place Order
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
