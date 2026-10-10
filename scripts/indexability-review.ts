import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditSite } from './seo-audit';
import { graph } from '../src/lib/graph';

const ORIGIN = 'https://normiemode.com';
const OUTPUT = resolve('docs/seo/indexability-review.csv');

function csv(value: string | number | boolean) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function indexabilityRows(directory = resolve('dist')) {
  const audit = auditSite(directory);
  if (audit.errors.length) throw new Error(`SEO audit must pass before indexability review:\n${audit.errors.join('\n')}`);
  const g = graph();
  const inbound = new Map<string, number>();
  for (const page of audit.pages) {
    for (const link of page.internalLinks) {
      const path = new URL(link, ORIGIN).pathname;
      inbound.set(path, (inbound.get(path) ?? 0) + 1);
    }
  }

  return audit.pages.map((page) => {
    const parts = page.route.split('/').filter(Boolean);
    const family = parts[0] ?? 'home';
    let parent = '';
    let testCount = 0;
    let uniqueTests = 0;
    let reviewedGuidance = false;
    let directTestCount = 0;
    let graphResultRecords = 0;
    let disposition = 'index';
    let reason = 'Distinct public destination with substantive, inspectable content.';

    if (family === 'best-ai-for' && parts[1]) {
      const intent = g.intents.get(parts[1]);
      parent = intent?.parent ?? '';
      testCount = intent?.tests.length ?? 0;
      directTestCount = intent?.tests.filter((test) => test.closeness === 'direct').length ?? 0;
      reviewedGuidance = intent?.norm?.status === 'approved';
      if (intent?.parent) {
        const parentTests = new Set(g.intents.get(intent.parent)?.tests.map((test) => test.test) ?? []);
        uniqueTests = intent.tests.filter((test) => !parentTests.has(test.test)).length;
        disposition = 'noindex-follow';
        reason = uniqueTests
          ? 'Child task has no unique direct test; its task-specific guidance is draft/hidden, and additional evidence is related rather than direct.'
          : 'Child task repeats its parent evidence while its task-specific guidance remains draft/hidden.';
      }
    } else if (family === 'models' && parts[1]) {
      const model = g.models.get(parts[1]);
      graphResultRecords = [...g.results.values()].filter((result) => result.model_version === parts[1]).length;
      if (page.words < 200) {
        disposition = 'noindex-follow';
        reason = `Historical model page renders only ${page.words} main-content words and no useful version-specific evidence beyond replacement/availability context.`;
      } else {
        reason = model?.lifecycle === 'current'
          ? 'Current exact model version with rankings, cost/access context and evidence.'
          : 'Historical exact model version retains substantive version-specific evidence.';
      }
    } else if (family === 'benchmarks' && parts[1]) {
      graphResultRecords = [...g.results.values()].filter((result) => result.benchmark === parts[1]).length;
      reason = 'Distinct benchmark explainer with methodology, task relationship and model results.';
    } else if (family === 'tests') {
      reason = 'First-party test page with inspectable questions, methodology and results.';
    } else if (page.route === '/' || !parts[1]) {
      reason = 'Core navigation, methodology or collection page with a distinct discovery role.';
    }

    return {
      url: `${ORIGIN}${page.route}`,
      family,
      parent,
      words: page.words,
      inbound_internal_links: inbound.get(page.route) ?? 0,
      test_count: testCount,
      unique_tests_vs_parent: uniqueTests,
      public_reviewed_guidance: reviewedGuidance,
      direct_test_count: directTestCount,
      graph_result_records: graphResultRecords,
      proposed_disposition: disposition,
      reason,
      approval: disposition === 'index' ? 'reviewed-by-rule; owner review pending' : 'product-owner decision required',
    };
  });
}

export function writeIndexabilityReview(directory = resolve('dist'), output = OUTPUT) {
  const rows = indexabilityRows(directory);
  const headers = Object.keys(rows[0]);
  const content = [headers.join(','), ...rows.map((row) => headers.map((header) => csv(row[header as keyof typeof row])).join(','))].join('\n') + '\n';
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, content);
  return rows;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const rows = writeIndexabilityReview();
  const counts = rows.reduce<Record<string, number>>((result, row) => {
    result[row.proposed_disposition] = (result[row.proposed_disposition] ?? 0) + 1;
    return result;
  }, {});
  console.log(`Wrote ${rows.length} URL dispositions to ${OUTPUT}: ${Object.entries(counts).map(([name, count]) => `${name} ${count}`).join(', ')}.`);
}
