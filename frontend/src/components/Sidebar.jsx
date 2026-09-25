import React from 'react';
import { 
  LayoutDashboard, 
  Briefcase, 
  Cpu, 
  FolderKanban, 
  Mail, 
  User, 
  HelpCircle, 
  Settings, 
  LogOut
} from 'lucide-react';

export default function Sidebar({ 
  currentPage, 
  onNavigate, 
  activeWebsite, 
  isOpen, 
  onClose 
}) {
  const middleNavItems = [
    { id: 'manage-experiences', label: 'Experiences', icon: Briefcase },
    { id: 'manage-skills', label: 'Skills', icon: Cpu },
    { id: 'manage-projects', label: 'Projects', icon: FolderKanban },
    { id: 'manage-contacts', label: 'Messages', icon: Mail },
    { id: 'manage-faq', label: 'FAQs', icon: HelpCircle },
    { id: 'manage-portfolio', label: 'Details', icon: User },
    { id: 'manage-settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (id) => {
    onNavigate(id);
    if (onClose) onClose();
  };

  const gradient = activeWebsite?.gradient || 'from-blue-600 to-indigo-600';
  const accentText = activeWebsite?.accentText || 'text-blue-400';
  const accentBg = activeWebsite?.accentBg || 'bg-blue-500/15';
  const accentBorder = activeWebsite?.accentBorder || 'border-blue-500/30';
  const glow = activeWebsite?.glow || 'shadow-blue-500/20';

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-35 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar docked below top-16 header (w-48) */}
      <aside className={`fixed left-0 top-16 bottom-0 h-[calc(100vh-4rem)] w-48 bg-[#0c0e15]/98 backdrop-blur-2xl border-r border-[#222738] z-30 flex flex-col justify-between select-none transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>

        {/* Top Section: Dashboard Nav Button */}
        <div className="p-2.5 pb-2.5 border-b border-[#222738]">
          <button
            onClick={() => handleNavClick('dashboard')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
              currentPage === 'dashboard'
                ? `bg-gradient-to-r ${gradient} text-white shadow-md ${glow}`
                : 'text-neutral-300 hover:text-white hover:bg-[#161a28]'
            }`}
          >
            <LayoutDashboard className={`w-4 h-4 ${currentPage === 'dashboard' ? 'text-white' : accentText}`} />
            <span>Dashboard</span>
          </button>
        </div>

        {/* Middle Section: Navigation Modules */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
          {middleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-150 border ${
                  isActive
                    ? `${accentBg} ${accentText} ${accentBorder} font-bold shadow-sm`
                    : 'text-neutral-300 hover:text-white hover:bg-[#161a28] border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? accentText : 'text-neutral-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Bottom Section: Logout Button */}
        <div className="p-2.5 border-t border-[#222738]">
          <button
            onClick={() => handleNavClick('manage-logout')}
            className="w-full py-2.5 px-3 rounded-lg bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/30 hover:border-rose-700/50 text-rose-400 text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 shadow-sm group"
          >
            <LogOut className="w-4 h-4 text-rose-400 group-hover:-translate-x-0.5 transition-transform flex-shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
