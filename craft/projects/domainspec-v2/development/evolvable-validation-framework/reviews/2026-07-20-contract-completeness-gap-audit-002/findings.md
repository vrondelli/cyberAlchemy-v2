# DomainSpec v2 contract-completeness audit 002 — candidate findings

Status: accepted review package; non-authority; successor completeness remains blocked
Dispatch: `2026-07-20-evf-contract-completeness-audit-002`
Authority: non-authority review read model
Canonical target: `projects/domainspec-v2/`

## Candidate verdict

**BLOCK completeness and narrow the old current-v1 `KEEP` verdict.**

The implementation has materially improved: the minted compiler now reaches
the shared criterion kernel. That closes the narrow duplicate-evaluator
`GAP-009`. It does not establish contract completeness. The frozen compiler
can accept an Entity that violates the profile-declared JSON formation schema,
and the successor still lacks exact compiler-path proof for all 16 selected
formation criteria. The current profile's 4-kind/3-relation declaration,
cross-feature rejection, deterministic views, and honest non-admission remain
proven narrow facts; only the formation/schema-validation chain is blocked.

This review is evidence, not semantic authority. It does not promote a
successor profile, change the language, or admit consumer evidence.

## Freeze disposition

All 53 frozen catalog entries matched at attacker entry and exit; there was no
target drift. Verifiers found ten stale, descriptive, or non-addressable
selectors despite correct hashes:

- `META_BODY_ADAPTER`: `normalizeMintedNodeBody` does not exist.
- `COMPILER`: `loadAttributeCriteria` was removed.
- `OLD`, `T_COMPILER`, `T_CONTRACT`, `T_RESOLVER`, `T_VIEWS`,
  `META_CRITERIA_TEST`, `META_BODY_ADAPTER_TEST`, and `GCP_DEC` use descriptive
  shorthand that does not identify a literal machine-addressable target.

This was `GAP-028`, a **CRITICAL audit-traceability failure**. It is now
**REPAIRED/FIXED**: `corpus-freeze.corrected.json` resolves all ten typed
selectors, supplies corrected effective verification instructions, and adds
the two direct schema entries required for `GAP-029`. Its 55-entry effective
catalog exactly equals the matrix catalog. The original 53 hashes were not
rewritten. Old selector text survives only as defect history.

## Changed disposition: old GAP-009 is fixed

Close only this former allegation:

> The minted compiler owns a second, limited formation evaluator instead of
> using the shared criterion kernel.

The frozen path is now:

`compiler.validateFormation` -> `validateMintedNodeFormation` ->
`evaluateCriteria`.

Disposition: **FIXED-IN-FROZEN-WORKTREE**. Do not retain the old finding
verbatim and do not infer durable promotion merely from frozen working-tree
evidence.

## New GAP-029 — current-v1 split formation authority

Severity: **CRITICAL**
Scope: current profile compatibility and semantic authority

The current profile declares per-kind JSON `formation_schemas`. Direct frozen
evidence now includes `NODE_SCHEMA` and `ENTITY_BODY_SCHEMA`. The compiler's
profile type contains that field but compilation does not read it. Instead it
validates through meta-type YAML criteria and filters every base node-schema
violation whose path begins with `$.body`.

Concrete false green:

```json
{"fields":[{"type":7,"identity":"yes"}]}
```

For Entity, the declared JSON formation rejects this body: `name` is absent,
`type` is not a string, and `identity` is not boolean. The YAML adapter path
accepts it because typedness is nonempty and identity is truthy. The raw body
can then reach the graph; graph validation requires only a nonempty body object
and build replay does not re-evaluate formation.

There is no machine decision authorizing YAML criteria to supersede
`formation_schemas`. Required repair: either execute both contracts, or admit a
versioned owner-approved replacement that explicitly retires the JSON route.

## New GAP-030 — exact-16 compiler parity

Candidate severity: **CRITICAL for successor completeness**
Attacker disagreement: Lawvere `MAJOR`; Ashby and Smithe `CRITICAL`

The canonical machine-schema inventory proves 13 backend kinds and 16
criterion IDs exist. The
adapter suite proves one representative positive and negative for each of the
eight rule forms. Compiler integration remains bounded to the four kinds in
the current profile and does not prove positive plus discriminating-negative
behavior for every one of the exact 16 criterion IDs.

Rule-form coverage is not criterion-identity coverage. Successor formation
completeness remains blocked until a machine-owned 16-item catalogue is joined
to compiler-path executions and receipts.

## Retained findings

The attacker returns leave these earlier gaps substantively unchanged:

- `GAP-002` — **CRITICAL**: the successor 13-kind profile is planning intent,
  not admitted machine authority. Current v1 is excluded from that claim.
- `GAP-004` — **MAJOR**: relationship coverage still needs owner admission; 16
  families are the selected candidate/planning denominator, not admitted
  profile authority, while 21 endpoint pairs and 29 endpoint-plus-scope
  variants remain derived, unselected diagnostics.
- `GAP-005` — **CRITICAL**: formation schema/criterion/kernel/adapter identity
  and digest do not propagate through compiler, graph, receipt, and replay.
