import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Toast from '../components/Toast';
import Loader from '../components/Loader';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
import SuccessModal from '../components/SuccessModal';
import FileUploadCard from '../components/FileUploadCard';
import { locationService, KERALA_DISTRICTS, OTHER_MAJOR_DISTRICTS } from '../services/locationService';
import {
  Trees,
  Truck,
  ShoppingBag,
  UserPlus,
  Mail,
  Key,
  User,
  Phone,
  MapPin,
  Globe,
  Building,
  Home,
  Compass,
  MessageSquare,
  Eye,
  EyeOff,
  Briefcase,
  Award,
  ArrowLeft,
  Info,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Loader2
} from 'lucide-react';

// Phone validation rule: 10 digits, starts with 6-9, no digit repeated 5 or more times
const phoneSchema = z
  .string()
  .min(1, 'Mobile number is required')
  .regex(/^\d+$/, 'Mobile number must contain digits only')
  .regex(/^[6-9]/, 'Mobile number must start with 6, 7, 8, or 9')
  .length(10, 'Mobile number must be exactly 10 digits')
  .refine(
    (val) => {
      if (!val || val.length !== 10) return true;
      const counts = {};
      for (let char of val) {
        counts[char] = (counts[char] || 0) + 1;
        if (counts[char] >= 5) return false;
      }
      return true;
    },
    { message: 'Mobile number cannot contain the same digit 5 or more times' }
  );

// Zod Schema Definition
const baseSchema = z.object({
  role: z.enum(['landowner', 'contractor', 'buyer']),
  fullName: z.string().min(2, 'Full Name / Contractor Name is required'),
  contactPerson: z.string().optional(),
  email: z.string().min(1, 'Email address is required').email('Please enter a valid email address'),
  phone: phoneSchema,
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
  address: z.string().min(3, 'Address is required'),
  district: z.string().min(2, 'District is required'),
  state: z.string().min(2, 'State is required'),
  country: z.string().min(2, 'Country is required'),
  postalCode: z.string().min(3, 'Postal code is required'),
  localBody: z.string().optional(),
  village: z.string().optional(),
  businessType: z.string().optional(),
  buyerType: z.string().optional(),
  gstNumber: z.string().optional(),
  yearsOfExperience: z.string().optional(),
  serviceArea: z.string().optional(),
  landTaxInvoiceDoc: z.string().optional(),
  idProofType: z.string().optional(),
  declarationAccepted: z.boolean().optional(),
  preferredCommunication: z.string().default('Email'),
  language: z.string().default('English'),
  profilePicture: z.string().optional()
}).superRefine((data, ctx) => {
  // District Validation: Block Country and State names
  if (data.district && locationService.isInvalidDistrict(data.district)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `"${data.district}" is a state/country name. Please enter a valid District name (e.g. Kozhikode, Wayanad, Ernakulam)`,
      path: ['district']
    });
  }

  if (data.role === 'buyer') {
    if (!data.contactPerson || data.contactPerson.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Contact person name is required for buyers',
        path: ['contactPerson']
      });
    }
    if (!data.buyerType || data.buyerType.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please select your buyer business type',
        path: ['buyerType']
      });
    }
  }

  if (data.role === 'contractor') {
    if (!data.yearsOfExperience || data.yearsOfExperience.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Years of experience is required',
        path: ['yearsOfExperience']
      });
    }

    if (!data.idProofType || data.idProofType.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please select a government identity document type',
        path: ['idProofType']
      });
    }
  }

  if ((data.role === 'contractor' || data.role === 'buyer') && !data.declarationAccepted) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'You must certify that all information and uploaded documents are genuine',
      path: ['declarationAccepted']
    });
  }

  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Passwords do not match',
      path: ['confirmPassword']
    });
  }
});

