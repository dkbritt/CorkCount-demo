import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import Checkout from "./pages/Checkout";
import CheckoutConfirmation from "./pages/CheckoutConfirmation";
import { PlaceholderPage } from "@/components/PlaceholderPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />

          {/* Admin Dashboard */}
          <Route path="/admin-dashboard" element={<AdminDashboard />} />

          {/* Checkout Routes */}
          <Route path="/checkout" element={<Checkout />} />
          <Route
            path="/checkout/confirmation"
            element={<CheckoutConfirmation />}
          />

          {/* Customer Routes */}
          <Route
            path="/collections"
            element={
              <PlaceholderPage
                title="Wine Collections"
                description="Explore our curated wine collections organized by region, type, and occasion."
                userRole="customer"
              />
            }
          />
          <Route
            path="/about"
            element={
              <PlaceholderPage
                title="About KB Winery"
                description="Learn about our passion for wine and our mission to bring you the finest selections."
                userRole="customer"
              />
            }
          />
          <Route
            path="/contact"
            element={
              <PlaceholderPage
                title="Contact Us"
                description="Get in touch with our wine experts for recommendations and support."
                userRole="customer"
              />
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <PlaceholderPage
                title="Admin Dashboard"
                description="Welcome to the KB Winery administration panel. Manage your wine inventory and orders."
                userRole="admin"
              />
            }
          />
          <Route
            path="/admin/inventory"
            element={
              <PlaceholderPage
                title="Inventory Management"
                description="Manage your wine inventory, add new wines, and track stock levels."
                userRole="admin"
              />
            }
          />
          <Route
            path="/admin/orders"
            element={
              <PlaceholderPage
                title="Order Management"
                description="View and manage customer orders, process shipments, and track deliveries."
                userRole="admin"
              />
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <PlaceholderPage
                title="Analytics & Reports"
                description="View sales analytics, inventory reports, and business insights."
                userRole="admin"
              />
            }
          />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
