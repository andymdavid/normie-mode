// Graph rules: referential integrity, provenance (claims), confidence ceilings (D-003)
// and freshness review flags (D-011).
import type { Graph } from './graph';
import { CONFIDENCE, INDEPENDENT_CLASSES, type Claim, type Confidence, type Recommendation, type Result } from './schema';

export type Relevance = 'direct' | 'proxy' | 'indirect' | 'none';
const RELEVANCE_ORDER: Relevance[] = ['none', 'indirect', 'proxy', 'direct'];

export const REVIEW_MAX_AGE_DAYS = 90;
/** Reviewer value for agent-drafted content that no human has reviewed yet. */
export const UNREVIEWED = 'unreviewed';

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

/** How directly a result tells us about a task. */
export function relevance(g: Graph, result: Pick<Result, 'benchmark' | 'subset'>, taskId: string): Relevance {
  const bench = g.benchmarks.get(result.benchmark);
  const task = g.tasks.get(taskId);
  if (!bench || !task) return 'none';
  if (bench.direct_tasks.some((d) => d.task === taskId && (d.subset === undefined || d.subset === result.subset))) {
    return 'direct';
  }
  const core = new Set(task.capabilities.filter((c) => c.importance === 'core').map((c) => c.capability));
  const all = new Set(task.capabilities.map((c) => c.capability));
  if (bench.measures.some((m) => m.strength === 'primary' && core.has(m.capability))) return 'proxy';
  if (bench.measures.some((m) => all.has(m.capability))) return 'indirect';
  return 'none';
}

export function maxRelevance(a: Relevance, b: Relevance): Relevance {
  return RELEVANCE_ORDER.indexOf(a) >= RELEVANCE_ORDER.indexOf(b) ? a : b;
}

/** True when `ancestor` precedes `descendant` in a successor chain. */
export function isPredecessor(g: Graph, ancestor: string, descendant: string): boolean {
  const seen = new Set<string>();
  let cur = g.models.get(ancestor)?.successor;
  while (cur && !seen.has(cur)) {
    if (cur === descendant) return true;
    seen.add(cur);
    cur = g.models.get(cur)?.successor;
  }
  return false;
}

/** Results not superseded by a later record and not from a withdrawn source. */
export function activeResults(g: Graph): Result[] {
  const superseded = new Set([...g.results.values()].flatMap((r) => (r.supersedes ? [r.supersedes] : [])));
  return [...g.results.values()].filter(
    (r) => !superseded.has(r.id) && g.sources.get(r.source)?.status !== 'withdrawn',
  );
}

export interface CeilingExplanation {
  ceiling: Confidence;
  reasons: string[];
  usesPredecessorEvidence: boolean;
}

/** The highest confidence the cited evidence can support under D-003. */
export function confidenceCeiling(g: Graph, rec: Pick<Recommendation, 'task' | 'model_version' | 'evidence'>): CeilingExplanation {
  const cited = rec.evidence.map((id) => g.results.get(id)).filter((r): r is Result => !!r);
  if (!rec.model_version) {
    return { ceiling: 'insufficient', reasons: ['No model is named.'], usesPredecessorEvidence: false };
  }
  const exact = cited.filter((r) => r.model_version === rec.model_version);
  const predecessor = cited.filter((r) => isPredecessor(g, r.model_version, rec.model_version!));
  const rel = (r: Result) => relevance(g, r, rec.task);
  const cls = (r: Result) => g.sources.get(r.source)?.evidence_class ?? 'editorial';

  const directExact = exact.filter((r) => rel(r) === 'direct');
  const directSources = new Set(directExact.map((r) => r.source));
  const proxyExactSources = new Set(exact.filter((r) => rel(r) === 'proxy').map((r) => r.source));
  const anyRelevantExact = exact.some((r) => rel(r) !== 'none');
  const usesPredecessorEvidence = predecessor.length > 0;

  if (directSources.size >= 2 && directExact.some((r) => INDEPENDENT_CLASSES.includes(cls(r)))) {
    return {
      ceiling: 'strong',
      reasons: [`Direct evidence on this exact version from ${directSources.size} sources, including an independent one.`],
      usesPredecessorEvidence,
    };
  }
  if (directExact.length > 0) {
    return { ceiling: 'moderate', reasons: ['Direct evidence on this exact version from one source.'], usesPredecessorEvidence };
  }
  if (proxyExactSources.size >= 2) {
    return { ceiling: 'moderate', reasons: ['Capability evidence on this exact version from two or more sources.'], usesPredecessorEvidence };
  }
  if (anyRelevantExact) {
    return { ceiling: 'limited', reasons: ['Only capability or indirect evidence on this exact version.'], usesPredecessorEvidence };
  }
  if (usesPredecessorEvidence && predecessor.some((r) => rel(r) !== 'none')) {
    return { ceiling: 'limited', reasons: ['Evidence is from an earlier version of this model.'], usesPredecessorEvidence };
  }
  return { ceiling: 'insufficient', reasons: ['No relevant results on this model version.'], usesPredecessorEvidence };
}

