import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect, createContext, useContext, lazy, Suspense } from "react";
import { ClerkProvider } from "@clerk/clerk-react";
import { AuthProvider } from "./hooks/useAuth";
import Landing from "./pages/Landing";
import GroupSetup from "./pages/GroupSetup";
import JoinGroup from "./pages/JoinGroup";
import AppLayout from "./components/AppLayout";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;


// Lazy-load app pages for route-level code splitting
const ExpenseLogger = lazy(() => import("./pages/ExpenseLogger"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ScenarioPlanner = lazy(() => import("./pages/ScenarioPlanner"));
const FairnessReport = lazy(() => import("./pages/FairnessReport"));
const Settings = lazy(() => import("./pages/Settings"));

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
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} navigate={(to) => window.location.href = to}>
      <AuthProvider>
        <GroupContext.Provider value={{ currentGroup, setCurrentGroup, recentGroups }}>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/setup" element={<GroupSetup />} />
              <Route path="/join/:code" element={<JoinGroup />} />
          <Route
            path="/group/:code"
            element={
              currentGroup ? (
                <AppLayout>
                  <ExpenseLogger />
                </AppLayout>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/group/:code/dashboard"
            element={
              currentGroup ? (
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/group/:code/scenarios"
            element={
              currentGroup ? (
                <AppLayout>
                  <ScenarioPlanner />
                </AppLayout>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/group/:code/report"
            element={
              currentGroup ? (
                <AppLayout>
                  <FairnessReport />
                </AppLayout>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/group/:code/settings"
            element={
              currentGroup ? (
                <AppLayout>
                  <Settings />
                </AppLayout>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </GroupContext.Provider>
    </AuthProvider>
    </ClerkProvider>
  );
}
