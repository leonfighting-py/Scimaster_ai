import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  doLandscapeSurvey,
  streamTopics,
  scoreTopics,
  type GeneratedTopic,
  type ScoredTopic,
} from './utils/llmClient';
import ReactDOM from 'react-dom';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  Layers,
  Map,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Settings,
  Share2,
  Trash2,
  UserPlus,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import ProjectWorkspaceView from './ProjectWorkspaceView';
import OutlineWorkspace, { type OutlineNode } from './OutlineWorkspace';
import { saveProject } from './utils/projectStore';

// ── Logo ──
const LogoSmall = () => (
  <img src="/scimaster_icon.svg" alt="SciMaster" width={28} height={28} style={{ display: 'block' }} />
);

// ── Types ──
type Props = {
  query: string;
  onBack?: () => void;
  onIdeaMap?: () => void;
  initialProject?: { nodeId: string; name: string };
};

type NodeData = {
  id: string;
  label: string;
  title: string;
  body: string;
  children: string[];
  parentId: string | null;
  isRoot?: boolean;
};

type LayoutPos = { x: number; y: number };
type Message = { role: 'user' | 'ai'; text: string };

// ── Adversarial generation types ──
type AdversarialPhase =
  | 'idle'
  | 'surveying'
  | 'generating'
  | 'awaiting_confirm'
  | 'scoring'
  | 'done';

type CandidateStatus =
  | 'candidate'
  | 'kept'
  | 'eliminated'
  | 'overridden-keep'
  | 'overridden-eliminate';

// ── Constants ──
const MIN_SCALE = 0.2;
const MAX_SCALE = 3;
const SCALE_STEP = 0.15;
const COL_W = 310;
const ROW_H = 150;
const X_START = 80;
const Y_START = 80;
const NODE_W = 200;
const ROOT_H = 165;
const NODE_H = 120;

// ── Initial tree ──
const INITIAL_NODES: NodeData[] = [
  {
    id: 'root',
    label: 'Model Response',
    title: 'A Bayesian framework for reasoning under uncertainty across generative model distributions',
    body: '',
    children: ['concept', 'application', 'research', 'methodology'],
    parentId: null,
    isRoot: true,
  },
  { id: 'concept', label: 'Concept', title: 'Probabilistic constraint satisfaction in stochastic and partially observable environments', body: '', children: [], parentId: 'root' },
  { id: 'application', label: 'Application', title: 'Online real-time tracking of Bayesian posterior parameters as new data streams arrive', body: '', children: [], parentId: 'root' },
  { id: 'research', label: 'Research', title: 'Scalable inference techniques for large-scale high-dimensional state space models', body: '', children: [], parentId: 'root' },
  { id: 'methodology', label: 'Methodology', title: 'Variational and sampling methods for posterior approximation in complex probabilistic models', body: '', children: ['mh', 'gibbs', 'markov'], parentId: 'root' },
  { id: 'mh', label: 'Algorithm', title: 'Metropolis-Hastings MCMC for drawing samples from intractable target distributions', body: '', children: [], parentId: 'methodology' },
  { id: 'gibbs', label: 'Algorithm', title: 'Gibbs sampling for efficient inference in high-dimensional joint probability distributions', body: '', children: [], parentId: 'methodology' },
  { id: 'markov', label: 'Foundations', title: 'Markov chain theory as the mathematical backbone of sequential probabilistic reasoning', body: '', children: [], parentId: 'methodology' },
];

function toMap(nodes: NodeData[]): Record<string, NodeData> {
  return Object.fromEntries(nodes.map((n) => [n.id, n]));
}

// ── Tree layout: leaf-counting algorithm ──
function computeLayout(
  nodeMap: Record<string, NodeData>,
  rootId: string,
): Record<string, LayoutPos> {
  const positions: Record<string, LayoutPos> = {};
  let leafIdx = 0;

  function visit(id: string, depth: number): number {
    const node = nodeMap[id];
    if (!node) return Y_START;
    const x = X_START + depth * COL_W;
    const validChildren = node.children.filter((c) => nodeMap[c]);
    if (validChildren.length === 0) {
      const y = Y_START + leafIdx * ROW_H;
      leafIdx++;
      positions[id] = { x, y };
      return y;
    }
    const childYs = validChildren.map((cid) => visit(cid, depth + 1));
    const y = childYs.reduce((a, b) => a + b, 0) / childYs.length;
    positions[id] = { x, y };
    return y;
  }
  visit(rootId, 0);
  return positions;
}

// ── SVG bezier: parent right-center → child left-center ──
function connectionPath(pPos: LayoutPos, cPos: LayoutPos, pIsRoot: boolean): string {
  const ph = pIsRoot ? ROOT_H : NODE_H;
  const px = pPos.x + NODE_W;
  const py = pPos.y + ph / 2;
  const cx = cPos.x;
  const cy = cPos.y + NODE_H / 2;
  const mx = (px + cx) / 2;
  return `M ${px} ${py} C ${mx} ${py}, ${mx} ${cy}, ${cx} ${cy}`;
}

// ── Get all descendant IDs ──
function getDescendants(nodeMap: Record<string, NodeData>, id: string): string[] {
  const node = nodeMap[id];
  if (!node) return [];
  return node.children.flatMap((c) => [c, ...getDescendants(nodeMap, c)]);
}

// ── NodeCard Component ──
type NodeCardProps = {
  node: NodeData;
  pos: LayoutPos;
  isSelected: boolean;
  isEditing: boolean;
  isCollapsed: boolean;
  isDraggingThis: boolean;
  descendantCount: number;
  isProjectNode: boolean;       // this node owns the session project
  sessionProjectExists: boolean; // any project exists in this session
  onSelect: () => void;
  onEditStart: () => void;
  onEditSave: (title: string, body: string) => void;
  onDelete: () => void;
  onAddChild: () => void;
  onToggleCollapse: () => void;
  onNewProject: () => void;
  onOpenProject: () => void;
  onReplaceProject: () => void;
  onCardMouseDown: (e: React.MouseEvent) => void;
  onChatDragStart: (e: React.DragEvent) => void;
  onSendToChat: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  memoryContent: string;
  // Adversarial fields (optional — only present during generation flow)
  candidateStatus?: CandidateStatus;
  candidateScore?: ScoredTopic;
  onToggleCandidateStatus?: () => void;
};