export function confidenceRank(c: Confidence): number {
  return CONFIDENCE.indexOf(c);
}

export interface ReviewFlag {
  recommendation: string;
  task: string;
  reason: string;
}

/** D-011: recommendations that need human review. Nothing is changed automatically. */
export function reviewFlags(g: Graph, asOf = today()): ReviewFlag[] {
  const flags: ReviewFlag[] = [];
  const supersededIds = new Set([...g.results.values()].flatMap((r) => (r.supersedes ? [r.supersedes] : [])));
  for (const rec of g.recommendations.values()) {
    if (rec.status === 'withdrawn') continue;
    const flag = (reason: string) => flags.push({ recommendation: rec.id, task: rec.task, reason });
    const model = rec.model_version ? g.models.get(rec.model_version) : undefined;
    if (model?.successor) {
      flag(`${model.name} has a newer version (${g.models.get(model.successor)?.name ?? model.successor}).`);
    }
    const task = g.tasks.get(rec.task);
    const core = new Set(task?.capabilities.filter((c) => c.importance === 'core').map((c) => c.capability));
    const linkedBenchmarks = new Set(
      [...g.benchmarks.values()]
        .filter((b) => b.direct_tasks.some((d) => d.task === rec.task) || b.measures.some((m) => core.has(m.capability)))
        .map((b) => b.id),
    );
    const newer = activeResults(g).filter(
      (r) => linkedBenchmarks.has(r.benchmark) && r.published_on > rec.reviewed_on && !rec.evidence.includes(r.id),
    );
    if (newer.length) {
      const names = [...new Set(newer.map((r) => g.benchmarks.get(r.benchmark)?.name ?? r.benchmark))];
      flag(`${newer.length} new result(s) published after review on ${names.join(', ')}.`);
    }
    for (const id of rec.evidence) {
      const r = g.results.get(id);
      if (!r) continue;
      if (supersededIds.has(id)) flag(`Cited result ${id} has been superseded.`);
      const status = g.sources.get(r.source)?.status;
      if (status && status !== 'active') flag(`Cited result ${id} comes from a ${status} source.`);
    }
    const age = daysBetween(rec.reviewed_on, asOf);
    if (age > REVIEW_MAX_AGE_DAYS) flag(`Last reviewed ${age} days ago (limit ${REVIEW_MAX_AGE_DAYS}).`);
  }
  return flags;
}

export interface ValidationReport {
  errors: string[];
  warnings: string[];
  flags: ReviewFlag[];
}

