/**
 * LLM Client — Adversarial Topic Generation
 *
 * Three phases:
 *   1. doLandscapeSurvey  — non-streaming, builds context for Generator
 *   2. streamTopics       — streaming, emits one GeneratedTopic per complete JSON object
 *   3. scoreTopics        — non-streaming Critic, returns ScoredTopic[] (devil's advocate)
 *
 * Inspired by ARIS idea-creator Phase 2–4 adversarial loop.
 */

export type GeneratedTopic = {
  id: string;
  title: string;
  oneLiner: string;
  angle: 'empirical' | 'theoretical' | 'applied';
  gap_addressed: string;
};

export type TopicVerdict = 'KEEP' | 'ELIMINATE' | 'BORDERLINE';

export type ScoredTopic = {
  id: string;
  novelty: number;
  feasibility: number;
  impact: number;
  strongest_objection: string;
  verdict: TopicVerdict;
};

// ── API Key ──────────────────────────────────────────────────────────────────

function getApiKey(): string {
  // Vite env (set VITE_GEMINI_API_KEY in .env)
  const viteKey = (import.meta as unknown as { env?: Record<string, string> })
    .env?.VITE_GEMINI_API_KEY;
  if (viteKey) return viteKey;
  // AI Studio injected global
  if (typeof window !== 'undefined' && (window as unknown as Record<string, string>).__GEMINI_API_KEY__) {
    return (window as unknown as Record<string, string>).__GEMINI_API_KEY__;
  }
  return '';
}

const MODEL = 'gemini-2.0-flash';
const BASE = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}`;

// ── Gemini helpers ───────────────────────────────────────────────────────────

async function geminiGenerate(prompt: string): Promise<string> {
  const key = getApiKey();
  if (!key) throw new Error('Gemini API key not found. Set VITE_GEMINI_API_KEY in .env');

  const res = await fetch(`${BASE}:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }

  const data = await res.json() as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  };
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

