import React, { useState } from 'react';
import {
  ArrowUp,
  Bell,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  Folder,
  FolderOpen,
  HelpCircle,
  Layers,
  Map,
  PanelLeft,
  Pencil,
  Settings,
  X,
} from 'lucide-react';

const LogoSmall = () => (
  <img src="/scimaster_icon.svg" alt="SciMaster" width={28} height={28} style={{ display: 'block' }} />
);

type Props = {
  projectName?: string;
  onBack?: () => void;   // switch back to Outline (toggle pill)
  onHome?: () => void;   // return to homepage (logo button)
  onOutline?: () => void; // switch to Outline view (pill)
};

type TreeNode = {
  id: string;
  name: string;
  type: 'folder';
  children?: TreeNode[];
};

const FILE_TREE: TreeNode[] = [
  {
    id: 'p1',
    name: 'Project 1',
    type: 'folder',
    children: [
      {
        id: 'fp',
        name: 'final_project',
        type: 'folder',
        children: [],
      },
    ],
  },
  { id: 'xxx', name: 'New Project', type: 'folder', children: [] },
];

const KNOWLEDGE_TREE: TreeNode[] = [
  {
    id: 'kp1',
    name: 'Project 1',
    type: 'folder',
    children: [
      {
        id: 'kfp',
        name: 'final_project',
        type: 'folder',
        children: [],
      },
    ],
  },
  { id: 'kp2', name: 'project2', type: 'folder', children: [] },
];

