import { useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import PINVerification from "./PINVerification";
import { getAuth, signInWithCustomToken } from "firebase/auth";
import { app } from "../../firebase";

export default function GuestJoinModal({ isOpen, onClose, defaultCode = "" }) {
  const [code, setCode] = useState(defaultCode);
  const [pin, setPin] = useState("");
  const [isError, setIsError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (finalPin = pin) => {
    if (!code || finalPin.length < 6) return;
    
    setIsLoading(true);
    setIsError(false);
    setErrorMsg("");
    
    try {
      const res = await fetch("/api/auth/jwt-bridge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "guest",
          code: code.trim().toUpperCase(),
          pin: finalPin
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setIsError(true);
        setErrorMsg(data.message || "Failed to join group");
        setPin(""); // Clear PIN on error
        return;
      }
      
      // Sign into Firebase with the custom token
      const auth = getAuth(app);
      await signInWithCustomToken(auth, data.token);
      
      onClose(); // Successfully joined, close modal. App.jsx router handles redirect.
      
    } catch (err) {
      console.error(err);
      setIsError(true);
      setErrorMsg("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-dark-bg/80 backdrop-blur-sm" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="mx-auto w-full max-w-md bg-dark-card border border-dark-border rounded-2xl p-6 relative shadow-2xl">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1 text-dark-text-muted hover:text-dark-text"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
          
          <DialogTitle className="text-2xl font-bold text-dark-text mb-2 text-center">
            Join as Guest
          </DialogTitle>
          <p className="text-dark-text-muted text-center mb-6 text-sm">
            Enter the group code and 6-digit PIN provided by your group admin.
          </p>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-dark-text-muted mb-1">Group Code</label>
              <input 
                type="text" 
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. A1B2C3"
                maxLength={6}
                className="w-full bg-dark-bg border border-dark-border text-dark-text rounded-lg px-4 py-3 font-mono text-center tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-dark-text-muted mb-2 text-center">Group PIN</label>
              <PINVerification 
                pin={pin} 
                setPin={setPin} 
                isError={isError} 
                onSubmit={handleSubmit} 
              />
              {errorMsg && (
                <p className="text-accent text-sm text-center mt-2">{errorMsg}</p>
              )}
            </div>
            
            <button
              onClick={() => handleSubmit(pin)}
              disabled={isLoading || !code || pin.length < 6}
              className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Joining..." : "Join Group"}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
