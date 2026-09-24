// Runs a Normie Mode test suite through OpenRouter with a hard budget cap.
//
//   npm run eval -- --dry-run                  estimate cost only, no API calls
//   npm run eval -- --mock                     full pipeline with fake answers, no API calls
//   npm run eval -- --budget 3                 real run (needs OPENROUTER_API_KEY, env or .env)
//   options: --suite spreadsheet-questions|unusual-transactions  --models a,b,c  --runs 1  --budget 3 (USD)
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadGraph } from '../src/lib/graph';
import * as spreadsheetQuestions from '../evals/spreadsheet-questions/suite';
import * as unusualTransactions from '../evals/unusual-transactions/suite';
import type { Suite, SuiteCase, SuiteScore } from '../evals/types';

const SUITES: Record<string, Suite<any>> = {
  [spreadsheetQuestions.SUITE_ID]: spreadsheetQuestions,
  [unusualTransactions.SUITE_ID]: unusualTransactions,
};

// Read OPENROUTER_API_KEY from a local, git-ignored .env if it isn't already set.
if (existsSync('.env')) {
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const PILOT_MODELS = ['claude-opus-5-5', 'claude-sonnet-5', 'gpt-6-sol', 'gpt-6-luna', 'gemini-3-8-flash', 'deepseek-v4-pro'];
/**
 * Allowance for the answer plus hidden thinking, used only for the up-front estimate. Measured on
 * the first pilot (2026-09-24): Claude Sonnet 5 used ~19k output tokens per case, Opus 5.5 ~7k.
 */
const EST_OUTPUT_TOKENS = 20000;
/** CSV full of numbers tokenises densely: measured ~1.8 characters per token. */
const CHARS_PER_TOKEN = 1.8;

const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const flag = (name: string) => process.argv.includes(`--${name}`);
const DRY = flag('dry-run');
const MOCK = flag('mock');
const RUNS = Number(arg('runs') ?? 1);
const BUDGET = Number(arg('budget') ?? 3);
const modelIds = (arg('models') ?? PILOT_MODELS.join(',')).split(',');
const suite = SUITES[arg('suite') ?? spreadsheetQuestions.SUITE_ID];
if (!suite) throw new Error(`Unknown suite. Choose one of: ${Object.keys(SUITES).join(', ')}`);
const { SUITE_ID, SUITE_VERSION, buildPrompt, score } = suite;
type Case = SuiteCase;

const suiteDir = join(process.cwd(), 'evals', SUITE_ID);
const cases: Case[] = readdirSync(join(suiteDir, 'cases'))
  .filter((f) => f.endsWith('.json'))
  .sort()
  .map((f) => JSON.parse(readFileSync(join(suiteDir, 'cases', f), 'utf8')));

const g = loadGraph();
const targets = modelIds.map((id) => {
  const m = g.models.get(id);
  if (!m?.openrouter_id) throw new Error(`No openrouter_id for model "${id}"`);
  return { id, name: m.name, route: m.openrouter_id };
});

interface Price { input: number; output: number }
async function prices(): Promise<Map<string, Price>> {
  const res = await fetch('https://openrouter.ai/api/v1/models');
  const data = (await res.json()).data as { id: string; pricing: { prompt: string; completion: string } }[];
  return new Map(data.map((m) => [m.id, { input: Number(m.pricing.prompt), output: Number(m.pricing.completion) }]));
}

const priceMap = await prices();
const promptTokens = cases.map((c) => buildPrompt(c).length / CHARS_PER_TOKEN);
const avgPrompt = promptTokens.reduce((a, b) => a + b, 0) / promptTokens.length;
const calls = cases.length * RUNS;
let estimate = 0;
console.log(`${suite.SUITE_TITLE} (${SUITE_ID} v${SUITE_VERSION}): ${cases.length} cases × ${RUNS} run(s) × ${targets.length} models = ${calls * targets.length} calls`);
console.log(`Prompt ≈ ${Math.round(avgPrompt)} tokens; estimate allows ${EST_OUTPUT_TOKENS} output tokens per call.\n`);
for (const t of targets) {
  const p = priceMap.get(t.route);
  if (!p) throw new Error(`OpenRouter has no model "${t.route}"`);
  const each = avgPrompt * p.input + EST_OUTPUT_TOKENS * p.output;
  estimate += each * calls;
  console.log(`  ${t.name.padEnd(22)} ${t.route.padEnd(34)} ≈ $${(each * calls).toFixed(3)}`);
}
console.log(`\nEstimated total: $${estimate.toFixed(2)} (budget cap $${BUDGET.toFixed(2)})`);
if (DRY) process.exit(0);
if (!MOCK && estimate > BUDGET) {
  console.error('Estimate exceeds the budget cap. Raise --budget or use fewer models/runs.');
  process.exit(1);
}
const key = process.env.OPENROUTER_API_KEY;
if (!MOCK && !key) {
  console.error('Set OPENROUTER_API_KEY, or use --dry-run / --mock.');
  process.exit(1);
}

interface CallResult {
  text: string;
  cost: number;
  usage?: unknown;
  provider?: string;
  finish_reason?: string;
  error?: string;
}

async function call(route: string, prompt: string, c: Case): Promise<CallResult> {
  if (MOCK) return { text: suite.mockAnswer(c), cost: 0 };
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'X-Title': 'Normie Mode tests' },
    body: JSON.stringify({ model: route, messages: [{ role: 'user', content: prompt }], usage: { include: true } }),
    signal: AbortSignal.timeout(300_000),
  });
  const body = await res.json();
  if (!res.ok) return { text: '', cost: 0, error: `HTTP ${res.status}: ${JSON.stringify(body.error ?? body).slice(0, 300)}` };
  const p = priceMap.get(route)!;
  const usage = body.usage ?? {};
  const cost = typeof usage.cost === 'number' ? usage.cost : (usage.prompt_tokens ?? 0) * p.input + (usage.completion_tokens ?? 0) * p.output;
  return { text: body.choices?.[0]?.message?.content ?? '', cost, usage, provider: body.provider, finish_reason: body.choices?.[0]?.finish_reason };
}

