import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Key, Mail, ShieldAlert, CheckCircle2, ArrowLeft, Lock } from 'lucide-react';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid registered email address.');
      return;
    }

    if (!authService.isUserRegistered(email)) {
      setError('This email is not registered in the system.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify your confirm password.');
      return;
    }

    try {
      setLoading(true);
      await authService.resetPassword(email, newPassword);
      setSuccess('Password updated successfully! Redirecting to sign in...');
      setTimeout(() => {
        navigate('/login', { state: { email, passwordReset: true } });
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="auth-container my-auto py-12">
        <div className="auth-card max-w-md w-full mx-auto">
          {/* Header */}
          <div className="auth-header text-center space-y-2">
            <div className="auth-icon-circle mx-auto bg-emerald-950/80 text-emerald-400 border border-emerald-800">
              <Key size={26} />
            </div>
            <h2 className="text-2xl font-black text-white">Reset Password</h2>
            <p className="text-xs text-slate-400">
              Enter your registered email and set a new password for your account
            </p>
          </div>

          {/* Feedback Banners */}
          {error && (
            <div className="error-banner flex items-center gap-2 p-3 bg-red-950/80 border border-red-800 rounded-xl text-xs text-red-300 my-4">
              <ShieldAlert size={16} className="shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-950/90 border border-emerald-700 rounded-xl text-xs text-emerald-300 font-bold flex items-center gap-2 my-4 animate-fade-in">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
              <span>{success}</span>
            </div>
          )}

          {/* Reset Password Form */}
          <form onSubmit={handleSubmit} className="auth-form space-y-4 mt-4">
            <div className="form-group">
              <label htmlFor="reset-email" className="text-xs font-bold text-slate-300">
                Registered Email Address *
              </label>
              <div className="input-icon-wrapper relative">
                <Mail className="input-icon absolute left-3 top-3 text-slate-500" size={18} />
                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="new-password" className="text-xs font-bold text-slate-300">
                New Password *
              </label>
              <div className="input-icon-wrapper relative">
                <Lock className="input-icon absolute left-3 top-3 text-slate-500" size={18} />
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirm-password" className="text-xs font-bold text-slate-300">
                Confirm New Password *
              </label>
              <div className="input-icon-wrapper relative">
                <Lock className="input-icon absolute left-3 top-3 text-slate-500" size={18} />
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-block btn-lg cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black"
            >
              {loading ? 'Updating Password...' : 'Reset Password'}
            </button>
          </form>

          <div className="auth-footer-text text-center mt-6">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-emerald-400 transition-colors"
            >
              <ArrowLeft size={14} /> Back to Sign In
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ForgotPassword;
