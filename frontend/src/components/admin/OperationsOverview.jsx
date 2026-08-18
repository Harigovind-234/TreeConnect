import React from 'react';
import { Truck, ShoppingBag, DollarSign, ArrowRight, Clock, CheckCircle2, FileText, AlertCircle, ShieldAlert } from 'lucide-react';
import { operationsOverviewData } from '../../data/adminMockData';

const OperationsOverview = ({
  onViewHarvests,
  onViewMarketplace,
  onViewTransactions
}) => {
  const { harvestOperations, timberMarketplace, transactionsSummary } = operationsOverviewData;

  return (
    <div className="space-y-6">
      {/* 2-column grid for Harvest Operations & Timber Marketplace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Harvest Operations */}
        <section className="admin-card space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2.5">
                <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  <Truck size={18} />
                </span>
                <span>HARVEST OPERATIONS</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">Status pipeline across active logging operations</p>
            </div>
            <button
              className="text-xs text-emerald-400 font-bold hover:underline flex items-center gap-1 cursor-pointer bg-[#1e293b] hover:bg-[#334155] px-3.5 py-1.5 rounded-xl border border-slate-700/80 transition-all"
              onClick={onViewHarvests}
            >
              <span>View Harvests</span>
              <ArrowRight size={13} />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
            <div className="kpi-card p-3.5">
              <div className="kpi-card-header mb-1 flex justify-between items-center">
                <span className="kpi-icon-box icon-amber">
                  <Clock size={16} />
                </span>
              </div>
              <div className="kpi-card-body">
                <div className="kpi-value text-xl font-black text-amber-400">{harvestOperations.pendingRequests}</div>
                <div className="kpi-label text-[10px] font-bold text-slate-400 uppercase mt-0.5">Pending Requests</div>
              </div>
            </div>
            <div className="kpi-card p-3.5">
              <div className="kpi-card-header mb-1 flex justify-between items-center">
                <span className="kpi-icon-box icon-blue">
                  <FileText size={16} />
                </span>
              </div>
              <div className="kpi-card-body">
                <div className="kpi-value text-xl font-black text-blue-400">{harvestOperations.contractorBidding}</div>
                <div className="kpi-label text-[10px] font-bold text-slate-400 uppercase mt-0.5">Contractor Bidding</div>
              </div>
            </div>
            <div className="kpi-card p-3.5">
              <div className="kpi-card-header mb-1 flex justify-between items-center">
                <span className="kpi-icon-box icon-purple">
                  <Truck size={16} />
                </span>
              </div>
              <div className="kpi-card-body">
                <div className="kpi-value text-xl font-black text-purple-400">{harvestOperations.surveyScheduled}</div>
                <div className="kpi-label text-[10px] font-bold text-slate-400 uppercase mt-0.5">Survey Scheduled</div>
              </div>
            </div>
            <div className="kpi-card p-3.5">
              <div className="kpi-card-header mb-1 flex justify-between items-center">
                <span className="kpi-icon-box icon-emerald">
                  <Truck size={16} />
                </span>
              </div>
              <div className="kpi-card-body">
                <div className="kpi-value text-xl font-black text-emerald-400">{harvestOperations.harvesting}</div>
                <div className="kpi-label text-[10px] font-bold text-slate-400 uppercase mt-0.5">Active Harvesting</div>
              </div>
            </div>
            <div className="kpi-card p-3.5 col-span-1 sm:col-span-2">
              <div className="kpi-card-header mb-1 flex justify-between items-center">
                <span className="kpi-icon-box icon-forest">
                  <CheckCircle2 size={16} />
                </span>
              </div>
              <div className="kpi-card-body">
                <div className="kpi-value text-xl font-black text-emerald-400">{harvestOperations.completed}</div>
                <div className="kpi-label text-[10px] font-bold text-slate-400 uppercase mt-0.5">Completed Projects</div>
              </div>
            </div>
          </div>
        </section>

        {/* Timber Marketplace */}
        <section className="dashboard-section card border border-slate-800/90 bg-slate-950/90 backdrop-blur-md rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-950/80 text-blue-400 border border-blue-800/80">
                  <ShoppingBag size={16} />
                </span>
                <span>TIMBER MARKETPLACE</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Commercial timber log trading activity</p>
            </div>
            <button
              className="text-xs text-emerald-400 font-bold hover:underline flex items-center gap-1 cursor-pointer bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700/80 transition-all"
              onClick={onViewMarketplace}
            >
              <span>View Marketplace</span>
              <ArrowRight size={13} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="kpi-card p-3.5">
              <div className="kpi-card-header mb-1 flex justify-between items-center">
                <span className="kpi-icon-box icon-emerald">
                  <ShoppingBag size={16} />
                </span>
              </div>
              <div className="kpi-card-body">
                <div className="kpi-value text-xl font-black text-white">{timberMarketplace.activeListings}</div>
                <div className="kpi-label text-[10px] font-bold text-slate-400 uppercase mt-0.5">Active Listings</div>
              </div>
            </div>
            <div className="kpi-card p-3.5">
              <div className="kpi-card-header mb-1 flex justify-between items-center">
                <span className="kpi-icon-box icon-blue">
                  <ShoppingBag size={16} />
                </span>
              </div>
              <div className="kpi-card-body">
                <div className="kpi-value text-xl font-black text-blue-400">{timberMarketplace.buyerRequests}</div>
                <div className="kpi-label text-[10px] font-bold text-slate-400 uppercase mt-0.5">Buyer Requests</div>
              </div>
            </div>
            <div className="kpi-card p-3.5">
              <div className="kpi-card-header mb-1 flex justify-between items-center">
                <span className="kpi-icon-box icon-amber">
                  <Clock size={16} />
                </span>
              </div>
              <div className="kpi-card-body">
                <div className="kpi-value text-xl font-black text-amber-400">{timberMarketplace.pendingOrders}</div>
                <div className="kpi-label text-[10px] font-bold text-slate-400 uppercase mt-0.5">Pending Orders</div>
              </div>
            </div>
            <div className="kpi-card p-3.5">
              <div className="kpi-card-header mb-1 flex justify-between items-center">
                <span className="kpi-icon-box icon-forest">
                  <CheckCircle2 size={16} />
                </span>
              </div>
              <div className="kpi-card-body">
                <div className="kpi-value text-xl font-black text-emerald-400">{timberMarketplace.completedSales}</div>
                <div className="kpi-label text-[10px] font-bold text-slate-400 uppercase mt-0.5">Completed Sales</div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Payment Monitoring Summary */}
      <section className="dashboard-section card border border-slate-800/90 bg-slate-950/90 backdrop-blur-md rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
                <DollarSign size={16} />
              </span>
              <span>Transactions Summary</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Financial escrow settlement overview</p>
          </div>
          <button
            className="text-xs text-emerald-400 font-bold hover:underline flex items-center gap-1 cursor-pointer bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700/80 transition-all"
            onClick={onViewTransactions}
          >
            <span>View Transactions</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1 text-xs">
          <div className="kpi-card p-4">
            <div className="kpi-card-header mb-1.5 flex justify-between items-center">
              <span className="kpi-icon-box icon-emerald">
                <DollarSign size={18} />
              </span>
            </div>
            <div className="kpi-card-body">
              <div className="kpi-value text-2xl font-black text-emerald-400">{transactionsSummary.completedValue}</div>
              <div className="kpi-label text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Completed Volume</div>
            </div>
          </div>
          <div className="kpi-card p-4">
            <div className="kpi-card-header mb-1.5 flex justify-between items-center">
              <span className="kpi-icon-box icon-amber">
                <Clock size={18} />
              </span>
            </div>
            <div className="kpi-card-body">
              <div className="kpi-value text-2xl font-black text-amber-400">{transactionsSummary.pendingValue}</div>
              <div className="kpi-label text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Pending Escrow</div>
            </div>
          </div>
          <div className="kpi-card p-4">
            <div className="kpi-card-header mb-1.5 flex justify-between items-center">
              <span className="kpi-icon-box icon-blue">
                <AlertCircle size={18} />
              </span>
            </div>
            <div className="kpi-card-body">
              <div className="kpi-value text-2xl font-black text-red-400">{transactionsSummary.failedCount}</div>
              <div className="kpi-label text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Failed Transactions</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default OperationsOverview;
