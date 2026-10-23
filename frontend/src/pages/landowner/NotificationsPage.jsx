import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useNotifications } from '../../hooks/useNotifications';
import './LandownerDashboard.css';
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock,
  FileCheck,
  CreditCard,
  Truck,
  IndianRupee,
  Search,
  X,
  ExternalLink,
  AlertCircle,
  Filter,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Trash2
} from 'lucide-react';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    readIds,
    loading,
    markAsRead,
    markAllAsRead,
    clearAll
  } = useNotifications();

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread' | 'agreements' | 'payments' | 'operations'
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNotifications = notifications.filter(notif => {
    const isUnread = !readIds.includes(notif.id);

    // Tab filter
    if (activeTab === 'unread' && !isUnread) return false;
    if (activeTab === 'agreements' && notif.category !== 'agreements') return false;
    if (activeTab === 'payments' && notif.category !== 'payments') return false;
    if (activeTab === 'operations' && notif.category !== 'operations') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const mTitle = String(notif.title || '').toLowerCase().includes(q);
      const mText = String(notif.text || '').toLowerCase().includes(q);
      if (!mTitle && !mText) return false;
    }

    return true;
  });

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'agreement':
        return <FileCheck size={18} className="text-[#34d399]" />;
      case 'payment_pending':
        return <IndianRupee size={18} className="text-[#fbbf24]" />;
      case 'payment_verified':
        return <CheckCircle2 size={18} className="text-[#34d399]" />;
      case 'progress':
      case 'stage_complete':
        return <Truck size={18} className="text-[#60a5fa]" />;
      case 'inspection':
        return <ShieldCheck size={18} className="text-[#34d399]" />;
      default:
        return <Bell size={18} className="text-[#34d399]" />;
    }
  };

  const handleActionClick = (notif) => {
    markAsRead(notif.id);
    if (notif.actionPath) {
      navigate(notif.actionPath);
    }
  };

  return (
    <div className="landowner-dashboard-page">
      <Navbar />
      <div className="landowner-dashboard-container">
        <Sidebar />

        <div className="landowner-dashboard-workspace">
          <div className="lopay-container">

            {/* 1. Hero Header Banner */}
            <section className="lopay-hero-card">
              <div className="lopay-hero-left">
                <div className="lopay-hero-badge">
                  <span className="lopay-pulse-dot"></span>
                  Real-Time Activity Feed
                </div>
                <h1 className="lopay-hero-heading">Notifications & Updates</h1>
                <p className="lopay-hero-subtext">
                  Stay updated on harvest agreements, contractor milestones, advance disbursements, and timber inspections.
                </p>
              </div>

              <div className="lopay-hero-actions">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="lopay-btn-primary"
                  >
                    <CheckCheck size={16} />
                    <span>Mark All Read ({unreadCount})</span>
                  </button>
                )}
                <button
                  onClick={() => navigate('/landowner/harvest-agreements')}
                  className="lopay-btn-secondary"
                >
                  <FileCheck size={15} />
                  <span>Harvest Agreements</span>
                </button>
              </div>
            </section>

            {/* 2. Filter & Controls Bar */}
            <section className="lopay-controls-card">
              <div className="lopay-controls-row">
                <div className="lopay-search-wrap">
                  <Search size={16} className="lopay-search-icon" />
                  <input
                    type="text"
                    placeholder="Search updates by keyword..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="lopay-search-input"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="lopay-search-clear"
                      title="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`lopay-pill-btn ${activeTab === 'all' ? 'active' : ''}`}
                  >
                    All ({notifications.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('unread')}
                    className={`lopay-pill-btn ${activeTab === 'unread' ? 'active' : ''}`}
                  >
                    Unread ({unreadCount})
                  </button>
                  <button
                    onClick={() => setActiveTab('agreements')}
                    className={`lopay-pill-btn ${activeTab === 'agreements' ? 'active' : ''}`}
                  >
                    Agreements
                  </button>
                  <button
                    onClick={() => setActiveTab('payments')}
                    className={`lopay-pill-btn ${activeTab === 'payments' ? 'active' : ''}`}
                  >
                    Payments
                  </button>
                  <button
                    onClick={() => setActiveTab('operations')}
                    className={`lopay-pill-btn ${activeTab === 'operations' ? 'active' : ''}`}
                  >
                    Operations
                  </button>
                </div>
              </div>

              {(searchQuery || activeTab !== 'all') && (
                <div className="flex items-center justify-between text-xs pt-2 border-t border-[#10b981]/10 text-[#9ca3af]">
                  <span>
                    Showing <strong className="text-[#34d399]">{filteredNotifications.length}</strong> of <strong>{notifications.length}</strong> alerts
                  </span>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setActiveTab('all');
                    }}
                    className="text-[#34d399] hover:underline font-bold"
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </section>

            {/* 3. Notifications Feed List */}
            <section className="flex flex-col gap-3">
              {filteredNotifications.length === 0 ? (
                <div className="lopay-empty-card">
                  <div className="lopay-empty-icon">
                    <Bell size={28} />
                  </div>
                  <div className="flex flex-col gap-1 text-center">
                    <p className="text-base font-bold text-white">No notifications to display.</p>
                    <p className="text-xs text-[#9ca3af]">
                      {activeTab === 'unread' 
                        ? "You're all caught up! There are no unread notifications right now."
                        : "Updates on harvest agreements, stage milestones, and payments will appear here."}
                    </p>
                  </div>
                  {activeTab !== 'all' && (
                    <button
                      onClick={() => setActiveTab('all')}
                      className="lopay-btn-secondary text-xs"
                    >
                      Show All Notifications
                    </button>
                  )}
                </div>
              ) : (
                filteredNotifications.map(notif => {
                  const isUnread = !readIds.includes(notif.id);
                  return (
                    <div
                      key={notif.id}
                      onClick={() => markAsRead(notif.id)}
                      className={`relative bg-gradient-to-r from-[#0e1d15] to-[#08120d] border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-200 cursor-pointer ${
                        isUnread
                          ? 'border-[#10b981]/40 shadow-lg shadow-[#10b981]/5'
                          : 'border-[#1b3826]/60 opacity-85 hover:opacity-100 hover:border-[#10b981]/30'
                      }`}
                    >
                      {/* Left Side: Unread Dot, Icon & Text */}
                      <div className="flex items-start gap-3.5">
                        <div className="relative mt-0.5">
                          <div className="w-10 h-10 rounded-xl bg-[#12281c] border border-[#1b432a] flex items-center justify-center shrink-0">
                            {getNotificationIcon(notif.type)}
                          </div>
                          {isUnread && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#10b981] rounded-full border-2 border-[#0e1d15]" />
                          )}
                        </div>

                        <div className="flex flex-col gap-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm sm:text-base font-bold text-white">
                              {notif.title}
                            </h4>
                            {notif.badge && (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                                notif.badgeVariant === 'amber'
                                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                  : notif.badgeVariant === 'cyan'
                                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              }`}>
                                {notif.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#9ca3af] leading-relaxed max-w-2xl">
                            {notif.text}
                          </p>
                          <span className="text-[11px] text-[#6b7280] font-medium flex items-center gap-1 mt-0.5">
                            <Clock size={11} />
                            {notif.time}
                          </span>
                        </div>
                      </div>

                      {/* Right Action Button */}
                      {notif.actionLabel && (
                        <div className="sm:self-center shrink-0 pt-2 sm:pt-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleActionClick(notif);
                            }}
                            className="lopay-btn-primary text-xs w-full sm:w-auto justify-center"
                          >
                            <span>{notif.actionLabel}</span>
                            <ArrowRight size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </section>

          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
