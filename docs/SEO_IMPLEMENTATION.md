# SEO and answer-engine implementation

Status: `in_progress`

Owner task: N-015

Started: 2026-10-10

Last updated: 2026-10-10
Scope: Local working record. Do not publish this document on the public site.

## Purpose

Make Normie Mode easy to discover, index, understand, trust and cite in conventional search and answer engines, especially Google, ChatGPT and Claude.

The product strategy remains:

`Evidence -> Capability -> Work`

SEO and answer-engine work must strengthen that chain rather than create generic search copy. The strongest path to durable visibility is original, inspectable evidence translated into short, attributable answers for non-experts.

This is the living implementation record for N-015. Update it during every meaningful SEO session so another agent can resume without repeating the audit.

## How to use this document

1. Read `AGENTS.md`, the product vision, `docs/IMPLEMENTATION_PLAN.md` and `CHANGELOG.md` first.
2. Check the current state table below before choosing work.
3. Work on one `SEO-###` item at a time unless items are explicitly grouped.
4. Confirm dependencies, product decisions and acceptance criteria before editing.
5. Record material findings and completed verification in the session log.
6. Do not mark an item `done` until every acceptance criterion and verification step passes.
7. Keep generated editorial content in draft and require product-owner review under D-017 and D-021.
8. Do not commit or deploy SEO work unless the user explicitly requests it.

Allowed states: `proposed`, `ready`, `in_progress`, `blocked`, `done`.

## Success definition

N-015 succeeds when:

- Search and answer-engine crawlers can fetch the canonical site reliably.
- Public pages expose unambiguous publisher, author/reviewer, date, entity and provenance information.
- Every indexable URL has enough distinct value to deserve its own result.
- Original Normie Mode tests are published as reproducible, machine-readable evidence.
- Priority pages answer recognisable questions in concise, citable language backed by visible evidence.
- Search Console shows healthy canonical indexing and falling discovered/crawled-not-indexed counts.
- A repeatable citation test records whether ChatGPT, Claude and other answer engines cite Normie Mode for priority questions.
- Referral and crawler traffic can be measured.

There is no guaranteed route to an answer-engine citation. This plan improves eligibility, clarity, usefulness and authority; it must not claim guaranteed inclusion or ranking.

## Product guardrails

- Models, identified by exact version, remain the comparison unit (D-004 and D-026).
- Only sources accepted by D-019 may feed displayed comparison data.
- Distil, do not pad pages with generated prose (D-021).
- Human review remains required for editorial recommendations and Norm's wording (D-017).
- Preserve source, licence, retrieval date, evaluation date, model version and methodology.
- Do not add schema that misrepresents a model as a product, an editorial judgement as a measured fact, or a page as authored/reviewed by someone who did not review it.
- Do not create keyword variants as separate pages without distinct user value (D-006).
- Do not run paid evaluations without product-owner approval.
- Dated editorial reports are currently deferred in the plan. Accept a new product decision before introducing a reports publishing programme.

## Baseline: 2026-10-10

### Search Console evidence

- Sitemap submitted 2026-09-30 and last read 2026-10-03.
- Sitemap status: `Success`.
- Discovered pages: 102.
- 25 URLs were reported as `Duplicate without user-selected canonical`; their last crawls were 2026-09-29 to 2026-09-30, during the canonical rollout.
- 35 URLs were reported as `Discovered - currently not indexed`; their crawl-date cells resolve to 1970-01-01, indicating no recorded crawl.
- Coverage report snapshot date in both exports: 2026-10-04. Treat these as historical until Search Console refreshes them.

### Technical state

- Canonical origin: `https://normiemode.com`.
- HTTPS `www` and generated `.html` variants permanently redirect to the canonical URL with `308`.
- Canonical HTTPS pages return `200` and self-reference in `<link rel="canonical">`.
- HTTP-to-HTTPS is still a CapRover/nginx `302`, outside the current application redirect layer.
- `/sitemap-index.xml`, `/sitemap-0.xml` and `/robots.txt` return `200`.
- Sitemap XML is valid and contains 102 unique canonical URLs.
- Sitemap has no `<lastmod>` values.
- `robots.txt` initially allowed all crawlers and pointed to the sitemap index; D-034 now permits search crawlers and disallows training crawlers explicitly.
- Public HTML is statically rendered and usable without client-side JavaScript.
- HTML responses are not compressed by the live server.
- `HEAD` responses return `content-length: 0` instead of mirroring the corresponding `GET` representation.
- HTML uses `Cache-Control: no-cache`.
- Fonts are loaded from Google, and one footer image is loaded from another domain.

### Page and content state

- 102 public canonical pages: homepage, 26 benchmark routes including the hub, 47 task routes including the hub, 26 model routes including the hub, methodology and one first-party test page.
- Every public page has a title, meta description, H1 and canonical URL.
- Every public page currently lacks JSON-LD structured data.
- Every public page currently lacks Open Graph and Twitter/X card metadata.
- 55 of 104 generated HTML files, including two preview-only files, have titles longer than 60 characters.
- 68 descriptions fall outside 120–160 characters. Length is a diagnostic, not a ranking rule.
- Nine superseded model pages contain roughly 106–116 substantive words and little version-specific evidence.
- Benchmark explainers contain roughly 295–410 substantive words and are structurally similar.
- Specific task pages can inherit all evidence from their parent. When their Norm guidance is still draft, public differentiation can be limited to scope, verdict and reused charts.
- One first-party evaluation is public: `spreadsheet-questions`.
- There are no public About, Contact, Editorial Policy, Corrections Policy, author or reviewer pages.
- There is no RSS/Atom update feed, downloadable public results feed, or analytics implementation visible in the repository.

### Current strengths to preserve

