// The verdict on a task page (D-027): picks computed from the task score and the plans that include
// each model, so it can't disagree with the chart beneath it. The rule is published on /methodology.
import { cachedTaskScores, scoredOnVotesOnly } from './models';
import { taskFacts } from './norm';
import { plansFor, visibleApps, type PlanAccess } from './plans';
import type { AppPlans, Intent, Plan } from './schema';
import { graph } from './graph';

/** "Standard plan": what most people pay for an AI app. */
export const STANDARD_PLAN_MAX_USD = 25;
/** Task-score gap below which two picks are too close to call. */
export const TOO_CLOSE_POINTS = 5;

export type PickKind = 'best' | 'standard' | 'free';
export const PICK_LABEL: Record<PickKind, string> = {
  best: 'Best overall',
  standard: `Best for $${STANDARD_PLAN_MAX_USD} a month or less`,
  free: 'Best free',
};

export interface Option {
  modelId: string;
  name: string;
  score: number;
  position: number;
  of: number;
  /** Cheapest plan that gives you this model within the pick's budget; absent if no app we cover offers it. */
  plan?: PlanAccess;
  /** Scored only on people's votes, though other models were also scored on tests of real work. */
  votesOnly: boolean;
}

export interface Pick {
  kinds: PickKind[];
  /** One option, or two when they're too close to call (cheaper plan first). */
  options: Option[];
}

export interface PlanRow {
  app: AppPlans;
  plan: Plan;
  best?: Option;
  /** The plan's default model, when it has no score for this task. */
  unscoredDefault?: string;
}

export interface Verdict {
  picks: Pick[];
  /** What each plan gives you for this task. */
  plans: PlanRow[];
  /** How close the evidence behind the picks is, in words. */
  basis: string;
}

/** Plans where the model is part of what you pay for (not an extra charge). */
const usable = (modelId: string, maxPrice = Infinity) =>
  plansFor(modelId).filter((p) => p.entry.access !== 'extra-cost' && p.plan.price_usd <= maxPrice);

function evidenceBasis(task: Intent): string {
  const f = taskFacts(task);
  if (f.inherited) return `Based on the tests for ${f.hub}`;
  if (f.votes_only) return "Based only on people's votes";
  if (f.closeness === 'direct') return 'Based on tests of this task';
  if (f.closeness === 'related') return 'Based on tests of related skills';
  return 'Based on overall ability; nothing tests this task more closely yet';
}

export function verdict(task: Intent): Verdict | undefined {
  if (!visibleApps().length) return undefined;
  const rows = cachedTaskScores(task).rows;
  if (!rows.length) return undefined;
  const option = (i: number, maxPrice?: number): Option => ({
    modelId: rows[i].id,
    name: rows[i].label,
    score: rows[i].value!,
    position: i + 1,
    of: rows.length,
    plan: usable(rows[i].id, maxPrice)[0],
    votesOnly: scoredOnVotesOnly(task, rows[i].id),
  });

  /** The top-scoring model within a budget, plus a runner-up if it's too close to call. */
  const pickWithin = (maxPrice?: number): Option[] => {
    const idx = rows.map((_, i) => i).filter((i) => maxPrice === undefined || usable(rows[i].id, maxPrice).length);
    if (!idx.length) return [];
    const first = option(idx[0], maxPrice);
    const second = idx[1] !== undefined ? option(idx[1], maxPrice) : undefined;
    if (!second || first.score - second.score >= TOO_CLOSE_POINTS) return [first];
    return [first, second].sort((a, b) => (a.plan?.plan.price_usd ?? Infinity) - (b.plan?.plan.price_usd ?? Infinity));
  };

  const picks: Pick[] = [];
  const add = (kind: PickKind, options: Option[]) => {
    if (!options.length) return;
    const same = picks.find((p) => p.options.map((o) => o.modelId).join() === options.map((o) => o.modelId).join());
    if (same) same.kinds.push(kind);
    else picks.push({ kinds: [kind], options });
  };
  add('best', pickWithin());
  add('standard', pickWithin(STANDARD_PLAN_MAX_USD));
  add('free', pickWithin(0));

  const plans: PlanRow[] = visibleApps()
    .flatMap((app) => app.plans.map((plan) => ({ app, plan })))
    .map(({ app, plan }) => {
      const onPlan = new Set(plan.models.filter((m) => m.access !== 'extra-cost').map((m) => m.model));
      const i = rows.findIndex((r) => onPlan.has(r.id));
      const def = plan.models.find((m) => m.default)?.model;
      return {
        app,
        plan,
        best: i < 0 ? undefined : { ...option(i), plan: { app, plan, entry: plan.models.find((m) => m.model === rows[i].id)! } },
        unscoredDefault: def && !rows.some((r) => r.id === def) ? graph().models.get(def)?.name : undefined,
      };
    })
    .sort((a, b) => a.app.app.localeCompare(b.app.app) || a.plan.price_usd - b.plan.price_usd);

  return { picks, plans, basis: evidenceBasis(task) };
}

export const modelMaker = (modelId: string) => {
  const m = graph().models.get(modelId);
  return m ? (graph().families.get(m.family)?.provider ?? m.family) : '';
};

export interface PlanSummary {
  app: AppPlans;
  plan: Plan;
  /** Hub tasks where this plan's best model is in the top three. */
  top3: Intent[];
  /** Hub tasks with a verdict. */
  of: number;
  /** The plan's default model, when it has no task score anywhere yet (e.g. just released). */
  unscoredDefault?: string;
}

/** For "Already paying for one?": how each plan does across the everyday tasks. */
export function planSummaries(hubs: Intent[]): PlanSummary[] {
  const verdicts = hubs.map((task) => ({ task, v: verdict(task) })).filter((x) => x.v);
  const byPlan = new Map<Plan, PlanSummary>();
  for (const { task, v } of verdicts) {
    for (const row of v!.plans) {
      const s = byPlan.get(row.plan) ?? { app: row.app, plan: row.plan, top3: [], of: verdicts.length, unscoredDefault: row.unscoredDefault };
      if (!row.unscoredDefault) s.unscoredDefault = undefined;
      if (row.best && row.best.position <= 3) s.top3.push(task);
      byPlan.set(row.plan, s);
    }
  }
  return [...byPlan.values()].sort((a, b) => a.app.app.localeCompare(b.app.app) || a.plan.price_usd - b.plan.price_usd);
}
