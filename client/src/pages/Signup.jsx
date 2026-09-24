import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useSignUp } from "@clerk/clerk-react";
import { UserPlus, ArrowLeft } from "lucide-react";
import Logo from "../components/Logo";
import SEO from "../components/SEO";
import { validateReturnUrl } from "../lib/safeRedirect";
import { getSiteUrl } from "../lib/host";

export default function Signup() {
  const [searchParams] = useSearchParams();
  const rawReturnUrl = searchParams.get("returnUrl");
  const returnUrl = validateReturnUrl(rawReturnUrl, "/home");

  const { isLoaded, signUp, setActive } = useSignUp();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreedToTerms) {
      setError("You must agree to the Terms of Service and Privacy Policy.");
      return;
    }
    if (!isLoaded) return;
    setError("");
    setLoading(true);

    try {
      const res = await signUp.create({ emailAddress: email, password });
      if (res.status === "complete") {
        await setActive({ session: res.createdSessionId });
        navigate(returnUrl, { replace: true });
      } else {
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        setPendingVerification(true);
      }
    } catch (err) {
      setError(err?.message || err?.errors?.[0]?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!isLoaded) return;
    setLoading(true);
    setError("");
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({ code });
      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });
        navigate(returnUrl, { replace: true });
      } else {
        setError("Verification incomplete.");
      }
    } catch (err) {
      setError(err?.message || err?.errors?.[0]?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <SEO title="Create Account" noindex={true} />

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
          Create your ExpenseFlow account
        </h2>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-surface/80 backdrop-blur-xl py-8 px-6 sm:px-10 border border-border shadow-xl rounded-3xl">
          {pendingVerification ? (
            <form onSubmit={handleVerify} className="space-y-4">
              <p className="text-sm text-text-muted text-center mb-4">
                We sent a verification code to {email}.
              </p>
              <div>
                <input
                  type="text"
                  placeholder="Verification Code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  className="input-field text-center tracking-widest font-mono text-lg"
                />
              </div>
              {error && (
                <p className="text-sm font-medium text-accent bg-accent/10 px-3 py-2.5 rounded-xl border border-accent/20">
                  {error}
                </p>
              )}
              <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                {loading ? "Verifying..." : "Verify & Complete Signup"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="signup-email" className="block text-sm font-medium text-text-dark mb-1">Email</label>
                <input
                  id="signup-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="signup-password" className="block text-sm font-medium text-text-dark mb-1">Password</label>
                <input
                  id="signup-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="At least 8 characters"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-xs text-text-muted leading-relaxed">
                    I agree to the{" "}
                    <a href={getSiteUrl("/terms")} className="text-primary hover:underline" target="_blank" rel="noreferrer">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href={getSiteUrl("/privacy")} className="text-primary hover:underline" target="_blank" rel="noreferrer">
                      Privacy Policy
                    </a>.
                  </span>
                </label>
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
                <UserPlus size={16} />
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-xs text-text-muted">
            Already have an account?{" "}
            <Link to={`/login?returnUrl=${encodeURIComponent(returnUrl)}`} className="text-primary hover:underline font-semibold">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
