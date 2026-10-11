import React, { useState, useEffect, useMemo, useRef } from 'react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import {
  Truck,
  Plus,
  CheckCircle2,
  Clock,
  Wrench,
  AlertCircle,
  Search,
  Edit2,
  Trash2,
  X,
  ChevronDown,
  Calendar,
  Layers,
  FileText,
  Tag,
  Hash,
  Activity,
  Check,
  Camera,
  Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { getStoredFleet, saveStoredFleet } from '../../utils/fleetStorage';
import './ContractorDashboard.css';

// Demo categories to exclude - only show real categories added by the contractor
const DEMO_CATEGORIES = new Set([
  'Chainsaw & Rigging',
  'Rigging Kit',
  'Brush Cutter',
  'Tractor / Winch Unit',
  'Haulage Truck',
  'Excavator & Earthmover',
  'Wood Chipper / Mulcher',
  'Feller Buncher',
  'Harvester',
  'Log Skidder',
  'Hydraulic Crane / Loader',
  'Other Forestry Machinery'
].map(c => c.toLowerCase()));

const CONDITION_OPTIONS = ['Good', 'Fair', 'Needs Repair'];

const formatINR = (val) => {
  if (val === null || val === undefined || val === '' || isNaN(val)) return '0';
  return Number(val).toLocaleString('en-IN');
};

const STATUS_CONFIG = {
  'Available': {
    label: 'Available',
    pillClass: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25',
    dotClass: 'bg-emerald-400',
    icon: CheckCircle2,
    badgeText: 'Ready & Available'
  },
  'In Use': {
    label: 'In Use',
    pillClass: 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25',
    dotClass: 'bg-cyan-400',
    icon: Activity,
    badgeText: 'In Operation'
  },
  'Under Maintenance': {
    label: 'Under Maintenance',
    pillClass: 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25',
    dotClass: 'bg-amber-400',
    icon: Wrench,
    badgeText: 'Servicing / Repair'
  },
  'Unavailable': {
    label: 'Unavailable',
    pillClass: 'bg-rose-500/15 border-rose-500/40 text-rose-300 hover:bg-rose-500/25',
    dotClass: 'bg-rose-400',
    icon: AlertCircle,
    badgeText: 'Unavailable'
  }
};

const normalizeStatus = (status) => {
  if (!status) return 'Available';
  const s = String(status).trim().toLowerCase();
  if (s === 'available' || s === 'ready') return 'Available';
  if (s === 'in use' || s === 'in operation' || s === 'active' || s === 'deployed') return 'In Use';
  if (s === 'under maintenance' || s === 'maintenance' || s === 'in shop' || s === 'repair') return 'Under Maintenance';
  if (s === 'unavailable' || s === 'out of service' || s === 'decommissioned') return 'Unavailable';
  return 'Available';
};

const formatDateDMY = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch (e) {
    return dateStr;
  }
};

