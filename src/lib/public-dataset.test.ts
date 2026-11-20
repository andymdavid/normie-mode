import { describe, expect, it } from 'vitest';
import { publicDataset, publicDatasetCsv } from './public-dataset';
import { parse } from 'csv-parse/sync';
import { score } from '../../evals/spreadsheet-questions/suite';

describe('public first-party dataset', () => {
  it('reproduces the complete published spreadsheet run with the approved scoped licence', () => {
    const dataset = publicDataset('spreadsheet-questions');

    expect(dataset.identifier).toBe('normie-mode:spreadsheet-questions:v1');
    expect(dataset.licence?.url).toBe('https://creativecommons.org/licenses/by/4.0/');
    expect(dataset.licence?.scope).toContain('Raw model-generated responses');
    expect(dataset.cases).toHaveLength(5);
    expect(dataset.results.length).toBeGreaterThan(0);
    expect(dataset.results.every((result) => result.response && result.score.total === 6)).toBe(true);
    expect(dataset.cases.every((testCase) => testCase.prompt.includes('End your reply with your final answers as JSON'))).toBe(true);
    for (const result of dataset.results) {
      const testCase = dataset.cases.find((item) => item.id === result.case)!;
      expect(score(testCase, result.response)).toEqual(result.score);
    }
  });

  it('flattens every model, case and question into CSV rows', () => {
    const csv = publicDatasetCsv('spreadsheet-questions');
    const rows = parse(csv, {columns:true}) as Record<string,string>[];
    const dataset = publicDataset('spreadsheet-questions');
    const expected = dataset.results.flatMap(result =>
      dataset.cases.find(testCase => testCase.id === result.case)!.questions
        .map(question => `${result.model}|${result.case}|${result.run}|${question.id}`),
    );
    expect(rows.map(row => `${row.model}|${row.case}|${row.run}|${row.question}`).sort()).toEqual(expected.sort());
    expect(rows[0]).toHaveProperty('expected_answer');
    expect(rows[0]).toHaveProperty('given_answer');
    expect(rows[0]).toHaveProperty('correct');
    expect(csv).toContain('gpt-6-luna,GPT-6 Luna,OpenAI,case-01');
  });
});
