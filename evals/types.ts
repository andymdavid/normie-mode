// Shared shape for Normie Mode test suites run by scripts/eval.ts.

export interface SuiteScore {
  followed_format: boolean;
  /** 0–100. */
  score: number;
  /** Plain one-line result, e.g. "5/6 right". */
  summary: string;
}

export interface SuiteCase {
  id: string;
}

export interface Suite<C extends SuiteCase = SuiteCase> {
  SUITE_ID: string;
  SUITE_VERSION: string;
  SUITE_TITLE: string;
  generateCase(n: number): C;
  buildPrompt(c: C): string;
  score(c: C, text: string): SuiteScore;
  mockAnswer(c: C): string;
}
