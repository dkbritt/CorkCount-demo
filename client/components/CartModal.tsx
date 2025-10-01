import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Minus, ShoppingBag, Trash2 } from "lucide-react";
import { Wine } from "@/components/WineCard";

export interface CartItem {
  wine: Wine;
  quantity: number;
  id: string;
}

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (itemId: string, newQuantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onCheckout?: () => void;
}

export function CartModal({ 
  isOpen, 
  onClose, 
  cartItems, 
  onUpdateQuantity, 
  onRemoveItem,
  onCheckout 
}: CartModalProps) {
  if (!isOpen) return null;

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + (item.wine.price * item.quantity), 0);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const incrementQuantity = (itemId: string, currentQuantity: number, maxStock: number) => {
    if (currentQuantity < maxStock) {
      onUpdateQuantity(itemId, currentQuantity + 1);
    }
  };

  const decrementQuantity = (itemId: string, currentQuantity: number) => {
    if (currentQuantity > 1) {
      onUpdateQuantity(itemId, currentQuantity - 1);
    } else {
      onRemoveItem(itemId);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-wine" />
            <h2 className="font-playfair text-xl font-semibold text-gray-900">
              Shopping Cart
            </h2>
            {totalItems > 0 && (
              <Badge className="bg-wine text-white">
                {totalItems} item{totalItems !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cartItems.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg text-gray-600 mb-2 font-playfair">
                Sip happens — your cart is empty!
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Add some wines to get started!
              </p>
              <Button
                variant="accent"
                onClick={onClose}
                className="mt-2"
              >
                Return to Shop
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-3 bg-gray-50 rounded-lg p-3">
                  {/* Wine Image */}
                  <div className="w-16 h-20 bg-gradient-to-b from-gray-100 to-gray-200 rounded-md flex items-center justify-center flex-shrink-0">
                    {item.wine.image ? (
                      <img 
                        src={item.wine.image} 
                        alt={item.wine.name}
                        className="w-full h-full object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-8 h-10 bg-wine/20 rounded flex items-center justify-center">
                        <svg className="w-4 h-4 text-wine" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 2v6h.01L6 8.01 10 12l-4 4-.01.01H6V22h12v-5.99h-.01L18 16l-4-4 4-3.99-.01-.01H18V2H6z"/>
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Wine Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-playfair font-medium text-gray-900 truncate">
                      {item.wine.name}
                    </h3>
                    <p className="text-sm text-gray-600 truncate">
                      {item.wine.winery} • {item.wine.vintage}
                    </p>
                    <p className="text-sm font-medium text-wine">
                      ${item.wine.price.toFixed(2)} each
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-gray-200 rounded-md">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => decrementQuantity(item.id, item.quantity)}
                          className="h-7 w-7 p-0 rounded-l-md rounded-r-none"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="px-2 py-1 text-sm font-medium min-w-[30px] text-center">
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => incrementQuantity(item.id, item.quantity, item.wine.inStock)}
                          disabled={item.quantity >= item.wine.inStock}
                          className="h-7 w-7 p-0 rounded-r-md rounded-l-none"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveItem(item.id)}
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Item Total */}
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      ${(item.wine.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="border-t border-gray-200 p-4 space-y-4">
            {/* Total */}
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-900">Total:</span>
              <span className="font-bold text-xl text-wine">
                ${totalPrice.toFixed(2)}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="cancel"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="accent"
                onClick={onCheckout}
                className="flex-1"
              >
                Proceed to Checkout
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
