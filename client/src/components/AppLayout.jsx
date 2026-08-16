import { useState } from "react";
import { Link, useLocation, useParams, useNavigate } from "react-router-dom";
import {
  PlusCircle,
  LayoutDashboard,
  TrendingUp,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Users,
  Home,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGroup } from "../App";
import { useAuth } from "../hooks/useAuth";
import Logo from "./Logo";
import AccountMenu from "./AccountMenu";

const navItems = [
  { path: "", icon: PlusCircle, label: "Expenses" },
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/scenarios", icon: TrendingUp, label: "Scenarios" },
  { path: "/report", icon: FileText, label: "Report" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

const mobileNavItems = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { path: "", icon: PlusCircle, label: "Add" },
  { path: "/settings", icon: Users, label: "Groups" },
  { path: "/report", icon: FileText, label: "Reports" },
];

export default function AppLayout({ children }) {
  const { code } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentGroup, setCurrentGroup, recentGroups } = useGroup();
  const { authMode } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [groupSwitcherOpen, setGroupSwitcherOpen] = useState(false);

  const handleLeave = () => {
    setCurrentGroup(null);
    navigate("/home");
  };

  const handleSwitchGroup = (group) => {
    setGroupSwitcherOpen(false);
    navigate(`/join/${group.code}`);
  };

  if (!currentGroup) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-xl border border-black/5">
          <div className="w-16 h-16 bg-[#105D5E]/10 text-[#105D5E] rounded-full flex items-center justify-center mx-auto mb-6">
            <Users size={32} />
          </div>
          <h2 className="text-xl font-bold text-[#293E33] mb-3">No Group Selected</h2>
          <p className="text-[#767F7D] mb-8">Please select a group from your home screen or join a new one.</p>
          <button 
            onClick={() => navigate('/home')}
            className="w-full bg-[#105D5E] hover:bg-[#0D4A4B] text-white font-semibold py-3 px-4 rounded-xl transition-all"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Filter out current group from recent groups
  const otherGroups = (recentGroups || []).filter(
    (g) => g.code !== currentGroup.code
  );

  return (
    <div className="min-h-screen bg-background flex relative z-0">
      {/* Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[10%] -left-[10%] w-[50vh] h-[50vh] rounded-full bg-highlight opacity-40 blur-[100px] mix-blend-multiply" />
        <div className="absolute top-[20%] -right-[10%] w-[40vh] h-[40vh] rounded-full bg-success opacity-15 blur-[120px] mix-blend-multiply" />
        <div className="absolute -bottom-[10%] left-[20%] w-[60vh] h-[60vh] rounded-full bg-highlight opacity-30 blur-[100px] mix-blend-multiply" />
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-surface border-r border-border min-h-screen p-4 sticky top-0">
        <div className="px-3 py-4 mb-2">
          <div className="flex items-center gap-3">
            <Logo size={24} />
            <div className="flex-1 min-w-0">
              <h2 className="font-heading font-bold text-lg text-text-dark leading-tight truncate">
                {currentGroup.name}
              </h2>
              <p className="text-xs text-text-muted font-mono">#{currentGroup.code}</p>
            </div>
          </div>
        </div>

        {/* Group Switcher */}
        {otherGroups.length > 0 && (
          <div className="px-3 mb-4 relative">
            <button
              onClick={() => setGroupSwitcherOpen(!groupSwitcherOpen)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-text-muted hover:bg-background hover:text-text-dark transition-all"
            >
              <Users size={14} />
              Switch Group
              <ChevronDown
                size={14}
                className={`ml-auto transition-transform ${groupSwitcherOpen ? "rotate-180" : ""}`}
              />
            </button>
            <AnimatePresence>
              {groupSwitcherOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute left-3 right-3 top-full mt-1 bg-surface rounded-xl border border-border shadow-lg z-20 overflow-hidden"
                >
                  {otherGroups.map((g) => (
                    <button
                      key={g.code}
                      onClick={() => handleSwitchGroup(g)}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-text-dark hover:bg-highlight/30 transition-colors text-left"
                    >
                      <Logo size={16} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-xs">{g.name}</p>
                        <p className="text-[10px] text-text-muted font-mono">#{g.code}</p>
                      </div>
                    </button>
                  ))}
                  <Link
                    to="/home"
                    onClick={() => setGroupSwitcherOpen(false)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-primary hover:bg-highlight/30 transition-colors border-t border-border"
                  >
                    <PlusCircle size={14} />
                    Join another group
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const basePath = `/group/${code}`;
            const itemPath = `${basePath}${item.path}`;
            const isActive = location.pathname === itemPath;
            return (
              <Link
                key={item.label}
                to={itemPath}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-text-muted hover:bg-background hover:text-text-dark"
                }`}
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="pt-2 border-t border-border mt-auto">
          <AccountMenu />
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 glass-header px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo size={20} />
          <div>
            <h2 className="font-heading font-bold text-sm text-text-dark leading-tight">
              {currentGroup.name}
            </h2>
            <p className="text-[10px] text-text-muted font-mono">#{currentGroup.code}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <AccountMenu />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg hover:bg-background transition-colors"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden fixed top-[57px] left-0 right-0 z-30 bg-surface border-b border-border shadow-lg"
          >
            <div className="p-3 space-y-1">
              {navItems.map((item) => {
                const basePath = `/group/${code}`;
                const itemPath = `${basePath}${item.path}`;
                const isActive = location.pathname === itemPath;
                return (
                  <Link
                    key={item.label}
                    to={itemPath}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                    ? "bg-primary/10 text-primary"
                    : "text-text-muted hover:bg-background"
                    }`}
                  >
                    <item.icon size={20} />
                    {item.label}
                  </Link>
                );
              })}

              {/* Mobile group switcher */}
              {otherGroups.length > 0 && (
                <div className="border-t border-border pt-2 mt-2">
                  <p className="px-3 py-1 text-[10px] uppercase tracking-wider text-text-muted font-medium">Recent Groups</p>
                  {otherGroups.map((g) => (
                    <button
                      key={g.code}
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleSwitchGroup(g);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-dark hover:bg-highlight/30 transition-colors text-left rounded-xl"
                    >
                      <Logo size={16} />
                      <span className="truncate text-xs">{g.name}</span>
                      <span className="text-[10px] text-text-muted font-mono">#{g.code}</span>
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/home');
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:bg-highlight hover:text-text-dark transition-all"
              >
                <Home size={20} />
                Global Home
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 md:pt-0 pt-[60px] pb-[100px] md:pb-0 min-h-screen overflow-hidden relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="max-w-7xl mx-auto px-4 py-6 h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile FAB */}
      {location.pathname !== `/group/${code}` && (
        <Link
          to={`/group/${code}`}
          className="md:hidden fixed bottom-20 right-4 z-40 btn-primary shadow-lg rounded-full w-14 h-14 p-0 flex items-center justify-center"
          aria-label="Add Expense"
        >
          <PlusCircle size={28} />
        </Link>
      )}

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 glass-nav safe-area-bottom">
        <div className="flex items-center justify-around py-2">
          {mobileNavItems.map((item) => {
            const basePath = `/group/${code}`;
            const itemPath = `${basePath}${item.path}`;
            const isActive = location.pathname === itemPath || (item.path === "" && location.pathname === basePath);
            return (
              <Link
                key={item.label}
                to={itemPath}
                className={`flex flex-col items-center justify-center gap-0.5 min-h-[44px] min-w-[44px] px-3 py-1 rounded-xl transition-all ${
                  isActive ? "text-primary" : "text-text-muted"
                }`}
              >
                <item.icon size={20} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