async function geminiStream(
  prompt: string,
  onChunk: (text: string) => void,
  onDone: () => void,
): Promise<void> {
  const key = getApiKey();
  if (!key) throw new Error('Gemini API key not found. Set VITE_GEMINI_API_KEY in .env');

  const res = await fetch(`${BASE}:streamGenerateContent?alt=sse&key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.85, maxOutputTokens: 4096 },
    }),
  });

  if (!res.ok) throw new Error(`Gemini stream error ${res.status}`);

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const jsonStr = line.slice(6).trim();
      if (!jsonStr || jsonStr === '[DONE]') continue;
      try {
        const data = JSON.parse(jsonStr) as {
          candidates?: { content?: { parts?: { text?: string }[] } }[]
        };
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) onChunk(text);
      } catch {
        // skip malformed SSE line
      }
    }
  }
  onDone();
}

// ── JSON object extractor ────────────────────────────────────────────────────
// Scans accumulated text for complete { ... } objects respecting string escapes.

type ExtractResult = {
  objects: Record<string, unknown>[];
  nextPos: number;
};

function extractJsonObjects(text: string, startPos: number): ExtractResult {
  const objects: Record<string, unknown>[] = [];
  let pos = startPos;

  while (pos < text.length) {
    const openIdx = text.indexOf('{', pos);
    if (openIdx === -1) break;

    let depth = 0;
    let inString = false;
    let escape = false;
    let end = -1;

    for (let i = openIdx; i < text.length; i++) {
      const ch = text[i];
      if (escape) { escape = false; continue; }
      if (ch === '\\' && inString) { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) { end = i; break; }
      }
    }

    if (end === -1) break; // incomplete — wait for more data

    try {
      const obj = JSON.parse(text.slice(openIdx, end + 1)) as Record<string, unknown>;
      objects.push(obj);
    } catch {
      // skip malformed
    }
    pos = end + 1;
  }

  return { objects, nextPos: pos };
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Phase 1 — Landscape survey.
 * Returns a JSON string with { landscape, key_gaps }.
 * Used internally to inform topic generation — not shown directly to user.
 */
export async function doLandscapeSurvey(query: string): Promise<string> {
  const prompt = `You are a research landscape analyst.

Query: "${query}"

In 3–5 concise sentences, map the research landscape:
- What sub-areas or approaches exist?
- What is already well-studied?
- What gaps, contradictions, or open problems remain?

Output ONLY this JSON (no markdown, no extra text):
{"landscape":"...","key_gaps":["gap 1","gap 2","gap 3"]}`;

  return geminiGenerate(prompt);
}

/**
 * Phase 2 — Stream topic generation.
 * Calls onTopic once per complete JSON object found in the stream.
 * Topics are emitted as they arrive — canvas can render each one immediately.
 */
export async function streamTopics(
  query: string,
  landscape: string,
  onTopic: (topic: GeneratedTopic) => void,
  onDone: () => void,
): Promise<void> {
  const prompt = `You are a creative research topic generator.

The researcher wants to explore: "${query}"

Landscape context: ${landscape}

Generate exactly 7 differentiated research topic candidates.
Output ONE JSON object per line — stream immediately as you produce each one.
Do NOT wrap in an array. Do NOT add markdown fences.

Format (one per line):
{"title":"Brief title (5–8 words)","oneLiner":"One specific research question sentence","angle":"empirical","gap_addressed":"Which gap this addresses"}

Rules:
- angle must be exactly one of: empirical, theoretical, applied
- Each topic must address a DIFFERENT gap
- Avoid generic "apply X to Y" — every topic must reveal something surprising
- Output the JSON objects only, nothing else`;

  let accumulated = '';
  let lastPos = 0;
  let emitted = 0;

  await geminiStream(
    prompt,
    (chunk) => {
      accumulated += chunk;
      const { objects, nextPos } = extractJsonObjects(accumulated, lastPos);
      lastPos = nextPos;

      for (const obj of objects) {
        if (typeof obj.title !== 'string' || typeof obj.oneLiner !== 'string') continue;
        const topic: GeneratedTopic = {
          id: `t${Date.now()}${(emitted++).toString(36)}`,
          title: obj.title,
          oneLiner: obj.oneLiner,
          angle: (['empirical', 'theoretical', 'applied'].includes(obj.angle as string)
            ? obj.angle
            : 'empirical') as GeneratedTopic['angle'],
          gap_addressed: typeof obj.gap_addressed === 'string' ? obj.gap_addressed : '',
        };
        onTopic(topic);
      }
    },
    onDone,
  );
}

/**
 * Phase 3 — Critic scoring (ARIS-style devil's advocate).
 * Single non-streaming call. Returns ScoredTopic[] ordered by finalScore desc.
 *
 * Critic prompt inspired by ARIS idea-creator Phase 4:
 * "For each, play devil's advocate: strongest objection, most likely failure mode, re-rank."
 */
export async function scoreTopics(
  query: string,
  topics: GeneratedTopic[],
): Promise<ScoredTopic[]> {
  const topicList = topics
    .map((t, i) =>
      `${i + 1}. id="${t.id}" | "${t.title}" | ${t.angle}\n   Question: ${t.oneLiner}`)
    .join('\n\n');

  const prompt = `You are a skeptical senior reviewer evaluating research topics for: "${query}"

Topics:
${topicList}

For EACH topic, score 1–10 on three dimensions and give a verdict.
Use the EXACT id values provided above.

Scoring:
- novelty: Has this angle been studied? (1=common, 10=very novel)
- feasibility: Can a small team get results in 3 months? (1=hard, 10=easy)
- impact: Do results — positive or negative — matter? (1=irrelevant, 10=crucial)

Also give:
- strongest_objection: ONE sentence a skeptical reviewer would use to reject this
- verdict: KEEP if avg ≥ 6.5, ELIMINATE if avg < 5, otherwise BORDERLINE

Output one JSON object per line, no markdown:
{"id":"exact-id-here","novelty":N,"feasibility":N,"impact":N,"strongest_objection":"...","verdict":"KEEP|ELIMINATE|BORDERLINE"}

Be brutally honest. Not all topics should be KEEP.`;

  const text = await geminiGenerate(prompt);
  const { objects } = extractJsonObjects(text, 0);

  const scored = objects
    .filter((o) => typeof o.id === 'string' && typeof o.verdict === 'string')
    .map((o): ScoredTopic => ({
      id: String(o.id),
      novelty: Math.min(10, Math.max(1, Number(o.novelty) || 5)),
      feasibility: Math.min(10, Math.max(1, Number(o.feasibility) || 5)),
      impact: Math.min(10, Math.max(1, Number(o.impact) || 5)),
      strongest_objection: String(o.strongest_objection || '—'),
      verdict: (['KEEP', 'ELIMINATE', 'BORDERLINE'].includes(o.verdict as string)
        ? o.verdict
        : 'BORDERLINE') as TopicVerdict,
    }));

  // Sort: KEEP first, then BORDERLINE, then ELIMINATE; within each group by avg score desc
  const rank = (s: ScoredTopic) => {
    const avg = (s.novelty + s.feasibility + s.impact) / 3;
    const base = s.verdict === 'KEEP' ? 100 : s.verdict === 'BORDERLINE' ? 50 : 0;
    return base + avg;
  };
  return scored.sort((a, b) => rank(b) - rank(a));
}
