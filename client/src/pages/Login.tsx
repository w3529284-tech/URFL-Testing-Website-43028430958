import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { AlertCircle } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isSignup) {
        // Sign up
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          setIsLoading(false);
          return;
        }

        const response = await fetch("/api/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
          queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
          toast({ title: "Success", description: "Account created successfully!" });
          setTimeout(() => setLocation("/"), 100);
        } else {
          const data = await response.json();
          setError(data.message || "Failed to create account");
        }
      } else {
        // Login
        const response = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
          queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
          toast({ title: "Success", description: "Logged in successfully" });
          setTimeout(() => setLocation("/"), 100);
        } else {
          setError("Invalid username or password");
        }
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black mb-2">URFL Fan Hub</h1>
          <p className="text-muted-foreground">
            {isSignup ? "Create your account" : "Sign in to your account"}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-md flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              data-testid="input-username"
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              data-testid="input-password"
              disabled={isLoading}
              required
            />
          </div>

          {isSignup && (
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                data-testid="input-confirm-password"
                disabled={isLoading}
                required
              />
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
            data-testid={isSignup ? "button-signup" : "button-login"}
          >
            {isLoading ? (isSignup ? "Creating account..." : "Signing in...") : (isSignup ? "Create account" : "Sign in")}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => {
                setIsSignup(!isSignup);
                setError("");
                setUsername("");
                setPassword("");
                setConfirmPassword("");
              }}
              className="text-primary hover:underline font-medium"
              disabled={isLoading}
            >
              {isSignup ? "Sign in" : "Sign up"}
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
}
