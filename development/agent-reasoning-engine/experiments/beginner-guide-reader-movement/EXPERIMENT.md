---
title: Beginner Guide Reader-Movement Experiment
status: candidate-in-progress
date: 2026-08-13
scope: private-agent-reasoning-engine-guide
authority_effect: none
promotion_effect: none
---

# Beginner Guide Reader-Movement Experiment

## Objective

Test whether Whisper's candidate reader-movement contract improves the path
through the Agent Reasoning Engine beginner guide without changing its
technical claims, authority ceiling, executable commands, or private scope.

This is one bounded authoring case. It may reveal useful evidence about the
contract; it cannot establish that the contract is universally effective or
promote it beyond candidate status.

## Compared artifacts

| Role | Artifact | SHA-256 at capture |
|---|---|---|
| Baseline | [`BASELINE.md`](BASELINE.md) | `80b7cb3d1eab2b698b3bd0af0d2633fdc4e8f7dd147bd49d4154b688439d1ce9` |
| Treatment candidate | [`TREATMENT-READER-MOVEMENT.md`](TREATMENT-READER-MOVEMENT.md) | `4a4c034741edd9912bfc5665b3e5a89246a95dc68f36716f6ee407cc6fd4de32` |

The baseline is a byte-for-byte copy of the pre-treatment guide: 424 lines and
2,641 words. The reviewed treatment candidate is 464 lines and 2,808 words.

## Fixed variables

The treatment must preserve:

- the audience and `source_state_as_of: 2026-08-13`;
- the separation among run admission, finite semantic result, and exact-effect
  permission;
- the fact that the evaluator and resolver are sibling packages, not an
  integrated pipeline;
- the eight evaluator outcomes and four resolver dispositions;
- the implementation paths, test commands, Node support statement, and current
  16/34 passing-test observation;
- the absence of a real effect path, product installation, public release,
  selected downstream SWU, or established ACI runtime compatibility;
- the ledger/work-pack inconsistency and its mutation stop;
- historical replay versus fresh revalidation;
- immutable-receipt, fail-closed unknown, digest, and private/public boundaries.

The treatment may change only explanatory order, transitions, headings, local
wording, and the placement or consolidation of reference material.

## Treatment hypothesis

The baseline's first movement break occurs before the concrete mental model,
when lifecycle and synchronization vocabulary arrives before the reader knows
what the two packages do. The treatment should:

1. open on a problem-specific refund decision;
2. introduce each technical name after the need it answers;
3. make the relationship between the sibling slices explicit before cataloging
   files;
4. place each code-landmark table beside the trace it supports;
5. defer detailed lifecycle drift until the reader approaches mutation;
6. combine repeated invariants and newcomer traps;
7. end by transforming the opening rule into observable newcomer abilities.

## Human review tasks

A reviewer should read each version as a JavaScript-capable newcomer and answer:

1. What are the two implemented package jobs, and do they call each other?
2. Why can a positive semantic result still produce zero effects?
3. What is the safest useful first action in the repository?
4. What currently blocks a new implementation change?
5. Which broader engine, product, integration, or release claims remain out of
   bounds?

The reviewer should also mark the first point where they had to reread, skip
ahead, or hold unexplained terminology in memory.

## Decision rubric

- `BLOCK`: any factual regression, broken executable path, authority inflation,
  or private-to-public leakage.
- `FLAG`: mechanical controls pass and the treatment appears directionally
  stronger, but fewer than two independent target-reader reviews satisfy the
  acceptance criteria.
- `PASS`: at least two independent target-reader reviews each retell at least
  four of the five tasks correctly, distinguish the sibling packages, identify
  a safe first action, and introduce no factual or authority regression.

Even `PASS` would mean only that this treatment won this bounded comparison. It
would not mechanically prove prose quality, authorize publication, or promote
the Whisper contract.

## Mechanical controls

Before recording a result:

1. confirm the baseline digest still matches its capture;
2. verify every relative Markdown link in the treatment resolves;
3. run both package suites from the repository root;
4. run scoped whitespace checks over the treatment and experiment artifacts;
5. validate the canonical and generated Whisper reader-movement declarations;
6. record the final treatment digest and any independent comparative review.

Semantic checks such as opening specificity, earned progression,
need-before-name, relation-over-catalogue, and the first movement break remain
human editorial judgments. The deterministic validator checks only the declared
contract shape.