- Clear canonical URLs and an accurate sitemap.
- Strong internal linking between tasks, models, benchmarks and methodology.
- Exact model versions rather than ambiguous product names.
- Source, licence and retrieval metadata in the content model.
- Separate labels for independent results, maker claims and Normie Mode tests.
- Reproducible first-party evaluation cases with published questions and answers.
- A public methodology that explains the ranking rule.
- Append-oriented result history and explicit supersession.

## Source-of-truth guidance

- OpenAI uses `OAI-SearchBot` for ChatGPT search results. This is separate from `GPTBot`, which concerns potential model-training use. Allowing one does not require allowing the other: <https://developers.openai.com/api/docs/bots>
- OpenAI publisher guidance says public sites can appear in ChatGPT search and should not block `OAI-SearchBot` if they want content surfaced, summarised and cited: <https://help.openai.com/en/articles/12627856>
- Anthropic identifies `Claude-SearchBot` as its search crawler and says its bots observe `robots.txt`: <https://support.anthropic.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler>
- Google describes redirects and canonical annotations as strong canonical signals, with sitemap inclusion as a weaker supporting signal: <https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls>
- Google's crawl guidance says small sites ordinarily need an accurate sitemap and Page Indexing monitoring rather than advanced crawl-budget work: <https://developers.google.com/crawling/docs/crawl-budget>
- Google URL Inspection reports stored index information rather than a live view unless `Test live URL` is run: <https://support.google.com/webmasters/answer/9012289>

These sources establish crawler eligibility and conventional search mechanics. They do not document a formula that guarantees citations. Treat claims about answer-engine citation preference as hypotheses to test, not platform promises.

## Workstream overview

| ID | Workstream | State | Priority | Depends on |
| --- | --- | --- | --- | --- |
| SEO-001 | Measurement and repeatable baseline | `in_progress` | P0 | None |
| SEO-002 | Search and answer-engine crawler access | `in_progress` | P0 | SEO-001 |
| SEO-003 | Publisher identity and trust pages | `blocked` | P0 | Product-owner facts and review |
| SEO-004 | Global metadata and social previews | `in_progress` | P0 | SEO-003 for final publisher data |
| SEO-005 | Structured data | `proposed` | P0 | SEO-003, schema design review |
| SEO-006 | Sitemap freshness and update signals | `done` | P0 | Dependency-date calculation |
| SEO-007 | Indexability and page-value audit | `done` | P0 | — |
| SEO-008 | Thin historical model pages | `in_progress` | P0 | D-035 temporary treatment active; enrichment remains |
| SEO-009 | Specific-task differentiation | `in_progress` | P0 | D-035 temporary treatment active; editorial review capacity |
| SEO-010 | Answer-first evidence blocks | `proposed` | P1 | SEO-007, D-021 review |
| SEO-011 | First-party dataset publication | `proposed` | P1 | Eval review, licence decision |
| SEO-012 | Head-to-head comparisons | `proposed` | P1 | N-003, evidence sufficiency |
| SEO-013 | Performance and response correctness | `in_progress` | P1 | Repository server complete; production/font checks remain |
| SEO-014 | Titles, descriptions and information architecture | `proposed` | P1 | SEO-007 |
| SEO-015 | Update/report publishing programme | `blocked` | P1 | New accepted decision; reports are deferred |
| SEO-016 | Distribution and authority building | `proposed` | P1 | At least one strong original report/dataset |
| SEO-017 | Citation and referral monitoring | `proposed` | P0 | Analytics/logging choice |
| SEO-018 | Ongoing operating cadence | `proposed` | P2 | Core workstreams in place |

## Detailed work items

### SEO-001 — Measurement and repeatable baseline

State: `done`

Purpose: Make progress measurable and prevent repeated ad hoc audits.

Work:

- Add a non-mutating audit script that inventories public routes and checks status, canonical, title, description, H1, robots directives, structured data, internal links and sitemap membership.
- Record page-type counts and flag thin or near-duplicate pages for human review.
- Save Search Console exports outside the public build or document their local attachment location without committing private exports.
- Define a fixed set of priority search and answer-engine questions.
- Record baseline Google Search Console metrics and citation tests manually in this document.

Acceptance criteria:

- One command produces a deterministic local SEO report from the production build.
- The command fails on broken canonical, sitemap, robots or accidental-indexing regressions.
- A fixed citation-test set covers the initial spreadsheet wedge, coding, writing, model comparisons and benchmark explanations.
- No private Search Console data is exposed publicly.

Verification:

- Run the audit against `dist/` and the live canonical origin.
- Intentionally test at least one fixture or unit case per critical failure condition.

Progress (2026-10-10):

- Added `npm run seo:audit`. It builds the production site, audits all sitemap URLs and exits non-zero on mechanical integrity errors.
- Added four regression tests covering a valid page, canonical/noindex failures, a broken internal page link and review-only diagnostics.
- Added `docs/seo/citation-prompts-v1.yaml`, a fixed 30-prompt manual citation set across spreadsheets, coding, model comparison, writing/research and benchmark methodology.
- First repository run: 102 pages audited, zero integrity errors and 159 condensed review warnings. The warnings include nine model pages under 50 main-content words, missing structured/social metadata across all pages, title/description review candidates and 195 same-family pairs over 80% token similarity.
- Verification passed: the production build and audit, 694 tests across 14 files, and Astro type-check with zero errors (one pre-existing unused-variable hint in `src/lib/normie-tests.test.ts`).
- Remaining before `done`: run and record the first citation baseline in the named answer-engine products, and add current non-brand Search Console performance figures when supplied.

Notes:

- Do not use word-count thresholds as automatic quality judgements. They are triage signals only.
- Near-duplicate detection must route pages to review; it must not automatically noindex or redirect them.

### SEO-002 — Search and answer-engine crawler access

State: `done`

Purpose: Make crawler policy explicit and observable.

Work:

