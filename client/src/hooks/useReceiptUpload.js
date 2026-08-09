import { useState } from "react";

export function useReceiptUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const uploadReceipt = (file) => {
    return new Promise((resolve, reject) => {
      // Validate file type
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        const err = new Error("Invalid file type. Only JPG, PNG, and WebP are allowed.");
        setError(err.message);
        return reject(err);
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        const err = new Error("File is too large. Max size is 5MB.");
        setError(err.message);
        return reject(err);
      }

      setIsUploading(true);
      setProgress(0);
      setError(null);

      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
      
      if (!cloudName || !uploadPreset) {
        const err = new Error("Cloudinary configuration is missing.");
        setError(err.message);
        setIsUploading(false);
        return reject(err);
      }

      const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setProgress(percentComplete);
        }
      });

      xhr.addEventListener("load", () => {
        setIsUploading(false);
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response.secure_url);
          } catch (e) {
            const err = new Error("Failed to parse Cloudinary response.");
            setError(err.message);
            reject(err);
          }
        } else {
          try {
            const response = JSON.parse(xhr.responseText);
            const err = new Error(response.error?.message || "Upload failed.");
            setError(err.message);
            reject(err);
          } catch (e) {
            const err = new Error("Upload failed.");
            setError(err.message);
            reject(err);
          }
        }
      });

      xhr.addEventListener("error", () => {
        setIsUploading(false);
        const err = new Error("Network error occurred during upload.");
        setError(err.message);
        reject(err);
      });

      xhr.addEventListener("abort", () => {
        setIsUploading(false);
        const err = new Error("Upload aborted.");
        setError(err.message);
        reject(err);
      });

      xhr.open("POST", url, true);
      xhr.send(formData);
    });
  };

  return { uploadReceipt, isUploading, progress, error };
}
