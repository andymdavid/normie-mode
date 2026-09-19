# Normie Mode

## Product Vision

Normie Mode helps normal people understand what AI can actually do, which models are best for particular work, and why.

Most AI evaluation is currently communicated through benchmark names, abstract scores and technical comparisons that mean very little to the people trying to use AI for actual work.

A business owner does not primarily want to know that a model scored 74.1 on a software-engineering benchmark. They want to know whether it can analyse their spreadsheet, research competitors, review a contract, prepare a presentation, build an internal application or complete a recurring administrative task reliably.

Normie Mode translates the AI capability ecosystem into those terms.

The product should answer questions such as:

- Can AI do this kind of work yet?
- Which model is best for this task?
- How reliable is it?
- What should I still check?
- Why do we believe that?
- What changed recently?
- Is one model materially better than another for the work I care about?

Benchmarks remain important, but they sit underneath the product as evidence rather than forming the primary interface.

The organising principle is work people recognise.

---

# Core Thesis

There is a widening gap between how AI capability is measured and how most people need to understand it.

The existing ecosystem largely communicates capability through model-centric measures.

Examples include:

- benchmark scores
- academic evaluations
- Elo rankings
- composite intelligence indexes
- token pricing
- context windows
- reasoning scores
- coding evaluations
- tool-use benchmarks

These are useful to researchers, developers and sophisticated AI users.

They are a poor interface for someone asking:

> What should I use to analyse an Excel workbook?

Normie Mode creates the translation layer between technical evidence and practical work.

The basic chain is:

**Evidence → Capability → Work**

A benchmark provides evidence about one or more capabilities.

Capabilities determine whether a model can perform particular tasks.

Tasks are the things people actually care about.

---

# Product Position

Normie Mode should feel closer to Consumer Reports than an AI leaderboard.

The product is not primarily:

- an AI news site
- a benchmark database
- a model leaderboard
- an affiliate comparison site
- a chatbot
- a collection of AI tutorials

It is a continuously updated reference for what AI can actually do.

The core brand question is:

**What can AI actually do?**

Normie Mode should answer that question in language an ordinary person can understand while retaining enough evidence underneath the answer to remain credible.

---

# Primary Audience

The initial audience is people who already know that AI is potentially useful but do not want to become experts in AI evaluation to make good decisions.

This includes:

- SME owners
- operators
- managers
- knowledge workers
- consultants
- professionals
- founders
- technically curious consumers

The common characteristic is not low technical ability.

It is that AI itself is not their job.

They care primarily about getting work done.

---

# Product Principles

## Start With Work

The site should organise information around recognisable tasks before technical model characteristics.

Prefer:

> Best AI for analysing spreadsheets

over:

> SpreadsheetBench model rankings

Prefer:

> Can AI build a financial model?

over:

> Model X scores 71.4 on benchmark Y

Technical evidence should remain accessible beneath the answer.

## Explain Everything

Benchmark names, model terminology and evaluation methodology should never be assumed knowledge.

Every important technical concept should have a plain-English explanation.

The product should be understandable without requiring someone to become an AI enthusiast first.

## Show The Evidence

Recommendations should not become unexplained editorial opinions.

Users should be able to move from:

> Claude is currently our pick for this task

to:

> Why?

and inspect the evidence supporting that conclusion.

## Preserve Nuance

Normie Mode should avoid pretending a model is simply good or bad.

AI capability has a shape.

A model can be excellent at coding, strong at research, average at spreadsheets and unreliable at long autonomous tasks.

Those differences are useful.

## Prefer Real Work

Where possible, evidence based on realistic work should be given more weight than evidence based on abstract academic performance.

## Stay Current

AI capability changes quickly.

The product should be designed around versioned evidence and changing recommendations rather than static articles.

---

# Public Website

The website should be browsable first.

Chat may eventually become another interface over the underlying knowledge system, but a blank chat box should not be the primary product.

The main public entities are:

- Tasks
- Capabilities
- Models
- Benchmarks
- Reports

