import React from 'react';
import { useAuth } from '../../context/AuthContext';

const AdminHeader = () => {
  const { user } = useAuth();
  const displayName = user?.name ? user.name : 'Administrator';

  return (
    <div className="admin-header w-full pb-4 mb-2 border-b border-slate-800/80">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
        <span>Welcome back, {displayName}</span>
        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-950/90 border border-emerald-700/60 text-emerald-400 font-bold uppercase tracking-wider">
          Live Overview
        </span>
      </h1>
      <p className="text-xs sm:text-sm text-slate-400 mt-1">
        Monitor TreeConnect activity, verify contractors, and manage platform issues.
      </p>
    </div>
  );
};

export default AdminHeader;
