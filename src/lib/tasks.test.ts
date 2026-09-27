import { describe, expect, it } from 'vitest';
import { graph } from './graph';
import { imported } from './imported';
import { latestRun } from './normie-tests';
import { allTaskPages, effectiveTests, leaders, subtasksOf, taskScores, tasksByDemand } from './tasks';

describe('tasks and tests', () => {
  const { epoch, lmarena } = imported();
  const benchmarks = new Set(epoch?.benchmarks.map((b) => b.name));
  const categories = new Set(lmarena?.entries.map((e) => e.category));

  it.each([...graph().tests.values()].map((t) => [t.id, t] as const))('%s points at real data', (_, t) => {
    if (t.source === 'normie') expect(latestRun(t.key), `no saved run for ${t.key}`).toBeDefined();
    else expect(t.source === 'epoch' ? benchmarks.has(t.key) : categories.has(t.key)).toBe(true);
  });

  it('scores our own test as direct evidence on the Excel page', () => {
    const excel = graph().intents.get('excel-spreadsheets')!;
    expect(taskScores(excel).closeness).toBe('direct');
    expect(leaders(excel).used.some((t) => t.source === 'normie')).toBe(true);
  });

  it.each(tasksByDemand().map(({ task }) => [task.id, task] as const))('%s has a task page with evidence', (_, task) => {
    expect(task.covers).toBeTruthy();
    expect(task.tests.length).toBeGreaterThan(0);
    expect(leaders(task).leaders.length).toBeGreaterThan(0);
  });

  it.each(allTaskPages().filter((t) => t.parent).map((t) => [t.id, t] as const))('%s inherits or has evidence and ranks models', (_, task) => {
    expect(effectiveTests(task).length).toBeGreaterThan(0);
    expect(leaders(task).leaders.length).toBeGreaterThan(0);
  });

  it('gives most hubs some specific tasks and counts their demand in the hub', () => {
    const hubs = tasksByDemand();
    expect(hubs.filter((h) => subtasksOf(h.task.id).length > 0).length).toBeGreaterThanOrEqual(10);
    expect(allTaskPages().length).toBe(hubs.length + hubs.reduce((n, h) => n + subtasksOf(h.task.id).length, 0));
  });

  it('never labels inherited evidence as testing the specific task directly', () => {
    const vibe = graph().intents.get('vibe-coding')!;
    expect(effectiveTests(vibe).every((t) => t.closeness !== 'direct')).toBe(true);
    expect(taskScores(vibe).closeness).toBe('related');
  });

  it('bases the score on close evidence only when it exists', () => {
    const coding = graph().intents.get('coding')!;
    expect(taskScores(coding).closeness).toBe('direct');
    const planning = graph().intents.get('planning-personal')!;
    expect(taskScores(planning).closeness).toBe('related');
  });
});

describe("task score coverage (D-029)", () => {
  it("never scores a model on people's votes alone when the task has tests of real work", async () => {
    const { scoredOnVotesOnly } = await import('./models');
    const { allTaskPages, taskScores } = await import('./tasks');
    for (const task of allTaskPages()) for (const r of taskScores(task).rows) expect(scoredOnVotesOnly(task, r.id), `${task.id}: ${r.id}`).toBe(false);
  });
});
