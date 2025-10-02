import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, AlertCircle, Loader2, Info } from "lucide-react";
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

  useEffect(() => {
    if (isOpen) {
      setEmail("admin@corkcount.com");
      setPassword("admin123");
      setError("");
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

    setIsLoading(true);
    const validEmail = "admin@corkcount.com";
    const validPassword = "admin123";

    setTimeout(() => {
      if (email.trim().toLowerCase() === validEmail && password === validPassword) {
        toast({ title: "Login successful", description: "Demo admin access granted." });
        onLogin();
        onClose();
        setEmail("");
        setPassword("");
        setIsLoading(false);
      } else {
        setError("Invalid email or password");
        toast({ title: "Login failed", description: "Use demo credentials shown below.", variant: "destructive" });
        setIsLoading(false);
      }
    }, 500);
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
            Admin Login (Demo)
          </h2>
          <div className="flex items-start gap-2 text-sm text-gray-700 bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <Info className="h-4 w-4 text-yellow-700 mt-0.5" />
            <div>
              <p><span className="font-medium">Use demo credentials:</span></p>
              <p>Email: <code className="bg-white px-1 rounded border">admin@corkcount.com</code></p>
              <p>Password: <code className="bg-white px-1 rounded border">admin123</code></p>
            </div>
          </div>
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

      </div>
    </div>
  );
}
