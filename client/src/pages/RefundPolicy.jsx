import SEO from "../components/SEO";
import React from 'react';
import { Link } from "react-router-dom";

function RefundPolicy() {
  return (
    <main className="min-h-screen bg-background pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto bg-surface/70 backdrop-blur-md border border-border shadow-xl rounded-3xl p-8 md:p-12">
        <h1 className="text-primary font-bold text-3xl mb-2">Refund Policy</h1>
        <p className="text-text-muted mb-8">Last Updated: September 2026</p>

        <h2 className="text-foreground font-semibold text-xl mt-8 mb-4">1. Free Service</h2>
        <p className="text-text-muted leading-relaxed mb-4">
          ExpenseFlow is currently a completely free service. No payments are collected, no subscriptions are sold, and no in-app purchases exist. Because no money changes hands between you and ExpenseFlow, there is nothing to refund.
        </p>

        <h2 className="text-foreground font-semibold text-xl mt-8 mb-4">2. No Payment Processing</h2>
        <p className="text-text-muted leading-relaxed mb-4">
          ExpenseFlow does not process, store, or handle any payment card information, bank account details, UPI IDs, or any other financial payment credentials. The application only tracks expense records (amounts and descriptions) for informational purposes — it does not facilitate actual money transfers between users.
        </p>

        <h2 className="text-foreground font-semibold text-xl mt-8 mb-4">3. Future Paid Features</h2>
        <p className="text-text-muted leading-relaxed mb-4">
          If paid features or premium tiers are introduced in the future:
        </p>
        <ul className="list-disc pl-6 text-text-muted leading-relaxed space-y-2 mb-4">
          <li>Pricing will be clearly displayed before any purchase.</li>
          <li>Your explicit consent will be required before any charge.</li>
          <li>A clear refund policy specific to those paid features will be published at that time.</li>
          <li>The core free functionality will remain available.</li>
        </ul>

        <h2 className="text-foreground font-semibold text-xl mt-8 mb-4">4. Data Deletion</h2>
        <p className="text-text-muted leading-relaxed mb-4">
          While refunds are not applicable, you have full control over your data. You can delete your groups and their associated expense data at any time through the app's settings. For complete account deletion, contact us at the email below.
        </p>

        <h2 className="text-foreground font-semibold text-xl mt-8 mb-4">5. Contact</h2>
        <p className="text-text-muted leading-relaxed">
          Questions? Email us at{" "}
          <a href="mailto:dhyandevp@proton.me" className="text-primary hover:underline">dhyandevp@proton.me</a>.
        </p>

        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-text-muted text-sm">
            See also: <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link> · <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link> · <Link to="/cookie-policy" className="text-primary hover:underline">Cookie Policy</Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function RefundPolicyWrapper(props) {
  return (
    <>
      <SEO title="Refund Policy — ExpenseFlow" description="ExpenseFlow refund policy — currently a free service with no payments." />
      <RefundPolicy {...props} />
    </>
  );
}
