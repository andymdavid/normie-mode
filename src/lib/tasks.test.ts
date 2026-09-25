import { describe, expect, it } from 'vitest';
import { graph } from './graph';
import { imported } from './imported';
import { leaders, taskScores, tasksByDemand } from './tasks';

describe('tasks and tests', () => {
  const { epoch, lmarena } = imported();
  const benchmarks = new Set(epoch?.benchmarks.map((b) => b.name));
  const categories = new Set(lmarena?.entries.map((e) => e.category));

  it.each([...graph().tests.values()].map((t) => [t.id, t] as const))('%s points at real imported data', (_, t) => {
    expect(t.source === 'epoch' ? benchmarks.has(t.key) : categories.has(t.key)).toBe(true);
  });

  it.each(tasksByDemand().map(({ task }) => [task.id, task] as const))('%s has a task page with evidence', (_, task) => {
    expect(task.covers).toBeTruthy();
    expect(task.tests.length).toBeGreaterThan(0);
    expect(leaders(task).leaders.length).toBeGreaterThan(0);
  });

  it('bases the score on close evidence only when it exists', () => {
    const coding = graph().intents.get('coding')!;
    expect(taskScores(coding).closeness).toBe('direct');
    const planning = graph().intents.get('planning-personal')!;
    expect(taskScores(planning).closeness).toBe('related');
  });
});