const runId = `${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}${MOCK ? '-mock' : ''}`;
const outDir = join(suiteDir, 'results', runId);
mkdirSync(outDir, { recursive: true });
let spent = 0;
const summary: Record<string, { name: string; route: string; scores: number[]; format_failures: number; errors: number; cost: number; seconds: number }> = {};

outer: for (const t of targets) {
  const s = (summary[t.id] = { name: t.name, route: t.route, scores: [] as number[], format_failures: 0, errors: 0, cost: 0, seconds: 0 });
  for (const c of cases) {
    for (let run = 1; run <= RUNS; run++) {
      if (spent >= BUDGET) {
        console.error(`Budget cap $${BUDGET} reached; stopping.`);
        break outer;
      }
      const started = Date.now();
      const r = await call(t.route, buildPrompt(c), c);
      const seconds = (Date.now() - started) / 1000;
      spent += r.cost;
      const sc: SuiteScore = score(c, r.text);
      Object.assign(s, {
        format_failures: s.format_failures + (sc.followed_format ? 0 : 1),
        errors: s.errors + (r.error ? 1 : 0),
        cost: s.cost + r.cost,
        seconds: s.seconds + seconds,
      });
      s.scores.push(sc.score);
      writeFileSync(
        join(outDir, `${t.id}__${c.id}__r${run}.json`),
        JSON.stringify({ suite: SUITE_ID, version: SUITE_VERSION, model: t.id, route: t.route, case: c.id, run, seconds, ...r, score: sc }, null, 1),
      );
      console.log(`${t.name.padEnd(22)} ${c.id} r${run}: ${sc.summary}, score ${sc.score}${r.error ? ` ERROR ${r.error}` : ''} · $${r.cost.toFixed(4)} · ${seconds.toFixed(0)}s`);
    }
  }
}

const table = Object.entries(summary).map(([id, s]) => ({
  model: id,
  name: s.name,
  route: s.route,
  score: s.scores.length ? Math.round(s.scores.reduce((a, b) => a + b, 0) / s.scores.length) : null,
  format_failures: s.format_failures,
  errors: s.errors,
  cost_usd: Number(s.cost.toFixed(4)),
  avg_seconds: s.scores.length ? Number((s.seconds / s.scores.length).toFixed(1)) : null,
}));
writeFileSync(join(outDir, 'summary.json'), JSON.stringify({ suite: SUITE_ID, version: SUITE_VERSION, run_id: runId, mock: MOCK, runs: RUNS, cases: cases.map((c) => c.id), total_cost_usd: Number(spent.toFixed(4)), models: table }, null, 1));
console.log(`\nSpent $${spent.toFixed(4)}. Results in ${outDir}`);
console.table(table.map(({ route: _r, model: _m, ...rest }) => rest));