- `GAP-006` — **CRITICAL**: literal `required_structure` is loaded but not
  evaluated across the 13 backend schemas. Evidence binds all 13 `SCHEMA_*`
  entries plus `META_CRITERIA` and `INST`.
- `GAP-007` — **MAJOR**: Interface `interface_kind` and Mapping `direction`
  receive presence/nonempty checks rather than closed-domain admission.
- `GAP-008` — **MAJOR**: Value Object equality remains substring-based rather
  than a structural declaration.
- `GAP-011` — **BLOCKER, narrowly scoped**: `DEC-GCP-001` remains pending for
  the Rule predicate source used by `SWU-GCP-001`; it does not block unrelated
  formation checks.
- `GAP-012` — **CRITICAL**: successor independent-edge source/layout readiness
  remains incomplete.
- `GAP-013` — **CRITICAL, narrowed**: selected endpoint/root/scope/direction,
  lifecycle, and selected composition/removal semantics lack causal proof;
  multiplicity and inverse proof remain conditional on owner selection.
- `GAP-014` — **MAJOR**: ordered `orchestrates` ordinal preservation remains
  unproved.
- `GAP-016` — **CRITICAL**: minted graph/source-manifest input does not enter
  canonical `deriveFeature`; derivation still consumes feature documents.
- `GAP-017` — **CRITICAL, narrowed**: no independent exact 16-item
  `O_formation` catalogue exists.
- `GAP-018` — **CRITICAL**: bindings are not unique, role-typed, and
  digest-bound; first-match selection admits an empty match.
- `GAP-019` — **CRITICAL**: the successor completeness route accepts generated
  `todo`/`skip` evidence rather than requiring executed tests.
- `GAP-020` — **CRITICAL**: no successor exact-denominator/nonempty gate exists;
  an empty derived suite can coexist with build `pass`.
- `GAP-021` — **CRITICAL, narrowed**: independent evaluators are absent for the
  selected 16 criteria and selected relationship causal effects; Rule S1 joins
  only after `DEC-GCP-001`.
- `GAP-022` — **CRITICAL**: receipt replay does not independently join source,
  obligation, binding, evaluator, test, execution result, and governing
  identities.
- `GAP-023` — **CRITICAL**: no fail-closed `verify:bte:core`,
  `verify:bte:consumers`, and terminal aggregate exists.
- `GAP-024` — **MAJOR, narrowed**: exact formation mutants and family-level
  relationship negatives are unselected/unexecuted; 21/29 expand only if those
  denominators are promoted.
- `GAP-025` — **CRITICAL**: IOLM requires
  `graph_hierarchy_table_get_parity`, but its receipt schema has no matching
  required check. Digest-shaped handles and literal pass values remain
  self-asserted because no consumer-owned runner/replay exists.
- `GAP-026` — **MAJOR**: the candidate integrated manifest claims 13/16 while
  its terminal receipts remain pending.
- `GAP-027` — **MAJOR**: Body War has no machine
  contract/schema/runner/receipt lane, and its fixture explicitly sets
  `source_contract` to the forbidden Markdown `SPEC.md` path.

Earlier `GAP-003`, `GAP-010`, and `GAP-015` remain dropped. `GAP-001` is
superseded by the exact `GAP-028` selector-traceability history. `GAP-028` is
repaired/fixed, and old `GAP-009` is fixed as stated above.

## Executed causal trace

The attackers reported executing the same machine-source scenario across the
compiler and derivation surfaces:

| Boundary | Observed result |
|---|---|
| compile minted project | 4 nodes, 3 edges |
| derive obligations | 0 |
| emit suite | empty |
| build verification | `pass` |

No durable command, output, fixture digest, or transcript for this trace is in
the corrected freeze. It is therefore **attacker-reported/unverified**, excluded
from direct proof, and cannot independently support acceptance or rejection.
It remains a concrete reproduction target for the coverage auditor.

## Required proof before completeness can pass

1. Resolve `GAP-029` with one explicit, versioned formation authority path and
   a negative compiler witness for JSON-invalid/YAML-valid bodies.
2. Resolve `GAP-030` with all 16 exact criterion IDs through compiler positive
   and discriminating-negative executions.
3. Enforce `required_structure`, closed discriminator domains, and formation
   identity/digest propagation.
4. Make the canonical graph feed obligation derivation and reconcile exact
   `O_spec`, `O_gen`, `T_gen`, and `E_run` sets.
5. Require unique digest-bound bindings, independent evaluators, executable
   tests, selected mutations, and replayable receipts.
6. Add fail-closed core and consumer aggregates. Only then run IOLM and Body
   War as downstream consumer proof.

## Final coverage-audit disposition

The final auditor returned **ACCEPT** for this review package after the two
independent verifiers converged. The acceptance covers the repaired review
artifacts only: the 53-record freeze remains drift-free, the corrected overlay
has 55 effective evidence entries, the matrix is 53 rows by 12 columns, and
the authority and consumer boundaries are preserved.

Durable terminal record: `Loregian, Fosco — ACCEPT (review package only)`.

This does not promote a successor profile, implementation, release, or
consumer contract. `GAP-029`, `GAP-030`, `DEC-GCP-001`, and the graph-to-
obligation-to-receipt chain remain open. The required proof list above is
therefore still the implementation handoff, not a completeness verdict.
