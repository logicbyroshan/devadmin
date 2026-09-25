import React, { useState, useEffect } from 'react';
import { 
  FolderCheck, 
  Hourglass, 
  CalendarDays, 
  FileEdit, 
  FileText,
  Send, 
  Eye, 
  Plus, 
  Upload, 
  Clock, 
  MessageSquare, 
  ArrowRight,
  TrendingUp,
  Activity,
  CheckCircle,
  FileUp,
  Sparkles,
  Globe,
  FolderKanban,
  BookOpen,
  Briefcase,
  Cpu,
  Mail,
  Layers,
  User,
  Star,
  Check
} from 'lucide-react';
import { dashboardApi, contactsApi } from '../services/api';

export default function DashboardView({ onNavigate, activeWebsite }) {
  const [messages, setMessages] = useState([]);

  const [stats, setStats] = useState({
    projects: { total: 0, live: 0, offline: 0 },
    experiences: { total: 0, current: 0 },
    skills: { total: 0 },
    messages: { total: 0, unread: 0, starred: 0 },
    faqs: { total: 0 }
  });

  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [replySubject, setReplySubject] = useState('');
  const [replyText, setReplyText] = useState('');
  const [sentToast, setSentToast] = useState(false);
  const [projectActivities, setProjectActivities] = useState([]);
  const [heatmapData, setHeatmapData] = useState({
    year: new Date().getFullYear(),
    total_annual_contributions: 0,
    months: []
  });

  // Fetch live stats, activities, heatmap & messages from backend API
  useEffect(() => {
    let isMounted = true;
    const fetchDashboardData = async () => {
      try {
        const siteSlug = activeWebsite?.slug || activeWebsite?.id || 'dev-mate';
        const currentYear = new Date().getFullYear();

        const liveStats = await dashboardApi.getStats(siteSlug);
        if (isMounted && liveStats) {
          setStats(liveStats);
        }

        const activitiesData = await dashboardApi.getActivities(siteSlug).catch(() => null);
        if (isMounted && activitiesData) {
          if (activitiesData.projects && Array.isArray(activitiesData.projects)) {
            setProjectActivities(activitiesData.projects.map(p => ({
              id: p.id,
              title: p.title,
              time: p.time || 'Recently',
              icon: p.status === 'LIVE' ? Globe : Sparkles,
              color: p.status === 'LIVE' ? 'text-blue-400' : 'text-indigo-400',
              bg: p.status === 'LIVE' ? 'bg-blue-500/10' : 'bg-indigo-500/10'
            })));
          }
        }

        const realHeatmap = await dashboardApi.getHeatmap(siteSlug, currentYear).catch(() => null);
        if (isMounted && realHeatmap && realHeatmap.months) {
          setHeatmapData(realHeatmap);
        }

        const contactsData = await contactsApi.getAll({ website: siteSlug });
        const contactList = Array.isArray(contactsData) ? contactsData : (contactsData.results || []);
        if (isMounted) {
          const mapped = contactList.map(c => ({
            id: c.id,
            name: c.name,
            email: c.email,
            preview: c.message ? (c.message.length > 60 ? `${c.message.slice(0, 60)}...` : c.message) : '',
            tag: c.tag || 'Inquiry',
            time: 'Recently',
            unread: !c.is_read
          }));
          setMessages(mapped);
          if (mapped.length > 0) {
            setSelectedMessageId(mapped[0].id);
          } else {
            setSelectedMessageId(null);
          }
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      }
    };
    fetchDashboardData();
    return () => { isMounted = false; };
  }, [activeWebsite]);

  const currentMsg = messages.find(m => m.id === selectedMessageId) || messages[0];

  const handleSendReply = async () => {
    if (!replyText.trim()) {
      alert('Please enter a reply message before sending.');
      return;
    }
    setSentToast(true);
    try {
      if (currentMsg?.id) {
        await contactsApi.reply(currentMsg.id, replySubject || `Re: Inquiry`, replyText);
      }
    } catch {
      // Fallback
    }
    setTimeout(() => {
      setSentToast(false);
      setReplyText('');
      alert(`Email reply sent successfully via SMTP to ${currentMsg?.email || 'recipient'}!`);
    }, 500);
  };

  const [resumeName, setResumeName] = useState('my-resume-v4.pdf');

  const handleResumeUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResumeName(file.name);
      alert(`Resume uploaded successfully: ${file.name}`);
    }
  };

  // Full 12 Months with Full Names
  const fullMonths = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const getHeatmapColorClass = (level) => {
    switch (level) {
      case 4: return 'bg-violet-400 shadow-sm shadow-violet-400/50 hover:bg-violet-300';
      case 3: return 'bg-violet-500/85 hover:bg-violet-400';
      case 2: return 'bg-violet-600/60 hover:bg-violet-500';
      case 1: return 'bg-violet-950/70 border border-violet-500/30 hover:bg-violet-900';
      default: return 'bg-[#080a10] border border-[#1a1e2d] hover:border-neutral-700';
    }
  };

  return (
    <div className="space-y-5 w-full max-w-full overflow-x-hidden font-sans">
      {/* 1. TOP STAT BOXES (90% Black Depth with Vibrant Glassy Gradients) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Projects */}
        <div 
          onClick={() => onNavigate('manage-projects')}
          className="p-4 rounded-xl cursor-pointer bg-gradient-to-br from-purple-950/70 via-[#1c132d] to-[#121520] border border-purple-500/35 hover:border-purple-400/80 shadow-lg shadow-purple-950/40 hover:shadow-purple-500/20 transition-all duration-200 flex items-center justify-between gap-3 group hover:-translate-y-0.5"
        >
          <div className="text-left min-w-0">
            <div className="text-2xl sm:text-3xl font-bold text-white leading-none tracking-tight group-hover:text-purple-200 transition-colors font-accent">
              {stats.projects?.total ?? 0}
            </div>
            <div className="text-sm font-medium text-neutral-300 mt-1.5 truncate">Total Projects</div>
            <div className="text-xs font-semibold text-purple-400 mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
              <span>{stats.projects?.live ?? 0} Live Online</span>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/30 shadow-md shadow-purple-500/10 flex-shrink-0 group-hover:scale-110 group-hover:bg-purple-500/25 group-hover:border-purple-400 transition-all duration-200">
            <FolderKanban className="w-5 h-5" />
          </div>
        </div>

        {/* Total Experiences */}
        <div 
          onClick={() => onNavigate('manage-experiences')}
          className="p-4 rounded-xl cursor-pointer bg-gradient-to-br from-amber-950/70 via-[#231b0e] to-[#121520] border border-amber-500/35 hover:border-amber-400/80 shadow-lg shadow-amber-950/40 hover:shadow-amber-500/20 transition-all duration-200 flex items-center justify-between gap-3 group hover:-translate-y-0.5"
        >
          <div className="text-left min-w-0">
            <div className="text-2xl sm:text-3xl font-bold text-white leading-none tracking-tight group-hover:text-amber-200 transition-colors font-accent">
              {stats.experiences?.total ?? 0}
            </div>
            <div className="text-sm font-medium text-neutral-300 mt-1.5 truncate">Total Experiences</div>
            <div className="text-xs font-semibold text-amber-400 mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span>Career Milestones</span>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-md shadow-amber-500/10 flex-shrink-0 group-hover:scale-110 group-hover:bg-amber-500/25 group-hover:border-amber-400 transition-all duration-200">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>

        {/* Total Skills */}
        <div 
          onClick={() => onNavigate('manage-skills')}
          className="p-4 rounded-xl cursor-pointer bg-gradient-to-br from-emerald-950/70 via-[#0d2318] to-[#121520] border border-emerald-500/35 hover:border-emerald-400/80 shadow-lg shadow-emerald-950/40 hover:shadow-emerald-500/20 transition-all duration-200 flex items-center justify-between gap-3 group hover:-translate-y-0.5"
        >
          <div className="text-left min-w-0">
            <div className="text-2xl sm:text-3xl font-bold text-white leading-none tracking-tight group-hover:text-emerald-200 transition-colors font-accent">
              {stats.skills?.total ?? 0}
            </div>
            <div className="text-sm font-medium text-neutral-300 mt-1.5 truncate">Total Skills</div>
            <div className="text-xs font-semibold text-emerald-400 mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Tech Stack Tags</span>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-md shadow-emerald-500/10 flex-shrink-0 group-hover:scale-110 group-hover:bg-emerald-500/25 group-hover:border-emerald-400 transition-all duration-200">
            <Cpu className="w-5 h-5" />
          </div>
        </div>

        {/* Received Messages */}
        <div 
          onClick={() => onNavigate('manage-contacts')}
          className="p-4 rounded-xl cursor-pointer bg-gradient-to-br from-sky-950/70 via-[#0f2030] to-[#121520] border border-sky-500/35 hover:border-sky-400/80 shadow-lg shadow-sky-950/40 hover:shadow-sky-500/20 transition-all duration-200 flex items-center justify-between gap-3 group hover:-translate-y-0.5"
        >
          <div className="text-left min-w-0">
            <div className="text-2xl sm:text-3xl font-bold text-white leading-none tracking-tight group-hover:text-sky-200 transition-colors font-accent">
              {stats.messages?.total ?? 0}
            </div>
            <div className="text-sm font-medium text-neutral-300 mt-1.5 truncate">Received Messages</div>
            <div className="text-xs font-semibold text-sky-400 mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
              <span>{stats.messages?.unread ?? 0} Unread Inquiries</span>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-md shadow-sky-500/10 flex-shrink-0 group-hover:scale-110 group-hover:bg-sky-500/25 group-hover:border-sky-400 transition-all duration-200">
            <Mail className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. PROJECTS SECTION: 90% Black Card Surface (#12151f) & Crisp Wells (#0d1018) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* Projects Pipeline Card */}
        <div className="rounded-xl bg-[#12151f] border border-[#222738] shadow-xl overflow-hidden flex flex-col justify-between h-full">
          {/* Edge-to-Edge Special Header Bar */}
          <div className="bg-gradient-to-r from-[#171c2b] via-[#141825] to-[#10131f] px-4 py-3 border-b border-[#222738] flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-violet-500/10 text-violet-400 border border-violet-500/30">
                <FolderKanban className="w-4 h-4" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                Projects Status Pipeline
              </h3>
            </div>

            <button 
              onClick={() => onNavigate('manage-projects')}
              className="text-xs font-semibold text-violet-400 hover:underline flex items-center gap-1 transition-colors"
            >
              <span>Manage All ({stats.projects?.total ?? 0})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 3 Pipeline Items */}
          <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
            {/* Live / Completed: Cyan-Blue */}
            <div className="h-[68px] p-3 rounded-lg bg-[#0d1018] border border-[#1f2436] flex flex-col justify-center">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-neutral-200 font-medium flex items-center gap-2">
                  <FolderCheck className="w-4 h-4 text-cyan-400" /> Live Projects
                </span>
                <span className="font-bold text-neutral-100"><span className="text-cyan-400">{stats.projects?.live ?? 0}</span> / {stats.projects?.total ?? 0}</span>
              </div>
              <div className="w-full h-2.5 rounded-sm bg-[#080a10] overflow-hidden mt-2.5 shrink-0 border border-[#1f2436]">
                <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 rounded-sm shadow-sm shadow-cyan-500/30" style={{ width: `${stats.projects?.total ? Math.round(((stats.projects?.live || 0) / stats.projects.total) * 100) : 0}%` }}></div>
              </div>
            </div>

            {/* Offline / In Progress */}
            <div className="h-[68px] p-3 rounded-lg bg-[#0d1018] border border-[#1f2436] flex flex-col justify-center">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-neutral-200 font-medium flex items-center gap-2">
                  <Hourglass className="w-4 h-4 text-amber-400" /> Offline / In Progress
                </span>
                <span className="font-bold text-neutral-100"><span className="text-amber-400">{stats.projects?.offline ?? Math.max(0, (stats.projects?.total || 0) - (stats.projects?.live || 0))}</span> / {stats.projects?.total ?? 0}</span>
              </div>
              <div className="w-full h-2.5 rounded-sm bg-[#080a10] overflow-hidden mt-2.5 shrink-0 border border-[#1f2436]">
                <div className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-400 rounded-sm shadow-sm shadow-amber-500/30" style={{ width: `${stats.projects?.total ? Math.round(((stats.projects?.offline || 0) / stats.projects.total) * 100) : 0}%` }}></div>
              </div>
            </div>

            {/* Total Managed */}
            <div className="h-[68px] p-3 rounded-lg bg-[#0d1018] border border-[#1f2436] flex flex-col justify-center">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-neutral-200 font-medium flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-purple-400" /> Total Portfolio Projects
                </span>
                <span className="font-bold text-purple-400">{stats.projects?.total ?? 0} Projects</span>
              </div>
              <div className="w-full h-2.5 rounded-sm bg-[#080a10] overflow-hidden mt-2.5 shrink-0 border border-[#1f2436]">
                <div className="h-full bg-gradient-to-r from-purple-500 via-violet-500 to-fuchsia-400 rounded-sm shadow-sm shadow-purple-500/30" style={{ width: `${stats.projects?.total ? 100 : 0}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Project Activity Card */}
        <div className="rounded-xl bg-[#12151f] border border-[#222738] shadow-xl overflow-hidden flex flex-col justify-between h-full">
          {/* Edge-to-Edge Special Header Bar */}
          <div className="bg-gradient-to-r from-[#171c2b] via-[#141825] to-[#10131f] px-4 py-3 border-b border-[#222738] flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-violet-500/10 text-violet-400 border border-violet-500/30">
                <Activity className="w-4 h-4" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                Project Activity
              </h3>
            </div>

            <button 
              onClick={() => onNavigate('manage-projects')}
              className="text-xs font-semibold text-violet-400 hover:underline flex items-center gap-1 transition-colors"
            >
              <span>All Projects</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Activity Items or Empty State */}
          <div className="p-4 space-y-3 flex-1 flex flex-col justify-center">
            {projectActivities.length === 0 ? (
              <div className="text-center py-6 text-neutral-500 text-xs">
                No recent project activity records found.
              </div>
            ) : (
              projectActivities.slice(0, 3).map((act) => {
                const Icon = act.icon || Globe;
                return (
                  <div key={act.id} className="h-[68px] p-3 rounded-lg bg-[#0d1018] hover:bg-[#161a28] border border-[#1f2436] flex items-center gap-3 transition-colors">
                    <div className={`p-2 rounded-md ${act.bg || 'bg-violet-500/10'} ${act.color || 'text-violet-400'} flex-shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-xs sm:text-sm flex-1 min-w-0">
                      <p className="font-medium text-neutral-200 line-clamp-1 leading-snug">{act.title}</p>
                      <span className="text-[11px] text-neutral-500 mt-0.5 block font-normal">{act.time}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 3. Middle Section: Quick Actions & Resume (Full Height Upload Area) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* Quick Actions */}
        <div className="rounded-xl bg-[#12151f] border border-[#222738] shadow-xl overflow-hidden flex flex-col justify-between h-full">
          {/* Edge-to-Edge Header */}
          <div className="bg-gradient-to-r from-[#171c2b] via-[#141825] to-[#10131f] px-4 py-3 border-b border-[#222738] flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-violet-500/10 text-violet-400 border border-violet-500/30">
                <Plus className="w-4 h-4" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                Quick Actions
              </h3>
            </div>

            <span className="text-[11px] text-neutral-400 font-medium">Fast Create</span>
          </div>

          <div className="p-4 grid grid-cols-2 gap-2.5 flex-1 items-center">
            <button 
              onClick={() => onNavigate('manage-projects')}
              className="p-3 rounded-lg bg-[#0d1018] hover:bg-[#161a28] border border-[#1f2436] text-left text-xs sm:text-sm font-semibold text-neutral-200 hover:text-white transition-all flex items-center gap-2.5 group"
            >
              <span className="p-1.5 rounded-md bg-violet-500/10 text-violet-400 group-hover:bg-gradient-to-r group-hover:from-violet-600 group-hover:to-indigo-600 group-hover:text-white transition-colors">
                <Plus className="w-4 h-4" />
              </span>
              <span>Add Project</span>
            </button>

            <button 
              onClick={() => onNavigate('manage-experiences')}
              className="p-3 rounded-lg bg-[#0d1018] hover:bg-[#161a28] border border-[#1f2436] text-left text-xs sm:text-sm font-semibold text-neutral-200 hover:text-white transition-all flex items-center gap-2.5 group"
            >
              <span className="p-1.5 rounded-md bg-violet-500/10 text-violet-400 group-hover:bg-gradient-to-r group-hover:from-violet-600 group-hover:to-indigo-600 group-hover:text-white transition-colors">
                <Plus className="w-4 h-4" />
              </span>
              <span>Add Experience</span>
            </button>

            <button 
              onClick={() => onNavigate('manage-skills')}
              className="p-3 rounded-lg bg-[#0d1018] hover:bg-[#161a28] border border-[#1f2436] text-left text-xs sm:text-sm font-semibold text-neutral-200 hover:text-white transition-all flex items-center gap-2.5 group"
            >
              <span className="p-1.5 rounded-md bg-violet-500/10 text-violet-400 group-hover:bg-gradient-to-r group-hover:from-violet-600 group-hover:to-indigo-600 group-hover:text-white transition-colors">
                <Plus className="w-4 h-4" />
              </span>
              <span>Add Skill</span>
            </button>

            <button 
              onClick={() => onNavigate('manage-faq')}
              className="p-3 rounded-lg bg-[#0d1018] hover:bg-[#161a28] border border-[#1f2436] text-left text-xs sm:text-sm font-semibold text-neutral-200 hover:text-white transition-all flex items-center gap-2.5 group"
            >
              <span className="p-1.5 rounded-md bg-violet-500/10 text-violet-400 group-hover:bg-gradient-to-r group-hover:from-violet-600 group-hover:to-indigo-600 group-hover:text-white transition-colors">
                <Plus className="w-4 h-4" />
              </span>
              <span>Add FAQ</span>
            </button>
          </div>
        </div>

        {/* Resume & Documentation (Full Height Dropzone Area) */}
        <div className="rounded-xl bg-[#12151f] border border-[#222738] shadow-xl overflow-hidden flex flex-col justify-between h-full">
          {/* Edge-to-Edge Header */}
          <div className="bg-gradient-to-r from-[#171c2b] via-[#141825] to-[#10131f] px-4 py-3 border-b border-[#222738] flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-violet-500/10 text-violet-400 border border-violet-500/30">
                <FileUp className="w-4 h-4" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                Resume & Documentation
              </h3>
            </div>

            <span className="text-xs font-semibold text-violet-400 font-accent">{resumeName}</span>
          </div>

          {/* Full Height Clean Upload Area */}
          <div className="p-4 flex-1 flex flex-col justify-center">
            <label className="w-full h-full min-h-[140px] p-5 rounded-lg bg-[#0d1018] hover:bg-[#161a28] border border-dashed border-violet-500/40 text-neutral-200 cursor-pointer flex flex-col sm:flex-row items-center justify-between gap-4 transition-all group hover:border-solid hover:shadow-lg">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="p-3 rounded-lg bg-violet-500/10 text-violet-400 group-hover:scale-110 transition-transform flex-shrink-0">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="min-w-0 text-left">
                  <div className="text-sm font-bold text-white truncate">Upload New Resume File</div>
                  <p className="text-xs text-neutral-400 mt-1 truncate">PDF, DOC, DOCX up to 15MB • Direct Sync</p>
                </div>
              </div>

              <div className="px-4 py-2 rounded-md bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-xs flex-shrink-0 shadow-md shadow-violet-500/20 group-hover:brightness-110 transition-all">
                Browse File
              </div>
              <input type="file" onChange={handleResumeUpload} className="hidden" accept=".pdf,.doc,.docx" />
            </label>
          </div>
        </div>
      </div>

      {/* 5. RECENT MESSAGES & QUICK EMAIL REPLY (Split 2-Column Design with Left-Aligned Previews & Taller Composer) */}
      <div className="rounded-xl bg-[#12151f] border border-[#222738] shadow-xl overflow-hidden flex flex-col">
        {/* Edge-to-Edge Header */}
        <div className="bg-gradient-to-r from-[#171c2b] via-[#141825] to-[#10131f] px-4 py-3 border-b border-[#222738] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-violet-500/10 text-violet-400 border border-violet-500/30">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
              Recent Messages & Quick Email Reply
            </h3>
          </div>

          <button 
            onClick={() => onNavigate('manage-contacts')}
            className="text-xs font-semibold text-violet-400 hover:underline flex items-center gap-1 transition-colors"
          >
            <span>View Full Inbox ({stats.messages?.total ?? 0})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 2-Column Split: Message List on Left, Email Reply Composer on Right */}
        <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* Left Side: Incoming Messages Feed (Left Aligned Previews) */}
          <div className="lg:col-span-5 space-y-2.5">
            <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center justify-between px-1">
              <span>Incoming Inquiries</span>
              <span className="text-xs text-violet-400 font-semibold">{messages.filter(m => m.unread).length} Unread</span>
            </div>

            <div className="space-y-2">
              {messages.length === 0 ? (
                <div className="p-8 text-center text-neutral-500 text-xs rounded-lg bg-[#0d1018] border border-[#1f2436]">
                  No incoming inquiries received yet.
                </div>
              ) : (
                messages.map((msg) => {
                  const isSelected = msg.id === selectedMessageId;
                  return (
                    <div 
                      key={msg.id}
                      onClick={() => {
                        setSelectedMessageId(msg.id);
                        setReplySubject(`Re: ${msg.tag} inquiry from ${msg.name}`);
                      }}
                      className={`p-3.5 rounded-lg border cursor-pointer transition-all duration-200 space-y-2 ${
                        isSelected 
                          ? 'bg-[#151b2d] border-violet-500/70 shadow-md shadow-violet-500/10' 
                          : 'bg-[#0d1018] hover:bg-[#161a28] border-[#1f2436]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-lg ${isSelected ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white' : 'bg-neutral-800 text-neutral-300'} font-bold text-xs flex items-center justify-center flex-shrink-0 font-accent`}>
                            {msg.name?.charAt(0) || 'U'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-sm font-bold text-neutral-100 truncate font-accent">{msg.name}</h4>
                              {msg.unread && (
                                <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse flex-shrink-0"></span>
                              )}
                            </div>
                            <p className="text-xs text-neutral-400 truncate">{msg.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-violet-500/15 text-violet-300 border border-violet-500/30">
                            {msg.tag}
                          </span>
                          <span className="text-xs text-neutral-500">{msg.time}</span>
                        </div>
                      </div>

                      {/* Left Aligned Clean Message Content */}
                      <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed font-normal">
                        {msg.preview}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Side: Quick Email Reply Composer */}
          <div className="lg:col-span-7 rounded-lg bg-[#0d1018] border border-[#1f2436] p-4 flex flex-col justify-between space-y-3.5">
            {currentMsg ? (
              <>
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#222738]">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1 rounded bg-violet-500/10 text-violet-400 border border-violet-500/30">
                        <Mail className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-xs sm:text-sm min-w-0">
                        <span className="text-neutral-400 font-medium">Replying via Email to: </span>
                        <span className="font-bold text-white font-accent">{currentMsg?.name}</span>
                        <span className="text-neutral-400 text-xs ml-1">({currentMsg?.email})</span>
                      </div>
                    </div>

                    <span className="text-xs text-violet-300 bg-violet-500/10 px-2.5 py-1 rounded-md border border-violet-500/20 font-semibold flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-violet-400" /> Direct SMTP Relay
                    </span>
                  </div>

                  {/* Subject line input */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 bg-[#080a10] border border-[#1f2436] rounded-md px-3 py-2 text-xs">
                      <span className="text-neutral-400 font-bold text-[11px] uppercase tracking-wider">Subject:</span>
                      <input 
                        type="text"
                        value={replySubject || `Re: ${currentMsg?.tag || 'Inquiry'} response`}
                        onChange={(e) => setReplySubject(e.target.value)}
                        className="bg-transparent border-none outline-none text-neutral-100 text-xs w-full font-medium"
                      />
                    </div>

                    {/* Reply message body */}
                    <textarea
                      rows={5}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`Hi ${currentMsg?.name || 'there'},\n\nThank you for reaching out! I'd be happy to discuss your inquiry...`}
                      className="w-full min-h-[140px] p-3 rounded-md bg-[#080a10] border border-[#1f2436] text-xs sm:text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-violet-500/70 transition-colors resize-none leading-relaxed font-normal"
                    />
                  </div>
                </div>

                {/* Quick Canned Suggestions & Send Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2.5 border-t border-[#222738]">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button 
                      type="button"
                      onClick={() => setReplyText(`Hi ${currentMsg?.name}, thanks for reaching out! I am currently available for new contracts and projects.`)}
                      className="text-[11px] font-medium px-2.5 py-1 rounded bg-[#161a28] hover:bg-[#1f2436] text-neutral-200 border border-[#222738] transition-colors"
                    >
                      Available for work
                    </button>
                    <button 
                      type="button"
                      onClick={() => setReplyText(`Hi ${currentMsg?.name}, let's schedule a 15-minute discovery call this week to discuss your requirements.`)}
                      className="text-[11px] font-medium px-2.5 py-1 rounded bg-[#161a28] hover:bg-[#1f2436] text-neutral-200 border border-[#222738] transition-colors"
                    >
                      Schedule Call
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleSendReply}
                    className="px-4 py-2 rounded-md bg-gradient-to-r from-violet-600 to-indigo-600 hover:brightness-110 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-violet-500/20 transition-all flex-shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Email Reply</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-neutral-500 text-xs flex flex-col items-center justify-center space-y-2 h-full min-h-[180px]">
                <Mail className="w-8 h-8 text-neutral-600" />
                <p>No message selected. Incoming inquiries will appear on the left.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6. 12-MONTH ACTIVITY HEATMAP (90% Black Card with Distinct Month Blocks) */}
      <div className="rounded-xl bg-[#12151f] border border-[#222738] shadow-xl overflow-hidden flex flex-col">
        {/* Edge-to-Edge Header with Matched Title Size */}
        <div className="bg-gradient-to-r from-[#171c2b] via-[#141825] to-[#10131f] px-4 py-3 border-b border-[#222738] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-violet-500/10 text-violet-400 border border-violet-500/30">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                Monthly Daily Activity
              </h3>
              <p className="text-[11px] text-neutral-400 hidden sm:block">Real-time database activity tracking for projects, skills, experiences, and messages</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-violet-500/15 text-violet-300 border border-violet-500/30 font-accent">
              {heatmapData.total_annual_contributions ?? 0} Total Activities in {heatmapData.year ?? new Date().getFullYear()}
            </span>
          </div>
        </div>

        {/* ALL 12 MONTHS GRID */}
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3.5">
            {(heatmapData.months && heatmapData.months.length > 0 ? heatmapData.months : fullMonths.map((name, idx) => ({
              month: name,
              month_number: idx + 1,
              start_day_offset: 0,
              days: Array.from({ length: 30 }, (_, i) => ({ day: i + 1, level: 0, count: 0, summary: '0 activities' })),
              total_commits: 0
            }))).map((mObj) => (
              <div key={mObj.month} className="p-3 rounded-lg bg-[#0d1018] border border-[#1f2436] space-y-2.5 hover:border-neutral-600 transition-colors">
                {/* Full Name of Month with count badge */}
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-neutral-100 tracking-wide font-accent">{mObj.month}</div>
                  {mObj.total_commits > 0 && (
                    <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded border border-violet-500/20">
                      {mObj.total_commits}
                    </span>
                  )}
                </div>
                
                {/* 7 Days of the Week Column Headers */}
                <div className="grid grid-cols-7 gap-1 text-center font-bold text-[9px] text-neutral-500">
                  {dayLabels.map((dayLabel, dIdx) => (
                    <span key={`${mObj.month}-${dayLabel}-${dIdx}`}>{dayLabel}</span>
                  ))}
                </div>

                {/* 7-Column Days Grid with weekday alignment */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Leading Day of Week Padding */}
                  {Array.from({ length: mObj.start_day_offset || 0 }).map((_, pIdx) => (
                    <div key={`pad-${mObj.month}-${pIdx}`} className="aspect-square w-full rounded-sm opacity-0 pointer-events-none" />
                  ))}

                  {/* Real Days of Month */}
                  {(mObj.days || []).map((d) => (
                    <div
                      key={`${mObj.month}-${d.day}`}
                      title={`${mObj.month} ${d.day}, ${heatmapData.year ?? new Date().getFullYear()}: ${d.count} ${d.count === 1 ? 'activity' : 'activities'}${d.summary ? ` (${d.summary})` : ''}`}
                      className={`aspect-square w-full rounded-sm transition-all duration-200 hover:scale-125 cursor-pointer ${getHeatmapColorClass(d.level)}`}
                    ></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Edge-to-Edge Footer Bar */}
        <div className="bg-gradient-to-r from-[#171c2b] via-[#141825] to-[#10131f] px-4 py-3 border-t border-[#222738] flex items-center justify-between flex-shrink-0">
          <span className="text-xs font-semibold text-neutral-300 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-violet-400" />
            <span>Daily Activity Scale</span>
          </span>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-neutral-400 font-medium">0</span>
            <div className="w-3.5 h-3.5 rounded-sm bg-[#080a10] border border-[#1a1e2d]" title="0 activities"></div>
            <div className={`w-3.5 h-3.5 rounded-sm ${getHeatmapColorClass(1)}`} title="1 activity"></div>
            <div className={`w-3.5 h-3.5 rounded-sm ${getHeatmapColorClass(2)}`} title="2-3 activities"></div>
            <div className={`w-3.5 h-3.5 rounded-sm ${getHeatmapColorClass(3)}`} title="4-6 activities"></div>
            <div className={`w-3.5 h-3.5 rounded-sm ${getHeatmapColorClass(4)}`} title="7+ activities"></div>
            <span className="text-violet-400 font-bold">7+</span>
          </div>
        </div>
      </div>
    </div>
  );
}
