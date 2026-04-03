import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
// @ts-expect-error Vite asset URL import for pdf worker.
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {
  ArrowUp,
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  Layers,
  Map,
  PanelRightClose,
  PanelRightOpen,
  Paperclip,
  Plus,
  Settings,
  Share2,
  Square,
  UserPlus,
  Zap,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

export type OutlineNode = {
  id: string;
  text: string;
  level: 0 | 1 | 2 | 3 | 4;
  children: string[];
  parentId: string | null;
};

type Pos = { x: number; y: number };
type Message = { role: 'user' | 'ai'; text: string };
type OutlineFileKind = 'pdf' | 'md';
type OutlineFileItem = {
  id: string;
  name: string;
  kind: OutlineFileKind;
  meta: string;
  content: string;
};

type Props = {
  query: string;
  writerEnabled: boolean;
  initialNodeMap?: Record<string, OutlineNode>;
  onBack: () => void;
  onGoToWriter: () => void;
  onGenerateFullText: (type: 'word' | 'latex') => void;
  onOutlineGenerated: (nodeMap: Record<string, OutlineNode>) => void;
};

const LEVEL_X: Record<OutlineNode['level'], number> = {
  0: 70,
  1: 320,
  2: 570,
  3: 820,
  4: 1070,
};

const LEAF_GAP = 58;

const EXPAND_SECTIONS: { section: string; subs: string[] }[] = [
  { section: 'Theoretical Foundations', subs: ['Core Principles', 'Mathematical Formulation', 'Key Assumptions'] },
  { section: 'Empirical Validation', subs: ['Dataset Description', 'Evaluation Protocol', 'Baseline Comparisons'] },
  { section: 'System Architecture', subs: ['Component Overview', 'Data Flow Design', 'Scalability Considerations'] },
  { section: 'Case Studies', subs: ['Real-world Scenario Analysis', 'Adversarial Setup', 'Cross-domain Applicability'] },
  { section: 'Ethical Considerations', subs: ['Bias & Fairness', 'Privacy Implications', 'Societal Impact'] },
  { section: 'Implementation Details', subs: ['Toolchain & Libraries', 'Reproducibility Notes', 'Open-Source Resources'] },
];

const EXPAND_LEVEL3_ITEMS: string[][] = [
  ['Key Variable Definition', 'Constraint Analysis'],
  ['Scenario Breakdown', 'Dependency Mapping'],
  ['Procedure Notes', 'Decision Criteria'],
  ['Failure Conditions', 'Fallback Route'],
  ['Measurement Detail', 'Interpretation Notes'],
];

const EXPAND_LEVEL4_ITEMS: string[][] = [
  ['Concrete Example', 'Edge Condition'],
  ['Source Note', 'Validation Check'],
  ['Implementation Detail', 'Observed Risk'],
  ['Counterexample', 'Special Case'],
  ['Metric Threshold', 'Expected Outcome'],
];

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const MOCK_FILES: OutlineFileItem[] = [
  {
    id: 'mock-md-1',
    name: 'outline-notes.md',
    kind: 'md',
    meta: 'Markdown draft · 12 KB',
    content: `# Working Notes

## Research question
- How should the outline evolve from ideation to a complete draft?

## Current assumptions
- The user needs a staged outline workflow
- Each branch should stay context-aware
- Supporting files should remain visible in the same workspace

## Next focus
- Tighten top progress language
- Keep uploaded file previews lightweight but readable`,
  },
  {
    id: 'mock-pdf-1',
    name: 'reference-paper.pdf',
    kind: 'pdf',
    meta: 'PDF source · 2.4 MB',
    content: `PDF Preview

Title: Structured Scientific Writing With Human-AI Collaboration

Abstract:
This paper examines how staged outline generation, contextual branching, and iterative drafting can improve long-form scientific writing. The authors argue that visual outlining should stay synchronized with document assets and conversational planning.

Key points:
1. Outline generation should proceed incrementally.
2. Asset panels should provide quick content previews.
3. Progress states should remain visible throughout drafting.`,
  },
];

export function buildOutline(topic: string): Record<string, OutlineNode> {
  const words = topic.split(' ').slice(0, 6).join(' ');
  const nodes: OutlineNode[] = [
    { id: 'root', text: words || 'Research Topic', level: 0, children: ['s1', 's2', 's3', 's4', 's5', 's6'], parentId: null },
    { id: 's1', text: 'Introduction', level: 1, children: ['s1a', 's1b', 's1c'], parentId: 'root' },
    { id: 's1a', text: 'Background & Motivation', level: 2, children: [], parentId: 's1' },
    { id: 's1b', text: 'Problem Statement & Scope', level: 2, children: [], parentId: 's1' },
    { id: 's1c', text: 'Contributions of This Work', level: 2, children: [], parentId: 's1' },
    { id: 's2', text: 'Related Work', level: 1, children: ['s2a', 's2b'], parentId: 'root' },
    { id: 's2a', text: 'Foundational Approaches', level: 2, children: [], parentId: 's2' },
    { id: 's2b', text: 'Recent Advances & Open Gaps', level: 2, children: [], parentId: 's2' },
    { id: 's3', text: 'Methodology', level: 1, children: ['s3a', 's3b', 's3c'], parentId: 'root' },
    { id: 's3a', text: 'Theoretical Framework', level: 2, children: [], parentId: 's3' },
    { id: 's3b', text: 'Experimental Design', level: 2, children: [], parentId: 's3' },
    { id: 's3c', text: 'Evaluation Metrics', level: 2, children: [], parentId: 's3' },
    { id: 's4', text: 'Results & Analysis', level: 1, children: ['s4a', 's4b'], parentId: 'root' },
    { id: 's4a', text: 'Quantitative Findings', level: 2, children: [], parentId: 's4' },
    { id: 's4b', text: 'Qualitative Observations', level: 2, children: [], parentId: 's4' },
    { id: 's5', text: 'Discussion', level: 1, children: ['s5a', 's5b'], parentId: 'root' },
    { id: 's5a', text: 'Interpretation of Results', level: 2, children: [], parentId: 's5' },
    { id: 's5b', text: 'Limitations & Threats to Validity', level: 2, children: [], parentId: 's5' },
    { id: 's6', text: 'Conclusion', level: 1, children: ['s6a', 's6b'], parentId: 'root' },
    { id: 's6a', text: 'Key Takeaways', level: 2, children: [], parentId: 's6' },
    { id: 's6b', text: 'Future Research Directions', level: 2, children: [], parentId: 's6' },
  ];
  return Object.fromEntries(nodes.map((node) => [node.id, node]));
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

async function extractPdfText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: buffer }).promise;
  const pageCount = Math.min(pdf.numPages, 3);
  const chunks: string[] = [];

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (pageText) {
      chunks.push(`Page ${pageNumber}\n${pageText}`);
    }
  }

  return chunks.join('\n\n').slice(0, 5000) || 'No extractable text found in this PDF.';
}

