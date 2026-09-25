import React, { useState } from 'react';
import { User, Mail, Lock, UserPlus, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SignupView({ onSignupSuccess, onSwitchToLogin }) {
  const { register, isLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Username and password are required.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match!');
      return;
    }

    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || username;
    const lastName = nameParts.slice(1).join(' ') || 'Admin';

    try {
      await register({
        username: username.trim(),
        email: email.trim(),
        first_name: firstName,
        last_name: lastName,
        password: password,
      });
      onSignupSuccess();
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your inputs.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#07080c] text-slate-100 selection:bg-blue-500/30 selection:text-blue-200">
      <div className="w-full max-w-md p-8 rounded-2xl bg-[#12151f] border border-[#222738] shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <UserPlus className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">Create Admin Account</h2>
          <p className="text-xs text-neutral-400">Join the DevAdmin multi-website control platform</p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block text-neutral-300 font-semibold mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-400" /> Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. roshan_dev"
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#0d1018] border border-[#222738] text-white placeholder:text-neutral-500 focus:outline-none focus:border-blue-500 focus:bg-[#161a28] transition-all"
            />
          </div>

          <div>
            <label className="block text-neutral-300 font-semibold mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-400" /> Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Roshan Kumar"
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#0d1018] border border-[#222738] text-white placeholder:text-neutral-500 focus:outline-none focus:border-blue-500 focus:bg-[#161a28] transition-all"
            />
          </div>

          <div>
            <label className="block text-neutral-300 font-semibold mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-blue-400" /> Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#0d1018] border border-[#222738] text-white placeholder:text-neutral-500 focus:outline-none focus:border-blue-500 focus:bg-[#161a28] transition-all"
            />
          </div>

          <div>
            <label className="block text-neutral-300 font-semibold mb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-blue-400" /> Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#0d1018] border border-[#222738] text-white placeholder:text-neutral-500 focus:outline-none focus:border-blue-500 focus:bg-[#161a28] transition-all"
            />
          </div>

          <div>
            <label className="block text-neutral-300 font-semibold mb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-blue-400" /> Confirm Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#0d1018] border border-[#222738] text-white placeholder:text-neutral-500 focus:outline-none focus:border-blue-500 focus:bg-[#161a28] transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Create Account</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-[#222738]">
          <p className="text-xs text-neutral-400">
            Already have an account?{' '}
            <button 
              onClick={onSwitchToLogin}
              className="text-blue-400 font-bold hover:underline"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
