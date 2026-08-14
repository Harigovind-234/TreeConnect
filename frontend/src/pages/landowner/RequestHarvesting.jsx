import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useLandowner } from '../../context/LandownerContext';
import FileUploadCard from '../../components/FileUploadCard';
import {
    Axe,
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    Trees,
    MapPin,
    Calendar,
    CheckSquare,
    FileText,
    Upload,
    Check,
    X,
    AlertCircle
} from 'lucide-react';

const RequestHarvesting = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { properties, inventories, addHarvestRequest } = useLandowner();

    const [currentStep, setCurrentStep] = useState(1);

    // Form State
    const defaultPropId = searchParams.get('propertyId') || (properties[0]?.id || '');
    const [selectedPropertyId, setSelectedPropertyId] = useState(defaultPropId);

    const selectedProperty = properties.find(p => p.id === selectedPropertyId) || properties[0];
    const propertyInventory = inventories.find(i => i.propertyId === selectedPropertyId) || inventories[0];

    const [harvestScope, setHarvestScope] = useState('Specific Area'); // Entire Property, Specific Area, Specific Tree Species, Selected Trees
    const [harvestScopeDetail, setHarvestScopeDetail] = useState('North Plot Block B (Rubber, 250 Trees)');
    const [estimatedVolume, setEstimatedVolume] = useState('180 m³');

    const [reasonForHarvesting, setReasonForHarvesting] = useState('Mature Timber Harvest');
    const [preferredStartDate, setPreferredStartDate] = useState('2026-08-25');
    const [preferredCompletionDate, setPreferredCompletionDate] = useState('2026-09-20');

    const [requiredServices, setRequiredServices] = useState([
        'Tree Felling',
        'Cutting',
        'Timber Extraction',
        'Transportation',
        'Site Clearing'
    ]);

    const [additionalInstructions, setAdditionalInstructions] = useState('Easy access from main panchayat road. Preserve surrounding teak trees.');

    const [propertyPhotos, setPropertyPhotos] = useState(null);
    const [treePhotos, setTreePhotos] = useState(null);
    const [harvestAreaPhotos, setHarvestAreaPhotos] = useState(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const serviceOptions = [
        { id: 'Tree Felling', label: 'Tree Felling', desc: 'Directional felling of tagged trees' },
        { id: 'Cutting', label: 'Cutting & Bucking', desc: 'De-limbing and cutting logs to custom specifications' },
        { id: 'Timber Extraction', label: 'Timber Extraction', desc: 'Skidding and moving logs to the landing yard' },
        { id: 'Transportation', label: 'Transportation', desc: 'Log hauling and transport to mill/storage' },
        { id: 'Site Clearing', label: 'Site Clearing', desc: 'Slash management, brush clearing, and site prep' }
    ];

    const handleToggleService = (serviceId) => {
        if (requiredServices.includes(serviceId)) {
            setRequiredServices(requiredServices.filter(s => s !== serviceId));
        } else {
            setRequiredServices([...requiredServices, serviceId]);
        }
    };

    const handleNextStep = () => {
        if (currentStep < 5) setCurrentStep(prev => prev + 1);
    };

    const handlePrevStep = () => {
        if (currentStep > 1) setCurrentStep(prev => prev - 1);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        setTimeout(() => {
            addHarvestRequest({
                propertyId: selectedProperty?.id || selectedProperty?._id || '',
                propertyName: selectedProperty?.propertyName || 'Registered Property',
                location: `${selectedProperty?.district || 'Kottayam'}, ${selectedProperty?.state || 'Kerala'}`,
                area: `${selectedProperty?.totalArea || 25} ${selectedProperty?.areaUnit || 'Acres'}`,
                treeCount: selectedProperty?.approxTreesCount || 1250,
                harvestScope,
                harvestScopeDetail,
                estimatedVolume,
                reasonForHarvesting,
                preferredStartDate,
                preferredCompletionDate,
                requiredServices,
                additionalInstructions,
                photosCount: (propertyPhotos ? 1 : 0) + (treePhotos ? 1 : 0) + (harvestAreaPhotos ? 1 : 0)
            });

            setIsSubmitting(false);
            setSuccessMessage('Harvest request submitted successfully. Status: Pending Contractor Response');
            setTimeout(() => {
                navigate('/landowner/harvest-requests');
            }, 1400);
        }, 700);
    };

    return (
        <div className="dashboard-layout">
            <Navbar />
            <div className="dashboard-body">
                <Sidebar />

                <div className="dashboard-workspace">
                    <main className="dashboard-content max-w-4xl mx-auto py-6">

                        {/* Header Navigation */}
                        <div className="mb-6">
                            <button
                                onClick={() => navigate('/landowner/dashboard')}
                                className="btn btn-secondary btn-sm mb-2 flex items-center gap-1 text-muted hover:text-main"
                            >
                                <ArrowLeft size={16} /> Back to Dashboard
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald/15 border border-emerald/30 flex items-center justify-center text-emerald">
                                    <Axe size={24} />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-main">Request Harvesting</h1>
                                    <p className="text-sm text-muted">Submit a formal multi-step harvest request to licensed timber contractors.</p>
                                </div>
                            </div>
                        </div>

                        {/* SUCCESS BANNER */}
                        {successMessage && (
                            <div className="mb-6 p-4 rounded-xl bg-emerald/15 border border-emerald text-emerald flex items-center gap-3 animate-fade-in">
                                <CheckCircle2 size={20} />
                                <span className="font-semibold text-sm">{successMessage} Redirecting to Harvest Requests...</span>
                            </div>
                        )}

                        {/* STEP WIZARD PROGRESS BAR */}
                        <div className="mb-8 card p-4 border border-color rounded-xl bg-card">
                            <div className="grid grid-cols-5 gap-2 text-center text-xs">
                                {[
                                    { step: 1, label: '1. Select Property' },
                                    { step: 2, label: '2. Harvest Area' },
                                    { step: 3, label: '3. Requirements' },
                                    { step: 4, label: '4. Photos' },
                                    { step: 5, label: '5. Review' }
                                ].map((item) => {
                                    const isActive = currentStep === item.step;
                                    const isDone = currentStep > item.step;
                                    return (
                                        <div key={item.step} className="flex flex-col items-center">
                                            <div
                                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-1 transition-all ${isActive
                                                        ? 'bg-emerald text-dark ring-4 ring-emerald/20 shadow-glow'
                                                        : isDone
                                                            ? 'bg-emerald/20 text-emerald border border-emerald'
                                                            : 'bg-surface text-muted border border-color'
                                                    }`}
                                            >
                                                {isDone ? <Check size={16} /> : item.step}
                                            </div>
                                            <span className={`font-medium hidden sm:block ${isActive ? 'text-emerald' : isDone ? 'text-main' : 'text-muted'}`}>
                                                {item.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* STEP CONTENT WRAPPER */}
                        <div className="card p-6 border border-color rounded-xl bg-card mb-6">

                            {/* ==================== STEP 1: SELECT PROPERTY ==================== */}
                            {currentStep === 1 && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-main mb-1">Step 1 — Select Property</h2>
                                        <p className="text-xs text-muted">Select the registered property where harvesting is requested.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {properties.map((p) => {
                                            const isSelected = selectedPropertyId === p.id;
                                            return (
                                                <div
                                                    key={p.id}
                                                    onClick={() => setSelectedPropertyId(p.id)}
                                                    className={`p-4 rounded-xl border cursor-pointer transition-all ${isSelected
                                                            ? 'bg-emerald/10 border-emerald shadow-glow ring-2 ring-emerald/30'
                                                            : 'bg-surface border-color hover:border-emerald/40'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="font-bold text-main">{p.propertyName}</span>
                                                        {isSelected && <CheckCircle2 size={18} className="text-emerald" />}
                                                    </div>
                                                    <p className="text-xs text-muted flex items-center gap-1 mb-3">
                                                        <MapPin size={12} /> {p.district || p.location || 'Kottayam'}, {p.state || 'Kerala'}
                                                    </p>

                                                    <div className="grid grid-cols-2 gap-2 text-xs bg-dark/40 p-2 rounded border border-color/50">
                                                        <div>
                                                            <span className="text-muted block">Area:</span>
                                                            <span className="font-semibold text-main">{p.totalArea} {p.areaUnit}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-muted block">Trees:</span>
                                                            <span className="font-semibold text-emerald">{p.approxTreesCount || 1250} Trees</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {selectedProperty && (
                                        <div className="p-4 rounded-xl bg-surface border border-emerald/30 text-sm space-y-1">
                                            <span className="text-xs font-bold text-emerald uppercase tracking-wider block">Selected Property Card</span>
                                            <div className="font-bold text-lg text-main">{selectedProperty.propertyName}</div>
                                            <div className="text-xs text-muted flex flex-wrap gap-4">
                                                <span><strong>Location:</strong> {selectedProperty.district}, {selectedProperty.state}</span>
                                                <span><strong>Area:</strong> {selectedProperty.totalArea} {selectedProperty.areaUnit}</span>
                                                <span><strong>Trees:</strong> {selectedProperty.approxTreesCount || 1250} Trees</span>
                                                <span><strong>Main Species:</strong> {selectedProperty.mainSpecies}</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-end pt-4">
                                        <button onClick={handleNextStep} className="btn btn-primary">
                                            Continue <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ==================== STEP 2: SELECT HARVEST AREA / TREES ==================== */}
                            {currentStep === 2 && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-main mb-1">Step 2 — Select Harvest Area / Trees</h2>
                                        <p className="text-xs text-muted">Choose the scope of harvest operation within {selectedProperty?.propertyName}.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[
                                            { id: 'Entire Property', label: 'Entire Property', desc: `Harvest all mature trees across ${selectedProperty?.totalArea || 25} acres` },
                                            { id: 'Specific Area', label: 'Specific Area / Parcel Block', desc: 'Harvest a designated block or plot (e.g. North Plot Block B)' },
                                            { id: 'Specific Tree Species', label: 'Specific Tree Species', desc: 'Harvest a specific species only (e.g. Rubber trees only)' },
                                            { id: 'Selected Trees', label: 'Selected Tagged Trees', desc: 'Select individual tagged mature trees for selective logging' }
                                        ].map((opt) => {
                                            const isSelected = harvestScope === opt.id;
                                            return (
                                                <div
                                                    key={opt.id}
                                                    onClick={() => setHarvestScope(opt.id)}
                                                    className={`p-4 rounded-xl border cursor-pointer transition-all ${isSelected
                                                            ? 'bg-emerald/10 border-emerald shadow-glow ring-2 ring-emerald/30'
                                                            : 'bg-surface border-color hover:border-emerald/40'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="font-bold text-main text-sm">{opt.label}</span>
                                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-emerald bg-emerald' : 'border-muted'}`}>
                                                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-dark"></div>}
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-muted">{opt.desc}</p>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="form-group">
                                            <label className="form-label">Harvest Scope Description / Detail</label>
                                            <input
                                                type="text"
                                                value={harvestScopeDetail}
                                                onChange={(e) => setHarvestScopeDetail(e.target.value)}
                                                placeholder="e.g. North Plot Block B (Rubber, 250 Trees)"
                                                className="form-input"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Estimated Timber Volume (m³)</label>
                                            <input
                                                type="text"
                                                value={estimatedVolume}
                                                onChange={(e) => setEstimatedVolume(e.target.value)}
                                                placeholder="e.g. 180 m³"
                                                className="form-input text-emerald font-bold font-mono"
                                            />
                                        </div>
                                    </div>

                                    {/* Inventory Information Box */}
                                    <div className="p-4 rounded-xl bg-surface border border-color">
                                        <span className="text-xs font-bold text-muted block mb-2">Available Inventory Info ({selectedProperty?.propertyName}):</span>
                                        {propertyInventory?.speciesList ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {propertyInventory.speciesList.map((sp) => (
                                                    <div key={sp.id} className="p-3 rounded-lg bg-dark/60 border border-color text-xs">
                                                        <span className="font-bold text-emerald text-sm block">{sp.treeSpecies}</span>
                                                        <div className="flex justify-between text-muted mt-1">
                                                            <span>Trees: <strong>{sp.numberOfTrees}</strong></span>
                                                            <span>Est. Volume: <strong className="text-emerald">{sp.estimatedVolume} m³</strong></span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-3 rounded-lg bg-dark/60 border border-color text-xs flex justify-between">
                                                <span className="font-bold text-emerald">Rubber Stand #1</span>
                                                <span className="text-muted">250 Trees • Est. Volume: <strong>180 m³</strong></span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-between pt-4">
                                        <button onClick={handlePrevStep} className="btn btn-secondary">
                                            <ArrowLeft size={16} /> Back
                                        </button>
                                        <button onClick={handleNextStep} className="btn btn-primary">
                                            Continue <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ==================== STEP 3: HARVEST REQUIREMENTS ==================== */}
                            {currentStep === 3 && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-main mb-1">Step 3 — Harvest Requirements</h2>
                                        <p className="text-xs text-muted">Specify timeline, services required, and additional instructions.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="form-group">
                                            <label className="form-label">Reason for Harvesting</label>
                                            <select
                                                value={reasonForHarvesting}
                                                onChange={(e) => setReasonForHarvesting(e.target.value)}
                                                className="form-input"
                                            >
                                                <option value="Mature Timber Harvest">Mature Timber Harvest</option>
                                                <option value="Replanting / Land Clearing">Replanting / Land Clearing</option>
                                                <option value="Forest Health Thinning">Forest Health Thinning</option>
                                                <option value="Storm Cleanup">Storm Cleanup</option>
                                                <option value="Commercial Monetization">Commercial Monetization</option>
                                            </select>
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Preferred Start Date</label>
                                            <input
                                                type="date"
                                                value={preferredStartDate}
                                                onChange={(e) => setPreferredStartDate(e.target.value)}
                                                className="form-input"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Preferred Completion Date</label>
                                            <input
                                                type="date"
                                                value={preferredCompletionDate}
                                                onChange={(e) => setPreferredCompletionDate(e.target.value)}
                                                className="form-input"
                                            />
                                        </div>
                                    </div>

                                    {/* Services Needed */}
                                    <div>
                                        <label className="form-label block mb-2 font-bold">Required Services</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {serviceOptions.map((srv) => {
                                                const isChecked = requiredServices.includes(srv.id);
                                                return (
                                                    <div
                                                        key={srv.id}
                                                        onClick={() => handleToggleService(srv.id)}
                                                        className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 ${isChecked
                                                                ? 'bg-emerald/10 border-emerald'
                                                                : 'bg-surface border-color hover:border-emerald/40'
                                                            }`}
                                                    >
                                                        <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center ${isChecked ? 'bg-emerald border-emerald text-dark' : 'border-muted'}`}>
                                                            {isChecked && <Check size={14} />}
                                                        </div>
                                                        <div>
                                                            <span className="text-xs font-bold text-main block">{srv.label}</span>
                                                            <span className="text-[11px] text-muted">{srv.desc}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Additional Instructions */}
                                    <div className="form-group">
                                        <label className="form-label">Additional Instructions</label>
                                        <textarea
                                            rows="3"
                                            value={additionalInstructions}
                                            onChange={(e) => setAdditionalInstructions(e.target.value)}
                                            placeholder="Note access road condition, terrain slope, gate entry codes, or environmental buffer rules."
                                            className="form-input"
                                        ></textarea>
                                    </div>

                                    <div className="flex justify-between pt-4">
                                        <button onClick={handlePrevStep} className="btn btn-secondary">
                                            <ArrowLeft size={16} /> Back
                                        </button>
                                        <button onClick={handleNextStep} className="btn btn-primary">
                                            Continue <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ==================== STEP 4: PHOTOS / SUPPORTING INFORMATION ==================== */}
                            {currentStep === 4 && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-main mb-1">Step 4 — Photos / Supporting Information</h2>
                                        <p className="text-xs text-muted">Upload optional property, tree, and harvest site photos for contractor estimation.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <FileUploadCard
                                            label="Property Photos"
                                            sublabel="Gate access, road entrance"
                                            file={propertyPhotos}
                                            onFileSelect={(f) => setPropertyPhotos(f)}
                                            onFileRemove={() => setPropertyPhotos(null)}
                                        />
                                        <FileUploadCard
                                            label="Tree Photos"
                                            sublabel="Tree canopy & trunks"
                                            file={treePhotos}
                                            onFileSelect={(f) => setTreePhotos(f)}
                                            onFileRemove={() => setTreePhotos(null)}
                                        />
                                        <FileUploadCard
                                            label="Harvest Area Photos"
                                            sublabel="Target plot terrain"
                                            file={harvestAreaPhotos}
                                            onFileSelect={(f) => setHarvestAreaPhotos(f)}
                                            onFileRemove={() => setHarvestAreaPhotos(null)}
                                        />
                                    </div>

                                    <div className="flex justify-between pt-4">
                                        <button onClick={handlePrevStep} className="btn btn-secondary">
                                            <ArrowLeft size={16} /> Back
                                        </button>
                                        <button onClick={handleNextStep} className="btn btn-primary">
                                            Continue to Review <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ==================== STEP 5: REVIEW ==================== */}
                            {currentStep === 5 && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-main mb-1">Step 5 — Review & Submit</h2>
                                        <p className="text-xs text-muted">Verify your harvest request details before broadcasting to licensed contractors.</p>
                                    </div>

                                    {/* Summary Card */}
                                    <div className="card p-6 border border-emerald/40 rounded-xl bg-surface space-y-4">
                                        <div className="flex items-center justify-between border-b border-color pb-3">
                                            <div>
                                                <span className="text-xs font-bold text-emerald uppercase tracking-wider block">Property Selected</span>
                                                <h3 className="text-lg font-bold text-main">{selectedProperty?.propertyName}</h3>
                                                <p className="text-xs text-muted">{selectedProperty?.district}, {selectedProperty?.state} • {selectedProperty?.totalArea} {selectedProperty?.areaUnit}</p>
                                            </div>
                                            <span className="status-pill status-yellow text-xs">
                                                Pending Submission
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                            <div>
                                                <span className="text-muted block mb-1">Harvest Area & Scope:</span>
                                                <span className="font-semibold text-main text-sm block">{harvestScope}</span>
                                                <span className="text-emerald">{harvestScopeDetail}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted block mb-1">Estimated Timber Volume:</span>
                                                <span className="font-bold text-emerald text-base font-mono">{estimatedVolume}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted block mb-1">Reason for Harvest:</span>
                                                <span className="font-semibold text-main">{reasonForHarvesting}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted block mb-1">Preferred Timeline:</span>
                                                <span className="font-semibold text-main">{preferredStartDate} to {preferredCompletionDate}</span>
                                            </div>
                                        </div>

                                        <div className="border-t border-color pt-3">
                                            <span className="text-xs text-muted block mb-2">Requested Services:</span>
                                            <div className="flex flex-wrap gap-2">
                                                {requiredServices.map(s => (
                                                    <span key={s} className="px-2.5 py-1 rounded-md bg-emerald/15 border border-emerald/30 text-emerald text-xs font-semibold">
                                                        ✓ {s}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {additionalInstructions && (
                                            <div className="border-t border-color pt-3 text-xs">
                                                <span className="text-muted block mb-1">Additional Notes:</span>
                                                <p className="text-main italic">"{additionalInstructions}"</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-between pt-4">
                                        <button onClick={handlePrevStep} className="btn btn-secondary" disabled={isSubmitting}>
                                            <ArrowLeft size={16} /> Back
                                        </button>
                                        <button onClick={handleSubmit} className="btn btn-primary min-w-44" disabled={isSubmitting}>
                                            {isSubmitting ? (
                                                <span>Submitting...</span>
                                            ) : (
                                                <span className="flex items-center gap-2"><CheckCircle2 size={18} /> Submit Harvest Request</span>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default RequestHarvesting;
