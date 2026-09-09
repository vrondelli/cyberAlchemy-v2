# MIG-B Epoch Drift Receipt Design

Status: planning candidate  
Work item: `ARC-SWU-07` under `CGC-G20` and `CGC-G33`  
Selected route: `CA2-ROUTE-PLAN`  
Authority effect: none

## Product purpose

The Product Thesis requires intent to stay connected to reality through exact,
challengeable evidence. MIG-B currently breaks that connection in a specific
way: its historical receipts claim exact output, while a complete current
comparison finds 63 manifest-to-output mismatches in materialization, rebound,
and every V1–V9 candidate. V8 also contains 92 unmanifested build outputs.

The repair is not to make the old claim look true. It is to preserve what was
claimed, record what is now observed, and route the difference to the owners who
can identify or reject the producing transition. This is private migration-
evidence reconciliation. Public Arcanum supplies neither the Product meaning
nor authority for it.

## Bound contradiction

The immutable predecessor evidence includes:

- `MATERIALIZATION-RECEIPT.json`: `status: pass` and `target_exact: true`;
- `REBIND-RECEIPT.json`: `status: pass` and
  `exact_materialization_preserved: true`;
- V1–V9 candidate receipts: `candidate_exact: true`, with every candidate
  explicitly unadmitted and authority unchanged.

Those statements remain evidence of their producers' historical claims. They
are not overwritten. The R07 complete comparison is a later observation and
reports `historical_exact: BLOCK` for all 11 output epochs. It does not prove
when or why the output changed.

## Append-only evidence shape

One drift receipt is emitted per immutable subject manifest. A receipt must
bind all of the following:

1. **Receipt identity** — unique receipt ID, schema version, observation
   revision, observation time, and tool identity.
2. **Subject identity** — epoch ID, manifest path, file SHA-256, internal
   manifest digest, predecessor receipt path and SHA-256, declared member
   count, and declared group roots.
3. **Observed denominator** — the exact roots inspected, traversal rules,
   current member count, stable sorted-member digest, and zero-silent-omission
   assertion.
4. **Per-member delta** — path, group, expected kind/bytes/SHA-256, observed
   kind/bytes/SHA-256 or explicit absence, and one of `changed`, `missing`,
   `extra`, or `type-changed`.
5. **Aggregate closure** — expected, equal, changed, missing, type-changed,
   extra, and total observed counts, plus a digest over the sorted delta set.
6. **Provenance state** — producing transition reference and digest when known;
   otherwise the literal state `unknown`. A Git-clean or committed-blob match
   is supporting observation, not transition attribution.
7. **Evaluation** — `historical_exact` is `PASS` only for a complete zero-delta
   denominator. `canonical_current_eligible` is always false for these
   reconciliation receipts. Dependent admission and authority checks are
   `NOT_EVALUABLE` while predecessor or owner gates remain open.
8. **Owner disposition** — one explicit disposition per delta family, owner
   identity, immutable decision digest, and review status. Null evidence cannot
   be converted into an owner attribution.
9. **Claim ceiling** — the receipt observes and classifies residue only; it
   cannot validate an old receipt retroactively, select a current candidate,
   admit a baseline, switch authority, publish, release, or deploy.

The receipt must include the actual delta records or bind an immutable sidecar
containing the complete sorted records. Counts without the bound denominator
are insufficient.

## State machine

```text
observed-unreviewed
  -> owner-classified
  -> successor-epoch-proposed (optional)
  -> independently-verified
  -> owner-accepted (separate decision)
```

- `observed-unreviewed` proves only complete observation.
- `owner-classified` requires an exact owner decision over the receipt digest.
- `successor-epoch-proposed` creates new evidence; it never edits the subject.
- `independently-verified` proves receipt closure and successor integrity, not
  Product acceptance.
- `owner-accepted` remains a separate authority-bearing decision and still does
  not make the artifact `canonical-current`.

Every transition is append-only and binds the previous receipt digest. A
changed subject tree requires a new observation receipt; replaying an old
receipt against new bytes fails closed.

