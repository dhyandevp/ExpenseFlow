import { useState, useRef, useEffect } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function PINVerification({ pin, setPin, isError, onSubmit }) {
  const [showPin, setShowPin] = useState(false);
  const inputRefs = useRef([]);

  // Auto-focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (e, index) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    if (!value) return;

    const newPin = pin.substring(0, index) + value + pin.substring(index + 1);
    setPin(newPin);

    // Auto-advance
    if (index < 5 && value) {
      inputRefs.current[index + 1].focus();
    }
    
    // Auto-submit when complete
    if (newPin.length === 6 && index === 5) {
      onSubmit(newPin);
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const newPin = pin.substring(0, index) + " " + pin.substring(index + 1);
      setPin(newPin.trim());
      if (index > 0) {
        inputRefs.current[index - 1].focus();
      }
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className={`flex space-x-2 ${isError ? "animate-[shake_0.5s_ease-in-out]" : ""}`}>
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type={showPin ? "text" : "password"}
            inputMode="numeric"
            maxLength={1}
            value={pin[index] || ""}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`w-12 h-14 text-center text-2xl font-bold bg-dark-card border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
              isError ? "border-red-500 text-red-500" : "border-dark-border text-dark-text"
            }`}
          />
        ))}
      </div>
      
      <button 
        type="button"
        onClick={() => setShowPin(!showPin)}
        className="text-sm text-dark-text-muted hover:text-primary flex items-center space-x-1"
      >
        {showPin ? (
          <>
            <EyeSlashIcon className="w-4 h-4" /> <span>Hide PIN</span>
          </>
        ) : (
          <>
            <EyeIcon className="w-4 h-4" /> <span>Show PIN</span>
          </>
        )}
      </button>
      
      {/* Required for the shake animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
}
