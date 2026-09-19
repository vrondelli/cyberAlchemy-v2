---
decision_id: DEC-DSV2-FIRST-STABLE-FOUNDATION-CANDIDATE-20260816
status: accepted-owner-selection
gate_result: PASS
decision_date: 2026-08-16
decision_timezone: Europe/London
decision_authority: active DomainSpec owner/operator session
release_authority: DomainSpec-v2 Owners unchanged
authority_effect: planning-input-only
production_authorized: false
release_authorized: false
implementation_authorized: false
profile_mutation_authorized: false
selection_count: 21
direct_owner_selections: 19
derived_constraints: 2
---

# DomainSpec v2 first stable foundation candidate

## Decision

The first hardening target is a private, pre-production DomainSpec v2 CLI
foundation. It is planned against the broad successor backend profile and an
exact-profile causal implementation-conformance claim, while the remaining
meta-type Work Pack continues as a separate planning lane.

This is an accepted owner selection for planning. It is not an acceptance of
implementation bytes, a profile admission, a selected Smallest Working Unit, a
production-stability verdict, or a release authorization.

## Relationship to existing authority

This record is subordinate to the accepted
[`2026-07-12-product-release-contract.md`](./2026-07-12-product-release-contract.md).
It does not replace that contract, change its first production target of
`0.1.0`, narrow its complete product capability set, or authorize its release.
The selected CLI is a pre-production foundation that may later contribute to
that product only after the existing release gates pass.

The profile breadth, independent node/edge source family, project-level
cross-feature topology, and causal node/edge proof standard reuse the accepted
[`2026-07-17-fpr02-supported-profile-decision.md`](./2026-07-17-fpr02-supported-profile-decision.md).
This record does not recreate or promote that profile. Any change to those
accepted profile semantics must reopen their owning decision.

The 2026-08-14 production-stability review is review evidence only. It supplied
the candidate fault, build, compatibility, security, resource, rollback, and
retention questions. Its candidate shortlist was not an implementation or
release verdict. The choices below resolve planning branches; every resulting
contract and implementation still requires discriminating evidence.

## Resolved selections

