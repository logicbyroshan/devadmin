import React, { useState, useEffect } from 'react';
import { 
  FolderKanban, 
  Plus, 
  Edit2, 
  Trash2, 
  Globe, 
  Github, 
  Calendar, 
  Eye, 
  EyeOff, 
  Save, 
  Tag, 
  ChevronDown
} from 'lucide-react';
import RichContentBuilder from './RichContentBuilder';
import CustomDatePicker from './CustomDatePicker';
import { projectsApi } from '../services/api';

export default function ProjectsView({ onNavigate, activeWebsite }) {
  const [viewMode, setViewMode] = useState('LIST'); // 'LIST' | 'EDITOR'
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState([]);

  // Form state for unified separate Add/Edit page
  const [formData, setFormData] = useState({
    title: '',
    projectName: '',
    status: 'LIVE',
    category: 'Web Application',
    technologies: '',
    description: '',
    documentation: '',
    completed: new Date().toISOString().split('T')[0],
    image: '',
    demoUrl: '',
    liveUrl: '',
    githubUrl: '',
    visible: true,
    featured: false
  });

  const categories = ['ALL', ...Array.from(new Set(projects.map(p => p.category).filter(Boolean)))];

  const filteredProjects = projects.filter(p => {
    if (selectedCategory === 'ALL') return true;
    return p.category === selectedCategory;
  });

  // Fetch projects from Django REST Framework API
  useEffect(() => {
    let isMounted = true;
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        const siteSlug = activeWebsite?.slug || activeWebsite?.id || 'dev-mate';
        const data = await projectsApi.getAll({ website: siteSlug });
        const list = Array.isArray(data) ? data : (data.results || []);
        if (isMounted) {
          setProjects(list.map(p => ({
            id: p.id,
            title: p.title,
            projectName: p.project_name || p.title,
            status: p.status || 'LIVE',
            category: p.category || 'Web Application',
            description: p.description || '',
            documentation: p.documentation || p.description || '',
            technologies: Array.isArray(p.technologies) ? p.technologies.join(', ') : (p.technologies || ''),
            completed: p.completed_date || p.completed || '',
            image: p.image || p.thumbnail || '',
            demoUrl: p.demo_url || p.demoUrl || '',
            liveUrl: p.live_url || p.liveUrl || '',
            githubUrl: p.github_url || p.githubUrl || '',
            visible: p.visible !== false && p.is_active !== false,
            featured: p.featured || p.is_featured || false,
            views: p.views || 0,
            likes: p.likes || 0
          })));
        }
      } catch (err) {
        console.error('Failed to load projects:', err);
        if (isMounted) setProjects([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchProjects();
    return () => { isMounted = false; };
  }, [activeWebsite]);

  // Open separate Editor Page for Adding
  const handleOpenAddPage = () => {
    setEditingId(null);
    setFormData({
      title: '',
      projectName: '',
      status: 'active',
      category: 'Web Application',
      technologies: 'Python, Django, React, PostgreSQL',
      description: 'High-performance cloud architecture and developer tool suite.',
      documentation: `## 🚀 Project Overview

Describe the core problem this project solves and architectural decisions.

### 🏛️ System Architecture Topology

\`\`\`architecture:microservices
title: System Topology & Ingress Flow
nodes:
  - [Web Frontend Client] -> [Ingress Load Balancer]
  - [Ingress Load Balancer] -> [API Gateway Service]
  - [API Gateway Service] -> [Relational Storage Cluster]
\`\`\`

### ⚡ Performance Benchmarks

\`\`\`chart:barchart
title: Throughput & Latency Benchmarks
unit: req/s
data:
  - Optimized Pipeline: 110000
  - Legacy Pipeline: 35000
\`\`\`
`,
      completed: new Date().toISOString().split('T')[0],
      image: '',
      demoUrl: '',
      liveUrl: '',
      githubUrl: '',
      visible: true,
      featured: false
    });
    setViewMode('EDITOR');
    window.scrollTo(0, 0);
  };

  // Open separate Editor Page for Editing
  const handleOpenEditPage = (proj) => {
    setEditingId(proj.id);
    setFormData({
      ...proj,
      documentation: proj.documentation || proj.description,
      description: proj.description || proj.documentation?.slice(0, 200) || '',
    });
    setViewMode('EDITOR');
    window.scrollTo(0, 0);
  };

  // Return to List View
  const handleBackToList = () => {
    setViewMode('LIST');
    setEditingId(null);
    window.scrollTo(0, 0);
  };

  // Save Form (Add or Edit)
  const handleSaveForm = async (e) => {
    e?.preventDefault();
    if (!formData.title.trim()) {
      alert('Please enter a Project Title.');
      return;
    }

    const payload = {
      title: formData.title,
      project_name: formData.projectName || formData.title,
      slug: formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `project-${Date.now()}`,
      status: formData.status,
      category: formData.category,
      description: formData.description || formData.documentation?.slice(0, 200) || '',
      documentation: formData.documentation || formData.description || '',
      technologies: formData.technologies || '',
      completed_date: formData.completed,
      image: formData.image,
      demo_url: formData.demoUrl,
      live_url: formData.liveUrl || formData.demoUrl,
      github_url: formData.githubUrl,
      visible: formData.visible,
      is_active: formData.visible,
      featured: formData.featured,
      is_featured: formData.featured,
      website: 'dev-mate'
    };

    if (editingId) {
      setProjects(projects.map(p => p.id === editingId ? { ...formData, id: editingId } : p));
      try {
        await projectsApi.patch(editingId, payload);
      } catch {
        // Fallback local update maintained
      }
    } else {
      const tempId = Date.now();
      const newEntry = { ...formData, id: tempId };
      setProjects([newEntry, ...projects]);
      try {
        const created = await projectsApi.create(payload);
        if (created && created.id) {
          setProjects(prev => prev.map(p => p.id === tempId ? { ...p, id: created.id } : p));
        }
      } catch {
        // Fallback local creation maintained
      }
    }

    setViewMode('LIST');
    setEditingId(null);
    window.scrollTo(0, 0);
  };

  // Delete project
  const handleDelete = async (id) => {
    if (confirm('Delete project portfolio item?')) {
      setProjects(projects.filter(p => p.id !== id));
      try {
        await projectsApi.delete(id);
      } catch {
        // Fallback
      }
    }
  };

  // Toggle visibility
  const handleToggleVisible = async (id) => {
    setProjects(projects.map(p => p.id === id ? { ...p, visible: !p.visible } : p));
    try {
      await projectsApi.toggleVisibility(id);
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
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                <span className="font-accent">{isEditing ? `Edit Project: ${formData.title}` : 'Add New Portfolio Project'}</span>
              </h1>
              <p className="text-xs text-neutral-400 mt-0.5">
                {isEditing ? 'Update project repository URLs, live demo endpoints, and architectural documentation.' : 'Publish a new development project to your showcase.'}
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
              <span>{isEditing ? 'Save Changes' : 'Save & Publish Project'}</span>
            </button>
          </div>
        </div>

        {/* Dedicated Separate Form Container with Rich Content Builder */}
        <div className="p-6 sm:p-8 rounded-xl bg-[#12151f] border border-[#222738] shadow-2xl space-y-6">
          <form onSubmit={handleSaveForm} className="space-y-6">
            {/* Title & Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
                  Project Title <span className={activeWebsite?.accentText || "text-violet-400"}>*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Real-Time Distributed Collaboration Suite"
                  className="w-full px-4 py-2.5 rounded-lg bg-[#0d1018] border border-[#222738] text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500/30 transition-all font-accent font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
                  Category Tag
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g. Web Application, Cloud Architecture"
                  className="w-full px-4 py-2.5 rounded-lg bg-[#0d1018] border border-[#222738] text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500/30 transition-all"
                />
              </div>
            </div>

            {/* Status & Completion Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
                  Deployment Status
                </label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg bg-[#0d1018] border border-[#222738] text-sm text-white focus:outline-none focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500/30 transition-all"
                >
                  <option value="LIVE">LIVE (Public Online)</option>
                  <option value="OFFLINE">OFFLINE (In Development / Archival)</option>
                </select>
              </div>

              <div>
                <CustomDatePicker
                  label="Completion / Release Date"
                  value={formData.completed}
                  onChange={val => setFormData({ ...formData, completed: val })}
                  activeWebsite={activeWebsite}
                  placeholder="Select release date"
                />
              </div>
            </div>

            {/* Demo URL & GitHub Repository URL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
                  Live Demo URL
                </label>
                <input
                  type="url"
                  value={formData.demoUrl}
                  onChange={e => setFormData({ ...formData, demoUrl: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2.5 rounded-lg bg-[#0d1018] border border-[#222738] text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500/30 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
                  GitHub Repository URL
                </label>
                <input
                  type="url"
                  value={formData.githubUrl}
                  onChange={e => setFormData({ ...formData, githubUrl: e.target.value })}
                  placeholder="https://github.com/username/project-repo"
                  className="w-full px-4 py-2.5 rounded-lg bg-[#0d1018] border border-[#222738] text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500/30 transition-all"
                />
              </div>
            </div>

            {/* Showcase Image URL */}
            <div>
              <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
                Cover Screenshot / Image URL
              </label>
              <input
                type="text"
                value={formData.image}
                onChange={e => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full px-4 py-2.5 rounded-lg bg-[#0d1018] border border-[#222738] text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500/30 transition-all font-mono text-xs"
              />
            </div>

            {/* Executive Pitch / Summary */}
            <div>
              <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
                Executive Pitch / Summary (Card Preview)
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Short summary pitch for portfolio card preview..."
                className="w-full p-3.5 rounded-lg bg-[#0d1018] border border-[#222738] text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500/30 resize-none leading-relaxed transition-all"
              />
            </div>

            {/* ULTRA-RICH CONTENT BUILDER (Architecture, Benchmarks, Video, Code) */}
            <div className="pt-2">
              <RichContentBuilder
                value={formData.documentation}
                onChange={val => setFormData({ ...formData, documentation: val })}
                label="Project Technical Documentation & System Design"
                placeholder="Detail key architectural decisions, microservice topology, benchmark throughput, and code patterns..."
              />
            </div>

            {/* Visibility Toggle */}
            <div className="p-4 rounded-lg bg-[#0d1018] border border-[#1f2436] flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white">Live Portfolio Visibility</div>
                <p className="text-xs text-neutral-400 mt-0.5">Show or hide this project from your public portfolio gallery.</p>
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
                <span>{isEditing ? 'Save Changes' : 'Save & Publish Project'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: PROJECTS 3-CARD GRID VIEW
  // ==========================================
  return (
    <div className="space-y-5 w-full max-w-full overflow-x-hidden font-sans">
      {/* Header Banner with Category Dropdown & Add Button */}
      <div className="p-4 sm:p-5 rounded-xl bg-[#12151f] border border-[#222738] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/30">
            <FolderKanban className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold text-white">Manage Projects Portfolio</h1>
            <p className="text-xs text-neutral-400 mt-0.5">Showcase your best software projects, live preview links, and GitHub repositories.</p>
          </div>
        </div>

        {/* Right Actions: Category Dropdown & Add Button */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Category Dropdown — same height as Add button (h-9) */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="h-9 pl-3.5 pr-8 rounded-lg bg-[#0d1018] border border-[#222738] text-sm font-semibold text-neutral-200 focus:outline-none focus:border-violet-500 transition-colors cursor-pointer appearance-none"
            >
              <option value="ALL">All Categories ({projects.length})</option>
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
            <span>Add New Project</span>
          </button>
        </div>
      </div>

      {/* Projects Grid or Empty State */}
      {filteredProjects.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#12151f] border border-[#222738] space-y-3 shadow-xl">
          <FolderKanban className="w-10 h-10 mx-auto text-neutral-600" />
          <h3 className="text-base font-bold text-white">No Projects Found</h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            {selectedCategory === 'ALL' 
              ? 'There are no projects created yet. Click "+ Add New Project" to publish your first showcase project.' 
              : `No projects found in category "${selectedCategory}".`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((proj) => (
          <div 
            key={proj.id} 
            className="rounded-xl bg-[#12151f] border border-[#222738] hover:border-neutral-600 transition-all duration-200 overflow-hidden flex flex-col justify-between shadow-xl group"
          >
            <div>
              {/* Card Image Banner */}
              <div className="relative h-44 w-full bg-[#080a10] overflow-hidden border-b border-[#222738] flex items-center justify-center">
                {proj.image ? (
                  <img
                    src={proj.image}
                    alt={proj.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-neutral-600 space-y-1">
                    <Layers className="w-8 h-8 text-neutral-600" />
                    <span className="text-[11px] font-medium text-neutral-500">No Image Uploaded</span>
                  </div>
                )}
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-extrabold uppercase tracking-wide ${
                    proj.status === 'LIVE'
                      ? 'bg-emerald-500/90 text-slate-950 shadow-md shadow-emerald-500/30'
                      : 'bg-black/90 text-neutral-300 border border-neutral-700'
                  }`}>
                    {proj.status}
                  </span>
                </div>
                <div className="absolute bottom-3 left-3">
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-[#080a10]/90 backdrop-blur-md text-violet-400 border border-violet-500/30">
                    {proj.category}
                  </span>
                </div>
              </div>

              {/* Content Details */}
              <div className="p-5 space-y-3">
                <h3 className="text-base font-extrabold text-white group-hover:text-violet-400 transition-colors line-clamp-1 font-accent">
                  {proj.title}
                </h3>
                <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed font-normal">
                  {proj.description.replace(/#|\*|`|\[|\]/g, '').substring(0, 120)}...
                </p>

                <div className="flex items-center gap-2 text-[11px] text-neutral-400 pt-2 border-t border-[#222738]">
                  <Calendar className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                  <span>Completed: {proj.completed}</span>
                </div>
              </div>
            </div>

            {/* Card Action Buttons */}
            <div className="px-4 py-3 flex items-center justify-between gap-2 border-t border-[#222738]">
              <button
                type="button"
                onClick={() => handleToggleVisible(proj.id)}
                className={`h-9 px-3 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all flex-shrink-0 ${
                  proj.visible
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                    : 'bg-neutral-800/60 text-neutral-400 border border-neutral-700 hover:bg-neutral-800'
                }`}
                title="Toggle Live Visibility"
              >
                {proj.visible ? <Eye className="w-4 h-4 flex-shrink-0" /> : <EyeOff className="w-4 h-4 flex-shrink-0" />}
                <span>{proj.visible ? 'Visible' : 'Hidden'}</span>
              </button>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                {proj.demoUrl && proj.demoUrl !== '#' && (
                  <a
                    href={proj.demoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="h-9 w-9 rounded-lg bg-[#0d1018] hover:bg-[#161a28] text-neutral-300 hover:text-white border border-[#222738] transition-colors flex items-center justify-center"
                    title="Live Demo"
                  >
                    <Globe className="w-4 h-4" />
                  </a>
                )}
                <button
                  onClick={() => handleOpenEditPage(proj)}
                  className="h-9 px-3 rounded-lg bg-[#0d1018] hover:bg-[#161a28] text-neutral-200 hover:text-white text-sm font-semibold flex items-center gap-1.5 border border-[#222738] transition-all"
                >
                  <Edit2 className="w-4 h-4" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(proj.id)}
                  className="h-9 w-9 rounded-lg bg-rose-950/20 hover:bg-rose-950/50 text-rose-400 border border-rose-900/40 hover:border-rose-700/60 transition-all flex items-center justify-center"
                  title="Delete Project"
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
