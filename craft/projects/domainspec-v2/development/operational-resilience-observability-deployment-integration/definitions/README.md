# ORODI Definition Pack

Status: candidate. Authority effect: none.

Owner disposition: approved on 2026-09-01 for exact pack SHA-256
`66aedc5756733a1064e401bb1688bdb65850ae154fa1bb4ebf6cc6a264cf0c7d`.
See
[`ORODI-DEFINITIONS-DISPOSITION-002`](owner-decisions/ORODI-DEFINITIONS-DISPOSITION-002.json).
The decision accepts the proposed 10 shared-track / 7 bounded-context-track
split. It does not change this immutable candidate's bytes or status.

This package defines the proposed vocabulary for **Operational Resilience,
Observability, and Deployment Integration (ORODI)** before the rest of the
DomainSpec-governed construction chain is allowed to claim a current semantic
predecessor.

The earlier Invoke glossary is useful source material, but its own claim ceiling
says that it does not define canonical vocabulary. This pack adds the missing
definition-governance shape: normative, formal, plain-language, and ORODI-context
voices; boundaries; exact sources; owner and consumer routes; relationships;
downstream mappings; and a drift route.

## Proposed definitions

| ID | Term | Practical meaning |
| --- | --- | --- |
| ORODI-001 | Operational Resilience, Observability, and Deployment Integration | The capability family that evaluates resilience and delivery claims without turning evidence into authority. |
| ORODI-002 | Operational Resilience | Evidenced preservation or restoration of declared critical outcomes under declared stressors and limits. |
| ORODI-003 | Operational Evidence | Immutable, provenance-bound observations and evaluations for one exact subject, environment, window, and policy. |
| ORODI-004 | Evaluation Binding | The complete exact identity set used by one evaluation. |
| ORODI-005 | Evidence State | One disjoint result: passed, failed, missing, invalid, inconclusive, stale, or not-run. |
| ORODI-006 | Failure Meaning Separation | Domain failure, integration outcome, and runtime exception mapping remain distinct. |
| ORODI-007 | Product Observability | Product signals can produce evidence, but observers cannot actuate protected effects. |
| ORODI-008 | Telemetry Conservation | Every offered and queued observation has an accounted fate. |
| ORODI-009 | Deployment Integration | The governed linkage among change evidence, authorization, observed effects, rollback, and terminal restoration. |
| ORODI-010 | Operational Simulation | A no-effect test of operational or transition logic that can never prove deployment or runtime behavior. |
| ORODI-011 | Canary Analysis | A non-actuating, policy-bound stable/candidate comparison. |
| ORODI-012 | Runtime Evidence | Evidence from an admitted observer during an authorized run in the exact bound environment. |
| ORODI-013 | Deployment Evidence | Independent runtime evidence that an authorized environment transition occurred. |
| ORODI-014 | Rollback Restoration Evidence | Independent proof that all candidate references are gone and stable outcomes are restored. |
| ORODI-015 | Infrastructure Plan Safety | A fail-closed clean/destructive/unknown verdict over an exact infrastructure plan. |
| ORODI-016 | Run-Ready Local Lab | A fully prepared and statically checked lab package that has not been run. |
| ORODI-017 | Local Commissioning | One separately authorized local exercise, evidence capture, teardown, and zero-residual verification. |

`ORRI` and `ORDI` are not accepted aliases in this candidate. `ORODI` is the
only proposed acronym.

## Ubiquitous language

The implementation-facing candidate language is defined in
[`UBIQUITOUS-LANGUAGE.md`](UBIQUITOUS-LANGUAGE.md) and the machine-readable
[`ORODI-UBIQUITOUS-LANGUAGE.v1-candidate.json`](ORODI-UBIQUITOUS-LANGUAGE.v1-candidate.json).
It binds the 17 definition concepts to 32 exact DomainSpec model expressions,
implementation names, Evidence States, naming grammar, reserved effect verbs,
and current implementation drift without authorizing code changes.

