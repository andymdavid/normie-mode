// Canonical content schemas. Cross-references are plain string IDs; graph
// integrity is enforced in rules.ts so the validator and the site share one check.
import { z } from 'astro/zod';

const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'IDs are lowercase kebab-case');
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Dates are YYYY-MM-DD');

export const EVIDENCE_CLASSES = [
  'independent-benchmark',
  'provider-reported',
  'independent-research',
  'first-party',
  'editorial',
] as const;
export const INDEPENDENT_CLASSES: readonly string[] = ['independent-benchmark', 'independent-research', 'first-party'];

export const CONFIDENCE = ['insufficient', 'limited', 'moderate', 'strong'] as const;
export type Confidence = (typeof CONFIDENCE)[number];

/**
 * A statement shown to readers. `basis` keeps measured facts, sourced claims and
 * editorial judgement distinguishable; the validator checks the required support.
 */
export const claimSchema = z.object({
  text: z.string().min(1),
  basis: z.enum(['measured', 'sourced', 'editorial']),
  results: z.array(id).default([]),
  sources: z.array(id).default([]),
});
export type Claim = z.infer<typeof claimSchema>;

export const sourceSchema = z.object({
  id,
  title: z.string(),
  publisher: z.string(),
  url: z.url(),
  kind: z.enum(['paper', 'leaderboard', 'provider-report', 'model-card', 'article', 'dataset']),
  evidence_class: z.enum(EVIDENCE_CLASSES),
  published_on: date.optional(),
  retrieved_on: date,
  status: z.enum(['active', 'superseded', 'withdrawn']).default('active'),
  superseded_by: id.optional(),
  notes: z.string().optional(),
});

export const modelFamilySchema = z.object({
  id,
  name: z.string(),
  provider: z.string(),
  summary: z.string(),
});

export const modelVersionSchema = z.object({
  id,
  family: id,
  name: z.string(),
  released_on: date.optional(),
  lifecycle: z.enum(['current', 'superseded', 'retired']),
  // Successor in the same product line; drives D-011 review flags.
  successor: id.optional(),
  api_id: z.string().optional(),
  verification: z.object({
    status: z.enum(['verified', 'unverified']),
    sources: z.array(id).default([]),
    note: z.string().optional(),
  }),
  summary: z.string().optional(),
  /** Model id used to run Normie Mode tests through OpenRouter. */
  openrouter_id: z.string().optional(),
  // How this exact version is named in each imported source (D-019). Reasoning-effort
  // variants map to one version; the effort is kept as result configuration.
  source_ids: z
    .object({
      epoch: z.array(z.string()).default([]),
      epoch_index: z.string().optional(),
      modelsdev: z.string().optional(),
      lmarena: z.array(z.string()).default([]),
    })
    .default({ epoch: [], lmarena: [] }),
});

export const capabilitySchema = z.object({
  id,
  name: z.string(),
  definition: z.string(),
  why_it_matters: z.string(),
  limitations: z.array(claimSchema).default([]),
});

export const taskSchema = z.object({
  id,
  name: z.string(),
  question: z.string(),
  user_goal: z.string(),
  includes: z.string(),
  excludes: z.string(),
  success: z.string(),
  capabilities: z
    .array(z.object({ capability: id, importance: z.enum(['core', 'supporting']) }))
    .min(1),
  aliases: z.array(z.string()).default([]),
  related: z.array(id).default([]),
  assessment: z.array(claimSchema).default([]),
  can_do: z.array(claimSchema).default([]),
  checks: z.array(claimSchema).default([]),
  // Tasks outside the first slice's depth can exist as stubs.
  depth: z.enum(['full', 'stub']).default('stub'),
});

export const benchmarkSchema = z.object({
  id,
  name: z.string(),
  owner: z.string(),
  what_is_it: z.string(),
  what_it_tests: z.string(),
  example: z.string().optional(),
  why_care: z.string(),
  limits: z.array(z.string()).min(1),
  kind: z.enum(['academic', 'technical', 'agentic', 'real-world-work', 'specialist']),
  sources: z.array(id).min(1),
  versions: z.array(z.object({ id, name: z.string(), released_on: date.optional(), notes: z.string().optional() })).min(1),
  metrics: z
    .array(
      z.object({
        id,
        name: z.string(),
        plain: z.string(),
        unit: z.enum(['percent', 'score']),
        higher_is_better: z.boolean().default(true),
        primary: z.boolean().default(false),
      }),
    )
    .min(1),
  measures: z.array(z.object({ capability: id, strength: z.enum(['primary', 'secondary']) })).min(1),
  // Tasks this benchmark measures directly, optionally restricted to one subset.
  direct_tasks: z.array(z.object({ task: id, subset: z.string().optional() })).default([]),
});

