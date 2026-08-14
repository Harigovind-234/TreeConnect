import React, { useState } from 'react';
import { useLandowner } from '../../context/LandownerContext';
import ContractorProfileModal from './ContractorProfileModal';
import {
  ShieldCheck,
  Star,
  MapPin,
  Briefcase,
  MessageSquare,
  UserCheck,
  ChevronRight,
  Clock
} from 'lucide-react';

const ContractorBrowser = () => {
  const { contractors, startContractorDiscussion } = useLandowner();
  const [selectedProfileContractor, setSelectedProfileContractor] = useState(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-main flex items-center gap-2">
            Available Forestry & Tree Services Contractors
          </h2>
          <p className="text-xs text-muted">Browse verified contractors operating in your area. Contact and discuss terms before agreeing.</p>
        </div>
        <span className="text-xs text-emerald bg-emerald/15 px-2.5 py-1 rounded-full font-semibold">
          {contractors.length} Verified Contractors Nearby
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {contractors.map((c) => (
          <div key={c.id} className="card p-5 border border-color rounded-xl bg-card flex flex-col justify-between space-y-4 hover:border-emerald/40 transition-all">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start gap-3">
                <img
                  src={c.avatar}
                  alt={c.contractorName}
                  className="w-12 h-12 rounded-xl object-cover border border-emerald/30"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-main text-sm">{c.companyName}</h3>
                  </div>
                  <span className="text-xs text-emerald font-medium flex items-center gap-1">
                    <ShieldCheck size={13} /> TreeConnect Verified
                  </span>
                  <p className="text-xs text-muted mt-0.5">{c.contractorName} • {c.experienceYears} Years Exp.</p>
                </div>
              </div>

              {/* Rating & Stats */}
              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-surface border border-color text-xs">
                <div>
                  <span className="text-muted block">Rating:</span>
                  <span className="font-bold text-gold flex items-center gap-1">
                    <Star size={13} className="fill-gold" /> {c.rating} / 5.0
                  </span>
                </div>
                <div>
                  <span className="text-muted block">Completed:</span>
                  <span className="font-bold text-emerald">{c.completedProjects} Projects</span>
                </div>
              </div>

              {/* Service Area & Availability */}
              <div className="space-y-1 text-xs text-muted">
                <div className="flex items-center gap-1">
                  <MapPin size={12} className="text-emerald" /> {c.serviceArea}
                </div>
                <div className="flex items-center gap-1 text-emerald font-medium">
                  <Clock size={12} /> Availability: {c.availability}
                </div>
              </div>

              {/* Specializations Pills */}
              <div className="flex flex-wrap gap-1 pt-1">
                {c.specializations.slice(0, 2).map((s) => (
                  <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-dark/60 border border-color text-muted">
                    • {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-color">
              <button
                onClick={() => setSelectedProfileContractor(c)}
                className="btn btn-secondary btn-xs text-xs flex items-center justify-center gap-1"
              >
                View Profile
              </button>
              <button
                onClick={() => startContractorDiscussion(c.id)}
                className="btn btn-primary btn-xs text-xs flex items-center justify-center gap-1"
              >
                <MessageSquare size={13} /> Contact
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Contractor Profile Modal */}
      {selectedProfileContractor && (
        <ContractorProfileModal
          contractor={selectedProfileContractor}
          onClose={() => setSelectedProfileContractor(null)}
          onContact={() => {
            const cid = selectedProfileContractor.id;
            setSelectedProfileContractor(null);
            startContractorDiscussion(cid);
          }}
        />
      )}
    </div>
  );
};

export default ContractorBrowser;
