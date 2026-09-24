# Normie Mode test: Spot unusual transactions (micro-pilot)

Status: built, deferred (the first run uses `spreadsheet-questions`) · Suite version 1 · Task: `spot-unusual-transactions`

## Why this test

A cheap first Normie Mode test (D-009 pilot) on one specific, recognisable job for the D-001 audience: checking a month's expenses before they go to the accountant. It needs no human or AI judge, because every problem is planted and known.

## What the model gets

- A short expense policy: approved suppliers only; anything over £500 needs an approval code; only expenses dated in the month.
- The approved supplier list.
- About 80 expense rows as CSV (id, date, supplier, category, amount, approval code, submitted by).
- The instruction to list every expense that breaks the policy or looks like a mistake, and not to flag anything that's fine, answering in a fixed JSON format.

The exact prompt is built by `buildPrompt` in `evals/unusual-transactions/suite.ts`.

## The cases

Five fixed cases (`evals/unusual-transactions/cases/`), generated from fixed seeds so every model sees identical inputs. Each has 4–6 planted problems drawn from five types, so there is no fixed number to aim for:

| Type | Plain label | How it's planted |
| --- | --- | --- |
| `duplicate` | Paid twice | An existing expense repeated 0–2 days later. Flagging either row counts |
| `outlier` | Far bigger than usual | 8–15× the supplier's typical amount |
| `unapproved-supplier` | Supplier not on the list | Lookalike names such as "Northgate Stationery Supplies" |
| `missing-approval` | Over £500 without a code | Amount over £500 with the code blank |
| `out-of-period` | Dated outside the month | 1–3 days either side of the month, placed mid-sheet |

Tests check that no background row accidentally breaks a rule.

## Scoring

- **Found**: planted problems flagged.
- **False alarms**: flags on rows with no planted problem.
- **Score (0–100)**: the harmonic mean of the share found and the share of flags that were right (F1), so both missing problems and crying wolf lower it.
- An answer not in the required format scores 0 and is reported separately.

## How it runs

- Through OpenRouter at each model's default settings (reasoning effort as the provider sets it), one run per case for the pilot. Settings, provider, token usage and cost are saved with every answer.
- `npm run eval -- --dry-run` estimates cost; `npm run eval -- --mock` checks the pipeline; a real run needs `OPENROUTER_API_KEY` (in the environment or a git-ignored `.env`) and stops at the `--budget` cap (default $3).
- Pilot models: Claude Opus 5.5, Claude Sonnet 5, GPT-6 Sol, GPT-6 Luna, Gemini 3.8 Flash, DeepSeek V4 Pro. Estimated cost for the full pilot: about $1.

## What this does not claim

- It tests one narrow job on synthetic data, not general spreadsheet ability.
- One run per case means small differences may be luck; close results will get repeat runs before anything is published.
- Default settings differ between models; this measures what you get out of the box.
- Results are shown only after product-owner review (AGENTS.md).
