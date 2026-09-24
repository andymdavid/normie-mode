// Read-side helpers shared by pages. Keeps the publish rule (drafts only in preview) in one place.
import { graph } from './graph';
import { activeResults, relevance, type Relevance } from './rules';
import type { Confidence, Recommendation, Result } from './schema';

/** Drafts are visible in `astro dev` or when NORMIE_PREVIEW=1; public builds show published only. */
export const PREVIEW = import.meta.env.DEV || process.env.NORMIE_PREVIEW === '1';

export function visibleRecommendations(taskId?: string): Recommendation[] {
  return [...graph().recommendations.values()].filter(
    (r) => (!taskId || r.task === taskId) && (r.status === 'published' || (PREVIEW && r.status === 'draft')),
  );
}

export function modelName(id: string): string {
  return graph().models.get(id)?.name ?? id;
}

export function benchmarkName(id: string): string {
  return graph().benchmarks.get(id)?.name ?? id;
}

export function metricFor(r: Result) {
  return graph().benchmarks.get(r.benchmark)?.metrics.find((m) => m.id === r.metric);
}

export function formatValue(r: Result): string {
  return metricFor(r)?.unit === 'percent' ? `${r.value.toFixed(1)}%` : String(r.value);
}

export function subsetLabel(subset?: string): string {
  return subset ? subset.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase()) : 'Overall';
}

export function formatDate(d?: string): string {
  if (!d) return 'Date not stated';
  return new Date(`${d}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export const CONFIDENCE_LABEL: Record<Confidence, { label: string; plain: string }> = {
  strong: { label: 'Strong evidence', plain: 'Several independent tests of this exact job agree.' },
  moderate: { label: 'Moderate evidence', plain: 'Direct evidence exists, but from one source or with caveats.' },
  limited: { label: 'Limited evidence', plain: 'A lean, not a verdict. The evidence is thin, indirect or too close to call.' },
  insufficient: { label: 'Not enough evidence', plain: "We can't responsibly pick a model for this yet." },
};

export const BASIS_LABEL = {
  measured: 'Measured',
  sourced: 'Sourced',
  editorial: 'Our judgement',
} as const;

export const RELEVANCE_LABEL: Record<Relevance, string> = {
  direct: 'Tests this job directly',
  proxy: 'Tests a key skill for this job',
  indirect: 'Related skill',
  none: 'Not relevant',
};

export const EVIDENCE_CLASS_LABEL: Record<string, string> = {
  'independent-benchmark': 'Independent benchmark',
  'provider-reported': 'Reported by a model maker',
  'independent-research': 'Independent research',
  'first-party': 'Normie Mode test',
  editorial: 'Editorial',
};

export interface EvidenceRow {
  result: Result;
  relevance: Relevance;
}

/** All active results relevant to a task, most relevant first, then by benchmark and score. */
export function evidenceForTask(taskId: string): EvidenceRow[] {
  const g = graph();
  const order: Relevance[] = ['direct', 'proxy', 'indirect'];
  return activeResults(g)
    .map((result) => ({ result, relevance: relevance(g, result, taskId) }))
    .filter((r) => r.relevance !== 'none')
    .filter((r) => r.relevance === 'direct' || !r.result.subset)
    .sort(
      (a, b) =>
        order.indexOf(a.relevance) - order.indexOf(b.relevance) ||
        a.result.benchmark.localeCompare(b.result.benchmark) ||
        (a.result.subset ?? '').localeCompare(b.result.subset ?? '') ||
        a.result.source.localeCompare(b.result.source) ||
        b.result.value - a.result.value,
    );
}

export function resultsForModel(modelId: string): Result[] {
  return activeResults(graph()).filter((r) => r.model_version === modelId);
}

export function resultsForBenchmark(benchmarkId: string): Result[] {
  return activeResults(graph())
    .filter((r) => r.benchmark === benchmarkId)
    .sort((a, b) => (a.subset ?? '').localeCompare(b.subset ?? '') || b.value - a.value);
}

/** Tasks whose required capabilities include this one. */
export function tasksNeeding(capabilityId: string) {
  return [...graph().tasks.values()]
    .map((t) => ({ task: t, need: t.capabilities.find((c) => c.capability === capabilityId) }))
    .filter((x) => x.need)
    .sort((a, b) => (a.need!.importance === 'core' ? -1 : 1) - (b.need!.importance === 'core' ? -1 : 1));
}
