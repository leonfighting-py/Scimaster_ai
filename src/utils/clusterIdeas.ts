import type { IdeaEntry } from './ideaStore';

export type NodePosition = {
  id: string;
  x: number;
  y: number;
  entry: IdeaEntry;
};

export type Cluster = {
  id: string;
  name: string;
  centerX: number;
  centerY: number;
  nodes: NodePosition[];
};

/** Jaccard similarity between two keyword sets */
function jaccard(a: string[], b: string[]): number {
  const setA = new Set(a.map((s) => s.toLowerCase()));
  const setB = new Set(b.map((s) => s.toLowerCase()));
  const intersection = [...setA].filter((x) => setB.has(x)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

const SIMILARITY_THRESHOLD = 0.2;
const CLUSTER_SPACING = 450;
const NODE_RADIUS = 160;

/** Greedy single-linkage clustering */
function buildClusters(ideas: IdeaEntry[]): number[][] {
  const groups: number[][] = [];
  const assigned = new Set<number>();

  for (let i = 0; i < ideas.length; i++) {
    if (assigned.has(i)) continue;
    const group = [i];
    assigned.add(i);
    for (let j = i + 1; j < ideas.length; j++) {
      if (assigned.has(j)) continue;
      // Check similarity to any member already in group
      const similar = group.some(
        (g) => jaccard(ideas[g].keywords, ideas[j].keywords) >= SIMILARITY_THRESHOLD,
      );
      if (similar) {
        group.push(j);
        assigned.add(j);
      }
    }
    groups.push(group);
  }
  return groups;
}

/** Pick a cluster name from the most common keyword across members */
function clusterName(members: IdeaEntry[]): string {
  const freq: Record<string, number> = {};
  for (const m of members) {
    for (const kw of m.keywords) {
      const k = kw.toLowerCase();
      freq[k] = (freq[k] ?? 0) + 1;
    }
  }
  const top = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
  if (!top) return 'Ideas';
  return top[0].split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

/** Lay clusters out in a loose grid, nodes in polar arrangement around center */
export function clusterIdeas(ideas: IdeaEntry[]): Cluster[] {
  if (ideas.length === 0) return [];

  const groups = buildClusters(ideas);
  const cols = Math.ceil(Math.sqrt(groups.length));

  return groups.map((group, gi) => {
    const col = gi % cols;
    const row = Math.floor(gi / cols);
    const centerX = 200 + col * CLUSTER_SPACING;
    const centerY = 200 + row * CLUSTER_SPACING;

    const members = group.map((idx) => ideas[idx]);
    const name = clusterName(members);

    const nodes: NodePosition[] = members.map((entry, ni) => {
      const angle = (2 * Math.PI * ni) / members.length - Math.PI / 2;
      const r = members.length === 1 ? 0 : NODE_RADIUS;
      return {
        id: entry.id,
        x: centerX + r * Math.cos(angle),
        y: centerY + r * Math.sin(angle),
        entry,
      };
    });

    return { id: `cluster-${gi}`, name, centerX, centerY, nodes };
  });
}
