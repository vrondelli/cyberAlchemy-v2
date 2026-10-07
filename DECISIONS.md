# DomainSpec / AlchLang repair decisions

Status: Decision Gate **BLOCK**, selections recorded through 2026-10-02. All
five presented options have a user selection, but the two provenance repairs
are explicitly deferred and the three action contracts still require exact
design and verification. This record applies only to the remaining accepted-finding repair
in `goals/plans/domainspec-alchlang-review-repair/`; it is not a release,
publication, authority admission, or implementation approval. The independent
2026-09-27 audit recorded 33 bounded closed, 3 partial and 2 open findings;
these counts have not been revalidated in this Decision Gate run.

Source of selections: the owner's sequential replies in this task (N2 `1`,
N9 `defer`, N10 `1`, F5 `A` meaning the first presented option, and W3-04 `1`).
The user stated that they are the owner. These replies select directions; they
do not supply missing historical evidence, approve unwritten contract fields,
or establish a tested product. The Decision Gate prefilter
assesses structural admissibility only; it neither proves semantic correctness
nor satisfies an owner gate. Every accepted option below is a candidate route,
not permission to mutate code or authority records.

## N2 — What is the authoritative acceptance decision?

The selected acceptance file is read by FormalClaim lowering, but its decision
content is not interpreted. A meaning marked accepted can therefore point to
bytes that say rejected or name a different owner.

| Option ID | Kind | Benefit and when to choose | Cost, risk and downstream impact |
| --- | --- | --- | --- |
| `separate-owner-decision` | action, recommended | Use an exact owner-issued decision record naming the meaning subject/version/digest, owner and outcome. Fits the current external acceptance reference. | Requires a versioned decision schema, owner binding, migration for synthetic fixtures, and negative controls. The domain meaning/formalization owners must approve the contract. |
| `versioned-inline-decision` | action | Put those decision fields in a new BusinessMeaning version when the meaning artifact itself should own acceptance. | Changes the meaning and acceptance boundary; old external references need compatibility handling. Same owners must approve. |
| `defer` | defer | Preserve existing candidate work while N2 stays open. | No accepted-current FormalClaim may be inferred from unchecked decision bytes. |
| `stop` | stop | End this repair line. | N2 remains open. |

Admissibility: [request](goals/plans/domainspec-alchlang-review-repair/decision-gate/N2-acceptance.request.json), [receipt](goals/plans/domainspec-alchlang-review-repair/decision-gate/N2-acceptance.receipt.json). Route: `gate`; selected option: `separate-owner-decision` (owner reply `1`, recorded 2026-10-02). Rationale: preserve the existing external acceptance boundary; exact schema, owner binding and negative controls remain to be reviewed. The user identified themselves as owner; no separate person is presumed.

## N9 — What can legitimately replace missing formalization origins?

Five of seven historical origin files have exact-hash copies in the sibling
checkout; two refinement records have not been located. The validator also
rejects two definition references. An absent user-intent record cannot be
reconstructed from a digest.

| Option ID | Kind | Benefit and when to choose | Cost, risk and downstream impact |
| --- | --- | --- | --- |
| `restore-exact-seven` | action, currently rejected | Restore the exact sources if the two missing records are found. | Not executable now; all seven and provenance must be checked before a local import. |
| `replace-historical-bindings` | action, currently rejected | Reclassify historical citations and bind verified current sources if equivalence is established. | No equivalent source for the two missing records has been reviewed; a digest-only change would conceal the gap. Formalization source owner gate required. |
| `defer` | defer, recommended pending evidence | Keep N9 open while searching for exact originals or reviewing replacements. | Formalization validator remains BLOCK. |
| `stop` | stop | End N9 repair. | Formalization validator remains BLOCK. |

Admissibility: [request](goals/plans/domainspec-alchlang-review-repair/decision-gate/N9-formalization-provenance.request.json), [receipt](goals/plans/domainspec-alchlang-review-repair/decision-gate/N9-formalization-provenance.receipt.json). Route: `gate` only between defer and stop; both action options are structurally rejected. Selected option: `defer` (owner reply, recorded 2026-10-02). Rationale: continue other work without fabricating the missing origins or claiming validator PASS.

## N10 — What replaces the missing ontology refinement result?

The ontology validator now stops at `source.system-integration-r2`, whose
selected `RESULT.md` is absent. Neither a source's title nor a new hash proves
it has the same meaning.

| Option ID | Kind | Benefit and when to choose | Cost, risk and downstream impact |
| --- | --- | --- | --- |
| `restore-exact-refinement` | action, currently rejected | Restore the original file if found and verify exact bytes. | It has not been located; no validator PASS can be claimed now. |
| `select-current-replacement` | action, currently rejected | Use a reviewed equivalent source and regenerate ontology/receipt. | Equivalence and source owner approval are absent; do not merely rehash. |
| `defer` | defer, recommended pending evidence | Preserve the current partial N10 result. | Ontology validation remains BLOCK. |
| `stop` | stop | End ontology source repair. | N10 stays partial. |

Admissibility: [request](goals/plans/domainspec-alchlang-review-repair/decision-gate/N10-ontology-provenance.request.json), [receipt](goals/plans/domainspec-alchlang-review-repair/decision-gate/N10-ontology-provenance.receipt.json). Route: `gate` only between defer and stop; both action options are structurally rejected. Selected option: `defer` (owner reply `1`, recorded 2026-10-02). Rationale: continue other work while preserving the ontology validator BLOCK and source gap.

## F5 — What exactly makes evaluation evidence stale?

