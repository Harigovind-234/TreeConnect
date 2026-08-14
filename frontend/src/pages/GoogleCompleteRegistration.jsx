import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Toast from '../components/Toast';
import Loader from '../components/Loader';
import { locationService, KERALA_DISTRICTS, OTHER_MAJOR_DISTRICTS } from '../services/locationService';
import { 
  Trees, 
  Truck, 
  ShoppingBag, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight, 
  User, 
  Mail, 
  Phone,
  AlertTriangle,
  Loader2,
  Building,
  Compass,
  Globe,
  MapPin
} from 'lucide-react';

const googleRegSchema = z.object({
  role: z.enum(['landowner', 'contractor', 'buyer'], {
    required_error: 'Please select your role in the forestry ecosystem'
  }),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Valid email is required'),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === '') return true;
        const cleaned = val.trim();
        return /^\d{10}$/.test(cleaned) && /^[6-9]/.test(cleaned);
      },
      { message: 'Phone must be a valid 10-digit mobile number starting with 6-9' }
    ),

  address: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  language: z.string().optional(),

  companyName: z.string().optional(),
  contactPerson: z.string().optional(),
  yearsOfExperience: z.string().optional(),
  serviceArea: z.string().optional(),
  licenseNumber: z.string().optional(),

  businessType: z.string().optional()
}).superRefine((data, ctx) => {
  if (data.district && locationService.isInvalidDistrict(data.district)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `"${data.district}" is a state/country name. Please enter a valid District name (e.g. Kozhikode, Wayanad)`,
      path: ['district']
    });
  }
});

