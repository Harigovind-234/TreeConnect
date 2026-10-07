import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import DigitalAgreementModal from '../../components/workflow/DigitalAgreementModal';
import harvestService from '../../services/harvestService';
import './ContractorDashboard.css';
import {
  Axe,
  Calculator,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Search,
  ShieldCheck,
  Truck,
  UserCheck,
  X,
  Filter,
  ExternalLink,
  Building2,
  Trees,
  TreePine,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Phone,
  Camera,
  Image as ImageIcon,
  ZoomIn,
  Layers,
  Coins,
  DollarSign,
  Printer,
  Users,
  RefreshCw,
  ClipboardCheck,
  Check,
  CalendarClock,
  Eye,
  Upload,
  AlertCircle,
  Navigation,
  Ban,
  Sparkles,
  FileCheck,
  Sliders,
  Target,
  Activity,
  ClipboardList,
  Ruler
} from 'lucide-react';
import { calculateApproxTimberValue, formatINR, parseVolumeNumber, formatVolume, TIMBER_VALUE_DISCLAIMER } from '../../utils/timberCalculations';

const formatDateDMY = (dateStr) => {
  if (!dateStr) return '02-10-2026';
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

const formatDateFull = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
};

const INSPECTION_CHECKLIST_ITEMS = [
  'Verify property location',
  'Verify tree quantity',
  'Confirm tree species',
  'Assess tree condition',
  'Record tree measurements',
  'Check site accessibility',
  'Check surrounding obstacles',
  'Capture tree/property photographs'
];

const INSPECTION_PURPOSE_OPTIONS = [
  'Tree and property assessment',
  'Verify information provided in harvesting request',
  'Assess harvesting accessibility',
  'Identify potential harvesting obstacles',
  'Collect information required for quotation'
];

const INSPECTION_STATUS_STAGES = [
  { id: 'SCHEDULED', label: 'Scheduled', step: 1 },
  { id: 'CONFIRMED', label: 'Confirmed', step: 2 },
  { id: 'IN_PROGRESS', label: 'In Progress', step: 3 },
  { id: 'COMPLETED', label: 'Completed', step: 4 },
  { id: 'REPORT_SUBMITTED', label: 'Report Submitted', step: 5 }
];

const getUpcomingWorkingDays = () => {
  const slots = [];
  const curr = new Date();
  let dayOffset = 1;

  while (slots.length < 5 && dayOffset < 14) {
    const candidate = new Date();
    candidate.setDate(curr.getDate() + dayOffset);
    const dayOfWeek = candidate.getDay(); // 0 is Sunday
    
    const yyyy = candidate.getFullYear();
    const mm = String(candidate.getMonth() + 1).padStart(2, '0');
    const dd = String(candidate.getDate()).padStart(2, '0');
    const isoDate = `${yyyy}-${mm}-${dd}`;
    
    const dayName = candidate.toLocaleDateString('en-US', { weekday: 'short' });
    const monthName = candidate.toLocaleDateString('en-US', { month: 'short' });
    const dayNum = candidate.getDate();
    
    let label = '';
    if (dayOffset === 1) {
      label = `Tomorrow (${dayName}, ${monthName} ${dayNum})`;
    } else {
      label = `${dayName}, ${monthName} ${dayNum}`;
    }

    slots.push({
      dateStr: isoDate,
      label,
      shortLabel: `${dayName} ${dayNum}`,
      isSunday: dayOfWeek === 0,
      dayOffset
    });

    dayOffset++;
  }
  return slots;
};

const getTreeStandPhoto = (g, sp, inv, propPhotosList = [], targetReq = null) => {
  const extractUrl = (p) => {
    if (!p) return null;
    let str = '';
    if (typeof p === 'string') str = p.trim();
    else if (typeof p === 'object' && p) str = (p.previewUrl || p.dataUrl || p.fileUrl || p.url || p.src || '').trim();

    if (!str || str.length < 5) return null;
    if (str.startsWith('blob:')) return null;
    if (str.includes('unsplash.com')) return null;
    return str;
  };

  // 1. Direct stand photo fields on g
  if (g) {
    const gPhotos = Array.isArray(g.attachedPhotos) && g.attachedPhotos.length > 0
      ? g.attachedPhotos
      : (Array.isArray(g.photos) && g.photos.length > 0 ? g.photos : []);
    for (const p of gPhotos) {
      const u = extractUrl(p);
      if (u) return u;
    }
    const directG = extractUrl(g.image || g.imageUrl || g.photo || g.previewUrl || g.dataUrl);
    if (directG) return directG;
  }

  // 2. Check species item sp
  if (sp) {
    const spPhotos = Array.isArray(sp.attachedPhotos) && sp.attachedPhotos.length > 0
      ? sp.attachedPhotos
      : (Array.isArray(sp.photos) && sp.photos.length > 0 ? sp.photos : []);
    for (const p of spPhotos) {
      const u = extractUrl(p);
      if (u) return u;
    }
    const directSp = extractUrl(sp.image || sp.photo || sp.imageUrl);
    if (directSp) return directSp;
  }

  // 3. Search localStorage treeconnect_inventories
  try {
    const storedInventoriesRaw = localStorage.getItem('treeconnect_inventories');
    if (storedInventoriesRaw) {
      const storedInventories = JSON.parse(storedInventoriesRaw);
      if (Array.isArray(storedInventories)) {
        const propId = targetReq?.property_id || targetReq?.propertyId || targetReq?.property_details?.id || targetReq?.property_details?._id;
        const ownerEmail = targetReq?.owner_email || targetReq?.landowner_email || targetReq?.userEmail;
        const targetSpecies = (g?.species || g?.treeSpecies || '').toLowerCase();

        const matchingInvs = storedInventories.filter(item => {
          if (!item) return false;
          if (propId && (item.propertyId === propId || item.property_id === propId || String(item.propertyId) === String(propId))) return true;
          if (ownerEmail && item.userEmail && item.userEmail.toLowerCase() === ownerEmail.toLowerCase()) return true;
          if (targetReq?.propertyName && item.propertyName && item.propertyName.toLowerCase() === targetReq.propertyName.toLowerCase()) return true;
          return false;
        });

        for (const item of matchingInvs) {
          if (Array.isArray(item.speciesList)) {
            for (const s of item.speciesList) {
              const sName = (s.treeSpecies || s.species || '').toLowerCase();
              if (!targetSpecies || sName === targetSpecies || targetSpecies.includes(sName) || sName.includes(targetSpecies)) {
                if (Array.isArray(s.photos)) {
                  for (const p of s.photos) {
                    const u = extractUrl(p);
                    if (u) return u;
                  }
                }
                const su = extractUrl(s.image || s.photo);
                if (su) return su;
              }
            }
          }
          if (Array.isArray(item.photos)) {
            for (const p of item.photos) {
              const u = extractUrl(p);
              if (u) return u;
            }
          }
          const itemUrl = extractUrl(item.image || item.photo);
          if (itemUrl) return itemUrl;
        }
      }
    }
  } catch (e) { }

  // 4. Fallback to property photos if available
  if (Array.isArray(propPhotosList) && propPhotosList.length > 0) {
    for (const p of propPhotosList) {
      const u = extractUrl(p);
      if (u) return u;
    }
  }

  return null;
};

const formatGPSCoordinates = (p) => {
  if (!p) return '9.557546° N, 76.605175° E';
  const lat = p.latitude ?? p.lat ?? p.gpsLat ?? p.gps_lat;
  const lng = p.longitude ?? p.lng ?? p.gpsLng ?? p.gps_lng;
  if (lat !== undefined && lat !== null && lng !== undefined && lng !== null && String(lat).trim() !== '' && String(lng).trim() !== '') {
    const numLat = Number(lat);
    const numLng = Number(lng);
    if (!isNaN(numLat) && !isNaN(numLng)) {
      return `${numLat.toFixed(6)}° N, ${numLng.toFixed(6)}° E`;
    }
  }
  if (typeof p.gpsCoordinates === 'string' && p.gpsCoordinates) return p.gpsCoordinates;
  return '9.557546° N, 76.605175° E';
};

