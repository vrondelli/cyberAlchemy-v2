# CyberAlchemy Product Documentation

Status: candidate product documentation
Visibility: private
Meaning owner: CyberAlchemy v2
Authority effect: none

This folder explains the product CyberAlchemy is committed to building. It is
the human-readable source for the current product thesis, journeys, and desired
outcomes. Its first-order principles define the product direction even while
realizations and outcomes remain incomplete. It does not make a term canonical,
prove product value, or authorize implementation.

## The Short Version

CyberAlchemy helps a person and a machine notice what complex work needs, choose
the smallest useful governed action for the person, task, and moment, and
continue without losing meaning, evidence, ownership, bounded authority, or
human control.

It does this through a feedback-controlled work loop: make the desired result
explicit, act inside an allowed boundary, observe what happened, compare it with
what was expected, and adjust or stop. Preserve the evidence and unfinished
work so the next person, agent, or session can continue from a useful state.
People retain control of purpose and consequential choices; routine work stays
lightweight.

```text
Desired result -> permitted action -> observed result -> comparison
       ^                                                   |
       +--------- adjust / continue / ask / stop <----------+
                              |
                              v
                   preserved state + next owner
```

This is the product's practical cybernetic framing: feedback changes the next
move. It is not a claim that every component learns autonomously. See the
[in-depth work-loop explanation](CYBERNETIC-WORK-LOOP.md).

## Product And Repository Are Different

| Name | Meaning here |
| --- | --- |
| **CyberAlchemy Product** | The governed human-machine work system and the value it is meant to create. This is a candidate product thesis. |
| **CyberAlchemy v2 Repository** | The private, project-local stable repository candidate defined by `CAV2-D9`. It is an intended delivery form and authority spine. |

The repository may carry or distribute the product, but this documentation does
not decide that it is the whole product.

## Read In This Order

1. [PRODUCT-THESIS.md](PRODUCT-THESIS.md) — the first-order principles, why the
   product should exist, who it serves, and what evidence would require revision.
2. [PRODUCT-THESIS-DOCUMENT-TYPE.md](PRODUCT-THESIS-DOCUMENT-TYPE.md) — the
   canonical document contract, lifecycle, authority boundary, and concrete example.
   [product-thesis.record.json](product-thesis.record.json) is its machine-readable
   projection.
3. [PRODUCT-JOURNEYS.md](PRODUCT-JOURNEYS.md) — how the promise should feel in
   real work, starting with Invoke Define.
4. [OUTCOME-MODEL.md](OUTCOME-MODEL.md) — the desired changes that later metrics
   and KPI targets must test.
5. [../ontology/product/README.md](../ontology/product/README.md) — the
   machine-readable candidate map of product nodes, relations, and residue.
6. [../goals/README.md](../goals/README.md) — the canonical Goal document type,
   Project concept, current goal records, and their product-thesis connections.
7. [../research/README.md](../research/README.md) and
   [../experiments/README.md](../experiments/README.md) — canonical Evidence
   document contracts connected to Projects, Goals, findings, and run evidence.

## Source And Authority Order

These artifacts have different jobs:

1. [../VALUE-AND-PHILOSOPHY-PROPOSITION.md](../VALUE-AND-PHILOSOPHY-PROPOSITION.md)
   supplies the earlier private proposition and philosophy.
2. This folder states the current candidate product meaning in practical
   language.
3. [../authority/AUTHORITY-MODEL.md](../authority/AUTHORITY-MODEL.md) owns the
   active authority flow, kinds, postures, and narrowest-owner rules referenced
   by the product thesis.
4. `../ontology/product/*.json` projects product meaning into stable candidate
   nodes and relations.
5. [../authority/definitions/DEFINITIONS.md](../authority/definitions/DEFINITIONS.md)
   is the only canonical CyberAlchemy v2 definition source.
6. Validation and observability may provide evidence, but they cannot change
   product meaning or promote a candidate.

When the documents disagree, the disagreement must stay visible. An ontology
record or README must not silently settle it.

## Documentation Lifecycle

```text
first-order product commitments
      -> reviewed product meaning and realization hypotheses
      -> outcome and measurement proposal
      -> owner-approved specification
      -> observed product evidence
      -> bounded outcome claim or realization/thesis revision
```

The principles are committed product direction. The documents and ontology are
still candidate representations of that meaning and remain open to review.
Metric formulas, data contracts, baselines, and KPI targets come later and test
whether concrete realizations deliver the intended outcomes.

## Current Claim Ceiling

This documentation establishes committed first-order product principles and a
coherent candidate model of their meaning. It does not establish customer
demand, product-market fit, productivity improvement, economic value, causal
proof, runtime completion, publication, release, or deployment readiness.

## Open Questions

See [the work-loop explanation](CYBERNETIC-WORK-LOOP.md#open-questions) for
measurement, delayed feedback, retained state and implementation questions.
