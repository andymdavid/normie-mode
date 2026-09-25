// Loads canonical YAML content into an indexed graph. Used by the site and the validator.
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse } from 'yaml';
import type { z } from 'astro/zod';
import {
  benchmarkSchema,
  capabilitySchema,
  modelFamilySchema,
  makerClaimSchema,
  intentSchema,
  normLinesSchema,
  testSchema,
  modelVersionSchema,
  recommendationSchema,
  resultFileSchema,
  sourceSchema,
  taskSchema,
  type Benchmark,
  type Capability,
  type ModelFamily,
  type MakerClaim,
  type Intent,
  type NormLines,
  type Test,
  type ModelVersion,
  type Recommendation,
  type Result,
  type Source,
  type Task,
} from './schema';

export interface Graph {
  sources: Map<string, Source>;
  families: Map<string, ModelFamily>;
  models: Map<string, ModelVersion>;
  capabilities: Map<string, Capability>;
  tasks: Map<string, Task>;
  benchmarks: Map<string, Benchmark>;
  results: Map<string, Result>;
  recommendations: Map<string, Recommendation>;
  claims: Map<string, MakerClaim>;
  tests: Map<string, Test>;
  intents: Map<string, Intent>;
  norm: Map<string, NormLines>;
  /** Result ID -> file it was defined in, for error messages. */
  origins: Map<string, string>;
}

export class ContentError extends Error {
  constructor(public problems: string[]) {
    super(`Content failed to load:\n${problems.map((p) => `  - ${p}`).join('\n')}`);
  }
}

function yamlFiles(dir: string): string[] {
  try {
    return readdirSync(dir)
      .filter((f) => f.endsWith('.yaml'))
      .sort()
      .map((f) => join(dir, f));
  } catch {
    return [];
  }
}

function formatIssues(file: string, error: z.ZodError): string[] {
  return error.issues.map((i) => `${file}: ${i.path.join('.') || '(root)'}: ${i.message}`);
}

export function loadGraph(root = join(process.cwd(), 'content')): Graph {
  const problems: string[] = [];
  const origins = new Map<string, string>();
  const rel = (f: string) => relative(process.cwd(), f);

  function loadEach<T extends { id: string }>(dir: string, schema: z.ZodType<T>): Map<string, T> {
    const out = new Map<string, T>();
    for (const file of yamlFiles(join(root, dir))) {
      const parsed = schema.safeParse(parse(readFileSync(file, 'utf8')));
      if (!parsed.success) {
        problems.push(...formatIssues(rel(file), parsed.error));
        continue;
      }
      const expected = file.split('/').pop()!.replace(/\.yaml$/, '');
      if (parsed.data.id !== expected) problems.push(`${rel(file)}: id "${parsed.data.id}" must match filename`);
      if (out.has(parsed.data.id)) problems.push(`${rel(file)}: duplicate id "${parsed.data.id}"`);
      out.set(parsed.data.id, parsed.data);
      origins.set(`${dir}:${parsed.data.id}`, rel(file));
    }
    return out;
  }

  const results = new Map<string, Result>();
  for (const file of yamlFiles(join(root, 'results'))) {
    const parsed = resultFileSchema.safeParse(parse(readFileSync(file, 'utf8')));
    if (!parsed.success) {
      problems.push(...formatIssues(rel(file), parsed.error));
      continue;
    }
    for (const r of parsed.data.results) {
      if (results.has(r.id)) problems.push(`${rel(file)}: duplicate result id "${r.id}"`);
      results.set(r.id, r);
      origins.set(`results:${r.id}`, rel(file));
    }
  }

  const graph: Graph = {
    sources: loadEach('sources', sourceSchema),
    families: loadEach('model-families', modelFamilySchema),
    models: loadEach('models', modelVersionSchema),
    capabilities: loadEach('capabilities', capabilitySchema),
    tasks: loadEach('tasks', taskSchema),
    benchmarks: loadEach('benchmarks', benchmarkSchema),
    results,
    recommendations: loadEach('recommendations', recommendationSchema),
    claims: loadEach('claims', makerClaimSchema),
    tests: loadEach('tests', testSchema),
    intents: loadEach('intents', intentSchema),
    norm: loadEach('norm', normLinesSchema),
    origins,
  };
  if (problems.length) throw new ContentError(problems);
  return graph;
}

let cached: Graph | undefined;
/** Memoised graph for page rendering; the validator loads fresh. */
export function graph(): Graph {
  return (cached ??= loadGraph());
}
