import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { LogIn, Key, Mail, ShieldAlert, CheckCircle2 } from 'lucide-react';

// Zod Schema Definition for Live Login Validation
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

const Login = () => {
  const [authError, setAuthError] = useState('');
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting, touchedFields }
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const watchEmail = watch('email', '');
  const isEmailValidFormat = watchEmail && /\S+@\S+\.\S+/.test(watchEmail);
  const isRegisteredUser = isEmailValidFormat && authService.isUserRegistered(watchEmail);

  // State for live approved registered accounts from DB
  const [approvedUsersList, setApprovedUsersList] = useState([]);

  useEffect(() => {
    const fetchApprovedUsers = async () => {
      try {
        let list = [];
        try {
          const res = await api.get('/auth/approved-users');
          if (res.data && Array.isArray(res.data.users)) {
            list = res.data.users;
          }
        } catch (apiErr) {
          console.warn('API error fetching approved users, checking local storage fallback:', apiErr);
          const registeredUsersObj = authService.getRegisteredUsers();
          list = Object.values(registeredUsersObj).filter(
            (u) => u && u.email && (u.role === 'admin' || (u.status === 'Active' && u.isVerified))
          );
        }

        // Always ensure Primary Admin account is included
        const hasAdmin = list.some((u) => u.email?.toLowerCase() === 'admintc@gmail.com' || u.role === 'admin');
        if (!hasAdmin) {
          list.unshift({
            id: 'usr_admin_01',
            name: 'TreeConnect Admin',
            email: 'admintc@gmail.com',
            role: 'admin',
            status: 'Active',
            isVerified: true
          });
        }

        setApprovedUsersList(list);
      } catch (err) {
        console.error('Error setting approved users list:', err);
      }
    };

    fetchApprovedUsers();
  }, []);

  // Suggestions dropdown state
  const [isEmailFocused, setIsEmailFocused] = useState(false);

  const matchingEmails = approvedUsersList.filter(
    (u) =>
      !watchEmail ||
      u.email?.toLowerCase().includes(watchEmail.toLowerCase()) ||
      (u.name && u.name.toLowerCase().includes(watchEmail.toLowerCase()))
  );

  useEffect(() => {
    if (location.state?.passwordReset) {
      setResetSuccessMessage('Password updated successfully! Please sign in with your new password.');
      if (location.state?.email) {
        setValue('email', location.state.email, { shouldValidate: true });
      }
    }
  }, [location.state, setValue]);

  const onSubmit = async (data) => {
    setAuthError('');
    setResetSuccessMessage('');
    try {
      const res = await login(data);
      const role = res.user?.role;
      if (role === 'admin') navigate('/admin/dashboard');
      else if (role === 'landowner') navigate('/landowner/dashboard');
      else if (role === 'contractor') navigate('/contractor/dashboard');
      else if (role === 'buyer') navigate('/buyer/dashboard');
      else navigate('/');
    } catch (err) {
      setAuthError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="page-wrapper min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-icon-circle">
              <LogIn size={26} />
            </div>
            <h2>Welcome Back</h2>
            <p>Sign in to access your TreeConnect ecosystem portal</p>
          </div>

          {resetSuccessMessage && (
            <div className="p-3 bg-emerald-950/90 border border-emerald-700 rounded-xl text-xs text-emerald-300 font-bold flex items-center gap-2 mb-3 animate-fade-in">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
              <span>{resetSuccessMessage}</span>
            </div>
          )}

          {authError && (
            <div className="error-banner">
              <ShieldAlert size={18} />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} method="post" action="#" autoComplete="on" className="auth-form">
            {/* Email Field with Live Registered User Validation */}
            <div className="form-group relative">
              <label htmlFor="email">Email Address *</label>
              <div className="input-icon-wrapper">
                <Mail className="input-icon" size={18} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@company.com"
                  className={errors.email ? 'form-input-error' : ''}
                  {...register('email')}
                  onFocus={() => setIsEmailFocused(true)}
                  onBlur={() => setTimeout(() => setIsEmailFocused(false), 200)}
                />
              </div>

              {/* Interactive Email Auto-Suggestions Dropdown (Only Approved Accounts) */}
              {isEmailFocused && matchingEmails.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-50 overflow-hidden max-h-56 overflow-y-auto animate-fade-in">
                  <div className="px-4 py-2.5 bg-slate-950/90 border-b border-slate-800/80 text-[11px] font-extrabold text-emerald-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Approved Registered Accounts:</span>
                    <span className="text-[10px] text-slate-400 font-normal">{matchingEmails.length} available</span>
                  </div>
                  {matchingEmails.map((u) => (
                    <button
                      key={u.email}
                      type="button"
                      className="w-full text-left px-4 py-3 bg-slate-900/60 hover:bg-slate-800/90 flex items-center justify-between gap-3 border-b border-slate-800/50 last:border-0 cursor-pointer transition-all group"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setValue('email', u.email, { shouldValidate: true });
                        setValue('password', u.password || 'password123', { shouldValidate: true });
                        setIsEmailFocused(false);
                      }}
                    >
                      <div className="flex flex-col min-w-0 pr-1">
                        <span className="text-xs font-bold text-white group-hover:text-emerald-400 truncate transition-colors">
                          {u.email}
                        </span>
                        <span className="text-[11px] text-slate-400 truncate">{u.name || u.email}</span>
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border shrink-0 ${u.role === 'admin' ? 'bg-amber-950/80 text-amber-300 border-amber-800' :
                          u.role === 'contractor' ? 'bg-amber-950/60 text-amber-400 border-amber-800' :
                            u.role === 'buyer' ? 'bg-blue-950/80 text-blue-300 border-blue-800' :
                              'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                        }`}>
                        {u.role}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Live Error or Success Messages */}
              {errors.email ? (
                <p className="text-xs text-red-400 font-medium mt-1">
                  {errors.email.message}
                </p>
              ) : isRegisteredUser ? (
                <p className="text-xs text-emerald-400 font-medium mt-1 flex items-center gap-1">
                  <CheckCircle2 size={13} className="text-emerald-400 inline-block" />
                  <span>Registered account verified</span>
                </p>
              ) : (
                <p className="text-[11px] text-slate-500 font-normal mt-1">
                  Enter your registered account email address.
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="form-group">
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="mb-0">Password *</label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="input-icon-wrapper">
                <Key className="input-icon" size={18} />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={errors.password ? 'form-input-error' : ''}
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-red-400 font-medium mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary btn-block btn-lg cursor-pointer"
            >
              {isSubmitting ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div className="auth-footer-text">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-emerald-400 hover:text-emerald-300 underline transition-colors">
              Create an Account
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Login;
