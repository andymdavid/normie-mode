import { describe, expect, it } from 'vitest';
import { graph } from './graph';
import { demandByIntent, loadDemand, matchIntent } from './demand';

const intents = [...graph().intents.values()].sort((a, b) => a.priority - b.priority);

describe('search intents', () => {
  it.each([
    ['excel data analysis', 'data-analysis'],
    ['excel', 'excel-spreadsheets'],
    ['making ppt', 'presentations'],
    ['resume writing', 'resume-writing'],
    ['language learning', 'language-learning'],
    ['translation', 'translation-languages'],
    ['image generation free', 'images-video-design'],
    ['vibe coding', 'vibe-coding'],
    ['website design', 'website-building'],
    ['coding', 'coding'],
    ['zoom meeting notes', 'note-taking'],
    ['legal work', 'legal'],
  ])('"%s" is grouped as %s', (tail, id) => {
    expect(matchIntent(tail, intents)?.id).toBe(id);
  });

  it('does not match inside other words', () => {
    expect(matchIntent('uitar lessons', intents)?.id).not.toBe('images-video-design');
  });
});

describe('demand snapshot', () => {
  const snapshot = loadDemand();

  it('exists and has no failed requests', () => {
    expect(snapshot?.suggestions.length).toBeGreaterThan(500);
    expect(snapshot?.meta.failures).toBe(0);
  });

  it('groups almost all of the signal into intents', () => {
    expect(demandByIntent(snapshot).matchedShare).toBeGreaterThan(90);
  });

  it('gives every in-scope intent some demand', () => {
    for (const i of demandByIntent(snapshot).intents.filter((x) => x.intent.scope === 'in')) {
      expect(i.appearances, i.intent.id).toBeGreaterThan(0);
    }
  });
});
