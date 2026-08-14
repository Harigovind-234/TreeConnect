import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/admin/AdminLayout';
import UserDetailModal from '../../components/admin/UserDetailModal';
import api from '../../services/api';
import { authService } from '../../services/authService';
import {
  Users,
  Search,
  CheckCircle,
  Clock,
  UserCheck,
  Eye,
  X,
  FileText,
  Save,
  Trees,
  Truck,
  ShoppingBag,
  Loader2,
  Database,
  Phone,
  MapPin,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  UserX,
  CheckCircle2
} from 'lucide-react';

const UsersPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlRole = searchParams.get('role');

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState(urlRole || 'all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected User Modal State
  const [selectedUser, setSelectedUser] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);

  // Fetch registered users strictly from MongoDB database
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await api.get('/admin/users');
        if (res.data && Array.isArray(res.data.users)) {
          // Filter out admin role so directory focuses on ecosystem stakeholders
          const dbStakeholders = res.data.users.filter((u) => u.role !== 'admin');
          setUsers(dbStakeholders);
        } else {
          setUsers([]);
        }
      } catch (err) {
        console.error('Database fetch error:', err);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleVerify = async (userId) => {
    const targetUser = users.find((u) => u.id === userId);
    try {
      await api.put(`/admin/users/${userId}/status`, { status: 'Active', isVerified: true });
    } catch (e) {
      console.error('API verify update error:', e);
    }
    if (targetUser?.email) {
      authService.updateUserStatus(targetUser.email, 'Active', true);
    }

    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, verification: 'Verified by TreeConnect Admin', status: 'Active' }
          : u
      )
    );
    if (selectedUser?.id === userId) {
      setSelectedUser((prev) => ({
        ...prev,
        verification: 'Verified by TreeConnect Admin',
        status: 'Active'
      }));
    }
  };

  const handleToggleSuspend = async (userId) => {
    const targetUser = users.find((u) => u.id === userId);
    const nextStatus = targetUser?.status === 'Active' ? 'Suspended' : 'Active';
    const isVerified = nextStatus === 'Active';

    try {
      await api.put(`/admin/users/${userId}/status`, { status: nextStatus, isVerified });
    } catch (e) {
      console.error('API suspend update error:', e);
    }
    if (targetUser?.email) {
      authService.updateUserStatus(targetUser.email, nextStatus, isVerified);
    }

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return {
            ...u,
            status: nextStatus,
            verification: isVerified ? 'Verified by TreeConnect Admin' : u.verification
          };
        }
        return u;
      })
    );
    if (selectedUser?.id === userId) {
      setSelectedUser((prev) => ({
        ...prev,
        status: nextStatus,
        verification: isVerified ? 'Verified by TreeConnect Admin' : prev.verification
      }));
    }
  };

  const handleSaveNotes = () => {
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2500);
  };

  // Filtered Users List
  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && u.status === 'Active') ||
      (statusFilter === 'pending' && u.verification.includes('Pending')) ||
      (statusFilter === 'suspended' && u.status === 'Suspended');

    const matchesSearch =
      !searchQuery ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone && u.phone.includes(searchQuery));

    return matchesRole && matchesStatus && matchesSearch;
  });

  const getRoleStatusClass = (role) => {
    switch (role) {
      case 'landowner':
        return 'status-green';
      case 'contractor':
        return 'status-yellow';
      case 'buyer':
        return 'status-green';
      default:
        return 'status-green';
    }
  };

  const counts = {
    total: users.length,
    landowners: users.filter((u) => u.role === 'landowner').length,
    contractors: users.filter((u) => u.role === 'contractor').length,
    buyers: users.filter((u) => u.role === 'buyer').length
  };

  return (
    <AdminLayout user={user} onLogout={logout}>
      <div className="space-y-6">
        {/* Top Header Section */}
        <section className="dashboard-section card">
          <div className="card-header pb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="section-heading flex items-center gap-2.5">
                <Users className="text-emerald-400" size={22} />
                <span>System Stakeholder Directory</span>
              </h1>
              <p className="section-subtext">
                Live database directory of registered landowners, contractors, and timber buyers
              </p>
            </div>
            <span className="status-pill status-green font-bold flex items-center gap-1.5">
              {loading ? (
                <>
                  <Loader2 size={13} className="animate-spin" /> Fetching DB...
                </>
              ) : (
                <>
                  <Database size={13} /> {filteredUsers.length} DB Users
                </>
              )}
            </span>
          </div>

          {/* 3 Ecosystem Stakeholder Summary KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div
              className={`kpi-card cursor-pointer transition-all ${
                roleFilter === 'landowner' ? 'border-emerald-500/80 bg-emerald-950/20' : 'hover:border-emerald-500/40'
              }`}
              onClick={() => setRoleFilter(roleFilter === 'landowner' ? 'all' : 'landowner')}
            >
              <div className="kpi-card-header flex justify-between items-center mb-2">
                <span className="kpi-icon-box icon-emerald"><Trees size={18} /></span>
                <span className="kpi-label font-bold text-slate-400">Landowners</span>
              </div>
              <div className="kpi-card-body">
                <div className="kpi-value text-2xl font-black text-emerald-400">{counts.landowners}</div>
                <div className="text-[11px] font-semibold text-emerald-400 mt-1">Database registered owners</div>
              </div>
            </div>

            <div
              className={`kpi-card cursor-pointer transition-all ${
                roleFilter === 'contractor' ? 'border-amber-500/80 bg-amber-950/20' : 'hover:border-amber-500/40'
              }`}
              onClick={() => setRoleFilter(roleFilter === 'contractor' ? 'all' : 'contractor')}
            >
              <div className="kpi-card-header flex justify-between items-center mb-2">
                <span className="kpi-icon-box icon-amber"><Truck size={18} /></span>
                <span className="kpi-label font-bold text-slate-400">Contractors</span>
              </div>
              <div className="kpi-card-body">
                <div className="kpi-value text-2xl font-black text-amber-400">{counts.contractors}</div>
                <div className="text-[11px] font-semibold text-amber-400 mt-1">Registered service providers</div>
              </div>
            </div>

            <div
              className={`kpi-card cursor-pointer transition-all ${
                roleFilter === 'buyer' ? 'border-blue-500/80 bg-blue-950/20' : 'hover:border-blue-500/40'
              }`}
              onClick={() => setRoleFilter(roleFilter === 'buyer' ? 'all' : 'buyer')}
            >
              <div className="kpi-card-header flex justify-between items-center mb-2">
                <span className="kpi-icon-box icon-blue"><ShoppingBag size={18} /></span>
                <span className="kpi-label font-bold text-slate-400">Buyers</span>
              </div>
              <div className="kpi-card-body">
                <div className="kpi-value text-2xl font-black text-blue-400">{counts.buyers}</div>
                <div className="text-[11px] font-semibold text-blue-400 mt-1">Timber mills & registered buyers</div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Users Directory Table Section */}
        <section className="dashboard-section card space-y-5">
          {/* Card Title Header */}
          <div className="border-b border-slate-800/80 pb-4">
            <h2 className="section-heading text-xl font-extrabold text-white">Registered Stakeholders Directory</h2>
            <p className="section-subtext text-xs text-slate-400 mt-1">
              Live user database query results from MongoDB
            </p>
          </div>

          {/* Control Bar 1: Role Filter Tabs */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="role-tabs-container">
              {[
                { key: 'all', label: `All Users (${counts.total})` },
                { key: 'landowner', label: `Landowners (${counts.landowners})` },
                { key: 'contractor', label: `Contractors (${counts.contractors})` },
                { key: 'buyer', label: `Buyers (${counts.buyers})` }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setRoleFilter(tab.key)}
                  className={`role-tab-btn ${roleFilter === tab.key ? 'active' : ''}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Control Bar 2: Status Dropdown & Search Input */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="admin-select-filter"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Accounts</option>
                <option value="pending">Pending Verification</option>
                <option value="suspended">Suspended Accounts</option>
              </select>

              <div className="admin-search-box flex-1 md:flex-none">
                <Search size={16} className="admin-search-icon" />
                <input
                  type="text"
                  placeholder="Search by name, email, district..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="admin-search-input"
                />
              </div>
            </div>
          </div>

          {/* Clean Scrollable Table with Separating Borders */}
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User & Contact</th>
                  <th>Role</th>
                  <th>District / Location</th>
                  <th>Registration Date</th>
                  <th>Verification Status</th>
                  <th>Account Status</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 size={16} className="animate-spin text-emerald-400" />
                        <span>Querying registered users from MongoDB...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <Database size={24} className="text-slate-600 mb-1" />
                        <span className="font-bold text-slate-300 text-sm">No DB Stakeholders Found</span>
                        <span className="text-slate-500 text-xs max-w-sm">
                          No registered users match your search and filter criteria in MongoDB. Newly registered users will appear here live.
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="flex flex-col">
                          <span className="font-semibold text-white text-sm">{u.name}</span>
                          <span className="text-xs text-slate-400 mt-0.5">{u.email} • {u.phone}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-pill ${getRoleStatusClass(u.role)} font-bold text-[11px]`}>
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
                          {u.verification.includes('Verified') ? (
                            <CheckCircle size={13} />
                          ) : (
                            <Clock size={13} />
                          )}
                          {u.verification}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`font-bold text-xs ${
                            u.status === 'Active' ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                          <button
                            className="btn btn-xs bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer transition-all flex items-center gap-1 px-3 py-1.5 rounded-lg"
                            onClick={() => {
                              const targetId = u.id || encodeURIComponent(u.email || u.name);
                              navigate(`/admin/users/${targetId}`, { state: { user: u } });
                            }}
                          >
                            <Eye size={13} /> View Details
                          </button>

                          {u.role === 'contractor' && !u.verification.includes('Verified') && (
                            <button
                              className="btn btn-xs btn-primary cursor-pointer bg-emerald-600 hover:bg-emerald-500"
                              onClick={() => handleVerify(u.id)}
                            >
                              <UserCheck size={13} /> Verify
                            </button>
                          )}

                          <button
                            className={`btn btn-xs cursor-pointer ${
                              u.status === 'Active' ? 'btn-danger' : 'btn-secondary text-emerald-400'
                            }`}
                            onClick={() => handleToggleSuspend(u.id)}
                          >
                            {u.status === 'Active' ? 'Suspend' : 'Reactivate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

    </AdminLayout>
  );
};

export default UsersPage;
