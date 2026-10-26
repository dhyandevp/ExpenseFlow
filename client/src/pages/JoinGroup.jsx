import SEO from "../components/SEO";
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, CircleAlert } from "lucide-react";
import { useSession } from "@clerk/clerk-react";
import { useAuth } from "../hooks/useAuth";
import { useGroup } from "../App";
import { joinGroupByCode } from "../api/client";
import { validateReturnUrl } from "../lib/safeRedirect";

function JoinGroup() {
  const { code } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { session, isLoaded: isSessionLoaded } = useSession();
  const { isLoaded: isAuthLoaded, firebaseUser } = useAuth();
  const { currentGroup, setCurrentGroup } = useGroup();
  const [error, setError] = useState("");
  const isMountedRef = useRef(true);
  const joiningRef = useRef(null);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const cleanCode = (code || "").trim().toUpperCase();
  const searchParams = new URLSearchParams(location.search);
  const rawReturnUrl = searchParams.get("returnUrl");

  useEffect(() => {
    if (!isSessionLoaded || !isAuthLoaded) return;
    if (!cleanCode) {
      navigate("/", { replace: true });
      return;
    }

    const defaultTarget = `/group/${cleanCode}/dashboard`;
    const validated = validateReturnUrl(rawReturnUrl, defaultTarget);
    const upperPath = validated.toUpperCase();
    const targetUrl = (upperPath === `/GROUP/${cleanCode}` || upperPath.startsWith(`/GROUP/${cleanCode}/`))
      ? validated
      : defaultTarget;

    // Only skip join if the user already has this group loaded AND has an active Firebase session
    if (currentGroup && currentGroup.code === cleanCode && firebaseUser) {
      navigate(targetUrl, { replace: true });
      return;
    }

    if (joiningRef.current === cleanCode) return;
    joiningRef.current = cleanCode;

    let redirectTimer;
    let timeoutId;

    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error("Request timed out")), 8000);
    });

    const fetchGroup = async () => {
      try {
        setError("");
        const token = session ? await session.getToken() : null;
        const res = await Promise.race([
          joinGroupByCode(cleanCode, token),
          timeoutPromise
        ]);
        clearTimeout(timeoutId);
        joiningRef.current = null;
        if (!isMountedRef.current) return;
        setCurrentGroup(res.data);
        navigate(targetUrl, { replace: true });
      } catch (err) {
        clearTimeout(timeoutId);
        joiningRef.current = null;
        if (!isMountedRef.current) return;
        if (err.message === "Request timed out") {
          setError("Request timed out. Please try again.");
        } else {
          setError(err.message || "Group not found. Check your code and try again.");
          redirectTimer = setTimeout(() => {
            if (isMountedRef.current) navigate("/", { replace: true });
          }, 2500);
        }
      }
    };

    fetchGroup();

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(redirectTimer);
    };
  }, [cleanCode, isSessionLoaded, isAuthLoaded, rawReturnUrl]);

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
