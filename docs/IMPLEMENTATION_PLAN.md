# Implementation Plan

Status: Phase 0–2 running together (D-016)  
Last updated: 2026-09-23  
Current phase: Phase 0 decisions under review; Phase 1 prototype built

## Objective

Deliver a trustworthy first vertical slice that answers a recognisable work question, explains the recommendation, exposes its evidence and limitations, and can be kept current through structured dependencies.

The full engineering backlog will be expanded after the blocking decisions are accepted. Tasks below the current phase are intentionally outcome-level until the product model and technology stack are settled.

## Accepted product decisions

### D-001 — First audience

SME operators and finance-adjacent knowledge workers who own recurring spreadsheet analysis, reporting, cleanup, reconciliation, or planning work. They use spreadsheets competently but do not evaluate AI models professionally. They need to know which model can help, how reliable it is, and what still requires checking.

### D-002 — First task family

Business spreadsheet work. The pilot will cover major general-purpose models and exact model versions applied to XLSX and CSV tasks. Product, plugin, wrapper, and spreadsheet-application comparisons are excluded.

### D-004 — Comparison unit

Models, identified by exact model version. Evaluation configuration and enabled tools are methodology metadata, not separate comparison entities.

### D-013 — Technology stack (accepted 2026-09-23)

Astro with TypeScript, generating a static site. Canonical content lives in the repository as YAML files under `content/`, loaded by a small graph loader (`src/lib/graph.ts`) and validated by Zod schemas (`src/lib/schema.ts`). The site and validator share that loader rather than using Astro content collections, so the same rules run in tests, the build gate and page rendering. A build-time validator (`src/lib/rules.ts`) enforces graph integrity, provenance rules, confidence ceilings, and freshness. Postgres is deferred until the freshness loop or intelligence layer needs a running service. Hosting is deferred; the site builds and previews locally.

### D-012 — Initial data workflow (accepted 2026-09-23, follows from D-013)

Content is edited as files and reviewed through git pull requests. Git history is the audit trail. Evidence results are append-only: a corrected result is a new record that names the record it `supersedes`. Recommendations carry an editorial `status` (`draft`, `published`, `withdrawn`); only `published` recommendations render publicly.

### D-016 — Compressed Phase 0 (accepted 2026-09-23)

Phases 0–2 run together. The agent drafts the remaining blocking decisions as proposals, the product owner accepts or amends them, and the Phase 1 content prototype is built as the real codebase rather than a throwaway mock. Consequence: schema changes must stay cheap while the model is validated (file-based content makes this easier), and user comprehension sessions (P1-003) still happen before the public slice is considered done.

### D-017 — Editorial approver (accepted 2026-09-23)

Andy David, the product owner, is the named human reviewer for publishing and recommendation changes until another reviewer is added. Agents draft; only Andy sets `status: published` and his name as `reviewer`.

### D-003 — Recommendation and confidence methodology (accepted 2026-09-23)

Recommendations are editorial, scoped to a task, and bounded by evidence. The system does not compute a winner; it computes a **confidence ceiling** an editor cannot exceed:

- **Evidence relevance** to a task: `direct` (the benchmark or test measures this task), `proxy` (it measures a core capability of the task), `indirect` (supporting capability or general ability).
- **Confidence labels**: `strong`, `moderate`, `limited`, `insufficient`.
- **Ceiling rules** (enforced at build):
  - `strong` requires direct evidence on the exact version from at least two sources, at least one of which is independent or first-party.
  - `moderate` requires direct evidence on the exact version, or proxy evidence from at least two sources.
  - `limited` requires at least one relevant result on the exact version.
  - Evidence on a predecessor version can support at most `limited` and must be stated in the rationale.
  - Otherwise the page says `insufficient` and names the evidence gap.
- Every recommendation has scope (`best-overall` by default; other scopes only when evidence differentiates), rationale, confidence, limitations, human checks, supporting evidence, review date, and reviewer.

### D-006 — Canonical task rule and initial task set (accepted 2026-09-23)

A task is canonical when it has a distinct user goal **and** either distinct success criteria or a distinct evidence/checking profile. Keyword variants (e.g. "AI for Excel formulas", "can ChatGPT write VLOOKUP") are aliases of a task, never separate tasks. Initial set of 10:

