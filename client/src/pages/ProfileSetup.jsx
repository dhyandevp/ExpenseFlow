import SEO from "../components/SEO";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { createUserProfile } from "../api/client";

export function ProfileSetup() {
  const { user, authMode, refreshProfile, userProfile } = useAuth();
  const navigate = useNavigate();

// Removed explicit navigation, handled by ProtectedRoute


  const [displayName, setDisplayName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user && !displayName) {
      setDisplayName(user.fullName || user.firstName || "");
    }
  }, [user]); // Only populate initially

  const handleSave = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError("Please enter a display name.");
      return;
    }
    
    setError("");
    setIsSaving(true);
    
    try {
      console.log("[ProfileSetup] profile_save_started", { userIdPresent: !!user?.id });
      
      await createUserProfile(user.id, {
        displayName: displayName.trim(),
        email: user.primaryEmailAddress?.emailAddress || null,
        photoURL: user.imageUrl || null,
      });
      
      console.log("[ProfileSetup] profile_save_success", { userId: user.id });
      await refreshProfile();
      // Navigate to home handled by useEffect above when userProfile updates
    } catch (err) {
      console.error("[ProfileSetup] profile_save_failed", { 
        code: err.code,
        message: err.message,
        userIdPresent: !!user?.id
      });
      setError("Couldn't save your profile. Please try again.");
      setIsSaving(false);
    }
  };

  if (authMode !== "clerk") return null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative z-0">
      {/* Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[20%] -right-[10%] w-[40vh] h-[40vh] rounded-full bg-success opacity-15 blur-[120px] mix-blend-multiply" />
        <div className="absolute -bottom-[10%] left-[20%] w-[60vh] h-[60vh] rounded-full bg-highlight opacity-30 blur-[100px] mix-blend-multiply" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-surface border border-border shadow-xl rounded-2xl p-8"
      >
        <div className="text-center mb-8">
          <h1 className="font-heading font-bold text-2xl text-text-dark mb-2">
            Welcome to ExpenseFlow
          </h1>
          <p className="text-text-muted">
            Let's set up your profile before you continue.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="text-sm font-medium text-text-muted self-start w-full text-center">
              Profile photo
            </div>
            <img 
              src={user?.imageUrl} 
              alt="Your Profile" 
              className="w-20 h-20 rounded-full ring-4 ring-background shadow-md object-cover"
            />
            <p className="text-xs text-text-muted">
              Using your connected account profile photo.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">
              How should we display your name?
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                if (error) setError("");
              }}
              placeholder="e.g. Alex"
              className="input-field w-full"
              maxLength={40}
              autoFocus
            />
            {error && <p className="text-accent text-xs mt-2">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={isSaving || !displayName.trim()}
            className="btn-primary w-full py-3 mt-4"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                Saving...
              </span>
            ) : (
              "Continue →"
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default function ProfileSetupWrapper(props) {
  return (
    <>
      <SEO title="Profile Setup" />
      <ProfileSetup {...props} />
    </>
  );
}
