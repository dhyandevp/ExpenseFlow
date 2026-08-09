import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, Paperclip, Image as ImageIcon } from "lucide-react";
import { useReceiptUpload } from "../hooks/useReceiptUpload";

export default function ReceiptUpload({ value, onChange }) {
  const { uploadReceipt, isUploading, progress, error: uploadError } = useReceiptUpload();
  const [preview, setPreview] = useState(value || null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;

    try {
      const url = await uploadReceipt(file);
      setPreview(url);
      onChange(url);
    } catch (err) {
      // Error is handled by the hook
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
              } ${isUploading ? "opacity-60 cursor-not-allowed" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  Uploading... {progress}%
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
                disabled={isUploading}
              />
            </label>
          </motion.div>
        )}
      </AnimatePresence>

      {uploadError && <p className="text-accent text-xs mt-1">{uploadError}</p>}
    </div>
  );
}

// Small thumbnail indicator for expense list items that have a receipt
export function ReceiptIndicator({ receiptUrl, onClick }) {
  if (!receiptUrl) return null;
  
  // Apply Cloudinary transformation for a tiny thumbnail if it's a Cloudinary URL
  const thumbUrl = receiptUrl.includes("/upload/") 
    ? receiptUrl.replace("/upload/", "/upload/w_64,h_64,c_fill,f_auto,q_auto/")
    : receiptUrl;

  return (
    <button
      onClick={onClick}
      className="p-0.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-colors mr-1"
      title="View receipt"
    >
      <img src={thumbUrl} alt="Receipt thumbnail" className="w-6 h-6 object-cover rounded-md" loading="lazy" />
    </button>
  );
}

// Lightbox modal for viewing receipt images
export function ReceiptLightbox({ receiptUrl, onClose }) {
  if (!receiptUrl) return null;
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
            src={receiptUrl}
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
