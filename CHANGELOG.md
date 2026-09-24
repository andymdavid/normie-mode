# Changelog

This file records meaningful changes to the Normie Mode product, implementation, data model, methodology, and planning system. Short resume context belongs in `docs/IMPLEMENTATION_PLAN.md` only when it helps the next agent.

## Unreleased

### Added

- Astro site for the spreadsheet slice: homepage with intent search, task, skill, model, benchmark and source pages, a methodology page, and a preview-only editorial review queue.
- Canonical YAML content model with a build-gating validator for graph integrity, claim provenance, confidence ceilings and freshness review flags.
- Seed evidence: SpreadsheetBench 2 paper results, the AA-AnalystAgent leaderboard top three, and SpreadsheetBench 2 results reported by Moonshot AI, all with source, date and configuration.
- Draft taxonomy of 10 spreadsheet tasks and 7 skills, 16 model versions across five families, and two draft recommendations that are not yet reviewed.
- Model versions confirmed against provider pages, adding Claude Opus 5.5 and GPT-6 Sol as successors to Claude Opus 5 and GPT-5.6 Sol.
- Accepted D-003 (confidence rules), D-006 (the 10 spreadsheet tasks) and D-017 (Andy David as editorial approver).
- Proposed decisions D-003, D-005–D-008, D-010 and D-011; accepted decisions D-012, D-013 and D-016.
- Initial product review with strengths, execution risks, recommended first wedge, and V1 proof criteria.
- Phased implementation plan with task IDs, dependencies, acceptance criteria, verification, and phase gates.
- Codex agent operating guide and concise progress-note protocol.

### Changed

- Reframed the initial delivery around a complete vertical slice before expansion across all proposed public entities and capability areas.
- Established models and exact model versions as the canonical comparison unit; products, wrappers, and configured agents are outside the comparison scope, while evaluation configuration remains methodology metadata.
- Selected business spreadsheet work for SME operators and finance-adjacent knowledge workers as the first vertical slice.
- Consolidated product decisions, task status, and essential progress context into the canonical implementation plan.

### Removed

- Interim review, wedge recommendation, decision-register, and worklog documents after consolidating durable information into the implementation plan.
