import SEO from "../components/SEO";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, LogOut, Check, Save } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { updateUserProfile } from "../api/client";

export function Profile() {
  const { user, userProfile, refreshProfile, signOut, authMode } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(userProfile?.displayName || user?.fullName || "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(""); // '' | 'success' | 'error'

  const handleSave = async (e) => {
    e.preventDefault();
    if (!displayName.trim() || displayName.trim() === userProfile?.displayName) {
      return;
    }
    
    setSaveStatus("");
    setIsSaving(true);
    
    try {
      await updateUserProfile(user.id, {
        displayName: displayName.trim(),
      });
      await refreshProfile();
      setSaveStatus("success");
      setTimeout(() => setSaveStatus(""), 3000);
    } catch (err) {
      console.error(err);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (authMode !== "clerk") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <h2 className="font-heading font-bold text-xl text-text-dark mb-4">Guest Session</h2>
        <p className="text-text-muted mb-8 text-center max-w-sm">
          You are signed in as a guest. Your session is temporary.
        </p>
        <button onClick={handleSignOut} className="btn-primary flex items-center gap-2">
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative z-0">
      <header className="px-6 py-4 max-w-2xl mx-auto flex items-center gap-3 w-full">
        <Link to="/home" className="p-2 rounded-lg hover:bg-surface transition-colors">
          <ArrowLeft size={20} className="text-text-muted" />
        </Link>
        <h1 className="font-heading font-bold text-lg text-text-dark">Account</h1>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-8">
        
        <section className="card p-6 md:p-8 mb-8">
          <h2 className="font-heading font-bold text-lg text-text-dark mb-6">Profile</h2>
          
          <div className="flex flex-col sm:flex-row gap-8 items-start">
            <div className="flex flex-col items-center gap-3 shrink-0">
              <img 
                src={user?.imageUrl} 
                alt="Profile" 
                className="w-24 h-24 rounded-full object-cover shadow-sm ring-1 ring-border"
              />
              <span className="text-xs text-text-muted text-center max-w-[120px]">
                Managed by your connected account
              </span>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 w-full space-y-5">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">
                  Display name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    if (saveStatus) setSaveStatus("");
                  }}
                  className="input-field w-full"
                  maxLength={40}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">
                  Email address
                </label>
                <input
                  type="text"
                  value={user?.primaryEmailAddress?.emailAddress || ""}
                  disabled
                  className="input-field w-full opacity-60 cursor-not-allowed bg-surface"
                />
                <p className="text-[10px] text-text-muted mt-1.5">
                  Email addresses are managed by Clerk and cannot be changed here.
                </p>
              </div>
              
              <div className="pt-2 flex items-center justify-between">
                <div className="flex items-center h-5">
                  {saveStatus === 'success' && (
                    <span className="text-success text-sm flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2">
                      <Check size={16} /> Saved
                    </span>
                  )}
                  {saveStatus === 'error' && (
                    <span className="text-accent text-sm animate-in fade-in">
                      Couldn't save changes.
                    </span>
                  )}
                </div>
                
                <button
                  type="submit"
                  disabled={isSaving || !displayName.trim() || displayName.trim() === userProfile?.displayName}
                  className="btn-primary px-6 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </section>

        <section className="card p-6 border-accent/20">
          <h2 className="font-heading font-bold text-lg text-text-dark mb-2">Session</h2>
          <p className="text-sm text-text-muted mb-6">
            Sign out of ExpenseFlow on this device.
          </p>
          <button onClick={handleSignOut} className="btn-secondary flex items-center gap-2 text-text-dark hover:text-accent hover:border-accent/30 transition-colors">
            <LogOut size={18} />
            Sign out
          </button>
        </section>

      </main>
    </div>
  );
}

export default function ProfileWrapper(props) {
  return (
    <>
      <SEO title="Account" />
      <Profile {...props} />
    </>
  );
}
