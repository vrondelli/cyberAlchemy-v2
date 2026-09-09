<!--
  RUN OUTPUT — definitions STUB for the API-contract governance domain. Seeds 1-2 three-voice
  cards. A cav2 Evidence citation is provenance, never a resolution path (Obs-B).
-->

# API-Contract Local Definition Cards

Status: active
Promotion scope: local-apic-only
Canonical source: yes

These definitions are local API-contract definitions for this repository. They do not define
the org's API policy, governance weight, launch readiness, or implementation contracts.

> **Citation vs authority (Obs-B).** A card's `Evidence:` field MAY cite a harvested cav2
> snapshot. That is provenance/citation — removing the framework attachment does not change the
> definition. A `Source kind:` of method-authority points at **this repo's own constitution**,
> never at cav2.

## APIC-D1. Compatibility Ruling

Source kind: operator-reading; local-inference

Evidence: [authority/AUTHORITY-MODEL.md](../authority/AUTHORITY-MODEL.md), [authority/source-spine.md](../authority/source-spine.md)

Formal voice:

```text
Compatibility-Ruling(diff) =
  classify(diff) ∈ { non-breaking, forward-compatible, breaking }
  AND ruled-by(compatibility-governance)   -- NOT taken from the version label
  AND binds(consumer-migration-burden)
```

Plain-language voice: a standing yes/no/with-caveats verdict on whether a proposed change keeps
the promises an integrator relies on — decided by the compat owner, not by the version string.

Domain-context voice: the repo's central predicate; every contract diff gets one.

Use carefully: a ruling is necessary, not sufficient, to ship — the ship is an external owner
decision.

Misuse warning: do not equate a semver-minor label with a non-breaking ruling.

Promotion boundary: local-only

## APIC-D2. Deprecation Schedule ⟵ *domain-originated (the temporal-commitment kind)*

Source kind: local-inference  *(may cite a harvested precedent in Evidence — citation only)*

Evidence: [authority/AUTHORITY-MODEL.md](../authority/AUTHORITY-MODEL.md)

Formal voice:

```text
Deprecation-Schedule(element) =
  ⟨ T0: deprecate-marked,
    T1: warn-window-open,
    T2: removal-permitted ⟩
  with T0 < T1 < T2
  AND binding( removal cannot fire before T2 )
  AND binding( warn window cannot shorten once an element is inside it )
  -- a FUTURE-DATED, TIME-INDEXED obligation owned by lifecycle-scheduling
```

Plain-language voice: a calendar-backed promise — "this field is deprecated now, you have until
this date, and it will not be removed before then" — that the repo is bound to keep and a
consumer may plan against.

Domain-context voice: the domain's distinctive object. **It is what makes this domain's kind
set domain-ORIGINATED under F3(c):** cav2 has no schedule/timeline kind and no owner route
governing time-indexed sunset obligations. A `decision-gate` rules a point choice; a
deprecation schedule binds a future timeline.

Use carefully: a schedule is a commitment, not a wish — emitting one binds the repo's own
behavior over time.

Misuse warning: do not confuse a deprecation *announcement* (no bound removal date) with a
deprecation *schedule* (bound T0/T1/T2).

Promotion boundary: promotion-candidate *(could be proposed back into cav2's D49 as a new
temporal-commitment kind — but that is a SEPARATE downstream owner-ratified act, never this
mint, per Obs-C)*
