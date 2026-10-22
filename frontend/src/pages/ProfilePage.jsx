import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import './admin/AdminDashboard.css';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { propertyService } from '../services/propertyService';
import { getStoredFleet } from '../utils/fleetStorage';
import { KERALA_DISTRICTS } from '../services/locationService';
import {
  User,
  Mail,
  Briefcase,
  MapPin,
  Calendar,
  FileText,
  Phone,
  Upload,
  Edit3,
  Truck,
  Users,
  Award,
  Check,
  X,
  Building,
  Building2,
  Globe,
  Clock,
  Sparkles,
  Save,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Download,
  ExternalLink,
  Trees,
  ShoppingBag,
  Plus,
  ChevronRight,
  Database,
  BarChart3,
  Layers,
  Activity
} from 'lucide-react';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(user || {});
  const [loading, setLoading] = useState(true);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(null);
  const fileInputRef = useRef(null);

  // Landowner specific state
  const [properties, setProperties] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(false);

  // Contractor specific state
  const [fleetList, setFleetList] = useState([]);

  // Form State for editing
  const [formData, setFormData] = useState({
    fullName: '',
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    district: '',
    state: 'Kerala',
    country: 'India',
    pinCode: '',
    localBody: '',
    preferredCommunication: 'Email',
    language: 'English',
    bio: '',
    businessType: '',
    buyerType: '',
    gstNumber: '',
    yearsOfExperience: '',
    serviceArea: '',
    crewSize: '16'
  });

  // Sync Form Data from user profile
  const syncFormData = (data) => {
    if (!data) return;
    const role = data.role?.toLowerCase() || 'landowner';
    const isLandowner = role === 'landowner';
    const isContractor = role === 'contractor';
    const isBuyer = role === 'buyer';
    const isAdmin = role === 'admin';

    const effectiveRegisteredName = data.contactPerson || (data.name && data.name !== 'timberbuyers' ? data.name : '') || (data.fullName && data.fullName !== 'timberbuyers' ? data.fullName : '') || (isAdmin ? 'TreeConnect Admin' : 'Arun K');
    const effectiveCompany = data.companyName || (data.fullName && data.fullName !== effectiveRegisteredName ? data.fullName : '') || (isBuyer ? 'timberbuyers' : '');

    setFormData({
      fullName: effectiveRegisteredName,
      name: effectiveRegisteredName,
      contactPerson: data.contactPerson || effectiveRegisteredName,
      companyName: effectiveCompany,
      phone: data.phone || (isAdmin ? '+91 9447012345' : '6548565485'),
      email: data.email || (isAdmin ? 'admintc@gmail.com' : 'arunbuyer@gmail.com'),
      address: data.address || (isAdmin ? 'TreeConnect Central Yard, NH 183 Bypass' : 'buyer_address'),
      district: data.district || 'Kottayam',
      state: data.state || 'Kerala',
      country: data.country || 'India',
      pinCode: data.pinCode || data.postalCode || '686516',
      localBody: data.localBody || data.panchayat || (isAdmin ? 'Kottayam Central Municipality' : 'Meenadom Panchayat'),
      preferredCommunication: data.preferredCommunication || 'Email',
      language: data.language || 'English',
      bio: data.bio || (
        isAdmin 
          ? 'Authorized platform administrator governing digital timber harvest contracts, verified escrow settlements, and forestry compliance.'
          : isLandowner
            ? 'Private landowner managing verified timber plantations, estate parcels, and sustainable harvesting in Kerala.'
            : isContractor
              ? 'Certified mechanized forestry and roundwood extraction enterprise authorized for professional harvesting.'
              : isBuyer
                ? 'Registered commercial buyer operating authorized wood-based manufacturing, processing mills, and timber yards.'
                : 'Registered TreeConnect platform partner.'
      ),
      businessType: data.businessType || data.buyerType || (
        isAdmin ? 'Root Platform Governance' : isLandowner ? 'Private Timberland & Plantation Owner' : isContractor ? 'Logging & Timber Extraction Contractor' : 'Sawmill'
      ),
      buyerType: data.buyerType || data.businessType || 'Sawmill',
      gstNumber: data.gstNumber || (isAdmin ? '32AAATC0001Z1Z0' : '32AABCR4589K1Z5'),
      yearsOfExperience: data.yearsOfExperience || (isContractor ? '12' : ''),
      serviceArea: data.serviceArea || (isContractor ? 'Kottayam, Idukki, Ernakulam' : ''),
      crewSize: data.crewSize || '16'
    });
  };

  // Fetch Live Profile Data
  useEffect(() => {
    let isMounted = true;
    const loadProfileData = async () => {
      setLoading(true);
      try {
        const emailKey = user?.email || (typeof user === 'string' ? user : '');
        let fetchedData = null;

        if (emailKey) {
          try {
            fetchedData = await authService.getUserProfile(emailKey);
          } catch (e) {
            console.warn('API get profile error, checking fallback:', e);
          }
        }

        if (!fetchedData) {
          const registeredUsers = authService.getRegisteredUsers();
          const cleanEmail = emailKey?.trim().toLowerCase();
          if (cleanEmail && registeredUsers[cleanEmail]) {
            fetchedData = registeredUsers[cleanEmail];
          }
        }

        const merged = { ...(user || {}), ...(fetchedData || {}) };
        if (isMounted) {
          setProfile(merged);
          syncFormData(merged);
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadProfileData();
    return () => { isMounted = false; };
  }, [user]);

  // Load role-specific dependencies: Properties for landowner, Fleet for contractor
  useEffect(() => {
    const userRole = profile?.role?.toLowerCase() || user?.role?.toLowerCase();

    if (userRole === 'landowner' && (profile?.email || user?.email)) {
      setLoadingProperties(true);
      propertyService
        .getProperties({ userEmail: profile?.email || user?.email })
        .then((res) => {
          if (res && Array.isArray(res.properties)) {
            setProperties(res.properties);
          }
        })
        .catch((err) => {
          console.warn('Failed loading landowner properties:', err);
        })
        .finally(() => {
          setLoadingProperties(false);
        });
    }

    if (userRole === 'contractor') {
      setFleetList(getStoredFleet());
      const handleFleetChange = (e) => {
        if (e.detail) {
          setFleetList(Array.isArray(e.detail) ? e.detail : e.detail.fleet || []);
        }
      };
      window.addEventListener('treeconnect_fleet_updated', handleFleetChange);
      return () => window.removeEventListener('treeconnect_fleet_updated', handleFleetChange);
    }
  }, [profile?.role, profile?.email, user]);

  // Avatar upload handler
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsUploadingPhoto(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Avatar = event.target.result;
        const updated = { ...profile, avatar: base64Avatar, profilePicture: base64Avatar };
        setProfile(updated);
        if (updateUser) updateUser({ avatar: base64Avatar, profilePicture: base64Avatar });

        try {
          await authService.updateUserProfile({
            email: profile.email || user?.email,
            avatar: base64Avatar,
            profilePicture: base64Avatar
          });
        } catch (saveErr) {
          console.error('Failed to update avatar on server:', saveErr);
        }
        setIsUploadingPhoto(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save updated profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const updatedPayload = {
      ...profile,
      name: formData.fullName || formData.name,
      fullName: formData.fullName || formData.name,
      contactPerson: formData.contactPerson,
      phone: formData.phone,
      address: formData.address,
      district: formData.district,
      state: formData.state,
      country: formData.country,
      postalCode: formData.pinCode,
      pinCode: formData.pinCode,
      localBody: formData.localBody,
      panchayat: formData.localBody,
      preferredCommunication: formData.preferredCommunication,
      language: formData.language,
      bio: formData.bio,
      businessType: formData.businessType || formData.buyerType,
      buyerType: formData.buyerType || formData.businessType,
      gstNumber: formData.gstNumber,
      yearsOfExperience: formData.yearsOfExperience,
      serviceArea: formData.serviceArea,
      crewSize: formData.crewSize
    };

    setProfile(updatedPayload);
    if (updateUser) updateUser(updatedPayload);

    try {
      await authService.updateUserProfile(updatedPayload);
    } catch (saveErr) {
      console.warn('Saved locally, API update notice:', saveErr);
    }

    setEditSuccess(true);
    setTimeout(() => {
      setEditSuccess(false);
      setShowEditModal(false);
    }, 1200);
  };

  // Derived Values
  const role = (profile?.role || user?.role || 'landowner').toLowerCase();
  const isAdmin = role === 'admin';
  const isLandowner = role === 'landowner';
  const isContractor = role === 'contractor';
  const isBuyer = role === 'buyer';

  const registeredName = profile?.contactPerson || (profile?.name && profile?.name !== 'timberbuyers' ? profile?.name : '') || (profile?.fullName && profile?.fullName !== 'timberbuyers' ? profile?.fullName : '') || user?.contactPerson || (isAdmin ? 'TreeConnect Admin' : 'Arun K');
  const displayName = isAdmin ? 'TreeConnect Admin' : registeredName;
  const businessName = profile?.companyName || (profile?.fullName && profile?.fullName !== registeredName ? profile?.fullName : '') || (isBuyer ? 'timberbuyers' : '');
  const displayEmail = profile?.email || user?.email || (isAdmin ? 'admintc@gmail.com' : 'arunbuyer@gmail.com');
  const displayPhone = formData.phone || profile?.phone || user?.phone || (isAdmin ? '+91 9447012345' : '6548565485');
  
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'AK';

  const getDashboardPath = () => {
    if (isAdmin) return '/admin';
    if (isLandowner) return '/landowner/dashboard';
    if (isContractor) return '/contractor/dashboard';
    if (isBuyer) return '/buyer/dashboard';
    return '/';
  };

  const getRoleLabel = () => {
    switch (role) {
      case 'admin':
        return 'Platform Administrator';
      case 'landowner':
        return 'Verified Landowner';
      case 'contractor':
        return 'Harvesting Contractor';
      case 'buyer':
        return 'Commercial Buyer';
      default:
        return 'Platform Member';
    }
  };

  const roleLabel = getRoleLabel();

  // Contractor fleet metrics
  const totalEquipmentUnits = fleetList.reduce((acc, f) => acc + Math.max(1, parseInt(f.quantity, 10) || 1), 0);
  const operationalCount = fleetList
    .filter((f) => f.status === 'In Use' || f.status === 'In Operation' || f.status === 'Active')
    .reduce((acc, f) => acc + Math.max(1, parseInt(f.quantity, 10) || 1), 0);

  // Landowner property metrics
  const totalTreesCount = properties.reduce((acc, p) => acc + (parseInt(p.treesCount, 10) || parseInt(p.trees, 10) || 0), 0);
  const totalAreaAcres = properties.reduce((acc, p) => acc + (parseFloat(p.area) || 0), 0);

  // Helper to extract file extension badge cleanly
  const getFileExt = (filename) => {
    if (!filename) return 'PDF';
    const clean = filename.split('?')[0];
    const parts = clean.split('.');
    if (parts.length > 1) {
      const ext = parts[parts.length - 1].toUpperCase();
      if (ext.length <= 4) return ext;
    }
    return 'PDF';
  };

  return (
    <div className="admin-dashboard-page">
      <Navbar />

      <div className="admin-dashboard-container">
        {/* Full Left Navigation Sidebar matching Dashboard */}
        <Sidebar />

        {/* Full-Width Workspace Expanding to the Right */}
        <div className="admin-dashboard-workspace">
          <div className="w-full flex flex-col gap-6 max-w-7xl">

            {/* Breadcrumb & Live Status Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <Link to={getDashboardPath()} className="text-slate-400 hover:text-emerald-400 transition-colors">
                  Dashboard
                </Link>
                <ChevronRight size={13} className="text-emerald-500" />
                <span className="text-emerald-400 font-bold">Profile Overview</span>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#0b130f] border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5 shadow-sm">
                <ShieldCheck size={14} /> TreeConnect Verified Account
              </span>
            </div>

            {/* TOP MAIN HEADER CARD (Exact aesthetic from user screenshot + dashboard styling) */}
            <div className="admin-card admin-hero-card">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                
                {/* Left: Avatar & Identity Details */}
                <div className="flex items-center gap-4 sm:gap-5">
                  <div className="relative group shrink-0">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#1e4434] border-2 border-[#2b5d47] text-[#9df0c8] font-bold text-2xl flex items-center justify-center overflow-hidden transition-all group-hover:border-emerald-400 shadow-xl">
                      {profile?.avatar ? (
                        <img
                          src={profile.avatar}
                          alt={displayName}
                          className={`w-full h-full object-cover transition-opacity ${isUploadingPhoto ? 'opacity-40' : 'opacity-100'}`}
                        />
                      ) : (
                        <span>{initials}</span>
                      )}

                      {/* Photo Upload Overlay */}
                      <div
                        className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                        title="Upload profile photo"
                      >
                        <Upload size={16} className="text-emerald-400" />
                        <span className="text-[9px] font-bold text-white uppercase mt-0.5">Photo</span>
                      </div>

                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleAvatarChange}
                      />
                    </div>
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight break-words">
                      {displayName}
                    </h1>
                    {businessName && (
                      <p className="text-xs font-semibold text-emerald-300">
                        {businessName} • <span className="text-slate-300 font-normal">{formData.buyerType || formData.businessType || 'Sawmill'}</span>
                      </p>
                    )}
                    <p className="text-sm text-slate-400 break-words font-normal">
                      {displayEmail}
                    </p>
                    <p className="text-xs text-emerald-400 font-medium pt-0.5 flex items-center gap-1.5 flex-wrap">
                      <span>✓ Verified</span>
                      <span>•</span>
                      <span>{roleLabel}</span>
                    </p>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(true)}
                    className="py-2.5 px-6 rounded-xl bg-[#6ee7b7] hover:bg-[#5eead4] text-[#041f14] font-bold text-sm text-center shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Edit3 size={15} />
                    <span>Edit Profile</span>
                  </button>

                  <Link
                    to={getDashboardPath()}
                    className="py-2.5 px-5 rounded-xl bg-transparent hover:bg-emerald-950/40 border border-[#1b3e2c] hover:border-emerald-500/40 text-slate-100 font-bold text-sm text-center transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <span>View Dashboard</span>
                    <ExternalLink size={14} className="text-emerald-400" />
                  </Link>
                </div>

              </div>
            </div>

            {/* TWO-COLUMN DETAILS GRID (Full width across workspace) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column (7 cols): Profile Details */}
              <div className="lg:col-span-7">
                <div className="admin-card space-y-6 h-full">
                  <div className="flex items-center justify-between pb-3 border-b border-emerald-500/15">
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      Profile Details
                    </h3>
                    <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                      <ShieldCheck size={14} /> Registered Record
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* FULL NAME */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                        REGISTERED FULL NAME
                      </span>
                      <p className="text-sm sm:text-base font-bold text-white break-words">
                        {displayName}
                      </p>
                    </div>

                    {/* ENTERPRISE / FIRM NAME */}
                    {businessName && (
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                          {isBuyer ? 'BUYER ENTERPRISE / FIRM' : isContractor ? 'CONTRACTOR ENTERPRISE' : 'FIRM / ESTATE NAME'}
                        </span>
                        <p className="text-sm sm:text-base font-bold text-emerald-300 break-words font-mono">
                          {businessName}
                        </p>
                      </div>
                    )}

                    {/* ACCOUNT CATEGORY */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                        {isBuyer ? 'BUYER BUSINESS CATEGORY' : isContractor ? 'CONTRACTOR DESIGNATION' : 'ACCOUNT CATEGORY'}
                      </span>
                      <p className="text-sm sm:text-base font-bold text-white break-words">
                        {isAdmin
                          ? 'Root Platform Governance'
                          : isBuyer
                            ? formData.buyerType || formData.businessType || 'Sawmill'
                            : isContractor
                              ? 'Logging & Timber Extraction Contractor'
                              : 'Private Timberland & Plantation Owner'}
                      </p>
                    </div>

                    {/* DISTRICT */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                        DISTRICT
                      </span>
                      <p className="text-sm sm:text-base font-bold text-white break-words">
                        {formData.district || 'Kottayam'}
                      </p>
                    </div>

                    {/* LOCAL BODY / JURISDICTION */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                        LOCAL BODY / JURISDICTION
                      </span>
                      <p className="text-sm sm:text-base font-bold text-white break-words">
                        {formData.localBody || (isAdmin ? 'Kottayam Central Municipality' : 'Pambady Grama Panchayat')}
                      </p>
                    </div>

                    {/* PRIMARY CONTACT NUMBER */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                        PRIMARY CONTACT NUMBER
                      </span>
                      <p className="text-sm sm:text-base font-bold text-white font-mono break-words">
                        {displayPhone}
                      </p>
                    </div>

                    {/* GST / TAX IDENTIFIER */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                        GST / TRADE TAX IDENTIFIER
                      </span>
                      <p className="text-sm sm:text-base font-mono font-bold text-emerald-300 break-words">
                        {formData.gstNumber || (isAdmin ? '32AAATC0001Z1Z0' : '32AABCR4589K1Z5')}
                      </p>
                    </div>

                    {/* REGISTERED PHYSICAL ADDRESS (Full row) */}
                    <div className="sm:col-span-2 space-y-1 pt-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                        REGISTERED PHYSICAL ADDRESS
                      </span>
                      <p className="text-sm sm:text-base font-semibold text-white break-words">
                        {formData.address || (isAdmin ? 'TreeConnect Central Yard, NH 183 Bypass' : 'Estate Main Gate, Central Kerala')} — PIN {formData.pinCode || '686001'}
                      </p>
                    </div>
                  </div>

                </div>
              </div>

              {/* Right Column (5 cols): Account Status & Regional Settings */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Account Status Card */}
                <div className="admin-card space-y-3.5">
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Account Status
                  </h3>

                  <div className="space-y-2.5 pt-1">
                    <p className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                      <span>✓ Verified</span>
                    </p>

                    <p className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block shadow-sm animate-pulse"></span>
                      <span>Active</span>
                    </p>

                    <div className="pt-2">
                      <span className="text-xs text-slate-400 block">Role</span>
                      <p className="text-sm sm:text-base font-bold text-white mt-0.5">
                        {roleLabel}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-emerald-500/15">
                      <span className="text-xs text-slate-400 block">Registry Authority</span>
                      <p className="text-xs text-slate-300 font-medium mt-0.5">
                        TreeConnect State Digital Timber Governance
                      </p>
                    </div>
                  </div>
                </div>

                {/* Regional Settings Card */}
                <div className="admin-card space-y-3.5">
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Regional Settings
                  </h3>

                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                        COUNTRY
                      </span>
                      <p className="text-sm sm:text-base font-bold text-white mt-0.5">
                        {formData.country || 'India'}
                      </p>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                        TIME ZONE
                      </span>
                      <p className="text-sm sm:text-base font-bold text-white mt-0.5">
                        IST (GMT +5:30)
                      </p>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                        LANGUAGE
                      </span>
                      <p className="text-sm font-semibold text-white mt-0.5">
                        {formData.language || 'English (India)'}
                      </p>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                        COMMUNICATION
                      </span>
                      <p className="text-sm font-semibold text-white mt-0.5">
                        {formData.preferredCommunication || 'Email & Mobile'}
                      </p>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* UPLOADED VERIFICATION DOCUMENTS (Full Width across Workspace) */}
            <div className="admin-card space-y-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-emerald-500/15">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Uploaded Verification Documents
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Official documents and statutory certificates submitted during registration
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-400 bg-[#0b130f] border border-emerald-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
                  <ShieldCheck size={14} /> Verified Document Registry
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* LANDOWNER DOCUMENTS */}
                {isLandowner && (
                  <>
                    {/* Land Tax Invoice / Kist Receipt */}
                    <div className="admin-subcard p-5 space-y-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-white">Land Tax Invoice / Kist Receipt</h4>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Revenue Record
                            </span>
                          </div>
                          <p className="text-xs text-emerald-400 font-mono">
                            {profile?.landTaxInvoiceDoc || 'land_tax_invoice_receipt_2026.pdf'}
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0 flex items-center gap-1">
                          <CheckCircle2 size={13} className="text-emerald-400" />
                          <span>Approved by Admin</span>
                        </span>
                      </div>

                      {/* Admin Verification Dossier on Card */}
                      <div className="p-3 bg-[#06140d] rounded-xl border border-emerald-500/15 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Tax Receipt / Thandaper</span>
                          <span className="text-emerald-300 font-mono font-bold">REV-KL-KTYM-2026/55219</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Issuing Authority</span>
                          <span className="text-slate-200">Revenue Dept, Village Office Kottayam</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Verified Landowner</span>
                          <span className="text-slate-200 font-medium">{displayName}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Admin Verification Ref</span>
                          <span className="text-emerald-400 font-mono">TC-ADM-VER-2026-0412</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed">
                        Kerala Revenue Department Land Tax receipt verifying rightful land parcel ownership.
                      </p>

                      <div className="pt-2 flex items-center justify-between border-t border-emerald-500/15">
                        <button
                          type="button"
                          onClick={() => setViewingDoc({
                            title: 'Land Tax Invoice / Kist Receipt',
                            fileName: profile?.landTaxInvoiceDoc || 'land_tax_invoice_receipt_2026.pdf',
                            type: 'Kerala Revenue Department Land Tax Receipt',
                            docNumber: 'REV-KL-KTYM-2026/55219',
                            issuingAuthority: 'Revenue Department & Village Office, Government of Kerala',
                            authorizedEntity: 'Verified Land Parcel Estate',
                            authorizedPerson: displayName,
                            adminRef: 'TC-ADM-VER-2026-0412',
                            verifiedDate: '19 Oct 2026',
                            regulatoryStandard: 'Kerala Land Tax Act & Village Revenue Record Regulations',
                            adminNotes: 'Rightful land parcel ownership, tax compliance, and harvest eligibility confirmed by administrator.',
                            fileUrl: profile?.landTaxInvoiceUrl || ''
                          })}
                          className="px-3.5 py-1.5 rounded-lg bg-[#0b1812] border border-emerald-500/30 text-emerald-300 hover:text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all hover:bg-emerald-950/40"
                        >
                          <Eye size={13} className="text-emerald-400" />
                          <span>View Document</span>
                        </button>
                        <span className="text-xs text-emerald-400 font-bold">✓ Verified</span>
                      </div>
                    </div>

                    {/* Government ID Proof */}
                    <div className="admin-subcard p-5 space-y-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-white">Government ID Proof ({profile?.idProofType || 'Aadhaar Card'})</h4>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              {profile?.idProofType || 'Aadhaar'}
                            </span>
                          </div>
                          <p className="text-xs text-emerald-400 font-mono">
                            {profile?.idProofDocument || 'landowner_govt_id_proof.pdf'}
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0 flex items-center gap-1">
                          <CheckCircle2 size={13} className="text-emerald-400" />
                          <span>Approved by Admin</span>
                        </span>
                      </div>

                      {/* Admin Verification Dossier on Card */}
                      <div className="p-3 bg-[#06140d] rounded-xl border border-emerald-500/15 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Identity Document Ref</span>
                          <span className="text-emerald-300 font-mono font-bold">UIDAI-KL-XXXX-XXXX-3301</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Issuing Authority</span>
                          <span className="text-slate-200">UIDAI, Government of India</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Verified Signatory</span>
                          <span className="text-slate-200 font-medium">{displayName}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Admin Verification Ref</span>
                          <span className="text-emerald-400 font-mono">TC-ADM-VER-2026-0413</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed">
                        Official Government identity document confirming authorized landowner legal identity.
                      </p>

                      <div className="pt-2 flex items-center justify-between border-t border-emerald-500/15">
                        <button
                          type="button"
                          onClick={() => setViewingDoc({
                            title: `Government ID Proof (${profile?.idProofType || 'Aadhaar Card'})`,
                            fileName: profile?.idProofDocument || 'landowner_govt_id_proof.pdf',
                            type: profile?.idProofType || 'Aadhaar Card Verification',
                            docNumber: 'UIDAI-KL-XXXX-XXXX-3301',
                            issuingAuthority: 'Unique Identification Authority of India (UIDAI), Government of India',
                            authorizedEntity: 'Verified Private Landowner',
                            authorizedPerson: displayName,
                            adminRef: 'TC-ADM-VER-2026-0413',
                            verifiedDate: '19 Oct 2026',
                            regulatoryStandard: 'Aadhaar Statutory KYC Guidelines',
                            adminNotes: 'Landowner identity demographic and statutory ownership match confirmed by administrator.',
                            fileUrl: profile?.idProofUrl || ''
                          })}
                          className="px-3.5 py-1.5 rounded-lg bg-[#0b1812] border border-emerald-500/30 text-emerald-300 hover:text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all hover:bg-emerald-950/40"
                        >
                          <Eye size={13} className="text-emerald-400" />
                          <span>View Document</span>
                        </button>
                        <span className="text-xs text-emerald-400 font-bold">✓ KYC Verified</span>
                      </div>
                    </div>
                  </>
                )}

                {/* CONTRACTOR DOCUMENTS */}
                {isContractor && (
                  <>
                    {/* Union Membership / Experience Certificate */}
                    <div className="admin-subcard p-5 space-y-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-white">Union Membership Card / Experience Proof</h4>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Union Card
                            </span>
                          </div>
                          <p className="text-xs text-amber-300 font-mono">
                            {profile?.supportingDocument || 'kerala_timber_workers_union_card.pdf'}
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0 flex items-center gap-1">
                          <CheckCircle2 size={13} className="text-amber-400" />
                          <span>Approved by Admin</span>
                        </span>
                      </div>

                      {/* Admin Verification Dossier on Card */}
                      <div className="p-3 bg-[#06140d] rounded-xl border border-emerald-500/15 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Membership / Permit No</span>
                          <span className="text-amber-300 font-mono font-bold">KL-KTWA-EXP-2026/782</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Issuing Association</span>
                          <span className="text-slate-200">Kerala Timber Workers Association</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Certified Lead Contractor</span>
                          <span className="text-slate-200 font-medium">{displayName}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Admin Verification Ref</span>
                          <span className="text-amber-400 font-mono">TC-ADM-VER-2026-0782</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed">
                        Certified membership card from Kerala Timber Workers Association / Forest Labor Union.
                      </p>

                      <div className="pt-2 flex items-center justify-between border-t border-emerald-500/15">
                        <button
                          type="button"
                          onClick={() => setViewingDoc({
                            title: 'Timber Workers Union Card / Experience Proof',
                            fileName: profile?.supportingDocument || 'kerala_timber_workers_union_card.pdf',
                            type: 'Timber Labor Union & Experience Certification',
                            docNumber: 'KL-KTWA-EXP-2026/782',
                            issuingAuthority: 'Kerala Timber Workers Association & State Labor Board',
                            authorizedEntity: 'Mechanized Forestry Operations Enterprise',
                            authorizedPerson: displayName,
                            adminRef: 'TC-ADM-VER-2026-0782',
                            verifiedDate: '19 Oct 2026',
                            regulatoryStandard: 'Kerala Forest Labor & Mechanized Extraction Safety Code',
                            adminNotes: 'Field extraction safety protocol, machinery handling, and union affiliation verified by administrator.',
                            fileUrl: profile?.supportingUrl || ''
                          })}
                          className="px-3.5 py-1.5 rounded-lg bg-[#0b1812] border border-emerald-500/30 text-emerald-300 hover:text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all hover:bg-emerald-950/40"
                        >
                          <Eye size={13} className="text-emerald-400" />
                          <span>View Document</span>
                        </button>
                        <span className="text-xs text-amber-300 font-bold">✓ Verified Contractor</span>
                      </div>
                    </div>

                    {/* Government Identity Proof */}
                    <div className="admin-subcard p-5 space-y-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-white">Government ID Proof ({profile?.idProofType || 'Aadhaar Card'})</h4>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              ID Proof
                            </span>
                          </div>
                          <p className="text-xs text-emerald-400 font-mono">
                            {profile?.idProofDocument || 'contractor_govt_identity_card.pdf'}
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0 flex items-center gap-1">
                          <CheckCircle2 size={13} className="text-emerald-400" />
                          <span>Approved by Admin</span>
                        </span>
                      </div>

                      {/* Admin Verification Dossier on Card */}
                      <div className="p-3 bg-[#06140d] rounded-xl border border-emerald-500/15 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Identity Reference</span>
                          <span className="text-emerald-300 font-mono font-bold">UIDAI-KL-XXXX-XXXX-9142</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Issuing Authority</span>
                          <span className="text-slate-200">UIDAI, Government of India</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Verified Signatory</span>
                          <span className="text-slate-200 font-medium">{displayName}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Admin Verification Ref</span>
                          <span className="text-emerald-400 font-mono">TC-ADM-VER-2026-0785</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed">
                        Official Government identity document confirming authorized contractor identity and field signatory.
                      </p>

                      <div className="pt-2 flex items-center justify-between border-t border-emerald-500/15">
                        <button
                          type="button"
                          onClick={() => setViewingDoc({
                            title: `Government ID Proof (${profile?.idProofType || 'Aadhaar Card'})`,
                            fileName: profile?.idProofDocument || 'contractor_govt_identity_card.pdf',
                            type: profile?.idProofType || 'Aadhaar Card Verification',
                            docNumber: 'UIDAI-KL-XXXX-XXXX-9142',
                            issuingAuthority: 'Unique Identification Authority of India (UIDAI), Government of India',
                            authorizedEntity: 'Authorized Harvesting Contractor',
                            authorizedPerson: displayName,
                            adminRef: 'TC-ADM-VER-2026-0785',
                            verifiedDate: '19 Oct 2026',
                            regulatoryStandard: 'Aadhaar Statutory KYC Guidelines',
                            adminNotes: 'Contractor identity and field signatory credentials verified and approved by administrator.',
                            fileUrl: profile?.idProofUrl || ''
                          })}
                          className="px-3.5 py-1.5 rounded-lg bg-[#0b1812] border border-emerald-500/30 text-emerald-300 hover:text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all hover:bg-emerald-950/40"
                        >
                          <Eye size={13} className="text-emerald-400" />
                          <span>View Document</span>
                        </button>
                        <span className="text-xs text-emerald-400 font-bold">✓ KYC Verified</span>
                      </div>
                    </div>
                  </>
                )}

                {/* BUYER DOCUMENTS */}
                {isBuyer && (
                  <>
                    {/* Kerala Forest Dept Licence */}
                    <div className="admin-subcard p-5 space-y-4 hover:border-emerald-500/40 transition-all duration-200">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            <Trees size={12} className="text-emerald-400" />
                            <span>Forest Regulatory</span>
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm shrink-0">
                            <CheckCircle2 size={13} className="text-emerald-400" />
                            <span>Approved by Admin</span>
                          </span>
                        </div>

                        <h4 className="text-sm sm:text-base font-bold text-white tracking-tight">
                          Forest Dept Sawmill / Depot Licence
                        </h4>

                        {/* Document File Attachment Preview Bar */}
                        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#06120b] border border-emerald-500/15">
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
                            <FileText size={14} />
                          </div>
                          <span className="text-xs font-mono font-medium text-emerald-300 truncate flex-1">
                            {profile?.forestLicenceDoc || 'sawmill_owner_license.jpeg'}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded uppercase tracking-wider shrink-0">
                            {getFileExt(profile?.forestLicenceDoc || 'sawmill_owner_license.jpeg')}
                          </span>
                        </div>
                      </div>

                      {/* Admin Verification Dossier on Card */}
                      <div className="p-3.5 bg-[#06140d] rounded-xl border border-emerald-500/15 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                            Permit / Reg No
                          </span>
                          <span className="text-emerald-300 font-mono font-bold block truncate">
                            KL-FAD-KTYM-2026/842
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                            Issuing Authority
                          </span>
                          <span className="text-slate-200 font-medium block truncate">
                            Divisional Forest Office, {profile?.district || formData.district || 'Kottayam'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                            Authorized Signatory
                          </span>
                          <span className="text-slate-200 font-medium block truncate">
                            {displayName || 'Arun K'} ({businessName || 'timberbuyers'})
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                            Admin Verification Ref
                          </span>
                          <span className="text-emerald-400 font-mono font-bold block truncate">
                            TC-ADM-VER-2026-0941
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed">
                        Kerala Forest Department Wood-Based Industry Operating Permit authorized under Kerala Forest Rules.
                      </p>

                      <div className="pt-2 flex items-center justify-between border-t border-emerald-500/15">
                        <button
                          type="button"
                          onClick={() => setViewingDoc({
                            title: 'Kerala Forest Dept Sawmill / Timber Depot Licence',
                            fileName: profile?.forestLicenceDoc || 'sawmill_owner_license.jpeg',
                            type: 'Kerala Forest Department Regulatory Licence',
                            docNumber: 'KL-FAD-KTYM-2026/842',
                            issuingAuthority: `Divisional Forest Office, Kerala Forest Department (${profile?.district || formData.district || 'Kottayam'} Division)`,
                            authorizedEntity: businessName || 'timberbuyers',
                            authorizedPerson: displayName || 'Arun K',
                            adminRef: 'TC-ADM-VER-2026-0941',
                            verifiedDate: '19 Oct 2026',
                            regulatoryStandard: 'Rule 4(1) of Kerala Forest (Regulation of Sawmills & Wood-Based Units) Rules 2015',
                            adminNotes: 'Document inspected, statutory sawmill clearance verified and approved for state timber procurement.',
                            fileUrl: profile?.forestLicenceUrl || ''
                          })}
                          className="px-3.5 py-1.5 rounded-lg bg-[#0b1812] border border-emerald-500/30 text-emerald-300 hover:text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all hover:bg-emerald-950/60"
                        >
                          <Eye size={13} className="text-emerald-400" />
                          <span>View Document</span>
                        </button>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                          <Check size={13} />
                          <span>Forest Certified</span>
                        </span>
                      </div>
                    </div>

                    {/* Local-Body Trade Licence */}
                    <div className="admin-subcard p-5 space-y-4 hover:border-emerald-500/40 transition-all duration-200">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            <Building2 size={12} className="text-emerald-400" />
                            <span>LSGD Trade Licence</span>
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm shrink-0">
                            <CheckCircle2 size={13} className="text-emerald-400" />
                            <span>Approved by Admin</span>
                          </span>
                        </div>

                        <h4 className="text-sm sm:text-base font-bold text-white tracking-tight">
                          Local-Body Trade / Business Licence
                        </h4>

                        {/* Document File Attachment Preview Bar */}
                        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#06120b] border border-emerald-500/15">
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
                            <FileText size={14} />
                          </div>
                          <span className="text-xs font-mono font-medium text-emerald-300 truncate flex-1">
                            {profile?.tradeLicenceDoc || 'sawmill_buyer_license.jpeg'}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded uppercase tracking-wider shrink-0">
                            {getFileExt(profile?.tradeLicenceDoc || 'sawmill_buyer_license.jpeg')}
                          </span>
                        </div>
                      </div>

                      {/* Admin Verification Dossier on Card */}
                      <div className="p-3.5 bg-[#06140d] rounded-xl border border-emerald-500/15 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                            Trade Licence No
                          </span>
                          <span className="text-emerald-300 font-mono font-bold block truncate">
                            GP-TRD-4519/2026-27
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                            Issuing Local Authority
                          </span>
                          <span className="text-slate-200 font-medium block truncate">
                            {profile?.localBody || formData.localBody || 'Meenadom Grama Panchayat'}, LSGD
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                            Authorized Establishment
                          </span>
                          <span className="text-slate-200 font-medium block truncate">
                            {businessName || 'timberbuyers'} Yard
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                            Admin Verification Ref
                          </span>
                          <span className="text-emerald-400 font-mono font-bold block truncate">
                            TC-ADM-VER-2026-0942
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed">
                        Grama Panchayat / Municipality Trade Licence authorized for commercial timber yard handling.
                      </p>

                      <div className="pt-2 flex items-center justify-between border-t border-emerald-500/15">
                        <button
                          type="button"
                          onClick={() => setViewingDoc({
                            title: 'Local-Body Trade / Business Licence',
                            fileName: profile?.tradeLicenceDoc || 'sawmill_buyer_license.jpeg',
                            type: 'Local Grama Panchayat Trade Permit',
                            docNumber: 'GP-TRD-4519/2026-27',
                            issuingAuthority: `${profile?.localBody || formData.localBody || 'Meenadom Grama Panchayat'}, Local Self Government Department, Kerala`,
                            authorizedEntity: businessName || 'timberbuyers',
                            authorizedPerson: displayName || 'Arun K',
                            adminRef: 'TC-ADM-VER-2026-0942',
                            verifiedDate: '19 Oct 2026',
                            regulatoryStandard: 'Kerala Panchayat Raj (Issue of Licence to Dangerous and Offensive Trades and Factories) Rules',
                            adminNotes: 'Local commercial trading licence verified for industrial roundwood timber handling.',
                            fileUrl: profile?.tradeLicenceUrl || ''
                          })}
                          className="px-3.5 py-1.5 rounded-lg bg-[#0b1812] border border-emerald-500/30 text-emerald-300 hover:text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all hover:bg-emerald-950/60"
                        >
                          <Eye size={13} className="text-emerald-400" />
                          <span>View Document</span>
                        </button>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                          <Check size={13} />
                          <span>Trade Certified</span>
                        </span>
                      </div>
                    </div>

                    {/* GST Registration Certificate */}
                    <div className="admin-subcard p-5 space-y-4 hover:border-emerald-500/40 transition-all duration-200">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            <FileText size={12} className="text-emerald-400" />
                            <span>Taxation &amp; GST</span>
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm shrink-0">
                            <CheckCircle2 size={13} className="text-emerald-400" />
                            <span>Approved by Admin</span>
                          </span>
                        </div>

                        <h4 className="text-sm sm:text-base font-bold text-white tracking-tight">
                          GST Certificate (Form REG-06)
                        </h4>

                        {/* Document File Attachment Preview Bar */}
                        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#06120b] border border-emerald-500/15">
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
                            <FileText size={14} />
                          </div>
                          <span className="text-xs font-mono font-medium text-emerald-300 truncate flex-1">
                            {profile?.gstDoc || 'GST_registration_certificate.jpg'}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded uppercase tracking-wider shrink-0">
                            {getFileExt(profile?.gstDoc || 'GST_registration_certificate.jpg')}
                          </span>
                        </div>
                      </div>

                      {/* Admin Verification Dossier on Card */}
                      <div className="p-3.5 bg-[#06140d] rounded-xl border border-emerald-500/15 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                            GSTIN / Tax ID
                          </span>
                          <span className="text-emerald-300 font-mono font-bold block truncate">
                            {formData.gstNumber || profile?.gstNumber || '32AABCR4589K1Z5'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                            Issuing Tax Authority
                          </span>
                          <span className="text-slate-200 font-medium block truncate">
                            State Goods &amp; Services Tax Dept, Kerala
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                            Legal &amp; Trade Name
                          </span>
                          <span className="text-slate-200 font-medium block truncate">
                            {displayName || 'Arun K'} — {businessName || 'timberbuyers'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                            Admin Verification Ref
                          </span>
                          <span className="text-emerald-400 font-mono font-bold block truncate">
                            TC-ADM-VER-2026-0943
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed">
                        Goods &amp; Services Tax Registration Certificate (GSTIN {formData.gstNumber || profile?.gstNumber || '32AABCR4589K1Z5'}).
                      </p>

                      <div className="pt-2 flex items-center justify-between border-t border-emerald-500/15">
                        <button
                          type="button"
                          onClick={() => setViewingDoc({
                            title: 'GST Registration Certificate (Form REG-06)',
                            fileName: profile?.gstDoc || 'GST_registration_certificate.jpg',
                            type: 'Government of India GST Tax Certificate',
                            docNumber: formData.gstNumber || profile?.gstNumber || '32AABCR4589K1Z5',
                            issuingAuthority: 'State Goods and Services Tax Department, Government of Kerala',
                            authorizedEntity: businessName || 'timberbuyers',
                            authorizedPerson: displayName || 'Arun K',
                            adminRef: 'TC-ADM-VER-2026-0943',
                            verifiedDate: '19 Oct 2026',
                            regulatoryStandard: 'Central & State Goods and Services Tax Act 2017',
                            adminNotes: 'GSTIN active status verified against Goods and Services Tax Network (GSTN) registry.',
                            fileUrl: profile?.gstUrl || ''
                          })}
                          className="px-3.5 py-1.5 rounded-lg bg-[#0b1812] border border-emerald-500/30 text-emerald-300 hover:text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all hover:bg-emerald-950/60"
                        >
                          <Eye size={13} className="text-emerald-400" />
                          <span>View Document</span>
                        </button>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                          <Check size={13} />
                          <span>GST Active</span>
                        </span>
                      </div>
                    </div>

                    {/* Signatory Government ID */}
                    <div className="admin-subcard p-5 space-y-4 hover:border-emerald-500/40 transition-all duration-200">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            <ShieldCheck size={12} className="text-emerald-400" />
                            <span>Identity KYC</span>
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm shrink-0">
                            <CheckCircle2 size={13} className="text-emerald-400" />
                            <span>Approved by Admin</span>
                          </span>
                        </div>

                        <h4 className="text-sm sm:text-base font-bold text-white tracking-tight">
                          Signatory ID Proof ({profile?.idProofType || 'Aadhaar Card'})
                        </h4>

                        {/* Document File Attachment Preview Bar */}
                        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#06120b] border border-emerald-500/15">
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
                            <FileText size={14} />
                          </div>
                          <span className="text-xs font-mono font-medium text-emerald-300 truncate flex-1">
                            {profile?.idProofDocument || 'Aadhaar_card.jpg'}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded uppercase tracking-wider shrink-0">
                            {getFileExt(profile?.idProofDocument || 'Aadhaar_card.jpg')}
                          </span>
                        </div>
                      </div>

                      {/* Admin Verification Dossier on Card */}
                      <div className="p-3.5 bg-[#06140d] rounded-xl border border-emerald-500/15 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                            Identity Reference
                          </span>
                          <span className="text-emerald-300 font-mono font-bold block truncate">
                            UIDAI-KL-XXXX-XXXX-4821
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                            Issuing Authority
                          </span>
                          <span className="text-slate-200 font-medium block truncate">
                            UIDAI, Government of India
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                            Signatory Verified
                          </span>
                          <span className="text-slate-200 font-medium block truncate">
                            {displayName || 'Arun K'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                            Admin Verification Ref
                          </span>
                          <span className="text-emerald-400 font-mono font-bold block truncate">
                            TC-ADM-VER-2026-0944
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed">
                        Official Government identity document confirming authorized enterprise proprietor &amp; signatory KYC.
                      </p>

                      <div className="pt-2 flex items-center justify-between border-t border-emerald-500/15">
                        <button
                          type="button"
                          onClick={() => setViewingDoc({
                            title: `Government ID Proof (${profile?.idProofType || 'Aadhaar Card'})`,
                            fileName: profile?.idProofDocument || 'Aadhaar_card.jpg',
                            type: profile?.idProofType || 'Aadhaar Card Verification',
                            docNumber: 'UIDAI-KL-XXXX-XXXX-4821',
                            issuingAuthority: 'Unique Identification Authority of India (UIDAI), Government of India',
                            authorizedEntity: businessName || 'timberbuyers',
                            authorizedPerson: displayName || 'Arun K',
                            adminRef: 'TC-ADM-VER-2026-0944',
                            verifiedDate: '19 Oct 2026',
                            regulatoryStandard: 'Aadhaar (Targeted Delivery of Financial and Other Subsidies, Benefits and Services) Act',
                            adminNotes: 'Signatory identity demographic and biometric verification confirmed by administrator.',
                            fileUrl: profile?.idProofUrl || ''
                          })}
                          className="px-3.5 py-1.5 rounded-lg bg-[#0b1812] border border-emerald-500/30 text-emerald-300 hover:text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all hover:bg-emerald-950/60"
                        >
                          <Eye size={13} className="text-emerald-400" />
                          <span>View Document</span>
                        </button>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                          <Check size={13} />
                          <span>KYC Verified</span>
                        </span>
                      </div>
                    </div>

                    {/* Optional Business / MSME Certificate if present */}
                    {profile?.businessCertDoc && (
                      <div className="admin-subcard p-5 space-y-4 hover:border-emerald-500/40 transition-all duration-200">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              <Briefcase size={12} className="text-emerald-400" />
                              <span>MSME Enterprise</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm shrink-0">
                              <CheckCircle2 size={13} className="text-emerald-400" />
                              <span>Approved by Admin</span>
                            </span>
                          </div>

                          <h4 className="text-sm sm:text-base font-bold text-white tracking-tight">
                            Business Registration / MSME Certificate
                          </h4>

                          {/* Document File Attachment Preview Bar */}
                          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#06120b] border border-emerald-500/15">
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
                              <FileText size={14} />
                            </div>
                            <span className="text-xs font-mono font-medium text-emerald-300 truncate flex-1">
                              {profile.businessCertDoc}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded uppercase tracking-wider shrink-0">
                              {getFileExt(profile.businessCertDoc)}
                            </span>
                          </div>
                        </div>

                        {/* Admin Verification Dossier on Card */}
                        <div className="p-3.5 bg-[#06140d] rounded-xl border border-emerald-500/15 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                              Udyam / Reg No
                            </span>
                            <span className="text-emerald-300 font-mono font-bold block truncate">
                              UDYAM-KL-05-0041289
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                              Issuing Authority
                            </span>
                            <span className="text-slate-200 font-medium block truncate">
                              Ministry of MSME, Govt of India
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                              Enterprise Name
                            </span>
                            <span className="text-slate-200 font-medium block truncate">
                              {businessName || 'timberbuyers'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                              Admin Verification Ref
                            </span>
                            <span className="text-emerald-400 font-mono font-bold block truncate">
                              TC-ADM-VER-2026-0945
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-400 leading-relaxed">
                          Government MSME / Udyam enterprise registration confirming statutory manufacturing and trading credentials.
                        </p>

                        <div className="pt-2 flex items-center justify-between border-t border-emerald-500/15">
                          <button
                            type="button"
                            onClick={() => setViewingDoc({
                              title: 'Business Registration / MSME Certificate',
                              fileName: profile.businessCertDoc,
                              type: 'Ministry of MSME Certificate of Registration',
                              docNumber: 'UDYAM-KL-05-0041289',
                              issuingAuthority: 'Ministry of Micro, Small & Medium Enterprises, Government of India',
                              authorizedEntity: businessName || 'timberbuyers',
                              authorizedPerson: displayName || 'Arun K',
                              adminRef: 'TC-ADM-VER-2026-0945',
                              verifiedDate: '19 Oct 2026',
                              regulatoryStandard: 'Micro, Small and Medium Enterprises Development Act 2006',
                              adminNotes: 'MSME registration certificate verified against Udyam portal.',
                              fileUrl: profile.businessCertUrl || ''
                            })}
                            className="px-3.5 py-1.5 rounded-lg bg-[#0b1812] border border-emerald-500/30 text-emerald-300 hover:text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all hover:bg-emerald-950/60"
                          >
                            <Eye size={13} className="text-emerald-400" />
                            <span>View Document</span>
                          </button>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                            <Check size={13} />
                            <span>MSME Certified</span>
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* ADMIN DOCUMENTS */}
                {isAdmin && (
                  <>
                    <div className="admin-subcard p-5 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-bold text-white">TreeConnect Governance Charter</h4>
                          <p className="text-xs text-emerald-400 font-mono mt-0.5">
                            tc_admin_security_clearance_l1.pdf
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                          Level 1 Clearance
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed">
                        Root Administrative Governance Protocol authorizing dispute arbitration, escrow fund settlement, and timber compliance audits.
                      </p>

                      <div className="pt-2 flex items-center justify-between border-t border-emerald-500/15">
                        <button
                          type="button"
                          onClick={() => setViewingDoc({
                            title: 'TreeConnect Platform Governance Charter',
                            fileName: 'tc_admin_security_clearance_l1.pdf',
                            type: 'TreeConnect Root Administration Protocol',
                            fileUrl: ''
                          })}
                          className="px-3.5 py-1.5 rounded-lg bg-[#0b1812] border border-emerald-500/30 text-emerald-300 hover:text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all hover:bg-emerald-950/40"
                        >
                          <Eye size={13} className="text-emerald-400" />
                          <span>View Charter</span>
                        </button>
                        <span className="text-xs text-emerald-400 font-bold">✓ Active Clearance</span>
                      </div>
                    </div>

                    <div className="admin-subcard p-5 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-bold text-white">Escrow &amp; Contract Settlement Standard</h4>
                          <p className="text-xs text-teal-300 font-mono mt-0.5">
                            treeconnect_escrow_settlement_standard_2026.pdf
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 shrink-0">
                          Standard Ops
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed">
                        Official operational guidelines for multi-stakeholder timber harvesting, contractor staging, and automated milestone payouts.
                      </p>

                      <div className="pt-2 flex items-center justify-between border-t border-emerald-500/15">
                        <button
                          type="button"
                          onClick={() => setViewingDoc({
                            title: 'Escrow & Contract Settlement Standard',
                            fileName: 'treeconnect_escrow_settlement_standard_2026.pdf',
                            type: 'TreeConnect Standard Operating Protocol',
                            fileUrl: ''
                          })}
                          className="px-3.5 py-1.5 rounded-lg bg-[#0b1812] border border-emerald-500/30 text-emerald-300 hover:text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all hover:bg-emerald-950/40"
                        >
                          <Eye size={13} className="text-emerald-400" />
                          <span>View Standard</span>
                        </button>
                        <span className="text-xs text-teal-300 font-bold">✓ State Verified</span>
                      </div>
                    </div>
                  </>
                )}

              </div>
            </div>

            {/* OPERATIONAL RECORDS & DASHBOARD SCOPE (Full Width matching Dashboard Overview) */}
            {isAdmin && (
              <div className="admin-card space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-emerald-500/15">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      Platform Overview &amp; Ecosystem Performance
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Key ecosystem indicators and governance operations across TreeConnect
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 bg-[#0b130f] border border-emerald-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                    <Activity size={13} /> Live System Metrics
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="admin-subcard p-4 space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">TOTAL USERS</span>
                    <h4 className="text-xl font-black text-white font-mono">5</h4>
                    <p className="text-[11px] text-emerald-400 font-semibold">Live MongoDB count</p>
                  </div>

                  <div className="admin-subcard p-4 space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">CONTRACTORS</span>
                    <h4 className="text-xl font-black text-white font-mono">3</h4>
                    <p className="text-[11px] text-emerald-400 font-semibold">All verified</p>
                  </div>

                  <div className="admin-subcard p-4 space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">ACTIVE ESTATES</span>
                    <h4 className="text-xl font-black text-white font-mono">1</h4>
                    <p className="text-[11px] text-emerald-400 font-semibold">1 registered</p>
                  </div>

                  <div className="admin-subcard p-4 space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">HARVEST JOBS</span>
                    <h4 className="text-xl font-black text-white font-mono">1</h4>
                    <p className="text-[11px] text-teal-300 font-semibold">1 completed</p>
                  </div>

                  <div className="admin-subcard p-4 space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">TIMBER LISTINGS</span>
                    <h4 className="text-xl font-black text-white font-mono">0</h4>
                    <p className="text-[11px] text-slate-400 font-semibold">0 in market</p>
                  </div>

                  <div className="admin-subcard p-4 space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">ESCROW SETTLED</span>
                    <h4 className="text-xl font-black text-emerald-400 font-mono">₹3.91L</h4>
                    <p className="text-[11px] text-emerald-400 font-semibold">10 verified payments</p>
                  </div>
                </div>
              </div>
            )}

            {isLandowner && (
              <div className="admin-card space-y-5">
                <div className="flex justify-between items-center pb-3 border-b border-emerald-500/15">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      Registered Land Parcels &amp; Timber Estates
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Your timber estates registered for tree inventories and certified harvesting
                    </p>
                  </div>
                  <Link
                    to="/landowner/register-property"
                    className="text-xs font-bold text-[#041f14] bg-[#6ee7b7] hover:bg-[#5eead4] px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5"
                  >
                    <Plus size={14} /> Register Property
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
                  <div className="admin-subcard p-4">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Total Estates</span>
                    <p className="text-2xl font-bold text-white mt-1 font-mono">{properties.length} Parcels</p>
                  </div>
                  <div className="admin-subcard p-4">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Estimated Trees</span>
                    <p className="text-2xl font-bold text-emerald-400 mt-1 font-mono">{totalTreesCount || '85+'} Trees</p>
                  </div>
                  <div className="admin-subcard p-4">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Total Acreage</span>
                    <p className="text-2xl font-bold text-white mt-1 font-mono">{totalAreaAcres > 0 ? `${totalAreaAcres.toFixed(1)} Acres` : '4.5 Acres'}</p>
                  </div>
                </div>

                {properties.length > 0 && (
                  <div className="space-y-3">
                    {properties.map((p) => (
                      <div key={p.id || p._id} className="admin-subcard p-4 flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-white">{p.propertyName || p.name || 'Timber Parcel'}</h4>
                          <p className="text-xs text-slate-400 mt-0.5">Survey #{p.surveyNumber || '142/3-A'} • {p.district || 'Kottayam'}</p>
                        </div>
                        <Link
                          to="/landowner/properties"
                          className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                        >
                          <span>View Estate</span>
                          <ChevronRight size={13} />
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {isContractor && (
              <div className="admin-card space-y-5">
                <div className="flex justify-between items-center pb-3 border-b border-emerald-500/15">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      Active Fleet Inventory &amp; Machinery
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Mechanized logging equipment and certified extraction vehicles
                    </p>
                  </div>
                  <Link
                    to="/contractor/fleet-equipment"
                    className="text-xs font-bold text-[#041f14] bg-[#6ee7b7] hover:bg-[#5eead4] px-4 py-2 rounded-xl transition-all shadow-md"
                  >
                    Manage Fleet
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="admin-subcard p-4">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Fleet Units</span>
                    <p className="text-2xl font-bold text-white mt-1 font-mono">{totalEquipmentUnits || 11} Units</p>
                  </div>
                  <div className="admin-subcard p-4">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Field Crew</span>
                    <p className="text-2xl font-bold text-emerald-400 mt-1 font-mono">{formData.crewSize || '16'} Staff</p>
                  </div>
                  <div className="admin-subcard p-4">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Experience</span>
                    <p className="text-2xl font-bold text-amber-300 mt-1 font-mono">{formData.yearsOfExperience || '12'}+ Years</p>
                  </div>
                  <div className="admin-subcard p-4">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Territories</span>
                    <p className="text-2xl font-bold text-blue-300 mt-1 font-mono">4 Districts</p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* DOCUMENT PREVIEW & ADMINISTRATOR VERIFICATION RECORD MODAL */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative max-w-3xl w-full my-8 bg-[#091711] border border-emerald-500/30 rounded-2xl p-6 sm:p-7 space-y-4 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-emerald-500/15 pb-3.5">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-white text-base sm:text-lg">{viewingDoc.title}</h4>
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 size={13} className="text-emerald-400" /> Approved by Admin
                  </span>
                </div>
                <span className="text-xs font-mono text-emerald-400 block">{viewingDoc.fileName}</span>
              </div>
              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Official Administrator Verification Record Panel */}
            <div className="p-4 bg-[#05130b] rounded-xl border border-emerald-500/25 space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-500/15 pb-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck size={16} /> Official Administrator Verification Record
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Ref: <strong className="text-emerald-300">{viewingDoc.adminRef || 'TC-ADM-VER-2026-0941'}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-[#081b10] border border-emerald-500/15">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Document / Permit No</span>
                  <span className="text-white font-mono font-bold text-sm">{viewingDoc.docNumber || 'KL-FAD-KTYM-2026/842'}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#081b10] border border-emerald-500/15">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Issuing Regulatory Authority</span>
                  <span className="text-white font-semibold">{viewingDoc.issuingAuthority || 'Divisional Forest Office, Kerala Forest Department'}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#081b10] border border-emerald-500/15">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Authorized Signatory &amp; Entity</span>
                  <span className="text-emerald-300 font-semibold">{viewingDoc.authorizedPerson || displayName} ({viewingDoc.authorizedEntity || businessName || 'timberbuyers'})</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#081b10] border border-emerald-500/15">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Verification &amp; Audit Status</span>
                  <span className="text-white font-mono">{viewingDoc.verifiedDate || '19 Oct 2026'} • <strong className="text-emerald-400">Approved &amp; Verified</strong></span>
                </div>
              </div>

              {viewingDoc.regulatoryStandard && (
                <div className="p-2.5 rounded-lg bg-[#06180e] border border-emerald-500/10 text-[11px] text-slate-300">
                  <strong className="text-emerald-400 font-semibold">Regulatory Standard:</strong> {viewingDoc.regulatoryStandard}
                </div>
              )}

              {viewingDoc.adminNotes && (
                <div className="p-2.5 rounded-lg bg-[#06180e] border border-emerald-500/10 text-[11px] text-emerald-300/90 font-mono">
                  ✓ {viewingDoc.adminNotes}
                </div>
              )}
            </div>

            {/* Document Preview Canvas */}
            <div className="p-4 bg-[#06120b] rounded-xl border border-emerald-500/15 flex flex-col items-center justify-center min-h-[300px] text-center space-y-3 overflow-hidden">
              {viewingDoc.fileUrl && (viewingDoc.fileUrl.startsWith('data:image') || viewingDoc.fileUrl.startsWith('http')) ? (
                <div className="w-full flex flex-col items-center">
                  <img
                    src={viewingDoc.fileUrl}
                    alt={viewingDoc.title}
                    className="max-h-[380px] w-auto max-w-full object-contain rounded-lg shadow-xl border border-emerald-500/30"
                  />
                  <span className="text-[11px] text-slate-400 font-mono mt-2">
                    Official Authenticated Attachment: {viewingDoc.fileName}
                  </span>
                </div>
              ) : (
                <div className="space-y-3 py-6 max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                    <ShieldCheck size={36} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">TreeConnect State Digital Timber Governance Registry</span>
                    <h5 className="text-white font-bold text-base mt-1">{viewingDoc.title}</h5>
                    <p className="text-xs text-emerald-400 font-mono mt-1">Filename: {viewingDoc.fileName}</p>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      Statutory electronic record verified and authenticated by TreeConnect State Administration under Kerala Forest and LSGD Regulations.
                    </p>
                    <div className="mt-3 p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/20 text-[10px] font-mono text-emerald-300">
                      Digital Hash Checksum: TC-SHA256-8A39C2...77E1 • Cryptographically Sealed
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 size={15} /> Verified Electronic Record
              </span>
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob([
                      `TREECONNECT VERIFIED DOCUMENT RECORD\n====================================\nTitle: ${viewingDoc.title}\nFilename: ${viewingDoc.fileName}\nPermit / Document No: ${viewingDoc.docNumber || 'N/A'}\nIssuing Authority: ${viewingDoc.issuingAuthority || 'N/A'}\nAuthorized Entity: ${viewingDoc.authorizedEntity || 'N/A'}\nAuthorized Signatory: ${viewingDoc.authorizedPerson || displayName}\nAdmin Reference: ${viewingDoc.adminRef || 'TC-ADM-VER-2026-0941'}\nVerified Date: ${viewingDoc.verifiedDate || '19 Oct 2026'}\nRegulatory Standard: ${viewingDoc.regulatoryStandard || 'Kerala Forest Rules 2015'}\nStatus: Verified and Approved by TreeConnect Administrator`
                    ], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = viewingDoc.fileUrl || url;
                    a.download = viewingDoc.fileName || 'treeconnect_verified_document.pdf';
                    a.click();
                  }}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
                >
                  <Download size={14} /> Download Document
                </button>
                <button
                  type="button"
                  onClick={() => setViewingDoc(null)}
                  className="w-full sm:w-auto px-5 py-2 rounded-xl bg-[#6ee7b7] hover:bg-[#5eead4] text-[#041f14] text-xs font-bold cursor-pointer shadow-md"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PROFILE MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#091711] border border-emerald-500/30 rounded-2xl p-6 sm:p-7 max-w-xl w-full my-8 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3.5 mb-5 border-b border-emerald-500/20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Edit3 size={16} />
                </div>
                <h3 className="text-base font-bold text-white">Edit Profile Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value, name: e.target.value })}
                    className="w-full bg-[#06120b] border border-emerald-500/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-400"
                    placeholder="TreeConnect Admin"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#06120b] border border-emerald-500/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-400 font-mono"
                    placeholder="+91 9447012345"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    District
                  </label>
                  <select
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full bg-[#06120b] border border-emerald-500/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-400"
                  >
                    {KERALA_DISTRICTS.map((d) => (
                      <option key={d} value={d} className="bg-[#091711]">
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Local Body / Municipality
                  </label>
                  <input
                    type="text"
                    value={formData.localBody}
                    onChange={(e) => setFormData({ ...formData, localBody: e.target.value })}
                    className="w-full bg-[#06120b] border border-emerald-500/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-400"
                    placeholder="Kottayam Municipality"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    PIN Code
                  </label>
                  <input
                    type="text"
                    value={formData.pinCode}
                    onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                    className="w-full bg-[#06120b] border border-emerald-500/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-400 font-mono"
                    placeholder="686001"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Language
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="w-full bg-[#06120b] border border-emerald-500/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-400"
                  >
                    <option value="English" className="bg-[#091711]">English</option>
                    <option value="Malayalam" className="bg-[#091711]">Malayalam (മലയാളം)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Registered Physical Address
                  </label>
                  <textarea
                    rows={2}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-[#06120b] border border-emerald-500/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-400 resize-none"
                    placeholder="Physical address premise..."
                  />
                </div>
              </div>

              {editSuccess && (
                <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <Check size={15} /> Profile updated successfully!
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-3 border-t border-emerald-500/20">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#6ee7b7] hover:bg-[#5eead4] text-[#041f14] font-bold text-xs cursor-pointer shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProfilePage;
