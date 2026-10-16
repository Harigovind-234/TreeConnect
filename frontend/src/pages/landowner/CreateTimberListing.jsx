import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useLandowner } from '../../context/LandownerContext';
import FileUploadCard from '../../components/FileUploadCard';
import marketplaceService from '../../services/marketplaceService';
import {
  ShoppingBag,
  ArrowLeft,
  CheckCircle2,
  DollarSign,
  MapPin,
  FileText,
  Upload,
  X,
  AlertCircle,
  Tag,
  Sparkles,
  Truck,
  Building,
  Trees
} from 'lucide-react';

const CreateTimberListing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { completedHarvests = [], properties = [] } = useLandowner();

  const userRole = user?.role || 'landowner';
  const isContractor = userRole === 'contractor';

  // Selection mode: 'harvest_operation' or 'direct_inventory'
  const hasHarvestOps = completedHarvests && completedHarvests.length > 0;
  const [listingSource, setListingSource] = useState(hasHarvestOps ? 'harvest_operation' : 'direct_inventory');
  const [selectedOperationId, setSelectedOperationId] = useState(completedHarvests[0]?.id || '');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    propertyName: properties[0]?.name || (isContractor ? 'Contractor Central Log Yard' : 'Family Agro-Forestry Estate'),
    timberSpecies: 'Teakwood',
    timberType: 'Sawlogs',
    quantity: 50,
    volume: 35,
    gradeQuality: 'Grade A Prime Export',
    logDimensions: 'Avg length: 4.2m, Avg girth: 120-150cm',
    harvestDate: new Date().toISOString().split('T')[0],

    askingPrice: 1487500,
    pricePerM3: 42500,
    negotiable: 'Yes',

    district: properties[0]?.district || 'Kottayam',
    storageLocation: 'Central Estate Holding Yard',
    pickupLocation: 'Main Highway Access Gate #1',
    transportAvailable: isContractor,
    transportNotes: isContractor ? 'Contractor logistics fleet available for mill haulage' : '',

    description: 'Matured, high-density Kerala timber logs with clean straight boles and uniform grain. Debarked with end-seal to prevent radial checking. Forest transit clearance ready.',
    status: 'Published'
  });

  const [logPhotos, setLogPhotos] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errors, setErrors] = useState({});

  const handleSourceChange = (mode) => {
    setListingSource(mode);
    if (mode === 'harvest_operation' && hasHarvestOps) {
      handleOperationChange(completedHarvests[0]?.id);
    }
  };

  const handleOperationChange = (opId) => {
    setSelectedOperationId(opId);
    const target = completedHarvests.find(h => h.id === opId);
    if (target) {
      const vol = Number(target.harvestedVolume) || 30;
      const rate = 42500;
      setFormData(prev => ({
        ...prev,
        title: `${target.species} Sawlogs (${target.propertyName || 'Harvest'})`,
        propertyName: target.propertyName || prev.propertyName,
        timberSpecies: target.species || 'Teakwood',
        timberType: target.timberType || 'Sawlogs',
        quantity: target.quantity || 50,
        volume: vol,
        gradeQuality: target.gradeQuality || 'Grade A Prime Export',
        logDimensions: target.logDimensions || 'Avg length: 4m, Avg girth: 130cm',
        harvestDate: target.harvestDate || new Date().toISOString().split('T')[0],
        storageLocation: target.storageLocation || 'Estate On-Site Log Yard',
        district: target.district || prev.district,
        pickupLocation: target.pickupLocation || prev.pickupLocation,
        pricePerM3: rate,
        askingPrice: vol * rate
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;

    setFormData(prev => {
      const updated = { ...prev, [name]: val };
      if (name === 'askingPrice' || name === 'volume') {
        const vol = Number(name === 'volume' ? value : updated.volume) || 1;
        const total = Number(name === 'askingPrice' ? value : updated.askingPrice) || 0;
        if (vol > 0 && name === 'askingPrice') {
          updated.pricePerM3 = Math.round(total / vol);
        } else if (name === 'volume') {
          updated.askingPrice = Math.round(vol * (Number(updated.pricePerM3) || 30000));
        }
      } else if (name === 'pricePerM3') {
        const vol = Number(updated.volume) || 1;
        const rate = Number(value) || 0;
        updated.askingPrice = Math.round(vol * rate);
      }
      return updated;
    });

    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.timberSpecies) newErrors.timberSpecies = 'Timber species is required';
    if (!formData.volume || Number(formData.volume) <= 0) newErrors.volume = 'Valid volume (m³) is required';
    if (!formData.askingPrice || Number(formData.askingPrice) <= 0) newErrors.askingPrice = 'Asking price is required';
    if (!formData.district) newErrors.district = 'District location is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        title: formData.title || `${formData.gradeQuality} ${formData.timberSpecies} Logs`,
        volume: Number(formData.volume),
        quantity: Number(formData.quantity) || 1,
        askingPrice: Number(formData.askingPrice),
        pricePerM3: Number(formData.pricePerM3),
        sellerRole: userRole,
        sellerName: user?.name || user?.full_name || (isContractor ? 'Verified Contractor' : 'Registered Landowner'),
        sellerEmail: user?.email || '',
        sellerPhone: user?.phone || '+91 94470 00000',
        harvestOperationId: listingSource === 'harvest_operation' ? selectedOperationId : null,
        images: logPhotos ? [URL.createObjectURL(logPhotos)] : []
      };

      marketplaceService.saveListing(payload, user);

      setIsSubmitting(false);
      setSuccessMessage('Timber listing published successfully on Marketplace!');

      setTimeout(() => {
        if (isContractor) {
          navigate('/contractor/marketplace');
        } else {
          navigate('/landowner/marketplace');
        }
      }, 1200);
    } catch (err) {
      console.error('Failed to publish listing:', err);
      setIsSubmitting(false);
      setErrors({ form: 'Failed to publish listing. Please try again.' });
    }
  };

  const returnPath = isContractor ? '/contractor/marketplace' : '/landowner/marketplace';

  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="dashboard-body">
        <Sidebar />

        <div className="dashboard-workspace">
          <main className="dashboard-content max-w-4xl mx-auto py-6">

            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <button
                  onClick={() => navigate(returnPath)}
                  className="btn btn-secondary btn-sm mb-2 flex items-center gap-1 text-muted hover:text-main"
                >
                  <ArrowLeft size={16} /> Back to Marketplace
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald/15 border border-emerald/30 flex items-center justify-center text-emerald">
                    <ShoppingBag size={24} />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-main">
                      {isContractor ? 'List Harvested Timber for Sale' : 'List Estate Timber for Sale'}
                    </h1>
                    <p className="text-sm text-muted">
                      {isContractor
                        ? 'Publish harvested logs or yard stocks to verified commercial buyers across Kerala.'
                        : 'List felled logs or standing estate timber for buyers to browse, negotiate, and purchase.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* SUCCESS BANNER */}
            {successMessage && (
              <div className="mb-6 p-4 rounded-xl bg-emerald/15 border border-emerald text-emerald flex items-center gap-3 animate-fade-in">
                <CheckCircle2 size={20} />
                <span className="font-semibold text-sm">{successMessage}</span>
              </div>
            )}

            {errors.form && (
              <div className="mb-6 p-4 rounded-xl bg-red-900/20 border border-red-500/50 text-red-300 flex items-center gap-3">
                <AlertCircle size={20} className="text-red-400" />
                <span className="text-sm">{errors.form}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* LISTING SOURCE SELECTION */}
              <div className="card p-5 border border-color rounded-xl bg-card">
                <label className="text-sm font-bold text-main block mb-3 flex items-center gap-2">
                  <Tag size={16} className="text-emerald" /> Listing Inventory Source
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleSourceChange('direct_inventory')}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      listingSource === 'direct_inventory'
                        ? 'bg-emerald/10 border-emerald text-white ring-1 ring-emerald'
                        : 'bg-surface border-color text-muted hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-main flex items-center gap-2">
                        <Trees size={16} className="text-emerald" /> Direct Timber Stock / Felled Wood
                      </span>
                      {listingSource === 'direct_inventory' && <CheckCircle2 size={16} className="text-emerald" />}
                    </div>
                    <p className="text-xs text-muted">
                      List timber logs, seasoned baulks, or standing trees directly from your property or yard.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSourceChange('harvest_operation')}
                    disabled={!hasHarvestOps}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      !hasHarvestOps
                        ? 'opacity-50 cursor-not-allowed bg-surface/50 border-color'
                        : listingSource === 'harvest_operation'
                        ? 'bg-emerald/10 border-emerald text-white ring-1 ring-emerald'
                        : 'bg-surface border-color text-muted hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-main flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald" /> Completed Harvesting Operation
                      </span>
                      {hasHarvestOps && listingSource === 'harvest_operation' && <CheckCircle2 size={16} className="text-emerald" />}
                    </div>
                    <p className="text-xs text-muted">
                      {hasHarvestOps
                        ? 'Auto-fill specs from verified completed contractor harvests in your profile.'
                        : 'No completed harvests recorded yet (use Direct Timber Stock above).'}
                    </p>
                  </button>
                </div>

                {/* If Harvest Operation Selected */}
                {listingSource === 'harvest_operation' && hasHarvestOps && (
                  <div className="mt-4 pt-4 border-t border-color">
                    <label className="text-xs font-semibold text-slate-300 block mb-2">
                      Select Harvest Operation Record:
                    </label>
                    <select
                      value={selectedOperationId}
                      onChange={(e) => handleOperationChange(e.target.value)}
                      className="form-input text-sm font-semibold"
                    >
                      {completedHarvests.map(h => (
                        <option key={h.id} value={h.id}>
                          {h.operationTitle || `${h.species} Harvest`} — {h.species} ({h.harvestedVolume || 30} m³ available)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* TIMBER SPECIFICATIONS */}
              <div className="card p-6 border border-color rounded-xl bg-card">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-color">
                  <Tag size={18} className="text-emerald" />
                  <h2 className="text-lg font-bold text-main">Timber Details & Specifications</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="form-group md:col-span-2">
                    <label className="form-label">Listing Title</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="e.g. Grade A1 Matured Nilambur Teak Sawlogs"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Estate / Yard Name</label>
                    <input
                      type="text"
                      name="propertyName"
                      value={formData.propertyName}
                      onChange={handleInputChange}
                      placeholder="e.g. Wayanad Estate Stand #2"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Timber Species *</label>
                    <select
                      name="timberSpecies"
                      value={formData.timberSpecies}
                      onChange={handleInputChange}
                      className="form-input"
                    >
                      <option value="Teakwood">Teakwood (Tectona grandis)</option>
                      <option value="Rosewood">Rosewood (Dalbergia latifolia)</option>
                      <option value="Rubberwood">Rubberwood (Hevea brasiliensis)</option>
                      <option value="Mahogany">Mahogany (Swietenia macrophylla)</option>
                      <option value="Eucalyptus">Eucalyptus / Nilgiri</option>
                      <option value="Jackfruit">Jackfruit (Artocarpus heterophyllus)</option>
                      <option value="Acacia">Acacia (Mangium / Auriculiformis)</option>
                      <option value="Anjili">Anjili (Artocarpus hirsutus)</option>
                      <option value="Other Commercial Wood">Other Commercial Hardwood</option>
                    </select>
                    {errors.timberSpecies && <p className="text-xs text-red-400 mt-1">{errors.timberSpecies}</p>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Timber Type</label>
                    <select
                      name="timberType"
                      value={formData.timberType}
                      onChange={handleInputChange}
                      className="form-input"
                    >
                      <option value="Sawlogs">Sawlogs (Standard Cut)</option>
                      <option value="Veneer Logs">Peeler / Veneer Logs</option>
                      <option value="Poles">Poles & Scaffolding Posts</option>
                      <option value="Pulpwood">Pulpwood / Chip Logs</option>
                      <option value="Firewood">Firewood & Biomass</option>
                      <option value="Sawn Baulks">Rough Sawn Baulks</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Grade / Quality</label>
                    <select
                      name="gradeQuality"
                      value={formData.gradeQuality}
                      onChange={handleInputChange}
                      className="form-input"
                    >
                      <option value="Grade A Prime Export">Grade A Prime Export (Straight, defect-free)</option>
                      <option value="Grade B Sawlog">Grade B Sawlog (Standard commercial)</option>
                      <option value="Premium Veneer Grade">Premium Veneer Grade</option>
                      <option value="Industrial Furniture Grade">Industrial Furniture Grade</option>
                      <option value="Joinery Grade #1">Joinery Grade #1</option>
                      <option value="Construction Grade">Construction Grade</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Volume (m³) *</label>
                    <input
                      type="number"
                      step="0.5"
                      name="volume"
                      value={formData.volume}
                      onChange={handleInputChange}
                      className="form-input text-emerald font-bold font-mono text-base"
                    />
                    {errors.volume && <p className="text-xs text-red-400 mt-1">{errors.volume}</p>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Quantity (logs / units)</label>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      className="form-input font-mono"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Harvest / Felling Date</label>
                    <input
                      type="date"
                      name="harvestDate"
                      value={formData.harvestDate}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group md:col-span-3">
                    <label className="form-label">Log Dimensions & Girth Specifications</label>
                    <input
                      type="text"
                      name="logDimensions"
                      value={formData.logDimensions}
                      onChange={handleInputChange}
                      placeholder="e.g. Avg length: 4.5m, Girth range: 120cm - 160cm mid-log"
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              {/* PRICING & COMMERCIAL TERMS */}
              <div className="card p-6 border border-color rounded-xl bg-card">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-color">
                  <DollarSign size={18} className="text-emerald" />
                  <h2 className="text-lg font-bold text-main">Pricing & Negotiation Terms</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="form-group">
                    <label className="form-label">Price per m³ (₹ / m³) *</label>
                    <input
                      type="number"
                      name="pricePerM3"
                      value={formData.pricePerM3}
                      onChange={handleInputChange}
                      className="form-input text-emerald font-bold font-mono text-base"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Total Asking Price (₹) *</label>
                    <input
                      type="number"
                      name="askingPrice"
                      value={formData.askingPrice}
                      onChange={handleInputChange}
                      className="form-input text-emerald font-bold font-mono text-base"
                    />
                    {errors.askingPrice && <p className="text-xs text-red-400 mt-1">{errors.askingPrice}</p>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Price Open for Negotiation?</label>
                    <select
                      name="negotiable"
                      value={formData.negotiable}
                      onChange={handleInputChange}
                      className="form-input font-medium"
                    >
                      <option value="Yes">Yes — Allow Buyers to Submit Counter-Offers</option>
                      <option value="No">No — Fixed Price Only</option>
                    </select>
                  </div>
                </div>

                <div className="mt-3 p-3 bg-surface rounded-lg border border-color text-xs flex items-center justify-between text-muted">
                  <span>Calculated Valuation: <strong className="text-white">₹ {Number(formData.askingPrice).toLocaleString('en-IN')}</strong></span>
                  <span>Effective Unit Rate: <strong className="text-emerald">₹ {Number(formData.pricePerM3).toLocaleString('en-IN')} / m³</strong></span>
                </div>
              </div>

              {/* LOCATION & LOGISTICS */}
              <div className="card p-6 border border-color rounded-xl bg-card">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-color">
                  <MapPin size={18} className="text-emerald" />
                  <h2 className="text-lg font-bold text-main">Location & Logistics Support</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="form-group">
                    <label className="form-label">District in Kerala *</label>
                    <select
                      name="district"
                      value={formData.district}
                      onChange={handleInputChange}
                      className="form-input"
                    >
                      <option value="Wayanad">Wayanad</option>
                      <option value="Palakkad">Palakkad</option>
                      <option value="Kottayam">Kottayam</option>
                      <option value="Idukki">Idukki</option>
                      <option value="Ernakulam">Ernakulam</option>
                      <option value="Thrissur">Thrissur</option>
                      <option value="Malappuram">Malappuram</option>
                      <option value="Kannur">Kannur</option>
                      <option value="Kozhikode">Kozhikode</option>
                      <option value="Pathanamthitta">Pathanamthitta</option>
                      <option value="Kollam">Kollam</option>
                      <option value="Thiruvananthapuram">Thiruvananthapuram</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Storage Yard / Depot</label>
                    <input
                      type="text"
                      name="storageLocation"
                      value={formData.storageLocation}
                      onChange={handleInputChange}
                      placeholder="e.g. Central Yard, Pala"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Pickup & Loading Point</label>
                    <input
                      type="text"
                      name="pickupLocation"
                      value={formData.pickupLocation}
                      onChange={handleInputChange}
                      placeholder="e.g. State Highway 1 Gate Access"
                      className="form-input"
                    />
                  </div>

                  {/* Transport capability */}
                  <div className="form-group md:col-span-3 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                      <input
                        type="checkbox"
                        name="transportAvailable"
                        checked={formData.transportAvailable}
                        onChange={handleInputChange}
                        className="rounded border-slate-700 text-emerald focus:ring-emerald h-4 w-4"
                      />
                      <span className="text-sm font-semibold text-main flex items-center gap-1.5">
                        <Truck size={16} className="text-emerald" /> Hauling / Delivery Transport Available by Seller
                      </span>
                    </label>

                    {formData.transportAvailable && (
                      <input
                        type="text"
                        name="transportNotes"
                        value={formData.transportNotes}
                        onChange={handleInputChange}
                        placeholder="e.g. Heavy log trailers available for transport up to 150km at subsidized freight"
                        className="form-input text-xs"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* DESCRIPTION & PHOTOS */}
              <div className="card p-6 border border-color rounded-xl bg-card space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-color">
                  <Sparkles size={18} className="text-emerald" />
                  <h2 className="text-lg font-bold text-main">Description, Photos & Status</h2>
                </div>

                <div className="form-group">
                  <label className="form-label">Timber Description</label>
                  <textarea
                    name="description"
                    rows="3"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Provide details on wood density, bark removal, seasoning, sawmill or veneer suitability, and forest transit passes..."
                    className="form-input"
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FileUploadCard
                    label="Timber Yard & Log Photos"
                    sublabel="Upload photos of timber stacks, log ends, or yard batch"
                    file={logPhotos}
                    onFileSelect={(f) => setLogPhotos(f)}
                    onFileRemove={() => setLogPhotos(null)}
                  />

                  <div className="form-group">
                    <label className="form-label">Publishing Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="form-input font-semibold"
                    >
                      <option value="Published">Published (Active on Marketplace)</option>
                      <option value="Draft">Save as Draft (Private)</option>
                    </select>
                    <p className="text-xs text-muted mt-2">
                      When published, commercial buyers across the network can view your timber, submit negotiation proposals, or purchase lots directly.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => navigate(returnPath)}
                  className="btn btn-secondary"
                  disabled={isSubmitting}
                >
                  <X size={16} /> Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary min-w-48"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span>Publishing...</span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <ShoppingBag size={16} /> Publish Timber Listing
                    </span>
                  )}
                </button>
              </div>

            </form>
          </main>
        </div>
      </div>
    </div>
  );
};

export default CreateTimberListing;
