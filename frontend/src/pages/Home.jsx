import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ForestParticles from '../components/ForestParticles';
import {
  Trees,
  Truck,
  ShoppingBag,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Award,
  Globe2,
  Building2,
  Handshake,
  Sparkles,
  TreePine
} from 'lucide-react';

const Home = () => {
  return (
    <div className="home-page">
      <Navbar />

      {/* Hero Section */}
      <section className="hero">
        {/* Topographic overlay & subtle floating forest particles */}
        <div className="hero-topo-bg" />
        <ForestParticles />

        <div className="hero-content">
          <div className="hero-badge">
            <ShieldCheck size={16} /> Verified Sustainable Timber Network
          </div>

          <h1 className="hero-title">
            Directly Connect Timber Landowners, Contractors & Buyers
          </h1>

          <p className="hero-subtitle">
            TreeConnect streamlines timber parcel valuations, harvesting contracts, and log marketplace transactions with transparent data and maximum yield.
          </p>

          <div className="hero-cta-group">
            <Link to="/register" className="btn btn-primary btn-lg">
              Join TreeConnect <ArrowRight size={18} />
            </Link>
          </div>

          {/* Unified Glassmorphism Statistics Card */}
          <div className="hero-stats-card">
            <div className="stat-item">
              <span className="stat-number-green">50,000+</span>
              <span className="stat-label-gray">Acres Managed</span>
            </div>

            <div className="stat-item">
              <span className="stat-number-green">$12.4M</span>
              <span className="stat-label-gray">Timber Traded</span>
            </div>

            <div className="stat-item">
              <span className="stat-number-green">98.5%</span>
              <span className="stat-label-gray">Contract Accuracy</span>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      {/* <section className="trust-section">
        <div className="trust-container">
          <h3 className="trust-title">Trusted By Sustainable Forestry Leaders & Enterprise Partners</h3>
          <div className="trust-logos-grid">
            <div className="trust-logo-card">
              <TreePine className="trust-logo-icon" />
              <span>FSC Certified</span>
            </div>
            <div className="trust-logo-card">
              <Award className="trust-logo-icon" />
              <span>PEFC Alliance</span>
            </div>
            <div className="trust-logo-card">
              <Building2 className="trust-logo-icon" />
              <span>Timber Buyers Association</span>
            </div>
            <div className="trust-logo-card">
              <Globe2 className="trust-logo-icon" />
              <span>Forestry Associations</span>
            </div>
            <div className="trust-logo-card">
              <Sparkles className="trust-logo-icon" />
              <span>Environmental Partners</span>
            </div>
          </div>
        </div>
      </section> */}

      {/* Solutions / Roles Section */}
      <section id="roles" className="roles-section">
        <div className="section-container">
          <h2 className="section-title">Designed for Every Stakeholder</h2>
          <p className="section-subtitle">Discover tailored toolsets built specifically for your role in the forestry ecosystem.</p>

          <div className="roles-grid">
            {/* Landowner */}
            <div className="role-card">
              <div className="role-card-header landowner-header">
                <Trees size={32} />
                <h3>Landowners</h3>
              </div>
              <p className="role-card-desc">
                List timber acreage, estimate harvest yields with built-in calculators, and receive competitive bids from certified contractors.
              </p>
              <ul className="role-features">
                <li><CheckCircle2 size={16} /> Automated yield calculations</li>
                <li><CheckCircle2 size={16} /> Multi-contractor bidding</li>
                <li><CheckCircle2 size={16} /> Land conservation tracking</li>
              </ul>
              <Link to="/register?role=landowner" className="role-btn">
                Register as Landowner <ArrowRight size={16} />
              </Link>
            </div>

            {/* Contractor */}
            <div className="role-card">
              <div className="role-card-header contractor-header">
                <Truck size={32} />
                <h3>Harvesting Contractors</h3>
              </div>
              <p className="role-card-desc">
                Bid on verified timber harvest jobs, schedule equipment fleets, and manage land access permissions seamlessly.
              </p>
              <ul className="role-features">
                <li><CheckCircle2 size={16} /> Verified harvest job listings</li>
                <li><CheckCircle2 size={16} /> Machinery fleet scheduler</li>
                <li><CheckCircle2 size={16} /> Direct buyer log deliveries</li>
              </ul>
              <Link to="/register?role=contractor" className="role-btn">
                Register as Contractor <ArrowRight size={16} />
              </Link>
            </div>

            {/* Buyer */}
            <div className="role-card">
              <div className="role-card-header buyer-header">
                <ShoppingBag size={32} />
                <h3>Timber Buyers</h3>
              </div>
              <p className="role-card-desc">
                Source high-quality timber species directly from managed forests with full FSC traceability and volume specs.
              </p>
              <ul className="role-features">
                <li><CheckCircle2 size={16} /> Species & grade filtering</li>
                <li><CheckCircle2 size={16} /> Direct mill procurement</li>
                <li><CheckCircle2 size={16} /> Supply chain auditing</li>
              </ul>
              <Link to="/register?role=buyer" className="role-btn">
                Register as Buyer <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
