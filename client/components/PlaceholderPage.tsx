import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Construction, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface PlaceholderPageProps {
  title: string;
  description?: string;
  userRole?: "customer" | "admin";
}

export function PlaceholderPage({ 
  title, 
  description = "This page is coming soon. Continue prompting to fill in this page content if you'd like it implemented.",
  userRole = "customer"
}: PlaceholderPageProps) {
  return (
    <div className="min-h-screen bg-smoke">
      <Navigation userRole={userRole} />
      
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          {/* Construction Icon */}
          <div className="w-24 h-24 bg-wine/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <Construction className="w-12 h-12 text-wine" />
          </div>

          {/* Title */}
          <h1 className="font-playfair text-4xl font-bold text-gray-900 mb-4">
            {title}
          </h1>

          {/* Description */}
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            {description}
          </p>

          {/* Back to Home Button */}
          <Link to="/">
            <Button variant="accent" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Wine Collection
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
