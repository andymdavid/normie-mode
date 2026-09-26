// Model and test views built from the same data as the task pages (D-028), so a model page can
// never disagree with a chart: positions come from `taskScores` and `testRows`.
import { graph } from './graph';
import { overviewRows, type OverviewRow } from './overview';
import { allTaskPages, effectiveTests, taskScores, tasksByDemand, testRows, type CLOSENESS_LABEL } from './tasks';
import type { Intent, Test } from './schema';
import type { BarDatum } from '../components/BarChart.astro';

export const ordinal = (n: number) =>
  `${n}${n % 10 === 1 && n % 100 !== 11 ? 'st' : n % 10 === 2 && n % 100 !== 12 ? 'nd' : n % 10 === 3 && n % 100 !== 13 ? 'rd' : 'th'}`;

const scoreCache = new Map<string, ReturnType<typeof taskScores>>();
const rowCache = new Map<string, BarDatum[]>();

export function cachedTaskScores(task: Intent) {
  if (!scoreCache.has(task.id)) scoreCache.set(task.id, taskScores(task));
  return scoreCache.get(task.id)!;
}

/** Rows with results for one test, best first. */
export function rankedTestRows(test: Test): BarDatum[] {
  if (!rowCache.has(test.id)) {
    rowCache.set(test.id, testRows(test).filter((r) => r.value !== undefined).sort((a, b) => b.value! - a.value!));
  }
  return rowCache.get(test.id)!;
}

export interface Position {
  position: number;
  of: number;
}

/** Where a model sits on each hub task's score chart. */
export function taskPositions(modelId: string): { task: Intent; score: string; pos: Position }[] {
  return tasksByDemand()
    .map(({ task }) => {
      const rows = cachedTaskScores(task).rows;
      const i = rows.findIndex((r) => r.id === modelId);
      return i < 0 ? undefined : { task, score: rows[i].display!, pos: { position: i + 1, of: rows.length } };
    })
    .filter((x) => x !== undefined)
    .sort((a, b) => a.pos.position - b.pos.position || b.task.priority - a.task.priority);
}

/** A model's result on every test that has one, with its position among the models we track. */
export function testPositions(modelId: string): { test: Test; display: string; pos: Position }[] {
  return [...graph().tests.values()]
    .map((test) => {
      const rows = rankedTestRows(test);
      const i = rows.findIndex((r) => r.id === modelId);
      return i < 0 ? undefined : { test, display: rows[i].display!, pos: { position: i + 1, of: rows.length } };
    })
    .filter((x) => x !== undefined)
    .sort((a, b) => a.pos.position / a.pos.of - b.pos.position / b.pos.of);
}

export function overviewRow(modelId: string): OverviewRow | undefined {
  return overviewRows().find((r) => r.model.id === modelId);
}

/** Task pages that use a test, with how closely it matches each one. */
export function tasksUsingTest(testId: string): { task: Intent; closeness: keyof typeof CLOSENESS_LABEL }[] {
  return allTaskPages()
    .filter((t) => t.tests.length || !t.parent)
    .flatMap((task) => {
      const t = effectiveTests(task).find((x) => x.test === testId);
      return t ? [{ task, closeness: t.closeness }] : [];
    });
}
