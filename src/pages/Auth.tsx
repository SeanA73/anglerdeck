import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, Fish, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { SEO } from "@/components/SEO";

type AuthView = "login" | "signup" | "forgot";

const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  displayName: z.string().trim().min(2, "Display name must be at least 2 characters").max(50, "Display name must be less than 50 characters"),
});

const Auth = () => {
  const [view, setView] = useState<AuthView>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resetSent, setResetSent] = useState(false);

  const isLogin = view === "login";

  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signUp, user } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrors({ email: "Please enter your email address." });
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) throw error;
      setResetSent(true);
    } catch (err) {
      toast({
        title: "Reset failed",
        description: err instanceof Error ? err.message : "Could not send reset email.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateForm = () => {
    setErrors({});
    try {
      if (view === "login") {
        loginSchema.parse({ email, password });
      } else {
        signupSchema.parse({ email, password, displayName });
      }
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              title: "Invalid credentials",
              description: "The email or password you entered is incorrect.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Sign in failed",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Welcome back!",
            description: "You have successfully signed in.",
          });
          navigate("/");
        }
      } else {
        const { error } = await signUp(email, password, displayName);
        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              title: "Account exists",
              description: "An account with this email already exists. Try signing in.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Sign up failed",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Account created!",
            description: "Welcome to ReelSpot! You are now signed in.",
          });
          navigate("/");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <SEO title="Sign In" description="Sign in to ReelSpot" canonicalPath="/auth" noIndex />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4"
          >
            <Fish className="w-8 h-8 text-accent" />
          </motion.div>
          <h1 className="text-2xl font-bold text-foreground">
            {view === "login" ? "Welcome Back" : view === "signup" ? "Join ReelSpot" : "Reset Password"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {view === "login"
              ? "Sign in to access your fishing spots and catches"
              : view === "signup"
              ? "Create an account to start logging your adventures"
              : "Enter your email and we'll send you a reset link"}
          </p>
        </div>

        {/* Forgot Password View */}
        {view === "forgot" && (
          <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-card">
            {resetSent ? (
              <div className="text-center py-4 space-y-3">
                <p className="text-foreground font-medium">Check your inbox!</p>
                <p className="text-sm text-muted-foreground">
                  We sent a password reset link to <span className="font-medium">{email}</span>.
                  It may take a minute or two to arrive.
                </p>
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => { setView("login"); setResetSent(false); }}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="angler@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                <Button type="submit" variant="hero" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending…</>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setView("login")}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Sign In
                </Button>
              </form>
            )}
          </div>
        )}

        {/* Login / Signup View */}
        {view !== "forgot" && (
          <>
            {/* Form Card */}
            <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-card">
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="displayName"
                        type="text"
                        placeholder="Your fishing nickname"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {errors.displayName && (
                      <p className="text-sm text-destructive">{errors.displayName}</p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="angler@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    {isLogin && (
                      <button
                        type="button"
                        onClick={() => { setView("forgot"); setErrors({}); }}
                        className="text-xs text-accent hover:underline"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {isLogin ? "Signing in..." : "Creating account..."}
                    </>
                  ) : isLogin ? (
                    "Sign In"
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-border/50 text-center">
                <p className="text-sm text-muted-foreground">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setView(isLogin ? "signup" : "login");
                      setErrors({});
                    }}
                    className="text-accent hover:underline font-medium"
                  >
                    {isLogin ? "Sign up" : "Sign in"}
                  </button>
                </p>
              </div>
            </div>
          </>
        )}

        {/* Back to home */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/")}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to home
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
