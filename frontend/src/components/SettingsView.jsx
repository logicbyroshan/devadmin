import React, { useState, useEffect } from 'react';
import { Settings, Shield, UserPlus, Save, Lock, Trash2, Edit2, CheckCircle2, AlertCircle, ToggleLeft, ToggleRight, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { websitesApi } from '../services/api';

export default function SettingsView({ onNavigate, activeWebsite }) {
  const { user, changePassword } = useAuth();
  const [siteTitle, setSiteTitle] = useState(`${activeWebsite?.name || 'DevMate'} Admin Workspace`);
  const [seoDescription, setSeoDescription] = useState(`Official administrative control center for ${activeWebsite?.name || 'DevMate'} developer platform.`);
  const [seoKeywords, setSeoKeywords] = useState(`developer, portfolio, admin, ${activeWebsite?.slug || activeWebsite?.id || 'dev-mate'}, react, fullstack`);
  const [primaryColor, setPrimaryColor] = useState(activeWebsite?.primaryColor || 'violet');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(true);
  const [smtpNotifications, setSmtpNotifications] = useState(true);
  const [savedSettings, setSavedSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'seo' | 'security' | 'database'

  // Fetch website settings from backend
  useEffect(() => {
    let isMounted = true;
    const fetchSettings = async () => {
      try {
        const siteSlug = activeWebsite?.slug || activeWebsite?.id || 'dev-mate';
      } catch (err) {
        console.error("Failed to fetch settings", err);
      }
    };
    fetchSettings();
    return () => { isMounted = false; };
  }, [activeWebsite]);

  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (user) {
      setUsers([
        {
          id: user.id || 1,
          name: user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : (user.username || 'Superadmin'),
          email: user.email || 'admin@example.com',
          role: user.is_superuser ? 'Super Administrator' : 'Staff Admin',
          status: 'Active'
        }
      ]);
    }
  }, [user]);

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Normal User' });

  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [passFeedback, setPassFeedback] = useState(null);
  const [isChangingPass, setIsChangingPass] = useState(false);

  const handleSaveGeneral = async (e) => {
    e.preventDefault();
    setSavedSettings(true);
    try {
      const siteSlug = activeWebsite?.slug || activeWebsite?.id || 'dev-mate';
      await websitesApi.patch(siteSlug, {
        name: activeWebsite?.name || 'DevMate',
        tag: seoDescription
      });
    } catch {
      // Fallback
    }
    setTimeout(() => setSavedSettings(false), 3000);
  };

  const handleAddUserSubmit = (e) => {
    e.preventDefault();
    setUsers([...users, { ...newUser, id: Date.now(), status: 'Active' }]);
    setShowAddUserModal(false);
    setNewUser({ name: '', email: '', role: 'Normal User' });
  };

  const handleDeleteUser = (id) => {
    if (confirm('Remove user access?')) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPassFeedback(null);
    if (!passwords.current || !passwords.new) {
      setPassFeedback({ error: 'Please fill in all password fields.' });
      return;
    }
    if (passwords.new !== passwords.confirm) {
      setPassFeedback({ error: 'New passwords do not match!' });
      return;
    }
    if (passwords.new.length < 8) {
      setPassFeedback({ error: 'Password must be at least 8 characters long.' });
      return;
    }

    setIsChangingPass(true);
    try {
      await changePassword(passwords.current, passwords.new);
      setPassFeedback({ success: 'Password successfully changed!' });
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err) {
      setPassFeedback({ error: err.message || 'Failed to update password. Verify current password.' });
    } finally {
      setIsChangingPass(false);
      setTimeout(() => setPassFeedback(null), 5000);
    }
  };

  return (
    <div className="space-y-5 w-full max-w-full overflow-x-hidden font-sans">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 rounded-xl bg-[#12151f] border border-[#222738] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className={`p-3 rounded-lg ${activeWebsite?.accentBg || 'bg-blue-500/15'} ${activeWebsite?.accentText || 'text-blue-400'} border ${activeWebsite?.accentBorder || 'border-blue-500/30'}`}>
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold text-white">Website Settings & Access Control</h1>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${activeWebsite?.badgeStyle}`}>
                {activeWebsite?.badge}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">Manage global website configuration, administrative roles, and account security for {activeWebsite?.name}.</p>
          </div>
        </div>
      </div>

      {/* Section 1: General Site Settings */}
      <div className="p-5 sm:p-6 rounded-xl bg-[#12151f] border border-[#222738] space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#222738]">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Settings className={`w-4 h-4 ${activeWebsite?.accentText || 'text-blue-400'}`} />
            <span>General Site Settings ({activeWebsite?.name})</span>
          </h3>
          {savedSettings && (
            <span className="text-xs text-emerald-400 font-extrabold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Settings Saved!
            </span>
          )}
        </div>

        <form onSubmit={handleSaveGeneral} className="space-y-4 text-xs sm:text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-300 font-semibold mb-1">Website Title</label>
              <input
                type="text"
                required
                value={siteTitle}
                onChange={e => setSiteTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0d1018] border border-[#222738] text-white focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 focus:bg-[#161a28] transition-all"
              />
            </div>

            <div>
              <label className="block text-neutral-300 font-semibold mb-1">Maintenance Mode</label>
              <button
                type="button"
                onClick={() => setMaintenanceMode(!maintenanceMode)}
                className={`w-full px-3.5 py-2 rounded-lg flex items-center justify-between font-bold transition-all border ${
                  maintenanceMode
                    ? 'bg-rose-950/20 text-rose-300 border-rose-900/40'
                    : 'bg-[#0d1018] text-neutral-400 border-[#222738] hover:text-white hover:bg-[#161a28]'
                }`}
              >
                <span>{maintenanceMode ? 'ENABLED (Site Hidden)' : 'DISABLED (Live Operational)'}</span>
                {maintenanceMode ? <ToggleRight className="w-6 h-6 text-rose-400" /> : <ToggleLeft className="w-6 h-6 text-neutral-500" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-neutral-300 font-semibold mb-1">Default SEO Meta Description</label>
            <textarea
              rows="2"
              value={seoDescription}
              onChange={e => setSeoDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#0d1018] border border-[#222738] text-white focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 focus:bg-[#161a28] transition-all resize-none"
            ></textarea>
          </div>

          <div>
            <label className="block text-neutral-300 font-semibold mb-1">Default SEO Meta Keywords</label>
            <input
              type="text"
              value={seoKeywords}
              onChange={e => setSeoKeywords(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#0d1018] border border-[#222738] text-white focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 focus:bg-[#161a28] transition-all"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className={`h-9 px-5 rounded-lg bg-gradient-to-r ${activeWebsite?.gradient || 'from-blue-600 to-indigo-600'} text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg ${activeWebsite?.glow || 'shadow-blue-500/20'} hover:brightness-110 transition-all`}
            >
              <Save className="w-4 h-4" /> Save General Settings
            </button>
          </div>
        </form>
      </div>

      {/* Section 2: User Management */}
      <div className="p-5 sm:p-6 rounded-xl bg-[#12151f] border border-[#222738] space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#222738]">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Shield className={`w-4 h-4 ${activeWebsite?.accentText || 'text-blue-400'}`} />
            <span>Authorized Admin Users</span>
          </h3>
          <button
            onClick={() => setShowAddUserModal(true)}
            className={`h-9 px-3.5 rounded-lg bg-gradient-to-r ${activeWebsite?.gradient || 'from-blue-600 to-indigo-600'} text-white font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md ${activeWebsite?.glow || 'shadow-blue-500/20'} hover:brightness-110`}
          >
            <UserPlus className="w-3.5 h-3.5" /> Add New User
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-[#222738]">
          <table className="w-full text-left text-xs sm:text-sm text-neutral-300">
            <thead className="bg-[#0d1018] text-neutral-400 uppercase tracking-wider font-extrabold text-xs border-b border-[#222738]">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222738]/60 bg-[#12151f]">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-[#171c2b] transition-colors">
                  <td className="px-4 py-3.5 font-bold text-white">{u.name}</td>
                  <td className="px-4 py-3.5 text-neutral-400">{u.email}</td>
                  <td className={`px-4 py-3.5 font-semibold ${activeWebsite?.accentText || 'text-blue-400'}`}>{u.role}</td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                      u.status === 'Active' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-[#0d1018] text-neutral-400 border-[#222738]'
                    }`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {u.id !== 1 && (
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="h-8 w-8 rounded-lg bg-rose-950/20 hover:bg-rose-950/50 text-rose-400 border border-rose-900/40 hover:border-rose-700/60 transition-all inline-flex items-center justify-center"
                        title="Remove User"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Password Security */}
      <div className="p-5 sm:p-6 rounded-xl bg-[#12151f] border border-[#222738] space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#222738]">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Lock className={`w-4 h-4 ${activeWebsite?.accentText || 'text-blue-400'}`} />
            <span>Account Security & Password</span>
          </h3>
          {passFeedback?.success && (
            <span className="text-xs text-emerald-400 font-extrabold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> {passFeedback.success}
            </span>
          )}
          {passFeedback?.error && (
            <span className="text-xs text-rose-400 font-extrabold flex items-center gap-1">
              <AlertCircle className="w-4 h-4" /> {passFeedback.error}
            </span>
          )}
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs sm:text-sm max-w-md">
          <div>
            <label className="block text-neutral-300 font-semibold mb-1">Current Password</label>
            <input
              type="password"
              required
              value={passwords.current}
              onChange={e => setPasswords({ ...passwords, current: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#0d1018] border border-[#222738] text-white focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 focus:bg-[#161a28] transition-all"
            />
          </div>

          <div>
            <label className="block text-neutral-300 font-semibold mb-1">New Password</label>
            <input
              type="password"
              required
              value={passwords.new}
              onChange={e => setPasswords({ ...passwords, new: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#0d1018] border border-[#222738] text-white focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 focus:bg-[#161a28] transition-all"
            />
          </div>

          <div>
            <label className="block text-neutral-300 font-semibold mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              value={passwords.confirm}
              onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#0d1018] border border-[#222738] text-white focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 focus:bg-[#161a28] transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isChangingPass}
            className="h-9 px-5 rounded-lg bg-[#0d1018] hover:bg-[#161a28] text-neutral-200 hover:text-white border border-[#222738] font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
          >
            <Lock className={`w-3.5 h-3.5 ${activeWebsite?.accentText || 'text-blue-400'}`} />
            <span>{isChangingPass ? 'Updating...' : 'Update Password'}</span>
          </button>
        </form>
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-70 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#12151f] border border-[#222738] rounded-xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#222738]">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <UserPlus className={`w-4 h-4 ${activeWebsite?.accentText || 'text-blue-400'}`} />
                <span>Add Admin User</span>
              </h3>
              <button onClick={() => setShowAddUserModal(false)} className="text-neutral-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="e.g. Alex Morgan"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#0d1018] border border-[#222738] text-white focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 focus:bg-[#161a28] transition-all"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="alex@example.com"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#0d1018] border border-[#222738] text-white focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 focus:bg-[#161a28] transition-all"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Role</label>
                <select
                  value={newUser.role}
                  onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#0d1018] border border-[#222738] text-white focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 focus:bg-[#161a28] transition-all"
                >
                  <option value="Normal User">Normal User</option>
                  <option value="Super User">Super User</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#222738]">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="h-9 px-4 rounded-lg bg-[#0d1018] hover:bg-[#161a28] text-neutral-300 hover:text-white font-semibold text-xs sm:text-sm border border-[#222738] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`h-9 px-5 rounded-lg bg-gradient-to-r ${activeWebsite?.gradient || 'from-blue-600 to-indigo-600'} text-white font-extrabold text-xs sm:text-sm shadow-md ${activeWebsite?.glow || 'shadow-blue-500/20'} hover:brightness-110 transition-all`}
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
