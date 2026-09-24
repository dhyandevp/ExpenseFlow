import SEO from "../components/SEO";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, CircleAlert } from "lucide-react";
import { useSession } from "@clerk/clerk-react";
import { useGroup } from "../App";
import { joinGroupByCode } from "../api/client";

function JoinGroup() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { session } = useSession();
  const { setCurrentGroup } = useGroup();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) {
      navigate("/", { replace: true });
      return;
    }

    let isMounted = true;

    const fetchGroup = async () => {
      try {
        setLoading(true);
        setError("");
        const token = session ? await session.getToken() : null;
        const res = await Promise.race([
          joinGroupByCode(code.toUpperCase(), token),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Request timed out")), 8000))
        ]);
        if (!isMounted) return;
        setCurrentGroup(res.data);
        navigate(`/group/${code.toUpperCase()}/dashboard`, { replace: true });
      } catch (err) {
        if (!isMounted) return;
        setLoading(false);
        if (err.message === "Request timed out") {
          setError("Request timed out. Please try again.");
        } else {
          setError("Group not found. Check your code and try again.");
          setTimeout(() => {
            if (isMounted) navigate("/", { replace: true });
          }, 2500);
        }
      }
    };

    fetchGroup();

    return () => {
      isMounted = false;
    };
  }, [code, navigate, setCurrentGroup, session]);

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
            <p className="text-accent font-medium mb-4">{error}</p>
            <button
              onClick={() => navigate("/")}
              className="text-xs text-text-muted hover:text-primary transition-colors"
            >
              ← Back to Home
            </button>
          </div>
        ) : (
          <div className="card p-8" style={{ border: '1px solid rgba(255,255,255,0.7)' }}>
            <Loader2 size={32} className="animate-spin text-primary mx-auto mb-3" />
            <p className="text-text-muted">Joining group <span className="font-mono font-bold text-primary">{code?.toUpperCase()}</span>...</p>
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