Industries and roles may be introduced later once the underlying task system has sufficient depth.

---

# Homepage

The homepage should immediately communicate:

**What can AI actually do?**

The user should be able to browse without already understanding model names or benchmarks.

Potential homepage areas include:

## Task Search

A prominent search interface where someone can enter work such as:

- analyse a spreadsheet
- research competitors
- review a contract
- build an app
- prepare a presentation
- summarise a report

This should behave primarily as structured search rather than open-ended chatbot interaction.

The goal is to resolve user intent onto relevant pages and entities.

## Best Models Right Now

Simple capability-oriented categories such as:

- Research
- Coding
- Writing
- Spreadsheets
- Computer use
- Document analysis
- Reasoning
- Long-running agent work

## Popular Work

Frequently explored tasks.

## Latest Capability Changes

Meaningful changes in what AI can do.

Examples:

- A new model becomes strongest for coding.
- Computer-use reliability improves materially.
- A previous recommendation becomes stale.
- A benchmark exposes a new weakness.

## Benchmarks Explained

Entry points into the educational evidence layer.

---

# Task Pages

Task pages are likely to become the most important public surface.

Example:

**Best AI for analysing spreadsheets**

A useful task page could contain:

## Quick Answer

- Best overall
- Best value
- Best for complex workbooks
- Best for autonomous spreadsheet work

Only include distinctions supported by evidence.

## Capability Assessment

A plain-English explanation of what AI can currently do well.

For example:

AI is already strong at summarising spreadsheet data, creating formulas, transforming tabular information and identifying patterns.

It becomes less reliable when workbooks contain hidden business logic, complicated dependencies, unusual accounting treatment or poorly documented assumptions.

## Recommended Models

Current recommendations with model version and testing date.

## What AI Can Do

Specific examples.

## What Still Needs Checking

Known limitations and failure modes.

## Evidence

Relevant:

- independent benchmarks
- provider benchmarks where useful
- public evaluations
- Normie Mode tests
- primary sources

## Related Tasks

For example:

- Build a financial model
- Analyse a P&L
- Clean CSV data
- Create charts from Excel
- Compare budget to actuals

---

# Capability Pages

Capabilities sit between benchmarks and tasks.

Examples:

- Web research
- Spreadsheet reasoning
- Document comprehension
- Coding
- Browser use
- Long-context reasoning
- Source verification
- Presentation generation
- Visual reasoning
- Instruction following

A capability page should explain:

- what the capability means
- why it matters
- which models are strongest
- what benchmarks provide evidence for it
- which real-world tasks rely on it
- what its current limitations are
- how capability has changed over time

Capabilities are likely to become one of the central organising structures in the underlying data model.

---

# Model Pages

Model pages invert the task view.

Instead of asking:

> Which model is best for this work?

they answer:

> What is this model actually good at?

A model page might contain:

## Best At

Tasks and capabilities where evidence is particularly strong.

## Good At

Areas where the model is competitive.

## Weak At

Areas where limitations remain.

## Recommended Uses

Recognisable work.

## Model Details

Relevant information such as:

- model version
- release date
- provider
- price where relevant
- modalities
- tool access
- context limits where meaningful

Avoid surfacing technical specifications unless they help users make a decision.

## Benchmark Evidence

Current results with plain-English benchmark explanations.

## Normie Mode Tests

First-party evaluation results where available.

---

# Benchmark Pages

Benchmark pages are the ELI5 layer.

Every benchmark should answer:

## What Is It?

One plain-English sentence.

## What Does It Test?

The actual capability being evaluated.

## Show Me An Example

A representative example of the kind of problem being tested where licensing and source availability permit.

## Why Should I Care?

The practical relevance.

## What Doesn't It Tell Me?

The boundaries of the benchmark.

## Who Is Winning?

Current leading models where data is available.

## How Useful Is This Benchmark?

Normie Mode may eventually classify benchmark relevance.

For example:

- Academic
- Technical
- Agentic
- Real-world work
- Narrow specialist evaluation

