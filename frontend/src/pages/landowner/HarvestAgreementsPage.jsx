import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useLandowner } from '../../context/LandownerContext';
import DigitalAgreementModal from '../../components/workflow/DigitalAgreementModal';
import harvestService from '../../services/harvestService';
import { formatINR, formatVolume } from '../../utils/timberCalculations';
import './LandownerDashboard.css';
import './HarvestAgreementsPage.css';
import {
  FileCheck,
  Trees,
  ShieldCheck,
  Calendar,
  Clock,
  IndianRupee,
  Truck,
  ExternalLink,
  Printer,
  Search,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Layers,
  Phone,
  Building2,
  Coins,
  ArrowRight,
  Sparkles,
  Download
} from 'lucide-react';

const HarvestAgreementsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const landownerCtx = useLandowner() || {};
  const contextRequests = landownerCtx.harvestRequests || [];
  const refreshHarvestRequests = landownerCtx.refreshHarvestRequests || (() => {});

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedAgreementModal, setSelectedAgreementModal] = useState(null);

  const fetchAgreements = async () => {
    try {
      let combined = [];

      // 1. Backend fetch
      try {
        const data = await harvestService.getHarvestRequests({ all_records: true });
        if (data && Array.isArray(data.harvest_requests)) {
          combined = [...data.harvest_requests];
        }
      } catch (e) {
        console.warn("Backend fetch failed, using local/context storage", e);
      }

      // 2. Local storage fallback & merge
      const stored = localStorage.getItem('treeconnect_harvest_requests');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            parsed.forEach(pReq => {
              if (!combined.find(r => (r.id || r._id) === (pReq.id || pReq._id))) {
                combined.push(pReq);
              }
            });
          }
        } catch (e) {}
      }

      // 3. Merge with contextRequests if any
      if (Array.isArray(contextRequests) && contextRequests.length > 0) {
        contextRequests.forEach(cReq => {
          if (!combined.find(r => (r.id || r._id) === (cReq.id || cReq._id))) {
            combined.push(cReq);
          }
        });
      }

      const lEmail = (user?.email || '').toLowerCase().trim();
      const userRequests = combined.filter(req => {
        if (!req || req.status === 'CANCELLED' || req.status === 'DELETED') return false;
        const reqEmail = String(req.owner_email || req.ownerEmail || req.userEmail || req.landowner_email || '').toLowerCase().trim();
        return lEmail && reqEmail && (reqEmail === lEmail || reqEmail.includes(lEmail));
      });

      // Filter requests that have an assigned contractor or agreement or assessment
      const agreementList = userRequests.filter(req => {
        const hasContractor = Boolean(req.assigned_contractor_name || req.contractor_name || req.assignedContractorName);
        const hasAgreement = Boolean(req.digital_agreement || req.agreement_status === 'SIGNED' || req.is_advance_verified);
        const hasAssessment = Boolean(req.assessment || req.total_quotation_amount);
        return hasContractor || hasAgreement || hasAssessment;
      });

      setRequests(agreementList);
    } catch (err) {
      console.error("Error loading agreements:", err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgreements();
  }, [user, contextRequests.length]);

  // Transform requests into rich Agreement cards
  const agreements = requests.map(req => {
    const reqId = req.id || req._id || 'HR-REQ';
    const ass = req.assessment || {};
    const agr = req.digital_agreement || {};

    const agreementId = agr.agreement_id || `TC-AGR-${String(reqId).slice(-6).toUpperCase()}`;
    const propName = req.property_details?.propertyName || req.propertyName || req.parcel || 'TreeConnect Timber Estate';
    const location = req.propertyLocation || req.location || `${req.village || 'Nagampadam'}, ${req.district || 'Kottayam'}, Kerala`;

    const contractorName = req.assigned_contractor_name || req.contractor_name || ass.contractor_name || 'Rohith kumar';
    const contractorCompany = req.assigned_contractor_company || 'Apex Timber Solutions & Forestry Services';
    const contractorPhone = req.assigned_contractor_phone || ass.contractor_phone || '+91 9746512243';

    const totalVal = Number(agr.total_agreed_amount || req.total_quotation_amount || req.total_quote || ass.total_quote || 110000);
    const advancePaid = Number(req.advance_payment?.amount || (req.is_advance_verified ? Math.round(totalVal * 0.3) : 0));
    const isAdvanceSettled = Boolean(req.is_advance_verified || req.advance_payment?.verified || req.advance_payment_status === 'VERIFIED');
    const pendingBalance = Math.max(0, totalVal - advancePaid);

    const treeCount = req.verified_tree_count || ass.verified_tree_count || req.tree_count || req.approxTreesCount || 20;
    const volume = req.estimated_harvestable_volume || ass.estimated_harvestable_volume || '1.70';
    const species = req.species || req.treeSpecies || (req.selected_tree_groups?.[0]?.species) || 'Teakwood / Commercial Timber';

    const startDate = ass.proposed_start_date || req.proposed_start_date || req.preferred_start_date || '2026-10-15';
    const duration = ass.estimated_duration || req.estimated_duration || '10 Working Days';
    const crewSize = ass.assigned_workers_count || req.assigned_workers_count || 8;

    const signedAt = agr.signed_at || req.agreement_signed_at || req.updated_at || req.updatedAt || '2026-10-12';

    const status = (req.status === 'COMPLETED' || req.is_fully_paid) 
      ? 'COMPLETED' 
      : (req.status === 'IN_PROGRESS' || req.is_advance_verified)
      ? 'ACTIVE'
      : 'SIGNED';

    return {
      raw: req,
      reqId,
      agreementId,
      propName,
      location,
      contractorName,
      contractorCompany,
      contractorPhone,
      totalVal,
      advancePaid,
      isAdvanceSettled,
      pendingBalance,
      treeCount,
      volume,
      species,
      startDate,
      duration,
      crewSize,
      signedAt,
      status
    };
  });

  const filteredAgreements = agreements.filter(agr => {
    if (statusFilter !== 'ALL' && agr.status !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const mProp = agr.propName.toLowerCase().includes(q);
      const mContractor = agr.contractorName.toLowerCase().includes(q);
      const mId = agr.agreementId.toLowerCase().includes(q);
      const mLoc = agr.location.toLowerCase().includes(q);
      if (!mProp && !mContractor && !mId && !mLoc) return false;
    }
    return true;
  });

  const totalAgreedValue = agreements.reduce((acc, a) => acc + a.totalVal, 0);
  const totalAdvanceSettled = agreements.reduce((acc, a) => acc + a.advancePaid, 0);
  const totalVolume = agreements.reduce((acc, a) => acc + parseFloat(String(a.volume).replace(/[^\d.]/g, '') || 0), 0);

  return (
    <div className="landowner-dashboard-page">
      <Navbar />
      <div className="landowner-dashboard-container">
        <Sidebar />

        <div className="landowner-dashboard-workspace">
          <div className="agr-container">

            {/* 1. Hero Header Banner */}
            <section className="agr-hero-card">
              <div>
                <div className="agr-hero-badge">
                  <span className="agr-pulse-dot"></span>
                  Commercial Forestry Operations
                </div>
                <h1 className="agr-hero-heading">Harvest Agreements & Contracts</h1>
                <p className="agr-hero-subtext">
                  Legally binding digital agreements executed with certified forestry contractors under the Kerala Timber Transit & Harvesting Rules.
                </p>
              </div>

              <div className="agr-hero-actions">
                <button
                  onClick={() => navigate('/landowner/harvest-operations')}
                  className="lopay-btn-secondary"
                >
                  <Truck size={15} />
                  <span>Harvest Operations</span>
                </button>
                <button
                  onClick={() => navigate('/landowner/payments')}
                  className="lopay-btn-primary"
                >
                  <IndianRupee size={15} />
                  <span>Bills & Payments</span>
                </button>
              </div>
            </section>

            {/* 2. Top Executive Metrics */}
            <section className="agr-metrics-grid">
              <div className="agr-metric-card">
                <div>
                  <div className="agr-metric-header">
                    <div className="agr-metric-icon">
                      <FileCheck size={20} />
                    </div>
                  </div>
                  <span className="agr-metric-label">Active Contracts</span>
                  <div className="agr-metric-val">{agreements.length}</div>
                </div>
                <div className="agr-metric-footer">
                  <CheckCircle2 size={13} />
                  <span>Digitally Executed</span>
                </div>
              </div>

              <div className="agr-metric-card">
                <div>
                  <div className="agr-metric-header">
                    <div className="agr-metric-icon">
                      <IndianRupee size={20} />
                    </div>
                  </div>
                  <span className="agr-metric-label">Total Agreed Value</span>
                  <div className="agr-metric-val">{formatINR(totalAgreedValue)}</div>
                </div>
                <div className="agr-metric-footer">
                  <ShieldCheck size={13} />
                  <span>Fixed Commercial Quotations</span>
                </div>
              </div>

              <div className="agr-metric-card">
                <div>
                  <div className="agr-metric-header">
                    <div className="agr-metric-icon">
                      <Coins size={20} />
                    </div>
                  </div>
                  <span className="agr-metric-label">Mobilization Settled</span>
                  <div className="agr-metric-val">{formatINR(totalAdvanceSettled)}</div>
                </div>
                <div className="agr-metric-footer">
                  <span className="text-[#34d399]">✓ 30% Advance Disbursed</span>
                </div>
              </div>

              <div className="agr-metric-card">
                <div>
                  <div className="agr-metric-header">
                    <div className="agr-metric-icon">
                      <Trees size={20} />
                    </div>
                  </div>
                  <span className="agr-metric-label">Committed Timber</span>
                  <div className="agr-metric-val">{totalVolume.toFixed(2)} m³</div>
                </div>
                <div className="agr-metric-footer">
                  <span>Certified Field Measurement</span>
                </div>
              </div>
            </section>

            {/* 3. Search & Filter Bar */}
            <section className="lopay-controls-card">
              <div className="lopay-controls-row">
                <div className="lopay-search-wrap">
                  <Search size={16} className="lopay-search-icon" />
                  <input
                    type="text"
                    placeholder="Search agreement by property, contractor, or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="lopay-search-input"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="lopay-search-clear"
                      title="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setStatusFilter('ALL')}
                    className={`lopay-pill-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
                  >
                    All Agreements ({agreements.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('ACTIVE')}
                    className={`lopay-pill-btn ${statusFilter === 'ACTIVE' ? 'active' : ''}`}
                  >
                    <CheckCircle2 size={13} className="text-[#34d399]" />
                    Active / In Progress
                  </button>
                  <button
                    onClick={() => setStatusFilter('SIGNED')}
                    className={`lopay-pill-btn ${statusFilter === 'SIGNED' ? 'active' : ''}`}
                  >
                    <Clock size={13} className="text-[#fbbf24]" />
                    Signed
                  </button>
                </div>
              </div>

              {(searchQuery || statusFilter !== 'ALL') && (
                <div className="flex items-center justify-between text-xs pt-2 border-t border-[#10b981]/10 text-[#9ca3af]">
                  <span>
                    Showing <strong className="text-[#34d399]">{filteredAgreements.length}</strong> of <strong>{agreements.length}</strong> harvest agreements
                  </span>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('ALL');
                    }}
                    className="text-[#34d399] hover:underline font-bold"
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </section>

            {/* 4. Agreements List Section */}
            <section className="flex flex-col gap-5">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileCheck size={18} className="text-[#34d399]" />
                  Active Harvest Agreements
                </h2>
                <span className="text-xs text-[#9ca3af]">
                  {filteredAgreements.length} {filteredAgreements.length === 1 ? 'contract' : 'contracts'} listed
                </span>
              </div>

              {loading ? (
                <div className="lopay-empty-card">
                  <Loader2 className="animate-spin text-[#34d399]" size={36} />
                  <span className="text-sm text-[#9ca3af]">Loading verified agreements...</span>
                </div>
              ) : filteredAgreements.length === 0 ? (
                <div className="lopay-empty-card">
                  <div className="lopay-empty-icon">
                    <AlertCircle size={28} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-base font-bold text-white">No harvest agreements recorded yet.</p>
                    <p className="text-xs text-[#9ca3af]">
                      Once an assigned contractor completes on-site inspection and you accept their quotation, a binding digital contract is automatically generated here.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/landowner/harvest-requests')}
                    className="lopay-btn-primary text-xs"
                  >
                    <span>View Harvest Requests</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {filteredAgreements.map(agr => (
                    <article key={agr.agreementId} className="agr-card">
                      
                      {/* Card Header */}
                      <div className="agr-card-header">
                        <div className="agr-header-left">
                          <div className="agr-avatar">
                            <FileCheck size={24} />
                          </div>
                          <div className="agr-title-group">
                            <h3 className="agr-title">{agr.propName}</h3>
                            <div className="agr-meta-sub">
                              <span className="agr-id-pill">{agr.agreementId}</span>
                              <span>•</span>
                              <span>Executed on {new Date(agr.signedAt).toLocaleDateString('en-IN', {
                                day: '2-digit', month: 'short', year: 'numeric'
                              })}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="agr-status-badge">
                            <CheckCircle2 size={13} />
                            {agr.status === 'ACTIVE' ? 'Active Contract' : 'Signed Agreement'}
                          </span>
                        </div>
                      </div>

                      {/* 3-Column Metadata Grid */}
                      <div className="agr-details-grid">
                        
                        {/* Col 1: Contractor & Company */}
                        <div className="agr-details-col">
                          <span className="agr-col-title">
                            <Building2 size={13} /> Contracting Partner
                          </span>
                          <div className="agr-col-item">
                            <span className="agr-col-label">Certified Contractor</span>
                            <span className="agr-col-val flex items-center gap-1.5">
                              {agr.contractorName}
                              <ShieldCheck size={14} className="text-[#34d399]" />
                            </span>
                          </div>
                          <div className="agr-col-item">
                            <span className="agr-col-label">Firm</span>
                            <span className="text-xs text-[#9ca3af]">{agr.contractorCompany}</span>
                          </div>
                          <div className="agr-col-item">
                            <span className="agr-col-label">Contact</span>
                            <span className="text-xs text-white font-mono flex items-center gap-1">
                              <Phone size={11} className="text-[#34d399]" /> {agr.contractorPhone}
                            </span>
                          </div>
                        </div>

                        {/* Col 2: Harvest Scope & Location */}
                        <div className="agr-details-col">
                          <span className="agr-col-title">
                            <Trees size={13} /> Operational Scope
                          </span>
                          <div className="agr-col-item">
                            <span className="agr-col-label">Timber & Trees</span>
                            <span className="agr-col-val">{agr.treeCount} Trees • {agr.volume} m³</span>
                          </div>
                          <div className="agr-col-item">
                            <span className="agr-col-label">Species & Site</span>
                            <span className="text-xs text-[#9ca3af]">{agr.species}</span>
                            <span className="text-[11px] text-[#9ca3af] truncate">{agr.location}</span>
                          </div>
                          <div className="agr-col-item">
                            <span className="agr-col-label">Timeline & Crew</span>
                            <span className="text-xs text-white">
                              {agr.duration} • Crew of {agr.crewSize} workers
                            </span>
                          </div>
                        </div>

                        {/* Col 3: Commercial & Financial Terms */}
                        <div className="agr-details-col">
                          <span className="agr-col-title">
                            <Coins size={13} /> Commercial Terms
                          </span>
                          <div className="agr-col-item">
                            <span className="agr-col-label">Total Agreed Quotation</span>
                            <span className="agr-val-highlight">{formatINR(agr.totalVal)}</span>
                          </div>
                          <div className="agr-col-item">
                            <span className="agr-col-label">Advance Mobilization (30%)</span>
                            <span className="text-xs font-bold text-[#34d399]">
                              {formatINR(agr.advancePaid)} {agr.isAdvanceSettled ? '✓ Disbursed' : 'Awaiting Payment'}
                            </span>
                          </div>
                          <div className="agr-col-item">
                            <span className="agr-col-label">Balance on Completion (70%)</span>
                            <span className="text-xs font-bold text-[#fbbf24]">
                              {formatINR(agr.pendingBalance)} Due on dispatch
                            </span>
                          </div>
                        </div>

                      </div>

                      {/* Card Actions */}
                      <div className="agr-card-actions">
                        <button
                          onClick={() => setSelectedAgreementModal({ req: agr.raw, agreement: agr.raw.digital_agreement })}
                          className="lopay-btn-primary"
                        >
                          <FileCheck size={15} />
                          <span>View Official Digital Agreement</span>
                        </button>

                        <button
                          onClick={() => navigate('/landowner/harvest-operations')}
                          className="lopay-btn-secondary"
                        >
                          <Truck size={15} />
                          <span>Track Harvest Stages</span>
                        </button>

                        <button
                          onClick={() => navigate('/landowner/payments')}
                          className="lopay-btn-secondary"
                        >
                          <IndianRupee size={15} />
                          <span>Payment Records</span>
                        </button>
                      </div>

                    </article>
                  ))}
                </div>
              )}
            </section>

          </div>
        </div>
      </div>

      {/* DIGITAL AGREEMENT MODAL */}
      {selectedAgreementModal && (
        <DigitalAgreementModal
          request={selectedAgreementModal.req}
          assessment={selectedAgreementModal.req?.assessment}
          onClose={() => setSelectedAgreementModal(null)}
        />
      )}
    </div>
  );
};

export default HarvestAgreementsPage;
