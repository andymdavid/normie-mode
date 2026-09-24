# Normie Mode test: Answer business questions from a messy spreadsheet (version 2)

Status: ready to run · Suite version 1 · Job: `analyse-a-spreadsheet` / office work

## Why

In the first test (`spreadsheet-questions`), four of six models scored 30/30, so it couldn't separate the stronger models. Real business sheets aren't tidy, and handling that is where mistakes happen. This version keeps the same setup and automatic scoring, and adds realistic untidiness and questions that need more steps.

## What changes from version 1

- **Messier sheet (~190 rows):** four customers written several ways ("Ltd", capitals, "&" or "and"); 3–5 orders typed in twice with the same order ID; returns as negative-quantity rows; about 30% of dates written day/month/year; a 5% price rise from April on some products.
- **Owner's notes in the prompt** explain each of these, as a real owner would, so every answer is defensible.
- **Eight harder questions:** March net revenue; biggest customer and amount (spellings must be merged); top-three customers' share of revenue; customers who ordered in Q1 but not Q2; the biggest month-on-month increase; the value of returns; how many rows are duplicates; average Q2 order value.
- **The mess has to matter:** a sheet is only used if the lazy reading (not merging spellings, counting duplicates twice) gives the wrong biggest customer. Tests enforce this and recalculate the answer key independently.

## Scoring

As version 1: money within 0.5% or £1, percentages within half a point, counts exact, any spelling of the right customer accepted, months matched by name. Score = share of the eight questions right.

## Running

`npm run eval -- --suite messy-spreadsheet-questions --budget <cap>`. Models run cheapest first, so if the cap is reached only the most expensive models are skipped.

## What this does not claim

Synthetic data pasted as text; one run per case; default model settings; results reviewed before publication.
