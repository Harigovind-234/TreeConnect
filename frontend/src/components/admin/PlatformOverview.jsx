import React, { useState, useEffect } from 'react';
import { Users, ShieldCheck, Trees, Truck, ShoppingBag, DollarSign } from 'lucide-react';
import { platformOverviewMetrics } from '../../data/adminMockData';
import api from '../../services/api';

const iconMap = {
  Users,
  ShieldCheck,
  Trees,
  Truck,
  ShoppingBag,
  DollarSign
};

const PlatformOverview = ({ onSelectMetric }) => {
  const [metrics, setMetrics] = useState(platformOverviewMetrics);

  useEffect(() => {
    const fetchLiveUserCount = async () => {
      try {
        const res = await api.get('/admin/users');
        if (res.data && Array.isArray(res.data.users)) {
          const liveUserCount = res.data.users.filter((u) => u.role !== 'admin').length;
          setMetrics((prev) =>
            prev.map((m) =>
              m.id === 'total_users'
                ? { ...m, value: liveUserCount.toString(), subtext: 'Live MongoDB count' }
                : m
            )
          );
        }
      } catch (e) {
        console.error('Error fetching live platform user count:', e);
      }
    };

    fetchLiveUserCount();
  }, []);

  return (
    <section className="dashboard-section card border border-slate-800/90 bg-slate-950/90 backdrop-blur-md rounded-2xl p-5 shadow-xl space-y-3">
      <div className="card-header pb-2 border-b border-slate-800/80">
        <div>
          <h2 className="text-lg font-bold text-white tracking-wide">Platform Overview</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Key ecosystem performance and governance indicators across TreeConnect
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
        {metrics.map((m) => {
          const IconComp = iconMap[m.icon] || Users;

          return (
            <div
              key={m.id}
              className="kpi-card cursor-pointer hover:border-emerald-500/50 transition-all p-3.5"
              onClick={() => onSelectMetric && onSelectMetric(m.id)}
            >
              <div className="kpi-card-header mb-2 flex justify-between items-center">
                <span className={`kpi-icon-box icon-${m.color}`}>
                  <IconComp size={18} />
                </span>
              </div>
              <div className="kpi-card-body">
                <div className="kpi-value text-xl font-black text-white">{m.value}</div>
                <div className="kpi-label text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                  {m.label}
                </div>
                <div className="text-[11px] font-semibold text-emerald-400 mt-1">
                  {m.subtext}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default PlatformOverview;
