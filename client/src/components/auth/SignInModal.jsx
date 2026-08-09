import { SignIn } from "@clerk/clerk-react";
import { Dialog, DialogPanel } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";

export default function SignInModal({ isOpen, onClose }) {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-dark-bg/80 backdrop-blur-sm" aria-hidden="true" />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="mx-auto w-full max-w-md bg-transparent rounded-2xl relative">
          <button 
            onClick={onClose}
            className="absolute -top-12 right-0 p-2 text-dark-text-muted hover:text-dark-text bg-dark-card rounded-full"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
          
          <div className="flex justify-center">
            <SignIn 
              routing="hash"
              appearance={{
                variables: {
                  colorPrimary: "#2ecc71",
                  colorBackground: "#1e1e1e",
                  colorText: "#f0f0f0",
                  colorInputBackground: "#2c2c2c",
                  colorInputText: "#f0f0f0",
                }
              }}
            />
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
