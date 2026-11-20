# Software test inventory — 20 November 2026

These are local software checks, not model evaluation runs. The public “Tested by us” pages show model evidence; the software tests live in the repository. Counts below compare the model-catch-up branch before this audit (commit `2a17423`) with the audited candidate. The smaller tooling-only branch lacks two model-specific cases.

**Before: 122 authored definitions expanded into 735 cases across 25 files. After: 118 definitions, 551 cases (549 ordinary + 2 built-site).** Data-driven tests expand one definition across input rows/pages. Numbers change with the data and are not coverage scores.

| File | Definitions before → after | Cases before → after | Purpose / decision |
|---|---:|---:|---|
| [src/lib/verdict.test.ts](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/verdict.test.ts) | 8 → 7 | 323 → 277 | Plan budgets, extra-cost exclusion, close calls, chart agreement and deduplication. Removed per-pick votes check already covered for all scored rows. |
| [src/lib/norm.test.ts](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/norm.test.ts) | 9 → 7 | 189 → 52 | All 46 task pages: factual messages and prices. Consolidated repeated calculations; replaced copied counting logic with a fixed three-test fixture. |
| [src/lib/tasks.test.ts](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/tasks.test.ts) | 8 → 8 | 78 → 78 | Every test source and task mapping, inherited evidence labels and votes-only eligibility. Retained broad content integrity. |
| [server/index.test.ts](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/server/index.test.ts) | 11 → 11 | 20 → 20 | Mocked newsletter proxy, redirects, HEAD/cache/compression and privacy-minimal crawler logging. |
| [src/lib/demand.test.ts](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/demand.test.ts) | 5 → 5 | 16 → 16 | Search-intent classification and demand-snapshot quality. Does not establish search volume. |
| [evals/spreadsheet-questions/suite.test.ts](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/evals/spreadsheet-questions/suite.test.ts) | 9 → 9 | 13 → 13 | Local synthetic-case/scorer checks; no model calls. Spreadsheet independent-key coverage is partial; anomaly fixtures now match committed data. |
| [evals/messy-spreadsheet-questions/suite.test.ts](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/evals/messy-spreadsheet-questions/suite.test.ts) | 8 → 8 | 12 → 12 | Local synthetic-case/scorer checks; no model calls. Spreadsheet independent-key coverage is partial; anomaly fixtures now match committed data. |
| [src/lib/search.test.ts](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/search.test.ts) | 1 → 1 | 12 → 12 | Twelve representative user queries resolve to the intended pages. |
| [evals/unusual-transactions/suite.test.ts](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/evals/unusual-transactions/suite.test.ts) | 7 → 7 | 11 → 11 | Local synthetic-case/scorer checks; no model calls. Spreadsheet independent-key coverage is partial; anomaly fixtures now match committed data. |
| [src/lib/rules.test.ts](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/rules.test.ts) | 11 → 11 | 11 → 11 | Provenance, evidence ceilings, review requirements and supersession; validator safety even for legacy recommendation records. |
| [scripts/seo-audit.test.ts](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/scripts/seo-audit.test.ts) | 6 → 6 | 6 → 6 | Synthetic broken/correct HTML verifies the SEO checker itself. |
| [src/lib/freshness.test.ts](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/freshness.test.ts) | 1 → 1 | 6 → 6 | Evidence-derived dates and unchanged rebuild behaviour. |
| [src/lib/normie-tests.test.ts](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/normie-tests.test.ts) | 6 → 5 | 6 → 5 | Approved result loading, partial-run isolation, versions and ranking ties. Removed vacuous pilot assertion; isolated/cleaned filesystem fixtures. |
| [src/lib/plans.test.ts](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/plans.test.ts) | 6 → 6 | 6 → 6 | Compared versions, price order and conditional/unknown defaults. |
| [scripts/import-guards.test.ts](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/scripts/import-guards.test.ts) | 4 → 4 | 4 → 4 | Empty/reduced sources, exact identity, alias drift and accepted-batch preservation; temporary files are cleaned. |
| [src/lib/overview.test.ts](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/overview.test.ts) | 4 → 4 | 4 → 4 | Model inclusion and evidence labels. Known prices must be valid; missing prices need not prevent model admission. |
| [src/lib/page-metadata.test.ts](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/page-metadata.test.ts) | 3 → 3 | 3 → 3 | Names, title constraints and metadata uniqueness; no fixed catalogue/page totals. |
| [src/lib/structured-data.test.ts](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/structured-data.test.ts) | 3 → 3 | 3 → 3 | Schema entities, visible ordering, provenance dates and script escaping. |
| [scripts/indexability-review.test.ts](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/scripts/indexability-review.test.ts) | 2 → 2 | 2 → 2 | Built-page policy and CSV output. No fixed total page/model counts; verifies actual CSV bytes and parsing. |
| [src/lib/answer-summary.test.ts](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/answer-summary.test.ts) | 2 → 2 | 2 → 2 | Evidence-first summaries and explicit caveats. |
| [src/lib/comparisons.test.ts](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/comparisons.test.ts) | 2 → 2 | 2 → 2 | Draft/public gates and shared comparison data. |
| [src/lib/indexability.test.ts](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/indexability.test.ts) | 2 → 2 | 2 → 2 | Accepted noindex/restoration policy. |
| [src/lib/public-dataset.test.ts](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/public-dataset.test.ts) | 2 → 2 | 2 → 2 | Published result auditability and CSV round-trip coverage; no fixed result count that blocks new approved models. |
| [src/lib/historical-specs.test.ts](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/historical-specs.test.ts) | 1 → 1 | 1 → 1 | Archived model specifications retain their original retrieval provenance. |
| [src/lib/trust-pages.test.ts](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/trust-pages.test.ts) | 1 → 1 | 1 → 1 | Approved identity/contact/policy routes remain available. |

