// Build gate: fails on integrity/provenance/confidence errors; prints warnings and review flags.
import { ContentError, loadGraph } from '../src/lib/graph';
import { validate } from '../src/lib/rules';

try {
  const g = loadGraph();
  const { errors, warnings, flags } = validate(g);
  const counts = [...Object.entries({ tasks: g.tasks, models: g.models, benchmarks: g.benchmarks, results: g.results, sources: g.sources, recommendations: g.recommendations })]
    .map(([k, v]) => `${v.size} ${k}`)
    .join(', ');
  console.log(`Loaded ${counts}.`);
  if (warnings.length) console.log(`\nWarnings (${warnings.length}):\n${warnings.map((w) => `  ! ${w}`).join('\n')}`);
  if (flags.length) console.log(`\nReview flags (${flags.length}):\n${flags.map((f) => `  ~ ${f.recommendation}: ${f.reason}`).join('\n')}`);
  if (errors.length) {
    console.error(`\nErrors (${errors.length}):\n${errors.map((e) => `  x ${e}`).join('\n')}`);
    process.exit(1);
  }
  console.log('\nContent valid.');
} catch (e) {
  if (e instanceof ContentError) {
    console.error(e.message);
    process.exit(1);
  }
  throw e;
}