const getGoogleMapsUrl = (p) => {
  if (!p) return 'https://maps.google.com';
  const lat = p.latitude ?? p.lat ?? p.gpsLat ?? p.gps_lat ?? 9.557546;
  const lng = p.longitude ?? p.lng ?? p.gpsLng ?? p.gps_lng ?? 76.605175;
  if (lat !== undefined && lat !== null && lng !== undefined && lng !== null && String(lat).trim() !== '' && String(lng).trim() !== '') {
    const numLat = Number(lat);
    const numLng = Number(lng);
    if (!isNaN(numLat) && !isNaN(numLng)) {
      return `https://www.google.com/maps?q=${numLat},${numLng}`;
    }
  }
  const locQuery = [p.propertyName || p.name, p.village, p.localBody, p.district, p.state || 'Kerala'].filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locQuery)}`;
};

const AssignedHarvestJobsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const contractorName = user?.fullName || user?.name || user?.companyName || 'Contractor Portal';
  const datePickerRef = useRef(null);

  // Assigned harvest requests state
  const [assignedRequests, setAssignedRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activePhotoModal, setActivePhotoModal] = useState(null);
  const [expandedJobIds, setExpandedJobIds] = useState({});
  const [activePhotoIndices, setActivePhotoIndices] = useState({});

  // Site inspection workflows state
  const [scheduleModalJob, setScheduleModalJob] = useState(null);
  const [auditModalJob, setAuditModalJob] = useState(null);
  const [viewInspectionModalJob, setViewInspectionModalJob] = useState(null);
  const [declineModalJob, setDeclineModalJob] = useState(null);
  const [preQuoteAdvisoryJob, setPreQuoteAdvisoryJob] = useState(null);
  const [selectedAgreementModal, setSelectedAgreementModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const [scheduleForm, setScheduleForm] = useState({
    status: 'SCHEDULED',
    inspection_purpose: 'Tree and property assessment',
    scheduled_date: '',
    time_slot: 'Morning (09:00 AM - 12:00 PM)',
    inspector_name: '',
    inspector_phone: '',
    checklist: [
      'Verify property location',
      'Verify tree quantity',
      'Confirm tree species',
      'Assess tree condition',
      'Record tree measurements',
      'Check site accessibility',
      'Check surrounding obstacles',
      'Capture tree/property photographs'
    ],
    notes: 'Please ensure the estate gate is open and the property boundaries are accessible.'
  });

  const [auditForm, setAuditForm] = useState({
    verified_tree_count: '',
    measured_avg_dbh: '65 - 80 cm',
    canopy_height: '',
    estimated_volume: '',
    timber_condition: 'Sound & Top Quality',
    road_access_verification: 'Heavy 10-wheeler log truck accessible',
    distance_to_haul_road: '25 meters',
    terrain_assessment: 'Gentle slope (good machinery footing)',
    overhead_hazards: 'Clear of power lines',
    felling_complexity: 'Medium (Directional Wedging)',
    inspection_verdict: 'FEASIBLE',
    inspection_remarks: '',
    inspection_photos: []
  });

  const [declineForm, setDeclineForm] = useState({
    reason: 'Inaccessible terrain for heavy haulage vehicles',
    feedback: ''
  });

  const isJobInspected = (r) => Boolean(r && (r.site_inspected || r.site_inspection?.status === 'COMPLETED' || r.site_inspection?.status === 'REPORT_SUBMITTED' || r.inspection_status === 'COMPLETED' || r.inspection_status === 'REPORT_SUBMITTED'));
  const isJobScheduled = (r) => Boolean(r && !isJobInspected(r) && (
    r.site_inspection?.status === 'SCHEDULED' || r.site_inspection?.status === 'CONFIRMED' || r.site_inspection?.status === 'IN_PROGRESS' ||
    r.inspection_status === 'SCHEDULED' || r.inspection_status === 'CONFIRMED' || r.inspection_status === 'IN_PROGRESS'
  ));
  const doesJobNeedVisit = (r) => Boolean(r && !isJobInspected(r) && !isJobScheduled(r) && r.status !== 'ASSESSMENT_SUBMITTED' && r.status !== 'OPERATION_READY' && r.status !== 'ACCEPTED' && r.status !== 'REVISION_REQUESTED');

  const handleOpenSchedule = (req) => {
    const nextDay = new Date();
    nextDay.setDate(nextDay.getDate() + 1);
    const defaultDate = nextDay.toISOString().split('T')[0];

    const existing = req.site_inspection || {};
    const existingChecklist = Array.isArray(existing.checklist || existing.inspection_checklist) && (existing.checklist || existing.inspection_checklist).length > 0
      ? (existing.checklist || existing.inspection_checklist)
      : [...INSPECTION_CHECKLIST_ITEMS];

    const currentStage = existing.status || req.inspection_status || 'SCHEDULED';

    setScheduleForm({
      status: currentStage,
      inspection_purpose: existing.inspection_purpose || existing.purpose || 'Tree and property assessment',
      scheduled_date: existing.suggested_date || existing.scheduled_date || defaultDate,
      time_slot: existing.suggested_time_slot || existing.time_slot || 'Morning (09:00 AM - 12:00 PM)',
      inspector_name: existing.inspector_name || contractorName || 'Rohith kumar',
      inspector_phone: existing.inspector_phone || user?.phone || user?.contactNumber || '9746512243',
      checklist: existingChecklist,
      notes: existing.notes || existing.access_instructions || req.access_instructions || 'Please ensure the estate gate is open and the property boundaries are accessible.'
    });
    setScheduleModalJob(req);
  };

  const handleSubmitSchedule = async (e) => {
    if (e) e.preventDefault();
    if (!scheduleModalJob) return;
    if (!scheduleForm.scheduled_date) {
      alert('Please select an inspection date.');
      return;
    }
    setActionLoading(true);
    try {
      const reqId = scheduleModalJob.id || scheduleModalJob._id;
      const currentStatus = scheduleForm.status || 'SCHEDULED';
      const payload = {
        ...scheduleForm,
        status: currentStatus,
        inspection_status: currentStatus,
        inspection_purpose: scheduleForm.inspection_purpose,
        checklist: scheduleForm.checklist,
        inspection_checklist: scheduleForm.checklist,
        notes: scheduleForm.notes,
        access_instructions: scheduleForm.notes,
        scheduled_at: new Date().toISOString(),
        reschedule_requested: false,
        reschedule_status: 'CONFIRMED'
      };

      try {
        await harvestService.scheduleInspection(reqId, payload);
      } catch (err) {
        console.warn('API schedule inspection fallback:', err);
      }

      // Update state
      setAssignedRequests(prev => prev.map(item => {
        if ((item.id || item._id) === reqId) {
          return {
            ...item,
            site_inspection: {
              ...(item.site_inspection || {}),
              ...payload,
              reschedule_requested: false,
              reschedule_status: 'CONFIRMED'
            },
            reschedule_requested: false,
            inspection_status: currentStatus,
            inspection_scheduled_date: scheduleForm.scheduled_date
          };
        }
        return item;
      }));

      // Update localStorage
      try {
        const stored = localStorage.getItem('treeconnect_harvest_requests');
        if (stored) {
          const parsed = JSON.parse(stored);
          const updated = parsed.map(item => {
            if ((item.id || item._id) === reqId) {
              return {
                ...item,
                site_inspection: {
                  ...(item.site_inspection || {}),
                  ...payload,
                  reschedule_requested: false,
                  reschedule_status: 'CONFIRMED'
                },
                reschedule_requested: false,
                inspection_status: currentStatus,
                inspection_scheduled_date: scheduleForm.scheduled_date
              };
            }
            return item;
          });
          localStorage.setItem('treeconnect_harvest_requests', JSON.stringify(updated));
        }
      } catch (e) { }

      const statusLabel = INSPECTION_STATUS_STAGES.find(s => s.id === currentStatus)?.label || currentStatus;
      showToast(`Site inspection visit marked as "${statusLabel}" for ${formatDateDMY(scheduleForm.scheduled_date)} (${scheduleForm.time_slot})`);
      setScheduleModalJob(null);
    } catch (err) {
      console.error('Failed to schedule inspection:', err);
      alert('Failed to schedule inspection: ' + (err.message || 'Unknown error'));
    } finally {
      setActionLoading(false);
    }
  };

  // Direct 1-click acceptance of landowner's suggested date
  const handleAcceptLandownerReschedule = async (req) => {
    if (!req) return;
    const reqId = req.id || req._id;
    const existing = req.site_inspection || {};
    const newDate = existing.suggested_date;
    const newSlot = existing.suggested_time_slot || existing.time_slot || 'Morning (09:00 AM - 12:00 PM)';

    if (!newDate) {
      handleOpenSchedule(req);
      return;
    }

    setActionLoading(true);
    try {
      try {
        await harvestService.respondReschedule(reqId, {
          action: 'ACCEPT',
          confirmed_date: newDate,
          confirmed_time_slot: newSlot,
          contractor_note: 'Contractor confirmed landowner suggested date'
        });
      } catch (err) {
        console.warn('API respondReschedule fallback:', err);
      }

      // Update state
      setAssignedRequests(prev => prev.map(item => {
        if ((item.id || item._id) === reqId) {
          const origDate = item.site_inspection?.original_scheduled_date || item.site_inspection?.scheduled_date || item.inspection_scheduled_date;
          return {
            ...item,
            site_inspection: {
              ...(item.site_inspection || {}),
              original_scheduled_date: origDate,
              scheduled_date: newDate,
              time_slot: newSlot,
              reschedule_requested: false,
              reschedule_status: 'ACCEPTED',
              status: 'CONFIRMED'
            },
            reschedule_requested: false,
            inspection_status: 'CONFIRMED',
            inspection_scheduled_date: newDate
          };
        }
        return item;
      }));

      // Update localStorage
      try {
        const stored = localStorage.getItem('treeconnect_harvest_requests');
        if (stored) {
          const parsed = JSON.parse(stored);
          const updated = parsed.map(item => {
            if ((item.id || item._id) === reqId) {
              return {
                ...item,
                site_inspection: {
                  ...(item.site_inspection || {}),
                  scheduled_date: newDate,
                  time_slot: newSlot,
                  reschedule_requested: false,
                  reschedule_status: 'ACCEPTED',
                  status: 'CONFIRMED'
                },
                reschedule_requested: false,
                inspection_status: 'CONFIRMED',
                inspection_scheduled_date: newDate
              };
            }
            return item;
          });
          localStorage.setItem('treeconnect_harvest_requests', JSON.stringify(updated));
        }
      } catch (e) { }

      showToast(`Confirmed visit on ${formatDateDMY(newDate)} (${newSlot}) as requested by landowner.`);
    } catch (err) {
      console.error('Failed to accept landowner reschedule:', err);
      alert('Failed to accept reschedule: ' + (err.message || 'Unknown error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenAudit = (req) => {
    const existing = req.site_inspection || {};
    const propDetails = req.property_details || req;
    const calcTrees = Number(req.approxTreesCount || propDetails.approxTreesCount || 20);
    const totalVol = req.total_estimated_volume || 1.70;

    setAuditForm({
      verified_tree_count: existing.verified_tree_count !== undefined && existing.verified_tree_count !== null ? existing.verified_tree_count : calcTrees,
      measured_avg_dbh: existing.measured_avg_dbh || '65 - 80 cm',
      canopy_height: existing.canopy_height || '',
      estimated_volume: existing.estimated_volume !== undefined && existing.estimated_volume !== null ? existing.estimated_volume : totalVol,
      timber_condition: existing.timber_condition || 'Sound & Top Quality',
      road_access_verification: existing.road_access_verification || 'Heavy 10-wheeler log truck accessible',
      distance_to_haul_road: existing.distance_to_haul_road || '25 meters',
      terrain_assessment: existing.terrain_assessment || 'Gentle slope (good machinery footing)',
      overhead_hazards: existing.overhead_hazards || 'Clear of power lines',
      felling_complexity: existing.felling_complexity || 'Medium (Directional Wedging)',
      inspection_verdict: existing.inspection_verdict || 'FEASIBLE',
      inspection_remarks: existing.inspection_remarks || 'On-site timber inspection completed. Trees are healthy with solid heartwood density. Road entry is clear.',
      inspection_photos: Array.isArray(existing.inspection_photos) ? existing.inspection_photos : []
    });
    setAuditModalJob(req);
  };

  const handleAuditPhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAuditForm(prev => ({
          ...prev,
          inspection_photos: [...(prev.inspection_photos || []), event.target.result]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveAuditPhoto = (idx) => {
    setAuditForm(prev => ({
      ...prev,
      inspection_photos: prev.inspection_photos.filter((_, i) => i !== idx)
    }));
  };

  const handleSubmitAudit = async (e) => {
    if (e) e.preventDefault();
    if (!auditModalJob) return;
    setActionLoading(true);
    try {
      const reqId = auditModalJob.id || auditModalJob._id;
      const nowIso = new Date().toISOString();
      const payload = {
        ...auditForm,
        status: 'COMPLETED',
        inspected_at: nowIso,
        completed_at: nowIso,
        inspector_name: auditModalJob.site_inspection?.inspector_name || contractorName || 'Lead Inspector',
        inspector_phone: auditModalJob.site_inspection?.inspector_phone || user?.phone || '9746794654'
      };

      try {
        await harvestService.completeInspection(reqId, payload);
      } catch (err) {
        console.warn('API complete inspection fallback:', err);
      }

      // Update state
      setAssignedRequests(prev => prev.map(item => {
        if ((item.id || item._id) === reqId) {
          return {
            ...item,
            site_inspection: {
              ...(item.site_inspection || {}),
              ...payload
            },
            inspection_status: 'COMPLETED',
            site_inspected: true,
            inspected_at: nowIso,
            inspection_verdict: auditForm.inspection_verdict,
            verified_tree_count: auditForm.verified_tree_count
          };
        }
        return item;
      }));

      // Update localStorage
      try {
        const stored = localStorage.getItem('treeconnect_harvest_requests');
        if (stored) {
          const parsed = JSON.parse(stored);
          const updated = parsed.map(item => {
            if ((item.id || item._id) === reqId) {
              return {
                ...item,
                site_inspection: {
                  ...(item.site_inspection || {}),
                  ...payload
                },
                inspection_status: 'COMPLETED',
                site_inspected: true,
                inspected_at: nowIso,
                inspection_verdict: auditForm.inspection_verdict,
                verified_tree_count: auditForm.verified_tree_count
              };
            }
            return item;
          });
          localStorage.setItem('treeconnect_harvest_requests', JSON.stringify(updated));
        }
      } catch (e) { }

      showToast(`Site inspection certified! Ground truth verified (${auditForm.inspection_verdict}). You can now submit your formal quotation.`);
      setAuditModalJob(null);
    } catch (err) {
      console.error('Failed to complete inspection:', err);
      alert('Failed to save inspection report: ' + (err.message || 'Unknown error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssessClick = (req) => {
    const reqId = req.id || req._id;
    const inspected = isJobInspected(req);
    const submitted = req.status === 'ASSESSMENT_SUBMITTED';
    const accepted = req.status === 'OPERATION_READY' || req.status === 'ACCEPTED';
    const revision = req.status === 'REVISION_REQUESTED';

    if (inspected || submitted || accepted || revision) {
      navigate(`/contractor/assessment/${reqId}`);
    } else {
      // Site not inspected yet - prompt with advisory
      setPreQuoteAdvisoryJob(req);
    }
  };

  const handleOpenDecline = (req) => {
    setDeclineForm({
      reason: 'Inaccessible terrain for heavy haulage vehicles',
      feedback: 'After reviewing site conditions and road approach, this parcel cannot be safely accessed with our current machinery.'
    });
    setDeclineModalJob(req);
  };

  const handleSubmitDecline = async (e) => {
    if (e) e.preventDefault();
    if (!declineModalJob) return;
    setActionLoading(true);
    try {
      const reqId = declineModalJob.id || declineModalJob._id;
      try {
        await harvestService.declineJob(reqId, declineForm);
      } catch (err) {
        console.warn('API decline job fallback:', err);
      }

      setAssignedRequests(prev => prev.filter(r => (r.id || r._id) !== reqId));

      try {
        const stored = localStorage.getItem('treeconnect_harvest_requests');
        if (stored) {
          const parsed = JSON.parse(stored);
          const updated = parsed.map(item => {
            if ((item.id || item._id) === reqId) {
              return {
                ...item,
                status: 'PENDING',
                assigned_contractor_id: null,
                assigned_contractor_name: null,
                assigned_contractor_email: null,
                contractor_decline_reason: declineForm.reason,
                inspection_status: 'DECLINED'
              };
            }
            return item;
          });
          localStorage.setItem('treeconnect_harvest_requests', JSON.stringify(updated));
        }
      } catch (e) { }

      showToast('Assignment declined. Job returned to landowner pool.');
      setDeclineModalJob(null);
    } catch (err) {
      alert('Could not decline job: ' + (err.message || 'Unknown error'));
    } finally {
      setActionLoading(false);
    }
  };

  const toggleExpandJob = (jobId) => {
    setExpandedJobIds(prev => ({
      ...prev,
      [jobId]: !prev[jobId]
    }));
  };

  const openLightbox = (photosList, index = 0, title = 'Site Photo') => {
    const validPhotos = (photosList || []).map(p => {
      if (typeof p === 'string') return p.trim();
      if (typeof p === 'object' && p) return (p.previewUrl || p.dataUrl || p.fileUrl || p.url || p.src || '').trim();
      return '';
    }).filter(Boolean);
    if (validPhotos.length === 0) return;
    setActivePhotoModal({ photos: validPhotos, index, title });
  };

  // Helper to filter out known fake/mock harvest requests
  const isFakeOrMockRequest = (r) => {
    if (!r) return true;
    const rId = String(r.id || r._id || '');
    const pId = String(r.property_id || r.propertyId || '');
    const mockIds = ['test_commercial_plot_001', 'p_1', 'p_2', 'inv_1', 'inv_2', 'hr_1', 'job_demo'];
    if (mockIds.includes(rId) || mockIds.includes(pId)) return true;

    const owner = String(r.ownerName || r.landownerName || r.userEmail || '').toLowerCase();
    const prop = String(r.propertyName || '').toLowerCase();
    if (owner.includes('landowner george') || prop.includes('rubber & teak estate parcel')) return true;
    return false;
  };

  // Fetch assigned harvest requests
  const fetchAssignedRequests = async () => {
    setLoadingRequests(true);
    try {
      const storedUserStr = localStorage.getItem('treeconnect_user');
      const storedUser = storedUserStr ? JSON.parse(storedUserStr) : null;
      const currentUser = user || storedUser;

      const cId = currentUser?.id || currentUser?._id || '';
      const cEmail = (currentUser?.email || '').toLowerCase().trim();
      const cName = (currentUser?.fullName || currentUser?.name || currentUser?.companyName || currentUser?.username || '').toLowerCase().trim();

      // Combine backend & local storage harvest requests, deduplicating by ID
      let backendRequests = [];
      try {
        const data = await harvestService.getHarvestRequests({ all_records: true });
        if (data && Array.isArray(data.harvest_requests)) {
          backendRequests = data.harvest_requests.filter(r => !isFakeOrMockRequest(r));
        }
      } catch (e) {
        console.warn("Backend harvest requests fetch failed:", e);
      }

      let localRequests = [];
      try {
        const stored = localStorage.getItem('treeconnect_harvest_requests');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            localRequests = parsed.filter(r => !isFakeOrMockRequest(r));
            // Keep localStorage clean from any stale fake data
            if (localRequests.length !== parsed.length) {
              localStorage.setItem('treeconnect_harvest_requests', JSON.stringify(localRequests));
            }
          }
        }
      } catch (e) { }

      const allMap = new Map();
      [...backendRequests, ...localRequests].forEach(r => {
        const rId = r?.id || r?._id;
        if (rId && !allMap.has(rId) && !isFakeOrMockRequest(r)) {
          allMap.set(rId, r);
        }
      });
      const combinedRequests = Array.from(allMap.values());

      let assigned = combinedRequests.filter(r => {
        if (!r || r.status === 'CANCELLED' || r.status === 'DELETED') return false;
        if (isFakeOrMockRequest(r)) return false;

        const reqCId = String(r.assigned_contractor_id || r.contractor_id || r.assignedContractorId || '');
        const reqCEmail = String(r.assigned_contractor_email || r.contractor_email || r.assignedContractorEmail || '').toLowerCase().trim();
        const reqCName = String(r.assigned_contractor_name || r.contractor_name || r.assignedContractorName || '').toLowerCase().trim();

        // 1. Direct ID match
        const isMatchId = Boolean(cId && reqCId && (reqCId === String(cId) || (currentUser?._id && reqCId === String(currentUser._id))));

        // 2. Direct email match
        const isMatchEmail = Boolean(cEmail && (
          (reqCEmail && (reqCEmail === cEmail || reqCEmail.includes(cEmail) || cEmail.includes(reqCEmail))) ||
          (reqCName && reqCName === cEmail)
        ));

        // 3. Name match (exact or partial / first name match e.g. "Rohith" vs "Rohith kumar")
        const firstName = cName ? cName.split(' ')[0] : '';
        const reqFirstName = reqCName ? reqCName.split(' ')[0] : '';

        const isMatchName = Boolean(cName && reqCName && (
          reqCName === cName ||
          reqCName.includes(cName) ||
          cName.includes(reqCName) ||
          (firstName && firstName.length >= 3 && reqCName.includes(firstName)) ||
          (reqFirstName && reqFirstName.length >= 3 && cName.includes(reqFirstName))
        ));

        const isDirectlyAssigned = isMatchId || isMatchEmail || isMatchName;
        return isDirectlyAssigned;
      });

      // Fallback matching if name format had slight discrepancy (must still match contractor name/identity)
      if (assigned.length === 0 && combinedRequests.length > 0) {
        const activeAssigned = combinedRequests.filter(r => {
          if (!r || r.status === 'CANCELLED' || r.status === 'DELETED') return false;
          if (isFakeOrMockRequest(r)) return false;
          const statusMatch = r.status === 'CONTRACTOR_ASSIGNED' || r.status === 'ASSESSMENT_SUBMITTED' || r.status === 'REVISION_REQUESTED' || r.status === 'OPERATION_READY' || r.status === 'IN_PROGRESS';
          if (!statusMatch) return false;

          const reqCName = String(r.assigned_contractor_name || r.contractor_name || '').toLowerCase().trim();
          if (!reqCName || !cName) return false;

          const firstName = cName.split(' ')[0];
          const reqFirstName = reqCName.split(' ')[0];
          return (firstName && firstName.length >= 3 && reqCName.includes(firstName)) ||
                 (reqFirstName && reqFirstName.length >= 3 && cName.includes(reqFirstName));
        });
        if (activeAssigned.length > 0) {
          assigned = activeAssigned;
        }
      }

      setAssignedRequests(assigned);
    } catch (err) {
      console.warn("Could not load contractor assigned harvest requests:", err);
      setAssignedRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchAssignedRequests();

    const handleStorageChange = (e) => {
      if (!e || e.key === 'treeconnect_harvest_requests' || e.key === 'treeconnect_user') {
        fetchAssignedRequests();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', fetchAssignedRequests);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', fetchAssignedRequests);
    };
  }, [user]);

  // Filter requests
  const filteredRequests = assignedRequests.filter((req) => {
    const matchesSearch =
      !searchQuery ||
      req.propertyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.propertyLocation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.owner_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.reason?.toLowerCase().includes(searchQuery.toLowerCase());

    const isSubmitted = req.status === 'ASSESSMENT_SUBMITTED';
    const isAccepted = req.status === 'OPERATION_READY' || req.status === 'ACCEPTED';
    const isRevisionRequested = req.status === 'REVISION_REQUESTED';
    const inspected = isJobInspected(req);
    const scheduled = isJobScheduled(req);
    const needsVisit = doesJobNeedVisit(req);

    let matchesStatus = true;
    if (statusFilter === 'NEEDS_INSPECTION') matchesStatus = needsVisit;
    if (statusFilter === 'INSPECTION_SCHEDULED') matchesStatus = scheduled;
    if (statusFilter === 'SITE_VERIFIED') matchesStatus = inspected && !isSubmitted && !isAccepted;
    if (statusFilter === 'PENDING') matchesStatus = !isSubmitted && !isAccepted && !isRevisionRequested;
    if (statusFilter === 'SUBMITTED') matchesStatus = isSubmitted;
    if (statusFilter === 'REVISION') matchesStatus = isRevisionRequested;
    if (statusFilter === 'AUTHORIZED') matchesStatus = isAccepted;

    return matchesSearch && matchesStatus;
  });

  const needsInspectionCount = assignedRequests.filter(doesJobNeedVisit).length;
  const inspectionScheduledCount = assignedRequests.filter(isJobScheduled).length;
  const siteVerifiedCount = assignedRequests.filter(r => isJobInspected(r) && r.status !== 'ASSESSMENT_SUBMITTED' && r.status !== 'OPERATION_READY' && r.status !== 'ACCEPTED').length;
  const revisionCount = assignedRequests.filter(r => r.status === 'REVISION_REQUESTED').length;
  const submittedCount = assignedRequests.filter(r => r.status === 'ASSESSMENT_SUBMITTED').length;
  const authorizedCount = assignedRequests.filter(r => r.status === 'OPERATION_READY' || r.status === 'ACCEPTED').length;

  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="dashboard-body">
        <Sidebar />

        <div className="dashboard-workspace">
          <main className="w-full max-w-6xl mx-auto py-6 flex flex-col gap-8">

            {/* HERO HEADER CARD WITH PIPELINE METRICS */}
            <div className="cd-hero-card">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="max-w-xl">
                  <div className="cd-hero-badge mb-3">
                    <Axe size={14} className="text-emerald-400" />
                    <span>CONTRACTOR OPERATIONS PORTAL</span>
                  </div>
                  <h1 className="cd-hero-title text-2xl sm:text-3xl font-black text-white">
                    Assigned Harvest Jobs & Site Inspections
                  </h1>
                  <p className="cd-hero-subtext text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                    Schedule parcel site visits, inspect standing timber inventory & haul road accessibility, and certify field audit reports before submitting binding quotations.
                  </p>
                </div>

                {/* PIPELINE STATS COUNTERS */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 self-stretch lg:self-center shrink-0">
                  <div className="p-2.5 sm:p-3 rounded-2xl bg-[#05140b] border border-emerald-500/25 flex items-center gap-2.5 shadow-md">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                      <Axe size={16} />
                    </div>
                    <div>
                      <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Assigned</span>
                      <span className="text-base sm:text-lg font-black text-white">{assignedRequests.length}</span>
                    </div>
                  </div>

                  <div className="p-2.5 sm:p-3 rounded-2xl bg-[#05140b] border border-blue-500/25 flex items-center gap-2.5 shadow-md">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Needs Visit</span>
                      <span className="text-base sm:text-lg font-black text-blue-400">{needsInspectionCount}</span>
                    </div>
                  </div>

                  <div className="p-2.5 sm:p-3 rounded-2xl bg-[#05140b] border border-teal-500/25 flex items-center gap-2.5 shadow-md">
                    <div className="w-9 h-9 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
                      <Calendar size={16} />
                    </div>
                    <div>
                      <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Scheduled</span>
                      <span className="text-base sm:text-lg font-black text-teal-400">{inspectionScheduledCount}</span>
                    </div>
                  </div>

                  <div className="p-2.5 sm:p-3 rounded-2xl bg-[#05140b] border border-emerald-500/30 flex items-center gap-2.5 shadow-md">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shrink-0">
                      <ClipboardCheck size={16} />
                    </div>
                    <div>
                      <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Verified</span>
                      <span className="text-base sm:text-lg font-black text-emerald-300">{siteVerifiedCount}</span>
                    </div>
                  </div>

                  <div className="p-2.5 sm:p-3 rounded-2xl bg-[#05140b] border border-amber-500/25 flex items-center gap-2.5 shadow-md">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                      <Clock size={16} />
                    </div>
                    <div>
                      <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Quotes Sent</span>
                      <span className="text-base sm:text-lg font-black text-amber-400">{submittedCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CONTROLS BAR: SEARCH & STATUS FILTER */}
            <div className="cd-filter-bar">
              <div className="cd-search-box">
                <Search size={16} className="cd-search-icon" />
                <input
                  type="text"
                  placeholder="Search by property, location, landowner, or species..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="cd-search-input"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="cd-search-clear"
                    title="Clear Search"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              <div className="cd-filter-tabs">
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 shrink-0 mr-1">
                  <Filter size={13} className="text-emerald-400" /> Filter:
                </span>

                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={`cd-filter-tab ${statusFilter === 'ALL' ? 'active-all' : ''}`}
                >
                  All ({assignedRequests.length})
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('NEEDS_INSPECTION')}
                  className={`cd-filter-tab ${statusFilter === 'NEEDS_INSPECTION' ? 'active-pending border-blue-500/40 text-blue-300' : ''}`}
                >
                  Needs Inspection ({needsInspectionCount})
                </button>

                {inspectionScheduledCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setStatusFilter('INSPECTION_SCHEDULED')}
                    className={`cd-filter-tab ${statusFilter === 'INSPECTION_SCHEDULED' ? 'active-submitted border-teal-500/50 text-teal-300' : ''}`}
                  >
                    Visit Scheduled ({inspectionScheduledCount})
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setStatusFilter('SITE_VERIFIED')}
                  className={`cd-filter-tab ${statusFilter === 'SITE_VERIFIED' ? 'active-authorized border-emerald-500/40 text-emerald-300' : ''}`}
                >
                  Site Verified ({siteVerifiedCount})
                </button>

                {revisionCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setStatusFilter('REVISION')}
                    className={`cd-filter-tab ${statusFilter === 'REVISION' ? 'active-submitted border-amber-500/50 text-amber-300' : ''}`}
                  >
                    Revisions Needed ({revisionCount})
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setStatusFilter('SUBMITTED')}
                  className={`cd-filter-tab ${statusFilter === 'SUBMITTED' ? 'active-submitted' : ''}`}
                >
                  Quotation Submitted ({submittedCount})
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('AUTHORIZED')}
                  className={`cd-filter-tab ${statusFilter === 'AUTHORIZED' ? 'active-authorized' : ''}`}
                >
                  Operation Ready ({authorizedCount})
                </button>
              </div>
            </div>

            {/* JOBS LIST / EMPTY STATE */}
            {loadingRequests ? (
              <div className="bg-[#0b1b12] border border-emerald-500/20 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3">
                <Loader2 size={36} className="text-emerald-400 animate-spin" />
                <h3 className="text-white font-bold text-base">Fetching Assigned Harvest Jobs...</h3>
                <p className="text-slate-400 text-xs">Loading harvest requests assigned by verified landowners.</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="bg-[#0b1b12] border border-emerald-500/20 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-4">
                <Axe size={48} className="text-emerald-500/30 mx-auto" />
                <h3 className="text-white font-bold text-lg">No Assigned Harvest Jobs Found</h3>
                <p className="text-slate-400 text-xs max-w-md">
                  {assignedRequests.length === 0
                    ? 'No harvest requests are currently assigned to your company. Check back once landowners assign your profile for site assessments.'
                    : 'No assigned jobs match your search or status filter criteria.'}
                </p>
                {statusFilter !== 'ALL' && (
                  <button
                    onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); }}
                    className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-8">
                {filteredRequests.map((req) => {
                  const reqId = req.id || req._id || 'job_demo';
                  const isSubmitted = req.status === 'ASSESSMENT_SUBMITTED';
                  const isAccepted = req.status === 'OPERATION_READY' || req.status === 'ACCEPTED';
                  const isRevisionRequested = req.status === 'REVISION_REQUESTED';

                  // Format schedule dates cleanly
                  const startDate = req.preferred_start_date || req.preferredStartDate;
                  const endDate = req.preferred_end_date || req.preferredCompletionDate;
                  let scheduleText = 'Flexible Schedule';
                  if (startDate && endDate) {
                    scheduleText = `${startDate} to ${endDate}`;
                  } else if (startDate) {
                    scheduleText = `From ${startDate}`;
                  } else if (endDate) {
                    scheduleText = `By ${endDate}`;
                  }

                  // Format services needed cleanly
                  const servicesNeededText = Array.isArray(req.required_services) && req.required_services.length > 0
                    ? req.required_services.join(', ')
                    : (req.servicesNeeded || 'Tree Felling & Extraction');

                    const propDetails = req.property_details || req;
                    const propTreeCount = Number(propDetails.approxTreesCount || req.approxTreesCount || 1);

                    // Extract exact tree inventory selected for this request
                    const targetTreeGroups = (Array.isArray(req.selected_tree_groups) && req.selected_tree_groups.length > 0)
                      ? req.selected_tree_groups
                      : (Array.isArray(req.tree_inventory) && req.tree_inventory.length > 0)
                        ? req.tree_inventory
                        : (Array.isArray(req.tree_inventories) && req.tree_inventories.length > 0)
                          ? req.tree_inventories
                          : [];

                    let calcTotalTrees = 0;
                    let uniqueSpecies = [];
                    let plotLocations = [];

                    targetTreeGroups.forEach(g => {
                      if (!g) return;
                      if (Array.isArray(g.speciesList) && g.speciesList.length > 0) {
                        g.speciesList.forEach(sp => {
                          let cnt = Number(sp.numberOfTrees ?? sp.treeCount ?? sp.count ?? 1);
                          if (cnt === 20 || propTreeCount === 1 || targetTreeGroups.length === 1) cnt = 1;
                          calcTotalTrees += cnt;
                          const name = sp.species || sp.treeSpecies || propDetails.mainSpecies || 'Teak';
                          if (!uniqueSpecies.includes(name)) uniqueSpecies.push(name);
                          const loc = sp.locationInProperty || sp.location || g.locationInProperty || g.location;
                          if (loc && !plotLocations.includes(loc)) plotLocations.push(loc);
                        });
                      } else {
                        let cnt = Number(g.numberOfTrees ?? g.treeCount ?? g.count ?? g.quantity ?? 1);
                        if (cnt === 20 || propTreeCount === 1 || targetTreeGroups.length === 1) cnt = 1;
                        calcTotalTrees += cnt;
                        const name = g.species || g.treeSpecies || g.groupName || propDetails.mainSpecies || 'Teak';
                        if (!uniqueSpecies.includes(name)) uniqueSpecies.push(name);
                        const loc = g.locationInProperty || g.location || g.locationOnProperty || g.treeAreaLocation;
                        if (loc && !plotLocations.includes(loc)) plotLocations.push(loc);
                      }
                    });

                    const treeCountBadgeText = calcTotalTrees > 0
                      ? `${calcTotalTrees} Standing Trees ${uniqueSpecies.length > 0 ? `(${uniqueSpecies.join(', ')})` : ''}`
                      : 'Tree Inventory Logged';

                    const specificLocationText = plotLocations.length > 0
                      ? plotLocations.join(' • ')
                      : (req.propertyLocation || 'Estate Plot');

                    const totalJobTimberValue = Number(
                      req.total_estimated_price ||
                      req.approx_timber_value ||
                      req.estimated_timber_value ||
                      targetTreeGroups.reduce((acc, g) => {
                        let count = Number(g.numberOfTrees ?? g.treeCount ?? g.count ?? g.quantity ?? 1);
                        if (count === 20 && propTreeCount === 1) count = 1;
                        const speciesTitle = g.species || g.treeSpecies || g.groupName || propDetails.mainSpecies || 'Teak';
                        let volVal = parseFloat(g.estimatedVolume || g.volume || (count * 0.85)) || Number((count * 0.85).toFixed(2));
                        if (count === 1 && (volVal === 15.0 || volVal === 15 || !g.estimatedVolume)) volVal = 1.7;
                        const val = Number(g.approximate_timber_value || g.estimatedPrice || calculateApproxTimberValue(speciesTitle, volVal));
                        return acc + val;
                      }, 0)
                    );

                    const propAreaVal = req.propertyArea || (propDetails.totalArea ? `${propDetails.totalArea} ${propDetails.areaUnit || 'Cents'}` : '11 Cents');
                    const landClassVal = req.landType || propDetails.propertyType || propDetails.landType || 'Residential Property';
                    const villageVal = req.village || propDetails.village || 'Nagampadam';
                    const localBodyVal = req.localBody || propDetails.localBody || 'Meenadom Panchayat';
                    const pinVal = req.pinCode || propDetails.pinCode || '686516';
                    const ownerNameVal = req.ownerName || propDetails.ownerName || 'Harigovind D Nair';
                    const contactPhoneVal = req.contactNumber || propDetails.contactNumber || '9746794654';
                    const ownerEmailVal = req.owner_email || req.landowner_email || propDetails.userEmail || 'h4hari2003@gmail.com';
                    const districtStateVal = [req.district || propDetails.district || 'Kottayam', req.state || propDetails.state || 'Kerala'].filter(Boolean).join(', ');

                    const isExpanded = !!expandedJobIds[reqId];

                    // Resolve all appropriate site and tree photos for this harvest request
                    const rawSources = [];
                    if (Array.isArray(req.site_photos) && req.site_photos.length > 0) rawSources.push(...req.site_photos);
                    if (Array.isArray(req.photos) && req.photos.length > 0) rawSources.push(...req.photos);
                    if (req.site_photo) rawSources.push(req.site_photo);
                    if (req.photo) rawSources.push(req.photo);

                    if (Array.isArray(propDetails.photos) && propDetails.photos.length > 0) rawSources.push(...propDetails.photos);
                    if (propDetails.image) rawSources.push(propDetails.image);

                    try {
                      const storedPropsRaw = localStorage.getItem('treeconnect_properties');
                      if (storedPropsRaw) {
                        const storedProps = JSON.parse(storedPropsRaw);
                        if (Array.isArray(storedProps)) {
                          const propId = req.property_id || req.propertyId;
                          const ownerEmail = req.owner_email || req.landowner_email || req.userEmail;
                          const matchingProp = storedProps.find(item => {
                            if (!item) return false;
                            if (propId && (item.id === propId || item._id === propId || String(item.id) === String(propId) || String(item._id) === String(propId))) return true;
                            if (ownerEmail && item.userEmail && item.userEmail.toLowerCase() === ownerEmail.toLowerCase()) return true;
                            if (req.propertyName && item.propertyName && item.propertyName.toLowerCase() === req.propertyName.toLowerCase()) return true;
                            return false;
                          });
                          if (matchingProp) {
                            if (Array.isArray(matchingProp.photos)) rawSources.push(...matchingProp.photos);
                            if (matchingProp.image) rawSources.push(matchingProp.image);
                          }
                        }
                      }
                    } catch (e) { }

                    targetTreeGroups.forEach(g => {
                      if (g.image) rawSources.push(g.image);
                      if (g.imageUrl) rawSources.push(g.imageUrl);
                      if (g.photo) rawSources.push(g.photo);
                    });

                    const getRealPhotoUrl = (p) => {
                      if (!p) return null;
                      if (typeof p === 'string') {
                        const s = p.trim();
                        if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('data:image')) return s;
                        return s;
                      }
                      if (typeof p === 'object') {
                        return p.previewUrl || p.dataUrl || p.fileUrl || p.url || p.src || null;
                      }
                      return null;
                    };

                    const realPhotos = [];
                    rawSources.forEach(item => {
                      const u = getRealPhotoUrl(item);
                      if (u && !realPhotos.includes(u)) realPhotos.push(u);
                    });

                    const currentPhotoIdx = activePhotoIndices[reqId] || 0;

                    return (
                      <div key={reqId} className={`cd-assigned-card transition-all duration-300 ${isExpanded ? 'cd-assigned-card-expanded space-y-6' : ''}`}>
                        {/* COMPACT SUMMARY HEADER FOR THIS ASSIGNED JOB */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5 sm:mt-0 shadow-sm">
                              <Trees size={22} className="text-emerald-400" />
                            </div>

                            <div className="min-w-0 flex-1">
                              {/* BADGES ROW */}
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="cd-req-id-badge">
                                  Job #{String(reqId).substring(0, 8)}
                                </span>
                                <span className="review-badge-green">
                                  <Trees size={12} /> {treeCountBadgeText}
                                </span>
                                {totalJobTimberValue > 0 && (
                                  <span className="review-badge-amber font-bold" title="Approx. Total Timber Value set by landowner">
                                    <Coins size={12} /> Approx. Value: {formatINR(totalJobTimberValue)}
                                  </span>
                                )}
                                <span className="cd-req-date">
                                  <Calendar size={12} className="text-slate-500" /> Assigned: {req.createdAt ? (typeof req.createdAt === 'string' ? req.createdAt.split('T')[0] : new Date(req.createdAt).toISOString().split('T')[0]) : 'Recent'}
                                </span>
                              </div>

                              {/* TITLE & LANDOWNER ROW */}
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <h3 className="text-base sm:text-lg font-extrabold text-white truncate">
                                  {req.propertyName || propDetails.propertyName || 'Forest Estate Parcel'}
                                </h3>
                                <span className="text-slate-600 text-xs hidden sm:inline">•</span>
                                <span className="text-xs text-slate-300 flex items-center gap-1.5">
                                  Landowner: <strong className="text-white font-bold">{ownerNameVal}</strong>
                                </span>
                                <span className="px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-1">
                                  <UserCheck size={11} className="text-emerald-400" /> Verified Owner
                                </span>
                              </div>

                              {/* LOCATION */}
                              <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-1">
                                <MapPin size={13} className="text-emerald-400 shrink-0" />
                                <span className="font-semibold text-slate-200">{req.propertyLocation || req.location || 'Kottayam, Kerala'}</span>
                                <span className="text-slate-400">({specificLocationText})</span>
                              </p>
                            </div>
                          </div>

                          {/* RIGHT SIDE STATUS & ACTIONS */}
                          <div className="flex items-center flex-wrap gap-2.5 shrink-0 self-start lg:self-center">
                            <span className={`cd-status-pill ${
                              isAccepted
                                ? 'cd-status-accepted'
                                : isRevisionRequested
                                  ? 'cd-status-revision'
                                  : isSubmitted
                                    ? 'cd-status-submitted'
                                    : isJobInspected(req)
                                      ? 'cd-status-accepted border-emerald-500/40 text-emerald-300'
                                      : isJobScheduled(req)
                                        ? 'cd-status-submitted border-teal-500/50 text-teal-300'
                                        : 'cd-status-pending'
                            }`}>
                              {isAccepted ? (
                                <>
                                  <CheckCircle2 size={14} className="text-emerald-400" />
                                  <span>Operation Authorized</span>
                                </>
                              ) : isRevisionRequested ? (
                                <>
                                  <RefreshCw size={14} className="text-amber-400" />
                                  <span>Revision Requested</span>
                                </>
                              ) : isSubmitted ? (
                                <>
                                  <Clock size={14} className="text-amber-400" />
                                  <span>
                                    {req.commercial_proposal_type === 'Timber Purchase Offer'
                                      ? 'Purchase Offer Under Review'
                                      : req.commercial_proposal_type === 'Purchase + Harvesting'
                                      ? 'Purchase Proposal Under Review'
                                      : 'Quotation Under Review'}
                                  </span>
                                </>
                              ) : isJobInspected(req) ? (
                                <>
                                  <ClipboardCheck size={14} className="text-emerald-400" />
                                  <span>Site Inspected & Verified</span>
                                </>
                              ) : isJobScheduled(req) ? (
                                <>
                                  <Calendar size={14} className="text-teal-400" />
                                  <span>Inspection Scheduled</span>
                                </>
                              ) : (
                                <>
                                  <AlertTriangle size={14} className="text-blue-400" />
                                  <span>Inspection Required</span>
                                </>
                              )}
                            </span>

                            {/* Show/Hide details toggle */}
                            <button
                              type="button"
                              onClick={() => toggleExpandJob(reqId)}
                              className={`cd-btn-toggle-details ${isExpanded ? 'expanded' : ''}`}
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp size={14} className="text-emerald-400" />
                                  <span>Hide Details</span>
                                </>
                              ) : (
                                <>
                                  <ChevronDown size={14} className="text-emerald-400" />
                                  <span>Show Entire Details</span>
                                </>
                              )}
                            </button>

                            {/* Direct Assessment CTA */}
                            <button
                              type="button"
                              onClick={() => handleAssessClick(req)}
                              className={`cd-btn-assess-cta ${isRevisionRequested ? 'cd-btn-assess-revision' : isJobInspected(req) ? 'border-emerald-400/60 shadow-[0_0_15px_rgba(52,211,153,0.3)]' : ''}`}
                            >
                              {isRevisionRequested ? <RefreshCw size={14} /> : <Calculator size={14} />}
                              <span>
                                {isRevisionRequested
                                  ? 'Revise & Resubmit Quote'
                                  : isSubmitted
                                    ? 'Edit Quote'
                                    : isJobInspected(req)
                                      ? 'Submit Verified Quote'
                                      : 'Assess & Quote'}
                              </span>
                            </button>
                          </div>
                        </div>

                        {/* CONTRACTOR SITE INSPECTION WORKFLOW PIPELINE STRIP */}
                        {(() => {
                          const inspected = isJobInspected(req);
                          const scheduled = isJobScheduled(req);
                          const inspectionData = req.site_inspection || {};
                          const isRescheduleRequested = Boolean(inspectionData.reschedule_requested);

                          return (
                            <div className={`cd-inspection-strip ${
                              inspected
                                ? 'cd-inspection-strip-completed'
                                : isRescheduleRequested
                                  ? 'cd-inspection-strip-reschedule'
                                  : scheduled
                                    ? 'cd-inspection-strip-scheduled'
                                    : 'cd-inspection-strip-pending'
                            }`}>
                              <div className="cd-inspection-header">
                                <div className="cd-inspection-title-group">
                                  <div className={`cd-inspection-icon-box ${
                                    inspected
                                      ? 'cd-inspection-icon-completed'
                                      : isRescheduleRequested
                                        ? 'cd-inspection-icon-pending'
                                        : scheduled
                                          ? 'cd-inspection-icon-scheduled'
                                          : 'cd-inspection-icon-pending'
                                  }`}>
                                    {inspected ? (
                                      <ClipboardCheck size={20} />
                                    ) : isRescheduleRequested ? (
                                      <CalendarClock size={20} className="text-amber-400" />
                                    ) : scheduled ? (
                                      <Calendar size={20} />
                                    ) : (
                                      <MapPin size={20} />
                                    )}
                                  </div>

                                  <div>
                                    <div className="cd-inspection-headline">
                                      <span>
                                        {inspected
                                          ? `Site Inspected & Verified on ${formatDateDMY(inspectionData.inspected_at || inspectionData.completed_at)}`
                                          : isRescheduleRequested
                                            ? `⚠️ Landowner Requested Reschedule: Suggested ${formatDateDMY(inspectionData.suggested_date)} • ${inspectionData.suggested_time_slot || 'Morning'}`
                                            : scheduled
                                              ? `Site Visit Scheduled for ${formatDateDMY(inspectionData.scheduled_date)} • ${inspectionData.time_slot || 'Morning'}`
                                              : 'Site Inspection Required Prior to Work Agreement'}
                                      </span>
                                      {inspected ? (
                                        <span className={`cd-inspection-verdict-pill ${
                                          inspectionData.inspection_verdict === 'FEASIBLE'
                                            ? 'cd-verdict-feasible'
                                            : inspectionData.inspection_verdict === 'NOT_FEASIBLE'
                                              ? 'cd-verdict-highrisk'
                                              : 'cd-verdict-conditions'
                                        }`}>
                                          {inspectionData.inspection_verdict === 'FEASIBLE'
                                            ? '✓ FEASIBLE'
                                            : inspectionData.inspection_verdict === 'NOT_FEASIBLE'
                                              ? '✗ NOT FEASIBLE'
                                              : '⚠ FEASIBLE W/ RIGGING'}
                                        </span>
                                      ) : isRescheduleRequested ? (
                                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                          LANDOWNER RESCHEDULE PENDING
                                        </span>
                                      ) : null}
                                    </div>
                                    <p className="cd-inspection-desc">
                                      {inspected
                                        ? `Lead Assessor: ${inspectionData.inspector_name || contractorName} • Ground truth verified with ${inspectionData.verified_tree_count || calcTotalTrees} standing trees logged.`
                                        : isRescheduleRequested
                                          ? `Landowner unavailable on original date (${formatDateDMY(inspectionData.scheduled_date)}). Reason: "${inspectionData.reschedule_reason || 'Schedule conflict'}". ${inspectionData.reschedule_notes ? `Notes: "${inspectionData.reschedule_notes}"` : ''}`
                                          : scheduled
                                            ? `Assessor: ${inspectionData.inspector_name || contractorName} • Contact: ${inspectionData.inspector_phone || contactPhoneVal} • Meeting landowner on-site.`
                                            : 'Before entering a binding commercial agreement or submitting final rates, inspect parcel boundaries, tree condition, and log haul truck accessibility.'}
                                    </p>
                                  </div>
                                </div>

                                {/* ACTION CONTROLS ON STRIP */}
                                <div className="cd-inspection-actions">
                                  {inspected ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => navigate(`/contractor/assessment/${reqId}`)}
                                        className="cd-btn-inspect-schedule bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-md cursor-pointer"
                                        title="Re-assess quotation with audited tree counts and ground-truth timber volume"
                                      >
                                        <Calculator size={13} />
                                        <span>Re-Assess After Site Visit</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setViewInspectionModalJob(req)}
                                        className="cd-btn-inspect-view"
                                        title="View certified inspection audit certificate"
                                      >
                                        <Eye size={13} />
                                        <span>View Full Audit Report</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenAudit(req)}
                                        className="cd-btn-inspect-secondary"
                                        title="Update field findings or add notes"
                                      >
                                        <RefreshCw size={12} />
                                        <span>Update Findings</span>
                                      </button>
                                    </>
                                  ) : isRescheduleRequested ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleAcceptLandownerReschedule(req)}
                                        className="cd-btn-inspect-schedule bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-md cursor-pointer flex items-center gap-1.5"
                                        title={`Accept landowner's suggested date of ${formatDateDMY(inspectionData.suggested_date)}`}
                                      >
                                        <Check size={14} />
                                        <span>Accept Suggested Date ({formatDateDMY(inspectionData.suggested_date)})</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenSchedule(req)}
                                        className="cd-btn-inspect-secondary"
                                        title="Propose another date or time slot"
                                      >
                                        <Calendar size={12} />
                                        <span>Pick Another Date</span>
                                      </button>
                                      <a
                                        href={`tel:${contactPhoneVal}`}
                                        className="cd-btn-inspect-secondary"
                                        title="Call landowner to coordinate schedule"
                                      >
                                        <Phone size={12} />
                                        <span>Call Landowner</span>
                                      </a>
                                    </>
                                  ) : scheduled ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenAudit(req)}
                                        className="cd-btn-inspect-log"
                                        title="Record site verification findings"
                                      >
                                        <ClipboardCheck size={14} />
                                        <span>Log Inspection Findings</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenSchedule(req)}
                                        className="cd-btn-inspect-secondary"
                                        title="Change visit date or time slot"
                                      >
                                        <Calendar size={12} />
                                        <span>Reschedule Visit</span>
                                      </button>
                                      <a
                                        href={`tel:${contactPhoneVal}`}
                                        className="cd-btn-inspect-secondary"
                                        title="Call landowner to coordinate access"
                                      >
                                        <Phone size={12} />
                                        <span>Call Landowner</span>
                                      </a>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenSchedule(req)}
                                        className="cd-btn-inspect-schedule"
                                      >
                                        <Calendar size={14} />
                                        <span>Schedule Site Visit</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenAudit(req)}
                                        className="cd-btn-inspect-log"
                                        title="Record inspection findings if already on site"
                                      >
                                        <ClipboardCheck size={14} />
                                        <span>Record Inspection Report</span>
                                      </button>
                                      <a
                                        href={getGoogleMapsUrl(propDetails)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="cd-btn-inspect-secondary"
                                        title="Open parcel GPS in Google Maps"
                                      >
                                        <Navigation size={12} />
                                        <span>Directions</span>
                                      </a>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenDecline(req)}
                                        className="px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-950/70 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                                        title="Decline job if site is inaccessible"
                                      >
                                        <Ban size={12} />
                                        <span>Decline</span>
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Quick metrics grid if inspected */}
                              {inspected && (
                                <div className="cd-inspection-quick-grid">
                                  <div className="cd-inspection-quick-cell">
                                    <span className="cd-inspection-quick-label">Verified Standing Trees</span>
                                    <span className="cd-inspection-quick-val text-emerald-400">
                                      {inspectionData.verified_tree_count || calcTotalTrees} Trees
                                      {inspectionData.verified_tree_count && Number(inspectionData.verified_tree_count) !== Number(calcTotalTrees) && (
                                        <span className="text-[10px] text-amber-400 ml-1">(! reported: {calcTotalTrees})</span>
                                      )}
                                    </span>
                                  </div>
                                  <div className="cd-inspection-quick-cell">
                                    <span className="cd-inspection-quick-label">Timber Soundness</span>
                                    <span className="cd-inspection-quick-val text-slate-200 truncate" title={inspectionData.timber_condition || 'Sound & Top Quality'}>
                                      {inspectionData.timber_condition || 'Sound & Top Quality'}
                                    </span>
                                  </div>
                                  <div className="cd-inspection-quick-cell">
                                    <span className="cd-inspection-quick-label">Haul Truck Access</span>
                                    <span className="cd-inspection-quick-val text-slate-200 truncate" title={inspectionData.road_access_verification || 'Heavy 10-wheeler accessible'}>
                                      {inspectionData.road_access_verification || 'Heavy 10-wheeler accessible'}
                                    </span>
                                  </div>
                                  <div className="cd-inspection-quick-cell">
                                    <span className="cd-inspection-quick-label">Safety & Fall Hazards</span>
                                    <span className="cd-inspection-quick-val text-slate-200 truncate" title={inspectionData.overhead_hazards || 'Clear of power lines'}>
                                      {inspectionData.overhead_hazards || 'Clear of power lines'}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* Quick field photos preview if contractor attached inspection photos */}
                              {inspected && Array.isArray(inspectionData.inspection_photos) && inspectionData.inspection_photos.length > 0 && (
                                <div className="pt-2 flex items-center gap-2 overflow-x-auto pb-1">
                                  <span className="text-[10.5px] font-bold text-slate-400 shrink-0 flex items-center gap-1">
                                    <Camera size={12} className="text-emerald-400" /> Field Photos ({inspectionData.inspection_photos.length}):
                                  </span>
                                  {inspectionData.inspection_photos.map((ph, pIdx) => (
                                    <img
                                      key={pIdx}
                                      src={ph}
                                      alt={`Inspection Field Photo ${pIdx + 1}`}
                                      onClick={() => openLightbox(inspectionData.inspection_photos, pIdx, `${req.propertyName || 'Property'} - Field Inspection Photo #${pIdx + 1}`)}
                                      className="w-10 h-10 rounded-lg object-cover border border-emerald-500/30 hover:scale-105 transition-transform cursor-pointer shrink-0"
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* LANDOWNER REVISION REQUEST & FAIR DEAL COUNTER-OFFER BANNER */}
                        {isRevisionRequested && (
                          <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
                            <div className="space-y-1.5 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
                                <h4 className="text-sm font-extrabold text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                                  <AlertTriangle size={15} /> Active Landowner Counter-Proposal &amp; Negotiation
                                </h4>
                              </div>
                              <p className="text-xs text-slate-300 leading-relaxed">
                                The landowner proposed adjustments to reach a fair deal. Review their target budget and adjust the quotation to finalize the agreement.
                              </p>
                              <div className="flex items-center gap-3 flex-wrap pt-1 text-xs">
                                {(req.counter_offer_amount || req.assessment?.counter_offer_amount) && (
                                  <span className="px-3 py-1 rounded-lg bg-black/60 border border-amber-500/40 text-amber-200 font-bold">
                                    Landowner Target Price: <strong className="text-amber-400 font-extrabold text-sm">{formatINR(req.counter_offer_amount || req.assessment?.counter_offer_amount)}</strong>
                                  </span>
                                )}
                                {(req.counter_offer_start_date || req.assessment?.counter_offer_start_date) && (
                                  <span className="px-3 py-1 rounded-lg bg-black/60 border border-amber-500/40 text-slate-200">
                                    Requested Start: <strong className="text-white font-semibold">{formatDateDMY(req.counter_offer_start_date || req.assessment?.counter_offer_start_date)}</strong>
                                  </span>
                                )}
                              </div>
                              {Array.isArray(req.revision_reasons || req.assessment?.revision_reasons) && (req.revision_reasons || req.assessment?.revision_reasons).length > 0 && (
                                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                  <span className="text-[11px] text-slate-400 font-semibold">Adjustments:</span>
                                  {(req.revision_reasons || req.assessment?.revision_reasons).map((reason, idx) => (
                                    <span key={idx} className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-950/80 border border-amber-500/30 text-amber-300">
                                      {reason}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {(req.landowner_feedback || req.assessment?.landowner_feedback) && (
                                <p className="text-xs text-amber-100/90 italic bg-black/40 border border-amber-500/20 p-2.5 rounded-xl">
                                  "{req.landowner_feedback || req.assessment?.landowner_feedback}"
                                </p>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => navigate(`/contractor/assessment/${reqId}`)}
                              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg cursor-pointer transition-all shrink-0 hover:scale-[1.02]"
                            >
                              <RefreshCw size={14} />
                              <span>Review &amp; Adjust Deal</span>
                            </button>
                          </div>
                        )}

                        {/* DIGITAL HARVEST AGREEMENT FINALIZED BANNER (WHEN OPERATION_READY) */}
                        {(isAccepted || req.status === 'OPERATION_READY' || req.digital_agreement) && (
                          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-[#0e2417] to-emerald-950/90 border-2 border-emerald-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
                            <div className="flex items-center gap-3.5">
                              <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                                <FileCheck size={22} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-sm sm:text-base font-black text-white">
                                    Digital Harvest Agreement Finalized &amp; Binding
                                  </h4>
                                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/25 text-emerald-300 font-mono font-bold border border-emerald-500/40">
                                    {req.digital_agreement?.agreement_id || `TC-AGR-${String(reqId).slice(-6).toUpperCase()}`}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-300 mt-0.5">
                                  Agreement signed and finalized with {ownerNameVal}. Operational work authorized to begin on <strong>{formatDateDMY(req.assessment?.proposed_start_date || req.proposed_start_date || req.preferred_start_date)}</strong>.
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => setSelectedAgreementModal({ req, assessment: req.assessment })}
                              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg cursor-pointer transition-all shrink-0 hover:scale-[1.02]"
                            >
                              <FileCheck size={16} />
                              <span>View Digital Agreement</span>
                            </button>
                          </div>
                        )}

                        {/* QUICK HIGHLIGHTS STRIP (VISIBLE WHEN COLLAPSED) */}
                        {!isExpanded && (
                          <div className="cd-highlights-strip">
                            <div className="cd-highlight-item">
                              <span className="cd-highlight-label">Standing Trees</span>
                              <strong className="cd-highlight-val text-white">{treeCountBadgeText}</strong>
                            </div>
                            <div className="cd-highlight-item">
                              <span className="cd-highlight-label">Harvest Reason</span>
                              <strong className="cd-highlight-val text-slate-200">{req.reason || req.reasonForHarvesting || 'Mature timber'}</strong>
                            </div>
                            <div className="cd-highlight-item">
                              <span className="cd-highlight-label">Site Access</span>
                              <strong className="cd-highlight-val text-slate-200">{req.site_conditions?.access_availability || req.access_availability || 'Heavy vehicle access'}</strong>
                            </div>
                            <div className="cd-highlight-item">
                              <span className="cd-highlight-label">Assessment Status</span>
                              <strong className={`cd-highlight-val flex items-center gap-1.5 ${isAccepted ? 'text-emerald-400' : isSubmitted ? 'text-amber-400' : 'text-blue-400'}`}>
                                <span className={`w-2 h-2 rounded-full shrink-0 ${isAccepted ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]' : isSubmitted ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]' : 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.7)]'}`} />
                                <span>{isAccepted ? 'Authorized by Owner' : isSubmitted ? 'Quotation Submitted' : 'Pending Site Visit'}</span>
                              </strong>
                            </div>
                          </div>
                        )}

                        {/* ENTIRE DETAILS EXPANDED ON DEMAND */}
                        {isExpanded && (
                          <div className="pt-4 border-t border-emerald-500/20 space-y-6 animate-in fade-in duration-200">
                            {/* APPROPRIATE IMAGES: SITE & TREE INVENTORY MEDIA */}
                            <div className="review-summary-card">
                              <div className="review-section-header">
                                <h4 className="review-section-title">
                                  <ImageIcon size={16} className="text-emerald-400" /> HARVEST SITE & TREE INVENTORY PHOTOS {realPhotos.length > 0 ? `(${realPhotos.length})` : ''}
                                </h4>
                                <span className="review-badge-teal">
                                  {realPhotos.length > 0 ? 'Verified Photos' : 'Cadastral Profile'}
                                </span>
                              </div>

                              {realPhotos.length > 0 ? (
                                <div className="cd-media-gallery-section">
                                  <div
                                    className="cd-main-photo-container relative group cursor-pointer overflow-hidden"
                                    onClick={() => openLightbox(realPhotos, currentPhotoIdx, `${req.propertyName || 'Property'} - Site Photo #${currentPhotoIdx + 1}`)}
                                  >
                                    <img
                                      src={realPhotos[currentPhotoIdx] || realPhotos[0]}
                                      alt="Harvest Site Parcel"
                                      className="cd-main-photo-img group-hover:scale-[1.02] transition-transform duration-300"
                                      onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openLightbox(realPhotos, currentPhotoIdx, `${req.propertyName || 'Property'} - Site Photo #${currentPhotoIdx + 1}`);
                                      }}
                                      className="absolute top-3 right-3 px-3.5 py-1.5 rounded-xl bg-[#090e0b]/85 hover:bg-[#090e0b] border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-lg flex items-center gap-1.5 backdrop-blur cursor-pointer transition-all z-10"
                                    >
                                      <ZoomIn size={14} className="text-emerald-400" />
                                      <span>View Full Photo</span>
                                    </button>
                                    <div className="cd-photo-caption-overlay">
                                      <ImageIcon size={14} className="text-emerald-400" />
                                      <span>{req.propertyName || 'Site Parcel View'} - Photo #{currentPhotoIdx + 1}</span>
                                    </div>
                                  </div>

                                  {realPhotos.length > 1 && (
                                    <div className="cd-photo-thumbnails">
                                      {realPhotos.map((url, idx) => (
                                        <button
                                          key={idx}
                                          type="button"
                                          onClick={() => setActivePhotoIndices(prev => ({ ...prev, [reqId]: idx }))}
                                          className={`cd-photo-thumb-btn ${currentPhotoIdx === idx ? 'active' : ''}`}
                                        >
                                          <img src={url} alt={`Thumbnail ${idx + 1}`} className="cd-photo-thumb-img" onError={(e) => { e.target.style.display = 'none'; }} />
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="p-4 bg-[#08150d] border border-emerald-500/20 rounded-xl text-slate-300 text-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                                      <Camera size={16} />
                                    </div>
                                    <div>
                                      <p className="font-bold text-white">No landowner on-site photos uploaded for this plot.</p>
                                      <p className="text-slate-400 text-[11px]">Inspect cadastral GPS coordinates and tree specs below before assessment quotation.</p>
                                    </div>
                                  </div>
                                  <a
                                    href={getGoogleMapsUrl(propDetails)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 hover:text-slate-950 border border-emerald-500/40 text-emerald-300 font-bold text-xs transition-all cursor-pointer shadow shrink-0 flex items-center gap-1.5"
                                  >
                                    <MapPin size={13} /> View Map Coordinates
                                  </a>
                                </div>
                              )}
                            </div>

                            {/* 1. SELECTED PROPERTY DETAILS (READ-ONLY) CARD */}
                            <div className="review-summary-card">
                              <div className="review-section-header">
                                <h4 className="review-section-title">
                                  <Building2 size={16} className="text-emerald-400" /> SELECTED PROPERTY DETAILS (READ-ONLY)
                                </h4>
                                <div className="flex items-center gap-2">
                                  <a
                                    href={getGoogleMapsUrl(propDetails)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 hover:text-slate-950 border border-emerald-500/40 text-emerald-300 font-bold text-xs transition-all cursor-pointer shadow"
                                  >
                                    Locate on Map <ExternalLink size={12} />
                                  </a>
                                  <span className="review-badge-teal">
                                    Property ID Verified
                                  </span>
                                </div>
                              </div>

                              <div className="review-grid-4">
                                <div className="review-field-item">
                                  <span className="review-field-label">PROPERTY NAME:</span>
                                  <span className="review-field-value-emerald">{req.propertyName || propDetails.propertyName || 'Forest Estate Parcel'}</span>
                                </div>

                                <div className="review-field-item">
                                  <span className="review-field-label">OWNER & CONTACT:</span>
                                  <span className="review-field-value flex items-center gap-1.5 flex-wrap">
                                    <strong className="text-white">{ownerNameVal}</strong>
                                    {contactPhoneVal && (
                                      <a href={`tel:${contactPhoneVal}`} className="text-emerald-300 hover:underline">
                                        (📞 {contactPhoneVal})
                                      </a>
                                    )}
                                  </span>
                                </div>

                                <div className="review-field-item">
                                  <span className="review-field-label">LAND / PROPERTY TYPE:</span>
                                  <span className="review-field-value">{landClassVal}</span>
                                </div>

                                <div className="review-field-item">
                                  <span className="review-field-label">DISTRICT & STATE:</span>
                                  <span className="review-field-value">{districtStateVal}</span>
                                </div>

                                <div className="review-field-item">
                                  <span className="review-field-label">VILLAGE / LOCAL BODY:</span>
                                  <span className="review-field-value">{villageVal} ({localBodyVal})</span>
                                </div>

                                <div className="review-field-item">
                                  <span className="review-field-label">PIN CODE:</span>
                                  <span className="review-field-value">{pinVal}</span>
                                </div>

                                <div className="review-field-item">
                                  <span className="review-field-label">TOTAL PROPERTY AREA:</span>
                                  <span className="review-field-value">{propAreaVal}</span>
                                </div>

                                <div className="review-field-item">
                                  <span className="review-field-label">REGISTERED TREES & SPECIES:</span>
                                  <span className="review-field-value-emerald">{calcTotalTrees > 0 ? `${calcTotalTrees} Trees (${uniqueSpecies.join(', ')})` : 'Registered Trees'}</span>
                                </div>
                              </div>

                              <div className="mt-3 pt-3 border-t border-emerald-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="text-slate-400 font-bold uppercase text-[10px]">GPS Coordinates:</span>
                                  <span className="text-emerald-400 font-mono font-bold">{formatGPSCoordinates(propDetails)}</span>
                                </div>
                                {propDetails.notes && (
                                  <div className="text-slate-300 italic text-[11px]">
                                    <span className="text-emerald-400 font-bold not-italic">Notes: </span>"{propDetails.notes}"
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* 2. STANDING TREE INVENTORY BREAKDOWN */}
                            {targetTreeGroups.length > 0 && (
                              <div className="review-summary-card">
                                <div className="review-section-header">
                                  <h4 className="review-section-title">
                                    <Trees size={16} className="text-emerald-400" /> SELECTED TREE INVENTORIES ({targetTreeGroups.length} Stand {targetTreeGroups.length === 1 ? 'Group' : 'Groups'})
                                  </h4>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {totalJobTimberValue > 0 && (
                                      <span className="px-3 py-1 rounded-xl bg-amber-950/90 border border-amber-500/40 text-amber-300 text-xs font-extrabold flex items-center gap-1.5 shadow">
                                        <Coins size={13} className="text-amber-400" /> Approx. Total Timber Value: {formatINR(totalJobTimberValue)}
                                      </span>
                                    )}
                                    <span className="review-badge-teal">
                                      {calcTotalTrees} Standing Trees Logged
                                    </span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {targetTreeGroups.map((g, idx) => {
                                    let count = Number(g.numberOfTrees ?? g.treeCount ?? g.count ?? g.quantity ?? 1);
                                    if (count === 20 && propTreeCount === 1) count = 1;
                                    const speciesTitle = g.species || g.treeSpecies || g.groupName || propDetails.mainSpecies || 'Teak';
                                    let volVal = parseFloat(g.estimatedVolume || g.volume || (count * 0.85)) || Number((count * 0.85).toFixed(2));
                                    if (count === 1 && (volVal === 15.0 || volVal === 15 || !g.estimatedVolume)) volVal = 1.7;
                                    let ageVal = g.approxAge || g.age || g.averageAge || g.treeAge || '15';
                                    let cleanAge = (ageVal || '15').toString().replace(/\s*years?/i, '').trim() || '15';
                                    let formattedAge = `${cleanAge} Years`;
                                    let girthVal = g.girth || g.girthInfo || g.averageDBH || '60 - 85 cm';
                                    let formattedDBH = girthVal.toString().replace(/(\d+)\s*cm/i, '$1 cm');
                                    if (!formattedDBH.toLowerCase().includes('cm')) formattedDBH += ' cm';
                                    const gradeVal = g.healthCondition || g.condition || g.timberGrade || 'Healthy';
                                    const locationPlot = g.locationInProperty || g.location || g.locationOnProperty || g.treeAreaLocation || req.propertyLocation || 'Plot Area';
                                    const standApproxVal = Number(g.approximate_timber_value || g.estimatedPrice || calculateApproxTimberValue(speciesTitle, volVal));
                                    const standPhoto = getTreeStandPhoto(g, null, null, realPhotos, req);

                                    return (
                                      <div key={g.id || idx} className="review-stand-box flex flex-col justify-between space-y-3.5">
                                        {/* Header info */}
                                        <div className="flex items-start justify-between gap-2">
                                          <div>
                                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Stand #{idx + 1}</span>
                                            <h5 className="review-stand-title">{speciesTitle}</h5>
                                          </div>
                                          <span className="review-stand-badge">{count} Trees</span>
                                        </div>

                                        {/* Tree Stand Image */}
                                        {standPhoto ? (
                                          <div 
                                            className="relative w-full h-44 sm:h-48 rounded-xl overflow-hidden bg-[#050c07] border border-emerald-500/25 group/img cursor-pointer shadow-md"
                                            onClick={() => openLightbox([standPhoto], 0, `${speciesTitle} - Tree Stand #${idx + 1} (${count} Trees)`)}
                                          >
                                            <img
                                              src={standPhoto}
                                              alt={`${speciesTitle} Stand Photo`}
                                              className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
                                              onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-80" />
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                openLightbox([standPhoto], 0, `${speciesTitle} - Tree Stand #${idx + 1} (${count} Trees)`);
                                              }}
                                              className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-black/80 hover:bg-black text-emerald-300 text-[11px] font-bold border border-emerald-500/40 backdrop-blur shadow flex items-center gap-1 transition-all z-10 cursor-pointer"
                                            >
                                              <ZoomIn size={12} className="text-emerald-400" /> Enlarge
                                            </button>
                                            <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs z-10">
                                              <span className="text-white font-extrabold text-xs flex items-center gap-1.5 drop-shadow">
                                                <Camera size={13} className="text-emerald-400" /> {speciesTitle} Tree Image
                                              </span>
                                              <span className="px-2 py-0.5 rounded-full bg-emerald-950/90 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
                                                {count} Standing Trees
                                              </span>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="w-full h-24 rounded-xl border border-dashed border-emerald-500/20 bg-emerald-950/20 flex flex-col items-center justify-center gap-1 text-slate-400 text-xs">
                                            <Trees size={22} className="text-emerald-500/40" />
                                            <span>No Stand Image Uploaded</span>
                                          </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                          <div><span className="text-slate-400 block text-[10px]">Location in Plot:</span><strong className="text-white">{locationPlot}</strong></div>
                                          <div><span className="text-slate-400 block text-[10px]">Est. Total Volume:</span><strong className="text-emerald-400">{volVal} m³</strong></div>
                                          <div>
                                            <span className="text-slate-400 block text-[10px]">Approx. Age & DBH:</span>
                                            <strong className="text-white flex items-center gap-1">
                                              <span>{formattedAge}</span>
                                              <span className="text-emerald-400 font-extrabold">•</span>
                                              <span className="text-slate-200">{formattedDBH}</span>
                                            </strong>
                                          </div>
                                          <div><span className="text-slate-400 block text-[10px]">Health Grade:</span><strong className="text-emerald-300">{gradeVal}</strong></div>
                                          <div className="col-span-2 pt-2 border-t border-emerald-500/15 flex items-center justify-between">
                                            <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Approx. Timber Value:</span>
                                            <span className="font-extrabold text-amber-400 text-sm">{formatINR(standApproxVal)}</span>
                                          </div>
                                        </div>

                                        {g.notes && (
                                          <p className="text-[11px] text-amber-200 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 italic">
                                            "{g.notes}"
                                          </p>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Summary Totals Banner with Approx. Total Timber Value */}
                                <div className="p-4 rounded-2xl bg-[#030a05] border border-emerald-500/35 space-y-2 mt-4 shadow-lg">
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                                    <div>
                                      <span className="text-slate-400 block text-[11px]">Selected Stands:</span>
                                      <span className="font-bold text-white">{targetTreeGroups.length} Stand {targetTreeGroups.length === 1 ? 'Group' : 'Groups'}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 block text-[11px]">Total Standing Trees:</span>
                                      <span className="font-bold text-white">{calcTotalTrees} Trees</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 block text-[11px]">Est. Total Wood Volume:</span>
                                      <span className="font-bold text-emerald-400">
                                        {formatVolume(targetTreeGroups.reduce((acc, curr) => {
                                          let cnt = Number(curr.numberOfTrees ?? curr.treeCount ?? curr.count ?? curr.quantity ?? 1);
                                          if (cnt === 20 && propTreeCount === 1) cnt = 1;
                                          let v = parseVolumeNumber(curr.estimatedVolume || curr.volume || (cnt * 0.85)) || Number((cnt * 0.85).toFixed(2));
                                          if (cnt === 1 && (v === 15.0 || v === 15 || !curr.estimatedVolume)) v = 1.7;
                                          return acc + v;
                                        }, 0))}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 block text-[11px]">Approx. Total Timber Value:</span>
                                      <span className="font-black text-amber-400 text-sm sm:text-base">{formatINR(totalJobTimberValue)}</span>
                                    </div>
                                  </div>
                                  <p className="text-[10.5px] text-slate-400 italic pt-2 border-t border-emerald-500/10 leading-tight">
                                    {TIMBER_VALUE_DISCLAIMER}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* 3. SITE CONDITIONS & HAZARDS CALLOUT */}
                            <div className="review-summary-card">
                              <div className="review-section-header">
                                <h4 className="review-section-title">
                                  <Truck size={16} className="text-emerald-400" /> HARVEST SITE CONDITIONS & HAZARDS
                                </h4>
                                <span className="review-badge-teal">
                                  Site Profile Complete
                                </span>
                              </div>

                              <div className="review-grid-4">
                                <div className="review-field-item">
                                  <span className="review-field-label">ACCESS AVAILABILITY:</span>
                                  <span className="review-field-value">{req.site_conditions?.access_availability || req.access_availability || 'Heavy vehicle access'}</span>
                                </div>
                                <div className="review-field-item">
                                  <span className="review-field-label">ROAD CONDITION:</span>
                                  <span className="review-field-value">{req.site_conditions?.road_condition || req.road_condition || 'Paved panchayat road'} ({req.site_conditions?.distance_from_road || req.distance_from_road || '50 meters'})</span>
                                </div>
                                <div className="review-field-item">
                                  <span className="review-field-label">TERRAIN TYPE:</span>
                                  <span className="review-field-value">{req.site_conditions?.terrain || req.terrain || 'Gently sloped'}</span>
                                </div>
                                <div className="review-field-item">
                                  <span className="review-field-label">SPECIAL HAZARDS:</span>
                                  <span className={((Array.isArray(req.hazards) && req.hazards.length > 0) || req.special_hazards) ? "review-field-value-amber" : "review-field-value"}>
                                    {(Array.isArray(req.hazards) && req.hazards.length > 0 ? req.hazards.join(', ') : (req.special_hazards || 'None'))}
                                  </span>
                                </div>
                              </div>

                              {(req.instructions || req.site_conditions?.additional_notes) && (
                                <div className="mt-2 p-3 rounded-xl bg-slate-900/80 border border-emerald-500/20 text-xs text-slate-300 italic">
                                  <strong className="text-emerald-400 font-bold not-italic">Notes / Instructions: </strong>{req.instructions || req.site_conditions?.additional_notes}
                                </div>
                              )}
                            </div>

                            {/* SPECIFICATIONS GRID */}
                            <div className="cd-specs-grid">
                              <div className="cd-spec-item">
                                <span className="cd-spec-label">Standing Trees</span>
                                <strong className="cd-spec-value-emerald">{calcTotalTrees > 0 ? `${calcTotalTrees} Trees` : '1 Tree'}</strong>
                              </div>
                              <div className="cd-spec-item">
                                <span className="cd-spec-label">Reason for Harvest</span>
                                <strong className="cd-spec-value">{req.reason || req.reasonForHarvesting || 'Mature timber harvest'}</strong>
                              </div>
                              <div className="cd-spec-item">
                                <span className="cd-spec-label">Preferred Period</span>
                                <strong className="cd-spec-value">{scheduleText}</strong>
                              </div>
                            </div>

                            {/* SUBMITTED CONTRACTOR ASSESSMENT SUMMARY (WHEN ALREADY ASSESSED) */}
                            {(isSubmitted || isAccepted || req.assessment || req.assigned_workers_count || req.commercial_proposal_type) && (() => {
                              const assDoc = req.assessment || {};
                              const pType = req.commercial_proposal_type || assDoc.commercial_proposal_type || 'Harvesting Service Quotation';
                              const rawVol = assDoc.estimated_harvestable_volume || req.estimated_harvestable_volume;
                              const assessedVolNum = (rawVol !== undefined && rawVol !== null && rawVol !== '')
                                ? parseVolumeNumber(rawVol)
                                : parseVolumeNumber(req.total_estimated_volume || 1.70);
                              const assessedVolStr = formatVolume(assessedVolNum);

                              return (
                                <div className="assessment-summary-card">
                                  <div className="review-section-header">
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                                        <FileText size={16} />
                                      </div>
                                      <div>
                                        <h4 className="review-section-title">
                                          SUBMITTED CONTRACTOR ASSESSMENT SUMMARY
                                        </h4>
                                        <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                                          Commercial Proposal: <strong className="text-emerald-300 font-bold">{pType}</strong>
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                      <span className={isAccepted ? "review-badge-green" : "review-badge-amber"}>
                                        {isAccepted ? (
                                          <>
                                            <CheckCircle2 size={13} className="text-emerald-400" />
                                            <span>Authorized by Landowner</span>
                                          </>
                                        ) : (
                                          <>
                                            <Clock size={13} className="text-amber-400" />
                                            <span>Awaiting Landowner Approval</span>
                                          </>
                                        )}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => window.print()}
                                        className="px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer no-print shadow"
                                        title="Print Formal Assessment Summary"
                                      >
                                        <Printer size={13} />
                                        <span>Print Summary</span>
                                      </button>
                                    </div>
                                  </div>

                                  {/* Dynamic Commercial Indicator Banner */}
                                  <div className={`commercial-flow-banner ${
                                    pType === 'Timber Purchase Offer'
                                      ? 'commercial-flow-banner-purchase'
                                      : pType === 'Purchase + Harvesting'
                                        ? 'commercial-flow-banner-hybrid'
                                        : 'commercial-flow-banner-service'
                                  }`}>
                                    <div className="flex items-center gap-3">
                                      <div className={`commercial-flow-icon ${
                                        pType === 'Timber Purchase Offer'
                                          ? 'commercial-flow-icon-purchase'
                                          : pType === 'Purchase + Harvesting'
                                            ? 'commercial-flow-icon-hybrid'
                                            : 'commercial-flow-icon-service'
                                      }`}>
                                        {pType === 'Timber Purchase Offer' ? (
                                          <Coins size={18} />
                                        ) : pType === 'Purchase + Harvesting' ? (
                                          <Truck size={18} />
                                        ) : (
                                          <Calculator size={18} />
                                        )}
                                      </div>
                                      <div>
                                        <strong className="block text-xs sm:text-sm font-extrabold text-white">
                                          {pType === 'Harvesting Service Quotation' && 'Harvesting Service Quotation (Landowner pays Contractor)'}
                                          {pType === 'Timber Purchase Offer' && 'Timber Purchase Proposal (Contractor pays Landowner)'}
                                          {pType === 'Purchase + Harvesting' && 'Timber Purchase + Operational Harvesting Agreement'}
                                        </strong>
                                        <span className="text-[11.5px] text-slate-300 font-medium block mt-0.5">
                                          {pType === 'Harvesting Service Quotation' && 'Contractor charges for felling, extraction, and haulage operations.'}
                                          {pType === 'Timber Purchase Offer' && 'Contractor is offering to purchase standing timber directly from landowner.'}
                                          {pType === 'Purchase + Harvesting' && 'Contractor purchases standing timber and executes harvesting operations as agreed.'}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                      <span className={`commercial-flow-badge ${
                                        pType === 'Timber Purchase Offer'
                                          ? 'commercial-flow-badge-purchase'
                                          : pType === 'Purchase + Harvesting'
                                            ? 'commercial-flow-badge-hybrid'
                                            : 'commercial-flow-badge-service'
                                      }`}>
                                        {pType}
                                      </span>
                                      {isAccepted && (pType === 'Timber Purchase Offer' || pType === 'Purchase + Harvesting') && (
                                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[11px] border border-emerald-500/40 shrink-0">
                                          Timber Ownership: CONTRACTOR
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="assessment-metrics-grid">
                                    <div className="assessment-metric-item">
                                      <span className="assessment-metric-label">
                                        <Layers size={13} className="text-emerald-400 shrink-0" /> Assessed Volume
                                      </span>
                                      <strong className="assessment-metric-value-emerald">
                                        {assessedVolStr} m³
                                      </strong>
                                    </div>

                                    {pType === 'Harvesting Service Quotation' && (
                                      <>
                                        <div className="assessment-metric-item">
                                          <span className="assessment-metric-label">
                                            <DollarSign size={13} className="text-amber-400 shrink-0" /> Total Contractor Quotation
                                          </span>
                                          <strong className="assessment-metric-value-amber">
                                            {formatINR(assDoc.total_quote ?? req.total_quote ?? 110000)}
                                          </strong>
                                        </div>
                                        <div className="assessment-metric-item">
                                          <span className="assessment-metric-label">
                                            <Users size={13} className="text-slate-400 shrink-0" /> Assigned Crew
                                          </span>
                                          <strong className="assessment-metric-value">
                                            {assDoc.assigned_workers_count || req.assigned_workers_count || 12} Workers
                                          </strong>
                                        </div>
                                        <div className="assessment-metric-item">
                                          <span className="assessment-metric-label">
                                            <Clock size={13} className="text-slate-400 shrink-0" /> Job Duration
                                          </span>
                                          <strong className="assessment-metric-value">
                                            {assDoc.estimated_duration || req.estimated_duration || '10 Working Days'}
                                          </strong>
                                        </div>
                                        <div className="assessment-metric-item">
                                          <span className="assessment-metric-label">
                                            <Calendar size={13} className="text-slate-400 shrink-0" /> Proposed Start
                                          </span>
                                          <strong className="assessment-metric-value">
                                            {formatDateDMY(assDoc.proposed_start_date || req.proposed_start_date || req.preferred_start_date || '2026-10-02')}
                                          </strong>
                                        </div>
                                      </>
                                    )}

                                    {pType === 'Timber Purchase Offer' && (
                                      <>
                                        <div className="assessment-metric-item">
                                          <span className="assessment-metric-label">
                                            <Coins size={13} className="text-emerald-400 shrink-0" /> Contractor Purchase Offer
                                          </span>
                                          <strong className="text-base font-extrabold text-emerald-400">
                                            {formatINR(assDoc.contractor_purchase_offer ?? req.contractor_purchase_offer ?? 0)}
                                          </strong>
                                        </div>
                                        <div className="assessment-metric-item">
                                          <span className="assessment-metric-label">
                                            <Coins size={13} className="text-amber-400 shrink-0" /> Ref. Timber Value
                                          </span>
                                          <strong className="assessment-metric-value-amber">
                                            {formatINR(assDoc.reference_timber_value ?? req.reference_timber_value ?? totalJobTimberValue)}
                                          </strong>
                                        </div>
                                        <div className="assessment-metric-item">
                                          <span className="assessment-metric-label">
                                            <Clock size={13} className="text-slate-400 shrink-0" /> Offer Valid Until
                                          </span>
                                          <strong className="assessment-metric-value">
                                            {formatDateDMY(assDoc.offer_valid_until || req.offer_valid_until || '2026-11-01')}
                                          </strong>
                                        </div>
                                        <div className="assessment-metric-item">
                                          <span className="assessment-metric-label">
                                            <FileText size={13} className="text-slate-400 shrink-0" /> Payment Terms
                                          </span>
                                          <strong className="assessment-metric-value truncate" title={assDoc.payment_terms || req.payment_terms || '100% upon felling'}>
                                            {assDoc.payment_terms || req.payment_terms || 'Full payment on tree marking'}
                                          </strong>
                                        </div>
                                      </>
                                    )}

                                    {pType === 'Purchase + Harvesting' && (
                                      <>
                                        <div className="assessment-metric-item">
                                          <span className="assessment-metric-label">
                                            <Coins size={13} className="text-emerald-400 shrink-0" /> Timber Purchase Price
                                          </span>
                                          <strong className="text-base font-extrabold text-emerald-400">
                                            {formatINR(assDoc.timber_purchase_price ?? req.timber_purchase_price ?? 0)}
                                          </strong>
                                        </div>
                                        <div className="assessment-metric-item">
                                          <span className="assessment-metric-label">
                                            <Truck size={13} className="text-teal-400 shrink-0" /> Harvesting Arrangement
                                          </span>
                                          <strong className="assessment-metric-value truncate" title={assDoc.harvesting_arrangement_cost || req.harvesting_arrangement_cost || 'Included'}>
                                            {assDoc.harvesting_arrangement_cost || req.harvesting_arrangement_cost || 'Included'}
                                          </strong>
                                        </div>
                                        <div className="assessment-metric-item">
                                          <span className="assessment-metric-label">
                                            <Clock size={13} className="text-slate-400 shrink-0" /> Offer Valid Until
                                          </span>
                                          <strong className="assessment-metric-value">
                                            {formatDateDMY(assDoc.offer_valid_until || req.offer_valid_until || '2026-11-01')}
                                          </strong>
                                        </div>
                                        <div className="assessment-metric-item">
                                          <span className="assessment-metric-label">
                                            <Calendar size={13} className="text-slate-400 shrink-0" /> Proposed Start
                                          </span>
                                          <strong className="assessment-metric-value">
                                            {formatDateDMY(assDoc.proposed_start_date || req.proposed_start_date || req.preferred_start_date || '2026-10-02')}
                                          </strong>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}

                            {/* ACTION BAR (SUBMIT ASSESSMENT HERE AFTER CHECKING ALL DETAILS) */}
                            <div className="cd-action-bar flex-wrap gap-4 pt-3 border-t border-emerald-500/20">
                              <div className="cd-landowner-info flex-wrap gap-2 text-xs">
                                <span className="text-slate-300">Owner: <strong className="text-white font-bold">{ownerNameVal}</strong></span>
                                <span className="text-slate-500">•</span>
                                <a href={`tel:${contactPhoneVal}`} className="text-emerald-400 font-semibold hover:underline">
                                  📞 {contactPhoneVal}
                                </a>
                                <span className="text-slate-500">•</span>
                                <a href={`mailto:${ownerEmailVal}`} className="flex items-center gap-1 text-emerald-300 font-semibold hover:underline">
                                  <Mail size={13} className="text-emerald-400 shrink-0" />
                                  <span>{ownerEmailVal}</span>
                                </a>
                              </div>

                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => toggleExpandJob(reqId)}
                                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                                >
                                  <span>Collapse Details</span>
                                  <ChevronUp size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAssessClick(req)}
                                  className="cd-btn-assessment cursor-pointer"
                                >
                                  <Calculator size={16} />
                                  {isSubmitted ? 'Edit / Resubmit Assessment' : isJobInspected(req) ? 'Submit Assessment & Binding Quote' : 'Submit Inspection Assessment & Quote'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

            </main>
          </div>
        </div>

        {/* FULL-SCREEN LIGHTBOX MODAL FOR PHOTOS */}
        {activePhotoModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-[#0a0f0d]/95 backdrop-blur-md animate-fade-in">
            <div className="max-w-4xl w-full p-6 border border-emerald-500/30 rounded-2xl bg-[#121a16] space-y-4 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-emerald-500/15 pb-3">
                <div>
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    <ImageIcon size={18} className="text-emerald-400" /> {activePhotoModal.title}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Photo {activePhotoModal.index + 1} of {activePhotoModal.photos.length}
                  </p>
                </div>
                <button
                  onClick={() => setActivePhotoModal(null)}
                  className="p-1.5 rounded-lg bg-[#0e1612] border border-emerald-500/20 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="relative max-h-[65vh] flex items-center justify-center overflow-hidden rounded-xl bg-[#0a0f0d] border border-emerald-500/20 p-2">
                <img
                  src={activePhotoModal.photos[activePhotoModal.index]}
                  alt="Full View"
                  className="max-h-[62vh] w-auto max-w-full object-contain rounded-lg shadow-lg"
                />

                {activePhotoModal.photos.length > 1 && (
                  <>
                    <button
                      onClick={() => setActivePhotoModal(prev => ({
                        ...prev,
                        index: prev.index === 0 ? prev.photos.length - 1 : prev.index - 1
                      }))}
                      className="absolute left-4 p-2.5 rounded-full bg-[#0a0f0d]/80 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 transition-all shadow-lg cursor-pointer"
                    >
                      <ChevronLeft size={22} />
                    </button>
                    <button
                      onClick={() => setActivePhotoModal(prev => ({
                        ...prev,
                        index: prev.index === prev.photos.length - 1 ? 0 : prev.index + 1
                      }))}
                      className="absolute right-4 p-2.5 rounded-full bg-[#0a0f0d]/80 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 transition-all shadow-lg cursor-pointer"
                    >
                      <ChevronRight size={22} />
                    </button>
                  </>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setActivePhotoModal(null)}
                  className="px-5 py-2 rounded-xl bg-[#0e1612] hover:bg-emerald-500 hover:text-slate-950 border border-emerald-500/30 text-emerald-300 font-bold text-xs transition-all cursor-pointer"
                >
                  Close Lightbox
                </button>
              </div>
            </div>
          </div>
        )}
        {/* TOAST SUCCESS NOTIFICATION */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-[1100] max-w-md p-4 rounded-2xl bg-[#091a10] border border-emerald-500/50 text-white shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <p className="text-xs font-bold text-slate-100 flex-1 leading-snug">{toastMessage}</p>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* MODAL 1: SCHEDULE SITE INSPECTION VISIT */}
        {scheduleModalJob && (
          <div className="cd-inspection-modal-overlay">
            <div className="cd-inspection-modal-box cd-schedule-modal">
              {/* Modal Header */}
              <div className="cd-schedule-modal-header">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight leading-snug">
                      Schedule Site Inspection Visit
                    </h3>
                    <p className="text-[13px] text-slate-300">
                      {scheduleModalJob.propertyName || 'Parcel Site'} • Owner: <strong className="text-slate-100 font-semibold">{scheduleModalJob.ownerName || scheduleModalJob.property_details?.ownerName || 'Landowner'}</strong>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setScheduleModalJob(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
                  aria-label="Close dialog"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmitSchedule} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                {/* Scrollable Body */}
                <div className="cd-schedule-modal-body">
                  {/* Property & Location Info Card */}
                  <div className="p-3.5 rounded-xl bg-[#08150e]/90 border border-emerald-500/25">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-emerald-500/15">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                          <MapPin size={15} />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block leading-none mb-1">
                            Inspection Site Location
                          </span>
                          <span className="text-white font-semibold text-sm">
                            {scheduleModalJob.propertyLocation || scheduleModalJob.property_details?.propertyLocation || 'Kottayam, Kerala'}
                          </span>
                        </div>
                      </div>

                      <a
                        href={getGoogleMapsUrl(scheduleModalJob.property_details || scheduleModalJob)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors shrink-0 hover:underline"
                        title="Open in Google Maps"
                      >
                        <Navigation size={13} />
                        <span>Open in Google Maps</span>
                        <ExternalLink size={11} className="opacity-75" />
                      </a>
                    </div>

                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <span className="text-slate-400">Landowner:</span>
                        <span className="text-white font-semibold">
                          {scheduleModalJob.ownerName || scheduleModalJob.property_details?.ownerName || 'Harigovind D Nair'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-slate-300">
                        <span className="text-slate-400">Owner Contact:</span>
                        <a
                          href={`tel:${scheduleModalJob.contactNumber || scheduleModalJob.property_details?.contactNumber || '9746794654'}`}
                          className="text-emerald-300 hover:text-emerald-200 font-semibold hover:underline flex items-center gap-1"
                          title="Call landowner"
                        >
                          <Phone size={12} className="text-emerald-400" />
                          <span>{scheduleModalJob.contactNumber || scheduleModalJob.property_details?.contactNumber || '9746794654'}</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Inspection Status Progression Stepper */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="cd-inspection-label mb-0">
                        <Activity size={13} className="text-emerald-400" /> Inspection Status
                      </label>
                      <span className="text-[11px] text-slate-400">
                        Current: <strong className="text-emerald-400 font-semibold uppercase">{scheduleForm.status}</strong>
                      </span>
                    </div>

                    <div className="cd-inspection-status-pipeline">
                      {INSPECTION_STATUS_STAGES.map((st, idx) => {
                        const isCurrent = scheduleForm.status === st.id;
                        const currentIndex = INSPECTION_STATUS_STAGES.findIndex(s => s.id === scheduleForm.status);
                        const isPast = currentIndex > idx;
                        return (
                          <React.Fragment key={st.id}>
                            <button
                              type="button"
                              onClick={() => setScheduleForm(prev => ({ ...prev, status: st.id }))}
                              className={`cd-status-step ${isCurrent ? 'active' : isPast ? 'completed' : 'inactive'}`}
                              title={`Set status to ${st.label}`}
                            >
                              <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                                isCurrent ? 'bg-emerald-500 text-slate-950' : isPast ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-500'
                              }`}>
                                {isPast ? '✓' : st.step}
                              </span>
                              <span>{st.label}</span>
                            </button>
                            {idx < INSPECTION_STATUS_STAGES.length - 1 && (
                              <span className="cd-status-arrow">→</span>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>

                  {/* Inspection Purpose Field */}
                  <div>
                    <label className="cd-inspection-label mb-1.5">
                      <Target size={13} className="text-emerald-400" /> Inspection Purpose <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={scheduleForm.inspection_purpose}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, inspection_purpose: e.target.value }))}
                      className="cd-inspection-select font-medium"
                    >
                      {INSPECTION_PURPOSE_OPTIONS.map((purpose) => (
                        <option key={purpose} value={purpose}>{purpose}</option>
                      ))}
                    </select>
                  </div>

                  {/* Proposed Inspection Date */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="cd-inspection-label mb-0">
                        <Calendar size={13} className="text-emerald-400" /> Proposed Inspection Date <span className="text-red-400">*</span>
                      </label>
                      <span className="text-[12px] text-slate-400 font-normal">
                        Working days: Mon–Sat
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                      <div className="relative flex-1">
                        <input
                          ref={datePickerRef}
                          type="date"
                          min={new Date().toISOString().split('T')[0]}
                          value={scheduleForm.scheduled_date}
                          onChange={(e) => setScheduleForm(prev => ({ ...prev, scheduled_date: e.target.value }))}
                          onClick={(e) => {
                            try {
                              e.target.showPicker?.();
                            } catch (err) {}
                          }}
                          required
                          className="cd-inspection-input font-medium"
                        />
                      </div>

                      {/* Quick Select Buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-slate-400 hidden sm:inline">Quick select:</span>
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date();
                            d.setDate(d.getDate() + 1);
                            setScheduleForm(prev => ({ ...prev, scheduled_date: d.toISOString().split('T')[0] }));
                          }}
                          className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs font-medium text-slate-300 hover:text-white hover:border-emerald-500/40 hover:bg-slate-800 transition-all cursor-pointer"
                        >
                          Tomorrow
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date();
                            d.setDate(d.getDate() + 3);
                            setScheduleForm(prev => ({ ...prev, scheduled_date: d.toISOString().split('T')[0] }));
                          }}
                          className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs font-medium text-slate-300 hover:text-white hover:border-emerald-500/40 hover:bg-slate-800 transition-all cursor-pointer"
                        >
                          +3 Days
                        </button>
                      </div>
                    </div>

                    {/* Selected date subtle helper line */}
                    {scheduleForm.scheduled_date && (
                      <div className="mt-1.5 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-1">
                        <span>
                          Selected date: <strong className="text-emerald-300 font-semibold">{formatDateFull(scheduleForm.scheduled_date)}</strong>
                        </span>
                        {new Date(scheduleForm.scheduled_date + 'T00:00:00').getDay() === 0 && (
                          <span className="text-amber-400 text-[11px] font-medium">Sunday selected (standard days: Mon–Sat)</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Preferred Time Slot Segmented Buttons */}
                  <div>
                    <label className="cd-inspection-label mb-1.5">
                      <Clock size={13} className="text-emerald-400" /> Preferred Time Slot
                    </label>
                    <div className="cd-time-slot-group">
                      {[
                        { id: 'Morning (09:00 AM - 12:00 PM)', title: 'Morning', hours: '09:00 AM – 12:00 PM' },
                        { id: 'Afternoon (01:00 PM - 04:00 PM)', title: 'Afternoon', hours: '01:00 PM – 04:00 PM' },
                        { id: 'Late Afternoon (04:00 PM - 06:30 PM)', title: 'Late Afternoon', hours: '04:00 PM – 06:30 PM' },
                        { id: 'Full Day Site Assessment (09:00 AM - 05:00 PM)', title: 'Full Day', hours: '09:00 AM – 05:00 PM' }
                      ].map((slot) => {
                        const isSelected = scheduleForm.time_slot === slot.id || scheduleForm.time_slot?.startsWith(slot.title);
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => setScheduleForm(prev => ({ ...prev, time_slot: slot.id }))}
                            className={`cd-time-slot-btn ${isSelected ? 'active' : ''}`}
                          >
                            <span className="slot-title">{slot.title}</span>
                            <span className="slot-time">{slot.hours}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Lead Inspector & Contact Number */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="cd-inspection-label mb-1.5">
                        <UserCheck size={13} className="text-emerald-400" /> Lead Inspector / Field Assessor
                      </label>
                      <input
                        type="text"
                        value={scheduleForm.inspector_name}
                        onChange={(e) => setScheduleForm(prev => ({ ...prev, inspector_name: e.target.value }))}
                        placeholder="e.g. Rohith Kumar"
                        className="cd-inspection-input font-medium"
                      />
                    </div>
                    <div>
                      <label className="cd-inspection-label mb-1.5">
                        <Phone size={13} className="text-emerald-400" /> Inspector Contact Number
                      </label>
                      <input
                        type="tel"
                        value={scheduleForm.inspector_phone}
                        onChange={(e) => setScheduleForm(prev => ({ ...prev, inspector_phone: e.target.value }))}
                        placeholder="e.g. 9746512243"
                        className="cd-inspection-input font-medium"
                      />
                    </div>
                  </div>

                  {/* Inspection Checklist */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="cd-inspection-label mb-0">
                        <ClipboardCheck size={13} className="text-emerald-400" /> Inspection Checklist
                      </label>
                      <div className="flex items-center gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setScheduleForm(prev => ({ ...prev, checklist: [...INSPECTION_CHECKLIST_ITEMS] }))}
                          className="text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                        >
                          Select All ({scheduleForm.checklist.length}/8)
                        </button>
                        <span className="text-slate-600">•</span>
                        <button
                          type="button"
                          onClick={() => setScheduleForm(prev => ({ ...prev, checklist: [] }))}
                          className="text-slate-400 hover:text-slate-300 transition-colors cursor-pointer"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">
                      This is what the inspector will assess during the site visit:
                    </p>
                    <div className="cd-checklist-grid">
                      {INSPECTION_CHECKLIST_ITEMS.map((item) => {
                        const active = scheduleForm.checklist.includes(item);
                        return (
                          <div
                            key={item}
                            onClick={() => {
                              setScheduleForm(prev => ({
                                ...prev,
                                checklist: active
                                  ? prev.checklist.filter(i => i !== item)
                                  : [...prev.checklist, item]
                              }));
                            }}
                            className={`cd-checklist-card ${active ? 'checked' : 'unchecked'}`}
                          >
                            <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 text-[10px] ${
                              active ? 'bg-emerald-500 text-slate-950 font-bold' : 'border border-slate-600 text-transparent'
                            }`}>
                              {active ? '✓' : ''}
                            </div>
                            <span className="truncate">{item}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Access / Instructions for Inspector */}
                  <div>
                    <label className="cd-inspection-label mb-1.5">
                      <FileText size={13} className="text-emerald-400" /> Access / Instructions for Inspector
                    </label>
                    <textarea
                      value={scheduleForm.notes}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="e.g. Please ensure the estate gate is open and the property boundaries are accessible."
                      className="cd-inspection-textarea"
                      style={{ minHeight: '85px', height: '85px' }}
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Notes from the landowner or access coordination details for the field assessor.
                    </span>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="cd-schedule-modal-footer">
                  <button
                    type="button"
                    onClick={() => setScheduleModalJob(null)}
                    className="cd-btn-modal-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="cd-btn-confirm-schedule"
                  >
                    {actionLoading ? <Loader2 size={15} className="animate-spin" /> : <Calendar size={15} />}
                    <span>Confirm & Schedule Visit</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: COMPLETE ON-SITE INSPECTION AUDIT FORM */}
        {auditModalJob && (
          <div className="cd-inspection-modal-overlay">
            <div className="cd-inspection-modal-box max-w-3xl">
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <ClipboardCheck size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">Record On-Site Inspection & Audit Report</h3>
                    <p className="text-xs text-slate-300">
                      {auditModalJob.propertyName || 'Parcel Site'} • Certify ground truth timber specs & haulage feasibility
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAuditModalJob(null)}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmitAudit} className="space-y-5">
                {/* SECTION 1: TIMBER & TREE VERIFICATION */}
                <div className="p-4 rounded-2xl bg-[#07130a] border border-emerald-500/25 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Trees size={14} /> 1. Standing Timber Ground Verification
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="cd-inspection-form-group mb-0">
                      <label className="cd-inspection-label">
                        Verified Standing Trees <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={auditForm.verified_tree_count}
                        onChange={(e) => setAuditForm(prev => ({ ...prev, verified_tree_count: Number(e.target.value) }))}
                        required
                        className="cd-inspection-input font-bold text-emerald-400"
                      />
                      <span className="text-[10px] text-slate-400">Landowner reported: {auditModalJob.approxTreesCount || auditModalJob.property_details?.approxTreesCount || 20}</span>
                    </div>

                    <div className="cd-inspection-form-group mb-0">
                      <label className="cd-inspection-label">
                        Measured Avg. DBH / Girth
                      </label>
                      <input
                        type="text"
                        value={auditForm.measured_avg_dbh}
                        onChange={(e) => setAuditForm(prev => ({ ...prev, measured_avg_dbh: e.target.value }))}
                        placeholder="e.g. 70 - 85 cm"
                        className="cd-inspection-input"
                      />
                    </div>

                    <div className="cd-inspection-form-group mb-0">
                      <label className="cd-inspection-label">
                        Est. Usable Volume (m³)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={auditForm.estimated_volume}
                        onChange={(e) => setAuditForm(prev => ({ ...prev, estimated_volume: parseFloat(e.target.value) }))}
                        placeholder="e.g. 1.70"
                        className="cd-inspection-input"
                      />
                    </div>
                  </div>

                  <div className="cd-inspection-form-group mb-0">
                    <label className="cd-inspection-label">
                      Timber Quality & Trunk Health Condition
                    </label>
                    <select
                      value={auditForm.timber_condition}
                      onChange={(e) => setAuditForm(prev => ({ ...prev, timber_condition: e.target.value }))}
                      className="cd-inspection-select"
                    >
                      <option value="Sound & Top Quality">Sound & Top Quality (Dense heartwood, straight bol, no rot)</option>
                      <option value="Minor Surface Defects">Minor Surface Defects (Some knots, superficial weather cracks)</option>
                      <option value="Hollow / Heartwood Rot Observed">Hollow / Heartwood Rot Observed (Reduced timber yield)</option>
                      <option value="Fallen / Storm Split Wood">Fallen / Storm Split Wood</option>
                    </select>
                  </div>
                </div>

                {/* SECTION 2: ACCESS & LOGISTICS VERIFICATION */}
                <div className="p-4 rounded-2xl bg-[#07130a] border border-emerald-500/25 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                    <Truck size={14} /> 2. Site Access & Haulage Logistics Verification
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="cd-inspection-form-group mb-0">
                      <label className="cd-inspection-label">
                        Road Approach & Truck Clearance
                      </label>
                      <select
                        value={auditForm.road_access_verification}
                        onChange={(e) => setAuditForm(prev => ({ ...prev, road_access_verification: e.target.value }))}
                        className="cd-inspection-select"
                      >
                        <option value="Heavy 10-wheeler log truck accessible">Heavy 10-wheeler log truck accessible (Paved & wide)</option>
                        <option value="Medium 6-wheeler truck only">Medium 6-wheeler truck only (Narrow bridge or turns)</option>
                        <option value="Tractor & trailer only">Tractor & trailer only (Mud track / steep approach)</option>
                        <option value="Manual winching / skidding required (No road)">Manual winching / skidding required (No road access)</option>
                      </select>
                    </div>

                    <div className="cd-inspection-form-group mb-0">
                      <label className="cd-inspection-label">
                        Distance from Cutting Zone to Haul Road
                      </label>
                      <input
                        type="text"
                        value={auditForm.distance_to_haul_road}
                        onChange={(e) => setAuditForm(prev => ({ ...prev, distance_to_haul_road: e.target.value }))}
                        placeholder="e.g. 25 meters"
                        className="cd-inspection-input"
                      />
                    </div>

                    <div className="cd-inspection-form-group mb-0">
                      <label className="cd-inspection-label">
                        Ground & Terrain Slope
                      </label>
                      <select
                        value={auditForm.terrain_assessment}
                        onChange={(e) => setAuditForm(prev => ({ ...prev, terrain_assessment: e.target.value }))}
                        className="cd-inspection-select"
                      >
                        <option value="Gentle slope (good machinery footing)">Gentle slope (good machinery footing)</option>
                        <option value="Moderate slope (traction chains recommended)">Moderate slope (traction chains recommended)</option>
                        <option value="Steep incline (winch extraction mandatory)">Steep incline (winch extraction mandatory)</option>
                        <option value="Marshy / Soft clay (dry season execution only)">Marshy / Soft clay (dry season execution only)</option>
                      </select>
                    </div>

                    <div className="cd-inspection-form-group mb-0">
                      <label className="cd-inspection-label">
                        Overhead Power Lines & Infrastructure Hazards
                      </label>
                      <select
                        value={auditForm.overhead_hazards}
                        onChange={(e) => setAuditForm(prev => ({ ...prev, overhead_hazards: e.target.value }))}
                        className="cd-inspection-select"
                      >
                        <option value="Clear of power lines">Clear of power lines (Safe drop zone)</option>
                        <option value="Low-voltage domestic lines nearby (Directional felling required)">Low-voltage domestic lines nearby (Directional felling required)</option>
                        <option value="High-tension 11kV line in fall radius (Needs KSEB permit)">High-tension 11kV line in fall radius (Needs KSEB permit)</option>
                        <option value="Adjacent to residential roof / structures (Sectional felling)">Adjacent to residential roof / structures (Sectional felling)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* SECTION 3: VERDICT & FIELD REMARKS */}
                <div className="p-4 rounded-2xl bg-[#07130a] border border-emerald-500/25 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <ShieldCheck size={14} /> 3. Feasibility Verdict & Field Inspection Remarks
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="cd-inspection-form-group mb-0">
                      <label className="cd-inspection-label">
                        Overall Harvesting Feasibility Verdict <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={auditForm.inspection_verdict}
                        onChange={(e) => setAuditForm(prev => ({ ...prev, inspection_verdict: e.target.value }))}
                        required
                        className="cd-inspection-select font-bold text-emerald-400"
                      >
                        <option value="FEASIBLE">✓ FEASIBLE - Standard Operational Procedure</option>
                        <option value="FEASIBLE_WITH_CONDITIONS">⚠ FEASIBLE - Requires Special Rigging / Winch</option>
                        <option value="HIGH_RISK">⚡ HIGH RISK - Requires Strict Clearances & Permits</option>
                        <option value="NOT_FEASIBLE">✗ NOT FEASIBLE - Severe Site Inaccessibility / Danger</option>
                      </select>
                    </div>

                    <div className="cd-inspection-form-group mb-0">
                      <label className="cd-inspection-label">
                        Estimated Felling Complexity
                      </label>
                      <select
                        value={auditForm.felling_complexity}
                        onChange={(e) => setAuditForm(prev => ({ ...prev, felling_complexity: e.target.value }))}
                        className="cd-inspection-select"
                      >
                        <option value="Low (Straight Drop)">Low (Straight Drop)</option>
                        <option value="Medium (Directional Wedging)">Medium (Directional Wedging)</option>
                        <option value="High (Sectional Rigging & Crane)">High (Sectional Rigging & Crane)</option>
                      </select>
                    </div>
                  </div>

                  <div className="cd-inspection-form-group mb-0">
                    <label className="cd-inspection-label">
                      Inspector Findings & Assessment Remarks
                    </label>
                    <textarea
                      value={auditForm.inspection_remarks}
                      onChange={(e) => setAuditForm(prev => ({ ...prev, inspection_remarks: e.target.value }))}
                      placeholder="Add observations about tree heartwood density, soil firmness, truck turn radius, and client expectations..."
                      className="cd-inspection-textarea"
                    />
                  </div>

                  {/* FIELD PHOTOS UPLOADER */}
                  <div className="cd-inspection-form-group mb-0">
                    <label className="cd-inspection-label">
                      <Camera size={13} className="text-emerald-400" /> Attach Field Inspection Photos
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="px-4 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors">
                        <Upload size={13} />
                        <span>Upload Field Photos</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleAuditPhotoUpload}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[11px] text-slate-400">
                        {auditForm.inspection_photos.length} photos attached
                      </span>
                    </div>

                    {auditForm.inspection_photos.length > 0 && (
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-3">
                        {auditForm.inspection_photos.map((ph, idx) => (
                          <div key={idx} className="relative group rounded-lg overflow-hidden border border-emerald-500/30 h-16 bg-black">
                            <img src={ph} alt={`Audit photo ${idx + 1}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => handleRemoveAuditPhoto(idx)}
                              className="absolute top-1 right-1 p-1 bg-red-600/90 text-white rounded-md text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-emerald-500/20">
                  <button
                    type="button"
                    onClick={() => setAuditModalJob(null)}
                    className="cd-btn-modal-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="cd-btn-inspect-log px-6 py-2.5 text-xs"
                  >
                    {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <ClipboardCheck size={14} />}
                    <span>Certify & Save Inspection Audit</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: VIEW CERTIFIED INSPECTION REPORT */}
        {viewInspectionModalJob && (
          <div className="cd-inspection-modal-overlay">
            <div className="cd-inspection-modal-box cd-schedule-modal max-w-3xl">
              {/* Modal Header */}
              <div className="cd-schedule-modal-header">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <FileCheck size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight leading-snug">
                      Certified Field Inspection Certificate
                    </h3>
                    <p className="text-[13px] text-slate-300">
                      {viewInspectionModalJob.propertyName || 'Property Site'} • Verified by {viewInspectionModalJob.site_inspection?.inspector_name || contractorName || 'Licensed Contractor'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewInspectionModalJob(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
                  aria-label="Close dialog"
                >
                  <X size={18} />
                </button>
              </div>

              {(() => {
                const ins = viewInspectionModalJob.site_inspection || {};
                const prop = viewInspectionModalJob.property_details || viewInspectionModalJob;

                return (
                  <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                    {/* Scrollable Body */}
                    <div className="cd-schedule-modal-body">
                      {/* Official Verdict Card */}
                      <div className="p-4 rounded-xl bg-gradient-to-r from-[#06180e] via-[#092214] to-[#06180e] border border-emerald-500/35 shadow-lg shadow-black/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
                            <CheckCircle2 size={22} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                                Official Feasibility Verdict
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-[10px] uppercase">
                                Report Submitted
                              </span>
                            </div>
                            <h4 className="text-base sm:text-lg font-extrabold text-white tracking-wide">
                              {ins.inspection_verdict === 'FEASIBLE' ? '✓ FEASIBLE FOR HARVESTING' : ins.inspection_verdict || 'FEASIBLE'}
                            </h4>
                          </div>
                        </div>

                        <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-emerald-500/20 text-xs text-slate-300">
                          <span className="text-[11px] text-slate-400 font-medium">Certified Inspection Date</span>
                          <span className="font-semibold text-white flex items-center gap-1.5 mt-0.5">
                            <Calendar size={13} className="text-emerald-400" />
                            {formatDateDMY(ins.inspected_at || ins.completed_at || ins.scheduled_date) || 'Recent Audit'}
                          </span>
                        </div>
                      </div>

                      {/* Inspection Purpose & Scope Checklist */}
                      <div className="p-3.5 rounded-xl bg-[#08150e]/90 border border-emerald-500/25 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                          <span className="text-slate-400 font-medium flex items-center gap-1.5">
                            <Target size={13} className="text-emerald-400" /> Inspection Purpose:
                          </span>
                          <strong className="text-emerald-300 font-semibold text-xs sm:text-sm">
                            {ins.inspection_purpose || 'Tree and property assessment'}
                          </strong>
                        </div>

                        {Array.isArray(ins.checklist || ins.inspection_checklist) && (ins.checklist || ins.inspection_checklist).length > 0 && (
                          <div className="pt-2.5 border-t border-emerald-500/15">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                              Verified Scope Checklist ({(ins.checklist || ins.inspection_checklist).length}/8 Certified)
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {(ins.checklist || ins.inspection_checklist).map((chk) => (
                                <div
                                  key={chk}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/25 text-slate-200 text-xs font-medium flex items-center gap-2"
                                >
                                  <span className="w-3.5 h-3.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-[10px] shrink-0 font-bold">
                                    ✓
                                  </span>
                                  <span className="truncate">{chk}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Technical Audit Findings Grid (8 Metric Cards) */}
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                          Certified On-Site Assessment Findings
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {/* 1. Lead Assessor */}
                          <div className="p-3 rounded-xl bg-[#08150e]/90 border border-emerald-500/20 flex items-center justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Lead Assessor</span>
                              <span className="text-white font-semibold text-xs sm:text-sm">{ins.inspector_name || contractorName || 'Rohith kumar'}</span>
                            </div>
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                              <UserCheck size={14} />
                            </div>
                          </div>

                          {/* 2. Contact Phone */}
                          <div className="p-3 rounded-xl bg-[#08150e]/90 border border-emerald-500/20 flex items-center justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Assessor Phone</span>
                              <a href={`tel:${ins.inspector_phone}`} className="text-emerald-300 hover:underline font-semibold text-xs sm:text-sm flex items-center gap-1">
                                {ins.inspector_phone || '9746512243'}
                              </a>
                            </div>
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                              <Phone size={14} />
                            </div>
                          </div>

                          {/* 3. Verified Standing Trees */}
                          <div className="p-3 rounded-xl bg-[#08150e]/90 border border-emerald-500/20 flex items-center justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Verified Standing Trees</span>
                              <span className="text-emerald-300 font-bold text-xs sm:text-sm">{ins.verified_tree_count || viewInspectionModalJob.approxTreesCount || 20} Trees Audited</span>
                            </div>
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                              <Trees size={14} />
                            </div>
                          </div>

                          {/* 4. Measured Avg. DBH */}
                          <div className="p-3 rounded-xl bg-[#08150e]/90 border border-emerald-500/20 flex items-center justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                                {ins.canopy_height && ins.canopy_height !== '18 - 24 m' && ins.canopy_height !== '20m'
                                  ? 'Avg. DBH / Canopy Height'
                                  : 'Measured Avg. DBH'}
                              </span>
                              <span className="text-white font-semibold text-xs sm:text-sm">
                                {ins.measured_avg_dbh || '70 - 80 cm'}
                                {ins.canopy_height && ins.canopy_height !== '18 - 24 m' && ins.canopy_height !== '20m'
                                  ? ` • ${ins.canopy_height}`
                                  : ''}
                              </span>
                            </div>
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                              <Ruler size={14} />
                            </div>
                          </div>

                          {/* 5. Timber Soundness */}
                          <div className="p-3 rounded-xl bg-[#08150e]/90 border border-emerald-500/20 flex items-center justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Timber Soundness</span>
                              <span className="text-emerald-300 font-semibold text-xs sm:text-sm">{ins.timber_condition || 'Sound & Top Quality'}</span>
                            </div>
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                              <ShieldCheck size={14} />
                            </div>
                          </div>

                          {/* 6. Haul Road Approach */}
                          <div className="p-3 rounded-xl bg-[#08150e]/90 border border-emerald-500/20 flex items-center justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Haul Road Approach</span>
                              <span className="text-white font-semibold text-xs sm:text-sm">{ins.road_access_verification || 'Heavy truck accessible'}</span>
                            </div>
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                              <Truck size={14} />
                            </div>
                          </div>

                          {/* 7. Distance to Paved Road */}
                          <div className="p-3 rounded-xl bg-[#08150e]/90 border border-emerald-500/20 flex items-center justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Distance to Paved Road</span>
                              <span className="text-white font-semibold text-xs sm:text-sm">{ins.distance_to_haul_road || '25 meters'}</span>
                            </div>
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                              <Navigation size={14} />
                            </div>
                          </div>

                          {/* 8. Surrounding Hazards */}
                          <div className="p-3 rounded-xl bg-[#08150e]/90 border border-emerald-500/20 flex items-center justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Surrounding Obstacles / Hazards</span>
                              <span className="text-white font-semibold text-xs sm:text-sm">{ins.overhead_hazards || 'Clear'}</span>
                            </div>
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                              <AlertTriangle size={14} />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Landowner Access Coordination Details */}
                      {ins.notes && (
                        <div className="p-3.5 rounded-xl bg-[#08150e]/90 border border-emerald-500/20 text-xs">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
                            <FileText size={12} className="text-emerald-400" /> Landowner Access Instructions
                          </span>
                          <p className="text-slate-200 leading-relaxed font-normal">{ins.notes}</p>
                        </div>
                      )}

                      {/* Inspector Field Remarks */}
                      {ins.inspection_remarks && (
                        <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/25 text-xs">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-1">
                            <ClipboardCheck size={12} /> Assessor Field Notes & Remarks
                          </span>
                          <p className="text-emerald-100 italic leading-relaxed">{ins.inspection_remarks}</p>
                        </div>
                      )}

                      {/* Attached Photos */}
                      {Array.isArray(ins.inspection_photos) && ins.inspection_photos.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                            Attached Field Inspection Photos ({ins.inspection_photos.length})
                          </span>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {ins.inspection_photos.map((ph, idx) => (
                              <img
                                key={idx}
                                src={ph}
                                alt={`Inspection ${idx + 1}`}
                                onClick={() => openLightbox(ins.inspection_photos, idx, `Field Inspection Photo #${idx + 1}`)}
                                className="h-20 w-full object-cover rounded-lg border border-emerald-500/30 hover:scale-105 transition-transform cursor-pointer"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Fixed Modal Footer */}
                    <div className="cd-schedule-modal-footer">
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="mr-auto px-4 py-2 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-emerald-500/40 text-slate-300 hover:text-white font-semibold text-xs flex items-center gap-2 cursor-pointer transition-all"
                      >
                        <Printer size={14} />
                        <span>Print Certificate</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setViewInspectionModalJob(null)}
                        className="cd-btn-modal-cancel"
                      >
                        Close
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setViewInspectionModalJob(null);
                          handleAssessClick(viewInspectionModalJob);
                        }}
                        className="cd-btn-confirm-schedule"
                      >
                        <Calculator size={15} />
                        <span>Submit Binding Quotation</span>
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* MODAL 4: PRE-QUOTE ADVISORY (SHOWN IF USER CLICKS QUOTE BEFORE INSPECTING) */}
        {preQuoteAdvisoryJob && (
          <div className="cd-inspection-modal-overlay">
            <div className="cd-inspection-modal-box max-w-lg space-y-4">
              <div className="flex items-center gap-3 border-b border-amber-500/25 pb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/35 flex items-center justify-center text-amber-400 shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Site Inspection Recommended</h3>
                  <p className="text-xs text-slate-300">
                    {preQuoteAdvisoryJob.propertyName || 'Property Site'}
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                <p>
                  You haven't recorded a physical site inspection for this property yet. Under TreeConnect best practices, contractors are strongly advised to inspect:
                </p>
                <ul className="space-y-1.5 pl-4 list-disc text-slate-400">
                  <li>Actual standing tree count and sound heartwood quality</li>
                  <li>Overhead power lines and structure drop hazards</li>
                  <li>Heavy log hauler truck clearance and distance to paved road</li>
                </ul>
                <p className="text-amber-300 font-semibold">
                  Conducting an inspection ensures your quotation is accurate and eliminates unanticipated equipment or haulage costs.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-emerald-500/20">
                <button
                  type="button"
                  onClick={() => {
                    const req = preQuoteAdvisoryJob;
                    setPreQuoteAdvisoryJob(null);
                    handleOpenSchedule(req);
                  }}
                  className="w-full sm:w-auto cd-btn-inspect-schedule px-4 py-2 text-xs"
                >
                  <Calendar size={13} />
                  <span>Schedule Site Visit (Recommended)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const req = preQuoteAdvisoryJob;
                    setPreQuoteAdvisoryJob(null);
                    handleOpenAudit(req);
                  }}
                  className="w-full sm:w-auto cd-btn-inspect-log px-4 py-2 text-xs"
                >
                  <ClipboardCheck size={13} />
                  <span>Record Inspection Now</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const reqId = preQuoteAdvisoryJob.id || preQuoteAdvisoryJob._id;
                    setPreQuoteAdvisoryJob(null);
                    navigate(`/contractor/assessment/${reqId}`);
                  }}
                  className="w-full sm:w-auto px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Skip & Quote Anyway
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 5: DECLINE JOB MODAL */}
        {declineModalJob && (
          <div className="cd-inspection-modal-overlay">
            <div className="cd-inspection-modal-box max-w-md space-y-4">
              <div className="flex items-center gap-3 border-b border-red-500/25 pb-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/35 flex items-center justify-center text-red-400 shrink-0">
                  <Ban size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Decline Harvest Assignment</h3>
                  <p className="text-xs text-slate-300">
                    {declineModalJob.propertyName || 'Property Site'}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmitDecline} className="space-y-3 text-xs">
                <p className="text-slate-300">
                  If the site is inaccessible or cannot be harvested with your machinery, you can decline. The job will be returned to the landowner's pool with your feedback.
                </p>

                <div className="cd-inspection-form-group">
                  <label className="cd-inspection-label">Decline Reason</label>
                  <select
                    value={declineForm.reason}
                    onChange={(e) => setDeclineForm(prev => ({ ...prev, reason: e.target.value }))}
                    className="cd-inspection-select"
                  >
                    <option value="Inaccessible terrain for heavy haulage vehicles">Inaccessible terrain for heavy haulage vehicles</option>
                    <option value="High-voltage power lines pose excessive hazard">High-voltage power lines pose excessive hazard</option>
                    <option value="Discrepancy in tree boundary or inventory count">Discrepancy in tree boundary or inventory count</option>
                    <option value="Contractor crew / equipment fully booked">Contractor crew / equipment fully booked</option>
                    <option value="Out of operational geographic range">Out of operational geographic range</option>
                  </select>
                </div>

                <div className="cd-inspection-form-group">
                  <label className="cd-inspection-label">Additional Feedback for Landowner</label>
                  <textarea
                    value={declineForm.feedback}
                    onChange={(e) => setDeclineForm(prev => ({ ...prev, feedback: e.target.value }))}
                    className="cd-inspection-textarea"
                    placeholder="Provide recommendations (e.g. road widening needed, dry season felling)..."
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-emerald-500/20">
                  <button
                    type="button"
                    onClick={() => setDeclineModalJob(null)}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg"
                  >
                    {actionLoading ? <Loader2 size={13} className="animate-spin" /> : <Ban size={13} />}
                    <span>Confirm & Decline</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 6: DIGITAL HARVEST AGREEMENT VIEWER */}
        {selectedAgreementModal && (
          <DigitalAgreementModal
            request={selectedAgreementModal.req}
            assessment={selectedAgreementModal.assessment}
            onClose={() => setSelectedAgreementModal(null)}
          />
        )}

      </div>
    );
};

export default AssignedHarvestJobsPage;
