# BMC-REL-D07-P01-CONTENTS exact canonical-package acceptance candidate

Status: owner gate open; no option selected

Authority effect: none

Decision ID: `BMC-REL-D07-P01-CONTENTS-APPLY`

Selected contents source: exact owner response `A` at `2026-08-23T16:58:14+01:00`, binding
`BMC-REL-D07-P01-CONTENTS-A-MINIMAL-TWO-KIND` and selection receipt SHA-256
`fa17a79ddedbd822b912a3c59eb90b79c9664b43d615009018042c7a41bc2b31`.

Package manifest: `staged/BMC-REL-D07-P01-CONTENTS-CANONICAL-PACKAGE-MANIFEST.json`, SHA-256
`e7b1753cb0abb0bd05d9709e309d52c2967c4ff4c5471f7a8e389bf8989f8269`.

## Consequential question and boundary

Should Definitions Governance accept the exact digest-bound package that would add `domainspec-v2-D30`, its
index row, and `definitions/membership-kinds/membership-kinds.json` with the exact active IDs `classification`
and `home-assignment`, or should the package be deferred or stopped?

Acceptance covers only the three exact postimages and paths in the manifest. It does not itself apply them. Any
application is a separate atomic step and must first confirm both canonical preimage hashes and absence of the
registry create target. It does not admit `membership` or `collection-membership`, create aliases, require any
membership fact, conflate `belongs-to` with `owns`, create P02, change packet/schema/validator/relationship
authority, implement enforcement, publish, release, deploy, or establish production state.

## Exact staged target inventory

| Canonical target | Operation | Preimage SHA-256 | Exact staged postimage SHA-256 |
| --- | --- | --- | --- |
| `projects/domainspec-v2/definitions/DEFINITIONS.md` | update | `cdbe251015bb6387fe0283b4d058b4fa85b048b253c7e65845e43fd2170b6006` | `f075568feed8d9918762efe99bb228602da32b760ae7b023aad770187c70fb4a` |
| `projects/domainspec-v2/definitions/DEFINITIONS-INDEX.md` | update | `ad41200bacb825bf11c009bfaef37f350beb3a307a55994ced42e194bc3fa744` | `d0c8032b45fb371d26b8b80eac9f9e576bec10a6ed2a63d275558212bc1a6bfb` |
| `projects/domainspec-v2/definitions/membership-kinds/membership-kinds.json` | create | absent | `854ff80f309e38f48f3f278d13d661983652b6809bf3f2bf0e06688b9bf37d5c` |

The staged D30 card includes the exact selected formal, plain-language, and DomainSpec-context voices for both
active IDs, pairwise non-overlap and zero/multiple-match fail-closed rules, D07 uniqueness within each kind, no
existence condition, independent ownership vocabulary, lifecycle governance, challenge/confirm contracts, and
the authority ceiling. The registry's serialized ID order is stable serialization only, not semantic precedence.

## Caller-supplied structural assessment

<a id="bmc-rel-d07-p01-contents-apply-a-apply-exact-canonical-package"></a>
### `BMC-REL-D07-P01-CONTENTS-APPLY-A-APPLY-EXACT-CANONICAL-PACKAGE`

- Option kind: `action`
- Structural status: `admissible`
- Reversibility: `reversible`
- Hazard class: `authority`
- Owner gate: `definitions-governance:owner-acceptance`
- Evidence: exact contents selection receipt; exact three-target manifest; staged D30 card/index/registry postimages; package validator.
- Rejection reasons: none at structural prefilter.
- Benefit: synchronizes human, index, and machine vocabulary authority around the smallest selected two-kind registry.
- Risk: applying stale or partial bytes would create governance drift; the action therefore binds exact preimages, paths, postimages, and atomic application.
- Downstream effect: after a separately authorized and verified exact application, P02 may be prepared through a fresh Decision Gate; no P02 choice follows automatically.

<a id="bmc-rel-d07-p01-contents-apply-b-defer-exact-package"></a>
### `BMC-REL-D07-P01-CONTENTS-APPLY-B-DEFER-EXACT-PACKAGE`

