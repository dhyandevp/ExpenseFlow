import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useSignIn } from "@clerk/clerk-react";
import { LogIn, ArrowLeft } from "lucide-react";
import Logo from "../components/Logo";
import SEO from "../components/SEO";
import GuestJoinModal from "../components/auth/GuestJoinModal";
import { validateReturnUrl } from "../lib/safeRedirect";
import { getSiteUrl } from "../lib/host";

export default function Login() {
  const [searchParams] = useSearchParams();
  const rawReturnUrl = searchParams.get("returnUrl");
  const returnUrl = validateReturnUrl(rawReturnUrl, "/home");

  const { isLoaded, signIn, setActive } = useSignIn();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isGuestOpen, setIsGuestOpen] = useState(false);

  const handleOAuth = async (strategy) => {
    if (!isLoaded) return;
    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: returnUrl,
      });
    } catch (err) {
      setError(err.errors?.[0]?.message || "OAuth failed");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLoaded) return;
    setError("");
    setLoading(true);

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        navigate(returnUrl, { replace: true });
      } else {
        setError("Sign in incomplete. Please check your credentials.");
      }
    } catch (err) {
      setError(err?.message || err?.errors?.[0]?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <SEO title="Sign In" noindex={true} />
      <GuestJoinModal isOpen={isGuestOpen} onClose={() => setIsGuestOpen(false)} />

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="flex justify-between items-center mb-6">
          <a
            href={getSiteUrl("/")}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text-dark transition-colors"
          >
            <ArrowLeft size={14} />
            ExpenseFlow Showcase
          </a>
        </div>

        <div className="flex items-center justify-center gap-2 mb-4">
          <Logo size={32} />
          <span className="font-heading font-bold text-2xl text-text-dark tracking-tight">ExpenseFlow</span>
        </div>
        <h2 className="text-center text-xl font-bold text-text-dark">
          Sign in to your account
        </h2>
        <p className="mt-1 text-center text-xs text-text-muted">
          Manage shared expenses and track fair contributions
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-surface/80 backdrop-blur-xl py-8 px-6 sm:px-10 border border-border shadow-xl rounded-3xl">
          <button
            onClick={() => handleOAuth("oauth_google")}
            className="w-full flex items-center justify-center gap-3 bg-surface hover:brightness-95 border border-border text-text-dark font-medium py-3 px-4 rounded-xl transition-all shadow-sm text-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <div className="relative flex items-center gap-4 my-6">
            <div className="h-px bg-border flex-1"></div>
            <span className="text-xs text-text-muted font-medium">or continue with email</span>
            <div className="h-px bg-border flex-1"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-text-dark mb-1">Email</label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-text-dark mb-1">Password</label>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm font-medium text-accent bg-accent/10 px-3 py-2.5 rounded-xl border border-accent/20">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3"
            >
              <LogIn size={16} />
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 flex flex-col gap-2 text-center text-xs text-text-muted">
            <p>
              Don't have an account?{" "}
              <Link to={`/signup?returnUrl=${encodeURIComponent(returnUrl)}`} className="text-primary hover:underline font-semibold">
                Sign up
              </Link>
            </p>
            <p>
              Have a group code?{" "}
              <button onClick={() => setIsGuestOpen(true)} className="text-primary hover:underline font-semibold">
                Join as guest
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
