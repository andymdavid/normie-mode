// Norm's accuracy model (docs/norm-voice.md). Anything Norm says about the data is rendered from
// a template in content/norm-messages, filled with facts computed here from the same data the
// page's charts use. Hand-written lines may only give advice (checked by lintNormText in rules.ts).
import { graph } from './graph';
import { overviewRows } from './overview';
import type { Intent } from './schema';
import { MIN_MODELS_TO_RANK, effectiveTests, scoringTests, taskScores, testRows } from './tasks';

export type Facts = Record<string, string | number | boolean | undefined>;

const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
export const countWords = (n: number) => WORDS[n] ?? String(n);
const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const money = (v: number) => (v < 10 ? `$${v.toFixed(2)}` : `$${v.toFixed(0)}`);
/** "votes on A, and on B": keeps topics that contain "and" readable. */
const topics = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', on ')}, and on ${xs.at(-1)}`);
const tests = (n: number) => `${countWords(n)} test${n === 1 ? '' : 's'}`;
const shortName = (label: string) => label.replace(/^Best AI for /, '');

export class NormMessageError extends Error {}

/** Facts that are allowed to be empty, e.g. a clause that only appears when there's something to say. */
const OPTIONAL_TEXT = new Set(['related_clause']);

/**
 * Render a slot: the first variant whose conditions all match. Returns undefined if no variant
 * applies (an optional message). Throws if a placeholder has no fact, so a wrong or missing fact
 * fails the build instead of reaching a page.
 */
export function renderSlot(slot: string, facts: Facts): string | undefined {
  const variants = graph().normMessages.get('messages')?.slots[slot];
  if (!variants) throw new NormMessageError(`No Norm message slot "${slot}"`);
  const v = variants.find((x) => Object.entries(x.when ?? {}).every(([k, want]) => facts[k] === want));
  if (!v || !v.text) return undefined;
  const text = v.text.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = facts[key];
    if (value === undefined || (value === '' && !OPTIONAL_TEXT.has(key)) || (typeof value === 'number' && !Number.isFinite(value))) {
      throw new NormMessageError(`Norm message "${slot}" needs fact "${key}", which this page doesn't have`);
    }
    return String(value);
  });
  return capital(text);
}

/** Facts for a task page, computed from the same data as its charts. */
export function taskFacts(task: Intent): Facts {
  const g = graph();
  const scores = taskScores(task);
  // Count the scoring tests a reader can see a chart for (enough models to rank, as on the page).
  const shown = scoringTests(task).filter((t) => testRows(t).filter((r) => r.value !== undefined).length >= MIN_MODELS_TO_RANK);
  const closenessOf = (id: string) => effectiveTests(task).find((x) => x.test === id)?.closeness;
  const direct = shown.filter((t) => closenessOf(t.id) === 'direct').length;
  const related = shown.filter((t) => closenessOf(t.id) === 'related').length;
  const arena = shown.filter((t) => t.source === 'lmarena');
  const [leader, second] = scores.rows;
  const hub = task.parent ? g.intents.get(task.parent) : undefined;

  const cost = new Map(overviewRows().map((r) => [r.model.id, r.costPer1000]));
  const leaders = scores.rows.slice(0, 3).map((r) => ({ name: r.label, id: r.id, cost: cost.get(r.id) }));
  const priced = leaders.filter((l) => l.cost !== undefined) as { name: string; id: string; cost: number }[];
  const cheap = [...priced].sort((a, b) => a.cost - b.cost)[0];
  const dear = [...priced].sort((a, b) => b.cost - a.cost)[0];
  const cheapestOverall = overviewRows()
    .filter((r) => r.costPer1000 !== undefined)
    .sort((a, b) => a.costPer1000! - b.costPer1000!)[0];

  return {
    name: shortName(task.label),
    hub: hub ? shortName(hub.label) : undefined,
    inherited: !!task.parent && task.tests.length === 0,
    has_scores: scores.rows.length > 0,
    closeness: scores.closeness,
    direct_words: tests(direct),
    direct_verb: direct === 1 ? 'measures' : 'measure',
    related_words: tests(related),
    related_clause: related ? `, and ${tests(related)} ${related === 1 ? 'covers' : 'cover'} related skills` : '',
    votes_only: shown.length > 0 && arena.length === shown.length,
    half_votes: arena.length > 0 && arena.length * 2 === shown.length,
    mostly_votes: arena.length * 2 > shown.length && arena.length < shown.length,
    vote_topics: topics(arena.map((t) => t.title.replace(/^People's votes (on )?/, ''))),
    leader: leader?.label,
    second: second?.label,
    close_call: !!leader && !!second && leader.value! - second.value! < 5,
    has_leader_prices: priced.length >= 2,
    leaders_count_words: countWords(priced.length),
    cheapest_leader: cheap?.name,
    cheapest_leader_price: cheap && money(cheap.cost),
    dearest_leader: dear?.name,
    leader_price_ratio: cheap && dear ? Math.round(dear.cost / cheap.cost) : undefined,
    leaders_similar_price: !!cheap && !!dear && dear.cost / cheap.cost < 1.5,
    cheapest_overall: cheapestOverall?.model.name,
    cheapest_overall_in_leaders: !!cheapestOverall && leaders.some((l) => l.id === cheapestOverall.model.id),
  };
}

/** Norm's evidence note for a task page: what the evidence is and who leads, from the data. */
export function taskEvidenceNote(task: Intent): string | undefined {
  const f = taskFacts(task);
  return [renderSlot('task.evidence', f), renderSlot('task.close', f)].filter(Boolean).join(' ') || undefined;
}

export function taskCostNote(task: Intent): string | undefined {
  const f = taskFacts(task);
  return [renderSlot('task.cost', f), renderSlot('task.cost_overall', f)].filter(Boolean).join(' ') || undefined;
}