- Decide separately whether to allow search crawlers (`OAI-SearchBot`, `Claude-SearchBot`) and training crawlers (`GPTBot`, `ClaudeBot`).
- Add explicit search-crawler groups to `robots.txt` after the policy is confirmed.
- Verify representative public pages with search-crawler user agents.
- Confirm CapRover/nginx/WAF does not challenge or rate-limit legitimate crawlers.
- Document published crawler IP verification where available; do not trust user-agent strings alone for security decisions.

Progress (2026-10-10):

- D-034 records the accepted policy: permit `OAI-SearchBot` and `Claude-SearchBot`; disallow `GPTBot` and `ClaudeBot`; continue allowing user-triggered retrieval through the general public-crawler rule.
- The repository `robots.txt` now expresses that policy explicitly and `npm run seo:audit` fails if it regresses.
- Deployed and verified on 2026-10-10: both search-crawler user agents received `200` for `robots.txt`, the homepage, one task page, one model page and one benchmark page; the live file disallows both training crawlers.
- The server now emits a structured, privacy-minimal record for claimed OpenAI and Anthropic crawler requests: timestamp, crawler, method, path and status. It deliberately excludes IP addresses, query strings and ordinary visitors, and labels user-agent identity as unverified.
- Deployed crawler-only structured logging in `e691e17` and generated successful live OAI-SearchBot and Claude-SearchBot requests after the deployment hook completed.
- Remaining before `done`: confirm either generated record appears in CapRover's live app logs; this workspace has no CapRover log credential.

Acceptance criteria:

- Search crawler policy is explicit and matches the product owner's intent.
- `OAI-SearchBot` and `Claude-SearchBot` can fetch `robots.txt`, the homepage, one task page, one model page and one benchmark page with `200` responses.
- Logs can distinguish known crawler traffic from ordinary browser traffic.

Verification:

- Production requests using representative user agents.
- Server/access-log review after deployment.

Watch for:

- Explicit rules improve clarity, not rankings by themselves.
- `ChatGPT-User` is user-triggered and is not the search-index crawler.

### SEO-003 — Publisher identity and trust pages

State: `blocked`

Purpose: Make ownership, accountability and editorial controls visible.

Work:

- Add About, Contact, Editorial Policy and Corrections Policy pages.
- State the relationship between Normie Mode, Other Stuff and Intelligence Snacks accurately.
- Add a public profile for each named author/reviewer only with their approval.
- Explain human review, source selection, corrections, conflicts and commercial relationships.
- Link these pages from the footer and methodology.

Acceptance criteria:

- Every factual identity and policy statement is approved by the product owner.
- Recommendations can identify a real reviewer and review date.
- Users can report a correction through a monitored route.
- No invented biographies, credentials or organisational claims.

Verification:

- Product-owner review.
- Internal link check and structured-data validation after SEO-005.

Blocker (2026-10-10): The plan names Andy David as the product owner and human reviewer, and the existing footer names Other Stuff as producer, but there is no approved public biography, monitored corrections/contact route, or approved wording for the relationship with Intelligence Snacks. Do not invent these. Technical metadata work can continue while the product owner supplies and approves those facts.

### SEO-004 — Global metadata and social previews

State: `in_progress`

Purpose: Improve result presentation and earned distribution.

Work:

- Extend `Base.astro` with `og:title`, `og:description`, `og:url`, `og:type`, `og:site_name`, `og:image`, image dimensions and Twitter/X card metadata.
- Create a reusable branded share image and page-specific images only where they add value.
- Make title, description, image, content type and dates page props with safe defaults.
- Preserve the canonical URL as the Open Graph URL.

Acceptance criteria:

- Every indexable page has complete, absolute social metadata.
- Images are hosted on `normiemode.com`, have stable URLs and render at appropriate dimensions.
- Preview-only routes remain `noindex` and are not promoted in public discovery files.

Verification:

- Build tests over every generated public page.
- Manual preview checks in at least two social/link-preview validators.

Progress (2026-10-10):

- Added complete Open Graph and Twitter/X card fields to the shared layout, all derived from the same title, description and canonical URL as the visible page metadata.
- Added safe props for content type, social image, image alt text and optional article dates. Final publisher/person relationships remain deferred to SEO-003/005.
- Added a stable 1200×630 branded JPEG and extended `npm run seo:audit` so missing, inconsistent or non-canonical social metadata is a hard failure.
- Local verification passed: production build and SEO audit across 102 public pages, 701 tests across 14 files, and type-check with zero errors (one pre-existing hint remains).
- Deployed in `08f4207`. Live source checks confirmed complete, matching metadata on the homepage and `/best-ai-for/excel-spreadsheets`; the image returns `200 image/jpeg` on GET and is exactly 1200×630.
- Remaining before `done`: check those two URLs visually in two interactive external preview validators. OpenGraph.xyz rate-limited this environment and Meta Tags requires client-side interaction, so neither was recorded as a pass.

### SEO-005 — Structured data

State: `proposed`

Purpose: Express entities, provenance, dates and page relationships without misrepresentation.

Proposed mapping:

- All pages: `Organization`, `WebSite`, `WebPage` and `BreadcrumbList` where applicable.
- Benchmark explainers: `Article` or `TechArticle`.
- First-party evaluation pages: `Article` plus `Dataset` when downloadable data exists.
- Ranked hubs: `ItemList` only when the visible list and order match the markup.
- Model and task pages: `WebPage` with accurate `about`, `dateModified`, publisher and reviewer relationships; do not use `Product` by default.

Acceptance criteria:

- JSON-LD facts are derived from the same canonical data as visible content.
- Every URL, date, name and relationship matches the rendered page.
- No unsupported rating, review, FAQ or product markup.
- The publisher and reviewer entities refer to approved public identity pages.

Verification:

- Unit tests for schema generation.
- Google Rich Results Test where the type is supported.
- Schema.org validator for all JSON-LD.
- Manual comparison of visible claims and structured claims.

### SEO-006 — Sitemap freshness and update signals

State: `in_progress`

