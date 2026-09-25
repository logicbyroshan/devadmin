import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Sparkles, 
  X, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle,
  Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, login, register, isLoading } = useAuth();
  const [tab, setTab] = useState('LOGIN'); // 'LOGIN' | 'REGISTER'
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    confirm_password: '',
  });

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (tab === 'LOGIN') {
      if (!formData.username.trim() || !formData.password) {
        setError('Please enter both username and password.');
        return;
      }
      try {
        await login(formData.username.trim(), formData.password);
      } catch (err) {
        setError(err.message || 'Invalid credentials. Please try again.');
      }
    } else {
      if (!formData.username.trim() || !formData.password) {
        setError('Username and password are required.');
        return;
      }
      if (formData.password !== formData.confirm_password) {
        setError('Passwords do not match.');
        return;
      }
      try {
        await register({
          username: formData.username.trim(),
          email: formData.email.trim(),
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          password: formData.password
        });
        setSuccessMsg('Account created successfully! Welcome to DevAdmin.');
      } catch (err) {
        setError(err.message || 'Registration failed. Please check your inputs.');
      }
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    try {
      await login('admin', 'admin123');
    } catch {
      setError('Demo login fallback triggered.');
    }
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#12151f] border border-[#222738] rounded-2xl shadow-2xl overflow-hidden">
        {/* Top Gradient Banner */}
        <div className="relative bg-gradient-to-r from-blue-950/80 via-indigo-950/60 to-purple-950/40 p-6 border-b border-[#222738] text-center">
          <button
            onClick={closeAuthModal}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-[#161a28] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="inline-flex p-3 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 shadow-lg shadow-blue-500/20 mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>

          <h2 className="text-xl font-extrabold text-white tracking-wide font-accent">
            DevAdmin Security Console
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            JWT-Authenticated Multi-Site Platform Access
          </p>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#0d1018] border border-[#222738] rounded-xl mt-4 text-xs font-bold">
            <button
              type="button"
              onClick={() => { setTab('LOGIN'); setError(''); setSuccessMsg(''); }}
              className={`py-2 rounded-lg transition-all ${
                tab === 'LOGIN'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setTab('REGISTER'); setError(''); setSuccessMsg(''); }}
              className={`py-2 rounded-lg transition-all ${
                tab === 'REGISTER'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-neutral-300 font-bold text-xs mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-400" /> Username
            </label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={e => setFormData({ ...formData, username: e.target.value })}
              placeholder="e.g. admin or roshan"
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#0d1018] border border-[#222738] text-white text-xs placeholder-neutral-500 focus:outline-none focus:border-blue-500 focus:bg-[#161a28] transition-all"
            />
          </div>

          {tab === 'REGISTER' && (
            <>
              <div>
                <label className="block text-neutral-300 font-bold text-xs mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-400" /> Email Address
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="admin@devadmin.io"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#0d1018] border border-[#222738] text-white text-xs placeholder-neutral-500 focus:outline-none focus:border-blue-500 focus:bg-[#161a28] transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-bold text-xs mb-1.5">First Name</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="Roshan"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#0d1018] border border-[#222738] text-white text-xs placeholder-neutral-500 focus:outline-none focus:border-blue-500 focus:bg-[#161a28] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-neutral-300 font-bold text-xs mb-1.5">Last Name</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                    placeholder="Kumar"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#0d1018] border border-[#222738] text-white text-xs placeholder-neutral-500 focus:outline-none focus:border-blue-500 focus:bg-[#161a28] transition-all"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-neutral-300 font-bold text-xs mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-blue-400" /> Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••••••"
                className="w-full pl-3.5 pr-10 py-2.5 rounded-lg bg-[#0d1018] border border-[#222738] text-white text-xs placeholder-neutral-500 focus:outline-none focus:border-blue-500 focus:bg-[#161a28] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {tab === 'REGISTER' && (
            <div>
              <label className="block text-neutral-300 font-bold text-xs mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-blue-400" /> Confirm Password
              </label>
              <input
                type="password"
                required
                value={formData.confirm_password}
                onChange={e => setFormData({ ...formData, confirm_password: e.target.value })}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0d1018] border border-[#222738] text-white text-xs placeholder-neutral-500 focus:outline-none focus:border-blue-500 focus:bg-[#161a28] transition-all"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-10 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
            ) : (
              <>
                <span>{tab === 'LOGIN' ? 'Sign In to Console' : 'Complete Registration'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Demo Admin 1-Click Login Button */}
          <div className="pt-2 border-t border-[#222738]">
            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full h-9 rounded-lg bg-[#0d1018] hover:bg-[#161a28] text-neutral-300 hover:text-white text-xs font-bold border border-[#222738] flex items-center justify-center gap-2 transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Quick 1-Click Demo Login (Admin)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
