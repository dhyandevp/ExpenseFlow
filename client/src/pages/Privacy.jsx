import React from 'react';

export default function Privacy() {
  return (
    <div className="container py-5 mt-5">
      <h1 className="mb-4">Privacy Policy</h1>
      <div className="card bg-dark text-light border-0 shadow-sm p-4">
        <p>Last Updated: August 2026</p>
        
        <h4>1. Information We Collect</h4>
        <p>We collect information you provide directly, such as group names, member names, and expense details. Authentication information may be collected via Firebase.</p>
        
        <h4>2. How We Use Your Information</h4>
        <p>Data is used exclusively to provide the ExpenseFlow service: tracking expenses, calculating balances, and generating fairness reports.</p>
        
        <h4>3. Data Storage</h4>
        <p>Your data is stored securely in Firebase Firestore. We do not sell your personal data to third parties.</p>
        
        <h4>4. Analytics</h4>
        <p>We may use anonymous usage data to improve our service.</p>

        <h4>5. Contact Us</h4>
        <p>If you have any questions about this Privacy Policy, please contact us.</p>
      </div>
    </div>
  );
}
