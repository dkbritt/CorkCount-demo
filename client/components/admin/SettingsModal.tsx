import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Settings, RefreshCw, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateExistingWineryNames } from "@/lib/updateWinery";
import { batchAutoTagInventory } from "@/lib/batchAutoTag";

export interface InventorySettings {
  lowStockThreshold: number;
  outOfStockThreshold: number;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: InventorySettings) => void;
  currentSettings: InventorySettings;
}

export function SettingsModal({
  isOpen,
  onClose,
  onSave,
  currentSettings,
}: SettingsModalProps) {
  const { toast } = useToast();
  const [lowStockThreshold, setLowStockThreshold] = useState(
    currentSettings.lowStockThreshold.toString(),
  );
  const [outOfStockThreshold, setOutOfStockThreshold] = useState(
    currentSettings.outOfStockThreshold.toString(),
  );
  const [errors, setErrors] = useState<{
    lowStock?: string;
    outOfStock?: string;
  }>({});
  const [isUpdatingWinery, setIsUpdatingWinery] = useState(false);
  const [isAutoTagging, setIsAutoTagging] = useState(false);

  // Update form when currentSettings change
  useEffect(() => {
    setLowStockThreshold(currentSettings.lowStockThreshold.toString());
    setOutOfStockThreshold(currentSettings.outOfStockThreshold.toString());
    setErrors({});
  }, [currentSettings]);

  const validateForm = (): boolean => {
    const newErrors: { lowStock?: string; outOfStock?: string } = {};

    const lowStock = parseInt(lowStockThreshold);
    const outOfStock = parseInt(outOfStockThreshold);

    if (isNaN(lowStock) || lowStock < 0) {
      newErrors.lowStock = "Must be a number ≥ 0";
    }

    if (isNaN(outOfStock) || outOfStock < 0) {
      newErrors.outOfStock = "Must be a number ≥ 0";
    }

    if (!isNaN(lowStock) && !isNaN(outOfStock) && lowStock <= outOfStock) {
      newErrors.lowStock =
        "Low stock threshold must be greater than out of stock threshold";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    const settings: InventorySettings = {
      lowStockThreshold: parseInt(lowStockThreshold),
      outOfStockThreshold: parseInt(outOfStockThreshold),
    };

    onSave(settings);
    onClose();
  };

  const handleResetToDefault = () => {
    setLowStockThreshold("5");
    setOutOfStockThreshold("0");
    setErrors({});
  };

  const handleUpdateWineryNames = async () => {
    setIsUpdatingWinery(true);
    try {
      const result = await updateExistingWineryNames();

      if (result.success) {
        toast({
          title: "Success!",
          description: `Updated ${result.updated} inventory records to "KB Winery"`,
        });
      } else {
        toast({
          title: "Update failed",
          description: result.error || "Failed to update winery names",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Update failed",
        description: "An unexpected error occurred while updating winery names",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingWinery(false);
    }
  };

  const handleAutoTagInventory = async () => {
    setIsAutoTagging(true);
    try {
      const result = await batchAutoTagInventory();
      if (result.success) {
        toast({
          title: "Auto-tagging Complete",
          description: `Successfully processed ${result.processed} wines. Generated flavor tags based on descriptions.`,
        });
      } else {
        toast({
          title: "Auto-tagging Issues",
          description: `Processed ${result.processed} wines, but ${result.failed} failed. Check console for details.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Auto-tagging error:", error);
      toast({
        title: "Error",
        description:
          "Auto-tagging failed. Make sure the database has a 'tags' column in the Inventory table.",
        variant: "destructive",
      });
    } finally {
      setIsAutoTagging(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-auto my-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-600" />
            <h2 className="font-playfair text-xl font-semibold text-gray-900">
              Inventory Alert Settings
            </h2>
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

        {/* Form Content */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* Low Stock Threshold */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Low Stock Threshold
            </label>
            <input
              type="number"
              value={lowStockThreshold}
              onChange={(e) => {
                setLowStockThreshold(e.target.value);
                if (errors.lowStock) {
                  setErrors((prev) => ({ ...prev, lowStock: undefined }));
                }
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-wine/20 focus:border-wine ${
                errors.lowStock ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="5"
              min="0"
            />
            {errors.lowStock && (
              <p className="mt-1 text-sm text-red-600">{errors.lowStock}</p>
            )}
            <p className="mt-1 text-sm text-gray-500 break-words">
              Bottles with quantity at or below this number will be marked as
              "Low Stock"
            </p>
          </div>

          {/* Out of Stock Threshold */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Out of Stock Threshold
            </label>
            <input
              type="number"
              value={outOfStockThreshold}
              onChange={(e) => {
                setOutOfStockThreshold(e.target.value);
                if (errors.outOfStock) {
                  setErrors((prev) => ({ ...prev, outOfStock: undefined }));
                }
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-wine/20 focus:border-wine ${
                errors.outOfStock ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="0"
              min="0"
            />
            {errors.outOfStock && (
              <p className="mt-1 text-sm text-red-600">{errors.outOfStock}</p>
            )}
            <p className="mt-1 text-sm text-gray-500 break-words">
              Bottles with quantity at or below this number will be marked as
              "Out of Stock"
            </p>
          </div>

          {/* Data Utilities */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Data Utilities
            </h3>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                <RefreshCw className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 mb-1">
                    Update Winery Names
                  </h4>
                  <p className="text-sm text-gray-600 mb-3 break-words">
                    Updates any existing "CorkCount Winery" entries in the
                    inventory to "KB Winery". This is a one-time utility to
                    rebrand existing data.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUpdateWineryNames}
                    disabled={isUpdatingWinery}
                    className="bg-white w-full sm:w-auto"
                  >
                    {isUpdatingWinery ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Update Winery Names
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                <Tag className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 mb-1">
                    Auto-Tag Wine Inventory
                  </h4>
                  <p className="text-sm text-gray-600 mb-3 break-words">
                    Automatically generates flavor tags for all wines based on
                    their flavor notes and descriptions. Tags include: Berry,
                    Earthy, Citrus, Floral, Chocolate, Vanilla, Spicy, Buttery,
                    Nutty, Herbal.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAutoTagInventory}
                    disabled={isAutoTagging}
                    className="bg-white w-full sm:w-auto"
                  >
                    {isAutoTagging ? (
                      <>
                        <Tag className="h-4 w-4 mr-2 animate-spin" />
                        Processing Tags...
                      </>
                    ) : (
                      <>
                        <Tag className="h-4 w-4 mr-2" />
                        Generate Auto-Tags
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 sm:p-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={handleResetToDefault}
            className="bg-smoke hover:bg-gray-100 w-full sm:w-auto order-2 sm:order-1"
          >
            Reset
          </Button>

          <div className="flex flex-col sm:flex-row gap-3 order-1 sm:order-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="accent"
              onClick={handleSave}
              className="w-full sm:w-auto"
            >
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
