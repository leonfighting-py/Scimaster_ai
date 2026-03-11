import React, { useState, useRef, useEffect } from 'react';
import { Globe, PlusCircle, Home, Folder, Gift, Settings, ChevronDown, Paperclip, ArrowUp, Search, MoreHorizontal, Clock, BookOpen, FileText, Upload, Download, Plus, RotateCcw, Minus, X, Maximize2, ArrowDown, BarChart2, ArrowRight, Sparkles, Calendar, Star, Share2, CheckSquare, FolderPlus, Briefcase, GraduationCap, Dices, Layers, Check } from 'lucide-react';

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
  const [currentPage, setCurrentPage] = useState<'home' | 'all_projects' | 'project_workspace'>('home');
  const [selectedAction, setSelectedAction] = useState('Literature survey');
  const [surveyPrompt, setSurveyPrompt] = useState('');
  const [isOutputSettingsOpen, setIsOutputSettingsOpen] = useState(false);
  const [outputFormat, setOutputFormat] = useState('Auto');
  const [outputLength, setOutputLength] = useState('Auto');
  const [outputLanguage, setOutputLanguage] = useState('Auto');
  const [isWriterDropdownOpen, setIsWriterDropdownOpen] = useState(false);
  const [isSearchScopeDropdownOpen, setIsSearchScopeDropdownOpen] = useState(false);
  const [searchScope, setSearchScope] = useState<'web' | 'paper'>('web');

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

  const PROMPT_TEMPLATES: Record<string, { prompt: string, length: string, language: string }> = {
    'Academic Paper': {
      prompt: "Write a comprehensive academic literature review on [Topic]. Include recent advancements, key methodologies, and future research directions. Format with standard academic citations.",
      length: 'Detailed (10+ pages)',
      language: 'English'
    },
    'Industry Report': {
      prompt: "Draft a concise industry brief on [Topic]. Focus on market trends, practical applications, and business impact. Keep it accessible for non-technical stakeholders.",
      length: 'Standard (3-5 pages)',
      language: 'English'
    },
    'Executive Summary': {
      prompt: "Create a high-level executive summary for [Topic]. Highlight the core problem, proposed solution, key metrics, and strategic recommendations.",
      length: 'Brief (1-2 pages)',
      language: 'English'
    },
    'Blog Post': {
      prompt: "Write an engaging blog post about [Topic]. Use a conversational tone, clear headings, and compelling examples to draw the reader in.",
      length: 'Standard (3-5 pages)',
      language: 'English'
    },
    'Auto': {
      prompt: "Analyze the attached document to learn its writing style and structure. Then, write a new report on [Topic] following the exact same format and tone.",
      length: 'Auto',
      language: 'Auto'
    }
  };

  const handleSurpriseClick = () => {
    const formats = Object.keys(PROMPT_TEMPLATES);
    let randomFormat = formats[Math.floor(Math.random() * formats.length)];
    
    // Ensure we pick a different one if possible
    if (formats.length > 1 && PROMPT_TEMPLATES[randomFormat].prompt === surveyPrompt) {
      randomFormat = formats[(formats.indexOf(randomFormat) + 1) % formats.length];
    }
    
    const template = PROMPT_TEMPLATES[randomFormat];
    setSurveyPrompt(template.prompt);
    setOutputFormat(randomFormat);
    setOutputLength(template.length);
    setOutputLanguage(template.language);
  };

  const handleFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFormat = e.target.value;
    setOutputFormat(newFormat);

    // If the current prompt is empty or exactly matches one of our templates, auto-update it
    const isCurrentPromptATemplate = Object.values(PROMPT_TEMPLATES).some(t => t.prompt === surveyPrompt);
    if (isCurrentPromptATemplate || surveyPrompt.trim() === '') {
      if (PROMPT_TEMPLATES[newFormat]) {
        setSurveyPrompt(PROMPT_TEMPLATES[newFormat].prompt);
        setOutputLength(PROMPT_TEMPLATES[newFormat].length);
        setOutputLanguage(PROMPT_TEMPLATES[newFormat].language);
      }
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

  const projects = [
    { id: 1, type: 'latex', title: '1', time: '2 hours ago' },
    { id: 2, type: 'document', title: '我想去做agent相关的', time: '2 hours ago' },
    { id: 3, type: 'document', title: '李飞飞的agent综述', time: '7 hours ago' },
    { id: 4, type: 'latex', title: '1. 关于“智能体工作流', time: '7 days ago' },
  ];

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
          {/* Left Panel: Editor & Chat */}
          <div className="flex-1 flex flex-col gap-4 z-10">
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
              
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
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
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-r from-[#fdfcff] to-[#eefafc] font-sans text-[#1f2937]">
      {/* Header */}
      <header className="h-[60px] w-full sticky top-0 z-20 px-6 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Logo />
          <div className="px-2 py-0.5 rounded-md bg-[#f3e8ff] text-[#7e22ce] text-xs font-semibold tracking-wide">
            Beta
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="h-8 px-3 rounded-full border border-gray-200 bg-gray-50/50 text-gray-600 text-sm font-medium flex items-center gap-2 hover:bg-gray-100 transition-colors">
            <Globe size={14} />
            English
          </button>
          <button className="h-8 px-3 rounded-full border border-gray-200 bg-gray-50/50 text-gray-600 text-sm font-medium flex items-center gap-2 hover:bg-gray-100 transition-colors">
            <PlusCircle size={14} className="text-[#9333ea]" />
            1000
          </button>
        </div>
      </header>

      <div className="flex flex-1 relative">
        {/* Sidebar */}
        <aside className="hidden md:flex w-[260px] h-[calc(100vh-60px)] sticky top-[60px] bg-[#fcfcfd] border-r border-gray-100 pt-6 px-4 pb-6 flex-col z-10">
          <button 
            onClick={() => setCurrentPage('project_workspace')}
            className="w-full h-10 rounded-full border border-[#d8b4fe] bg-white text-[#9333ea] text-sm font-medium flex items-center justify-center hover:bg-purple-50 transition-colors"
          >
            <span className="mr-2 text-lg leading-none">+</span> New Project
          </button>

          <nav className="mt-6 flex flex-col gap-1">
            <button 
              onClick={() => setCurrentPage('home')}
              className={`h-10 rounded-lg px-3 flex items-center gap-3 transition-colors ${currentPage === 'home' ? 'bg-[#f3e8ff] text-[#7e22ce]' : 'bg-transparent text-gray-500 hover:bg-gray-100'}`}
            >
              <Home size={18} />
              <span className="text-sm font-medium">Home</span>
            </button>
            <button 
              onClick={() => setCurrentPage('all_projects')}
              className={`h-10 rounded-lg px-3 flex items-center gap-3 transition-colors ${currentPage === 'all_projects' ? 'bg-[#f3e8ff] text-[#7e22ce]' : 'bg-transparent text-gray-500 hover:bg-gray-100'}`}
            >
              <Folder size={18} />
              <span className="text-sm font-medium">All Projects</span>
            </button>
          </nav>

          <div className="mt-6 rounded-xl bg-gradient-to-b from-[#f5f3ff] to-[#ede9fe] p-4 relative">
            <h3 className="text-sm text-gray-700 font-medium">Redeem Invitation Code</h3>
            <p className="text-xs text-[#8b5cf6] mt-1">Get 1000 credits to use!</p>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8b5cf6]">
              <Gift size={24} strokeWidth={1.5} />
            </div>
          </div>

          <div className="flex-1"></div>

          <button className="h-11 rounded-xl bg-gradient-to-r from-[#67e8f9] to-[#a78bfa] text-white text-sm font-semibold shadow-lg shadow-blue-500/20 hover:opacity-90 transition-opacity">
            Turn your feedback into rewards!
          </button>

          <div className="mt-6 flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-gray-600 text-white text-sm flex items-center justify-center font-medium">
              L
            </div>
            <span className="flex-1 text-sm text-gray-700 font-medium truncate">Lingchen</span>
            <button className="text-gray-400 hover:text-gray-600 transition-colors">
              <Settings size={18} />
            </button>
          </div>
        </aside>

        {/* Main Panel */}
        <main className={`flex-1 flex flex-col pt-10 px-8 pb-12 relative z-10 ${currentPage === 'home' ? 'items-center' : 'items-stretch'}`}>
          {currentPage === 'home' ? (
            <>
              {/* Hero */}
              <div className="text-center flex flex-col items-center max-w-3xl w-full mt-6">
                <h1 className="font-serif text-[56px] font-bold leading-tight text-[#2a2136]">
                  Meet Your AI Scientist Friend
                </h1>
                <p className="text-lg text-gray-500 mt-4">
                  Search, ideate, compute, experiment, write —— seamlessly unified
                </p>
              </div>

              {/* Composer Card */}
              <div className="mt-12 w-full max-w-[800px] min-h-[240px] rounded-2xl bg-white/90 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-xl p-8 flex flex-col transition-all">
                {selectedAction === 'Literature survey' ? (
                  <>
                    <h2 className="text-[17px] font-semibold text-[#8b5cf6] mb-4 flex items-center gap-2">
                      <BookOpen size={18} />
                      Literature survey & Reports
                    </h2>
                    
                    <div className="flex-1 flex flex-col">
                      <textarea 
                        value={surveyPrompt}
                        onChange={(e) => setSurveyPrompt(e.target.value)}
                        placeholder="What kind of report do you need? You can ask for an Academic Survey, Industry Report, Learn from Template, or any other style you want to write..."
                        className="w-full flex-1 bg-transparent border-none outline-none text-[15px] text-gray-800 placeholder:text-gray-400 resize-none min-h-[80px]"
                      />
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-600 relative">
                        <button 
                          onClick={handleSurpriseClick}
                          className="flex items-center gap-1.5 hover:text-gray-900 transition-colors text-gray-600 font-medium text-sm px-2 py-1 rounded-md hover:bg-gray-100"
                          title="Get a random prompt template"
                        >
                          <Dices size={16} /> Surprise Me
                        </button>
                        <button className="flex items-center gap-1.5 hover:text-gray-900 transition-colors text-gray-600 font-medium text-sm px-2 py-1 rounded-md hover:bg-gray-100">
                          <Paperclip size={16} /> Add reference files or templates
                        </button>
                        <div className="relative">
                          <button 
                            onClick={() => setIsOutputSettingsOpen(!isOutputSettingsOpen)}
                            className={`flex items-center gap-1.5 transition-colors font-medium text-sm px-2 py-1 rounded-md ${isOutputSettingsOpen || outputFormat !== 'Auto' || outputLength !== 'Auto' || outputLanguage !== 'Auto' ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
                          >
                            <Settings size={16} /> 
                            {outputFormat !== 'Auto' || outputLength !== 'Auto' || outputLanguage !== 'Auto' ? 'Settings Applied' : 'Output Settings'}
                          </button>
                          
                          {/* Settings Popover */}
                          {isOutputSettingsOpen && (
                            <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.1)] border border-gray-100 p-4 z-50">
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="text-[13px] font-semibold text-gray-800">Output Preferences</h3>
                                <button 
                                  onClick={() => {
                                    setOutputFormat('Auto');
                                    setOutputLength('Auto');
                                    setOutputLanguage('Auto');
                                  }}
                                  className="text-[11px] text-gray-400 hover:text-gray-600 underline"
                                >
                                  Reset
                                </button>
                              </div>
                              <div className="space-y-3">
                                <div>
                                  <label className="text-xs font-medium text-gray-700 mb-1.5 block">Format</label>
                                  <select 
                                    value={outputFormat}
                                    onChange={handleFormatChange}
                                    className="w-full text-[13px] border border-gray-200 rounded-md p-1.5 bg-gray-50 outline-none text-gray-700 focus:border-purple-300 focus:ring-1 focus:ring-purple-300 transition-all"
                                  >
                                    <option value="Auto">Auto</option>
                                    <option value="Academic Paper">Academic Paper</option>
                                    <option value="Industry Report">Industry Report</option>
                                    <option value="Executive Summary">Executive Summary</option>
                                    <option value="Blog Post">Blog Post</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-700 mb-1.5 block">Length</label>
                                  <select 
                                    value={outputLength}
                                    onChange={(e) => setOutputLength(e.target.value)}
                                    className="w-full text-[13px] border border-gray-200 rounded-md p-1.5 bg-gray-50 outline-none text-gray-700 focus:border-purple-300 focus:ring-1 focus:ring-purple-300 transition-all"
                                  >
                                    <option value="Auto">Auto</option>
                                    <option value="Detailed (10+ pages)">Detailed (10+ pages)</option>
                                    <option value="Standard (3-5 pages)">Standard (3-5 pages)</option>
                                    <option value="Brief (1-2 pages)">Brief (1-2 pages)</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-700 mb-1.5 block">Language</label>
                                  <select 
                                    value={outputLanguage}
                                    onChange={(e) => setOutputLanguage(e.target.value)}
                                    className="w-full text-[13px] border border-gray-200 rounded-md p-1.5 bg-gray-50 outline-none text-gray-700 focus:border-purple-300 focus:ring-1 focus:ring-purple-300 transition-all"
                                  >
                                    <option value="Auto">Auto</option>
                                    <option value="English">English</option>
                                    <option value="Chinese">Chinese</option>
                                    <option value="Spanish">Spanish</option>
                                    <option value="French">French</option>
                                    <option value="German">German</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <button className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#dbeafe] to-[#e9d5ff] flex items-center justify-center hover:opacity-90 transition-opacity shadow-sm flex-shrink-0 ml-4">
                        <ArrowUp size={18} className="text-white" strokeWidth={2} />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="text-[17px] font-semibold text-[#8b5cf6] mb-4">{selectedAction}</h2>
                    <div className="flex-1">
                      <textarea 
                        placeholder="What would you like to explore today?"
                        className="w-full h-full bg-transparent border-none outline-none text-[15px] text-gray-800 placeholder:text-gray-500 resize-none"
                      />
                    </div>
                    <div className="mt-8 flex items-center justify-between">
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <button className="flex items-center gap-1.5 hover:text-gray-900 transition-colors">
                          Editor style <ChevronDown size={14} className="text-gray-400" />
                        </button>
                        <button className="flex items-center gap-1.5 hover:text-gray-900 transition-colors">
                          claude-4.6 <ChevronDown size={14} className="text-gray-400" />
                        </button>
                        <button className="flex items-center gap-1.5 hover:text-gray-900 transition-colors">
                          <Paperclip size={14} className="text-gray-400" /> Working files
                        </button>
                        <button className="flex items-center gap-1.5 hover:text-gray-900 transition-colors">
                          <Paperclip size={14} className="text-gray-400" /> Knowledge files
                        </button>
                      </div>
                      <button className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#dbeafe] to-[#e9d5ff] flex items-center justify-center hover:opacity-90 transition-opacity shadow-sm">
                        <ArrowUp size={18} className="text-white" strokeWidth={2} />
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Quick Actions */}
              <div className="mt-6 flex items-center justify-center max-w-[800px] w-full">
                <div className="flex items-center p-1.5 rounded-full bg-white/60 backdrop-blur-md shadow-sm border border-white/40">
                  {['Paper search', 'Idea brainstorming', 'Data analysis', 'Literature survey', 'Manuscript drafting'].map((action) => (
                    <button 
                      key={action} 
                      onClick={() => setSelectedAction(action)}
                      className={`px-5 py-2.5 rounded-full text-[14px] font-medium transition-all ${
                        selectedAction === action 
                          ? 'bg-white text-gray-900 shadow-[0_2px_10px_rgb(0,0,0,0.06)]' 
                          : 'text-gray-700 hover:text-gray-900 hover:bg-white/50'
                      }`}
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent Projects */}
              <div className="mt-16 w-full max-w-[800px] rounded-2xl bg-white/80 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-base font-bold text-gray-900">Recent projects</h2>
                  <div className="w-64 h-9 rounded-lg border border-gray-200 bg-white px-3 flex items-center gap-2">
                    <Search size={16} className="text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Search workspace..." 
                      className="bg-transparent border-none outline-none text-sm text-gray-800 placeholder:text-gray-400 w-full"
                    />
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="py-4 flex items-center justify-between border-b border-gray-100">
                    <span className="text-sm text-gray-800">1</span>
                    <span className="text-sm text-gray-400">2 hours ago</span>
                  </div>
                  <div className="py-4 flex items-center justify-between border-b border-gray-100">
                    <span className="text-sm text-gray-800">我想去做agent相关的</span>
                    <span className="text-sm text-gray-400">2 hours ago</span>
                  </div>
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
                    onClick={() => setCurrentPage('project_workspace')}
                    className="rounded-xl border border-gray-100 bg-white overflow-hidden shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all cursor-pointer"
                  >
                    <div className="h-[160px] bg-[#f4f5f7] flex items-center justify-center text-gray-400 text-sm font-medium">
                      {project.type}
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-[15px] text-gray-900 truncate pr-2">{project.title}</h3>
                        <button className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                      <p className="text-[13px] text-gray-500">{project.time}</p>
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
