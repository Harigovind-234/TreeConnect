import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useLandowner } from '../../context/LandownerContext';
import {
  ShoppingBag,
  Plus,
  Tag,
  DollarSign,
  MapPin,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';

const TimberMarketplacePage = () => {
  const navigate = useNavigate();
  const { timberListings } = useLandowner();

  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="dashboard-body">
        <Sidebar />

        <div className="dashboard-workspace">
          <main className="dashboard-content max-w-6xl mx-auto py-6">

            {/* Header */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-main flex items-center gap-2">
                  <ShoppingBag className="text-emerald" size={26} /> Timber Marketplace
                </h1>
                <p className="text-sm text-muted">View your published timber listings, buyer interest, and purchase orders.</p>
              </div>

              <button
                onClick={() => navigate('/landowner/create-timber-listing')}
                className="btn btn-primary"
              >
                <Plus size={16} /> List Timber
              </button>
            </div>

            {/* Listings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {timberListings.map((listing) => (
                <div key={listing.id} className="card border border-color rounded-xl overflow-hidden bg-card flex flex-col justify-between">
                  <div>
                    <div className="h-44 bg-surface relative overflow-hidden">
                      {listing.images?.[0] && !listing.images[0].includes('unsplash.com') ? (
                        <img
                          src={listing.images[0]}
                          alt={listing.timberSpecies}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-[#060d08] text-slate-500 p-4 text-center">
                          <Trees size={32} className="text-emerald-500/30 mb-1" />
                          <span className="text-[11px] font-bold text-slate-300">No Image Uploaded</span>
                        </div>
                      )}
                      <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald text-dark shadow">
                        {listing.status}
                      </span>
                    </div>

                    <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-emerald font-semibold">{listing.timberType}</span>
                        <span className="text-xs text-muted">{listing.gradeQuality}</span>
                      </div>

                      <h3 className="text-lg font-bold text-main">{listing.timberSpecies}</h3>
                      <p className="text-xs text-muted line-clamp-2">{listing.description}</p>

                      <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-surface border border-color text-xs">
                        <div>
                          <span className="text-muted block">Volume:</span>
                          <span className="font-bold text-emerald font-mono">{listing.volume} m³</span>
                        </div>
                        <div>
                          <span className="text-muted block">Asking Price:</span>
                          <span className="font-bold text-gold font-mono">${listing.askingPrice?.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-muted block">Rate:</span>
                          <span className="font-semibold text-main">${listing.pricePerM3}/m³</span>
                        </div>
                        <div>
                          <span className="text-muted block">Negotiable:</span>
                          <span className="font-semibold text-main">{listing.negotiable}</span>
                        </div>
                      </div>

                      <div className="text-xs text-muted flex items-center gap-1">
                        <MapPin size={12} className="text-emerald" /> {listing.district} • {listing.storageLocation}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border-t border-color bg-surface/50 text-xs text-muted flex items-center justify-between">
                    <span>From {listing.propertyName}</span>
                    <span className="text-emerald font-medium">Active Listing</span>
                  </div>
                </div>
              ))}
            </div>

          </main>
        </div>
      </div>
    </div>
  );
};

export default TimberMarketplacePage;
