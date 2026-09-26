import { comparedModels } from './plans';
import { allTaskPages, taskPath } from './tasks';
import { graph } from './graph';
import type { SearchEntry } from './search';

/** Task pages first (their search phrases count as exact matches), then the models we compare. */
export function searchEntries(): SearchEntry[] {
  const g = graph();
  const pages = allTaskPages();
  const phrasesOf = (t: (typeof pages)[number]) => [t.label.replace(/^Best AI for /, ''), ...t.match];
  // A phrase that a more specific task also uses belongs to that task, not its hub.
  const specific = new Set(pages.filter((t) => t.parent).flatMap(phrasesOf));
  return [
    ...pages.map((t) => ({
      url: taskPath(t),
      title: t.label,
      kind: 'Task' as const,
      terms: [t.label, t.covers ?? '', ...t.match].join(' '),
      phrases: t.parent ? phrasesOf(t) : phrasesOf(t).filter((p) => !specific.has(p)),
    })),
    ...comparedModels().map((m) => ({
      url: `/models/${m.id}`,
      title: m.name,
      kind: 'Model' as const,
      terms: `${m.name} ${g.families.get(m.family)?.name ?? ''} ${g.families.get(m.family)?.provider ?? ''}`,
    })),
  ];
}
