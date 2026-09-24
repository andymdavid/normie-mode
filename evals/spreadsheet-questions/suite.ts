// Normie Mode test: "Answer business questions from a spreadsheet" (first pilot, see
// docs/evals/spreadsheet-questions.md). A seeded sales ledger plus six manager questions,
// each with one checkable answer, so scoring needs no human or AI judge.
import type { SuiteScore } from '../types';

export const SUITE_ID = 'spreadsheet-questions';
export const SUITE_VERSION = '1';
export const SUITE_TITLE = 'Answer business questions from a spreadsheet';

export type Status = 'Completed' | 'Refunded' | 'Cancelled';
export interface Order {
  order_id: string;
  date: string;
  customer: string;
  region: string;
  product: string;
  quantity: number;
  unit_price: number;
  discount_pct: number;
  status: Status;
}

export type AnswerKind = 'money' | 'name' | 'name+percent' | 'name+money';
export interface Question {
  id: string;
  text: string;
  plain: string;
  kind: AnswerKind;
  expected: { name?: string; value?: number };
}

export interface Case {
  suite: string;
  version: string;
  id: string;
  seed: number;
  orders: Order[];
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
export const lineValue = (o: Order) => round2(o.quantity * o.unit_price * (1 - o.discount_pct / 100));
const quarter = (date: string) => (Number(date.slice(5, 7)) <= 3 ? 'Q1' : 'Q2');

function totals<K extends string>(orders: Order[], key: (o: Order) => K): Map<K, number> {
  const m = new Map<K, number>();
  for (const o of orders) m.set(key(o), round2((m.get(key(o)) ?? 0) + lineValue(o)));
  return m;
}

/** Leader and its margin over second place, as a share of the leader's value. */
function leader(m: Map<string, number>): { name: string; value: number; margin: number } {
  const sorted = [...m].sort((a, b) => b[1] - a[1]);
  return { name: sorted[0][0], value: sorted[0][1], margin: (sorted[0][1] - sorted[1][1]) / Math.abs(sorted[0][1]) };
}

function draft(seed: number): Case | undefined {
  const rand = mulberry32(seed);
  const pick = <T>(xs: T[]) => xs[Math.floor(rand() * xs.length)];
  // Product demand drifts between quarters so there is a clear fastest grower.
  const q2Boost = new Map(PRODUCTS.map((p) => [p.name, 0.6 + rand() * 1.2]));
  const orders: Order[] = [];
  for (let i = 0; i < 150; i++) {
    const month = 1 + Math.floor(rand() * 6);
    const product = PRODUCTS[Math.floor(rand() * PRODUCTS.length)];
    if (month > 3 && rand() > q2Boost.get(product.name)! / 1.8) continue;
    const [customer, region] = pick(CUSTOMERS);
    const r = rand();
    orders.push({
      order_id: '',
      date: `2026-${String(month).padStart(2, '0')}-${String(1 + Math.floor(rand() * 28)).padStart(2, '0')}`,
      customer,
      region,
      product: product.name,
      quantity: 1 + Math.floor(rand() * (product.price > 300 ? 4 : 12)),
      unit_price: product.price,
      discount_pct: pick(DISCOUNTS),
      status: r < 0.08 ? 'Refunded' : r < 0.13 ? 'Cancelled' : 'Completed',
    });
  }
  orders.sort((a, b) => a.date.localeCompare(b.date));
  orders.forEach((o, i) => (o.order_id = `SO-${String(2001 + i)}`));

  const net = orders.filter((o) => o.status === 'Completed');
  const march = round2(net.filter((o) => o.date.startsWith('2026-03')).reduce((s, o) => s + lineValue(o), 0));
  const q2Region = leader(totals(net.filter((o) => quarter(o.date) === 'Q2'), (o) => o.region));
  const q1p = totals(net.filter((o) => quarter(o.date) === 'Q1'), (o) => o.product);
  const q2p = totals(net.filter((o) => quarter(o.date) === 'Q2'), (o) => o.product);
  if (PRODUCTS.some((p) => !q1p.get(p.name) || !q2p.get(p.name))) return undefined;
  const growth = new Map(PRODUCTS.map((p) => [p.name, ((q2p.get(p.name)! - q1p.get(p.name)!) / q1p.get(p.name)!) * 100]));
  const growthSorted = [...growth].sort((a, b) => b[1] - a[1]);
  const lost = round2(orders.filter((o) => o.status !== 'Completed').reduce((s, o) => s + lineValue(o), 0));
  const topCustomer = leader(totals(net, (o) => o.customer));
  const q1Net = net.filter((o) => quarter(o.date) === 'Q1');
  const aov = round2(q1Net.reduce((s, o) => s + lineValue(o), 0) / q1Net.length);

  // Only keep datasets where every "which" question has a clear winner.
  if (q2Region.margin < 0.03 || topCustomer.margin < 0.03 || growthSorted[0][1] - growthSorted[1][1] < 3) return undefined;

  return {
    suite: SUITE_ID,
    version: SUITE_VERSION,
    id: '',
    seed,
    orders,
    questions: [
      { id: 'q1', kind: 'money', text: 'What was total net revenue in March 2026?', plain: 'Total sales for one month', expected: { value: march } },
      { id: 'q2', kind: 'name', text: 'Which region had the highest net revenue in Q2 (April to June 2026)?', plain: 'Best region last quarter', expected: { name: q2Region.name } },
      {
        id: 'q3', kind: 'name+percent',
        text: 'Which product grew net revenue the most in percentage terms from Q1 (January to March) to Q2 (April to June), and by what percentage?',
        plain: 'Fastest-growing product, and by how much', expected: { name: growthSorted[0][0], value: round2(growthSorted[0][1]) },
      },
      { id: 'q4', kind: 'money', text: 'How much order value was lost to refunded and cancelled orders from January to June 2026?', plain: 'Money lost to refunds and cancellations', expected: { value: lost } },
      { id: 'q5', kind: 'name+money', text: 'Which customer had the highest net revenue from January to June 2026, and how much?', plain: 'Biggest customer, and how much they spent', expected: { name: topCustomer.name, value: topCustomer.value } },
      {
        id: 'q6', kind: 'money', text: 'What was the average net order value in Q1 (net revenue divided by the number of completed orders)?',
        plain: 'Average order size', expected: { value: aov },
      },
    ],
  };
}

export function generateCase(n: number): Case {
  for (let attempt = 0; attempt < 200; attempt++) {
    const c = draft(5000 + n * 1000 + attempt);
    if (c) return { ...c, id: `case-${String(n).padStart(2, '0')}` };
  }
  throw new Error(`No clear-cut dataset found for case ${n}`);
}

export function toCsv(orders: Order[]): string {
  const head = 'order_id,date,customer,region,product,quantity,unit_price_gbp,discount_pct,status';
  return [head, ...orders.map((o) => [o.order_id, o.date, o.customer.includes(',') ? `"${o.customer}"` : o.customer, o.region, o.product, o.quantity, o.unit_price.toFixed(2), o.discount_pct, o.status].join(','))].join('\n');
}

const FORMAT: Record<AnswerKind, string> = {
  money: 'a number in pounds, e.g. 12345.67',
  name: 'a name exactly as written in the data, e.g. "North"',
  'name+percent': 'an object {"name": "...", "percent": 12.3}',
  'name+money': 'an object {"name": "...", "amount": 12345.67}',
};

export function buildPrompt(c: Case): string {
  return `I run a small office-furniture supplier. Here are our sales orders for January to June 2026. Please answer my questions.

How we define things:
- An order's value is quantity × unit price, minus the discount percentage.
- Net revenue only counts orders with status "Completed". Refunded and cancelled orders don't count as revenue.

Questions:
${c.questions.map((q) => `${q.id}. ${q.text}`).join('\n')}

You can show your working. End your reply with your final answers as JSON, in exactly this format:
{"answers": {${c.questions.map((q) => `"${q.id}": <${FORMAT[q.kind]}>`).join(', ')}}}

Orders:
${toCsv(c.orders)}`;
}

function parseAnswers(text: string): Record<string, unknown> | undefined {
  // Working may come first; take the last {"answers": ...} object in the reply.
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
const sameName = (a: unknown, b?: string) => typeof a === 'string' && a.trim().toLowerCase() === b?.toLowerCase();
/** Money is right within 0.5% or £1 (rounding); percentages within half a point. */
const moneyOk = (v: unknown, e = 0) => Math.abs(num(v) - e) <= Math.max(1, Math.abs(e) * 0.005);
const percentOk = (v: unknown, e = 0) => Math.abs(num(v) - e) <= 0.5;

export function checkAnswer(q: Question, a: unknown): boolean {
  const o = (a ?? {}) as Record<string, unknown>;
  switch (q.kind) {
    case 'money':
      return moneyOk(a, q.expected.value);
    case 'name':
      return sameName(a, q.expected.name);
    case 'name+percent':
      return sameName(o.name, q.expected.name) && percentOk(o.percent, q.expected.value);
    case 'name+money':
      return sameName(o.name, q.expected.name) && moneyOk(o.amount, q.expected.value);
  }
}

export interface Score extends SuiteScore {
  correct: number;
  total: number;
  per_question: Record<string, boolean>;
}

export function score(c: Case, text: string): Score {
  const answers = parseAnswers(text);
  const per_question = Object.fromEntries(c.questions.map((q) => [q.id, answers ? checkAnswer(q, answers[q.id]) : false]));
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
      const e = q.expected;
      const v = i === c.questions.length - 1 ? (e.value ?? 0) * 2 : e.value;
      return [q.id, q.kind === 'money' ? v : q.kind === 'name' ? e.name : q.kind === 'name+percent' ? { name: e.name, percent: v } : { name: e.name, amount: v }];
    }),
  );
  return JSON.stringify({ answers });
}