Purpose: Show meaningful changes without pretending every build changed every page.

Work:

- Calculate a trustworthy `lastmod` per route from its newest content dependency.
- Add `lastmod` to the sitemap.
- Render a page-specific updated date where it helps users.
- Consider an RSS/Atom feed for dated updates only after there is a real update/report stream.

Acceptance criteria:

- `lastmod` changes only when a dependency affecting that page changes.
- Dates are ISO-formatted in the sitemap and human-readable on the page.
- Rebuilding unchanged content does not refresh all dates.

Verification:

- Snapshot/unit tests for representative homepage, task, model, benchmark and test routes.
- Valid sitemap XML after build.

Progress (2026-10-10):

- Added route-aware freshness calculation from recorded release, publication, evaluation, retrieval, review, claim and plan-check dates. Build time is never used.
- All 102 sitemap URLs now carry ISO `lastmod` timestamps. The current data produces five distinct dates rather than stamping every route with one deployment date.
- Task-page title months now come from their evidence freshness date instead of the current clock, preventing unchanged monthly rebuilds from manufacturing apparent updates.
- Recorded the first-party spreadsheet test's existing 2026-09-24 publication date in canonical content so its page has a truthful freshness source.
- The SEO audit now fails invalid sitemap dates and reports omitted dates; representative route tests cover the homepage, task, model, benchmark and first-party test families.
- Local verification passed: SEO audit and production build, 706 tests across 15 files, and type-check with zero errors (one pre-existing hint remains).
- Deployed in `ff7390a`. The live child sitemap contains 102 URLs and 102 valid `lastmod` timestamps across five source dates.
- An immediate unchanged production rebuild produced the identical sitemap SHA-256 (`73c5f11986f1e34aab22381bb0e2bea451080bff9dbcbc4fc7f2d429fd1763d3`), confirming build time does not alter freshness.

### SEO-007 — Indexability and page-value audit

State: `in_progress`

Purpose: Decide which URLs deserve indexing before trying to force Google to crawl all of them.

Work:

- Review every public route by page family.
- Classify each as `index`, `improve`, `consolidate`, `redirect` or `noindex-follow`.
- Record direct evidence, unique user need, unique reviewed guidance and internal-link role.
- Review Search Console's indexed, discovered and crawled-not-indexed sets after the next refresh.

Acceptance criteria:

- Every route has a recorded disposition and reason.
- No indexability change is automatic.
- Consolidation does not discard evidence history or exact-version provenance.
- Product-owner approval is recorded for materially changing public coverage.

Verification:

- Product-owner review of the disposition table.
- Build, link and redirect checks after implementation.

Progress (2026-10-10):

- Added the reproducible `npm run seo:indexability` review and generated `docs/seo/indexability-review.csv` with one row for each of the 102 public URLs.
- The register records page family, parent, main-content words, inbound internal links, test count, unique tests versus parent, visible reviewed guidance, direct-test and graph-result counts, proposed disposition, reason and approval status.
- Proposed `index` for 62 routes: core/collection pages, 26 benchmark pages, 16 parent task pages, 17 substantive/current model pages and the first-party test page.
- Proposed temporary `noindex,follow` for 40 routes, without implementing it: all 31 child-task pages because their distinct guidance is draft/hidden and none has a unique direct test; and nine historical model pages with 37–46 main-content words and no useful version-specific evidence.
- Ten child tasks have an extra related test, but none has unique direct evidence. The proposal keeps them accessible and followed while SEO-008/009 improves or consolidates them.
- Rationale: this is not a claim that thin pages impose a sitewide ranking penalty or that a 102-page site has a crawl-budget problem. It makes the submitted/indexable inventory match the pages Normie Mode currently considers useful search results, while avoiding competing near-identical parent/child answers. Google describes sitemap URLs as the canonical pages a site considers important, and `noindex` as the direct rule for keeping an accessible page out of results.
- Trade-off: approved exclusions give up any current long-tail visibility from those URLs. They should be used only as a temporary, reviewed state; pages return to the sitemap and `index` only after their distinct value is verified.
- Local verification passed: repeatable production build/register generation, 708 tests across 16 files, and type-check with zero errors (one pre-existing hint remains).
- Product-owner approval was given on 2026-10-11 and recorded as D-035. The 40 temporary exclusions are implemented as `noindex,follow` and omitted from the sitemap; automated checks require the other 62 public pages to remain indexable and submitted.

### SEO-008 — Thin historical model pages

State: `in_progress`

Purpose: Preserve exact-version history without publishing weak doorway-like pages.

Mandatory end-of-program work item: revisit all nine pages before closing N-015. For each page, either publish reviewed version-specific evidence and restore `index` plus sitemap membership, or record an explicit decision to retain `noindex,follow`/redirect it. Temporary exclusion must not silently become permanent.

Initial review set:

- GPT-5.2
- GPT-5.5
- DeepSeek V3.2
- Claude Fable 5
- Claude Opus 4.6
- Claude Opus 4.8
- Claude Opus 5
- Gemini 3.7 Flash
- Kimi K2.5

Options, in preference order:

1. Enrich with verified release facts, historical results, successor relationship, exact availability history and sources.
2. Keep accessible but `noindex,follow` until evidence is sufficient.
3. Redirect to a successor only if Normie Mode explicitly abandons exact-version history for that page.

Acceptance criteria:

- Each historical model has a documented disposition.
- Indexed historical pages contain useful version-specific evidence, not only a replacement notice.
- Successor and predecessor links are consistent.

Verification:

- Content review, graph validation, sitemap/indexability tests and redirect tests.

### SEO-009 — Specific-task differentiation

State: `in_progress`

Purpose: Ensure each task URL answers a distinct question with distinct value.

Work:

- Compare every child task with its parent for shared tests, verdicts, charts and public editorial guidance.
- Prioritise direct evaluation evidence and reviewed, task-specific examples.
- Consolidate or temporarily noindex child tasks that only restate a parent.
- Do not generate filler to reach a word count.

