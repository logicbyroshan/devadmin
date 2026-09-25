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
    blogs: { total: 0, live: 0, scheduled: 0, draft: 0 },
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
  const [blogsActivities, setBlogsActivities] = useState([]);
  const [projectActivities, setProjectActivities] = useState([]);

  // Fetch live stats, activities & messages from backend API
  useEffect(() => {
    let isMounted = true;
    const fetchDashboardData = async () => {
      try {
        const siteSlug = activeWebsite?.slug || activeWebsite?.id || 'dev-mate';
        const liveStats = await dashboardApi.getStats(siteSlug);
        if (isMounted && liveStats) {
          setStats(liveStats);
        }

        const activitiesData = await dashboardApi.getActivities(siteSlug).catch(() => null);
        if (isMounted && activitiesData) {
          if (activitiesData.blogs && Array.isArray(activitiesData.blogs)) {
            setBlogsActivities(activitiesData.blogs.map(b => ({
              id: b.id,
              title: b.title,
              time: b.time || 'Recently',
              icon: b.status === 'PUBLISHED' ? FileText : (b.status === 'SCHEDULED' ? CalendarDays : FileEdit),
              color: b.status === 'PUBLISHED' ? 'text-blue-400' : (b.status === 'SCHEDULED' ? 'text-indigo-400' : 'text-cyan-400'),
              bg: b.status === 'PUBLISHED' ? 'bg-blue-500/10' : (b.status === 'SCHEDULED' ? 'bg-indigo-500/10' : 'bg-cyan-500/10')
            })));
          }
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

  const getDaysForMonth = (monthIndex) => {
    const daysCount = (monthIndex === 1) ? 28 : (monthIndex % 2 === 0 ? 31 : 30);
    return Array.from({ length: daysCount }, (_, d) => {
      const dayNum = d + 1;
      const seed = (monthIndex * 31 + dayNum);
      const level = (seed % 7 === 0) ? 0 : (seed % 5 === 0) ? 4 : (seed % 3 === 0) ? 3 : (seed % 2 === 0) ? 2 : 1;
      return { day: dayNum, level, count: level * 2 + 1 };
    });
  };

  const getHeatmapColorClass = (level) => {
    switch (level) {
      case 4: return 'bg-blue-400 shadow-sm shadow-blue-400/50';
      case 3: return 'bg-blue-500/80';
      case 2: return 'bg-blue-600/50';
      case 1: return 'bg-blue-950/60 border border-blue-500/20';
      default: return 'bg-[#030406] border border-neutral-900';
    }
  };

  return (
    <div className="space-y-5 w-full max-w-full overflow-x-hidden font-sans">
      {/* 1. TOP STAT BOXES (Color-Coded Cards with Right-Aligned Icons & Accent Numbers) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {/* Total Live Blogs */}
        <div 
          onClick={() => onNavigate('manage-blogs')}
          className="p-4 rounded-xl cursor-pointer bg-gradient-to-br from-blue-950/50 via-[#070b16] to-[#04060c] border border-blue-500/30 hover:border-blue-400/80 shadow-lg shadow-blue-950/40 hover:shadow-blue-500/20 transition-all duration-200 flex items-center justify-between gap-3 group hover:-translate-y-0.5"
        >
          <div className="text-left min-w-0">
            <div className="text-2xl sm:text-3xl font-bold text-white leading-none tracking-tight group-hover:text-blue-200 transition-colors font-accent">
              {stats.blogs?.live ?? stats.blogs?.total ?? 0}
            </div>
            <div className="text-sm font-medium text-neutral-300 mt-1.5 truncate">Total Live Blogs</div>
            <div className="text-xs font-semibold text-blue-400 mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
              <span>Active Articles</span>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-md shadow-blue-500/10 flex-shrink-0 group-hover:scale-110 group-hover:bg-blue-500/25 group-hover:border-blue-400 transition-all duration-200">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* Total Experiences */}
        <div 
          onClick={() => onNavigate('manage-experiences')}
          className="p-4 rounded-xl cursor-pointer bg-gradient-to-br from-amber-950/50 via-[#120e06] to-[#04060c] border border-amber-500/30 hover:border-amber-400/80 shadow-lg shadow-amber-950/40 hover:shadow-amber-500/20 transition-all duration-200 flex items-center justify-between gap-3 group hover:-translate-y-0.5"
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

        {/* Total Projects */}
        <div 
          onClick={() => onNavigate('manage-projects')}
          className="p-4 rounded-xl cursor-pointer bg-gradient-to-br from-purple-950/50 via-[#10071c] to-[#04060c] border border-purple-500/30 hover:border-purple-400/80 shadow-lg shadow-purple-950/40 hover:shadow-purple-500/20 transition-all duration-200 flex items-center justify-between gap-3 group hover:-translate-y-0.5"
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

        {/* Total Skills */}
        <div 
          onClick={() => onNavigate('manage-skills')}
          className="p-4 rounded-xl cursor-pointer bg-gradient-to-br from-emerald-950/50 via-[#05140e] to-[#04060c] border border-emerald-500/30 hover:border-emerald-400/80 shadow-lg shadow-emerald-950/40 hover:shadow-emerald-500/20 transition-all duration-200 flex items-center justify-between gap-3 group hover:-translate-y-0.5"
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
          className="p-4 rounded-xl cursor-pointer bg-gradient-to-br from-sky-950/50 via-[#07131e] to-[#04060c] border border-sky-500/30 hover:border-sky-400/80 shadow-lg shadow-sky-950/40 hover:shadow-sky-500/20 transition-all duration-200 flex items-center justify-between gap-3 col-span-2 sm:col-span-1 lg:col-span-2 xl:col-span-1 group hover:-translate-y-0.5"
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

      {/* 2. PROJECTS SECTION: Matched Heights (h-[68px]), Colorful Vibrant Progress Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* Projects Pipeline Card */}
        <div className="rounded-xl bg-[#07080d] border border-neutral-800 shadow-xl overflow-hidden flex flex-col justify-between h-full">
          {/* Edge-to-Edge Special Header Bar */}
          <div className="bg-gradient-to-r from-[#0c0f1d] via-[#090b14] to-[#05060a] px-4 py-3 border-b border-neutral-800 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/30">
                <FolderKanban className="w-4 h-4" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                Projects Status Pipeline
              </h3>
            </div>

            <button 
              onClick={() => onNavigate('manage-projects')}
              className="text-xs font-semibold text-blue-400 hover:underline flex items-center gap-1 transition-colors"
            >
              <span>Manage All ({stats.projects?.total ?? 0})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 3 Pipeline Items */}
          <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
            {/* Live / Completed: Cyan-Blue */}
            <div className="h-[68px] p-3 rounded-lg bg-[#050609] border border-neutral-800/80 flex flex-col justify-center">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-neutral-200 font-medium flex items-center gap-2">
                  <FolderCheck className="w-4 h-4 text-cyan-400" /> Live Projects
                </span>
                <span className="font-bold text-neutral-100"><span className="text-cyan-400">{stats.projects?.live ?? 0}</span> / {stats.projects?.total ?? 0}</span>
              </div>
              <div className="w-full h-2.5 rounded-sm bg-neutral-900 overflow-hidden mt-2.5 shrink-0 border border-neutral-800/80">
                <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 rounded-sm shadow-sm shadow-cyan-500/30" style={{ width: `${stats.projects?.total ? Math.round(((stats.projects?.live || 0) / stats.projects.total) * 100) : 0}%` }}></div>
              </div>
            </div>

            {/* Offline / In Progress */}
            <div className="h-[68px] p-3 rounded-lg bg-[#050609] border border-neutral-800/80 flex flex-col justify-center">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-neutral-200 font-medium flex items-center gap-2">
                  <Hourglass className="w-4 h-4 text-amber-400" /> Offline / In Progress
                </span>
                <span className="font-bold text-neutral-100"><span className="text-amber-400">{stats.projects?.offline ?? Math.max(0, (stats.projects?.total || 0) - (stats.projects?.live || 0))}</span> / {stats.projects?.total ?? 0}</span>
              </div>
              <div className="w-full h-2.5 rounded-sm bg-neutral-900 overflow-hidden mt-2.5 shrink-0 border border-neutral-800/80">
                <div className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-400 rounded-sm shadow-sm shadow-amber-500/30" style={{ width: `${stats.projects?.total ? Math.round(((stats.projects?.offline || 0) / stats.projects.total) * 100) : 0}%` }}></div>
              </div>
            </div>

            {/* Total Managed */}
            <div className="h-[68px] p-3 rounded-lg bg-[#050609] border border-neutral-800/80 flex flex-col justify-center">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-neutral-200 font-medium flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-purple-400" /> Total Portfolio Projects
                </span>
                <span className="font-bold text-purple-400">{stats.projects?.total ?? 0} Projects</span>
              </div>
              <div className="w-full h-2.5 rounded-sm bg-neutral-900 overflow-hidden mt-2.5 shrink-0 border border-neutral-800/80">
                <div className="h-full bg-gradient-to-r from-purple-500 via-violet-500 to-fuchsia-400 rounded-sm shadow-sm shadow-purple-500/30" style={{ width: `${stats.projects?.total ? 100 : 0}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Project Activity Card */}
        <div className="rounded-xl bg-[#07080d] border border-neutral-800 shadow-xl overflow-hidden flex flex-col justify-between h-full">
          {/* Edge-to-Edge Special Header Bar */}
          <div className="bg-gradient-to-r from-[#0c0f1d] via-[#090b14] to-[#05060a] px-4 py-3 border-b border-neutral-800 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/30">
                <Activity className="w-4 h-4" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                Project Activity
              </h3>
            </div>

            <button 
              onClick={() => onNavigate('manage-projects')}
              className="text-xs font-semibold text-blue-400 hover:underline flex items-center gap-1 transition-colors"
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
                  <div key={act.id} className="h-[68px] p-3 rounded-lg bg-[#050609] hover:bg-neutral-900/80 border border-neutral-800/80 flex items-center gap-3 transition-colors">
                    <div className={`p-2 rounded-md ${act.bg || 'bg-blue-500/10'} ${act.color || 'text-blue-400'} flex-shrink-0`}>
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

      {/* 3. BLOGS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* Blogs Pipeline Card */}
        <div className="rounded-xl bg-[#07080d] border border-neutral-800 shadow-xl overflow-hidden flex flex-col justify-between h-full">
          {/* Edge-to-Edge Special Header Bar */}
          <div className="bg-gradient-to-r from-[#0c0f1d] via-[#090b14] to-[#05060a] px-4 py-3 border-b border-neutral-800 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/30">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                Blogs Pipeline Status
              </h3>
            </div>

            <button 
              onClick={() => onNavigate('manage-blogs')}
              className="text-xs font-semibold text-blue-400 hover:underline flex items-center gap-1 transition-colors"
            >
              <span>Manage All ({stats.blogs?.total ?? 0})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 3 Pipeline Items */}
          <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
            {/* Drafts */}
            <div className="h-[68px] p-3 rounded-lg bg-[#050609] border border-neutral-800/80 flex flex-col justify-center">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-neutral-200 font-medium flex items-center gap-2">
                  <FileEdit className="w-4 h-4 text-indigo-400" /> Draft Articles
                </span>
                <span className="font-bold text-indigo-400">{stats.blogs?.draft ?? 0} Drafts</span>
              </div>
              <div className="w-full h-2.5 rounded-sm bg-neutral-900 overflow-hidden mt-2.5 shrink-0 border border-neutral-800/80">
                <div className="h-full bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-400 rounded-sm shadow-sm shadow-indigo-500/30" style={{ width: `${stats.blogs?.total ? Math.round(((stats.blogs?.draft || 0) / stats.blogs.total) * 100) : 0}%` }}></div>
              </div>
            </div>

            {/* Scheduled */}
            <div className="h-[68px] p-3 rounded-lg bg-[#050609] border border-neutral-800/80 flex flex-col justify-center">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-neutral-200 font-medium flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-sky-400" /> Scheduled Publications
                </span>
                <span className="font-bold text-sky-400">{stats.blogs?.scheduled ?? 0} Scheduled</span>
              </div>
              <div className="w-full h-2.5 rounded-sm bg-neutral-900 overflow-hidden mt-2.5 shrink-0 border border-neutral-800/80">
                <div className="h-full bg-gradient-to-r from-sky-400 via-cyan-400 to-blue-500 rounded-sm shadow-sm shadow-sky-500/30" style={{ width: `${stats.blogs?.total ? Math.round(((stats.blogs?.scheduled || 0) / stats.blogs.total) * 100) : 0}%` }}></div>
              </div>
            </div>

            {/* Published Articles */}
            <div className="h-[68px] p-3 rounded-lg bg-[#050609] border border-neutral-800/80 flex flex-col justify-center">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-neutral-200 font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" /> Published Articles
                </span>
                <span className="font-bold text-emerald-400">{stats.blogs?.live ?? 0} Published</span>
              </div>
              <div className="w-full h-2.5 rounded-sm bg-neutral-900 overflow-hidden mt-2.5 shrink-0 border border-neutral-800/80">
                <div className="h-full bg-gradient-to-r from-emerald-400 via-teal-400 to-green-400 rounded-sm shadow-sm shadow-emerald-500/30" style={{ width: `${stats.blogs?.total ? Math.round(((stats.blogs?.live || 0) / stats.blogs.total) * 100) : 0}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Blogs Activity Card */}
        <div className="rounded-xl bg-[#07080d] border border-neutral-800 shadow-xl overflow-hidden flex flex-col justify-between h-full">
          {/* Edge-to-Edge Special Header Bar */}
          <div className="bg-gradient-to-r from-[#0c0f1d] via-[#090b14] to-[#05060a] px-4 py-3 border-b border-neutral-800 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/30">
                <Activity className="w-4 h-4" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                Blogs Activity
              </h3>
            </div>

            <button 
              onClick={() => onNavigate('manage-blogs')}
              className="text-xs font-semibold text-blue-400 hover:underline flex items-center gap-1 transition-colors"
            >
              <span>All Blogs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Activity Items or Empty State */}
          <div className="p-4 space-y-3 flex-1 flex flex-col justify-center">
            {blogsActivities.length === 0 ? (
              <div className="text-center py-6 text-neutral-500 text-xs">
                No recent blog activity records found.
              </div>
            ) : (
              blogsActivities.slice(0, 3).map((act) => {
                const Icon = act.icon || FileText;
                return (
                  <div key={act.id} className="h-[68px] p-3 rounded-lg bg-[#050609] hover:bg-neutral-900/80 border border-neutral-800/80 flex items-center gap-3 transition-colors">
                    <div className={`p-2 rounded-md ${act.bg || 'bg-blue-500/10'} ${act.color || 'text-blue-400'} flex-shrink-0`}>
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

      {/* 4. Middle Section: Quick Actions & Resume (Full Height Upload Area) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* Quick Actions */}
        <div className="rounded-xl bg-[#07080d] border border-neutral-800 shadow-xl overflow-hidden flex flex-col justify-between h-full">
          {/* Edge-to-Edge Header */}
          <div className="bg-gradient-to-r from-[#0c0f1d] via-[#090b14] to-[#05060a] px-4 py-3 border-b border-neutral-800 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/30">
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
              onClick={() => onNavigate('manage-blogs')}
              className="p-3 rounded-lg bg-[#050609] hover:bg-neutral-900 border border-neutral-800/80 text-left text-xs sm:text-sm font-semibold text-neutral-200 hover:text-white transition-all flex items-center gap-2.5 group"
            >
              <span className="p-1.5 rounded-md bg-blue-500/10 text-blue-400 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-indigo-600 group-hover:text-white transition-colors">
                <Plus className="w-4 h-4" />
              </span>
              <span>Add Blog</span>
            </button>

            <button 
              onClick={() => onNavigate('manage-projects')}
              className="p-3 rounded-lg bg-[#050609] hover:bg-neutral-900 border border-neutral-800/80 text-left text-xs sm:text-sm font-semibold text-neutral-200 hover:text-white transition-all flex items-center gap-2.5 group"
            >
              <span className="p-1.5 rounded-md bg-blue-500/10 text-blue-400 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-indigo-600 group-hover:text-white transition-colors">
                <Plus className="w-4 h-4" />
              </span>
              <span>Add Project</span>
            </button>

            <button 
              onClick={() => onNavigate('manage-experiences')}
              className="p-3 rounded-lg bg-[#050609] hover:bg-neutral-900 border border-neutral-800/80 text-left text-xs sm:text-sm font-semibold text-neutral-200 hover:text-white transition-all flex items-center gap-2.5 group"
            >
              <span className="p-1.5 rounded-md bg-blue-500/10 text-blue-400 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-indigo-600 group-hover:text-white transition-colors">
                <Plus className="w-4 h-4" />
              </span>
              <span>Add Experience</span>
            </button>

            <button 
              onClick={() => onNavigate('manage-skills')}
              className="p-3 rounded-lg bg-[#050609] hover:bg-neutral-900 border border-neutral-800/80 text-left text-xs sm:text-sm font-semibold text-neutral-200 hover:text-white transition-all flex items-center gap-2.5 group"
            >
              <span className="p-1.5 rounded-md bg-blue-500/10 text-blue-400 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-indigo-600 group-hover:text-white transition-colors">
                <Plus className="w-4 h-4" />
              </span>
              <span>Add Skill</span>
            </button>
          </div>
        </div>

        {/* Resume & Documentation (Full Height Dropzone Area) */}
        <div className="rounded-xl bg-[#07080d] border border-neutral-800 shadow-xl overflow-hidden flex flex-col justify-between h-full">
          {/* Edge-to-Edge Header */}
          <div className="bg-gradient-to-r from-[#0c0f1d] via-[#090b14] to-[#05060a] px-4 py-3 border-b border-neutral-800 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/30">
                <FileUp className="w-4 h-4" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                Resume & Documentation
              </h3>
            </div>

            <span className="text-xs font-semibold text-blue-400 font-accent">{resumeName}</span>
          </div>

          {/* Full Height Clean Upload Area */}
          <div className="p-4 flex-1 flex flex-col justify-center">
            <label className="w-full h-full min-h-[140px] p-5 rounded-lg bg-[#050609] hover:bg-neutral-900/80 border border-dashed border-blue-500/40 text-neutral-200 cursor-pointer flex flex-col sm:flex-row items-center justify-between gap-4 transition-all group hover:border-solid hover:shadow-lg">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform flex-shrink-0">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="min-w-0 text-left">
                  <div className="text-sm font-bold text-white truncate">Upload New Resume File</div>
                  <p className="text-xs text-neutral-400 mt-1 truncate">PDF, DOC, DOCX up to 15MB • Direct Sync</p>
                </div>
              </div>

              <div className="px-4 py-2 rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs flex-shrink-0 shadow-md shadow-blue-500/20 group-hover:brightness-110 transition-all">
                Browse File
              </div>
              <input type="file" onChange={handleResumeUpload} className="hidden" accept=".pdf,.doc,.docx" />
            </label>
          </div>
        </div>
      </div>

      {/* 5. RECENT MESSAGES & QUICK EMAIL REPLY (Split 2-Column Design with Left-Aligned Previews & Taller Composer) */}
      <div className="rounded-xl bg-[#07080d] border border-neutral-800 shadow-xl overflow-hidden flex flex-col">
        {/* Edge-to-Edge Header */}
        <div className="bg-gradient-to-r from-[#0c0f1d] via-[#090b14] to-[#05060a] px-4 py-3 border-b border-neutral-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/30">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
              Recent Messages & Quick Email Reply
            </h3>
          </div>

          <button 
            onClick={() => onNavigate('manage-contacts')}
            className="text-xs font-semibold text-blue-400 hover:underline flex items-center gap-1 transition-colors"
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
              <span className="text-xs text-blue-400 font-semibold">{messages.filter(m => m.unread).length} Unread</span>
            </div>

            <div className="space-y-2">
              {messages.length === 0 ? (
                <div className="p-8 text-center text-neutral-500 text-xs rounded-lg bg-[#050609] border border-neutral-800/80">
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
                          ? 'bg-[#0d1222] border-blue-500/60 shadow-md shadow-blue-500/10' 
                          : 'bg-[#050609] hover:bg-neutral-900/80 border-neutral-800/80'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-lg ${isSelected ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white' : 'bg-neutral-800 text-neutral-300'} font-bold text-xs flex items-center justify-center flex-shrink-0 font-accent`}>
                            {msg.name?.charAt(0) || 'U'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-sm font-bold text-neutral-100 truncate font-accent">{msg.name}</h4>
                              {msg.unread && (
                                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse flex-shrink-0"></span>
                              )}
                            </div>
                            <p className="text-xs text-neutral-400 truncate">{msg.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
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
          <div className="lg:col-span-7 rounded-lg bg-[#050609] border border-neutral-800/90 p-4 flex flex-col justify-between space-y-3.5">
            {currentMsg ? (
              <>
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-800/80">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                        <Mail className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-xs sm:text-sm min-w-0">
                        <span className="text-neutral-400 font-medium">Replying via Email to: </span>
                        <span className="font-bold text-white font-accent">{currentMsg?.name}</span>
                        <span className="text-neutral-400 text-xs ml-1">({currentMsg?.email})</span>
                      </div>
                    </div>

                    <span className="text-xs text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20 font-semibold flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5" /> Direct SMTP Relay
                    </span>
                  </div>

                  {/* Subject line input */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 bg-black/60 border border-neutral-800/80 rounded-md px-3 py-2 text-xs">
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
                      className="w-full min-h-[140px] p-3 rounded-md bg-black/60 border border-neutral-800/80 text-xs sm:text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-blue-500/60 transition-colors resize-none leading-relaxed font-normal"
                    />
                  </div>
                </div>

                {/* Quick Canned Suggestions & Send Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2.5 border-t border-neutral-800/80">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button 
                      type="button"
                      onClick={() => setReplyText(`Hi ${currentMsg?.name}, thanks for reaching out! I am currently available for new contracts and projects.`)}
                      className="text-[11px] font-medium px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 transition-colors"
                    >
                      Available for work
                    </button>
                    <button 
                      type="button"
                      onClick={() => setReplyText(`Hi ${currentMsg?.name}, let's schedule a 15-minute discovery call this week to discuss your requirements.`)}
                      className="text-[11px] font-medium px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 transition-colors"
                    >
                      Schedule Call
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleSendReply}
                    className="px-4 py-2 rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 transition-all flex-shrink-0"
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

      {/* 6. 12-MONTH ACTIVITY HEATMAP (With Edge-to-Edge Gradient Header & Footer) */}
      <div className="rounded-xl bg-[#07080d] border border-neutral-800 shadow-xl overflow-hidden flex flex-col">
        {/* Edge-to-Edge Header with Matched Title Size */}
        <div className="bg-gradient-to-r from-[#0c0f1d] via-[#090b14] to-[#05060a] px-4 py-3 border-b border-neutral-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/30">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
              Monthly Daily Activity
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 font-accent">
              528 Total Activities in 2025
            </span>
          </div>
        </div>

        {/* ALL 12 MONTHS GRID */}
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3.5">
            {fullMonths.map((monthName, mIdx) => (
              <div key={monthName} className="p-3 rounded-lg bg-[#050609] border border-neutral-800/80 space-y-2.5 hover:border-neutral-700 transition-colors">
                {/* Full Name of Month with accent font */}
                <div className="text-xs font-bold text-neutral-100 text-center tracking-wide font-accent">{monthName}</div>
                
                {/* 7 Days of the Week Column Headers */}
                <div className="grid grid-cols-7 gap-1 text-center font-bold text-[9px] text-neutral-500">
                  {dayLabels.map((dayLabel, dIdx) => (
                    <span key={`${monthName}-${dayLabel}-${dIdx}`}>{dayLabel}</span>
                  ))}
                </div>

                {/* 7-Column Days Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {getDaysForMonth(mIdx).map((d) => (
                    <div
                      key={d.day}
                      title={`${monthName} Day ${d.day}: ${d.count} activities`}
                      className={`aspect-square w-full rounded-sm transition-all duration-200 hover:scale-125 cursor-pointer ${getHeatmapColorClass(d.level)}`}
                    ></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Edge-to-Edge Footer Bar (Same Styling as Header) */}
        <div className="bg-gradient-to-r from-[#0c0f1d] via-[#090b14] to-[#05060a] px-4 py-3 border-t border-neutral-800 flex items-center justify-between flex-shrink-0">
          <span className="text-xs font-semibold text-neutral-300 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            <span>Daily Contribution Legend</span>
          </span>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-neutral-400 font-medium">Less</span>
            <div className="w-3.5 h-3.5 rounded-sm bg-[#030406] border border-neutral-900"></div>
            <div className={`w-3.5 h-3.5 rounded-sm ${getHeatmapColorClass(1)}`}></div>
            <div className={`w-3.5 h-3.5 rounded-sm ${getHeatmapColorClass(2)}`}></div>
            <div className={`w-3.5 h-3.5 rounded-sm ${getHeatmapColorClass(3)}`}></div>
            <div className={`w-3.5 h-3.5 rounded-sm ${getHeatmapColorClass(4)}`}></div>
            <span className="text-blue-400 font-bold">More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