const Register = () => {
  const [searchParams] = useSearchParams();
  const paramRole = searchParams.get('role');

  const [selectedRole, setSelectedRole] = useState(
    ['landowner', 'contractor', 'buyer'].includes(paramRole) ? paramRole : null
  );

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);

  // File state for Contractor uploads
  const [idProofFile, setIdProofFile] = useState(null);
  const [idProofError, setIdProofError] = useState('');
  const [supportingFile, setSupportingFile] = useState(null);
  const [supportingError, setSupportingError] = useState('');

  // File state for Buyer verification uploads
  const [buyerForestLicenceFile, setBuyerForestLicenceFile] = useState(null);
  const [buyerTradeLicenceFile, setBuyerTradeLicenceFile] = useState(null);
  const [buyerGstFile, setBuyerGstFile] = useState(null);
  const [buyerBusinessCertFile, setBuyerBusinessCertFile] = useState(null);
  const [buyerIdProofFile, setBuyerIdProofFile] = useState(null);
  const [buyerVerificationError, setBuyerVerificationError] = useState('');

  // File state for Landowner Land Tax Invoice & Identity Proof upload
  const [landTaxInvoiceFile, setLandTaxInvoiceFile] = useState(null);
  const [landownerIdProofFile, setLandownerIdProofFile] = useState(null);

  const [toast, setToast] = useState({ type: '', message: '' });
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const { register: registerAuth } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(baseSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      role: selectedRole || 'landowner',
      fullName: '',
      contactPerson: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      address: '',
      district: '',
      state: 'Kerala',
      country: 'India',
      postalCode: '',
      localBody: '',
      village: '',
      businessType: 'Sawmill',
      buyerType: 'Sawmill',
      gstNumber: '',
      yearsOfExperience: '',
      serviceArea: '',
      landTaxInvoiceDoc: '',
      idProofType: '',
      declarationAccepted: false,
      preferredCommunication: 'Email',
      language: 'English',
      profilePicture: ''
    }
  });

  const watchPassword = watch('password', '');
  const watchIdProofType = watch('idProofType', '');
  const watchPostalCode = watch('postalCode', '');
  const watchDistrict = watch('district', '');
  const watchBuyerType = watch('buyerType', 'Sawmill');

  const [isFetchingPin, setIsFetchingPin] = useState(false);
  const [pinAutoMsg, setPinAutoMsg] = useState('');
  const [customDistrictMode, setCustomDistrictMode] = useState(false);

  // Auto-fetch location when 6-digit Indian PIN code is entered
  React.useEffect(() => {
    const cleanPin = (watchPostalCode || '').trim();
    if (cleanPin.length === 6 && /^\d{6}$/.test(cleanPin)) {
      let isSubscribed = true;
      setIsFetchingPin(true);
      setPinAutoMsg('');

      locationService.fetchLocationByPinCode(cleanPin).then((res) => {
        if (!isSubscribed) return;
        setIsFetchingPin(false);
        if (res) {
          if (res.district) {
            setValue('district', res.district, { shouldValidate: true });
            setCustomDistrictMode(false);
          }
          if (res.state) setValue('state', res.state, { shouldValidate: true });
          if (res.country) setValue('country', res.country, { shouldValidate: true });
          if (res.localBody) setValue('localBody', res.localBody, { shouldValidate: true });

          const fullLocationText = [
            res.localBody,
            res.district,
            res.state || 'Kerala',
            res.country || 'India'
          ].filter(Boolean).join(', ');

          setPinAutoMsg(`✓ Auto-filled for PIN ${cleanPin}: ${fullLocationText}`);
        }
      }).catch(() => {
        if (isSubscribed) setIsFetchingPin(false);
      });

      return () => { isSubscribed = false; };
    } else {
      setPinAutoMsg('');
    }
  }, [watchPostalCode, setValue]);

  // Handle District Dropdown Selection
  const handleDistrictSelectChange = (e) => {
    const val = e.target.value;
    if (val === 'CUSTOM_OTHER') {
      setCustomDistrictMode(true);
      setValue('district', '', { shouldValidate: true });
    } else {
      setCustomDistrictMode(false);
      setValue('district', val, { shouldValidate: true });
      const defaults = locationService.getDefaultsForDistrict(val);
      if (defaults.state) setValue('state', defaults.state, { shouldValidate: true });
      if (defaults.country) setValue('country', defaults.country, { shouldValidate: true });
    }
  };

  const handleSelectRole = (roleKey) => {
    setSelectedRole(roleKey);
    setValue('role', roleKey);
  };

  const onSubmit = async (data) => {
    setToast({ type: '', message: '' });
    setIdProofError('');
    setBuyerVerificationError('');

    // Contractor specific validation
    if (selectedRole === 'contractor') {
      if (!idProofFile) {
        setIdProofError('Government identity document upload is required for verification.');
        return;
      }
    }

    try {
      const getIdProofDocObj = () => {
        if (selectedRole === 'buyer' && buyerIdProofFile) return buyerIdProofFile;
        if (selectedRole === 'landowner' && landownerIdProofFile) return landownerIdProofFile;
        if (idProofFile) return idProofFile;
        return null;
      };

      const idProofObj = getIdProofDocObj();

      const getDocName = (doc) => {
        if (!doc) return '';
        return typeof doc === 'string' ? doc : (doc.name || '');
      };

      const getDocUrl = (doc) => {
        if (!doc) return '';
        if (typeof doc === 'string') return doc.startsWith('http') || doc.startsWith('data:') ? doc : '';
        return doc.dataUrl || doc.previewUrl || '';
      };

      const payload = {
        ...data,
        businessType: data.buyerType || data.businessType || 'Sawmill',
        contactPerson: data.contactPerson || data.fullName,
        idProofDocument: getDocName(idProofObj),
        idProofUrl: getDocUrl(idProofObj),
        supportingDocument: getDocName(supportingFile),
        supportingUrl: getDocUrl(supportingFile),
        forestLicenceDoc: getDocName(buyerForestLicenceFile),
        forestLicenceUrl: getDocUrl(buyerForestLicenceFile),
        tradeLicenceDoc: getDocName(buyerTradeLicenceFile),
        tradeLicenceUrl: getDocUrl(buyerTradeLicenceFile),
        gstDoc: getDocName(buyerGstFile),
        gstUrl: getDocUrl(buyerGstFile),
        businessCertDoc: getDocName(buyerBusinessCertFile),
        businessCertUrl: getDocUrl(buyerBusinessCertFile),
        landTaxInvoiceDoc: getDocName(landTaxInvoiceFile),
        landTaxInvoiceUrl: getDocUrl(landTaxInvoiceFile)
      };

      await registerAuth(payload);
      setShowSuccessModal(true);
    } catch (err) {
      setToast({
        type: 'error',
        message: err.message || 'Registration failed. Please check your details.'
      });
    }
  };

  return (
    <div className="page-wrapper min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      {isSubmitting && <Loader message="Creating your TreeConnect account..." />}

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        role={selectedRole}
      />

      <main className="flex-grow py-10 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/40 via-slate-950 to-slate-950">
        <div className="w-full max-w-[1300px] mx-auto flex flex-col items-center justify-center">
          {/* Header Banner */}
          <div className="text-center mb-8 max-w-3xl mx-auto flex flex-col items-center justify-center">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-xs tracking-widest uppercase mb-3 border border-emerald-500/20 shadow-sm backdrop-blur-sm">
              <Trees size={16} className="text-emerald-400" />
              <span>TreeConnect Enterprise</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight text-center">
              Create Your Account
            </h1>
            <p className="mt-2 text-slate-400 text-sm sm:text-base max-w-xl mx-auto font-normal leading-relaxed text-center">
              Join the sustainable timber network connecting landowners, harvesting contractors, and commercial buyers.
            </p>
          </div>

          {toast.message && (
            <div className="w-full max-w-2xl mx-auto mb-6">
              <Toast
                type={toast.type}
                message={toast.message}
                onClose={() => setToast({ type: '', message: '' })}
              />
            </div>
          )}

          {/* ==================================================== */}
          {/* STEP 1: ROLE SELECTION CARDS                         */}
          {/* ==================================================== */}
          {!selectedRole ? (
            <div className="w-full animate-fade-in flex flex-col items-center justify-center">
              <div className="role-card-grid w-full">
                {/* 🌳 Landowner Card */}
                <div
                  onClick={() => handleSelectRole('landowner')}
                  className="role-card-item group mx-auto cursor-pointer"
                >
                  <div className="role-card-header flex flex-col items-center text-center">
                    <div className="role-card-icon-box">🌳</div>
                    <h3 className="role-card-title">Landowner</h3>
                    <p className="role-card-subtitle">Forest Estate & Property Owners</p>

                    <div className="role-card-bullet-list">
                      <div className="role-card-bullet-item">
                        <span className="role-card-bullet-dot">•</span>
                        <span>Register properties</span>
                      </div>
                      <div className="role-card-bullet-item">
                        <span className="role-card-bullet-dot">•</span>
                        <span>Maintain tree inventory</span>
                      </div>
                      <div className="role-card-bullet-item">
                        <span className="role-card-bullet-dot">•</span>
                        <span>Request harvesting services</span>
                      </div>
                      <div className="role-card-bullet-item">
                        <span className="role-card-bullet-dot">•</span>
                        <span>Sell harvested timber</span>
                      </div>
                    </div>
                  </div>

                  <button type="button" className="role-card-btn">
                    <span>Register as Landowner</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                {/* 🪓 Contractor Card */}
                <div
                  onClick={() => handleSelectRole('contractor')}
                  className="role-card-item group mx-auto cursor-pointer"
                >
                  <div className="role-card-header flex flex-col items-center text-center">
                    <div className="role-card-icon-box">🪓</div>
                    <h3 className="role-card-title">Contractor</h3>
                    <p className="role-card-subtitle">Tree Cutting & Harvesting Contractors (Kerala)</p>

                    <div className="role-card-bullet-list">
                      <div className="role-card-bullet-item">
                        <span className="role-card-bullet-dot">•</span>
                        <span>Receive harvesting requests</span>
                      </div>
                      <div className="role-card-bullet-item">
                        <span className="role-card-bullet-dot">•</span>
                        <span>Inspect estate & residential sites</span>
                      </div>
                      <div className="role-card-bullet-item">
                        <span className="role-card-bullet-dot">•</span>
                        <span>Submit quotations</span>
                      </div>
                      <div className="role-card-bullet-item">
                        <span className="role-card-bullet-dot">•</span>
                        <span>Perform tree cutting & harvesting</span>
                      </div>
                      <div className="role-card-bullet-item">
                        <span className="role-card-bullet-dot">•</span>
                        <span>Simple identity verification</span>
                      </div>
                    </div>
                  </div>

                  <button type="button" className="role-card-btn">
                    <span>Register as Contractor</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                {/* 🪵 Buyer Card */}
                <div
                  onClick={() => handleSelectRole('buyer')}
                  className="role-card-item group mx-auto cursor-pointer"
                >
                  <div className="role-card-header flex flex-col items-center text-center">
                    <div className="role-card-icon-box">🪵</div>
                    <h3 className="role-card-title">Buyer</h3>
                    <p className="role-card-subtitle">Timber Merchants & Manufacturers</p>

                    <div className="role-card-bullet-list">
                      <div className="role-card-bullet-item">
                        <span className="role-card-bullet-dot">•</span>
                        <span>Browse timber listings</span>
                      </div>
                      <div className="role-card-bullet-item">
                        <span className="role-card-bullet-dot">•</span>
                        <span>Compare prices</span>
                      </div>
                      <div className="role-card-bullet-item">
                        <span className="role-card-bullet-dot">•</span>
                        <span>Purchase timber</span>
                      </div>
                      <div className="role-card-bullet-item">
                        <span className="role-card-bullet-dot">•</span>
                        <span>Track orders</span>
                      </div>
                    </div>
                  </div>

                  <button type="button" className="role-card-btn">
                    <span>Register as Buyer</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Bottom Section Link */}
              <div className="mt-10 text-center text-sm font-medium text-slate-400">
                Already registered?{' '}
                <Link to="/login" className="font-bold text-emerald-400 hover:text-emerald-300 underline transition-colors">
                  Sign In
                </Link>
              </div>
            </div>
          ) : (
            /* ==================================================== */
            /* STEP 2: REGISTRATION FORM CARD                       */
            /* ==================================================== */
            <div className="w-full max-w-4xl mx-auto bg-slate-900/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl animate-scale-up mb-8 flex flex-col items-center">
              {/* Back & Role Switch Header */}
              <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-8">
                <button
                  type="button"
                  onClick={() => setSelectedRole(null)}
                  className="inline-flex items-center gap-2 text-sm font-bold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                >
                  <ArrowLeft size={18} />
                  <span>Change Role</span>
                </button>

                <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-xs font-bold text-emerald-300">
                  {selectedRole === 'landowner' && <Trees size={16} />}
                  {selectedRole === 'contractor' && <Truck size={16} />}
                  {selectedRole === 'buyer' && <ShoppingBag size={16} />}
                  <span className="uppercase tracking-wider">
                    {selectedRole === 'contractor' ? 'Kerala Harvesting Contractor' : selectedRole} Account Registration
                  </span>
                </div>
              </div>

              {/* Global Verification & Admin Approval Notice Banner */}
              <div className="w-full mb-8 p-4 rounded-2xl bg-amber-950/50 border border-amber-800/60 flex items-center justify-center gap-3 text-amber-200 text-xs sm:text-sm text-center">
                <ShieldCheck size={20} className="text-amber-400 flex-shrink-0" />
                <div>
                  <span className="font-bold block text-amber-300">Administrator Approval Required</span>
                  <span>All new user accounts are reviewed by the TreeConnect administrator. You will be able to log in once your account is approved.</span>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} method="post" action="#" className="w-full space-y-6">
                {/* SUB-CONTAINER ①: ACCOUNT INFORMATION */}
                <div className="form-section-subcard w-full">
                  <h3 className="text-sm font-bold text-white flex items-center justify-center gap-2 mb-4 text-emerald-400 border-b border-slate-800/80 pb-2 text-center">
                    <User size={18} />
                    <span>① Account Information</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div className="sm:col-span-2">
                      <label htmlFor="fullName" className="block text-xs font-semibold text-slate-300 mb-2">
                        {selectedRole === 'landowner' && 'Full Name / Property Owner Name *'}
                        {selectedRole === 'contractor' && 'Full Name / Contractor Name *'}
                        {selectedRole === 'buyer' && 'Buyer Name / Business Name *'}
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" size={18} />
                        <input
                          id="fullName"
                          name="fullName"
                          type="text"
                          autoComplete="name"
                          placeholder={
                            selectedRole === 'contractor'
                              ? 'e.g. Kozhikode Timber Harvesters / Ramesh K.'
                              : selectedRole === 'buyer'
                                ? 'e.g. Pacific Lumber Mills Inc.'
                                : 'e.g. Robert Pine / Green Valley Estate'
                          }
                          className={`w-full form-input-56 ${errors.fullName ? 'form-input-error' : ''}`}
                          {...register('fullName')}
                        />
                      </div>
                      {errors.fullName && <p className="text-xs text-red-400 font-medium mt-1.5">{errors.fullName.message}</p>}
                    </div>

                    {/* Contact Person (Buyer Only) */}
                    {selectedRole === 'buyer' && (
                      <div className="sm:col-span-2">
                        <label htmlFor="contactPerson" className="block text-xs font-semibold text-slate-300 mb-2">
                          Contact Person Name *
                        </label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" size={18} />
                          <input
                            id="contactPerson"
                            name="contactPerson"
                            type="text"
                            autoComplete="name"
                            placeholder="e.g. Eleanor Vance (Procurement Manager)"
                            className={`w-full form-input-56 ${errors.contactPerson ? 'form-input-error' : ''}`}
                            {...register('contactPerson')}
                          />
                        </div>
                        {errors.contactPerson && <p className="text-xs text-red-400 font-medium mt-1.5">{errors.contactPerson.message}</p>}
                      </div>
                    )}

                    {/* Email */}
                    <div>
                      <label htmlFor="email" className="block text-xs font-semibold text-slate-300 mb-2">
                        Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" size={18} />
                        <input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email username"
                          placeholder="name@company.com"
                          className={`w-full form-input-56 ${errors.email ? 'form-input-error' : ''}`}
                          {...register('email')}
                        />
                      </div>
                      {errors.email && <p className="text-xs text-red-400 font-medium mt-1.5">{errors.email.message}</p>}
                    </div>

                    {/* Phone */}
                    <div>
                      <label htmlFor="phone" className="block text-xs font-semibold text-slate-300 mb-2">
                        Mobile Number *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" size={18} />
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          autoComplete="tel"
                          maxLength={10}
                          placeholder="e.g. 9876543210"
                          className={`w-full form-input-56 ${errors.phone ? 'form-input-error' : ''}`}
                          {...register('phone')}
                        />
                      </div>
                      {errors.phone ? (
                        <p className="text-xs text-red-400 font-medium mt-1.5">{errors.phone.message}</p>
                      ) : (
                        <p className="text-[11px] text-slate-500 font-normal mt-1">
                          Must be 10 digits starting with 6-9.
                        </p>
                      )}
                    </div>

                    {/* Password */}
                    <div>
                      <label htmlFor="password" className="block text-xs font-semibold text-slate-300 mb-2">
                        Password *
                      </label>
                      <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" size={18} />
                        <input
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          placeholder="At least 6 characters"
                          className={`w-full form-input-56 form-input-56-pass ${errors.password ? 'form-input-error' : ''}`}
                          {...register('password')}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer z-10"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      <PasswordStrengthMeter password={watchPassword} />
                      {errors.password && <p className="text-xs text-red-400 font-medium mt-1.5">{errors.password.message}</p>}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-300 mb-2">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" size={18} />
                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          placeholder="Re-enter password"
                          className={`w-full form-input-56 form-input-56-pass ${errors.confirmPassword ? 'form-input-error' : ''}`}
                          {...register('confirmPassword')}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer z-10"
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-xs text-red-400 font-medium mt-1.5">{errors.confirmPassword.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* ==================================================== */}
                {/* BUYER BUSINESS CLASSIFICATION & DYNAMIC VERIFICATION */}
                {/* ==================================================== */}
                {selectedRole === 'buyer' && (
                  <div className="form-section-subcard w-full bg-slate-900/90 rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-xl space-y-8">
                    {/* Section Header */}
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                      <h3 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2.5 text-emerald-400">
                        <Briefcase size={22} className="text-emerald-400" />
                        <span>Business & Verification Profile</span>
                      </h3>
                      <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                        Buyer Verification
                      </span>
                    </div>

                    {/* FIELD 1: What type of buyer are you? */}
                    <div>
                      <label htmlFor="buyerType" className="block text-sm sm:text-base font-bold text-slate-100 mb-2">
                        What type of buyer are you? <span className="text-emerald-400">*</span>
                      </label>
                      <select
                        id="buyerType"
                        className={`w-full form-input-56 cursor-pointer bg-slate-950 text-white font-semibold text-sm sm:text-base border-slate-700 focus:border-emerald-500 shadow-sm ${errors.buyerType ? 'form-input-error' : ''}`}
                        {...register('buyerType')}
                        onChange={(e) => {
                          setValue('buyerType', e.target.value, { shouldValidate: true });
                          setValue('businessType', e.target.value, { shouldValidate: true });
                        }}
                      >
                        <option value="Sawmill" className="bg-slate-900 text-white font-medium">Sawmill</option>
                        <option value="Timber Depot" className="bg-slate-900 text-white font-medium">Timber Depot</option>
                        <option value="Wood Processing Unit" className="bg-slate-900 text-white font-medium">Wood Processing Unit</option>
                        <option value="Furniture/Manufacturing Business" className="bg-slate-900 text-white font-medium">Furniture/Manufacturing Business</option>
                        <option value="Timber Trader" className="bg-slate-900 text-white font-medium">Timber Trader</option>
                        <option value="Other" className="bg-slate-900 text-white font-medium">Other</option>
                      </select>
                      <p className="text-xs text-slate-400 mt-2">
                        Select your business category to dynamically see the required verification documents.
                      </p>
                      {errors.buyerType && (
                        <p className="text-xs text-red-400 font-semibold mt-1">{errors.buyerType.message}</p>
                      )}
                    </div>

                    {/* Kerala Forest Dept Notice for Sawmills & Wood Processing Units */}
                    {['Sawmill', 'Wood Processing Unit', 'Timber Depot'].includes(watchBuyerType) && (
                      <div className="rounded-2xl bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-950 border border-emerald-500/30 p-5 sm:p-6 shadow-lg space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                            <Trees size={22} />
                          </div>
                          <div>
                            <h4 className="text-sm sm:text-base font-bold text-white">Kerala Forest Department Licensing Requirements</h4>
                            <p className="text-xs text-emerald-400 font-semibold">Sawmill & Wood-Based Industry Compliance</p>
                          </div>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed pt-1">
                          Under Kerala Forest Department rules, operating sawmills, timber storage depots, and wood-based processing units requires valid licensing, inspection compliance, and periodic renewal. Please upload your applicable licence for verified buyer badge status.
                        </p>
                      </div>
                    )}

                    {/* DYNAMIC VERIFICATION DOCUMENT UPLOADS BASED ON BUYER TYPE */}
                    <div className="pt-6 border-t border-slate-800/80 space-y-8">
                      <h4 className="text-base font-bold text-white flex items-center gap-2 text-emerald-400">
                        <FileText size={20} />
                        <span>Dynamic Verification Documents for {watchBuyerType}</span>
                      </h4>

                      {/* 1. Forest Department Licence (For Sawmill, Wood Processing Unit, Timber Depot) */}
                      {['Sawmill', 'Wood Processing Unit', 'Timber Depot'].includes(watchBuyerType) && (
                        <FileUploadCard
                          id="buyer-forest-licence"
                          label={`1. Applicable Forest Department Licence (${watchBuyerType})`}
                          isRequired={true}
                          helperText="Upload your Kerala Forest Department Licence or Wood-Based Industry License / Storage Permit."
                          examples={[
                            'Kerala Forest Dept Sawmill Licence',
                            'Wood-Based Industry Operating License',
                            'Forest Dept Timber Depot Permit / Renewal Receipt'
                          ]}
                          acceptedFormatsText="PDF, JPG, PNG"
                          acceptedMimeTypes="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png"
                          maxSizeMB={10}
                          fileData={buyerForestLicenceFile}
                          onFileChange={(file) => setBuyerForestLicenceFile(file)}
                        />
                      )}

                      {/* 2. Trade Licence / Business Registration (For Sawmill, Wood Processing, Depot, Furniture, Trader) */}
                      {['Sawmill', 'Wood Processing Unit', 'Timber Depot', 'Furniture/Manufacturing Business', 'Timber Trader'].includes(watchBuyerType) && (
                        <FileUploadCard
                          id="buyer-trade-licence"
                          label="Local-Body Trade / Business Licence"
                          isRequired={watchBuyerType !== 'Other'}
                          helperText="Upload your Gram Panchayat, Municipality, or Corporation Trade / Business Licence."
                          examples={[
                            'Local Body Trade Licence',
                            'Gram Panchayat Business Permit',
                            'Municipal Corporation D&O Licence'
                          ]}
                          acceptedFormatsText="PDF, JPG, PNG"
                          acceptedMimeTypes="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png"
                          maxSizeMB={10}
                          fileData={buyerTradeLicenceFile}
                          onFileChange={(file) => setBuyerTradeLicenceFile(file)}
                        />
                      )}

                      {/* 3. MSME / Business Cert (For Furniture/Manufacturing or Other) */}
                      {['Furniture/Manufacturing Business', 'Other'].includes(watchBuyerType) && (
                        <FileUploadCard
                          id="buyer-business-cert"
                          label="Business Registration / MSME Certificate"
                          isRequired={watchBuyerType === 'Furniture/Manufacturing Business'}
                          helperText="Upload Udyam MSME Certificate, Factory Registration, or Partnership / Business Certificate."
                          examples={[
                            'Udyam MSME Registration Certificate',
                            'Factories & Boilers Registration',
                            'Partnership Deed / Certificate of Incorporation'
                          ]}
                          acceptedFormatsText="PDF, JPG, PNG"
                          acceptedMimeTypes="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png"
                          maxSizeMB={10}
                          fileData={buyerBusinessCertFile}
                          onFileChange={(file) => setBuyerBusinessCertFile(file)}
                        />
                      )}

                      {/* 4. GST Registration Certificate (Optional / Applicable for all) */}
                      <FileUploadCard
                        id="buyer-gst-doc"
                        label="GST Registration Certificate (Where applicable)"
                        isRequired={false}
                        helperText="Optional: Upload your GST Registration (REG-06) Certificate if registered."
                        examples={['GST REG-06 Certificate', 'GST Tax Registration Copy']}
                        acceptedFormatsText="PDF, JPG, PNG"
                        acceptedMimeTypes="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png"
                        maxSizeMB={10}
                        fileData={buyerGstFile}
                        onFileChange={(file) => setBuyerGstFile(file)}
                      />

                      {/* 5. Government-Issued ID Proof */}
                      <FileUploadCard
                        id="buyer-id-proof"
                        label="Government-Issued Identity / Business Identification"
                        isRequired={true}
                        helperText="Upload a valid government identity document of the authorized business owner / contact person."
                        docTypes={['Aadhaar Card', 'PAN Card', 'Driving Licence', 'Passport', 'Voter ID']}
                        selectedDocType={watchIdProofType}
                        onDocTypeChange={(val) => setValue('idProofType', val, { shouldValidate: true })}
                        acceptedFormatsText="PDF, JPG, PNG"
                        acceptedMimeTypes="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png"
                        maxSizeMB={5}
                        fileData={buyerIdProofFile}
                        onFileChange={(file) => setBuyerIdProofFile(file)}
                      />
                    </div>

                    {/* DECLARATION (Required Checkbox for Buyer) */}
                    <div className="pt-8 border-t border-slate-800/80">
                      <div className="p-5 sm:p-6 rounded-xl bg-slate-950 border border-slate-800 shadow-sm">
                        <label className="flex items-start gap-3.5 cursor-pointer group">
                          <input
                            type="checkbox"
                            className="mt-1 w-4.5 h-4.5 text-emerald-600 rounded focus:ring-emerald-500 border-slate-700 bg-slate-900 cursor-pointer flex-shrink-0"
                            {...register('declarationAccepted')}
                          />
                          <span className="text-sm sm:text-base text-slate-200 group-hover:text-white font-medium transition-colors leading-relaxed">
                            <strong className="text-emerald-400 font-bold">Declaration:</strong> I certify that all business details and uploaded licences/certificates are genuine and valid. <span className="text-emerald-400 font-bold">*</span>
                          </span>
                        </label>
                        {errors.declarationAccepted && (
                          <p className="text-sm text-red-400 font-semibold mt-2.5 pl-8">{errors.declarationAccepted.message}</p>
                        )}
                      </div>
                    </div>

                    {/* VERIFICATION NOTICE CARD FOR BUYERS */}
                    <div className="pt-6 border-t border-slate-800/80">
                      <div className="rounded-2xl bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-950 border border-emerald-500/40 p-6 sm:p-7 shadow-xl">
                        <div className="flex items-center gap-3.5 mb-4 border-b border-emerald-500/20 pb-4">
                          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
                            <ShieldCheck size={26} />
                          </div>
                          <div>
                            <h4 className="text-base sm:text-lg font-bold text-white">Administrator Business Verification</h4>
                            <p className="text-sm text-emerald-400 font-semibold mt-0.5">TreeConnect Buyer Verification</p>
                          </div>
                        </div>

                        <p className="text-sm sm:text-base text-slate-200 font-medium leading-relaxed mb-4">
                          Uploaded business licences and identity proofs will be reviewed by the TreeConnect administrator to issue your <span className="font-bold text-emerald-400">"Verified Buyer"</span> status badge.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ==================================================== */}
                {/* LANDOWNER PROPERTY & LAND TAX VERIFICATION SECTION  */}
                {/* ==================================================== */}
                {selectedRole === 'landowner' && (
                  <div className="form-section-subcard w-full bg-slate-900/90 rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-xl space-y-8">
                    {/* Section Header */}
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                      <h3 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2.5 text-emerald-400">
                        <Trees size={22} className="text-emerald-400" />
                        <span>Property Ownership &amp; Identity Verification</span>
                      </h3>
                      <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                        Landowner Verification
                      </span>
                    </div>

                    {/* Government-Issued Identity / Business Identification */}
                    <div>
                      <FileUploadCard
                        id="landowner-id-proof"
                        label="Government-Issued Identity / Business Identification"
                        isRequired={false}
                        helperText="Upload a valid government identity document of the property owner (Aadhaar Card, PAN Card, Passport, etc.)."
                        docTypes={['Aadhaar Card', 'PAN Card', 'Driving Licence', 'Passport', 'Voter ID']}
                        selectedDocType={watchIdProofType}
                        onDocTypeChange={(val) => setValue('idProofType', val, { shouldValidate: true })}
                        acceptedFormatsText="PDF, JPG, PNG"
                        acceptedMimeTypes="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png"
                        maxSizeMB={5}
                        fileData={landownerIdProofFile}
                        onFileChange={(file) => setLandownerIdProofFile(file)}
                      />
                    </div>

                    {/* Land Tax Document Upload Card */}
                    <div className="pt-6 border-t border-slate-800/80">
                      <FileUploadCard
                        id="landowner-land-tax-doc"
                        label="Land Tax Invoice / Property Tax Payment Document"
                        isRequired={false}
                        helperText="Upload your latest Land Tax Payment Receipt, Land Revenue Invoice, or Possession Certificate (PDF, JPG, PNG)."
                        examples={[
                          'Kerala Revenue Land Tax Payment Receipt',
                          'Annual Property Tax Invoice',
                          'Village Office Tax Receipt / Possession Certificate'
                        ]}
                        acceptedFormatsText="PDF, JPG, PNG"
                        acceptedMimeTypes="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png"
                        maxSizeMB={10}
                        fileData={landTaxInvoiceFile}
                        onFileChange={(file) => setLandTaxInvoiceFile(file)}
                      />
                    </div>
                  </div>
                )}

                {/* ==================================================== */}
                {/* CONTRACTOR PROFESSIONAL INFORMATION SECTION           */}
                {/* ==================================================== */}
                {selectedRole === 'contractor' && (
                  <div className="form-section-subcard w-full bg-slate-900/90 rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-xl">
                    {/* Main Section Header */}
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-8">
                      <h3 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2.5 text-emerald-400">
                        <Award size={24} className="text-emerald-400" />
                        <span>Professional Information</span>
                      </h3>
                      <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                        Kerala Harvesting Contractor
                      </span>
                    </div>

                    <div className="space-y-10 sm:space-y-12">
                      {/* FIELD 1: Years of Experience (Required) */}
                      <div>
                        <label className="block text-base sm:text-lg font-bold text-slate-100 mb-3.5">
                          1. Years of Experience <span className="text-emerald-400">*</span>
                        </label>
                        <select
                          className={`w-full form-input-56 cursor-pointer bg-slate-950 text-white font-semibold text-sm sm:text-base border-slate-700 focus:border-emerald-500 shadow-sm ${errors.yearsOfExperience ? 'form-input-error' : ''
                            }`}
                          {...register('yearsOfExperience')}
                        >
                          <option value="" className="bg-slate-900 text-slate-400">-- Select Years of Experience --</option>
                          <option value="Less than 1 Year" className="bg-slate-900 text-white font-medium">Less than 1 Year</option>
                          <option value="1–3 Years" className="bg-slate-900 text-white font-medium">1–3 Years</option>
                          <option value="4–7 Years" className="bg-slate-900 text-white font-medium">4–7 Years</option>
                          <option value="8–15 Years" className="bg-slate-900 text-white font-medium">8–15 Years</option>
                          <option value="More than 15 Years" className="bg-slate-900 text-white font-medium">More than 15 Years</option>
                        </select>
                        <p className="text-sm text-slate-300 font-medium mt-3 leading-relaxed">
                          Select your approximate experience in tree harvesting or forestry-related work.
                        </p>
                        {errors.yearsOfExperience && (
                          <p className="text-sm text-red-400 font-semibold mt-2">{errors.yearsOfExperience.message}</p>
                        )}
                      </div>

                      {/* FIELD 2: Government-Issued Identity / Business Identification (Required) */}
                      <div className="pt-8 border-t border-slate-800/80">
                        <FileUploadCard
                          id="govt-identity-proof"
                          label="2. Government-Issued Identity / Business Identification"
                          isRequired={true}
                          helperText="Upload a valid government-issued identity document for verification."
                          docTypes={['Aadhaar Card', 'PAN Card', 'Driving Licence', 'Passport', 'Voter ID']}
                          selectedDocType={watchIdProofType}
                          onDocTypeChange={(val) => setValue('idProofType', val, { shouldValidate: true })}
                          acceptedFormatsText="PDF, JPG, PNG"
                          acceptedMimeTypes="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png"
                          maxSizeMB={5}
                          fileData={idProofFile}
                          onFileChange={(file) => {
                            setIdProofFile(file);
                            if (file) setIdProofError('');
                          }}
                          error={idProofError || errors.idProofType?.message}
                        />
                      </div>

                      {/* FIELD 3: Supporting Verification Document (Optional) */}
                      <div className="pt-8 border-t border-slate-800/80">
                        <FileUploadCard
                          id="supporting-verification-doc"
                          label="3. Supporting Verification Document"
                          isRequired={false}
                          helperText="This document helps the administrator verify your experience. It is optional but recommended."
                          examples={[
                            'Previous harvesting work photos',
                            'Equipment photos',
                            'Recommendation letter',
                            'Work completion certificate',
                            'Any document showing harvesting experience'
                          ]}
                          acceptedFormatsText="PDF, JPG, PNG"
                          acceptedMimeTypes="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png"
                          maxSizeMB={10}
                          fileData={supportingFile}
                          onFileChange={(file) => {
                            setSupportingFile(file);
                            if (file) setSupportingError('');
                          }}
                          error={supportingError}
                        />
                      </div>

                      {/* DECLARATION (Required Checkbox) */}
                      <div className="pt-8 border-t border-slate-800/80">
                        <div className="p-5 sm:p-6 rounded-xl bg-slate-950 border border-slate-800 shadow-sm">
                          <label className="flex items-start gap-3.5 cursor-pointer group">
                            <input
                              type="checkbox"
                              className="mt-1 w-4.5 h-4.5 text-emerald-600 rounded focus:ring-emerald-500 border-slate-700 bg-slate-900 cursor-pointer flex-shrink-0"
                              {...register('declarationAccepted')}
                            />
                            <span className="text-sm sm:text-base text-slate-200 group-hover:text-white font-medium transition-colors leading-relaxed">
                              <strong className="text-emerald-400 font-bold">Declaration:</strong> I certify that all information and uploaded documents are genuine and belong to me. <span className="text-emerald-400 font-bold">*</span>
                            </span>
                          </label>
                          {errors.declarationAccepted && (
                            <p className="text-sm text-red-400 font-semibold mt-2.5 pl-8">{errors.declarationAccepted.message}</p>
                          )}
                        </div>
                      </div>

                      {/* VERIFICATION NOTICE CARD */}
                      <div className="pt-8 border-t border-slate-800/80">
                        <div className="rounded-2xl bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-950 border border-emerald-500/40 p-6 sm:p-7 shadow-xl">
                          <div className="flex items-center gap-3.5 mb-5 border-b border-emerald-500/20 pb-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
                              <ShieldCheck size={26} />
                            </div>
                            <div>
                              <h4 className="text-base sm:text-lg font-bold text-white">Administrator Verification Required</h4>
                              <p className="text-sm text-emerald-400 font-semibold mt-0.5">TreeConnect Contractor Account Status</p>
                            </div>
                          </div>

                          <p className="text-sm sm:text-base text-slate-200 font-medium leading-relaxed mb-5">
                            Your contractor account will remain in <span className="font-bold text-amber-300 bg-amber-950/80 px-2.5 py-1 rounded border border-amber-700/60 text-sm">"Pending Verification"</span> until the uploaded documents are reviewed by the TreeConnect administrator.
                          </p>

                          <div className="bg-slate-950 rounded-xl p-5 sm:p-6 border border-slate-800">
                            <p className="text-sm sm:text-base font-bold text-emerald-400 mb-3.5">
                              Only verified contractors can:
                            </p>
                            <ul className="space-y-3 text-sm sm:text-base text-slate-200 font-medium">
                              <li className="flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                                <span>Sign in to the platform</span>
                              </li>
                              <li className="flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                                <span>Receive harvesting requests</span>
                              </li>
                              <li className="flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                                <span>Submit quotations</span>
                              </li>
                              <li className="flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                                <span>Participate in harvesting projects</span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SUB-CONTAINER ③: ADDRESS & LOCATION INFORMATION */}
                <div className="form-section-subcard w-full">
                  <h3 className="text-sm font-bold text-white flex items-center justify-center gap-2 mb-4 text-emerald-400 border-b border-slate-800/80 pb-2 text-center">
                    <MapPin size={18} />
                    <span>
                      {selectedRole === 'landowner' && '② Property / Estate Location'}
                      {selectedRole === 'contractor' && '③ Primary Operating Address'}
                      {selectedRole === 'buyer' && '③ Business Address'}
                    </span>
                  </h3>

                  <div className="space-y-4">
                    {/* Full Width Address */}
                    <div>
                      <label htmlFor="address" className="block text-xs font-semibold text-slate-300 mb-2">
                        Address *
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" size={18} />
                        <input
                          id="address"
                          name="address"
                          type="text"
                          autoComplete="street-address"
                          placeholder="Street Address or Post Office Box"
                          className={`w-full form-input-56 ${errors.address ? 'form-input-error' : ''}`}
                          {...register('address')}
                        />
                      </div>
                      {errors.address && <p className="text-xs text-red-400 font-medium mt-1.5">{errors.address.message}</p>}
                    </div>

                    {/* Panchayat / Local Body Field */}
                    <div>
                      <label htmlFor="localBody" className="block text-xs font-semibold text-slate-300 mb-2">
                        Panchayat / Local Body <span className="text-slate-500 font-normal">(Gram Panchayat / Municipality)</span>
                      </label>
                      <div className="relative">
                        <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" size={18} />
                        <input
                          id="localBody"
                          name="localBody"
                          type="text"
                          placeholder="e.g. Ayarkunnam Panchayat / Pala Municipality"
                          className="w-full form-input-56"
                          {...register('localBody')}
                        />
                      </div>
                    </div>

                    {/* Grouped Location Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* District Field with Smart Selector & Validation */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label htmlFor="district" className="block text-xs font-semibold text-slate-300">
                            District / County *
                          </label>
                          <button
                            type="button"
                            onClick={() => setCustomDistrictMode(!customDistrictMode)}
                            className="text-[11px] font-bold text-emerald-400 hover:underline cursor-pointer"
                          >
                            {customDistrictMode ? 'Select from List' : '+ Type Custom'}
                          </button>
                        </div>

                        {!customDistrictMode ? (
                          <div className="relative">
                            <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" size={18} />
                            <select
                              id="district"
                              name="district"
                              autoComplete="address-level2"
                              value={watchDistrict || ''}
                              onChange={handleDistrictSelectChange}
                              className={`w-full form-input-56 cursor-pointer bg-slate-950 text-white font-medium border-slate-700 focus:border-emerald-500 ${errors.district ? 'form-input-error' : ''}`}
                            >
                              <option value="" disabled className="bg-slate-900 text-slate-400">-- Select Kerala / Indian District --</option>
                              <optgroup label="Kerala Districts (Primary)">
                                {KERALA_DISTRICTS.map((d) => (
                                  <option key={d} value={d} className="bg-slate-900 text-white">
                                    {d}
                                  </option>
                                ))}
                              </optgroup>
                              <optgroup label="Other Indian Districts">
                                {OTHER_MAJOR_DISTRICTS.map((d) => (
                                  <option key={d} value={d} className="bg-slate-900 text-white">
                                    {d}
                                  </option>
                                ))}
                              </optgroup>
                              <option value="CUSTOM_OTHER" className="bg-slate-900 text-emerald-400 font-bold">
                                + Other / Enter Manually...
                              </option>
                            </select>
                          </div>
                        ) : (
                          <div className="relative">
                            <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" size={18} />
                            <input
                              id="district"
                              name="district"
                              type="text"
                              autoComplete="address-level2"
                              placeholder="Type District Name (e.g. Kozhikode)"
                              className={`w-full form-input-56 ${errors.district ? 'form-input-error' : ''}`}
                              {...register('district')}
                            />
                          </div>
                        )}
                        {errors.district && (
                          <p className="text-xs text-red-400 font-semibold mt-1.5 leading-snug">{errors.district.message}</p>
                        )}
                      </div>

                      {/* State Field */}
                      <div>
                        <label htmlFor="state" className="block text-xs font-semibold text-slate-300 mb-2">
                          State / Province *
                        </label>
                        <div className="relative">
                          <Compass className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" size={18} />
                          <input
                            id="state"
                            name="state"
                            type="text"
                            autoComplete="address-level1"
                            placeholder="State"
                            className={`w-full form-input-56 ${errors.state ? 'form-input-error' : ''}`}
                            {...register('state')}
                          />
                        </div>
                        {errors.state && <p className="text-xs text-red-400 font-medium mt-1.5">{errors.state.message}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Country Field */}
                      <div>
                        <label htmlFor="country" className="block text-xs font-semibold text-slate-300 mb-2">
                          Country *
                        </label>
                        <div className="relative">
                          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" size={18} />
                          <input
                            id="country"
                            name="country"
                            type="text"
                            autoComplete="country-name"
                            placeholder="Country"
                            className={`w-full form-input-56 ${errors.country ? 'form-input-error' : ''}`}
                            {...register('country')}
                          />
                        </div>
                        {errors.country && <p className="text-xs text-red-400 font-medium mt-1.5">{errors.country.message}</p>}
                      </div>

                      {/* Postal Code Field with Live PIN Auto-Fetch */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label htmlFor="postalCode" className="block text-xs font-semibold text-slate-300">
                            PIN / Postal Code *
                          </label>
                          {isFetchingPin && (
                            <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                              <Loader2 size={13} className="animate-spin text-emerald-400" />
                              Fetching location...
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" size={18} />
                          <input
                            id="postalCode"
                            name="postalCode"
                            type="text"
                            autoComplete="postal-code"
                            maxLength={6}
                            placeholder="Enter 6-digit PIN Code (e.g. 673001)"
                            className={`w-full form-input-56 ${errors.postalCode ? 'form-input-error' : ''}`}
                            {...register('postalCode')}
                          />
                        </div>
                        {errors.postalCode ? (
                          <p className="text-xs text-red-400 font-medium mt-1.5">{errors.postalCode.message}</p>
                        ) : pinAutoMsg ? (
                          <p className="text-xs text-emerald-400 font-medium mt-1.5 flex items-center gap-1 bg-emerald-950/60 p-1.5 rounded-lg border border-emerald-800/80">
                            <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />
                            <span>{pinAutoMsg}</span>
                          </p>
                        ) : (
                          <p className="text-[11px] text-slate-500 font-normal mt-1">
                            Type a 6-digit PIN code to auto-fill District, State & Country.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* SUB-CONTAINER ④: COMMUNICATION & LANGUAGE PREFERENCES */}
                {(selectedRole === 'landowner' || selectedRole === 'buyer') && (
                  <div className="form-section-subcard w-full">
                    <h3 className="text-sm font-bold text-white flex items-center justify-center gap-2 mb-4 text-emerald-400 border-b border-slate-800/80 pb-2 text-center">
                      <MessageSquare size={18} />
                      <span>
                        {selectedRole === 'landowner' && '③ Preferences'}
                        {selectedRole === 'buyer' && '④ Communication & Language'}
                      </span>
                    </h3>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-2">
                        Communication Preference
                      </label>
                      <select
                        className="w-full form-input-56 cursor-pointer"
                        {...register('preferredCommunication')}
                      >
                        <option value="Email">Email</option>
                        <option value="SMS">SMS</option>
                        <option value="Phone Call">Phone Call</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* TERMS & PRIVACY ACCEPTANCE */}
                <div className="pt-2 space-y-3 flex flex-col items-center justify-center text-center">
                  <label className="flex items-center justify-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="w-4.5 h-4.5 text-emerald-600 rounded focus:ring-emerald-500 border-slate-700 bg-slate-800 cursor-pointer"
                    />
                    <span className="text-xs text-slate-300 group-hover:text-white transition-colors">
                      I accept the <a href="#terms" className="text-emerald-400 font-semibold underline hover:text-emerald-300">Terms & Conditions</a>
                    </span>
                  </label>

                  <label className="flex items-center justify-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={acceptPrivacy}
                      onChange={(e) => setAcceptPrivacy(e.target.checked)}
                      className="w-4.5 h-4.5 text-emerald-600 rounded focus:ring-emerald-500 border-slate-700 bg-slate-800 cursor-pointer"
                    />
                    <span className="text-xs text-slate-300 group-hover:text-white transition-colors">
                      I accept the <a href="#privacy" className="text-emerald-400 font-semibold underline hover:text-emerald-300">Privacy Policy</a>
                    </span>
                  </label>
                </div>

                {/* Glowing Emerald Register Button */}
                <button
                  type="submit"
                  disabled={!acceptTerms || !acceptPrivacy || isSubmitting}
                  className={`w-full h-14 rounded-2xl font-black text-base transition-all duration-300 flex items-center justify-center gap-2.5 ${acceptTerms && acceptPrivacy && !isSubmitting
                      ? 'bg-gradient-to-r from-emerald-600 via-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white btn-glow-emerald cursor-pointer'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/60 shadow-none'
                    }`}
                >
                  <UserPlus size={20} />
                  <span>
                    {isSubmitting
                      ? 'Registering Account...'
                      : `Register as ${selectedRole.toUpperCase()}`}
                  </span>
                </button>
              </form>

              {/* Bottom Sign In Link */}
              <div className="w-full mt-8 text-center text-sm font-medium text-slate-400 border-t border-slate-800 pt-6">
                Already have an account?{' '}
                <Link to="/login" className="font-bold text-emerald-400 hover:text-emerald-300 underline transition-colors ml-1">
                  Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Register;
