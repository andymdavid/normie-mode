// Structured intent search: resolves a phrase to canonical pages, tasks first.
export interface SearchEntry {
  url: string;
  title: string;
  kind: 'Task' | 'Skill' | 'Model' | 'Benchmark';
  terms: string;
  /** Phrases that count as an exact match, e.g. a task's search terms. */
  phrases?: string[];
}

const STOP = new Set(['a', 'an', 'the', 'my', 'for', 'to', 'of', 'with', 'in', 'on', 'and', 'or', 'can', 'ai', 'best', 'is', 'it', 'do', 'does', 'me', 'i', 'how', 'what', 'which', 'this']);
const KIND_WEIGHT = { Task: 1.5, Skill: 1, Model: 1.2, Benchmark: 1 };

export function normalise(word: string): string {
  return word
    .toLowerCase()
    .replace(/yse/g, 'yze')
    .replace(/ise$/, 'ize')
    .replace(/(ing|es|s|ed)$/, '')
    .replace(/e$/, '');
}

export function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9.]+/)
    .filter((w) => w && !STOP.has(w))
    .map(normalise);
}

export function rank(entries: SearchEntry[], query: string, limit = 6): SearchEntry[] {
  const q = tokens(query);
  if (!q.length) return [];
  return entries
    .map((e) => {
      const t = new Set(tokens(e.terms));
      const hits = q.filter((w) => t.has(w) || [...t].some((x) => x.startsWith(w) && w.length >= 3)).length;
      const exact = e.phrases?.some((p) => tokens(p).join(' ') === q.join(' ')) ? 1 : 0;
      return { e, score: (hits / q.length) * KIND_WEIGHT[e.kind] + exact };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.e);
}
