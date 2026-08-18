import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Activity } from 'lucide-react';

const AdminHeader = () => {
  const { user } = useAuth();
  const displayName = user?.name ? user.name : 'Administrator';

  return (
    <header className="admin-card admin-hero-card p-6 sm:p-7">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold shadow-md">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <span>Welcome back, {displayName}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium">
              Monitor TreeConnect platform operations, verify contractors, and manage system governance.
            </p>
          </div>
        </div>

        <span className="admin-badge-emerald text-xs font-bold py-1.5 px-4 flex items-center gap-2">
          <Activity size={14} className="animate-pulse text-emerald-400" />
          <span>System Governance Active</span>
        </span>
      </div>
    </header>
  );
};

export default AdminHeader;