- Option kind: `defer`
- Structural status: `admissible`
- Reversibility: `reversible`
- Hazard class: `reversible`
- Owner gate: none
- Evidence: Definitions Governance separates candidate bytes from canonical authority and preserves an explicit owner gate.
- Rejection reasons: none at structural prefilter.
- Trade-off: retains an exact reviewable package but leaves canonical definitions unchanged and P02 blocked; any canonical drift requires regeneration and renewed acceptance.

<a id="bmc-rel-d07-p01-contents-apply-c-stop-projection"></a>
### `BMC-REL-D07-P01-CONTENTS-APPLY-C-STOP-PROJECTION`

- Option kind: `stop`
- Structural status: `admissible`
- Reversibility: `reversible`
- Hazard class: `reversible`
- Owner gate: none
- Evidence: Decision Gate preserves stop as an explicit route outcome.
- Rejection reasons: none at structural prefilter.
- Trade-off: terminates this projection route without canonical D30/index/registry changes and without P02.

## Rejected constructions

- `BMC-REL-D07-P01-CONTENTS-APPLY-D-PARTIAL-PACKAGE`: inadmissible because card, index, and registry would drift.
- `BMC-REL-D07-P01-CONTENTS-APPLY-E-STALE-PREIMAGE`: inadmissible because acceptance cannot stretch across changed canonical source bytes.
- `BMC-REL-D07-P01-CONTENTS-APPLY-F-MODIFIED-OR-SUBSTITUTED-BYTES`: inadmissible because changed paths or hashes are a new candidate requiring a fresh owner gate.
- `BMC-REL-D07-P01-CONTENTS-APPLY-G-APPLY-AND-P02`: inadmissible because P02 is a separate consequential representation decision.

## Validation implications and hostile cases

- Require exact canonical preimage hashes before any application; reject one-byte drift.
- Require exact staged postimage hashes and manifest paths; reject substitutions and missing targets.
- Require exactly one D30 card and one D30 index row, with the index registry link resolving to the create target.
- Require registry closure: exact registry/definition IDs and exact active set `classification`, `home-assignment`; reject unknown, duplicate, alias, `membership`, `collection-membership`, `other`, and ownership-dimension IDs.
- Require formal, plain-language, and DomainSpec-context voices for the registry and both entries.
- Require zero/multiple-match rejection, no existence condition, and independence from `owns`.
- Require P02 to remain absent before separately accepted canonical application.
- Require application to be atomic; a successful cleanup must not mask an earlier failed validation.

## Recommendation without selection

Recommend `BMC-REL-D07-P01-CONTENTS-APPLY-A-APPLY-EXACT-CANONICAL-PACKAGE` only if the owner accepts every
listed path and digest as one atomic authority package. The package is the minimum complete projection of the
already selected two-kind semantics. Defer is safer if any voice or digest needs revision; stop ends projection.
This recommendation has `decision_effect: none`.

## Explain-path complexity ladder

Shared invariant: every rung compares the same exact package and preserves exact-hash, atomic-apply,
fail-closed vocabulary, no-existence, ownership-independence, and separate-P02 boundaries. All scenarios are
hypothetical and have `decision_effect: none`.

### Low — unchanged canonical preimages

The canonical definitions and index hashes match and the registry path is absent. A accepts the exact three-file
package for a later atomic apply; B retains it as a non-authoritative candidate; C terminates without change.
This demonstrates the ordinary acceptance boundary, not application.

### Medium — one-byte concurrent definitions drift

Added complexity: `DEFINITIONS.md` changes after this gate is prepared. A must fail closed despite the other two
targets remaining compatible, and a fresh package plus owner acceptance is required. B leaves both canonical and
staged bytes unchanged; C terminates. This demonstrates why acceptance is preimage-bound.

### Complex — partial write or novel kind pressure

Added complexity: an apply attempt could write the index but not the registry while a caller asks for
`collection-membership`. A permits neither partial state nor the inactive kind; the whole operation fails and
rolls back or remains unapplied, and a new kind requires fresh Definitions Governance. B keeps P02 blocked with
no canonical authority; C ends the projection. This demonstrates atomicity and fail-closed evolution, not an
application algorithm or evidence that the novel kind should be admitted.

## Claim ceiling

This candidate proves only that one exact three-target package, defer, and stop are structurally presentable and
that partial, stale, substituted, or bundled-P02 constructions are inadmissible. No option is selected; no
canonical byte is changed; no apply, P02, implementation, publication, release, deployment, or production action
is authorized.
