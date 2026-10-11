import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { getStoredFleet } from '../utils/fleetStorage';
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
  Globe,
  Clock,
  Sparkles,
  Save,
  ShieldCheck
} from 'lucide-react';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(user || {});
  const [isUploading, setIsUploading] = useState(false);
  const [fleetList, setFleetList] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);
  const fileInputRef = useRef(null);

  // Edit form state
  const [formData, setFormData] = useState({
    name: '',
    fullName: '',
    phone: '',
    gstNumber: '',
    businessType: '',
    address: '',
    district: '',
    state: 'Kerala',
    pinCode: '',
    bio: '',
    experienceYears: '12',
    crewSize: '16',
    operatingDistricts: 'Kottayam, Idukki, Ernakulam, Pathanamthitta'
  });

  useEffect(() => {
    // Load fleet summary
    setFleetList(getStoredFleet());

    const handleFleetChange = (e) => {
      if (e.detail) {
        setFleetList(Array.isArray(e.detail) ? e.detail : e.detail.fleet || []);
      }
    };
    window.addEventListener('treeconnect_fleet_updated', handleFleetChange);
    return () => window.removeEventListener('treeconnect_fleet_updated', handleFleetChange);
  }, []);

  useEffect(() => {
    if (user?.email) {
      authService.getUserProfile(user.email).then(data => {
        if (data) {
          setProfile(data);
          syncFormData(data);
        }
      });
    } else if (user) {
      setProfile(user);
      syncFormData(user);
    }
  }, [user]);

  const syncFormData = (data) => {
    const isLandowner = data.role === 'landowner';
    setFormData({
      name: data.name || '',
      fullName: data.fullName || data.name || '',
      phone: data.phone || '',
      gstNumber: data.gstNumber || '',
      businessType: data.businessType || (isLandowner ? 'Private Timberland & Plantation Owner' : 'Logging & Timber Extraction Contractor'),
      address: data.address || '',
      district: data.district || 'Kottayam',
      state: data.state || 'Kerala',
      pinCode: data.pinCode || data.postalCode || '686001',
      bio: data.bio || (isLandowner 
        ? 'Private landowner managing verified timber plantations and commercial forest parcels in central Kerala.'
        : 'Professional forestry and timber extraction enterprise providing mechanized logging, roundwood harvesting, and sustainable land clearing across central Kerala.'),
      experienceYears: data.experienceYears || '12',
      crewSize: data.crewSize || '16',
      operatingDistricts: data.operatingDistricts || 'Kottayam, Idukki, Ernakulam, Pathanamthitta'
    });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Avatar = event.target.result;
        const updatedProfile = { ...profile, avatar: base64Avatar };
        setProfile(updatedProfile);
        if (updateUser) updateUser({ avatar: base64Avatar });

        // Update stored registered users
        const stored = localStorage.getItem('treeconnect_registered_users');
        if (stored) {
          try {
            const users = JSON.parse(stored);
            const emailKey = profile.email?.trim().toLowerCase();
            if (users[emailKey]) {
              users[emailKey].avatar = base64Avatar;
              localStorage.setItem('treeconnect_registered_users', JSON.stringify(users));
            }
          } catch (err) {
            console.error('Error updating users:', err);
          }
        }
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const updated = {
      ...profile,
      name: formData.name || formData.fullName,
      fullName: formData.fullName,
      phone: formData.phone,
      gstNumber: formData.gstNumber,
      businessType: formData.businessType,
      address: formData.address,
      district: formData.district,
      state: formData.state,
      pinCode: formData.pinCode,
      postalCode: formData.pinCode,
      bio: formData.bio,
      experienceYears: formData.experienceYears,
      crewSize: formData.crewSize,
      operatingDistricts: formData.operatingDistricts
    };

    setProfile(updated);
    if (updateUser) updateUser(updated);

    // Save to localStorage registered users
    const stored = localStorage.getItem('treeconnect_registered_users');
    if (stored) {
      try {
        const users = JSON.parse(stored);
        const emailKey = profile.email?.trim().toLowerCase();
        if (users[emailKey]) {
          users[emailKey] = { ...users[emailKey], ...updated };
          localStorage.setItem('treeconnect_registered_users', JSON.stringify(users));
        }
      } catch (err) {
        console.error('Failed to sync profile update:', err);
      }
    }

    setEditSuccess(true);
    setTimeout(() => {
      setEditSuccess(false);
      setShowEditModal(false);
    }, 1200);
  };

  const displayName = profile?.fullName || profile?.name || user?.name || 'Rohith Kumar';
  const roleName = profile?.role || user?.role || 'contractor';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'TC';

  const totalEquipmentUnits = fleetList.reduce((acc, f) => acc + Math.max(1, parseInt(f.quantity, 10) || 1), 0);
  const operationalCount = fleetList
    .filter(f => f.status === 'In Use' || f.status === 'In Operation' || f.status === 'Active')
    .reduce((acc, f) => acc + Math.max(1, parseInt(f.quantity, 10) || 1), 0);
  const maintenanceCount = fleetList
    .filter(f => f.status === 'Under Maintenance' || f.status === 'Maintenance')
    .reduce((acc, f) => acc + Math.max(1, parseInt(f.quantity, 10) || 1), 0);
  const availableCount = fleetList
    .filter(f => f.status === 'Available' || !f.status)
    .reduce((acc, f) => acc + Math.max(1, parseInt(f.quantity, 10) || 1), 0);

  const getRoleBadgeLabel = (role) => {
    switch (role?.toLowerCase()) {
      case 'landowner':
        return 'Landowner';
      case 'contractor':
        return 'Harvesting Contractor';
      case 'buyer':
        return 'Commercial Buyer';
      case 'admin':
        return 'Platform Admin';
      default:
        return 'Partner';
    }
  };

  const getRoleBadgeClasses = (role) => {
    switch (role?.toLowerCase()) {
      case 'landowner':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'contractor':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'buyer':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      default:
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    }
  };

  const districtsCount = formData.operatingDistricts
    ? formData.operatingDistricts.split(',').filter(d => d.trim().length > 0).length
    : 4;

  return (
    <div className="min-h-screen bg-[#060c08] text-[#F5F7F5] selection:bg-emerald-500/30 selection:text-white pb-16">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full min-w-0">
        
        {/* 1. Profile Hero Section */}
        <div className="rounded-2xl bg-[#0a1a12] border border-emerald-500/20 p-6 sm:p-8 mb-8 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 w-full min-w-0">
            
            {/* Left: Avatar & Identity Details */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 w-full md:w-auto min-w-0 text-center sm:text-left">
              
              {/* Profile Photo Area */}
              <div className="relative group shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 border-emerald-500/30 bg-[#06120b] shadow-lg overflow-hidden flex items-center justify-center relative transition-all group-hover:border-emerald-400">
                  {profile?.avatar ? (
                    <img
                      src={profile.avatar}
                      alt={displayName}
                      className={`w-full h-full object-cover transition-opacity ${isUploading ? 'opacity-40' : 'opacity-100'}`}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0c2619] to-[#06130c]">
                      <span className="text-3xl sm:text-4xl font-extrabold text-emerald-400">
                        {initials}
                      </span>
                      <span className="text-[10px] tracking-widest text-emerald-500/70 font-semibold uppercase mt-0.5">
                        {roleName}
                      </span>
                    </div>
                  )}

                  {/* Photo Upload Overlay */}
                  <div
                    className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-20"
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload profile photo"
                  >
                    <Upload size={20} className="text-emerald-400 mb-1" />
                    <span className="text-[10px] font-bold text-white tracking-wide">Upload Photo</span>
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

              {/* Name, Role & Contact Info */}
              <div className="flex flex-col gap-1.5 min-w-0">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight break-words">
                    {displayName}
                  </h1>
                  <span className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${getRoleBadgeClasses(roleName)}`}>
                    {getRoleBadgeLabel(roleName)}
                  </span>
                </div>

                <p className="text-sm text-slate-300 break-words leading-relaxed max-w-xl">
                  {formData.businessType || 'Licensed Timber Harvesting & Mechanized Logging Agency'}
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-5 gap-y-2 mt-2 text-xs sm:text-sm text-slate-400">
                  <span className="inline-flex items-center gap-1.5 break-all">
                    <Mail size={14} className="text-emerald-400 shrink-0" />
                    {profile?.email || user?.email}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Phone size={14} className="text-emerald-400 shrink-0" />
                    {formData.phone || profile?.phone || '9746512243'}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={14} className="text-emerald-400 shrink-0" />
                    {formData.district}, {formData.state}
                  </span>
                </div>
              </div>

            </div>

            {/* Right: Edit Profile Action Button */}
            <div className="shrink-0 w-full sm:w-auto flex justify-center sm:justify-end">
              <button
                type="button"
                onClick={() => setShowEditModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-md transition-all cursor-pointer active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                <Edit3 size={16} />
                <span>Edit Profile</span>
              </button>
            </div>

          </div>
        </div>

        {/* 2. Four Statistics Cards (Responsive Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 w-full min-w-0">
          
          {/* Card 1: Fleet Units (Green Accent) */}
          <div className="bg-[#0a1a12] border border-emerald-500/20 rounded-2xl p-5 shadow-lg flex items-center gap-4 hover:border-emerald-500/35 transition-all min-w-0">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
              <Truck size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fleet Units</p>
              <h3 className="text-2xl font-black text-white font-mono mt-0.5 truncate">{fleetList.length} Units</h3>
              <p className="text-xs text-emerald-400 font-semibold truncate">{operationalCount} Operational</p>
            </div>
          </div>

          {/* Card 2: Field Crew (Teal Accent) */}
          <div className="bg-[#0a1a12] border border-teal-500/20 rounded-2xl p-5 shadow-lg flex items-center gap-4 hover:border-teal-500/35 transition-all min-w-0">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/25 flex items-center justify-center text-teal-400 shrink-0">
              <Users size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Field Crew</p>
              <h3 className="text-2xl font-black text-white font-mono mt-0.5 truncate">{formData.crewSize} Staff</h3>
              <p className="text-xs text-teal-400 font-semibold truncate">Certified Specialists</p>
            </div>
          </div>

          {/* Card 3: Experience (Amber Accent) */}
          <div className="bg-[#0a1a12] border border-amber-500/20 rounded-2xl p-5 shadow-lg flex items-center gap-4 hover:border-amber-500/35 transition-all min-w-0">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0">
              <Award size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Experience</p>
              <h3 className="text-2xl font-black text-white font-mono mt-0.5 truncate">{formData.experienceYears}+ Years</h3>
              <p className="text-xs text-amber-400 font-semibold truncate">Forestry Operations</p>
            </div>
          </div>

          {/* Card 4: Territories (Blue Accent) */}
          <div className="bg-[#0a1a12] border border-blue-500/20 rounded-2xl p-5 shadow-lg flex items-center gap-4 hover:border-blue-500/35 transition-all min-w-0">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 shrink-0">
              <Globe size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Territories</p>
              <h3 className="text-2xl font-black text-white font-mono mt-0.5 truncate">{districtsCount} Districts</h3>
              <p className="text-xs text-blue-400 font-semibold truncate">Central Kerala Zone</p>
            </div>
          </div>

        </div>

        {/* 3. Main Page Two-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start w-full min-w-0">
          
          {/* Left Column (~67% on Desktop): Business Credentials & Specializations */}
          <div className="lg:col-span-8 min-w-0 space-y-6 lg:space-y-8 w-full">
            
            {/* Card: Business Registration & Credentials */}
            <div className="rounded-2xl bg-[#0a1a12] border border-emerald-500/20 p-6 sm:p-7 shadow-xl min-w-0">
              <div className="flex items-center gap-3 pb-4 mb-5 border-b border-emerald-500/15">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <FileText size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">Business Registration &amp; Credentials</h2>
                  <p className="text-xs text-slate-400">Official enterprise identity and operational tax documentation</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                
                {/* Full Legal Entity Name */}
                <div className="p-4 rounded-xl bg-[#05130b] border border-emerald-500/15 min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
                    <User size={13} className="text-emerald-400 shrink-0" /> Full Legal Entity Name
                  </span>
                  <p className="text-sm font-bold text-white break-words">{formData.fullName || displayName}</p>
                </div>

                {/* Commercial Designation */}
                <div className="p-4 rounded-xl bg-[#05130b] border border-emerald-500/15 min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
                    <Briefcase size={13} className="text-emerald-400 shrink-0" /> Commercial Designation
                  </span>
                  <p className="text-sm font-bold text-white break-words">{formData.businessType || 'Contractor'}</p>
                </div>

                {/* Primary Contact Number */}
                <div className="p-4 rounded-xl bg-[#05130b] border border-emerald-500/15 min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
                    <Phone size={13} className="text-emerald-400 shrink-0" /> Primary Contact Number
                  </span>
                  <p className="text-sm font-bold text-white break-words">{formData.phone || '9746512243'}</p>
                </div>

                {/* GST / Trade Tax Number */}
                <div className="p-4 rounded-xl bg-[#05130b] border border-emerald-500/15 min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
                    <FileText size={13} className="text-emerald-400 shrink-0" /> GST / Trade Tax Number
                  </span>
                  <p className="text-sm font-mono font-bold text-emerald-300 break-all">
                    {formData.gstNumber || '32AABCR4589K1Z5'}
                  </p>
                </div>

                {/* Registered Depot & Office Address (Full width) */}
                <div className="sm:col-span-2 p-4 rounded-xl bg-[#05130b] border border-emerald-500/15 min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
                    <MapPin size={13} className="text-emerald-400 shrink-0" /> Registered Depot &amp; Office Address
                  </span>
                  <p className="text-sm font-semibold text-white break-words">
                    {formData.address || 'TreeConnect Central Yard, NH 183 Bypass'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {formData.district}, {formData.state} — PIN {formData.pinCode}
                  </p>
                </div>

              </div>
            </div>

            {/* Card: Operational Scope & Specialization */}
            <div className="rounded-2xl bg-[#0a1a12] border border-emerald-500/20 p-6 sm:p-7 shadow-xl min-w-0">
              <div className="flex items-center gap-3 pb-4 mb-5 border-b border-emerald-500/15">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">Operational Scope &amp; Specialization</h2>
                  <p className="text-xs text-slate-400">Regional coverage, certified methodology, and field equipment scope</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Description */}
                <div className="p-4 rounded-xl bg-[#05130b] border border-emerald-500/15 text-sm text-slate-300 leading-relaxed break-words">
                  {formData.bio}
                </div>

                {/* Responsive 2-column for Districts and Capabilities */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  
                  {/* Authorized Districts */}
                  <div className="p-4 rounded-xl bg-[#05130b] border border-emerald-500/15 min-w-0">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
                      Authorized Districts
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {formData.operatingDistricts.split(',').map((district, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-semibold break-words"
                        >
                          {district.trim()}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Contractor Capabilities */}
                  <div className="p-4 rounded-xl bg-[#05130b] border border-emerald-500/15 min-w-0">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
                      Contractor Capabilities
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {['Mechanized Felling', 'Hydraulic Loading', 'Hill-Slope Extraction', 'Timber Haulage'].map((cap, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg bg-teal-500/10 border border-teal-500/25 text-teal-300 text-xs font-semibold break-words"
                        >
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>

          {/* Right Column (~33% on Desktop): Active Fleet Inventory & Platform Badge */}
          <div className="lg:col-span-4 min-w-0 space-y-6 lg:space-y-8 w-full">
            
            {/* Active Fleet Inventory Card */}
            <div className="rounded-2xl bg-[#0a1a12] border border-emerald-500/20 p-5 sm:p-6 shadow-xl min-w-0">
              <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-emerald-500/15">
                <div className="flex items-center gap-2">
                  <Truck size={17} className="text-emerald-400" />
                  <h3 className="text-base font-bold text-white">Active Fleet Inventory</h3>
                </div>
                <span className="text-xs text-emerald-400 font-bold font-mono">
                  {totalEquipmentUnits} Units ({fleetList.length} Types)
                </span>
              </div>

              <div className="space-y-2.5">
                {fleetList.length === 0 ? (
                  <div className="py-6 text-center text-slate-400">
                    <Truck size={28} className="text-emerald-500/30 mx-auto mb-2" />
                    <p className="text-xs font-medium text-slate-300">No machinery registered yet.</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Register equipment in Fleet &amp; Equipment.</p>
                  </div>
                ) : (
                  fleetList.slice(0, 5).map((unit) => {
                    const qty = Math.max(1, parseInt(unit.quantity, 10) || 1);
                    const tag = unit.regNumber || unit.reg_number || unit.assetTag;
                    const st = unit.status || 'Available';
                    const isAvail = st === 'Available';
                    const isInUse = st === 'In Use' || st === 'In Operation' || st === 'Active';
                    const isMaint = st === 'Under Maintenance' || st === 'Maintenance';

                    return (
                      <div
                        key={unit.id}
                        className="p-3 rounded-xl bg-[#05130b] border border-emerald-500/15 flex items-center justify-between gap-3 min-w-0"
                      >
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{unit.name || unit.model}</h4>
                          <p className="text-[11px] text-slate-400 truncate">
                            {unit.category || 'Machinery'} {tag ? `• Tag: ${tag}` : ''} • {qty} {qty === 1 ? 'Unit' : 'Units'}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            isAvail
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : isInUse
                                ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                                : isMaint
                                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                  : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                          }`}
                        >
                          {st}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="mt-4 pt-3.5 border-t border-emerald-500/15 flex items-center justify-between text-xs text-slate-400">
                <span>Available: <strong className="text-emerald-400">{availableCount}</strong></span>
                <span>In Use: <strong className="text-cyan-400">{operationalCount}</strong></span>
                <span>Maintenance: <strong className="text-amber-400">{maintenanceCount}</strong></span>
              </div>
            </div>

            {/* Platform Membership Card */}
            <div className="rounded-2xl bg-[#0a1a12] border border-emerald-500/20 p-5 sm:p-6 shadow-xl relative overflow-hidden min-w-0">
              <div className="flex items-center gap-2 text-emerald-400 mb-2">
                <ShieldCheck size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Member Verification</span>
              </div>
              <h4 className="text-base font-bold text-white tracking-tight">TreeConnect Verified Registry</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Registered platform partner authorized for digitized timber harvesting operations, transparent escrow settlements, and verified field compliance.
              </p>

              <div className="mt-4 pt-3.5 border-t border-emerald-500/15 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Standard SLA</span>
                <span className="font-bold text-emerald-400">24h Dispatch Window</span>
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0a1b12] border border-emerald-500/30 rounded-2xl p-6 sm:p-8 max-w-2xl w-full my-8 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-emerald-500/20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Edit3 size={16} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Edit Profile Details</h3>
                  <p className="text-xs text-slate-400">Update company credentials and operational details</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                aria-label="Close modal"
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value, name: e.target.value })}
                    className="w-full bg-[#040e08] border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30"
                    placeholder="Rohith Kumar"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#040e08] border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30"
                    placeholder="9746512243"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    GST / Trade Tax Number
                  </label>
                  <input
                    type="text"
                    value={formData.gstNumber}
                    onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                    className="w-full bg-[#040e08] border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30 font-mono"
                    placeholder="32AABCR4589K1Z5"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Commercial Designation
                  </label>
                  <input
                    type="text"
                    value={formData.businessType}
                    onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                    className="w-full bg-[#040e08] border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30"
                    placeholder="Timber Extraction & Logging"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Depot &amp; Office Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-[#040e08] border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30"
                    placeholder="Main Depot, NH 183 Bypass, Kottayam"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    District
                  </label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full bg-[#040e08] border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30"
                    placeholder="Kottayam"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Postal PIN Code
                  </label>
                  <input
                    type="text"
                    value={formData.pinCode}
                    onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                    className="w-full bg-[#040e08] border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30"
                    placeholder="686001"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Authorized Coverage Districts (Comma-Separated)
                  </label>
                  <input
                    type="text"
                    value={formData.operatingDistricts}
                    onChange={(e) => setFormData({ ...formData, operatingDistricts: e.target.value })}
                    className="w-full bg-[#040e08] border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30"
                    placeholder="Kottayam, Idukki, Ernakulam, Pathanamthitta"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Enterprise Description / Bio
                  </label>
                  <textarea
                    rows={3}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full bg-[#040e08] border border-emerald-500/30 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30"
                    placeholder="Describe your capabilities and forestry background..."
                  />
                </div>
              </div>

              {editSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <Check size={16} /> Profile credentials updated successfully!
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-emerald-500/20">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 text-sm font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-md cursor-pointer transition active:scale-95"
                >
                  <Save size={16} />
                  <span>Save Changes</span>
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
