<!--
  RUN OUTPUT — definitions STUB (re-mint). Seeds 1-2 three-voice cards; the domain owner
  authors the rest. A cav2 Evidence citation is provenance, never a resolution path (Obs-B).
-->

# Research Local Definition Cards

Status: active
Promotion scope: local-research-only
Canonical source: yes

These definitions are local research definitions for this repository. They do not define
ResonantDAO economy policy, governance weight, launch readiness, or implementation contracts.

> **Citation vs authority (Obs-B).** A card's `Evidence:` field MAY cite a harvested cav2
> snapshot. That is provenance/citation — removing the framework attachment does not change
> the definition. A `Source kind:` of method-authority points at **this repo's own
> constitution**, never at cav2.

## ER-D1. Economy Resilience

Source kind: operator-reading; local-inference

Evidence: [README.md](../README.md), [authority/source-spine.md](../authority/source-spine.md)

Formal voice:

```text
Economy-Resilience =
  incentive-compatibility-under-model
  AND named-behavioral-residue
  AND audit-path-for-each-randomized-decision
```

Plain-language voice: an economy that holds up not just in a clean model but when real
participants behave badly, and where every "random" or discretionary step can be audited.

Domain-context voice: a candidate property to study across the failure corpus — NOT a proven
invariant. The repo is mapping which mechanisms preserve it.

Use carefully: each conjunct is itself a candidate needing a witness; this is a research
target, not a theorem.

Misuse warning: do not treat "passes the model" as "resilient" — that is exactly the
non-collapse rule 6 conflation.

Promotion boundary: local-only (blocked-until-witness)

## ER-D2. Candidate Invariant

Source kind: local-inference  *(may cite a harvested precedent in Evidence — citation only)*

Evidence: [authority/AUTHORITY-MODEL.md](../authority/AUTHORITY-MODEL.md), [sources/local-snapshots/formal/](../sources/local-snapshots/formal/)

Formal voice:

```text
Candidate-Invariant = a proposed condition the economy should preserve,
  stated with: the quantity it constrains, a collapse test, and a workflow witness —
  owned HERE, resolved to this repo's own validation route, never to a framework.
```

Plain-language voice: a "this should always hold" claim that is explicitly still a proposal,
carrying its own test and one concrete scenario.

Domain-context voice: the repo's preferred development lane for hardening a synthesis into
something testable. **Honest note:** as an authority KIND this overlaps cav2's `Definition`
kind (cav2 governs `invariant` as the Definition kind) — see AUTHORITY-MODEL F3(c) column.

Use carefully: candidate status is not validation; a candidate invariant cited in a rule does
not make the rule "fully specified".

Misuse warning: do not treat a candidate invariant as a governance rule before its witness +
external owner gate.

Promotion boundary: local-only
