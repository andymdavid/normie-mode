# November maintenance review

The maintenance implementation and live scheduler are separate from approval to publish new model data. The daily, weekly and monthly deterministic pipelines have each completed successfully. The scheduler's exact-bound daily launcher also posted a task comment from its own session, verifying the Flight Deck reporting path.

Review the nine new exact-version model records, the refreshed snapshots and `catchup-impact-2026-11-20.json`. Google US plan access is freshly verified; new Claude and OpenAI access rows cite primary sources but retain old whole-plan review dates because older prices/defaults were not re-verified. Kimi's global USD plan/model mapping remains unresolved; do not replace it with China pricing or infer consumer-chat access from Coding Plan documentation.

DeepSeek's mutable `deepseek-flash` route serves the dated October 17 version. The September model's archived specs are preserved with their original October retrieval provenance. Its old benchmark results are never transferred to 1017. Kimi Highspeed and model fallback routes are not silently consolidated into the ordinary model. Gemini 4 Argon remains outside this candidate pending a focused availability/plan review rather than relying on the old limited-preview decision.

Provider pricing was checked against the live models.dev API: Fable 5.2 is $8/$40 per million tokens there and in Anthropic's own documentation. A stale rendered catalogue observation is not a current API-data discrepancy. Carbon's provider page says the $2/$10 introductory API price ends on 30 November; the subsequent $4/$20 pricing should be picked up by the normal review loop.

The prepared evaluation is messy-spreadsheet-questions v1: five fixed cases, one repeat, ten models, approximately $16.58 with a runner budget of $20. The proposal JSON is unapproved. A paid run requires a fresh matching manifest with reviewer/date; it will remain quarantined and needs separate publication review. Route IDs and price inputs are bound into that manifest so an alias/price change invalidates approval.

The public fixed cases preserve comparability, but public availability means they cannot be guaranteed absent from future training data. Results should retain that limitation; a later fresh/withheld suite would need a versioned protocol decision. One repeat does not settle close rankings. Synthetic pasted text is not an Excel application test.

Review order: maintenance tooling, then the combined model/evidence candidate and before/after picks, then any paid evaluation, then publication. No PR has been merged and production is unchanged. Once the approved code and data are merged, change scheduled pipeline `sourceBranch` to `main` through a new definition version; do not leave it on a stale review branch.
