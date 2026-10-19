import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Trees, LogOut, User, Menu, X, Shield, ChevronDown } from 'lucide-react';
import NotificationBell from './NotificationBell';

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

  // Only show notification badges inside appropriate dashboards
  const isInsideAppropriateDashboard = () => {
    if (!isAuthenticated || !user?.role) return false;
    const role = user.role.toLowerCase();
    const path = location.pathname.toLowerCase();

    // Strictly visible only when inside the user's role-specific dashboard area
    return path.startsWith(`/${role}`);
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
        <div className="navbar-actions flex items-center gap-2 sm:gap-3">
          {isInsideAppropriateDashboard() && (
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('treeconnect_toggle_sidebar'))}
              className="mobile-portal-nav-btn"
              title="Toggle Portal Navigation Drawer"
              aria-label="Toggle Portal Navigation Drawer"
            >
              <Menu size={16} />
              <span className="mobile-portal-nav-text">{user?.role?.toUpperCase()}</span>
            </button>
          )}

          {isInsideAppropriateDashboard() && (
            <NotificationBell dropdownAlign="right" />
          )}

          {isAuthenticated ? (
            <div className="user-menu-relative relative">
              {(() => {
                const isBuyerUser = user?.role === 'buyer' || user?.email === 'arunbuyer@gmail.com';
                const effectiveName = user?.contactPerson || (user?.name && user?.name !== 'timberbuyers' ? user?.name : (isBuyerUser ? 'Arun K' : user?.name)) || (user?.role === 'admin' ? 'TreeConnect Admin' : 'TreeConnect Member');
                const initials = effectiveName.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase() || (isBuyerUser ? 'AK' : 'TC');
                const company = user?.companyName || (isBuyerUser ? 'timberbuyers' : '');
                return (
                  <>
                    <button 
                      className="user-profile-btn"
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                    >
                      {user?.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={effectiveName} 
                          className="user-avatar" 
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {initials}
                        </div>
                      )}
                      <div className="user-info-text">
                        <span className="user-name">{effectiveName}</span>
                        <span className={`role-badge ${roleColors[user?.role] || ''}`}>
                          {user?.role?.toUpperCase()}
                        </span>
                      </div>
                      <ChevronDown size={16} className={`chevron ${dropdownOpen ? 'open' : ''}`} />
                    </button>

                    {dropdownOpen && (
                      <div className="profile-dropdown">
                        <div className="dropdown-header">
                          <p className="dropdown-user-name">{effectiveName}</p>
                          {company && company !== effectiveName && (
                            <p className="text-[11px] text-emerald-400 font-semibold">{company}</p>
                          )}
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
                  <Link 
                    to="/profile" 
                    className="dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <User size={16} /> My Profile
                  </Link>
                  <button className="dropdown-item logout-item" onClick={handleLogout}>
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              )}
            </>
          );
        })()}
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
              {isInsideAppropriateDashboard() && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    window.dispatchEvent(new CustomEvent('treeconnect_toggle_sidebar'));
                  }}
                  className="mobile-portal-action-link"
                >
                  ☰ Open {user?.role ? user.role.toUpperCase() : 'PORTAL'} Navigation
                </button>
              )}
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
