import React, { useState, useEffect } from 'react';
import { 
  User, 
  Save, 
  Upload, 
  Github, 
  Linkedin, 
  Twitter, 
  Globe, 
  Mail, 
  MapPin, 
  CheckCircle2, 
  FileText, 
  Sparkles, 
  Phone, 
  Briefcase,
  Code,
  Layers,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Activity,
  Award,
  Zap,
  Star,
  Users,
  CreditCard,
  DownloadCloud,
  Terminal
} from 'lucide-react';
import RichContentBuilder from './RichContentBuilder';
import { profilesApi } from '../services/api';

const POPULAR_ICONS = [
  { label: 'Users / Community', iconClass: 'fas fa-users' },
  { label: 'ID Card / Credentials', iconClass: 'fas fa-id-card' },
  { label: 'Cloud Download', iconClass: 'fas fa-cloud-download-alt' },
  { label: 'Code / Branch', iconClass: 'fas fa-code-branch' },
  { label: 'Rocket / Speed', iconClass: 'fas fa-rocket' },
  { label: 'Lightning / Fast', iconClass: 'fas fa-bolt' },
  { label: 'Fire / Trend', iconClass: 'fas fa-fire' },
  { label: 'Star / Featured', iconClass: 'fas fa-star' },
  { label: 'Award / Honor', iconClass: 'fas fa-award' },
  { label: 'Laptop / Engineering', iconClass: 'fas fa-laptop-code' },
  { label: 'Database / Storage', iconClass: 'fas fa-database' },
  { label: 'Activity / Telemetry', iconClass: 'fas fa-chart-line' },
];

