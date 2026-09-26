import { describe, expect, it } from 'vitest';
import { imported } from './imported';
import { overviewRows, picks } from './overview';
import { comparedModels } from './plans';

describe('overview data (N-002)', () => {
  const rows = overviewRows();

  it('covers every compared model with price data from models.dev', () => {
    expect(rows).toHaveLength(comparedModels().length);
    for (const r of rows) expect(r.costPer1000, r.model.id).toBeDefined();
  });

  it('never marks a model as independently tested without independent results', () => {
    for (const r of rows) if (r.status === 'tested') expect(r.independentTests, r.model.id).toBeGreaterThan(0);
  });

  it('keeps the source model identifier on every imported result', () => {
    for (const r of imported().epoch?.results ?? []) expect(r.source_model).toBeTruthy();
  });

  it('produces the four quick picks', () => {
    expect(picks(rows).map((p) => p.label)).toEqual(['Most capable overall', "People's favourite", 'Best value', 'Newest']);
  });
});
