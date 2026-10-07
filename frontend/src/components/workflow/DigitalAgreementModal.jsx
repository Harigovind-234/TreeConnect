import React from 'react';
import {
  FileCheck,
  X,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  MapPin,
  Building2,
  Phone,
  Coins,
  DollarSign,
  Truck,
  Users,
  Clock,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { formatINR, formatVolume } from '../../utils/timberCalculations';
import './DigitalAgreementModal.css';

const formatDateDMY = (dateStr) => {
  if (!dateStr) return '07-10-2026';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr).substring(0, 10);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch (e) {
    return String(dateStr);
  }
};

const DigitalAgreementModal = ({
  request,
  assessment,
  onClose
}) => {
  if (!request) return null;

  const reqId = request.id || request._id || 'HR-000';
  const ass = assessment || request.assessment || {};
  const propType = ass.commercial_proposal_type || request.commercial_proposal_type || 'Harvesting Service Quotation';

  const isPurchase = propType === 'Timber Purchase Offer';
  const isHybrid = propType === 'Purchase + Harvesting';
  const isService = propType === 'Harvesting Service Quotation';

  const agreementId = request.digital_agreement?.agreement_id ||
    `TC-AGR-${new Date().getFullYear()}-${String(reqId).slice(-6).toUpperCase()}`;

  const signedDate = request.digital_agreement?.signed_at || request.updatedAt || new Date().toISOString();

  // Financial values
  const totalVal = isService
    ? (ass.total_quote ?? request.total_quote ?? 110000)
    : isPurchase
      ? (ass.contractor_purchase_offer ?? request.contractor_purchase_offer ?? 250000)
      : (ass.timber_purchase_price ?? request.timber_purchase_price ?? 300000);

  const assessedVolume = ass.estimated_harvestable_volume || request.estimated_harvestable_volume || request.total_estimated_volume || 1.70;
  const verifiedTrees = ass.verified_tree_count || request.site_inspection?.verified_tree_count || request.approxTreesCount || 20;

  const landownerName = request.ownerName || request.landowner_name || request.landownerName || 'Harigovind D Nair';
  const landownerPhone = request.contactNumber || request.owner_phone || request.phone || '9746794654';
  const propertyName = request.propertyName || request.property_name || 'Registered Timber Estate';
  const propertyLocation = request.propertyLocation || request.location || `${request.village || 'Nagampadam'}, ${request.district || 'Kottayam'}, Kerala`;

  const contractorName = request.assigned_contractor_name || ass.contractor_name || 'Rohith kumar';
  const contractorPhone = request.assigned_contractor_phone || ass.contractor_phone || '9746512243';
  const contractorCompany = request.assigned_contractor_company || 'Apex Timber Solutions & Forestry Services';

  const startDate = ass.proposed_start_date || request.proposed_start_date || request.preferred_start_date || '2026-10-15';
  const duration = ass.estimated_duration || request.estimated_duration || '10 Working Days';
  const crewSize = ass.assigned_workers_count || ass.workers_assigned || request.assigned_workers_count || 8;

  return (
    <div className="digital-agr-overlay" onClick={onClose}>
      <div className="digital-agr-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="digital-agr-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center text-emerald-400 shrink-0">
              <FileCheck size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight leading-snug">
                Official Digital Timber Harvest Agreement
              </h3>
              <p className="text-xs text-slate-300">
                Binding Commercial Work Contract • <span className="text-emerald-400 font-mono font-bold">{agreementId}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-emerald-500/40 text-slate-300 hover:text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-all no-print"
              title="Print or Save PDF"
            >
              <Printer size={13} />
              <span>Print PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer no-print"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Document Body */}
        <div className="digital-agr-body">
          <div className="digital-agr-document">
            <div className="digital-agr-watermark">TREECONNECT VALIDATED</div>

            <div className="digital-agr-doc-header">
              <div className="digital-agr-badge">
                <ShieldCheck size={13} /> Digital Contract Finalized &amp; Ready
              </div>
              <h1 className="digital-agr-doc-title">
                COMMERCIAL TIMBER HARVESTING &amp; PURCHASE AGREEMENT
              </h1>
              <p className="text-xs text-slate-400 max-w-xl mx-auto mb-2">
                Executed under TreeConnect digital governance standards and Kerala Forest Produce Transit Regulations.
              </p>
              <div className="digital-agr-meta-row">
                <span>Agreement ID: <strong className="text-emerald-400 font-mono">{agreementId}</strong></span>
                <span>Execution Date: <strong className="text-white">{formatDateDMY(signedDate)}</strong></span>
                <span>Platform Status: <strong className="text-emerald-300 uppercase">OPERATION READY</strong></span>
              </div>
            </div>

            {/* Parties */}
            <div className="digital-agr-parties-grid">
              <div className="digital-agr-party-card">
                <span className="digital-agr-party-role">Party of the First Part (Landowner)</span>
                <div className="digital-agr-party-name">{landownerName}</div>
                <div className="digital-agr-party-detail">
                  Estate: <strong className="text-white">{propertyName}</strong><br />
                  Location: {propertyLocation}<br />
                  Contact: +91 {landownerPhone}
                </div>
              </div>

              <div className="digital-agr-party-card">
                <span className="digital-agr-party-role">Party of the Second Part (Contractor)</span>
                <div className="digital-agr-party-name">{contractorName}</div>
                <div className="digital-agr-party-detail">
                  Company: <strong className="text-white">{contractorCompany}</strong><br />
                  Credentials: Platform Verified Operator<br />
                  Contact: +91 {contractorPhone}
                </div>
              </div>
            </div>

            {/* Schedule A: Timber Inventory & Parcel */}
            <div className="digital-agr-section">
              <div className="digital-agr-section-title">
                <Layers size={14} className="text-emerald-400" />
                Schedule A — Parcel &amp; Assessed Standing Timber Inventory
              </div>
              <table className="digital-agr-table">
                <tbody>
                  <tr>
                    <th style={{ width: '30%' }}>Parcel Site</th>
                    <td>{propertyName} ({propertyLocation})</td>
                    <th style={{ width: '25%' }}>Parcel Extent</th>
                    <td>{request.propertyArea || request.property_area || '11 Cents'}</td>
                  </tr>
                  <tr>
                    <th>Standing Species</th>
                    <td>{request.property_details?.mainSpecies || request.treeSpecies || 'Teak / Hardwood'}</td>
                    <th>Verified Tree Count</th>
                    <td><strong className="text-white">{verifiedTrees} Trees</strong></td>
                  </tr>
                  <tr>
                    <th>Assessed Standing Volume</th>
                    <td><strong className="digital-agr-highlight-val">{formatVolume(assessedVolume)}</strong></td>
                    <th>Haul Road Clearance</th>
                    <td>Heavy 10-wheeler log truck accessible</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Schedule B: Financial & Commercial Terms */}
            <div className="digital-agr-section">
              <div className="digital-agr-section-title">
                <DollarSign size={14} className="text-emerald-400" />
                Schedule B — Agreed Commercial Consideration
              </div>
              <table className="digital-agr-table">
                <thead>
                  <tr>
                    <th>Commercial Model</th>
                    <th>Agreed Consideration (₹)</th>
                    <th>Payment Schedule / Terms</th>
                    <th>Money Flow Direction</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <strong className="text-white">{propType}</strong>
                    </td>
                    <td>
                      <strong className="digital-agr-highlight-val text-sm sm:text-base">
                        {formatINR(totalVal)}
                      </strong>
                    </td>
                    <td>{ass.payment_terms || '100% full settlement upon agreement signing prior to felling'}</td>
                    <td>
                      <span className="text-xs font-bold text-amber-300">
                        {isService ? 'Landowner → Contractor' : isPurchase ? 'Contractor → Landowner' : 'Mutual Arrangement'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Schedule C: Operations & Schedule */}
            <div className="digital-agr-section">
              <div className="digital-agr-section-title">
                <Calendar size={14} className="text-emerald-400" />
                Schedule C — Operational Plan &amp; Mobilization
              </div>
              <table className="digital-agr-table">
                <tbody>
                  <tr>
                    <th style={{ width: '25%' }}>Commencement Date</th>
                    <td><strong className="text-white">{formatDateDMY(startDate)}</strong></td>
                    <th style={{ width: '25%' }}>Estimated Duration</th>
                    <td><strong className="text-white">{duration}</strong></td>
                  </tr>
                  <tr>
                    <th>Assigned Crew Size</th>
                    <td>{crewSize} Trained Loggers &amp; Machine Operators</td>
                    <th>Permit / Transit Status</th>
                    <td>Kerala Forest Form IV / Transport Pass Authorized</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Legal Terms & Safeguards */}
            <div className="digital-agr-section">
              <div className="digital-agr-section-title">
                <ShieldCheck size={14} className="text-emerald-400" />
                Standard Statutory Safeguards &amp; Operational Clauses
              </div>
              <div className="digital-agr-clauses">
                <ol>
                  <li><strong>Boundary Safeguard:</strong> Contractor guarantees felling operations remain strictly confined within parcel boundaries and prevents any damage to boundary walls or neighboring properties.</li>
                  <li><strong>Timber Extraction &amp; Yard Clearance:</strong> All felled timber, branches, and residual logs shall be extracted and the estate cleared within the specified duration ({duration}).</li>
                  <li><strong>Statutory Compliances:</strong> Contractor shall comply with all transit regulations, labor safety guidelines, and environmental rules.</li>
                  <li><strong>Binding Agreement:</strong> Both parties confirm mutual agreement upon rates, volumes, and timelines. Operations are authorized to proceed.</li>
                </ol>
              </div>
            </div>

            {/* Digital Signatures Box */}
            <div className="digital-agr-signatures">
              <div className="digital-agr-sig-box">
                <div className="digital-agr-seal">
                  <CheckCircle2 size={13} /> DIGITALLY AUTHORIZED
                </div>
                <div className="digital-agr-sig-name">{landownerName}</div>
                <div className="digital-agr-sig-sub">Landowner / Estate Custodian</div>
                <div className="text-[10px] text-slate-500 font-mono mt-1">
                  Auth Hash: SHA256:{String(reqId).slice(0, 8)}:LO_ACCEPT
                </div>
              </div>

              <div className="digital-agr-sig-box">
                <div className="digital-agr-seal">
                  <CheckCircle2 size={13} /> DIGITALLY CERTIFIED
                </div>
                <div className="digital-agr-sig-name">{contractorName}</div>
                <div className="digital-agr-sig-sub">Licensed Timber Contractor</div>
                <div className="text-[10px] text-slate-500 font-mono mt-1">
                  Auth Hash: SHA256:{String(reqId).slice(0, 8)}:CTR_EXEC
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="digital-agr-footer no-print">
          <div className="digital-agr-status-ready">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Agreement Finalized • Ready to Start Field Operations</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Printer size={14} />
              <span>Print Agreement</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="cd-btn-confirm-schedule text-xs"
            >
              <span>Done / Close</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalAgreementModal;
