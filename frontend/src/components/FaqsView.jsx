import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  EyeOff, 
  Save, 
  ChevronDown, 
  Tag
} from 'lucide-react';
import { faqsApi } from '../services/api';

export default function FaqsView({ onNavigate, activeWebsite }) {
  const [viewMode, setViewMode] = useState('LIST'); // 'LIST' | 'EDITOR'
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [editingId, setEditingId] = useState(null);

  const [faqs, setFaqs] = useState([]);

  // Form state for separate Add/Edit page
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'Services',
    visible: true
  });

  const categories = ['ALL', ...Array.from(new Set(faqs.map(f => f.category)))];

  const filteredFaqs = faqs.filter(faq => {
    if (selectedCategory === 'ALL') return true;
    return faq.category === selectedCategory;
  });

  // Fetch FAQs from Django REST Framework API with multi-tenant filtering
  useEffect(() => {
    let isMounted = true;
    const fetchFaqs = async () => {
      try {
        const siteSlug = activeWebsite?.slug || activeWebsite?.id || 'dev-mate';
        const data = await faqsApi.getAll({ website: siteSlug });
        const list = Array.isArray(data) ? data : (data.results || []);
        if (isMounted) {
          setFaqs(list.map(f => ({
            id: f.id,
            question: f.question,
            answer: f.answer,
            category: f.category || 'General',
            visible: f.visible !== false
          })));
        }
      } catch (err) {
        console.error('Failed to fetch FAQs:', err);
        if (isMounted) setFaqs([]);
      }
    };
    fetchFaqs();
    return () => { isMounted = false; };
  }, [activeWebsite]);

  // Open separate Editor Page for Adding
  const handleOpenAddPage = () => {
    setEditingId(null);
    setFormData({
      question: '',
      answer: '',
      category: 'Services',
      visible: true
    });
    setViewMode('EDITOR');
    window.scrollTo(0, 0);
  };

  // Open separate Editor Page for Editing
  const handleOpenEditPage = (faq) => {
    setEditingId(faq.id);
    setFormData({ ...faq });
    setViewMode('EDITOR');
    window.scrollTo(0, 0);
  };

  // Return to List View
  const handleBackToList = () => {
    setViewMode('LIST');
    setEditingId(null);
    window.scrollTo(0, 0);
  };

  // Save FAQ Form (Add or Edit)
  const handleSaveForm = async (e) => {
    e?.preventDefault();
    if (!formData.question.trim() || !formData.answer.trim()) {
      alert('Please enter both Question and Answer.');
      return;
    }

    const currentSiteSlug = activeWebsite?.slug || activeWebsite?.id || 'dev-mate';
    const payload = {
      question: formData.question,
      answer: formData.answer,
      category: formData.category,
      visible: formData.visible,
      website: currentSiteSlug
    };

    if (editingId) {
      setFaqs(faqs.map(f => f.id === editingId ? { ...formData, id: editingId } : f));
      try {
        await faqsApi.update(editingId, payload);
      } catch {
        // Fallback
      }
    } else {
      const tempId = Date.now();
      const newEntry = { ...formData, id: tempId };
      setFaqs([newEntry, ...faqs]);
      try {
        const created = await faqsApi.create(payload);
        if (created && created.id) {
          setFaqs(prev => prev.map(f => f.id === tempId ? { ...f, id: created.id } : f));
        }
      } catch {
        // Fallback
      }
    }

    setViewMode('LIST');
    setEditingId(null);
    window.scrollTo(0, 0);
  };

  // Delete FAQ
  const handleDelete = async (id) => {
    if (confirm('Delete this FAQ record?')) {
      setFaqs(faqs.filter(f => f.id !== id));
      try {
        await faqsApi.delete(id);
      } catch {
        // Fallback
      }
    }
  };

  // Toggle visibility directly
  const handleToggleVisible = async (id) => {
    setFaqs(faqs.map(f => f.id === id ? { ...f, visible: !f.visible } : f));
    try {
      await faqsApi.toggleVisibility(id);
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
            <div className="p-3 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                <span className="font-accent">{isEditing ? 'Edit FAQ Item' : 'Add New FAQ Item'}</span>
              </h1>
              <p className="text-xs text-neutral-400 mt-0.5">
                {isEditing ? 'Update FAQ question, detailed answer, and category.' : 'Add a new client question and answer to your public FAQ section.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleBackToList}
              className="h-9 px-4 rounded-lg bg-[#0d1018] hover:bg-[#161a28] text-neutral-300 hover:text-white text-xs font-semibold border border-[#222738] transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSaveForm}
              className="h-9 px-5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'Save Changes' : 'Save & Publish FAQ'}</span>
            </button>
          </div>
        </div>

        {/* Dedicated Separate Form Container */}
        <div className="p-6 sm:p-8 rounded-xl bg-[#12151f] border border-[#222738] shadow-2xl space-y-6">
          <form onSubmit={handleSaveForm} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
                  Question <span className={activeWebsite?.accentText || "text-blue-400"}>*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={formData.question}
                  onChange={e => setFormData({ ...formData, question: e.target.value })}
                  placeholder="e.g. What is your typical turnaround time for full-stack builds?"
                  className="w-full px-4 py-2.5 rounded-lg bg-[#0d1018] border border-[#222738] text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 focus:bg-[#161a28] transition-all font-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
                  FAQ Category Tag
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g. Services, Timeline, Technical"
                  className="w-full px-4 py-2.5 rounded-lg bg-[#0d1018] border border-[#222738] text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 focus:bg-[#161a28] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
                Detailed Answer <span className={activeWebsite?.accentText || "text-blue-400"}>*</span>
              </label>
              <textarea
                rows={5}
                required
                value={formData.answer}
                onChange={e => setFormData({ ...formData, answer: e.target.value })}
                placeholder="Provide a comprehensive and helpful response for your clients..."
                className="w-full p-4 rounded-lg bg-[#0d1018] border border-[#222738] text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 focus:bg-[#161a28] resize-none leading-relaxed transition-all"
              />
            </div>

            {/* Visibility Toggle */}
            <div className="p-4 rounded-lg bg-[#0d1018] border border-[#222738] flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white">Live Portfolio Visibility</div>
                <p className="text-xs text-neutral-400 mt-0.5">Show or hide this question from your public FAQ section.</p>
              </div>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, visible: !formData.visible })}
                className={`h-9 px-3.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                  formData.visible
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                    : 'bg-[#1a1f2e] text-neutral-400 border border-[#222738] hover:bg-[#222738]'
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
                className="h-9 px-5 rounded-lg bg-[#0d1018] hover:bg-[#161a28] text-neutral-300 hover:text-white text-xs sm:text-sm font-semibold border border-[#222738] transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="h-9 px-6 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{isEditing ? 'Save Changes' : 'Save & Publish FAQ'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: FAQS 3-CARD GRID VIEW
  // ==========================================
  return (
    <div className="space-y-5 w-full max-w-full overflow-x-hidden font-sans">
      {/* Header Banner with Category Dropdown & Add Button */}
      <div className="p-4 sm:p-5 rounded-xl bg-[#12151f] border border-[#222738] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold text-white">Manage Frequently Asked Questions</h1>
            <p className="text-xs text-neutral-400 mt-0.5">Add, edit, or reorganize FAQ entries displayed across your portfolio.</p>
          </div>
        </div>

        {/* Right Actions: Category Dropdown & Add Button */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Category Dropdown — h-9 to match Add button */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="h-9 pl-3.5 pr-8 rounded-lg bg-[#0d1018] border border-[#222738] text-sm font-semibold text-neutral-200 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer appearance-none"
            >
              <option value="ALL">All Categories ({faqs.length})</option>
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
            <span>Add FAQ Item</span>
          </button>
        </div>
      </div>

      {/* 3-Card Format Grid or Empty State */}
      {filteredFaqs.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-[#12151f] border border-[#222738] text-neutral-400 space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center justify-center mx-auto">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No FAQs Created</h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
              You haven't created any FAQ entries yet. Click below to add your first question and answer.
            </p>
          </div>
          <button
            onClick={handleOpenAddPage}
            className="h-9 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs inline-flex items-center gap-2 shadow-lg shadow-blue-500/20 hover:brightness-110 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add First FAQ</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredFaqs.map((faq) => (
            <div key={faq.id} className="p-5 rounded-xl bg-[#12151f] border border-[#222738] hover:border-neutral-600/70 transition-all duration-200 flex flex-col justify-between shadow-lg space-y-4 group">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                    <Tag className="w-3.5 h-3.5" />
                    <span>{faq.category}</span>
                  </span>
                  <span className="text-xs font-bold text-neutral-400">FAQ #{faq.id}</span>
                </div>

                <h3 className="text-sm sm:text-base font-extrabold text-white line-clamp-2 font-accent leading-snug">
                  {faq.question}
                </h3>

                <p className="text-xs text-neutral-300 line-clamp-4 leading-relaxed font-normal">
                  {faq.answer}
                </p>
              </div>

              {/* Action Buttons — consistent h-9 (36px) */}
              <div className="flex items-center justify-between pt-3 border-t border-[#222738] gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleVisible(faq.id)}
                  className={`h-9 px-3 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all flex-shrink-0 ${
                    faq.visible
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                      : 'bg-[#0d1018] text-neutral-400 border border-[#222738] hover:bg-[#161a28]'
                  }`}
                  title="Toggle Live Visibility"
                >
                  {faq.visible ? <Eye className="w-4 h-4 flex-shrink-0" /> : <EyeOff className="w-4 h-4 flex-shrink-0" />}
                  <span>{faq.visible ? 'Visible' : 'Hidden'}</span>
                </button>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEditPage(faq)}
                    className="h-9 px-3 rounded-lg bg-[#0d1018] hover:bg-[#161a28] text-neutral-200 hover:text-white text-sm font-semibold flex items-center gap-1.5 border border-[#222738] transition-all"
                  >
                    <Edit2 className="w-4 h-4" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(faq.id)}
                    className="h-9 w-9 rounded-lg bg-rose-950/20 hover:bg-rose-950/50 text-rose-400 border border-rose-900/40 hover:border-rose-700/60 transition-all flex items-center justify-center"
                    title="Delete FAQ"
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
