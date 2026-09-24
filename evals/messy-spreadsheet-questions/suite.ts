// Normie Mode test v2: "Answer business questions from a messy spreadsheet"
// (see docs/evals/messy-spreadsheet-questions.md). Version 1 was too easy for the top models,
// so this adds the untidiness real business sheets have and questions that need more steps.
// The owner's notes in the prompt make every answer defensible; scoring is automatic.
import type { SuiteScore } from '../types';

export const SUITE_ID = 'messy-spreadsheet-questions';
export const SUITE_VERSION = '1';
export const SUITE_TITLE = 'Answer business questions from a messy spreadsheet';

export type Status = 'Completed' | 'Refunded' | 'Cancelled';
export interface Row {
  order_id: string;
  /** As written in the sheet: ISO, or dd/mm/yyyy for some rows. */
  date: string;
  customer: string;
  region: string;
  product: string;
  quantity: number;
  unit_price: number;
  discount_pct: number;
  status: Status;
}

export type AnswerKind = 'money' | 'count' | 'percent' | 'customer+money' | 'month+money';
export interface Question {
  id: string;
  text: string;
  plain: string;
  kind: AnswerKind;
  expected: { name?: string; value: number };
}

export interface Case {
  suite: string;
  version: string;
  id: string;
  seed: number;
  rows: Row[];
  /** Canonical customer name for every spelling used in the sheet. */
  aliases: Record<string, string>;
  questions: Question[];
}

const PRODUCTS = [
  { name: 'Desk Chair', price: 145 },
  { name: 'Standing Desk', price: 420 },
  { name: 'Monitor Arm', price: 65 },
  { name: 'Filing Cabinet', price: 180 },
  { name: 'Desk Lamp', price: 38 },
  { name: 'Whiteboard', price: 95 },
];
const CUSTOMERS: [string, string][] = [
  ['Alder & Finch Architects', 'North'], ['Brookside Dental', 'North'], ['Copperfield Law', 'North'], ['Dunmore Logistics', 'North'],
  ['Elmwood Primary School', 'South'], ['Fairhaven Estates', 'South'], ['Greystone Insurance', 'South'], ['Hollis Marketing', 'South'],
  ['Ivy Lane Accountants', 'East'], ['Juniper Health Clinic', 'East'], ['Kestrel Engineering', 'East'], ['Linden Travel', 'East'],
  ['Maple Court Surgery', 'West'], ['Northwind Recruitment', 'West'], ['Oakridge Media', 'West'], ['Pembroke Consulting', 'West'],
];
const DISCOUNTS = [0, 0, 0, 5, 5, 10, 15];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June'];

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

const round2 = (v: number) => Math.round(v * 100) / 100;
export const rowValue = (r: Row) => round2(r.quantity * r.unit_price * (1 - r.discount_pct / 100));
/** Reads either date format in the sheet as ISO. */
export const isoDate = (d: string) => (d.includes('/') ? `${d.slice(6, 10)}-${d.slice(3, 5)}-${d.slice(0, 2)}` : d);
const monthOf = (r: Row) => Number(isoDate(r.date).slice(5, 7));

interface Truth {
  canonical: (name: string) => string;
  unique: Row[];
  completed: Row[];
}

function truth(rows: Row[], aliases: Record<string, string>): Truth {
  const seen = new Set<string>();
  const unique = rows.filter((r) => (seen.has(r.order_id) ? false : (seen.add(r.order_id), true)));
  return { canonical: (n) => aliases[n] ?? n, unique, completed: unique.filter((r) => r.status === 'Completed') };
}

