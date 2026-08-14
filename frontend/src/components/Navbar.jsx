import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Trees, LogOut, User, Menu, X, Shield, ChevronDown } from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/login');
  };

  const getDashboardPath = (role) => {
    switch (role) {
      case 'admin':
        return '/admin/dashboard';
      case 'landowner':
        return '/landowner/dashboard';
      case 'contractor':
        return '/contractor/dashboard';
      case 'buyer':
        return '/buyer/dashboard';
      default:
        return '/';
    }
  };

  const roleColors = {
    admin: 'badge-admin',
    landowner: 'badge-landowner',
    contractor: 'badge-contractor',
    buyer: 'badge-buyer'
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <div className="brand-icon-wrapper">
            <Trees className="brand-icon" size={24} />
          </div>
          <span className="brand-text">Tree<span className="brand-highlight">Connect</span></span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="desktop-nav">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            Home
          </Link>
          
          {isAuthenticated && (
            <Link 
              to={getDashboardPath(user?.role)} 
              className={`nav-link ${location.pathname.includes('/dashboard') ? 'active' : ''}`}
            >
              Dashboard
            </Link>
          )}
        </nav>

        {/* User Actions */}
        <div className="navbar-actions">
          {isAuthenticated ? (
            <div className="user-menu-relative">
              <button 
                className="user-profile-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <img 
                  src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=treeconnect'} 
                  alt={user?.name} 
                  className="user-avatar" 
                />
                <div className="user-info-text">
                  <span className="user-name">{user?.name}</span>
                  <span className={`role-badge ${roleColors[user?.role] || ''}`}>
                    {user?.role?.toUpperCase()}
                  </span>
                </div>
                <ChevronDown size={16} className={`chevron ${dropdownOpen ? 'open' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="profile-dropdown">
                  <div className="dropdown-header">
                    <p className="dropdown-user-name">{user?.name}</p>
                    <p className="dropdown-user-email">{user?.email}</p>
                  </div>
                  <hr className="dropdown-divider" />
                  <Link 
                    to={getDashboardPath(user?.role)} 
                    className="dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Shield size={16} /> My Dashboard
                  </Link>
                  <button className="dropdown-item logout-item" onClick={handleLogout}>
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-outline">Sign In</Link>
              <Link to="/register" className="btn btn-primary">Get Started</Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button 
            className="mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="mobile-menu">
          <Link to="/" onClick={() => setMobileMenuOpen(false)}>Home</Link>
          {isAuthenticated ? (
            <>
              <Link to={getDashboardPath(user?.role)} onClick={() => setMobileMenuOpen(false)}>
                Dashboard ({user?.role})
              </Link>
              <button onClick={handleLogout} className="mobile-logout">
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
