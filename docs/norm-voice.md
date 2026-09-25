# Norm's voice

Norm is the site's guide: a patient, experienced friend who has actually tried this stuff and wants you to get on with your work. He appears as short chat bubbles at the points where someone might get stuck, and writes a short guide on each task page.

Chosen voice (2026-09-24): **warm tutor**.

## Who he is

- Older, practical, curious. He's seen plenty of technology come and go and judges it by whether it helps.
- Patient. He never makes anyone feel silly for not knowing a term.
- Honest. When nobody knows yet, he says so, and tells you what he'd do in the meantime.
- On your side, not the AI companies'.

## How he talks

- Short sentences. One idea per bubble. Two or three sentences at most.
- Everyday words: "cost" not "pricing tier", "how much it can read" not "context window". If a technical word matters, he explains it in the same breath.
- Speaks to one person: "you", "I'd", "here's how I'd…".
- Points at what's on the screen: "this bar", "those little lines".
- Encouraging, never gushing. No exclamation marks, no hype words ("revolutionary", "game-changing", "powerful").
- British spelling.

## What he does

- **Opens a task page** with the short version: what to use, or that there's no clear answer yet.
- **Explains how to read a chart** the first time a reader meets it.
- **Names the catch:** what to check, where AI tends to slip.
- **Gives one practical tip** you could use today.

## What he never does

- Invent facts or numbers. Any number he mentions comes from the data on that page.
- Claim more certainty than the evidence gives. "Looks like", "so far", "in this test" are his friends.
- Recommend a model the charts don't support.
- Joke at the reader's expense, or about AI "taking over".
- Give medical, legal or financial advice. For health and legal pages he says to check with a qualified person.

## Examples

Good:

- "Don't worry about the numbers. Longer bar, better result. That's really all you need here."
- "This little line shows how confident the testers are. When two lines overlap, the models are about as good as each other."
- "There isn't a proper test for CVs yet, but AI is a great help with a first draft. Just check every fact it writes about you."

Not Norm:

- "GPT-6 Sol absolutely crushes the competition!" (hype, exclamation mark)
- "The ECI aggregates IRT-calibrated benchmark performance." (jargon)
- "Studies show AI saves 40% of your time on CVs." (a number with no source)

## Accuracy model

Norm's words come in two kinds, and the build keeps them apart:

- **Advice (hand-written).** His opening line and his three-part guide on each task page (`content/intents/*.yaml`) and shared method lines (`content/norm/charts.yaml`). These may only give advice. The validator rejects any hand-written line that names a model or maker, and any intro that includes a number or makes a claim about the evidence ("these tests", "people's votes", "scores", "tested", "comes out on top").
- **Anything about the data (generated).** What the evidence is, who leads, who's too close to call, and what the top models cost come from templates in `content/norm-messages/messages.yaml`, filled with facts computed from the same data as the page's charts (`src/lib/norm.ts`). Each template has conditions, for example votes only, half votes, or evidence inherited from the hub, and the first matching variant is used. A template that needs a fact the page doesn't have fails the build.
- **Tests** (`src/lib/norm.test.ts`) render every message on every task page and check it against the data: the named leader matches the chart, "people's votes" appears only when the evidence is votes, and the cost note names the cheapest of the top-scoring models.

To change what Norm says about the data, edit the template wording, not the page. To add a new kind of claim, add a fact in `taskFacts` and a template that uses it.

## Review

Norm's lines are editorial. They're written as drafts (`status: draft`) and show only in preview until the product owner approves them (`status: approved`), in line with AGENTS.md.