## Dispositions

The allowed residue dispositions are:

- `retain-as-observed-drift`;
- `attribute-known-transition`;
- `classify-transition-unknown`;
- `create-successor-epoch`;
- `quarantine-unmanifested-output`.

No disposition authorizes deletion or silently repairs historical evidence.
V8's 92 `impl/cli/dist/**` members require an explicit owner disposition; they
cannot be ignored because they look generated.

## Required checks

The eventual receipt producer and validator must collect all checks:

- subject manifest file digest matches;
- internal manifest digest reproduces;
- predecessor receipt digest matches;
- every declared target is evaluated exactly once;
- every exact-root member is accounted for or explicitly outside a declared
  nested-epoch boundary;
- group totals reconcile to the full denominator;
- delta records reconcile to aggregate counts;
- sorted denominator and delta-set digests reproduce in two runs;
- owner attribution has a decision reference and digest;
- a successor epoch, when present, has a new ID and does not overwrite any
  predecessor path;
- no receipt claims selection, admission, authority switching, publication,
  release, deployment, or Goal achievement.

Dependent checks are emitted as `NOT_EVALUABLE` with their causal blocker. They
are never omitted or reported as passing.

## Negative fixtures

The design requires fixtures that reject:

1. refreshing an old manifest or receipt in place;
2. omitting one changed, missing, type-changed, or extra member;
3. treating the highest candidate number or a `current-candidate` name as
   current authority;
4. silently ignoring V8's extra build outputs;
5. replaying a receipt after any subject-tree byte changes;
6. binding the wrong subject manifest file SHA-256 or internal digest;
7. claiming an owner or producing transition with null evidence;
8. treating a Git-clean or committed-blob match as historical exactness or
   producing-transition proof;
9. admitting a baseline or switching authority from receipt validation;
10. collapsing a dependent `NOT_EVALUABLE` check into PASS;
11. overwriting a predecessor through a purported successor epoch;
12. producing unequal denominator or delta digests on the second run.

## Reconciliation route

1. The migration-evidence owner authorizes a fresh immutable observation epoch
   for all 11 subjects.
2. A bounded producer emits one complete receipt per subject without changing
   the subject manifests, receipts, or trees.
3. Affected implementation, architecture, authority, and research owners
   classify the repeated 63-member residue. The V8 implementation owner also
   dispositions the 92 extra outputs.
4. Where the producing transition is unknown, the receipt says `unknown`; no
   causal story is inferred.
5. If repair is required, the owner proposes a new successor epoch with a new
   immutable ID and complete denominator.
6. An independent validator recomputes the receipt and successor closure twice.
7. Acceptance, Craft Definition Snapshot selection, and `canonical-current`
   resolution remain separate downstream gates in `CGC-G34` and `CGC-G35`.

## D65 and continuous-plan effect

This contract repairs evidence continuity before an owner can select the first
Craft Definition Snapshot. It does not add or skip a D65 stage. The D65 order
remains:

```text
canonical definitions
  -> Product Capability
  -> capability-local business ontology
  -> DomainSpec v2 authored source
  -> deterministic compiled graph and system ontology
  -> exact implementation binding
  -> conformance evidence
```

`CGC-G33` therefore advances from an untyped repair need to a designed repair
contract, but stays open. `CGC-G34` remains blocked on canonical definitions,
owner selection, and completed reconciliation. `CGC-G35` remains
`NOT_EVALUABLE` until an exact selected implementation exists.

## Claim ceiling

This design binds the 11 drifted MIG-B subjects, defines the append-only receipt
contract, and routes owner classification and successor creation. It does not
emit the 11 receipts, identify the producing transition, rewrite any historical
manifest, receipt, or output tree, classify residue for an owner, validate V9,
select a Craft Definition Snapshot, choose `canonical-current`, admit a
baseline, create a ConstructionBinding, switch authority, publish, release,
deploy, or prove the Goal achieved.
