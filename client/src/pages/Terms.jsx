import SEO from "../components/SEO";
import React from 'react';

function Terms() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto bg-white/70 backdrop-blur-md border border-white/60 shadow-xl shadow-[#105D5E]/5 rounded-3xl p-8 md:p-12">
        <h1 className="text-primary font-bold text-3xl mb-2">Terms of Service</h1>
        <p className="text-text-muted mb-8">Last Updated: August 2026</p>
        
        <h4 className="text-foreground font-semibold text-xl mt-8 mb-4">1. Acceptance of Terms</h4>
        <p className="text-text-muted leading-relaxed">By accessing or using ExpenseFlow, you agree to be bound by these Terms of Service.</p>
        
        <h4 className="text-foreground font-semibold text-xl mt-8 mb-4">2. Service Description</h4>
        <p className="text-text-muted leading-relaxed">ExpenseFlow is a tool to help groups manage shared expenses and calculate fairness scores.</p>
        
        <h4 className="text-foreground font-semibold text-xl mt-8 mb-4">3. User Data</h4>
        <p className="text-text-muted leading-relaxed">You agree to provide accurate information. You are responsible for maintaining the security of your group codes and PINs.</p>
        
        <h4 className="text-foreground font-semibold text-xl mt-8 mb-4">4. Limitation of Liability</h4>
        <p className="text-text-muted leading-relaxed">ExpenseFlow is provided "as is" without warranty of any kind. We are not liable for financial discrepancies or loss of data.</p>

        <h4 className="text-foreground font-semibold text-xl mt-8 mb-4">5. Modifications</h4>
        <p className="text-text-muted leading-relaxed">We reserve the right to modify these terms at any time. Continued use implies acceptance.</p>
      </div>
    </div>
  );
}


export default function TermsWrapper(props) {
  return (
    <>
      <SEO title="Terms" />
      <Terms {...props} />
    </>
  );
}
