# Normie Mode Agent Guide

## Purpose

Build Normie Mode into a trustworthy, task-first reference for what AI can actually do. Preserve the product chain:

`Evidence -> Capability -> Work`

Read these files before making changes (the vision predates the D-018 direction reset; where they conflict, the plan's decisions win):

1. `Normie Mode Product Vision.md`
2. `docs/IMPLEMENTATION_PLAN.md`
3. `CHANGELOG.md`

## Product guardrails

- Normie Mode is model comparison translated for non-experts (D-018). Use the reference sites in `docs/IMPLEMENTATION_PLAN.md` for structure; make every label, metric and chart readable by someone whose job isn't AI.
- Distil, don't describe (D-021): lead with data and visuals, keep words short, and never publish generated editorial prose without product-owner review.
- Only use data sources accepted in D-019, and keep each value's source, retrieval date and licence.
- The canonical comparison unit is the model, identified by exact model version. Apps and plans are mapped to models (D-026) so pages can say where to get a model, but they are never tested or ranked as separate entities.
- Keep measured facts, sourced claims, editorial assessments, and recommendations distinguishable.
- Preserve source, model or product version, evaluation date, and methodology for important evidence.
- Do not present a recommendation that cannot explain why it exists and what still needs checking.
- Do not invent unresolved product decisions. Record them in the decision section of `docs/IMPLEMENTATION_PLAN.md` and continue only where the decision does not materially affect the work.
- Prefer a complete, credible vertical slice over broad but shallow coverage.
- Human editorial review remains required for publishing and recommendation changes until a later decision explicitly changes this.

## Plan discipline

- Work against a task ID in `docs/IMPLEMENTATION_PLAN.md`.
- Before starting, confirm the task's dependencies and acceptance criteria.
- Use these task states: `proposed`, `ready`, `in_progress`, `blocked`, `done`.
- Only mark a task `done` when its acceptance criteria and listed verification have been satisfied.
- If implementation reveals a missing product decision, add or update a `D-###` entry in `docs/IMPLEMENTATION_PLAN.md`.
- Do not change an accepted decision without recording the superseding decision and its consequences.

## Required handoff updates

After meaningful work:

1. Update the task state in `docs/IMPLEMENTATION_PLAN.md`.
2. Add a short progress note to the implementation plan only when it helps the next agent resume work.
3. Add a user-visible product or documentation change to `CHANGELOG.md` under `Unreleased`.
4. Keep code comments and progress notes factual; do not use them as a substitute for acceptance criteria.

## Change safety

- Preserve unrelated user changes.
- Keep schema changes reversible while the product model is still being validated.
- Treat evidence and recommendation history as append-oriented records; do not silently overwrite provenance.
- Never publish generated editorial content or automatically change public recommendations without an accepted decision authorising it.

## Verification

- `npm run validate`: content integrity, provenance, confidence ceilings and review flags. Must pass with no errors.
- `npm test`: rule and intent-search tests.
- `npm run check`: type-check.
- `npm run build`: runs the validator, then builds the public site (drafts hidden). Use `NORMIE_PREVIEW=1` or `npm run dev` to see drafts.

Content rules for agents: write new recommendations with `status: draft` and `reviewer: unreviewed`. Never set `status: published`. Add results as new records, and use `supersedes` for corrections. Cite the original benchmark owner, paper or provider, never an aggregator site.

Documentation work should also be checked for internal links, task-ID consistency, decision references, and contradictions with the vision.