export const resultSchema = z.object({
  id,
  model_version: id,
  benchmark: id,
  benchmark_version: id,
  metric: id,
  subset: z.string().optional(),
  value: z.number(),
  source: id,
  evaluated_on: date.optional(),
  published_on: date,
  configuration: z.object({
    reasoning: z.string().optional(),
    harness: z.string().optional(),
    tools: z.array(z.string()).optional(),
    notes: z.string().optional(),
  }),
  supersedes: id.optional(),
  notes: z.string().optional(),
});
export const resultFileSchema = z.object({ results: z.array(resultSchema).min(1) });

export const recommendationSchema = z.object({
  id,
  task: id,
  scope: z.enum(['best-overall', 'best-value', 'best-for-complex-work', 'best-for-autonomous-work']),
  // Absent only when the honest answer is "insufficient evidence".
  model_version: id.optional(),
  confidence: z.enum(CONFIDENCE),
  status: z.enum(['draft', 'published', 'withdrawn']),
  verdict: z.string(),
  rationale: z.array(claimSchema).min(1),
  limitations: z.array(claimSchema).default([]),
  evidence: z.array(id).default([]),
  alternatives: z.array(z.object({ model_version: id, note: z.string() })).default([]),
  reviewed_on: date,
  reviewer: z.string(),
  supersedes: id.optional(),
});

/** What a model maker says at launch (D-020). Never mixed with independent results. */
export const makerClaimSchema = z.object({
  id,
  model_version: id,
  source: id,
  stated_on: date,
  headline: z.string(),
  verification_note: z.string().optional(),
  scores: z
    .array(
      z.object({
        benchmark: z.string(),
        value: z.number(),
        unit: z.enum(['percent', 'elo']),
        setup: z.string().optional(),
      }),
    )
    .default([]),
});
export type MakerClaim = z.infer<typeof makerClaimSchema>;

/** A test as shown to readers: one plain line, who made it, and where its data comes from (D-021). */
export const testSchema = z.object({
  id,
  source: z.enum(['epoch', 'lmarena']),
  /** Epoch benchmark name, or LMArena category. */
  key: z.string(),
  title: z.string(),
  what: z.string(),
  by: z.string(),
  url: z.url(),
});
export type Test = z.infer<typeof testSchema>;

/**
 * A search intent: one need, however people phrase it (D-024). Demand comes from the
 * autocomplete snapshot; coverage says how well our pages answer it.
 */
export const intentSchema = z.object({
  id,
  /** How people search for it, e.g. "Best AI for Excel". */
  label: z.string(),
  /** Whole words or phrases; an autocomplete tail containing one belongs to this intent. */
  match: z.array(z.string()).min(1),
  /** Lower wins when a search matches more than one intent. */
  priority: z.number().default(100),
  scope: z.enum(['in', 'out']),
  out_reason: z.string().optional(),
  /** A page other than its own task page that answers it, e.g. the homepage comparison. */
  page: z.string().startsWith('/').optional(),
  coverage: z.enum(['covered', 'partial', 'gap']),
  note: z.string().optional(),
  /** A hub task this is a more specific version of; it inherits the hub's tests unless it lists its own. */
  parent: id.optional(),
  /** One plain line on what the task covers. */
  covers: z.string().optional(),
  /** Evidence for the task page, labelled by how closely each test matches the task. */
  tests: z.array(z.object({ test: id, closeness: z.enum(['direct', 'related', 'general']) })).default([]),
  /** A Normie Mode test suite that measures this task. */
  normie_test: z.string().optional(),
  /** Norm's words for this page (docs/norm-voice.md). Drafts show in preview only. */
  norm: z
    .object({
      status: z.enum(['draft', 'approved']),
      intro: z.string(),
      good_at: z.array(z.string()).default([]),
      trips_up: z.array(z.string()).default([]),
      how_to: z.array(z.string()).default([]),
    })
    .optional(),
});
export type Intent = z.infer<typeof intentSchema>;
export type Closeness = Intent['tests'][number]['closeness'];

/** Norm's reusable lines, e.g. how to read a chart (docs/norm-voice.md). */
export const normLinesSchema = z.object({
  id,
  status: z.enum(['draft', 'approved']),
  lines: z.record(z.string(), z.string()),
});
export type NormLines = z.infer<typeof normLinesSchema>;

/** Data-driven message templates: first variant whose conditions match the page's facts wins. */
export const normMessagesSchema = z.object({
  id,
  slots: z.record(
    z.string(),
    z.array(z.object({ when: z.record(z.string(), z.union([z.string(), z.boolean()])).optional(), text: z.string() })).min(1),
  ),
});
export type NormMessages = z.infer<typeof normMessagesSchema>;

export type Source = z.infer<typeof sourceSchema>;
export type ModelFamily = z.infer<typeof modelFamilySchema>;
export type ModelVersion = z.infer<typeof modelVersionSchema>;
export type Capability = z.infer<typeof capabilitySchema>;
export type Task = z.infer<typeof taskSchema>;
export type Benchmark = z.infer<typeof benchmarkSchema>;
export type Result = z.infer<typeof resultSchema>;
export type Recommendation = z.infer<typeof recommendationSchema>;
