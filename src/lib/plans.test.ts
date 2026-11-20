import { describe, expect, it } from 'vitest';
import { graph } from './graph';
import { comparedModels, plansFor, visibleApps } from './plans';
import { PREVIEW } from './view';

describe('apps and plans (D-026)', () => {
  const g = graph();

  it('runs with drafts visible, so these checks cover every plan', () => {
    expect(PREVIEW).toBe(true);
    expect(visibleApps()).toHaveLength(g.plans.size);
  });

  it('compares every current model and every model a plan uses', () => {
    const ids = new Set(comparedModels().map((m) => m.id));
    for (const m of g.models.values()) if (m.lifecycle === 'current') expect(ids.has(m.id), m.id).toBe(true);
    for (const app of g.plans.values()) for (const p of app.plans) for (const e of p.models) expect(ids.has(e.model), `${app.id}/${p.id}: ${e.model}`).toBe(true);
  });

  it("doesn't compare old versions no plan uses", () => {
    const onPlans = new Set([...g.plans.values()].flatMap((a) => a.plans.flatMap((p) => p.models.map((m) => m.model))));
    for (const m of comparedModels()) expect(m.lifecycle === 'current' || onPlans.has(m.id), m.id).toBe(true);
  });

  it('allows at most one sourced default; access alone does not establish a default', () => {
    for (const app of g.plans.values()) for (const p of app.plans) expect(p.models.filter((m) => m.default).length, `${app.id}/${p.id}`).toBeLessThanOrEqual(1);
  });

  it('does not promise a fixed default for Gemini free automatic selection', () => {
    const free = g.plans.get('gemini')!.plans.find(p => p.id === 'free')!;
    expect(free.models.some(m => m.default)).toBe(false);
    expect(free.models[0].access).toBe('limited');
    expect(free.models[0].where).toContain('Automatic model selection');
  });

  it('lists the plans for a model cheapest first', () => {
    for (const m of comparedModels()) {
      const prices = plansFor(m.id).map((x) => x.plan.price_usd);
      expect(prices, m.id).toEqual([...prices].sort((a, b) => a - b));
    }
  });
});
