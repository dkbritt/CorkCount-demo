import { useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onClear?: () => void;
  className?: string;
  variant?: "storefront" | "admin";
}

export function SearchBar({
  placeholder = "Search by wine name or type",
  onSearch,
  onClear,
  className = "",
  variant = "storefront",
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(query);
  };

  const handleClear = () => {
    setQuery("");
    onClear?.();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    // Real-time search as user types
    onSearch?.(value);
  };

  const isAdmin = variant === "admin";

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div
        className={`relative flex items-center transition-all duration-300 ${
          isAdmin
            ? "bg-white border border-gray-300 rounded-lg focus-within:border-wine focus-within:ring-2 focus-within:ring-wine/20"
            : "wine-label-search"
        }`}
      >
        {/* Search Icon */}
        <div className="absolute left-4 flex items-center pointer-events-none z-10">
          <Search
            className={`h-5 w-5 ${isAdmin ? "text-gray-400" : "text-amber-700"}`}
          />
        </div>

        {/* Input Field */}
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={`w-full pl-12 pr-24 py-3 bg-transparent focus:outline-none z-10 relative ${
            isAdmin
              ? "text-gray-900 placeholder-gray-500 font-inter text-sm"
              : "wine-label-text wine-label-placeholder font-cormorant text-lg font-medium py-4"
          }`}
        />

        {/* Clear & Search Buttons */}
        <div className="absolute right-3 flex items-center gap-2 z-10">
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className={`h-8 w-8 p-0 rounded-md transition-colors ${
                isAdmin
                  ? "hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                  : "hover:bg-amber-100 text-amber-700"
              }`}
            >
              <X className="h-4 w-4" />
            </Button>
          )}

          <Button
            type="submit"
            size="sm"
            className={`h-8 px-3 text-sm font-medium border-0 shadow-sm transition-all duration-200 hover:shadow-md ${
              isAdmin
                ? "bg-wine hover:bg-wine/90 text-white"
                : "bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-cormorant hover:scale-105 active:scale-95"
            }`}
            disabled={!query.trim()}
          >
            Search
          </Button>
        </div>
      </div>
    </form>
  );
}