The purpose is not to dismiss academic benchmarks.

It is to help users understand what conclusions can reasonably be drawn from them.

---

# Report Pages

Reports form the flexible publishing layer.

They are driven partly by search demand and partly by capability changes.

Examples:

- Best AI for PowerPoint
- Best AI for Excel
- Claude vs GPT for research
- Can AI review contracts?
- Best AI for accountants
- Best AI for market research
- What changed in AI coding this month?
- Can AI build a financial model yet?

Reports can combine structured data with editorial interpretation.

This provides a much broader SEO surface than static entity pages alone.

---

# Underlying Knowledge Model

The system should be graph-shaped even if V1 uses a relational database.

The initial entities are likely to include:

- Model
- Model Version
- Benchmark
- Benchmark Result
- Capability
- Task
- Source
- Normie Mode Test
- Test Result

Potential later entities include:

- Role
- Industry
- Application
- Workflow
- Software
- Provider
- Organisation

Important relationships include:

`Model Version → achieves → Benchmark Result`

`Benchmark Result → belongs to → Benchmark`

`Benchmark → measures → Capability`

`Task → requires → Capability`

`Model Version → recommended for → Task`

`Test → evaluates → Task`

`Test Result → evaluates → Model Version`

`Source → supports → Claim`

`Task → related to → Task`

Later:

`Task → common in → Role`

`Role → exists in → Industry`

The graph should not initially require a graph database.

Postgres or SQLite can model canonical entities and typed relationships adequately.

The important design decision is preserving the relationships rather than flattening everything into unrelated articles.

---

# Evidence System

Normie Mode should distinguish evidence quality and provenance.

Potential evidence classes include:

## Independent Benchmarks

Third-party evaluations with published methodology.

## Provider Benchmarks

Results released by the organisation producing the model.

Useful, but labelled accordingly.

## Independent Research

External testing, papers and reproducible evaluations.

## Normie Mode Tests

First-party task-specific evaluations.

## Editorial Assessment

Human interpretation supported by available evidence.

Recommendations should preserve the distinction between measured facts and editorial conclusions.

Every important result should have:

- source
- date
- model version
- benchmark version where relevant
- evaluation configuration where available

---

# First Party Tests

Normie Mode can eventually maintain small benchmark suites centred around recognisable work.

These should not attempt to replace large academic benchmarks.

Their purpose is to answer questions existing benchmarks do not answer well.

Potential suites include:

- Spreadsheet Work
- Web Research
- Presentations
- Document Review
- Browser and Admin Work
- Small Business Coding
- Financial Analysis
- Sales Research

A suite may initially contain approximately 10 to 20 stable tasks.

Example spreadsheet tasks:

- clean a messy CSV
- identify duplicate records
- build monthly revenue reporting
- find a broken formula
- compare budget to actuals
- create charts
- merge customer lists
- identify suspicious expense outliers

Each task should have:

- fixed input
- fixed instruction
- known success criteria
- model configuration
- result
- artefact where applicable
- execution cost
- execution time
- intervention count
- scoring method

Some outputs can be checked deterministically.

Examples:

- totals reconcile
- required rows preserved
- correct formula produced
- expected records identified

Others require human judgement.

Examples:

- usefulness
- readability
- prioritisation
- visual quality
- completeness

---

# Visible Artefacts

A major differentiator should be making test outputs inspectable.

Instead of presenting only:

> Model A scored 84.

Normie Mode should be able to show:

**Task**

Turn this sales CSV into a monthly management report.

**Input**

Original source file.

**Model Output**

Generated workbook or report.

**Assessment**

- Completed: Yes
- Accuracy: 9/10
- Human intervention: None
- Time: 4m 18s
- Cost: $0.74

**Notes**

The totals were correct. One duplicate customer was missed.

This makes evaluation understandable and creates trust in the scoring methodology.

---

# Model Versus Product Testing

Normie Mode should distinguish between raw model capability and real-world product capability.

These are not always the same thing.