const FleetEquipmentPage = () => {
  const { user } = useAuth();
  const [equipmentList, setEquipmentList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: 1,
    condition: 'Good',
    brand: '',
    purchaseDate: '',
    unitPrice: '',
    imageUrl: '',
    notes: ''
  });

  // Custom Categories State (Only categories created by user)
  const [customCategories, setCustomCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('treeconnect_custom_fleet_categories');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter(c => c && !DEMO_CATEGORIES.has(String(c).trim().toLowerCase()));
      }
      return [];
    } catch (e) {
      return [];
    }
  });
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [categoryInputError, setCategoryInputError] = useState('');

  // 1. Initial Load and Sync
  useEffect(() => {
    const loadFleet = async () => {
      setLoading(true);
      // Load from local storage cache
      const cached = getStoredFleet();
      if (Array.isArray(cached) && cached.length > 0) {
        setEquipmentList(cached);
      }

      // Sync with backend API
      try {
        const res = await api.get('/auth/user-profile');
        if (res.data?.user && Array.isArray(res.data.user.fleet_equipment)) {
          setEquipmentList(res.data.user.fleet_equipment);
          saveStoredFleet(res.data.user.fleet_equipment);
        }
      } catch (err) {
        // Fallback silently to local cache
      } finally {
        setLoading(false);
      }
    };

    loadFleet();

    // Cross-tab / cross-component sync event
    const handleFleetUpdate = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        setEquipmentList(e.detail);
      }
    };
    window.addEventListener('treeconnect_fleet_updated', handleFleetUpdate);
    return () => window.removeEventListener('treeconnect_fleet_updated', handleFleetUpdate);
  }, []);

  // Dropdown Open States
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef(null);
  const statusDropdownRef = useRef(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setIsCategoryDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setIsStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ONLY show categories that are actually added by the contractor (excluding demo ones)
  const availableCategories = useMemo(() => {
    const catsSet = new Set();
    equipmentList.forEach(item => {
      if (item && item.category && String(item.category).trim() !== '' && !DEMO_CATEGORIES.has(String(item.category).trim().toLowerCase())) {
        catsSet.add(String(item.category).trim());
      }
    });
    return Array.from(catsSet).sort();
  }, [equipmentList]);

  // Reset category filter if currently selected category was deleted or not in list
  useEffect(() => {
    if (selectedCategory !== 'ALL' && !availableCategories.includes(selectedCategory)) {
      setSelectedCategory('ALL');
    }
  }, [availableCategories, selectedCategory]);

  // 2. Dynamic Metric Calculations
  const metrics = useMemo(() => {
    let totalUnits = 0;
    let availableUnits = 0;
    let inUseUnits = 0;
    let maintenanceUnits = 0;
    let unavailableUnits = 0;

    equipmentList.forEach(item => {
      const q = Math.max(1, parseInt(item.quantity, 10) || 1);
      const st = normalizeStatus(item.status);
      totalUnits += q;

      if (st === 'Available') {
        availableUnits += q;
      } else if (st === 'In Use') {
        inUseUnits += q;
      } else if (st === 'Under Maintenance') {
        maintenanceUnits += q;
      } else if (st === 'Unavailable') {
        unavailableUnits += q;
      }
    });

    return {
      totalUnits,
      availableUnits,
      inUseUnits,
      maintenanceUnits,
      unavailableUnits
    };
  }, [equipmentList]);

  // 3. Search and Filter Logic
  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return equipmentList.filter(item => {
      const name = (item.name || item.model || '').toLowerCase();
      const tag = (item.regNumber || item.reg_number || item.assetTag || '').toLowerCase();
      const cat = (item.category || '').toLowerCase();
      const notes = (item.notes || item.description || '').toLowerCase();

      const matchesSearch = !q || name.includes(q) || tag.includes(q) || cat.includes(q) || notes.includes(q);
      const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
      const normalizedItemStatus = normalizeStatus(item.status);
      const matchesStatus = selectedStatus === 'ALL' || normalizedItemStatus === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [equipmentList, searchQuery, selectedCategory, selectedStatus]);

  // Dynamic Total Purchase Cost calculation (quantity × unit price)
  const calculatedTotalCost = useMemo(() => {
    const qty = parseInt(formData.quantity, 10);
    const price = parseFloat(formData.unitPrice);
    if (!isNaN(qty) && qty > 0 && !isNaN(price) && price > 0) {
      return qty * price;
    }
    return null;
  }, [formData.quantity, formData.unitPrice]);

  // Modal Escape key accessibility listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showModal) {
        setShowModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal]);

  // ONLY categories actually added by the user (custom added or present in user's equipment list, excluding demo categories)
  const allModalCategories = useMemo(() => {
    const set = new Set();
    customCategories.forEach(c => {
      if (c && String(c).trim() && !DEMO_CATEGORIES.has(String(c).trim().toLowerCase())) {
        set.add(String(c).trim());
      }
    });
    equipmentList.forEach(e => {
      if (e?.category && String(e.category).trim() && !DEMO_CATEGORIES.has(String(e.category).trim().toLowerCase())) {
        set.add(String(e.category).trim());
      }
    });
    if (formData?.category && String(formData.category).trim() && !DEMO_CATEGORIES.has(String(formData.category).trim().toLowerCase())) {
      set.add(String(formData.category).trim());
    }
    return Array.from(set).sort();
  }, [customCategories, equipmentList, formData?.category]);

  const handleSaveNewCategory = (e) => {
    if (e) e.preventDefault();
    const clean = newCategoryInput.trim();
    if (!clean) {
      setCategoryInputError('Please enter a category name.');
      return;
    }

    const existingMatch = allModalCategories.find(c => c.toLowerCase() === clean.toLowerCase());
    const catToSelect = existingMatch || clean;

    if (!existingMatch) {
      const updated = [...customCategories, clean];
      setCustomCategories(updated);
      try {
        localStorage.setItem('treeconnect_custom_fleet_categories', JSON.stringify(updated));
      } catch (err) {}
    }

    setFormData(prev => ({ ...prev, category: catToSelect }));
    setNewCategoryInput('');
    setCategoryInputError('');
    setIsAddingCategory(false);
  };

  // 4. Form Actions
  const handleOpenAdd = () => {
    setEditingId(null);
    setFormError('');
    const firstCat = allModalCategories[0] || '';
    if (!firstCat) {
      setIsAddingCategory(true);
    } else {
      setIsAddingCategory(false);
    }
    setNewCategoryInput('');
    setCategoryInputError('');
    setFormData({
      name: '',
      category: firstCat,
      quantity: 1,
      condition: 'Good',
      brand: '',
      purchaseDate: '',
      unitPrice: '',
      imageUrl: '',
      notes: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingId(item.id);
    setFormError('');
    setIsAddingCategory(false);
    setNewCategoryInput('');
    setCategoryInputError('');
    const itemCond = item.condition || (normalizeStatus(item.status) === 'Under Maintenance' ? 'Needs Repair' : 'Good');
    const itemCategory = (item.category && !DEMO_CATEGORIES.has(String(item.category).trim().toLowerCase())) 
      ? item.category 
      : (allModalCategories[0] || '');
    setFormData({
      name: item.name || item.model || '',
      category: itemCategory,
      quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
      condition: itemCond,
      brand: item.brand || (item.model && item.model !== item.name ? item.model : '') || '',
      purchaseDate: item.purchaseDate || '',
      unitPrice: item.unitPrice !== undefined && item.unitPrice !== null ? String(item.unitPrice) : '',
      imageUrl: item.imageUrl || item.image || '',
      notes: item.notes || item.description || ''
    });
    setShowModal(true);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFormError('Equipment image file size must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData(prev => ({ ...prev, imageUrl: event.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (e) => {
    e.stopPropagation();
    setFormData(prev => ({ ...prev, imageUrl: '' }));
  };

  const handleDelete = async (id) => {
    const item = equipmentList.find(e => e.id === id);
    const itemName = item?.name || item?.model || 'this equipment';
    if (!window.confirm(`Are you sure you want to remove "${itemName}" from your equipment inventory?`)) {
      return;
    }

    const updated = equipmentList.filter(e => e.id !== id);
    setEquipmentList(updated);
    saveStoredFleet(updated);

    try {
      await api.put('/auth/user-profile/fleet', { fleet_equipment: updated });
    } catch (e) {
      console.warn('API sync fallback for fleet delete:', e);
    }
  };

  const handleQuickStatusCycle = async (item) => {
    const current = normalizeStatus(item.status);
    let nextStatus = 'Available';
    if (current === 'Available') nextStatus = 'In Use';
    else if (current === 'In Use') nextStatus = 'Under Maintenance';
    else if (current === 'Under Maintenance') nextStatus = 'Unavailable';
    else if (current === 'Unavailable') nextStatus = 'Available';

    const updated = equipmentList.map(eq => (eq.id === item.id ? { ...eq, status: nextStatus } : eq));
    setEquipmentList(updated);
    saveStoredFleet(updated);

    try {
      await api.put('/auth/user-profile/fleet', { fleet_equipment: updated });
    } catch (e) {
      console.warn('API sync fallback for status toggle:', e);
    }
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError('');

    const cleanName = formData.name.trim();
    if (!cleanName) {
      setFormError('Equipment name is required.');
      return;
    }

    if (!formData.category || !formData.category.trim()) {
      setFormError('Please select an equipment category.');
      return;
    }

    const qty = parseInt(formData.quantity, 10);
    if (isNaN(qty) || qty < 1) {
      setFormError('Number of identical units must be a positive integer (minimum 1 unit).');
      return;
    }

    let parsedUnitPrice = null;
    if (formData.unitPrice !== '' && formData.unitPrice !== null && formData.unitPrice !== undefined) {
      const parsed = parseFloat(formData.unitPrice);
      if (isNaN(parsed) || parsed < 0) {
        setFormError('Purchase price per unit must be a valid positive number.');
        return;
      }
      parsedUnitPrice = parsed;
    }

    // Determine status aligned with condition while preserving existing status logic
    let resolvedStatus = 'Available';
    if (formData.condition === 'Needs Repair') {
      resolvedStatus = 'Under Maintenance';
    } else if (editingId) {
      const existing = equipmentList.find(eq => eq.id === editingId);
      if (existing?.status && existing.status !== 'Under Maintenance') {
        resolvedStatus = existing.status;
      }
    }

    const payloadItem = {
      name: cleanName,
      model: formData.brand.trim() || cleanName,
      brand: formData.brand.trim(),
      category: formData.category,
      quantity: qty,
      condition: formData.condition || 'Good',
      status: resolvedStatus,
      purchaseDate: formData.purchaseDate || '',
      unitPrice: parsedUnitPrice,
      totalCost: (parsedUnitPrice !== null && qty > 0) ? qty * parsedUnitPrice : null,
      imageUrl: formData.imageUrl || '',
      notes: formData.notes.trim()
    };

    let updated = [];
    if (editingId) {
      updated = equipmentList.map(eq => (eq.id === editingId ? { ...eq, ...payloadItem, id: editingId } : eq));
    } else {
      updated = [
        ...equipmentList,
        {
          ...payloadItem,
          id: `eq_${Date.now()}`
        }
      ];
    }

    setEquipmentList(updated);
    saveStoredFleet(updated);
    setShowModal(false);

    try {
      await api.put('/auth/user-profile/fleet', { fleet_equipment: updated });
    } catch (err) {
      console.warn('API sync fallback for fleet update:', err);
    }
  };

  return (
    <div className="contractor-dashboard-page">
      <Navbar />
      <div className="contractor-dashboard-container">
        <Sidebar />

        <div className="contractor-dashboard-workspace overflow-y-auto">
          <main className="max-w-7xl mx-auto flex flex-col gap-6 w-full">

            {/* 1. Header Banner */}
            <div className="fleet-header-card">
              <div>
                <div className="fleet-tag-pill mb-2">
                  <Truck size={13} /> Equipment Inventory &amp; Availability
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  Fleet &amp; Equipment Management
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed max-w-2xl">
                  Register machinery, track real-time operational availability, and monitor equipment maintenance schedules.
                </p>
              </div>

              <div className="shrink-0">
                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="fleet-btn-action"
                >
                  <Plus size={16} strokeWidth={2.5} />
                  <span>Add Equipment</span>
                </button>
              </div>
            </div>

            {/* 2. Key Metrics Bar: 4 Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

              {/* Card 1: Total Equipment */}
              <div className="fleet-metric-card">
                <div className="fleet-metric-header text-slate-400">
                  <span>Total Equipment</span>
                  <div className="fleet-metric-icon bg-emerald-500/10 text-emerald-400">
                    <Truck size={17} />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold font-mono text-white">{metrics.totalUnits}</span>
                    <span className="text-xs font-medium text-slate-400">
                      {metrics.totalUnits === 1 ? 'Unit' : 'Units'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">All registered machinery &amp; tools</p>
                </div>
              </div>

              {/* Card 2: Available */}
              <div className="fleet-metric-card">
                <div className="fleet-metric-header text-emerald-400">
                  <span>Available</span>
                  <div className="fleet-metric-icon bg-emerald-500/15 text-emerald-400">
                    <CheckCircle2 size={17} />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold font-mono text-emerald-300">{metrics.availableUnits}</span>
                    <span className="text-xs font-semibold text-emerald-400">Available</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Ready for immediate operation</p>
                </div>
              </div>

              {/* Card 3: In Use */}
              <div className="fleet-metric-card">
                <div className="fleet-metric-header text-cyan-400">
                  <span>In Use</span>
                  <div className="fleet-metric-icon bg-cyan-500/15 text-cyan-400">
                    <Activity size={17} />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold font-mono text-cyan-300">{metrics.inUseUnits}</span>
                    <span className="text-xs font-semibold text-cyan-400">In Use</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Currently operating on field sites</p>
                </div>
              </div>

              {/* Card 4: Under Maintenance */}
              <div className="fleet-metric-card">
                <div className="fleet-metric-header text-amber-400">
                  <span>Under Maintenance</span>
                  <div className="fleet-metric-icon bg-amber-500/15 text-amber-400">
                    <Wrench size={17} />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold font-mono text-amber-300">{metrics.maintenanceUnits}</span>
                    <span className="text-xs font-semibold text-amber-400">
                      {metrics.maintenanceUnits === 1 ? 'Unit' : 'Units'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Servicing, overhaul, or repair</p>
                </div>
              </div>

            </div>

            {/* 3. Search and Filter Bar */}
            <div className="fleet-filter-bar">

              {/* Search Field */}
              <div className="relative flex-1 min-w-[240px]">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search equipment name, asset tag, category, notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="fleet-search-input"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Filters with custom dark themed popover dropdowns */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Custom Category Filter Dropdown - ONLY shows added categories */}
                <div className="relative" ref={categoryDropdownRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                      setIsStatusDropdownOpen(false);
                    }}
                    className={`fleet-custom-select-trigger ${isCategoryDropdownOpen ? 'active' : ''}`}
                  >
                    <span>
                      {selectedCategory === 'ALL'
                        ? availableCategories.length > 0
                          ? `All Categories (${availableCategories.length})`
                          : 'All Categories'
                        : selectedCategory}
                    </span>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${isCategoryDropdownOpen ? 'rotate-180 text-emerald-400' : ''}`} />
                  </button>

                  {isCategoryDropdownOpen && (
                    <div className="fleet-custom-select-menu animate-in fade-in zoom-in-95 duration-150">
                      <div
                        onClick={() => {
                          setSelectedCategory('ALL');
                          setIsCategoryDropdownOpen(false);
                        }}
                        className={`fleet-custom-select-option ${selectedCategory === 'ALL' ? 'selected' : ''}`}
                      >
                        <span>All Categories</span>
                        {selectedCategory === 'ALL' && <Check size={14} className="text-emerald-400" />}
                      </div>

                      {availableCategories.length === 0 ? (
                        <div className="px-3 py-2 text-[11px] text-slate-400 italic">
                          No categories registered yet
                        </div>
                      ) : (
                        availableCategories.map(cat => (
                          <div
                            key={cat}
                            onClick={() => {
                              setSelectedCategory(cat);
                              setIsCategoryDropdownOpen(false);
                            }}
                            className={`fleet-custom-select-option ${selectedCategory === cat ? 'selected' : ''}`}
                          >
                            <span>{cat}</span>
                            {selectedCategory === cat && <Check size={14} className="text-emerald-400" />}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Custom Status Filter Dropdown */}
                <div className="relative" ref={statusDropdownRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsStatusDropdownOpen(!isStatusDropdownOpen);
                      setIsCategoryDropdownOpen(false);
                    }}
                    className={`fleet-custom-select-trigger ${isStatusDropdownOpen ? 'active' : ''}`}
                  >
                    <span>{selectedStatus === 'ALL' ? 'All Statuses' : selectedStatus}</span>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${isStatusDropdownOpen ? 'rotate-180 text-emerald-400' : ''}`} />
                  </button>

                  {isStatusDropdownOpen && (
                    <div className="fleet-custom-select-menu animate-in fade-in zoom-in-95 duration-150">
                      {[
                        { id: 'ALL', label: 'All Statuses' },
                        { id: 'Available', label: 'Available' },
                        { id: 'In Use', label: 'In Use' },
                        { id: 'Under Maintenance', label: 'Under Maintenance' },
                        { id: 'Unavailable', label: 'Unavailable' }
                      ].map(st => (
                        <div
                          key={st.id}
                          onClick={() => {
                            setSelectedStatus(st.id);
                            setIsStatusDropdownOpen(false);
                          }}
                          className={`fleet-custom-select-option ${selectedStatus === st.id ? 'selected' : ''}`}
                        >
                          <span>{st.label}</span>
                          {selectedStatus === st.id && <Check size={14} className="text-emerald-400" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* 4. Equipment Inventory Table Container */}
            <div className="fleet-inventory-card">

              {/* Table Card Header */}
              <div className="fleet-inventory-header">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <Truck size={18} className="text-emerald-400" />
                    <span>Registered Equipment Inventory</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Individual machinery records, operational readiness, and service dates
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-bold font-mono">
                    {filteredList.reduce((acc, item) => acc + Math.max(1, parseInt(item.quantity, 10) || 1), 0)} Total Units
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    ({filteredList.length} records)
                  </span>
                </div>
              </div>

              {loading ? (
                <div className="p-16 text-center text-slate-400">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent mb-3" />
                  <p className="text-xs">Loading equipment inventory...</p>
                </div>
              ) : filteredList.length === 0 ? (
                <div className="fleet-empty-card">
                  <div className="fleet-empty-icon-box">
                    <Truck size={28} />
                  </div>
                  <h3 className="text-base font-bold text-white mb-0.5">
                    {equipmentList.length === 0 ? 'No Equipment Registered Yet' : 'No Matching Equipment Found'}
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    {equipmentList.length === 0
                      ? 'Add your forestry and timber equipment (feller bunchers, harvesters, haulage trucks, chainsaws) to track availability and maintenance.'
                      : 'No equipment matches your current search or filter. Try clearing the filters or add a new equipment item.'}
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleOpenAdd}
                      className="fleet-btn-action"
                    >
                      <Plus size={16} />
                      <span>Register Equipment</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse min-w-[880px]">
                    <thead>
                      <tr className="bg-[#040e08] text-emerald-400 text-xs font-bold uppercase tracking-wider border-b border-emerald-500/20">
                        <th className="py-3.5 px-5">Equipment &amp; Details</th>
                        <th className="py-3.5 px-4">Category</th>
                        <th className="py-3.5 px-4 text-center">Quantity</th>
                        <th className="py-3.5 px-4">Condition &amp; Status</th>
                        <th className="py-3.5 px-4">Purchase / Cost</th>
                        <th className="py-3.5 px-4">Notes</th>
                        <th className="py-3.5 px-5 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-500/10">
                      {filteredList.map((item) => {
                        const statusKey = normalizeStatus(item.status);
                        const statusMeta = STATUS_CONFIG[statusKey] || STATUS_CONFIG['Available'];
                        const StatusIcon = statusMeta.icon;
                        const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
                        const tag = item.regNumber || item.reg_number || item.assetTag;
                        const itemCond = item.condition || (statusKey === 'Under Maintenance' ? 'Needs Repair' : 'Good');
                        const totalCost = item.totalCost || (item.unitPrice ? item.unitPrice * qty : null);

                        return (
                          <tr key={item.id} className="hover:bg-emerald-500/[0.04] transition-colors">
                            {/* 1. Equipment & Details (Thumbnail, Name, Brand, Condition) */}
                            <td className="py-4 px-5">
                              <div className="flex items-center gap-3">
                                {item.imageUrl || item.image ? (
                                  <img
                                    src={item.imageUrl || item.image}
                                    alt={item.name || item.model}
                                    className="w-10 h-10 rounded-xl object-cover border border-emerald-500/30 bg-black shrink-0"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                                    <Truck size={18} />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <div className="font-bold text-white text-sm flex items-center gap-2 flex-wrap">
                                    <span>{item.name || item.model}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                      itemCond === 'Good' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' :
                                      itemCond === 'Fair' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' :
                                      'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                                    }`}>
                                      {itemCond}
                                    </span>
                                  </div>
                                  {(item.brand && item.brand !== item.name) && (
                                    <div className="text-xs text-slate-300 font-medium">
                                      Brand: {item.brand}
                                    </div>
                                  )}
                                  {tag && (
                                    <div className="text-[11px] text-emerald-400/80 font-mono mt-0.5">
                                      Tag: {tag}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* 2. Category */}
                            <td className="py-4 px-4">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#041009] border border-emerald-500/20 text-slate-200 text-xs font-medium">
                                {item.category || 'Machinery'}
                              </span>
                            </td>

                            {/* 3. Quantity */}
                            <td className="py-4 px-4 text-center">
                              <span className="inline-flex items-center justify-center min-w-[36px] px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 font-mono text-xs font-extrabold text-white">
                                {qty} {qty === 1 ? 'Unit' : 'Units'}
                              </span>
                            </td>

                            {/* 4. Condition & Status */}
                            <td className="py-4 px-4">
                              <button
                                type="button"
                                onClick={() => handleQuickStatusCycle(item)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border cursor-pointer transition-all ${statusMeta.pillClass}`}
                                title={`Current status: ${statusMeta.label}. Click to cycle status.`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotClass}`} />
                                <StatusIcon size={12} />
                                <span>{statusMeta.label}</span>
                              </button>
                            </td>

                            {/* 5. Purchase / Cost */}
                            <td className="py-4 px-4">
                              {totalCost ? (
                                <div>
                                  <div className="text-xs font-bold font-mono text-emerald-300">
                                    ₹{formatINR(totalCost)}
                                  </div>
                                  {item.unitPrice && (
                                    <div className="text-[11px] text-slate-400">
                                      ₹{formatINR(item.unitPrice)}/unit
                                    </div>
                                  )}
                                </div>
                              ) : item.purchaseDate ? (
                                <div className="text-xs text-slate-300">
                                  {formatDateDMY(item.purchaseDate)}
                                </div>
                              ) : (
                                <span className="text-xs text-slate-500 italic">—</span>
                              )}
                            </td>

                            {/* 6. Notes */}
                            <td className="py-4 px-4 max-w-[200px]">
                              {item.notes ? (
                                <span className="text-xs text-slate-300 line-clamp-2" title={item.notes}>
                                  {item.notes}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-500 italic">—</span>
                              )}
                            </td>

                            {/* 7. Actions */}
                            <td className="py-4 px-5 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(item)}
                                  aria-label={`Edit ${item.name || item.model}`}
                                  className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:text-white transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                                  title="Edit equipment details"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(item.id)}
                                  aria-label={`Delete ${item.name || item.model}`}
                                  className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-white transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                                  title="Delete equipment"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </main>
        </div>
      </div>

      {/* ADD / EDIT EQUIPMENT MODAL (DARK FOREST GREEN, MAX 680PX) */}
      {showModal && (
        <div
          className="eq-modal-overlay"
          onClick={() => setShowModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="equipment-modal-title"
        >
          <div
            className="eq-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 1. Modal Header */}
            <div className="eq-modal-header">
              <div className="eq-modal-title-row">
                <div className="eq-modal-icon-badge">
                  <Wrench size={20} />
                </div>
                <div>
                  <h3 id="equipment-modal-title" className="text-base sm:text-lg font-bold text-white">
                    {editingId ? 'Edit Equipment' : 'Register Equipment'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Add equipment to your contractor inventory
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                aria-label="Close modal"
                className="eq-modal-close-btn"
              >
                <X size={18} />
              </button>
            </div>

            {/* 2. Modal Body (Scrollable, 2-column layout) */}
            <div className="eq-modal-body">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form id="equipment-modal-form" onSubmit={handleSubmitForm} className="space-y-4">
                <div className="eq-form-grid">
                  {/* Row 1, Col 1: Equipment name * */}
                  <div className="eq-form-group">
                    <label className="eq-label" htmlFor="eq-name">
                      <span>Equipment name <span className="required-star">*</span></span>
                    </label>
                    <input
                      id="eq-name"
                      type="text"
                      required
                      placeholder="e.g. STIHL Chainsaw"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="eq-input"
                    />
                  </div>

                  {/* Row 1, Col 2: Category * */}
                  <div className="eq-form-group">
                    <div className="eq-label">
                      <label htmlFor="eq-category">
                        Category <span className="required-star">*</span>
                      </label>
                      {!isAddingCategory ? (
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingCategory(true);
                            setCategoryInputError('');
                          }}
                          className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer flex items-center gap-1 transition-colors"
                        >
                          <Plus size={12} strokeWidth={2.5} /> Add Category
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingCategory(false);
                            setCategoryInputError('');
                          }}
                          className="text-[11px] text-slate-400 hover:text-white cursor-pointer transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>

                    {isAddingCategory ? (
                      <div className="space-y-1.5">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Enter new category name..."
                            value={newCategoryInput}
                            onChange={(e) => {
                              setNewCategoryInput(e.target.value);
                              if (categoryInputError) setCategoryInputError('');
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveNewCategory();
                              }
                            }}
                            autoFocus
                            className="eq-input flex-1"
                          />
                          <button
                            type="button"
                            onClick={handleSaveNewCategory}
                            className="px-3.5 h-[44px] rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shrink-0 cursor-pointer transition-all shadow-sm"
                          >
                            Add
                          </button>
                        </div>
                        {categoryInputError && (
                          <p className="text-[11px] text-rose-400">{categoryInputError}</p>
                        )}
                      </div>
                    ) : (
                      <select
                        id="eq-category"
                        value={formData.category}
                        onChange={(e) => {
                          if (e.target.value === '__ADD_NEW__') {
                            setIsAddingCategory(true);
                            setCategoryInputError('');
                          } else {
                            setFormData({ ...formData, category: e.target.value });
                          }
                        }}
                        className="eq-select"
                      >
                        {allModalCategories.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                        <option value="__ADD_NEW__" className="text-emerald-400 font-bold bg-[#091a10]">
                          + Add New Category...
                        </option>
                      </select>
                    )}
                  </div>

                  {/* Row 2, Col 1: Number of identical units * */}
                  <div className="eq-form-group">
                    <label className="eq-label" htmlFor="eq-quantity">
                      <span>Number of units <span className="required-star">*</span></span>
                    </label>
                    <input
                      id="eq-quantity"
                      type="number"
                      min="1"
                      step="1"
                      required
                      placeholder="1"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value, 10) || 1 })}
                      className="eq-input font-mono"
                    />
                  </div>

                  {/* Row 2, Col 2: Condition * */}
                  <div className="eq-form-group">
                    <label className="eq-label" htmlFor="eq-condition">
                      <span>Condition <span className="required-star">*</span></span>
                    </label>
                    <select
                      id="eq-condition"
                      value={formData.condition}
                      onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                      className="eq-select"
                    >
                      {CONDITION_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  {/* Row 3, Col 1: Brand/model (optional) */}
                  <div className="eq-form-group">
                    <label className="eq-label" htmlFor="eq-brand">
                      <span>Brand / Model <span className="text-[10px] text-slate-500 font-normal">(optional)</span></span>
                    </label>
                    <input
                      id="eq-brand"
                      type="text"
                      placeholder="e.g. STIHL MS 661 C-M"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="eq-input"
                    />
                  </div>

                  {/* Row 3, Col 2: Equipment Image (optional) */}
                  <div className="eq-form-group">
                    <label className="eq-label">
                      <span>Equipment image <span className="text-[10px] text-slate-500 font-normal">(optional)</span></span>
                    </label>
                    <label className="eq-image-slot">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      <div className="eq-image-slot-content">
                        {formData.imageUrl ? (
                          <>
                            <img src={formData.imageUrl} alt="Equipment preview" className="eq-image-thumb" />
                            <span className="text-xs text-emerald-300 font-medium truncate">Photo attached</span>
                          </>
                        ) : (
                          <>
                            <Camera size={16} className="text-emerald-400 shrink-0" />
                            <span className="text-xs text-slate-400 truncate">Add photo (JPG, PNG)</span>
                          </>
                        )}
                      </div>
                      {formData.imageUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          title="Remove photo"
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </label>
                  </div>

                  {/* Row 4, Col 1: Purchase date (optional) */}
                  <div className="eq-form-group">
                    <label className="eq-label" htmlFor="eq-purchase-date">
                      <span>Purchase date <span className="text-[10px] text-slate-500 font-normal">(optional)</span></span>
                    </label>
                    <input
                      id="eq-purchase-date"
                      type="date"
                      value={formData.purchaseDate}
                      onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                      className="eq-input"
                    />
                  </div>

                  {/* Row 4, Col 2: Purchase price per unit (optional, INR) */}
                  <div className="eq-form-group">
                    <label className="eq-label" htmlFor="eq-unit-price">
                      <span>Price per unit (₹) <span className="text-[10px] text-slate-500 font-normal">(optional)</span></span>
                    </label>
                    <input
                      id="eq-unit-price"
                      type="number"
                      min="0"
                      step="any"
                      placeholder="e.g. 25000"
                      value={formData.unitPrice}
                      onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                      className="eq-input font-mono"
                    />
                  </div>

                  {/* Total purchase cost calculation (quantity × unit price) */}
                  {calculatedTotalCost !== null && (
                    <div className="eq-form-group full-width">
                      <div className="eq-cost-box animate-in fade-in duration-150">
                        <div className="eq-cost-title">Estimated total purchase cost</div>
                        <div className="eq-cost-total">
                          ₹{formatINR(calculatedTotalCost)}
                        </div>
                        <div className="eq-cost-breakdown">
                          {formData.quantity} {formData.quantity === 1 ? 'unit' : 'units'} × ₹{formatINR(formData.unitPrice)} per unit
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Row 5: Notes (optional, full width) */}
                  <div className="eq-form-group full-width">
                    <label className="eq-label" htmlFor="eq-notes">
                      <span>Notes <span className="text-[10px] text-slate-500 font-normal">(optional)</span></span>
                    </label>
                    <textarea
                      id="eq-notes"
                      rows={2}
                      placeholder="Maintenance history, attachment specs, serial numbers, or notes..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="eq-textarea"
                    />
                  </div>
                </div>
              </form>
            </div>

            {/* 3. Modal Footer */}
            <div className="eq-modal-footer">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="eq-btn-cancel"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="equipment-modal-form"
                className="eq-btn-save"
              >
                {editingId ? 'Save Equipment' : 'Save Equipment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FleetEquipmentPage;
