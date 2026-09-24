# Normie Mode test: Answer business questions from a spreadsheet (first pilot)

Status: ready to run · Suite version 1 · Job: `analyse-a-spreadsheet` / office work

## Why this test first

It's the thing people actually do: paste in some data and ask questions about it. It rewards reading the data carefully and applying business definitions correctly, which is the known weak spot (SpreadsheetBench 2 found that most failures come from inspecting the data too little or using the wrong cells). It's more representative of office work than flagging rows, which specialist classifiers and simple spreadsheet filters already handle ("Spot unusual transactions" is kept for later).

## What the model gets

- A sales ledger for a small office-furniture supplier, January–June 2026: about 120–130 orders with order id, date, customer, region, product, quantity, unit price, discount % and status (Completed, Refunded or Cancelled).
- The definitions: order value = quantity × unit price minus the discount; net revenue counts only Completed orders.
- Six questions a manager would ask:
  1. Total net revenue in March
  2. Region with the highest net revenue in Q2
  3. Product with the fastest net-revenue growth from Q1 to Q2, and the percentage
  4. Order value lost to refunds and cancellations
  5. Biggest customer by net revenue, and the amount
  6. Average net order value in Q1
- It may show its working, but must end with its answers in a fixed JSON format.

The exact prompt is built by `buildPrompt` in `evals/spreadsheet-questions/suite.ts`.

## The cases

Five fixed ledgers (`evals/spreadsheet-questions/cases/`) from fixed seeds. A dataset is only kept if every "which" question has a clear winner (at least a 3% lead, or 3 percentage points of growth), so no answer hinges on a near-tie. Tests recalculate every answer key independently.

## Scoring

- Each question is right or wrong. Money is right within 0.5% or £1 (whichever is larger), percentages within half a point, and names must match the data (not case-sensitive). Two-part questions need both parts right.
- Score = share of questions right (0–100), shown plainly as "5/6 right".
- An answer not in the required format scores 0 and is reported separately.

## How it runs

- Through OpenRouter at each model's default settings, one run per case for the pilot. Every answer, its settings, provider, token usage and cost are saved.
- `npm run eval -- --dry-run` estimates cost; `--mock` checks the pipeline; a real run needs `OPENROUTER_API_KEY` (in the environment or a git-ignored `.env`) and stops at the `--budget` cap (default $3).
- Pilot models: Claude Opus 5.5, Claude Sonnet 5, GPT-6 Sol, GPT-6 Luna, Gemini 3.8 Flash, DeepSeek V4 Pro. Estimated cost about $1–2.

## What this does not claim

- One kind of spreadsheet question on synthetic data, pasted as text. It doesn't test working with real Excel files, formulas or charts.
- One run per case: close results get repeat runs before anything is published.
- Default settings differ between models; this measures what you get out of the box.
- Results are shown only after product-owner review.
