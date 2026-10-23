import { describe, expect, it } from 'vitest';
import { modelAnswer } from './answer-summary';

describe('answer-first evidence summaries', () => {
  it('states measured task coverage and names the strongest areas', () => {
    const result = modelAnswer('Example Model', [
      { task: { label: 'Best AI for coding' }, pos: { position: 1, of: 8 } },
      { task: { label: 'Best AI for research' }, pos: { position: 3, of: 8 } },
      { task: { label: 'Best AI for writing' }, pos: { position: 5, of: 8 } },
    ], 10);

    expect(result.answer).toBe('Example Model ranks in the top three for 2 of 3 scored tasks, including coding, research.');
    expect(result.limitation).toContain('not a claim that one model is best at everything');
  });

  it('does not manufacture a ranking when relevant evidence is missing', () => {
    const result = modelAnswer('New Model', [], 1);

    expect(result.answer).toContain('does not have enough relevant independent results');
    expect(result.limitation).toBe('Only 1 independent result is available for this exact version so far.');
  });
});
