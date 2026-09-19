---
module: stable-foundation-cli
version: candidate-1
status: define-authored
updatedAt: 2026-08-16
docType: domainspec-spec
authorityEffect: none
decisionRef: projects/domainspec-v2/development/first-production-release/decisions/2026-08-16-first-stable-foundation-candidate.md
decisionSha256: 2168de08e9e0ea72a29ce74fb9a3285094aebaa05d72df34d9749e5cbdac20c9
---

# Stable Foundation CLI

## What this candidate owns

This candidate defines a private, repository-local `domainspec-v2` command for
deterministic structural validation of one explicit DomainSpec project root. It
owns the command contract, bounded input resolution, structural receipt and
diagnostic formats, compiled-JavaScript packaging, and the evidence needed to
judge that narrow foundation.

It does not own canonical DomainSpec meaning, profile admission, implementation
conformance, ontology promotion, the remaining-meta-type implementations, the
complete `0.1.0` product, release authorization, or deployment.

## Objective

Produce the smallest long-lived CLI foundation that can consume an
owner-ratified `feature-with-independent-node-and-edge-files@1` profile,
validate the complete 13-node-kind and 16-backend-relation source denominator,
and emit deterministic closed JSON without acquiring authority over its inputs.

## Product boundary

| Field | Candidate contract |
| --- | --- |
| Command | `domainspec-v2` |
| Supported commands | `lint <project-root>` and `receipt <project-root>` |
| Input | one explicit existing project root; no name, feature-only, sibling, current-directory, or discovery fallback |
| Profile | exact owner-ratified `feature-with-independent-node-and-edge-files@1` only |
| Breadth | 13 active backend node kinds and 16 backend relationship signatures |
| Claim | exact-profile causal implementation-conformance input/receipt binding; the CLI receipt itself remains structural and `authority_effect: none` |
| Runtime | compiled JavaScript on externally installed Node.js `v24.19.0`, Linux x64 |
| Build | npm `11.17.0`, one `impl/package-lock.json` v3 authority, scripts denied except an exact network-disabled build allowlist |
| Package | `@domainspec-v2/cli`; `@domainspec-v2/impl` stays the source/development workspace |
| Distribution | private immutable tagged checkout; records under `releases/<release-id>/`; no registry or hosted channel |
| Writes | no supported command writes product or project files; stdout capture is caller-owned |

## Capabilities

| Capability | Outcome | Contract |
| --- | --- | --- |
| Invocation admission | rejects unsupported grammar, runtime, profile, path, or limits before evaluation | exact exit and diagnostic class |
| Project source resolution | resolves feature-local nodes/same-feature edges and project-level cross-feature edges without escape or fallback | deterministic source manifest |
| Structural lint | emits deterministic paginated diagnostic reports over the selected source set | closed diagnostic schema |
| Structural receipt | emits one compact source/profile/version-bound receipt | closed structural-receipt schema |
| Evidence invalidation | rejects stale acceptance when profile, meta-type, relationship, runtime, dependency, schema, rule, or source binding changes | content-addressed acceptance binding |

## Command contract

```text
domainspec-v2 lint <explicit-project-root> [--page-size <n>] [--page-token <token>]
domainspec-v2 receipt <explicit-project-root>
```

No other command or flag is part of this candidate contract. In particular,
`roundtrip`, `derive`, `check`, `emit-tests`, `self-check`, factory commands,
and `receipt --out` remain internal or deferred.

## Result and fault contract

- A declared command result is exactly one closed JSON document on stdout.
- Operational faults use stderr and never leave success-looking partial JSON.
- Exit `0` means accepted; `1` usage; `4` structural/formal rejection; `20`
  profile; `21` version/runtime; `22` path/input; `23` resource; `24` internal.
- Nonzero exits carry stable diagnostic codes in the appropriate closed result
  or fault document; exit numbers are not the diagnostic taxonomy.
- Diagnostics are pointer-only and never include source excerpts, absolute
  paths, environment values, stacks, secrets, or regulated data.

## Source and profile contract

The supported root follows the selected topology:

```text
project.json
specs/<feature-id>/feature.json
specs/<feature-id>/nodes/<node-id>.json
specs/<feature-id>/edges/<same-feature-edge-id>.json
edges/<cross-feature-edge-id>.json
```

The CLI consumes, but never defines, the canonical meta-type and relationship
registries and an owner-ratified supported-profile receipt. It rejects missing,
duplicate, wrong-root, path-escaping, stale-digest, unknown-kind,
unknown-signature, endpoint, direction, ownership, or scope violations.

## Causal conformance boundary

The P2/C2 denominator requires each admitted node or edge to bind a deterministic
implementation obligation. Removing or governingly changing the source or its
binding must remove, change, or reject the corresponding effect. The CLI may
validate and report exact upstream conformance receipts; it cannot self-issue
profile admission or implementation-conformance authority.

## Resource envelope

| Limit | Contract |
| --- | ---: |
| canonical node and edge records | 50,000 |
| total input | 512 MiB |
| one file | 4 MiB |
| normalized output | 64 MiB |
| target wall time | at most 2 minutes on the supported environment |
| target peak RSS | at most 4 GiB |

Over-bound input fails early with exit `23` and stable pointer-only diagnostics.
The thresholds are requirements until measured by the Plan campaign.

## Compatibility and history

- Each stable contract is supported for at least 12 months.
- A supported successor has six months of N-1 read overlap.
- Historical receipts remain permanently addressable under their original
  schema and version identity.
- Repair creates a new patch release; rollback, withdrawal, quarantine, and
  supersession remain immutable visible records.

## Security and data lifecycle

Supported inputs are internal-confidential. Secrets and regulated data are
unsupported. The executable makes no network calls and emits no telemetry.
Ordinary diagnostic bundles are retained for 90 days; release bytes and
acceptance receipts are content-addressed and permanent; caches are removed
when safe; accidental secrets are quarantined, revoked, and superseded.

## Acceptance

The candidate is acceptable only when all planned validators and fixtures run
from two clean arbitrary roots on Linux x64/Node `v24.19.0`, produce equal
compiled and normalized result bytes, reject every declared mutant, respect the
resource/security envelope, and pass an independent green/red operator pilot.

Acceptance of this spec or its future Work Pack proves planning quality only.
It does not authorize implementation, profile admission, production, release,
publication, or deployment.

## Non-goals and claim ceiling

- no UI, hosted service, public distribution, SDK, central telemetry, or SLO;
- no W3/W4 runtime, external database, event bus, API, webhook, or projection;
- no Python/Rust product support or cross-language parity;
- no automatic code generation, ontology admission, promotion, or release;
- no exactly-once, universal equivalence, business-correctness, or broad
  production claim;
- no replacement of the July `0.1.0` product-release contract.

## References

- [Requirements](REQUIREMENTS.md)
- [Glossary](GLOSSARY.md)
- [Accepted planning decision](../decisions/2026-08-16-first-stable-foundation-candidate.md)
- [July product contract](../decisions/2026-07-12-product-release-contract.md)
- [P2 profile decision](../decisions/2026-07-17-fpr02-supported-profile-decision.md)

