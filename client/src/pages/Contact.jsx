import SEO from "../components/SEO";
import React from 'react';
import { Mail, ExternalLink } from 'lucide-react';

function Contact() {
  return (
    <div className="container py-5 mt-5">
      <h1 className="mb-4">Contact Us</h1>
      <div className="card bg-dark text-light border-0 shadow-sm p-4 text-center">
        <div className="mb-4">
          <h4>Development Specialist</h4>
          <p className="text-muted">Built with precision for managing group finances effortlessly.</p>
        </div>
        
        <div className="d-flex flex-column align-items-center gap-3">
          <a href="mailto:dhyandevp@proton.me" className="btn btn-outline-success d-flex align-items-center gap-2">
            <Mail size={20} />
            dhyandevp@proton.me
          </a>
          
          <a 
            href="https://linktr.ee/DhyandevRTX" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn btn-primary d-flex align-items-center gap-2"
          >
            <ExternalLink size={20} />
            Developer Links
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
