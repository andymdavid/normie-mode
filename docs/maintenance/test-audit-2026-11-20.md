# Software test audit — 20 November 2026

**The 735 headline was a whole-project case count, not 735 independent features, new tests or AI benchmarks. There is no requirement to retain that number.** The maintenance work added seven cases to a pre-existing 728. Test quality and the failures they detect matter more than the total.

[Open the file-by-file inventory and all authored test titles](test-inventory-2026-11-20.md).

## Where the count came from

There were 122 authored definitions in 25 files. Three files accounted for 590 of 735 expanded cases (80%): verdict rules 323, Norm messages 189 and task/evidence integrity 78. For example, seven verdict checks applied to 46 task pages became 322 cases plus one overall check. This is a parameter matrix, not hundreds of hand-written test functions.

The remaining 145 cases included 36 synthetic evaluation/scorer checks, 20 HTTP/server checks, 28 demand/search cases, 11 provenance/confidence checks and 50 other data, publication, metadata and export checks. None of these local tests calls a model or incurs evaluation spend.

## Changes made

| Change | Effect on reported cases | Reason |
|---|---:|---|
| Consolidate three message checks per page into one page contract | −92 | Reuse each page's facts/messages rather than recomputing them repeatedly; all 46 pages remain checked |
| Replace copied evidence-count calculation on every page with one independent fixed fixture | −45 | Three synthetic tests have known direct/related/sparse outcomes; a copy of the implementation was a weak oracle |
| Remove duplicated votes-only check on every verdict | −46 | The retained task rule checks every scored model, and the retained verdict-position check proves each pick belongs to that checked set |
| Remove the committed-pilot “best” assertion | −1 | It compared undefined with undefined if the run was absent; the retained dataset/publication checks already fail on missing real results |
| **Total** | **−184: 735 → 551** | Includes consolidation, not deletion of 184 independent behaviours |

The result is 118 authored definitions, 549 ordinary test cases and two built-site cases. Most remaining multiplicity is intentional data coverage, not a target count. A future source-of-truth content audit could collect more of the page matrix into readable contract reports; do not remove safety coverage merely to hit a smaller number.

Also:

- Removed fixed counts for pages, indexed URLs, benchmark metadata and published responses. Legitimate catalogue/evaluation additions should not require changing arbitrary totals.
- Retained specific reviewed indexing-policy and model-route assertions; these protect actual decisions rather than a page count.
- CSV tests now parse the emitted data and check actual written bytes instead of comparing the writer's returned arrays or assuming 180 result rows forever.
- Missing prices are allowed by the existing product model; any known price must be finite/non-negative. Model admission need not wait for a price.
- Replaced anomaly generation compared with itself with regeneration against all five committed fixtures.
- Publication-loader fixtures now reset between cases and remove temporary directories. Import-guard fixtures clean up too.
- Split built-site integration checks from ordinary tests. A fresh checkout can run ordinary tests without a generated `dist/`; full verification still includes the site checks.

## What remains worth keeping

Protecting exact model versions, preserving accepted data on failed imports, excluding extra-cost models from included-plan recommendations, requiring reviewed complete result runs, keeping inherited evidence labels honest and matching picks to their evidence are proportionate safeguards for a reference site.

Small synthetic tests for HTTP redirects/cache behaviour, exported CSV validity, metadata escaping and publication gates are also useful. Source validators and the built-site audit still inspect the whole output. The numeric count is not evidence that these are fully covered: some files use a few fixtures with many assertions, and some use many parameter cases.

## Coverage gaps found

1. **Independent answer-key checks are incomplete.** Basic spreadsheets independently recompute three of six question keys; messy spreadsheets check four of eight. Some “correct answer” tests feed generated expected answers back into the scorer. That checks scorer plumbing, not whether the expected answer is right. The messy reference also shares the production date parser, so it is not an independent date-parsing oracle. The guide's stronger “every answer checked twice” wording has been corrected. Complete independent oracles before further result publication; this audit has not established that an existing key is wrong.
2. **The paid runner and pipeline orchestration lack a comparable automated failure-path suite.** Paid-approval/route/budget/timeout controls and lock/deduplication/rollback/reporting have substantial code but rely partly on manual checks. The earlier live pipeline and mock-run evidence remains useful, but 735 cases did not prove those paths. If further testing is added, a small mocked boundary suite here is a higher priority than more page permutations.
3. **No end-to-end browser coverage.** Unit and static checks do not prove mobile layout, keyboard navigation or a live newsletter signup. The server tests mock upstream HTTP; they do not send real subscriptions.
4. **Several reference assertions still use shared production helpers.** These are consistency/smoke checks, not independent verification of ranking maths. Keep that distinction visible rather than equating case count with correctness.

## Spot checks that the retained tests detect real faults

Three temporary local mutations were introduced, tested and restored:

- Removing the reviewed-run allowlist caused the publication-loader test to fail.
- Treating extra-cost access as included caused 11 retained verdict cases to fail.
- Counting tests with only one model as usable evidence caused the new fixed-fixture count test to fail.

All three faults were caught. This is a limited audit spot check, not a comprehensive mutation score or coverage claim. No mutated production code remains.

## Running and seeing the tests

```sh
npm test                          # ordinary software/data checks, no build required
npm test -- --reporter=verbose     # display every expanded case name
npm run build && npm run test:site # built HTML/indexability and CSV checks
npm run verify                    # types, content validation/build, both test groups, SEO
```

The no-build test command was exercised with `dist/` temporarily absent and passed (549 cases). The two site cases passed after restoring the build, and the revised full verification command passed. Latest focused checks also cover the generalised metadata/dataset contracts. The publication fixtures also passed a shuffled-order run (seed 42). Type checking reports no errors, warnings or hints. Local timings were about 9.8 seconds for the old combined run, 9.4 seconds for ordinary checks and 3.1 seconds for the separate site run; these are single-run observations, not a speed claim. The split adds process overhead but removes the hidden build prerequisite. Message-test time fell in the observation, but reducing wasted work and improving failure quality were the goals.

## Paid-run hold

**The user's 20 November instruction is explicit: no paid runs for now.** The proposal is marked on hold, and maintenance jobs remain read-only/dry-run for evaluation work. Do not treat the old budget question or an unapproved estimate as permission. Prompts, cases, scorers and suite versions were not changed by this audit; existing model results and production remain unchanged.
