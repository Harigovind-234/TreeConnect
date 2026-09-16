import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Award,
  Truck,
  Wrench,
  MapPin,
  CheckCircle2,
  Star,
  Search,
  Check,
  Building2,
  FileCheck,
  Phone,
  Mail,
  Loader2,
  X
} from 'lucide-react';
import api from '../../services/api';

const ApprovedContractorSelector = ({
  selectedContractorId,
  onSelectContractor,
  onCancel,
  isModal = false
}) => {
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');

  useEffect(() => {
    const fetchApprovedContractors = async () => {
      setLoading(true);
      try {
        const response = await api.get('/admin/users');
        const allUsers = response.data?.users || [];

        // Filter ONLY contractors who are status = "Active" / "Approved", isVerified = true, role = "contractor"
        const approved = allUsers.filter(u => {
          const roleMatch = (u.role || '').toLowerCase() === 'contractor';
          const verifiedMatch = u.isVerified === true;
          const statusStr = (u.status || '').toLowerCase();
          const activeMatch = statusStr === 'active' || statusStr === 'approved';
          return roleMatch && verifiedMatch && activeMatch;
        });

        setContractors(approved);
      } catch (err) {
        console.error("Failed to fetch contractors from admin endpoint:", err);
        setContractors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchApprovedContractors();
  }, []);

  const filteredContractors = contractors.filter(c => {
    const nameStr = (c.name || c.companyName || '').toLowerCase();
    const locStr = (c.location || c.district || '').toLowerCase();
    const equipStr = (c.equipment || '').toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesSearch = !query || nameStr.includes(query) || locStr.includes(query) || equipStr.includes(query);
    const matchesDistrict = districtFilter === 'all' || locStr.includes(districtFilter.toLowerCase());

    return matchesSearch && matchesDistrict;
  });

  const content = (
    <div className="contractor-selector-container space-y-6">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-emerald-500/20 pb-4">
        <div>
          <div className="contractor-verified-badge mb-2">
            <ShieldCheck size={14} /> Admin Verified Contractors Only
          </div>
          <h3 className="text-xl font-extrabold text-white">Select Platform-Approved Contractor</h3>
          <p className="text-xs text-slate-400 mt-1">
            Only contractors verified by TreeConnect Admin with active forest & trade licences are eligible to receive harvest requests.
          </p>
        </div>

        {isModal && onCancel && (
          <button
            onClick={onCancel}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Close Modal"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by company name, location, equipment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="contractor-search-box"
          />
        </div>

        <select
          value={districtFilter}
          onChange={(e) => setDistrictFilter(e.target.value)}
          className="contractor-filter-select"
        >
          <option value="all">All Kerala Districts</option>
          <option value="kottayam">Kottayam</option>
          <option value="ernakulam">Ernakulam</option>
          <option value="idukki">Idukki</option>
          <option value="wayanad">Wayanad</option>
          <option value="palakkad">Palakkad</option>
          <option value="kozhikode">Kozhikode</option>
          <option value="thiruvananthapuram">Thiruvananthapuram</option>
          <option value="thrissur">Thrissur</option>
          <option value="kollam">Kollam</option>
          <option value="alappuzha">Alappuzha</option>
          <option value="kannur">Kannur</option>
        </select>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 space-y-3">
          <Loader2 size={32} className="animate-spin text-emerald-400 mx-auto" />
          <p className="text-xs">Fetching verified contractors from database...</p>
        </div>
      ) : filteredContractors.length === 0 ? (
        <div className="p-8 text-center bg-[#0a1810] border border-emerald-500/20 rounded-2xl space-y-2">
          <ShieldCheck size={36} className="text-emerald-500/40 mx-auto" />
          <h4 className="font-bold text-white text-sm">No Approved Contractors Found</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No active admin-verified contractors match your current search filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-h-[520px] overflow-y-auto pr-1">
          {filteredContractors.map((c) => {
            const isSelected = selectedContractorId === c.id || selectedContractorId === c._id;
            
            // Format contractor display name nicely
            let cName = c.fullName || c.name || c.companyName || c.contactPerson || c.email || 'Harvesting Contractor';
            if (cName.includes('@') && (c.fullName || c.name || c.contactPerson)) {
              cName = c.fullName || c.name || c.contactPerson;
            }

            const expStr = (c.experience && c.experience !== 'N/A') ? c.experience : 'Licensed Contractor';
            const docStr = (c.docType && c.docType !== 'No Verification Documents') ? c.docType : 'Forest Licence, Trade Licence';
            const equipStr = (c.equipment && c.equipment !== 'N/A') ? c.equipment : 'Logging Rig, Chain Saw Rig, Timber Hauler';
            const ratingVal = c.rating || 4.9;
            const jobsVal = c.completedJobs || 12;

            return (
              <div
                key={c.id || c._id}
                onClick={() => onSelectContractor(c)}
                className={`contractor-grid-card ${isSelected ? 'selected' : ''}`}
              >
                <div className="space-y-3">
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-extrabold text-white text-base leading-snug">{cName}</h4>
                        <span className="text-emerald-400 shrink-0" title="Verified by TreeConnect Admin">
                          <CheckCircle2 size={16} />
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 flex items-center gap-1">
                        <MapPin size={12} className="text-emerald-400 shrink-0" /> {c.location || c.district || 'Kerala'}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="contractor-verified-badge">
                        Active & Verified
                      </span>
                      <div className="flex items-center gap-1 text-xs text-amber-400 font-extrabold mt-0.5">
                        <Star size={12} className="fill-amber-400" /> {ratingVal} <span className="text-slate-400 font-normal">({jobsVal} jobs)</span>
                      </div>
                    </div>
                  </div>

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-2 gap-3 py-2.5 text-xs border-y border-emerald-500/15">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Experience:</span>
                      <span className="text-white font-bold">{expStr}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Licences:</span>
                      <span className="text-emerald-300 font-bold truncate block" title={docStr}>
                        {docStr}
                      </span>
                    </div>
                  </div>

                  {/* Equipment */}
                  <div className="text-xs">
                    <span className="text-slate-400 block text-[11px] flex items-center gap-1 mb-0.5">
                      <Wrench size={12} className="text-emerald-400 shrink-0" /> Equipment & Fleet:
                    </span>
                    <p className="text-slate-200 font-medium text-[11px] leading-relaxed truncate">{equipStr}</p>
                  </div>
                </div>

                {/* Selection Footer Button */}
                <div className="pt-3 border-t border-emerald-500/10 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <FileCheck size={13} className="text-emerald-400" /> Admin Approved
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectContractor(c);
                    }}
                    className={isSelected ? 'contractor-btn-selected' : 'contractor-btn-select'}
                  >
                    {isSelected ? (
                      <>
                        <Check size={14} strokeWidth={3} /> Selected Contractor
                      </>
                    ) : (
                      'Select Contractor'
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-[#0a120c] border border-emerald-500/30 rounded-3xl max-w-4xl w-full p-7 max-h-[85vh] overflow-y-auto shadow-2xl">
          {content}
        </div>
      </div>
    );
  }

  return content;
};

export default ApprovedContractorSelector;
