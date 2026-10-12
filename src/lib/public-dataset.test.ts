import { describe, expect, it } from 'vitest';
import { publicDataset, publicDatasetCsv } from './public-dataset';
import { score } from '../../evals/spreadsheet-questions/suite';

describe('public first-party dataset', () => {
  it('reproduces the complete published spreadsheet run without granting a draft licence', () => {
    const dataset = publicDataset('spreadsheet-questions');

    expect(dataset.identifier).toBe('normie-mode:spreadsheet-questions:v1');
    expect(dataset.licence).toBeNull();
    expect(dataset.cases).toHaveLength(5);
    expect(dataset.results).toHaveLength(30);
    expect(dataset.results.every((result) => result.response && result.score.total === 6)).toBe(true);
    expect(dataset.cases.every((testCase) => testCase.prompt.includes('End your reply with your final answers as JSON'))).toBe(true);
    for (const result of dataset.results) {
      const testCase = dataset.cases.find((item) => item.id === result.case)!;
      expect(score(testCase, result.response)).toEqual(result.score);
    }
  });

  it('flattens every model, case and question into CSV rows', () => {
    const csv = publicDatasetCsv('spreadsheet-questions');
    const lines = csv.trimEnd().split('\n');

    expect(lines).toHaveLength(181);
    expect(lines[0]).toContain('expected_answer,given_answer,correct');
    expect(csv).toContain('gpt-6-luna,GPT-6 Luna,OpenAI,case-01');
  });
});