## Architecture consequence

The existing ORODI business ontology and Product Capability candidates can be
reviewed against these definitions, but they cannot be adopted as a current
DomainSpec-governed chain because they predate this pack and do not bind its
digest. If the definitions owner promotes an exact pack digest, the next step
is a successor epoch:

```text
promoted ORODI definitions
  -> successor immutable Product Capability records
  -> successor capability-local business ontology
  -> successor DomainSpec profile/source
  -> deterministic compiled graph and system ontology
  -> exact implementation binding
  -> conformance evidence
```

Do not rewrite the current immutable records in place.

The ten shared-track definitions are staged in the private CAV2 source cluster
`authority/definitions/source-clusters/orodi-operational-evidence.md`. The
candidate `CAV2-D48` exercise against the materially distinct Define Session
Runtime context is recorded in
[`ORODI-D48-DEFINE-SESSION-RUNTIME-001`](exercises/ORODI-D48-DEFINE-SESSION-RUNTIME-001.json).
It found four meanings that survived the challenge, three requiring revision,
and three lacking positive second-context evidence. The Define runtime and
definitions-governance owners accepted its exact historical snapshot as
semantic challenge input through `D48-ACCEPT-HISTORICAL-SNAPSHOT`. The snapshot
remains non-current and cannot support a runtime claim. This is not a promotion
decision. No canonical `CAV2-D` identifiers have been allocated.

The three challenged meanings now have successor candidates in
[`ORODI-D48-DEFINITION-REVISIONS-001`](revisions/ORODI-D48-DEFINITION-REVISIONS-001.json):
Evaluation Binding uses a profile-declared dependency denominator, Operational
Evidence Evaluation State is scoped to one operational-obligation facet, and
Failure Meaning Separation uses owner-defined semantic roles rather than fixed
universal type names.

Positive second-context evidence is recorded in the bounded
[`ORODI-D48-ARTIFACT-RELEASE-001`](exercises/ORODI-D48-ARTIFACT-RELEASE-001.observation.json)
observation. It exercised a real isolated artifact transition, accounted for
all six telemetry-event fates including loss and pending work, and independently
observed exact stable restoration. Its claim ceiling is semantic evidence only,
not ORODI runtime, conformance, commissioning, or production deployment.

All ten results are reviewed in
[`ORODI-D48-TEN-TERM-REVIEW-001`](reviews/ORODI-D48-TEN-TERM-REVIEW-001.json).
The review retains four predecessor candidates, selects three R1 successors,
and records positive evidence satisfied for three candidates. It makes zero
canonical promotions and stops at the definitions-governance owner decision
gate. The predecessor ubiquitous-language artifacts remain byte-preserved; an
accepted promotion would require a successor language epoch rather than an
in-place rewrite.

The Product Capability identity decision is separately resolved by
`PC-ADOPT-PRESERVE`. The D48 revision, positive-evidence, and ten-result review
inputs are complete candidates. Successor construction remains blocked on the
canonical-promotion owner decision and the successor artifacts that decision
would authorize.

## Validation

From the repository root:

```bash
python3 projects/domainspec-v2/development/operational-resilience-observability-deployment-integration/definitions/scripts/validate.py
python3 projects/domainspec-v2/development/operational-resilience-observability-deployment-integration/definitions/scripts/validate_language.py
python3 projects/domainspec-v2/development/operational-resilience-observability-deployment-integration/definitions/scripts/validate_d48_exercise.py
python3 projects/domainspec-v2/development/operational-resilience-observability-deployment-integration/definitions/scripts/validate_d48_completion.py
```

The validator checks exact source digests, the 17 definition records, all four
definition voices, relationship closure, canonical selectors, and complete
alignment coverage for the current 13 business-ontology nodes and six ORODI
capability records.

Validation proves package consistency only. It does not promote a definition,
adopt a capability, admit an ontology or profile, authorize implementation, or
authorize any runtime or external effect.