Acceptance criteria:

- Every indexed child task has a distinct user goal and at least one materially distinct evidence, checking or guidance element.
- Any new Norm wording is approved before publication.
- Inherited evidence remains visibly labelled as related rather than direct.

Verification:

- Similarity report plus human review.
- Product-owner review of at least one page from every task hub.

### SEO-010 — Answer-first evidence blocks

State: `proposed`

Purpose: Make important answers easy for people and retrieval systems to locate and attribute.

Work:

- Add a compact answer or facts block to priority pages.
- Generate measured statements only from validated data.
- Keep sourced claims linked directly to the benchmark owner, paper or provider.
- State uncertainty, evidence gaps and checking requirements alongside conclusions.
- Use HTML tables or text for key facts; charts must not be the only representation.

Acceptance criteria:

- Each block answers the page's main question in plain language.
- Every claim is classified as measured, sourced, editorial or recommendation.
- Generated statements are deterministic and tested against the underlying data.
- Editorial statements remain subject to review.

Verification:

- Unit tests for generated statements.
- Product-owner comprehension review.
- Citation-test comparison before and after deployment.

### SEO-011 — First-party dataset publication

State: `proposed`

Purpose: Turn Normie Mode's original testing into a reference other publishers and answer engines can cite.

Work:

- Publish machine-readable CSV or JSON for each approved test run.
- Include suite version, run date, exact models, configuration, cases, prompts, answers, scores, cost, latency, limitations and licence.
- Add a stable methodology URL and correction/supersession history.
- Add a human-readable suggested citation, without demanding attribution beyond the licence.
- Add `Dataset` structured data after SEO-005.

Acceptance criteria:

- Public files reproduce every visible result.
- Sensitive information and paid-provider credentials are absent.
- Product owner approves the run and licence before publication.
- Corrections append or supersede rather than silently overwrite history.

Verification:

- Re-run scoring from published artefacts.
- Validate downloads and schema.
- Follow `docs/evals/README.md` for every run.

### SEO-012 — Head-to-head comparisons

State: `proposed`

Purpose: Serve high-intent comparison questions with exact-version evidence.

Work:

- Implement N-003 for two or three exact model versions.
- Use stable, readable canonical URLs.
- Show task positions, direct test results, cost, evidence status, availability and freshness side by side.
- Avoid a winner when the evidence says too close to call.

Acceptance criteria:

- Comparison facts come from existing canonical model/test data.
- Pages explain why a conclusion exists and what remains untested.
- Arbitrary model combinations do not create an unlimited indexable URL space.

Verification:

- Product-owner review and canonical/indexability tests.
- Representative search-intent testing.

### SEO-013 — Performance and response correctness

State: `in_progress`

Purpose: Make static pages efficient and predictable for users and crawlers.

Work:

- Enable Brotli or gzip for HTML, CSS, JavaScript, XML and JSON at the proxy/server.
- Correct `HEAD` responses to mirror `GET` status and headers without a body.
- Change external HTTP-to-HTTPS redirects from temporary to permanent at CapRover/nginx.
- Set sensible cache and revalidation headers for static HTML and discovery files.
- Self-host critical fonts and the footer mark or provide resilient local fallbacks.
- Measure Core Web Vitals with field data once traffic permits; use lab measurements meanwhile.

Acceptance criteria:

- Representative text responses are compressed.
- `HEAD` metadata agrees with `GET`.
- HTTP, `www`, `.html` and `/index.html` variants reach the canonical URL with permanent redirects and no avoidable chain.
- No page loses functionality or visual fidelity.

Verification:

- Header matrix tests in CI and against production.
- Lighthouse or equivalent checks on representative page types at mobile and desktop sizes.

Progress (2026-10-11):

- The Bun static server now negotiates gzip for HTML, CSS, JavaScript, XML, JSON, text and SVG responses.
- `HEAD` returns the same status and representation headers as `GET`, without a body; uncompressed responses include the source byte length.
- Fingerprinted Astro CSS/JavaScript receives a one-year immutable cache policy. Stable public images/fonts use one-day caching with stale revalidation, sitemap/robots files use five-minute revalidation, and HTML always revalidates.
- Automated tests cover compressed `GET`/`HEAD` parity, uncompressed discovery-file length/cache metadata, and the distinction between fingerprinted assets and replaceable public images. A real Bun server was also checked locally with a valid gzip payload.
- The first production probe showed nginx supplying `Content-Length: 0` on compressed `HEAD` when the app streamed compression without a known length. The server now materialises the small static compressed representation and sends its exact length for both methods; production re-verification is required after that correction.
- Remaining: deploy and verify the production header matrix; decide/download approved local font assets before removing Google Fonts; run representative mobile/desktop performance checks. Infrastructure-level compression or redirects are unnecessary if the application response survives the CapRover proxy unchanged, but production must confirm that.

### SEO-014 — Titles, descriptions and information architecture

State: `proposed`

Purpose: Improve clarity in results without treating character counts as ranking rules.

Work:

- Put the distinctive entity or intent early in each title.
- Shorten benchmark and model title templates while preserving plain-English H1s.
- Give the homepage a specific description.
- Review all descriptions for useful differentiation, not arbitrary length alone.
- Add breadcrumbs in visible markup and structured data.

Acceptance criteria:

- Titles remain unique and accurately describe their pages.
- Priority titles are unlikely to lose the distinguishing phrase when truncated.
- Descriptions do not make unsupported claims or repeat mechanically across a family.

Verification:

- Generated metadata audit and product-owner review of representative snippets.

### SEO-015 — Update/report publishing programme

State: `blocked`

Blocker: The implementation plan currently defers reports. A new accepted decision must define their scope, editorial owner, review requirements and relationship to canonical pages.

Proposed purpose: Publish dated, link-worthy analysis without turning evergreen pages into news posts.

