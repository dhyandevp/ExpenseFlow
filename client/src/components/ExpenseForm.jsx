import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { sheetSlide, modalSpring } from "../utils/motion";
import { useGroup } from "../App";
import ReceiptUpload from "./ReceiptUpload";

import { getGroupCategories } from "../utils/groupHelpers";
import { CategoryIcon } from "../utils/categoryIcons";
import Avatar from "./Avatar";

export default function ExpenseForm({ isOpen, onClose, onSubmit, initialData }) {
  const { currentGroup } = useGroup();
  const [form, setForm] = useState({
    amount: "",
    paidBy: "",
    category: "Other",
    description: "",
    createdAt: new Date().toISOString().split("T")[0],
    split_type: "equal",
    split_members: [],
    receiptUrl: null,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  useEffect(() => {
    if (initialData) {
      setForm({
        amount: String(initialData.amount),
        paidBy: String(initialData.paidBy),
        category: initialData.category,
        description: initialData.description || "",
        createdAt: initialData.createdAt,
        split_type: initialData.split_type || "equal",
        split_members: initialData.splits?.map((s) => s.member_id) || [],
      });
    } else {
      setForm({
        amount: "",
        paidBy: "",
        category: "Other",
        description: "",
        createdAt: new Date().toISOString().split("T")[0],
        split_type: "equal",
        split_members: [],
        receiptUrl: null,
      });
    }
  }, [initialData, isOpen]);

  const members = currentGroup?.members || [];
  const isEditing = !!initialData;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    const amount = parseFloat(form.amount);
    const newErrors = {};
    if (!amount || amount <= 0) newErrors.amount = "Please enter a valid amount.";
    if (!form.paidBy) newErrors.paidBy = "Please select who paid.";
    if (!form.category) newErrors.category = "Please select a category.";
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    setIsSubmitting(true);
    try {
      await onSubmit({
        group_id: currentGroup.id,
        paidBy: parseInt(form.paidBy),
        amount,
        category: form.category,
        description: form.description,
        createdAt: form.createdAt,
        split_type: form.split_type,
        receiptUrl: form.receiptUrl,
        split_members:
          form.split_members.length > 0
            ? form.split_members.map(Number)
            : members.map((m) => m.id),
      });
    } catch (err) {
      setErrors({ submit: err.message || "Failed to save expense." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMember = (id) => {
    setForm((f) => ({
      ...f,
      split_members: f.split_members.includes(id)
        ? f.split_members.filter((m) => m !== id)
        : [...f.split_members, id],
    }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            {...modalSpring}
            className="bg-surface rounded-t-2xl md:rounded-2xl w-full md:max-w-lg max-h-[90vh] overflow-auto p-6 md:m-4 pb-12 md:pb-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading font-bold text-xl text-text-dark">
                {isEditing ? "Edit Expense" : "Add Expense"}
              </h3>
              <button
                aria-label="Close"
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-background transition-colors"
              >
                <X size={20} className="text-text-muted" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-text-dark mb-1">
                  Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-medium">
                    {currentGroup?.currency || "₹"}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={form.amount}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, amount: e.target.value }));
                      if (errors.amount) setErrors(err => ({ ...err, amount: null }));
                    }}
                    className={`input-field pl-8 ${errors.amount ? 'border-accent ring-1 ring-accent' : ''}`}
                    placeholder="0.00"
                    autoFocus
                  />
                </div>
                {errors.amount && <p className="text-accent text-xs mt-1">{errors.amount}</p>}
              </div>

              {/* Paid By */}
              <div>
                <label className="block text-sm font-medium text-text-dark mb-1">
                  Paid by
                </label>
                <select
                  value={form.paidBy}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, paidBy: e.target.value }));
                    if (errors.paidBy) setErrors(err => ({ ...err, paidBy: null }));
                  }}
                  className="input-field"
                  required
                >
                  <option value="">Select a member...</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                {errors.paidBy && <p className="text-accent text-xs mt-1">{errors.paidBy}</p>}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-text-dark mb-1">
                  Category
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {getGroupCategories(currentGroup).map((cat) => (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, category: cat.name }))}
                      className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl text-sm font-medium transition-all ${
                        form.category === cat.name
                          ? "bg-primary text-background ring-2 ring-primary ring-offset-2"
                          : "bg-highlight/30 text-text-muted hover:bg-highlight"
                      }`}
                    >
                      <CategoryIcon category={cat} size={20} />
                      <span className="truncate w-full text-center">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Split Type */}
              <div>
                <label className="block text-sm font-medium text-text-dark mb-1">
                  Split type
                </label>
                <select
                  value={form.split_type}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, split_type: e.target.value }))
                  }
                  className="input-field"
                >
                  <option value="equal">Equal split</option>
                  <option value="custom_amounts">Custom amounts</option>
                  <option value="custom_percentages">Custom percentages</option>
                </select>
              </div>

              {/* Split Members */}
              <div>
                <label className="block text-sm font-medium text-text-dark mb-1">
                  Split between{" "}
                  <span className="text-text-muted font-normal">
                    (all by default)
                  </span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {members.map((m) => {
                    const isSelected =
                      form.split_members.length === 0 ||
                      form.split_members.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleMember(m.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm transition-all ${
                          isSelected
                            ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                            : "bg-highlight/30 text-text-muted hover:bg-highlight"
                        }`}
                      >
                        <Avatar member={m} size={16} />
                        {m.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-text-dark mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={form.createdAt}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, createdAt: e.target.value }))
                  }
                  className="input-field"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-text-dark mb-1">
                  Description{" "}
                  <span className="text-text-muted font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  className="input-field"
                  placeholder="What was this for?"
                />
              </div>

              {/* Receipt Upload */}
              <ReceiptUpload
                value={form.receiptUrl}
                onChange={(url) => setForm((f) => ({ ...f, receiptUrl: url }))}
              />


              {errors.submit && <p className="text-accent text-sm text-center mb-2">{errors.submit}</p>}
              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary flex-1"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={!form.amount || !form.paidBy || isSubmitting}
                >
                  {isSubmitting ? "Saving..." : (isEditing ? "Update" : "Add Expense")}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
