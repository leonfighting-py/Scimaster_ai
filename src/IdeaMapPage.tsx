import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Search, X, ZoomIn, ZoomOut } from 'lucide-react';
import { loadIdeas } from './utils/ideaStore';
import { clusterIdeas, type Cluster, type NodePosition } from './utils/clusterIdeas';
import { keywordsToTitle } from './utils/extractKeywords';

const MIN_SCALE = 0.15;
const MAX_SCALE = 3;

type Props = {
  onBack: () => void;
};

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function NodeCard({
  node,
  highlighted,
}: {
  node: NodePosition;
  highlighted: boolean;
}) {
  const title = keywordsToTitle(node.entry.keywords);
  const nodeCount = node.entry.nodeCount ?? 0;
  const projectCount = node.entry.projectCount ?? 0;
  return (
    <div
      className={`absolute bg-white/90 backdrop-blur-sm border rounded-2xl p-4 shadow-md cursor-pointer hover:shadow-lg transition-all select-none ${
        highlighted
          ? 'border-yellow-400 ring-2 ring-yellow-300 shadow-yellow-200'
          : 'border-white/60 hover:border-purple-200'
      }`}
      style={{ top: node.y, left: node.x, width: 192, transform: 'translate(-50%, -50%)' }}
    >
      <p className="text-[11px] font-bold uppercase tracking-widest text-purple-400 mb-1">Idea</p>
      <h4 className="text-sm font-semibold text-slate-800 leading-snug mb-2">{title}</h4>
      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{node.entry.query}</p>
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-3">
        <span className="flex items-center gap-1 text-[10px] text-slate-400">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3" strokeWidth="2"/>
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {nodeCount} nodes
        </span>
        <span className="flex items-center gap-1 text-[10px] text-slate-400">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {projectCount} projects
        </span>
      </div>
      <p className="text-[10px] text-slate-300 mt-1.5">{formatDate(node.entry.timestamp)}</p>
    </div>
  );
}

function ClusterLabel({ cluster }: { cluster: Cluster }) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{ top: cluster.centerY - 210, left: cluster.centerX, transform: 'translateX(-50%)' }}
    >
      <span className="text-xs font-bold uppercase tracking-widest text-slate-400/70 bg-white/40 backdrop-blur-sm px-3 py-1 rounded-full border border-white/50">
        {cluster.name}
      </span>
    </div>
  );
}

