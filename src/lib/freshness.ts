import { graph } from './graph';
import { imported } from './imported';

const DATE_KEYS = new Set(['published_on', 'retrieved_on', 'released_on', 'evaluated_on', 'reviewed_on', 'stated_on', 'checked_on', 'as_of']);

function dates(value: unknown, key?: string): string[] {
  if (typeof value === 'string') {
    if (key === 'retrieved_at') return /^\d{4}-\d{2}-\d{2}/.test(value) ? [value.slice(0, 10)] : [];
    return key && DATE_KEYS.has(key) && /^\d{4}-\d{2}-\d{2}$/.test(value) ? [value] : [];
  }
  if (Array.isArray(value)) return value.flatMap((item) => dates(item));
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([childKey, child]) => dates(child, childKey));
}

function latest(...values: unknown[]) {
  const found = values.flatMap((value) => dates(value)).sort();
  return found.at(-1);
}

function snapshotFor(source: string | undefined) {
  const snapshots = imported();
  if (source === 'epoch') return snapshots.epoch;
  if (source === 'lmarena') return snapshots.lmarena;
  return undefined;
}

/**
 * Return the newest dated evidence dependency rendered by a public route. These are source,
 * retrieval, release, evaluation and human-review dates—not build timestamps—so an unchanged
 * rebuild does not manufacture freshness. Editorial copy without a recorded date is deliberately
 * excluded until its content schema carries one.
 */
export function routeLastmod(pathname: string) {
  const g = graph();
  const snapshots = imported();
  const snapshotDate = latest(snapshots);
  const parts = pathname.split('/').filter(Boolean);

  if (parts[0] === 'models' && parts[1]) {
    const model = g.models.get(parts[1]);
    const family = model ? g.families.get(model.family) : undefined;
    const results = [...g.results.values()].filter((result) => result.model_version === parts[1]);
    const claims = [...g.claims.values()].filter((claim) => claim.model_version === parts[1]);
    const sources = model?.verification.sources?.map((id) => g.sources.get(id));
    const plans = [...g.plans.values()].filter((plan) => plan.plans.some((tier) => tier.models.some((entry) => entry.model === parts[1])));
    return latest(model, family, results, claims, sources, plans, model?.lifecycle === 'current' ? snapshots : undefined);
  }

  if (parts[0] === 'benchmarks' && parts[1]) {
    const test = g.tests.get(parts[1]);
    const results = [...g.results.values()].filter((result) => result.benchmark === parts[1]);
    const sources = results.map((result) => g.sources.get(result.source));
    return latest(test, results, sources, snapshotFor(test?.source));
  }

  if (parts[0] === 'best-ai-for' && parts[1]) {
    const intent = g.intents.get(parts[1]);
    const testIds = new Set(intent?.tests.map((test) => test.test) ?? []);
    const results = [...g.results.values()].filter((result) => testIds.has(result.benchmark));
    const tests = [...testIds].map((id) => g.tests.get(id));
    return latest(intent, tests, results, snapshots);
  }

  if (parts[0] === 'tests' && parts[1]) {
    const test = g.tests.get(parts[1]);
    return latest(test, [...g.results.values()].filter((result) => result.benchmark === parts[1]), snapshotFor(test?.source));
  }

  if (pathname === '/models') return latest([...g.models.values()], [...g.results.values()], snapshots);
  if (pathname === '/benchmarks') return latest([...g.tests.values()], [...g.results.values()], snapshots);
  if (pathname === '/best-ai-for') return latest([...g.intents.values()], [...g.results.values()], snapshots);
  if (pathname === '/' || pathname === '/methodology') return latest(g, snapshots);
  return snapshotDate;
}
