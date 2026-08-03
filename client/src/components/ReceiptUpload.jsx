import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, Paperclip, Image as ImageIcon } from "lucide-react";
import { uploadReceipt } from "../api/client";

export default function ReceiptUpload({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value || null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file) => {
    if (!file) return;

    // Validate client-side
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError("Only JPEG, PNG, and WebP images are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File too large. Maximum size is 5MB.");
      return;
    }

    setError("");
    setUploading(true);

    try {
      const res = await uploadReceipt(file);
      const path = res.data.path;
      setPreview(path);
      onChange(path);
    } catch (err) {
      setError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleRemove = () => {
    setPreview(null);
    onChange(null);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-text-dark mb-1">
        Receipt <span className="text-text-muted font-normal">(optional)</span>
      </label>

      <AnimatePresence mode="wait">
        {preview ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="relative inline-block"
          >
            <img
              src={preview}
              alt="Receipt"
              className="w-20 h-20 object-cover rounded-xl border border-border"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 w-6 h-6 bg-accent text-white rounded-full flex items-center justify-center shadow-sm hover:bg-accent/80 transition-colors"
            >
              <X size={12} />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <label
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-all text-sm ${
                dragOver
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-text-muted hover:border-primary/40 hover:text-text-dark"
              } ${uploading ? "opacity-60 cursor-not-allowed" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Paperclip size={16} />
                  Attach receipt photo
                </>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => handleFile(e.target.files[0])}
                disabled={uploading}
              />
            </label>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="text-accent text-xs mt-1">{error}</p>}
    </div>
  );
}

// Small icon for expense list items that have a receipt
export function ReceiptIndicator({ receiptPath, onClick }) {
  if (!receiptPath) return null;
  return (
    <button
      onClick={onClick}
      className="p-1 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
      title="View receipt"
    >
      <ImageIcon size={14} />
    </button>
  );
}

// Lightbox modal for viewing receipt images
export function ReceiptLightbox({ receiptPath, onClose }) {
  if (!receiptPath) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative max-w-lg max-h-[80vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={receiptPath}
            alt="Receipt"
            className="rounded-2xl shadow-xl max-h-[80vh] object-contain"
          />
          <button
            onClick={onClose}
            className="absolute -top-3 -right-3 w-8 h-8 bg-surface text-text-dark rounded-full flex items-center justify-center shadow-md hover:bg-background transition-colors"
          >
            <X size={16} />
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
