const STOPWORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with',
  'by','from','as','is','was','are','were','be','been','being','have','has',
  'had','do','does','did','will','would','could','should','may','might',
  'can','shall','this','that','these','those','i','you','he','she','it',
  'we','they','what','which','who','when','where','why','how','all','each',
  'every','both','few','more','most','other','some','such','into','through',
  'during','before','after','above','below','between','out','off','over',
  'under','again','then','once','here','there','any','no','not','only',
  'own','same','than','too','very','just','about','up','its','their','our',
]);

/**
 * Extracts 2-3 meaningful keywords from a query string.
 * Uses stopword removal + word-frequency ranking.
 */
export function extractKeywords(query: string): string[] {
  const words = query
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));

  // Count frequencies
  const freq: Record<string, number> = {};
  for (const w of words) {
    freq[w] = (freq[w] ?? 0) + 1;
  }

  // Detect bigrams (consecutive meaningful words) for multi-word concepts
  const bigrams: string[] = [];
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = `${words[i]} ${words[i + 1]}`;
    bigrams.push(bigram);
  }

  // Score bigrams by sum of component frequencies
  const bigramScores: Record<string, number> = {};
  for (const bg of bigrams) {
    const [a, b] = bg.split(' ');
    bigramScores[bg] = (freq[a] ?? 0) + (freq[b] ?? 0);
  }

  // Pick top bigram if score is high enough
  const topBigram = Object.entries(bigramScores)
    .sort((a, b) => b[1] - a[1])[0];

  const usedWords = new Set<string>();
  const result: string[] = [];

  if (topBigram && topBigram[1] >= 2) {
    result.push(topBigram[0]);
    topBigram[0].split(' ').forEach((w) => usedWords.add(w));
  }

  // Fill remaining slots with top single words not already used
  const sortedSingles = Object.entries(freq)
    .filter(([w]) => !usedWords.has(w))
    .sort((a, b) => b[1] - a[1])
    .map(([w]) => w);

  for (const w of sortedSingles) {
    if (result.length >= 3) break;
    result.push(w);
  }

  return result.slice(0, 3);
}

/** Returns a short display title from keywords */
export function keywordsToTitle(keywords: string[]): string {
  return keywords
    .map((k) => k.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '))
    .join(' · ');
}
