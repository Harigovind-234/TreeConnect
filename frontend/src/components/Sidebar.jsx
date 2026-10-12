import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Trees,
  Package,
  Axe,
  Users,
  ShoppingBag,
  CreditCard,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  ShieldCheck,
  TrendingUp,
  Truck,
  Compass,
  FileText,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const role = user?.role || 'landowner';
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    setIsOpen(false);
    if (logout) logout();
    navigate('/login');
  };

  // Close drawer on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname, location.search]);

  // Support global custom events to open/toggle sidebar drawer
  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev);
    const handleClose = () => setIsOpen(false);
    window.addEventListener('treeconnect_toggle_sidebar', handleToggle);
    window.addEventListener('treeconnect_close_sidebar', handleClose);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('treeconnect_toggle_sidebar', handleToggle);
      window.removeEventListener('treeconnect_close_sidebar', handleClose);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Prevent background scrolling while mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Grouped Navigation for Landowner Enterprise View
  const landownerGroups = [
    {
      group: 'MAIN',
      items: [
        { path: '/landowner/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/landowner/properties', label: 'My Properties', icon: Trees },
        { path: '/landowner/inventory', label: 'Tree Inventory', icon: Package },
      ]
    },
    {
      group: 'OPERATIONS',
      items: [
        { path: '/landowner/harvest-requests', label: 'Harvest Requests', icon: Axe },
        { path: '/landowner/harvest-operations', label: 'Harvest Operations', icon: Truck },
        { path: '/landowner/marketplace', label: 'Timber Marketplace', icon: ShoppingBag },
      ]
    },
    {
      group: 'FINANCE',
      items: [
        { path: '/landowner/payments', label: 'Payments', icon: CreditCard },
        { path: '#reports', label: 'Reports', icon: BarChart3 },
      ]
    },
    {
      group: 'ACCOUNT',
      items: [
        { path: '#notifications', label: 'Notifications', icon: Bell },
        { path: '#settings', label: 'Settings', icon: Settings },
      ]
    }
  ];

  // Admin Navigation Configuration
  const adminGroups = [
    {
      group: 'OVERVIEW',
      items: [
        { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard }
      ]
    },
    {
      group: 'USERS & COMPLIANCE',
      items: [
        { path: '/admin/users', label: 'All Users', icon: Users },
        { path: '/admin/users?role=contractor', label: 'Contractor Verification', icon: ShieldCheck },
        { path: '/admin/properties', label: 'Property Registrations', icon: Trees }
      ]
    },
    {
      group: 'OPERATIONS & MARKET',
      items: [
        { path: '/admin/dashboard#harvests', label: 'Harvest Operations', icon: Truck },
        { path: '/admin/dashboard#marketplace', label: 'Timber Marketplace', icon: ShoppingBag },
        { path: '/admin/dashboard#transactions', label: 'Payments & Escrow', icon: CreditCard }
      ]
    },
    {
      group: 'SYSTEM & REPORTS',
      items: [
        { path: '/admin/dashboard#reports', label: 'Reports & Analytics', icon: BarChart3 },
        { path: '/admin/dashboard#alerts', label: 'System Alerts', icon: Bell },
        { path: '/admin/dashboard#settings', label: 'Platform Settings', icon: Settings }
      ]
    }
  ];

  // Default menu configuration for other roles
  const menuConfig = {
    contractor: [
      { path: '/contractor/dashboard', label: 'Contractor Hub', icon: LayoutDashboard },
      { path: '/contractor/assigned-jobs', label: 'Assigned Jobs', icon: Axe },
      { path: '/contractor/harvest-operations', label: 'Harvest Operations', icon: Truck },
      { path: '/contractor/equipment', label: 'Fleet & Equipment', icon: Truck },
      { path: '/contractor/payments', label: 'Payment Details', icon: CreditCard },
    ],
    buyer: [
      { path: '/buyer/dashboard', label: 'Procurement Hub', icon: ShoppingBag },
      { path: '/buyer/marketplace', label: 'Timber Marketplace', icon: ShoppingBag },
      { path: '/buyer/orders', label: 'Purchase Orders', icon: FileText },
      { path: '/buyer/analytics', label: 'Market Trends', icon: TrendingUp },
    ]
  };

  const handleNavClick = (path) => {
    if (path.includes('#')) {
      const [basePath, hash] = path.split('#');
      if (location.pathname !== basePath) {
        navigate(path);
      } else {
        const el = document.getElementById(hash);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  };

  const checkIsActive = (itemPath) => {
    const currentPath = location.pathname;
    const currentSearch = location.search;
    const currentFull = currentPath + currentSearch;

    if (itemPath.includes('?')) {
      return currentSearch.includes('role=contractor') || currentFull === itemPath;
    } else {
      if (currentSearch && currentSearch.includes('role=contractor')) {
        return false;
      }
      return currentPath === itemPath || (currentPath.startsWith(itemPath + '/') && !currentSearch);
    }
  };

  // Determine current active item title for mobile header display
  const allNavItems = role === 'landowner'
    ? landownerGroups.flatMap((g) => g.items)
    : role === 'admin'
    ? adminGroups.flatMap((g) => g.items)
    : (menuConfig[role] || []);
  const currentActive = allNavItems.find((item) => checkIsActive(item.path));
  const currentTitle = currentActive?.label || 'Portal Navigation';

  return (
    <>
      {/* 1. Mobile Sticky Portal Bar Trigger (Visible only on screens < 1024px) */}
      <div className="sidebar-mobile-bar">
        <button
          type="button"
          className="sidebar-mobile-toggle-btn"
          onClick={() => setIsOpen(true)}
          aria-label="Open portal navigation drawer"
        >
          <Menu size={17} />
          <span>{role.toUpperCase()} MENU</span>
        </button>

        <div className="sidebar-mobile-active-info">
          <span className="sidebar-mobile-indicator" />
          <span className="sidebar-mobile-title">{currentTitle}</span>
        </div>
      </div>

      {/* 2. Mobile Backdrop Overlay */}
      <div
        className={`sidebar-backdrop ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* 3. Aside Drawer Container */}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="flex items-center justify-between w-full">
            <span className="sidebar-role-badge">{role.toUpperCase()} PORTAL</span>
            <button
              type="button"
              className="sidebar-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Close portal navigation drawer"
              title="Close Menu"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <nav className="sidebar-nav">
          {role === 'landowner' || role === 'admin' ? (
            (role === 'landowner' ? landownerGroups : adminGroups).map((group) => (
              <div key={group.group} className="sidebar-group">
                <span className="sidebar-group-title">{group.group}</span>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isHash = item.path.includes('#');
                  if (isHash) {
                    return (
                      <button
                        key={item.label}
                        className="sidebar-item sidebar-item-btn cursor-pointer"
                        onClick={() => {
                          setIsOpen(false);
                          handleNavClick(item.path);
                        }}
                      >
                        <Icon size={18} className="sidebar-icon" />
                        <span>{item.label}</span>
                      </button>
                    );
                  }
                  const isActive = checkIsActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className={`sidebar-item ${isActive ? 'active' : ''}`}
                    >
                      <Icon size={18} className="sidebar-icon" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            ))
          ) : (
            <div className="sidebar-group">
              {(menuConfig[role] || []).map((item) => {
                const Icon = item.icon;
                const isActive = checkIsActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`sidebar-item ${isActive ? 'active' : ''}`}
                  >
                    <Icon size={18} className="sidebar-icon" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user-card">
            <img
              src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=tree'}
              alt={user?.name || 'User'}
              className="sidebar-avatar"
            />
            <div className="sidebar-user-details">
              <span className="sidebar-user-name">
                {user?.name || (role === 'admin' ? 'TreeConnect Admin' : 'Harigovind D Nair')}
              </span>
              <span className="sidebar-user-role">
                {user?.title || (role === 'admin' ? 'Platform Administrator' : role === 'contractor' ? 'Verified Contractor' : role === 'buyer' ? 'Timber Buyer' : 'Forest Estate Owner')}
              </span>
            </div>
            <button
              className="sidebar-logout-btn"
              onClick={handleLogout}
              title="Log Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
