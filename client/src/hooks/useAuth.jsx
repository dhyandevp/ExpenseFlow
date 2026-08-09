import { createContext, useContext, useEffect, useState } from "react";
import { useUser, useSession, useClerk } from "@clerk/clerk-react";
import { getAuth, signInWithCustomToken, onIdTokenChanged, signOut as firebaseSignOut } from "firebase/auth";
import { app } from "../firebase"; // Assuming firebase app is initialized in firebase.js

const AuthContext = createContext();
const auth = getAuth(app);

export function AuthProvider({ children }) {
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const { session } = useSession();
  const clerk = useClerk();

  const [firebaseUser, setFirebaseUser] = useState(null);
  const [authMode, setAuthMode] = useState(null); // 'clerk', 'guest', or null
  const [groupAccess, setGroupAccess] = useState(null); // 'all' or specific groupId
  const [isFirebaseLoaded, setIsFirebaseLoaded] = useState(false);

  // Sync Clerk Session to Firebase Custom Token
  useEffect(() => {
    async function syncClerkToFirebase() {
      if (!isClerkLoaded) return;

      if (clerkUser && session) {
        try {
          const sessionToken = await session.getToken();
          const res = await fetch("/api/auth/jwt-bridge", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "clerk",
              sessionId: session.id,
              sessionToken,
              userId: clerkUser.id,
            }),
          });
          
          if (!res.ok) throw new Error("Failed to bridge JWT");
          
          const { token } = await res.json();
          await signInWithCustomToken(auth, token);
        } catch (err) {
          console.error("Clerk->Firebase Auth Bridge failed", err);
        }
      } else if (!clerkUser && authMode === 'clerk') {
        // Clerk signed out, so sign out of Firebase
        await firebaseSignOut(auth);
      }
    }

    syncClerkToFirebase();
  }, [clerkUser, session, isClerkLoaded]);

  // Listen to Firebase Auth state to determine auth mode and claims
  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const tokenResult = await user.getIdTokenResult();
          if (tokenResult.claims.guestGroupId) {
            setAuthMode("guest");
            setGroupAccess(tokenResult.claims.guestGroupId);
          } else {
            setAuthMode("clerk");
            setGroupAccess("all");
          }
        } catch (err) {
          console.error("Failed to parse token claims", err);
          setAuthMode(null);
          setGroupAccess(null);
        }
      } else {
        setAuthMode(null);
        setGroupAccess(null);
      }
      setIsFirebaseLoaded(true);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    if (authMode === "clerk") {
      await clerk.signOut();
    }
    await firebaseSignOut(auth);
  };

  const isLoaded = isClerkLoaded && isFirebaseLoaded;

  return (
    <AuthContext.Provider
      value={{
        user: clerkUser || firebaseUser,
        authMode,
        groupAccess,
        signOut,
        isLoaded,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
