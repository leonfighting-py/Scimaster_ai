import React, { useState, useRef, useEffect } from 'react';
import { Globe, PlusCircle, Home, Folder, Map, Gift, Settings, ChevronDown, ChevronUp, Paperclip, ArrowUp, Search, MoreHorizontal, Clock, BookOpen, FileText, Upload, Download, Plus, RotateCcw, Minus, X, Maximize2, ArrowDown, BarChart2, ArrowRight, Sparkles, Calendar, Star, Share2, CheckSquare, FolderPlus, Briefcase, GraduationCap, Layers, Check, Loader2 } from 'lucide-react';
import IdeaBrainstormingWorkspace from './IdeaBrainstormingWorkspace';
import IdeaMapPage from './IdeaMapPage';
import LandingPage from './LandingPage';
import ProjectWorkspaceView from './ProjectWorkspaceView';
import OutlineWorkspace, { type OutlineNode } from './OutlineWorkspace';
import { saveIdea } from './utils/ideaStore';
import { loadProjects, formatProjectTime, type ProjectEntry } from './utils/projectStore';

const Logo = () => (
  <div className="flex items-center">
    <img src="/scimaster_logo.svg" alt="SciMaster" className="h-6" />
  </div>
);

const LogoSmall = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" fill="#1F2937"/>
    <circle cx="12" cy="12" r="4" fill="url(#paint0_linear_small)"/>
    <defs>
      <linearGradient id="paint0_linear_small" x1="8" y1="8" x2="16" y2="16" gradientUnits="userSpaceOnUse">
        <stop stopColor="#34D399" />
        <stop offset="1" stopColor="#FBBF24" />
      </linearGradient>
    </defs>
  </svg>
);

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState<'home' | 'all_projects' | 'project_workspace' | 'idea_map' | 'idea_project'>('home');
  const [openedIdeaProject, setOpenedIdeaProject] = useState<ProjectEntry | null>(null);
  const [selectedAction, setSelectedAction] = useState<'idea_brainstorming' | 'deep_survey' | null>(null);
  const [surveyPrompt, setSurveyPrompt] = useState('');
  const [isOutputSettingsOpen, setIsOutputSettingsOpen] = useState(false);
  const [isReportSettingsModalOpen, setIsReportSettingsModalOpen] = useState(false);
  const [reportType, setReportType] = useState('');
  const [reportLength, setReportLength] = useState('');
  const [isWriterDropdownOpen, setIsWriterDropdownOpen] = useState(false);
  const [isSearchScopeDropdownOpen, setIsSearchScopeDropdownOpen] = useState(false);
  const [searchScope, setSearchScope] = useState<'web' | 'paper'>('web');

  // Research in-progress state
  const [isResearchInProgress, setIsResearchInProgress] = useState(false);
  const [researchPrompt, setResearchPrompt] = useState('');

  // Outline workspace state (shared across sessions)
  const [outlineWriterEnabled, setOutlineWriterEnabled] = useState(false);
  const [outlineNodeMap, setOutlineNodeMap] = useState<Record<string, OutlineNode> | undefined>();
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({
    'thinking': true,
    'writing': true,
    'polishing': false,
  });
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({
    'overview': true,
    'math': false,
    'physics': false,
    'computing': false,
    'communication': false,
    'resources': false,
    'projects': false,
    'career': false,
  });

  type PhaseStatus = 'completed' | 'in_progress' | 'pending';
  type StepStatus = 'completed' | 'in_progress' | 'pending';

  const researchPhases: {
    id: string;
    title: string;
    status: PhaseStatus;
    streamContent?: string;
    sections?: { id: string; title: string; status: StepStatus; content?: string }[];
  }[] = [
    {
      id: 'thinking',
      title: 'Thinking',
      status: 'completed',
      streamContent: 'Analyzing the topic "Basics of quantum technology"...\n\nIdentified 8 key areas to cover: core concepts, mathematical foundations, quantum physics, computing roadmap, communication technology, learning resources, practical projects, and career development.\n\nPlanning report structure with comprehensive coverage across theoretical foundations and practical applications. Cross-referencing 47 academic sources and 12 industry reports...\n\nOutline finalized. Proceeding to parallel writing phase.',
    },
    {
      id: 'writing',
      title: 'Writing',
      status: 'in_progress',
      sections: [
        {
          id: 'overview',
          title: 'Overview & Core Concept Framework',
          status: 'in_progress',
          content: 'Quantum technology encompasses quantum computing, quantum communication, and quantum sensing. Core concepts include superposition, entanglement, quantum gates, qubits, and decoherence. This section establishes the foundational mental model for understanding how quantum mechanics principles translate into practical technological applications.',
        },
        {
          id: 'math',
          title: 'Mathematical Foundations & Prerequisites',
          status: 'in_progress',
          content: 'Key mathematical prerequisites include linear algebra (vector spaces, eigenvalues, tensor products), probability theory, complex analysis, and group theory. Familiarity with Dirac notation, density matrices, and Hilbert spaces is essential for formalizing quantum states and operations.',
        },
        {
          id: 'physics',
          title: 'Quantum Physics Fundamentals',
          status: 'in_progress',
          content: 'Covers wave-particle duality, Schrödinger equation, measurement postulates, uncertainty principle, spin systems, and multi-particle quantum mechanics. Emphasis on building physical intuition through thought experiments (double-slit, Stern-Gerlach) before moving into formalism.',
        },
        {
          id: 'computing',
          title: 'Quantum Computing Roadmap',
          status: 'in_progress',
          content: 'Circuit model: single-qubit & multi-qubit gates, universality, quantum parallelism. Key algorithms: Deutsch-Jozsa, Grover search, Shor factoring, VQE, QAOA. Error correction: stabilizer codes, surface codes, fault-tolerant thresholds. Hardware landscape: superconducting (IBM, Google), trapped-ion (IonQ, Quantinuum), photonic (Xanadu), neutral-atom (QuEra)...',
        },
        {
          id: 'communication',
          title: 'Quantum Communication Technology',
          status: 'in_progress',
          content: 'Quantum Key Distribution (QKD): BB84, E91, and decoy-state protocols. Quantum teleportation and entanglement swapping for long-distance communication. Quantum repeaters and quantum memory for extending network range. Satellite-based quantum communication (Micius). Post-quantum cryptography vs quantum-native security...',
        },
        {
          id: 'resources',
          title: 'Learning Resources & Platform Strategy',
          status: 'in_progress',
          content: 'Online courses: MIT OCW Quantum Physics, IBM Qiskit Textbook, Coursera/edX quantum specializations. Textbooks: Nielsen & Chuang, Preskill lecture notes, Wilde\'s Quantum Information Theory. Platforms: IBM Quantum Experience, Amazon Braket, Google Cirq, Xanadu PennyLane. Communities: Qiskit community, Quantum Open Source Foundation...',
        },
        {
          id: 'projects',
          title: 'Practical Projects & Skill Development',
          status: 'in_progress',
          content: 'Beginner: implement basic quantum circuits (Bell states, teleportation) on Qiskit. Intermediate: build a variational quantum eigensolver (VQE) for molecular simulation. Advanced: implement quantum error correction codes, contribute to open-source quantum libraries...',
        },
        {
          id: 'career',
          title: 'Career Development & Continuous Learning',
          status: 'in_progress',
          content: 'Career paths: quantum software engineer, quantum algorithm researcher, quantum hardware engineer, quantum application scientist. Industry demand growing in finance, pharma, logistics, cybersecurity. Key conferences: QIP, APS March Meeting, IEEE Quantum Week...',
        },
      ],
    },
    {
      id: 'polishing',
      title: 'Polishing',
      status: 'pending',
    },
  ];

  const togglePhase = (phaseId: string) => {
    setExpandedPhases(prev => ({ ...prev, [phaseId]: !prev[phaseId] }));
  };

  const toggleStep = (stepId: string) => {
    setExpandedSteps(prev => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  // Tabs state
  const [openTabs, setOpenTabs] = useState<{ id: string, title: string, type: 'welcome' | 'pdf' | 'search' }[]>([
    { id: 'welcome', title: 'Welcome_...', type: 'welcome' }
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('welcome');
  const [expandedPaperId, setExpandedPaperId] = useState<string | null>(null);

  // Resizer state
  const [workspaceHeight, setWorkspaceHeight] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const outputSettingsRef = useRef<HTMLDivElement>(null);

  const reportTypeOptions = [
    {
      value: 'Academic Survey',
      label: 'Academic Survey',
      description: 'Literature-based overview of academic papers, methods, and research trends.'
    },
    {
      value: 'Deep Research',
      label: 'Deep Research',
      description: 'Insights from web and industry sources, including markets, companies, and emerging signals.'
    }
  ];

  const reportLengthOptions = [
    {
      value: 'Short version',
      label: 'Short version',
      detail: '3-5 minutes',
      description: 'Rapid structured overview, lighter than deep research'
    },
    {
      value: 'Standard version',
      label: 'Standard version',
      detail: '1-2 hours',
      description: 'Evidence-traced survey draft with balanced depth'
    }
  ];

  const selectedReportType = reportTypeOptions.find((option) => option.value === reportType);
  const selectedReportLength = reportLengthOptions.find((option) => option.value === reportLength);
  const isAcademicSurvey = reportType === 'Academic Survey';
  const isIndustryReport = reportType === 'Deep Research';
  const canAttemptSurvey = surveyPrompt.trim() !== '';
  const isReportSettingsComplete = reportType !== '' && (isIndustryReport || reportLength !== '');
  const canSubmitSurvey = isReportSettingsComplete && surveyPrompt.trim() !== '';
  const surveySubmitHint = surveyPrompt.trim() === ''
    ? 'Describe your topic to generate the report'
    : !isReportSettingsComplete
      ? 'Choose report settings to continue'
      : 'Generate report';
  const surveyPlaceholder = !reportType
    ? 'Describe your topic, goals, or key questions here, then choose the output type...'
    : reportType === 'Academic Survey'
      ? 'Describe the research topic, key questions, representative papers, methods, or frontier directions you want reviewed. This mode uses academic papers and scholarly sources...'
      : 'Describe the industry topic, target market, leading players, use cases, investment signals, or business risks you want analyzed. This mode uses web and industry sources...';
  const ideaQuery = researchPrompt.trim();
  const showIdeaBrainstormingConversation = selectedAction === 'idea_brainstorming' && ideaQuery !== '';

  const handleSurveySubmit = () => {
    if (!canAttemptSurvey) return;
    if (selectedAction === 'deep_survey') {
      if (!isReportSettingsComplete) {
        setIsOutputSettingsOpen(false);
        setIsReportSettingsModalOpen(true);
        return;
      }
      setResearchPrompt(surveyPrompt);
      setIsResearchInProgress(true);
      setCurrentPage('project_workspace');
    } else {
      // Save idea to store when entering brainstorming
      if (surveyPrompt.trim()) saveIdea(surveyPrompt.trim());
      setResearchPrompt(surveyPrompt);
      setCurrentPage('project_workspace');
    }
  };

  const handleCloseReportSettingsModal = () => {
    setIsReportSettingsModalOpen(false);
  };

  const handleConfirmReportSettings = () => {
    if (!isReportSettingsComplete) return;
    setIsReportSettingsModalOpen(false);
    setResearchPrompt(surveyPrompt);
    setIsResearchInProgress(true);
    setCurrentPage('project_workspace');
  };

  const handleReportTypeSelect = (value: string) => {
    setReportType(value);
    if (value === 'Deep Research') {
      setReportLength('');
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !sidebarRef.current) return;
      const rect = sidebarRef.current.getBoundingClientRect();
      const newHeight = ((e.clientY - rect.top) / rect.height) * 100;
      setWorkspaceHeight(Math.min(Math.max(newHeight, 20), 80));
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!isOutputSettingsOpen || !outputSettingsRef.current) return;
      if (!outputSettingsRef.current.contains(e.target as Node)) {
        setIsOutputSettingsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOutputSettingsOpen]);

  const [projects, setProjects] = useState<ProjectEntry[]>(() => loadProjects());

  // Reload projects whenever All Projects page is navigated to
  useEffect(() => {
    if (currentPage === 'all_projects' || currentPage === 'home') {
      setProjects(loadProjects());
    }
  }, [currentPage]);

  if (!isLoggedIn) {
    return <LandingPage onLogin={() => setIsLoggedIn(true)} />;
  }

  if (currentPage === 'idea_map') {
    return <IdeaMapPage onBack={() => setCurrentPage('home')} />;
  }

  if (currentPage === 'idea_project' && openedIdeaProject) {
    return (
      <IdeaBrainstormingWorkspace
        query={openedIdeaProject.title}
        initialProject={{ nodeId: 'root', name: openedIdeaProject.title }}
        onBack={() => { setCurrentPage('all_projects'); setOpenedIdeaProject(null); }}
        onIdeaMap={() => setCurrentPage('idea_map')}
      />
    );
  }

  if (
    currentPage === 'project_workspace' &&
    selectedAction === 'idea_brainstorming'
  ) {
    return (
      <IdeaBrainstormingWorkspace
        query={researchPrompt || 'New Brainstorming Session'}
        onBack={() => { setCurrentPage('home'); setSelectedAction(null); }}
        onIdeaMap={() => setCurrentPage('idea_map')}
      />
    );
  }

  if (currentPage === 'project_workspace' && selectedAction === 'deep_survey') {
    return (
      <ProjectWorkspaceView
        projectName="New Writing Project"
        onBack={() => setCurrentPage('home')}
        onHome={() => { setCurrentPage('home'); setSelectedAction(null); }}
      />
    );
  }

  if (currentPage === 'project_workspace') {
    return (
      <div 
        className="h-screen w-full flex font-sans text-[#1f2937] overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: 'url(/BACKGROUND.png)' }}
      >
        {/* Leftmost Narrow Sidebar */}
        <div className="w-[50px] h-full bg-[#fcfcfd] border-r border-gray-100 flex flex-col items-center py-4 z-20">
          <button onClick={() => setCurrentPage('home')} className="mb-6 hover:opacity-80 transition-opacity">
            <LogoSmall />
          </button>
          
          <div className="flex flex-col gap-4 w-full items-center">
            <button className="w-8 h-8 rounded-lg bg-[#f3e8ff] text-[#7e22ce] flex items-center justify-center">
              <Folder size={18} />
            </button>
            <button className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 flex items-center justify-center transition-colors">
              <Clock size={18} />
            </button>
            <button className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 flex items-center justify-center transition-colors">
              <BookOpen size={18} />
            </button>
          </div>

          <div className="flex-1"></div>

          <div className="flex flex-col gap-4 w-full items-center">
            <button className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 flex items-center justify-center transition-colors">
              <div className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center text-[10px] font-bold">!</div>
            </button>
            <button className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 flex items-center justify-center transition-colors">
              <Settings size={18} />
            </button>
            <button className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-medium">
              L
            </button>
          </div>
        </div>

        {/* Secondary Sidebar (Workspace/Knowledge) */}
        <div className="w-[240px] h-full bg-[#fcfcfd] border-r border-gray-100 flex flex-col z-10">
          <div className="h-12 border-b border-gray-100 flex items-center justify-between px-4">
            <span className="font-semibold text-sm">1</span>
            <button className="text-gray-400 hover:text-gray-600">
              <MoreHorizontal size={16} />
            </button>
          </div>

          <div className="flex-1 flex flex-col min-h-0" ref={sidebarRef}>
            {/* Workspace Section */}
            <div 
              className="p-4 flex flex-col min-h-0"
              style={{ height: `${workspaceHeight}%` }}
            >
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <FileText size={16} className="text-gray-500" />
                  Workspace
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <button className="hover:text-gray-600"><Plus size={14} /></button>
                  <button className="hover:text-gray-600"><FileText size={14} /></button>
                  <button className="hover:text-gray-600"><Upload size={14} /></button>
                  <button className="hover:text-gray-600"><Download size={14} /></button>
                </div>
              </div>
            </div>

            {/* Resizer */}
            <div 
              className="h-1 w-full cursor-row-resize group relative flex-shrink-0 z-20"
              onMouseDown={(e) => { e.preventDefault(); setIsDragging(true); }}
            >
              <div className={`absolute inset-x-0 top-0 h-px bg-gray-200 transition-colors ${isDragging ? 'bg-purple-500' : 'group-hover:bg-purple-400'}`}></div>
              <div className="absolute inset-x-0 -top-1.5 -bottom-1.5 z-10"></div>
            </div>

            {/* Knowledge Section */}
            <div className="flex-1 p-4 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <BookOpen size={16} className="text-gray-500" />
                  Knowledge
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <button className="hover:text-gray-600" title="New Folder"><Plus size={14} /></button>
                  <button className="hover:text-gray-600" title="New File"><FileText size={14} /></button>
                  <button className="hover:text-gray-600" title="Upload File"><Upload size={14} /></button>
                  <button className="hover:text-gray-600" title="Download Zip"><Download size={14} /></button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="mb-4">
                <div className="bg-white rounded-xl border border-gray-200 p-1 shadow-sm flex items-center gap-1.5 relative">
                  <div className="relative flex-shrink-0">
                    <button 
                      onClick={() => setIsSearchScopeDropdownOpen(!isSearchScopeDropdownOpen)}
                      className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-gray-100 text-[12px] font-medium text-gray-700 transition-colors"
                    >
                      {searchScope === 'web' ? <Globe size={14} /> : <BookOpen size={14} />}
                      <span className="truncate max-w-[80px]">
                        {searchScope === 'web' ? 'Web' : 'Paper'}
                      </span>
                      <ChevronDown size={14} className="text-gray-500" />
                    </button>
                    
                    {isSearchScopeDropdownOpen && (
                      <div className="absolute top-full left-0 mt-2 w-[200px] bg-white rounded-xl shadow-[0_4px_24px_rgb(0,0,0,0.12)] border border-gray-100 p-1.5 z-50 flex flex-col gap-1">
                        <div 
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${searchScope === 'web' ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}
                          onClick={() => {
                            setSearchScope('web');
                            setIsSearchScopeDropdownOpen(false);
                          }}
                        >
                          <div className="flex items-start gap-2">
                            <Globe size={16} className={`mt-0.5 flex-shrink-0 ${searchScope === 'web' ? 'text-blue-600' : 'text-gray-500'}`} />
                            <div className="flex flex-col">
                              <span className={`text-[14px] font-medium leading-tight mb-0.5 ${searchScope === 'web' ? 'text-blue-700' : 'text-gray-900'}`}>Web</span>
                              <span className="text-[11px] text-gray-500 leading-tight">Best sources from web</span>
                            </div>
                          </div>
                          {searchScope === 'web' && <Check size={16} className="text-blue-600" />}
                        </div>
                        
                        <div 
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${searchScope === 'paper' ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}
                          onClick={() => {
                            setSearchScope('paper');
                            setIsSearchScopeDropdownOpen(false);
                          }}
                        >
                          <div className="flex items-start gap-2">
                            <div className="w-[16px] h-[16px] mt-0.5 flex-shrink-0">
                              <BookOpen size={16} className={searchScope === 'paper' ? 'text-blue-600' : 'text-gray-500'} />
                            </div>
                            <div className="flex flex-col">
                              <span className={`text-[14px] font-medium leading-tight mb-0.5 ${searchScope === 'paper' ? 'text-blue-700' : 'text-gray-900'}`}>Paper</span>
                              <span className="text-[11px] text-gray-500 leading-tight">Academic articles</span>
                            </div>
                          </div>
                          {searchScope === 'paper' && <Check size={16} className="text-blue-600" />}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="w-px h-4 bg-gray-200 flex-shrink-0"></div>

                  <input 
                    type="text" 
                    placeholder="Search..." 
                    className="w-full bg-transparent border-none outline-none text-[13px] text-gray-800 placeholder:text-gray-500 min-w-0 px-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (!openTabs.find(t => t.id === 'agent_workflows')) {
                          setOpenTabs([...openTabs, { id: 'agent_workflows', title: 'Search: "Agent workflows"', type: 'search' }]);
                        }
                        setActiveTabId('agent_workflows');
                      }
                    }}
                  />
                  <button 
                    onClick={() => {
                      if (!openTabs.find(t => t.id === 'agent_workflows')) {
                        setOpenTabs([...openTabs, { id: 'agent_workflows', title: 'Search: "Agent workflows"', type: 'search' }]);
                      }
                      setActiveTabId('agent_workflows');
                    }}
                    className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors flex-shrink-0"
                  >
                    <ArrowRight size={14} className="text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Knowledge Files List */}
              <div className="flex-1 overflow-y-auto flex flex-col gap-1 -mx-2 px-2">
                {/* Uploaded File */}
                <div 
                  className="flex items-center gap-2 p-1.5 rounded-md hover:bg-gray-100 group cursor-pointer transition-colors"
                  onClick={() => {
                    if (!openTabs.find(t => t.id === 'agent_review')) {
                      setOpenTabs([...openTabs, { id: 'agent_review', title: '李飞飞的agent综述.pdf', type: 'pdf' }]);
                    }
                    setActiveTabId('agent_review');
                  }}
                >
                  <input type="checkbox" defaultChecked className="w-3.5 h-3.5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer" onClick={(e) => e.stopPropagation()} />
                  <FileText size={14} className="text-blue-500 flex-shrink-0" />
                  <span className="text-xs text-gray-700 truncate flex-1" title="李飞飞的agent综述.pdf">李飞飞的agent综述.pdf</span>
                </div>
                
                {/* Search Results Folder/File */}
                <div 
                  className="flex items-center gap-2 p-1.5 rounded-md bg-purple-50/50 border border-purple-100/50 hover:bg-purple-50 group cursor-pointer mt-1 transition-colors"
                  onClick={() => {
                    if (!openTabs.find(t => t.id === 'agent_workflows')) {
                      setOpenTabs([...openTabs, { id: 'agent_workflows', title: 'Search: "Agent workflows"', type: 'search' }]);
                    }
                    setActiveTabId('agent_workflows');
                  }}
                >
                  <input type="checkbox" defaultChecked className="w-3.5 h-3.5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer" onClick={(e) => e.stopPropagation()} />
                  <Globe size={14} className="text-purple-500 flex-shrink-0" />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-xs text-gray-800 font-medium truncate" title="Search: Agent workflows">Search: "Agent workflows"</span>
                    <span className="text-[10px] text-gray-500">5 sources selected</span>
                  </div>
                </div>

                {/* Another Uploaded File (Unchecked) */}
                <div 
                  className="flex items-center gap-2 p-1.5 rounded-md hover:bg-gray-100 group cursor-pointer transition-colors mt-1"
                  onClick={() => {
                    if (!openTabs.find(t => t.id === 'experiment_data')) {
                      setOpenTabs([...openTabs, { id: 'experiment_data', title: 'experiment_data_v2.csv', type: 'pdf' }]);
                    }
                    setActiveTabId('experiment_data');
                  }}
                >
                  <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer" onClick={(e) => e.stopPropagation()} />
                  <FileText size={14} className="text-blue-500 flex-shrink-0" />
                  <span className="text-xs text-gray-500 truncate flex-1" title="experiment_data_v2.csv">experiment_data_v2.csv</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 h-full flex p-4 gap-4 relative">
          {/* Left Panel */}
          <div className="flex-1 flex flex-col gap-4 z-10">

            {isResearchInProgress ? (
              /* Research In-Progress: SciMaster takes full left panel */
              <div className="flex-1 rounded-2xl bg-white/80 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="h-12 border-b border-gray-100 flex items-center justify-between px-4 flex-shrink-0">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-[#d8b4fe]"></div>
                      <div className="w-2 h-2 rounded-full bg-[#c084fc]"></div>
                    </div>
                    SciMaster
                  </div>
                  <div className="flex items-center gap-3 text-gray-400">
                    <button className="hover:text-gray-600"><Plus size={16} /></button>
                    <button className="hover:text-gray-600"><RotateCcw size={16} /></button>
                    <button className="hover:text-gray-600"><Minus size={16} /></button>
                  </div>
                </div>

                {/* Scrollable research content */}
                <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5">
                  {/* User message 1 */}
                  <div className="flex justify-end">
                    <div className="max-w-[75%] bg-[#f9fafb] border border-gray-200 rounded-2xl rounded-tr-md px-4 py-3 text-[14px] text-gray-800 leading-relaxed">
                      Basics of quantum technology
                    </div>
                  </div>

                  {/* AI follow-up question */}
                  <div className="flex items-start gap-3">
                    <img src="/sci图标.svg" alt="SciMaster" className="w-7 h-7 rounded-md flex-shrink-0 mt-0.5" />
                    <div className="max-w-[80%] text-[14px] text-gray-800 leading-relaxed">
                      <p>Which aspect of quantum technology would you like to explore — for example, quantum computing, quantum communication, or the fundamental principles of quantum physics?</p>
                    </div>
                  </div>

                  {/* User message 2 */}
                  <div className="flex justify-end">
                    <div className="max-w-[75%] bg-[#f9fafb] border border-gray-200 rounded-2xl rounded-tr-md px-4 py-3 text-[14px] text-gray-800 leading-relaxed">
                      All of them
                    </div>
                  </div>

                  {/* Research Phases: Thinking → Writing → Polishing */}
                  <div className="space-y-6">
                    {researchPhases.map((phase, phaseIndex) => {
                      const isPhaseExpanded = expandedPhases[phase.id];
                      const phaseIcon = phase.status === 'completed'
                        ? <Check size={14} className="text-white" strokeWidth={3} />
                        : phase.status === 'in_progress'
                          ? <Loader2 size={14} className="text-white animate-spin" />
                          : <span className="text-[10px] text-white font-bold">{phaseIndex + 1}</span>;
                      const phaseBg = phase.status === 'completed'
                        ? 'bg-[#a78bfa]'
                        : phase.status === 'in_progress'
                          ? 'bg-[#f59e0b]'
                          : 'bg-gray-300';
                      const phaseTextColor = phase.status === 'pending' ? 'text-gray-400' : 'text-[#1e1b4b]';

                      return (
                        <div key={phase.id}>
                          {/* Phase header */}
                          <button
                            onClick={() => togglePhase(phase.id)}
                            className="flex items-center gap-3 w-full text-left group mb-3"
                          >
                            <div className={`w-6 h-6 rounded-full ${phaseBg} flex items-center justify-center flex-shrink-0`}>
                              {phaseIcon}
                            </div>
                            <span className={`text-[16px] font-bold ${phaseTextColor} tracking-wide`}>
                              {phase.title}
                            </span>
                            {phase.status === 'in_progress' && (
                              <span className="text-[11px] text-[#f59e0b] font-medium bg-[#fef3c7] px-2 py-0.5 rounded-full">In progress</span>
                            )}
                            {phase.status === 'completed' && (
                              <span className="text-[11px] text-[#7c3aed] font-medium bg-[#f3e8ff] px-2 py-0.5 rounded-full">Done</span>
                            )}
                            <span className="ml-auto text-gray-400 group-hover:text-gray-600 transition-colors">
                              {isPhaseExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </span>
                          </button>

                          {/* Phase content */}
                          {isPhaseExpanded && phase.status !== 'pending' && (
                            <div className="ml-3 border-l-2 border-gray-100 pl-6">
                              {/* Thinking / Polishing: stream content */}
                              {phase.streamContent && (
                                <div className="bg-[#faf7ff] rounded-xl border border-[#e9d5ff] p-4 mb-3">
                                  <p className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-wrap">
                                    {phase.streamContent}
                                  </p>
                                  {phase.status === 'in_progress' && (
                                    <span className="inline-block w-[6px] h-[16px] bg-[#7c3aed] animate-pulse ml-0.5 align-middle rounded-sm" />
                                  )}
                                </div>
                              )}

                              {/* Writing: parallel sections */}
                              {phase.sections && (
                                <div className="space-y-3">
                                  {phase.sections.map((step) => {
                                    const isExpanded = expandedSteps[step.id];
                                    const borderColor = step.status === 'completed'
                                      ? 'border-l-[#a78bfa]'
                                      : step.status === 'in_progress'
                                        ? 'border-l-[#f59e0b]'
                                        : 'border-l-gray-200';

                                    return (
                                      <div key={step.id} className={`border-l-[3px] ${borderColor} pl-4`}>
                                        <button
                                          onClick={() => toggleStep(step.id)}
                                          className="flex items-center gap-2 w-full text-left group"
                                        >
                                          <span className={`text-[14px] font-semibold ${
                                            step.status === 'pending' ? 'text-gray-400' : 'text-[#7c3aed]'
                                          }`}>
                                            {step.title}
                                          </span>
                                          {step.status === 'in_progress' && (
                                            <Loader2 size={13} className="text-[#f59e0b] animate-spin" />
                                          )}
                                          <span className="ml-auto text-gray-400 group-hover:text-gray-600 transition-colors">
                                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                          </span>
                                        </button>

                                        {isExpanded && step.status !== 'pending' && (
                                          <div className="mt-2">
                                            <div className="bg-white rounded-xl border border-gray-100 p-4">
                                              {step.content ? (
                                                <p className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-wrap">
                                                  {step.content}
                                                </p>
                                              ) : (
                                                <div className="flex items-center gap-2 text-[13px] text-gray-400">
                                                  <Loader2 size={14} className="animate-spin text-[#f59e0b]" />
                                                  Generating...
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Pending phase placeholder */}
                          {phase.status === 'pending' && (
                            <div className="ml-3 border-l-2 border-dashed border-gray-200 pl-6 py-2">
                              <span className="text-[12px] text-gray-400 italic">Waiting for previous phase to complete...</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Loading dots */}
                  {researchPhases.some(p => p.status === 'in_progress') && (
                    <div className="flex items-center gap-1.5 pl-4 pt-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#c084fc] animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-[#a78bfa] animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-[#d8b4fe] animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  )}
                </div>

                {/* Bottom input (disabled during research) */}
                <div className="p-4 bg-white border-t border-gray-100 flex-shrink-0">
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 flex items-center gap-3 opacity-60">
                    <input
                      type="text"
                      placeholder="Generating report... please wait"
                      disabled
                      className="w-full bg-transparent border-none outline-none text-sm text-gray-400 placeholder:text-gray-400 cursor-not-allowed"
                    />
                    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <ArrowUp size={14} className="text-white" strokeWidth={3} />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Default: Editor + Chat */
              <>
                {/* Editor Area */}
                <div className="flex-1 rounded-2xl bg-white/60 border border-white/80 shadow-[0_4px_20px_rgb(0,0,0,0.03)] backdrop-blur-xl p-6 flex flex-col">
                  <div className="font-semibold text-sm mb-4">Editor</div>
                  <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                    Select a project file, or start chatting with SciMaster!
                  </div>
                </div>

                {/* Chat Area */}
                <div className="h-[320px] rounded-2xl bg-white/80 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-xl flex flex-col overflow-hidden">
                  <div className="h-12 border-b border-gray-100 flex items-center justify-between px-4">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-[#d8b4fe]"></div>
                        <div className="w-2 h-2 rounded-full bg-[#c084fc]"></div>
                      </div>
                      SciMaster
                    </div>
                    <div className="flex items-center gap-3 text-gray-400">
                      <button className="hover:text-gray-600"><Plus size={16} /></button>
                      <button className="hover:text-gray-600"><RotateCcw size={16} /></button>
                      <button className="hover:text-gray-600"><Minus size={16} /></button>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6">
                    {showIdeaBrainstormingConversation ? (
                      <div className="space-y-5">
                        <div className="flex justify-end">
                          <div className="max-w-[75%] bg-[#f9fafb] border border-gray-200 rounded-2xl rounded-tr-md px-4 py-3 text-[14px] text-gray-800 leading-relaxed">
                            {ideaQuery}
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <img src="/sci图标.svg" alt="SciMaster" className="w-7 h-7 rounded-md flex-shrink-0 mt-0.5" />
                          <div className="max-w-[80%] text-[14px] text-gray-800 leading-relaxed">
                            <p>
                              Great starting point. I can help you break this topic into research directions,
                              identify open questions, and turn it into a structured brainstorming map.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#f3e8ff] to-[#e0f2fe] flex items-center justify-center mb-4 shadow-inner">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 19L19 12L22 15L15 22L12 19Z" fill="white"/>
                            <path d="M2 22L5 19L2 16L2 22Z" fill="white"/>
                            <path d="M19 12L12 5L9 8L16 15L19 12Z" fill="white"/>
                          </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Hi, I am Writer</h2>
                        <p className="text-sm text-gray-400">Your dedicated partner for smarter, faster writing</p>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-white">
                    <div className="rounded-xl border border-gray-200 bg-white p-3 flex flex-col gap-3">
                      <input 
                        type="text" 
                        placeholder="What do you want to write today?" 
                        className="w-full bg-transparent border-none outline-none text-sm text-gray-800 placeholder:text-gray-400"
                      />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs font-medium text-gray-600">
                          <div className="relative">
                            <button 
                              onClick={() => setIsWriterDropdownOpen(!isWriterDropdownOpen)}
                              className="flex items-center gap-1 hover:text-gray-900"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                              Writer <ChevronDown size={12} />
                            </button>

                            {isWriterDropdownOpen && (
                              <div className="absolute bottom-full left-0 mb-3 w-[320px] bg-white rounded-xl shadow-[0_4px_24px_rgb(0,0,0,0.12)] border border-gray-100 p-2 flex flex-col gap-1 z-50">
                                <button className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left">
                                  <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-600">
                                    <BookOpen size={16} />
                                  </div>
                                  <div>
                                    <div className="font-semibold text-gray-900 text-[15px] mb-0.5">Tutor</div>
                                    <div className="text-[13px] text-gray-500">From ideas to structured mindmap</div>
                                  </div>
                                </button>
                                
                                <button className="flex items-start gap-3 p-3 rounded-lg bg-gray-100 transition-colors text-left">
                                  <div className="w-8 h-8 rounded-md bg-gray-200 flex items-center justify-center flex-shrink-0 text-gray-700">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                                  </div>
                                  <div>
                                    <div className="font-semibold text-gray-900 text-[15px] mb-0.5">Writer</div>
                                    <div className="text-[13px] text-gray-500">Partner for smarter and faster writing</div>
                                  </div>
                                </button>
                                
                                <button className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left">
                                  <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-600">
                                    <BarChart2 size={16} />
                                  </div>
                                  <div>
                                    <div className="font-semibold text-gray-900 text-[15px] mb-0.5">Analyzer</div>
                                    <div className="text-[13px] text-gray-500">Data analysis, calculation, visualization</div>
                                  </div>
                                </button>
                              </div>
                            )}
                          </div>
                          <button className="flex items-center gap-1 hover:text-gray-900">
                            claude-4.6 <ChevronDown size={12} />
                          </button>
                        </div>
                        <button className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors">
                          <ArrowUp size={14} className="text-white" strokeWidth={3} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right Panel: Document View */}
          <div className="flex-1 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex flex-col overflow-hidden z-10 border border-gray-100">
            {/* Tabs */}
            <div className="flex items-center border-b border-gray-100 bg-gray-50/50 overflow-x-auto">
              {openTabs.map(tab => (
                <div 
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={`px-4 py-3 border-r border-gray-100 flex items-center gap-2 text-sm font-medium cursor-pointer transition-colors ${
                    activeTabId === tab.id 
                      ? 'bg-white border-t-2 border-t-purple-500 text-gray-900' 
                      : 'bg-transparent border-t-2 border-t-transparent text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <FileText size={14} className={tab.type === 'pdf' ? 'text-red-500' : 'text-blue-500'} />
                  <span className="truncate max-w-[150px]">{tab.title}</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      const newTabs = openTabs.filter(t => t.id !== tab.id);
                      setOpenTabs(newTabs);
                      if (activeTabId === tab.id && newTabs.length > 0) {
                        setActiveTabId(newTabs[newTabs.length - 1].id);
                      } else if (newTabs.length === 0) {
                        setActiveTabId('');
                      }
                    }}
                    className="text-gray-400 hover:text-gray-600 ml-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            
            {/* Toolbar */}
            {openTabs.find(t => t.id === activeTabId)?.type !== 'search' && (
              <div className="h-12 border-b border-gray-100 flex items-center px-4 gap-4 text-sm text-gray-600 bg-white flex-shrink-0">
                <button className="hover:text-gray-900"><Minus size={14} /></button>
                <button className="flex items-center gap-1 hover:text-gray-900 font-medium">
                  Fit Width <ChevronDown size={14} />
                </button>
                <button className="hover:text-gray-900"><Plus size={14} /></button>
                <div className="w-px h-4 bg-gray-200"></div>
                <button className="w-8 h-6 rounded bg-[#f3e8ff] text-[#7e22ce] flex items-center justify-center">
                  <Maximize2 size={14} />
                </button>
                <span className="font-medium">100%</span>
                <span className="text-gray-400">2 pages</span>
                <button className="hover:text-gray-900 ml-auto"><ArrowDown size={14} /></button>
              </div>
            )}

            {/* Document Content */}
            <div className={`flex-1 overflow-y-auto relative ${openTabs.find(t => t.id === activeTabId)?.type === 'search' ? 'bg-[#f9fafb]' : 'bg-[#f0f2f5] p-6'}`}>
              {activeTabId === 'welcome' && (
                <div className="bg-white shadow-md border border-gray-200 w-full max-w-[794px] min-h-[1123px] mx-auto p-12 md:p-16 font-sans text-gray-800">
                  <h1 className="text-3xl font-bold mb-6">欢迎使用 SciMaster</h1>
                  
                  <h2 className="text-lg font-bold mb-2">这是你的新一代科研助手。</h2>
                  <p className="text-sm text-gray-600 mb-8 pb-6 border-b border-gray-100">
                    这不仅仅是一个写作界面，更是一个整合了你所有研究材料的智能中枢。
                  </p>

                  <h2 className="text-lg font-bold mb-4">你现在看到的界面</h2>
                  
                  <h3 className="text-base font-bold mb-2">中央文件编辑区</h3>
                  <p className="text-sm text-gray-600 mb-2">这是你的主画布，采用基于源码的结构化编辑模式。</p>
                  <p className="text-sm text-gray-600 mb-6">
                    你正在编写标准的 LaTeX 源代码，通过命令与环境机制精确控制公式排版、文献引用、图表布局与整体文档结构，实现高度可控的学术级排版效果。
                  </p>

                  <h3 className="text-base font-bold mb-2">AI 对话区</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    这里集成了 SciMaster 的核心 AI 模块，如 Writer、Tutor 和 Analyzer，方便你随时调用。你可以随时切换三种模式，它们各司其职：
                  </p>
                  
                  <div className="space-y-3 mb-6">
                    <p className="text-sm text-gray-600">
                      <strong className="text-gray-900">Writer：</strong> 它是你的主笔。无论是从零起草、扩写段落，还是精准润色，它都能基于你提供的参考资料，产出学术性极强的文字。
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong className="text-gray-900">Tutor：</strong> 它是你的导师。当你面对空白文档毫无头绪时，开启 Tutor。它会通过多轮对话，以 <strong className="text-gray-900">思维导图 (Mindmap)</strong> 的形式帮你理清论文架构。
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong className="text-gray-900">Analyzer：</strong> 它是你的数据分析助手。上传实验数据，它能帮你进行复杂的计算、统计分析，并直接生成可视化的图表。
                    </p>
                  </div>

                  <div className="w-full h-px bg-gray-100 mb-6"></div>

                  <h3 className="text-base font-bold mb-2">左侧面板</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    这里是你的文件中心，分为上方的 <strong className="text-gray-900">项目文件</strong> 和下方的 <strong className="text-gray-900">知识库</strong>。
                  </p>
                  
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      <strong className="text-gray-900">项目文件：</strong> 存放你的初稿、Proposal 或实验记录。AI <strong className="text-gray-900">拥有修改权限</strong>，你可以指示它直接在这些文档上进行迭代。
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong className="text-gray-900">知识库：</strong> 建议放入参考文献（PDF、文档）。AI 会深度阅读它们作为写作背景，但 <strong className="text-gray-900">绝不会修改</strong> 这些文件，确保资料的完整性。
                    </p>
                  </div>
                </div>
              )}

              {activeTabId === 'agent_review' && (
                <div className="bg-white shadow-md border border-gray-200 w-full max-w-[794px] min-h-[1123px] mx-auto p-12 md:p-16 font-serif text-gray-800">
                  <h1 className="text-2xl font-bold text-center mb-6">A Survey on Large Language Model based Autonomous Agents</h1>
                  <div className="text-center text-sm mb-8 italic">
                    <p>Lei Wang, Chen Ma, Xueyang Feng, Zeyu Zhang, Hao Yang, Jingsen Zhang, Zhiyuan Chen, Jiakai Tang, Xu Chen, Yankai Lin, Wayne Xin Zhao, Zhewei Wei, Ji-Rong Wen</p>
                  </div>
                  
                  <h2 className="text-lg font-bold mb-3 uppercase">Abstract</h2>
                  <p className="text-sm text-justify mb-6 leading-relaxed">
                    Large language models (LLMs) have achieved remarkable success, demonstrating significant potential in human-like intelligence. However, they still face limitations in solving complex, real-world tasks. To bridge this gap, researchers have proposed LLM-based autonomous agents...
                  </p>
                  
                  <h2 className="text-lg font-bold mb-3 uppercase">1. Introduction</h2>
                  <p className="text-sm text-justify mb-4 leading-relaxed">
                    Autonomous agents have long been a prominent research focus in artificial intelligence. Previous research in this field often focuses on training agents with limited knowledge within isolated environments...
                  </p>
                  <p className="text-sm text-justify mb-4 leading-relaxed">
                    Recently, through training on vast amounts of web knowledge, LLMs have demonstrated potential in achieving human-level intelligence. This has sparked a surge in studies investigating LLM-based autonomous agents...
                  </p>
                  
                  <div className="w-full h-48 bg-gray-50 border border-gray-200 my-6 flex items-center justify-center text-gray-400 text-sm">
                    [Figure 1: The general architecture of LLM-based autonomous agents]
                  </div>
                  
                  <h2 className="text-lg font-bold mb-3 uppercase">2. Agent Architecture</h2>
                  <p className="text-sm text-justify mb-4 leading-relaxed">
                    The architecture of an LLM-based autonomous agent typically consists of a profiling module, a memory module, a planning module, and an action module...
                  </p>
                </div>
              )}

              {activeTabId === 'agent_workflows' && (
                <div className="w-full h-full flex flex-col font-sans text-gray-800">
                  {/* Header */}
                  <div className="flex items-center justify-between px-8 py-3 border-b border-gray-200 bg-white shadow-sm flex-shrink-0">
                    <div className="flex items-center gap-6">
                      <div className="text-[15px] font-bold text-gray-900">123 <span className="text-gray-500 font-normal text-[13px]">Results</span></div>
                      
                      <div className="flex items-center gap-2">
                        <button className="px-3 py-1 bg-blue-600 text-white text-[13px] rounded-md font-medium">Anytime</button>
                        <button className="px-3 py-1 text-gray-600 hover:bg-gray-100 text-[13px] rounded-md transition-colors">Since 2025</button>
                        <button className="px-3 py-1 text-gray-600 hover:bg-gray-100 text-[13px] rounded-md transition-colors">Since 2024</button>
                        <button className="px-3 py-1 text-gray-600 hover:bg-gray-100 text-[13px] rounded-md transition-colors">Custom Range</button>
                      </div>
                    </div>
                  </div>

                  {/* List */}
                  <div className="flex-1 overflow-y-auto p-8 space-y-4">
                    {/* Item 1 */}
                    <div className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4 hover:shadow-md transition-shadow group">
                      <div className="pt-1 flex-shrink-0">
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col">
                        <h3 className="text-[16px] font-semibold text-blue-700 hover:underline cursor-pointer mb-1.5 leading-snug">Multiscale modeling of inelastic materials with Thermodynamics-based Artificial Neural Networks (TANN)</h3>
                        <p className="text-[13px] text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                          This paper introduces a novel multiscale modeling framework that integrates thermodynamics-based artificial neural networks (TANN) to predict the inelastic behavior of complex materials, ensuring thermodynamic consistency across scales.
                        </p>
                        <div className="flex flex-wrap items-center justify-between gap-3 mt-auto">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-gray-50 text-gray-600 border border-gray-100 text-[11px] font-medium">
                              <FileText size={12} />
                              Computer Methods in Applied Mechanics and Engineering 398, 115190 (2022)
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-gray-50 text-gray-600 border border-gray-100 text-[11px] font-medium">
                              <Calendar size={12} />
                              2021-08-30
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-gray-50 text-gray-600 border border-gray-100 text-[11px] font-medium">
                              arXiv: 2108.13137
                            </div>
                          </div>
                          <button className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors flex-shrink-0">
                            <FolderPlus size={14} />
                            加入知识库
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Item 2 */}
                    <div className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4 hover:shadow-md transition-shadow group">
                      <div className="pt-1 flex-shrink-0">
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <h3 
                            className="text-[16px] font-semibold text-blue-700 hover:underline cursor-pointer mb-1.5 leading-snug"
                            onClick={() => setExpandedPaperId(expandedPaperId === 'paper2' ? null : 'paper2')}
                          >
                            Learning the solution operator of parametric partial differential equations with physics-informed DeepOnets
                          </h3>
                          <button onClick={() => setExpandedPaperId(expandedPaperId === 'paper2' ? null : 'paper2')} className="text-gray-400 hover:text-gray-600">
                            {expandedPaperId === 'paper2' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                          </button>
                        </div>
                        
                        {expandedPaperId !== 'paper2' && (
                          <p className="text-[13px] text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                            We propose a physics-informed DeepONet architecture to learn the solution operator of parametric partial differential equations (PDEs), demonstrating significant improvements in generalization and accuracy.
                          </p>
                        )}
                        
                        {expandedPaperId === 'paper2' && (
                          <div className="bg-gray-50 p-3 rounded-lg text-[13px] text-gray-700 mb-3 leading-relaxed">
                            <h4 className="font-semibold mb-1">摘要</h4>
                            Deep operator networks (DeepONets) are receiving increased attention thanks to their demonstrated capability to approximate nonlinear operators between infinite-dimensional Banach spaces. However, despite their remarkable early promise, they typically require large training data-sets consisting of paired input-output observations which may be expensive to obtain...
                          </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-3 mt-auto">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-gray-50 text-gray-600 border border-gray-100 text-[11px] font-medium">
                              <Calendar size={12} />
                              2021-03-19
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-gray-50 text-gray-600 border border-gray-100 text-[11px] font-medium">
                              arXiv: 2103.10974
                            </div>
                          </div>
                          <button className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors flex-shrink-0">
                            <FolderPlus size={14} />
                            加入知识库
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Item 3 */}
                    <div className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4 hover:shadow-md transition-shadow group">
                      <div className="pt-1 flex-shrink-0">
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col">
                        <h3 className="text-[16px] font-semibold text-blue-700 hover:underline cursor-pointer mb-1.5 leading-snug">Unsupervised discovery of interpretable hyperelastic constitutive laws</h3>
                        <p className="text-[13px] text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                          An unsupervised machine learning approach is presented for discovering interpretable hyperelastic constitutive laws directly from full-field displacement data, without requiring stress measurements.
                        </p>
                        <div className="flex flex-wrap items-center justify-between gap-3 mt-auto">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-gray-50 text-gray-600 border border-gray-100 text-[11px] font-medium">
                              <FileText size={12} />
                              Computer Methods in Applied Mechanics and Engineering
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-gray-50 text-gray-600 border border-gray-100 text-[11px] font-medium">
                              <Calendar size={12} />
                              2020-10-26
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-gray-50 text-gray-600 border border-gray-100 text-[11px] font-medium">
                              arXiv: 2010.13496
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-yellow-50 text-yellow-700 border border-yellow-100 text-[11px] font-medium">
                              <Star size={12} />
                              IF: 7.3
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 text-[11px] font-medium">
                              引用: 239
                            </div>
                          </div>
                          <button className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors flex-shrink-0">
                            <FolderPlus size={14} />
                            加入知识库
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Item 4 */}
                    <div className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4 hover:shadow-md transition-shadow group">
                      <div className="pt-1 flex-shrink-0">
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col">
                        <h3 className="text-[16px] font-semibold text-blue-700 hover:underline cursor-pointer mb-1.5 leading-snug">A physics-informed 3D surrogate model for elastic fields in polycrystals</h3>
                        <p className="text-[13px] text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                          This work develops a physics-informed 3D surrogate model capable of accurately predicting elastic fields in polycrystalline materials under various loading conditions.
                        </p>
                        <div className="flex flex-wrap items-center justify-between gap-3 mt-auto">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-gray-50 text-gray-600 border border-gray-100 text-[11px] font-medium">
                              <FileText size={12} />
                              Computer Methods in Applied Mechanics and Engineering
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-gray-50 text-gray-600 border border-gray-100 text-[11px] font-medium">
                              <Calendar size={12} />
                              2025-06-01
                            </div>
                          </div>
                          <button className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors flex-shrink-0">
                            <FolderPlus size={14} />
                            加入知识库
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTabId === 'experiment_data' && (
                <div className="bg-white shadow-md border border-gray-200 w-full max-w-[794px] min-h-[1123px] mx-auto p-12 md:p-16 font-mono text-gray-800 text-sm">
                  <h1 className="text-xl font-bold mb-6 font-sans">experiment_data_v2.csv</h1>
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b-2 border-gray-200 bg-gray-50">
                          <th className="p-3 font-semibold">id</th>
                          <th className="p-3 font-semibold">timestamp</th>
                          <th className="p-3 font-semibold">model</th>
                          <th className="p-3 font-semibold">accuracy</th>
                          <th className="p-3 font-semibold">latency_ms</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-100">
                          <td className="p-3">1</td>
                          <td className="p-3">2023-10-01 10:00</td>
                          <td className="p-3">gpt-4</td>
                          <td className="p-3">0.92</td>
                          <td className="p-3">1200</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="p-3">2</td>
                          <td className="p-3">2023-10-01 10:05</td>
                          <td className="p-3">claude-3</td>
                          <td className="p-3">0.94</td>
                          <td className="p-3">850</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="p-3">3</td>
                          <td className="p-3">2023-10-01 10:10</td>
                          <td className="p-3">gemini-pro</td>
                          <td className="p-3">0.91</td>
                          <td className="p-3">920</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTabId === '' && (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No document open
                </div>
              )}
              
              {/* Scrollbar Track Mockup */}
              <div className="absolute right-2 top-2 bottom-2 w-3 bg-gray-100 rounded-full flex flex-col items-center py-1">
                <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[4px] border-l-transparent border-r-transparent border-b-gray-400 mb-1"></div>
                <div className="w-2 h-32 bg-gray-400 rounded-full mt-1"></div>
                <div className="flex-1"></div>
                <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] border-l-transparent border-r-transparent border-t-gray-400 mt-1"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col font-sans text-[#1f2937]" style={{ background: 'linear-gradient(145deg, #f0eeff 0%, #e8f5f2 50%, #d6f0ee 100%)' }}>
      {/* Background blobs */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div style={{ position: 'absolute', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, #c4b5fd55 0%, transparent 70%)', top: -200, left: -200 }} />
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, #5eead455 0%, transparent 70%)', bottom: -100, right: -100 }} />
      </div>

      {/* Header */}
      <header className="h-20 w-full sticky top-0 z-20 px-10 flex items-center justify-between bg-white/60 backdrop-blur-md border-b border-white/60">
        <div className="flex items-center gap-2.5">
          <img src="/scimaster_icon.svg" alt="SciMaster" className="w-7 h-7" />
          <span className="text-[19px] font-bold text-slate-900 tracking-tight">SciMaster</span>
          <span className="ml-1 px-2 py-0.5 rounded-md bg-[#f3e8ff] text-[#7e22ce] text-[11px] font-semibold tracking-wide">Beta</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="h-8 px-3 rounded-full border border-slate-200 bg-white/70 text-slate-600 text-sm font-medium flex items-center gap-1.5 hover:bg-white transition-colors">
            <Globe size={14} className="text-slate-400" />
            English
            <ChevronDown size={12} className="text-slate-400" />
          </button>
          <button className="h-8 px-3 rounded-full border border-slate-200 bg-white/70 text-slate-600 text-sm font-medium flex items-center gap-1.5 hover:bg-white transition-colors">
            <PlusCircle size={14} className="text-[#9333ea]" />
            1000
          </button>
        </div>
      </header>

      <div className="flex flex-1 relative">
        {/* Sidebar */}
        <aside className="hidden md:flex w-[280px] h-[calc(100vh-80px)] sticky top-20 bg-white/60 backdrop-blur-md border-r border-white/70 pt-6 px-5 pb-6 flex-col z-10">
          <button
            onClick={() => setCurrentPage('project_workspace')}
            className="w-full h-12 rounded-2xl border border-[#c4b5fd] bg-white text-[#7c3aed] text-sm font-semibold flex items-center justify-center gap-2 hover:bg-purple-50 hover:border-[#a78bfa] transition-colors shadow-sm"
          >
            <Plus size={18} />
            New Project
          </button>

          <nav className="mt-5 flex flex-col gap-0.5">
            <button
              onClick={() => setCurrentPage('home')}
              className={`h-11 rounded-xl px-4 flex items-center gap-3 text-sm font-medium transition-colors ${currentPage === 'home' ? 'bg-[#f3e8ff] text-[#7c3aed]' : 'text-slate-600 hover:bg-slate-100/80'}`}
            >
              <Home size={17} />
              Home
            </button>
            <button
              onClick={() => setCurrentPage('all_projects')}
              className={`h-11 rounded-xl px-4 flex items-center gap-3 text-sm font-medium transition-colors ${currentPage === 'all_projects' ? 'bg-[#f3e8ff] text-[#7c3aed]' : 'text-slate-600 hover:bg-slate-100/80'}`}
            >
              <Folder size={17} />
              All Project
            </button>
          </nav>

          <div className="flex-1" />

          <button className="w-full h-11 rounded-2xl text-white text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-md mb-4"
            style={{ background: 'linear-gradient(90deg, #67e8f9 0%, #a78bfa 100%)' }}>
            Turn your feedback into rewards!
          </button>

          <div className="flex flex-col gap-0.5">
            <button className="h-11 rounded-xl px-4 flex items-center gap-3 text-sm text-slate-500 hover:bg-slate-100/80 transition-colors">
              <Settings size={17} />
              Settings
            </button>
            <button className="h-11 rounded-xl px-4 flex items-center gap-3 text-sm text-slate-500 hover:bg-slate-100/80 transition-colors">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/></svg>
              Helping
            </button>
          </div>

          <div className="mt-4 flex items-center gap-3 px-1">
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0" style={{ background: 'linear-gradient(135deg, #a78bfa, #67e8f9)' }}>
              <div className="w-full h-full flex items-center justify-center text-white text-sm font-semibold">L</div>
            </div>
            <span className="text-sm font-medium text-slate-700">User Name</span>
          </div>
        </aside>

        {/* Main Panel */}
        <main className={`flex-1 flex flex-col pb-12 relative z-10 ${currentPage === 'home' ? 'items-center pt-12 px-8' : 'items-stretch pt-10 px-8'}`}>
          {currentPage === 'home' ? (
            <>
              {/* Hero */}
              <div className="text-center flex flex-col items-center max-w-2xl w-full">
                <h1 style={{ fontFamily: "'Georgia', serif" }} className="text-[46px] font-bold leading-tight text-[#1a1060] mb-4">
                  From Ideation To Publication
                </h1>
                <p className="text-[16px] text-slate-500 leading-relaxed">
                  Choose the best path for your research. Whether you have data ready or need a creative spark, we're here to help.
                </p>
              </div>

              {/* Two Feature Cards */}
              <div className="mt-10 w-full max-w-[820px] grid grid-cols-2 gap-5">
                {/* Start Brainstorming */}
                <button
                  onClick={() => {
                    setSelectedAction('idea_brainstorming');
                    setResearchPrompt('');
                    setCurrentPage('project_workspace');
                  }}
                  className="group text-left rounded-3xl p-8 transition-all duration-200 bg-white/70 backdrop-blur-sm border border-white hover:bg-white hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)]"
                >
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-7"
                    style={{ background: 'linear-gradient(135deg, #ede9fe 0%, #dbeafe 100%)' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
                    </svg>
                  </div>
                  <h3 className="text-[20px] font-bold text-[#1e1b4b] mb-3">Start brainstorming</h3>
                  <p className="text-[14px] text-slate-500 leading-relaxed mb-8">
                    Start from scratch with AI guidance. Explore research ideas and develop hypotheses.
                  </p>
                  <div className="flex items-center gap-2 text-[12px] font-bold tracking-widest uppercase text-[#7c3aed] transition-all group-hover:gap-3">
                    EXPLORE IDEAS
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </div>
                </button>

                {/* Start Writing */}
                <button
                  onClick={() => {
                    setSelectedAction('deep_survey');
                    setCurrentPage('project_workspace');
                  }}
                  className="group text-left rounded-3xl p-8 transition-all duration-200 bg-white/70 backdrop-blur-sm border border-white hover:bg-white hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)]"
                >
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-7"
                    style={{ background: 'linear-gradient(135deg, #ede9fe 0%, #dbeafe 100%)' }}>
                    <svg width="26" height="28" viewBox="0 0 24 28" fill="none" stroke="#7c3aed" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="2" width="18" height="22" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/>
                    </svg>
                  </div>
                  <h3 className="text-[20px] font-bold text-[#1e1b4b] mb-3">Start writing</h3>
                  <p className="text-[14px] text-slate-500 leading-relaxed mb-8">
                    Enter a research topic or upload your materials to begin. We'll generate a structured draft for you.
                  </p>
                  <div className="flex items-center gap-2 text-[12px] font-bold tracking-widest uppercase text-[#7c3aed] transition-all group-hover:gap-3">
                    GET STARTED
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </div>
                </button>
              </div>

              {/* Recent Projects */}
              <div className="mt-8 w-full max-w-[820px] rounded-3xl bg-white/70 backdrop-blur-sm border border-white shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-7">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-[17px] font-bold text-slate-900">Recent projects</h2>
                  <div className="h-9 w-56 rounded-xl border border-slate-200 bg-white px-3 flex items-center gap-2">
                    <Search size={14} className="text-slate-400 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Search workspace..."
                      className="bg-transparent border-none outline-none text-[13px] text-slate-700 placeholder:text-slate-400 w-full"
                    />
                  </div>
                </div>
                <div className="flex flex-col divide-y divide-slate-100">
                  {projects.slice(0, 5).map((p) => (
                    <div
                      key={p.id}
                      className="py-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50/60 rounded-xl px-2 -mx-2 transition-colors group"
                      onClick={() => {
                        if (p.tag === 'idea') { setOpenedIdeaProject(p); setCurrentPage('idea_project'); }
                        else setCurrentPage('project_workspace');
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-6 h-6 rounded-md flex-shrink-0 flex items-center justify-center"
                          style={{ background: p.tag === 'idea' ? '#ede9fe' : '#dbeafe' }}>
                          {p.tag === 'idea'
                            ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>
                            : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 8h10M7 12h8"/></svg>
                          }
                        </div>
                        <span className="text-[14px] text-slate-700 truncate group-hover:text-slate-900 transition-colors">{p.title}</span>
                      </div>
                      <span className="text-[13px] text-slate-400 flex-shrink-0 ml-4">{formatProjectTime(p.createdAt)}</span>
                    </div>
                  ))}
                  {projects.length === 0 && (
                    <p className="py-6 text-center text-sm text-slate-400">No projects yet. Create one above!</p>
                  )}
                </div>
              </div>

            </>
          ) : (
            <div className="w-full max-w-[1200px] mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-[22px] font-bold text-[#1f2937]">Recent Projects</h1>
                <button className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 flex items-center gap-2 hover:bg-gray-50 transition-colors">
                  Date created (newest) <ChevronDown size={14} className="text-gray-400" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => {
                      if (project.tag === 'idea') {
                        setOpenedIdeaProject(project);
                        setCurrentPage('idea_project');
                      } else {
                        setCurrentPage('project_workspace');
                      }
                    }}
                    className="rounded-xl border border-gray-100 bg-white overflow-hidden shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all cursor-pointer"
                  >
                    <div className="h-[160px] bg-[#f4f5f7] flex flex-col items-center justify-center gap-2 text-gray-400 text-sm font-medium">
                      <span className="capitalize">{project.type}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        project.tag === 'idea'
                          ? 'bg-purple-100 text-purple-600'
                          : 'bg-blue-100 text-blue-600'
                      }`}>
                        {project.tag === 'idea' ? 'Idea' : 'Writing'}
                      </span>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-[15px] text-gray-900 truncate pr-2">{project.title}</h3>
                        <button className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                      <p className="text-[13px] text-gray-500">{formatProjectTime(project.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
