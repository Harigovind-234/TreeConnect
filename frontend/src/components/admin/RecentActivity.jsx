import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trees, ArrowRight, MapPin, Calendar, Ruler, User, Loader2 } from 'lucide-react';
import propertyService from '../../services/propertyService';

const RecentActivity = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentProperties = async () => {
      try {
        setLoading(true);
        const data = await propertyService.getProperties({ all_records: true });
        if (data && Array.isArray(data.properties)) {
          // Strictly use live registered properties from MongoDB
          setProperties(data.properties.slice(0, 4));
        } else {
          setProperties([]);
        }
      } catch (err) {
        console.error('Error loading recent properties from DB:', err);
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentProperties();
  }, []);

  return (
    <section className="admin-card space-y-4">
      {/* Header Bar matching User Management header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 flex items-center justify-center">
              <Trees size={18} />
            </span>
            <span>Recently Added Properties</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Live database feed of registered forest estates and land parcels across TreeConnect
          </p>
        </div>

        <button
          onClick={() => navigate('/admin/properties')}
          className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1.5 cursor-pointer bg-slate-900 hover:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-700/80 transition-all shadow-xs self-end md:self-center"
        >
          <span>View All Properties ({properties.length})</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Property Cards Grid strictly from DB */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
        {loading ? (
          <div className="col-span-full p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin text-emerald-400" />
            <span>Querying registered landowner properties from MongoDB...</span>
          </div>
        ) : properties.length === 0 ? (
          <div className="col-span-full p-8 text-center text-slate-400 text-xs space-y-1">
            <Trees size={24} className="text-slate-600 mx-auto mb-1" />
            <p className="font-bold text-slate-300">No Registered Properties Found in Database</p>
            <p className="text-[11px] text-slate-500">Newly registered landowner properties will appear here live.</p>
          </div>
        ) : (
          properties.map((p) => (
            <div
              key={p.id || p._id}
              onClick={() => navigate('/admin/properties')}
              className="kpi-card p-4 hover:border-emerald-500/60 transition-all cursor-pointer group flex flex-col justify-between"
              title={`Click to view property ${p.propertyName}`}
            >
              <div className="space-y-2.5">
                {/* Header Icon + Status */}
                <div className="kpi-card-header flex justify-between items-center">
                  <span className="kpi-icon-box icon-emerald">
                    <Trees size={18} />
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-950/90 text-emerald-400 border border-emerald-800/80">
                    {p.status || 'Active Estate'}
                  </span>
                </div>

                {/* Property Name */}
                <div>
                  <h4 className="text-sm font-extrabold text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
                    {p.propertyName}
                  </h4>
                  <p className="text-xs font-semibold text-slate-300 flex items-center gap-1 mt-1 truncate">
                    <User size={11} className="text-slate-500 shrink-0" />
                    <span className="truncate">{p.ownerName || 'Landowner'}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                    <MapPin size={11} className="text-emerald-400 shrink-0" />
                    <span className="truncate">{p.district || 'Kottayam'}, {p.state || 'Kerala'}</span>
                  </p>
                </div>
              </div>

              {/* Area Metric & Footer Date */}
              <div className="pt-2 border-t border-slate-800/60 mt-3 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Total Area
                  </span>
                  <span className="text-base font-black text-emerald-400 mt-0.5 block">
                    {p.totalArea} {p.areaUnit || 'Acres'}
                  </span>
                </div>

                <span className="text-[10px] font-semibold text-slate-300 flex items-center gap-1 bg-[#0e1612] px-2.5 py-1 rounded-lg border border-emerald-500/15">
                  <Calendar size={11} className="text-emerald-400" />
                  {p.createdAt ? p.createdAt.split('T')[0] : 'Recent'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default RecentActivity;
