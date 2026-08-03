import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HandCoins, Plus, Trash2, X, Loader2 } from "lucide-react";
import { useGroup } from "../App";
import { getSettlements, recordSettlement, deleteSettlement } from "../api/client";
import { formatINR } from "../utils/formatCurrency";

export default function SettlementHistory() {
  const { currentGroup } = useGroup();
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    from_member: "",
    to_member: "",
    amount: "",
    note: "",
  });

  const members = currentGroup?.members || [];

  useEffect(() => {
    if (currentGroup) loadSettlements();
  }, [currentGroup]);

  const loadSettlements = async () => {
    try {
      const res = await getSettlements(currentGroup.id);
      setSettlements(res.data);
    } catch (err) {
      console.error("Failed to load settlements:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecord = async (e) => {
    e.preventDefault();
    if (!form.from_member || !form.to_member || !form.amount) return;
    setSaving(true);
    try {
      await recordSettlement(currentGroup.id, {
        from_member: parseInt(form.from_member),
        to_member: parseInt(form.to_member),
        amount: parseFloat(form.amount),
        note: form.note,
      });
      setShowForm(false);
      setForm({ from_member: "", to_member: "", amount: "", note: "" });
      loadSettlements();
    } catch (err) {
      console.error("Failed to record settlement:", err);
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (sid) => {
    if (!confirm("Undo this settlement?")) return;
    try {
      await deleteSettlement(currentGroup.id, sid);
      loadSettlements();
    } catch (err) {
      console.error("Failed to delete settlement:", err);
    }
  };

  if (!currentGroup) return null;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-semibold text-text-dark flex items-center gap-2">
          <HandCoins size={18} className="text-success" />
          Settlement History
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-ghost text-sm"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Cancel" : "Record"}
        </button>
      </div>

      {/* Record Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleRecord}
            className="space-y-3 mb-4 p-4 rounded-xl bg-success/5 border border-success/20"
          >
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-text-muted font-medium uppercase tracking-wider block mb-1">
                  From
                </label>
                <select
                  value={form.from_member}
                  onChange={(e) => setForm({ ...form, from_member: e.target.value })}
                  className="input-field text-sm"
                  required
                >
                  <option value="">Who paid...</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.emoji} {m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-text-muted font-medium uppercase tracking-wider block mb-1">
                  To
                </label>
                <select
                  value={form.to_member}
                  onChange={(e) => setForm({ ...form, to_member: e.target.value })}
                  className="input-field text-sm"
                  required
                >
                  <option value="">Paid to...</option>
                  {members.filter((m) => String(m.id) !== form.from_member).map((m) => (
                    <option key={m.id} value={m.id}>{m.emoji} {m.name}</option>
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
            <input
              type="text"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="input-field text-sm"
              placeholder="Note (optional)"
            />
            <button type="submit" disabled={saving} className="btn-primary w-full text-sm">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <HandCoins size={16} />}
              Record Settlement
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Settlement List */}
      {loading ? (
        <div className="skeleton h-12 rounded-xl" />
      ) : settlements.length === 0 ? (
        <p className="text-sm text-text-muted text-center py-3">
          No settlements recorded yet.
        </p>
      ) : (
        <div className="space-y-1.5 max-h-60 overflow-y-auto">
          {settlements.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-highlight/20 group"
            >
              <div className="flex items-center gap-2 text-sm min-w-0">
                <span className="flex items-center gap-1">
                  <span>{s.from_emoji}</span>
                  <span className="font-medium text-text-dark">{s.from_name}</span>
                </span>
                <span className="text-text-muted text-xs">→</span>
                <span className="flex items-center gap-1">
                  <span>{s.to_emoji}</span>
                  <span className="font-medium text-text-dark">{s.to_name}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-success text-sm">
                  {formatINR(s.amount)}
                </span>
                <span className="text-[10px] text-text-muted">
                  {new Date(s.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </span>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="p-1 rounded-lg text-text-muted hover:text-accent hover:bg-accent/10 transition-colors opacity-0 group-hover:opacity-100"
                  title="Undo settlement"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