function computeLayout(
  nodeMap: Record<string, OutlineNode>,
  collapsed: Set<string>,
  manualPositions: Record<string, Pos> = {},
): Record<string, Pos> {
  if (!nodeMap.root) return {};

  const positions: Record<string, Pos> = {};
  let nextY = 0;

  const visit = (nodeId: string, level: OutlineNode['level']): number => {
    const node = nodeMap[nodeId];
    if (!node) return nextY;

    const childIds = level >= 4 || collapsed.has(nodeId)
      ? []
      : node.children.filter((childId) => nodeMap[childId]);

    if (childIds.length === 0) {
      const y = nextY;
      positions[nodeId] = { x: LEVEL_X[level], y };
      nextY += LEAF_GAP;
      return y;
    }

    const nextLevel: OutlineNode['level'] = level === 4 ? 4 : ((level + 1) as OutlineNode['level']);
    const childYs = childIds.map((childId) => visit(childId, nextLevel));
    const y = (childYs[0] + childYs[childYs.length - 1]) / 2;
    positions[nodeId] = { x: LEVEL_X[level], y };
    return y;
  };

  visit('root', 0);

  const rootY = positions.root?.y ?? 0;
  Object.keys(positions).forEach((id) => {
    positions[id] = { x: positions[id].x, y: positions[id].y - rootY };
  });

  Object.entries(manualPositions).forEach(([id, pos]) => {
    if (positions[id]) positions[id] = pos;
  });

  return positions;
}

function getBounds(positions: Record<string, Pos>) {
  const values = Object.values(positions);
  if (!values.length) return null;
  return {
    minX: Math.min(...values.map((p) => p.x)),
    maxX: Math.max(...values.map((p) => p.x)) + 220,
    minY: Math.min(...values.map((p) => p.y)) - 36,
    maxY: Math.max(...values.map((p) => p.y)) + 64,
  };
}

function bezier(from: Pos, to: Pos, fromLevel: OutlineNode['level']): string {
  const fromWidth = fromLevel === 0 ? 178 : fromLevel === 1 ? 150 : fromLevel === 2 ? 144 : 138;
  const fx = from.x + fromWidth;
  const fy = from.y + 18;
  const tx = to.x;
  const ty = to.y + 18;
  const cx = (fx + tx) / 2;
  return `M ${fx} ${fy} C ${cx} ${fy}, ${cx} ${ty}, ${tx} ${ty}`;
}

function EditInput({
  value,
  onSave,
  className,
}: {
  value: string;
  onSave: (value: string) => void;
  className?: string;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  return (
    <input
      autoFocus
      className={className}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => onSave(draft.trim() || value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onSave(draft.trim() || value);
        e.stopPropagation();
      }}
      onClick={(e) => e.stopPropagation()}
    />
  );
}

function nodeWidth(level: OutlineNode['level']) {
  if (level === 0) return 198;
  if (level === 1) return 164;
  if (level === 2) return 156;
  if (level === 3) return 150;
  return 144;
}

function nodeTone(level: OutlineNode['level'], selected: boolean) {
  if (level === 0) {
    return selected
      ? 'bg-[#7c3aed] text-white border-[#7c3aed] shadow-md shadow-purple-200'
      : 'bg-white text-[#7c3aed] border-[#c4b5fd] shadow-sm hover:border-[#7c3aed]';
  }
  if (level === 1) {
    return selected
      ? 'bg-[#7c3aed] text-white border-[#7c3aed] shadow-md shadow-purple-200'
      : 'bg-[#ede9fe] text-[#7c3aed] border-transparent hover:bg-[#ddd6fe]';
  }
  if (level === 2) {
    return selected
      ? 'bg-[#8b5cf6] text-white border-[#8b5cf6] shadow-md shadow-purple-200'
      : 'bg-[#f5f3ff] text-[#7c3aed] border-transparent hover:bg-[#ede9fe]';
  }
  if (level === 3) {
    return selected
      ? 'bg-[#6366f1] text-white border-[#6366f1] shadow-md shadow-indigo-200'
      : 'bg-[#eef2ff] text-[#4f46e5] border-transparent hover:bg-[#e0e7ff]';
  }
  return selected
    ? 'bg-slate-700 text-white border-slate-700 shadow-md shadow-slate-200'
    : 'bg-slate-100 text-slate-600 border-transparent hover:bg-slate-200';
}

