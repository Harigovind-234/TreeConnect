import React, { useState } from 'react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { Truck, Plus, CheckCircle2, AlertCircle, Clock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const FleetEquipmentPage = () => {
  const { user } = useAuth();
  const [equipmentList, setEquipmentList] = useState([
    {
      id: 1,
      model: 'John Deere 843L-II Feller Buncher',
      category: 'Feller Buncher',
      status: 'Active',
      location: 'Site A - Munnar',
      operator: 'Rajesh K.',
      lastServiced: '2026-09-15'
    },
    {
      id: 2,
      model: 'Caterpillar 548 Forest Machine',
      category: 'Harvester',
      status: 'Maintenance',
      location: 'Workshop - Kochi',
      operator: 'Unassigned',
      lastServiced: '2026-10-01'
    }
  ]);

  return (
    <div className="contractor-dashboard-page !bg-[#070B08] text-[#F5F7F5] selection:bg-[#43C58A]/30 selection:text-white min-h-screen">
      <Navbar />
      <div className="contractor-dashboard-container flex">
        <Sidebar />
        
        <div className="contractor-dashboard-workspace flex-1 p-6 lg:p-8 ml-64 overflow-y-auto">
          <main className="w-full flex flex-col gap-6 max-w-7xl mx-auto">
            
            {/* Header Area */}
            <section className="flex flex-col gap-2 bg-[#101C14] border border-[#263B2E] rounded-2xl p-6 shadow-sm">
              <div className="inline-flex items-center gap-2 text-[#43C58A] text-xs font-bold uppercase tracking-wider bg-[#43C58A]/10 px-3 py-1 rounded-full w-fit border border-[#43C58A]/20">
                <Truck size={14} /> Equipment Management
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-[#F5F7F5] tracking-tight mt-1">Fleet & Equipment</h1>
              <p className="text-base text-[#9CAAA1]">
                Manage your logging machinery, track deployments, and add new equipment to your verified fleet.
              </p>
            </section>

            {/* Profile & Verification Status (As requested) */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-[#101C14] border border-[#263B2E] rounded-2xl p-6 flex flex-col gap-4 shadow-sm hover:border-[#43C58A]/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={24} className="text-[#43C58A]" />
                    <h2 className="text-lg font-bold text-[#F5F7F5]">Verification Status</h2>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-[#43C58A]/10 border border-[#43C58A]/30 text-[#43C58A] text-xs font-bold">
                    Active
                  </div>
                </div>
                <div className="bg-[#070B08] p-4 rounded-xl border border-[#263B2E]">
                  <h3 className="font-bold text-[#F5F7F5] text-sm">Licensed Kerala Contractor</h3>
                  <p className="text-[#9CAAA1] text-xs mt-1 leading-relaxed">
                    Verified by TreeConnect Administrator. Authorized for commercial timber felling and log transport based on submitted registration details.
                  </p>
                  <div className="mt-3 pt-3 border-t border-[#263B2E] flex flex-col gap-1">
                    <div className="flex justify-between">
                      <span className="text-xs text-[#9CAAA1]">Contractor Name</span>
                      <span className="text-xs font-bold text-[#F5F7F5]">{user?.name || 'Rohith kumar'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-[#9CAAA1]">Email</span>
                      <span className="text-xs font-bold text-[#F5F7F5]">{user?.email || 'rohithsh@gmail.com'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Fleet Status Component */}
            <section className="bg-[#101C14] border border-[#263B2E] rounded-2xl p-5 md:p-6 flex flex-col gap-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#263B2E]">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-bold text-[#F5F7F5] flex items-center gap-2">
                    <Truck size={20} className="text-[#F5F7F5]" /> Logging Machinery Fleet Status
                  </h2>
                  <p className="text-sm text-[#9CAAA1]">Monitor equipment deployment, assigned operators, and maintenance schedule</p>
                </div>
                
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-sm font-bold text-[#F5F7F5]">{equipmentList.length} Fleet Units</span>
                  <button className="select-none px-4 py-2.5 rounded-lg font-bold text-sm bg-[#43C58A] text-[#070B08] hover:bg-[#2EA875] transition-colors flex items-center gap-2 shadow-sm">
                    <Plus size={16} /> Add Equipment
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#070B08] border-y border-[#263B2E]">
                      <th className="py-3 px-4 text-[10px] font-bold text-[#9CAAA1] uppercase tracking-wider whitespace-nowrap">Machinery Model</th>
                      <th className="py-3 px-4 text-[10px] font-bold text-[#9CAAA1] uppercase tracking-wider whitespace-nowrap">Category</th>
                      <th className="py-3 px-4 text-[10px] font-bold text-[#9CAAA1] uppercase tracking-wider whitespace-nowrap">Status</th>
                      <th className="py-3 px-4 text-[10px] font-bold text-[#9CAAA1] uppercase tracking-wider whitespace-nowrap">Deployed Location</th>
                      <th className="py-3 px-4 text-[10px] font-bold text-[#9CAAA1] uppercase tracking-wider whitespace-nowrap">Assigned Operator</th>
                      <th className="py-3 px-4 text-[10px] font-bold text-[#9CAAA1] uppercase tracking-wider whitespace-nowrap">Last Serviced</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#263B2E]">
                    {equipmentList.map((item) => (
                      <tr key={item.id} className="hover:bg-[#0C130F] transition-colors">
                        <td className="py-4 px-4">
                          <span className="font-bold text-[#F5F7F5] text-sm">{item.model}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-[#9CAAA1] text-sm">{item.category}</span>
                        </td>
                        <td className="py-4 px-4">
                          {item.status === 'Active' ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#43C58A]/10 border border-[#43C58A]/30 text-[#43C58A] text-[11px] font-bold">
                              <CheckCircle2 size={12} /> Active
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F4B82E]/10 border border-[#F4B82E]/30 text-[#F4B82E] text-[11px] font-bold">
                              <Clock size={12} /> Maintenance
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-[#F5F7F5] text-sm font-medium">{item.location}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-[#F5F7F5] text-sm">{item.operator}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-[#9CAAA1] text-sm font-mono">{item.lastServiced}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

          </main>
        </div>
      </div>
    </div>
  );
};

export default FleetEquipmentPage;
