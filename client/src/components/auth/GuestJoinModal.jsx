import { useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { X } from "lucide-react";
import PINVerification from "./PINVerification";
import { getAuth, signInWithCustomToken } from "firebase/auth";
import { app } from "../../firebase";
import { useNavigate } from "react-router-dom";
import { useGroup } from "../../App";
import { getGroupById } from "../../api/client";

export default function GuestJoinModal({ isOpen, onClose, defaultCode = "" }) {
  const [code, setCode] = useState(defaultCode);
  const [pin, setPin] = useState("");
  const [isError, setIsError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setCurrentGroup } = useGroup();

  const handleSubmit = async (finalPin = pin) => {
    if (!code) {
      setIsError(true);
      setErrorMsg("Group Code is required.");
      return;
    }
    if (finalPin.length < 6) {
      setIsError(true);
      setErrorMsg("PIN must be 6 digits.");
      return;
    }
    
    setIsLoading(true);
    setIsError(false);
    setErrorMsg("");
    
    try {
      const res = await Promise.race([
        fetch("/api/auth/jwt-bridge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "guest",
            code: code.trim().toUpperCase(),
            pin: finalPin
          })
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Request timed out")), 8000))
      ]);
      
      const data = await res.json();
      
      if (!res.ok) {
        setIsError(true);
        setErrorMsg(data.message || "Failed to join group");
        setPin(""); // Clear PIN on error
        return;
      }
      
      // Sign into Firebase with the custom token
      const auth = getAuth(app);
      await signInWithCustomToken(auth, data.firebaseToken);
      
      // Fetch the group data and set it in context
      const groupRes = await getGroupById(data.groupId);
      setCurrentGroup(groupRes.data);
      
      onClose(); // Successfully joined, close modal.
      navigate(`/group/${code.trim().toUpperCase()}/dashboard`);
      
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
      <div className="fixed inset-0 bg-primary/20 backdrop-blur-sm" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="mx-auto w-full max-w-md bg-white/60 backdrop-blur-xl border border-white/80 rounded-2xl p-6 relative shadow-2xl shadow-[#105D5E]/10">
          <button 
            aria-label="Close"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-[#767F7D] hover:text-[#293E33] rounded-xl hover:bg-white/50 transition-all"
          >
            <X className="w-6 h-6" />
          </button>
          
          <DialogTitle className="text-2xl font-bold text-text-dark mb-2 text-center">
            Join as Guest
          </DialogTitle>
          <p className="text-text-muted text-center mb-6 text-sm">
            Enter the group code and 6-digit PIN provided by your group admin.
          </p>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Group Code</label>
              <input 
                type="text" 
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. A1B2C3"
                maxLength={6}
                className="w-full bg-white border border-[#C2CBC9] text-text-dark rounded-lg px-4 py-3 font-mono text-center tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2 text-center">Group PIN</label>
              <PINVerification 
                pin={pin} 
                setPin={setPin} 
                isError={isError} 
                onSubmit={handleSubmit} 
              />
              {errorMsg && (
                <p className="text-text-muted font-semibold text-sm text-center mt-2 flex items-center justify-center gap-1.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  {errorMsg}
                </p>
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
