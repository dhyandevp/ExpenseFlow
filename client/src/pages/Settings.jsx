import SEO from "../components/SEO";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings as SettingsIcon,
  Edit3,
  Trash2,
  Save,
  LogOut,
  RefreshCw,
  KeyRound,
  Copy,
  Check,
  Shield,
  TriangleAlert,
  X,
  PieChart
} from "lucide-react";
import { useGroup } from "../App";
import { updateGroup, removeMember, regenerateCode, setGroupPin, deleteGroup } from "../api/client";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { useAuth } from "../hooks/useAuth";
import { useSession } from "@clerk/clerk-react";

import { getGroupCategories, MODEL_OPTIONS as modelOptions } from "../utils/groupHelpers";
import Avatar from "../components/Avatar";
import { CategoryIcon } from "../utils/categoryIcons";

// Modal Component for Confirmations
const Dialog = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-surface border border-border shadow-2xl rounded-2xl p-6 w-full max-w-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 id="dialog-title" className="font-heading font-bold text-xl text-text-dark">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-text-muted hover:bg-background rounded-full transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
          {children}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

function SettingsPage() {
  useDocumentTitle("Group Settings");
  const { currentGroup, setCurrentGroup } = useGroup();
  const navigate = useNavigate();
  const { authMode, signOut } = useAuth();
  const { session } = useSession();

  const [groupName, setGroupName] = useState(currentGroup?.name || "");
  const [currency, setCurrency] = useState(currentGroup?.currency || "₹");
  const [threshold, setThreshold] = useState(
    currentGroup?.settlement_threshold || 0
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Security: PIN and code
  const [pinInput, setPinInput] = useState("");
  const [pinSaving, setPinSaving] = useState(false);
  const [pinMessage, setPinMessage] = useState("");
  const [regenerating, setRegenerating] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  // Danger Zone Dialogs
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [dangerError, setDangerError] = useState("");

  useEffect(() => {
    if (currentGroup) {
      setGroupName(currentGroup.name);
      setCurrency(currentGroup.currency || "₹");
      setThreshold(currentGroup.settlement_threshold || 0);
    }
  }, [currentGroup]);

  const members = currentGroup.members || [];
  const fairnessModels = currentGroup.fairness_models || [];

  const handleUpdateGroup = async () => {
    setSaving(true);
    setMessage("");
    try {
      await updateGroup(currentGroup.id, {
        name: groupName,
        currency,
        settlement_threshold: threshold,
      });
      setMessage("Group settings updated!");
      setCurrentGroup({ ...currentGroup, name: groupName, currency, settlement_threshold: threshold });
    } catch (err) {
      setMessage("Failed to update: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm("Remove this member? Their expenses will be reassigned."))
      return;
    try {
      await removeMember(currentGroup.id, memberId);
      const updatedMembers = members.filter((m) => m.id !== memberId);
      setCurrentGroup({ ...currentGroup, members: updatedMembers });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLeave = async () => {
    setIsLeaving(true);
    try {
      if (authMode === "guest") {
        await signOut();
      }
      setCurrentGroup(null);
      navigate("/home");
    } catch (err) {
      console.error("Failed to leave group", err);
    } finally {
      setIsLeaving(false);
      setIsLeaveDialogOpen(false);
    }
  };

  const handleDeleteGroup = async () => {
    setDangerError("");
    setIsDeleting(true);
    try {
      const clerkToken = session ? await session.getToken() : null;
      if (!clerkToken) throw new Error("Not authorized");
      
      await deleteGroup(currentGroup.id, clerkToken);
      setCurrentGroup(null);
      navigate("/home");
    } catch (err) {
      setDangerError("We couldn't delete this group. " + err.message);
      setIsDeleting(false);
    }
  };

  const handleRegenerateCode = async () => {
    if (!confirm("Regenerate invite code? The old code will stop working immediately.")) return;
    setRegenerating(true);
    try {
      const res = await regenerateCode(currentGroup.id);
      const newCode = res.data.code;
      setCurrentGroup({ ...currentGroup, code: newCode });
    } catch (err) {
      alert("Failed to regenerate: " + err.message);
    } finally {
      setRegenerating(false);
    }
  };

  const handleSetPin = async () => {
    setPinSaving(true);
    setPinMessage("");
    try {
      if (pinInput.trim() === "") {
        await setGroupPin(currentGroup.id, { pin: null });
        setPinMessage("PIN removed.");
        setCurrentGroup({ ...currentGroup, has_pin: false });
      } else {
        await setGroupPin(currentGroup.id, { pin: pinInput });
        setPinMessage("PIN set!");
        setCurrentGroup({ ...currentGroup, has_pin: true });
      }
      setPinInput("");
    } catch (err) {
      setPinMessage(err.message);
    } finally {
      setPinSaving(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(currentGroup.code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  return (
    <div className="space-y-10 pb-10">
      <div>
        <h1 className="font-heading font-bold text-2xl md:text-3xl text-text-dark mb-2">
          Settings
        </h1>
        <p className="text-text-muted">Manage your group preferences and members.</p>
      </div>

      {authMode === 'guest' && (
        <div className="p-6 bg-[#E8E300]/10 border border-[#E8E300]/20 rounded-2xl flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Shield className="text-[#E8E300] shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="font-semibold text-text-dark text-sm">Guest Mode</h3>
              <p className="text-sm text-text-muted mt-1 max-w-lg">
                You are viewing this group as a guest. Only the group owner can manage settings, edit members, and manage security options.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsLeaveDialogOpen(true)}
            className="btn-secondary border-border hover:bg-background text-text-dark shrink-0"
          >
            <LogOut size={16} />
            Leave group
          </button>
        </div>
      )}

      {authMode !== 'guest' && (
      <>
      <section>
        <h2 className="font-heading font-semibold text-text-dark mb-4 text-lg">Group Profile</h2>
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-border space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-dark mb-1">
              Group Name
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="input-field max-w-md"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">
                Currency Symbol
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="input-field"
              >
                <option value="₹">₹ (INR)</option>
                <option value="$">$ (USD)</option>
                <option value="€">€ (EUR)</option>
                <option value="£">£ (GBP)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">
                Settlement Threshold
              </label>
              <input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(parseInt(e.target.value) || 0)}
                className="input-field"
                min={0}
                step={100}
              />
            </div>
          </div>
          <div className="pt-2">
            <button
              onClick={handleUpdateGroup}
              disabled={saving}
              className="btn-primary"
            >
              <Save size={16} />
              {saving ? "Saving..." : "Save Settings"}
            </button>
            {message && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-success mt-2"
              >
                {message}
              </motion.p>
            )}
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-heading font-semibold text-text-dark mb-4 text-lg">Members</h2>
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-border space-y-3">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-highlight/20 transition-colors"
            >
              <div className="flex items-center gap-4">
                <Avatar member={m} size={40} />
                <div>
                  <p className="font-medium text-text-dark text-sm">{m.name}</p>
                </div>
              </div>
              <button
                onClick={() => handleRemoveMember(m.id)}
                className="p-2 rounded-lg text-text-muted hover:bg-red-50 hover:text-red-600 transition-colors"
                title="Remove member"
                aria-label={`Remove ${m.name}`}
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-heading font-semibold text-text-dark mb-4 text-lg">Categories & Splitting</h2>
        <div className="bg-white rounded-2xl shadow-sm border border-border divide-y divide-border">
          {getGroupCategories(currentGroup).map((cat) => {
            const model = fairnessModels.find((fm) => fm.category === cat.name);
            const currentSplitLabel = modelOptions.find((o) => o.value === model?.model_type)?.label ||
                    (cat.split_model ? modelOptions.find((o) => o.value === cat.split_model)?.label || cat.split_model : "Equal split");
            return (
              <div
                key={cat.name}
                className="flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-4 w-1/2">
                  <div className="w-10 h-10 rounded-xl bg-highlight/30 flex items-center justify-center shrink-0">
                    <CategoryIcon category={cat} size={20} className="text-primary" />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span className="text-sm font-medium text-text-dark">{cat.name}</span>
                    {cat.is_default && (
                      <span className="text-xs text-text-muted">(Default)</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-right">
                  <PieChart size={14} className="text-text-muted hidden sm:block" />
                  <span className="text-sm text-text-muted">{currentSplitLabel}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="font-heading font-semibold text-text-dark mb-4 text-lg">Access & Security</h2>
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-border space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-dark mb-2">
              Invite Code
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div
                onClick={copyCode}
                role="button"
                tabIndex={0}
                className="cursor-pointer inline-flex items-center gap-3 px-5 py-3 bg-background border border-border rounded-xl hover:border-primary/30 transition-all"
              >
                <span className="font-mono font-bold text-xl tracking-[0.2em] text-primary">
                  {currentGroup.code}
                </span>
                {codeCopied ? (
                  <Check size={18} className="text-success" />
                ) : (
                  <Copy size={18} className="text-text-muted" />
                )}
              </div>
              <button
                onClick={handleRegenerateCode}
                disabled={regenerating}
                className="btn-secondary text-sm"
              >
                <RefreshCw size={16} className={regenerating ? "animate-spin" : ""} />
                Regenerate Code
              </button>
            </div>
            <p className="text-sm text-text-muted mt-2">
              Regenerating invalidates the old code — members will need the new one to rejoin.
            </p>
          </div>

          <div className="pt-4 border-t border-border">
            <label className="block text-sm font-medium text-text-dark mb-2 flex items-center gap-2">
              Group PIN
              {currentGroup.has_pin && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-success/10 text-success font-medium">
                  Active
                </span>
              )}
            </label>
            <p className="text-sm text-text-muted mb-3">
              Optional 4-8 character PIN required when joining via invite code. Leave empty to remove.
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <input
                type="text"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="input-field max-w-[200px]"
                placeholder={currentGroup.has_pin ? "Enter new PIN..." : "Set a PIN..."}
                maxLength={8}
              />
              <button
                onClick={handleSetPin}
                disabled={pinSaving}
                className="btn-primary text-sm"
              >
                <KeyRound size={16} />
                {pinSaving ? "Saving..." : pinInput.trim() ? "Set PIN" : "Remove PIN"}
              </button>
            </div>
            {pinMessage && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-success mt-2"
              >
                {pinMessage}
              </motion.p>
            )}
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-heading font-semibold text-text-dark mb-4 text-lg">Danger Zone</h2>
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-red-100 flex flex-col md:flex-row gap-8 justify-between items-start">
          
          <div className="flex-1 space-y-2">
            <h3 className="font-heading font-semibold text-text-dark">Leave group</h3>
            <p className="text-sm text-text-muted max-w-sm leading-relaxed">
              Remove yourself from this group. You will lose access to its expenses and reports.
            </p>
            <button
              onClick={() => setIsLeaveDialogOpen(true)}
              className="mt-3 btn-secondary border-border hover:bg-background text-text-dark"
            >
              <LogOut size={16} />
              Leave group
            </button>
          </div>

          {authMode === "clerk" && (
            <div className="flex-1 space-y-2 pt-6 md:pt-0 md:pl-8 md:border-l border-border w-full">
              <h3 className="font-heading font-semibold text-red-700">Delete group</h3>
              <p className="text-sm text-text-muted max-w-sm leading-relaxed">
                Permanently delete this group and its associated data. This action cannot be undone.
              </p>
              <button
                onClick={() => setIsDeleteDialogOpen(true)}
                className="mt-3 px-4 py-2 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"
              >
                <Trash2 size={16} />
                Delete group
              </button>
            </div>
          )}
        </div>
      </section>
      </>
      )}

      {/* Dialogs */}
      <Dialog 
        isOpen={isLeaveDialogOpen} 
        onClose={() => setIsLeaveDialogOpen(false)} 
        title="Leave this group?"
      >
        <p className="text-text-muted mb-6 leading-relaxed">
          You will lose access to this group's expenses, balances, reports, and other shared data.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setIsLeaveDialogOpen(false)}
            className="btn-secondary"
            disabled={isLeaving}
          >
            Cancel
          </button>
          <button
            onClick={handleLeave}
            className="btn-primary"
            disabled={isLeaving}
          >
            {isLeaving ? "Leaving..." : "Leave group"}
          </button>
        </div>
      </Dialog>

      {/* Delete Group Dialog */}
      <Dialog 
        isOpen={isDeleteDialogOpen} 
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setDeleteConfirmText("");
          setDangerError("");
        }} 
        title={`Delete "${currentGroup?.name}"?`}
      >
        <div className="text-text-muted space-y-4 mb-6 text-sm leading-relaxed">
          <p>This permanently removes:</p>
          <ul className="list-disc pl-5 space-y-1 text-text-dark font-medium">
            <li>Expenses</li>
            <li>Members</li>
            <li>Categories</li>
            <li>Settlements</li>
            <li>Scenarios</li>
            <li>Group settings</li>
          </ul>
          <p>This action cannot be undone.</p>
          
          <div className="pt-2">
            <label className="block text-sm font-medium text-text-dark mb-2">
              Type <strong className="select-all">{currentGroup?.name}</strong> to confirm.
            </label>
            <input 
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="input-field w-full"
              placeholder={currentGroup?.name}
              disabled={isDeleting}
            />
          </div>
          {dangerError && (
            <p className="text-red-600 text-sm mt-2">{dangerError}</p>
          )}
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => {
              setIsDeleteDialogOpen(false);
              setDeleteConfirmText("");
              setDangerError("");
            }}
            className="btn-secondary"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteGroup}
            disabled={deleteConfirmText !== currentGroup?.name || isDeleting}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[140px]"
          >
            {isDeleting ? "Deleting..." : "Delete permanently"}
          </button>
        </div>
      </Dialog>
    </div>
  );
}

export default function SettingsPageWrapper(props) {
  return (
    <>
      <SEO title="Settings" />
      <SettingsPage {...props} />
    </>
  );
}