`analyse-a-spreadsheet`, `clean-up-messy-data`, `reconcile-two-lists`, `write-a-formula`, `fix-a-broken-workbook`, `build-a-monthly-report`, `compare-budget-to-actuals`, `build-a-financial-model`, `create-charts`, `spot-unusual-transactions`.

Each task records its user goal, inclusion boundary, success concept, required capabilities (`core` or `supporting`), aliases, and related tasks. Canonical data lives in `content/tasks/`.

## Proposed decisions (awaiting product-owner acceptance)

These are drafted so the build can proceed. The prototype implements them, which makes changing them cheap. Each needs explicit acceptance.

### D-005 — Capability taxonomy granularity (proposed)

Capabilities are the reusable skills that evidence measures and tasks require. They are coarser than benchmark subskills and finer than "spreadsheet work". A capability is only separate if some evidence can distinguish it and at least two tasks depend on it differently. Initial spreadsheet-slice set:

| ID | Name | Plain-English meaning |
| --- | --- | --- |
| `workbook-comprehension` | Understanding a workbook | Reading messy real-world layouts, multiple sheets, headers, and how the pieces relate |
| `careful-inspection` | Checking before acting | Inspecting enough of the file to find the right cells and notice what matters before changing anything |
| `formula-work` | Formulas | Writing, explaining, and repairing spreadsheet formulas and dependencies |
| `numerical-reasoning` | Business number work | Doing arithmetic and financial logic correctly, applying the right method and caveats |
| `data-transformation` | Reshaping and cleaning data | Cleaning, standardising, matching, merging, and reshaping tables |
| `charts-and-presentation` | Charts and presentation | Turning numbers into charts and readable reports |
| `multi-step-execution` | Seeing a long job through | Completing many coordinated edits across a workbook without losing track |

`careful-inspection` is a deliberate inclusion: SpreadsheetBench 2 identifies insufficient inspection and wrong-target selection as the dominant failure modes, and it is exactly what a user needs to know to check.

### D-007 — Initial model set (proposed)

Five families, tracked at exact version: Anthropic Claude, OpenAI GPT, Google Gemini, Moonshot Kimi, DeepSeek. Current versions in scope as of 2026-09-23: Claude Fable 5.1, Claude Opus 5.5, GPT-6 Astra, GPT-6 Sol, Gemini 3.8 Flash, Gemini 3.1 Pro, Kimi K3, DeepSeek V4 Pro. All confirmed against provider pages on 2026-09-23; Opus 5.5 (released 2026-09-23) and GPT-6 Sol (2026-09-22) replace Opus 5 and GPT-5.6 Sol. Gemini 3.7 Flash is recorded as superseded by 3.8 Flash but holds the top AA-AnalystAgent result. Predecessor versions (e.g. Claude Opus 4.6, GPT-5.2) are recorded with `lifecycle: superseded` when they carry evidence, so that evidence stays attributable to the version actually tested and is never silently inherited by a successor. Evaluation configuration (reasoning effort, tools, scaffold) is stored on each result, not on the model version. Version names are verified against a provider source before a recommendation may cite them.

### D-008 — Benchmark selection criteria (proposed)

Include a benchmark when it (1) directly measures a slice task or a core capability, (2) publishes methodology, and (3) has results on at least one in-scope model version. Aggregator sites are never the cited source for a result; cite the benchmark owner, paper, or provider report, and label provider-reported results. Initial set: SpreadsheetBench (v1), SpreadsheetBench 2, AA-AnalystAgent.

### D-010 — Task page and report boundary (proposed)

Task pages are the canonical, evergreen answer for an intent cluster and own the recommendation. Reports are dated, editorial pieces (comparisons, "what changed") that must link to and never restate a different recommendation from the canonical task page. Canonical URLs: `/tasks/<task>`, `/capabilities/<capability>`, `/models/<model-version>`, `/benchmarks/<benchmark>`, `/sources/<source>`. Reports are deferred from the first slice.

### D-011 — Freshness policy (proposed)

A published recommendation is flagged for review when: a newer version appears in the same model family as a pick; a new result is added for a benchmark linked to any of the task's core capabilities; a cited result is superseded or its source withdrawn; or its review date is older than 90 days. Flags are generated by the build validator as a review report; nothing changes publicly without a human edit.

## Open decisions