Potential formats after approval:

- What changed in AI model rankings this month
- State of AI for spreadsheet work
- New model evidence tracker
- Test release and methodology notes
- Significant benchmark changes

Guardrail: Reports link to canonical task/model/test pages and must not create a conflicting recommendation.

### SEO-016 — Distribution and authority building

State: `proposed`

Purpose: Earn the independent references that on-site optimisation cannot create.

Work:

- Package original findings for benchmark authors, model makers, researchers and specialist publications.
- Publish embeddable charts and tables with stable source links.
- Make approved datasets and evaluation tooling easy to reuse through the public repository.
- Seek corrections and technical review before promotion.
- Avoid paid-link schemes, generic directories and mass outreach.

Acceptance criteria:

- Outreach is tied to a genuinely useful original result.
- Claims and visuals link back to the complete methodology and data.
- Earned mentions and referring domains are recorded without manipulating editorial coverage.

Verification:

- Referral/domain monitoring and a factual outreach log.

### SEO-017 — Citation and referral monitoring

State: `proposed`

Purpose: Measure whether search and answer engines discover and cite the site.

Work:

- Choose privacy-appropriate analytics and document the decision.
- Track known referral sources, including ChatGPT, Claude, Perplexity, Google and Bing where referrers are available.
- Retain enough access-log data to measure verified crawler visits and response status.
- Create a fixed monthly prompt set and record engine, date, prompt, citation, cited URL and competing sources.
- Keep prompt wording stable; version the set when it changes.

Acceptance criteria:

- A baseline citation run is recorded before major content changes.
- The same prompt set can be rerun consistently.
- Analytics and logs do not collect unnecessary personal data.
- Citation counts are treated as observations, not statistically reliable rankings without enough runs.

Verification:

- Confirm a test referral can be identified.
- Confirm crawler requests appear with useful status/path data.

### SEO-018 — Ongoing operating cadence

State: `proposed`

Purpose: Keep the site current after the initial implementation.

Proposed cadence:

- Weekly: validate the build, imports, crawler errors and Search Console changes.
- Fortnightly: review new model versions, superseded evidence and weak indexed pages.
- Monthly: run the fixed citation test, review non-brand queries and refresh priority comparisons.
- Quarterly: audit indexable inventory, schema, redirects, trust pages and external references.

Acceptance criteria:

- Every recurring check has an owner, input, output and escalation rule.
- Recommendation changes still require human editorial review.

## Fixed citation-test set

State: `proposed`; establish the baseline in SEO-001 before changing wording.

Initial prompt families are frozen in `docs/seo/citation-prompts-v1.yaml`:

1. What is the best AI model for analysing an Excel spreadsheet?
2. Which AI model is best for spreadsheet data analysis, and what evidence supports that?
3. What should I check when using AI for financial spreadsheets?
4. Which current AI model is best for coding?
5. Which AI model is best for writing?
6. Compare [two current exact model versions] for business work.
7. What does Terminal-Bench test?
8. What does FrontierMath measure, in plain English?
9. Which AI benchmarks measure real work rather than academic questions?
10. How reliable are public AI model rankings?

Do not edit the version 1 wording after the first run. Create a new fixture version when current model versions or measurement needs change.

## Measurement dashboard

Update this table from primary reports. Use `—` when unknown rather than estimating.

| Metric | Baseline | Date | Target/interpretation |
| --- | ---: | --- | --- |
| Valid canonical URLs in sitemap | 102 | 2026-10-10 | All intended indexable URLs only |
| Sitemap status | Success | 2026-10-03 | Remains Success |
| Duplicate without user-selected canonical | 25 | report snapshot 2026-10-04 | Falls after recrawl; redirected variants may move to Page with redirect |
| Discovered, currently not indexed | 35 | report snapshot 2026-10-04 | Review after fresh crawl/index report |
| Pages with JSON-LD | 0/102 | 2026-10-10 | 102/102 with accurate base schema; relevant subtype where appropriate |
| Pages with social metadata | 0/102 | 2026-10-10 | 102/102 |
| Public first-party tests | 1 | 2026-10-10 | Quality and reuse matter more than count |
| Public machine-readable test datasets | 0 | 2026-10-10 | One per approved published test |
| Known authoritative referring domains | — | 2026-10-10 | Establish in SEO-001 |
| Non-brand search impressions/clicks | — | 2026-10-10 | Establish in SEO-001 |
| OAI-SearchBot successful fetches | — | 2026-10-10 | Establish in SEO-002/017 |
| Claude-SearchBot successful fetches | — | 2026-10-10 | Establish in SEO-002/017 |
| Citation-test citations | — | 2026-10-10 | Establish before content changes |

## Decisions needed

Record accepted decisions in `docs/IMPLEMENTATION_PLAN.md` as D-### entries before implementation when they materially affect the product.

| Decision | Why it matters | Status |
| --- | --- | --- |
| Allow or disallow GPTBot and ClaudeBot separately from search crawlers | Training policy is not the same as search visibility | Accepted as D-034: disallow training, allow search |
| Public publisher, author and reviewer identity details | Required for truthful trust pages and schema | Open |
| Corrections contact/workflow | Must route to a monitored owner | Open |
| Historical model page policy | Enrich, noindex or redirect materially changes public coverage | Accepted as D-035: temporary noindex; mandatory end-of-N-015 revisit |
| Child task indexability threshold | Prevents shallow keyword expansion | Accepted as D-035: noindex until SEO-009 differentiation criteria are met |
| Public licence for first-party test datasets | Controls reuse and citation | Open |
| Analytics and access-log retention | Privacy and measurement trade-off | Open |
| Dated reports programme | Currently deferred by the plan | Blocked pending accepted decision |

## Risks and watch-outs

