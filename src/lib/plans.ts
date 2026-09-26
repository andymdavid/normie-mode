// Where you get a model (D-026): consumer apps and plans mapped to the model versions we compare.
import { graph } from './graph';
import { PREVIEW } from './view';
import type { AppPlans, ModelVersion, Plan } from './schema';

/** Apps whose plans may be shown: approved ones, plus drafts in preview. */
export function visibleApps(): AppPlans[] {
  return [...graph().plans.values()].filter((a) => a.status === 'approved' || PREVIEW);
}

export interface PlanAccess {
  app: AppPlans;
  plan: Plan;
  entry: Plan['models'][number];
}

/** Every visible plan that includes a model, cheapest first. */
export function plansFor(modelId: string): PlanAccess[] {
  return visibleApps()
    .flatMap((app) => app.plans.flatMap((plan) => plan.models.filter((m) => m.model === modelId).map((entry) => ({ app, plan, entry }))))
    .sort((a, b) => a.plan.price_usd - b.plan.price_usd || a.app.app.localeCompare(b.app.app));
}

/**
 * The models we compare: every current version, plus any older version a visible plan still
 * uses (e.g. what a free plan answers with), because that's what people actually get.
 */
export function comparedModels(): ModelVersion[] {
  const onPlans = new Set(visibleApps().flatMap((a) => a.plans.flatMap((p) => p.models.map((m) => m.model))));
  return [...graph().models.values()].filter((m) => m.lifecycle === 'current' || onPlans.has(m.id));
}

export const isCompared = (modelId: string) => comparedModels().some((m) => m.id === modelId);

export const ACCESS_LABEL: Record<Plan['models'][number]['access'], string> = {
  included: 'Included',
  limited: 'Limited',
  'extra-cost': 'Costs extra',
};

export function formatPrice(usd: number): string {
  return usd === 0 ? 'Free' : `$${Number.isInteger(usd) ? usd : usd.toFixed(2)}/month`;
}
