import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import { authService } from '../../services/authService';
import propertyService from '../../services/propertyService';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShieldCheck,
  CheckCircle,
  Clock,
  AlertTriangle,
  UserX,
  UserCheck,
  Trees,
  Truck,
  ShoppingBag,
  Plus,
  Key,
  Globe,
  FileText,
  Star,
  Activity,
  Layers,
  CheckCircle2,
  Loader2,
  Database,
  Ruler,
  Building2
} from 'lucide-react';

const UserDetailPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser, logout } = useAuth();

  const initialUser = location.state?.user || null;
  const [userData, setUserData] = useState(initialUser);
  const [userProperties, setUserProperties] = useState([]);
  const [loading, setLoading] = useState(!initialUser);
  const [notes, setNotes] = useState(
    initialUser?.adminNotesList || [
      { date: 'Aug 12, 2026', text: 'Account verification completed by admin.' },
      { date: 'Aug 10, 2026', text: 'Email and phone verification completed.' }
    ]
  );
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState('');

  const fetchUserDetails = async () => {
    try {
      if (!initialUser) setLoading(true);
      const res = await api.get('/admin/users');
      if (res.data && Array.isArray(res.data.users)) {
        const decodedUserId = decodeURIComponent(userId || '');
        const found = res.data.users.find(
          (u) =>
            String(u.id) === String(decodedUserId) ||
            u.email?.toLowerCase() === decodedUserId.toLowerCase() ||
            u.name?.toLowerCase() === decodedUserId.toLowerCase()
        );

        if (found) {
          setUserData(found);
          setNotes(
            found.adminNotesList || [
              { date: 'Aug 12, 2026', text: 'Account verification completed by admin.' },
              { date: 'Aug 10, 2026', text: 'Email and phone verification completed.' }
            ]
          );
        } else if (!initialUser) {
          setUserData(null);
        }
      }
    } catch (err) {
      console.error('Error fetching user details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDetails();
  }, [userId]);

  useEffect(() => {
    const fetchUserProperties = async () => {
      const emailToQuery = userData?.email || initialUser?.email;
      if (!emailToQuery) return;
      try {
        const data = await propertyService.getProperties({ userEmail: emailToQuery });
        if (data && Array.isArray(data.properties)) {
          setUserProperties(data.properties);
        }
      } catch (err) {
        console.error('Error fetching landowner properties:', err);
      }
    };

    fetchUserProperties();
  }, [userData?.email]);

  const getDistrict = (locationStr) => {
    if (!locationStr) return 'Kottayam';
    const parts = locationStr.split(',');
    return parts[0].trim();
  };

  const handleVerify = async () => {
    if (!userData) return;
    try {
      await api.put(`/admin/users/${userData.id}/status`, { status: 'Active', isVerified: true });
    } catch (e) {
      console.error('API verify error:', e);
    }

    if (userData.email) {
      authService.updateUserStatus(userData.email, 'Active', true);
    }

    setUserData((prev) => ({
      ...prev,
      status: 'Active',
      isVerified: true,
      verification: 'Verified by TreeConnect Admin'
    }));
    setActionSuccessMessage('User Verification Approved Successfully!');
    setTimeout(() => setActionSuccessMessage(''), 3000);
  };

  const handleToggleSuspend = async () => {
    if (!userData) return;
    const nextStatus = userData.status === 'Active' ? 'Suspended' : 'Active';
    const isVerifiedVal = nextStatus === 'Active';

    try {
      await api.put(`/admin/users/${userData.id}/status`, {
        status: nextStatus,
        isVerified: isVerifiedVal
      });
    } catch (e) {
      console.error('API suspend error:', e);
    }

    if (userData.email) {
      authService.updateUserStatus(userData.email, nextStatus, isVerifiedVal);
    }

    setUserData((prev) => ({
      ...prev,
      status: nextStatus,
      isVerified: isVerifiedVal,
      verification: isVerifiedVal ? 'Verified by TreeConnect Admin' : prev.verification
    }));
    setShowSuspendConfirm(false);
    setActionSuccessMessage(
      nextStatus === 'Suspended' ? 'User Account Suspended.' : 'User Account Reactivated.'
    );
    setTimeout(() => setActionSuccessMessage(''), 3000);
  };

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const todayStr = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    });

    const newNote = {
      date: todayStr,
      text: newNoteText.trim()
    };

    setNotes([newNote, ...notes]);
    setNewNoteText('');
    setShowAddNote(false);
  };

  const isVerified = userData?.verification?.includes('Verified') || userData?.isVerified;
  const isSuspended = userData?.status === 'Suspended';

  return (
    <AdminLayout user={currentUser} onLogout={logout}>
      <div className="space-y-6 pb-12">
        {/* Back Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/admin/users')}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-emerald-400 cursor-pointer bg-slate-900/80 hover:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-800 transition-all"
          >
            <ArrowLeft size={15} />
            <span>Back to Users Directory</span>
          </button>

          <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 border border-slate-800 text-emerald-400 flex items-center gap-2">
            <Database size={13} /> Live Database Record
          </span>
        </div>

        {actionSuccessMessage && (
          <div className="p-4 rounded-xl bg-emerald-950/90 border border-emerald-700 text-emerald-400 font-bold text-xs flex items-center gap-2 animate-fade-in">
            <CheckCircle size={16} />
            <span>{actionSuccessMessage}</span>
          </div>
        )}

        {loading ? (
          <div className="p-16 text-center card bg-slate-950/80 rounded-2xl border border-slate-800">
            <Loader2 size={24} className="animate-spin text-emerald-400 mx-auto mb-2" />
            <p className="font-bold text-white text-sm">Fetching User Details...</p>
            <p className="text-xs text-slate-400 mt-1">Querying database for user ID {userId}</p>
          </div>
        ) : !userData ? (
          <div className="p-16 text-center card bg-slate-950/80 rounded-2xl border border-slate-800">
            <AlertTriangle size={32} className="text-amber-400 mx-auto mb-2" />
            <p className="font-bold text-white text-base">User Record Not Found</p>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              No registered user matching ID "{userId}" was found in the database.
            </p>
            <button
              onClick={() => navigate('/admin/users')}
              className="mt-4 btn btn-xs bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded-xl"
            >
              Return to Users Directory
            </button>
          </div>
        ) : (
          <>
            {/* Header Banner Profile Card */}
            <div className="admin-card admin-hero-card p-6 sm:p-8 space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-black text-2xl shadow-lg shrink-0">
                    {userData.name ? userData.name.charAt(0).toUpperCase() : 'U'}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                        {userData.name}
                      </h1>

                      <span className="admin-badge-emerald text-xs uppercase font-extrabold">
                        {userData.role}
                      </span>

                      <span
                        className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                          isSuspended
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        }`}
                      >
                        {userData.status || 'Active'}
                      </span>
                    </div>

                    <a
                      href={`mailto:${userData.email}`}
                      className="text-xs sm:text-sm text-slate-300 hover:text-emerald-400 transition-colors flex items-center gap-2 font-medium"
                    >
                      <Mail size={15} className="text-slate-400" />
                      <span>{userData.email}</span>
                    </a>
                  </div>
                </div>

                {/* Header Action Buttons */}
                <div className="flex items-center gap-3 self-end md:self-center">
                  {userData.role === 'contractor' && !isVerified && (
                    <button
                      onClick={handleVerify}
                      className="admin-btn-emerald text-xs sm:text-sm font-bold py-2.5 px-5"
                    >
                      <UserCheck size={16} /> Verify Contractor
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (isSuspended) handleToggleSuspend();
                      else setShowSuspendConfirm(true);
                    }}
                    className={`px-4 py-2.5 rounded-xl font-bold transition-all text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-md ${
                      isSuspended
                        ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40'
                    }`}
                  >
                    {isSuspended ? (
                      <>
                        <UserCheck size={16} /> Reactivate User
                      </>
                    ) : (
                      <>
                        <UserX size={16} /> Suspend User
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* 2-Column Page Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
              {/* Left Column (2/3 width) - Account Info, Verification, Activity */}
              <div className="lg:col-span-2 space-y-7">
                {/* ACCOUNT INFORMATION */}
                <section className="admin-card space-y-5">
                  <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-slate-200 flex items-center gap-2 border-b border-emerald-500/15 pb-3">
                    <ShieldCheck size={18} className="text-emerald-400" />
                    <span>ACCOUNT INFORMATION</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
                    <div className="admin-subcard p-4 space-y-1">
                      <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Phone size={13} className="text-slate-400" /> Phone Number
                      </span>
                      <span className="font-bold text-white text-sm sm:text-base block">{userData.phone || '+91 98765 43210'}</span>
                    </div>

                    <div className="admin-subcard p-4 space-y-1">
                      <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <MapPin size={13} className="text-slate-400" /> Location
                      </span>
                      <span className="font-bold text-white text-sm sm:text-base block">{userData.location || 'Kerala'}</span>
                    </div>

                    <div className="admin-subcard p-4 space-y-1">
                      <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Globe size={13} className="text-slate-400" /> District
                      </span>
                      <span className="font-bold text-white text-sm sm:text-base block">{getDistrict(userData.location)}</span>
                    </div>

                    <div className="admin-subcard p-4 space-y-1">
                      <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar size={13} className="text-slate-400" /> Registration Date
                      </span>
                      <span className="font-bold text-white text-sm sm:text-base block">{userData.date || 'Aug 04, 2026'}</span>
                    </div>

                    <div className="admin-subcard p-4 space-y-1">
                      <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Clock size={13} className="text-slate-400" /> Last Login
                      </span>
                      <span className="font-bold text-white text-sm sm:text-base block">{userData.lastLogin || 'Aug 12, 2026'}</span>
                    </div>

                    <div className="admin-subcard p-4 space-y-1">
                      <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Key size={13} className="text-slate-400" /> Login Method
                      </span>
                      <span className="font-bold text-white text-sm sm:text-base block">{userData.loginMethod || 'Email & Password'}</span>
                    </div>
                  </div>
                </section>

                {/* VERIFICATION STATUS */}
                <section className="admin-card space-y-5">
                  <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-slate-200 flex items-center gap-2 border-b border-emerald-500/15 pb-3">
                    <CheckCircle2 size={18} className="text-emerald-400" />
                    <span>VERIFICATION STATUS</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="admin-subcard p-4 flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-slate-300 font-semibold">Email Verification</span>
                      <span className="px-3 py-1 rounded-xl text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                        ✓ Verified
                      </span>
                    </div>

                    <div className="admin-subcard p-4 flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-slate-300 font-semibold">Phone Verification</span>
                      <span className="px-3 py-1 rounded-xl text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                        ✓ Verified
                      </span>
                    </div>

                    <div className="admin-subcard p-4 flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-slate-300 font-semibold">Account Verification</span>
                      <span className={`px-3 py-1 rounded-xl text-xs font-extrabold border flex items-center gap-1 ${isVerified ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'}`}>
                        {isVerified ? '✓ Verified' : '⏳ Pending'}
                      </span>
                    </div>

                    <div className="admin-subcard p-4 flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-slate-300 font-semibold">Admin Review</span>
                      <span className={`px-3 py-1 rounded-xl text-xs font-extrabold border flex items-center gap-1 ${isVerified ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'}`}>
                        {isVerified ? '✓ Completed' : '🔍 Under Review'}
                      </span>
                    </div>
                  </div>
                </section>

                {/* ACTIVITY SUMMARY */}
                <section className="admin-card space-y-5">
                  <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-slate-200 flex items-center gap-2 border-b border-emerald-500/15 pb-3">
                    <Activity size={18} className="text-emerald-400" />
                    <span>ACTIVITY SUMMARY ({userData.role?.toUpperCase()})</span>
                  </h3>

                  {userData.role?.toLowerCase() === 'landowner' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 pt-1">
                      <div className="admin-subcard p-5 flex items-center justify-between">
                        <div>
                          <span className="text-slate-400 text-xs font-bold block uppercase tracking-wider">Properties</span>
                          <span className="text-3xl font-black text-emerald-400 mt-1 block">{userData.propertiesCount || 3}</span>
                        </div>
                        <span className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                          <Trees size={22} />
                        </span>
                      </div>

                      <div className="admin-subcard p-5 flex items-center justify-between">
                        <div>
                          <span className="text-slate-400 text-xs font-bold block uppercase tracking-wider">Tree Inventories</span>
                          <span className="text-3xl font-black text-white mt-1 block">{userData.treeInventoriesCount || 12}</span>
                        </div>
                        <span className="p-3 rounded-xl bg-[#18241e] text-emerald-300 border border-emerald-500/20">
                          <Activity size={22} />
                        </span>
                      </div>

                      <div className="admin-subcard p-5 flex items-center justify-between">
                        <div>
                          <span className="text-slate-400 text-xs font-bold block uppercase tracking-wider">Harvest Requests</span>
                          <span className="text-3xl font-black text-amber-400 mt-1 block">{userData.harvestRequestsCount || 4}</span>
                        </div>
                        <span className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                          <Truck size={22} />
                        </span>
                      </div>

                      <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-slate-400 text-[11px] font-bold block uppercase tracking-wider">Timber Listings</span>
                          <span className="text-2xl font-black text-blue-400 mt-0.5 block">{userData.timberListingsCount || 2}</span>
                        </div>
                        <span className="p-2.5 rounded-xl bg-blue-950/80 text-blue-400 border border-blue-800/60">
                          <ShoppingBag size={20} />
                        </span>
                      </div>

                      <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-slate-400 text-[11px] font-bold block uppercase tracking-wider">Completed Harvests</span>
                          <span className="text-2xl font-black text-emerald-400 mt-0.5 block">{userData.completedHarvestsCount || 1}</span>
                        </div>
                        <span className="p-2.5 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                          <CheckCircle2 size={20} />
                        </span>
                      </div>

                      <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-slate-400 text-[11px] font-bold block uppercase tracking-wider">Contractors</span>
                          <span className="text-2xl font-black text-purple-400 mt-0.5 block">{userData.assignedContractorsCount || 2}</span>
                        </div>
                        <span className="p-2.5 rounded-xl bg-purple-950/80 text-purple-400 border border-purple-800/60">
                          <Truck size={20} />
                        </span>
                      </div>
                    </div>
                  )}

                  {userData.role?.toLowerCase() === 'contractor' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-1">
                      <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800">
                        <span className="text-slate-400 text-[11px] font-bold block uppercase tracking-wider">Experience</span>
                        <span className="text-xl font-black text-emerald-400 mt-1 block">{userData.experience || '8 Years'}</span>
                      </div>
                      <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800">
                        <span className="text-slate-400 text-[11px] font-bold block uppercase tracking-wider">Bids Submitted</span>
                        <span className="text-2xl font-black text-blue-400 mt-0.5 block">{userData.bidsSubmitted || 5}</span>
                      </div>
                      <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800">
                        <span className="text-slate-400 text-[11px] font-bold block uppercase tracking-wider">Accepted Bids</span>
                        <span className="text-2xl font-black text-emerald-400 mt-0.5 block">{userData.acceptedBids || 3}</span>
                      </div>
                      <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800">
                        <span className="text-slate-400 text-[11px] font-bold block uppercase tracking-wider">Active Projects</span>
                        <span className="text-2xl font-black text-amber-400 mt-0.5 block">{userData.activeProjects || 2}</span>
                      </div>
                      <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800">
                        <span className="text-slate-400 text-[11px] font-bold block uppercase tracking-wider">Completed Projects</span>
                        <span className="text-2xl font-black text-emerald-400 mt-0.5 block">{userData.completedProjects || 14}</span>
                      </div>
                      <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800">
                        <span className="text-slate-400 text-[11px] font-bold block uppercase tracking-wider">Rating</span>
                        <span className="text-xl font-black text-amber-400 mt-0.5 block flex items-center gap-1">
                          4.9 <Star size={14} className="fill-amber-400 text-amber-400" />
                        </span>
                      </div>
                    </div>
                  )}

                  {userData.role?.toLowerCase() === 'buyer' && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
                      <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800">
                        <span className="text-slate-400 text-[11px] font-bold block uppercase tracking-wider">Timber Inquiries</span>
                        <span className="text-2xl font-black text-blue-400 mt-0.5 block">{userData.inquiriesCount || 8}</span>
                      </div>
                      <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800">
                        <span className="text-slate-400 text-[11px] font-bold block uppercase tracking-wider">Active Purchases</span>
                        <span className="text-2xl font-black text-amber-400 mt-0.5 block">{userData.activePurchases || 3}</span>
                      </div>
                      <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800">
                        <span className="text-slate-400 text-[11px] font-bold block uppercase tracking-wider">Completed Purchases</span>
                        <span className="text-2xl font-black text-emerald-400 mt-0.5 block">{userData.completedPurchases || 15}</span>
                      </div>
                      <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800">
                        <span className="text-slate-400 text-[11px] font-bold block uppercase tracking-wider">Orders Placed</span>
                        <span className="text-2xl font-black text-purple-400 mt-0.5 block">{userData.ordersPlaced || 4}</span>
                      </div>
                    </div>
                  )}
                </section>

                {/* REGISTERED LANDOWNER PROPERTIES SECTION */}
                <section className="card p-6 bg-slate-950/90 border border-slate-800 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <Trees size={16} className="text-emerald-400" />
                      <span>REGISTERED LANDOWNER PROPERTIES ({userProperties.length})</span>
                    </h3>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2.5 py-1 rounded-lg">
                      Live Registered Parcels
                    </span>
                  </div>

                  {userProperties.length === 0 ? (
                    <div className="p-8 text-center bg-slate-900/40 rounded-xl border border-slate-800 space-y-1">
                      <Trees size={24} className="text-slate-600 mx-auto mb-1" />
                      <p className="text-xs font-bold text-slate-300">No Properties Registered Yet</p>
                      <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                        Properties registered by this landowner will automatically sync and display here live.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      {userProperties.map((p) => (
                        <div
                          key={p.id || p._id}
                          className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 hover:border-emerald-500/50 transition-all space-y-3"
                        >
                          <div className="relative h-32 rounded-lg overflow-hidden bg-slate-950 border border-slate-800">
                            <img
                              src={p.image || p.photos?.[0] || 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80'}
                              alt={p.propertyName}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2 left-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-slate-950/90 text-emerald-400 border border-emerald-800/80">
                                {p.status || 'Active Estate'}
                              </span>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-bold text-white">{p.propertyName}</h4>
                            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                              <MapPin size={12} className="text-emerald-400" />
                              <span>{p.district || 'Kottayam'}, {p.state || 'Kerala'}</span>
                            </p>
                          </div>

                          <div className="flex justify-between items-center pt-2 border-t border-slate-800/80 text-xs">
                            <span className="text-slate-400 font-semibold flex items-center gap-1">
                              <Ruler size={12} className="text-slate-500" /> Area:
                            </span>
                            <span className="font-bold text-emerald-400">{p.totalArea} {p.areaUnit || 'Acres'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              {/* Right Column (1/3 width) - Internal Admin Notes */}
              <div className="space-y-6">
                <section className="card p-6 bg-slate-950/90 border border-slate-800 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                    <div>
                      <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                        <FileText size={16} className="text-emerald-400" />
                        <span>INTERNAL ADMIN NOTES</span>
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Private notes visible only to TreeConnect administrators.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700/80 transition-all shrink-0"
                      onClick={() => setShowAddNote(!showAddNote)}
                    >
                      <Plus size={13} />
                      <span>Add Note</span>
                    </button>
                  </div>

                  {showAddNote && (
                    <form onSubmit={handleAddNote} className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-3 animate-fade-in">
                      <textarea
                        rows={3}
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                        placeholder="Record administrative observations or account notes..."
                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="btn btn-xs bg-slate-800 text-slate-300 hover:bg-slate-700 px-3 py-1.5 rounded-lg"
                          onClick={() => setShowAddNote(false)}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn btn-xs bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black px-3 py-1.5 rounded-lg"
                        >
                          Save Note
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {notes.map((n, idx) => (
                      <div key={idx} className="p-3.5 bg-slate-900/40 rounded-xl border border-slate-800/80 space-y-1.5">
                        <div className="text-[11px] font-bold text-slate-400 bg-slate-950 inline-block px-2.5 py-0.5 rounded-md border border-slate-800">
                          {n.date}
                        </div>
                        <p className="text-xs text-slate-200 font-medium leading-relaxed">
                          {n.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </>
        )}

        {/* SUSPEND CONFIRMATION DIALOG MODAL */}
        {showSuspendConfirm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
            <div className="card max-w-md w-full p-6 border border-red-900/80 rounded-2xl bg-slate-950 space-y-4 shadow-2xl text-xs">
              <div className="flex items-center gap-3 text-red-400 border-b border-slate-800 pb-3">
                <AlertTriangle size={22} className="shrink-0 text-red-400" />
                <h4 className="text-base font-extrabold text-white">Suspend this user?</h4>
              </div>

              <p className="text-slate-300 leading-relaxed text-xs">
                The user <strong>{userData?.name}</strong> will no longer be able to access their TreeConnect account until the account is reactivated by an administrator.
              </p>

              <div className="flex justify-end items-center gap-2.5 pt-2">
                <button
                  type="button"
                  className="btn btn-xs bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-4 py-2 rounded-xl cursor-pointer"
                  onClick={() => setShowSuspendConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-xs bg-red-600 hover:bg-red-500 text-white font-black px-4 py-2 rounded-xl cursor-pointer shadow-lg"
                  onClick={handleToggleSuspend}
                >
                  Suspend User
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default UserDetailPage;
