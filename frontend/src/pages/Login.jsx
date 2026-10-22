import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  LogIn,
  Key,
  Mail,
  ShieldAlert,
  CheckCircle2,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import './Login.css';

// Zod Schema Definition for Login Validation
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
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      email: '',
      password: ''
    }
  });

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
      const role = res?.user?.role;
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
    <div className="login-page-root">
      <Navbar />

      <main className="login-main-container">
        <div className="login-card">
          
          {/* Header */}
          <div className="login-header">
            <div className="login-emblem-wrapper">
              <LogIn size={26} />
            </div>
            <h2 className="login-title">Welcome Back</h2>
            <p className="login-subtitle">
              Sign in to access your TreeConnect ecosystem portal
            </p>
          </div>

          {/* Password Reset Success Alert */}
          {resetSuccessMessage && (
            <div className="login-alert login-alert-success">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{resetSuccessMessage}</span>
            </div>
          )}

          {/* Authentication Error Alert */}
          {authError && (
            <div className="login-alert login-alert-error">
              <ShieldAlert size={18} className="shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="login-form">
            {/* Email Field */}
            <div className="login-field">
              <div className="login-field-header">
                <label htmlFor="login-email" className="login-label">
                  Email Address<span className="login-required">*</span>
                </label>
              </div>
              <div className="login-input-wrap">
                <Mail className="login-input-icon" size={18} />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@company.com"
                  className={`login-input ${errors.email ? 'login-input-has-error' : ''}`}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <div className="login-error-text">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{errors.email.message}</span>
                </div>
              )}
            </div>

            {/* Password Field */}
            <div className="login-field">
              <div className="login-field-header">
                <label htmlFor="login-password" className="login-label">
                  Password<span className="login-required">*</span>
                </label>
                <Link to="/forgot-password" className="login-forgot-link">
                  Forgot password?
                </Link>
              </div>
              <div className="login-input-wrap">
                <Key className="login-input-icon" size={18} />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={`login-input login-input-password ${errors.password ? 'login-input-has-error' : ''}`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="login-toggle-btn"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <div className="login-error-text">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{errors.password.message}</span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="login-submit-btn"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Divider & Footer Links */}
          <div className="login-divider" />

          <div className="login-footer-text">
            Don't have an account?{' '}
            <Link to="/register" className="login-register-link">
              Create an Account
            </Link>
          </div>

          <div className="login-trust-badge">
            <ShieldCheck size={13} />
            <span>256-bit Encrypted Secure Authentication</span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Login;
