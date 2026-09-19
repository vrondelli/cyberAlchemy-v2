# C0 Independent Audit 001

## Identity

- Audit mode: read-only audit of the frozen proposal candidate
- Verdict: `block-for-adoption-or-execution`
- Authority effect: `none`
- Release admission: `not-granted`
- Audited claim ceiling: `schema-and-synthetic-invariant-validation-only`

## Frozen input binding

| Artifact | SHA-256 | Size |
| --- | --- | ---: |
| `proposals/c0/C0-CONTRACT-SKETCH.md` | `2fc41a89cbb365dd3cfc7069ec7d086e1d8bd80f83706422c6c82f8729826f6b` | 7,154 |
| `proposals/c0/c0-contract-bundle.v1.schema.json` | `16f6d0353deb992a61e46f5be790fa8eb7f5b4fc2812e7862e9f97b7ceb3d537` | 36,565 |
| `proposals/c0/validate_c0_contract_proposal.py` | `dcd3e35ba25c8d8c5057d2010731eec7e52460346ad46e076c47004092a97997` | 35,504 |

The frozen candidate's own validator exited `0`, validated six synthetic documents,
and killed all 19 declared mutations. Draft 2020-12 schema validation, JSON parsing,
the exactly-four-envelope topology, L1 semantic non-binding, authority ceilings, and
scoped trailing-whitespace checks also passed.

## Blocking findings

1. **Canonical fact ordering diverged from the stated profile.** Object keys used
   UTF-16 code-unit ordering, but fact tuple sorting used Python Unicode scalar
   ordering. `U+E000` and `U+10000` therefore sorted in opposite orders and could
   yield different `facts_digest` values across implementations.
2. **Execution truth was not enforced.** A provider receipt with
   `status: completed`, nonzero `exit_code`, and `timed_out: true` validated without
   error and retained a property result instead of becoming unresolved with no
   property claim.
3. **Alloy scope integrity was not enforced.** Changing the embedded scope without
   changing `scope_digest` validated without error, so the bounded result was not
   cryptographically bound to the scope it claimed.
4. **External L1 admission was only a nonempty-reference check.** An arbitrary exact
   reference satisfied the execution-ready prerequisite. This did not bind L1
   feature semantics, but it also did not prove a terminal admitted L1 receipt.
5. **Evidence bindings were incomplete.** Alloy SAT survived without an instance or
   counterexample reference and with empty normalized/join evidence. Datalog
   `row_count` could change without a corresponding rows payload, digest, or exact
   reference failure.
6. **Canonical integer interoperability was open.** Schema-valid integers above the
   JavaScript safe integer range could enter the canonicalized contract.

The independent in-memory probes returned no validation errors for
`completed_nonzero_timedout`, `alloy_scope_changed_stale_digest`,
`alloy_sat_without_evidence`, `arbitrary_l1_exact_ref`, and
`datalog_row_count_unbound`; the UTF-16 comparison returned
`fact_sort_matches_profile=false`; the unsafe-integer request returned zero schema
errors.

## Frozen maximum honest claim

The frozen package was a coherent, non-authoritative four-envelope schema sketch
whose six synthetic examples passed its declared 19 mutations. It did not validate
deterministic cross-language fact canonicalization, execution truth, Alloy bound
integrity, external L1 admission, provider evidence completeness, a live graph law,
or either provider runtime.

Any repaired schema, sketch, validator, or report is a new candidate. It requires
fresh hashes, a new mutation denominator, independent review, and renewed exact-byte
owner acceptance before adoption or execution.