export function validate(g: Graph, asOf = today()): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const where = (kind: string, id: string) => g.origins.get(`${kind}:${id}`) ?? `${kind}/${id}`;
  const need = (ok: boolean, at: string, msg: string) => ok || errors.push(`${at}: ${msg}`);

  const checkClaims = (claims: Claim[], at: string) => {
    for (const c of claims) {
      for (const r of c.results) need(g.results.has(r), at, `claim cites unknown result "${r}"`);
      for (const s of c.sources) need(g.sources.has(s), at, `claim cites unknown source "${s}"`);
      if (c.basis === 'measured') need(c.results.length > 0, at, `measured claim needs results: "${c.text}"`);
      if (c.basis === 'sourced') need(c.sources.length + c.results.length > 0, at, `sourced claim needs a source: "${c.text}"`);
    }
  };

  for (const s of g.sources.values()) {
    const at = where('sources', s.id);
    if (s.status === 'superseded') need(!!s.superseded_by && g.sources.has(s.superseded_by), at, 'superseded source must name an existing superseded_by');
  }

  for (const m of g.models.values()) {
    const at = where('models', m.id);
    need(g.families.has(m.family), at, `unknown family "${m.family}"`);
    if (m.successor) {
      need(g.models.has(m.successor), at, `unknown successor "${m.successor}"`);
      need(g.models.get(m.successor)?.family === m.family, at, 'successor must be in the same family');
    }
    if (m.lifecycle === 'superseded') need(!!m.successor, at, 'superseded model must name a successor');
    for (const s of m.verification.sources) need(g.sources.has(s), at, `unknown verification source "${s}"`);
    if (m.verification.status === 'verified') need(m.verification.sources.length > 0, at, 'verified model needs a verification source');
  }

  for (const c of g.capabilities.values()) checkClaims(c.limitations, where('capabilities', c.id));

  for (const t of g.tasks.values()) {
    const at = where('tasks', t.id);
    for (const c of t.capabilities) need(g.capabilities.has(c.capability), at, `unknown capability "${c.capability}"`);
    for (const r of t.related) need(g.tasks.has(r) && r !== t.id, at, `bad related task "${r}"`);
    checkClaims([...t.assessment, ...t.can_do, ...t.checks], at);
    if (t.depth === 'full') {
      need(t.assessment.length > 0 && t.can_do.length > 0 && t.checks.length > 0, at, 'full task needs assessment, can_do and checks');
    }
  }
  const aliasOwner = new Map<string, string>();
  for (const t of g.tasks.values()) {
    for (const a of t.aliases.map((a) => a.toLowerCase())) {
      const prior = aliasOwner.get(a);
      need(!prior, where('tasks', t.id), `alias "${a}" already belongs to task "${prior}"`);
      aliasOwner.set(a, t.id);
    }
  }

  for (const b of g.benchmarks.values()) {
    const at = where('benchmarks', b.id);
    for (const s of b.sources) need(g.sources.has(s), at, `unknown source "${s}"`);
    for (const m of b.measures) need(g.capabilities.has(m.capability), at, `unknown capability "${m.capability}"`);
    for (const d of b.direct_tasks) need(g.tasks.has(d.task), at, `unknown task "${d.task}"`);
    need(b.metrics.filter((m) => m.primary).length === 1, at, 'exactly one metric must be primary');
  }

  for (const r of g.results.values()) {
    const at = `${where('results', r.id)} [${r.id}]`;
    const bench = g.benchmarks.get(r.benchmark);
    need(g.models.has(r.model_version), at, `unknown model version "${r.model_version}"`);
    need(!!bench, at, `unknown benchmark "${r.benchmark}"`);
    need(g.sources.has(r.source), at, `unknown source "${r.source}"`);
    if (r.supersedes) need(g.results.has(r.supersedes) && r.supersedes !== r.id, at, `bad supersedes "${r.supersedes}"`);
    if (bench) {
      need(bench.versions.some((v) => v.id === r.benchmark_version), at, `unknown benchmark version "${r.benchmark_version}"`);
      const metric = bench.metrics.find((m) => m.id === r.metric);
      need(!!metric, at, `unknown metric "${r.metric}"`);
      if (metric?.unit === 'percent') need(r.value >= 0 && r.value <= 100, at, `percent out of range: ${r.value}`);
    }
    const cls = g.sources.get(r.source)?.evidence_class;
    if (cls === 'editorial') errors.push(`${at}: results cannot come from an editorial source`);
  }

  const publishedScopes = new Map<string, string>();
  for (const rec of g.recommendations.values()) {
    const at = where('recommendations', rec.id);
    need(g.tasks.has(rec.task), at, `unknown task "${rec.task}"`);
    if (rec.model_version) need(g.models.has(rec.model_version), at, `unknown model version "${rec.model_version}"`);
    else need(rec.confidence === 'insufficient', at, 'a recommendation without a model must have confidence "insufficient"');
    if (rec.supersedes) need(g.recommendations.has(rec.supersedes), at, `unknown supersedes "${rec.supersedes}"`);
    for (const a of rec.alternatives) need(g.models.has(a.model_version), at, `unknown alternative "${a.model_version}"`);
    for (const id of rec.evidence) {
      const r = g.results.get(id);
      need(!!r, at, `unknown evidence result "${id}"`);
      if (r) need(relevance(g, r, rec.task) !== 'none', at, `evidence "${id}" is not relevant to task "${rec.task}"`);
    }
    checkClaims([...rec.rationale, ...rec.limitations], at);

    const { ceiling, usesPredecessorEvidence } = confidenceCeiling(g, rec);
    need(
      confidenceRank(rec.confidence) <= confidenceRank(ceiling),
      at,
      `confidence "${rec.confidence}" exceeds what the evidence supports ("${ceiling}")`,
    );
    if (usesPredecessorEvidence) {
      need(
        rec.rationale.some((c) => /earlier version|predecessor/i.test(c.text)),
        at,
        'rationale must say that some evidence comes from an earlier model version',
      );
    }
    if (rec.status === 'published') {
      const key = `${rec.task}/${rec.scope}`;
      need(!publishedScopes.has(key), at, `another published recommendation already covers ${key}`);
      publishedScopes.set(key, rec.id);
      const m = rec.model_version ? g.models.get(rec.model_version) : undefined;
      if (m) need(m.verification.status === 'verified', at, `cannot publish: ${m.name} is unverified`);
      need(rec.reviewer !== UNREVIEWED, at, 'published recommendations need a named human reviewer');
      need(rec.limitations.length > 0, at, 'published recommendations must state limitations');
    } else if (rec.status === 'draft') {
      warnings.push(`${at}: draft recommendation awaiting editorial review`);
    }
  }

  for (const m of g.models.values()) {
    if (m.verification.status === 'unverified' && m.lifecycle === 'current') {
      warnings.push(`${where('models', m.id)}: version name not yet verified against a provider source`);
    }
  }

  return { errors, warnings, flags: reviewFlags(g, asOf) };
}
