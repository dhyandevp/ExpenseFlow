import SEO from "../components/SEO";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, KeyRound, CircleAlert, Lock } from "lucide-react";
import { useGroup } from "../App";
import { getGroupByCode } from "../api/client";

function JoinGroup() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { setCurrentGroup } = useGroup();
  const [error, setError] = useState("");
  const [needsPin, setNeedsPin] = useState(false);
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchGroup = async (pinValue) => {
    try {
      setLoading(true);
      setError("");
      const res = await Promise.race([
        getGroupByCode(code.toUpperCase(), pinValue || undefined),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Request timed out")), 8000))
      ]);
      setCurrentGroup(res.data);
      navigate(`/group/${code.toUpperCase()}/dashboard`, { replace: true });
    } catch (err) {
      if (err.message === "Request timed out") {
        setError("Request timed out. Please try again.");
        setLoading(false);
      } else if (err.message.includes("PIN")) {
        setNeedsPin(true);
        setLoading(false);
      } else {
        setError("Group not found. Check your code and try again.");
        setTimeout(() => navigate("/", { replace: true }), 2500);
      }
    }
  };

  useEffect(() => {
    if (!code) {
      navigate("/", { replace: true });
      return;
    }
    // Attempt to fetch without PIN first. 
    // If PIN is required, the API will throw and we'll prompt for it.
    fetchGroup();
  }, [code, navigate]);

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (!pin.trim()) return;
    fetchGroup(pin.trim());
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-sm w-full"
      >
        <h1 className="sr-only">Join Group</h1>
        {error ? (
          <div className="card p-8" style={{ border: '1px solid rgba(255,255,255,0.7)' }}>
            <div className="flex justify-center mb-3"><CircleAlert size={36} className="text-accent" /></div>
            <p className="text-accent font-medium">{error}</p>
          </div>
        ) : needsPin ? (
          <div className="card p-8" style={{ border: '1px solid rgba(255,255,255,0.7)' }}>
            <div className="flex justify-center mb-3"><Lock size={36} className="text-primary" /></div>
            <h2 className="font-heading font-bold text-xl text-text-dark mb-2">
              PIN Required
            </h2>
            <p className="text-text-muted text-sm mb-6">
              Group <span className="font-mono font-bold text-primary">{code?.toUpperCase()}</span> requires a PIN to join.
            </p>
            <form onSubmit={handlePinSubmit} className="space-y-3">
              <div className="relative">
                <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="input-field pl-9 text-center font-mono tracking-widest text-lg"
                  placeholder="Enter PIN"
                  maxLength={8}
                  autoFocus
                />
              </div>
              <button type="submit" className="btn-primary w-full" disabled={!pin.trim() || loading}>
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <KeyRound size={18} />
                )}
                Join Group
              </button>
            </form>
            <button
              onClick={() => navigate("/")}
              className="mt-4 text-xs text-text-muted hover:text-primary transition-colors"
            >
              ← Back to Home
            </button>
          </div>
        ) : (
          <div className="card p-8" style={{ border: '1px solid rgba(255,255,255,0.7)' }}>
            <Loader2 size={32} className="animate-spin text-primary mx-auto mb-3" />
            <p className="text-text-muted">Joining group <span className="font-mono font-bold text-primary">{code}</span>...</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}


export default function JoinGroupWrapper(props) {
  return (
    <>
      <SEO title="JoinGroup" />
      <JoinGroup {...props} />
    </>
  );
}
