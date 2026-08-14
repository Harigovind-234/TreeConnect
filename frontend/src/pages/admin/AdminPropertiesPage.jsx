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
        {/* Header Section */}
        <section className="dashboard-section card">
          <div className="card-header pb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="section-heading flex items-center gap-2.5">
                <Trees className="text-emerald-400" size={22} />
                <span>Registered Landowner Properties</span>
              </h1>
              <p className="section-subtext">
                Live database directory of all forest estates, plots, and land parcels registered by landowners
              </p>
            </div>
            <span className="status-pill status-green font-bold flex items-center gap-1.5">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProperties.map((p) => (
              <div
                key={p.id || p._id}
                className="card p-5 bg-slate-950/90 border border-slate-800 hover:border-emerald-500/50 transition-all rounded-2xl space-y-4 shadow-xl flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Property Image & Badge */}
                  <div className="relative h-44 rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
                    <img
                      src={p.image || p.photos?.[0] || 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80'}
                      alt={p.propertyName}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2.5 left-2.5">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase bg-slate-950/90 text-emerald-400 border border-emerald-800/80 backdrop-blur-md">
                        {p.status || 'Active Estate'}
                      </span>
                    </div>
                    {p.totalArea && (
                      <div className="absolute bottom-2.5 right-2.5">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-950/90 text-slate-300 border border-slate-800 backdrop-blur-md flex items-center gap-1">
                          <Ruler size={11} className="text-emerald-400" />
                          {p.totalArea} {p.areaUnit || 'Acres'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Title & Type */}
                  <div>
                    <h3 className="text-base font-extrabold text-white tracking-tight">
                      {p.propertyName}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                      <Building2 size={12} className="text-slate-500" />
                      <span>{p.propertyType || 'Residential / Forest Estate'}</span>
                    </p>
                  </div>

                  {/* Landowner Info */}
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 text-[11px] font-semibold flex items-center gap-1">
                        <User size={12} className="text-slate-500" /> Registered Owner
                      </span>
                      <span className="font-bold text-white">{p.ownerName || 'Landowner'}</span>
                    </div>

                    {p.userEmail && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 text-[11px] font-semibold flex items-center gap-1">
                          <Mail size={12} className="text-slate-500" /> Email
                        </span>
                        <span className="font-bold text-slate-300 truncate max-w-[160px]">{p.userEmail}</span>
                      </div>
                    )}

                    {p.contactNumber && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 text-[11px] font-semibold flex items-center gap-1">
                          <Phone size={12} className="text-slate-500" /> Phone
                        </span>
                        <span className="font-bold text-slate-300">{p.contactNumber}</span>
                      </div>
                    )}
                  </div>

                  {/* Complete Location Details Section */}
                  <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800/60 space-y-2 text-xs">
                    <div className="flex items-start gap-1.5 text-slate-300">
                      <MapPin size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <p className="font-bold text-white text-[12px]">
                          {p.address || (p.village ? `${p.village}, ${p.district}` : `${p.district}, ${p.state}`)}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {p.village ? `${p.village}, ` : ''}{p.district || 'Kottayam'}, {p.state || 'Kerala'} {p.pinCode ? `- ${p.pinCode}` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Additional Location Pills */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
                      {p.localBody && (
                        <span className="px-2 py-0.5 rounded bg-slate-900 text-emerald-300 border border-slate-800 font-medium">
                          🏛️ {p.localBody}
                        </span>
                      )}
                      {p.village && (
                        <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 font-medium">
                          🏡 {p.village}
                        </span>
                      )}
                      {p.pinCode && (
                        <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 font-medium">
                          📮 PIN: {p.pinCode}
                        </span>
                      )}
                      {p.latitude && p.longitude && (
                        <span className="px-2 py-0.5 rounded bg-slate-900 text-emerald-400 border border-slate-800 font-mono">
                          📍 {Number(p.latitude).toFixed(3)}, {Number(p.longitude).toFixed(3)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => navigate(`/admin/properties/${p.id || p._id}`, { state: { property: p } })}
                    className="btn btn-xs bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold border border-slate-700/80 rounded-xl px-3 py-1.5 flex items-center gap-1 cursor-pointer text-xs"
                  >
                    <Eye size={13} /> View Specs & Location ↗
                  </button>

                  {p.userEmail && (
                    <button
                      onClick={() => navigate(`/admin/users/${encodeURIComponent(p.userEmail)}`)}
                      className="btn btn-xs bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 font-bold border border-emerald-800/80 rounded-xl px-3 py-1.5 flex items-center gap-1 cursor-pointer text-xs"
                    >
                      <User size={13} /> Inspect Landowner
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
