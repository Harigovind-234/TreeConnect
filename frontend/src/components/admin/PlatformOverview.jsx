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
    <section className="admin-card space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-wide">Platform Overview</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Key ecosystem performance and governance indicators across TreeConnect
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 pt-1">
        {metrics.map((m) => {
          const IconComp = iconMap[m.icon] || Users;

          return (
            <div
              key={m.id}
              className="admin-subcard cursor-pointer hover:border-emerald-500/60 transition-all p-4 space-y-2 select-none group"
              onClick={() => onSelectMetric && onSelectMetric(m.id)}
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                  <IconComp size={18} />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-white">{m.value}</div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                  {m.label}
                </div>
                <div className="text-[11px] font-bold text-emerald-400 mt-1">
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
