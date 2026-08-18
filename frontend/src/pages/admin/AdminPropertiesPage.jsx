import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/admin/AdminLayout';
import propertyService from '../../services/propertyService';
import {
  Trees,
  Search,
  MapPin,
  Calendar,
  Phone,
  Mail,
  User,
  Database,
  Loader2,
  Eye,
  Building2,
  Ruler
} from 'lucide-react';

const AdminPropertiesPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');

  const fetchAllProperties = async () => {
    try {
      setLoading(true);
      const data = await propertyService.getProperties({ all_records: true });
      if (data && Array.isArray(data.properties)) {
        setProperties(data.properties);
      } else {
        setProperties([]);
      }
    } catch (err) {
      console.error('Error fetching all properties for admin:', err);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllProperties();
  }, []);

  const filteredProperties = properties.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.propertyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.ownerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.district?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.state?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.localBody?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.village?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.pinCode?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDistrict =
      districtFilter === 'all' || p.district?.toLowerCase() === districtFilter.toLowerCase();

    return matchesSearch && matchesDistrict;
  });

  const districtsList = Array.from(
    new Set(properties.map((p) => p.district).filter(Boolean))
  );

  return (
    <AdminLayout user={user} onLogout={logout}>
      <div className="space-y-6 pb-12">
        {/* Header Bar */}
        <section className="admin-card space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-800/80">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
                <Trees className="text-blue-400" size={24} />
                <span>Registered Landowner Properties</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Live database directory of all forest estates, plots, and land parcels registered by landowners
              </p>
            </div>
            <span className="admin-badge-blue text-xs font-bold flex items-center gap-1.5 shrink-0">
              {loading ? (
                <>
                  <Loader2 size={13} className="animate-spin" /> Fetching DB...
                </>
              ) : (
                <>
                  <Database size={13} /> {filteredProperties.length} Properties
                </>
              )}
            </span>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-4 pt-3 border-t border-slate-800/80">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                className="admin-select-filter"
              >
                <option value="all">All Districts</option>
                {districtsList.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-search-box flex-1 sm:max-w-md w-full">
              <Search size={16} className="admin-search-icon text-slate-500" />
              <input
                type="text"
                placeholder="Search by property, landowner, email, local body, village, PIN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="admin-search-input"
              />
            </div>
          </div>
        </section>

        {/* Registered Properties Grid / Cards */}
        {loading ? (
          <div className="p-16 text-center card bg-slate-950/80 rounded-2xl border border-slate-800">
            <Loader2 size={24} className="animate-spin text-emerald-400 mx-auto mb-2" />
            <p className="font-bold text-white text-sm">Loading Registered Properties...</p>
            <p className="text-xs text-slate-400 mt-1">Querying database for landowner & admin registrations</p>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="p-16 text-center card bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
            <Trees size={32} className="text-slate-600 mx-auto" />
            <h3 className="font-bold text-white text-base">No Registered Properties Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No registered landowner properties match your search or filter criteria. Newly registered properties will appear here live.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
            {filteredProperties.map((p) => (
              <div
                key={p.id || p._id}
                className="admin-card p-6 space-y-5 flex flex-col justify-between shadow-2xl transition-all hover:border-emerald-500/40"
              >
                <div className="space-y-4">
                  {/* Property Image & Status Badges */}
                  <div className="relative h-52 sm:h-56 rounded-2xl overflow-hidden bg-[#0a0f0d] border border-emerald-500/20 shadow-md">
                    <img
                      src={p.image || p.photos?.[0] || 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80'}
                      alt={p.propertyName}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1.5 rounded-xl text-xs font-extrabold uppercase bg-[#0a0f0d]/90 text-emerald-300 border border-emerald-500/40 backdrop-blur-md shadow-lg">
                        {p.status || 'Active Estate'}
                      </span>
                    </div>
                    {p.totalArea && (
                      <div className="absolute bottom-3 right-3">
                        <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#0a0f0d]/90 text-slate-200 border border-emerald-500/30 backdrop-blur-md flex items-center gap-1.5 shadow-lg">
                          <Ruler size={13} className="text-emerald-400" />
                          {p.totalArea} {p.areaUnit || 'Acres'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Title & Type */}
                  <div className="pb-1 border-b border-emerald-500/15">
                    <h3 className="text-xl font-extrabold text-white tracking-tight">
                      {p.propertyName}
                    </h3>
                    <p className="text-xs sm:text-sm text-emerald-400 font-semibold flex items-center gap-1.5 mt-1">
                      <Building2 size={14} className="text-emerald-400 shrink-0" />
                      <span>{p.propertyType || 'Residential / Forest Estate'}</span>
                    </p>
                  </div>

                  {/* Registered Owner Details Subcard */}
                  <div className="admin-subcard p-4 space-y-2 rounded-xl bg-[#0e1612] border border-emerald-500/15">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      REGISTERED LANDOWNER CONTACT
                    </span>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-sm font-bold text-white">
                        <User size={15} className="text-emerald-400 shrink-0" />
                        <span>{p.ownerName || 'Landowner'}</span>
                      </div>

                      {p.userEmail && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-300 font-medium">
                          <Mail size={14} className="text-slate-400 shrink-0" />
                          <span className="break-all">{p.userEmail}</span>
                        </div>
                      )}

                      {p.contactNumber && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-300 font-medium">
                          <Phone size={14} className="text-slate-400 shrink-0" />
                          <span>{p.contactNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Location & Boundary Details Subcard */}
                  <div className="admin-subcard p-4 space-y-2 rounded-xl bg-[#0e1612] border border-emerald-500/15">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      ESTATE LOCATION &amp; BOUNDARIES
                    </span>

                    <div className="flex items-start gap-2 text-xs sm:text-sm text-white font-semibold">
                      <MapPin size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="leading-relaxed">
                          {p.address || (p.village ? `${p.village}, ${p.district}` : `${p.district}, ${p.state}`)}
                        </p>
                        <p className="text-xs text-slate-400 font-medium mt-1">
                          {p.village ? `${p.village}, ` : ''}{p.district || 'Kottayam'}, {p.state || 'Kerala'} {p.pinCode ? `— PIN: ${p.pinCode}` : ''}
                        </p>
                        {p.localBody && (
                          <p className="text-xs text-emerald-300 font-medium mt-1">
                            🏛️ Local Body: {p.localBody}
                          </p>
                        )}
                        {p.latitude && p.longitude && (
                          <p className="text-xs font-mono text-emerald-400 font-medium mt-1">
                            📍 GPS Coords: {Number(p.latitude).toFixed(4)}, {Number(p.longitude).toFixed(4)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-4 border-t border-emerald-500/15 flex items-center justify-between flex-wrap gap-3">
                  <button
                    onClick={() => navigate(`/admin/properties/${p.id || p._id}`, { state: { property: p } })}
                    className="admin-btn-outline text-xs sm:text-sm font-bold py-2.5 px-4"
                  >
                    <Eye size={15} /> View Specs &amp; Location ↗
                  </button>

                  {p.userEmail && (
                    <button
                      onClick={() => navigate(`/admin/users/${encodeURIComponent(p.userEmail)}`)}
                      className="admin-btn-emerald text-xs sm:text-sm font-bold py-2.5 px-5"
                    >
                      <User size={15} /> Inspect Landowner
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </AdminLayout>
  );
};

export default AdminPropertiesPage;