- D-009: First-party test protocol
- D-014: Smallest useful intelligence layer
- D-015: Pilot success gate

## Status vocabulary

- `proposed`: useful work, but scope or prerequisite decisions are incomplete
- `ready`: dependencies are satisfied and an agent can begin
- `in_progress`: active work exists
- `blocked`: a named dependency prevents useful progress
- `done`: acceptance criteria and verification are complete

## Phase gates

| Phase | Outcome | Entry condition | Exit condition |
| --- | --- | --- | --- |
| 0. Definition | Settled wedge, taxonomy, model scope, recommendation rubric, and pilot success criteria | Vision exists | D-001 through D-015 needed for the pilot are accepted; prototype brief is approved |
| 1. Content prototype | A complete, evidence-backed task page assembled from real structured data | Phase 0 complete | Representative users can understand the answer, rationale, and caveats; schema gaps are documented |
| 2. Foundation | Validated canonical schema, repository, application skeleton, content validation, and editorial workflow | Prototype learnings captured | Seed data can generate complete public pages and provenance checks pass |
| 3. Public slice | Searchable spreadsheet-work experience with task, capability, model, benchmark, and evidence surfaces | Foundation stable | Slice is deployable, accessible, observable, and meets content-quality checks |
| 4. Evaluation pilot | Reproducible first-party spreadsheet test suite with inspectable artefacts | Model scope and methodology accepted | Pilot results reproduce within defined tolerances and editorial review is complete |
| 5. Freshness loop | Change intake, dependency impact, review queue, and recommendation history work end to end | Public content and evidence graph exist | A real upstream change is detected, reviewed, and propagated with an audit trail |
| 6. Expansion decision | Evidence-based choice to deepen spreadsheets or add a new task family | Pilot measures available | Expansion scope and revised plan are accepted |

## Phase 0 — Definition and validation

### P0-001 — Establish durable project operating files

- Status: `done`
- Dependencies: none
- Deliverables: `AGENTS.md`, canonical implementation plan, changelog
- Acceptance criteria:
  - Agents have a documented read order and update protocol.
  - Open decisions have stable IDs.
  - Work can be tied to task IDs and phase gates.
- Verification: Manual cross-link and ID review.

### P0-002 — Select first audience and task family

- Status: `done`
- Dependencies: P0-001
- Decision outputs: D-001, D-002
- Work:
  - Compare 2–3 plausible audience/wedge combinations.
  - Use demand, practical value, available evidence, testability, and access as criteria.
  - Validate the leading hypothesis with current external evidence and product-owner review. Representative user sessions occur during the content prototype.
- Acceptance criteria:
  - D-001 and D-002 are accepted with evidence and consequences.
  - A named primary user and core problem are written in plain language.
  - Explicit non-goals identify adjacent audiences and task families deferred from the pilot.
- Verification: Decision review against vision and research notes.

Progress note: Accepted spreadsheet work for SME operators and finance-adjacent knowledge workers on 2026-09-17. The comparison considered spreadsheet work, research/document analysis, and small-business coding. Spreadsheet work offered the strongest combination of work-first audience fit, model-comparison evidence, inspectable artefacts, deterministic checks, and room for plain-English translation. SpreadsheetBench, SpreadsheetBench 2, and AA-AnalystAgent provide initial external evidence. Research was deferred because browsing and orchestration dominate many results; coding was deferred because it serves a more technical audience and already has dense specialist coverage.

### P0-003 — Define canonical task and capability taxonomy

- Status: `in_progress`
- Dependencies: P0-002
- Decision outputs: D-005, D-006
- Work:
  - Draft 8–12 canonical tasks for the selected family.
  - Draft 5–8 capabilities and map each task to required capabilities with simple importance levels.
  - Map common query variants to canonical tasks.
  - Test for overlap, missing goals, and distinctions without different evidence needs.
- Acceptance criteria:
  - Every pilot task has a stable ID, name, user goal, inclusion boundary, and success concept.
  - Every capability has a plain-English definition and practical relevance.
  - No two tasks differ only by keyword wording.
- Verification: Taxonomy review using at least 20 representative queries or user phrasings.

Progress note (2026-09-23): Draft taxonomy is in `content/tasks` and `content/capabilities` (D-005, D-006). `src/lib/search.test.ts` resolves 21 representative phrasings to single canonical tasks. Awaiting product-owner acceptance.

