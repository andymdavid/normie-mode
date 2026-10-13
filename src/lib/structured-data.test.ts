import { describe, expect, it } from 'vitest';
import { pageStructuredData, serialiseStructuredData } from './structured-data';

describe('pageStructuredData', () => {
  it('derives a canonical WebSite and WebPage without unsupported identity claims', () => {
    const result = pageStructuredData({
      site: 'https://normiemode.com',
      url: '/models/claude-sonnet-5-5',
      name: 'Claude Sonnet 5.5: tests, price & access · Normie Mode',
      description: 'Model evidence.',
      about: { name: 'Claude Sonnet 5.5' },
    });
    expect(result['@graph']).toEqual(expect.arrayContaining([
      expect.objectContaining({ '@type': 'WebSite', '@id': 'https://normiemode.com/#website' }),
      expect.objectContaining({
        '@type': 'WebPage',
        '@id': 'https://normiemode.com/models/claude-sonnet-5-5#webpage',
        isPartOf: { '@id': 'https://normiemode.com/#website' },
        about: { '@type': 'Thing', name: 'Claude Sonnet 5.5' },
      }),
    ]));
    expect(JSON.stringify(result)).not.toMatch(/Organization|Person|publisher|author|reviewer/);
  });

  it('adds article dates and an ItemList that exactly preserves visible order', () => {
    const result = pageStructuredData({
      site: 'https://normiemode.com/',
      url: '/benchmarks/example',
      name: 'Example benchmark · Normie Mode',
      description: 'What the test checks.',
      type: 'TechArticle',
      published: '2026-09-24',
      modified: '2026-10-12',
      list: {
        name: 'How the models did',
        items: [
          { name: 'Model A', url: '/models/a' },
          { name: 'Model B', url: '/models/b' },
        ],
      },
    });
    expect(result['@graph'][1]).toMatchObject({
      '@type': ['WebPage', 'TechArticle'],
      datePublished: '2026-09-24',
      dateModified: '2026-10-12',
    });
    expect(result['@graph'][2]).toMatchObject({
      '@type': 'ItemList',
      numberOfItems: 2,
      itemListElement: [
        { position: 1, name: 'Model A', url: 'https://normiemode.com/models/a' },
        { position: 2, name: 'Model B', url: 'https://normiemode.com/models/b' },
      ],
    });
  });

  it('escapes less-than signs before embedding JSON in HTML', () => {
    expect(serialiseStructuredData({ value: '</script>' })).not.toContain('</script>');
  });
});
