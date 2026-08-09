import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Repeat, Plus, Trash2, Play, Loader2, CalendarDays, X } from "lucide-react";
import { useGroup } from "../App";
import {
  getRecurringTemplates,
  createRecurringTemplate,
  deleteRecurringTemplate,
  applyRecurringTemplate,
} from "../api/client";
import { formatINR } from "../utils/formatCurrency";

function getGroupCategories(group) {
  return group?.categories?.length > 0
    ? group.categories.map((c) => c.name)
    : ["Rent", "Utilities", "Groceries", "Repairs", "Outings", "Other"];
}

export default function RecurringManager() {
  const { currentGroup } = useGroup();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [applying, setApplying] = useState(null);
  const [form, setForm] = useState({
    paidBy: "",
    amount: "",
    category: "Rent",
    description: "",
    split_type: "equal",
    frequency: "monthly",
    next_due: new Date().toISOString().split("T")[0],
  });

  const members = currentGroup?.members || [];

  useEffect(() => {
    if (currentGroup) loadTemplates();
  }, [currentGroup]);

  const loadTemplates = async () => {
    try {
      const res = await getRecurringTemplates(currentGroup.id);
      setTemplates(res.data);
    } catch (err) {
      console.error("Failed to load recurring templates:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.paidBy || !form.amount) return;
    try {
      await createRecurringTemplate(currentGroup.id, {
        ...form,
        paidBy: parseInt(form.paidBy),
        amount: parseFloat(form.amount),
      });
      setShowForm(false);
      setForm({
        paidBy: "", amount: "", category: "Rent", description: "",
        split_type: "equal", frequency: "monthly",
        next_due: new Date().toISOString().split("T")[0],
      });
      loadTemplates();
    } catch (err) {
      console.error("Failed to create template:", err);
    }
  };

  const handleDelete = async (rid) => {
    if (!confirm("Delete this recurring expense?")) return;
    try {
      await deleteRecurringTemplate(currentGroup.id, rid);
      loadTemplates();
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const handleApply = async (rid) => {
    setApplying(rid);
    try {
      await applyRecurringTemplate(currentGroup.id, rid);
      loadTemplates();
    } catch (err) {
      console.error("Failed to apply:", err);
    } finally {
      setApplying(null);
    }
  };

  if (!currentGroup) return null;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading font-semibold text-text-dark flex items-center gap-2">
          <Repeat size={18} className="text-primary" />
          Recurring Expenses
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-ghost text-sm"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Cancel" : "Add"}
        </button>
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreate}
            className="space-y-3 mb-4 p-4 rounded-xl bg-highlight/20"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-text-muted font-medium uppercase tracking-wider block mb-1">
                  Who pays
                </label>
                <select
                  value={form.paidBy}
                  onChange={(e) => setForm({ ...form, paidBy: e.target.value })}
                  className="input-field text-sm"
                  required
                >
                  <option value="">Select...</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.emoji} {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-text-muted font-medium uppercase tracking-wider block mb-1">
                  Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-xs">₹</span>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="input-field pl-6 text-sm"
                    placeholder="0"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-text-muted font-medium uppercase tracking-wider block mb-1">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="input-field text-sm"
                >
                  {getGroupCategories(currentGroup).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-text-muted font-medium uppercase tracking-wider block mb-1">
                  Frequency
                </label>
                <select
                  value={form.frequency}
                  onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                  className="input-field text-sm"
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-text-muted font-medium uppercase tracking-wider block mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input-field text-sm"
                  placeholder="e.g. Monthly rent"
                />
              </div>
              <div>
                <label className="text-[10px] text-text-muted font-medium uppercase tracking-wider block mb-1">
                  Next due
                </label>
                <input
                  type="date"
                  value={form.next_due}
                  onChange={(e) => setForm({ ...form, next_due: e.target.value })}
                  className="input-field text-sm"
                />
              </div>
            </div>

            <button type="submit" className="btn-primary w-full text-sm">
              <Plus size={16} /> Add Recurring Expense
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Template List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="skeleton h-12 rounded-xl" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <p className="text-sm text-text-muted text-center py-4">
          No recurring expenses set up yet. Add one for bills like Rent or Utilities.
        </p>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {templates.map((t) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                layout
                className="flex items-center gap-3 p-3 rounded-xl bg-highlight/20 group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-text-dark text-sm truncate">
                      {t.description || t.category}
                    </p>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary font-medium">
                      {t.frequency}
                    </span>
                    {!t.is_active && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-accent/10 text-accent font-medium">
                        paused
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted">
                    {t.payer_emoji} {t.payer_name} · {formatINR(t.amount)} ·{" "}
                    <CalendarDays size={10} className="inline" /> Next: {new Date(t.next_due).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </p>
                </div>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleApply(t.id)}
                    className="p-1.5 rounded-lg hover:bg-primary/10 text-text-muted hover:text-primary transition-colors"
                    title="Apply now"
                  >
                    {applying === t.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Play size={14} />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="p-1.5 rounded-lg hover:bg-accent/10 text-text-muted hover:text-accent transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