## Authored definitions

This lists each title template once. `%s` titles expand across data. Verdict definitions inside a loop expand across all task pages. Open any linked definition to inspect its assertions.

### src/lib/verdict.test.ts

- [gives every task page with a task score a verdict](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/verdict.test.ts#L10)
- [names the top of the task score as best overall](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/verdict.test.ts#L19)
- [keeps each pick within its budget](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/verdict.test.ts#L23)
- [never counts a model that costs extra as included](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/verdict.test.ts#L28)
- [only names two models when they are too close to call](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/verdict.test.ts#L32)
- [matches positions and scores to the chart](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/verdict.test.ts#L38)
- [shows each pick once](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/verdict.test.ts#L50)

### src/lib/norm.test.ts

- [%s: messages agree with the page evidence and prices](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/norm.test.ts#L15)
- [counts visible direct and related evidence without counting a sparse test](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/norm.test.ts#L32)
- [fails loudly when a template needs a fact the page does not have](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/norm.test.ts#L52)
- [says the top two are too close to call, and lets price decide when it differs](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/norm.test.ts#L56)
- [never says one model leads when Norm says it's a tie](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/norm.test.ts#L61)
- [rejects data claims in an intro](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/norm.test.ts#L80)
- [allows plain advice](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/norm.test.ts#L86)

### src/lib/tasks.test.ts

- [%s points at real data](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/tasks.test.ts#L12)
- [scores our own test as direct evidence on the Excel page](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/tasks.test.ts#L17)
- [%s has a task page with evidence](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/tasks.test.ts#L23)
- [%s inherits or has evidence and ranks models](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/tasks.test.ts#L29)
- [gives most hubs some specific tasks and counts their demand in the hub](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/tasks.test.ts#L34)
- [never labels inherited evidence as testing the specific task directly](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/tasks.test.ts#L40)
- [bases the score on close evidence only when it exists](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/tasks.test.ts#L46)
- [never scores a model on people's votes alone when the task has tests of real work](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/tasks.test.ts#L55)

### server/index.test.ts

- [passes the signup to Intelligence Snacks and preserves attribution](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/server/index.test.ts#L11)
- [returns Intelligence Snacks errors to the form](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/server/index.test.ts#L29)
- [permanently redirects %s to the preferred URL](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/server/index.test.ts#L46)
- [does not redirect the canonical HTTPS URL](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/server/index.test.ts#L65)
- [does not redirect internal deployment hosts](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/server/index.test.ts#L69)
- [gives HEAD the same status and representation headers as GET without a body](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/server/index.test.ts#L75)
- [returns a stable content length when compression is not requested](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/server/index.test.ts#L92)
- [respects an explicit refusal of gzip](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/server/index.test.ts#L102)
- [only marks fingerprinted build assets immutable](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/server/index.test.ts#L113)
- [logs privacy-minimal structured data for %s](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/server/index.test.ts#L125)
- [does not log ordinary visitor requests](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/server/index.test.ts#L148)

### src/lib/demand.test.ts

- ["%s" is grouped as %s](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/demand.test.ts#L8)
- [does not match inside other words](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/demand.test.ts#L25)
- [exists and has no failed requests](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/demand.test.ts#L33)
- [groups almost all of the signal into intents](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/demand.test.ts#L38)
- [gives every in-scope intent some demand](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/demand.test.ts#L42)

### evals/spreadsheet-questions/suite.test.ts

- [match what the generator produces](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/evals/spreadsheet-questions/suite.test.ts#L14)
- [%s: answer key checks out](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/evals/spreadsheet-questions/suite.test.ts#L18)
- [keeps prompts small](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/evals/spreadsheet-questions/suite.test.ts#L35)
- [gives 100 for all correct answers](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/evals/spreadsheet-questions/suite.test.ts#L51)
- [allows rounding, currency symbols and different name case](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/evals/spreadsheet-questions/suite.test.ts#L55)
- [marks a wrong number wrong](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/evals/spreadsheet-questions/suite.test.ts#L62)
- [counts the mock answer as 5 of 6](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/evals/spreadsheet-questions/suite.test.ts#L68)
- [reads the final answers after any working](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/evals/spreadsheet-questions/suite.test.ts#L72)
- [scores 0 when the answer is not JSON](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/evals/spreadsheet-questions/suite.test.ts#L76)

### evals/messy-spreadsheet-questions/suite.test.ts

- [match what the generator produces](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/evals/messy-spreadsheet-questions/suite.test.ts#L28)
- [%s: answer key checks out and the mess is there](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/evals/messy-spreadsheet-questions/suite.test.ts#L32)
- [makes the lazy reading give the wrong biggest customer](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/evals/messy-spreadsheet-questions/suite.test.ts#L45)
- [keeps duplicate rows identical to the original](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/evals/messy-spreadsheet-questions/suite.test.ts#L55)
- [keeps prompts a manageable size](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/evals/messy-spreadsheet-questions/suite.test.ts#L66)
- [counts the mock answer as 7 of 8](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/evals/messy-spreadsheet-questions/suite.test.ts#L73)
- [accepts any spelling of the right customer](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/evals/messy-spreadsheet-questions/suite.test.ts#L77)
- [marks a wrong count wrong](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/evals/messy-spreadsheet-questions/suite.test.ts#L84)

### src/lib/search.test.ts

- ["%s" resolves to %s](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/search.test.ts#L23)

### evals/unusual-transactions/suite.test.ts

- [reproduces all five committed fixtures](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/evals/unusual-transactions/suite.test.ts#L8)
- [%s: only planted rows break a rule](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/evals/unusual-transactions/suite.test.ts#L15)
- [covers every problem type across the five cases](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/evals/unusual-transactions/suite.test.ts#L29)
- [gives 100 for finding everything with no false alarms](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/evals/unusual-transactions/suite.test.ts#L38)
- [accepts either row of a duplicate pair and tolerates code fences](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/evals/unusual-transactions/suite.test.ts#L42)
- [counts false alarms and misses](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/evals/unusual-transactions/suite.test.ts#L47)
- [scores 0 when the answer is not in the required format](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/evals/unusual-transactions/suite.test.ts#L55)

### src/lib/rules.test.ts

- [treats a benchmark subset linked to a task as direct and other subsets as proxy](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/rules.test.ts#L43)
- [allows only moderate from a single direct source](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/rules.test.ts#L51)
- [allows strong with two direct sources including an independent one](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/rules.test.ts#L56)
- [caps predecessor-only evidence at limited](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/rules.test.ts#L62)
- [returns insufficient without a model](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/rules.test.ts#L69)
- [passes on the committed content](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/rules.test.ts#L76)
- [rejects confidence above the evidence ceiling](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/rules.test.ts#L80)
- [refuses to publish an unreviewed or unverified recommendation](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/rules.test.ts#L86)
- [requires measured claims to cite results](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/rules.test.ts#L95)
- [flags new evidence published after review and stale reviews](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/rules.test.ts#L103)
- [flags a cited result that has been superseded](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/rules.test.ts#L114)

### scripts/seo-audit.test.ts

- [passes mechanical integrity for a canonical sitemap page](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/scripts/seo-audit.test.ts#L51)
- [fails incorrect canonicals and sitemap pages marked noindex](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/scripts/seo-audit.test.ts#L58)
- [fails internal page links that have no generated public page](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/scripts/seo-audit.test.ts#L65)
- [fails when training crawlers are allowed or search crawler policy is absent](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/scripts/seo-audit.test.ts#L71)
- [reports review diagnostics without failing integrity](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/scripts/seo-audit.test.ts#L81)
- [fails incomplete social metadata](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/scripts/seo-audit.test.ts#L96)

### src/lib/freshness.test.ts

- [returns a stable ISO date for %s](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/freshness.test.ts#L5)

### src/lib/normie-tests.test.ts

- [ranks by answers right, then cost, then time](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/normie-tests.test.ts#L8)
- [keeps models from earlier runs when a later run only adds some](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/normie-tests.test.ts#L50)
- [uses each model's most recent answers and ignores mock runs](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/normie-tests.test.ts#L56)
- [does not publish an unapproved or incomplete replacement](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/normie-tests.test.ts#L62)
- [starts afresh when the suite version changes](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/normie-tests.test.ts#L73)

### src/lib/plans.test.ts

- [runs with drafts visible, so these checks cover every plan](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/plans.test.ts#L9)
- [compares every current model and every model a plan uses](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/plans.test.ts#L14)
- [doesn't compare old versions no plan uses](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/plans.test.ts#L20)
- [allows at most one sourced default; access alone does not establish a default](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/plans.test.ts#L25)
- [does not promise a fixed default for Gemini free automatic selection](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/plans.test.ts#L29)
- [lists the plans for a model cheapest first](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/plans.test.ts#L36)

### scripts/import-guards.test.ts

- [matches presentation changes without merging version or effort](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/scripts/import-guards.test.ts#L12)
- [rejects empty, reduced, regressed and invalid evidence](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/scripts/import-guards.test.ts#L19)
- [rejects a mutable specification alias changing exact versions](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/scripts/import-guards.test.ts#L25)
- [leaves all accepted files untouched if one source fails](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/scripts/import-guards.test.ts#L31)

### src/lib/overview.test.ts

- [covers every compared model and validates prices when they are known](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/overview.test.ts#L9)
- [never marks a model as independently tested without independent results](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/overview.test.ts#L17)
- [keeps the source model identifier on every imported result](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/overview.test.ts#L21)
- [produces the four quick picks](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/overview.test.ts#L25)

### src/lib/page-metadata.test.ts

- [puts benchmark names first and keeps indexed benchmark titles concise](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/page-metadata.test.ts#L10)
- [keeps indexed task metadata unique without putting a changing month in the title](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/page-metadata.test.ts#L21)
- [uses a compact factual model template](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/page-metadata.test.ts#L31)

### src/lib/structured-data.test.ts

- [derives canonical site, page, approved publisher and reviewer entities](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/structured-data.test.ts#L5)
- [adds article dates and an ItemList that exactly preserves visible order](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/structured-data.test.ts#L28)
- [escapes less-than signs before embedding JSON in HTML](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/structured-data.test.ts#L60)

### scripts/indexability-review.test.ts

- [classifies every current public route without applying a site change](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/scripts/indexability-review.test.ts#L12)
- [writes a stable CSV register](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/scripts/indexability-review.test.ts#L24)

### src/lib/answer-summary.test.ts

- [states measured task coverage and names the strongest areas](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/answer-summary.test.ts#L5)
- [does not manufacture a ranking when relevant evidence is missing](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/answer-summary.test.ts#L16)

### src/lib/comparisons.test.ts

- [keeps draft comparisons out of production and exposes them in preview](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/comparisons.test.ts#L5)
- [derives shared task and test facts from canonical model data](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/comparisons.test.ts#L16)

### src/lib/indexability.test.ts

- [excludes every child task but keeps parent task pages indexable](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/indexability.test.ts#L5)
- [restores all nine enriched historical model pages under D-039](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/indexability.test.ts#L10)

### src/lib/public-dataset.test.ts

- [reproduces the complete published spreadsheet run with the approved scoped licence](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/public-dataset.test.ts#L7)
- [flattens every model, case and question into CSV rows](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/public-dataset.test.ts#L23)

### src/lib/historical-specs.test.ts

- [keeps the September exact version specs and their original retrieval date](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/historical-specs.test.ts#L4)

### src/lib/trust-pages.test.ts

- [exposes all four routes in production and preview](https://github.com/andymdavid/normie-mode/blob/maintenance/model-catchup/src/lib/trust-pages.test.ts#L5)
