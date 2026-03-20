import { extractKeywords } from './extractKeywords';

export type IdeaEntry = {
  id: string;
  query: string;
  keywords: string[];
  timestamp: number;
  nodeCount: number;     // nodes generated in this mindmap session
  projectCount: number;  // child projects created from this session
};

const STORAGE_KEY = 'scimaster_ideas';

const MOCK_IDEAS: IdeaEntry[] = [
  {
    id: 'mock-1',
    query: 'How can multi-agent AI systems accelerate drug discovery?',
    keywords: ['multi-agent', 'drug', 'AI'],
    timestamp: Date.now() - 6 * 24 * 60 * 60 * 1000,
    nodeCount: 8,
    projectCount: 2,
  },
  {
    id: 'mock-2',
    query: 'What are the key challenges in LLM alignment?',
    keywords: ['LLM', 'alignment', 'challenges'],
    timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000,
    nodeCount: 5,
    projectCount: 1,
  },
  {
    id: 'mock-3',
    query: 'How to design scalable microservices architecture?',
    keywords: ['microservices', 'scalable', 'architecture'],
    timestamp: Date.now() - 4 * 24 * 60 * 60 * 1000,
    nodeCount: 11,
    projectCount: 3,
  },
  {
    id: 'mock-4',
    query: 'Best practices for distributed database sharding',
    keywords: ['distributed', 'database', 'sharding'],
    timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
    nodeCount: 6,
    projectCount: 0,
  },
  {
    id: 'mock-5',
    query: 'How does stochastic modeling apply to financial risk?',
    keywords: ['stochastic', 'financial', 'risk'],
    timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
    nodeCount: 9,
    projectCount: 1,
  },
  {
    id: 'mock-6',
    query: 'Bayesian inference in real-time anomaly detection',
    keywords: ['Bayesian', 'anomaly', 'detection'],
    timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000,
    nodeCount: 7,
    projectCount: 2,
  },
];

function nanoid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

const MOCK_NODE_COUNTS: Record<string, { nodeCount: number; projectCount: number }> = {
  'mock-1': { nodeCount: 8, projectCount: 2 },
  'mock-2': { nodeCount: 5, projectCount: 1 },
  'mock-3': { nodeCount: 11, projectCount: 3 },
  'mock-4': { nodeCount: 6, projectCount: 0 },
  'mock-5': { nodeCount: 9, projectCount: 1 },
  'mock-6': { nodeCount: 7, projectCount: 2 },
};

/** Migrate entries that predate the nodeCount/projectCount fields */
function migrate(entries: IdeaEntry[]): IdeaEntry[] {
  return entries.map((e) => ({
    nodeCount: MOCK_NODE_COUNTS[e.id]?.nodeCount ?? Math.floor(Math.random() * 8) + 3,
    projectCount: MOCK_NODE_COUNTS[e.id]?.projectCount ?? Math.floor(Math.random() * 3),
    ...e,
  }));
}

export function loadIdeas(): IdeaEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_IDEAS));
      return MOCK_IDEAS;
    }
    const parsed = JSON.parse(raw) as IdeaEntry[];
    const migrated = migrate(parsed);
    // Persist migrated data back so values stabilise
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    return migrated;
  } catch {
    return MOCK_IDEAS;
  }
}

export function saveIdea(query: string): IdeaEntry {
  const ideas = loadIdeas();
  const keywords = extractKeywords(query);
  const entry: IdeaEntry = {
    id: nanoid(),
    query,
    keywords,
    timestamp: Date.now(),
    nodeCount: 0,
    projectCount: 0,
  };
  ideas.push(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas));
  return entry;
}
