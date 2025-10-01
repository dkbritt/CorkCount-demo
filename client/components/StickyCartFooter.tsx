import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";

interface StickyCartFooterProps {
  itemCount: number;
  totalPrice: number;
  onOpenCart: () => void;
  className?: string;
}

export function StickyCartFooter({ 
  itemCount, 
  totalPrice, 
  onOpenCart,
  className = ""
}: StickyCartFooterProps) {
  if (itemCount === 0) return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-40 ${className}`}>
      <Button
        variant="accent"
        onClick={onOpenCart}
        className="w-full h-12 gap-3 text-base"
      >
        {/* Cart Icon with Badge */}
        <div className="relative">
          <ShoppingCart className="h-5 w-5" />
          <Badge className="absolute -top-2 -right-2 bg-white text-federal text-xs min-w-[18px] h-[18px] flex items-center justify-center p-0">
            {itemCount > 99 ? "99+" : itemCount}
          </Badge>
        </div>
        
        {/* Cart Summary */}
        <div className="flex items-center gap-2">
          <span>View Cart</span>
          <span>•</span>
          <span className="font-bold">
            ${totalPrice.toFixed(2)}
          </span>
        </div>
      </Button>
    </div>
  );
}
