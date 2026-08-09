import SEO from "../components/SEO";
import React from 'react';

function Terms() {
  return (
    <div className="container py-5 mt-5">
      <h1 className="mb-4">Terms of Service</h1>
      <div className="card bg-dark text-light border-0 shadow-sm p-4">
        <p>Last Updated: August 2026</p>
        
        <h4>1. Acceptance of Terms</h4>
        <p>By accessing or using ExpenseFlow, you agree to be bound by these Terms of Service.</p>
        
        <h4>2. Service Description</h4>
        <p>ExpenseFlow is a tool to help groups manage shared expenses and calculate fairness scores.</p>
        
        <h4>3. User Data</h4>
        <p>You agree to provide accurate information. You are responsible for maintaining the security of your group codes and PINs.</p>
        
        <h4>4. Limitation of Liability</h4>
        <p>ExpenseFlow is provided "as is" without warranty of any kind. We are not liable for financial discrepancies or loss of data.</p>

        <h4>5. Modifications</h4>
        <p>We reserve the right to modify these terms at any time. Continued use implies acceptance.</p>
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
