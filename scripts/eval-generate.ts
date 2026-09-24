// Writes the fixed cases for a suite: npm run eval:generate -- <suite-id>
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import * as spreadsheetQuestions from '../evals/spreadsheet-questions/suite';
import * as unusualTransactions from '../evals/unusual-transactions/suite';
import * as messySpreadsheetQuestions from '../evals/messy-spreadsheet-questions/suite';

const suites = {
  [spreadsheetQuestions.SUITE_ID]: spreadsheetQuestions,
  [unusualTransactions.SUITE_ID]: unusualTransactions,
  [messySpreadsheetQuestions.SUITE_ID]: messySpreadsheetQuestions,
} as const;
const id = process.argv[2] as keyof typeof suites;
const suite = suites[id];
if (!suite) throw new Error(`Usage: npm run eval:generate -- ${Object.keys(suites).join('|')}`);
const dir = join(process.cwd(), 'evals', id, 'cases');
mkdirSync(dir, { recursive: true });
for (const n of [1, 2, 3, 4, 5]) {
  const c = suite.generateCase(n);
  writeFileSync(join(dir, `${c.id}.json`), `${JSON.stringify(c, null, 1)}\n`);
  console.log(`${c.id}: seed ${c.seed}`);
}
