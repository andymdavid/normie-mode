import { buildPrompt } from '../../evals/spreadsheet-questions/suite';
import { graph } from './graph';
import { givenAnswer, publishedRun } from './normie-tests';
import { DATASET_PUBLICATIONS } from './dataset-publication';

const SITE = 'https://normiemode.com';

export function publicDataset(suite: string) {
  const run = publishedRun(suite);
  const test = [...graph().tests.values()].find((item) => item.source === 'normie' && item.key === suite);
  if (!run || !test) throw new Error(`No published first-party test found for ${suite}`);
  const publication = DATASET_PUBLICATIONS[suite];
  const models = new Map(run.summary.models.map((model) => [model.model, model]));

  return {
    schema_version: 1,
    identifier: `normie-mode:${suite}:v${run.summary.version ?? '1'}`,
    title: test.title,
    description: test.what,
    publisher: { name: 'Normie Mode', url: SITE },
    webpage: `${SITE}/tests/${suite}`,
    methodology: `${SITE}/methodology`,
    version: run.summary.version ?? '1',
    published_on: test.published_on,
    run_ids: run.runIds,
    suggested_citation: `Normie Mode (2026), “${test.title}”, version ${run.summary.version ?? '1'}, ${SITE}/tests/${suite}.`,
    licence: publication?.licence ?? null,
    rights_note: publication?.licence
      ? 'The licence scope is stated above. Model-generated responses may also be subject to the relevant provider terms.'
      : 'Draft: reuse terms have not yet been approved. Do not treat this preview as a public licence grant.',
    limitations: [
      'Synthetic sales data pasted as text; this does not test opening Excel files, formulas or charts.',
      'One run per case; small differences may be chance.',
      'Models ran through OpenRouter with their default settings.',
    ],
    correction_history: [],
    summary: run.summary,
    cases: run.cases.map((testCase) => ({
      ...testCase,
      prompt: buildPrompt(testCase),
    })),
    results: run.answers.map((answer) => {
      const record = answer as typeof answer & {
        route?: string;
        usage?: unknown;
        provider?: string;
        finish_reason?: string;
      };
      const testCase = run.cases.find((item) => item.id === answer.case)!;
      return {
        model: answer.model,
        model_name: models.get(answer.model)?.name ?? answer.model,
        route: record.route ?? null,
        provider: record.provider ?? null,
        case: answer.case,
        run: answer.run,
        seconds: answer.seconds,
        cost_usd: answer.cost,
        finish_reason: record.finish_reason ?? null,
        usage: record.usage ?? null,
        response: answer.text,
        parsed_answers: Object.fromEntries(testCase.questions.map((question) => [question.id, givenAnswer(answer, question) ?? null])),
        score: answer.score,
      };
    }),
  };
}

const csvCell = (value: unknown) => {
  const text = value === null || value === undefined ? '' : typeof value === 'string' ? value : JSON.stringify(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export function publicDatasetCsv(suite: string) {
  const dataset = publicDataset(suite);
  const cases = new Map(dataset.cases.map((testCase) => [testCase.id, testCase]));
  const headers = ['suite', 'version', 'run_id', 'model', 'model_name', 'provider', 'case', 'run', 'question', 'question_text', 'expected_answer', 'given_answer', 'correct', 'followed_format', 'case_cost_usd', 'case_seconds'];
  const rows = dataset.results.flatMap((result) => {
    const testCase = cases.get(result.case)!;
    return testCase.questions.map((question) => [
      suite,
      dataset.version,
      dataset.run_ids.join('|'),
      result.model,
      result.model_name,
      result.provider,
      result.case,
      result.run,
      question.id,
      question.text,
      question.expected,
      result.parsed_answers[question.id],
      result.score.per_question[question.id],
      result.score.followed_format,
      result.cost_usd,
      result.seconds,
    ]);
  });
  return [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\n') + '\n';
}