- **Crawl eligibility is not citation eligibility.** An allowed crawler can still decide a page is not useful enough to surface.
- **Do not confuse GPTBot with OAI-SearchBot.** They represent different choices.
- **Do not chase word count.** More prose can make D-021 violations and near-duplicate pages worse.
- **Do not auto-publish generated summaries.** Deterministic measured statements are allowed; editorial interpretation requires review.
- **Do not expose Search Console exports or private analytics.** Record aggregates and findings only.
- **Do not stamp every sitemap URL with the build date.** False freshness erodes trust.
- **Do not add unsupported schema.** Incorrect review, rating, author or product markup is worse than no markup.
- **Do not fragment exact search variants into new URLs.** Canonical task rules still apply.
- **Do not hide limitations to make snippets stronger.** Citation value depends on inspectable nuance.
- **Do not overwrite evidence history.** Corrections supersede previous records.
- **Do not interpret a temporary indexing count as a stable quality verdict.** Always record the report snapshot and crawl dates.
- **Do not claim answer-engine causality from a small number of prompts.** Citation results are volatile and personalised.

## Resume checklist

At the start of a future SEO session:

1. Read the most recent session-log entry.
2. Run `git status --short` and preserve unrelated work.
3. Check whether Search Console data is newer than the 2026-10-04 baseline.
4. Confirm the current sitemap URL count and production redirect matrix.
5. Check for new product decisions in the implementation plan.
6. Select the highest-priority `ready` item whose dependencies are satisfied.
7. Move only that item to `in_progress` and record the change below.

## Session log

Append new entries; do not rewrite history except to correct a factual error, and label corrections.

### 2026-10-10 — Baseline audit and working plan created

- Created N-015 and this local living implementation document.
- Confirmed the production sitemap index and child sitemap return `200`, parse as valid XML and contain 102 unique canonical URLs.
- Confirmed all 35 URLs in the `Discovered - currently not indexed` export currently return `200`, self-canonicalise, appear in the sitemap and are allowed by `robots.txt`.
- Confirmed the original sitemap submission was successful, discovered all 102 pages and was last read on 2026-10-03.
- Confirmed the earlier canonical deployment fixed live `www` and `.html` duplication with `308` redirects.
- Audited the public build: no JSON-LD, no Open Graph/Twitter metadata, 55 long title candidates, 68 description-length review candidates and nine very thin historical model pages.
- Confirmed no public trust/identity policy pages, no analytics implementation and no machine-readable first-party result downloads.
- Confirmed HTML compression, accurate `HEAD` metadata and permanent proxy-level HTTP redirects remain infrastructure follow-ups.
- Added official OpenAI documentation tooling to the local Codex configuration; it requires a new session before its tools become available. Used official OpenAI and Anthropic crawler documentation for the baseline.
- No public-site implementation was performed in this session. Next recommended item: SEO-001, then SEO-002 and the decision inputs for SEO-003/005/007.

### 2026-10-10 — SEO-001 implementation started

- Added `scripts/seo-audit.ts` and the `npm run seo:audit` command. The command builds first, audits the sitemap and generated HTML, prints deterministic errors and review warnings, and supports JSON output from the script for further analysis.
- Hard failures cover invalid or duplicate sitemap URLs, missing generated pages, non-canonical sitemap forms, missing title/description/H1/canonical, sitemap pages marked `noindex`, duplicate titles, broken internal page links and missing canonical sitemap declaration in `robots.txt`.
- Review diagnostics cover long titles, description length, thin main content, absent JSON-LD/social metadata, duplicate descriptions, unlisted generated HTML and high same-family token similarity. These never make automatic editorial or indexability decisions.
- Added four focused regression tests. Initial run passed all hard checks for 102 canonical pages.
- Froze 30 citation prompts in `docs/seo/citation-prompts-v1.yaml`. A real answer-engine baseline is still required before SEO-001 can be marked `done`.
- Full verification passed: `npm run seo:audit`, 694 tests and `npm run check` with no errors. The type-check retains one pre-existing unused-variable hint outside this work.
- Next: begin SEO-002 while the product owner supplies Search Console performance figures and/or runs the manual citation baseline.

### 2026-10-10 — SEO-002 crawler policy implemented locally

- Recorded D-034: Normie Mode permits OpenAI and Anthropic search crawlers but not their model-development crawlers. Their published controls are separate, and no documented search-visibility benefit was found for permitting training use.
- Added explicit allow rules for `OAI-SearchBot` and `Claude-SearchBot`, explicit disallow rules for `GPTBot` and `ClaudeBot`, and retained the general public-crawler allow rule for ordinary and user-triggered retrieval.
- Extended the deterministic SEO audit and regression suite to enforce the accepted crawler policy.
- Local verification passed: the production build and SEO audit, 695 tests across 14 files, and Astro type-check with zero errors (one pre-existing unused-variable warning remains).
- Production verification and access-log observation remain required after deployment before SEO-002 is `done`.

### 2026-10-10 — SEO-002 deployed and externally verified

- Pushed `fae66c9` to both `origin/main` and the CapRover-watched `origin/deployed` branch using a fast-forward deployment.
- Confirmed the live `robots.txt` permits `OAI-SearchBot` and `Claude-SearchBot`, disallows `GPTBot` and `ClaudeBot`, and still names the canonical sitemap index.
- Requested `robots.txt`, the homepage, `/best-ai-for/excel-spreadsheets`, `/models/gpt-5-5` and `/benchmarks/arena-overall` as each search crawler. All ten requests returned `200` with the expected content type and no redirect or challenge.
- SEO-002 remains `in_progress` only because production access-log identification has not yet been inspected.

### 2026-10-10 — Privacy-minimal crawler observability deployed

