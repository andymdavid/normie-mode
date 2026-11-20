# Maintaining Normie Mode

Daily checks replace the proposed hourly monitor (D-040). Checks also run after an approved deployment. Automation prepares evidence and review packages; it does not merge, deploy, verify provider claims automatically or run paid models.

## Commands

- `npm run verify`: check, build, ordinary tests, built-site tests and SEO. `npm test` needs no build; `npm run test:site` separately checks the built HTML/indexability register.
- `npm run impact`: machine-readable picks for all hub tasks, using the same Astro/Vite modules as public pages.
- `npm run maintenance -- daily`: health, accepted-source age, persistent model discovery and overdue plan checks.
- `npm run maintenance -- weekly`: built-site tests, SEO, provider-plan page observations and three evaluation estimates. Changed HTML requires human interpretation; HTTP 200 never counts as verified plan access.
- `npm run maintenance -- monthly`: fresh demand collection and evidence-gap review. Demand is autocomplete interest, not search volume.

Reports default to ignored `.maintenance/`; set `NORMIE_REPORT_DIR` for durable operational state. Unresolved model candidates retain first/last seen and review status without a rolling expiry. They require provider verification and exact source/plan mapping before admission. Provider scope remains Anthropic, OpenAI, Google, DeepSeek and Moonshot until expanded by a product decision.

## Pipeline operation

`automation/maintenance.v2.mjs` is the versioned user-function source. Install it in the owner's pipeline function directory; install the daily/weekly/monthly JSON definitions alongside it. Each uses an isolated remote clone, checks the complete import, computes before/after task picks, validates the site and opens a draft review PR for substantive data changes. Retrieval-time-only churn does not create another PR. Same-content PRs are reused. Reports/logs are retained outside the temporary clone, which is deleted on completion. A lock prevents overlap; inspect a stale lock and its run before manual recovery.

While the implementation PR is pending, jobs explicitly use `maintenance/evidence-loop`; this is review-only code, never a deployment source. After merge, change the pipeline input sourceBranch to `main`, manually verify a run, then read back the definitions. Evidence PRs always target main and require complete review, including changed picks and stale plan mappings.

Scheduler jobs use an exactly Flight Deck-bound launcher session to call the deterministic pipeline and report its receipt to the maintenance task. This is necessary because a pipeline-action cron does not attach scheduled session context to its agent steps. The reviewed launcher template is `automation/scheduled-run.bun.txt`; install it as an operational Bun script with the active Autopilot path. Cron metadata inside a pipeline input is not a scheduler registration. Check registered cron/timezone, exact binding, linked pipeline ID and terminal output. A launched scheduler session is not a successful maintenance run. An error-shaped result remains an unsuccessful business run even if the pipeline wrapper terminates normally.

Proposed/installed times are recorded in the handoff: daily 07:00, weekly Tuesday 08:00, monthly first day 09:00, Australia/Perth. No hourly job. An unchanged daily result creates no new task comment; new issues and recovery do. Weekly review packages go to the same task. Independent consumer-product citation checks remain manual fixtures with exact tier/model/date/citations and no retry for a missing citation.

## Evaluation approval and publication

**Operator hold (20 November 2026): do not perform paid runs until the user explicitly lifts the hold. Cost estimates are informational.**

1. Run `npm run eval -- --suite <suite> --models <canonical-ids> --runs 1 --budget <USD> --dry-run`.
2. Review the estimate and copy the exact printed manifest into `{ "approved_by": "<human>", "approved_on": "YYYY-MM-DD", "manifest": <printed-object> }`.
3. Run the same command with `--approval <file>` instead of `--dry-run`, only after human paid-run approval. Mock runs need no approval and make no completion calls.
4. Output lands in ignored `evals/.quarantine/<suite>/<run>/`. Inspect every technical failure, all wrong answers and completeness before copying an approved real run into `evals/<suite>/results/`.
5. Add the reviewed run ID to that suite's `results/approved.json`, with human reviewer/date, in a review PR. Never approve results merely to make a build pass. A version change needs a complete approved cohort; older versions do not mix.

The loader ignores unapproved runs, mock runs, explicit incomplete runs, errors, format failures and missing/duplicate case-repeat coverage. A later incomplete result cannot silently replace a complete accepted run. The previous September approval is grandfathered from D-031. New harder/anomaly suites still need public adapter/catalogue review before publication.

Budgets reserve estimated cost before each call and retain summaries after transport failures, with conservative cost reservations. They are not a provider-enforced hard monetary limit: hidden reasoning and provider prices may differ. Use provider-side limits for strict caps. Never retry a poor answer; technical retries must be recorded. Bump suite version whenever prompts, cases or scoring change.

## Remaining editorial work

Review newly discovered models against provider records; decide exact routing/effort aliases and consumer access; verify all four overdue plan catalogues; inspect the refreshed verdict changes; approve the new-model evaluation cohort/budget; complete consumer citation observations where access exists. None of these is implied by a successful data download. Dependency advisories require separate triage before package updates.
