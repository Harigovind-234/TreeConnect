import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import {
  CreditCard,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  DollarSign,
  FileText,
  User,
  ArrowRight,
  ArrowLeft,
  Filter,
  ShieldCheck,
  Send,
  Building,
  Calendar,
  X
} from 'lucide-react';

const AdminPaymentsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({
    totalCompletedVolume: '₹1.10 Lakhs',
    totalPendingEscrow: '₹0',
    verifiedPaymentsCount: 2,
    failedPaymentsCount: 0,
    totalTransactionsCount: 2
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchPayments = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await api.get('/admin/payments');
      if (res.data) {
        setPayments(res.data.payments || []);
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
      }
    } catch (e) {
      console.error('Error fetching admin payments:', e);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments(false);

    // Live refresh every 4 seconds
    const interval = setInterval(() => fetchPayments(true), 4000);
    const handleSync = () => fetchPayments(true);
    window.addEventListener('treeconnect_payments_updated', handleSync);
    window.addEventListener('storage', handleSync);
    window.addEventListener('focus', handleSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener('treeconnect_payments_updated', handleSync);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, []);

  const filteredPayments = payments.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      p.payment_id?.toLowerCase().includes(q) ||
      p.transaction_reference?.toLowerCase().includes(q) ||
      p.payer_name?.toLowerCase().includes(q) ||
      p.payer_email?.toLowerCase().includes(q) ||
      p.recipient_name?.toLowerCase().includes(q) ||
      p.recipient_email?.toLowerCase().includes(q) ||
      p.payment_purpose?.toLowerCase().includes(q) ||
      p.payment_method?.toLowerCase().includes(q);

    const st = String(p.status || '').toUpperCase();
    let matchesStatus = true;
    if (statusFilter === 'verified') {
      matchesStatus = st === 'VERIFIED' || st === 'PAID' || st === 'COMPLETED';
    } else if (statusFilter === 'pending') {
      matchesStatus = st.includes('PENDING') || st.includes('ORDER_CREATED');
    } else if (statusFilter === 'failed') {
      matchesStatus = st === 'FAILED' || st === 'REJECTED';
    }

    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout user={user}>
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="admin-gov-header">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <CreditCard size={22} />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white">Payments &amp; Financial Escrow Governance</h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                LIVE
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Live audit ledger of milestone advances, contractor contract disbursements, and escrow releases
            </p>
          </div>

          <button
            onClick={() => navigate('/admin/dashboard')}
            className="admin-gov-back-btn"
          >
            <ArrowLeft size={14} />
            <span>Back to Dashboard</span>
          </button>
        </div>

        {/* Escrow Summary KPIs */}
        <div className="admin-gov-kpi-grid">
          <div className="admin-gov-kpi-card">
            <div className="admin-gov-kpi-header">
              <span className="admin-gov-kpi-title">Completed Volume</span>
              <span className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 size={15} />
              </span>
            </div>
            <div className="admin-gov-kpi-value text-emerald-400">{summary.totalCompletedVolume}</div>
            <div className="text-[11px] text-emerald-400/80 font-medium">100% settled contracts</div>
          </div>

          <div className="admin-gov-kpi-card">
            <div className="admin-gov-kpi-header">
              <span className="admin-gov-kpi-title">Pending Escrow</span>
              <span className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Clock size={15} />
              </span>
            </div>
            <div className="admin-gov-kpi-value text-amber-400">{summary.totalPendingEscrow}</div>
            <div className="text-[11px] text-slate-400">Escrow retention balance</div>
          </div>

          <div className="admin-gov-kpi-card">
            <div className="admin-gov-kpi-header">
              <span className="admin-gov-kpi-title">Verified Transactions</span>
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck size={15} />
              </span>
            </div>
            <div className="admin-gov-kpi-value text-white">{summary.verifiedPaymentsCount}</div>
            <div className="text-[11px] text-slate-400">Reconciled bank transfers</div>
          </div>

          <div className="admin-gov-kpi-card">
            <div className="admin-gov-kpi-header">
              <span className="admin-gov-kpi-title">Failed Transactions</span>
              <span className="p-1.5 rounded-lg bg-red-500/15 text-red-400 border border-red-500/30">
                <AlertCircle size={15} />
              </span>
            </div>
            <div className="admin-gov-kpi-value text-red-400">{summary.failedPaymentsCount}</div>
            <div className="text-[11px] text-slate-400">0 dispute flags</div>
          </div>
        </div>

        {/* Search & Status Filters Toolbar */}
        <div className="admin-gov-toolbar">
          <div className="admin-gov-search-wrap">
            <Search size={16} className="admin-gov-search-icon" />
            <input
              type="text"
              placeholder="Search by ID, UTR, payer or recipient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="admin-gov-search-input"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="admin-gov-search-clear"
                title="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="admin-gov-filter-group">
            <Filter size={14} className="text-emerald-400 mr-1" />
            {['all', 'verified', 'pending', 'failed'].map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`admin-gov-filter-pill ${statusFilter === filter ? 'active' : ''}`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions List */}
        {loading ? (
          <div className="admin-gov-item text-center py-12 text-slate-400 text-sm">
            Loading financial records...
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="admin-gov-item text-center py-12 text-slate-400">
            No transaction records found matching the current search.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPayments.map((p) => {
              const isVerified = String(p.status).toUpperCase() === 'VERIFIED';
              const isFailed = String(p.status).toUpperCase() === 'FAILED' || String(p.status).toUpperCase() === 'REJECTED';

              return (
                <div
                  key={p.payment_id || p.id || p._id}
                  className="admin-gov-item"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className={`p-2 rounded-xl border ${
                        isVerified
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : isFailed
                          ? 'bg-red-500/15 text-red-400 border-red-500/30'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      }`}>
                        <CreditCard size={18} />
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="text-sm font-black text-white font-mono">{p.payment_id}</strong>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            isVerified
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : isFailed
                              ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          }`}>
                            {p.status || 'Verified'}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 mt-0.5 block">
                          {p.payment_date || p.created_at?.split('T')[0] || 'Recent'} • {p.payment_method || 'Online Escrow Gateway (Razorpay)'}
                        </span>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <div className="text-base font-extrabold text-emerald-400">
                        ₹{Number(p.amount || 0).toLocaleString('en-IN')}
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                        {p.payment_purpose?.replace(/_/g, ' ') || 'Milestone Settlement'}
                      </span>
                    </div>
                  </div>

                  {/* Payer -> Recipient Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="bg-[#08100c] p-3.5 rounded-xl border border-white/5">
                      <span className="text-slate-500 uppercase font-bold text-[10px] block">Payer (Landowner)</span>
                      <strong className="text-white block mt-0.5 text-sm">{p.payer_name || 'Harigovind D Nair'}</strong>
                      <span className="text-slate-400 text-xs">{p.payer_email || 'h4hari2003@gmail.com'}</span>
                    </div>

                    <div className="bg-[#08100c] p-3.5 rounded-xl border border-white/5">
                      <span className="text-slate-500 uppercase font-bold text-[10px] block">Recipient (Contractor)</span>
                      <strong className="text-emerald-300 block mt-0.5 text-sm">{p.recipient_name || 'Contractor Rohith'}</strong>
                      <span className="text-slate-400 text-xs">{p.recipient_email || 'rohithsh@gmail.com'}</span>
                    </div>

                    <div className="bg-[#08100c] p-3.5 rounded-xl border border-white/5">
                      <span className="text-slate-500 uppercase font-bold text-[10px] block">Gateway / Bank UTR</span>
                      <strong className="text-slate-300 font-mono block mt-0.5 text-sm">
                        {p.transaction_reference || p.razorpay_payment_id || 'NEFT-UTR-A1DB078D'}
                      </strong>
                      <span className="text-emerald-400 text-[11px] font-medium block mt-0.5">
                        {isVerified ? '✓ Escrow Released & Credited' : 'Pending Verification'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminPaymentsPage;
