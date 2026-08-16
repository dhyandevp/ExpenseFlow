import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect, createContext, useContext, lazy, Suspense } from "react";
import { ClerkProvider, AuthenticateWithRedirectCallback } from "@clerk/clerk-react";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { HelmetProvider } from "react-helmet-async";
import NotFound from "./pages/NotFound";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Contact from "./pages/Contact";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Lazy-load app pages for route-level code splitting
const Landing = lazy(() => import("./pages/Landing"));
const GroupSetup = lazy(() => import("./pages/GroupSetup"));
const JoinGroup = lazy(() => import("./pages/JoinGroup"));
const AppLayout = lazy(() => import("./components/AppLayout"));
const ExpenseLogger = lazy(() => import("./pages/ExpenseLogger"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ScenarioPlanner = lazy(() => import("./pages/ScenarioPlanner"));
const FairnessReport = lazy(() => import("./pages/FairnessReport"));
const Settings = lazy(() => import("./pages/Settings"));
const GroupsHome = lazy(() => import("./pages/GroupsHome"));
const ProfileSetup = lazy(() => import("./pages/ProfileSetup"));
const Profile = lazy(() => import("./pages/Profile"));

export const GroupContext = createContext();

export function useGroup() {
  return useContext(GroupContext);
}

// --- Recent Groups (multi-group switching) ---
const RECENT_GROUPS_KEY = "expenseflow_recent_groups";
const MAX_RECENT_GROUPS = 5;

function getStoredRecentGroups() {
  try {
    const stored = localStorage.getItem(RECENT_GROUPS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function pushRecentGroup(group, recentGroups) {
  if (!group) return recentGroups;
  const entry = { id: group.id, code: group.code, name: group.name };
  // Remove existing entry for this group if present
  const filtered = recentGroups.filter((g) => g.code !== group.code);
  // Prepend and cap
  return [entry, ...filtered].slice(0, MAX_RECENT_GROUPS);
}

// Export a hook for recent groups
export function useRecentGroups() {
  const [recentGroups, setRecentGroups] = useState(getStoredRecentGroups);

  const updateRecent = (group) => {
    setRecentGroups((prev) => {
      const updated = pushRecentGroup(group, prev);
      localStorage.setItem(RECENT_GROUPS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const removeRecent = (code) => {
    setRecentGroups((prev) => {
      const updated = prev.filter((g) => g.code !== code);
      localStorage.setItem(RECENT_GROUPS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  return { recentGroups, updateRecent, removeRecent };
}

// --- Current Group ---
function getStoredGroup() {
  try {
    const stored = localStorage.getItem("expenseflow_group");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

// Loading fallback for lazy routes
function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );
}

function ProtectedRoute({ children, requireProfile = true }) {
  const { user, isLoaded, userProfile, authMode, firebaseAuthError, profileStatus } = useAuth();
  
  if (firebaseAuthError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-text-dark px-4 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Session Error</h2>
        <p className="text-text-muted mb-6 max-w-sm">We couldn't finish setting up your session. Please try again.</p>
        <button 
          onClick={() => window.location.reload()} 
          className="btn-primary"
        >
          Try again
        </button>
      </div>
    );
  }

  // isLoaded now inherently includes !isProfileLoading
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-primary">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
        <p className="font-medium text-sm">Loading your account...</p>
      </div>
    );
  }
  
  if (!user) return <Navigate to="/" replace />;
  
  if (authMode === 'clerk') {
    if (requireProfile && profileStatus === 'missing') {
      return <Navigate to="/profile-setup" replace />;
    }
    
    // If the route doesn't require a profile (like ProfileSetup itself) but the profile IS complete, redirect home
    if (!requireProfile && profileStatus === 'complete') {
      return <Navigate to="/home" replace />;
    }
  }
  
  return children;
}

export default function App() {
  const [currentGroup, setCurrentGroupRaw] = useState(getStoredGroup);
  const { recentGroups, updateRecent } = useRecentGroups();

  // Wrap setCurrentGroup to also push to recent groups
  const setCurrentGroup = (group) => {
    setCurrentGroupRaw(group);
    if (group) updateRecent(group);
  };

  useEffect(() => {
    if (currentGroup) {
      localStorage.setItem("expenseflow_group", JSON.stringify(currentGroup));
    } else {
      localStorage.removeItem("expenseflow_group");
    }
  }, [currentGroup]);

  return (
    <HelmetProvider>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} navigate={(to) => window.location.href = to}>
        <AuthProvider>
          <GroupContext.Provider value={{ currentGroup, setCurrentGroup, recentGroups }}>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/sso-callback" element={<AuthenticateWithRedirectCallback />} />
                <Route path="/home" element={<ProtectedRoute><GroupsHome /></ProtectedRoute>} />
                <Route path="/profile-setup" element={<ProtectedRoute requireProfile={false}><ProfileSetup /></ProtectedRoute>} />
                <Route path="/account" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/setup" element={<ProtectedRoute><GroupSetup /></ProtectedRoute>} />
                <Route path="/join/:code" element={<JoinGroup />} />
            <Route
              path="/group/:code"
              element={
                <AppLayout>
                  <ExpenseLogger />
                </AppLayout>
              }
            />
            <Route
              path="/group/:code/dashboard"
              element={
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              }
            />
            <Route
              path="/group/:code/scenarios"
              element={
                <AppLayout>
                  <ScenarioPlanner />
                </AppLayout>
              }
            />
            <Route
              path="/group/:code/report"
              element={
                <AppLayout>
                  <FairnessReport />
                </AppLayout>
              }
            />
            <Route
              path="/group/:code/settings"
              element={
                <AppLayout>
                  <Settings />
                </AppLayout>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </GroupContext.Provider>
      </AuthProvider>
      </ClerkProvider>
    </HelmetProvider>
  );
}
