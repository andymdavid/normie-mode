// Normie Mode test: "Spot unusual transactions" (micro-pilot, see docs/evals/unusual-transactions.md).
// Cases are generated from fixed seeds so every model sees identical inputs, and every planted
// problem is known, so scoring needs no human or AI judge.

import type { SuiteScore } from '../types';

export const SUITE_ID = 'unusual-transactions';
export const SUITE_VERSION = '1';
export const SUITE_TITLE = 'Spot unusual transactions';

export type ProblemType = 'duplicate' | 'outlier' | 'unapproved-supplier' | 'missing-approval' | 'out-of-period';
export const PROBLEM_LABEL: Record<ProblemType, string> = {
  duplicate: 'Paid twice',
  outlier: 'Far bigger than usual for that supplier',
  'unapproved-supplier': 'Supplier not on the approved list',
  'missing-approval': 'Over £500 without an approval code',
  'out-of-period': 'Dated outside the month',
};

export interface Row {
  id: string;
  date: string;
  supplier: string;
  category: string;
  amount: number;
  approval_code: string;
  submitted_by: string;
}

export interface Planted {
  type: ProblemType;
  /** Flagging any of these ids counts as finding the problem (a duplicate pair can be flagged either way). */
  accept: string[];
}

export interface Case {
  suite: string;
  version: string;
  id: string;
  seed: number;
  month: string;
  rows: Row[];
  planted: Planted[];
}

interface Supplier {
  name: string;
  category: string;
  min: number;
  max: number;
}

