import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/admin/AdminLayout';
import propertyService from '../../services/propertyService';
import {
  ArrowLeft,
  Trees,
  MapPin,
  Calendar,
  Phone,
  Mail,
  User,
  Building2,
  Ruler,
  ExternalLink,
  Loader2,
  Compass,
  FileText,
  CheckCircle2,
  Globe,
  Navigation,
  Layers,
  ShieldCheck
} from 'lucide-react';

const PropertyDetailPage = () => {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const initialProperty = location.state?.property || null;
  const [property, setProperty] = useState(initialProperty);
  const [loading, setLoading] = useState(!initialProperty);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProperty = async () => {
      if (!propertyId) return;
      try {
        if (!initialProperty) setLoading(true);
        const data = await propertyService.getPropertyById(propertyId);
        if (data && data.property) {
          setProperty(data.property);
        } else {
          setError('Property not found.');
        }
      } catch (err) {
        console.error('Error loading property detail page:', err);
        if (!property) {
          setError('Failed to fetch property details from database.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [propertyId]);

  return (
    <AdminLayout user={user} onLogout={logout}>
      <div className="space-y-6 pb-12 max-w-5xl mx-auto">
        {/* Back Button Bar */}
        <div>
          <button
            onClick={() => navigate('/admin/properties')}
            className="btn btn-secondary btn-sm flex items-center gap-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all"
          >
            <ArrowLeft size={16} /> Back to Registered Properties
          </button>
        </div>

        {loading ? (
          <div className="p-16 text-center card bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
            <Loader2 size={28} className="animate-spin text-emerald-400 mx-auto" />
            <p className="font-bold text-white text-sm">Loading Property Details & GIS Data...</p>
            <p className="text-xs text-slate-400">Fetching location records from TreeConnect database</p>
          </div>
        ) : error || !property ? (
          <div className="p-16 text-center card bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
            <Trees size={36} className="text-red-400 mx-auto" />
            <h3 className="font-bold text-white text-base">Property Details Unavailable</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">{error || 'Unable to locate property specs.'}</p>
            <button
              onClick={() => navigate('/admin/properties')}
              className="btn btn-sm bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded-xl"
            >
              Return to Properties Directory
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Banner & Title Card */}
            <div className="admin-card admin-hero-card p-6 sm:p-8 space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-emerald-500/15 pb-5">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="admin-badge-emerald text-xs font-extrabold uppercase">
                      {property.status || 'Active Estate'}
                    </span>
                    <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#0e1612] text-slate-200 border border-emerald-500/20 flex items-center gap-1.5">
                      <Building2 size={14} className="text-emerald-400" />
                      {property.propertyType || 'Residential Property'}
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-3">
                    {property.propertyName}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-300 flex items-center gap-1.5 mt-1 font-medium">
                    <MapPin size={15} className="text-emerald-400" />
                    <span>
                      {property.district || 'Kottayam'}, {property.state || 'Kerala'} {property.pinCode ? `(PIN: ${property.pinCode})` : ''}
                    </span>
                  </p>
                </div>

                {property.totalArea && (
                  <div className="bg-[#0e1612] border border-emerald-500/25 rounded-2xl px-6 py-3.5 text-right shrink-0 shadow-md">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Land Area</span>
                    <span className="text-2xl font-black text-emerald-400 flex items-center gap-1.5 justify-end mt-0.5">
                      <Ruler size={20} />
                      {property.totalArea} {property.areaUnit || 'Acres'}
                    </span>
                  </div>
                )}
              </div>

              {/* Main Banner Image / Photo Gallery */}
              <div className="relative h-72 sm:h-96 rounded-2xl overflow-hidden bg-[#0a0f0d] border border-emerald-500/20 shadow-2xl">
                {(() => {
                  const realImg = [property.image, ...(property.photos || [])].find(img => typeof img === 'string' && img.trim().length > 5 && !img.includes('unsplash.com'));
                  return realImg ? (
                    <img
                      src={realImg}
                      alt={property.propertyName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#060d08] text-slate-500 p-4 text-center">
                      <Trees size={48} className="text-emerald-500/30 mb-2" />
                      <span className="text-sm font-bold text-slate-300">No Photo Uploaded</span>
                    </div>
                  );
                })()}
                {property.createdAt && (
                  <div className="absolute bottom-4 left-4">
                    <span className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#0a0f0d]/90 text-slate-200 border border-emerald-500/30 backdrop-blur-md flex items-center gap-2 shadow-lg">
                      <Calendar size={14} className="text-emerald-400" />
                      Registered on {property.createdAt.split('T')[0]}
                    </span>
                  </div>
                )}
              </div>

              {/* Registered Landowner Profile Card */}
              <div className="admin-subcard p-6 space-y-4 bg-[#0e1612] border border-emerald-500/20">
                <h3 className="text-xs font-bold uppercase text-slate-300 tracking-wider flex items-center gap-2">
                  <User size={16} className="text-emerald-400" /> Registered Landowner Profile
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="p-4 bg-[#0a0f0d] rounded-xl border border-emerald-500/15">
                    <span className="text-[11px] text-slate-400 font-bold uppercase block mb-1">Owner Name</span>
                    <span className="font-bold text-white text-base block">{property.ownerName || 'Landowner'}</span>
                  </div>

                  <div className="p-4 bg-[#0a0f0d] rounded-xl border border-emerald-500/15">
                    <span className="text-[11px] text-slate-400 font-bold uppercase block mb-1">Contact Email</span>
                    <span className="font-bold text-slate-200 text-sm break-all block">{property.userEmail || 'N/A'}</span>
                  </div>

                  <div className="p-4 bg-[#0a0f0d] rounded-xl border border-emerald-500/15">
                    <span className="text-[11px] text-slate-400 font-bold uppercase block mb-1">Contact Phone</span>
                    <span className="font-bold text-slate-200 text-sm block">{property.contactNumber || 'N/A'}</span>
                  </div>
                </div>

                {property.userEmail && (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => navigate(`/admin/users/${encodeURIComponent(property.userEmail)}`)}
                      className="admin-btn-emerald text-xs sm:text-sm font-bold py-2.5 px-5"
                    >
                      <User size={15} /> View Full User Profile &amp; Verification Status ↗
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Dedicated Location & Geographic Details Section */}
            <div className="admin-card p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-emerald-500/15 pb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
                    <Compass className="text-emerald-400" size={22} /> Dedicated Property Location &amp; Geographic Details
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1">
                    Complete address, local administration details, and GIS mapping coordinates added for site survey
                  </p>
                </div>

                {property.latitude && property.longitude && (
                  <a
                    href={`https://www.google.com/maps?q=${property.latitude},${property.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="admin-btn-emerald text-xs sm:text-sm font-bold py-2.5 px-5 shrink-0"
                  >
                    <Navigation size={15} /> Open in Google Maps <ExternalLink size={13} />
                  </a>
                )}
              </div>

              {/* Structured Grid for Location Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* 1. Address */}
                <div className="md:col-span-2 lg:col-span-3 admin-subcard p-5 space-y-1">
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
                    House / Plot Address
                  </span>
                  <p className="text-white font-bold text-base leading-relaxed">
                    {property.address || `${property.village || ''}, ${property.district}, ${property.state}`}
                  </p>
                </div>

                {/* 2. Local Body */}
                <div className="admin-subcard p-5 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Local Body (Panchayat / Municipality)
                  </span>
                  <p className="text-slate-200 font-bold text-xs flex items-center gap-1.5">
                    <span className="text-emerald-400 text-base">🏛️</span> {property.localBody || 'N/A'}
                  </p>
                </div>

                {/* 3. Village / Town */}
                <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Village / Town / Taluk
                  </span>
                  <p className="text-slate-200 font-bold text-xs flex items-center gap-1.5">
                    <span className="text-emerald-400 text-base">🏡</span> {property.village || 'N/A'}
                  </p>
                </div>

                {/* 4. PIN Code */}
                <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    PIN / Postal Code
                  </span>
                  <p className="text-slate-200 font-bold text-xs flex items-center gap-1.5">
                    <span className="text-emerald-400 text-base">📮</span> {property.pinCode || 'N/A'}
                  </p>
                </div>

                {/* 5. District */}
                <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    District
                  </span>
                  <p className="text-slate-200 font-bold text-xs flex items-center gap-1.5">
                    <MapPin size={14} className="text-emerald-400" /> {property.district || 'Kottayam'}
                  </p>
                </div>

                {/* 6. State */}
                <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    State / Region
                  </span>
                  <p className="text-slate-200 font-bold text-xs flex items-center gap-1.5">
                    <Globe size={14} className="text-emerald-400" /> {property.state || 'Kerala'}
                  </p>
                </div>

                {/* 7. GIS Coordinates */}
                <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    GIS Location Coordinates
                  </span>
                  <p className="text-emerald-400 font-mono font-bold text-xs flex items-center gap-1.5">
                    <Navigation size={14} className="text-emerald-400" />
                    {property.latitude && property.longitude
                      ? `${property.latitude}, ${property.longitude}`
                      : 'Not Pinned'}
                  </p>
                </div>
              </div>

              {/* GIS Map Coordinates Banner */}
              {property.latitude && property.longitude && (
                <div className="p-4 bg-emerald-950/40 border border-emerald-800/80 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck size={20} className="text-emerald-400 shrink-0" />
                    <div>
                      <p className="font-extrabold text-emerald-300 text-xs">Verified GIS GPS Location Pinned</p>
                      <p className="text-[11px] text-slate-400">
                        Latitude: {property.latitude} • Longitude: {property.longitude}
                      </p>
                    </div>
                  </div>
                  <a
                    href={`https://www.google.com/maps?q=${property.latitude},${property.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 underline flex items-center gap-1"
                  >
                    View satellite map on Google Maps ↗
                  </a>
                </div>
              )}
            </div>

            {/* Description & Additional Info */}
            {property.description && (
              <div className="card p-6 bg-slate-950 border border-slate-800 rounded-2xl shadow-xl space-y-3">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <FileText size={15} className="text-emerald-400" /> Land Description &amp; Timber Details
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                  {property.description}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default PropertyDetailPage;