### P0-004 — Define initial model set and comparison policy

- Status: `in_progress`
- Dependencies: P0-002
- Accepted constraint: D-004
- Decision output: D-007
- Work:
  - Define canonical model and model-version metadata.
  - Select 4–6 initial model families using relevance, evidence availability, access, and current usage.
  - Define how model aliases, dated versions, retirements, and successor versions are represented.
  - Define the evaluation-configuration metadata needed to interpret results without treating products or wrappers as comparison entities.
- Acceptance criteria:
  - A reader can tell exactly which model version was evaluated, when, under which configuration, and why the comparison is fair enough to be useful.
  - Products and wrappers cannot enter the canonical comparison set.
  - Provider-specific tooling rules and exceptions are explicit methodology.
- Verification: Walk through two versions of one model family and two materially different model configurations and confirm they remain distinguishable.

Progress note (2026-09-23): 16 model versions across five families in `content/models`, with successor chains. Only Kimi K3 is verified against a provider source. The other current version names come from third-party coverage and must be confirmed before any recommendation citing them can be published (enforced by the validator).

### P0-005 — Define recommendation and confidence rubric

- Status: `in_progress`
- Dependencies: P0-003, P0-004
- Decision output: D-003
- Work:
  - Define evidence relevance, quality, independence, recency, reliability, access, cost, and speed considerations.
  - Separate measured observations from editorial judgement.
  - Define recommendation scopes such as best overall, value, or complex work only when evidence supports them.
  - Define confidence labels and minimum evidence requirements.
- Acceptance criteria:
  - Two editors applying the rubric to the same evidence can explain any disagreement.
  - Every recommendation has scope, rationale, confidence, limitations, review date, and supporting evidence.
  - The rubric can return “insufficient evidence.”
- Verification: Apply it to two pilot tasks and compare independent assessments.

### P0-006 — Define source, claim, provenance, and freshness rules

- Status: `in_progress`
- Dependencies: P0-005
- Decision outputs: D-008, D-011
- Work:
  - Define evidence classes and source requirements.
  - Define a material claim and its support relationship.
  - Define review triggers for new model versions, changed results, changed methodologies, and time-based staleness.
  - Define correction and supersession behaviour.
- Acceptance criteria:
  - Every material factual claim can point to a source and retrieval/publication date.
  - Evidence records preserve exact target and evaluation versions where available.
  - A changed or withdrawn source can identify affected assessments and recommendations.
- Verification: Run one source-change impact exercise on sample records.

### P0-007 — Write first-party evaluation pilot protocol

- Status: `proposed`
- Dependencies: P0-003, P0-004, P0-005
- Decision output: D-009
- Work:
  - Select 5–8 candidate cases.
  - Specify inputs, instructions, model versions, evaluation configurations, run count, deterministic checks, human scoring, intervention rules, cost/time capture, and artefact retention.
  - Define what the pilot will not claim.
- Acceptance criteria:
  - Another evaluator can reproduce the procedure from the protocol.
  - Subjective dimensions have anchored rubrics.
  - Nondeterminism and failed runs have explicit treatment.
- Verification: Dry-run one case on at least two targets.

### P0-008 — Define information architecture and prototype brief

- Status: `in_progress`
- Dependencies: P0-003, P0-004, P0-005
- Decision output: D-010
- Work:
  - Define canonical URLs and page responsibilities.
  - Specify one full task page and the minimum linked capability, model, benchmark, and source views.
  - Define structured search behaviour for the slice.
- Acceptance criteria:
  - Each content type answers a distinct user question.
  - Task and report responsibilities do not overlap.
  - The task-page prototype includes quick answer, capability assessment, recommendations, what AI can do, checks, evidence, and related tasks.
- Verification: Five representative user intents resolve to an unambiguous canonical destination.

### P0-009 — Define pilot measurement and expansion gate

- Status: `proposed`
- Dependencies: P0-002, P0-008
- Decision output: D-015
- Work:
  - Choose comprehension, trust, usefulness, traceability, freshness, and operating-cost measures.
  - Define collection methods and decision thresholds after establishing baselines.
- Acceptance criteria:
  - Measures can distinguish a useful product from a page that merely attracts traffic.
  - Expansion criteria and stop/rework criteria are explicit.
- Verification: Measurement review against the V1 objective and definition of done in this plan.

