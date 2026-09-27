# Our own tests: why, what and how

This is the guide for designing, running and publishing Normie Mode's own tests (shown on the site as **Tested by us**). Read it before touching anything under `evals/`, and read the write-up for the suite you're working on (`docs/evals/<suite>.md`).

## Why we run our own tests

Public benchmarks rarely measure the everyday tasks people search for. Most task pages rest on tests of *related* skills or on people's votes. Our own tests fill that gap: they measure a task directly, in the way an ordinary person would do it, and we publish every question, every answer and every score so anyone can check them.

They're held to a higher bar than anything else on the site, because we're both the tester and the publisher.

- They count towards the task score and the picks as **direct evidence** on the tasks they measure (D-031).
- They're always marked with the navy **Tested by us** tag (D-022 conventions), so nobody mistakes them for independent results.
- Nothing about them is secret: the prompt, the data, the answer key and the scoring are in the repository.

## Principles

1. **Test the task, not the model's party tricks.** Pick work people actually do (from the search demand in `content/intents/`), phrased the way a manager or a student would ask it.
2. **One right answer per question, scored automatically.** If a person has to judge an answer, it isn't ready to be a test. Allow sensible tolerance (e.g. money within 0.5% or £1) and say so in the write-up.
3. **Fixed, realistic, synthetic data.** Cases are generated from fixed seeds and committed, so every model sees exactly the same thing and anyone can regenerate them. Synthetic data avoids copyright and privacy problems and can't be in a model's training data.
4. **No near-ties in the answer key.** A "which is biggest" question only counts if the winner leads clearly; the spreadsheet generators only keep a dataset with at least a 3% lead. Otherwise we'd be measuring rounding.
5. **Answer keys are checked twice.** The suite computes the key; `suite.test.ts` recomputes it a different way and fails if they disagree.
6. **Same prompt, default settings, every model.** Models run through OpenRouter at their defaults. Never tune the prompt for one model, and never retry a model because its answer was poor.
7. **Record everything.** Every call saves its full answer, score, cost, time, provider, token usage and finish reason. Results are append-only: never edit a saved answer.
8. **Money is capped and cheapest goes first.** Every run has a budget; the runner orders models cheapest first so a cap only ever cuts expensive ones.
9. **Say what it doesn't show.** Every write-up ends with what the test doesn't claim (e.g. pasted text, not real Excel files).

## What a suite is made of

| Path | What it is |
| --- | --- |
| `evals/<suite>/suite.ts` | The suite: `SUITE_ID`, `SUITE_VERSION`, `SUITE_TITLE`, `generateCase`, `buildPrompt`, `score`, `mockAnswer` (the `Suite` interface in `evals/types.ts`) |
| `evals/<suite>/cases/case-0N.json` | The fixed cases, written by `npm run eval:generate -- <suite>` |
| `evals/<suite>/suite.test.ts` | Tests: committed cases match the generator, answer keys recompute independently, the data contains what the questions test for, scoring accepts right answers (in any reasonable format) and rejects wrong ones |
| `evals/<suite>/results/<run-id>/` | One folder per run: `summary.json` plus one file per model, case and repeat |
| `docs/evals/<suite>.md` | The write-up: why this test, what the model gets, the cases, scoring, how it runs, what it doesn't claim |
| `content/tests/<suite>.yaml` | Makes a suite a test on the site (`source: normie`, `key: <suite>`, `url: /tests/<suite>`) |

New suites also need adding to the `SUITES` maps in `scripts/eval.ts` and `scripts/eval-generate.ts`.

## Running a suite

Always in this order:

```sh
npm run eval -- --suite <suite> --dry-run            # estimate cost, no API calls
npm run eval -- --suite <suite> --mock               # whole pipeline with fake answers, writes a -mock folder
npm run eval -- --suite <suite> --budget 5           # real run
```

- A real run needs `OPENROUTER_API_KEY` in the environment or a git-ignored `.env`.
- `--models a,b,c` picks models by our model ids (default: the pilot six in `scripts/eval.ts`); `--runs N` repeats each case.
- Each model needs an `openrouter_id` in `content/models/<id>.yaml`. Several don't have one yet (e.g. GPT-5.6 Sol and Luna, Gemini 3.6 Flash, Gemini 3.1 Pro, DeepSeek V4.1 Flash); look up the route on OpenRouter and add it first.
- **Ask the product owner before any real run**, with the dry-run estimate. Estimates are rough: hidden "thinking" tokens made the first pilot cost about three times the estimate, which is why the estimator now allows 20,000 output tokens per call.
- Delete the `-mock` folder when you're done with it; mock runs are never published, but they clutter the results.

## After a run: review before committing

**A committed run is a published run.** The site reads every real run in `evals/<suite>/results/` at build time, so check before you commit:

- [ ] No `errors` or `format_failures` in `summary.json`. If a model failed for a technical reason (timeout, provider error), re-run that model; don't publish an error as a wrong answer.
- [ ] Open a sample of answers, including every wrong one, and confirm the scoring was fair (a right answer phrased oddly shouldn't be marked wrong). If scoring was wrong, fix the scorer, bump the version and re-run; never hand-edit a score.
- [ ] Costs and times look plausible.
- [ ] The product owner has seen the results (D-017).

Then commit the run folder in its own commit, saying which models, cases and repeats it covers and what it cost.

## How results reach the site

`publishedRun()` in `src/lib/normie-tests.ts` combines **every real run of the suite's latest version**, taking each model's answers from its most recent run. So:

- A run that only adds models (say, the two the first run missed) **adds** them; it doesn't replace the others.
- Re-running one model replaces only that model's answers.
- Bumping `SUITE_VERSION` starts afresh: older-version runs stop counting, so re-run every model you want shown on the new version.

The combined results feed, automatically:

- the evidence chart on each task page that lists the suite in its `tests` (with `closeness: direct` where the test is the task itself),
- the task score and the picks on those pages,
- the results page at `/tests/<suite>`, "Tests explained", model pages and How it works.

A model's score is its share of answers right across all cases and repeats. In the task score, models with the same number right score the same; cost and speed are shown but never break a tie.

## Changing a suite

Change `SUITE_VERSION` whenever you change the prompt, the cases, the answer key or the scoring, and regenerate cases if they changed. Results from different versions are never combined or compared. Update the write-up at the same time.

A harder version usually becomes a new suite rather than a new version (e.g. `messy-spreadsheet-questions` after `spreadsheet-questions`), because the two measure different things and can both be useful.

## Still open (D-009)

- How many repeats per case. The pilot used one; close results should get repeats before they decide a pick.
- Which models every run must cover. Ideally every compared model, including the older ones free plans still use.
- When a harder suite replaces an easier one on a task page.

Record any decision here and in `docs/IMPLEMENTATION_PLAN.md`.

## Verification

```sh
npm test            # includes each suite.test.ts and the publishedRun tests
npm run check
npm run build
```
