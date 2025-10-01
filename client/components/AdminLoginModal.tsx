import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, AlertCircle, Loader2 } from "lucide-react";
import { secureSupabase, isSupabaseConfigured } from "@/lib/secureSupabase";
import { useToast } from "@/hooks/use-toast";

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}

export function AdminLoginModal({
  isOpen,
  onClose,
  onLogin,
}: AdminLoginModalProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [supabaseConfigured, setSupabaseConfigured] = useState<boolean | null>(
    null,
  );

  // Check Supabase configuration on mount
  useEffect(() => {
    if (isOpen) {
      isSupabaseConfigured().then(setSupabaseConfigured);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (supabaseConfigured === false) {
      setError("Admin login is disabled until Supabase is configured.");
      toast({
        title: "Supabase not configured",
        description:
          "Database connection is not available. Please contact the administrator.",
        variant: "destructive",
      });
      return;
    }

    if (supabaseConfigured === null) {
      setError("Checking configuration...");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error: authError } =
        await secureSupabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

      if (authError) {
        setError(authError.message || "Invalid email or password");
        toast({
          title: "Login failed",
          description:
            authError.message || "Please check your credentials and try again.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (data.user) {
        toast({
          title: "Login successful",
          description: "Welcome to the admin dashboard!",
        });
        onLogin();
        onClose();
        setEmail("");
        setPassword("");
      }
    } catch (err) {
      setError("An unexpected error occurred during login");
      toast({
        title: "Login error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="mb-6">
          <h2 className="font-playfair text-2xl font-bold text-gray-900 mb-2">
            Admin Login
          </h2>
          <p className="text-gray-600">Sign in to access the admin dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-wine focus:border-transparent"
              placeholder="admin@example.com"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-wine focus:border-transparent"
              placeholder="Enter your password"
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            variant="accent"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        {/* Configuration Status */}
        {supabaseConfigured === false && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-1">Database not configured</p>
                <p>
                  Admin login is disabled. Please contact the administrator to
                  enable authentication.
                </p>
              </div>
            </div>
          </div>
        )}

        {supabaseConfigured === null && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-3">
              <Loader2 className="h-5 w-5 text-blue-400 mt-0.5 animate-spin" />
              <div className="text-sm text-blue-600">
                <p className="font-medium mb-1">Checking configuration...</p>
                <p>Verifying database connection.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
