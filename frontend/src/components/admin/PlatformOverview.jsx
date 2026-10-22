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
    let isSubscribed = true;

    const fetchLiveMetrics = async () => {
      try {
        const res = await api.get('/admin/overview');
        if (isSubscribed && res.data && Array.isArray(res.data.metrics)) {
          setMetrics(res.data.metrics);
        }
      } catch (e) {
        console.error('Error fetching live platform overview metrics:', e);
      }
    };

    fetchLiveMetrics();

    // Poll every 3.5 seconds for real-time updates
    const interval = setInterval(fetchLiveMetrics, 3500);

    const handleSync = () => fetchLiveMetrics();
    window.addEventListener('treeconnect_marketplace_updated', handleSync);
    window.addEventListener('treeconnect_harvest_updated', handleSync);
    window.addEventListener('treeconnect_payments_updated', handleSync);
    window.addEventListener('storage', handleSync);
    window.addEventListener('focus', handleSync);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
      window.removeEventListener('treeconnect_marketplace_updated', handleSync);
      window.removeEventListener('treeconnect_harvest_updated', handleSync);
      window.removeEventListener('treeconnect_payments_updated', handleSync);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, []);

  return (
    <section className="admin-card space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-white tracking-wide">Platform Overview</h2>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              LIVE
            </span>
          </div>
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
