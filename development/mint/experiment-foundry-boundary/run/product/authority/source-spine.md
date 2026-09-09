<!--
  RUN OUTPUT — source-spine for the API-contract governance domain. cav2 confined to
  citation/provenance only; Blocked-use forbids any resolution-path role (Obs-B).
-->

# Source Spine

Status: active
Owner: API-contract governance owner

## Source Families

| Family | Current source | Allowed use | Blocked use |
| --- | --- | --- | --- |
| Published API contract (primary) | the schema / OpenAPI / proto registry | Official claims the contract makes about itself (types, endpoints, fields, declared version). | Inferring unstated compatibility; treating a maintainer reading as the contract's own declaration. |
| **CyberAlchemy v2** *(harvested precedent)* | `sources/local-snapshots/cav2/` | **Harvested precedent (supporting source) — citation/provenance ONLY**: a record of how this spine's authority-separation + promotion shape was harvested. | **Treating CAV2 as authority over API-contract design, or placing it on ANY resolution path** (compatibility rulings, deprecation schedules, surface decisions, promotion, source-posture, non-collapse decisions resolve to *this repo's own* `authority/`, never to cav2). |
| Consumer telemetry / breakage reports | `sources/telemetry/` | Related evidence: which contract changes caused which consumer breakages. | Treating one consumer's breakage as a general compatibility rule without a witness + owner ratification. |
| API-versioning standards corpora | external standards (semver, OpenAPI evolution practice, gRPC/proto compatibility rules) | related-source: analogies for compatibility/deprecation design. | Claiming a standard's result the repo has not locally witnessed; resolution-path use. |

## Source-Kind Labels

Use these labels in claims and synthesis:

- `primary-source`
- `supporting-source`  *(this is what harvested framework precedent gets — never `authority`)*
- `related-source`
- `analogy`
- `local-inference`
- `operator-reading`
- `open-residue`

## Harvested Local Controls

The API-contract harvest of CyberAlchemy v2 (and any other framework) closed as a set of
**bridge-labeled API-contract controls — citation only, not authority**. Reuse local snapshot
citations first and preserve the demotions:

- a cav2 authority-kind row is a *shape precedent*, not an API-contract kind;
- a cav2 promotion gate is an *analogy* for a compatibility/deprecation gate, not a binding;
- **authority moves only by API-contract governance's OWN owner route
  (`compatibility-governance`, `lifecycle-scheduling`, `surface-governance`, external owner
  decision) — never by a framework edge;**
- **a framework return/adopt-back package is at most a DEFERRED candidate evidence package; no
  cyclic citation chain can promote authority in either repo** (Obs-B at the harvest level).

## Authority / Lifecycle Boundary

The CyberAlchemy v2 authority/lifecycle material is **locally snapshotted as harvested
method/provenance precedent (supporting source), NOT API-contract proof**. Local statuses
(`apic-pass`, `apic-flag`, `apic-block`) create no validation proof, policy effect,
implementation readiness, or **authority effect**. Downstream use needs exact local citations
and **API-contract governance's own owner-route selection** — the framework is never the
deciding authority.
