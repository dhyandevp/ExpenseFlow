import { Dialog, DialogPanel } from "@headlessui/react";
import { X, LogIn, UserPlus } from "lucide-react";
import { useState } from "react";
import { useSignIn, useSignUp } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Logo from "../Logo";
import { modalSpring } from "../../utils/motion";

export default function SignInModal({ isOpen, onClose }) {
  const { isLoaded: isSignInLoaded, signIn, setActive: setSignInActive } = useSignIn();
  const { isLoaded: isSignUpLoaded, signUp, setActive: setSignUpActive } = useSignUp();
  
  const [activeTab, setActiveTab] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const isSignUp = activeTab === "signup";

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setError("");
    setFieldErrors({});
    setAgreedToTerms(false);
    setPendingVerification(false);
    setCode("");
  };

  const handleOAuth = async (strategy) => {
    if (!isSignInLoaded) return;
    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/setup",
      });
    } catch (err) {
      setError(err.errors?.[0]?.message || "OAuth failed");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!email.trim()) newErrors.email = "Email is required.";
    if (!password.trim()) newErrors.password = "Password is required.";
    if (isSignUp && !agreedToTerms) newErrors.terms = "You must agree to the Terms and Privacy Policy.";
    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }

    if (!isSignInLoaded || !isSignUpLoaded) return;
    setError("");
    setFieldErrors({});
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign Up Flow
        const res = await signUp.create({ emailAddress: email, password });
        
        if (res.status === "complete") {
          await setSignUpActive({ session: res.createdSessionId });
          onClose();
        } else {
          await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
          setPendingVerification(true);
        }
      } else {
        // Sign In Flow
        const result = await signIn.create({
          identifier: email,
          password,
        });
        if (result.status === "complete") {
          try {
            await setSignInActive({ session: result.createdSessionId });
          } catch(e) {
            if (result.createdSessionId === "sess_mock") {
              const stored = localStorage.getItem("expenseflow_group");
              if (stored) {
                 const group = JSON.parse(stored);
                 window.location.href = `/group/${group.code}/dashboard`;
              }
            }
          }
          onClose();
        } else {
          setError("Incomplete sign in.");
        }
      }
    } catch (err) {
      console.error("SignIn Error:", err);
      setError(err?.message || err?.errors?.[0]?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!isSignUpLoaded) return;
    setLoading(true);
    setError("");
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({ code });
      if (completeSignUp.status === "complete") {
        await setSignUpActive({ session: completeSignUp.createdSessionId });
        onClose();
      } else {
        setError("Verification failed.");
      }
    } catch (err) {
      setError(err?.message || err?.errors?.[0]?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          as={motion.div}
          initial={modalSpring.initial}
          animate={modalSpring.animate}
          exit={modalSpring.exit}
          transition={modalSpring.transition}
          className="mx-auto w-full max-w-md bg-surface/70 backdrop-blur-xl border border-border shadow-2xl rounded-3xl relative p-8"
        >

          {/* Close Button */}
          <button
            aria-label="Close"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-text-muted hover:text-text-dark rounded-xl hover:bg-surface/50 transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <Logo size={24} />
            <span className="font-heading font-bold text-lg text-text-dark tracking-tight">ExpenseFlow</span>
          </div>

          {/* Dual Tab Switcher */}
          <div className="flex bg-muted/20 rounded-xl p-1 mb-6">
            <button
              onClick={() => handleTabSwitch("signin")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === "signin"
                  ? "bg-primary text-white shadow-md"
                  : "text-text-muted hover:text-text-dark"
              }`}
            >
              <LogIn size={15} />
              Sign In
            </button>
            <button
              onClick={() => handleTabSwitch("signup")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === "signup"
                  ? "bg-primary text-white shadow-md"
                  : "text-text-muted hover:text-text-dark"
              }`}
            >
              <UserPlus size={15} />
              Create Account
            </button>
          </div>

          {/* Google OAuth */}
          <button
            onClick={() => handleOAuth("oauth_google")}
            className="w-full flex items-center justify-center gap-3 bg-surface hover:brightness-95 border border-border text-text-dark font-medium py-3 px-4 rounded-xl transition-all shadow-sm"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="relative flex items-center gap-4 my-6">
            <div className="h-px bg-border flex-1"></div>
            <span className="text-xs text-text-muted font-medium">or continue with email</span>
            <div className="h-px bg-border flex-1"></div>
          </div>
          
          {/* Form */}
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
                  onChange={e => setCode(e.target.value)}
                  required
                  className="input-field text-center tracking-widest font-mono"
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
                {loading ? "Verifying..." : "Verify Account"}
              </button>
              <button
                type="button"
                onClick={() => setPendingVerification(false)}
                className="w-full text-text-muted hover:text-text-dark text-sm mt-2 transition-colors"
              >
                Back to Sign Up
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="signin-email" className="block text-sm font-medium text-text-dark mb-1">Email Address</label>
                <input
                  id="signin-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors(err => ({ ...err, email: null })); }}
                  required
                  className={`input-field ${fieldErrors.email ? 'border-accent ring-1 ring-accent' : ''}`}
                />
                {fieldErrors.email && <p className="text-accent text-xs mt-1">{fieldErrors.email}</p>}
              </div>
              <div>
                <label htmlFor="signin-password" className="block text-sm font-medium text-text-dark mb-1">Password</label>
                <input
                  id="signin-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors(err => ({ ...err, password: null })); }}
                  required
                  className={`input-field ${fieldErrors.password ? 'border-accent ring-1 ring-accent' : ''}`}
                />
                {fieldErrors.password && <p className="text-accent text-xs mt-1">{fieldErrors.password}</p>}
              </div>

              {isSignUp && (
                <div>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => { setAgreedToTerms(e.target.checked); if (fieldErrors.terms) setFieldErrors(err => ({ ...err, terms: null })); }}
                      className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-xs text-text-muted leading-relaxed">
                      I agree to the <Link to="/terms" className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>Terms of Service</Link> and <Link to="/privacy" className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>Privacy Policy</Link>.
                    </span>
                  </label>
                  {fieldErrors.terms && <p className="text-accent text-xs mt-1">{fieldErrors.terms}</p>}
                </div>
              )}

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
                {isSignUp ? <UserPlus size={18} /> : <LogIn size={18} />}
                {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
              </button>
            </form>
          )}

          {/* Bottom toggle text */}
          <p className="text-center text-sm text-text-muted mt-6">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}
            <button
              onClick={() => handleTabSwitch(isSignUp ? "signin" : "signup")}
              className="ml-1 text-primary hover:text-primary-hover font-semibold transition-colors"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
