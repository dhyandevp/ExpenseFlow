import SEO from "../components/SEO";
import React from 'react';
import { Link } from "react-router-dom";

function Privacy() {
  return (
    <main className="min-h-screen bg-background pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto bg-white/70 backdrop-blur-md border border-white/60 shadow-xl shadow-[#105D5E]/5 rounded-3xl p-8 md:p-12">
        <h1 className="text-primary font-bold text-3xl mb-2">Privacy Policy</h1>
        <p className="text-text-muted mb-8">Last Updated: September 2026</p>

        <p className="text-text-muted leading-relaxed mb-6">
          ExpenseFlow ("we", "us", "our") is a personal project operated by an individual developer. This Privacy Policy explains what data we collect, why, how it is stored, and your rights regarding that data.
        </p>

        <h2 className="text-foreground font-semibold text-xl mt-8 mb-4">1. Data We Collect</h2>
        <p className="text-text-muted leading-relaxed mb-3">We collect only what is necessary to provide the service:</p>
        <ul className="list-disc pl-6 text-text-muted leading-relaxed space-y-2 mb-4">
          <li><strong>Account data</strong> — email address and display name (if you sign up via Clerk authentication). Guest users provide only a chosen display name.</li>
          <li><strong>Group data</strong> — group names, member names, expense descriptions, amounts, categories, split configurations, and settlement records you create.</li>
          <li><strong>Receipt images</strong> — photos you optionally upload, stored via Cloudinary.</li>
          <li><strong>Technical data</strong> — your IP address, browser type, and request timestamps are processed by Cloudflare (our hosting provider) as part of standard web delivery. We do not log or store this data ourselves.</li>
        </ul>

        <h2 className="text-foreground font-semibold text-xl mt-8 mb-4">2. Data We Do NOT Collect</h2>
        <ul className="list-disc pl-6 text-text-muted leading-relaxed space-y-2 mb-4">
          <li>We do not use analytics, tracking pixels, or advertising SDKs.</li>
          <li>We do not track your behaviour across other websites.</li>
          <li>We do not collect financial account numbers, bank details, or payment card information.</li>
          <li>We do not sell, rent, or trade your personal data to anyone.</li>
        </ul>

        <h2 className="text-foreground font-semibold text-xl mt-8 mb-4">3. How We Use Your Data</h2>
        <p className="text-text-muted leading-relaxed mb-3">Your data is used exclusively to:</p>
        <ul className="list-disc pl-6 text-text-muted leading-relaxed space-y-2 mb-4">
          <li>Authenticate your identity and manage sessions.</li>
          <li>Display, calculate, and store shared expenses and balances within your group.</li>
          <li>Generate fairness reports and settlement suggestions.</li>
          <li>Attach receipt images to expense records.</li>
        </ul>

        <h2 className="text-foreground font-semibold text-xl mt-8 mb-4">4. Third-Party Services</h2>
        <p className="text-text-muted leading-relaxed mb-3">We rely on the following third-party services to operate:</p>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm text-text-muted border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 font-semibold text-text-dark">Service</th>
                <th className="text-left py-2 pr-4 font-semibold text-text-dark">Purpose</th>
                <th className="text-left py-2 font-semibold text-text-dark">Data shared</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4">Clerk</td>
                <td className="py-2 pr-4">Authentication (sign-in, sign-up, OAuth)</td>
                <td className="py-2">Email, OAuth tokens</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4">Google Firebase / Firestore</td>
                <td className="py-2 pr-4">Database and real-time storage</td>
                <td className="py-2">All group and expense data</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4">Cloudinary</td>
                <td className="py-2 pr-4">Receipt image hosting</td>
                <td className="py-2">Uploaded receipt images</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4">Cloudflare</td>
                <td className="py-2 pr-4">Hosting, CDN, DDoS protection</td>
                <td className="py-2">IP address, request metadata</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4">Google Fonts</td>
                <td className="py-2 pr-4">Typography</td>
                <td className="py-2">IP address (standard font loading)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-text-muted leading-relaxed mb-4">
          Each service has its own privacy policy. We encourage you to review them.
        </p>

        <h2 className="text-foreground font-semibold text-xl mt-8 mb-4">5. Cookies and Local Storage</h2>
        <p className="text-text-muted leading-relaxed mb-4">
          We use only essential cookies required for authentication (set by Clerk). We do not use analytics cookies, advertising cookies, or social-media tracking cookies. We use browser localStorage to remember your active group and UI preferences. See our <Link to="/cookie-policy" className="text-primary hover:underline">Cookie Policy</Link> for full details.
        </p>

        <h2 className="text-foreground font-semibold text-xl mt-8 mb-4">6. Data Storage and Security</h2>
        <ul className="list-disc pl-6 text-text-muted leading-relaxed space-y-2 mb-4">
          <li>Group and expense data is stored in Google Firestore. Firestore servers may be located outside your country of residence.</li>
          <li>Receipt images are stored on Cloudinary's CDN.</li>
          <li>All data is transmitted over HTTPS (TLS encryption in transit).</li>
          <li>Access to group data is restricted by Firestore Security Rules to authenticated members of that group.</li>
        </ul>

        <h2 className="text-foreground font-semibold text-xl mt-8 mb-4">7. Data Retention</h2>
        <p className="text-text-muted leading-relaxed mb-4">
          Your data is retained for as long as your account and group exist. If you delete a group, its associated expense data is permanently removed. If you wish to have your account data deleted, contact us at the address below.
        </p>

        <h2 className="text-foreground font-semibold text-xl mt-8 mb-4">8. Your Rights</h2>
        <p className="text-text-muted leading-relaxed mb-3">Depending on your location, you may have the right to:</p>
        <ul className="list-disc pl-6 text-text-muted leading-relaxed space-y-2 mb-4">
          <li><strong>Access</strong> the personal data we hold about you.</li>
          <li><strong>Correct</strong> inaccurate data.</li>
          <li><strong>Delete</strong> your data ("right to be forgotten").</li>
          <li><strong>Export</strong> your data in a portable format (CSV export is available in-app).</li>
          <li><strong>Object</strong> to processing of your data.</li>
        </ul>
        <p className="text-text-muted leading-relaxed mb-4">
          If you are in the European Economic Area, these rights are provided under the GDPR. If you are in India, the Digital Personal Data Protection Act, 2023 (DPDPA) provides similar protections. To exercise any right, email us below.
        </p>

        <h2 className="text-foreground font-semibold text-xl mt-8 mb-4">9. Children's Privacy</h2>
        <p className="text-text-muted leading-relaxed mb-4">
          ExpenseFlow is not intended for use by anyone under the age of 16. We do not knowingly collect data from children. If you believe a child has provided us with personal data, please contact us and we will delete it.
        </p>

        <h2 className="text-foreground font-semibold text-xl mt-8 mb-4">10. Changes to This Policy</h2>
        <p className="text-text-muted leading-relaxed mb-4">
          We may update this policy from time to time. The "Last Updated" date at the top will reflect any changes. Continued use of ExpenseFlow after changes constitutes acceptance of the revised policy.
        </p>

        <h2 className="text-foreground font-semibold text-xl mt-8 mb-4">11. Contact</h2>
        <p className="text-text-muted leading-relaxed">
          For privacy-related requests or questions, email us at{" "}
          <a href="mailto:dhyandevp@proton.me" className="text-primary hover:underline">dhyandevp@proton.me</a>.
        </p>
      </div>
    </main>
  );
}


export default function PrivacyWrapper(props) {
  return (
    <>
      <SEO title="Privacy Policy — ExpenseFlow" description="How ExpenseFlow collects, uses, and protects your data." />
      <Privacy {...props} />
    </>
  );
}