const SUPPLIERS: Supplier[] = [
  { name: 'Kettle & Co Catering', category: 'Meals', min: 25, max: 180 },
  { name: 'Northgate Stationers', category: 'Office supplies', min: 12, max: 90 },
  { name: 'Brightline IT Services', category: 'IT', min: 250, max: 900 },
  { name: 'Swift Couriers', category: 'Postage', min: 8, max: 60 },
  { name: 'Harbour Cleaning Ltd', category: 'Cleaning', min: 180, max: 260 },
  { name: 'CloudDesk Software', category: 'Software', min: 30, max: 120 },
  { name: 'Metro Rail', category: 'Travel', min: 15, max: 140 },
  { name: 'Parkside Print', category: 'Printing', min: 40, max: 350 },
  { name: 'Greenleaf Plants', category: 'Office', min: 20, max: 75 },
  { name: 'Summit Hotels', category: 'Travel', min: 90, max: 420 },
  { name: 'Ledger Accounting Services', category: 'Professional fees', min: 400, max: 1200 },
  { name: 'Fibrenet Broadband', category: 'Utilities', min: 55, max: 65 },
];
// Lookalikes are deliberate: real unapproved suppliers often resemble approved ones.
const UNAPPROVED: Supplier[] = [
  { name: 'Northgate Stationery Supplies', category: 'Office supplies', min: 20, max: 90 },
  { name: 'Kettle and Co Events', category: 'Meals', min: 60, max: 240 },
  { name: 'QuickPay Solutions', category: 'Professional fees', min: 90, max: 300 },
  { name: 'Brightline Tech Ltd', category: 'IT', min: 120, max: 380 },
  { name: 'Apex Consulting Group', category: 'Professional fees', min: 150, max: 450 },
];
const STAFF = ['A. Patel', 'J. Morgan', 'S. Chen', 'R. Okafor', 'L. Byrne'];
const MONTHS = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05'];
export const APPROVAL_THRESHOLD = 500;
export const APPROVED_SUPPLIERS = SUPPLIERS.map((s) => s.name);

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const daysIn = (month: string) => new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)).getUTCDate();
const iso = (month: string, day: number) => `${month}-${String(day).padStart(2, '0')}`;
function shiftMonth(month: string, delta: number): string {
  const d = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

export function generateCase(n: number): Case {
  const seed = 1000 + n;
  const rand = mulberry32(seed);
  const pick = <T>(xs: T[]) => xs[Math.floor(rand() * xs.length)];
  const between = (lo: number, hi: number) => lo + rand() * (hi - lo);
  const money = (v: number) => Math.round(v * 100) / 100;
  const code = () => `AP-${String(Math.floor(between(1000, 9999)))}`;
  const month = MONTHS[(n - 1) % MONTHS.length];
  const days = daysIn(month);

  type Draft = Omit<Row, 'id'> & { key: number };
  let key = 0;
  const drafts: Draft[] = [];
  const seen = new Set<string>();
  const normal = (s: Supplier): Draft => {
    for (;;) {
      const amount = money(between(s.min, s.max));
      const sig = `${s.name}|${amount}`;
      if (seen.has(sig)) continue;
      seen.add(sig);
      return {
        key: key++,
        date: iso(month, 1 + Math.floor(rand() * days)),
        supplier: s.name,
        category: s.category,
        amount,
        approval_code: amount > APPROVAL_THRESHOLD ? code() : '',
        submitted_by: pick(STAFF),
      };
    }
  };
  for (let i = 0; i < 76; i++) drafts.push(normal(pick(SUPPLIERS)));

  const types: ProblemType[] = ['duplicate', 'outlier', 'unapproved-supplier', 'missing-approval', 'out-of-period'];
  for (let i = types.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [types[i], types[j]] = [types[j], types[i]];
  }
  const count = 4 + Math.floor(rand() * 3); // 4–6 problems, so there's no fixed number to aim for
  const chosen = types.slice(0, Math.min(count, 5));
  if (count === 6) chosen.push(pick(['duplicate', 'outlier', 'unapproved-supplier'] as ProblemType[]));

  const plantedDrafts: { type: ProblemType; keys: number[] }[] = [];
  const used = new Set<number>();
  for (const type of chosen) {
    if (type === 'duplicate') {
      const original = pick(drafts.filter((d) => !used.has(d.key) && Number(d.date.slice(8)) <= days - 2));
      used.add(original.key);
      const copy: Draft = { ...original, key: key++, date: iso(month, Number(original.date.slice(8)) + Math.floor(rand() * 3)) };
      drafts.push(copy);
      plantedDrafts.push({ type, keys: [original.key, copy.key] });
    } else if (type === 'outlier') {
      const s = pick(SUPPLIERS.filter((x) => x.max <= 420));
      const d = normal(s);
      d.amount = money(((s.min + s.max) / 2) * between(8, 15));
      d.approval_code = d.amount > APPROVAL_THRESHOLD ? code() : '';
      drafts.push(d);
      plantedDrafts.push({ type, keys: [d.key] });
    } else if (type === 'unapproved-supplier') {
      const d = normal(pick(UNAPPROVED));
      drafts.push(d);
      plantedDrafts.push({ type, keys: [d.key] });
    } else if (type === 'missing-approval') {
      const s = pick(SUPPLIERS.filter((x) => x.max > APPROVAL_THRESHOLD));
      const d = normal(s);
      d.amount = money(between(APPROVAL_THRESHOLD + 10, s.max));
      d.approval_code = '';
      drafts.push(d);
      plantedDrafts.push({ type, keys: [d.key] });
    } else {
      const d = normal(pick(SUPPLIERS.filter((x) => x.max <= APPROVAL_THRESHOLD)));
      const before = rand() < 0.5;
      const other = shiftMonth(month, before ? -1 : 1);
      d.date = iso(other, before ? daysIn(other) - Math.floor(rand() * 3) : 1 + Math.floor(rand() * 3));
      drafts.push(d);
      plantedDrafts.push({ type, keys: [d.key] });
    }
  }

  // Chronological, except out-of-period rows sit where they were entered late, so position isn't a giveaway.
  const outOfPeriod = new Set(plantedDrafts.filter((p) => p.type === 'out-of-period').flatMap((p) => p.keys));
  const late = drafts.filter((d) => outOfPeriod.has(d.key));
  const ordered = drafts.filter((d) => !outOfPeriod.has(d.key)).sort((a, b) => a.date.localeCompare(b.date) || a.key - b.key);
  for (const d of late) ordered.splice(5 + Math.floor(rand() * (ordered.length - 10)), 0, d);
  drafts.splice(0, drafts.length, ...ordered);
  const idOf = new Map<number, string>();
  const rows: Row[] = drafts.map((d, i) => {
    const id = `EXP-${String(1001 + i)}`;
    idOf.set(d.key, id);
    const { key: _key, ...rest } = d;
    return { id, ...rest };
  });
  return {
    suite: SUITE_ID,
    version: SUITE_VERSION,
    id: `case-${String(n).padStart(2, '0')}`,
    seed,
    month,
    rows,
    planted: plantedDrafts.map((p) => ({ type: p.type, accept: p.keys.map((k) => idOf.get(k)!) })),
  };
}

export function toCsv(rows: Row[]): string {
  const head = 'id,date,supplier,category,amount_gbp,approval_code,submitted_by';
  const q = (v: string) => (/[",]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  return [head, ...rows.map((r) => [r.id, r.date, q(r.supplier), q(r.category), r.amount.toFixed(2), r.approval_code, r.submitted_by].join(','))].join('\n');
}

export function buildPrompt(c: Case): string {
  const monthName = new Date(`${c.month}-01T00:00:00Z`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  return `I run a small business. Before I send this month's expenses to my accountant, please check them.

Our expense policy:
1. We only pay suppliers on our approved list (below).
2. Any expense over £${APPROVAL_THRESHOLD} needs an approval code.
3. This sheet should only contain expenses dated in ${monthName}.

Approved suppliers:
${APPROVED_SUPPLIERS.map((s) => `- ${s}`).join('\n')}

Please list every expense that breaks the policy, or looks like a mistake and needs a second look. Don't flag anything that's fine.

Reply with JSON only, in exactly this format:
{"flags": [{"id": "EXP-0000", "reason": "short reason"}]}

Expenses (${monthName}):
${toCsv(c.rows)}`;
}

export interface Flag {
  id: string;
  reason?: string;
}

export interface Score extends SuiteScore {
  planted: number;
  found: number;
  missed: ProblemType[];
  false_alarms: string[];
}

export function parseFlags(text: string): Flag[] | undefined {
  const cleaned = text.replace(/```(?:json)?/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end < start) return undefined;
  try {
    const obj = JSON.parse(cleaned.slice(start, end + 1));
    if (!Array.isArray(obj.flags)) return undefined;
    return obj.flags.filter((f: unknown): f is Flag => typeof (f as Flag)?.id === 'string');
  } catch {
    return undefined;
  }
}

export function score(c: Case, text: string): Score {
  const flags = parseFlags(text);
  if (!flags) return { followed_format: false, planted: c.planted.length, found: 0, missed: c.planted.map((p) => p.type), false_alarms: [], score: 0, summary: 'answer not in the required format' };
  const flagged = new Set(flags.map((f) => f.id.trim().toUpperCase()));
  const acceptable = new Set(c.planted.flatMap((p) => p.accept));
  const foundList = c.planted.filter((p) => p.accept.some((id) => flagged.has(id)));
  const falseAlarms = [...flagged].filter((id) => !acceptable.has(id));
  const recall = foundList.length / c.planted.length;
  const correctFlags = [...flagged].filter((id) => acceptable.has(id)).length;
  const precision = flagged.size ? correctFlags / flagged.size : 0;
  return {
    followed_format: true,
    planted: c.planted.length,
    found: foundList.length,
    missed: c.planted.filter((p) => !foundList.includes(p)).map((p) => p.type),
    false_alarms: falseAlarms,
    // 0–100: harmonic mean of share found and share of flags that were right (F1).
    score: precision + recall ? Math.round((200 * precision * recall) / (precision + recall)) : 0,
    summary: `${foundList.length}/${c.planted.length} found, ${falseAlarms.length} false alarm${falseAlarms.length === 1 ? '' : 's'}`,
  };
}

/** Pipeline check without an API: finds all but the last problem and raises one false alarm. */
export function mockAnswer(c: Case): string {
  const flags: Flag[] = c.planted.slice(0, -1).map((p) => ({ id: p.accept[0], reason: p.type }));
  flags.push({ id: c.rows.find((r) => !c.planted.some((p) => p.accept.includes(r.id)))!.id, reason: 'mock false alarm' });
  return JSON.stringify({ flags });
}