V2 claim identity and TDE relation keys have bounded freshness controls, but
the evaluation request lacks case-domain and witness-set fields, and the
receipt does not bind preservation evidence. A test for cases 1–10 must not
silently cover a revised case set 1–20.

| Option ID | Kind | Benefit and when to choose | Cost, risk and downstream impact |
| --- | --- | --- | --- |
| `exact-evaluation-and-receipt-contract` | action, recommended | Version request/receipt contracts with interpretation, preservation, bound, case-domain and witness fingerprints and reject old evidence on change. | Requires the formalization and evidence owners to select exact fields, compatibility behavior and negative tests. |
| `defer` | defer | Keep the verified narrow freshness controls. | F5 remains partial; broader evidence cannot be called current. |
| `stop` | stop | End freshness repair. | F5 remains partial. |

Admissibility: [request](goals/plans/domainspec-alchlang-review-repair/decision-gate/F5-evidence-freshness.request.json), [receipt](goals/plans/domainspec-alchlang-review-repair/decision-gate/F5-evidence-freshness.receipt.json). Route: `gate`; selected option: `exact-evaluation-and-receipt-contract` (owner reply `A`, interpreted as the first presented option and stated back without correction, recorded 2026-10-02). Rationale: changed evaluation inputs must invalidate old evidence. Exact fields and compatibility controls remain to be designed and tested.

### F5 follow-on timing gate — selected post-TDE finalization

Implementation analysis found that the current AlchLang verification-profile
lowerer emits `alchlang.verification-request/v1-candidate` before TDE derives
the selected obligations/cases. A final request cannot bind the exact TDE case
and witness bytes at that earlier stage without either a two-phase construction
or requiring a re-entry with TDE outputs. An asynchronous owner question was
sent on 2026-10-02. The owner selected **Finalize after TDE (recommended)**
in this task on 2026-10-02.

| Option | Benefit | Cost and downstream impact |
| --- | --- | --- |
| Finalize after TDE derives cases (recommended) | Keeps AlchLang's existing request as a base evaluation request and lets a later finalization step exact-bind the selected TDE obligation set, preservation, bound and receipt scope. | Requires a versioned final executable request and a separate finalization consumer before EVF `PASS_BOUNDED`. |
| Require TDE artifacts during AlchLang lowering | Keeps one request-formation entry point. | Makes compilation a re-entry after TDE, coupling the compiler input to derived case artifacts and risking confusing pre-TDE and post-TDE states. |

The selected construction keeps the existing AlchLang v1 request as a base
artifact. A separate post-TDE finalizer must derive selected case-domain and
witness-set fingerprints from exact artifact bytes and issue a versioned
executable request. The receipt and EVF consumer must bind that request before
any `PASS_BOUNDED` conclusion. This choice does not decide every field layout,
authenticate a provider, or establish runtime guarantees. F5 stays partial
until the contract and separating tests pass.

## W3-04-adjacent — What happens to failed certificate staging?

Atomic no-replace publication is tested. Recursive deletion after a pathname
check can instead delete a foreign directory if the staging path is swapped.
The current implementation leaves private staging on failure.

| Option ID | Kind | Benefit and when to choose | Cost, risk and downstream impact |
| --- | --- | --- | --- |
| `retain-for-inspected-cleanup` | action, recommended under current threat model | Make retention explicit and use a separately inspected cleanup policy. Preserves a competing directory. | Disk residue needs ownership, retention limits and operator procedure; publication owner must approve the policy. This is separate hardening, not W3-04's original closure predicate. |
| `automatic-native-cleanup` | action, currently rejected | Automatic removal might reduce retained residue if a safe primitive is later proved. | The current native API has no inode-conditional final directory removal; the path-swap race remains. Reconsider only after a safe primitive and threat model are proved. |
| `defer` | defer | Keep fail-closed behavior while staging hardening remains unresolved. | Residue still accumulates on failures; W3-04 publication closure is judged separately. |
| `stop` | stop | End the staging-hardening line. | The retention policy remains unresolved; W3-04 publication closure is judged separately. |

Admissibility: [request](goals/plans/domainspec-alchlang-review-repair/decision-gate/W3-04-staging-policy.request.json), [receipt](goals/plans/domainspec-alchlang-review-repair/decision-gate/W3-04-staging-policy.receipt.json). Route: `gate`; selected option: `retain-for-inspected-cleanup` (owner reply `1`, recorded 2026-10-02). Rationale: preserve a competing directory under the path-swap threat model; retention limits and inspected cleanup procedure still need an exact policy and tests. The authoritative Wave 3 W3-04 request concerned atomic no-replace publication and an interleaving test only; this policy does not determine that finding's closure.

## Deferred, non-blocking questions

- EVF currently checks a caller-supplied exact receipt projection, not a
  provider-native authenticated receipt. Select a trusted provider adapter only
  before claiming provider authenticity or observed runtime guarantees.
- Decide whether a late outbox acknowledgment after lease expiry but before
  replacement claim is accepted. The implemented fence rejects the old worker
  after a replacement claim; this edge policy is not a current closure blocker.
- Frozen current-state baseline `@10` still binds predecessor system-integration
  semantics. A reviewed successor baseline is needed before claiming the newer
  delivery implementation as admitted current state; do not refresh frozen
  evidence digests in place.

## Open Questions

- What exact N2 owner-decision schema and F5 request/receipt field set will be
  accepted after implementation analysis and independent review?
- Are the deferred N9 and N10 historical sources recoverable? They remain
  open/partial and their validators cannot be called passing.
- What retention limit and operator procedure make the selected W3-04-adjacent retention policy
  inspectable without unsafe pathname-based deletion?