function draft(seed: number): Omit<Case, 'id'> | undefined {
  const rand = mulberry32(seed);
  const pick = <T>(xs: T[]) => xs[Math.floor(rand() * xs.length)];
  const day = () => String(1 + Math.floor(rand() * 28)).padStart(2, '0');

  // Four customers get alternative spellings.
  const variantOf = new Map<string, string[]>();
  const shuffled = [...CUSTOMERS].sort(() => rand() - 0.5);
  for (const [name] of shuffled.slice(0, 4)) variantOf.set(name, [`${name} Ltd`, pick([`${name.toUpperCase()}`, `${name} ltd.`, name.replace(' & ', ' and ')])]);
  const aliases: Record<string, string> = {};
  for (const [name, vs] of variantOf) for (const v of vs) aliases[v] = name;
  const spell = (name: string) => (variantOf.has(name) && rand() < 0.35 ? pick(variantOf.get(name)!) : name);

  // Some customers go quiet in Q2, so "ordered in Q1 but not Q2" has an answer.
  const quiet = new Set(shuffled.slice(4, 4 + 2 + Math.floor(rand() * 3)).map(([n]) => n));
  const base: Omit<Row, 'order_id' | 'date'>[] = [];
  const dates: string[] = [];
  for (let i = 0; i < 190; i++) {
    const month = 1 + Math.floor(rand() * 6);
    // Customers with several spellings order a little more often, as regulars tend to.
    const [customer, region] = rand() < 0.25 ? pick(CUSTOMERS.filter(([n]) => variantOf.has(n))) : pick(CUSTOMERS);
    if (month > 3 && quiet.has(customer)) continue;
    const product = pick(PRODUCTS);
    const r = rand();
    base.push({
      customer, region, product: product.name,
      quantity: 1 + Math.floor(rand() * (product.price > 300 ? 4 : 12)),
      // A 5% price rise from April on standing desks and chairs.
      unit_price: month > 3 && product.price > 100 && product.price < 500 ? round2(product.price * 1.05) : product.price,
      discount_pct: pick(DISCOUNTS),
      status: r < 0.07 ? 'Refunded' : r < 0.12 ? 'Cancelled' : 'Completed',
    });
    dates.push(`2026-${String(month).padStart(2, '0')}-${day()}`);
  }
  let rows: Row[] = base.map((b, i) => ({ ...b, order_id: '', date: dates[i] }));
  rows.sort((a, b) => a.date.localeCompare(b.date));
  rows.forEach((r, i) => (r.order_id = `SO-${3001 + i}`));

  // Returns: negative-quantity rows against earlier completed orders.
  let next = 3001 + rows.length;
  const returnable = rows.filter((r) => r.status === 'Completed' && monthOf(r) < 6);
  for (let i = 0; i < 6; i++) {
    const o = pick(returnable);
    const m = Math.min(6, monthOf(o) + (rand() < 0.5 ? 0 : 1));
    rows.push({ ...o, order_id: `SO-${next++}`, date: `2026-${String(m).padStart(2, '0')}-${day()}`, quantity: -Math.max(1, Math.floor(o.quantity / 2)) });
  }
  rows.sort((a, b) => a.date.localeCompare(b.date));

  // Duplicated entries: the same order typed in twice, a few rows apart.
  const dupes = 3 + Math.floor(rand() * 3);
  for (let i = 0; i < dupes; i++) {
    const idx = Math.floor(rand() * rows.length);
    if (rows.filter((r) => r.order_id === rows[idx].order_id).length > 1) continue;
    rows.splice(Math.min(rows.length, idx + 1 + Math.floor(rand() * 4)), 0, { ...rows[idx] });
  }

  // Untidy presentation: alternative customer spellings and UK-style dates on some rows.
  rows = rows.map((r) => {
    const iso = r.date;
    return { ...r, customer: spell(r.customer), date: rand() < 0.3 ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : iso };
  });
  // A duplicate must be an exact copy of its original, spelling and date format included.
  const firstOf = new Map<string, Row>();
  rows = rows.map((r) => (firstOf.has(r.order_id) ? { ...firstOf.get(r.order_id)! } : (firstOf.set(r.order_id, r), r)));

  const t = truth(rows, aliases);
  const net = (rs: Row[]) => round2(rs.reduce((s, r) => s + rowValue(r), 0));
  const inMonth = (m: number) => t.completed.filter((r) => monthOf(r) === m);
  const byCustomer = new Map<string, number>();
  for (const r of t.completed) byCustomer.set(t.canonical(r.customer), round2((byCustomer.get(t.canonical(r.customer)) ?? 0) + rowValue(r)));
  const customers = [...byCustomer].sort((a, b) => b[1] - a[1]);
  const total = net(t.completed);
  const top3Share = round2((100 * customers.slice(0, 3).reduce((s, [, v]) => s + v, 0)) / total);
  const sales = t.completed.filter((r) => r.quantity > 0);
  const q1Buyers = new Set(sales.filter((r) => monthOf(r) <= 3).map((r) => t.canonical(r.customer)));
  const q2Buyers = new Set(sales.filter((r) => monthOf(r) > 3).map((r) => t.canonical(r.customer)));
  const lapsed = [...q1Buyers].filter((c) => !q2Buyers.has(c)).length;
  const monthly = [1, 2, 3, 4, 5, 6].map((m) => net(inMonth(m)));
  const rises = monthly.slice(1).map((v, i) => ({ month: MONTHS[i + 1], rise: round2(v - monthly[i]) })).sort((a, b) => b.rise - a.rise);
  const returns = round2(-net(t.completed.filter((r) => r.quantity < 0)));
  const duplicates = rows.length - t.unique.length;
  const q2Orders = sales.filter((r) => monthOf(r) > 3);
  const q2Aov = round2(net(t.completed.filter((r) => monthOf(r) > 3)) / q2Orders.length);

  // Only keep sheets where the "which" questions have a clear winner and the messiness matters.
  const merged = customers[0][1] - (customers[1]?.[1] ?? 0);
  if (merged / customers[0][1] < 0.03 || rises[0].rise - rises[1].rise < 200 || rises[0].rise <= 0) return undefined;
  if (duplicates < 3 || lapsed < 1 || !Object.keys(aliases).some((a) => rows.some((r) => r.customer === a))) return undefined;
  // The untidiness must change the answer: the top customer has several spellings, and the lazy
  // reading (no merging of spellings, duplicates counted twice) gives a different name or amount.
  const lazy = new Map<string, number>();
  for (const r of rows.filter((x) => x.status === 'Completed')) lazy.set(r.customer, (lazy.get(r.customer) ?? 0) + rowValue(r));
  const lazyTop = [...lazy].sort((a, b) => b[1] - a[1])[0];
  if (!variantOf.has(customers[0][0])) return undefined;
  if (lazyTop[0] === customers[0][0] && Math.abs(lazyTop[1] - customers[0][1]) <= customers[0][1] * 0.005) return undefined;

  return {
    suite: SUITE_ID,
    version: SUITE_VERSION,
    seed,
    rows,
    aliases,
    questions: [
      { id: 'q1', kind: 'money', text: 'What was total net revenue in March 2026?', plain: 'Total sales for one month', expected: { value: net(inMonth(3)) } },
      { id: 'q2', kind: 'customer+money', text: 'Which customer had the highest net revenue from January to June 2026, and how much?', plain: 'Biggest customer, and how much they spent', expected: { name: customers[0][0], value: customers[0][1] } },
      { id: 'q3', kind: 'percent', text: 'What percentage of total net revenue from January to June 2026 came from the top three customers?', plain: 'How much depends on the top three customers', expected: { value: top3Share } },
      { id: 'q4', kind: 'count', text: 'How many customers placed at least one completed order in Q1 (January to March) but none in Q2 (April to June)? Returns do not count as orders.', plain: 'Customers who stopped ordering', expected: { value: lapsed } },
      { id: 'q5', kind: 'month+money', text: 'Which month had the biggest increase in net revenue compared with the month before, and by how much?', plain: 'Best month-on-month jump', expected: { name: rises[0].month, value: rises[0].rise } },
      { id: 'q6', kind: 'money', text: 'What was the total value of returns from January to June 2026? Give it as a positive number.', plain: 'Money given back for returns', expected: { value: returns } },
      { id: 'q7', kind: 'count', text: 'How many rows in the sheet are duplicate entries of an order that already appears earlier?', plain: 'Orders typed in twice', expected: { value: duplicates } },
      { id: 'q8', kind: 'money', text: 'What was the average net order value in Q2: Q2 net revenue (including returns) divided by the number of completed orders in Q2, not counting returns?', plain: 'Average order size', expected: { value: q2Aov } },
    ],
  };
}

