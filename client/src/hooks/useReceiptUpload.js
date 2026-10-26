import { useState } from "react";
import { useSession } from "@clerk/clerk-react";

export function useReceiptUpload(defaultGroupId) {
  const { session } = useSession();
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const uploadReceipt = async (file, overrideGroupId) => {
    const groupId = overrideGroupId || defaultGroupId;
    if (!groupId) {
      const err = new Error("Group ID is required for receipt upload");
      setError(err.message);
      throw err;
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      const err = new Error("Invalid file type. Only JPG, PNG, and WebP are allowed.");
      setError(err.message);
      throw err;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      const err = new Error("File is too large. Max size is 5MB.");
      setError(err.message);
      throw err;
    }

    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      // 1. Get signed authorization from backend
      const token = session ? await session.getToken() : null;
      const signRes = await fetch("/api/cloudinary/sign-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ groupId })
      });

      if (!signRes.ok) {
        const errData = await signRes.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to obtain upload authorization");
      }

      const { signature, timestamp, apiKey, cloudName, folder } = await signRes.json();

      // 2. Upload to Cloudinary with signed parameters
      return await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", apiKey);
        formData.append("timestamp", String(timestamp));
        formData.append("signature", signature);
        formData.append("folder", folder);

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.addEventListener("load", () => {
          setIsUploading(false);
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const res = JSON.parse(xhr.responseText);
              resolve({
                receiptUrl: res.secure_url,
                receiptPublicId: res.public_id,
                receiptAssetId: res.asset_id,
                url: res.secure_url,
                publicId: res.public_id,
                assetId: res.asset_id
              });
            } catch {
              reject(new Error("Failed to parse Cloudinary response"));
            }
          } else {
            reject(new Error("Cloudinary upload failed"));
          }
        });

        xhr.addEventListener("error", () => {
          setIsUploading(false);
          reject(new Error("Network error during receipt upload"));
        });

        xhr.addEventListener("abort", () => {
          setIsUploading(false);
          reject(new Error("Upload aborted"));
        });

        xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, true);
        xhr.send(formData);
      });
    } catch (err) {
      setError(err.message);
      setIsUploading(false);
      throw err;
    }
  };

  return { uploadReceipt, isUploading, progress, error };
}
