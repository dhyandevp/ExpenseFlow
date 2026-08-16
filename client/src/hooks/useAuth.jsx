import { createContext, useContext, useEffect, useState } from "react";
import { useUser, useSession, useClerk } from "@clerk/clerk-react";
import { getAuth, signInWithCustomToken, onIdTokenChanged, signOut as firebaseSignOut } from "firebase/auth";
import { app } from "../firebase";
import { getUserProfile } from "../api/client";

const AuthContext = createContext();
const auth = getAuth(app);

// Safe frontend logger
const frontLogger = {
  log: (event, data = {}) => {
    if (import.meta.env.DEV || event.includes('failed') || event.includes('error')) {
      console.log(`[AuthFlow] ${event}`, data);
    }
  },
  error: (event, data = {}) => {
    console.error(`[AuthFlow] ${event}`, data);
  }
};

export function AuthProvider({ children }) {
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const { session } = useSession();
  const clerk = useClerk();

  const [firebaseUser, setFirebaseUser] = useState(null);
  const [authMode, setAuthMode] = useState(null); // 'clerk', 'guest', or 'none'
  const [groupAccess, setGroupAccess] = useState(null); // 'all' or specific groupId
  const [userProfile, setUserProfile] = useState(null);
  const [firebaseAuthError, setFirebaseAuthError] = useState(null);

  // Loading states
  const [isFirebaseLoaded, setIsFirebaseLoaded] = useState(false);
  const [isBridgePending, setIsBridgePending] = useState(false);
  const [profileStatus, setProfileStatus] = useState("loading"); // "loading", "complete", "missing", "error"

  // Sync Clerk Session to Firebase Custom Token
  useEffect(() => {
    async function syncClerkToFirebase() {
      if (!isClerkLoaded) return;

      if (clerkUser && session) {
        frontLogger.log('clerk_session_available', { clerkUserId: clerkUser.id });
        
        // Don't re-run if already signed into Firebase with the right uid
        if (firebaseUser && firebaseUser.uid === clerkUser.id) {
          setIsBridgePending(false);
          return;
        }

        try {
          setIsBridgePending(true);
          setFirebaseAuthError(null);
          setProfileStatus("loading"); // Ensure profile loading starts
          
          const sessionToken = await session.getToken();
          frontLogger.log('jwt_bridge_request_started');
          
          const res = await fetch("/api/auth/jwt-bridge", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${sessionToken}`,
            },
          });
          
          if (!res.ok) {
            let errorData = {};
            try { errorData = await res.json(); } catch(e) {}
            frontLogger.error('jwt_bridge_request_failed', { 
              status: res.status, 
              requestId: errorData.requestId || res.headers.get('x-request-id') 
            });
            throw new Error(`Failed to bridge JWT (Status: ${res.status})`);
          }
          
          const responseData = await res.json();
          frontLogger.log('jwt_bridge_request_success', { requestId: responseData.requestId });
          
          frontLogger.log('firebase_sign_in_started');
          await signInWithCustomToken(auth, responseData.firebaseToken);
          frontLogger.log('firebase_sign_in_success');
          setIsBridgePending(false);
        } catch (err) {
          frontLogger.error("firebase_auth_bridge_failed", { message: err.message });
          setFirebaseAuthError(err);
          setIsBridgePending(false);
          // If we fail, make sure isFirebaseLoaded becomes true so we don't hang on loading
          setIsFirebaseLoaded(true);
          setProfileStatus("error");
        }
      } else if (!clerkUser && authMode === 'clerk') {
        // Clerk signed out, so sign out of Firebase
        frontLogger.log('clerk_signed_out');
        await firebaseSignOut(auth);
      }
    }

    syncClerkToFirebase();
  }, [clerkUser, session, isClerkLoaded, firebaseUser]);

  // Listen to Firebase Auth state to determine auth mode and claims
  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        setProfileStatus("loading"); // Start loading state for the new user
        try {
          const tokenResult = await user.getIdTokenResult();
          if (tokenResult.claims.guestGroupId) {
            setAuthMode("guest");
            setGroupAccess(tokenResult.claims.guestGroupId);
            setUserProfile(null);
            setProfileStatus("complete");
          } else if (clerkUser) {
            setAuthMode("clerk");
            setGroupAccess("all");
            // Load user profile
            try {
              const profileRes = await getUserProfile(user.uid);
              if (profileRes && profileRes.data) {
                setUserProfile(profileRes.data);
                setProfileStatus("complete");
              } else {
                setUserProfile(null);
                setProfileStatus("missing");
              }
            } catch (err) {
              frontLogger.error("profile_fetch_failed", { message: err.message });
              setUserProfile(null);
              // For 404s, consider it missing. For other errors, it might be an error state.
              // Assuming missing to allow them to create it if backend doesn't have it.
              setProfileStatus("missing");
            }
          } else {
            setAuthMode("none");
            setGroupAccess(null);
            setUserProfile(null);
            setProfileStatus("complete");
          }
        } catch (err) {
          frontLogger.error("failed_to_parse_token_claims", { message: err.message });
          setAuthMode("none");
          setGroupAccess(null);
          setUserProfile(null);
          setProfileStatus("error");
        }
      } else {
        if (clerkUser) {
          setAuthMode("clerk");
        } else {
          setAuthMode("none");
          setProfileStatus("complete");
        }
        setGroupAccess(null);
        setUserProfile(null);
      }
      setIsFirebaseLoaded(true);
    });

    return () => unsubscribe();
  }, [clerkUser]);

  const signOut = async () => {
    frontLogger.log('sign_out_started');
    if (authMode === "clerk") {
      await clerk.signOut();
    }
    await firebaseSignOut(auth);
    frontLogger.log('sign_out_success');
  };

  // We are fully loaded ONLY if Clerk is loaded, Firebase is loaded, 
  // there is no pending bridge operation, and the profile state is resolved.
  const isLoaded = isClerkLoaded && isFirebaseLoaded && !isBridgePending && profileStatus !== "loading";

  const refreshProfile = async () => {
    if (firebaseUser && authMode === 'clerk') {
      try {
        const profileRes = await getUserProfile(firebaseUser.uid);
        if (profileRes && profileRes.data) {
          setUserProfile(profileRes.data);
          setProfileStatus("complete");
        } else {
          setUserProfile(null);
          setProfileStatus("missing");
        }
      } catch (err) {
        console.error("Failed to refresh profile", err);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: clerkUser || firebaseUser,
        authMode,
        groupAccess,
        signOut,
        isLoaded,
        userProfile,
        profileStatus,
        refreshProfile,
        firebaseAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
