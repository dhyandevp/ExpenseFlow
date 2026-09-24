import SEO from "../components/SEO";
import React from 'react';
import { Link } from "react-router-dom";

function CookiePolicy() {
  return (
    <main className="min-h-screen bg-background pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto bg-surface/70 backdrop-blur-md border border-border shadow-xl rounded-3xl p-8 md:p-12">
        <h1 className="text-primary font-bold text-3xl mb-2">Cookie Policy</h1>
        <p className="text-text-muted mb-8">Last Updated: September 2026</p>

        <p className="text-text-muted leading-relaxed mb-6">
          This Cookie Policy explains how ExpenseFlow uses cookies and similar technologies when you use our service.
        </p>

        <h2 className="text-foreground font-semibold text-xl mt-8 mb-4">1. What Are Cookies?</h2>
        <p className="text-text-muted leading-relaxed mb-4">
          Cookies are small text files stored on your device by your web browser. They are widely used to make websites work, maintain sessions, and remember preferences.
        </p>

        <h2 className="text-foreground font-semibold text-xl mt-8 mb-4">2. Cookies We Use</h2>
        <p className="text-text-muted leading-relaxed mb-3">ExpenseFlow uses only <strong>strictly essential cookies</strong>:</p>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm text-text-muted border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 font-semibold text-text-dark">Cookie</th>
                <th className="text-left py-2 pr-4 font-semibold text-text-dark">Provider</th>
                <th className="text-left py-2 pr-4 font-semibold text-text-dark">Purpose</th>
                <th className="text-left py-2 font-semibold text-text-dark">Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 font-mono text-xs">__clerk_*</td>
                <td className="py-2 pr-4">Clerk</td>
                <td className="py-2 pr-4">Authentication session management</td>
                <td className="py-2">Session / up to 7 days</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 font-mono text-xs">__cf_bm</td>
                <td className="py-2 pr-4">Cloudflare</td>
                <td className="py-2 pr-4">Bot detection and DDoS protection</td>
                <td className="py-2">30 minutes</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-text-muted leading-relaxed mb-4">
          These cookies are necessary for the application to function. Without them, you would not be able to sign in or use ExpenseFlow securely.
        </p>

        <h2 className="text-foreground font-semibold text-xl mt-8 mb-4">3. Cookies We Do NOT Use</h2>
        <ul className="list-disc pl-6 text-text-muted leading-relaxed space-y-2 mb-4">
          <li><strong>Analytics cookies</strong> — we do not use Google Analytics, Mixpanel, Amplitude, Hotjar, or any other analytics service.</li>
          <li><strong>Advertising cookies</strong> — we do not serve ads or use ad-tracking cookies.</li>
          <li><strong>Social media cookies</strong> — we do not embed social media widgets that set tracking cookies.</li>
          <li><strong>Third-party tracking</strong> — we do not allow any third party to track you through our site for advertising purposes.</li>
        </ul>

        <h2 className="text-foreground font-semibold text-xl mt-8 mb-4">4. Local Storage</h2>
        <p className="text-text-muted leading-relaxed mb-3">In addition to cookies, ExpenseFlow uses browser localStorage for:</p>
        <ul className="list-disc pl-6 text-text-muted leading-relaxed space-y-2 mb-4">
          <li><strong>Recent groups</strong> — remembering your recently accessed groups for quick switching.</li>
          <li><strong>Group data cache</strong> — temporarily caching your active group data for faster page loads.</li>
        </ul>
        <p className="text-text-muted leading-relaxed mb-4">
          localStorage data stays on your device and is never transmitted to our servers. You can clear it at any time via your browser settings.
        </p>

        <h2 className="text-foreground font-semibold text-xl mt-8 mb-4">5. Cookie Consent</h2>
        <p className="text-text-muted leading-relaxed mb-4">
          Because we use only strictly essential cookies that are necessary for the service to function, explicit cookie consent is not legally required under most privacy regulations (including GDPR Article 5(3) and India's DPDPA). We do not show a cookie consent banner because there is nothing optional to consent to. If we ever add non-essential cookies in the future, we will implement a consent mechanism before doing so.
        </p>

        <h2 className="text-foreground font-semibold text-xl mt-8 mb-4">6. How to Control Cookies</h2>
        <p className="text-text-muted leading-relaxed mb-4">
          You can control or delete cookies through your browser settings. Note that disabling essential cookies will prevent you from signing in to ExpenseFlow. Most browsers allow you to:
        </p>
        <ul className="list-disc pl-6 text-text-muted leading-relaxed space-y-2 mb-4">
          <li>View what cookies are stored.</li>
          <li>Delete all or specific cookies.</li>
          <li>Block cookies from specific or all sites.</li>
        </ul>

        <h2 className="text-foreground font-semibold text-xl mt-8 mb-4">7. Changes to This Policy</h2>
        <p className="text-text-muted leading-relaxed mb-4">
          If we change our cookie practices, we will update this page and the "Last Updated" date above.
        </p>

        <h2 className="text-foreground font-semibold text-xl mt-8 mb-4">8. Contact</h2>
        <p className="text-text-muted leading-relaxed">
          Questions? Email us at{" "}
          <a href="mailto:dhyandevp@proton.me" className="text-primary hover:underline">dhyandevp@proton.me</a>.
        </p>

        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-text-muted text-sm">
            See also: <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link> · <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link> · <Link to="/refund-policy" className="text-primary hover:underline">Refund Policy</Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function CookiePolicyWrapper(props) {
  return (
    <>
      <SEO title="Cookie Policy — ExpenseFlow" description="How ExpenseFlow uses cookies and local storage." />
      <CookiePolicy {...props} />
    </>
  );
}