function NodeCard({
  node,
  pos,
  isSelected,
  isEditing,
  isCollapsed,
  isDraggingThis,
  descendantCount,
  isProjectNode,
  sessionProjectExists,
  onSelect,
  onEditStart,
  onEditSave,
  onDelete,
  onAddChild,
  onToggleCollapse,
  onNewProject,
  onOpenProject,
  onReplaceProject,
  onCardMouseDown,
  onChatDragStart,
  onSendToChat,
  onContextMenu,
  memoryContent,
  candidateStatus,
  candidateScore,
  onToggleCandidateStatus,
}: NodeCardProps) {
  const [editTitle, setEditTitle] = useState(node.title);
  const [editBody, setEditBody] = useState(node.body);
  const [isHovered, setIsHovered] = useState(false);
  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing) {
      setEditTitle(node.title);
      setEditBody(node.body);
    }
  }, [isEditing, node.title, node.body]);

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  const isRootNode = !!node.isRoot;
  const hasChildren = node.children.length > 0;

  // Candidate state CSS class (overrides selection border when in adversarial flow)
  const candidateClass = candidateStatus === 'candidate'
    ? 'node-candidate-state node-entering-candidate'
    : candidateStatus === 'kept'
    ? 'node-kept-state'
    : candidateStatus === 'eliminated'
    ? 'node-eliminated-state'
    : candidateStatus === 'overridden-keep'
    ? 'node-overridden-keep-state'
    : candidateStatus === 'overridden-eliminate'
    ? 'node-overridden-eliminate-state'
    : '';

  const isEliminated = candidateStatus === 'eliminated' || candidateStatus === 'overridden-eliminate';

  return (
    <div
      ref={cardRef}
      className={`absolute node-card group rounded-xl shadow-sm bg-white ${
        candidateStatus
          ? `border ${candidateClass}`
          : isSelected
          ? 'border-2 border-blue-500 shadow-blue-100'
          : 'border border-slate-200 hover:border-blue-300 hover:shadow-md'
      } ${isDraggingThis ? 'shadow-xl opacity-95 cursor-grabbing' : 'cursor-grab'} ${isRootNode ? 'p-5' : 'p-4'}`}
      style={{
        top: pos.y,
        left: pos.x,
        width: NODE_W,
        zIndex: isDraggingThis ? 100 : isEditing ? 50 : isSelected ? 10 : 1,
        userSelect: 'none',
        transition: 'opacity 0.4s ease, border-color 0.3s ease, box-shadow 0.3s ease',
      }}
      onMouseDown={(e) => { if (!isEditing) { e.stopPropagation(); onCardMouseDown(e); } }}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      onDoubleClick={(e) => { e.stopPropagation(); onEditStart(); }}
      onContextMenu={(e) => { e.stopPropagation(); onContextMenu(e); }}
      onMouseEnter={() => {
        setIsHovered(true);
        if (cardRef.current) setHoverRect(cardRef.current.getBoundingClientRect());
      }}
      onMouseLeave={() => { setIsHovered(false); setHoverRect(null); }}
    >
      {/* ── Collapse toggle (top-right) ── */}
      {(isRootNode || hasChildren) && (
        <button
          className="absolute top-2 right-2 text-slate-300 hover:text-blue-500 transition-colors"
          onClick={(e) => { e.stopPropagation(); onToggleCollapse(); }}
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
        </button>
      )}

      {/* ── Collapsed badge ── */}
      {isCollapsed && hasChildren ? (
        <p className="text-xs text-slate-400 italic pr-4">
          {descendantCount} node{descendantCount !== 1 ? 's' : ''} hidden
        </p>
      ) : (
        <>
          {isEditing ? (
            <>
              <textarea
                className="font-semibold text-slate-900 text-sm w-full border border-slate-200 rounded-lg p-1.5 resize-none outline-none focus:border-blue-400 mb-2.5 leading-snug flex-1"
                rows={5}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onClick={stop}
                autoFocus
                placeholder="Idea title (up to 15 words)…"
              />
              <div className="flex items-center gap-1.5">
                <button
                  className="flex-1 text-[11px] font-medium bg-blue-500 text-white rounded-lg py-1 hover:bg-blue-600 transition-colors"
                  onClick={(e) => { e.stopPropagation(); onEditSave(editTitle, ''); }}
                >
                  Save
                </button>
                <button
                  className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  onClick={(e) => { e.stopPropagation(); onAddChild(); }}
                  title="Add child node"
                >
                  <Plus size={13} />
                </button>
                {!isRootNode && (
                  <button
                    className="w-7 h-7 flex items-center justify-center text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    title="Delete node"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Verdict badge (top-left, only when scored) */}
              {candidateScore && (
                <div className={`absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full score-badge-enter ${
                  candidateScore.verdict === 'KEEP'
                    ? 'bg-green-100 text-green-700'
                    : candidateScore.verdict === 'ELIMINATE'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {candidateScore.verdict === 'KEEP' ? '✓ KEPT'
                    : candidateScore.verdict === 'ELIMINATE' ? '✗ ELIM'
                    : '~ BORDER'}
                </div>
              )}

              <h3 className={`font-semibold text-slate-900 text-sm leading-snug ${
                (isRootNode || hasChildren || candidateScore) ? 'pr-5' : ''
              } ${candidateScore ? 'pt-4' : ''} mb-1 flex-1 ${
                isEliminated ? (candidateStatus === 'overridden-eliminate' ? 'title-with-strikethrough title-overridden-eliminate' : 'title-with-strikethrough') : ''
              }`}>
                {node.title}
              </h3>

              {/* Score bars + objection (visible after Critic phase) */}
              {candidateScore && (
                <div className="mb-2 score-badge-enter">
                  <div className="flex flex-col gap-0.5 mb-1.5">
                    {([
                      { label: 'N', value: candidateScore.novelty, color: '#6366f1' },
                      { label: 'F', value: candidateScore.feasibility, color: '#8b5cf6' },
                      { label: 'I', value: candidateScore.impact, color: '#a855f7' },
                    ] as const).map(({ label, value, color }) => (
                      <div key={label} className="flex items-center gap-1">
                        <span className="text-[9px] text-slate-400 font-medium w-3 flex-shrink-0">{label}</span>
                        <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${value * 10}%`,
                              backgroundColor: color,
                              transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                            }}
                          />
                        </div>
                        <span className="text-[9px] text-slate-400 w-4 text-right flex-shrink-0">{value}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 italic leading-snug line-clamp-2">
                    "{candidateScore.strongest_objection}"
                  </p>
                </div>
              )}

              {/* ── Bottom bar — conditional on project state ── */}
              {isProjectNode ? (
                // Project node: always show "Enter Project", no chat icon
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={(e) => { e.stopPropagation(); onOpenProject(); }}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors text-[10px] font-medium shadow-sm"
                    title="Enter Project"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M13 5l7 7-7 7M5 12h15" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </svg>
                    Enter Project
                  </button>
                </div>
              ) : sessionProjectExists ? (
                // Project exists but this is not the project node:
                // only show bottom bar when this card is selected
                isSelected ? (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    {/* chat icon */}
                    <div
                      draggable
                      onDragStart={(e) => { e.stopPropagation(); onChatDragStart(e); }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => { e.stopPropagation(); onSendToChat(); }}
                      className="w-6 h-6 rounded-full bg-slate-100 hover:bg-purple-100 flex items-center justify-center text-slate-400 hover:text-purple-500 transition-colors cursor-pointer"
                      title="Send to chat"
                    >
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                    </div>
                    {/* Replace Project */}
                    <button
                      onClick={(e) => { e.stopPropagation(); onReplaceProject(); }}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 hover:bg-orange-50 hover:text-orange-500 transition-colors text-[10px] font-medium"
                      title="Replace Project binding"
                    >
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                      Replace Project
                    </button>
                  </div>
                ) : null
              ) : candidateStatus && onToggleCandidateStatus ? (
                // Adversarial mode footer: toggle button
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-center">
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleCandidateStatus(); }}
                    onMouseDown={(e) => e.stopPropagation()}
                    className={`text-[10px] font-medium px-3 py-1 rounded-full transition-colors ${
                      isEliminated
                        ? 'bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200'
                        : 'bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 border border-slate-200'
                    }`}
                    title={isEliminated ? '点击复活此选题' : '点击淘汰此选题'}
                  >
                    {isEliminated ? '↩ 复活' : '✕ 淘汰'}
                  </button>
                </div>
              ) : (
                // No project yet: show chat icon + new project "+"
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <div
                    draggable
                    onDragStart={(e) => { e.stopPropagation(); onChatDragStart(e); }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); onSendToChat(); }}
                    className="w-6 h-6 rounded-full bg-slate-100 hover:bg-purple-100 flex items-center justify-center text-slate-400 hover:text-purple-500 transition-colors cursor-pointer"
                    title="Send to chat"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </svg>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onNewProject(); }}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="w-6 h-6 rounded-full bg-slate-100 hover:bg-blue-100 flex items-center justify-center text-slate-400 hover:text-blue-500 transition-colors"
                    title="New Project"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                    </svg>
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Memory hover panel — rendered via portal to escape stacking context */}
      {isHovered && !isEditing && hoverRect && ReactDOM.createPortal(
        <div
          className="bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col pointer-events-none"
          style={{
            position: 'fixed',
            top: hoverRect.top,
            left: hoverRect.right + 16,
            width: '42vw',
            maxHeight: '60vh',
            zIndex: 99999,
          }}
        >
          {/* Header */}
          <div className="px-5 pt-4 pb-3 border-b border-slate-100 flex items-center gap-2 bg-white">
            <span className="w-2 h-2 rounded-full bg-[#7c3aed]" />
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
              Session Memory
            </p>
          </div>
          {/* Content */}
          <div className="px-5 py-4 overflow-y-auto flex-1 bg-white">
            <div className="text-[13px] text-slate-600 leading-relaxed whitespace-pre-wrap">
              {memoryContent}
            </div>
          </div>
          {/* Footer gradient fade */}
          <div className="h-6 bg-gradient-to-t from-white to-transparent flex-shrink-0" />
        </div>,
        document.body
      )}

      {/* Side add-child button */}
      {!isEditing && (
        <button
          className="absolute -right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 hover:text-[#7c3aed] hover:border-[#c4b5fd] transition-all z-10"
          onClick={(e) => { e.stopPropagation(); onAddChild(); }}
          onMouseDown={(e) => e.stopPropagation()}
          title="Add child node"
        >
          <Plus size={11} />
        </button>
      )}
    </div>
  );
}

