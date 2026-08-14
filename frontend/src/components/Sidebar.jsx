import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
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
  FileText
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role || 'landowner';

  const handleLogout = () => {
    if (logout) logout();
    navigate('/login');
  };

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
        { path: '/landowner/marketplace', label: 'Timber Marketplace', icon: ShoppingBag },
      ]
    },
    {
      group: 'FINANCE',
      items: [
        { path: '#payments', label: 'Payments', icon: CreditCard },
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
      { path: '/contractor/jobs', label: 'Available Jobs', icon: Compass },
      { path: '/contractor/equipment', label: 'Fleet & Equipment', icon: Truck },
      { path: '/contractor/projects', label: 'Active Operations', icon: FileText },
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

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-role-badge">{role.toUpperCase()} PORTAL</span>
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
                      onClick={() => handleNavClick(item.path)}
                    >
                      <Icon size={18} className="sidebar-icon" />
                      <span>{item.label}</span>
                    </button>
                  );
                }
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `sidebar-item ${isActive ? 'active' : ''}`
                    }
                  >
                    <Icon size={18} className="sidebar-icon" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))
        ) : (
          <div className="sidebar-group">
            {(menuConfig[role] || []).map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `sidebar-item ${isActive ? 'active' : ''}`
                  }
                >
                  <Icon size={18} className="sidebar-icon" />
                  <span>{item.label}</span>
                </NavLink>
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
              {user?.title || (role === 'admin' ? 'Platform Administrator' : 'Forest Estate Owner')}
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
  );
};

export default Sidebar;