| ID | Selected option | Binding planning decision | Provenance and rationale |
| --- | --- | --- | --- |
| SF-01 | `A` | Harden the CLI foundation first while continuing the remaining-meta-type planning lane. Runtime-plane, factory, hosted, UI, public, and deployment surfaces are not pulled into this first hardening target. | Direct owner selection. It establishes sequence, not completion or permanent exclusion. |
| SF-02 | `P2` | Bind the target to `feature-with-independent-node-and-edge-files@1`: all 13 active backend meta-types and all 16 backend relationship signatures, with feature-local same-feature edges and project-level cross-feature edges. | Direct owner selection, reusing the accepted FPR-02B profile decision. This is the requested breadth, not proof that a live promoted profile row or conforming corpus exists. |
| SF-03 | `C2` | The intended conformance claim is exact-profile causal implementation conformance: admitted sources must produce deterministic implementation obligations, and removal or governed mutation must remove, change, or reject the corresponding effect. | Direct owner selection. Structural parse, schema presence, compilation, or traversal alone cannot satisfy this claim. |
| SF-04 | `S1` | For W3/W4 composition, state plus the durable outbox occurrence commit atomically. Publication happens later, is idempotent and at-least-once, and uses the same stable occurrence identity. Failure or ambiguous acknowledgement after durable commit never rolls back the durable state/fact; compensation is forward recovery, not historical erasure. | Direct owner selection after the review exposed contradictory W3/W4 rollback behavior. This is not a distributed exactly-once claim. |
| SF-05 | `A1` | Ship compiled JavaScript that requires one externally installed, exactly pinned Node runtime. Do not call the artifact a self-contained executable. | Direct owner selection. The release manifest must bind the compiled bytes and external runtime separately. |
| SF-06 | `E1` | Initial supported environment: Linux x64 with Node.js `v24.19.0`. | Direct owner selection. Exact image/distribution and system-library preconditions remain release-manifest work. |
| SF-07 | `M1` | Use npm `11.17.0` and one authoritative root `package-lock.json` at lockfile version 3. Nested or competing pnpm lock/workspace authority is not part of the supported build path. | Direct owner selection. Current bytes still declare pnpm and retain nested pnpm artifacts, so this is a target contract requiring migration and proof, not a description of current state. |
| SF-08 | `K2` | Support each stable contract for at least 12 months. Preserve a six-month N-1 read overlap during a supported successor transition, and preserve historical receipts permanently under their original schema/version identity. | Direct owner selection. This does not promise that old inputs remain writable or accepted by current mode. |
| SF-09 | `D1` | Own two separate closed schemas: a structural-receipt schema and a diagnostic-report schema. Neither schema is an extension bag for the other. | Direct owner selection. Exact schema IDs, versions, fields, decoders, and migration fixtures remain implementation-plan outputs. |
| SF-10 | `O1` | Declared command results go to stdout; operational faults go to stderr. Success-looking partial JSON is forbidden. | Direct owner selection. Stream separation must be tested under usage, structural, profile, resource, and internal failures. |
| SF-11 | `EC1` | Stable process exits are: `0` accepted; `1` usage; `4` structural/formal rejection; `20` profile; `21` version/runtime; `22` path/input; `23` resource; `24` internal. | Direct owner selection. Every nonzero class still needs stable diagnostic codes; exit numbers alone are not a diagnostic contract. |
| SF-12 | `B1` | The command name is `domainspec-v2`. | Direct owner selection. The supported subcommand/argument grammar must remain bounded by the eventual CLI Work Pack. |
| SF-13 | `RC1` | Distribution remains a private repository-local CLI from an immutable tagged checkout. Release records live under `releases/<release-id>/`; there is no public registry, public package, hosted channel, or implicit deployment. | Derived constraint, not a fresh owner preference: it follows the July G0 private-delivery contract plus SF-01/SF-05. Reopen if the owner wants another channel. |
| SF-14 | `PK1` | The product package identity is `@domainspec-v2/cli`. The current private `@domainspec-v2/impl` workspace remains a source/development workspace and is not silently renamed into the product package. | Direct owner selection. Package extraction and dependency ownership require an explicit plan and clean-build proof. |
| SF-15 | `SEC1` | Supported input classification is internal-confidential. Diagnostics are pointer-only: no source excerpts, absolute paths, environment values, stacks, network calls, or telemetry. Secrets and regulated data are unsupported inputs. | Direct owner selection. Accidental-secret detection, redaction mutants, permissions, and dependency evidence must be acceptance tests. |
| SF-16 | `IR1` | Every supported invocation takes an explicit project root. Feature names, feature-only roots, sibling fallback, current-directory inference, and auto-detection are unsupported. | Derived constraint, not a fresh owner preference: P2 includes project-level cross-feature edges, so a feature-only root cannot close its source denominator. Reopen if the profile topology changes. |
| SF-17 | `L2` | Admission limits are 50,000 canonical node/edge records, 512 MiB total input, 4 MiB per file, and 64 MiB normalized output. The target envelope is at most two minutes wall time and 4 GiB peak RSS on the selected environment. | Direct owner selection. These are requirements to benchmark at and above boundaries; they are not current performance evidence. |
| SF-18 | `BS2` | Dependency lifecycle scripts are denied by default. A network-disabled build may use only an exact reviewed build-time allowlist. The compiled product has no runtime dependency-install or lifecycle-script step. | Direct owner selection. The current npm lock contains install-script packages, including two `esbuild` versions and optional `fsevents`; the eventual allowlist must bind actual locked bytes and purpose. |
| SF-19 | `OUT2` | Emit a compact structural receipt and deterministic, source/profile/version-bound paginated `lint` diagnostics. A declared result is exactly one closed JSON document per invocation. | Direct owner selection. Page identity, ordering, continuation token, normalization, maximum page size, and cross-page digest rules remain contract work. |
| SF-20 | `RB1` | Rollback is an immutable, conditional release action after compatibility proof and owner approval. Repair creates a new patch release; withdrawal and supersession records remain visible. | Direct owner selection. No in-place repair, silent downgrade, or automatic production rollback is authorized. |
| SF-21 | `RET1` | Keep acceptance-bound release bytes and receipts permanently in a content-addressed archive. Keep ordinary diagnostic bundles for 90 days. Preserve incident evidence permanently only after redaction and approval. Delete caches immediately when safe. Accidental secrets trigger quarantine, revocation, and supersession rather than normal retention. | Direct owner selection. Retention never overrides security quarantine or referential-integrity rules. |

