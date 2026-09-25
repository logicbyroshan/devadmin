import React, { useState } from 'react';
import { 
  Bold, 
  Italic, 
  Heading2, 
  Heading3, 
  Code, 
  List, 
  Quote, 
  Video, 
  Table as TableIcon, 
  BarChart3, 
  GitFork, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle, 
  Copy, 
  Check, 
  Sparkles, 
  Eye, 
  Edit3, 
  Columns, 
  Play, 
  ChevronRight,
  Activity,
  Box,
  FileText,
  Sigma,
  ExternalLink
} from 'lucide-react';

/**
 * Helper to parse inline markdown: **bold**, *italic*, `code`, [link](url), ![img](url)
 */
function parseInlineMarkdown(text) {
  if (!text) return text;

  const parts = [];
  let remaining = text;
  let keyIdx = 0;
  const tokenRegex = /(!\[(.*?)\]\((.*?)\))|(\[(.*?)\]\((.*?)\))|(\*\*(.*?)\*\*)|(\*(.*?)\*)|(`([^`]+)`)/;

  while (remaining) {
    const match = remaining.match(tokenRegex);
    if (!match) {
      parts.push(remaining);
      break;
    }

    const matchIndex = match.index;
    if (matchIndex > 0) {
      parts.push(remaining.substring(0, matchIndex));
    }

    const fullMatch = match[0];

    // Image: ![alt](url)
    if (match[1]) {
      const alt = match[2];
      const src = match[3];
      parts.push(
        <span key={`img-${keyIdx++}`} className="block my-3 rounded-lg overflow-hidden border border-neutral-800 bg-black/50">
          <img src={src} alt={alt} className="w-full max-h-72 object-cover" loading="lazy" />
          {alt && <span className="block py-1 px-2.5 text-[11px] text-neutral-400 bg-neutral-900/80 text-center font-mono">{alt}</span>}
        </span>
      );
    }
    // Link: [text](url)
    else if (match[4]) {
      const label = match[5];
      const href = match[6];
      parts.push(
        <a
          key={`link-${keyIdx++}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 underline font-semibold transition-colors inline-flex items-center gap-0.5"
        >
          <span>{label}</span>
          <ExternalLink className="w-2.5 h-2.5 inline-block opacity-70" />
        </a>
      );
    }
    // Bold: **text**
    else if (match[7]) {
      const boldText = match[8];
      parts.push(
        <strong key={`bold-${keyIdx++}`} className="text-white font-bold">
          {boldText}
        </strong>
      );
    }
    // Italic: *text*
    else if (match[9]) {
      const italicText = match[10];
      parts.push(
        <em key={`italic-${keyIdx++}`} className="text-neutral-200 italic">
          {italicText}
        </em>
      );
    }
    // Code: `text`
    else if (match[11]) {
      const codeText = match[12];
      parts.push(
        <code
          key={`code-${keyIdx++}`}
          className="px-1.5 py-0.5 rounded bg-blue-950/40 text-blue-300 font-mono text-[11px] border border-blue-500/30"
        >
          {codeText}
        </code>
      );
    }

    remaining = remaining.substring(matchIndex + fullMatch.length);
  }

  return parts;
}