function TreeNode({
  node,
  pos,
  visible,
  isSelected,
  isEditing,
  childCount,
  isCollapsed,
  canAddChild,
  onSelect,
  onEditStart,
  onEditSave,
  onToggleCollapse,
  onAddChild,
  onDragStart,
  key: _key,
}: {
  key?: string;
  node: OutlineNode;
  pos: Pos;
  visible: boolean;
  isSelected: boolean;
  isEditing: boolean;
  childCount: number;
  isCollapsed: boolean;
  canAddChild: boolean;
  onSelect: () => void;
  onEditStart: () => void;
  onEditSave: (text: string) => void;
  onToggleCollapse: () => void;
  onAddChild: () => void;
  onDragStart: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      className="absolute select-none flex items-center gap-1.5"
      style={{
        left: pos.x,
        top: pos.y,
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateX(-8px) scale(0.96)',
        transition: 'opacity 0.35s cubic-bezier(0.16,1,0.3,1), transform 0.35s cubic-bezier(0.16,1,0.3,1)',
      }}
      data-node="true"
    >
      {childCount > 0 ? (
        <button
          className="flex-shrink-0 text-slate-300 hover:text-[#7c3aed] transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse();
          }}
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
        </button>
      ) : node.level > 0 ? (
        <ChevronRight size={11} className={isSelected ? 'text-[#7c3aed]' : 'text-slate-300'} />
      ) : (
        <div className="w-3.5" />
      )}

      {isEditing ? (
        <EditInput
          value={node.text}
          onSave={onEditSave}
          className="text-[12px] font-medium rounded-full px-3 py-1.5 border border-[#7c3aed] outline-none bg-white text-slate-800"
        />
      ) : (
        <button
          type="button"
          className={`border rounded-full transition-all text-left ${nodeTone(node.level, isSelected)} ${
            node.level === 0 ? 'px-4 py-2 text-[13px] font-semibold' : 'px-3 py-1.5 text-[12px] font-medium'
          }`}
          style={{ width: nodeWidth(node.level) }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            onEditStart();
          }}
          onMouseDown={(e) => {
            if (e.button !== 0) return;
            e.stopPropagation();
            onDragStart(e);
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="truncate">{node.text}</span>
            {isCollapsed && childCount > 0 && (
              <span className={`text-[10px] font-medium rounded-full px-1.5 py-0.5 ${
                isSelected ? 'bg-white/20 text-white' : 'bg-[#c4b5fd] text-white'
              }`}>
                +{childCount}
              </span>
            )}
          </div>
        </button>
      )}

      {isSelected && canAddChild && (
        <button
          type="button"
          className="w-6 h-6 rounded-full border border-slate-200 bg-white text-slate-500 hover:text-[#7c3aed] hover:border-[#c4b5fd] shadow-sm flex items-center justify-center transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onAddChild();
          }}
          title="Add child node"
        >
          <Plus size={12} />
        </button>
      )}
    </div>
  );
}

