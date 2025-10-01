import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Wine,
  ShoppingCart,
  Home,
  Package,
  ClipboardList,
  BarChart3
} from "lucide-react";

interface NavigationProps {
  cartItemCount?: number;
  userRole?: "customer" | "admin";
  onOpenCart?: () => void;
  onOpenAdminLogin?: () => void;
}

export function Navigation({
  cartItemCount = 0,
  userRole = "customer",
  onOpenCart,
  onOpenAdminLogin
}: NavigationProps) {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Top Navigation - Logo, Admin Login, Cart, Search */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-wine rounded-lg flex items-center justify-center">
                <Wine className="h-5 w-5 text-white" />
              </div>
              <span className="font-playfair font-bold text-xl text-wine">
                CorkCount
              </span>
            </Link>

            {/* Desktop Navigation - Only for Admin */}
            {userRole === "admin" && (
              <div className="hidden md:flex items-center space-x-8">
                <Link 
                  to="/admin-dashboard" 
                  className={`text-sm font-medium transition-colors ${
                    isActive("/admin-dashboard") ? "text-wine" : "text-gray-600 hover:text-wine"
                  }`}
                >
                  Dashboard
                </Link>
              </div>
            )}

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
              {/* Admin Login Button - Always shown for customers */}
              {userRole === "customer" && (
                <Button
                  variant="navigation"
                  size="sm"
                  className="hidden sm:flex"
                  onClick={onOpenAdminLogin}
                >
                  Admin Login
                </Button>
              )}

              {/* Shopping Cart - Only for customers */}
              {userRole === "customer" && (
                <Button
                  variant="navigation"
                  size="icon"
                  onClick={onOpenCart}
                  className="relative"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {cartItemCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 bg-wine text-white text-xs min-w-[18px] h-[18px] flex items-center justify-center p-0">
                      {cartItemCount > 99 ? "99+" : cartItemCount}
                    </Badge>
                  )}
                </Button>
              )}

              {/* Mobile Admin Login */}
              {userRole === "customer" && (
                <div className="flex sm:hidden">
                  <Button
                    variant="navigation"
                    size="sm"
                    onClick={onOpenAdminLogin}
                    className="text-xs px-2"
                  >
                    Admin
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Bottom Navigation - Only for mobile customers */}
      {userRole === "customer" && (
        <>
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
            <div className="flex items-center justify-around px-4 py-2">
              <Link
                to="/"
                className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors ${
                  isActive("/") ? "text-wine bg-wine/10" : "text-gray-600"
                }`}
              >
                <Home className="h-5 w-5" />
                <span className="text-xs font-medium">Shop</span>
              </Link>

              <button
                onClick={onOpenCart}
                className="flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors text-gray-600 relative"
              >
                <ShoppingCart className="h-5 w-5" />
                <span className="text-xs font-medium">Cart</span>
                {cartItemCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 bg-wine text-white text-xs min-w-[18px] h-[18px] flex items-center justify-center p-0">
                    {cartItemCount > 99 ? "99+" : cartItemCount}
                  </Badge>
                )}
              </button>
            </div>
          </nav>
          {/* Spacer for bottom navigation */}
        </>
      )}

      {/* Bottom Navigation - Admin */}
      {userRole === "admin" && (
        <>
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
            <div className="flex items-center justify-around px-2 py-2">
              <Link 
                to="/admin-dashboard" 
                className={`flex flex-col items-center gap-1 py-2 px-2 rounded-lg transition-colors ${
                  isActive("/admin-dashboard") ? "text-wine bg-wine/10" : "text-gray-600"
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                <span className="text-xs font-medium">Metrics</span>
              </Link>
              <button 
                className="flex flex-col items-center gap-1 py-2 px-2 rounded-lg transition-colors text-gray-600"
              >
                <Package className="h-4 w-4" />
                <span className="text-xs font-medium">Inventory</span>
              </button>
              <button 
                className="flex flex-col items-center gap-1 py-2 px-2 rounded-lg transition-colors text-gray-600"
              >
                <ShoppingCart className="h-4 w-4" />
                <span className="text-xs font-medium">Orders</span>
              </button>
              <button 
                className="flex flex-col items-center gap-1 py-2 px-2 rounded-lg transition-colors text-gray-600"
              >
                <ClipboardList className="h-4 w-4" />
                <span className="text-xs font-medium">Batches</span>
              </button>
            </div>
          </nav>
          {/* Spacer for bottom navigation */}
          <div className="md:hidden h-16" />
        </>
      )}
    </>
  );
}