export default function RichContentBuilder({ 
  value = '', 
  onChange, 
  placeholder = 'Write comprehensive technical documentation, markdown, system architecture, benchmarks, and embeds...',
  label = 'Article / Project Documentation Content'
}) {
  const [activeTab, setActiveTab] = useState('split'); // 'write' | 'preview' | 'split'
  const [copiedBlock, setCopiedBlock] = useState(null);
  const [showPresetModal, setShowPresetModal] = useState(false);

  // Helper to insert snippet at current cursor or append
  const insertSnippet = (snippet) => {
    const textarea = document.getElementById('rich-content-textarea');
    if (!textarea) {
      onChange((value ? value + '\n\n' : '') + snippet);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    const newContent = before + snippet + after;

    onChange(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + snippet.length;
    }, 50);
  };

  const handleCopyCode = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedBlock(id);
    setTimeout(() => setCopiedBlock(null), 2000);
  };

  // ==========================================
  // 1-CLICK PRESET TEMPLATES (Cosmic & Powerful!)
  // ==========================================
  const presets = [
    {
      title: 'Microservices Architecture Diagram',
      icon: GitFork,
      desc: 'Visual multi-tier diagram showing API Gateway, Auth Microservice, Redis Cache, and PostgreSQL.',
      snippet: `### 🏛️ System Architecture Topology

\`\`\`architecture:microservices
title: Enterprise Multi-Tenant Gateway & Cache Architecture
nodes:
  - [Client Web App] -> [Cloudflare CDN / SSL]
  - [Cloudflare CDN] -> [Kong API Gateway]
  - [Kong Gateway] -> [FastAPI Core Service (Port 8000)]
  - [Kong Gateway] -> [Node.js Realtime Socket Cluster (Port 3001)]
  - [FastAPI Core] -> [Redis L2 Cache (In-Memory)]
  - [FastAPI Core] -> [PostgreSQL 16 High-Availability Replica]
\`\`\`
`
    },
    {
      title: 'Mermaid ERD / Sequence Diagram',
      icon: Box,
      desc: 'Interactive entity-relationship schema or sequence pipeline for system design.',
      snippet: `### 🧩 Relational Data Model & Constraints

\`\`\`mermaid
erDiagram
  ORGANIZATION ||--o{ USER : contains
  ORGANIZATION ||--o{ PROJECT : owns
  PROJECT ||--o{ DEPLOYMENT : triggers
  USER ||--o{ AUDIT_LOG : records

  ORGANIZATION {
    uuid id PK
    string name
    string tier
    timestamp created_at
  }
  PROJECT {
    uuid id PK
    uuid org_id FK
    string title
    string status
  }
\`\`\`
`
    },
    {
      title: 'KaTeX Mathematical SLA Formula',
      icon: Sigma,
      desc: 'Mathematical formulation of throughput, p99 latency bounds, and algorithm complexity.',
      snippet: `### 📐 Algorithmic Concurrency & Throughput Model

\`\`\`katex
\Phi_{\text{throughput}} = \frac{N_{\text{req}} \times W_{\text{workers}}}{T_{\text{render}} + T_{\text{io}}} \ge 140 \text{ req/sec}, \quad L_{p99} \le 12\text{ms}
\`\`\`
`
    },
    {
      title: 'Benchmark Performance Bar Chart',
      icon: BarChart3,
      desc: 'Interactive visual bar chart comparing requests/sec across framework architectures.',
      snippet: `### ⚡ High-Throughput Performance Benchmarks

\`\`\`chart:barchart
title: API Throughput Comparison (Requests per Second - Higher is Better)
unit: Req/sec
data:
  - Rust Actix Web: 142000
  - Go Gin Gonic: 118500
  - Node.js Fastify: 76400
  - Django Ninja + ASGI: 48200
  - Standard Express.js: 31000
\`\`\`
`
    },
    {
      title: 'API Response Latency Line Graph',
      icon: Activity,
      desc: 'Visual trend showing p99 latency under increasing concurrent user loads.',
      snippet: `### 📈 Latency Under Concurrent Traffic (p99)

\`\`\`chart:linegraph
title: p99 Latency vs Concurrent Connections (Lower is Better)
unit: ms
points:
  - 100 Users: 8ms
  - 500 Users: 14ms
  - 1,000 Users: 22ms
  - 5,000 Users: 41ms
  - 10,000 Users: 68ms
\`\`\`
`
    },
    {
      title: 'REST API Endpoints Specification Table',
      icon: TableIcon,
      desc: 'Formatted API specification with HTTP methods, paths, and status codes.',
      snippet: `### 📡 Core REST API Endpoints Specification

| Method | Endpoint Path | Description | Auth Required | Status |
| :--- | :--- | :--- | :--- | :--- |
| \`GET\` | \`/api/v1/projects\` | List public portfolio projects with filters | No | \`200 OK\` |
| \`POST\` | \`/api/v1/inquiries\` | Dispatch incoming contact message & SMTP relay | No | \`201 Created\` |
| \`PUT\` | \`/api/v1/skills/:id\` | Update skill level, category & metadata | Bearer JWT | \`200 OK\` |
| \`DELETE\` | \`/api/v1/media/:id\` | Invalidate CDN cache & delete asset | Bearer JWT | \`204 No Content\` |
`
    },
    {
      title: 'Syntax-Highlighted Code Snippet',
      icon: Code,
      desc: 'Multi-line code snippet with filename header and copy button.',
      snippet: `### 💻 Implementation Code Snippet

\`\`\`typescript:frontend/src/hooks/useRealtimeSync.ts
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useRealtimeSync(portfolioId: string) {
  const [status, setStatus] = useState<'CONNECTED' | 'DISCONNECTED'>('DISCONNECTED');
  const [dataStream, setDataStream] = useState<any[]>([]);

  useEffect(() => {
    const socket: Socket = io('https://api.example.com/stream', {
      transports: ['websocket'],
      query: { portfolioId }
    });

    socket.on('connect', () => setStatus('CONNECTED'));
    socket.on('sync:payload', (payload) => {
      setDataStream(prev => [payload, ...prev.slice(0, 49)]);
    });

    return () => {
      socket.disconnect();
    };
  }, [portfolioId]);

  return { status, dataStream };
}
\`\`\`
`
    },
    {
      title: 'Video Demo Walkthrough Embed',
      icon: Video,
      desc: 'Responsive video embed for software demos and walkthroughs.',
      snippet: `### 🎬 Video Walkthrough & Feature Demo

\`\`\`video:embed
url: https://www.youtube.com/embed/dQw4w9WgXcQ
title: DevAdmin Multi-Tenant Architecture & Performance Demo
caption: Complete technical walkthrough of the platform management interface, reactive state stores, and real-time email reply console.
\`\`\`
`
    },
    {
      title: 'Alert Callout Blocks (Note, Tip, Warning)',
      icon: AlertCircle,
      desc: 'Styled alert callout boxes for important notes and architectural caveats.',
      snippet: `> [!NOTE]
> All REST API endpoints are protected by Cloudflare rate-limiting rules (max 100 req/min per IP).

> [!TIP]
> Use Redis pipelining for batch invalidations to reduce socket roundtrips during high write traffic.

> [!WARNING]
> Database migrations must run backward-compatible schema changes during live multi-tenant zero-downtime deploys.
`
    },
    {
      title: 'Documentation Downloads & Specs Badges',
      icon: FileText,
      desc: 'Downloadable specification badges for PDF docs, OpenAPI JSON, and Postman collections.',
      snippet: `### 📁 Architecture Specifications & Artifacts

- 📄 **[Download Complete Architecture Whitepaper (PDF)](https://example.com/specs.pdf)** *(Version 2.4 • 4.2 MB)*
- 📑 **[OpenAPI 3.1 Swagger Specification (JSON)](https://example.com/openapi.json)** *(Validated Schema)*
- 🚀 **[Import Postman API Collection (v2.1)](https://example.com/postman_collection.json)**
`
    }
  ];

  // ==========================================
  // MARKDOWN & SPECIAL WIDGET RENDERER
  // ==========================================
  const renderFormattedPreview = (markdownText) => {
    if (!markdownText || !markdownText.trim()) {
      return (
        <div className="p-12 text-center text-neutral-500 text-sm flex flex-col items-center justify-center space-y-2">
          <Sparkles className="w-8 h-8 text-neutral-600 animate-pulse" />
          <p>No content written yet. Use the toolbar above or pick a preset template to start creating!</p>
        </div>
      );
    }

    const lines = markdownText.split('\n');
    const elements = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // 1. Code / Diagram / Chart / Video Fenced Blocks
      if (line.startsWith('```')) {
        const header = line.substring(3).trim();
        const codeLines = [];
        i++;
        while (i < lines.length && !lines[i].startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        i++; // skip closing ```

        const codeContent = codeLines.join('\n');
        const blockId = `block-${elements.length}`;

        // Architecture Diagram Block
        if (header.startsWith('architecture')) {
          const titleLine = codeLines.find(l => l.startsWith('title:'));
          const title = titleLine ? titleLine.replace('title:', '').trim() : 'System Architecture Diagram';
          const nodeLines = codeLines.filter(l => l.trim().startsWith('-'));

          elements.push(
            <div key={blockId} className="my-6 p-5 rounded-xl bg-[#070913] border border-blue-500/40 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-blue-400 font-accent">
                  <GitFork className="w-4 h-4" />
                  <span>{title}</span>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  SYSTEM DESIGN FLOW
                </span>
              </div>

              {/* Visual Architecture Flow Nodes */}
              <div className="flex flex-col gap-3 py-2">
                {nodeLines.map((n, nIdx) => {
                  const cleaned = n.replace(/^-\s*/, '').trim();
                  const parts = cleaned.split('->').map(p => p.trim().replace(/^\[|\]$/g, ''));
                  return (
                    <div key={nIdx} className="flex flex-wrap items-center justify-center gap-2">
                      {parts.map((node, pIdx) => (
                        <React.Fragment key={pIdx}>
                          <div className="px-3.5 py-2 rounded-lg bg-neutral-900 border border-blue-500/40 text-xs font-bold text-white shadow-md flex items-center gap-2 hover:border-blue-400 transition-colors">
                            <Box className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                            <span>{node}</span>
                          </div>
                          {pIdx < parts.length - 1 && (
                            <ChevronRight className="w-4 h-4 text-blue-400 flex-shrink-0" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          );
          continue;
        }

        // Mermaid Diagram Block
        if (header.startsWith('mermaid')) {
          elements.push(
            <div key={blockId} className="my-6 p-5 rounded-xl bg-[#070913] border border-purple-500/40 shadow-xl space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-purple-400 font-accent">
                  <Box className="w-4 h-4" />
                  <span>Mermaid Flowchart / Entity Schema</span>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  MERMAID DIAGRAM
                </span>
              </div>

              <div className="p-4 rounded-lg bg-black/60 border border-neutral-800/80 font-mono text-xs text-purple-200 overflow-x-auto whitespace-pre leading-relaxed">
                {codeContent}
              </div>
            </div>
          );
          continue;
        }

        // KaTeX / Math Formula Block
        if (header.startsWith('katex') || header.startsWith('math')) {
          elements.push(
            <div key={blockId} className="my-6 p-5 rounded-xl bg-[#070913] border border-cyan-500/40 shadow-xl space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-cyan-400 font-accent">
                  <Sigma className="w-4 h-4" />
                  <span>Mathematical SLA / Throughput Model</span>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  KATEX FORMULATION
                </span>
              </div>

              <div className="p-4 rounded-lg bg-black/60 border border-neutral-800/80 text-center font-mono text-sm text-cyan-300 overflow-x-auto whitespace-pre">
                {codeContent}
              </div>
            </div>
          );
          continue;
        }

        // Bar Chart Block
        if (header.startsWith('chart:barchart') || header.startsWith('chart:bar')) {
          const titleLine = codeLines.find(l => l.startsWith('title:'));
          const unitLine = codeLines.find(l => l.startsWith('unit:'));
          const title = titleLine ? titleLine.replace('title:', '').trim() : 'Performance Benchmark';
          const unit = unitLine ? unitLine.replace('unit:', '').trim() : 'req/s';
          const dataLines = codeLines.filter(l => l.trim().startsWith('-')).map(l => {
            const raw = l.replace(/^-\s*/, '');
            const [k, v] = raw.split(':').map(s => s.trim());
            return { label: k, value: parseFloat(v) || 0 };
          });
          const maxValue = Math.max(...dataLines.map(d => d.value), 1);

          elements.push(
            <div key={blockId} className="my-6 p-5 rounded-xl bg-[#070913] border border-neutral-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-white font-accent">
                  <BarChart3 className="w-4 h-4 text-blue-400" />
                  <span>{title}</span>
                </div>
                <span className="text-xs text-neutral-400 font-semibold">Unit: {unit}</span>
              </div>

              <div className="space-y-3 pt-1">
                {dataLines.map((d, dIdx) => {
                  const percent = Math.round((d.value / maxValue) * 100);
                  return (
                    <div key={dIdx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                        <span className="text-neutral-200">{d.label}</span>
                        <span className="text-blue-400 font-mono">{d.value.toLocaleString()} {unit}</span>
                      </div>
                      <div className="w-full bg-neutral-900 rounded-sm h-3 overflow-hidden border border-neutral-800/80">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 rounded-sm shadow-sm transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
          continue;
        }

        // Line Graph Block
        if (header.startsWith('chart:linegraph') || header.startsWith('chart:line')) {
          const titleLine = codeLines.find(l => l.startsWith('title:'));
          const title = titleLine ? titleLine.replace('title:', '').trim() : 'Latency Graph';
          const points = codeLines.filter(l => l.trim().startsWith('-')).map(l => {
            const raw = l.replace(/^-\s*/, '');
            const [k, v] = raw.split(':').map(s => s.trim());
            return { label: k, value: v };
          });

          elements.push(
            <div key={blockId} className="my-6 p-5 rounded-xl bg-[#070913] border border-neutral-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-white font-accent">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>{title}</span>
                </div>
                <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/30 font-bold">
                  LATENCY METRIC
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
                {points.map((pt, pIdx) => (
                  <div key={pIdx} className="p-3 rounded-lg bg-black/60 border border-neutral-800 text-center space-y-1 hover:border-emerald-500/40 transition-colors">
                    <div className="text-xs text-neutral-400 font-semibold">{pt.label}</div>
                    <div className="text-base font-extrabold text-emerald-400 font-mono">{pt.value}</div>
                  </div>
                ))}
              </div>
            </div>
          );
          continue;
        }

        // Video Embed Block
        if (header.startsWith('video')) {
          const urlLine = codeLines.find(l => l.startsWith('url:'));
          const titleLine = codeLines.find(l => l.startsWith('title:'));
          const captionLine = codeLines.find(l => l.startsWith('caption:'));
          const url = urlLine ? urlLine.replace('url:', '').trim() : '';
          const title = titleLine ? titleLine.replace('title:', '').trim() : 'Video Walkthrough';
          const caption = captionLine ? captionLine.replace('caption:', '').trim() : '';

          elements.push(
            <div key={blockId} className="my-6 rounded-xl overflow-hidden bg-[#070913] border border-neutral-800 shadow-xl space-y-3">
              <div className="p-3.5 border-b border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-white font-accent">
                  <Play className="w-4 h-4 text-blue-400" />
                  <span>{title}</span>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-neutral-800 text-neutral-300">
                  VIDEO DEMO
                </span>
              </div>

              <div className="relative aspect-video w-full bg-black">
                {url.includes('youtube') || url.includes('vimeo') ? (
                  <iframe
                    src={url}
                    title={title}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 space-y-2">
                    <Play className="w-12 h-12 text-blue-400" />
                    <p className="text-xs">HTML5 Video Stream: {url || 'Demo Video'}</p>
                  </div>
                )}
              </div>

              {caption && (
                <p className="px-4 pb-3 text-xs text-neutral-400 leading-relaxed font-normal">
                  {caption}
                </p>
              )}
            </div>
          );
          continue;
        }

        // Standard Syntax Highlighted Code Block
        const [lang, filename] = header.split(':');
        elements.push(
          <div key={blockId} className="my-5 rounded-xl bg-[#05070f] border border-neutral-800 overflow-hidden shadow-xl">
            <div className="px-4 py-2.5 bg-[#090c1a] border-b border-neutral-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
                <span className="text-neutral-300 font-mono text-[11px] font-bold ml-2">
                  {filename || `${lang || 'code'}`}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleCopyCode(codeContent, blockId)}
                className="flex items-center gap-1 text-[11px] font-semibold text-neutral-400 hover:text-white transition-colors"
              >
                {copiedBlock === blockId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedBlock === blockId ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            <pre className="p-4 text-xs font-mono text-neutral-200 overflow-x-auto leading-relaxed bg-black/60">
              <code>{codeContent}</code>
            </pre>
          </div>
        );
        continue;
      }

      // 2. Alert Callouts (> [!NOTE], > [!TIP], > [!WARNING])
      if (line.startsWith('> [!')) {
        const match = line.match(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i);
        const type = match ? match[1].toUpperCase() : 'NOTE';
        const alertLines = [];
        i++;
        while (i < lines.length && lines[i].startsWith('>')) {
          alertLines.push(lines[i].replace(/^>\s*/, ''));
          i++;
        }

        const alertStyles = {
          NOTE: { border: 'border-blue-500/40', bg: 'bg-blue-950/20', text: 'text-blue-400', icon: HelpCircle },
          TIP: { border: 'border-emerald-500/40', bg: 'bg-emerald-950/20', text: 'text-emerald-400', icon: CheckCircle2 },
          IMPORTANT: { border: 'border-purple-500/40', bg: 'bg-purple-950/20', text: 'text-purple-400', icon: Sparkles },
          WARNING: { border: 'border-amber-500/40', bg: 'bg-amber-950/20', text: 'text-amber-400', icon: AlertCircle },
          CAUTION: { border: 'border-rose-500/40', bg: 'bg-rose-950/20', text: 'text-rose-400', icon: AlertCircle },
        };
        const style = alertStyles[type] || alertStyles.NOTE;
        const Icon = style.icon;

        elements.push(
          <div key={`alert-${elements.length}`} className={`my-4 p-4 rounded-xl ${style.bg} border ${style.border} space-y-1.5 shadow-md`}>
            <div className={`flex items-center gap-2 text-xs font-extrabold ${style.text} uppercase tracking-wider`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{type}</span>
            </div>
            <p className="text-xs text-neutral-200 leading-relaxed font-normal">
              {parseInlineMarkdown(alertLines.join(' '))}
            </p>
          </div>
        );
        continue;
      }

      // 3. Markdown Tables
      if (line.trim().startsWith('|') && line.includes('|')) {
        const tableLines = [];
        while (i < lines.length && lines[i].trim().startsWith('|')) {
          tableLines.push(lines[i]);
          i++;
        }

        if (tableLines.length >= 2) {
          const headerRow = tableLines[0].split('|').map(s => s.trim()).filter(Boolean);
          const bodyRows = tableLines.slice(2).map(r => r.split('|').map(s => s.trim()).filter(Boolean));

          elements.push(
            <div key={`table-${elements.length}`} className="my-5 rounded-xl border border-neutral-800 overflow-x-auto shadow-xl bg-[#07080d]">
              <table className="w-full text-left text-xs text-neutral-300">
                <thead className="bg-[#0b0e1b] text-neutral-300 uppercase tracking-wider font-extrabold text-xs border-b border-neutral-800">
                  <tr>
                    {headerRow.map((h, hIdx) => (
                      <th key={hIdx} className="px-4 py-3 font-accent text-white">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 bg-black/40 font-normal">
                  {bodyRows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-neutral-900/60 transition-colors">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-4 py-3 leading-relaxed font-mono text-xs">
                          {parseInlineMarkdown(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          continue;
        }
      }

      // 4. Headings
      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={`h1-${elements.length}`} className="text-xl sm:text-2xl font-black text-white font-accent my-4 pb-2 border-b border-neutral-800">
            {parseInlineMarkdown(line.replace('# ', ''))}
          </h1>
        );
        i++;
        continue;
      }
      if (line.startsWith('## ')) {
        elements.push(
          <h2 key={`h2-${elements.length}`} className="text-lg sm:text-xl font-bold text-white font-accent my-3.5 pb-1.5 border-b border-neutral-800/60">
            {parseInlineMarkdown(line.replace('## ', ''))}
          </h2>
        );
        i++;
        continue;
      }
      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={`h3-${elements.length}`} className="text-sm sm:text-base font-bold text-blue-300 font-accent my-3">
            {parseInlineMarkdown(line.replace('### ', ''))}
          </h3>
        );
        i++;
        continue;
      }

      // 5. Blockquote
      if (line.startsWith('> ')) {
        elements.push(
          <blockquote key={`quote-${elements.length}`} className="my-3 pl-4 border-l-2 border-blue-500 text-xs italic text-neutral-300 leading-relaxed font-normal">
            {parseInlineMarkdown(line.replace('> ', ''))}
          </blockquote>
        );
        i++;
        continue;
      }

      // 6. Bullet Lists & Download Badges
      if (line.startsWith('- ') || line.startsWith('* ')) {
        elements.push(
          <div key={`li-${elements.length}`} className="my-1.5 flex items-start gap-2 text-xs text-neutral-300 leading-relaxed font-normal">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0"></span>
            <span>{parseInlineMarkdown(line.replace(/^[-*]\s*/, ''))}</span>
          </div>
        );
        i++;
        continue;
      }

      // 7. Regular Paragraphs
      if (line.trim() !== '') {
        elements.push(
          <p key={`p-${elements.length}`} className="my-2.5 text-xs sm:text-sm text-neutral-300 leading-relaxed font-normal">
            {parseInlineMarkdown(line)}
          </p>
        );
      }

      i++;
    }

    return elements;
  };

  return (
    <div className="space-y-3 font-sans">
      {/* Header Bar with Tabs and Insert Presets */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-neutral-800">
        <div>
          <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>{label}</span>
          </label>
          <p className="text-[11px] text-neutral-400 mt-0.5">Rich Markdown, System Architecture Diagrams, Benchmark Charts, Tables, and Video Embeds.</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Preset Inserter Button */}
          <button
            type="button"
            onClick={() => setShowPresetModal(true)}
            className="px-3 py-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/40 text-blue-300 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>+ Insert Interactive Block</span>
          </button>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-[#050609] p-1 rounded-lg border border-neutral-800">
            <button
              type="button"
              onClick={() => setActiveTab('write')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 transition-all ${
                activeTab === 'write' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Edit3 className="w-3 h-3" />
              <span>Write</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('split')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 transition-all ${
                activeTab === 'split' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Columns className="w-3 h-3" />
              <span>Split View</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 transition-all ${
                activeTab === 'preview' ? 'bg-blue-600 text-white shadow' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Live Preview</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Formatting Toolbar */}
      {(activeTab === 'write' || activeTab === 'split') && (
        <div className="p-2 rounded-lg bg-[#0d1018] border border-[#222738] flex flex-wrap items-center gap-1 text-neutral-400 text-xs">
          {/* Headings */}
          <button type="button" onClick={() => insertSnippet('## ')} className="p-1.5 rounded hover:bg-[#161a28] hover:text-white" title="Heading 2">
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={() => insertSnippet('### ')} className="p-1.5 rounded hover:bg-[#161a28] hover:text-white" title="Heading 3">
            <Heading3 className="w-3.5 h-3.5" />
          </button>

          <span className="w-[1px] h-4 bg-[#222738] mx-1"></span>

          {/* Formats */}
          <button type="button" onClick={() => insertSnippet('**bold text**')} className="p-1.5 rounded hover:bg-[#161a28] hover:text-white" title="Bold">
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={() => insertSnippet('*italic text*')} className="p-1.5 rounded hover:bg-[#161a28] hover:text-white" title="Italic">
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={() => insertSnippet('> ')} className="p-1.5 rounded hover:bg-[#161a28] hover:text-white" title="Quote">
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={() => insertSnippet('- ')} className="p-1.5 rounded hover:bg-[#161a28] hover:text-white" title="Bullet List">
            <List className="w-3.5 h-3.5" />
          </button>

          <span className="w-[1px] h-4 bg-[#222738] mx-1"></span>

          {/* Dynamic Blocks */}
          <button type="button" onClick={() => insertSnippet('```typescript:src/app.ts\n// Enter TypeScript code here\nconsole.log("System Ready");\n```\n')} className="p-1.5 rounded hover:bg-[#161a28] hover:text-blue-400 flex items-center gap-1 font-mono text-[11px]" title="Code Snippet">
            <Code className="w-3.5 h-3.5 text-blue-400" />
            <span>Code</span>
          </button>
          <button type="button" onClick={() => insertSnippet('```architecture:microservices\ntitle: Architecture Pipeline\nnodes:\n  - [Client WebApp] -> [API Gateway]\n  - [API Gateway] -> [Microservice]\n```\n')} className="p-1.5 rounded hover:bg-[#161a28] hover:text-purple-400 flex items-center gap-1 text-[11px]" title="Architecture Diagram">
            <GitFork className="w-3.5 h-3.5 text-purple-400" />
            <span>Diagram</span>
          </button>
          <button type="button" onClick={() => insertSnippet('```mermaid\nflowchart TD\n  A[Client Request] --> B[API Gateway]\n  B --> C[Microservice Hub]\n```\n')} className="p-1.5 rounded hover:bg-[#161a28] hover:text-purple-300 flex items-center gap-1 text-[11px]" title="Mermaid Flowchart">
            <Box className="w-3.5 h-3.5 text-purple-300" />
            <span>Mermaid</span>
          </button>
          <button type="button" onClick={() => insertSnippet('```katex\n\\Phi = \\frac{N \\times W}{T_{\\text{render}} + T_{\\text{io}}} \\ge 120 \\text{ req/sec}\n```\n')} className="p-1.5 rounded hover:bg-[#161a28] hover:text-cyan-300 flex items-center gap-1 text-[11px]" title="KaTeX Math Formula">
            <Sigma className="w-3.5 h-3.5 text-cyan-300" />
            <span>Math</span>
          </button>
          <button type="button" onClick={() => insertSnippet('```chart:barchart\ntitle: Benchmark Comparison\nunit: req/s\ndata:\n  - Optimized Engine: 120000\n  - Legacy Engine: 45000\n```\n')} className="p-1.5 rounded hover:bg-[#161a28] hover:text-cyan-400 flex items-center gap-1 text-[11px]" title="Benchmark Chart">
            <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Chart</span>
          </button>
          <button type="button" onClick={() => insertSnippet('| Feature | Support | Performance |\n| :--- | :--- | :--- |\n| WebSockets | Yes | Low Latency |\n| GraphQL | Yes | High Throughput |\n')} className="p-1.5 rounded hover:bg-[#161a28] hover:text-emerald-400 flex items-center gap-1 text-[11px]" title="Table">
            <TableIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>Table</span>
          </button>
          <button type="button" onClick={() => insertSnippet('```video:embed\nurl: https://www.youtube.com/embed/dQw4w9WgXcQ\ntitle: Product Demo Walkthrough\ncaption: Overview of the real-time collaboration workflow.\n```\n')} className="p-1.5 rounded hover:bg-[#161a28] hover:text-rose-400 flex items-center gap-1 text-[11px]" title="Video Embed">
            <Video className="w-3.5 h-3.5 text-rose-400" />
            <span>Video</span>
          </button>
          <button type="button" onClick={() => insertSnippet('> [!NOTE]\n> Enter critical architecture or operational note here.\n')} className="p-1.5 rounded hover:bg-[#161a28] hover:text-amber-400 flex items-center gap-1 text-[11px]" title="Callout Alert">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Alert</span>
          </button>
        </div>
      )}

      {/* Editor Content Area */}
      <div className="rounded-xl overflow-hidden border border-[#222738] bg-[#12151f] shadow-2xl">
        {/* WRITE ONLY MODE */}
        {activeTab === 'write' && (
          <textarea
            id="rich-content-textarea"
            rows={16}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full p-4 bg-[#0d1018] text-xs sm:text-sm text-neutral-100 placeholder-neutral-500 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-[#161a28] resize-y leading-relaxed"
          />
        )}

        {/* SPLIT VIEW MODE (Side-by-Side Live Builder) */}
        {activeTab === 'split' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#222738] min-h-[480px]">
            <div className="p-3 bg-[#0d1018] flex flex-col justify-between">
              <div className="text-xs uppercase font-bold text-neutral-400 mb-1.5 flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                <span>Markdown & Widget Source</span>
              </div>
              <textarea
                id="rich-content-textarea"
                rows={16}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full flex-1 p-2 bg-transparent text-xs sm:text-sm text-neutral-200 placeholder-neutral-500 font-mono focus:outline-none resize-none leading-relaxed"
              />
            </div>

            <div className="p-5 bg-[#12151f] overflow-y-auto max-h-[550px]">
              <div className="text-xs uppercase font-bold text-neutral-400 mb-3 flex items-center gap-1.5 pb-1.5 border-b border-[#222738]">
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span>Live Interactive Preview</span>
              </div>
              <div className="prose prose-invert max-w-none">
                {renderFormattedPreview(value)}
              </div>
            </div>
          </div>
        )}

        {/* PREVIEW ONLY MODE */}
        {activeTab === 'preview' && (
          <div className="p-6 sm:p-8 bg-[#12151f] min-h-[400px]">
            <div className="prose prose-invert max-w-none">
              {renderFormattedPreview(value)}
            </div>
          </div>
        )}
      </div>

      {/* Preset Modal Drawer (1-Click Interactive Block Inserter) */}
      {showPresetModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#12151f] border border-[#222738] rounded-xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#222738]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400 animate-pulse" />
                <h3 className="text-base font-extrabold text-white font-accent">Insert Interactive Documentation Block</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPresetModal(false)}
                className="p-1 text-neutral-400 hover:text-white rounded transition-colors text-xs font-bold"
              >
                Close (✕)
              </button>
            </div>

            <p className="text-xs text-neutral-400">
              Select any interactive block below to insert formatted charts, architecture diagrams, video embeds, and tables into your document.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1">
              {presets.map((preset, idx) => {
                const Icon = preset.icon;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      insertSnippet(preset.snippet);
                      setShowPresetModal(false);
                    }}
                    className="p-3.5 rounded-lg bg-[#0d1018] border border-[#222738] hover:border-blue-500/80 hover:bg-[#161a28] transition-all cursor-pointer space-y-1.5 group shadow-md"
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded bg-blue-500/15 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">{preset.title}</h4>
                    </div>
                    <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">{preset.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
