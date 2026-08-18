import React, { useState, useEffect } from 'react';
import { Users, ArrowRight, Trees, Truck, ShoppingBag, Loader2, Database } from 'lucide-react';
import api from '../../services/api';

const UserSummary = ({ onManageUsers }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        setLoading(true);
        const res = await api.get('/admin/users');
        if (res.data && Array.isArray(res.data.users)) {
          // Filter out admin users to focus on platform ecosystem stakeholders
          const dbUsers = res.data.users.filter((u) => u.role !== 'admin');
          setUsers(dbUsers);
        } else {
          setUsers([]);
        }
      } catch (err) {
        console.error('Error fetching live user summary:', err);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, []);

  const totalUsers = users.length;
  const landownersCount = users.filter((u) => u.role === 'landowner').length;
  const contractorsCount = users.filter((u) => u.role === 'contractor').length;
  const buyersCount = users.filter((u) => u.role === 'buyer').length;

  const handleCardClick = (role) => {
    if (!onManageUsers) return;
    if (role === 'all') {
      onManageUsers('/admin/users');
    } else {
      onManageUsers(`/admin/users?role=${role}`);
    }
  };

  return (
    <section className="admin-card space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 flex items-center justify-center">
              <Users size={18} />
            </span>
            <span>User Management</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Live directory overview of registered landowners, contractors, and timber buyers
          </p>
        </div>

        <div className="flex items-center gap-3 self-end md:self-center pt-1 md:pt-0">
          <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#0e1612] border border-emerald-500/20 text-emerald-400 flex items-center gap-2">
            {loading ? (
              <>
                <Loader2 size={13} className="animate-spin" /> Querying Database...
              </>
            ) : (
              <>
                <Database size={13} /> Live Database
              </>
            )}
          </span>

          <button
            className="admin-btn-outline text-xs py-1.5 px-3.5"
            onClick={() => handleCardClick('all')}
          >
            <span>View All Users</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* 4 Metric Cards Grid using standard kpi-card design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
        {/* Total Users KPI Card */}
        <div
          className="kpi-card cursor-pointer hover:border-emerald-500/50 transition-all p-4"
          onClick={() => handleCardClick('all')}
          title="Click to view all registered users"
        >
          <div className="kpi-card-header mb-2 flex justify-between items-center">
            <span className="kpi-icon-box icon-emerald">
              <Users size={18} />
            </span>
          </div>
          <div className="kpi-card-body">
            <div className="kpi-value text-2xl sm:text-3xl font-black text-white">
              {loading ? <Loader2 size={20} className="animate-spin text-emerald-400" /> : totalUsers}
            </div>
            <div className="kpi-label text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
              Total Users
            </div>
            <div className="text-[11px] font-semibold text-emerald-400 mt-1">
              Live DB Total Stakeholders
            </div>
          </div>
        </div>

        {/* Landowners Card */}
        <div
          className="kpi-card cursor-pointer hover:border-emerald-500/50 transition-all p-4"
          onClick={() => handleCardClick('landowner')}
          title="Click to filter Landowners"
        >
          <div className="kpi-card-header mb-2 flex justify-between items-center">
            <span className="kpi-icon-box icon-forest">
              <Trees size={18} />
            </span>
          </div>
          <div className="kpi-card-body">
            <div className="kpi-value text-2xl sm:text-3xl font-black text-emerald-400">
              {loading ? <Loader2 size={20} className="animate-spin text-emerald-400" /> : landownersCount}
            </div>
            <div className="kpi-label text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
              Landowners
            </div>
            <div className="text-[11px] font-semibold text-slate-400 mt-1">
              Registered Forest Owners
            </div>
          </div>
        </div>

        {/* Contractors Card */}
        <div
          className="kpi-card cursor-pointer hover:border-amber-500/50 transition-all p-4"
          onClick={() => handleCardClick('contractor')}
          title="Click to filter Contractors"
        >
          <div className="kpi-card-header mb-2 flex justify-between items-center">
            <span className="kpi-icon-box icon-amber">
              <Truck size={18} />
            </span>
          </div>
          <div className="kpi-card-body">
            <div className="kpi-value text-2xl sm:text-3xl font-black text-amber-400">
              {loading ? <Loader2 size={20} className="animate-spin text-amber-400" /> : contractorsCount}
            </div>
            <div className="kpi-label text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
              Contractors
            </div>
            <div className="text-[11px] font-semibold text-slate-400 mt-1">
              Harvesting & Fleet Providers
            </div>
          </div>
        </div>

        {/* Buyers Card */}
        <div
          className="kpi-card cursor-pointer hover:border-blue-500/50 transition-all p-4"
          onClick={() => handleCardClick('buyer')}
          title="Click to filter Buyers"
        >
          <div className="kpi-card-header mb-2 flex justify-between items-center">
            <span className="kpi-icon-box icon-blue">
              <ShoppingBag size={18} />
            </span>
          </div>
          <div className="kpi-card-body">
            <div className="kpi-value text-2xl sm:text-3xl font-black text-blue-400">
              {loading ? <Loader2 size={20} className="animate-spin text-blue-400" /> : buyersCount}
            </div>
            <div className="kpi-label text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
              Buyers
            </div>
            <div className="text-[11px] font-semibold text-slate-400 mt-1">
              Timber Mills & Buyers
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UserSummary;
