import React, { useState } from 'react';
import { Users, X, Search, CheckCircle, Clock, ShieldAlert, Check } from 'lucide-react';
import { allUsersList } from '../../data/adminMockData';

const AllUsersModal = ({ onClose, onSelectUser }) => {
  const [users, setUsers] = useState(allUsersList);
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesSearch =
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.location.toLowerCase().includes(search.toLowerCase());

    return matchesRole && matchesSearch;
  });

  const getRoleBadge = (role) => {
    switch (role) {
      case 'landowner':
        return 'badge-landowner';
      case 'contractor':
        return 'badge-contractor';
      case 'buyer':
        return 'badge-buyer';
      case 'admin':
        return 'badge-admin';
      default:
        return 'badge-admin';
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content card max-w-4xl w-full p-6 border border-slate-800 rounded-2xl bg-slate-950 space-y-4 shadow-2xl animate-fade-in">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800 flex items-center justify-center font-bold">
              <Users size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>System User Directory</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-extrabold">
                  1,248 Users
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                All registered landowners, contractors, buyers, and platform administrators
              </p>
            </div>
          </div>

          <button
            className="btn-icon text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
          {/* Role Tabs */}
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                roleFilter === 'all'
                  ? 'bg-emerald-950 text-emerald-400 font-bold border border-emerald-800'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All (1,248)
            </button>
            <button
              onClick={() => setRoleFilter('landowner')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                roleFilter === 'landowner'
                  ? 'bg-emerald-950 text-emerald-400 font-bold border border-emerald-800'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Landowners (624)
            </button>
            <button
              onClick={() => setRoleFilter('contractor')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                roleFilter === 'contractor'
                  ? 'bg-amber-950 text-amber-400 font-bold border border-amber-800'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Contractors (382)
            </button>
            <button
              onClick={() => setRoleFilter('buyer')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                roleFilter === 'buyer'
                  ? 'bg-blue-950 text-blue-400 font-bold border border-blue-800'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Buyers (242)
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name, email, district..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 rounded-xl border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="table-wrapper max-h-96 overflow-y-auto custom-scrollbar">
          <table className="data-table">
            <thead>
              <tr>
                <th>User & Contact</th>
                <th>Role</th>
                <th>District / Location</th>
                <th>Registration Date</th>
                <th>Verification Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                    No registered users match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex flex-col">
                        <span className="font-bold text-white">{u.name}</span>
                        <span className="text-xs text-slate-400">{u.email} • {u.phone}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getRoleBadge(u.role)}`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-slate-300 text-xs">{u.location}</td>
                    <td className="text-slate-400 text-xs">{u.date}</td>
                    <td>
                      <span
                        className={`status-pill ${
                          u.verification.includes('Verified') ? 'status-green' : 'status-yellow'
                        }`}
                      >
                        {u.verification.includes('Verified') ? <CheckCircle size={13} /> : <Clock size={13} />}
                        {u.verification}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-xs text-slate-400">
          <span>Showing {filteredUsers.length} user records</span>
          <button
            className="btn btn-xs btn-secondary cursor-pointer"
            onClick={onClose}
          >
            Close Directory
          </button>
        </div>
      </div>
    </div>
  );
};

export default AllUsersModal;
