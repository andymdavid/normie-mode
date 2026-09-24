import type { Graph } from './graph';
import type { SearchEntry } from './search';

export function searchEntries(g: Graph): SearchEntry[] {
  return [
    ...[...g.tasks.values()].map((t) => ({
      url: `/tasks/${t.id}`,
      title: t.question,
      kind: 'Task' as const,
      terms: [t.name, t.question, t.includes, ...t.aliases].join(' '),
    })),
    ...[...g.capabilities.values()].map((c) => ({ url: `/capabilities/${c.id}`, title: c.name, kind: 'Skill' as const, terms: c.name })),
    ...[...g.models.values()]
      .filter((m) => m.lifecycle === 'current')
      .map((m) => ({ url: `/models/${m.id}`, title: m.name, kind: 'Model' as const, terms: `${m.name} ${g.families.get(m.family)?.provider ?? ''}` })),
    ...[...g.benchmarks.values()].map((b) => ({ url: `/benchmarks/${b.id}`, title: `${b.name} explained`, kind: 'Benchmark' as const, terms: b.name })),
  ];
}
