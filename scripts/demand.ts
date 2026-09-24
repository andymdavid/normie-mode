// Demand sweep (D-024): Google autocomplete for "best AI for…"-style searches, A–Z, by region.
// Autocomplete shows which searches are common enough to be suggested and roughly how popular
// they are (earlier position = more popular). It is not search volume.
// Usage: npm run demand
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const STEMS = ['best ai for ', 'which ai is best for ', 'best ai model for ', 'chatgpt vs claude for '];
export const REGIONS = ['gb', 'us'];
const PREFIXES = ['', ...'abcdefghijklmnopqrstuvwxyz'];

interface Suggestion {
  query: string;
  stem: string;
  tail: string;
  prefix: string;
  region: string;
  position: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const suggestions: Suggestion[] = [];
let failures = 0;
for (const region of REGIONS) {
  for (const stem of STEMS) {
    for (const prefix of PREFIXES) {
      const q = stem + prefix;
      const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=${region}&q=${encodeURIComponent(q)}`;
      try {
        const res = await fetch(url);
        const [, list] = (await res.json()) as [string, string[]];
        list.forEach((query, position) => {
          if (!query.startsWith(stem.trim())) return;
          suggestions.push({ query, stem: stem.trim(), tail: query.slice(stem.length).trim(), prefix, region, position });
        });
      } catch {
        failures++;
      }
      await sleep(300); // be gentle with a public endpoint
    }
  }
}

const out = {
  meta: {
    source: 'google-autocomplete',
    name: 'Google autocomplete suggestions',
    method: `Stems × (blank + a–z) × regions; up to 10 suggestions each. Position 0 is the top suggestion.`,
    stems: STEMS.map((s) => s.trim()),
    regions: REGIONS,
    retrieved_at: new Date().toISOString(),
    requests: REGIONS.length * STEMS.length * PREFIXES.length,
    failures,
    caveat: 'Suggestions indicate that a search is common and roughly how popular it is. They are not search volumes.',
  },
  suggestions,
};
mkdirSync(join(process.cwd(), 'data'), { recursive: true });
writeFileSync(join(process.cwd(), 'data', 'demand.json'), `${JSON.stringify(out, null, 1)}\n`);
console.log(`${suggestions.length} suggestions (${new Set(suggestions.map((s) => s.tail)).size} distinct) from ${out.meta.requests} requests, ${failures} failed.`);
