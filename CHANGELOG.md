# Changelog

This file records meaningful changes to the Normie Mode product, implementation, data model, methodology, and planning system. Short resume context belongs in `docs/IMPLEMENTATION_PLAN.md` only when it helps the next agent.

## Unreleased

### Added

- Apps and plans (D-026, draft): which ChatGPT, Claude, Gemini and Kimi plans include each model, with monthly prices, how sure the mapping is, and the maker's or press source. Model pages show "Where you can use it". Visible in preview until approved.
- GPT-5.6 Luna and Gemini 3.6 Flash, what ChatGPT Free and Gemini Free actually use; older versions still used by a plan are compared alongside current ones.

- Product-clarity plan (D-026 to D-028, stages N-008 to N-013): models mapped to the apps and plans people use, a rule-based verdict on each task page, and retiring the prototype pages.
- Model pages rebuilt: where the model ranks on every task, its results on every test we use, cost, evidence status and what the maker says; the models list shows how many tasks each model is in the top three for.
- "Tests explained" rebuilt from the tests the task pages use: 25 tests in two groups (tests of real work, people's votes), each with a chart and the tasks it feeds.
- "How it works" rewritten to describe what the site actually does: sources, closeness labels, the task score, too-close-to-call, evidence status, cost and who writes what.

- Task cards on the homepage and "Best AI for…" list each hub's specific tasks, so all 46 task pages are one click away.
- Charts point out when the top two are too close to call, and say how much more the dearer one costs; the summary line above the chart then says they're neck and neck instead of naming a leader.
- 31 specific task pages under the 15 hubs (e.g. vibe coding, job hunting, essay writing, travel planning), with inherited evidence labelled as related rather than direct.
- Norm's four faces (default, happy, smug, wise) chosen per line, with a hover effect that enlarges the avatar and swaps faces.

### Fixed

- `npm run import -- --offline` no longer stamps reused data with today's date; each snapshot keeps the date it was downloaded.
- Phones: the homepage's "People's votes" chart was pushed off screen, and the header wrapped into a jumble; the header now has two tidy rows.
- Build time down from about 16 seconds to under one, by grouping search demand once per build.

- Norm's avatar stays sharp when it grows on hover, and each hover shows a different face from the last.
- Norm's claims about the data are now generated from templates filled with each page's facts, and his hand-written lines are checked to contain advice only, so a message can't contradict its charts (e.g. the cost note now says "the three models that score best for this task").
- `astro dev` now picks up content changes instead of serving stale pages, which had hidden the specific task pages.
- Norm's lines checked against the data: corrected the task-score explanation, cost bars, new-model evidence, and wording on coding, research, business, health, planning, Excel and presentations pages.
- Task pages (D-025): 15 "Best AI for…" pages named after real searches, with evidence labelled by how closely it matches the task, replacing the nine job pages.
- Norm as guide: a voice guide (`docs/norm-voice.md`), inline chat bubbles and a three-part guide on every task page, all draft until approved.
- Demand data (D-024): an autocomplete sweep of "best AI for…" searches (UK and US), 19 search intents grouping 99% of the signal, and a preview-only page ranking demand against our coverage.
- Side-by-side job cards and charts now line up row by row (CSS subgrid), whatever the length of their descriptions.
- Design system revised after State of AI Design: Geist and Geist Mono, a white, black and orange palette with lavender data, square flat panels, numbered sections, report-style bar charts, an orange "best overall" block, and a single light look.
- Harder Normie Mode test built: "Answer business questions from a messy spreadsheet", with duplicate entries, returns, inconsistent customer names and mixed date formats that change the answers, and eight questions.
- First Normie Mode test run (2026-09-24, $2.93): four models scored 30/30, DeepSeek V4 Pro 29/30, GPT-6 Luna 26/30; results kept for review, not yet published.
- First Normie Mode test, built: "Answer business questions from a spreadsheet", with five sales ledgers, six manager questions each, automatic scoring and a budget-capped OpenRouter runner (about $1–2 for the six-model pilot). "Spot unusual transactions" is also built, kept for a later checking-and-reviewing job.
- Design system rewritten in the style of Artificial Analysis (D-022): white page, grey summary bands, serif section heads, pill navigation, one chart per card.
- Job score: each "Best AI for…" card on the homepage now shows a top-five ranking combining that job's tests, and each job page leads with the full job-score chart.
- "Best AI for…" job pages (D-023): nine everyday jobs, each shown as one chart per relevant test, with plain one-line test descriptions.
- Homepage restructured into summary sentences, highlights, a job grid and separate charts for capability, people's votes, cost and reading capacity; the colour-grid heatmap was removed.
- Direction reset (D-018): Normie Mode is model comparison translated for non-experts, using Artificial Analysis, BenchLM and OpenRouter compare as structural references.
- Accepted data sources (D-019): Epoch AI, models.dev, LMArena and maker announcements; Artificial Analysis and OpenRouter excluded for licensing reasons.
- Accepted evidence-freshness display (D-020) and the "distil, don't describe" content rule (D-021).
- New current-work tasks N-001 to N-005; spreadsheet task-page prototype parked.
- Importers for Epoch AI, models.dev and LMArena, with per-model source mappings and hand-entered maker launch claims.
- New homepage: a translated model-comparison overview with quick picks, a capability-against-cost chart, a model table, a "good at" heatmap and a "too new to judge" section.
- Tracked models expanded to cheaper tiers (Claude Sonnet 5 and Haiku 4.5, GPT-6 Luna, Gemini 3.5 Flash-Lite, DeepSeek V4.1 Flash).
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

- The spreadsheet-prototype pages (`/tasks`, `/capabilities`, `/sources`, and the three old benchmark pages) and the "Compare models" menu item, which only pointed at the homepage. Their content stays in the repository.
- Interim review, wedge recommendation, decision-register, and worklog documents after consolidating durable information into the implementation plan.
