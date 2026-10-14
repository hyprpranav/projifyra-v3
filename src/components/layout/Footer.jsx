import React from "react";
import { Link } from "react-router-dom";
import { Mail, MapPin } from "lucide-react";
import { CONTACT_EMAIL, COLLEGE_NAME, APP_NAME } from "../../config/appConfig";
import "./Footer.css";

const FOOTER_LINKS = {
  Platform: [
    { label: "Services", href: "/#services" },
    { label: "Projects", href: "/#projects" },
    { label: "How It Works", href: "/#how-it-works" },
    { label: "Reviews", href: "/#reviews" },
  ],
  Support: [
    { label: "About", href: "/#about" },
    { label: "Contact", href: "/#contact" },
    { label: "Get Started", href: "/register" },
  ],
  Account: [
    { label: "Login", href: "/login" },
    { label: "Create Account", href: "/register" },
    { label: "Apply as Officer", href: "/register-officer" },
  ],
};

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer" role="contentinfo">
      <div className="container footer-inner">
        {/* Brand Column */}
        <div className="footer-brand-col">
          <div className="footer-brand" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img src="/logo.png" alt="PROJIFYRA" style={{ width: "32px", height: "32px", objectFit: "contain", filter: "drop-shadow(0 2px 8px rgba(99,91,255,0.4))" }} />
            <span>{APP_NAME}</span>
          </div>
          <p className="footer-tagline">
            Projects. Guidance. Progress.
          </p>
          <p className="footer-description">
            Professional project development and academic support for engineering students.
          </p>
          <div className="footer-contact">
            <a href={`mailto:${CONTACT_EMAIL}`} className="footer-contact-item">
              <Mail size={14} />
              {CONTACT_EMAIL}
            </a>
            <div className="footer-contact-item">
              <MapPin size={14} />
              {COLLEGE_NAME}
            </div>
          </div>
        </div>

        {/* Links Columns */}
        {Object.entries(FOOTER_LINKS).map(([section, links]) => (
          <div key={section} className="footer-links-col">
            <h4 className="footer-col-heading">{section}</h4>
            <ul className="footer-links-list">
              {links.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="footer-link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <p className="footer-copyright">
            &copy; {year} {APP_NAME}. All rights reserved.
          </p>
          <p className="footer-note">
            Built for engineering students.
          </p>
        </div>
      </div>
    </footer>
  );
}