function TreeItem({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const [open, setOpen] = useState(depth === 0);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <button
        onClick={() => hasChildren && setOpen((v) => !v)}
        className="w-full flex items-center gap-1.5 px-2 py-1 rounded-md text-[13px] text-slate-700 hover:bg-slate-100 transition-colors text-left"
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        {hasChildren ? (
          open ? <ChevronDown size={12} className="text-slate-400 flex-shrink-0" /> : <ChevronRight size={12} className="text-slate-400 flex-shrink-0" />
        ) : (
          <span className="w-3 flex-shrink-0" />
        )}
        {open && hasChildren ? (
          <FolderOpen size={14} className="text-slate-400 flex-shrink-0" />
        ) : (
          <Folder size={14} className="text-slate-400 flex-shrink-0" />
        )}
        <span className="truncate">{node.name}</span>
      </button>
      {open && node.children?.map((child) => (
        <TreeItem key={child.id} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function ProjectWorkspaceView({ projectName = 'New Project', onBack, onHome, onOutline }: Props) {
  const [chatInput, setChatInput] = useState('');

  return (
    <div className="h-screen flex bg-[#f8f7ff] overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Narrow icon sidebar (matches Idea map layout) ── */}
      <aside className="w-[50px] h-full bg-[#fcfcfd] border-r border-gray-100 flex flex-col items-center py-4 flex-shrink-0 z-20">
        <button
          onClick={onHome}
          className="mb-6 hover:opacity-80 transition-opacity"
          title="Back to home"
          aria-label="Go home"
        >
          <LogoSmall />
        </button>

        <div className="flex flex-col gap-4 w-full items-center">
          <button className="w-8 h-8 rounded-lg bg-[#f3e8ff] text-[#7e22ce] flex items-center justify-center">
            <FolderOpen size={18} />
          </button>
          <button className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-gray-50 flex items-center justify-center transition-colors">
            <Clock size={18} />
          </button>
          <button className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-gray-50 flex items-center justify-center transition-colors">
            <PanelLeft size={18} />
          </button>
        </div>

        <div className="flex-1" />

        <div className="flex flex-col gap-4 w-full items-center">
          <button className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-gray-50 flex items-center justify-center transition-colors relative">
            <Bell size={17} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-400" />
          </button>
          <button className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-gray-50 flex items-center justify-center transition-colors">
            <HelpCircle size={17} />
          </button>
          <button className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-gray-50 flex items-center justify-center transition-colors">
            <Settings size={17} />
          </button>
          <button className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-medium">
            L
          </button>
        </div>
      </aside>

      {/* ── File tree sidebar ── */}
      <div className="w-[238px] h-full bg-white border-r border-gray-100 flex flex-col flex-shrink-0 overflow-hidden">
        {/* Idea / Outline / Writer toggle pill */}
        <div className="px-4 pt-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            <button
              onClick={onBack}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-slate-500 hover:bg-white hover:text-slate-800 transition-all text-xs font-medium"
            >
              <Map size={13} /> Idea
            </button>
            <button
              onClick={onOutline ?? onBack}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-slate-500 hover:bg-white hover:text-slate-800 transition-all text-xs font-medium"
            >
              <Layers size={13} /> Outline
            </button>
            <button
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-white text-[#7c3aed] shadow-sm text-xs font-medium"
            >
              <FileText size={13} /> Writer
            </button>
          </div>
        </div>

        {/* Project title */}
        <div className="px-4 pt-4 pb-3 border-b border-slate-100">
          <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mb-1">Project</p>
          <p className="text-[13px] font-semibold text-slate-700 leading-snug line-clamp-2">{projectName}</p>
        </div>

        {/* Project file */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={16} className="text-slate-500" />
            <span className="text-[13px] font-semibold text-slate-700">Project file</span>
          </div>
          <div className="space-y-0.5">
            {FILE_TREE.map((node) => <TreeItem key={node.id} node={node} />)}
          </div>
        </div>

        <div className="mx-4 border-t border-slate-100 my-2" />

        {/* Knowledge base */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={16} className="text-slate-500" />
            <span className="text-[13px] font-semibold text-slate-700">Knowledge base</span>
          </div>
          <div className="space-y-0.5">
            {KNOWLEDGE_TREE.map((node) => <TreeItem key={node.id} node={node} />)}
          </div>
        </div>
      </div>

      {/* ── Center: editor ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Tab bar */}
        <div className="h-10 bg-white border-b border-gray-100 flex items-center px-4 gap-1 flex-shrink-0">
          <div className="flex items-center gap-1.5 px-3 h-full border-b-2 border-[#7e22ce] text-[13px] font-medium text-[#7e22ce]">
            <span>{projectName}</span>
            <button className="text-slate-400 hover:text-slate-600 ml-1">
              <X size={12} />
            </button>
          </div>
        </div>

        {/* Editor body — scrollable, leaves room for input bar */}
        <div className="flex-1 overflow-auto px-10 pt-10 pb-4">
          <div className="max-w-2xl mx-auto">
            <div
              className="w-full min-h-[60px] text-slate-300 text-[15px] outline-none"
              contentEditable
              suppressContentEditableWarning
              data-placeholder="Start writing..."
            >
            </div>
          </div>
        </div>

        {/* ── Embedded AI input bar (pinned bottom) ── */}
        <div className="flex-shrink-0 px-10 pb-8 pt-2">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_4px_24px_rgba(0,0,0,0.08)] px-5 py-4">
              {/* Text input */}
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="What do you want to write today?"
                className="w-full bg-transparent border-none outline-none text-[14px] text-slate-700 placeholder:text-slate-400 mb-4"
              />
              {/* Bottom row: selectors + send button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Writer selector */}
                  <button className="flex items-center gap-1.5 text-[13px] text-slate-600 hover:text-slate-800 transition-colors">
                    <Pencil size={13} className="text-slate-500" />
                    <span className="font-medium">Writer</span>
                    <ChevronDown size={12} className="text-slate-400" />
                  </button>
                  {/* Model selector */}
                  <button className="flex items-center gap-1.5 text-[13px] text-slate-600 hover:text-slate-800 transition-colors">
                    <span className="font-medium">claude-4.6</span>
                    <ChevronDown size={12} className="text-slate-400" />
                  </button>
                </div>
                {/* Send button */}
                <button
                  className="w-9 h-9 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center transition-colors"
                  onClick={() => setChatInput('')}
                >
                  <ArrowUp size={16} className="text-slate-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: Viewer panel ── */}
      <div className="w-[340px] h-full bg-white border-l border-gray-100 flex flex-col flex-shrink-0">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-slate-800">Viewer</h2>
        </div>
        {/* Empty viewer */}
        <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-3">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} />
          </svg>
          <span className="text-sm">No preview available</span>
        </div>
      </div>
    </div>
  );
}
