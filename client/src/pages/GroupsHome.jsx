import SEO from "../components/SEO";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, UserPlus, ArrowRight, UsersRound, Loader2, LogOut, User } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useRecentGroups } from "../App";
import { getGroupById } from "../api/client";
import GuestJoinModal from "../components/auth/GuestJoinModal";
import AccountMenu from "../components/AccountMenu";

export function GroupsHome() {
  const { user, isLoaded, authMode, signOut } = useAuth();
  const { recentGroups } = useRecentGroups();
  const navigate = useNavigate();

  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [populatedGroups, setPopulatedGroups] = useState([]);
  const [isFetchingGroups, setIsFetchingGroups] = useState(false);

  useEffect(() => {
    if (!recentGroups || recentGroups.length === 0) {
      setPopulatedGroups([]);
      return;
    }
    let isMounted = true;
    const fetchGroups = async () => {
      setIsFetchingGroups(true);
      try {
        const promises = recentGroups.map(async (rg) => {
          try {
            const { data } = await getGroupById(rg.id);
            return data;
          } catch (err) {
            console.error(`Failed to fetch group ${rg.id}`, err);
            return null; // Return null if fetching fails (e.g., group deleted)
          }
        });
        const results = await Promise.all(promises);
        if (isMounted) {
          setPopulatedGroups(results.filter(Boolean));
        }
      } catch (err) {
        console.error("Error fetching recent groups", err);
      } finally {
        if (isMounted) {
          setIsFetchingGroups(false);
        }
      }
    };
    fetchGroups();
    return () => { isMounted = false; };
  }, [recentGroups]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-primary">
          <Loader2 size={32} className="animate-spin" />
          <p className="text-sm font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Handle Join Submit for authenticated users (or guests).
  // If guest, they might use GuestJoinModal? Actually, let's just use a simple form here
  // that redirects to /join/:code.
  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (joinCode.trim().length === 6) {
      navigate(`/join/${joinCode.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative z-0">


      {/* Global Header */}
      <header className="px-6 py-4 flex items-center justify-between max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="ExpenseFlow logo">
            <path d="M6 22C6 22 10 18 16 18C22 18 26 22 26 22" stroke="#105D5E" strokeWidth="2.5" strokeLinecap="round" opacity="0.35" />
            <path d="M4 17C4 17 9 12 16 12C23 12 28 17 28 17" stroke="#105D5E" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
            <path d="M2 12C2 12 8 6 16 6C24 6 30 12 30 12" stroke="#105D5E" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <span className="font-heading font-bold text-lg text-text-dark tracking-tight">
            ExpenseFlow
          </span>
        </div>
        <div className="flex items-center gap-3">
          <AccountMenu />
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 md:py-20 flex flex-col gap-16">
        
        {/* Greeting Section */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-heading font-extrabold text-3xl md:text-4xl text-text-dark mb-3">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {authMode === "guest" ? "Guest" : (user?.firstName || "there")}
            </h1>
            <p className="text-lg text-text-muted">
              Choose a group to continue, or get started with a new one.
            </p>
          </motion.div>
        </section>

        {/* Existing Groups */}
        {recentGroups && recentGroups.length > 0 && (
          <section>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h2 className="text-[10px] font-bold tracking-[0.2em] uppercase text-text-muted mb-4">
                Your Groups
              </h2>
              {isFetchingGroups && populatedGroups.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-primary opacity-50" />
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {populatedGroups.map((group, idx) => (
                    <motion.button
                      key={group.code}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 + (idx * 0.05), duration: 0.3 }}
                      onClick={() => navigate(`/join/${group.code}`)}
                      className="card-hover p-5 text-left group flex flex-col h-full bg-surface border border-border rounded-2xl"
                    >
                      <div className="flex-1 mb-4">
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            <UsersRound size={20} />
                          </div>
                          <span className="text-xs font-semibold text-text-muted bg-background px-2 py-1 rounded-md border border-border">
                            {group.currency || "INR"}
                          </span>
                        </div>
                        <h3 className="font-heading font-bold text-lg text-text-dark truncate">
                          {group.name}
                        </h3>
                        <p className="text-sm text-text-muted mt-1">
                          {group.members?.length || 0} {(group.members?.length === 1) ? 'member' : 'members'}
                        </p>
                      </div>
                      <div className="flex items-center text-sm font-semibold text-primary group-hover:text-primary-dark transition-colors mt-auto">
                        Open group
                        <ArrowRight size={16} className="ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          </section>
        )}

        {/* Zero-group State / Get Started */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {(!recentGroups || recentGroups.length === 0) && (
              <div className="mb-8">
                <h2 className="font-heading font-bold text-2xl text-text-dark mb-2">
                  Welcome to ExpenseFlow
                </h2>
                <p className="text-text-muted">
                  Create a group for your household, trip, or shared expenses, or join a group you've been invited to.
                </p>
              </div>
            )}
            
            <h2 className="text-[10px] font-bold tracking-[0.2em] uppercase text-text-muted mb-4">
              Get Started
            </h2>
            
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Create Group */}
              <button
                onClick={() => navigate("/setup")}
                className="card-hover p-6 flex items-start gap-4 text-left group bg-surface border border-border rounded-2xl"
              >
                <div className="w-12 h-12 rounded-xl bg-highlight/30 text-text-dark flex items-center justify-center shrink-0 group-hover:bg-highlight group-hover:scale-105 transition-all">
                  <Plus size={24} />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg text-text-dark mb-1">
                    Create a new group
                  </h3>
                  <p className="text-sm text-text-muted">
                    Start a fresh workspace for tracking shared expenses.
                  </p>
                </div>
              </button>

              {/* Join Group */}
              {isJoinModalOpen ? (
                <div className="card p-6 border border-primary/30 ring-1 ring-primary/10 flex flex-col justify-center">
                  <h3 className="font-heading font-bold text-sm text-text-dark mb-3">
                    Enter Group Code
                  </h3>
                  <form onSubmit={handleJoinSubmit} className="flex gap-2">
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      placeholder="e.g. A1B2C3"
                      maxLength={6}
                      autoFocus
                      className="input-field flex-1 font-mono tracking-widest text-center uppercase"
                    />
                    <button 
                      type="submit" 
                      disabled={joinCode.trim().length < 6}
                      className="btn-primary px-4"
                    >
                      Join
                    </button>
                  </form>
                  <button 
                    onClick={() => { setIsJoinModalOpen(false); setJoinCode(""); }}
                    className="text-xs text-text-muted hover:text-text-dark mt-3 text-center"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsJoinModalOpen(true)}
                  className="card-hover p-6 flex items-start gap-4 text-left group bg-surface border border-border rounded-2xl"
                >
                  <div className="w-12 h-12 rounded-xl bg-highlight/30 text-text-dark flex items-center justify-center shrink-0 group-hover:bg-highlight group-hover:scale-105 transition-all">
                    <UserPlus size={24} />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-lg text-text-dark mb-1">
                      Join an existing group
                    </h3>
                    <p className="text-sm text-text-muted">
                      Enter a 6-character code to join your friends.
                    </p>
                  </div>
                </button>
              )}
            </div>
          </motion.div>
        </section>

      </main>
    </div>
  );
}

export default function GroupsHomeWrapper(props) {
  return (
    <>
      <SEO title="Home" />
      <GroupsHome {...props} />
    </>
  );
}
