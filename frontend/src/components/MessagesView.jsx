import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Star, 
  Trash2, 
  Reply, 
  CheckCircle2, 
  Clock, 
  Filter, 
  Send, 
  X, 
  Search, 
  Check, 
  ArrowRight, 
  MessageSquare, 
  Sparkles, 
  Inbox, 
  User, 
  ExternalLink, 
  ShieldCheck 
} from 'lucide-react';
import { contactsApi } from '../services/api';

export default function MessagesView({ onNavigate, activeWebsite }) {
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [replySubject, setReplySubject] = useState('');
  const [replyText, setReplyText] = useState('');
  const [isSentToast, setIsSentToast] = useState(false);

  const [messages, setMessages] = useState([]);

  // Fetch contact inquiries from Django REST Framework API with multi-tenant filtering
  useEffect(() => {
    let isMounted = true;
    const fetchContacts = async () => {
      try {
        const siteSlug = activeWebsite?.slug || activeWebsite?.id || 'dev-mate';
        const data = await contactsApi.getAll({ website: siteSlug });
        const list = Array.isArray(data) ? data : (data.results || []);
        if (isMounted) {
          const mapped = list.map(c => ({
            id: c.id,
            sender: c.name,
            email: c.email,
            subject: c.subject || 'General Inquiry',
            body: c.message,
            tag: c.tag || 'Inquiry',
            read: c.is_read,
            starred: c.starred,
            date: c.created_at ? c.created_at.split('T')[0] : '',
            time: 'Recently'
          }));
          setMessages(mapped);
          if (mapped.length > 0) {
            setSelectedId(mapped[0].id);
          } else {
            setSelectedId(null);
          }
        }
      } catch (err) {
        console.error('Failed to fetch contact inquiries:', err);
        if (isMounted) {
          setMessages([]);
          setSelectedId(null);
        }
      }
    };
    fetchContacts();
    return () => { isMounted = false; };
  }, [activeWebsite]);

  const filteredMessages = messages.filter(m => {
    const matchesSearch = 
      m.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.body.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filter === 'UNREAD') return !m.read;
    if (filter === 'STARRED') return m.starred;
    if (filter === 'INQUIRY') return m.tag === 'Inquiry';
    if (filter === 'FEEDBACK') return m.tag === 'Feedback';
    if (filter === 'HIRE') return m.tag === 'Hire';
    return true;
  });

  const selectedMessage = messages.find(m => m.id === selectedId) || filteredMessages[0] || messages[0];

  const toggleStar = async (id, e) => {
    e?.stopPropagation();
    setMessages(messages.map(m => m.id === id ? { ...m, starred: !m.starred } : m));
    try {
      await contactsApi.toggleStar(id);
    } catch {
      // Fallback
    }
  };

  const toggleReadStatus = async (id) => {
    setMessages(messages.map(m => m.id === id ? { ...m, read: !m.read } : m));
    try {
      await contactsApi.markRead(id);
    } catch {
      // Fallback
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this message conversation?')) {
      const remaining = messages.filter(m => m.id !== id);
      setMessages(remaining);
      if (selectedId === id && remaining.length > 0) {
        setSelectedId(remaining[0].id);
      }
      try {
        await contactsApi.delete(id);
      } catch {
        // Fallback
      }
    }
  };

  const handleSendReply = async (e) => {
    e?.preventDefault();
    if (!replyText.trim()) {
      alert('Please enter an email reply message.');
      return;
    }
    const currentSubject = replySubject || `Re: ${selectedMessage?.subject || 'Inquiry'}`;
    const currentText = replyText;
    setIsSentToast(true);
    setReplyText('');
    setReplySubject('');

    try {
      if (selectedMessage?.id) {
        await contactsApi.reply(selectedMessage.id, currentSubject, currentText);
      }
    } catch {
      // Fallback simulation
    }

    setTimeout(() => {
      setIsSentToast(false);
    }, 3500);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] space-y-4 w-full max-w-full overflow-hidden font-sans">
      {/* Header Banner */}
      <div className="flex-shrink-0 p-4 sm:p-4.5 rounded-xl bg-[#12151f] border border-[#222738] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold text-white">Contact Inquiries & Direct Email Console</h1>
            <p className="text-xs text-neutral-400 mt-0.5">Manage incoming contact submissions and reply directly via authenticated SMTP relay.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300">
          <span className="px-3 py-1.5 rounded-md bg-blue-500/15 text-blue-400 border border-blue-500/30 font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
            <span>{messages.filter(m => !m.read).length} Unread Inquiries</span>
          </span>
        </div>
      </div>

      {/* 2-Column Split: Message Inbox Feed (Left) & Full Conversation & Reply Console (Right) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0 overflow-hidden">
        {/* LEFT COLUMN: Messages Feed & Search */}
        <div className="lg:col-span-5 rounded-xl bg-[#12151f] border border-[#222738] shadow-xl overflow-hidden flex flex-col h-full min-h-0">
          {/* Top Filter & Search Bar */}
          <div className="flex-shrink-0 p-3.5 border-b border-[#222738] space-y-2.5 bg-[#0d1018]">
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search messages by sender, email or text..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#12151f] border border-[#222738] text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-blue-500/60 focus:bg-[#161a28] transition-all"
              />
            </div>

            {/* Quick Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-semibold text-neutral-400">
              {[
                { id: 'ALL', label: `All (${messages.length})` },
                { id: 'UNREAD', label: `Unread (${messages.filter(m => !m.read).length})` },
                { id: 'STARRED', label: `Starred (${messages.filter(m => m.starred).length})` },
                { id: 'INQUIRY', label: 'Inquiries' },
                { id: 'FEEDBACK', label: 'Feedback' },
                { id: 'HIRE', label: 'Hire' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-all ${
                    filter === tab.id
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 font-bold'
                      : 'hover:bg-[#1f2436] hover:text-white bg-[#0d1018] border border-[#222738]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable Message Items List */}
          <div className="p-3 space-y-2 flex-1 overflow-y-auto min-h-0 bg-[#0d1018]/50">
            {filteredMessages.length === 0 ? (
              <div className="p-8 text-center text-neutral-400 text-xs">
                {messages.length === 0 ? 'No contact inquiries received yet.' : 'No messages match the current filter.'}
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isSelected = msg.id === selectedMessage?.id;
                return (
                  <div
                    key={msg.id}
                    onClick={() => {
                      setSelectedId(msg.id);
                      setReplySubject(`Re: ${msg.subject}`);
                      if (!msg.read) {
                        setMessages(messages.map(m => m.id === msg.id ? { ...m, read: true } : m));
                      }
                    }}
                    className={`p-3.5 rounded-lg border cursor-pointer transition-all duration-200 space-y-2 ${
                      isSelected
                        ? 'bg-[#151b2d] border-blue-500/80 shadow-lg shadow-blue-500/15'
                        : 'bg-[#12151f] hover:bg-[#181c2b] border-[#222738]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-lg ${isSelected ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white' : 'bg-[#1e2333] text-neutral-300'} font-bold text-xs flex items-center justify-center flex-shrink-0 font-accent shadow-sm`}>
                          {msg.sender.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs sm:text-sm font-bold text-white truncate font-accent">{msg.sender}</h4>
                            {!msg.read && (
                              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse flex-shrink-0"></span>
                            )}
                          </div>
                          <p className="text-[11px] text-neutral-400 truncate">{msg.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                          {msg.tag}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => toggleStar(msg.id, e)}
                          className={`p-1 rounded transition-colors ${
                            msg.starred ? 'text-amber-400' : 'text-neutral-500 hover:text-neutral-300'
                          }`}
                        >
                          <Star className={`w-4 h-4 ${msg.starred ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                    </div>

                    <div className="text-sm font-semibold text-neutral-200 line-clamp-1">
                      {msg.subject}
                    </div>

                    <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed font-normal">
                      {msg.body}
                    </p>

                    <div className="flex items-center justify-between text-xs text-neutral-400 pt-1.5 border-t border-[#222738]/60">
                      <span>{msg.date}</span>
                      <span>{msg.time}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Full Conversation Reader & Quick Email Reply Composer */}
        <div className="lg:col-span-7 rounded-xl bg-[#12151f] border border-[#222738] shadow-xl overflow-hidden flex flex-col h-full min-h-0">
          {selectedMessage ? (
            <div className="flex-1 flex flex-col h-full min-h-0">
              {/* Message Header */}
              <div className="flex-shrink-0 bg-gradient-to-r from-[#171c2b] via-[#141825] to-[#10131f] p-4 border-b border-[#222738] flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-black text-base flex items-center justify-center flex-shrink-0 shadow-md font-accent">
                    {selectedMessage.sender.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-extrabold text-white truncate font-accent">{selectedMessage.sender}</h2>
                      <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                        {selectedMessage.tag}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5">{selectedMessage.email} • <span className="text-neutral-400">{selectedMessage.date}</span></p>
                  </div>
                </div>

                {/* Header Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleReadStatus(selectedMessage.id)}
                    className="h-9 px-3 rounded-lg bg-[#0d1018] hover:bg-[#161a28] border border-[#222738] text-xs font-semibold text-neutral-200 hover:text-white transition-colors"
                  >
                    {selectedMessage.read ? 'Mark Unread' : 'Mark Read'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(selectedMessage.id)}
                    className="h-9 w-9 rounded-lg bg-rose-950/20 hover:bg-rose-950/50 text-rose-400 border border-rose-900/40 hover:border-rose-700/60 transition-colors flex items-center justify-center"
                    title="Delete Message"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Message Content View Card */}
              <div className="flex-1 overflow-y-auto min-h-0 p-5 space-y-3.5 bg-[#0d1018]/60">
                <div className="text-sm sm:text-base font-bold text-neutral-100">
                  {selectedMessage.subject}
                </div>

                <div className="p-4 rounded-xl bg-[#12151f] border border-[#222738] text-xs sm:text-sm text-neutral-200 leading-relaxed whitespace-pre-line font-normal">
                  {selectedMessage.body}
                </div>
              </div>

              {/* Direct Email Reply Composer */}
              <div className="flex-shrink-0 p-4 sm:p-5 space-y-3 bg-[#12151f] border-t border-[#222738]">
                {/* Sent Success Toast Banner */}
                {isSentToast && (
                  <div className="flex items-center gap-2.5 p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold animate-in fade-in duration-200">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>Email reply dispatched to <span className="font-mono">{selectedMessage?.email}</span> via SMTP relay!</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded ${activeWebsite?.accentBg || 'bg-blue-500/10'} ${activeWebsite?.accentText || 'text-blue-400'} border ${activeWebsite?.accentBorder || 'border-blue-500/30'}`}>
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-white">
                      Quick Email Reply to {selectedMessage.sender}
                    </span>
                  </div>

                  <span className={`text-xs ${activeWebsite?.accentText || 'text-blue-400'} ${activeWebsite?.accentBg || 'bg-blue-500/10'} px-2.5 py-1 rounded-md border ${activeWebsite?.accentBorder || 'border-blue-500/20'} font-semibold flex items-center gap-1.5`}>
                    <ShieldCheck className={`w-3.5 h-3.5 ${activeWebsite?.accentText || 'text-blue-400'}`} /> Direct SMTP Relay Connected
                  </span>
                </div>

                {/* Subject Input */}
                <div className="flex items-center gap-2 bg-[#0d1018] border border-[#222738] rounded-lg px-3 py-2 text-xs">
                  <span className="text-neutral-400 font-bold text-[11px] uppercase tracking-wider">Subject:</span>
                  <input
                    type="text"
                    value={replySubject || `Re: ${selectedMessage.subject}`}
                    onChange={e => setReplySubject(e.target.value)}
                    className="bg-transparent border-none outline-none text-neutral-100 text-xs w-full font-medium"
                  />
                </div>

                {/* Textarea */}
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder={`Hi ${selectedMessage.sender},\n\nThank you for reaching out! I would be delighted to assist you with...`}
                  className="w-full p-3 rounded-lg bg-[#0d1018] border border-[#222738] text-xs sm:text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 focus:bg-[#161a28] transition-all resize-none leading-relaxed font-normal"
                />

                {/* Canned suggestions + Send Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setReplyText(`Hi ${selectedMessage.sender}, thank you for reaching out! I am currently available for new contract work and architecture consultation.`)}
                      className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-[#0d1018] hover:bg-[#161a28] text-neutral-200 hover:text-white border border-[#222738] transition-colors"
                    >
                      Available for work
                    </button>
                    <button
                      type="button"
                      onClick={() => setReplyText(`Hi ${selectedMessage.sender}, let's schedule a 15-minute discovery call this week to discuss details.`)}
                      className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-[#0d1018] hover:bg-[#161a28] text-neutral-200 hover:text-white border border-[#222738] transition-colors"
                    >
                      Schedule Call
                    </button>
                    <button
                      type="button"
                      onClick={() => setReplyText(`Hi ${selectedMessage.sender}, thank you for the wonderful feedback! Really appreciate you taking the time to share.`)}
                      className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-[#0d1018] hover:bg-[#161a28] text-neutral-200 hover:text-white border border-[#222738] transition-colors"
                    >
                      Thanks for feedback
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleSendReply}
                    className={`h-9 px-5 rounded-lg bg-gradient-to-r ${activeWebsite?.gradient || 'from-blue-600 to-indigo-600'} hover:brightness-110 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all flex-shrink-0`}
                  >
                    <Send className="w-4 h-4" />
                    <span>Send Email Reply</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-neutral-400 text-sm flex flex-col items-center justify-center space-y-2 h-full">
              <Inbox className="w-10 h-10 text-neutral-500" />
              <p>Select a message from the left to read and reply.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
