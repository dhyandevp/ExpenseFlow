import { useState, useRef, useEffect } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";

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
      <motion.div
        animate={isError ? { x: [-5, 5, -5, 5, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="flex space-x-2"
      >
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
            className={`w-12 h-14 text-center text-2xl font-bold bg-surface border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
              isError ? "border-accent text-accent" : "border-border text-text-dark"
            }`}
          />
        ))}
      </motion.div>
      
      <button 
        type="button"
        onClick={() => setShowPin(!showPin)}
        className="text-sm text-text-muted hover:text-primary flex items-center space-x-1 transition-colors"
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
    </div>
  );
}