export default function IdeaMapPage({ onBack }: Props) {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [offset, setOffset] = useState({ x: 80, y: 80 });
  const [scale, setScale] = useState(0.75);
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragOrigin = useRef<{ mx: number; my: number; ox: number; oy: number } | null>(null);

  // Load and cluster ideas on mount
  useEffect(() => {
    const ideas = loadIdeas();
    setClusters(clusterIdeas(ideas));
  }, []);

  // ── Wheel: pan + pinch zoom ──
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      setScale((prev) => {
        const delta = -e.deltaY * 0.005;
        const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev + delta * prev));
        const ratio = next / prev;
        setOffset((o) => ({ x: cx - ratio * (cx - o.x), y: cy - ratio * (cy - o.y) }));
        return next;
      });
    } else {
      setOffset((o) => ({ x: o.x - e.deltaX, y: o.y - e.deltaY }));
    }
  }, []);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // ── Mouse drag pan ──
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.node-card-item')) return;
    dragOrigin.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y };
    setIsDragging(true);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragOrigin.current) return;
    setOffset({
      x: dragOrigin.current.ox + (e.clientX - dragOrigin.current.mx),
      y: dragOrigin.current.oy + (e.clientY - dragOrigin.current.my),
    });
  };
  const handleMouseUp = () => {
    dragOrigin.current = null;
    setIsDragging(false);
  };

  // ── Zoom buttons ──
  const zoomBy = (delta: number) =>
    setScale((prev) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev + delta)));

  // ── Search ──
  const allNodes: NodePosition[] = clusters.flatMap((c) => c.nodes);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setHighlightedId(null);
      return;
    }
    const match = allNodes.find(
      (n) =>
        n.entry.query.toLowerCase().includes(val.toLowerCase()) ||
        n.entry.keywords.some((k) => k.toLowerCase().includes(val.toLowerCase())),
    );
    setHighlightedId(match?.id ?? null);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!highlightedId) return;
    const node = allNodes.find((n) => n.id === highlightedId);
    if (!node || !canvasRef.current) return;
    const { width, height } = canvasRef.current.getBoundingClientRect();
    setOffset({
      x: width / 2 - node.x * scale,
      y: height / 2 - node.y * scale,
    });
  };

  const clearSearch = () => {
    setSearchQuery('');
    setHighlightedId(null);
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden">
      {/* ── Canvas area ── */}
      <div
        ref={canvasRef}
        className="flex-1 relative overflow-hidden select-none"
        style={{
          backgroundImage: 'url(/BACKGROUND.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Back button */}
        <button
          onClick={onBack}
          className="absolute top-5 left-5 z-20 flex items-center gap-2 bg-white/80 backdrop-blur-md border border-white/60 text-slate-600 text-sm font-medium px-3 py-2 rounded-xl shadow-sm hover:bg-white transition-colors"
        >
          ← Back
        </button>

        {/* Page title */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <h1 className="text-[13px] font-bold uppercase tracking-widest text-slate-500/80 bg-white/50 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/60">
            Idea Map
          </h1>
        </div>

        {/* Zoom controls */}
        <div className="absolute top-5 right-5 z-20 flex items-center gap-2">
          <button
            onClick={() => zoomBy(0.15)}
            className="w-9 h-9 bg-white/80 backdrop-blur-md border border-white/60 rounded-xl flex items-center justify-center text-slate-500 hover:bg-white shadow-sm transition-colors"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={() => zoomBy(-0.15)}
            className="w-9 h-9 bg-white/80 backdrop-blur-md border border-white/60 rounded-xl flex items-center justify-center text-slate-500 hover:bg-white shadow-sm transition-colors"
          >
            <ZoomOut size={16} />
          </button>
          <span className="text-[11px] text-slate-400 bg-white/60 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/50 tabular-nums">
            {Math.round(scale * 100)}%
          </span>
        </div>

        {/* ── Pannable world ── */}
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            willChange: 'transform',
          }}
        >
          {/* Cluster connector circles (visual backdrop) */}
          {clusters.map((cluster) => (
            <div
              key={cluster.id + '-ring'}
              className="absolute rounded-full border-2 border-dashed border-purple-200/40 pointer-events-none"
              style={{
                width: cluster.nodes.length <= 1 ? 220 : 370,
                height: cluster.nodes.length <= 1 ? 220 : 370,
                top: cluster.centerY - (cluster.nodes.length <= 1 ? 110 : 185),
                left: cluster.centerX - (cluster.nodes.length <= 1 ? 110 : 185),
              }}
            />
          ))}

          {/* Cluster labels */}
          {clusters.map((cluster) => (
            <ClusterLabel key={cluster.id + '-label'} cluster={cluster} />
          ))}

          {/* SVG lines from cluster center to each node */}
          <svg className="absolute inset-0 w-[9999px] h-[9999px] pointer-events-none overflow-visible">
            {clusters.flatMap((cluster) =>
              cluster.nodes.length > 1
                ? cluster.nodes.map((node) => (
                    <line
                      key={node.id + '-line'}
                      x1={cluster.centerX}
                      y1={cluster.centerY}
                      x2={node.x}
                      y2={node.y}
                      stroke="rgba(167,139,250,0.25)"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                    />
                  ))
                : [],
            )}
          </svg>

          {/* Nodes */}
          {allNodes.map((node) => (
            <div key={node.id} className="node-card-item">
              <NodeCard node={node} highlighted={highlightedId === node.id} />
            </div>
          ))}
        </div>

        {/* ── Search bar ── */}
        <form
          onSubmit={handleSearchSubmit}
          className="absolute bottom-6 right-6 z-20 flex items-center gap-2"
        >
          <div className="relative flex items-center">
            <Search size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
            <input
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search ideas..."
              className="w-56 pl-8 pr-8 py-2.5 bg-white/80 backdrop-blur-md border border-white/70 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-purple-300 focus:ring-1 focus:ring-purple-200 shadow-sm transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-2.5 text-slate-300 hover:text-slate-500 transition-colors"
              >
                <X size={13} />
              </button>
            )}
          </div>
          {highlightedId && (
            <button
              type="submit"
              className="px-3 py-2.5 bg-purple-600 text-white text-sm rounded-xl hover:bg-purple-700 transition-colors shadow-sm"
            >
              Go
            </button>
          )}
        </form>

        {/* Empty state */}
        {clusters.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white/60 backdrop-blur-md rounded-2xl px-8 py-6 text-center border border-white/60">
              <p className="text-slate-500 font-medium">No ideas yet</p>
              <p className="text-sm text-slate-400 mt-1">
                Start brainstorming from the homepage to see your ideas here.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
