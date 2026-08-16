import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { User, LogOut, Settings, UsersRound, Home } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export default function AccountMenu() {
  const { user, userProfile, authMode, signOut } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
    navigate("/");
  };

  const displayName = userProfile?.displayName || user?.firstName || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 pl-2.5 pr-1.5 rounded-full hover:bg-highlight/50 transition-colors border border-transparent hover:border-border"
        aria-label="Account menu"
      >
        <span className="text-sm font-medium text-text-dark hidden sm:block">
          {authMode === "guest" ? "Guest" : displayName}
        </span>
        {user?.imageUrl && authMode === "clerk" ? (
          <img
            src={user.imageUrl}
            alt={displayName}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-background"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
            {authMode === "guest" ? "G" : initials}
          </div>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-56 bg-surface border border-border shadow-xl rounded-2xl overflow-hidden z-50 origin-top-right"
          >
            <div className="px-4 py-3 border-b border-border bg-background/50">
              <p className="text-sm font-bold text-text-dark truncate">
                {authMode === "guest" ? "Guest User" : displayName}
              </p>
              <p className="text-xs text-text-muted truncate mt-0.5">
                {authMode === "guest" ? "Temporary Session" : user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>

            <div className="py-1.5">
              {authMode === "clerk" && (
                <Link
                  to="/account"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-muted hover:bg-highlight hover:text-text-dark transition-colors"
                >
                  <User size={16} />
                  Profile
                </Link>
              )}
              
              <Link
                to="/home"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-muted hover:bg-highlight hover:text-text-dark transition-colors"
              >
                <Home size={16} />
                Global Home
              </Link>
            </div>

            <div className="py-1.5 border-t border-border">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-text-dark hover:bg-accent/10 hover:text-accent transition-colors text-left"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
