import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  EyeOff, 
  Calendar, 
  Tag, 
  Save, 
  ChevronDown
} from 'lucide-react';
import CustomDatePicker from './CustomDatePicker';
import { experiencesApi } from '../services/api';

export default function ExperiencesView({ onNavigate, activeWebsite }) {
  const [viewMode, setViewMode] = useState('LIST'); // 'LIST' | 'EDITOR'
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [experiences, setExperiences] = useState([]);

  // Unified separate Add/Edit form state
  const [formData, setFormData] = useState({
    role: '',
    company: '',
    status: 'CURRENT',
    description: '',
    category: 'Full-Stack Engineering',
    joined: new Date().toISOString().split('T')[0],
    left: 'Present',
    visible: true
  });

  // Extract unique categories for the dropdown
  const categories = ['ALL', ...Array.from(new Set(experiences.map(e => e.category).filter(Boolean)))];

  const filteredExperiences = experiences.filter(exp => {
    if (selectedCategory === 'ALL') return true;
    return exp.category === selectedCategory;
  });

  // Fetch experiences from Django REST Framework API with multi-tenant filtering
  useEffect(() => {
    let isMounted = true;
    const fetchExperiences = async () => {
      try {
        setIsLoading(true);
        const siteSlug = activeWebsite?.slug || activeWebsite?.id || 'dev-mate';
        const data = await experiencesApi.getAll({ website: siteSlug });
        const list = Array.isArray(data) ? data : (data.results || []);
        if (isMounted) {
          setExperiences(list.map(e => ({
            id: e.id,
            role: e.role,
            company: e.company,
            status: e.status || (e.is_current ? 'CURRENT' : 'PAST'),
            category: e.category || 'Engineering',
            joined: e.start_date || '2023-01-01',
            left: e.end_date || (e.is_current ? 'Present' : ''),
            period: e.period || (e.start_date ? `${e.start_date} - ${e.end_date || 'Present'}` : '2023 - Present'),
            location: e.location || 'Remote',
            description: e.description || '',
            visible: e.visible !== false
          })));
        }
      } catch (err) {
        console.error('Failed to load experiences:', err);
        if (isMounted) setExperiences([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchExperiences();
    return () => { isMounted = false; };
  }, [activeWebsite]);

  // Navigate to separate Editor Page for Adding
  const handleOpenAddPage = () => {
    setEditingId(null);
    setFormData({
      role: '',
      company: '',
      status: 'CURRENT',
      category: 'Engineering',
      period: '2024 - Present',
      location: 'Remote',
      description: '',
      visible: true
    });
    setViewMode('EDITOR');
    window.scrollTo(0, 0);
  };

  // Navigate to separate Editor Page for Editing
  const handleOpenEditPage = (exp) => {
    setEditingId(exp.id);
    setFormData({ ...exp });
    setViewMode('EDITOR');
    window.scrollTo(0, 0);
  };

  // Return to List Page
  const handleBackToList = () => {
    setViewMode('LIST');
    setEditingId(null);
    window.scrollTo(0, 0);
  };

  // Save Form (Add or Edit)
  const handleSaveForm = async (e) => {
    e?.preventDefault();
    if (!formData.role.trim() || !formData.company.trim()) {
      alert('Please enter both Role Title and Company Name.');
      return;
    }

    const currentSiteSlug = activeWebsite?.slug || activeWebsite?.id || 'dev-mate';
    const payload = {
      role: formData.role,
      company: formData.company,
      category: formData.category,
      period: formData.period,
      location: formData.location,
      status: formData.status,
      is_current: formData.status === 'CURRENT',
      description: formData.description,
      visible: formData.visible,
      website: currentSiteSlug
    };

    if (editingId) {
      setExperiences(experiences.map(e => e.id === editingId ? { ...formData, id: editingId } : e));
      try {
        await experiencesApi.update(editingId, payload);
      } catch {
        // Fallback
      }
    } else {
      const tempId = Date.now();
      const newEntry = { ...formData, id: tempId };
      setExperiences([newEntry, ...experiences]);
      try {
        const created = await experiencesApi.create(payload);
        if (created && created.id) {
          setExperiences(prev => prev.map(e => e.id === tempId ? { ...e, id: created.id } : e));
        }
      } catch {
        // Fallback
      }
    }

    setViewMode('LIST');
    setEditingId(null);
    window.scrollTo(0, 0);
  };

  // Delete experience
  const handleDelete = async (id) => {
    if (confirm('Delete this experience entry?')) {
      setExperiences(experiences.filter(e => e.id !== id));
      try {
        await experiencesApi.delete(id);
      } catch {
        // Fallback
      }
    }
  };

  // Toggle visibility directly on card
  const handleToggleVisible = async (id) => {
    setExperiences(experiences.map(e => e.id === id ? { ...e, visible: !e.visible } : e));
    try {
      await experiencesApi.toggleVisibility(id);
    } catch {
      // Fallback
    }
  };

  // ==========================================
  // VIEW 1: SEPARATE DEDICATED ADD / EDIT PAGE
  // ==========================================
  if (viewMode === 'EDITOR') {
    const isEditing = editingId !== null;
    return (
      <div className="space-y-6 w-full max-w-full overflow-x-hidden font-sans animate-in fade-in duration-150">
        {/* Top Header */}
        <div className="p-4 sm:p-5 rounded-xl bg-[#12151f] border border-[#222738] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/30">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                <span className="font-accent">{isEditing ? `Edit Experience: ${formData.role}` : 'Add New Experience Record'}</span>
              </h1>
              <p className="text-xs text-neutral-400 mt-0.5">
                {isEditing ? 'Modify experience details, tenure dates, and visibility settings.' : 'Fill in the details below to add a new career milestone.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleBackToList}
              className="px-4 py-2 rounded-lg bg-[#0d1018] hover:bg-[#161a28] text-neutral-300 text-xs font-semibold border border-[#222738] transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSaveForm}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:brightness-110 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-violet-500/20 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'Save Changes' : 'Save & Publish Experience'}</span>
            </button>
          </div>
        </div>

        {/* Dedicated Form Card */}
        <div className="p-6 sm:p-8 rounded-xl bg-[#12151f] border border-[#222738] shadow-2xl space-y-6">
          <form onSubmit={handleSaveForm} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
                  Role Title <span className="text-violet-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                  placeholder="e.g. Lead Platform Architect"
                  className="w-full px-4 py-2.5 rounded-lg bg-[#0d1018] border border-[#222738] text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500/30 transition-all font-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
                  Company / Organization <span className={activeWebsite?.accentText || "text-violet-400"}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.company}
                  onChange={e => setFormData({ ...formData, company: e.target.value })}
                  placeholder="e.g. DevAdmin Cloud Labs"
                  className={`w-full px-4 py-2.5 rounded-lg bg-[#0d1018] border border-[#222738] text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500/30 transition-all font-accent ${activeWebsite?.accentText || 'text-violet-400'}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
                  Domain / Category
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g. Full-Stack Engineering, Frontend Architecture"
                  className="w-full px-4 py-2.5 rounded-lg bg-[#0d1018] border border-[#222738] text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500/30 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
                  Employment Status
                </label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ 
                    ...formData, 
                    status: e.target.value, 
                    left: e.target.value === 'CURRENT' ? 'Present' : (formData.left === 'Present' ? '' : formData.left) 
                  })}
                  className="w-full px-4 py-2.5 rounded-lg bg-[#0d1018] border border-[#222738] text-sm text-white focus:outline-none focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500/30 transition-all"
                >
                  <option value="CURRENT">CURRENT (Active Position)</option>
                  <option value="PAST">PAST (Former Position)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <CustomDatePicker
                  label="Start / Joined Date"
                  value={formData.joined}
                  onChange={val => setFormData({ ...formData, joined: val })}
                  activeWebsite={activeWebsite}
                  placeholder="Select join date"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
                  End Date / Current Status
                </label>
                <input
                  type="text"
                  value={formData.left}
                  onChange={e => setFormData({ ...formData, left: e.target.value })}
                  placeholder="e.g. Present or 2024-12-31"
                  className="w-full px-4 py-2.5 rounded-lg bg-[#0d1018] border border-[#222738] text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500/30 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
                Role Description & Key Responsibilities
              </label>
              <textarea
                rows={5}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detail your responsibilities, architecture decisions, and tech stack utilized..."
                className="w-full p-4 rounded-lg bg-[#0d1018] border border-[#222738] text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500/30 resize-none leading-relaxed transition-all"
              />
            </div>

            {/* Visibility Toggle */}
            <div className="p-4 rounded-lg bg-[#0d1018] border border-[#1f2436] flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white">Portfolio Visibility</div>
                <p className="text-xs text-neutral-400 mt-0.5">Control whether this experience record appears publicly on your live portfolio.</p>
              </div>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, visible: !formData.visible })}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                  formData.visible
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                }`}
              >
                {formData.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <span>{formData.visible ? 'Visible on Portfolio' : 'Hidden from Public'}</span>
              </button>
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-[#222738]">
              <button
                type="button"
                onClick={handleBackToList}
                className="px-5 py-2.5 rounded-lg bg-[#0d1018] hover:bg-[#161a28] text-neutral-300 text-xs sm:text-sm font-semibold border border-[#222738] transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:brightness-110 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-violet-500/20 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{isEditing ? 'Save Changes' : 'Save & Publish Experience'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: EXPERIENCES 3-CARD GRID VIEW
  // ==========================================
  return (
    <div className="space-y-5 w-full max-w-full overflow-x-hidden font-sans">
      {/* Header Banner with Category Dropdown & Add Button */}
      <div className="p-4 sm:p-5 rounded-xl bg-[#12151f] border border-[#222738] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/30">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold text-white">Manage Experiences</h1>
            <p className="text-xs text-neutral-400 mt-0.5">Manage career milestones and work experience records for your portfolio.</p>
          </div>
        </div>

        {/* Right Actions: Category Dropdown & Add Button */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Category Dropdown — h-9 to match Add button */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="h-9 pl-3.5 pr-8 rounded-lg bg-[#0d1018] border border-[#222738] text-sm font-semibold text-neutral-200 focus:outline-none focus:border-violet-500 transition-colors cursor-pointer appearance-none"
            >
              <option value="ALL">All Categories ({experiences.length})</option>
              {categories.filter(c => c !== 'ALL').map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={handleOpenAddPage}
            className="h-9 px-4 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:brightness-110 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-violet-500/20 transition-all flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Experience</span>
          </button>
        </div>
      </div>

      {/* Experiences Grid or Empty State */}
      {filteredExperiences.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#12151f] border border-[#222738] space-y-3 shadow-xl">
          <Briefcase className="w-10 h-10 mx-auto text-neutral-600" />
          <h3 className="text-base font-bold text-white">No Experiences Found</h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            {selectedCategory === 'ALL' 
              ? 'There are no experience records added yet. Click "+ Add New Experience" to create your career history.' 
              : `No experiences found in category "${selectedCategory}".`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredExperiences.map(exp => (
            <div key={exp.id} className="p-5 rounded-xl bg-[#12151f] border border-[#222738] hover:border-neutral-600 transition-all duration-200 flex flex-col justify-between shadow-xl space-y-4 group">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-extrabold text-white line-clamp-1 font-accent">
                      {exp.role}
                    </h3>
                    <div className="text-xs font-bold text-violet-400 truncate mt-0.5 font-accent">
                      @ {exp.company}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 mt-1.5">
                      <Tag className="w-3 h-3 text-violet-400 flex-shrink-0" />
                      <span className="truncate">{exp.category}</span>
                    </div>
                  </div>

                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wide flex-shrink-0 ${
                    exp.status === 'CURRENT'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                  }`}>
                    {exp.status}
                  </span>
                </div>

                <p className="text-xs text-neutral-300 line-clamp-3 leading-relaxed font-normal">
                  {exp.description}
                </p>

                <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 pt-3 border-t border-[#222738]">
                  <Calendar className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                  <span className="truncate">Tenure: {exp.joined} — {exp.left}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-[#222738] gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleVisible(exp.id)}
                  className={`h-9 px-3 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all flex-shrink-0 ${
                    exp.visible
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                      : 'bg-neutral-800/60 text-neutral-400 border border-neutral-700 hover:bg-neutral-800'
                  }`}
                  title="Toggle Live Visibility"
                >
                  {exp.visible ? <Eye className="w-4 h-4 flex-shrink-0" /> : <EyeOff className="w-4 h-4 flex-shrink-0" />}
                  <span>{exp.visible ? 'Visible' : 'Hidden'}</span>
                </button>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEditPage(exp)}
                    className="h-9 px-3 rounded-lg bg-[#0d1018] hover:bg-[#161a28] text-neutral-200 hover:text-white text-sm font-semibold flex items-center gap-1.5 border border-[#222738] transition-all"
                  >
                    <Edit2 className="w-4 h-4" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(exp.id)}
                    className="h-9 w-9 rounded-lg bg-rose-950/20 hover:bg-rose-950/50 text-rose-400 border border-rose-900/40 hover:border-rose-700/60 transition-all flex items-center justify-center"
                    title="Delete Experience"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
