import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Filter, X } from "lucide-react";

export interface FilterOptions {
  types: string[];
  priceRange: [number, number];
  inStockOnly: boolean;
}

interface FilterBarProps {
  onFiltersChange?: (filters: FilterOptions) => void;
  onClearFilters?: () => void;
  availableTypes?: string[];
  className?: string;
}

const DEFAULT_FILTERS: FilterOptions = {
  types: [],
  priceRange: [0, 1000],
  inStockOnly: false,
};

export function FilterBar({
  onFiltersChange,
  onClearFilters,
  availableTypes = ["Red Wine", "White Wine", "Rosé", "Sparkling", "Dessert Wine"],
  className = ""
}: FilterBarProps) {
  const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTERS);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const updateFilters = (newFilters: Partial<FilterOptions>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFiltersChange?.(updatedFilters);
  };

  const toggleFilter = (category: keyof Pick<FilterOptions, 'types'>, value: string) => {
    const current = filters[category];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    updateFilters({ [category]: updated });
  };

  const clearAllFilters = () => {
    setFilters(DEFAULT_FILTERS);
    onClearFilters?.();
    setActiveDropdown(null);
  };

  const hasActiveFilters = filters.types.length > 0 ||
                          filters.inStockOnly;

  const toggleDropdown = (dropdown: string) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {/* Filter Icon */}
      <div className="flex items-center gap-2 text-gray-600">
        <Filter className="h-4 w-4" />
        <span className="font-medium text-sm">Filters:</span>
      </div>

      {/* Wine Type Filter */}
      <div className="relative">
        <Button
          variant="navigation"
          size="sm"
          onClick={() => toggleDropdown('types')}
          className="gap-1"
        >
          Type {filters.types.length > 0 && `(${filters.types.length})`}
          <ChevronDown className="h-3 w-3" />
        </Button>
        
        {activeDropdown === 'types' && (
          <div className="absolute top-full left-0 right-0 sm:left-0 sm:right-auto mt-1 w-full sm:w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-2 space-y-1">
              {availableTypes.map((type) => (
                <label key={type} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.types.includes(type)}
                    onChange={() => toggleFilter('types', type)}
                    className="accent-federal"
                  />
                  <span className="text-sm">{type}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>


      {/* In Stock Only */}
      <Button
        variant={filters.inStockOnly ? "accent" : "navigation"}
        size="sm"
        onClick={() => updateFilters({ inStockOnly: !filters.inStockOnly })}
      >
        In Stock Only
      </Button>


      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 ml-2">
          {filters.types.map((type) => (
            <Badge key={type} variant="secondary" className="gap-1">
              {type}
              <button onClick={() => toggleFilter('types', type)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Clear All Filters */}
      {hasActiveFilters && (
        <Button
          variant="cancel"
          size="sm"
          onClick={clearAllFilters}
          className="gap-1 ml-auto"
        >
          <X className="h-3 w-3" />
          Clear All
        </Button>
      )}

      {/* Click outside to close dropdowns */}
      {activeDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setActiveDropdown(null)}
        />
      )}
    </div>
  );
}
