import { useState, useRef, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

export default function PINVerification({ pin, setPin, isError, onSubmit }) {
  const [showPin, setShowPin] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const inputRefs = useRef([]);

  // Auto-focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Track failed attempts
  useEffect(() => {
    if (isError) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 3) {
        setPin("");
        setAttempts(0);
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }
    }
  }, [isError]);

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
      {/* Accessibility live region for errors */}
      <div aria-live="polite" className="sr-only">
        {isError ? "Incorrect PIN entered. Please try again." : ""}
      </div>

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
            aria-label={`Digit ${index + 1}`}
            value={pin[index] || ""}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className="w-12 h-14 text-center text-2xl font-bold bg-white border border-[#C2CBC9] text-text-dark rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
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
            <EyeOff className="w-4 h-4" /> <span>Hide PIN</span>
          </>
        ) : (
          <>
            <Eye className="w-4 h-4" /> <span>Show PIN</span>
          </>
        )}
      </button>
    </div>
  );
}
