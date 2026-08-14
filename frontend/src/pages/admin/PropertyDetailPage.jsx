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
            <div className="card p-6 bg-slate-950 border border-slate-800 rounded-2xl shadow-xl space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/80 pb-5">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1 rounded-lg text-xs font-extrabold uppercase bg-emerald-950 text-emerald-400 border border-emerald-800">
                      {property.status || 'Active Estate'}
                    </span>
                    <span className="px-3 py-1 rounded-lg text-xs font-bold bg-slate-900 text-slate-300 border border-slate-800 flex items-center gap-1">
                      <Building2 size={13} className="text-slate-400" />
                      {property.propertyType || 'Residential Property'}
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2.5">
                    {property.propertyName}
                  </h1>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                    <MapPin size={14} className="text-emerald-400" />
                    <span>
                      {property.district || 'Kottayam'}, {property.state || 'Kerala'} {property.pinCode ? `(PIN: ${property.pinCode})` : ''}
                    </span>
                  </p>
                </div>

                {property.totalArea && (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl px-5 py-3 text-right shrink-0">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Land Area</span>
                    <span className="text-xl font-black text-emerald-400 flex items-center gap-1 justify-end">
                      <Ruler size={18} />
                      {property.totalArea} {property.areaUnit || 'Acres'}
                    </span>
                  </div>
                )}
              </div>

              {/* Main Banner Image / Photo Gallery */}
              <div className="relative h-72 sm:h-96 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800">
                <img
                  src={property.image || property.photos?.[0] || 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80'}
                  alt={property.propertyName}
                  className="w-full h-full object-cover"
                />
                {property.createdAt && (
                  <div className="absolute bottom-4 left-4">
                    <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-950/90 text-slate-300 border border-slate-800 backdrop-blur-md flex items-center gap-1.5">
                      <Calendar size={13} className="text-emerald-400" />
                      Registered on {property.createdAt.split('T')[0]}
                    </span>
                  </div>
                )}
              </div>

              {/* Registered Landowner Card */}
              <div className="p-5 bg-slate-900/60 rounded-2xl border border-slate-800/80 space-y-3">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <User size={15} className="text-emerald-400" /> Registered Landowner Profile
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Owner Name</span>
                    <span className="font-bold text-white text-sm">{property.ownerName || 'Landowner'}</span>
                  </div>

                  <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Contact Email</span>
                    <span className="font-bold text-slate-200 truncate block">{property.userEmail || 'N/A'}</span>
                  </div>

                  <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Contact Phone</span>
                    <span className="font-bold text-slate-200">{property.contactNumber || 'N/A'}</span>
                  </div>
                </div>

                {property.userEmail && (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => navigate(`/admin/users/${encodeURIComponent(property.userEmail)}`)}
                      className="btn btn-xs bg-emerald-950 hover:bg-emerald-900 text-emerald-400 font-bold border border-emerald-800 px-3 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer text-xs"
                    >
                      <User size={13} /> View Full User Profile & Verification Status ↗
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Dedicated Location & Geographic Details Section */}
            <div className="card p-6 bg-slate-950 border border-slate-800 rounded-2xl shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <Compass className="text-emerald-400" size={20} /> Dedicated Property Location &amp; Geographic Details
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Complete address, local administration details, and GIS mapping coordinates added for site survey
                  </p>
                </div>

                {property.latitude && property.longitude && (
                  <a
                    href={`https://www.google.com/maps?q=${property.latitude},${property.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer text-xs shadow-lg transition-all"
                  >
                    <Navigation size={14} /> Open in Google Maps <ExternalLink size={12} />
                  </a>
                )}
              </div>

              {/* Structured Grid for Location Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                {/* 1. Address */}
                <div className="md:col-span-2 lg:col-span-3 p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    House / Plot Address
                  </span>
                  <p className="text-white font-bold text-sm leading-relaxed">
                    {property.address || `${property.village || ''}, ${property.district}, ${property.state}`}
                  </p>
                </div>

                {/* 2. Local Body */}
                <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
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