export default function OutlineWorkspace({
  query,
  writerEnabled,
  initialNodeMap,
  onBack,
  onGoToWriter,
  onGenerateFullText,
  onOutlineGenerated,
}: Props) {
  const hasInitial = !!initialNodeMap && Object.keys(initialNodeMap).length > 0;

  const [genPhase, setGenPhase] = useState<0 | 1 | 2 | 3>(hasInitial ? 3 : 0);
  const [generating, setGenerating] = useState(false);
  const [nodeMap, setNodeMap] = useState<Record<string, OutlineNode>>(initialNodeMap ?? {});
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [manualPositions, setManualPositions] = useState<Record<string, Pos>>({});
  const [selectedId, setSelectedId] = useState<string | null>(hasInitial ? 'root' : null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [canvasFlash, setCanvasFlash] = useState(false);
  const [expansionRound, setExpansionRound] = useState(0);
  const [visibleNodeIds, setVisibleNodeIds] = useState<Set<string>>(
    hasInitial ? new Set(Object.keys(initialNodeMap ?? {})) : new Set()
  );

  const pendingTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const addTimer = useCallback((fn: () => void, delay: number) => {
    const timer = setTimeout(fn, delay);
    pendingTimers.current.push(timer);
    return timer;
  }, []);

  const [offset, setOffset] = useState({ x: 80, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const dragOrigin = useRef<{ mx: number; my: number; ox: number; oy: number } | null>(null);
  const nodeDragRef = useRef<{ id: string; mx: number; my: number; px: number; py: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const filePanelRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showSidebar, setShowSidebar] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      text: hasInitial
        ? `Welcome back! Your outline for "${query}" is ready. Select any node and ask me to expand it.`
        : "What's your research idea? Share any context — I'll build your outline one level at a time.",
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const isComposingRef = useRef(false);
  const [files, setFiles] = useState<OutlineFileItem[]>(MOCK_FILES);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [filePreviewTop, setFilePreviewTop] = useState<number>(96);
  const [fileError, setFileError] = useState<string>('');

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const generated = genPhase >= 1;
  const selectedFile = selectedFileId ? files.find((file) => file.id === selectedFileId) ?? null : null;

  const positions = useMemo(
    () => (generated ? computeLayout(nodeMap, collapsed, manualPositions) : {}),
    [collapsed, generated, manualPositions, nodeMap]
  );

  const fitCanvasToContent = useCallback((nm: Record<string, OutlineNode>, col: Set<string>, manual: Record<string, Pos>) => {
    const nextPositions = computeLayout(nm, col, manual);
    const bounds = getBounds(nextPositions);
    if (!bounds || !canvasRef.current) return;

    const canvasW = canvasRef.current.clientWidth;
    const canvasH = canvasRef.current.clientHeight;
    const contentW = bounds.maxX - bounds.minX;
    const contentH = bounds.maxY - bounds.minY;
    const padding = 80;
    const scaleX = (canvasW - padding * 2) / Math.max(contentW, 1);
    const scaleY = (canvasH - padding * 2) / Math.max(contentH, 1);
    const nextScale = Math.min(scaleX, scaleY, 1.1);

    setScale(nextScale);
    setOffset({
      x: (canvasW - contentW * nextScale) / 2 - bounds.minX * nextScale,
      y: (canvasH - contentH * nextScale) / 2 - bounds.minY * nextScale,
    });
  }, []);

  const zoomBy = useCallback((delta: number) => {
    setScale((prev) => Math.min(2.5, Math.max(0.2, prev + delta)));
  }, []);

  useEffect(() => {
    if (hasInitial && canvasRef.current) {
      fitCanvasToContent(nodeMap, collapsed, manualPositions);
    }
  }, [collapsed, fitCanvasToContent, hasInitial, manualPositions, nodeMap]);

  const triggerFlash = useCallback(() => {
    setCanvasFlash(true);
    addTimer(() => setCanvasFlash(false), 480);
  }, [addTimer]);

  const handleStop = useCallback(() => {
    pendingTimers.current.forEach(clearTimeout);
    pendingTimers.current = [];
    setGenerating(false);
  }, []);

  const revealAll = useCallback((ids: string[]) => {
    setVisibleNodeIds((prev) => new Set([...prev, ...ids]));
  }, []);

  const handleToggleCollapse = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleEditSave = useCallback((id: string, text: string) => {
    setNodeMap((prev) => ({ ...prev, [id]: { ...prev[id], text } }));
    setEditingId(null);
  }, []);

  const handleOpenFilePreview = useCallback((fileId: string, element: HTMLElement) => {
    const panelRect = filePanelRef.current?.getBoundingClientRect();
    const itemRect = element.getBoundingClientRect();
    setSelectedFileId(fileId);
    if (panelRect) {
      setFilePreviewTop(Math.max(80, itemRect.top - panelRect.top - 6));
    }
  }, []);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = event.currentTarget.files ? Array.from(event.currentTarget.files as FileList) : [];
    if (!picked.length) return;

    const valid = picked.filter((file) => /\.(pdf|md|markdown)$/i.test(file.name));
    const invalid = picked.length - valid.length;

    if (!valid.length) {
      setFileError('Only PDF and Markdown files are supported.');
      event.currentTarget.value = '';
      return;
    }

    if (invalid > 0) {
      setFileError('Only PDF and Markdown files were added. Other file types were skipped.');
    } else {
      setFileError('');
    }

    const uploadedFiles = await Promise.all(valid.map(async (file) => {
      const isPdf = /\.pdf$/i.test(file.name);
      let content = '';

      try {
        content = isPdf ? await extractPdfText(file) : await file.text();
      } catch {
        content = isPdf
          ? 'Unable to extract text from this PDF. Please try another file.'
          : 'Unable to read this Markdown file.';
      }

      return {
        id: `upload_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: file.name,
        kind: isPdf ? 'pdf' : 'md',
        meta: `${isPdf ? 'PDF source' : 'Markdown note'} · ${formatFileSize(file.size)}`,
        content: content.slice(0, 5000) || 'File is empty.',
      } satisfies OutlineFileItem;
    }));

    setFiles((prev) => [...uploadedFiles, ...prev]);
    if (uploadedFiles[0]) setSelectedFileId(uploadedFiles[0].id);
    event.currentTarget.value = '';
  }, []);

  const createNode = useCallback((level: OutlineNode['level'], text: string, parentId: string | null): OutlineNode => ({
    id: `node_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    text,
    level,
    children: [],
    parentId,
  }), []);

  const getExpansionLabels = useCallback((node: OutlineNode | null, round: number): string[] => {
    if (!node || node.level === 0) return [EXPAND_SECTIONS[round % EXPAND_SECTIONS.length].section];
    if (node.level === 1) return EXPAND_SECTIONS[round % EXPAND_SECTIONS.length].subs;
    if (node.level === 2) return EXPAND_LEVEL3_ITEMS[round % EXPAND_LEVEL3_ITEMS.length];
    if (node.level === 3) return EXPAND_LEVEL4_ITEMS[round % EXPAND_LEVEL4_ITEMS.length];
    return [];
  }, []);

  const addChildNode = useCallback((parentId: string, text = 'New node') => {
    const parent = nodeMap[parentId];
    if (!parent || parent.level >= 4) return;

    const child = createNode((parent.level + 1) as OutlineNode['level'], text, parentId);
    const nextMap: Record<string, OutlineNode> = {
      ...nodeMap,
      [parentId]: { ...parent, children: [...parent.children, child.id] },
      [child.id]: child,
    };

    const nextCollapsed = new Set(collapsed);
    nextCollapsed.delete(parentId);

    setNodeMap(nextMap);
    setCollapsed(nextCollapsed);
    setVisibleNodeIds((prev) => new Set([...prev, child.id]));
    setSelectedId(child.id);
    setEditingId(child.id);

    addTimer(() => {
      fitCanvasToContent(nextMap, nextCollapsed, manualPositions);
      triggerFlash();
    }, 60);
  }, [addTimer, collapsed, createNode, fitCanvasToContent, manualPositions, nodeMap, triggerFlash]);

  const handleExpandNode = useCallback((parentId: string | null) => {
    const round = expansionRound;
    const target = parentId && nodeMap[parentId] ? nodeMap[parentId] : nodeMap.root ?? null;
    if (!target || target.level >= 4) return;

    const labels = getExpansionLabels(target, round);
    if (!labels.length) return;

    const nextLevel = Math.min((target.level + 1) as OutlineNode['level'], 4);
    const newNodes = labels.map((label, idx) => ({
      id: `ext_${Date.now()}_${idx}`,
      text: label,
      level: nextLevel,
      children: [],
      parentId: target.id,
    })) as OutlineNode[];

    const newNodeMap: Record<string, OutlineNode> = { ...nodeMap };
    newNodes.forEach((node) => {
      newNodeMap[node.id] = node;
    });
    newNodeMap[target.id] = {
      ...newNodeMap[target.id],
      children: [...newNodeMap[target.id].children, ...newNodes.map((node) => node.id)],
    };

    const nextCollapsed = new Set(collapsed);
    nextCollapsed.delete(target.id);

    setNodeMap(newNodeMap);
    setCollapsed(nextCollapsed);

    addTimer(() => {
      revealAll(newNodes.map((node) => node.id));
      addTimer(() => {
        fitCanvasToContent(newNodeMap, nextCollapsed, manualPositions);
        triggerFlash();
      }, 180);
    }, 500);

    setExpansionRound((prev) => prev + 1);
  }, [addTimer, collapsed, expansionRound, fitCanvasToContent, getExpansionLabels, manualPositions, nodeMap, revealAll, triggerFlash]);

  const handleSend = useCallback(() => {
    const text = chatInput.trim();
    if (!text) return;
    setChatInput('');

    if (genPhase === 0) {
      setMessages((prev) => [
        ...prev,
        { role: 'user', text },
        { role: 'ai', text: "Got it. Here's your research topic as the root node. Share more context to grow the sections." },
      ]);
      setGenerating(true);
      addTimer(() => {
        const fullMap = buildOutline(query);
        const rootOnly: Record<string, OutlineNode> = { root: { ...fullMap.root, children: [] } };
        setNodeMap(rootOnly);
        setManualPositions({});
        setGenPhase(1);
        revealAll(['root']);
        setSelectedId('root');
        setGenerating(false);
        fitCanvasToContent(rootOnly, new Set(), {});
        triggerFlash();
      }, 900);
      return;
    }

    if (genPhase === 1) {
      setMessages((prev) => [
        ...prev,
        { role: 'user', text },
        { role: 'ai', text: 'Sections added. Send one more message to fill in the details for each section.' },
      ]);
      setGenerating(true);
      addTimer(() => {
        const fullMap = buildOutline(query);
        const sectionsOnly: Record<string, OutlineNode> = { root: fullMap.root };
        fullMap.root.children.forEach((sectionId) => {
          if (fullMap[sectionId]) sectionsOnly[sectionId] = { ...fullMap[sectionId], children: [] };
        });
        setNodeMap(sectionsOnly);
        setGenPhase(2);
        revealAll(Object.keys(sectionsOnly).filter((id) => id !== 'root'));
        setGenerating(false);
        addTimer(() => {
          fitCanvasToContent(sectionsOnly, new Set(), {});
          triggerFlash();
        }, 100);
      }, 1000);
      return;
    }

    if (genPhase === 2) {
      setMessages((prev) => [
        ...prev,
        { role: 'user', text },
        { role: 'ai', text: 'Outline complete! Select any node and keep chatting to expand specific branches further.' },
      ]);
      setGenerating(true);
      addTimer(() => {
        const fullMap = buildOutline(query);
        setNodeMap(fullMap);
        setGenPhase(3);
        onOutlineGenerated(fullMap);
        revealAll(Object.keys(fullMap).filter((id) => fullMap[id].level === 2));
        setGenerating(false);
        addTimer(() => {
          fitCanvasToContent(fullMap, new Set(), {});
          triggerFlash();
        }, 100);
      }, 1100);
      return;
    }

    const selectedNode = selectedId ? nodeMap[selectedId] ?? null : null;
    if (selectedNode?.level === 4) {
      setMessages((prev) => [
        ...prev,
        { role: 'user', text },
        { role: 'ai', text: 'This node is already at the deepest supported level.' },
      ]);
      return;
    }

    const targetText = selectedNode?.text;
    setMessages((prev) => [
      ...prev,
      { role: 'user', text },
      { role: 'ai', text: targetText ? `Expanding "${targetText}" with new branches…` : 'Adding a new section to the outline…' },
    ]);
    setGenerating(true);
    addTimer(() => {
      handleExpandNode(selectedId);
      setGenerating(false);
    }, 600);
  }, [addTimer, fitCanvasToContent, genPhase, handleExpandNode, nodeMap, onOutlineGenerated, query, revealAll, selectedId, triggerFlash, chatInput]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const delta = e.deltaY > 0 ? 0.92 : 1.08;
      setScale((prev) => Math.min(3, Math.max(0.2, prev * delta)));
    } else {
      setOffset((prev) => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
    }
  }, []);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const connections = useMemo(() => {
    const result: { key: string; path: string }[] = [];
    if (!generated) return result;

    Object.keys(nodeMap).forEach((nodeId) => {
      const node = nodeMap[nodeId];
      const parentPos = positions[node.id];
      if (!parentPos || !visibleNodeIds.has(node.id) || collapsed.has(node.id)) return;
      node.children.forEach((childId) => {
        const childPos = positions[childId];
        if (!childPos || !visibleNodeIds.has(childId)) return;
        result.push({
          key: `${node.id}-${childId}`,
          path: bezier(parentPos, childPos, node.level),
        });
      });
    });

    return result;
  }, [collapsed, generated, nodeMap, positions, visibleNodeIds]);

  const phaseLabel: Record<number, string> = {
    0: 'Share your research idea in the chat to grow the outline →',
    1: 'Root node created. Send another message to generate sections →',
    2: 'Sections added. One more message to fill in details →',
  };

  return (
    <div className="h-screen flex flex-col" style={{ fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: 'url(/BACKGROUND.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.3,
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      <header className="h-14 shrink-0 bg-white/96 backdrop-blur-md border-b border-slate-200 z-40 flex items-center justify-between px-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 min-w-[180px] text-left"
          aria-label="Back to Home"
        >
          <img src="/scimaster_icon.svg" alt="SciMaster" className="w-[30px] h-[30px] object-contain" />
          <span className="text-[13px] font-semibold text-slate-900 tracking-[-0.01em]">SciMaster</span>
        </button>

        <div className="flex items-center justify-center gap-6 flex-1">
          {/* Step 1: Ideamap — completed, click to go back */}
          <button
            onClick={onBack}
            className="flex items-center gap-[9px] cursor-pointer hover:opacity-75 transition-opacity"
          >
            <div className="w-6 h-6 rounded-full bg-[#7c3aed] text-white text-[12px] font-medium flex items-center justify-center opacity-60 select-none">✓</div>
            <span className="text-sm text-slate-400 font-normal">Ideamap</span>
          </button>
          <div className="w-8 h-px bg-slate-200" />
          {/* Step 2: Outline — active */}
          <div className="flex items-center gap-[9px]">
            <div className="w-6 h-6 rounded-full bg-[#7c3aed] text-white text-[12px] font-medium flex items-center justify-center select-none">2</div>
            <span className="text-sm text-[#7c3aed] font-medium">Outline</span>
          </div>
          <div className="w-8 h-px bg-slate-200" />
          {/* Step 3: Writing — unlocked after outline generated */}
          <button
            onClick={writerEnabled ? onGoToWriter : undefined}
            disabled={!writerEnabled}
            className={`flex items-center gap-[9px] ${writerEnabled ? 'cursor-pointer hover:opacity-75 transition-opacity' : 'cursor-not-allowed'} opacity-50`}
          >
            <div className="w-6 h-6 rounded-full border border-slate-300 text-slate-900 text-[12px] font-medium flex items-center justify-center bg-white select-none">3</div>
            <span className="text-sm text-slate-900 font-medium">Writing</span>
          </button>
        </div>

        <div className="min-w-[180px] flex items-center justify-end gap-3">
          <button className="h-[34px] px-[13px] rounded-lg border border-slate-200 bg-white text-slate-900 text-sm font-medium flex items-center gap-2 shadow-sm hover:bg-slate-50 transition-colors">
            <UserPlus size={13} />
            Invite
          </button>
          <button className="h-8 px-4 rounded-lg bg-[#7c3aed] text-white text-sm font-medium flex items-center gap-2 shadow-[0px_1px_2px_0px_rgba(199,210,254,1)] hover:bg-[#6d28d9] transition-colors">
            <Share2 size={12} />
            Share
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <div className="w-[56px] h-full bg-white/82 backdrop-blur-md border-r border-slate-200 z-30 flex-shrink-0 flex flex-col items-center py-4">
          <button
            className="w-8 h-8 rounded-xl bg-[#f5f3ff] text-[#7c3aed] border border-[#ede9fe] flex items-center justify-center"
            title="Outline files"
          >
            <Folder size={15} />
          </button>

          <div className="mt-4 w-full flex justify-center">
            <button
              className="w-8 h-8 rounded-xl bg-white text-slate-700 border border-slate-200 flex items-center justify-center shadow-sm"
              title="Outline canvas"
            >
              <Layers size={15} />
            </button>
          </div>

          <div className="flex-1" />

          <div className="flex flex-col gap-4 items-center pb-1">
            <button className="text-slate-400 hover:text-slate-600 transition-colors">
              <div className="w-[18px] h-[18px] rounded-full border-2 border-current flex items-center justify-center text-[10px] font-bold">?</div>
            </button>
            <button className="text-slate-400 hover:text-slate-600 transition-colors">
              <Settings size={18} />
            </button>
            <button className="w-8 h-8 rounded-full bg-slate-200" aria-label="Profile" />
          </div>
        </div>

        <aside
          ref={filePanelRef}
          className="relative w-[185px] h-full bg-white/92 border-r border-slate-200 z-20 flex-shrink-0 flex flex-col"
        >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.md,.markdown,application/pdf,text/markdown"
          multiple
          className="hidden"
          onChange={handleFileUpload}
        />

        <div className="px-4 pt-4 pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500 font-semibold">WORKSPACE</p>
            </div>
            <button
              className="w-5 h-5 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center"
              onClick={() => fileInputRef.current?.click()}
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        <div className="px-4 py-2 flex-1 overflow-y-auto">
          <div className="space-y-2">
            {files.map((file) => (
              <button
                key={file.id}
                type="button"
                className={`w-full text-left rounded-xl px-2 py-2 transition-all ${
                  selectedFileId === file.id
                    ? 'bg-[#eef2ff] text-[#4f46e5]'
                    : 'bg-transparent text-slate-700 hover:bg-slate-50'
                }`}
                onClick={(e) => handleOpenFilePreview(file.id, e.currentTarget)}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-4 h-4 mt-1 flex items-center justify-center flex-shrink-0 ${
                    file.kind === 'pdf'
                      ? 'text-slate-500'
                      : 'text-slate-500'
                  }`}>
                    <FileText size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <button
            className="mt-6 w-[122px] min-h-12 rounded-lg border border-dashed border-slate-200 text-[12px] text-slate-400 flex items-center justify-center text-center hover:border-slate-300 hover:text-slate-500 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            Drop references here
          </button>
          <p className="mt-3 text-[11px] text-slate-400">Supported: PDF, Markdown</p>
          {fileError && <p className="mt-2 text-[11px] text-rose-500 leading-4">{fileError}</p>}
        </div>

        {selectedFile && (
          <div
            className="absolute z-40 left-[calc(100%-6px)] w-[320px] rounded-2xl border border-slate-200 bg-white/96 backdrop-blur-md shadow-[0_16px_40px_rgba(15,23,42,0.12)] p-4"
            style={{ top: filePreviewTop }}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400 font-semibold">
                  {selectedFile.kind === 'pdf' ? 'PDF Preview' : 'Markdown Preview'}
                </p>
                <h4 className="text-sm font-semibold text-slate-800 truncate mt-1">{selectedFile.name}</h4>
                <p className="text-[11px] text-slate-400 mt-1">{selectedFile.meta}</p>
              </div>
              <button
                type="button"
                className="text-slate-300 hover:text-slate-500 transition-colors"
                onClick={() => setSelectedFileId(null)}
              >
                <Plus size={14} className="rotate-45" />
              </button>
            </div>
            <div className="max-h-[280px] overflow-y-auto rounded-xl bg-slate-50 border border-slate-100 px-3 py-3">
              <pre className="whitespace-pre-wrap break-words text-[11px] leading-5 text-slate-600 font-sans">
                {selectedFile.content}
              </pre>
            </div>
          </div>
        )}
        </aside>

        <div
          ref={canvasRef}
          className="relative flex-1 overflow-hidden z-10"
          style={{ cursor: nodeDragRef.current || isDragging ? 'grabbing' : 'grab' }}
          onMouseDown={(e) => {
            if ((e.target as HTMLElement).closest('[data-node]')) return;
            dragOrigin.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y };
            setIsDragging(true);
          }}
          onMouseMove={(e) => {
            if (nodeDragRef.current) {
              const drag = nodeDragRef.current;
              setManualPositions((prev) => ({
                ...prev,
                [drag.id]: {
                  x: drag.px + (e.clientX - drag.mx) / scale,
                  y: drag.py + (e.clientY - drag.my) / scale,
                },
              }));
              return;
            }
            if (!isDragging || !dragOrigin.current) return;
            setOffset({
              x: dragOrigin.current.ox + (e.clientX - dragOrigin.current.mx),
              y: dragOrigin.current.oy + (e.clientY - dragOrigin.current.my),
            });
          }}
          onMouseUp={() => {
            setIsDragging(false);
            dragOrigin.current = null;
            nodeDragRef.current = null;
          }}
          onMouseLeave={() => {
            setIsDragging(false);
            dragOrigin.current = null;
            nodeDragRef.current = null;
          }}
          onClick={(e) => {
            if (!(e.target as HTMLElement).closest('[data-node]')) {
              setSelectedId(null);
              setEditingId(null);
            }
          }}
        >
          {!showSidebar && (
            <button
              onClick={() => setShowSidebar(true)}
              className="absolute top-4 right-4 z-30 w-9 h-9 bg-white/92 backdrop-blur-md border border-slate-200 rounded-2xl flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
            >
              <PanelRightOpen size={16} />
            </button>
          )}

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(109,40,217,0.07) 1.5px, transparent 1.5px)',
            backgroundSize: '28px 28px',
            zIndex: 1,
          }}
        />

        {genPhase === 0 && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 10 }}>
            <div
              className="relative flex flex-col items-center gap-5 pointer-events-none"
              style={{
                transform: generating ? 'scale(1.03)' : 'scale(1)',
                transition: 'transform 0.6s cubic-bezier(0.16,1,0.3,1)',
              }}
            >
              <div
                className="absolute -inset-24 rounded-full blur-3xl pointer-events-none"
                style={{
                  background: generating
                    ? 'radial-gradient(ellipse, rgba(139,92,246,0.2) 0%, transparent 68%)'
                    : 'radial-gradient(ellipse, rgba(139,92,246,0.09) 0%, transparent 68%)',
                  transition: 'background 1s ease',
                }}
              />
              <div
                className="relative px-9 py-6 rounded-2xl bg-white/85 backdrop-blur-sm"
                style={{
                  border: generating ? '1px solid rgba(139,92,246,0.35)' : '1px solid rgba(226,232,240,0.95)',
                  boxShadow: generating
                    ? '0 12px 48px rgba(139,92,246,0.16), 0 2px 8px rgba(0,0,0,0.05)'
                    : '0 4px 24px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.03)',
                  minWidth: 300,
                  transition: 'border-color 0.6s ease, box-shadow 0.6s ease',
                }}
              >
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                  <span className="text-[10px] font-semibold text-violet-400 tracking-widest uppercase">Research Topic</span>
                </div>
                <p className="text-[18px] font-semibold text-slate-800 leading-snug">{query || 'Your Research'}</p>
              </div>
              {generating ? (
                <div className="flex items-center gap-2">
                  {[0, 160, 320].map((delay) => (
                    <span key={delay} className="inline-block w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                  ))}
                  <span className="text-xs text-violet-500 font-medium ml-1.5 tracking-wide">Building root node…</span>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 tracking-wide">
                  Share your research idea in the chat to grow the outline →
                </p>
              )}
            </div>
          </div>
        )}

        {generated && (
          <div
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              transformOrigin: '0 0',
              position: 'absolute',
              top: 0,
              left: 0,
              width: 1800,
              height: 1600,
              filter: canvasFlash ? 'brightness(1.1)' : 'brightness(1)',
              transition: canvasFlash ? 'filter 0.1s ease' : 'filter 0.5s ease',
            }}
          >
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}>
              {connections.map(({ key, path }) => (
                <path key={key} d={path} fill="none" stroke="#c4b5fd" strokeWidth={1.5} strokeLinecap="round" />
              ))}
            </svg>

            {Object.keys(nodeMap).map((nodeId) => {
              const node = nodeMap[nodeId];
              const pos = positions[node.id];
              if (!pos) return null;
              return (
                <TreeNode
                  key={node.id}
                  node={node}
                  pos={pos}
                  visible={visibleNodeIds.has(node.id)}
                  isSelected={selectedId === node.id}
                  isEditing={editingId === node.id}
                  childCount={node.children.length}
                  isCollapsed={collapsed.has(node.id)}
                  canAddChild={node.level < 4}
                  onSelect={() => {
                    setSelectedId(node.id);
                    setEditingId(null);
                  }}
                  onEditStart={() => {
                    setSelectedId(node.id);
                    setEditingId(node.id);
                  }}
                  onEditSave={(text) => handleEditSave(node.id, text)}
                  onToggleCollapse={() => handleToggleCollapse(node.id)}
                  onAddChild={() => addChildNode(node.id)}
                  onDragStart={(e) => {
                    nodeDragRef.current = {
                      id: node.id,
                      mx: e.clientX,
                      my: e.clientY,
                      px: pos.x,
                      py: pos.y,
                    };
                  }}
                />
              );
            })}
          </div>
        )}

        <div className="absolute bottom-6 left-6 z-30 flex items-center gap-2">
          <button
            onClick={() => zoomBy(0.15)}
            className="w-8 h-8 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:bg-white hover:text-slate-700 shadow-sm transition-colors"
            title="Zoom in"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={() => zoomBy(-0.15)}
            className="w-8 h-8 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:bg-white hover:text-slate-700 shadow-sm transition-colors"
            title="Zoom out"
          >
            <ZoomOut size={14} />
          </button>
          <span className="text-[11px] text-slate-400 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-lg border border-slate-200 tabular-nums shadow-sm">
            {Math.round(scale * 100)}%
          </span>
        </div>

        {genPhase === 3 && !writerEnabled && (
          <div className="absolute bottom-8 right-8 z-30 flex flex-col items-end gap-3">
            <div className="text-[11px] text-slate-400 text-right leading-relaxed">
              Satisfied with the outline?<br />Generate the full draft now.
            </div>
            <button
              onClick={() => setShowTypePicker(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#7c3aed] text-white rounded-2xl font-medium shadow-lg shadow-purple-200 hover:bg-[#6d28d9] active:scale-95 transition-all text-sm"
            >
              <Zap size={14} /> Generate Full Text
            </button>
          </div>
        )}

        {writerEnabled && (
          <div className="absolute bottom-8 right-8 z-30">
            <button
              onClick={onGoToWriter}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-2xl font-medium shadow-lg shadow-emerald-200 hover:bg-emerald-600 active:scale-95 transition-all text-sm"
            >
              <FileText size={14} /> Open in Writer →
            </button>
          </div>
        )}
        </div>

        {showTypePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setShowTypePicker(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-[360px]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-slate-800 mb-1">选择项目格式</h3>
            <p className="text-xs text-slate-400 mb-5">请选择你希望使用的编辑器风格</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setShowTypePicker(false); onGenerateFullText('word'); }}
                className="group flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-slate-100 hover:border-blue-400 hover:bg-blue-50 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold text-slate-700">Word 风格</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">富文本编辑器</p>
                </div>
              </button>
              <button
                onClick={() => { setShowTypePicker(false); onGenerateFullText('latex'); }}
                className="group flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-slate-100 hover:border-purple-400 hover:bg-purple-50 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-100 group-hover:bg-purple-200 flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold text-slate-700">LaTeX 风格</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">学术排版编辑器</p>
                </div>
              </button>
            </div>
            <button onClick={() => setShowTypePicker(false)} className="mt-4 w-full text-xs text-slate-400 hover:text-slate-600 transition-colors py-1">
              取消
            </button>
          </div>
        </div>
      )}

        {showSidebar && (
        <aside className="w-[420px] h-full flex flex-col bg-white border-l border-slate-200 z-20 flex-shrink-0">
          <header className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-400 truncate max-w-[280px]">
              {genPhase >= 1 ? 'Outline Assistant' : `Context: ${query}`}
            </p>
            <button
              onClick={() => setShowSidebar(false)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Collapse"
            >
              <PanelRightClose size={15} />
            </button>
          </header>

          <section className="flex-grow overflow-y-auto p-6 space-y-6">
            {messages.map((msg, index) =>
              msg.role === 'user' ? (
                <div key={index} className="flex flex-col items-end gap-2">
                  <div className="chat-bubble-user p-4 text-sm leading-relaxed max-w-[85%]">{msg.text}</div>
                </div>
              ) : (
                <div key={index} className="flex flex-col items-start gap-2">
                  <div className="chat-bubble-ai p-4 text-sm leading-relaxed text-slate-700 max-w-[85%]">{msg.text}</div>
                  {index === 0 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full max-w-[85%] rounded-[26px] border border-dashed border-[#dbe4f3] bg-[#fbfdff] px-4 py-5 text-left hover:border-[#cfdcf2] hover:bg-white transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-[62px] h-[62px] rounded-[18px] bg-white border border-slate-200 shadow-[0_6px_18px_rgba(148,163,184,0.18)] flex items-center justify-center text-[#94a3b8] flex-shrink-0">
                          <Paperclip size={28} strokeWidth={1.8} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[16px] leading-6 font-semibold text-slate-700">上传参考资料</p>
                          <p className="text-[13px] leading-5 text-[#94a3b8] mt-0.5">PDF、Word、Markdown...</p>
                        </div>
                        <div className="text-[14px] font-medium text-[#cbd5e1] whitespace-nowrap pl-3">
                          点击上传
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              )
            )}
            <div ref={chatEndRef} />
          </section>

          {genPhase >= 3 && selectedId && nodeMap[selectedId] && (
            <div className="mx-4 mb-2 px-3 py-1.5 bg-[#ede9fe] rounded-lg flex items-center gap-2">
              <Layers size={11} className="text-[#7c3aed] flex-shrink-0" />
              <span className="text-[11px] text-[#7c3aed] truncate font-medium">
                Expanding: {nodeMap[selectedId].text}
              </span>
            </div>
          )}

          <footer className="p-4 border-t border-slate-100">
            <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <textarea
                className="flex-1 bg-transparent text-sm text-slate-700 resize-none outline-none placeholder-slate-400 leading-relaxed max-h-24"
                rows={1}
                placeholder={
                  genPhase === 0 ? 'Describe your research idea…'
                    : genPhase === 1 ? 'Add more context to generate sections…'
                      : genPhase === 2 ? 'One more message to fill in sub-items…'
                        : selectedId && nodeMap[selectedId]?.level === 4
                          ? 'Maximum depth reached for this branch'
                          : selectedId && selectedId !== 'root'
                            ? `Expand "${nodeMap[selectedId]?.text ?? 'this node'}"…`
                            : 'Ask AI to add a new branch…'
                }
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onCompositionStart={() => { isComposingRef.current = true; }}
                onCompositionEnd={() => { isComposingRef.current = false; }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !isComposingRef.current) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              {generating ? (
                <button
                  onClick={handleStop}
                  className="flex-shrink-0 w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-300 transition-colors mb-0.5"
                  title="Stop generation"
                >
                  <Square size={11} />
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!chatInput.trim()}
                  className="flex-shrink-0 w-7 h-7 rounded-lg bg-[#7c3aed] flex items-center justify-center text-white disabled:opacity-40 hover:bg-[#6d28d9] transition-colors mb-0.5"
                >
                  <ArrowUp size={13} />
                </button>
              )}
            </div>
            {genPhase >= 3 && (
              <p className="text-[10px] text-slate-400 mt-2 text-center">
                {selectedId && nodeMap[selectedId]?.level !== 4
                  ? 'New branches will grow one level deeper from the selected node'
                  : 'Click a node to target it, drag nodes to reposition, or use the + button to add one'}
              </p>
            )}
          </footer>
        </aside>
      )}
      </div>
    </div>
  );
}
