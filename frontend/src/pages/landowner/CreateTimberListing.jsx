import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useLandowner } from '../../context/LandownerContext';
import FileUploadCard from '../../components/FileUploadCard';
import {
  ShoppingBag,
  ArrowLeft,
  CheckCircle2,
  Trees,
  DollarSign,
  MapPin,
  FileText,
  Upload,
  Save,
  X,
  AlertCircle,
  Tag,
  Sparkles
} from 'lucide-react';

const CreateTimberListing = () => {
  const navigate = useNavigate();
  const { completedHarvests, addTimberListing } = useLandowner();

  // Selected Harvest Operation from available harvested inventory
  const defaultHarvestOp = completedHarvests[0] || null;
  const [selectedOperationId, setSelectedOperationId] = useState(defaultHarvestOp?.id || '');

  const selectedOp = completedHarvests.find(h => h.id === selectedOperationId) || defaultHarvestOp;

  // Form State
  const [formData, setFormData] = useState({
    propertyId: selectedOp?.propertyId || '',
    propertyName: selectedOp?.propertyName || '',
    timberSpecies: selectedOp?.species || 'Teak',
    timberType: selectedOp?.timberType || 'Sawlogs',
    quantity: selectedOp?.quantity || 100,
    volume: selectedOp?.harvestedVolume || 50,
    gradeQuality: selectedOp?.gradeQuality || 'Grade A',
    logDimensions: selectedOp?.logDimensions || 'Avg length: 4.0m, Avg diameter: 40cm',
    harvestDate: selectedOp?.harvestDate || new Date().toISOString().split('T')[0],

    askingPrice: 10000,
    pricePerM3: 115,
    negotiable: 'Yes',

    storageLocation: selectedOp?.storageLocation || 'Central Estate Yard',
    district: selectedOp?.district || 'Kottayam',
    pickupLocation: selectedOp?.pickupLocation || 'Main Gate Access',

    description: 'Freshly harvested rubber timber from a private estate in Kottayam. Suitable for sawmill and furniture applications.',
    status: 'Published'
  });

  const [logPhotos, setLogPhotos] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errors, setErrors] = useState({});

  const handleOperationChange = (opId) => {
    setSelectedOperationId(opId);
    const target = completedHarvests.find(h => h.id === opId);
    if (target) {
      setFormData(prev => ({
        ...prev,
        propertyId: target.propertyId,
        propertyName: target.propertyName,
        timberSpecies: target.species,
        timberType: target.timberType || 'Sawlogs',
        quantity: target.quantity,
        volume: target.harvestedVolume,
        gradeQuality: target.gradeQuality || 'Grade A Prime',
        logDimensions: target.logDimensions || 'Avg length: 4m, Avg diameter: 40cm',
        harvestDate: target.harvestDate,
        storageLocation: target.storageLocation,
        district: target.district,
        pickupLocation: target.pickupLocation,
        askingPrice: Math.round(target.harvestedVolume * 115),
        pricePerM3: 115
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'askingPrice' || name === 'volume') {
        const vol = Number(updated.volume) || 1;
        const price = Number(updated.askingPrice) || 0;
        updated.pricePerM3 = Math.round(price / vol);
      }
      return updated;
    });
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!selectedOperationId) newErrors.operation = 'Please select a completed harvest operation';
    if (!formData.askingPrice || Number(formData.askingPrice) <= 0) newErrors.askingPrice = 'Asking price required';
    if (!formData.volume || Number(formData.volume) <= 0) newErrors.volume = 'Volume required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      addTimberListing({
        ...formData,
        harvestOperationId: selectedOp?.id,
        harvestOperationTitle: selectedOp?.operationTitle,
        askingPrice: Number(formData.askingPrice),
        volume: Number(formData.volume),
        pricePerM3: Number(formData.pricePerM3),
        quantity: Number(formData.quantity)
      });

      setIsSubmitting(false);
      setSuccessMessage('Timber listing published successfully!');
      setTimeout(() => {
        navigate('/landowner/marketplace');
      }, 1200);
    }, 600);
  };

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
                  onClick={() => navigate('/landowner/dashboard')}
                  className="btn btn-secondary btn-sm mb-2 flex items-center gap-1 text-muted hover:text-main"
                >
                  <ArrowLeft size={16} /> Back to Dashboard
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald/15 border border-emerald/30 flex items-center justify-center text-emerald">
                    <ShoppingBag size={24} />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-main">List Timber for Sale</h1>
                    <p className="text-sm text-muted">Create a timber marketplace listing from completed harvesting operations.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* SUCCESS BANNER */}
            {successMessage && (
              <div className="mb-6 p-4 rounded-xl bg-emerald/15 border border-emerald text-emerald flex items-center gap-3 animate-fade-in">
                <CheckCircle2 size={20} />
                <span className="font-semibold text-sm">{successMessage} Redirecting to Marketplace...</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* IMPORTANT HARVEST OPERATION SELECTOR */}
              <div className="card p-6 border border-emerald/40 rounded-xl bg-card">
                <label className="text-base font-bold text-main block mb-2 flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald" /> Select Completed Harvest Operation
                </label>
                <p className="text-xs text-muted mb-4">
                  Note: Listings are restricted to verified completed harvesting operations with available harvested volume.
                </p>

                <div className="space-y-3">
                  <select
                    value={selectedOperationId}
                    onChange={(e) => handleOperationChange(e.target.value)}
                    className={`form-input text-base font-bold ${errors.operation ? 'border-red-500' : ''}`}
                  >
                    {completedHarvests.map(h => (
                      <option key={h.id} value={h.id}>
                        {h.operationTitle} — {h.species} ({h.harvestedVolume} m³ available)
                      </option>
                    ))}
                  </select>
                  {errors.operation && <p className="text-xs text-red-400">{errors.operation}</p>}

                  {selectedOp && (
                    <div className="p-4 rounded-xl bg-surface border border-color text-xs grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <span className="text-muted block">Property:</span>
                        <span className="font-bold text-emerald text-sm">{selectedOp.propertyName}</span>
                      </div>
                      <div>
                        <span className="text-muted block">Contractor:</span>
                        <span className="font-semibold text-main">{selectedOp.contractor}</span>
                      </div>
                      <div>
                        <span className="text-muted block">Harvested Volume:</span>
                        <span className="font-bold text-emerald font-mono text-sm">{selectedOp.harvestedVolume} m³</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* TIMBER DETAILS */}
              <div className="card p-6 border border-color rounded-xl bg-card">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-color">
                  <Tag size={18} className="text-emerald" />
                  <h2 className="text-lg font-bold text-main">Timber Details</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="form-group">
                    <label className="form-label">Property</label>
                    <input
                      type="text"
                      name="propertyName"
                      value={formData.propertyName}
                      onChange={handleInputChange}
                      className="form-input bg-surface text-muted"
                      readOnly
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Timber Species</label>
                    <input
                      type="text"
                      name="timberSpecies"
                      value={formData.timberSpecies}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Timber Type</label>
                    <select
                      name="timberType"
                      value={formData.timberType}
                      onChange={handleInputChange}
                      className="form-input"
                    >
                      <option value="Sawlogs">Sawlogs</option>
                      <option value="Pulpwood">Pulpwood</option>
                      <option value="Veneer Logs">Veneer Logs</option>
                      <option value="Firewood">Firewood / Biomass</option>
                      <option value="Poles">Poles & Posts</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Quantity (logs/pieces)</label>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Volume (m³)</label>
                    <input
                      type="number"
                      name="volume"
                      value={formData.volume}
                      onChange={handleInputChange}
                      className="form-input text-emerald font-bold font-mono"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Grade / Quality</label>
                    <select
                      name="gradeQuality"
                      value={formData.gradeQuality}
                      onChange={handleInputChange}
                      className="form-input"
                    >
                      <option value="Grade A Prime">Grade A Prime</option>
                      <option value="Grade B Sawlog">Grade B Sawlog</option>
                      <option value="Grade C Industrial">Grade C Industrial</option>
                      <option value="Custom">Custom Grade</option>
                    </select>
                  </div>

                  <div className="form-group md:col-span-2">
                    <label className="form-label">Log Dimensions</label>
                    <input
                      type="text"
                      name="logDimensions"
                      value={formData.logDimensions}
                      onChange={handleInputChange}
                      placeholder="e.g. Avg length: 3.5m, Avg diameter: 35cm"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Harvest Date</label>
                    <input
                      type="date"
                      name="harvestDate"
                      value={formData.harvestDate}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              {/* PRICE */}
              <div className="card p-6 border border-color rounded-xl bg-card">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-color">
                  <DollarSign size={18} className="text-emerald" />
                  <h2 className="text-lg font-bold text-main">Price & Negotiation</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="form-group">
                    <label className="form-label">Asking Price ($)</label>
                    <input
                      type="number"
                      name="askingPrice"
                      value={formData.askingPrice}
                      onChange={handleInputChange}
                      className="form-input text-emerald font-bold text-lg font-mono"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Price per m³ ($/m³)</label>
                    <input
                      type="number"
                      name="pricePerM3"
                      value={formData.pricePerM3}
                      onChange={handleInputChange}
                      className="form-input text-main font-semibold"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Price Negotiable</label>
                    <select
                      name="negotiable"
                      value={formData.negotiable}
                      onChange={handleInputChange}
                      className="form-input"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* LOCATION */}
              <div className="card p-6 border border-color rounded-xl bg-card">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-color">
                  <MapPin size={18} className="text-emerald" />
                  <h2 className="text-lg font-bold text-main">Storage & Pickup Location</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="form-group">
                    <label className="form-label">Storage Location</label>
                    <input
                      type="text"
                      name="storageLocation"
                      value={formData.storageLocation}
                      onChange={handleInputChange}
                      placeholder="e.g. Pine Valley Yard #1"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">District</label>
                    <input
                      type="text"
                      name="district"
                      value={formData.district}
                      onChange={handleInputChange}
                      placeholder="e.g. Kottayam"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Pickup Location</label>
                    <input
                      type="text"
                      name="pickupLocation"
                      value={formData.pickupLocation}
                      onChange={handleInputChange}
                      placeholder="e.g. Near Gate 2, Main Highway Access"
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              {/* MEDIA & DESCRIPTION & STATUS */}
              <div className="card p-6 border border-color rounded-xl bg-card space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-color">
                  <Sparkles size={18} className="text-emerald" />
                  <h2 className="text-lg font-bold text-main">Media, Description & Status</h2>
                </div>

                <div className="form-group">
                  <label className="form-label">Timber Description</label>
                  <textarea
                    name="description"
                    rows="3"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Provide details on log cut quality, moisture content, mill suitability..."
                    className="form-input"
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FileUploadCard
                    label="Timber / Log Photos"
                    sublabel="Upload timber yard log photos"
                    file={logPhotos}
                    onFileSelect={(f) => setLogPhotos(f)}
                    onFileRemove={() => setLogPhotos(null)}
                  />

                  <div className="form-group">
                    <label className="form-label">Initial Listing Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="form-input font-semibold"
                    >
                      <option value="Published">Published (Active on Marketplace)</option>
                      <option value="Draft">Draft</option>
                      <option value="Buyer Interested">Buyer Interested</option>
                      <option value="Purchase Request">Purchase Request</option>
                      <option value="Sold">Sold</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/landowner/dashboard')}
                  className="btn btn-secondary"
                  disabled={isSubmitting}
                >
                  <X size={16} /> Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary min-w-44"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span>Publishing...</span>
                  ) : (
                    <span className="flex items-center gap-2"><ShoppingBag size={16} /> Publish Timber Listing</span>
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
