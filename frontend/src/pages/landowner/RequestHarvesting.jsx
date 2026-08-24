import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useLandowner } from '../../context/LandownerContext';
import FileUploadCard from '../../components/FileUploadCard';
import './LandownerDashboard.css';
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
    AlertCircle,
    ShieldCheck,
    Layers,
    Sparkles,
    Ruler,
    TreePine,
    Building2
} from 'lucide-react';

const RequestHarvesting = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const landownerCtx = useLandowner() || {};
    const properties = landownerCtx.properties || [];
    const inventories = landownerCtx.inventories || [];
    const addHarvestRequest = landownerCtx.addHarvestRequest || (() => {});

    const [currentStep, setCurrentStep] = useState(1);

    const safeProperties = Array.isArray(properties) ? properties : [];

    const fallbackProperty = {
        id: 'prop-fallback',
        propertyName: 'Green Estate Compound',
        district: 'Kottayam',
        state: 'Kerala',
        totalArea: '11.93',
        areaUnit: 'Cents',
        approxTreesCount: 1250,
        propertyType: 'Plantation Estate',
        mainSpecies: 'Teak / Rubber'
    };

    const displayProperties = safeProperties.length > 0 ? safeProperties : [fallbackProperty];

    const urlPropId = searchParams.get('propertyId') || '';
    const [selectedPropertyId, setSelectedPropertyId] = useState(urlPropId);

    useEffect(() => {
        const propIdFromUrl = searchParams.get('propertyId');
        if (propIdFromUrl) {
            setSelectedPropertyId(propIdFromUrl);
        } else if (displayProperties.length > 0) {
            const firstId = displayProperties[0]?.id || displayProperties[0]?._id || 'prop-fallback';
            setSelectedPropertyId(prev => prev || firstId);
        }
    }, [searchParams, safeProperties]);

    const activeProperty = displayProperties.find(
        p => p && (p.id === selectedPropertyId || p._id === selectedPropertyId)
    ) || displayProperties[0] || fallbackProperty;

    const propertyInventory = (Array.isArray(inventories) ? inventories : []).find(
        i => i && i.propertyId === activeProperty?.id
    ) || null;

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
        { id: 'Timber Extraction', label: 'Timber Extraction', desc: 'Skidding and moving logs to landing yard' },
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
                propertyId: activeProperty?.id || activeProperty?._id || '',
                propertyName: activeProperty?.propertyName || 'Registered Property',
                location: `${activeProperty?.district || 'Kottayam'}, ${activeProperty?.state || 'Kerala'}`,
                area: `${activeProperty?.totalArea || 25} ${activeProperty?.areaUnit || 'Acres'}`,
                treeCount: activeProperty?.approxTreesCount || 1250,
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
        <div className="landowner-dashboard-page min-h-screen bg-[#060e09] text-slate-100 flex flex-col font-sans">
            <Navbar />
            <div className="landowner-dashboard-container flex-1">
                <Sidebar />

                <div className="landowner-dashboard-workspace max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-6">

                    {/* HERO HEADER CARD */}
                    <div style={{ borderRadius: '16px' }} className="relative overflow-hidden bg-gradient-to-r from-[#091a11] via-[#0e271a] to-[#091a11] border-2 border-emerald-600/30 p-6 sm:p-8 shadow-2xl space-y-4">
                        <div className="absolute -right-12 -top-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                            <button
                                onClick={() => navigate('/landowner/dashboard')}
                                style={{ borderRadius: '8px' }}
                                className="px-3.5 py-2 bg-[#050e08] hover:bg-[#0c1810] text-slate-300 hover:text-white border border-emerald-600/40 text-xs font-extrabold flex items-center gap-2 cursor-pointer transition-all shrink-0"
                            >
                                <ArrowLeft size={16} className="text-emerald-400" /> Back to Dashboard
                            </button>

                            <span style={{ borderRadius: '6px' }} className="px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-black tracking-wider uppercase flex items-center gap-1.5 shrink-0">
                                <Sparkles size={14} className="text-emerald-400" /> Step {currentStep} of 5 • Harvest Request Wizard
                            </span>
                        </div>

                        <div className="flex items-center gap-4 relative z-10 pt-2">
                            <div style={{ borderRadius: '12px' }} className="w-14 h-14 bg-emerald-500/15 border-2 border-emerald-400/40 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10 shrink-0">
                                <Axe size={28} />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Request Harvesting</h1>
                                <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed mt-0.5">
                                    Dispatch a formal harvest request with tree specs &amp; timeline to verified timber contractors across Kerala.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* SUCCESS BANNER */}
                    {successMessage && (
                        <div style={{ borderRadius: '8px' }} className="p-4 bg-emerald-950/90 border-2 border-emerald-500 text-emerald-300 flex items-center gap-3 shadow-xl animate-fade-in">
                            <CheckCircle2 size={22} className="shrink-0 text-emerald-400" />
                            <span className="font-extrabold text-sm sm:text-base">{successMessage} Redirecting to Harvest Requests...</span>
                        </div>
                    )}

                    {/* WIZARD STEP TRACKER BAR */}
                    <div style={{ borderRadius: '14px' }} className="ld-card p-4 sm:p-6 bg-[#0a150e] border-2 border-emerald-600/25 shadow-xl">
                        <div className="grid grid-cols-5 gap-2 text-center text-xs">
                            {[
                                { step: 1, label: '1. Select Property' },
                                { step: 2, label: '2. Harvest Scope' },
                                { step: 3, label: '3. Timeline & Services' },
                                { step: 4, label: '4. Upload Photos' },
                                { step: 5, label: '5. Review & Submit' }
                            ].map((item) => {
                                const isActive = currentStep === item.step;
                                const isDone = currentStep > item.step;
                                return (
                                    <div key={item.step} className="flex flex-col items-center space-y-1.5">
                                        <div
                                            style={{ borderRadius: '8px' }}
                                            className={`w-9 h-9 flex items-center justify-center font-black transition-all text-xs sm:text-sm ${isActive
                                                    ? 'bg-emerald-400 text-slate-950 ring-4 ring-emerald-500/30 shadow-lg shadow-emerald-500/20'
                                                    : isDone
                                                        ? 'bg-emerald-950 text-emerald-300 border-2 border-emerald-600/60'
                                                        : 'bg-[#050e08] text-slate-400 border border-emerald-600/20'
                                                }`}
                                        >
                                            {isDone ? <Check size={16} strokeWidth={3} /> : item.step}
                                        </div>
                                        <span className={`font-bold hidden sm:block text-[11px] sm:text-xs tracking-tight ${isActive ? 'text-emerald-400 font-extrabold' : isDone ? 'text-white' : 'text-slate-400'}`}>
                                            {item.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* MAIN STEP FORM CONTAINER */}
                    <div style={{ borderRadius: '16px' }} className="ld-card p-6 sm:p-8 bg-[#0b1710] border-2 border-emerald-600/25 shadow-2xl space-y-6">

                        {/* ==================== STEP 1: SELECT PROPERTY ==================== */}
                        {currentStep === 1 && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between flex-wrap gap-2 pb-4 border-b border-emerald-500/20">
                                    <div>
                                        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
                                            <Trees size={24} className="text-emerald-400" /> Step 1 — Select Target Property
                                        </h2>
                                        <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1">
                                            Choose the registered estate or plot where timber harvesting is requested.
                                        </p>
                                    </div>
                                    <span style={{ borderRadius: '6px' }} className="px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold text-xs">
                                        {displayProperties.length} Properties Available
                                    </span>
                                </div>

                                {/* Property Cards Selection Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    {displayProperties.map((p) => {
                                        const pId = p.id || p._id;
                                        const isSelected = activeProperty?.id === pId || activeProperty?._id === pId;
                                        return (
                                            <div
                                                key={pId}
                                                onClick={() => setSelectedPropertyId(pId)}
                                                style={{ borderRadius: '12px' }}
                                                className={`p-5 border-2 cursor-pointer transition-all duration-300 flex flex-col justify-between space-y-4 select-none ${isSelected
                                                        ? 'bg-emerald-500/20 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)] transform -translate-y-0.5'
                                                        : 'bg-[#050e08] border-emerald-600/25 hover:border-emerald-500/50 hover:bg-[#0c1810]'
                                                    }`}
                                            >
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xl">🌳</span>
                                                            <span className="font-extrabold text-white text-base truncate">{p.propertyName}</span>
                                                        </div>
                                                        {isSelected && (
                                                            <div style={{ borderRadius: '6px' }} className="w-6 h-6 bg-emerald-400 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-md">
                                                                <Check size={14} strokeWidth={3} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                                                        <MapPin size={14} className="text-emerald-400 shrink-0" /> {p.district || p.location || 'Kottayam'}, {p.state || 'Kerala'}
                                                    </p>
                                                </div>

                                                <div style={{ borderRadius: '8px' }} className="grid grid-cols-2 gap-2.5 text-xs bg-[#09150d] p-3 border border-emerald-600/20 mt-2">
                                                    <div>
                                                        <span className="text-slate-400 font-semibold block text-[11px]">Registered Area:</span>
                                                        <span className="font-extrabold text-white text-xs sm:text-sm">{p.totalArea} {p.areaUnit}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400 font-semibold block text-[11px]">Tree Stock:</span>
                                                        <span className="font-extrabold text-emerald-400 text-xs sm:text-sm">{p.approxTreesCount || 1250} Trees</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* SELECTED PROPERTY OVERVIEW PANEL */}
                                {activeProperty && (
                                    <div style={{ borderRadius: '14px' }} className="p-6 bg-[#050e08] border-2 border-emerald-500/40 space-y-4 shadow-xl">
                                        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-emerald-600/25 pb-3">
                                            <span className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                                                <ShieldCheck size={16} /> SELECTED PROPERTY OVERVIEW
                                            </span>
                                            <span style={{ borderRadius: '6px' }} className="px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-[11px]">
                                                READY FOR HARVEST REQUEST
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                            <div style={{ borderRadius: '10px' }} className="p-4 bg-[#0b1811] border border-emerald-600/30 space-y-1">
                                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                                                    <Building2 size={13} className="text-emerald-400" /> Property Name
                                                </span>
                                                <div className="font-extrabold text-base text-white truncate">{activeProperty.propertyName}</div>
                                                <div className="text-xs text-slate-300 font-medium truncate">{activeProperty.district || 'Kottayam'}, {activeProperty.state || 'Kerala'}</div>
                                            </div>

                                            <div style={{ borderRadius: '10px' }} className="p-4 bg-[#0b1811] border border-emerald-600/30 space-y-1">
                                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                                                    <Ruler size={13} className="text-emerald-400" /> Registered Area
                                                </span>
                                                <div className="font-extrabold text-base text-white">{activeProperty.totalArea} {activeProperty.areaUnit}</div>
                                                <div className="text-xs text-slate-300 font-medium">Clear boundaries mapped</div>
                                            </div>

                                            <div style={{ borderRadius: '10px' }} className="p-4 bg-[#0b1811] border border-emerald-600/30 space-y-1">
                                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                                                    <TreePine size={13} className="text-emerald-400" /> Standing Trees
                                                </span>
                                                <div className="font-black text-base text-emerald-400">{activeProperty.approxTreesCount || 1250} Trees</div>
                                                <div className="text-xs text-slate-300 font-medium">Logged in inventory</div>
                                            </div>

                                            <div style={{ borderRadius: '10px' }} className="p-4 bg-[#0b1811] border border-emerald-600/30 space-y-1">
                                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                                                    <Trees size={13} className="text-emerald-400" /> Property Type
                                                </span>
                                                <div className="font-extrabold text-base text-white">{activeProperty.propertyType || 'Estate'}</div>
                                                <div className="text-xs text-slate-300 font-medium">Private ownership</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* BOTTOM ACTION BAR */}
                                <div className="flex items-center justify-end pt-4 border-t border-emerald-500/20">
                                    <button
                                        onClick={handleNextStep}
                                        style={{ borderRadius: '10px' }}
                                        className="px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-black text-sm border-none shadow-lg shadow-emerald-500/25 flex items-center gap-2.5 cursor-pointer transition-all"
                                    >
                                        <span>Continue to Scope Selection</span>
                                        <ArrowRight size={18} strokeWidth={3} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ==================== STEP 2: SELECT HARVEST AREA / TREES ==================== */}
                        {currentStep === 2 && (
                            <div className="space-y-6">
                                <div className="pb-4 border-b border-emerald-500/20">
                                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Step 2 — Select Harvest Area / Scope</h2>
                                    <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1">Choose the specific scope of harvesting within {activeProperty?.propertyName}.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {[
                                        { id: 'Entire Property', icon: '🌲', label: 'Entire Property', desc: `Harvest all mature standing trees across ${activeProperty?.totalArea || 25} ${activeProperty?.areaUnit || 'acres'}` },
                                        { id: 'Specific Area', icon: '📍', label: 'Specific Area / Parcel Block', desc: 'Harvest a designated block or plot (e.g. North Plot Block B)' },
                                        { id: 'Specific Tree Species', icon: '🪵', label: 'Specific Tree Species', desc: 'Harvest a specific species only (e.g. Rubber trees only)' },
                                        { id: 'Selected Trees', icon: '🏷️', label: 'Selected Tagged Trees', desc: 'Select individual tagged mature trees for selective logging' }
                                    ].map((opt) => {
                                        const isSelected = harvestScope === opt.id;
                                        return (
                                            <div
                                                key={opt.id}
                                                onClick={() => setHarvestScope(opt.id)}
                                                style={{ borderRadius: '12px' }}
                                                className={`p-5 border-2 cursor-pointer transition-all duration-300 flex flex-col justify-between space-y-3 ${isSelected
                                                        ? 'bg-emerald-500/20 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)] transform -translate-y-0.5'
                                                        : 'bg-[#050e08] border-emerald-600/25 hover:border-emerald-500/50 hover:bg-[#0c1810]'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="text-xl">{opt.icon}</span>
                                                        <span className="font-extrabold text-white text-base">{opt.label}</span>
                                                    </div>
                                                    <div style={{ borderRadius: '6px' }} className={`w-6 h-6 border-2 flex items-center justify-center text-xs font-black shrink-0 ${isSelected ? 'border-emerald-400 bg-emerald-400 text-slate-950 shadow-md' : 'border-slate-600 bg-slate-800 text-slate-400'}`}>
                                                        {isSelected ? '✓' : ''}
                                                    </div>
                                                </div>
                                                <p className="text-xs text-slate-300 font-medium leading-relaxed">{opt.desc}</p>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="ld-label">Harvest Scope Description / Detail</label>
                                        <input
                                            type="text"
                                            value={harvestScopeDetail}
                                            onChange={(e) => setHarvestScopeDetail(e.target.value)}
                                            placeholder="e.g. North Plot Block B (Rubber, 250 Trees)"
                                            style={{ borderRadius: '8px' }}
                                            className="ld-input"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="ld-label">Estimated Timber Volume (m³)</label>
                                        <input
                                            type="text"
                                            value={estimatedVolume}
                                            onChange={(e) => setEstimatedVolume(e.target.value)}
                                            placeholder="e.g. 180 m³"
                                            style={{ borderRadius: '8px' }}
                                            className="ld-input text-emerald-400 font-black font-mono text-base"
                                        />
                                    </div>
                                </div>

                                {/* Inventory Information Box */}
                                <div style={{ borderRadius: '12px' }} className="p-5 bg-[#050e08] border-2 border-emerald-600/30 space-y-3">
                                    <span className="text-xs font-black text-emerald-400 uppercase tracking-wider block">
                                        Available Tree Inventory ({activeProperty?.propertyName}):
                                    </span>
                                    {propertyInventory?.speciesList ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {propertyInventory.speciesList.map((sp) => (
                                                <div key={sp.id} style={{ borderRadius: '8px' }} className="p-3.5 bg-[#0a1810] border border-emerald-600/30 text-xs space-y-1.5">
                                                    <span className="font-extrabold text-emerald-400 text-sm block">{sp.treeSpecies}</span>
                                                    <div className="flex justify-between text-slate-300 font-semibold pt-1 border-t border-emerald-600/20">
                                                        <span>Trees: <strong className="text-white">{sp.numberOfTrees}</strong></span>
                                                        <span>Est. Volume: <strong className="text-emerald-400">{sp.estimatedVolume} m³</strong></span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ borderRadius: '8px' }} className="p-3.5 bg-[#0a1810] border border-emerald-600/30 text-xs flex items-center justify-between font-semibold text-slate-200">
                                            <span className="font-extrabold text-emerald-400 text-sm">Teak / Rubber Stand #1</span>
                                            <span className="text-slate-300">Trees: <strong className="text-white">250</strong> • Est. Volume: <strong className="text-emerald-400">180 m³</strong></span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-emerald-500/20">
                                    <button
                                        onClick={handlePrevStep}
                                        style={{ borderRadius: '10px' }}
                                        className="px-6 py-3.5 bg-[#050e08] hover:bg-[#0c1810] text-slate-300 hover:text-white border border-emerald-600/40 text-sm font-bold flex items-center gap-2 cursor-pointer transition-all"
                                    >
                                        <ArrowLeft size={18} /> Back
                                    </button>
                                    <button
                                        onClick={handleNextStep}
                                        style={{ borderRadius: '10px' }}
                                        className="px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-black text-sm border-none shadow-lg shadow-emerald-500/25 flex items-center gap-2.5 cursor-pointer transition-all"
                                    >
                                        <span>Continue to Timeline &amp; Services</span>
                                        <ArrowRight size={18} strokeWidth={3} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ==================== STEP 3: HARVEST REQUIREMENTS ==================== */}
                        {currentStep === 3 && (
                            <div className="space-y-6">
                                <div className="pb-4 border-b border-emerald-500/20">
                                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Step 3 — Timeline &amp; Required Services</h2>
                                    <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1">Specify schedule preferences, required contractor services, and site rules.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div className="space-y-2">
                                        <label className="ld-label">Reason for Harvesting</label>
                                        <select
                                            value={reasonForHarvesting}
                                            onChange={(e) => setReasonForHarvesting(e.target.value)}
                                            style={{ borderRadius: '8px' }}
                                            className="ld-select font-semibold"
                                        >
                                            <option value="Mature Timber Harvest" className="bg-[#0b1710] text-white">Mature Timber Harvest</option>
                                            <option value="Replanting / Land Clearing" className="bg-[#0b1710] text-white">Replanting / Land Clearing</option>
                                            <option value="Forest Health Thinning" className="bg-[#0b1710] text-white">Forest Health Thinning</option>
                                            <option value="Storm Cleanup" className="bg-[#0b1710] text-white">Storm Cleanup</option>
                                            <option value="Commercial Monetization" className="bg-[#0b1710] text-white">Commercial Monetization</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="ld-label">Preferred Start Date</label>
                                        <input
                                            type="date"
                                            value={preferredStartDate}
                                            onChange={(e) => setPreferredStartDate(e.target.value)}
                                            style={{ borderRadius: '8px' }}
                                            className="ld-input font-medium text-white"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="ld-label">Preferred Completion Date</label>
                                        <input
                                            type="date"
                                            value={preferredCompletionDate}
                                            onChange={(e) => setPreferredCompletionDate(e.target.value)}
                                            style={{ borderRadius: '8px' }}
                                            className="ld-input font-medium text-white"
                                        />
                                    </div>
                                </div>

                                {/* Services Needed */}
                                <div className="space-y-3">
                                    <label className="ld-label">Select Required Contractor Services</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                        {serviceOptions.map((srv) => {
                                            const isChecked = requiredServices.includes(srv.id);
                                            return (
                                                <div
                                                    key={srv.id}
                                                    onClick={() => handleToggleService(srv.id)}
                                                    style={{ borderRadius: '10px' }}
                                                    className={`p-4 border-2 cursor-pointer transition-all flex items-start gap-3.5 ${isChecked
                                                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-md'
                                                            : 'bg-[#050e08] border-emerald-600/25 text-slate-300 hover:border-emerald-500/40 hover:bg-[#0c1810]'
                                                        }`}
                                                >
                                                    <div style={{ borderRadius: '5px' }} className={`mt-0.5 w-5 h-5 border-2 flex items-center justify-center text-xs font-black shrink-0 ${isChecked ? 'border-emerald-400 bg-emerald-400 text-slate-950' : 'border-slate-600 bg-slate-800 text-slate-400'}`}>
                                                        {isChecked && <Check size={14} strokeWidth={3} />}
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-black text-white block">{srv.label}</span>
                                                        <span className="text-xs text-slate-300 font-medium leading-relaxed">{srv.desc}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Additional Instructions */}
                                <div className="space-y-2">
                                    <label className="ld-label">Additional Instructions / Access Notes</label>
                                    <textarea
                                        rows="3"
                                        value={additionalInstructions}
                                        onChange={(e) => setAdditionalInstructions(e.target.value)}
                                        placeholder="Note access road condition, terrain slope, gate entry codes, or environmental buffer rules."
                                        style={{ borderRadius: '8px' }}
                                        className="ld-textarea min-h-[90px]"
                                    ></textarea>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-emerald-500/20">
                                    <button
                                        onClick={handlePrevStep}
                                        style={{ borderRadius: '10px' }}
                                        className="px-6 py-3.5 bg-[#050e08] hover:bg-[#0c1810] text-slate-300 hover:text-white border border-emerald-600/40 text-sm font-bold flex items-center gap-2 cursor-pointer transition-all"
                                    >
                                        <ArrowLeft size={18} /> Back
                                    </button>
                                    <button
                                        onClick={handleNextStep}
                                        style={{ borderRadius: '10px' }}
                                        className="px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-black text-sm border-none shadow-lg shadow-emerald-500/25 flex items-center gap-2.5 cursor-pointer transition-all"
                                    >
                                        <span>Continue to Photo Upload</span>
                                        <ArrowRight size={18} strokeWidth={3} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ==================== STEP 4: PHOTOS / SUPPORTING INFORMATION ==================== */}
                        {currentStep === 4 && (
                            <div className="space-y-6">
                                <div className="pb-4 border-b border-emerald-500/20">
                                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Step 4 — Upload Site &amp; Tree Photos</h2>
                                    <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1">Upload optional property, tree, and harvest site photos for contractor estimation.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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

                                <div className="flex items-center justify-between pt-4 border-t border-emerald-500/20">
                                    <button
                                        onClick={handlePrevStep}
                                        style={{ borderRadius: '10px' }}
                                        className="px-6 py-3.5 bg-[#050e08] hover:bg-[#0c1810] text-slate-300 hover:text-white border border-emerald-600/40 text-sm font-bold flex items-center gap-2 cursor-pointer transition-all"
                                    >
                                        <ArrowLeft size={18} /> Back
                                    </button>
                                    <button
                                        onClick={handleNextStep}
                                        style={{ borderRadius: '10px' }}
                                        className="px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-black text-sm border-none shadow-lg shadow-emerald-500/25 flex items-center gap-2.5 cursor-pointer transition-all"
                                    >
                                        <span>Continue to Final Review</span>
                                        <ArrowRight size={18} strokeWidth={3} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ==================== STEP 5: REVIEW ==================== */}
                        {currentStep === 5 && (
                            <div className="space-y-6">
                                <div className="pb-4 border-b border-emerald-500/20">
                                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Step 5 — Review &amp; Submit Request</h2>
                                    <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1">Verify your harvest request details before broadcasting to licensed timber contractors.</p>
                                </div>

                                {/* Summary Card */}
                                <div style={{ borderRadius: '14px' }} className="p-6 bg-[#050e08] border-2 border-emerald-500/40 space-y-5 shadow-xl">
                                    <div className="flex items-center justify-between border-b border-emerald-600/25 pb-4">
                                        <div>
                                            <span className="text-xs font-black text-emerald-400 uppercase tracking-widest block">PROPERTY SELECTED</span>
                                            <h3 className="text-xl sm:text-2xl font-black text-white mt-1">{activeProperty?.propertyName}</h3>
                                            <p className="text-xs text-slate-300 font-semibold mt-1">{activeProperty?.district || 'Kottayam'}, {activeProperty?.state || 'Kerala'} • {activeProperty?.totalArea} {activeProperty?.areaUnit}</p>
                                        </div>
                                        <span style={{ borderRadius: '6px' }} className="px-3 py-1.5 bg-amber-500/15 border border-amber-500/30 text-amber-400 font-black text-xs uppercase tracking-wider">
                                            PENDING SUBMISSION
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs sm:text-sm">
                                        <div style={{ borderRadius: '10px' }} className="p-4 bg-[#0b1811] border border-emerald-600/25 space-y-1">
                                            <span className="text-slate-400 font-semibold text-xs block uppercase tracking-wider">Harvest Area &amp; Scope:</span>
                                            <span className="font-extrabold text-white text-base block">{harvestScope}</span>
                                            <span className="text-emerald-400 font-bold text-xs block">{harvestScopeDetail}</span>
                                        </div>
                                        <div style={{ borderRadius: '10px' }} className="p-4 bg-[#0b1811] border border-emerald-600/25 space-y-1">
                                            <span className="text-slate-400 font-semibold text-xs block uppercase tracking-wider">Estimated Volume:</span>
                                            <span className="font-black text-emerald-400 text-xl font-mono block">{estimatedVolume}</span>
                                        </div>
                                        <div style={{ borderRadius: '10px' }} className="p-4 bg-[#0b1811] border border-emerald-600/25 space-y-1">
                                            <span className="text-slate-400 font-semibold text-xs block uppercase tracking-wider">Reason for Harvest:</span>
                                            <span className="font-extrabold text-white">{reasonForHarvesting}</span>
                                        </div>
                                        <div style={{ borderRadius: '10px' }} className="p-4 bg-[#0b1811] border border-emerald-600/25 space-y-1">
                                            <span className="text-slate-400 font-semibold text-xs block uppercase tracking-wider">Preferred Timeline:</span>
                                            <span className="font-extrabold text-white">{preferredStartDate} to {preferredCompletionDate}</span>
                                        </div>
                                    </div>

                                    <div className="border-t border-emerald-600/25 pt-4 space-y-2">
                                        <span className="text-xs font-black text-slate-300 uppercase tracking-wider block">Requested Contractor Services:</span>
                                        <div className="flex flex-wrap gap-2">
                                            {requiredServices.map(s => (
                                                <span key={s} style={{ borderRadius: '6px' }} className="px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-black">
                                                    ✓ {s}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {additionalInstructions && (
                                        <div className="border-t border-emerald-600/25 pt-4 text-xs sm:text-sm">
                                            <span className="text-slate-400 font-semibold block mb-1">Additional Instructions:</span>
                                            <p className="text-slate-200 italic font-medium">"{additionalInstructions}"</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-emerald-500/20">
                                    <button
                                        onClick={handlePrevStep}
                                        disabled={isSubmitting}
                                        style={{ borderRadius: '10px' }}
                                        className="px-6 py-3.5 bg-[#050e08] hover:bg-[#0c1810] text-slate-300 hover:text-white border border-emerald-600/40 text-sm font-bold flex items-center gap-2 cursor-pointer transition-all"
                                    >
                                        <ArrowLeft size={18} /> Back
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                        style={{ borderRadius: '10px' }}
                                        className="px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-black text-sm sm:text-base border-none shadow-xl shadow-emerald-500/30 min-w-56 flex items-center justify-center gap-2.5 cursor-pointer transition-all"
                                    >
                                        {isSubmitting ? (
                                            <span>Submitting...</span>
                                        ) : (
                                            <span className="flex items-center gap-2"><CheckCircle2 size={20} strokeWidth={3} /> Submit Harvest Request</span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default RequestHarvesting;
