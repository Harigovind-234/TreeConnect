import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Key, Mail, ShieldAlert, CheckCircle2, ArrowLeft, Send } from 'lucide-react';

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
    <div className="page-wrapper min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-icon-circle">
              {sentData ? <CheckCircle2 size={26} /> : <Key size={26} />}
            </div>
            <h2>{sentData ? 'Check Your Email' : 'Forgot Password?'}</h2>
            <p>
              {sentData
                ? 'We have sent a password reset link to your email address'
                : 'Enter your registered email address to receive a password reset link'}
            </p>
          </div>

          {error && (
            <div className="error-banner">
              <ShieldAlert size={18} />
              <span>{error}</span>
            </div>
          )}

          {!sentData ? (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="reset-email">Registered Email Address *</label>
                <div className="input-icon-wrapper">
                  <Mail className="input-icon" size={18} />
                  <input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-block btn-lg cursor-pointer flex items-center justify-center gap-2"
              >
                <Send size={16} />
                <span>{loading ? 'Sending Reset Link...' : 'Send Password Reset Link'}</span>
              </button>
            </form>
          ) : (
            <div className="space-y-4 text-center">
              <div className="p-4 bg-emerald-950/90 border border-emerald-700 rounded-xl text-xs text-emerald-300 font-medium space-y-2">
                <p className="text-sm font-bold text-white">Password Reset Link Sent!</p>
                <p className="text-slate-300 text-xs">
                  We sent an email to <span className="font-bold text-emerald-400">{sentData.email || email}</span> with instructions to reset your password. Please check your inbox.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSentData(null)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs rounded-xl cursor-pointer transition-colors mt-2"
              >
                Didn't receive email? Resend email
              </button>
            </div>
          )}

          <div className="auth-footer-text">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
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