## Cross-selection invariants

1. **Claim cannot exceed profile-bound causal proof.** P2 breadth and C2 proof
   must be bound by exact source, profile, schema, rule, generated obligation,
   test, executed evidence, and receipt identities.
2. **The runtime contract has one durable-fact boundary.** Under S1, no W4
   failure path may erase W3 state or an outbox occurrence after the atomic
   commit. Retries reuse the same occurrence identity.
3. **The supported CLI starts at a project root.** P2 cross-feature edges make
   feature-only and fallback resolution incomplete by construction.
4. **Build and runtime are separate.** npm and its build-only allowlist produce
   compiled JavaScript; the supported invocation uses the compiled artifact
   with the pinned external Node runtime and performs no install.
5. **Result and fault channels do not collapse.** Declared JSON results are
   closed and deterministic on stdout. Operational diagnostics remain
   pointer-only on stderr and cannot leak protected material.
6. **Compatibility does not rewrite history.** N-1 reading, rollback,
   withdrawal, patch repair, and permanent release archives preserve original
   receipt identities and explicit supersession.

## Planning consequences

Two plan-authoring lanes are required before any new execution selection:

1. Refresh `WP-RMT-002` so Operation, Event, State Machine, and Workflow
   admission and proof denominators bind S1, its typed W3/W4 joins, and the
   complete fault matrix. The current `selection-ready` projection is not safe
   to select while `RMT-OP-001` still binds the older denominator.
2. Author a new candidate CLI Work Pack for SF-01 through SF-21, including
   implementation layering, exact Smallest Working Units, closed schema and
   decoder tasks, package/build migration, security/resource campaigns,
   compatibility/rollback/retention contracts, clean-root reproducibility,
   and a machine-valid execution-entry projection.

The two plans may be authored independently. Before either can route to
mutation-capable execution, an integration check must prove they share one P2
profile identity and causal-proof denominator without making the CLI package,
RMT candidates, generated views, or historical receipts a competing authority.

## Deliberately unresolved implementation details

- Exact structural-receipt and diagnostic-report schema bytes and version IDs.
- Exact `lint` pagination grammar and normalized byte format.
- The release image/distribution and system-library baseline within Linux x64.
- The final dependency graph and exact build-only lifecycle-script allowlist.
- Package extraction paths, compiler configuration, and deterministic staging
  layout for `@domainspec-v2/cli`.
- Concrete support contacts, release-role assignments, and independent
  verifier identity for an eventual candidate.
- Benchmark corpus bytes and measured compliance with SF-17.
- Actual release bytes, release ID, tag, manifest, archive receipt, and
  rollback/withdrawal drill evidence.

These are plan and evidence obligations. Their absence does not reopen the 21
selected branches, but it blocks claims or execution that depend on them.

## N1 authorization boundary

The owner selected `N1` after the 21 branches were resolved. `N1` authorizes
only:

- this durable decision record; and
- a proposal-only two-lane Invoke Refresh package describing the exact next
  planning route.

`N1` does not authorize product implementation, profile/schema/authority
mutation, an RMT SWU selection, subagent spawning, dispatch registration,
Craft or Inventory promotion, Git operations, release staging, publication,
deployment, or production authorization.

## Reopen conditions

Reopen this decision when a proposal changes any selected option, treats the
foundation as the accepted `0.1.0` production product, changes the P2
node/edge/project-root topology, changes the S1 durable-fact boundary, expands
the supported distribution or data class, changes the compatibility/support
promise, or requires destructive/external effects.

Changed acceptance-bound bytes do not automatically reopen an unchanged
decision, but they always require fresh inventory, validation, independent
review, and owner acceptance for the new bytes. Evidence from a prototype,
review, plan, or historical receipt cannot be stretched over a changed
candidate.

## Gate state after this decision

- Decision Gate: `PASS` for the 21 planning branches.
- Current implementation: unchanged and not accepted by this record.
- `WP-RMT-002`: still unselected; refresh required before `RMT-OP-001` admission.
- CLI Work Pack: not yet authored.
- Craft FPR gate: remains blocked.
- Production, release, publication, deployment, and promotion: unauthorized.