// ── Main component ──
export default function IdeaBrainstormingWorkspace({ query, onBack, onIdeaMap, initialProject }: Props) {
  // ── Panel state ──
  const [showFiles, setShowFiles] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  // ── Adversarial generation state ──
  const [adversarialPhase, setAdversarialPhase] = useState<AdversarialPhase>('idle');
  const [candidateStatuses, setCandidateStatuses] = useState<Record<string, CandidateStatus>>({});
  const [candidateScores, setCandidateScores] = useState<Record<string, ScoredTopic>>({});
  const [surveyStatusText, setSurveyStatusText] = useState('');
  // Tracks topics generated in this session for the Critic call
  const generatedTopicsRef = useRef<GeneratedTopic[]>([]);
  // Track how many candidates generated so far (for status display)
  const [generatedCount, setGeneratedCount] = useState(0);

  // ── Session memory (mock AI-generated) ──
  const [sessionMemory] = useState<string>(
    `## Research Memory\n\n**Key concepts identified:**\n- ${query.split(' ').slice(0, 4).join(', ')}\n- Methodology and experimental design\n- Literature gaps and open problems\n\n**User intent:**\n- Explore core research directions and identify key themes\n- Build a structured outline from brainstorming sessions\n- Surface relevant prior work and synthesize insights\n\n**Session highlights:**\n- User emphasized the importance of reproducibility\n- Discussed trade-offs between depth and breadth of survey\n- Expressed interest in both theoretical and applied angles\n\n**Open questions:**\n- What are the main hypotheses to validate?\n- Which references are most directly relevant?\n- Are there conflicting findings in prior literature?\n- What evaluation metrics should be prioritized?\n\n**Next steps:**\n- Identify 3–5 anchor papers per subtopic\n- Draft section headings for the outline\n- Clarify scope: single domain vs. cross-domain`
  );

  // ── Canvas pan/zoom ──
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);

  // ── Node state ──
  const [nodeMap, setNodeMap] = useState<Record<string, NodeData>>(toMap(INITIAL_NODES));
  const [selectedNodeId, setSelectedNodeId] = useState<string>(initialProject?.nodeId ?? 'root');
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{ nodeId: string; x: number; y: number } | null>(null);
  // 整个 brainstorming session 只绑定一个 project（节点 ID + 项目名）
  const [sessionProject, setSessionProject] = useState<{ nodeId: string; name: string } | null>(
    initialProject ?? null
  );
  // 新建 project 类型选择弹窗
  const [projectPickerNodeId, setProjectPickerNodeId] = useState<string | null>(null);
  // Replace Project 确认弹窗
  const [replaceConfirmNodeId, setReplaceConfirmNodeId] = useState<string | null>(null);
  // 当前主视图: 'map' | 'outline' | 'project'（若传入 initialProject 则直接进入 project 视图）
  const [activeView, setActiveView] = useState<'map' | 'outline' | 'project'>(initialProject ? 'project' : 'map');
  // Writer 选项仅在用户点击「一键生成正文」后点亮
  const [writerEnabled, setWriterEnabled] = useState(false);
  // 持久化 outline 已生成的内容（切换视图后不丢失）
  const [outlineNodeMap, setOutlineNodeMap] = useState<Record<string, OutlineNode>>({});

  // ── Derived layout ──
  const positions = useMemo(() => computeLayout(nodeMap, 'root'), [nodeMap]);

  const visibleNodeIds = useMemo(() => {
    const visible = new Set<string>();
    function visit(id: string) {
      if (!nodeMap[id]) return;
      visible.add(id);
      if (collapsed.has(id)) return;
      nodeMap[id].children.forEach(visit);
    }
    visit('root');
    return visible;
  }, [nodeMap, collapsed]);

  // ── Chat state ──
  const initialUserMsg =
    query.trim() ||
    'Could you explain the Bayesian view of the complete connections of noncontent distribution as papers arrive?';

  const [messages, setMessages] = useState<Message[]>([
    { role: 'user', text: initialUserMsg },
    {
      role: 'ai',
      text: "Do you have any reference materials related to this topic? Feel free to upload them — papers, notes, or links all work. If not, no worries at all. Let's keep the conversation going so I can better understand your ideas and intentions.",
    },
  ]);
  const [chatInput, setChatInput] = useState('');

  // ── Custom node positions (user-dragged overrides) ──
  const [customPositions, setCustomPositions] = useState<Record<string, LayoutPos>>({});

  // ── Collision resolution: push cards apart when one expands into editing mode ──
  const EDIT_H = 240; // approximate height of a card while editing (2-row title + 3-row body + action row)
  const GAP = 24;     // minimum pixel gap enforced between any two cards

  useEffect(() => {
    if (!editingNodeId) return;

    // Snapshot current effective positions (custom overrides take priority)
    const currentPositions = positions; // stable ref from useMemo
    const snap: Record<string, LayoutPos> = {};
    Object.keys(nodeMap).forEach((id) => {
      snap[id] = customPositions[id] ?? currentPositions[id] ?? { x: 0, y: 0 };
    });

    const getH = (id: string) =>
      id === editingNodeId ? EDIT_H : nodeMap[id]?.isRoot ? ROOT_H : NODE_H;

    const mutable: Record<string, LayoutPos> = {};
    Object.keys(snap).forEach((id) => { mutable[id] = { ...snap[id] }; });

    // Iterative AABB separation — up to 40 passes until fully settled
    for (let pass = 0; pass < 40; pass++) {
      let moved = false;
      const ids = Object.keys(mutable);

      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const a = ids[i], b = ids[j];
          const pa = mutable[a], pb = mutable[b];
          const ha = getH(a), hb = getH(b);

          // Actual AABB overlap (positive = overlapping, negative = gap already exists)
          const ox = Math.min(pa.x + NODE_W, pb.x + NODE_W) - Math.max(pa.x, pb.x) + GAP;
          const oy = Math.min(pa.y + ha,    pb.y + hb)    - Math.max(pa.y, pb.y) + GAP;

          if (ox <= 0 || oy <= 0) continue; // no collision

          // Prefer to push along the axis with less penetration
          if (ox < oy) {
            // Push horizontally
            const half = ox / 2;
            if (pa.x < pb.x) {
              mutable[a] = { ...pa, x: pa.x - half };
              mutable[b] = { ...pb, x: pb.x + half };
            } else {
              mutable[a] = { ...pa, x: pa.x + half };
              mutable[b] = { ...pb, x: pb.x - half };
            }
          } else {
            // Push vertically — keep the editing card anchored, push the other
            const full = oy;
            if (a === editingNodeId) {
              // B is the one being pushed
              mutable[b] = { ...pb, y: pa.y > pb.y ? pb.y - full : pb.y + full };
            } else if (b === editingNodeId) {
              // A is the one being pushed
              mutable[a] = { ...pa, y: pb.y > pa.y ? pa.y - full : pa.y + full };
            } else {
              // Neither is editing: split evenly
              const half = full / 2;
              if (pa.y < pb.y) {
                mutable[a] = { ...pa, y: pa.y - half };
                mutable[b] = { ...pb, y: pb.y + half };
              } else {
                mutable[a] = { ...pa, y: pa.y + half };
                mutable[b] = { ...pb, y: pb.y - half };
              }
            }
          }
          moved = true;
        }
      }
      if (!moved) break;
    }

    // Apply only the positions that actually changed
    setCustomPositions((prev) => {
      const next = { ...prev };
      Object.keys(mutable).forEach((id) => {
        const orig = prev[id] ?? currentPositions[id];
        if (!orig || Math.abs(mutable[id].x - orig.x) > 0.5 || Math.abs(mutable[id].y - orig.y) > 0.5) {
          next[id] = mutable[id];
        }
      });
      return next;
    });
  // positions is stable (useMemo), customPositions intentionally excluded to avoid loop
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingNodeId, nodeMap]);

  // ── Refs ──
  const dragOrigin = useRef<{ mx: number; my: number; ox: number; oy: number } | null>(null);
  const canvasRef = useRef<HTMLElement>(null);
  const cardDragRef = useRef<{ id: string; startMx: number; startMy: number; origX: number; origY: number } | null>(null);
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);

  // ── Node handlers ──
  const handleNodeSelect = (id: string) => {
    setSelectedNodeId(id);
    if (editingNodeId !== id) setEditingNodeId(null);
  };

  const handleEditSave = (id: string, title: string, body: string) => {
    setNodeMap((prev) => ({ ...prev, [id]: { ...prev[id], title, body } }));
    setEditingNodeId(null);
  };

  // ── Context menu handlers ──
  const handleContextMenu = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    setContextMenu({ nodeId, x: e.clientX, y: e.clientY });
  };

  const handleContextDelete = () => {
    if (!contextMenu) return;
    handleDelete(contextMenu.nodeId);
    setContextMenu(null);
  };

  const handleContextDuplicate = () => {
    if (!contextMenu) return;
    const src = nodeMap[contextMenu.nodeId];
    if (!src) { setContextMenu(null); return; }
    const newId = `node-${Date.now()}`;
    const parentId = src.parentId;
    setNodeMap((prev) => {
      const next: Record<string, NodeData> = {
        ...prev,
        [newId]: { id: newId, label: src.label, title: src.title + ' (copy)', body: src.body, children: [], parentId },
      };
      if (parentId && next[parentId]) {
        next[parentId] = { ...next[parentId], children: [...next[parentId].children, newId] };
      }
      return next;
    });
    setSelectedNodeId(newId);
    setContextMenu(null);
  };

  const handleDelete = (id: string) => {
    if (id === 'root') return;
    setNodeMap((prev) => {
      const node = prev[id];
      if (!node) return prev;
      const next = { ...prev };
      if (node.parentId && next[node.parentId]) {
        next[node.parentId] = {
          ...next[node.parentId],
          children: next[node.parentId].children.filter((c) => c !== id),
        };
      }
      [id, ...getDescendants(prev, id)].forEach((rid) => delete next[rid]);
      return next;
    });
    setSelectedNodeId('root');
    setEditingNodeId(null);
  };

  const handleAddChild = (parentId: string) => {
    const newId = `node-${Date.now()}`;
    setNodeMap((prev) => ({
      ...prev,
        [newId]: {
        id: newId,
        label: 'New',
        title: 'New idea — double-click to edit the title',
        body: '',
        children: [],
        parentId,
      },
      [parentId]: { ...prev[parentId], children: [...prev[parentId].children, newId] },
    }));
    setSelectedNodeId(newId);
    setEditingNodeId(newId);
  };

  // ── Adversarial generation handlers ──────────────────────────────────────

  const startAdversarialGeneration = useCallback(async () => {
    if (!query.trim()) return;

    // Reset canvas: only the root node (titled after the query)
    generatedTopicsRef.current = [];
    setGeneratedCount(0);
    setCandidateStatuses({});
    setCandidateScores({});
    setNodeMap({
      root: {
        id: 'root',
        label: 'Query',
        title: query,
        body: '',
        children: [],
        parentId: null,
        isRoot: true,
      },
    });

    // Phase 1: landscape survey
    setAdversarialPhase('surveying');
    setSurveyStatusText('正在研究领域背景...');

    let landscape = '';
    try {
      landscape = await doLandscapeSurvey(query);
    } catch (err) {
      console.error('Landscape survey failed:', err);
      setSurveyStatusText('');
      setAdversarialPhase('idle');
      return;
    }

    // Phase 2: stream topic generation
    setAdversarialPhase('generating');
    setSurveyStatusText('');

    try {
      await streamTopics(
        query,
        landscape,
        (topic) => {
          generatedTopicsRef.current = [...generatedTopicsRef.current, topic];
          setGeneratedCount((c) => c + 1);

          setNodeMap((prev) => {
            const rootNode = prev.root;
            return {
              ...prev,
              root: { ...rootNode, children: [...rootNode.children, topic.id] },
              [topic.id]: {
                id: topic.id,
                label: topic.angle,
                title: topic.title,
                body: topic.oneLiner,
                children: [],
                parentId: 'root',
              },
            };
          });
          setCandidateStatuses((prev) => ({ ...prev, [topic.id]: 'candidate' }));
        },
        () => {
          setAdversarialPhase('awaiting_confirm');
        },
      );
    } catch (err) {
      console.error('Topic streaming failed:', err);
      setAdversarialPhase('idle');
    }
  }, [query]);

  const startScoring = useCallback(async () => {
    const topics = generatedTopicsRef.current;
    if (topics.length === 0) return;

    setAdversarialPhase('scoring');

    try {
      const scores = await scoreTopics(query, topics);

      const newStatuses: Record<string, CandidateStatus> = {};
      const newScores: Record<string, ScoredTopic> = {};

      for (const score of scores) {
        newScores[score.id] = score;
        newStatuses[score.id] =
          score.verdict === 'KEEP'
            ? 'kept'
            : score.verdict === 'ELIMINATE'
            ? 'eliminated'
            : 'candidate'; // BORDERLINE stays as candidate (user decides)
      }

      // Any topics not returned by Critic default to candidate
      topics.forEach((t) => {
        if (!newStatuses[t.id]) newStatuses[t.id] = 'candidate';
      });

      setCandidateScores(newScores);
      setCandidateStatuses(newStatuses);
      setAdversarialPhase('done');
    } catch (err) {
      console.error('Scoring failed:', err);
      setAdversarialPhase('awaiting_confirm'); // go back to confirm banner
    }
  }, [query]);

  const handleToggleCandidateStatus = useCallback((nodeId: string) => {
    setCandidateStatuses((prev) => {
      const current = prev[nodeId] ?? 'candidate';
      const isCurrentlyEliminated =
        current === 'eliminated' || current === 'overridden-eliminate';
      return {
        ...prev,
        [nodeId]: isCurrentlyEliminated ? 'overridden-keep' : 'overridden-eliminate',
      };
    });
  }, []);

  const confirmTopics = useCallback(() => {
    // Delete all eliminated nodes from the tree
    const toDelete = Object.entries(candidateStatuses)
      .filter(([, s]) => s === 'eliminated' || s === 'overridden-eliminate')
      .map(([id]) => id);

    setNodeMap((prev) => {
      const next = { ...prev };
      for (const nodeId of toDelete) {
        if (!next[nodeId]) continue;
        const parentId = next[nodeId].parentId;
        if (parentId && next[parentId]) {
          next[parentId] = {
            ...next[parentId],
            children: next[parentId].children.filter((c) => c !== nodeId),
          };
        }
        delete next[nodeId];
      }
      return next;
    });

    // Clear adversarial state
    setCandidateStatuses({});
    setCandidateScores({});
    setAdversarialPhase('idle');
  }, [candidateStatuses]);

  // ── Auto-trigger on mount when no initialProject ──────────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!initialProject && query.trim()) {
      startAdversarialGeneration();
    }
  }, []); // intentionally run only on mount

  const handleToggleCollapse = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ── Drag node card → chat ──
  const handleNodeDragStart = (e: React.DragEvent, node: NodeData) => {
    const content = `[${node.label}] ${node.title}: ${node.body}`;
    e.dataTransfer.setData('text/plain', content);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleChatDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleChatDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const content = e.dataTransfer.getData('text/plain');
    if (content) setChatInput((prev) => (prev ? `${prev}\n${content}` : content));
  };

  // ── Card drag (reposition) ──
  const handleCardMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if (e.button !== 0) return;
    const effPos = customPositions[nodeId] ?? positions[nodeId] ?? { x: 0, y: 0 };
    cardDragRef.current = { id: nodeId, startMx: e.clientX, startMy: e.clientY, origX: effPos.x, origY: effPos.y };
    setDraggingCardId(nodeId);
  };

  // ── Canvas pan ──
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.node-card')) return;
    dragOrigin.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y };
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Card repositioning takes priority
    if (cardDragRef.current) {
      const { id, startMx, startMy, origX, origY } = cardDragRef.current;
      const dx = (e.clientX - startMx) / scale;
      const dy = (e.clientY - startMy) / scale;
      setCustomPositions((prev) => ({ ...prev, [id]: { x: origX + dx, y: origY + dy } }));
      return;
    }
    if (!isDragging || !dragOrigin.current) return;
    setOffset({
      x: dragOrigin.current.ox + (e.clientX - dragOrigin.current.mx),
      y: dragOrigin.current.oy + (e.clientY - dragOrigin.current.my),
    });
  };

  const handleMouseUp = () => {
    cardDragRef.current = null;
    setDraggingCardId(null);
    dragOrigin.current = null;
    setIsDragging(false);
  };

  // ── Wheel: pan + pinch zoom ──
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;
      setScale((prev) => {
        const delta = -e.deltaY * 0.005;
        const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev + delta * prev));
        const ratio = next / prev;
        setOffset((o) => ({
          x: cursorX - ratio * (cursorX - o.x),
          y: cursorY - ratio * (cursorY - o.y),
        }));
        return next;
      });
    } else {
      setOffset((o) => ({ x: o.x - e.deltaX, y: o.y - e.deltaY }));
    }
  }, []);

  useEffect(() => {
    if (activeView !== 'map') return;
    const el = canvasRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel, activeView]);

  const zoomBy = (delta: number) =>
    setScale((prev) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev + delta)));

  // Click on canvas background → exit editing
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!(e.target as HTMLElement).closest('.node-card')) setEditingNodeId(null);
    if (contextMenu) setContextMenu(null);
  };

  const handleNewProject = (nodeId: string) => {
    // Go straight to Outline — type picker moved to "Generate Full Text" in Outline
    const srcNode = nodeMap[nodeId];
    const title = srcNode ? srcNode.title : 'New Project';
    setSessionProject({ nodeId, name: title });
    setSelectedNodeId(nodeId);
    setProjectPickerNodeId(null);
    setActiveView('outline');
  };

  const handleOpenProject = () => {
    if (writerEnabled) setActiveView('project');
    else setActiveView('outline');
  };

  const handleReplaceProject = (nodeId: string) => {
    setReplaceConfirmNodeId(nodeId);
  };

  const handleConfirmReplace = () => {
    if (!replaceConfirmNodeId) return;
    const srcNode = nodeMap[replaceConfirmNodeId];
    setSessionProject({ nodeId: replaceConfirmNodeId, name: srcNode ? srcNode.title : 'New Project' });
    setSelectedNodeId(replaceConfirmNodeId);
    setReplaceConfirmNodeId(null);
    setWriterEnabled(false);  // reset writer unlock when replacing project
    setActiveView('outline');
  };

  // ── Compute visible connections ──
  const connections: { path: string; key: string }[] = [];
  (Object.values(nodeMap) as NodeData[]).forEach((node) => {
    if (!visibleNodeIds.has(node.id) || collapsed.has(node.id)) return;
    node.children.forEach((childId) => {
      const pPos = customPositions[node.id] ?? positions[node.id];
      const cPos = customPositions[childId] ?? positions[childId];
      if (!visibleNodeIds.has(childId) || !pPos || !cPos) return;
      connections.push({
        key: `${node.id}-${childId}`,
        path: connectionPath(pPos, cPos, !!node.isRoot),
      });
    });
  });

  // ── Outline view: fully independent early return ──
  if (activeView === 'outline' && sessionProject) {
    return (
      <OutlineWorkspace
        query={sessionProject.name}
        writerEnabled={writerEnabled}
        initialNodeMap={outlineNodeMap}
        onBack={() => setActiveView('map')}
        onGoToWriter={() => setActiveView('project')}
        onGenerateFullText={(type) => {
          if (sessionProject) {
            saveProject(sessionProject.name, type === 'latex' ? 'latex' : 'document', 'idea');
          }
          setWriterEnabled(true);
          setActiveView('project');
        }}
        onOutlineGenerated={(nm) => setOutlineNodeMap(nm)}
      />
    );
  }

  // ── Project view: fully independent early return ──
  if (activeView === 'project' && sessionProject) {
    return (
      <ProjectWorkspaceView
        projectName={sessionProject.name}
        onBack={() => setActiveView('map')}
        onOutline={() => setActiveView('outline')}
        onHome={onBack}
      />
    );
  }

  return (
    <div className="h-screen flex flex-col" style={{ fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>

      {/* ── Fixed full-screen background (lowest z-layer, never moves) ── */}
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

      {/* ── Header ── */}
      <header className="h-14 shrink-0 bg-white/96 backdrop-blur-md border-b border-slate-200 z-40 flex items-center justify-between px-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 min-w-[180px] text-left"
          aria-label="Back to Home"
        >
          <LogoSmall />
          <span className="text-[13px] font-semibold text-slate-900 tracking-[-0.01em]">SciMaster</span>
        </button>

        <div className="flex items-center justify-center gap-6 flex-1">
          <div className="flex items-center gap-[9px]">
            <div className="w-6 h-6 rounded-full bg-[#7c3aed] text-white text-[12px] font-medium flex items-center justify-center select-none">1</div>
            <span className="text-sm text-[#7c3aed] font-medium">Ideamap</span>
          </div>
          <div className="w-8 h-px bg-slate-200" />
          <button
            onClick={sessionProject ? () => setActiveView('outline') : undefined}
            disabled={!sessionProject}
            className={`flex items-center gap-[9px] transition-opacity ${sessionProject ? 'cursor-pointer hover:opacity-75' : 'cursor-not-allowed opacity-40'}`}
          >
            <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-[12px] font-medium select-none ${sessionProject ? 'border-slate-300 text-slate-700 bg-white' : 'border-slate-200 text-slate-400 bg-white'}`}>2</div>
            <span className={`text-sm font-medium ${sessionProject ? 'text-slate-700' : 'text-slate-400'}`}>Outline</span>
          </button>
          <div className="w-8 h-px bg-slate-200" />
          <button
            onClick={writerEnabled && sessionProject ? () => setActiveView('project') : undefined}
            disabled={!writerEnabled || !sessionProject}
            className={`flex items-center gap-[9px] transition-opacity ${writerEnabled && sessionProject ? 'cursor-pointer hover:opacity-75' : 'cursor-not-allowed opacity-40'}`}
          >
            <div className="w-6 h-6 rounded-full border border-slate-200 text-slate-400 flex items-center justify-center text-[12px] font-medium bg-white select-none">3</div>
            <span className="text-sm text-slate-400 font-medium">Writing</span>
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

      {/* ── Narrow Sidebar ── */}
      <div className="w-[56px] h-full bg-white/82 backdrop-blur-md border-r border-slate-200 z-30 flex-shrink-0 flex flex-col items-center py-4">
        <button
          onClick={() => setShowFiles((v) => !v)}
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${showFiles ? 'bg-[#f5f3ff] text-[#7c3aed] border border-[#ede9fe]' : 'bg-white text-slate-500 border border-slate-200 shadow-sm hover:bg-slate-50'}`}
          title="Toggle Files"
        >
          <Folder size={15} />
        </button>

        <div className="mt-4 w-full flex justify-center">
          <button
            className="w-8 h-8 rounded-xl bg-white text-slate-700 border border-slate-200 flex items-center justify-center shadow-sm"
            title="Idea canvas"
          >
            <Map size={15} />
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

      {/* ── Main Canvas ── */}
      <main
        ref={canvasRef as React.RefObject<HTMLElement>}
        id="infinite-canvas"
        className="flex-grow relative overflow-hidden select-none"
        style={{ cursor: isDragging ? 'grabbing' : 'grab', zIndex: 1 }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
      >
        {/* ── Adversarial phase overlays ── */}

        {/* Surveying / generating status pill */}
        {(adversarialPhase === 'surveying' || adversarialPhase === 'generating') && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-white/90 backdrop-blur-sm border border-indigo-200 rounded-full px-4 py-2 shadow-md">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-xs text-indigo-700 font-medium">
              {adversarialPhase === 'surveying'
                ? surveyStatusText || '正在研究领域背景...'
                : `正在生成选题候选... (${generatedCount}/7)`}
            </span>
          </div>
        )}

        {/* Scoring status pill */}
        {adversarialPhase === 'scoring' && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-white/90 backdrop-blur-sm border border-violet-200 rounded-full px-4 py-2 shadow-md">
            <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
            <span className="text-xs text-violet-700 font-medium">⚔️ 对抗打分中，Critic 正在审查每个选题...</span>
          </div>
        )}

        {/* ConfirmBanner: awaiting user to start scoring */}
        {adversarialPhase === 'awaiting_confirm' && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 w-[480px] max-w-[90vw]">
            <div className="bg-white/95 backdrop-blur-sm border border-indigo-200 rounded-2xl shadow-xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">⚔️</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">
                    已生成 {generatedTopicsRef.current.length} 个候选选题
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    确认后将启动对抗打分：Critic 会对每个选题给出分数与最强反对意见
                  </p>
                </div>
              </div>
              <button
                onClick={startScoring}
                className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <span>开始打分</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M13 5l7 7-7 7M5 12h15" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Confirm topics: done phase */}
        {adversarialPhase === 'done' && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 w-[520px] max-w-[90vw]">
            <div className="bg-white/95 backdrop-blur-sm border border-green-200 rounded-2xl shadow-xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">✅</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">对抗打分完成</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    点击节点底部按钮可手动复活或淘汰选题；确认后划除节点将被移除
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => startAdversarialGeneration()}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-500 hover:bg-slate-50 transition-colors"
                  title="重新生成"
                >
                  ↩ 重来
                </button>
                <button
                  onClick={confirmTopics}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors shadow-sm"
                >
                  确认选题
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Expand sidebar button */}
        {!showSidebar && (
          <button
            onClick={() => setShowSidebar(true)}
            className="absolute top-4 right-4 z-30 w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
            title="Expand conversation"
          >
            <PanelRightOpen size={16} />
          </button>
        )}

        {/* Files panel */}
        {showFiles && (
          <div className="absolute top-[16px] left-[58px] w-64 bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Project Files</h2>
            </div>
            <div className="p-2">
              <ul className="space-y-1">
                {[
                  { icon: 'draft', label: 'PRD — AI Research Assistant', meta: 'v1.2 · 3 days ago' },
                  { icon: 'draft', label: 'PRD — Ideaflow Canvas', meta: 'v0.9 · 1 week ago' },
                ].map(({ icon, label, meta }) => (
                  <li key={label} className="px-3 py-2.5 rounded-lg cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-start gap-3 group">
                    <span className="material-symbols-outlined text-slate-400 group-hover:text-blue-500 text-lg mt-0.5">{icon}</span>
                    <div className="min-w-0">
                      <p className="text-sm text-slate-700 group-hover:text-blue-700 font-medium leading-snug truncate">{label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{meta}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}


        {/* Zoom controls */}
        <div className="absolute bottom-8 left-8 flex items-center gap-2 z-20">
          <button onClick={() => zoomBy(SCALE_STEP)} className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors" title="Zoom in">
            <ZoomIn className="h-5 w-5 text-slate-500" />
          </button>
          <button onClick={() => zoomBy(-SCALE_STEP)} className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors" title="Zoom out">
            <ZoomOut className="h-5 w-5 text-slate-500" />
          </button>
          <span className="text-[11px] text-slate-400 ml-1 tabular-nums">{Math.round(scale * 100)}%</span>
        </div>

        {/* ── Pannable + zoomable world ── */}
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            willChange: 'transform',
          }}
        >
          {/* SVG connections */}
          <svg className="absolute inset-0 pointer-events-none overflow-visible" style={{ width: '9999px', height: '9999px' }}>
            {connections.map(({ key, path }) => (
              <path key={key} className="connection-line" d={path} />
            ))}
          </svg>

          {/* Node cards */}
          {(Object.values(nodeMap) as NodeData[])
            .filter((node) => visibleNodeIds.has(node.id))
            .map((node) => {
              const pos = customPositions[node.id] ?? positions[node.id];
              if (!pos) return null;
              return (
                <NodeCard
                  key={node.id}
                  node={node}
                  pos={pos}
                  isSelected={selectedNodeId === node.id}
                  isEditing={editingNodeId === node.id}
                  isCollapsed={collapsed.has(node.id)}
                  isDraggingThis={draggingCardId === node.id}
                  descendantCount={getDescendants(nodeMap, node.id).length}
                  isProjectNode={!!sessionProject && sessionProject.nodeId === node.id}
                  sessionProjectExists={!!sessionProject}
                  onSelect={() => handleNodeSelect(node.id)}
                  onEditStart={() => setEditingNodeId(node.id)}
                  onEditSave={(t, b) => handleEditSave(node.id, t, b)}
                  onDelete={() => handleDelete(node.id)}
                  onAddChild={() => handleAddChild(node.id)}
                  onToggleCollapse={() => handleToggleCollapse(node.id)}
                  onNewProject={() => handleNewProject(node.id)}
                  onOpenProject={() => handleOpenProject()}
                  onReplaceProject={() => handleReplaceProject(node.id)}
                  onCardMouseDown={(e) => handleCardMouseDown(e, node.id)}
                  onChatDragStart={(e) => handleNodeDragStart(e, node)}
                  onSendToChat={() => setChatInput((prev) => {
                    const content = `${node.title}: ${node.body}`;
                    return prev ? `${prev}\n${content}` : content;
                  })}
                  onContextMenu={(e) => handleContextMenu(e, node.id)}
                  memoryContent={sessionMemory}
                  candidateStatus={candidateStatuses[node.id]}
                  candidateScore={candidateScores[node.id]}
                  onToggleCandidateStatus={
                    candidateStatuses[node.id]
                      ? () => handleToggleCandidateStatus(node.id)
                      : undefined
                  }
                />
              );
            })}
        </div>
      </main>

      {/* ── Chat Sidebar ── */}
      {showSidebar && (
        <aside className="w-[420px] h-full flex flex-col bg-white border-l border-slate-200 z-20 flex-shrink-0">
          <header className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-400 truncate max-w-[280px]">Context: {query}</p>
            <button
              onClick={() => setShowSidebar(false)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Collapse"
            >
              <PanelRightClose size={15} />
            </button>
          </header>

          <section className="flex-grow overflow-y-auto p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm gap-2">
                <FileText size={28} strokeWidth={1.5} />
                <span>Start a conversation</span>
              </div>
            ) : (
              messages.map((msg, i) => {
                const isLastAi = msg.role === 'ai' && i === messages.length - 1;
                return msg.role === 'user' ? (
                  <div key={i} className="flex flex-col items-end gap-2">
                    <div className="chat-bubble-user p-4 text-sm leading-relaxed max-w-[85%]">{msg.text}</div>
                    <span className="text-[10px] text-slate-400 mr-2">9:42 AM</span>
                  </div>
                ) : (
                  <div key={i} className="flex flex-col items-start gap-2">
                    <div className="chat-bubble-ai p-4 text-sm leading-relaxed text-slate-700 max-w-[85%]">{msg.text}</div>
                    <span className="text-[10px] text-slate-400 ml-2">9:43 AM</span>
                    {/* Upload suggestion card — only below last AI message */}
                    {isLastAi && (
                      <label className="mt-1 w-full max-w-[85%] cursor-pointer group">
                        <input type="file" multiple className="hidden" accept=".pdf,.doc,.docx,.txt,.md" />
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50 transition-all">
                          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 group-hover:border-blue-300 flex items-center justify-center flex-shrink-0 shadow-sm transition-colors">
                            <svg className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-slate-600 group-hover:text-blue-600 transition-colors">上传参考资料</p>
                            <p className="text-[10px] text-slate-400 truncate">PDF、Word、Markdown…</p>
                          </div>
                          <span className="ml-auto text-[10px] text-slate-300 group-hover:text-blue-400 transition-colors flex-shrink-0">点击上传</span>
                        </div>
                      </label>
                    )}
                  </div>
                );
              })
            )}
          </section>

          {/* Drop zone for node cards */}
          <footer
            className="p-4 border-t border-slate-100"
            onDragOver={handleChatDragOver}
            onDrop={handleChatDrop}
          >
            <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 bg-transparent text-sm text-slate-700 resize-none outline-none placeholder-slate-400 leading-relaxed max-h-24"
                rows={1}
                placeholder="Start with an idea, or drag a node here..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!chatInput.trim()) return;
                    setMessages((prev) => [...prev, { role: 'user', text: chatInput }]);
                    setChatInput('');
                  }
                }}
              />
              <button
                onClick={() => {
                  if (!chatInput.trim()) return;
                  setMessages((prev) => [...prev, { role: 'user', text: chatInput }]);
                  setChatInput('');
                }}
                disabled={!chatInput.trim()}
                className="flex-shrink-0 w-7 h-7 rounded-lg bg-[#7c3aed] flex items-center justify-center text-white disabled:opacity-40 hover:bg-[#6d28d9] transition-colors mb-0.5"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </button>
            </div>
          </footer>
        </aside>
      )}

      </div>{/* end flex-1 content row */}

      {/* ── Replace Project confirmation modal ── */}
      {replaceConfirmNodeId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
          onClick={() => setReplaceConfirmNodeId(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 w-[340px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-slate-800 mb-1">Replace Project Binding?</h3>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              This will rebind the session project to <span className="font-medium text-slate-600">"{nodeMap[replaceConfirmNodeId]?.title}"</span>. The previous binding will be removed.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setReplaceConfirmNodeId(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-500 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReplace}
                className="flex-1 py-2 rounded-xl bg-orange-500 text-white text-xs font-medium hover:bg-orange-600 transition-colors"
              >
                Replace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Right-click context menu ── */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-white rounded-xl shadow-lg border border-slate-100 py-1 min-w-[140px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
            onClick={handleContextDuplicate}
          >
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="9" y="9" width="13" height="13" rx="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            复制卡片
          </button>
          {contextMenu.nodeId !== 'root' && (
            <button
              className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2.5 transition-colors"
              onClick={handleContextDelete}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M3 6h18M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              删除卡片
            </button>
          )}
        </div>
      )}
    </div>
  );
}
