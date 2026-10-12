import { graph } from './graph';
import { EVIDENCE_STATUS_LABEL } from './overview';
import { overviewRow, taskPositions, testPositions } from './models';
import { plansFor } from './plans';

export interface ComparisonDefinition {
  slug: string;
  models: [string, string];
  status: 'draft' | 'published';
}

export const COMPARISON_PREVIEW = process.env.NORMIE_COMPARISON_PREVIEW === '1';

export const COMPARISONS: ComparisonDefinition[] = [
  {
    slug: 'claude-opus-5-5-vs-gemini-3-8-flash',
    models: ['claude-opus-5-5', 'gemini-3-8-flash'],
    status: 'draft',
  },
];

export function visibleComparisons() {
  return COMPARISONS.filter((comparison) => comparison.status === 'published' || COMPARISON_PREVIEW);
}

export function comparisonData(definition: ComparisonDefinition) {
  const g = graph();
  const models = definition.models.map((id) => g.models.get(id)!);
  const overview = definition.models.map((id) => overviewRow(id)!);
  const positions = definition.models.map((id) => taskPositions(id));
  const leftTasks = new Map(positions[0].map((item) => [item.task.id, item]));
  const rightTasks = new Map(positions[1].map((item) => [item.task.id, item]));
  const tasks = [...leftTasks.values()]
    .filter((item) => rightTasks.has(item.task.id))
    .map((left) => {
      const right = rightTasks.get(left.task.id)!;
      const scores: [number, number] = [Number(left.score), Number(right.score)];
      const difference = Math.abs(scores[0] - scores[1]);
      return {
        task: left.task,
        scores,
        positions: [left.pos, right.pos] as const,
        close: difference <= 5,
        leader: difference === 0 ? undefined : scores[0] > scores[1] ? 0 as const : 1 as const,
      };
    });

  const testPositionsByModel = definition.models.map((id) => testPositions(id));
  const testSets = testPositionsByModel.map((items) => new Map(items.map((item) => [item.test.id, item])));
  const tests = [...testSets[0].values()]
    .filter((item) => testSets[1].has(item.test.id))
    .map((left) => ({ test: left.test, results: [left, testSets[1].get(left.test.id)!] as const }));

  const wins = [0, 1].map((side) => tasks.filter((task) => !task.close && task.leader === side).length) as [number, number];
  const close = tasks.filter((task) => task.close).length;
  const additionalTasks = positions.map((items) => items.length - tasks.length) as [number, number];
  const additionalTests = testPositionsByModel.map((items, side) => items.filter((item) => !testSets[side === 0 ? 1 : 0].has(item.test.id)).length) as [number, number];
  const closeSentence = close === 0 ? 'None is within five points.' : `${close} task${close === 1 ? ' is' : 's are'} within five points.`;
  const answer = `On the ${tasks.length} tasks where both exact versions can be scored, ${models[0].name} is higher on ${wins[0]} and ${models[1].name} on ${wins[1]}. ${closeSentence} ${models[1].name} has scores for ${additionalTasks[1]} additional tasks where ${models[0].name} cannot yet be scored, so this is not an overall winner.`;

  return {
    definition,
    models,
    overview,
    tasks,
    tests,
    plans: definition.models.map(plansFor),
    coverage: definition.models.map((_, side) => ({
      tasks: positions[side].length,
      tests: testPositionsByModel[side].length,
      additionalTasks: additionalTasks[side],
      additionalTests: additionalTests[side],
    })) as [{ tasks: number; tests: number; additionalTasks: number; additionalTests: number }, { tasks: number; tests: number; additionalTasks: number; additionalTests: number }],
    answer,
    evidenceLabels: overview.map((row) => EVIDENCE_STATUS_LABEL[row.status]),
  };
}
