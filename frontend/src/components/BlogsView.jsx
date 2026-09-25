import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Edit2, 
  Trash2, 
  Calendar, 
  Eye, 
  EyeOff, 
  Clock, 
  Tag, 
  Save, 
  ChevronDown
} from 'lucide-react';
import RichContentBuilder from './RichContentBuilder';
import CustomDatePicker from './CustomDatePicker';
import { blogsApi } from '../services/api';

export default function BlogsView({ onNavigate, activeWebsite }) {
  const [viewMode, setViewMode] = useState('LIST'); // 'LIST' | 'EDITOR'
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [editingId, setEditingId] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [blogs, setBlogs] = useState([]);

  // Form state for unified separate Add/Edit page
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    category: 'React & Frontend',
    status: 'PUBLISHED',
    date: new Date().toISOString().split('T')[0],
    readTime: '5 min read',
    views: 0,
    summary: '',
    content: '',
    visible: true
  });

  const categories = ['ALL', ...Array.from(new Set(blogs.map(b => b.category).filter(Boolean)))];

  const filteredBlogs = blogs.filter(b => {
    if (selectedCategory === 'ALL') return true;
    return b.category === selectedCategory;
  });

  // Fetch blogs from Django REST Framework API
  useEffect(() => {
    let isMounted = true;
    const fetchBlogs = async () => {
      try {
        setIsLoading(true);
        const siteSlug = activeWebsite?.slug || activeWebsite?.id || 'dev-mate';
        const data = await blogsApi.getAll({ website: siteSlug });
        const list = Array.isArray(data) ? data : (data.results || []);
        if (isMounted) {
          setBlogs(list.map(b => ({
            id: b.id,
            title: b.title,
            subtitle: b.subtitle || '',
            slug: b.slug || '',
            category: b.category || 'Architecture & Distributed Systems',
            status: b.status || 'PUBLISHED',
            date: b.date || (b.created_at ? b.created_at.split('T')[0] : 'Recently'),
            readTime: b.read_time || b.readTime || '5 min read',
            views: b.views_count || b.views || 0,
            summary: b.summary || b.tldr || '',
            tldr: b.tldr || b.summary || '',
            content: b.content || '',
            image: b.image || '',
            tags: b.tags || [],
            visible: b.visible !== false && b.is_active !== false
          })));
        }
      } catch (err) {
        console.error('Failed to load blogs:', err);
        if (isMounted) setBlogs([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchBlogs();
    return () => { isMounted = false; };
  }, [activeWebsite]);

  // Open separate Editor Page for Adding
  const handleOpenAddPage = () => {
    setEditingId(null);
    setFormData({
      title: '',
      subtitle: '',
      slug: '',
      category: 'Architecture & Distributed Systems',
      status: 'PUBLISHED',
      date: new Date().toISOString().split('T')[0],
      readTime: '5 min read',
      views: 0,
      summary: '',
      tldr: '',
      image: '',
      tags: [],
      content: `## 🚀 Introduction

Write your comprehensive technical documentation here...

### 🏛️ Architecture & System Flow

\`\`\`architecture:microservices
title: System Architecture Flow
nodes:
  - [Client Application] -> [API Gateway Layer]
  - [API Gateway Layer] -> [Core Backend Microservice]
  - [Core Backend Microservice] -> [Database Storage Pool]
\`\`\`

### ⚡ Performance Benchmarks

\`\`\`chart:barchart
title: Performance Benchmark Comparison
unit: Req/s
data:
  - Optimized Version: 95000
  - Baseline Version: 32000
\`\`\`
`,
      visible: true
    });
    setViewMode('EDITOR');
    window.scrollTo(0, 0);
  };

  // Open separate Editor Page for Editing
  const handleOpenEditPage = (blog) => {
    setEditingId(blog.id);
    setFormData({
      ...blog,
      subtitle: blog.subtitle || '',
      summary: blog.summary || blog.tldr || '',
      tldr: blog.tldr || blog.summary || '',
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

  // Save Blog (Add or Edit)
  const handleSaveForm = async (e) => {
    e?.preventDefault();
    if (!formData.title.trim()) {
      alert('Please enter an Article Title.');
      return;
    }

    const payload = {
      title: formData.title,
      subtitle: formData.subtitle || '',
      slug: formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `blog-${Date.now()}`,
      category: formData.category,
      status: formData.status,
      date: formData.date,
      read_time: formData.readTime,
      summary: formData.summary || formData.tldr || '',
      tldr: formData.tldr || formData.summary || '',
      content: formData.content,
      image: formData.image || '',
      tags: formData.tags || [],
      visible: formData.visible,
      is_active: formData.visible,
      website: 'dev-mate'
    };

    if (editingId) {
      setBlogs(blogs.map(b => b.id === editingId ? { ...formData, id: editingId } : b));
      try {
        await blogsApi.update(editingId, payload);
      } catch {
        // Fallback
      }
    } else {
      const tempId = Date.now();
      const newEntry = { ...formData, id: tempId };
      setBlogs([newEntry, ...blogs]);
      try {
        const created = await blogsApi.create(payload);
        if (created && created.id) {
          setBlogs(prev => prev.map(b => b.id === tempId ? { ...b, id: created.id } : b));
        }
      } catch {
        // Fallback
      }
    }

    setViewMode('LIST');
    setEditingId(null);
    window.scrollTo(0, 0);
  };

  // Delete blog
  const handleDelete = async (id) => {
    if (confirm('Delete this blog article?')) {
      setBlogs(blogs.filter(b => b.id !== id));
      try {
        await blogsApi.delete(id);
      } catch {
        // Fallback
      }
    }
  };

  // Toggle visibility directly on card
  const handleToggleVisible = async (id) => {
    setBlogs(blogs.map(b => b.id === id ? { ...b, visible: !b.visible } : b));
    try {
      await blogsApi.toggleVisibility(id);
    } catch {
      // Fallback
    }
  };

  const handleTitleChange = (val) => {
    const generatedSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    setFormData({
      ...formData,
      title: val,
      slug: editingId ? formData.slug : generatedSlug
    });
  };

  // ==========================================
  // VIEW 1: SEPARATE DEDICATED ADD / EDIT PAGE
  // ==========================================
  if (viewMode === 'EDITOR') {
    const isEditing = editingId !== null;
    return (
      <div className="space-y-6 w-full max-w-full overflow-x-hidden font-sans animate-in fade-in duration-150">
        {/* Top Header (Left-side Back button removed, Cancel on right) */}
        <div className="p-4 sm:p-5 rounded-xl bg-[#07080d] border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                <span className="font-accent">{isEditing ? `Edit Article: ${formData.title}` : 'Create New Technical Article'}</span>
              </h1>
              <p className="text-xs text-neutral-400 mt-0.5">
                {isEditing ? 'Update blog metadata, architecture diagrams, benchmark charts, and code.' : 'Compose and publish a rich technical post to your public portfolio blog.'}
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
              <span>{isEditing ? 'Save Changes' : 'Save & Publish Article'}</span>
            </button>
          </div>
        </div>

        {/* Dedicated Separate Form Container with Rich Content Builder */}
        <div className="p-6 sm:p-8 rounded-xl bg-[#07080d] border border-neutral-800 shadow-2xl space-y-6">
          <form onSubmit={handleSaveForm} className="space-y-6">
            {/* Title & Slug */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
                  Article Title <span className="text-blue-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={formData.title}
                  onChange={e => handleTitleChange(e.target.value)}
                  placeholder="e.g. Building Modern Glassmorphism UIs with Tailwind CSS"
                  className="w-full px-4 py-3 rounded-lg bg-black/80 border border-neutral-800 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition-colors font-accent font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
                  URL Slug Identifier
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={e => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="e.g. building-modern-glassmorphism-uis"
                  className="w-full px-4 py-2.5 rounded-lg bg-[#050609] border border-neutral-800 text-sm text-neutral-300 placeholder-neutral-500 focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 transition-all font-mono text-xs"
                />
              </div>
            </div>

            {/* Category & Status & Read Time & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
                  Category Tag
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g. React & Frontend"
                  className="w-full px-4 py-2.5 rounded-lg bg-[#050609] border border-neutral-800 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
                  Publication Status
                </label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg bg-[#050609] border border-neutral-800 text-sm text-white focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 transition-all"
                >
                  <option value="PUBLISHED">PUBLISHED</option>
                  <option value="SCHEDULED">SCHEDULED</option>
                  <option value="DRAFT">DRAFT</option>
                </select>
              </div>

              <div>
                <CustomDatePicker
                  label="Publish Date"
                  value={formData.date}
                  onChange={val => setFormData({ ...formData, date: val })}
                  activeWebsite={activeWebsite}
                  placeholder="Select publish date"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
                  Estimated Read Time
                </label>
                <input
                  type="text"
                  value={formData.readTime}
                  onChange={e => setFormData({ ...formData, readTime: e.target.value })}
                  placeholder="e.g. 5 min read"
                  className="w-full px-4 py-2.5 rounded-lg bg-[#050609] border border-neutral-800 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 transition-all"
                />
              </div>
            </div>

            {/* Summary Excerpt */}
            <div>
              <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
                Summary Excerpt (Meta Description & Card Preview)
              </label>
              <textarea
                rows={2}
                value={formData.summary}
                onChange={e => setFormData({ ...formData, summary: e.target.value })}
                placeholder="Write a concise overview of what readers will learn in this post..."
                className="w-full p-3.5 rounded-lg bg-[#050609] border border-neutral-800 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 resize-none leading-relaxed transition-all"
              />
            </div>

            {/* ULTRA-RICH CONTENT BUILDER (Diagrams, Code, Benchmark Charts, Video, Tables) */}
            <div className="pt-2">
              <RichContentBuilder
                value={formData.content}
                onChange={val => setFormData({ ...formData, content: val })}
                label="Article Body Content & Architecture Documentation"
                placeholder="Write markdown documentation, insert system design diagrams, benchmark charts, video walkthroughs, or code snippets..."
              />
            </div>

            {/* Visibility Toggle */}
            <div className="p-4 rounded-lg bg-black/50 border border-neutral-800/80 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white">Live Portfolio Visibility</div>
                <p className="text-xs text-neutral-400 mt-0.5">Show or hide this article from your public blog index.</p>
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
                <span>{isEditing ? 'Save Changes' : 'Save & Publish Article'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: BLOGS 3-CARD GRID VIEW
  // ==========================================
  return (
    <div className="space-y-5 w-full max-w-full overflow-x-hidden font-sans">
      {/* Header Banner with Category Dropdown & Add Button */}
      <div className="p-4 sm:p-5 rounded-xl bg-[#07080d] border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold text-white">Manage Blog Articles</h1>
            <p className="text-xs text-neutral-400 mt-0.5">Publish technical articles, system design docs, and manage schedules.</p>
          </div>
        </div>

        {/* Right Actions: Category Dropdown & Add Button */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Category Dropdown — h-9 to match Add button */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="h-9 pl-3.5 pr-8 rounded-lg bg-neutral-900/60 border border-neutral-800 text-sm font-semibold text-neutral-200 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer appearance-none"
            >
              <option value="ALL">All Categories ({blogs.length})</option>
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
            <span>Create Blog Post</span>
          </button>
        </div>
      </div>

      {/* Blogs Grid or Empty State */}
      {filteredBlogs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#07080d] border border-neutral-800/80 space-y-3">
          <FileText className="w-10 h-10 mx-auto text-neutral-600" />
          <h3 className="text-base font-bold text-white">No Blog Articles Found</h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            {selectedCategory === 'ALL' 
              ? 'There are no blog articles created yet. Click "+ Create Blog Post" to draft or publish your first article.' 
              : `No articles found in category "${selectedCategory}".`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBlogs.map(blog => (
            <div key={blog.id} className="p-5 rounded-xl bg-[#07080d] border border-neutral-800 hover:border-neutral-700 transition-all duration-200 flex flex-col justify-between shadow-lg space-y-4 group">
              <div className="space-y-3">
                {/* Header: Category & Status */}
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                    <Tag className="w-3.5 h-3.5" />
                    <span>{blog.category}</span>
                  </span>

                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-extrabold uppercase tracking-wide ${
                    blog.status === 'PUBLISHED'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : blog.status === 'SCHEDULED'
                      ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                      : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  }`}>
                    {blog.status}
                  </span>
                </div>

                {/* Title with Courgette font accent */}
                <h3 className="text-sm sm:text-base font-extrabold text-white line-clamp-2 group-hover:text-blue-200 transition-colors leading-snug font-accent">
                  {blog.title}
                </h3>

                {/* Excerpt */}
                <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed font-normal">
                  {blog.summary}
                </p>

                {/* Metadata Row */}
                <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-3 border-t border-neutral-800">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                    <span>{blog.date}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-neutral-500" />
                      <span>{blog.readTime}</span>
                    </span>
                    <span className="text-blue-400 font-bold">
                      {blog.views > 0 ? `${blog.views.toLocaleString()} views` : 'Draft'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons — consistent h-9 (36px) */}
              <div className="flex items-center justify-between pt-3 border-t border-neutral-800/80 gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleVisible(blog.id)}
                  className={`h-9 px-3 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all flex-shrink-0 ${
                    blog.visible
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                      : 'bg-neutral-800/60 text-neutral-400 border border-neutral-700 hover:bg-neutral-800'
                  }`}
                  title="Toggle Live Visibility"
                >
                  {blog.visible ? <Eye className="w-4 h-4 flex-shrink-0" /> : <EyeOff className="w-4 h-4 flex-shrink-0" />}
                  <span>{blog.visible ? 'Visible' : 'Hidden'}</span>
                </button>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEditPage(blog)}
                    className="h-9 px-3 rounded-lg bg-neutral-900/60 hover:bg-neutral-800 text-neutral-200 hover:text-white text-sm font-semibold flex items-center gap-1.5 border border-neutral-800 transition-all"
                  >
                    <Edit2 className="w-4 h-4" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(blog.id)}
                    className="h-9 w-9 rounded-lg bg-rose-950/20 hover:bg-rose-950/50 text-rose-400 border border-rose-900/40 hover:border-rose-700/60 transition-all flex items-center justify-center"
                    title="Delete Blog"
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
