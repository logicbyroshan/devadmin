import React, { useState, useEffect, useRef } from 'react';
import { Bell, Calendar, ChevronDown, Sparkles, Check, Menu, X, User, LogOut, KeyRound, ShieldCheck, Terminal, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ 
  onNavigate, 
  currentPage, 
  activeWebsite, 
  isMobileSidebarOpen, 
  onToggleMobileSidebar 
}) {
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navRef = useRef(null);

  // Close all dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setShowNotifications(false);
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const [notifications, setNotifications] = useState([]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const accentText = activeWebsite?.accentText || 'text-violet-400';
  const dotColor = activeWebsite?.dotColor || 'bg-violet-400';
  const badgeStyle = activeWebsite?.badgeStyle || 'bg-violet-500/20 text-violet-300 border-violet-500/40';

  return (
    <header 
      ref={navRef} 
      className="fixed top-0 left-0 right-0 z-40 h-16 flex items-center justify-between border-b border-[#222738] bg-[#0c0e15]/95 px-4 sm:px-6 backdrop-blur-2xl transition-all duration-200"
    >
      {/* Left: Mobile Toggle & Dedicated DevMate Suite Badge */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          aria-label="Toggle Navigation Menu"
          className="md:hidden p-2 rounded-lg bg-[#12151f] border border-[#222738] text-neutral-300 hover:text-white transition-colors"
        >
          {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Dedicated DevMate Target Project Badge (Static - No Dropdown) */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#12151f] border border-violet-500/40 shadow-lg shadow-violet-500/10 backdrop-blur-xl select-none group">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-violet-500"></span>
            </span>
            <div className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-xs font-black tracking-wider text-white uppercase font-accent">
                DevMate
              </span>
            </div>
          </div>
          <span className={`inline-flex items-center text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeStyle}`}>
            Target Admin
          </span>
        </div>
      </div>

      {/* Right: Date, Notifications & User Session */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Date Widget (Desktop) */}
        <div className="hidden lg:flex items-center gap-2 px-3 h-9 rounded-lg bg-[#12151f] border border-[#222738] text-xs font-semibold text-neutral-300 select-none">
          <Calendar className={`w-3.5 h-3.5 ${accentText}`} />
          <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            aria-label="Notifications"
            className="relative h-9 w-9 flex items-center justify-center rounded-lg bg-[#12151f] border border-[#222738] text-neutral-400 hover:text-white hover:border-neutral-600 transition-all duration-200"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className={`absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full ${dotColor} text-[10px] font-bold text-slate-950 animate-pulse`}>
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-xl bg-[#12151f] border border-[#222738] shadow-2xl p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl">
              <div className="flex items-center justify-between pb-2 border-b border-[#222738] mb-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                  <Sparkles className={`w-3.5 h-3.5 ${accentText}`} /> Notifications
                </h4>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllRead}
                    className={`text-xs ${accentText} hover:underline flex items-center gap-1 font-semibold`}
                  >
                    <Check className="w-3.5 h-3.5" /> Mark all read
                  </button>
                )}
              </div>
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="text-center py-4 text-neutral-400 text-xs">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-2.5 rounded-lg text-xs transition-colors ${
                        n.read ? 'bg-[#0d1018] text-neutral-400 border border-[#222738]' : `${activeWebsite?.accentBg || 'bg-violet-500/15'} text-neutral-200 border ${activeWebsite?.accentBorder || 'border-violet-500/30'}`
                      }`}
                    >
                      <p className="line-clamp-2">{n.text}</p>
                      <span className="text-[11px] text-neutral-400 mt-1 block">{n.time}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile / Auth Session Button */}
        {isAuthenticated ? (
          <div className="relative">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              className="h-9 flex items-center gap-2.5 px-2.5 rounded-lg bg-[#12151f] border border-[#222738] hover:border-neutral-600 transition-all duration-200 select-none"
            >
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center ring-1 ring-neutral-700">
                {user?.username?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-extrabold text-neutral-200 leading-tight font-accent">
                  {user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : (user?.name || user?.username || 'Superadmin')}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#12151f] border border-[#222738] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl">
                <div className="px-3 py-2 border-b border-[#222738] mb-1">
                  <div className="text-xs font-bold text-white font-accent">
                    {user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : (user?.name || user?.username || 'Superadmin')}
                  </div>
                  <div className="text-[11px] text-neutral-400 truncate">{user?.email || 'admin@localhost'}</div>
                  <span className={`mt-1 inline-block text-[10px] px-2 py-0.5 rounded-full ${badgeStyle} font-semibold`}>
                    {user?.is_superuser ? 'Super Administrator' : 'Staff Admin'}
                  </span>
                </div>

                <div className="space-y-0.5 text-xs">
                  <button
                    onClick={() => {
                      onNavigate('manage-portfolio');
                      setShowProfileMenu(false);
                    }}
                    className="w-full px-3 py-2 rounded-lg text-neutral-300 hover:bg-[#1f2436] hover:text-white flex items-center gap-2 transition-colors"
                  >
                    <User className="w-4 h-4 text-neutral-400" />
                    <span>Edit Profile Details</span>
                  </button>

                  <button
                    onClick={() => {
                      onNavigate('manage-settings');
                      setShowProfileMenu(false);
                    }}
                    className="w-full px-3 py-2 rounded-lg text-neutral-300 hover:bg-[#1f2436] hover:text-white flex items-center gap-2 transition-colors"
                  >
                    <KeyRound className="w-4 h-4 text-neutral-400" />
                    <span>Security & Password</span>
                  </button>

                  <div className="border-t border-[#222738] my-1"></div>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onNavigate('manage-logout');
                    }}
                    className="w-full px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 flex items-center gap-2 transition-colors font-semibold"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={openAuthModal}
            className={`h-9 px-4 rounded-lg bg-gradient-to-r ${activeWebsite?.gradient || 'from-violet-600 to-indigo-600'} hover:brightness-110 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-violet-500/20 transition-all select-none`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
}
