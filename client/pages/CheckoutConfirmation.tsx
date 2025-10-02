import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Calendar,
  Clock,
  CreditCard,
  User,
  Mail,
  Phone,
  FileText,
  ArrowLeft,
  Home,
} from "lucide-react";
import { CartItem } from "@/components/CartModal";

interface OrderData {
  orderNumber: string;
  customerName: string;
  email: string;
  phone: string;
  pickupDate: string;
  pickupTime: string;
  paymentMethod: string;
  orderNotes: string;
  items: CartItem[];
  totalPrice: number;
  orderDate: string;
  status: string;
}

const paymentMethodLabels: Record<string, string> = {
  zelle: "Zelle",
  cashapp: "CashApp",
  cash: "Cash",
};

const paymentInstructions: Record<string, string> = {
  zelle: "Send payment to pay@foxglovewinery.com before pickup.",
  cashapp: "Send payment to $FoxgloveWinery before pickup.",
  cash: "Please bring exact change to pickup.",
};

export default function CheckoutConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const orderData: OrderData = location.state?.orderData;

  useEffect(() => {
    if (!orderData) {
      navigate("/");
    }
    // Scroll to top when page loads
    window.scrollTo(0, 0);
  }, [orderData, navigate]);

  if (!orderData) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatOrderDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="min-h-screen bg-smoke">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
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
              Order Confirmation
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Success Message */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-playfair text-xl font-semibold text-green-900">
                Order Placed Successfully!
              </h2>
              <p className="text-green-700">
                Your order has been received and is being processed.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">
                Order Number:
              </span>
              <span className="font-mono font-bold text-lg text-gray-900">
                {orderData.orderNumber}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">
                Order Date:
              </span>
              <span className="text-sm text-gray-900">
                {formatOrderDate(orderData.orderDate)}
              </span>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="flex items-center gap-2 font-playfair text-lg font-semibold text-gray-900 mb-4">
            <User className="h-5 w-5" />
            Customer Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-600">Name:</span>
              <p className="text-gray-900">{orderData.customerName}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Email:</span>
              <p className="text-gray-900">{orderData.email}</p>
            </div>
            {orderData.phone && (
              <div className="md:col-span-2">
                <span className="text-sm font-medium text-gray-600">
                  Phone:
                </span>
                <p className="text-gray-900">{orderData.phone}</p>
              </div>
            )}
          </div>
        </div>

        {/* Pickup Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="flex items-center gap-2 font-playfair text-lg font-semibold text-gray-900 mb-4">
            <Calendar className="h-5 w-5" />
            Pickup Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-600">
                Pickup Date:
              </span>
              <p className="text-gray-900">
                {formatDate(orderData.pickupDate)}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">
                Pickup Time:
              </span>
              <p className="text-gray-900">{orderData.pickupTime}</p>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="flex items-center gap-2 font-playfair text-lg font-semibold text-gray-900 mb-4">
            <CreditCard className="h-5 w-5" />
            Payment Information
          </h3>

          <div className="mb-4">
            <span className="text-sm font-medium text-gray-600">
              Payment Method:
            </span>
            <p className="text-gray-900">
              {paymentMethodLabels[orderData.paymentMethod]}
            </p>
          </div>

          {/* Payment Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">
              Payment Instructions:
            </h4>
            <p className="text-blue-800">
              {paymentInstructions[orderData.paymentMethod]}
            </p>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="flex items-center gap-2 font-playfair text-lg font-semibold text-gray-900 mb-4">
            <FileText className="h-5 w-5" />
            Order Summary
          </h3>

          <div className="space-y-3 mb-4">
            {orderData.items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">
                    {item.wine.name}
                  </h4>
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
                Total (
                {orderData.items.reduce((sum, item) => sum + item.quantity, 0)}{" "}
                item
                {orderData.items.reduce(
                  (sum, item) => sum + item.quantity,
                  0,
                ) !== 1
                  ? "s"
                  : ""}
                ):
              </span>
              <span className="font-bold text-xl text-wine">
                ${orderData.totalPrice.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Order Notes */}
        {orderData.orderNotes && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h3 className="flex items-center gap-2 font-playfair text-lg font-semibold text-gray-900 mb-4">
              <FileText className="h-5 w-5" />
              Order Notes
            </h3>
            <p className="text-gray-700 whitespace-pre-wrap">
              {orderData.orderNotes}
            </p>
          </div>
        )}

        {/* Next Steps */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <h3 className="font-playfair text-lg font-semibold text-yellow-900 mb-3">
            What's Next?
          </h3>
          <div className="space-y-2 text-yellow-800">
            <p>• Complete your payment using the instructions above</p>
            <p>• You'll receive a confirmation email shortly</p>
            <p>• Arrive during your scheduled pickup time</p>
            <p>• Bring a valid ID and your order number</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="flex-1 gap-2"
          >
            <Home className="h-4 w-4" />
            Return to Shop
          </Button>
          <Button
            variant="accent"
            onClick={() => window.print()}
            className="flex-1"
          >
            Print Confirmation
          </Button>
        </div>
      </div>
    </div>
  );
}