A base model may perform well through an API while the actual product provides additional:

- browsing
- file manipulation
- spreadsheet tools
- code execution
- integrations
- memory
- computer control
- agent orchestration

For many normal users, the product-level question matters more.

For example:

> Which AI is best for spreadsheets?

may be better answered by evaluating the actual systems available to users rather than isolated model APIs.

The methodology should therefore clearly identify what is being tested.

Potential categories:

**Model test**

Tests the model itself under defined tool conditions.

**Product test**

Tests the actual consumer or business product.

**Agent test**

Tests a model plus a specific tool or execution environment.

---

# Recommendation System

Normie Mode should avoid one universal model ranking.

Recommendations should be scoped to tasks and capabilities.

The system may ultimately combine:

- benchmark results
- first-party results
- evidence quality
- recency
- task relevance
- product availability
- cost
- speed
- reliability

The exact scoring methodology remains open.

Recommendations should be explainable.

A user should be able to see why a model is recommended rather than encountering an unexplained score.

---

# Intelligence Layer

The intelligence layer continuously identifies where Normie Mode should create content, update content or conduct new testing.

It combines three major signal streams.

## Demand Signals

Potential sources include:

- Google Search Console
- Google Trends
- keyword platforms
- autocomplete
- Reddit
- YouTube
- relevant public communities
- internal site search
- on-site behaviour

The goal is to identify what people increasingly want AI to do.

The system should cluster user intent rather than blindly create pages for every keyword variant.

For example:

- best AI for PowerPoint
- AI that makes PowerPoints
- Claude PowerPoint
- GPT presentation maker
- best chatbot for presentations

should probably resolve to a common task:

**Create presentations**

## Capability Signals

The system tracks meaningful changes such as:

- new model launches
- benchmark changes
- product feature releases
- major tool-use improvements
- pricing changes
- new modalities
- significant independent evaluations

These changes may invalidate existing recommendations.

## Evidence Signals

The system tracks:

- new benchmarks
- benchmark saturation
- changed benchmark methodology
- new research
- updated first-party tests
- conflicting evidence
- weak evidence

---

# Intelligence Outputs

The intelligence layer should produce internal recommendations in several categories.

## Pages To Create

New search demand or capability questions without strong existing coverage.

## Pages To Refresh

Existing pages where:

- a recommendation may now be stale
- a new model materially changes the answer
- new benchmark evidence exists
- pricing changed materially
- important product capabilities changed

## Tests To Run

Areas with meaningful user demand but inadequate evidence.

For example:

> Search demand for AI spreadsheet reconciliation is rising, but no available benchmark measures this task well.

That becomes a candidate for a Normie Mode test suite.

## Evidence Gaps

Capabilities where the site cannot confidently answer a common user question.

## Emerging Capability Areas

Clusters of demand indicating an entire category deserves deeper investment.

---

# Opportunity Scoring

Potential pages or tests may eventually receive an internal opportunity score.

Possible inputs include:

- search demand
- search growth
- capability relevance
- evidence availability
- evidence weakness
- ranking attainability
- SME relevance
- commercial usefulness
- content freshness
- strategic value

The final scoring model remains open.

Its purpose is prioritisation, not public ranking.

---

# The Research Flywheel

The long-term system can become demand-driven.

**People ask**

↓

Normie Mode detects growing demand.

↓

The system checks whether sufficient evidence exists.

↓

If evidence exists, Normie Mode explains it.

↓

If evidence is weak, Normie Mode identifies a research gap.

↓

Normie Mode runs or commissions a reproducible test.

↓

The result becomes structured evidence.

↓

That evidence improves multiple task and capability pages.

↓

Those pages attract more users and queries.

↓

New demand reveals the next research gaps.

This is potentially the strongest long-term moat in the product.

Normie Mode begins by translating external benchmark data.

Over time it accumulates proprietary evidence around the work ordinary people actually care about.

---

# SEO Model

SEO should emerge from genuinely useful structured pages rather than thin programmatic content.

Primary search surfaces include:

## Task Intent

- Best AI for Excel
- Best AI for research
- Best AI for presentations
- Best AI for coding

## Capability Intent

- Can AI analyse spreadsheets?
- Can AI review contracts?
- Can AI browse websites?
- Can AI build apps?

## Comparison Intent

- Claude vs GPT for coding
- Gemini vs Claude for research
- Best AI model for Excel

## Benchmark Intent

- What is SWE-bench?
- Humanity's Last Exam explained
- What does GPQA measure?

## Model Intent

- What is GPT-X good at?
- Claude X benchmarks explained
- Is Gemini X good for coding?

## Industry Intent

Potential later examples:

- Best AI for accountants
- Best AI for property managers
- Best AI for lawyers
- Best AI for agencies

The system should favour one authoritative canonical page for an intent cluster over many near-duplicate keyword pages.

---

# Freshness

Freshness is a product requirement.

Every recommendation should know:

- model version
- source date
- evaluation date
- page review date

Changing upstream evidence should make downstream affected pages discoverable.

For example:

A new result changes the assessed strength of a model's computer-use capability.

The system should identify task pages relying on that capability and flag them for review.

This is one of the reasons the relational knowledge model matters.

---

# Editorial Voice

Normie Mode should be:

- plain
- practical
- evidence-driven
- sceptical of benchmark theatre
- technically accurate
- comfortable saying when evidence is weak
- useful to someone with no interest in becoming an AI expert

The joke is never that the user is unsophisticated.

The joke is that the AI industry frequently communicates basic questions in unnecessarily complicated language.

---

# Brand

**Normie Mode** is the product.

The working brand promise is:

**What AI can actually do.**

Norm is an older male editorial character who can act as a recognisable guide through complicated AI claims.

Norm should feel:

- practical
- sceptical
- curious
- unimpressed by jargon
- interested in whether the thing actually works

Norm should not become a novelty mascot that overwhelms the product.

Potential editorial devices include:

**Norm's verdict**

A concise plain-English conclusion.

**Norm's pick**

A recommended model for a task.

These naming devices should be introduced selectively rather than applied everywhere.

---

# Potential Business Value

The initial product can operate as a free public reference and acquisition engine.

Potential later commercial opportunities may include:

- premium industry reports
- capability monitoring
- business-specific recommendations
- API access to structured capability data
- benchmark datasets
- enterprise AI evaluation
- sponsored placements with strict evidence rules
- affiliate relationships
- paid research
- model-selection tools
- SME AI capability audits

No monetisation model is currently settled.

The initial priority should be creating a useful and trusted product.

---

# V1 Goal

V1 should prove that Normie Mode can turn fragmented AI evaluation data into a significantly more useful experience for ordinary users.

It should not attempt to model all AI capability or all forms of work.

A likely V1 contains:

- homepage
- structured search
- model pages
- benchmark pages
- capability pages
- task pages
- selected report pages
- evidence/source system
- versioned model results
- basic internal editorial/admin workflow

The intelligence layer may initially produce recommendations for human review rather than automatically publishing anything.

First-party Normie Mode tests may begin with a single narrow suite rather than many categories.

The first test category should be selected based on a combination of search demand, practical relevance and weakness in existing benchmark coverage.

---

# Likely V1 Dataset

A deliberately constrained first dataset might cover:

## Models

A small set of major frontier models people actually use.

Potentially 4 to 6 model families initially.

## Capabilities

Approximately 8 to 15 high-level capabilities.

Examples:

- coding
- research
- writing
- spreadsheet work
- document understanding
- computer use
- visual reasoning
- long-context work
- instruction following
- agentic execution

## Tasks

Approximately 30 to 60 recognisable tasks mapped to those capabilities.

## Benchmarks

Only evaluations materially useful to the initial capability set.

The goal is not benchmark completeness.

## Reports

A selected set of high-demand search pages assembled from the same underlying knowledge.

---

# Technical Direction

The system should begin with a relational canonical data model.

Postgres is likely sufficient.