export function generateCase(n: number): Case {
  for (let attempt = 0; attempt < 500; attempt++) {
    const c = draft(20000 + n * 1000 + attempt);
    if (c) return { ...c, id: `case-${String(n).padStart(2, '0')}` };
  }
  throw new Error(`No clear-cut dataset found for case ${n}`);
}

export function toCsv(rows: Row[]): string {
  const head = 'order_id,date,customer,region,product,quantity,unit_price_gbp,discount_pct,status';
  const q = (v: string) => (/[",]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  return [head, ...rows.map((r) => [r.order_id, r.date, q(r.customer), r.region, r.product, r.quantity, r.unit_price.toFixed(2), r.discount_pct, r.status].join(','))].join('\n');
}

const FORMAT: Record<AnswerKind, string> = {
  money: 'a number in pounds, e.g. 12345.67',
  count: 'a whole number',
  percent: 'a percentage as a number, e.g. 42.5',
  'customer+money': '{"name": "...", "amount": 12345.67}',
  'month+money': '{"month": "...", "amount": 1234.56}',
};

export function buildPrompt(c: Case): string {
  return `I run a small office-furniture supplier. Here's our sales sheet for January to June 2026. It isn't perfectly tidy. Please answer my questions.

How we define things:
- An order's value is quantity × unit price, minus the discount percentage.
- Net revenue only counts rows with status "Completed". Refunded and cancelled orders don't count.
- Returns are separate "Completed" rows with a negative quantity. They reduce net revenue in the month they're dated.

Notes about the sheet:
- Our bookkeeper sometimes writes a customer's name slightly differently (for example adding "Ltd", or in capitals). It's still the same customer.
- A few orders were accidentally typed in twice with the same order ID. Each order should only count once.
- Some dates are written as day/month/year.

Questions:
${c.questions.map((q) => `${q.id}. ${q.text}`).join('\n')}

You can show your working. End your reply with your final answers as JSON, in exactly this format:
{"answers": {${c.questions.map((q) => `"${q.id}": <${FORMAT[q.kind]}>`).join(', ')}}}

Sales sheet:
${toCsv(c.rows)}`;
}

function parseAnswers(text: string): Record<string, unknown> | undefined {
  const cleaned = text.replace(/```(?:json)?/g, '').trim();
  const start = cleaned.lastIndexOf('{', cleaned.lastIndexOf('"answers"'));
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end < start) return undefined;
  try {
    const obj = JSON.parse(cleaned.slice(start, end + 1));
    return obj && typeof obj.answers === 'object' ? obj.answers : undefined;
  } catch {
    return undefined;
  }
}

const num = (v: unknown) => (typeof v === 'number' ? v : typeof v === 'string' ? Number(v.replace(/[£,%\s]/g, '')) : NaN);
const norm = (s: string) => s.toLowerCase().replace(/\s+(ltd\.?|limited)$/, '').replace(/ and /g, ' & ').replace(/[^a-z&]+/g, ' ').trim();
/** Money within 0.5% or £1; percentages within half a point; counts exact. */
const moneyOk = (v: unknown, e: number) => Math.abs(num(v) - e) <= Math.max(1, Math.abs(e) * 0.005);

export function checkAnswer(c: Case, q: Question, a: unknown): boolean {
  const o = (a ?? {}) as Record<string, unknown>;
  switch (q.kind) {
    case 'money':
      return moneyOk(a, q.expected.value);
    case 'count':
      return num(a) === q.expected.value;
    case 'percent':
      return Math.abs(num(a) - q.expected.value) <= 0.5;
    case 'customer+money': {
      // Any spelling of the right customer counts.
      const name = typeof o.name === 'string' ? (c.aliases[o.name] ?? o.name) : '';
      return norm(name) === norm(q.expected.name!) && moneyOk(o.amount, q.expected.value);
    }
    case 'month+money':
      return typeof o.month === 'string' && o.month.trim().toLowerCase().startsWith(q.expected.name!.toLowerCase().slice(0, 3)) && moneyOk(o.amount, q.expected.value);
  }
}

export interface Score extends SuiteScore {
  correct: number;
  total: number;
  per_question: Record<string, boolean>;
}

export function score(c: Case, text: string): Score {
  const answers = parseAnswers(text);
  const per_question = Object.fromEntries(c.questions.map((q) => [q.id, answers ? checkAnswer(c, q, answers[q.id]) : false]));
  const correct = Object.values(per_question).filter(Boolean).length;
  return {
    followed_format: answers !== undefined,
    correct,
    total: c.questions.length,
    per_question,
    score: Math.round((100 * correct) / c.questions.length),
    summary: answers ? `${correct}/${c.questions.length} right` : 'answer not in the required format',
  };
}

/** Pipeline check without an API: right on everything except the last question. */
export function mockAnswer(c: Case): string {
  const answers = Object.fromEntries(
    c.questions.map((q, i) => {
      const v = i === c.questions.length - 1 ? q.expected.value * 2 : q.expected.value;
      return [q.id, q.kind === 'customer+money' ? { name: q.expected.name, amount: v } : q.kind === 'month+money' ? { month: q.expected.name, amount: v } : v];
    }),
  );
  return JSON.stringify({ answers });
}
