import SEO from "../components/SEO";
import React from 'react';
import { Link } from "react-router-dom";

function Terms() {
  return (
    <main className="min-h-screen bg-background pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto bg-white/70 backdrop-blur-md border border-white/60 shadow-xl shadow-[#105D5E]/5 rounded-3xl p-8 md:p-12">
        <h1 className="text-primary font-bold text-3xl mb-2">Terms of Service</h1>
        <p className="text-text-muted mb-8">Last Updated: September 2026</p>

        <p className="text-text-muted leading-relaxed mb-6">
          These Terms of Service ("Terms") govern your use of ExpenseFlow, a web application for tracking shared expenses. By accessing or using ExpenseFlow, you agree to be bound by these Terms. If you do not agree, do not use the service.
        </p>

        <h2 className="text-foreground font-semibold text-xl mt-8 mb-4">1. Service Description</h2>
        <p className="text-text-muted leading-relaxed mb-4">
          ExpenseFlow is a free tool that helps groups track shared expenses, calculate balances, and generate fairness insights. It is not a financial institution, payment processor, or licensed accounting service. It does not facilitate actual money transfers between users.
        </p>

        <h2 className="text-foreground font-semibold text-xl mt-8 mb-4">2. Eligibility</h2>
        <p className="text-text-muted leading-relaxed mb-4">
          You must be at least 16 years old to use ExpenseFlow. By using the service, you represent that you meet this age requirement.
        </p>

        <h2 className="text-foreground font-semibold text-xl mt-8 mb-4">3. Accounts and Access</h2>
        <ul className="list-disc pl-6 text-text-muted leading-relaxed space-y-2 mb-4">
          <li><strong>Clerk accounts</strong> — you may sign up with an email/password or Google OAuth via Clerk. You are responsible for maintaining the confidentiality of your credentials.</li>
          <li><strong>Guest access</strong> — you may join an existing group using a 6-character group code without creating an account. Guest sessions are tied to the group code and a temporary Firebase token.</li>
          <li>You are responsible for all activity that occurs under your account or guest session.</li>
        </ul>

        <h2 className="text-foreground font-semibold text-xl mt-8 mb-4">4. Acceptable Use</h2>
        <p className="text-text-muted leading-relaxed mb-3">You agree not to:</p>
        <ul className="list-disc pl-6 text-text-muted leading-relaxed space-y-2 mb-4">
          <li>Use ExpenseFlow for any unlawful purpose.</li>
          <li>Attempt to gain unauthorised access to other users' data or groups.</li>
          <li>Upload malicious, offensive, or illegal content (including receipt images).</li>
          <li>Use automated tools (bots, scrapers) to access the service.</li>
          <li>Interfere with or disrupt the service's infrastructure.</li>
        </ul>

        <h2 className="text-foreground font-semibold text-xl mt-8 mb-4">5. User Content</h2>
        <p className="text-text-muted leading-relaxed mb-4">
          You retain ownership of the data you enter (expense descriptions, group names, receipt images, etc.). By using ExpenseFlow, you grant us a limited licence to store, process, and display that content solely for the purpose of providing the service to you and your group members.
        </p>

        <h2 className="text-foreground font-semibold text-xl mt-8 mb-4">6. Intellectual Property</h2>
        <p className="text-text-muted leading-relaxed mb-4">
          The ExpenseFlow name, logo, design, and source code are the property of the developer. You may not copy, modify, distribute, or create derivative works of the application without permission.
        </p>

        <h2 className="text-foreground font-semibold text-xl mt-8 mb-4">7. Pricing</h2>
        <p className="text-text-muted leading-relaxed mb-4">
          ExpenseFlow is currently provided free of charge. There are no hidden fees, premium tiers, or in-app purchases. If paid features are ever introduced, they will be clearly communicated and will require your explicit opt-in before any charge is made.
        </p>

        <h2 className="text-foreground font-semibold text-xl mt-8 mb-4">8. Disclaimers</h2>
        <ul className="list-disc pl-6 text-text-muted leading-relaxed space-y-2 mb-4">
          <li>ExpenseFlow is provided <strong>"as is"</strong> and <strong>"as available"</strong> without warranties of any kind, whether express or implied.</li>
          <li>We do not guarantee that balance calculations or fairness scores will be error-free. You should independently verify financial amounts before making real-world payments.</li>
          <li>ExpenseFlow is not a substitute for professional accounting, tax, or legal advice.</li>
          <li>We do not guarantee uninterrupted availability of the service.</li>
        </ul>

        <h2 className="text-foreground font-semibold text-xl mt-8 mb-4">9. Limitation of Liability</h2>
        <p className="text-text-muted leading-relaxed mb-4">
          To the maximum extent permitted by law, ExpenseFlow and its developer shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of data, financial loss, or damages arising from reliance on balance calculations, regardless of the cause of action.
        </p>

        <h2 className="text-foreground font-semibold text-xl mt-8 mb-4">10. Indemnification</h2>
        <p className="text-text-muted leading-relaxed mb-4">
          You agree to indemnify and hold harmless ExpenseFlow and its developer from any claims, damages, or expenses arising from your use of the service or violation of these Terms.
        </p>

        <h2 className="text-foreground font-semibold text-xl mt-8 mb-4">11. Termination</h2>
        <p className="text-text-muted leading-relaxed mb-4">
          We may suspend or terminate your access to ExpenseFlow at any time, for any reason, including violation of these Terms. You may stop using the service at any time. Upon termination, your right to use the service ceases immediately. Group data you created may be retained or deleted at our discretion.
        </p>

        <h2 className="text-foreground font-semibold text-xl mt-8 mb-4">12. Governing Law</h2>
        <p className="text-text-muted leading-relaxed mb-4">
          These Terms are governed by the laws of India. Any disputes arising from your use of ExpenseFlow will be subject to the exclusive jurisdiction of the courts in India.
        </p>

        <h2 className="text-foreground font-semibold text-xl mt-8 mb-4">13. Changes to These Terms</h2>
        <p className="text-text-muted leading-relaxed mb-4">
          We reserve the right to update these Terms at any time. The "Last Updated" date at the top will reflect changes. Continued use of ExpenseFlow after any modification constitutes acceptance of the updated Terms.
        </p>

        <h2 className="text-foreground font-semibold text-xl mt-8 mb-4">14. Contact</h2>
        <p className="text-text-muted leading-relaxed">
          Questions about these Terms? Email us at{" "}
          <a href="mailto:dhyandevp@proton.me" className="text-primary hover:underline">dhyandevp@proton.me</a>.
        </p>

        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-text-muted text-sm">
            See also: <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link> · <Link to="/cookie-policy" className="text-primary hover:underline">Cookie Policy</Link> · <Link to="/refund-policy" className="text-primary hover:underline">Refund Policy</Link>
          </p>
        </div>
      </div>
    </main>
  );
}


export default function TermsWrapper(props) {
  return (
    <>
      <SEO title="Terms of Service — ExpenseFlow" description="Terms and conditions for using the ExpenseFlow expense sharing application." />
      <Terms {...props} />
    </>
  );
}
