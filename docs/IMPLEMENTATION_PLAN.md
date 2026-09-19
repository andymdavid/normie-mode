# Implementation Plan

Status: Draft for product definition  
Last updated: 2026-09-17  
Current phase: Phase 0 — Definition and validation

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

## Open decisions

- D-003: Recommendation and confidence methodology
- D-005: Capability taxonomy granularity
- D-006: Canonical task rule and initial task set
- D-007: Initial model set
- D-008: Benchmark selection criteria
- D-009: First-party test protocol
- D-010: Task page and report boundary
- D-011: Freshness policy
- D-012: Initial data workflow
- D-013: Technology stack
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

- Status: `ready`
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

### P0-004 — Define initial model set and comparison policy

- Status: `proposed`
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

### P0-005 — Define recommendation and confidence rubric

- Status: `proposed`
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

- Status: `proposed`
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

- Status: `proposed`
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

- Status: `blocked`
- Dependencies: P0-008
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

- P1-001: Assemble structured sample data for one task.
- P1-002: Produce the full-fidelity task-page prototype.
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
