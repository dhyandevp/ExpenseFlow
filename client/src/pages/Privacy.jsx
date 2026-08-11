import SEO from "../components/SEO";
import React from 'react';

function Privacy() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto bg-white/70 backdrop-blur-md border border-white/60 shadow-xl shadow-[#105D5E]/5 rounded-3xl p-8 md:p-12">
        <h1 className="text-primary font-bold text-3xl mb-2">Privacy Policy</h1>
        <p className="text-text-muted mb-8">Last Updated: August 2026</p>
        
        <h4 className="text-foreground font-semibold text-xl mt-8 mb-4">1. Information We Collect</h4>
        <p className="text-text-muted leading-relaxed">We collect information you provide directly, such as group names, member names, and expense details. Authentication information may be collected via Firebase.</p>
        
        <h4 className="text-foreground font-semibold text-xl mt-8 mb-4">2. How We Use Your Information</h4>
        <p className="text-text-muted leading-relaxed">Data is used exclusively to provide the ExpenseFlow service: tracking expenses, calculating balances, and generating fairness reports.</p>
        
        <h4 className="text-foreground font-semibold text-xl mt-8 mb-4">3. Data Storage</h4>
        <p className="text-text-muted leading-relaxed">Your data is stored securely in Firebase Firestore. We do not sell your personal data to third parties.</p>
        
        <h4 className="text-foreground font-semibold text-xl mt-8 mb-4">4. Analytics</h4>
        <p className="text-text-muted leading-relaxed">We may use anonymous usage data to improve our service.</p>

        <h4 className="text-foreground font-semibold text-xl mt-8 mb-4">5. Contact Us</h4>
        <p className="text-text-muted leading-relaxed">If you have any questions about this Privacy Policy, please contact us.</p>
      </div>
    </div>
  );
}


export default function PrivacyWrapper(props) {
  return (
    <>
      <SEO title="Privacy" />
      <Privacy {...props} />
    </>
  );
}
