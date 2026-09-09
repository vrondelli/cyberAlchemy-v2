<!--
  RUN OUTPUT — crosswalk for the API-contract governance domain. cav2 appears as ONE crosswalked
  precedent with a Boundary verdict, never as authority. Crosswalk ≠ dependency (Obs-B).
-->

# API-Contract Related Framework Crosswalk

Status: active
Promotion scope: local-apic-only

| Framework or corpus | Why included | Source kind | Closes residue | Boundary |
| --- | --- | --- | --- | --- |
| **CyberAlchemy v2** | Gives an existing authority-separation + source-posture + promotion-discipline model (harvested precedent for how this spine was shaped). | local-inference | APIC-R1, APIC-R2 | **borrow-carefully** *(precedent only — NOT an authority over API-contract design)* |
| Semver / OpenAPI-evolution / proto-compatibility standards | Established compatibility-classification analogies. | related-source | APIC-R3 | analogy-only |
| Consumer telemetry corpus | Empirical breakage evidence for compatibility rulings. | related-source | APIC-R4 | future-work |

## Bridge Decisions

| Concept | Decision | Rationale | Follow-up |
| --- | --- | --- | --- |
| Authority-separation model | borrow-carefully | The cav2 separation shape is a useful precedent; this repo owns its OWN compat/deprecation/surface rules. | Keep cav2 as citation; never resolve an API-contract decision across it. |
| Compatibility classification | analogy-only | Semver/OpenAPI rules are analogies; the local `compatibility-governance` owner rules each diff. | — |
| **Deprecation schedule (temporal commitment)** ⟵ *domain-originated* | promotion-candidate | A time-indexed sunset-obligation kind with no cav2 analog; could become a new cav2 D49 temporal-commitment kind if the owner accepts it. | After fan-out, route to definitions/constitution **owner decision** (D49 owner-gate — a SEPARATE downstream act, not the mint). |

> **Crosswalk ≠ dependency (Obs-B).** Every framework above is a crosswalked precedent with a
> reuse verdict. Removing the framework attachment changes none of these verdicts — they are
> records of *how* the spine was shaped, not edges an API-contract decision resolves across. A
> `promotion-candidate` is a proposal for a future owner-ratified act, never the mint act.
