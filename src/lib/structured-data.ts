export type PageSchemaType = 'WebPage' | 'Article' | 'TechArticle';

export interface StructuredListItem {
  name: string;
  url: string | URL;
}

export interface PageStructuredDataInput {
  site: string | URL;
  url: string | URL;
  name: string;
  description: string;
  type?: PageSchemaType;
  published?: string;
  modified?: string;
  about?: { name: string; url?: string | URL };
  list?: { name: string; items: StructuredListItem[] };
}

const absolute = (value: string | URL, site: string | URL) => new URL(value, site).href;

/**
 * Shared site/page schema. It deliberately omits publisher, author and reviewer
 * until the public identity records required by SEO-003 have been approved.
 */
export function pageStructuredData(input: PageStructuredDataInput) {
  const site = absolute('/', input.site);
  const url = absolute(input.url, site);
  const websiteId = `${site}#website`;
  const pageId = `${url}#webpage`;
  const type = input.type ?? 'WebPage';
  const page = {
    '@type': type === 'WebPage' ? 'WebPage' : ['WebPage', type],
    '@id': pageId,
    url,
    name: input.name,
    description: input.description,
    isPartOf: { '@id': websiteId },
    ...(input.published ? { datePublished: input.published } : {}),
    ...(input.modified ? { dateModified: input.modified } : {}),
    ...(input.about ? {
      about: {
        '@type': 'Thing',
        name: input.about.name,
        ...(input.about.url ? { url: absolute(input.about.url, site) } : {}),
      },
    } : {}),
  };

  const graph: Record<string, unknown>[] = [
    {
      '@type': 'WebSite',
      '@id': websiteId,
      url: site,
      name: 'Normie Mode',
      description: 'What AI can actually do, explained in plain English with the evidence underneath.',
      inLanguage: 'en-GB',
    },
    page,
  ];

  if (input.list?.items.length) {
    graph.push({
      '@type': 'ItemList',
      '@id': `${url}#itemlist`,
      name: input.list.name,
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      numberOfItems: input.list.items.length,
      itemListElement: input.list.items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        url: absolute(item.url, site),
      })),
    });
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}

export function serialiseStructuredData(value: unknown) {
  return JSON.stringify(value).replaceAll('<', '\\u003c');
}
