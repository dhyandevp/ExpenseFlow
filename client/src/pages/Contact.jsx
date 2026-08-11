import SEO from "../components/SEO";
import React from 'react';
import { Mail, ExternalLink } from 'lucide-react';

function Contact() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-primary font-bold text-3xl mb-2 text-center">Contact Us</h1>
        <p className="text-text-muted text-center mb-12">Built with precision for managing group finances effortlessly.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Email */}
          <a 
            href="mailto:dhyandevp@proton.me"
            className="flex flex-col items-center justify-center p-8 bg-white/70 backdrop-blur-md border border-white/60 shadow-xl shadow-[#105D5E]/5 rounded-3xl hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 text-center group"
          >
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Mail size={32} className="text-primary" />
            </div>
            <h4 className="text-foreground font-semibold text-xl mb-2">Email Support</h4>
            <p className="text-text-muted mb-6">Drop us a line anytime. We usually reply within 24 hours.</p>
            <span className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-medium shadow-md shadow-primary/20">
              dhyandevp@proton.me
            </span>
          </a>

          {/* Card 2: Developer Links */}
          <a 
            href="https://linktr.ee/DhyandevRTX"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center p-8 bg-white/70 backdrop-blur-md border border-white/60 shadow-xl shadow-[#105D5E]/5 rounded-3xl hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 text-center group"
          >
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ExternalLink size={32} className="text-primary" />
            </div>
            <h4 className="text-foreground font-semibold text-xl mb-2">Developer Links</h4>
            <p className="text-text-muted mb-6">Check out more projects, repositories, and social links.</p>
            <span className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-medium shadow-md shadow-primary/20">
              Visit Linktree
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}


export default function ContactWrapper(props) {
  return (
    <>
      <SEO title="Contact" />
      <Contact {...props} />
    </>
  );
}
