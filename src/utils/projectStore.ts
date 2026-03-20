export type ProjectEntry = {
  id: string;
  title: string;
  type: 'latex' | 'document';
  tag: 'writing' | 'idea';
  createdAt: number;
};

const KEY = 'scimaster_projects';

function nanoid(): string {
  return Math.random().toString(36).slice(2, 10);
}

const MOCK_PROJECTS: ProjectEntry[] = [
  { id: 'proj-mock-1', title: '1', type: 'latex', tag: 'writing', createdAt: Date.now() - 7200000 },
  { id: 'proj-mock-2', title: '我想去做agent相关的', type: 'document', tag: 'writing', createdAt: Date.now() - 7200000 },
  { id: 'proj-mock-3', title: '李飞飞的agent综述', type: 'document', tag: 'writing', createdAt: Date.now() - 25200000 },
  { id: 'proj-mock-4', title: '1. 关于"智能体工作流', type: 'latex', tag: 'idea', createdAt: Date.now() - 604800000 },
];

export function loadProjects(): ProjectEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      localStorage.setItem(KEY, JSON.stringify(MOCK_PROJECTS));
      return MOCK_PROJECTS;
    }
    return JSON.parse(raw) as ProjectEntry[];
  } catch {
    return MOCK_PROJECTS;
  }
}

export function saveProject(
  title: string,
  type: 'latex' | 'document',
  tag: 'writing' | 'idea',
): ProjectEntry {
  const entry: ProjectEntry = { id: nanoid(), title, type, tag, createdAt: Date.now() };
  try {
    const existing = loadProjects();
    localStorage.setItem(KEY, JSON.stringify([entry, ...existing]));
  } catch {
    // ignore storage errors
  }
  return entry;
}

export function formatProjectTime(createdAt: number): string {
  const diff = Date.now() - createdAt;
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d > 1 ? 's' : ''} ago`;
}
