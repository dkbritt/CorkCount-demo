import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Calendar, Wine as WineIcon, Plus, Minus } from "lucide-react";
import { Wine } from "@/components/WineCard";
import { useState, useMemo } from "react";
import { autoTagWine, formatTagsForDisplay } from "@/lib/autoTagger";

interface WineDetailsModalProps {
  wine: Wine;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (wine: Wine, quantity: number) => void;
}

export function WineDetailsModal({
  wine,
  isOpen,
  onClose,
  onAddToCart,
}: WineDetailsModalProps) {
  const [quantity, setQuantity] = useState(1);

  // Generate tags from flavor notes and description
  const displayTags = useMemo(() => {
    const autoTags = autoTagWine({
      flavorNotes: wine.flavorNotes || wine.description,
      description: wine.description,
      name: wine.name,
      type: wine.type,
    });
    const finalTags = wine.tags && wine.tags.length > 0 ? wine.tags : autoTags;
    return formatTagsForDisplay(finalTags);
  }, [wine.flavorNotes, wine.description, wine.name, wine.type, wine.tags]);

  if (!isOpen) return null;

  const isAvailable = wine.inStock > 0;
  const isLowStock = wine.inStock > 0 && wine.inStock <= 5;

  const incrementQuantity = () => {
    if (quantity < wine.inStock) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleAddToCart = () => {
    onAddToCart?.(wine, quantity);
    setQuantity(1);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getWineTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "red":
        return "bg-wine text-white";
      case "white":
        return "bg-yellow-500 text-white";
      case "rosé":
        return "bg-pink-500 text-white";
      case "sparkling":
        return "bg-federal text-white";
      case "dessert":
        return "bg-amber-600 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="font-playfair text-2xl font-bold text-gray-900">
              Wine Details
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Complete information about this wine
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Wine Image and Basic Info */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Wine Image */}
            <div className="flex-shrink-0">
              <div className="w-48 h-64 bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg overflow-hidden mx-auto md:mx-0">
                {wine.image ? (
                  <img
                    src={wine.image}
                    alt={wine.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-16 h-20 bg-wine/20 rounded-lg flex items-center justify-center">
                      <WineIcon className="w-8 h-8 text-wine" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Basic Wine Info */}
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="font-playfair text-2xl font-bold text-gray-900 mb-2">
                  {wine.name}
                </h3>
                <p className="text-lg text-gray-600 mb-3">{wine.winery}</p>
              </div>

              {/* Wine Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Vintage:</span>
                  <span className="text-sm font-medium">{wine.vintage}</span>
                </div>

                <div className="flex items-center gap-2">
                  <WineIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Type:</span>
                  <Badge
                    className={`text-xs px-2 py-1 ${getWineTypeColor(wine.type)}`}
                  >
                    {wine.type}
                  </Badge>
                </div>
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Stock:</span>
                <span
                  className={`text-sm font-medium ${!isAvailable ? "text-red-600" : isLowStock ? "text-orange-600" : "text-green-600"}`}
                >
                  {isAvailable
                    ? `${wine.inStock} bottles available`
                    : "Out of stock"}
                </span>
                {isLowStock && (
                  <Badge className="bg-orange-500 text-white text-xs px-2 py-1">
                    Low Stock
                  </Badge>
                )}
              </div>

              {/* Price */}
              <div className="text-3xl font-bold text-wine">
                ${wine.price.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Flavor Notes */}
          {(wine.flavorNotes || wine.description) && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">
                Tasting Notes
              </h4>
              <p className="text-gray-700 text-sm leading-relaxed">
                {wine.flavorNotes || wine.description}
              </p>
            </div>
          )}

          {/* Wine Tags */}
          {displayTags.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">
                Flavor Profile
              </h4>
              <div className="flex flex-wrap gap-2">
                {displayTags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 border-0 rounded-full"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Add to Cart Section */}
          {isAvailable && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <h4 className="font-semibold text-gray-900">Add to Cart</h4>

              {/* Quantity Selector */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">Quantity:</span>
                <div className="flex items-center border border-gray-200 rounded-lg">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={decrementQuantity}
                    disabled={quantity <= 1}
                    className="h-8 w-8 p-0 rounded-l-lg rounded-r-none"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="px-4 py-1 text-sm font-medium min-w-[50px] text-center">
                    {quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={incrementQuantity}
                    disabled={quantity >= wine.inStock}
                    className="h-8 w-8 p-0 rounded-r-lg rounded-l-none"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <span className="text-xs text-gray-500">
                  {wine.inStock} available
                </span>
              </div>

              {/* Total Price */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total:</span>
                <span className="text-xl font-bold text-wine">
                  ${(wine.price * quantity).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {isAvailable && (
            <Button
              variant="accent"
              onClick={handleAddToCart}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add to Cart
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