The schema should preserve:

- canonical IDs
- model versions
- benchmark versions
- provenance
- source URLs
- result dates
- evidence relationships
- task-capability relationships
- recommendation history

The website should not encode recommendations directly into static editorial copy where avoidable.

Structured facts should feed public pages.

Editorial interpretation can sit on top.

This allows recommendations and evidence to change without manually rewriting the entire site.

---

# Automation Boundaries

V1 should not automatically publish pages merely because search demand exists.

Automation can:

- detect opportunities
- cluster queries
- identify stale pages
- gather candidate evidence
- propose updates
- identify missing evaluations
- draft structured reports

Humans should retain editorial control until the reliability of the pipeline is demonstrated.

Normie Mode's credibility depends more on being correct than being large.

---

# What Makes Normie Mode Different

The initial wedge is making AI benchmarks and capability understandable.

The larger opportunity is building a map of what AI can actually do.

Existing sites largely begin with models.

Normie Mode begins with work.

Existing sites generally ask:

> How intelligent is this model?

Normie Mode asks:

> Can it do the thing I need done?

Search demand reveals what people want AI to do.

Benchmarks and external research provide evidence.

First-party testing fills the gaps.

The knowledge system connects all three.

---

# Open Product Questions

These questions should be resolved deliberately rather than left for implementation to decide.

## Recommendation Methodology

How exactly should Normie Mode decide that one model is better for a task?

Should recommendations use:

- explicit weighted scores
- editorial judgement
- first-party testing
- benchmark aggregation
- some combination?

How much of that methodology should be public?

## Capability Taxonomy

How granular should capabilities become?

For example, is “spreadsheet work” a capability or a task family built from:

- table reasoning
- formula generation
- numerical reasoning
- file manipulation
- chart creation
- anomaly detection?

The taxonomy needs enough structure to be useful without becoming academic ontology work.

## Task Taxonomy

What constitutes a canonical task?

How should closely related search queries map onto tasks?

## Model Versus Product

Should the primary recommendation compare:

- foundation models
- consumer products
- agents
- all three?

The answer may differ by task.

## Testing Access

Which products and APIs can reasonably be tested continuously?

What happens when important functionality is only available through closed product interfaces?

## Test Methodology

How many attempts should each model receive?

Should models receive identical tools?

When is it fair to enable provider-specific tools?

How should nondeterministic outputs be scored?

## Human Scoring

Which tasks require expert review?

How do we maintain consistency between reviewers?

## Recommendation Freshness

What change is significant enough to alter a recommendation?

How long can an evaluation remain valid?

## Search Data

Which sources provide sufficiently reliable query and trend data?

What can be collected automatically?

## Report Generation

How much report content should be generated automatically from structured data?

Where is explicit editorial writing required?

## Industry Pages

When should Normie Mode introduce roles and industries?

Should these emerge only after enough underlying task coverage exists?

## Personalisation

Does a user eventually specify:

- profession
- company size
- tools
- software stack
- budget
- risk tolerance

and receive recommendations specific to them?

This is probably valuable later but is not required for V1.

## Chat

Does conversational search eventually add meaningful utility over structured browsing?

Chat should only be introduced if it improves access to the knowledge base rather than becoming the product by default.

## Monetisation

What business model best preserves trust?

This remains intentionally unresolved.

---

# Immediate Product Work

Before substantial implementation begins, the next product-definition pass should resolve:

1. The first audience wedge.
2. The initial capability taxonomy.
3. The first 30 to 60 canonical tasks.
4. The initial model set.
5. The benchmark selection criteria.
6. The recommendation methodology.
7. The first-party test category.
8. The initial information architecture.
9. The source and freshness model.
10. The smallest useful intelligence-layer implementation.

Once those are resolved, Codex should be able to turn this vision into a concrete product specification, schema and implementation plan without inventing fundamental product decisions.

---

# North Star

Normie Mode should become the place someone goes when they want to know:

**Can AI actually do this yet?**

And receive an answer they can understand, inspect and trust.