const GoogleCompleteRegistration = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { completeGoogleRegister } = useAuth();

  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const [googleUser, setGoogleUser] = useState(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('treeconnect_google_pending_user');
      if (stored) {
        setGoogleUser(JSON.parse(stored));
      } else {
        const email = searchParams.get('email') || 'partner@forestry-enterprise.com';
        const fullName = searchParams.get('name') || 'Forestry Partner';
        const googleId = searchParams.get('googleId') || `g_${Date.now()}`;
        const profilePicture = searchParams.get('avatar') || `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`;

        setGoogleUser({ email, fullName, googleId, profilePicture });
      }
    } catch (err) {
      console.error('Error loading Google profile:', err);
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(googleRegSchema),
    mode: 'onChange',
    defaultValues: {
      role: 'landowner',
      fullName: '',
      email: '',
      phone: '',
      address: '',
      district: '',
      state: '',
      country: '',
      postalCode: '',
      language: 'English',
      companyName: '',
      contactPerson: '',
      yearsOfExperience: '',
      serviceArea: '',
      licenseNumber: '',
      businessType: ''
    }
  });

  const watchRole = watch('role');
  const watchPostalCode = watch('postalCode', '');
  const watchDistrict = watch('district', '');
  const [isFetchingPin, setIsFetchingPin] = useState(false);
  const [pinAutoMsg, setPinAutoMsg] = useState('');

  // Auto-fetch location when 6-digit Indian PIN code is entered
  useEffect(() => {
    const cleanPin = (watchPostalCode || '').trim();
    if (cleanPin.length === 6 && /^\d{6}$/.test(cleanPin)) {
      let isMounted = true;
      setIsFetchingPin(true);
      setPinAutoMsg('');

      locationService.fetchLocationByPinCode(cleanPin).then((res) => {
        if (!isMounted) return;
        setIsFetchingPin(false);
        if (res) {
          if (res.district) setValue('district', res.district, { shouldValidate: true });
          if (res.state) setValue('state', res.state, { shouldValidate: true });
          if (res.country) setValue('country', res.country, { shouldValidate: true });
          setPinAutoMsg(`✓ Auto-filled for PIN ${cleanPin}: ${res.district || ''}, ${res.state || 'Kerala'}`);
        }
      }).catch(() => {
        if (isMounted) setIsFetchingPin(false);
      });

      return () => { isMounted = false; };
    } else {
      setPinAutoMsg('');
    }
  }, [watchPostalCode, setValue]);

  useEffect(() => {
    if (googleUser) {
      setValue('fullName', googleUser.fullName || '');
      setValue('email', googleUser.email || '');
    }
  }, [googleUser, setValue]);

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        googleId: googleUser?.googleId,
        profilePicture: googleUser?.profilePicture,
        email: googleUser?.email || data.email
      };

      const res = await completeGoogleRegister(payload);
      sessionStorage.removeItem('treeconnect_google_pending_user');

      if (data.role === 'contractor') {
        showToast('Account created! Your contractor account is pending administrator review.', 'warning');
      } else {
        showToast('Google registration complete! Redirecting to your dashboard...', 'success');
      }

      setTimeout(() => {
        navigate(res.redirect || `/${data.role}/dashboard`);
      }, 1200);
    } catch (err) {
      showToast(err.message || 'Failed to complete registration. Please try again.', 'error');
    }
  };

  return (
    <div className="page-wrapper min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      <main className="auth-container py-12 px-4 max-w-4xl mx-auto w-full">
        <div className="auth-card bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          {/* Header & Google Profile Info Banner */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-4">
              <ShieldCheck size={14} /> Verified Google Authentication
            </div>

            <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
              Complete Your Registration
            </h1>
            <p className="text-slate-400 text-sm max-w-lg mx-auto">
              Welcome to TreeConnect! Select your role and fill in your details to finalize your enterprise profile.
            </p>
          </div>

          {/* Google Account Verified Card */}
          {googleUser && (
            <div className="flex items-center gap-4 bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 mb-8 backdrop-blur-md">
              <img
                src={googleUser.profilePicture}
                alt={googleUser.fullName}
                className="w-14 h-14 rounded-full border-2 border-emerald-500/40 object-cover"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-base">{googleUser.fullName}</span>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                    GOOGLE VERIFIED
                  </span>
                </div>
                <span className="text-slate-400 text-xs block">{googleUser.email}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Step 1: Select Role (Required exactly 1) */}
            <div>
              <label className="block text-sm font-bold text-white mb-3">
                Select Your Platform Role *
              </label>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Landowner Card */}
                <label
                  className={`relative flex flex-col p-5 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedRole === 'landowner'
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                      : 'border-slate-800 bg-slate-850 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    value="landowner"
                    className="sr-only"
                    {...register('role')}
                  />
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                      <Trees size={24} />
                    </div>
                    {selectedRole === 'landowner' && (
                      <CheckCircle2 size={20} className="text-emerald-400" />
                    )}
                  </div>
                  <span className="font-bold text-white text-lg mb-1">🌳 Landowner</span>
                  <span className="text-xs text-slate-400 leading-relaxed">
                    Own timber land, estimate timber harvest yields, and manage timber sales.
                  </span>
                </label>

                {/* Contractor Card */}
                <label
                  className={`relative flex flex-col p-5 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedRole === 'contractor'
                      ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                      : 'border-slate-800 bg-slate-850 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    value="contractor"
                    className="sr-only"
                    {...register('role')}
                  />
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400">
                      <Truck size={24} />
                    </div>
                    {selectedRole === 'contractor' && (
                      <CheckCircle2 size={20} className="text-amber-400" />
                    )}
                  </div>
                  <span className="font-bold text-white text-lg mb-1">🪓 Contractor</span>
                  <span className="text-xs text-slate-400 leading-relaxed">
                    Bid on harvesting jobs, schedule equipment fleets, and execute timber harvests.
                  </span>
                </label>

                {/* Buyer Card */}
                <label
                  className={`relative flex flex-col p-5 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedRole === 'buyer'
                      ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10'
                      : 'border-slate-800 bg-slate-850 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    value="buyer"
                    className="sr-only"
                    {...register('role')}
                  />
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-lg bg-blue-500/20 text-blue-400">
                      <ShoppingBag size={24} />
                    </div>
                    {selectedRole === 'buyer' && (
                      <CheckCircle2 size={20} className="text-blue-400" />
                    )}
                  </div>
                  <span className="font-bold text-white text-lg mb-1">🪵 Timber Buyer</span>
                  <span className="text-xs text-slate-400 leading-relaxed">
                    Procure timber species directly from verified managed forests and mills.
                  </span>
                </label>
              </div>
            </div>

            {/* Step 2: Core Profile Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-800/40 p-6 rounded-xl border border-slate-800">
              {/* Full Name */}
              <div className="form-group">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name *
                </label>
                <div className="input-icon-wrapper relative">
                  <User className="input-icon absolute left-3 top-3 text-slate-500" size={18} />
                  <input
                    type="text"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    placeholder="John Doe"
                    {...register('fullName')}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-xs text-red-400 mt-1">{errors.fullName.message}</p>
                )}
              </div>

              {/* Email Address (Disabled / Read-Only) */}
              <div className="form-group">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Google Verified Email (Read-Only)
                </label>
                <div className="input-icon-wrapper relative opacity-75">
                  <Mail className="input-icon absolute left-3 top-3 text-slate-500" size={18} />
                  <input
                    type="email"
                    disabled
                    readOnly
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-400 cursor-not-allowed font-medium"
                    {...register('email')}
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Email is locked to your authenticated Google account.
                </p>
              </div>

              {/* Mobile Phone */}
              <div className="form-group md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Mobile Number (Optional)
                </label>
                <div className="input-icon-wrapper relative">
                  <Phone className="input-icon absolute left-3 top-3 text-slate-500" size={18} />
                  <input
                    type="tel"
                    placeholder="9876543210"
                    maxLength={10}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    {...register('phone')}
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs text-red-400 mt-1">{errors.phone.message}</p>
                )}
              </div>
            </div>

            {/* Step 3: Dynamic Role-Specific Fields */}
            {selectedRole === 'landowner' && (
              <div className="bg-emerald-950/20 border border-emerald-500/20 p-6 rounded-xl space-y-4">
                <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2">
                  <Trees size={18} /> Landowner Profile & Location Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Property Address</label>
                    <input
                      type="text"
                      placeholder="Street address or estate parcel"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                      {...register('address')}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1">District</label>
                    <input
                      type="text"
                      placeholder="County / District"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                      {...register('district')}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1">State / Province</label>
                    <input
                      type="text"
                      placeholder="State"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                      {...register('state')}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Postal Code</label>
                    <input
                      type="text"
                      placeholder="ZIP / Postal Code"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                      {...register('postalCode')}
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedRole === 'contractor' && (
              <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2 text-emerald-400">
                    <Truck size={20} className="text-emerald-400" />
                    <span>Professional Information</span>
                  </h3>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                    Kerala Harvesting Contractor
                  </span>
                </div>

                {/* 1. Years of Experience (Required) */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-100 mb-1.5">
                    1. Years of Experience <span className="text-emerald-400">*</span>
                  </label>
                  <select
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-3 text-sm text-white font-semibold focus:border-emerald-500 shadow-sm"
                    {...register('yearsOfExperience')}
                  >
                    <option value="" className="bg-slate-900 text-slate-400">-- Select Years of Experience --</option>
                    <option value="Less than 1 Year" className="bg-slate-900 text-white font-medium">Less than 1 Year</option>
                    <option value="1–3 Years" className="bg-slate-900 text-white font-medium">1–3 Years</option>
                    <option value="4–7 Years" className="bg-slate-900 text-white font-medium">4–7 Years</option>
                    <option value="8–15 Years" className="bg-slate-900 text-white font-medium">8–15 Years</option>
                    <option value="More than 15 Years" className="bg-slate-900 text-white font-medium">More than 15 Years</option>
                  </select>
                  <p className="text-xs text-slate-300 font-medium mt-1.5 leading-relaxed">
                    Select your approximate experience in tree harvesting or forestry-related work.
                  </p>
                </div>

                {/* 2. Primary Service Area */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-100 mb-1.5">Primary Service Area / Districts</label>
                  <input
                    type="text"
                    placeholder="e.g. Kozhikode, Wayanad, Malappuram"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-3 text-sm text-white font-medium placeholder:text-slate-400 focus:border-emerald-500 shadow-sm"
                    {...register('serviceArea')}
                  />
                </div>

                {/* Administrator Verification Required Notice */}
                <div className="rounded-2xl bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-950 border border-emerald-500/40 p-5 shadow-xl">
                  <div className="flex items-center gap-3 mb-3 border-b border-emerald-500/20 pb-3">
                    <ShieldCheck size={22} className="text-emerald-400 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-white">Administrator Verification Required</h4>
                      <p className="text-xs text-emerald-400 font-semibold">TreeConnect Contractor Account Status</p>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed mb-4">
                    Your contractor account will remain in <span className="font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-700/60">"Pending Verification"</span> until the uploaded documents are reviewed by the TreeConnect administrator.
                  </p>

                  <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
                    <p className="text-xs sm:text-sm font-bold text-emerald-400 mb-2">Only verified contractors can:</p>
                    <ul className="space-y-2 text-xs sm:text-sm text-slate-200 font-medium">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                        <span>Sign in</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                        <span>Receive harvesting requests</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                        <span>Submit quotations</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                        <span>Participate in harvesting projects</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {selectedRole === 'buyer' && (
              <div className="bg-blue-950/20 border border-blue-500/20 p-6 rounded-xl space-y-4">
                <h3 className="text-base font-bold text-blue-400 flex items-center gap-2">
                  <ShoppingBag size={18} /> Timber Buyer Business Specs
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Company Name</label>
                    <input
                      type="text"
                      placeholder="Pacific Lumber Mills Inc."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                      {...register('companyName')}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Business Type</label>
                    <select
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                      {...register('businessType')}
                    >
                      <option value="Sawmill">Sawmill & Lumber Manufacturer</option>
                      <option value="Pulp Mill">Pulp & Paper Mill</option>
                      <option value="Exporter">International Timber Exporter</option>
                      <option value="Furniture">Furniture & Wood Products</option>
                      <option value="Trader">Log Trader / Broker</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs text-slate-300 mb-1">Business Address</label>
                    <input
                      type="text"
                      placeholder="Mill headquarters or procurement office address"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                      {...register('address')}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold text-base shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader size={20} />
                  <span>Finalizing Google Account...</span>
                </>
              ) : (
                <>
                  <span>Complete Account Registration</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default GoogleCompleteRegistration;