- The application previously emitted no access records and this workspace had no credential for the CapRover app-log API.
- Added structured stdout records only for claimed OpenAI and Anthropic crawler user agents. Records contain timestamp, crawler, method, path, response status and an explicit `unverified_user_agent` identity label; they exclude IP addresses, query strings and ordinary visits.
- Added regression coverage for four crawler agents, non-logging of ordinary traffic, and query-string exclusion. Verification passed with 700 tests, type-check, content validation and production build.
- Deployed `e691e17`; its GitHub deployment-hook run completed successfully. Follow-up OAI-SearchBot and Claude-SearchBot probes returned `200` and should now be visible as `crawler_request` JSON lines in the CapRover app log.
- Final SEO-002 check requires a CapRover operator to confirm one of those lines. User-agent identity remains a claim, not cryptographic verification; OpenAI IP ranges can be cross-checked upstream, while Anthropic does not publish stable ranges.

### 2026-10-10 — SEO-003 gated; SEO-004 implementation started

- Marked SEO-003 blocked rather than inventing trust claims. It needs approved identity details, relationship wording and a monitored public corrections/contact route.
- Added site-wide Open Graph and Twitter/X metadata with canonical absolute URLs and a stable default social image. Added deterministic audit coverage for completeness and consistency.
- The default 1200×630 social image was generated from the existing Norm mascot reference, then resized and inspected locally; it contains the exact approved site name and existing positioning line only.

### 2026-10-10 — SEO-004 deployed and source-verified

- Pushed atomic commit `08f4207` to `main` and `deployed`; the GitHub deployment-hook run completed successfully and the new tags are live.
- Verified the homepage and Excel task page expose matching title, description, canonical `og:url`, site name, type, absolute image URL, dimensions, alt text and corresponding Twitter/X fields.
- Downloaded the live share image: `200`, `image/jpeg`, 99,232 bytes and 1200×630. Its `HEAD` response still omits accurate content headers, which remains tracked under SEO-013; social crawlers use GET.
- Tried OpenGraph.xyz and Meta Tags for external rendered-preview verification. The former returned `429` to this environment and the latter requires client-side interaction, so the two-validator acceptance check remains open rather than being inferred from source tags.

### 2026-10-10 — SEO-006 implementation completed locally

- Added evidence-derived route freshness and sitemap `lastmod` values without using build or deployment time.
- Added the missing canonical publication date for the already-published spreadsheet test and used approved plan-check dates where an undated model page depends on app availability.
- Replaced task titles' wall-clock month with the route's evidence month, so unchanged pages no longer change title merely because a calendar month passed.
- Verified 102 of 102 sitemap entries are dated, across five meaningful source dates; the repeatable SEO audit, 706 tests and type-check pass.

### 2026-10-10 — SEO-006 deployed and completed

- Deployed `ff7390a` to `main` and `deployed`; the live sitemap rolled over with all 102 entries dated.
- Verified representative homepage, task, model, benchmark and first-party test routes in the live XML. The first-party test correctly uses its 2026-09-24 publication date while imported-data pages use their relevant retrieval/evidence dates.
- Rebuilt the unchanged site and compared sitemap hashes before and after. They were identical, proving deployment/build time does not manufacture freshness.
- SEO-006 acceptance criteria and verification are satisfied; marked `done`.

### 2026-10-10 — SEO-007 disposition register drafted

- Generated a deterministic, CSV-based review of all 102 public URLs at `docs/seo/indexability-review.csv`; `npm run seo:indexability` rebuilds it from the current production output and content graph.
- Proposed retaining 62 URLs in search and temporarily applying `noindex,follow` to 40 weak URLs: 31 child tasks without unique direct evidence or visible reviewed guidance, plus nine thin historical model pages already identified by SEO-008.
- This is a decision document only. No `noindex`, sitemap removal, redirect or canonical change was made. Product-owner approval is required before changing public coverage.

### 2026-10-11 — D-035 indexability treatment implemented

- The product owner approved the proposed temporary treatment for all 40 reviewed URLs. D-035 records the scope, rationale, trade-off and restoration conditions.
- Added one shared indexability policy used by page metadata, sitemap generation and the SEO audit: all 31 child tasks and the nine named historical model pages remain public with self-canonicals and internal links, carry `noindex,follow`, and are omitted from the sitemap.
- Strengthened the audit so every ordinary generated page must be in exactly one intended state: indexable and submitted, or an approved temporary exclusion with `noindex,follow`. Internal links to an approved excluded page remain valid.
- The disposition register records the approval. SEO-007 is complete; SEO-008 and SEO-009 remain in progress because exclusion is temporary, not the content-improvement outcome.

### 2026-10-11 — D-035 deployed and verified

- Pushed atomic commit `eb616e7` to both `main` and the CapRover-watched `deployed` branch.
- Verified the live child sitemap now contains 62 canonical URLs and 62 `lastmod` values. Neither `/best-ai-for/data-analysis` nor `/models/gpt-5-2` appears in it.
- Verified representative child-task and historical-model pages return normally with self-canonicals and `noindex,follow`, while the indexed `/best-ai-for/excel-spreadsheets` parent has no `noindex` directive.

### 2026-10-11 — SEO-013 response handling implemented locally

- Added gzip negotiation, accurate bodyless `HEAD` responses and resource-specific cache policies to the Bun static server.
- Verified the behavior through automated tests and a real local Bun process: compressed HTML `GET` and `HEAD` returned matching status/content/cache/encoding headers, the payload passed gzip validation, and the uncompressed sitemap returned its byte length with five-minute revalidation.
- Production header verification, self-hosted font work and mobile/desktop performance measurements remain before SEO-013 can be completed.

## Progress notes

Use this section for short cross-session context that does not fit an individual work item.

- 2026-10-10: The initial coverage exports reflect a 2026-10-04 snapshot, only four days after the sitemap launched. Do not treat the 25 duplicate or 35 discovered counts as current until Search Console refreshes them.
- 2026-10-10: The product already has a better citation foundation than its visibility suggests: original test artefacts, exact versions, provenance and a public methodology. The main work is to expose these facts clearly, remove weak index candidates and earn independent references.
