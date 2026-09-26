// Demand signal from the autocomplete snapshot (D-024), grouped into search intents.
// The score is relative: every appearance counts 10 minus its position (top suggestion = 10),
// so an intent scores higher the more often and the higher it is suggested. It is not volume.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { graph } from './graph';
import type { Intent } from './schema';

export interface Suggestion {
  query: string;
  stem: string;
  tail: string;
  prefix: string;
  region: string;
  position: number;
}

export interface DemandSnapshot {
  meta: { name: string; method: string; stems: string[]; regions: string[]; retrieved_at: string; requests: number; failures: number; caveat: string };
  suggestions: Suggestion[];
}

export interface SearchTerm {
  tail: string;
  score: number;
  appearances: number;
  regions: string[];
}

export interface IntentDemand {
  intent: Intent;
  score: number;
  /** Share of the in-scope demand signal, 0–100. */
  share: number;
  appearances: number;
  regions: string[];
  searches: SearchTerm[];
}

export function loadDemand(): DemandSnapshot | undefined {
  const f = join(process.cwd(), 'data', 'demand.json');
  return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : undefined;
}

const words = (s: string) => ` ${s.toLowerCase().replace(/[^a-z0-9+#]+/g, ' ').trim()} `;

/** First intent (by priority) whose phrase appears as whole words in the search. */
export function matchIntent(tail: string, intents: Intent[]): Intent | undefined {
  const t = words(tail);
  return intents.find((i) => i.match.some((m) => t.includes(words(m))));
}

function terms(suggestions: Suggestion[]): SearchTerm[] {
  const byTail = new Map<string, SearchTerm>();
  for (const s of suggestions) {
    const t = byTail.get(s.tail) ?? { tail: s.tail, score: 0, appearances: 0, regions: [] };
    t.score += 10 - s.position;
    t.appearances++;
    if (!t.regions.includes(s.region)) t.regions.push(s.region);
    byTail.set(s.tail, t);
  }
  return [...byTail.values()].sort((a, b) => b.score - a.score);
}

type DemandByIntent = { intents: IntentDemand[]; unmatched: SearchTerm[]; matchedShare: number };
/** The saved snapshot's grouping, memoised per loaded graph: every page asks for it. */
const memo = new WeakMap<object, DemandByIntent>();

export function demandByIntent(snapshot?: DemandSnapshot): DemandByIntent {
  if (snapshot) return groupDemand(snapshot);
  const g = graph();
  if (!memo.has(g)) memo.set(g, groupDemand(loadDemand()));
  return memo.get(g)!;
}

function groupDemand(snapshot: DemandSnapshot | undefined): DemandByIntent {
  const intents = [...graph().intents.values()].sort((a, b) => a.priority - b.priority);
  const groups = new Map<string, Suggestion[]>();
  const unmatchedSuggestions: Suggestion[] = [];
  for (const s of snapshot?.suggestions ?? []) {
    if (!s.tail) continue;
    const i = matchIntent(s.tail, intents);
    if (i) groups.set(i.id, [...(groups.get(i.id) ?? []), s]);
    else unmatchedSuggestions.push(s);
  }
  const scoreOf = (xs: Suggestion[]) => xs.reduce((sum, s) => sum + 10 - s.position, 0);
  const inScopeTotal = intents.filter((i) => i.scope === 'in').reduce((sum, i) => sum + scoreOf(groups.get(i.id) ?? []), 0);
  const all = scoreOf(snapshot?.suggestions.filter((s) => s.tail) ?? []);
  const result = intents
    .map((intent) => {
      const xs = groups.get(intent.id) ?? [];
      const score = scoreOf(xs);
      return {
        intent,
        score,
        share: intent.scope === 'in' && inScopeTotal ? (100 * score) / inScopeTotal : 0,
        appearances: xs.length,
        regions: [...new Set(xs.map((s) => s.region))],
        searches: terms(xs),
      };
    })
    .sort((a, b) => b.score - a.score);
  return { intents: result, unmatched: terms(unmatchedSuggestions), matchedShare: all ? (100 * (all - scoreOf(unmatchedSuggestions))) / all : 0 };
}
