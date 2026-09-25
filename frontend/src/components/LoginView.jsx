import React, { useState } from 'react';
import { Lock, LogIn, AlertCircle, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginView({ onLoginSuccess }) {
  const { login, isLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) {
      setError('Please enter your superadmin username and password.');
      return;
    }
    try {
      await login(username.trim(), password);
      onLoginSuccess();
    } catch (err) {
      setError(err.message || 'Invalid credentials. Only authorized Superadministrators can sign in.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#07080c] text-slate-100 selection:bg-violet-500/30 selection:text-violet-200">
      <div className="w-full max-w-md p-8 rounded-2xl bg-[#12151f] border border-[#222738] shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200 backdrop-blur-2xl">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25 border border-violet-400/20">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">DevAdmin</h1>
            <p className="text-xs font-semibold text-violet-400 uppercase tracking-wider mt-0.5">Superadmin Console</p>
          </div>
          <p className="text-xs text-neutral-400">Restricted administrative access for platform administration.</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block text-neutral-300 font-semibold mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-violet-400" /> Superadmin Username
            </label>
            <input
              type="text"
              required
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0d1018] border border-[#222738] text-white placeholder:text-neutral-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:bg-[#161a28] transition-all"
            />
          </div>

          <div>
            <label className="block text-neutral-300 font-semibold mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-violet-400" /> Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0d1018] border border-[#222738] text-white placeholder:text-neutral-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:bg-[#161a28] transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-violet-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In to Superadmin Console</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-3 border-t border-[#222738]">
          <p className="text-[11px] text-neutral-400">
            Protected endpoint with JWT Bearer authentication & role-based validation.
          </p>
        </div>
      </div>
    </div>
  );
}
