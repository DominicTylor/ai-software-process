---
name: legacy-decision-extract
description: Read git history over a long window, identify behavior-changing commits from before the canon was adopted, suggest retroactive `decision/*` tags for the significant ones.
model: sonnet
allowed-tools: Bash, Read, Grep, Agent
---

# /legacy-decision-extract

Recovers institutional memory that predates the canon. Most projects with prior history have made meaningful decisions — dropped features, swapped technologies, changed conventions — that were recorded informally (in chat, in PR descriptions, in unstructured commit messages) or not at all. This skill surfaces those decisions and proposes retroactive `decision/*` tags so future `/decision-search` queries find them.

A one-time activity per repository, typically done shortly after Phase 0 silent landing. Optionally re-run when the canon adopts new structural rules that affect how decisions should be addressable.

## Reads

- Git log over a configurable window (commonly the last 1–3 years of behavior changes; broader if the repo is younger)
- Commit messages, PR titles, and merge commit summaries
- Files touched by candidate commits, when context is needed to assess significance

## Produces

- A list of significant behavior-changing commits, each with:
  - Commit sha
  - Subject line
  - Summary of what changed (inferred from message + diff)
  - Reason captured (if any) — quote from the commit message
  - Suggested `decision/<slug>` tag name
  - Confidence — high / moderate / low based on how clear the rationale is
- Suggested `git tag decision/<slug> <sha>` commands the Owner can review and execute
- A note for each commit where the rationale is missing or unclear, recommending the Owner add a fresh `behavior:` commit that captures the decision retrospectively if it still matters

## Invokes

- `decision-historian` — for reasoning about which commits are significant, how decisions evolved across multiple commits, and what tag names are appropriate

## Mode

Invokable manually. Typically a one-off run; the output is reviewed by the Owner before any tags are actually applied.

## Implementation notes

When refining the prompt, ensure it:

- Never silently applies tags. The output is recommendations only; the Owner approves before any `git tag` runs.
- Distinguishes "this is a clear decision with quoted reasoning" from "this is a behavior change with no recorded reasoning." The first gets a tag with high confidence; the second gets a tag with a recommendation to add a retroactive `behavior:` commit explaining why.
- Recognizes when a thread of commits evolved a decision over time. The tag goes on the commit that finalized the decision, not on every step along the way.
- Does not invent rationale. If the git log is silent, the output is honest about that.
