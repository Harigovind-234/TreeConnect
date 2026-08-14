import React from 'react';
import { Trees, Shield, Compass, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand-section">
          <div className="footer-logo">
            <Trees className="brand-icon" size={24} />
            <span className="brand-text">Tree<span className="brand-highlight">Connect</span></span>
          </div>
          <p className="footer-description">
            Connecting Landowners, Harvesting Contractors, and Timber Buyers in a unified, sustainable marketplace.
          </p>
        </div>

        <div className="footer-links-grid">
          <div className="footer-col">
            <h4>Platform</h4>
            <Link to="/">Home</Link>
            <Link to="/login">Sign In</Link>
            <Link to="/register">Register</Link>
          </div>
          <div className="footer-col">
            <h4>Stakeholders</h4>
            <Link to="/register">Landowners</Link>
            <Link to="/register">Contractors</Link>
            <Link to="/register">Timber Buyers</Link>
          </div>
          <div className="footer-col">
            <h4>Legal & Sustainability</h4>
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
            <a href="#compliance">FSC Compliance</a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} TreeConnect Inc. Built for sustainable forestry management.</p>
      </div>
    </footer>
  );
};

export default Footer;
