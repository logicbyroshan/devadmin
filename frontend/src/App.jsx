import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import ExperiencesView from './components/ExperiencesView';
import SkillsView from './components/SkillsView';
import ProjectsView from './components/ProjectsView';
import BlogsView from './components/BlogsView';
import MessagesView from './components/MessagesView';
import DetailsView from './components/DetailsView';
import FaqsView from './components/FaqsView';
import SettingsView from './components/SettingsView';
import LogoutModal from './components/LogoutModal';
import LoginView from './components/LoginView';
import { useAuth } from './context/AuthContext';

export const DEVMATE_SITE = { 
  id: 'dev-mate', 
  slug: 'dev-mate',
  name: 'DevMate', 
  badge: 'DevMate', 
  tag: 'In-Browser Cloud Sandbox & Code IDE', 
  primaryColor: 'violet',
  accentText: 'text-violet-400',
  accentBg: 'bg-violet-500/15',
  accentBorder: 'border-violet-500/30',
  badgeStyle: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
  gradient: 'from-violet-600 to-indigo-600',
  glow: 'shadow-violet-500/20',
  dotColor: 'bg-violet-400',
  heatmapColors: {
    4: 'bg-violet-400 shadow-sm shadow-violet-400/50',
    3: 'bg-violet-500/80',
    2: 'bg-violet-600/50',
    1: 'bg-violet-950/60 border border-violet-500/20',
  }
};

// Single-site admin � DevMate portfolio only

export default function App() {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleNavigate = (page) => {
    if (page === 'manage-logout') {
      setShowLogoutModal(true);
    } else {
      setCurrentPage(page);
      window.scrollTo(0, 0);
    }
  };

  const handleConfirmLogout = () => {
    logout();
    setShowLogoutModal(false);
  };

  // Initial session verification loader
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-slate-100 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          <p className="text-xs font-bold text-neutral-400 tracking-wider uppercase">Verifying Superadmin Session...</p>
        </div>
      </div>
    );
  }

  // Strict Authentication Gate: Non-superadmin / unauthenticated users cannot access console
  if (!isAuthenticated) {
    return (
      <LoginView
        onLoginSuccess={() => {
          setCurrentPage('dashboard');
        }}
      />
    );
  }

  const selectedSite = DEVMATE_SITE;

  return (
    <div className="min-h-screen bg-black text-slate-100 flex flex-col selection:bg-violet-500/30 selection:text-violet-200 overflow-x-hidden">
      {/* Container wrapper locking layout above 1920px */}
      <div className="w-full max-w-[1920px] mx-auto min-h-screen flex flex-col relative">
        {/* Fixed Navbar (Full-Width Header) */}
        <Navbar 
          onNavigate={handleNavigate} 
          currentPage={currentPage}
          activeWebsite={selectedSite}
          isMobileSidebarOpen={isMobileSidebarOpen}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />

        {/* Main Body Container */}
        <div className="flex flex-1 pt-16">
          {/* Sidebar */}
          <Sidebar 
            currentPage={currentPage} 
            onNavigate={handleNavigate} 
            activeWebsite={selectedSite}
            isOpen={isMobileSidebarOpen}
            onClose={() => setIsMobileSidebarOpen(false)}
          />

          {/* Main View Area (w-48 sidebar offset) */}
          <main className="flex-1 ml-0 md:ml-48 p-3.5 sm:p-5 min-h-[calc(100vh-4rem)] w-full overflow-x-hidden">
            {currentPage === 'dashboard' && (
              <DashboardView 
                onNavigate={handleNavigate} 
                activeWebsite={selectedSite}
              />
            )}
            {currentPage === 'manage-experiences' && (
              <ExperiencesView 
                onNavigate={handleNavigate} 
                activeWebsite={selectedSite} 
              />
            )}
            {currentPage === 'manage-skills' && (
              <SkillsView 
                onNavigate={handleNavigate} 
                activeWebsite={selectedSite} 
              />
            )}
            {currentPage === 'manage-projects' && (
              <ProjectsView 
                onNavigate={handleNavigate} 
                activeWebsite={selectedSite} 
              />
            )}
            {currentPage === 'manage-blogs' && (
              <BlogsView 
                onNavigate={handleNavigate} 
                activeWebsite={selectedSite} 
              />
            )}
            {currentPage === 'manage-contacts' && (
              <MessagesView 
                onNavigate={handleNavigate} 
                activeWebsite={selectedSite} 
              />
            )}
            {currentPage === 'manage-portfolio' && (
              <DetailsView 
                onNavigate={handleNavigate} 
                activeWebsite={selectedSite} 
              />
            )}
            {currentPage === 'manage-faq' && (
              <FaqsView 
                onNavigate={handleNavigate} 
                activeWebsite={selectedSite} 
              />
            )}
            {currentPage === 'manage-settings' && (
              <SettingsView 
                onNavigate={handleNavigate} 
                activeWebsite={selectedSite} 
              />
            )}
          </main>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <LogoutModal
          onCancel={() => setShowLogoutModal(false)}
          onConfirmLogout={handleConfirmLogout}
        />
      )}
    </div>
  );
}
