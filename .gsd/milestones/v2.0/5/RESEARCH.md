# Phase 5 Research: Cloudinary Receipt Uploads

## Discovery Level 1.5

### Analysis of Roadmap Tasks
The goal is to move receipt image storage from Firebase Storage to Cloudinary via unsigned client-side uploads. 
This aligns perfectly with the "Ponytail Ultra" architecture:
- Removes the need for Firebase Storage rules.
- Removes the need for client-side image compression libraries (`browser-image-compression`) since Cloudinary handles incoming transformations (e.g. auto WebP, resizing).
- Simplifies the Firestore data model by storing a public URL (`receiptUrl`) instead of a storage path (`receiptPath`).

### Cloudinary Unsigned Upload API
To upload to Cloudinary directly from the client without a backend signature:
1. Make a POST request to `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`.
2. Provide form data with `file` (the image) and `upload_preset` (the name of the unsigned preset configured in the Cloudinary dashboard).

### Task Breakdown & Wave Planning

**Wave 1: Setup & Cleanup**
- Define `VITE_CLOUDINARY_CLOUD_NAME` and `VITE_CLOUDINARY_UPLOAD_PRESET` in `.env.example`.
- Uninstall `browser-image-compression`.
- Remove `firebase/storage` dependencies from `firebase.js` and the broader app.

**Wave 2: Cloudinary Integration**
- Create `useReceiptUpload.js` hook utilizing the Cloudinary XHR upload API.
- Refactor `ReceiptUpload.jsx` to leverage the new hook, displaying progress and returning a public Cloudinary URL.

**Wave 3: Schema & UI Updates**
- Update `ExpenseForm.jsx` to write `receiptUrl` instead of `receiptPath`.
- Update expense list views to render the Cloudinary image directly, applying Cloudinary thumbnail transformations on the fly (`/upload/w_200,f_auto,q_auto/`).
