import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Trees, ArrowLeft, AlertCircle } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="page-wrapper">
      <Navbar />

      <main className="notfound-container">
        <div className="notfound-card">
          <div className="notfound-icon-wrapper">
            <Trees size={56} className="notfound-icon" />
            <AlertCircle size={28} className="notfound-badge-icon" />
          </div>
          <h1>404</h1>
          <h2>Page Out of Range</h2>
          <p>
            The timber plot or page you are looking for has been cleared or moved. Let's get you back on the right path.
          </p>

          <div className="notfound-actions">
            <Link to="/" className="btn btn-primary btn-lg">
              <ArrowLeft size={18} /> Return to Home
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFound;