export default function DetailsView({ onNavigate, activeWebsite }) {
  const [saved, setSaved] = useState(false);
  const [profileId, setProfileId] = useState(null);
  const [details, setDetails] = useState({
    name: 'Roshan Damor',
    title: 'Software Engineer · Full Stack AI (DevMate)',
    bio: 'Software Engineer specializing in scalable full-stack web applications, distributed backend systems, and LLM AI workflows for DevMate.',
    location: 'Bhopal, Madhya Pradesh, India',
    email: 'mail@logicbyroshan.in',
    phone: '+91 90000 00000',
    experienceYears: '3+ Years',
    github: 'https://github.com/logicbyroshan',
    linkedin: 'https://linkedin.com/in/logicbyroshan',
    twitter: 'https://twitter.com/logicbyroshan',
    website: 'https://logicbyroshan.in',
    resumeUrl: '/media/documents/Roshan_Damor_Resume.pdf',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    heroHighlightsTitle: 'Quick Portfolio Highlights',
    heroHighlightsVisible: true,
    heroStats: [
      { value: '1,000+', label: 'Production Users', icon: 'fas fa-users' },
      { value: '136K+', label: 'ID Cards Processed', icon: 'fas fa-id-card' },
      { value: '86K+', label: 'Cards Downloaded', icon: 'fas fa-cloud-download-alt' }
    ]
  });

  // Load profile from Django REST Framework API
  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      try {
        const siteSlug = activeWebsite?.slug || activeWebsite?.id || 'dev-mate';
        const res = await profilesApi.getByWebsite(siteSlug);
        const list = Array.isArray(res) ? res : (res.results || []);
        if (isMounted && list.length > 0) {
          const p = list[0];
          setProfileId(p.id);
          
          let parsedStats = [];
          if (Array.isArray(p.hero_stats) && p.hero_stats.length > 0) {
            parsedStats = p.hero_stats.map(s => ({
              value: s.value || '',
              label: s.label || '',
              icon: s.icon || 'fas fa-chart-line'
            }));
          } else {
            if (p.hero_stat_1_value || p.hero_stat_1_label) {
              parsedStats.push({ value: p.hero_stat_1_value || '1,000+', label: p.hero_stat_1_label || 'Production Users', icon: p.hero_stat_1_icon || 'fas fa-users' });
            }
            if (p.hero_stat_2_value || p.hero_stat_2_label) {
              parsedStats.push({ value: p.hero_stat_2_value || '136K+', label: p.hero_stat_2_label || 'ID Cards Processed', icon: p.hero_stat_2_icon || 'fas fa-id-card' });
            }
            if (p.hero_stat_3_value || p.hero_stat_3_label) {
              parsedStats.push({ value: p.hero_stat_3_value || '86K+', label: p.hero_stat_3_label || 'Cards Downloaded', icon: p.hero_stat_3_icon || 'fas fa-cloud-download-alt' });
            }
          }

          if (parsedStats.length === 0) {
            parsedStats = [
              { value: '1,000+', label: 'Production Users', icon: 'fas fa-users' },
              { value: '136K+', label: 'ID Cards Processed', icon: 'fas fa-id-card' },
              { value: '86K+', label: 'Cards Downloaded', icon: 'fas fa-cloud-download-alt' }
            ];
          }

          setDetails({
            name: p.name || p.full_name || 'Roshan Damor',
            title: p.title || '',
            bio: p.bio || '',
            location: p.location || '',
            email: p.email || '',
            phone: p.phone || '',
            experienceYears: p.experience_years || '3+ Years',
            github: p.github || '',
            linkedin: p.linkedin || '',
            twitter: p.twitter || '',
            website: p.website_url || '',
            resumeUrl: p.resume_url || p.resume || '',
            avatar: p.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
            heroHighlightsTitle: p.hero_highlights_title || 'Quick Portfolio Highlights',
            heroHighlightsVisible: p.hero_highlights_visible !== false,
            heroStats: parsedStats.slice(0, 3)
          });
        }
      } catch {
        // Fallback maintained
      }
    };
    fetchProfile();
    return () => { isMounted = false; };
  }, [activeWebsite]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDetails(prev => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Dynamic Highlight Stat Item Handlers
  const handleStatChange = (index, field, val) => {
    const updated = [...details.heroStats];
    if (updated[index]) {
      updated[index] = { ...updated[index], [field]: val };
      setDetails({ ...details, heroStats: updated });
    }
  };

  const handleAddStat = () => {
    if (details.heroStats.length < 3) {
      setDetails({
        ...details,
        heroStats: [
          ...details.heroStats,
          { value: '50+', label: 'Projects Built', icon: 'fas fa-rocket' }
        ]
      });
    }
  };

  const handleRemoveStat = (index) => {
    if (details.heroStats.length > 1) {
      setDetails({
        ...details,
        heroStats: details.heroStats.filter((_, i) => i !== index)
      });
    }
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    setSaved(true);

    const currentSiteSlug = activeWebsite?.slug || activeWebsite?.id || 'dev-mate';
    
    // Normalize stats
    const stats = details.heroStats.slice(0, 3);
    const payload = {
      name: details.name,
      full_name: details.name,
      title: details.title,
      bio: details.bio,
      location: details.location,
      email: details.email,
      phone: details.phone,
      experience_years: details.experienceYears,
      github: details.github,
      linkedin: details.linkedin,
      twitter: details.twitter,
      website_url: details.website,
      resume_url: details.resumeUrl,
      resume: details.resumeUrl,
      avatar: details.avatar,
      hero_highlights_title: details.heroHighlightsTitle,
      hero_highlights_visible: details.heroHighlightsVisible,
      hero_stats: stats,
      hero_stat_1_value: stats[0]?.value || '',
      hero_stat_1_label: stats[0]?.label || '',
      hero_stat_1_icon: stats[0]?.icon || 'fas fa-users',
      hero_stat_2_value: stats[1]?.value || '',
      hero_stat_2_label: stats[1]?.label || '',
      hero_stat_2_icon: stats[1]?.icon || 'fas fa-id-card',
      hero_stat_3_value: stats[2]?.value || '',
      hero_stat_3_label: stats[2]?.label || '',
      hero_stat_3_icon: stats[2]?.icon || 'fas fa-cloud-download-alt',
      website: currentSiteSlug
    };

    try {
      if (profileId) {
        await profilesApi.patch(profileId, payload);
      }
    } catch {
      // Fallback
    }

    setTimeout(() => setSaved(false), 3500);
  };

  return (
    <div className="space-y-5 w-full max-w-full overflow-x-hidden font-sans">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 rounded-xl bg-[#07080d] border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold text-white">Portfolio Profile & Personal Details</h1>
            <p className="text-xs text-neutral-400 mt-0.5">Manage public profile information, hero highlight stat cards (1-3 stats with custom icons), and social links.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {saved && (
            <div className="h-9 px-3.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" /> Profile Saved Successfully!
            </div>
          )}

          <button
            onClick={handleSave}
            className={`h-9 px-4 rounded-lg bg-gradient-to-r ${activeWebsite?.gradient || 'from-blue-600 to-indigo-600'} hover:brightness-110 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all flex-shrink-0`}
          >
            <Save className="w-4 h-4" />
            <span>Save Profile Details</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Avatar & Quick Info Card */}
        <div className="p-5 sm:p-6 rounded-xl bg-[#07080d] border border-neutral-800 text-center space-y-4 h-fit shadow-xl">
          <div className="relative w-28 h-28 mx-auto rounded-2xl overflow-hidden ring-2 ring-blue-500/40 bg-[#030406] shadow-xl">
            <img
              src={details.avatar}
              alt="Avatar"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80';
              }}
            />
          </div>

          <div>
            <h3 className="text-base font-extrabold text-white font-accent">{details.name}</h3>
            <p className={`text-xs font-bold ${activeWebsite?.accentText || 'text-blue-400'} mt-0.5`}>{details.title}</p>
            <p className="text-[11px] text-neutral-400 mt-1 flex items-center justify-center gap-1">
              <MapPin className="w-3 h-3 text-neutral-500" />
              <span>{details.location}</span>
            </p>
          </div>

          <label className="w-full py-2.5 px-3 rounded-lg bg-[#050609] hover:bg-neutral-800 text-neutral-200 font-semibold text-xs cursor-pointer flex items-center justify-center gap-2 border border-neutral-800 transition-all">
            <Upload className={`w-3.5 h-3.5 ${activeWebsite?.accentText || 'text-blue-400'}`} />
            <span>Change Profile Picture</span>
            <input type="file" onChange={handleAvatarChange} className="hidden" accept="image/*" />
          </label>

          <div className="pt-3 border-t border-neutral-800 text-left space-y-2 text-xs">
            <div className="flex items-center justify-between text-neutral-400">
              <span>Experience:</span>
              <span className="font-bold text-white">{details.experienceYears}</span>
            </div>
            <div className="flex items-center justify-between text-neutral-400">
              <span>Active Stats:</span>
              <span className="font-bold text-blue-400">{details.heroStats.length} of 3</span>
            </div>
            <div className="flex items-center justify-between text-neutral-400">
              <span>Current Portfolio:</span>
              <span className={`font-bold ${activeWebsite?.accentText || 'text-blue-400'}`}>{activeWebsite?.name || 'DevMate'}</span>
            </div>
          </div>
        </div>

        {/* Right Columns: Main Details Form */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-xl bg-[#07080d] border border-neutral-800 space-y-6 shadow-xl">
          {/* General Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-white pb-2.5 border-b border-neutral-800 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${activeWebsite?.dotColor || 'bg-blue-400'}`}></span>
              <span>General Information</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div>
                <label className="block text-neutral-300 font-bold text-xs mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={details.name}
                  onChange={e => setDetails({ ...details, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#050609] border border-neutral-800 text-white font-accent focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 transition-all"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-bold text-xs mb-1.5">Professional Title</label>
                <input
                  type="text"
                  required
                  value={details.title}
                  onChange={e => setDetails({ ...details, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#050609] border border-neutral-800 text-white focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 transition-all"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-bold text-xs mb-1.5">Contact Email</label>
                <input
                  type="email"
                  required
                  value={details.email}
                  onChange={e => setDetails({ ...details, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#050609] border border-neutral-800 text-white focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 transition-all"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-bold text-xs mb-1.5">Phone Number</label>
                <input
                  type="text"
                  value={details.phone}
                  onChange={e => setDetails({ ...details, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#050609] border border-neutral-800 text-white focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 transition-all"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-bold text-xs mb-1.5">Location / City</label>
                <input
                  type="text"
                  value={details.location}
                  onChange={e => setDetails({ ...details, location: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#050609] border border-neutral-800 text-white focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 transition-all"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-bold text-xs mb-1.5">Public Resume URL</label>
                <input
                  type="text"
                  value={details.resumeUrl}
                  onChange={e => setDetails({ ...details, resumeUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#050609] border border-neutral-800 text-white focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 font-mono text-xs transition-all"
                />
              </div>
            </div>

            {/* DYNAMIC QUICK PORTFOLIO HIGHLIGHTS (1, 2, or Max 3 Stats) */}
            <div className="p-4 sm:p-5 rounded-xl bg-[#050609] border border-neutral-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-neutral-800">
                <div>
                  <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <span>Quick Portfolio Highlights (Hero Stat Cards)</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">Customize stats shown over the hero image (show 1, 2, or max 3 stats with custom icons and labels).</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDetails({ ...details, heroHighlightsVisible: !details.heroHighlightsVisible })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${
                      details.heroHighlightsVisible 
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
                        : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                    }`}
                  >
                    {details.heroHighlightsVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{details.heroHighlightsVisible ? 'Card Visible' : 'Card Hidden'}</span>
                  </button>

                  {details.heroStats.length < 3 && (
                    <button
                      type="button"
                      onClick={handleAddStat}
                      className="px-3 py-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/40 text-blue-300 text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                    >
                      <Plus className="w-3.5 h-3.5 text-blue-400" />
                      <span>Add Stat ({details.heroStats.length}/3)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Title of Highlights Widget */}
              <div>
                <label className="block text-neutral-300 font-bold text-xs mb-1.5">Card Section Title</label>
                <input
                  type="text"
                  value={details.heroHighlightsTitle}
                  onChange={e => setDetails({ ...details, heroHighlightsTitle: e.target.value })}
                  placeholder="Quick Portfolio Highlights"
                  className="w-full px-3.5 py-2 rounded-lg bg-black/60 border border-neutral-800 text-xs text-white focus:outline-none focus:border-blue-500/80 transition-all font-semibold"
                />
              </div>

              {/* Stat Cards Editor List */}
              <div className="space-y-3 pt-1">
                {details.heroStats.map((stat, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-black/50 border border-neutral-800/90 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 text-[11px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-white">Stat #{idx + 1} Configuration</span>
                      </div>

                      {details.heroStats.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveStat(idx)}
                          className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded transition-colors text-xs flex items-center gap-1 font-semibold"
                          title="Remove this stat"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {/* Stat Value */}
                      <div>
                        <label className="block text-neutral-400 font-semibold text-[11px] mb-1">Stat Number / Value</label>
                        <input
                          type="text"
                          value={stat.value}
                          onChange={e => handleStatChange(idx, 'value', e.target.value)}
                          placeholder="e.g. 1,000+ or 136K+"
                          className="w-full px-3 py-1.5 rounded-lg bg-[#07080d] border border-neutral-800 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                        />
                      </div>

                      {/* Stat Label */}
                      <div>
                        <label className="block text-neutral-400 font-semibold text-[11px] mb-1">Stat Name / Label</label>
                        <input
                          type="text"
                          value={stat.label}
                          onChange={e => handleStatChange(idx, 'label', e.target.value)}
                          placeholder="e.g. Production Users"
                          className="w-full px-3 py-1.5 rounded-lg bg-[#07080d] border border-neutral-800 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      {/* Icon Selector / Custom */}
                      <div>
                        <label className="block text-neutral-400 font-semibold text-[11px] mb-1">Icon Class</label>
                        <select
                          value={stat.icon}
                          onChange={e => handleStatChange(idx, 'icon', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#07080d] border border-neutral-800 text-xs text-white focus:outline-none focus:border-blue-500"
                        >
                          {POPULAR_ICONS.map((ico, icoIdx) => (
                            <option key={icoIdx} value={ico.iconClass}>{ico.label} ({ico.iconClass})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Realtime Live Preview Box */}
              <div className="pt-2 border-t border-neutral-800/80">
                <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Eye className="w-3 h-3 text-emerald-400" />
                  <span>Live Preview: Quick Portfolio Highlights ({details.heroStats.length} Stats)</span>
                </div>

                <div className="p-4 rounded-xl bg-[#090d28]/90 border border-purple-500/40 shadow-xl space-y-3">
                  <div className="text-xs font-bold text-white font-accent flex items-center justify-between">
                    <span>{details.heroHighlightsTitle || 'Quick Portfolio Highlights'}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                      {details.heroStats.length} STATS ACTIVE
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    {details.heroStats.map((st, sIdx) => (
                      <div key={sIdx} className="flex-1 min-w-[100px] text-center space-y-1 p-2 rounded-lg bg-black/40 border border-neutral-800/60">
                        <div className="flex items-center justify-center gap-2">
                          <i className={`${st.icon || 'fas fa-chart-line'} text-blue-400 text-xs`}></i>
                          <span className="text-sm font-extrabold text-white font-mono">{st.value || '0'}</span>
                        </div>
                        <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold truncate">{st.label || 'Metric'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ULTRA-RICH BIOGRAPHY & PORTFOLIO NARRATIVE BUILDER */}
            <div className="pt-2">
              <RichContentBuilder
                value={details.bio}
                onChange={val => setDetails({ ...details, bio: val })}
                label="Biography Narrative & Portfolio Bio (Markdown, Architecture, Benchmarks)"
                placeholder="Write your professional biography, engineering philosophy, system architecture stack, and career accomplishments..."
              />
            </div>
          </div>

          {/* Social Media & Online Profiles */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-extrabold text-white pb-2.5 border-b border-neutral-800 flex items-center gap-2">
              <Globe className={`w-4 h-4 ${activeWebsite?.accentText || 'text-blue-400'}`} />
              <span>Social Profiles & Online Links</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div>
                <label className="block text-neutral-300 font-bold text-xs mb-1.5 flex items-center gap-1.5">
                  <Github className={`w-3.5 h-3.5 ${activeWebsite?.accentText || 'text-blue-400'}`} /> GitHub URL
                </label>
                <input
                  type="url"
                  value={details.github}
                  onChange={e => setDetails({ ...details, github: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#050609] border border-neutral-800 text-white focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 font-mono text-xs transition-all"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-bold text-xs mb-1.5 flex items-center gap-1.5">
                  <Linkedin className={`w-3.5 h-3.5 ${activeWebsite?.accentText || 'text-blue-400'}`} /> LinkedIn URL
                </label>
                <input
                  type="url"
                  value={details.linkedin}
                  onChange={e => setDetails({ ...details, linkedin: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#050609] border border-neutral-800 text-white focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 font-mono text-xs transition-all"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-bold text-xs mb-1.5 flex items-center gap-1.5">
                  <Twitter className={`w-3.5 h-3.5 ${activeWebsite?.accentText || 'text-blue-400'}`} /> Twitter / X Handle
                </label>
                <input
                  type="text"
                  value={details.twitter}
                  onChange={e => setDetails({ ...details, twitter: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#050609] border border-neutral-800 text-white focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 transition-all"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-bold text-xs mb-1.5 flex items-center gap-1.5">
                  <Globe className={`w-3.5 h-3.5 ${activeWebsite?.accentText || 'text-blue-400'}`} /> Personal Website
                </label>
                <input
                  type="url"
                  value={details.website}
                  onChange={e => setDetails({ ...details, website: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#050609] border border-neutral-800 text-white focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 font-mono text-xs transition-all"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-800 flex justify-end">
            <button
              type="submit"
              className={`h-9 px-5 rounded-lg bg-gradient-to-r ${activeWebsite?.gradient || 'from-blue-600 to-indigo-600'} hover:brightness-110 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all`}
            >
              <Save className="w-4 h-4" />
              <span>Save Profile Details</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
