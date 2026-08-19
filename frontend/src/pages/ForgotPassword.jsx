import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Key, Mail, ShieldAlert, CheckCircle2, ArrowLeft, Send, Sparkles, RefreshCw, ArrowRight } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sentData, setSentData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSentData(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !/\S+@\S+\.\S+/.test(cleanEmail)) {
      setError('Please enter a valid registered email address.');
      return;
    }

    try {
      setLoading(true);
      const res = await authService.requestPasswordReset(cleanEmail);
      setSentData(res);
    } catch (err) {
      setError(err.message || 'Failed to send password reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper min-h-screen bg-[#070e0a] text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="auth-container py-12 flex-1 flex items-center justify-center px-4">
        <div className="auth-card max-w-md w-full bg-[#0b1710] border border-emerald-500/20 rounded-xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="auth-header text-center space-y-3">
            <div className="auth-icon-circle mx-auto w-14 h-14 rounded-lg bg-emerald-950/80 border border-emerald-700/60 flex items-center justify-center text-emerald-400 shadow-inner">
              {sentData ? <CheckCircle2 size={26} className="animate-pulse" /> : <Key size={26} />}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {sentData ? 'Check Your Email' : 'Forgot Password?'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              {sentData
                ? 'We have sent a password reset link to your email address'
                : 'Enter your registered email address to receive a password reset link'}
            </p>
          </div>

          {error && (
            <div className="error-banner p-3.5 bg-rose-950/80 border border-rose-800/60 rounded-lg text-xs font-semibold text-rose-300 flex items-center gap-2">
              <ShieldAlert size={18} className="shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {!sentData ? (
            <form onSubmit={handleSubmit} className="auth-form space-y-5">
              <div className="form-group space-y-2">
                <label htmlFor="reset-email" className="text-xs font-extrabold uppercase tracking-wider text-slate-200 block">
                  REGISTERED EMAIL ADDRESS <span className="text-rose-400 font-bold">*</span>
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 text-emerald-400 pointer-events-none" size={18} />
                  <input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-[#050e08] border-2 border-emerald-600/30 rounded-lg text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-500/40 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg transition-all shadow-md shadow-emerald-950/80 border border-emerald-400/30 cursor-pointer flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
              >
                <Send size={16} />
                <span>{loading ? 'Sending Reset Link...' : 'Send Password Reset Link'}</span>
              </button>
            </form>
          ) : (
            <div className="space-y-4 text-left">
              {/* Success Banner Card */}
              <div className="relative overflow-hidden bg-[#050e08] border border-emerald-700/60 rounded-lg p-5 shadow-xl">
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 bg-emerald-950/80 border border-emerald-600/50 rounded-lg text-emerald-400 shrink-0 shadow-inner">
                    <CheckCircle2 size={22} className="animate-pulse" />
                  </div>
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-white tracking-wide">Reset Link Dispatched</h4>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-950/80 border border-emerald-700/60 rounded-md text-[11px] font-semibold text-emerald-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        Sent
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      We sent a password reset link to:
                    </p>
                    <div className="mt-2 py-2 px-3 bg-[#09150d] border border-emerald-800/60 rounded-md text-emerald-300 font-mono text-xs font-semibold truncate flex items-center justify-between">
                      <span className="truncate">{sentData.email || email}</span>
                      <Mail size={14} className="text-emerald-400 shrink-0 ml-2" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Direct Access Token Link */}
              {sentData.resetLink && (
                <div className="bg-[#050e08] border border-emerald-800/50 rounded-lg p-4 space-y-3 shadow-lg">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                    <Sparkles size={15} className="text-emerald-400 shrink-0" />
                    <span>Instant Password Reset Access</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Click below to proceed directly to set your new password using your single-use reset token:
                  </p>
                  <Link
                    to={sentData.resetLink}
                    className="inline-flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold text-xs rounded-lg transition-all shadow-md border border-emerald-400/30 transform hover:-translate-y-0.5"
                  >
                    <Key size={16} />
                    <span>Set New Password Now</span>
                    <ArrowRight size={15} />
                  </Link>
                </div>
              )}

              {/* Resend Email Action */}
              <button
                type="button"
                onClick={() => setSentData(null)}
                className="w-full py-3 bg-[#050e08] hover:bg-[#0c1810] border border-emerald-800/60 hover:border-emerald-600/60 text-slate-300 hover:text-emerald-300 font-semibold text-xs rounded-lg cursor-pointer transition-all flex items-center justify-center gap-2 shadow-md"
              >
                <RefreshCw size={14} className="text-emerald-400" />
                <span>Didn't receive the email? Resend link</span>
              </button>
            </div>
          )}

          <div className="auth-footer-text text-center pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 font-bold text-xs text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-wider"
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
