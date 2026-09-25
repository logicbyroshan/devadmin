import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Plus, 
  Edit2, 
  Trash2, 
  Code2, 
  Layers, 
  Server, 
  Terminal, 
  Database,
  Save, 
  Eye, 
  EyeOff, 
  ChevronDown,
  Tag
} from 'lucide-react';
import { skillsApi } from '../services/api';

export default function SkillsView({ onNavigate, activeWebsite }) {
  const [viewMode, setViewMode] = useState('LIST'); // 'LIST' | 'EDITOR'
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [skills, setSkills] = useState([]);

  // Unified separate Add/Edit form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'Frontend',
    level: 85,
    icon: 'code',
    years: '2+ Years',
    visible: true
  });

  const categories = ['ALL', ...Array.from(new Set(skills.map(s => s.category).filter(Boolean)))];

  const filteredSkills = skills.filter(s => {
    if (selectedCategory === 'ALL') return true;
    return s.category === selectedCategory;
  });

  // Fetch skills from Django REST Framework API with multi-tenant filtering
  useEffect(() => {
    let isMounted = true;
    const fetchSkills = async () => {
      try {
        setIsLoading(true);
        const siteSlug = activeWebsite?.slug || activeWebsite?.id || 'dev-mate';
        const data = await skillsApi.getAll({ website: siteSlug });
        const list = Array.isArray(data) ? data : (data.results || []);
        if (isMounted) {
          setSkills(list.map(s => ({
            id: s.id,
            name: s.name,
            category: s.category || 'Frontend',
            level: s.level || 85,
            icon: s.icon_name || s.icon || 'code',
            years: s.years_experience || '3+ Years',
            visible: s.visible !== false
          })));
        }
      } catch (err) {
        console.error('Failed to load skills:', err);
        if (isMounted) setSkills([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchSkills();
    return () => { isMounted = false; };
  }, [activeWebsite]);

  // Open separate Editor Page for Adding
  const handleOpenAddPage = () => {
    setEditingId(null);
    setFormData({
      name: '',
      category: 'Frontend',
      level: 80,
      icon: 'code',
      years: '2+ Years',
      visible: true
    });
    setViewMode('EDITOR');
    window.scrollTo(0, 0);
  };

  // Open separate Editor Page for Editing
  const handleOpenEditPage = (skill) => {
    setEditingId(skill.id);
    setFormData({ ...skill });
    setViewMode('EDITOR');
    window.scrollTo(0, 0);
  };

  // Return to List View
  const handleBackToList = () => {
    setViewMode('LIST');
    setEditingId(null);
    window.scrollTo(0, 0);
  };

  // Save Form (Handles both Add and Edit on the separate page)
  const handleSaveForm = async (e) => {
    e?.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter a Skill Name.');
      return;
    }

    const currentSiteSlug = activeWebsite?.slug || activeWebsite?.id || 'dev-mate';
    const payload = {
      name: formData.name,
      category: formData.category,
      level: formData.level,
      icon_name: formData.icon,
      visible: formData.visible,
      website: currentSiteSlug
    };

    if (editingId) {
      setSkills(skills.map(s => s.id === editingId ? { ...formData, id: editingId } : s));
      try {
        await skillsApi.update(editingId, payload);
      } catch {
        // Fallback
      }
    } else {
      const tempId = Date.now();
      const newEntry = { ...formData, id: tempId };
      setSkills([...skills, newEntry]);
      try {
        const created = await skillsApi.create(payload);
        if (created && created.id) {
          setSkills(prev => prev.map(s => s.id === tempId ? { ...s, id: created.id } : s));
        }
      } catch {
        // Fallback
      }
    }

    setViewMode('LIST');
    setEditingId(null);
    window.scrollTo(0, 0);
  };

  // Delete skill
  const handleDelete = async (id) => {
    if (confirm('Delete this skill record?')) {
      setSkills(skills.filter(s => s.id !== id));
      try {
        await skillsApi.delete(id);
      } catch {
        // Fallback
      }
    }
  };

  // Toggle visibility directly
  const handleToggleVisible = async (id) => {
    setSkills(skills.map(s => s.id === id ? { ...s, visible: !s.visible } : s));
    try {
      await skillsApi.toggleVisibility(id);
    } catch {
      // Fallback
    }
  };

  const getSkillIcon = (iconName) => {
    switch (iconName) {
      case 'server': return Server;
      case 'terminal': return Terminal;
      case 'database': return Database;
      case 'layers': return Layers;
      default: return Code2;
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
        <div className="p-4 sm:p-5 rounded-xl bg-[#07080d] border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                <span className="font-accent">{isEditing ? `Edit Skill: ${formData.name}` : 'Add New Tech Stack Skill'}</span>
              </h1>
              <p className="text-xs text-neutral-400 mt-0.5">
                {isEditing ? 'Configure proficiency percentage, experience tenure, and visibility.' : 'Add a new programming language, framework, or cloud tool to your portfolio.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleBackToList}
              className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-semibold border border-neutral-800 transition-colors"
            >
              Cancel
            </button>


            <button
              type="button"
              onClick={handleSaveForm}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'Save Changes' : 'Save & Publish Skill'}</span>
            </button>
          </div>
        </div>

        {/* Dedicated Separate Form Container */}
        <div className="p-6 sm:p-8 rounded-xl bg-[#07080d] border border-neutral-800 shadow-2xl space-y-6">
          <form onSubmit={handleSaveForm} className="space-y-6">
            {/* Name & Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
                  Skill / Technology Name <span className={activeWebsite?.accentText || "text-blue-400"}>*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. React 18, PostgreSQL, Kubernetes"
                  className="w-full px-4 py-2.5 rounded-lg bg-[#050609] border border-neutral-800 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 transition-all font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
                  Stack Category
                </label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg bg-[#050609] border border-neutral-800 text-sm text-white focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 transition-all"
                >
                  <option value="Frontend">Frontend Development</option>
                  <option value="Backend">Backend & APIs</option>
                  <option value="Database">Databases & Storage</option>
                  <option value="DevOps & Tools">DevOps & Cloud Tools</option>
                </select>
              </div>
            </div>

            {/* Proficiency Level & Experience Tenure */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                    Proficiency Level ({formData.level}%)
                  </label>
                  <span className={`text-sm font-bold ${activeWebsite?.accentText || 'text-blue-400'}`}>{formData.level}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={formData.level}
                  onChange={e => setFormData({ ...formData, level: parseInt(e.target.value) })}
                  className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
                  Experience Tenure
                </label>
                <input
                  type="text"
                  value={formData.years}
                  onChange={e => setFormData({ ...formData, years: e.target.value })}
                  placeholder="e.g. 4+ Years"
                  className="w-full px-4 py-2.5 rounded-lg bg-[#050609] border border-neutral-800 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 transition-all"
                />
              </div>
            </div>

            {/* Visibility Toggle */}
            <div className="p-4 rounded-lg bg-black/50 border border-neutral-800/80 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white">Live Portfolio Visibility</div>
                <p className="text-xs text-neutral-400 mt-0.5">Control whether this skill tag is shown on your public portfolio tech stack.</p>
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

            {/* Form Actions Footer */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-neutral-800">
              <button
                type="button"
                onClick={handleBackToList}
                className="px-5 py-2.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs sm:text-sm font-semibold border border-neutral-800 transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{isEditing ? 'Save Changes' : 'Save & Publish Skill'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: SKILLS 3-CARD GRID VIEW
  // ==========================================
  return (
    <div className="space-y-5 w-full max-w-full overflow-x-hidden font-sans">
      {/* Header Banner with Category Dropdown & Add Button */}
      <div className="p-4 sm:p-5 rounded-xl bg-[#07080d] border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold text-white">Manage Skills & Tech Stack</h1>
            <p className="text-xs text-neutral-400 mt-0.5">Configure technical proficiencies, percentage meters, and stack categories.</p>
          </div>
        </div>

        {/* Right Actions: Category Filter Dropdown & Add Button */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Category Dropdown — h-9 to match Add button */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="h-9 pl-3.5 pr-8 rounded-lg bg-neutral-900/60 border border-neutral-800 text-sm font-semibold text-neutral-200 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer appearance-none"
            >
              <option value="ALL">All Categories ({skills.length})</option>
              {categories.filter(c => c !== 'ALL').map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={handleOpenAddPage}
            className="h-9 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Skill</span>
          </button>
        </div>
      </div>

      {/* 3-Card Format Grid or Empty State */}
      {filteredSkills.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-[#07080d] border border-neutral-800 text-neutral-400 space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mx-auto">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No Skills Configured</h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
              You haven't added any tech stack skills or proficiencies yet. Click below to add your first skill.
            </p>
          </div>
          <button
            onClick={handleOpenAddPage}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs inline-flex items-center gap-2 shadow-lg shadow-blue-500/20 hover:brightness-110 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Skill</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSkills.map((skill) => {
            const Icon = getSkillIcon(skill.icon);
            return (
              <div key={skill.id} className="p-5 rounded-xl bg-[#07080d] border border-neutral-800 hover:border-neutral-700 transition-all duration-200 flex flex-col justify-between shadow-lg space-y-4 group">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30 flex-shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-extrabold text-white truncate font-accent">{skill.name}</h3>
                        <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                          <Tag className="w-3 h-3 text-blue-400" />
                          <span>{skill.category}</span>
                          <span>•</span>
                          <span className="text-neutral-300 font-semibold">{skill.years}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-sm font-bold text-blue-400 font-accent flex-shrink-0">
                      {skill.level}%
                    </div>
                  </div>

                  {/* Progress Bar Track */}
                  <div className="w-full bg-neutral-900 rounded-sm h-2.5 overflow-hidden border border-neutral-800/80 mt-2">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-sm shadow-sm shadow-blue-500/30"
                      style={{ width: `${skill.level}%` }}
                    ></div>
                  </div>
                </div>

                {/* Action Buttons — consistent h-9 (36px) */}
                <div className="flex items-center justify-between pt-3 border-t border-neutral-800/80 gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleVisible(skill.id)}
                    className={`h-9 px-3 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all flex-shrink-0 ${
                      skill.visible
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                        : 'bg-neutral-800/60 text-neutral-400 border border-neutral-700 hover:bg-neutral-800'
                    }`}
                    title="Toggle Live Visibility"
                  >
                    {skill.visible ? <Eye className="w-4 h-4 flex-shrink-0" /> : <EyeOff className="w-4 h-4 flex-shrink-0" />}
                    <span>{skill.visible ? 'Visible' : 'Hidden'}</span>
                  </button>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEditPage(skill)}
                      className="h-9 px-3 rounded-lg bg-neutral-900/60 hover:bg-neutral-800 text-neutral-200 hover:text-white text-sm font-semibold flex items-center gap-1.5 border border-neutral-800 transition-all"
                    >
                      <Edit2 className="w-4 h-4" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(skill.id)}
                      className="h-9 w-9 rounded-lg bg-rose-950/20 hover:bg-rose-950/50 text-rose-400 border border-rose-900/40 hover:border-rose-700/60 transition-all flex items-center justify-center"
                      title="Delete Skill"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
