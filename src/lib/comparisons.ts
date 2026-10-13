import { graph } from './graph';
import { EVIDENCE_STATUS_LABEL } from './overview';
import { overviewRow, taskPositions, testPositions } from './models';
import { plansFor } from './plans';
import { PREVIEW } from './view';

export interface ComparisonDefinition {
  slug: string;
  models: [string, string];
  status: 'draft' | 'published';
}

export const COMPARISONS: ComparisonDefinition[] = [
  {
    slug: 'claude-opus-5-5-vs-gemini-3-8-flash',
    models: ['claude-opus-5-5', 'gemini-3-8-flash'],
    status: 'draft',
  },
];

export function visibleComparisons(preview = PREVIEW) {
  return COMPARISONS.filter((comparison) => comparison.status === 'published' || preview);
}

export function comparisonsForModel(modelId: string, preview = PREVIEW) {
  return visibleComparisons(preview).filter((comparison) => comparison.models.includes(modelId));
}

export function isDraftComparisonRoute(pathname: string) {
  return COMPARISONS.some((comparison) => comparison.status === 'draft' && pathname === `/compare/${comparison.slug}`);
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
  const coverageSentence = additionalTasks[0] === 0 && additionalTasks[1] === 0
    ? 'Both versions can be scored on the same tasks, but Normie Mode does not combine different kinds of work into one overall winner.'
    : `${models[0].name} has ${additionalTasks[0]} additional scored task${additionalTasks[0] === 1 ? '' : 's'} and ${models[1].name} has ${additionalTasks[1]}; the uneven coverage means this is not an overall winner.`;
  const answer = `On the ${tasks.length} tasks where both exact versions can be scored, ${models[0].name} is higher on ${wins[0]} and ${models[1].name} on ${wins[1]}. ${closeSentence} ${coverageSentence}`;

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