### P0-010 — Select implementation stack and repository conventions

- Status: `in_progress`
- Dependencies: P0-008 (unblocked early by D-016)
- Decision outputs: D-012, D-013
- Work after unblock:
  - Decide application framework, database, content workflow, search, artefact storage, hosting, analytics, and test approach.
  - Initialise version control and project tooling.
  - Expand Phases 1–5 into engineering-sized tasks with file-level scope and verification commands.
- Acceptance criteria:
  - Choices support structured generation, provenance, migrations, full-text search, preview, and a human review workflow.
  - Local setup and validation commands are documented.
  - Every engineering task is independently actionable by an agent or explicitly names its dependency.
- Verification: Fresh-environment setup and one end-to-end sample content build.

Progress note (2026-09-23): Stack in place. Commands: `npm install`, `npm run dev` (drafts visible), `npm run validate`, `npm test`, `npm run check`, `npm run build` (validator gates the build; drafts hidden unless `NORMIE_PREVIEW=1`). Hosting (part of D-013) deferred. Remaining: expand Phases 1–5 into engineering tasks once the proposed decisions are accepted.

### P0-011 — Define the smallest useful intelligence layer

- Status: `proposed`
- Dependencies: P0-006, P0-008
- Decision output: D-014
- Work:
  - Define the initial inputs for new evidence, model changes, and stale dependencies.
  - Define a human-reviewed candidate inbox and the states from discovery to dismissal or publication work.
  - Separate pilot requirements from later demand clustering and opportunity scoring.
- Acceptance criteria:
  - The first implementation can surface actionable changes without automatically publishing content.
  - Every candidate retains source, discovery time, reason, affected entities, and review outcome.
  - Demand scoring and broad trend ingestion are explicitly deferred unless required by the pilot.
- Verification: Walk one new-evidence event and one changed-target event through the proposed workflow.

## Later-phase outcome backlog

These items are not ready for implementation. Expand them after P0-010.

### Phase 1 — Content prototype

- P1-001: Assemble structured sample data for one task. (`in_progress`: 33 sourced results from SpreadsheetBench 2, AA-AnalystAgent and the Kimi K3 report)
- P1-002: Produce the full-fidelity task-page prototype. (`in_progress`: `/tasks/analyse-a-spreadsheet` and `/tasks/fix-a-broken-workbook` are full pages, each with a draft recommendation awaiting editorial review)
- P1-003: Conduct comprehension and trust sessions.
- P1-004: Revise taxonomy, rubric, and content model from findings.

### Phase 2 — Foundation

- P2-001: Initialise application and CI.
- P2-002: Implement canonical schema and migrations.
- P2-003: Implement structured seed/import validation.
- P2-004: Implement editorial states, preview, and audit history.
- P2-005: Implement provenance and dependency-impact queries.

### Phase 3 — Public slice

- P3-001: Build shared public shell and navigation.
- P3-002: Build task and task-family pages.
- P3-003: Build capability pages.
- P3-004: Build model and model-version pages.
- P3-005: Build benchmark and source explainers.
- P3-006: Build structured search and intent resolution.
- P3-007: Add metadata, accessibility, analytics, and performance budgets.

### Phase 4 — Evaluation pilot

- P4-001: Implement evaluation case format and validation.
- P4-002: Implement runner or documented assisted execution flow.
- P4-003: Implement deterministic graders and human-review capture.
- P4-004: Store and expose inspectable artefacts.
- P4-005: Run, review, and publish the pilot.

### Phase 5 — Freshness loop

- P5-001: Implement candidate evidence intake.
- P5-002: Implement dependency impact and stale-page queue.
- P5-003: Implement recommendation review and history.
- P5-004: Exercise the loop with a real model or evidence change.

## Definition of done for the first vertical slice

The slice is complete when:

- A user can begin with a spreadsheet-work question and reach a canonical task answer.
- The answer names the exact evaluated model version and review date.
- The recommendation explains its rationale, confidence, limitations, and required human checks.
- Material claims and assessments have inspectable provenance.
- At least one first-party result includes its input, output artefact, method, and assessment.
- A changed evidence record identifies affected public content and creates a human review action.
- The experience meets agreed accessibility, performance, and content-quality checks.
- Pilot measures support a documented decision to expand, revise, or stop.
