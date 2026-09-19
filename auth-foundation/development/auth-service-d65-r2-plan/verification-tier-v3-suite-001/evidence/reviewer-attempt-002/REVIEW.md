# Independent Auth V3 review — reviewer attempt 002

## Verdict

**AGREE** with sealed `author-attempt-005`, within the candidate claim ceiling. The sealed author run and a fresh reviewer replay both satisfy the additive V3 contract for the same five Auth obligations. This review has `authority_effect: none` and grants no product approval, governance or runtime admission, release, publication, deployment, certification, or customer-delivery authority.

Reviewer attempt 001 is preserved as superseded because it reviewed author attempt 004 before the Alloy and Soufflé execution identities were closed.

## Evidence

- Kernel tests: 10 passed, 0 failed.
- Auth suite tests: 13 passed, 0 failed.
- Author manifest: 36 unique entries; every digest passes; no missing or extra files. Manifest SHA-256: `7d8a2078f3a395105c5240e2ddac54236797c21fd3ca433bb778fd4171980018`.
- Reviewer replay manifest: 36 unique entries; every digest passes; no missing or extra files. Manifest SHA-256: `1fd74b6f9a2f223a1ef44214adf9186e14c2979ca1ca340c8e174e6e678d2ba1`.
- Author and replay `V3-RESULT.json` are byte-identical at SHA-256 `2773b6d4109929ffd4ab9ea3c6e91d09ee6664e2f058d6d57ac3698b7babe4d8`.
- Both results report `contract_state: satisfied`, `verified_tier: V3`, `property_outcome: no_counterexample_within_bounds`, empty residue, and `shared_infrastructure: [java17]`.

## Semantic and bound audit

| Obligation | Method and semantic fit | Actual bound | Mutation result |
|---|---|---|---|
| `auth.executable.fail-closed` | Rust executable verifier checks the sealed current Auth EVF evidence; this matches an implementation-behavior obligation. | 64 recorded Rust tests and 6 cause-specific behavioral mutants. | A separate disposable-copy campaign rebuilt every mutant and killed all 6 for the declared cause; each neutral control passed twice. |
| `auth.theorem.exact-grant` | Lean proves exact grant characterization and resource/action/scope mismatch denial, plus source-to-Rust projection correspondence. | 2 files, 8 theorem declarations. | Exit 1 with unsolved goals after changing conjunction to disjunction. |
| `auth.temporal.revoked-never-allows` | TLC explores authorization and invalidation transitions for revoked, expired, and superseded sessions. | 2 sessions, 4 statuses, 1 worker; 201 generated and 25 distinct states. | Exit 12 with `InvalidNeverAllows` violated. |
| `auth.relational.no-unintended-join` | Alloy searches bounded role/grant/tenant/scope/permission joins. | Overall scope 5, exactly 2 requests and 2 tenants. | Canonical: 0 counterexamples; mutant: 1 counterexample. |
| `auth.recursive.delegation-bounded` | Soufflé computes recursive delegation authority and cross-tenant violations. | 5 roles, 2 tenants, 3 delegation facts. | Canonical: 0 violations; mutant: 2 violations. |

The methods cover distinct semantic obligations. Route IDs, independence groups, and producer identities are each unique across all five providers. The only shared component is Java 17, used by TLC and Alloy and correctly reported once in the V3 result.

## Binding and mutation audit

Every provider in both author and replay invocations directly binds its raw route result, provider profile, nonempty canonical input set, mutation input, and mutation evidence by repository-relative path, byte length, and SHA-256. All references resolve to the current exact bytes. Provider payload digests, subject digest, and suite-bounds digest pass the kernel.

Attempt 005 closes the prior executable-identity defects. Alloy now invokes the exact digest-bound Java executable and Alloy 6.2.0 jar directly. Soufflé declares both the executed wrapper and the governed 2.5 engine behind it. The observed tool hashes match the receipt declarations.

The five route controls are causal rather than process-exit shortcuts: Lean fails proof checking; TLC finds an invariant counterexample; Alloy produces a model solution; Soufflé produces two violation rows; and the Rust campaign requires a successful mutant build followed by the named test failing with the declared causal marker. A build failure alone cannot satisfy the Rust control.

Six independent receipt mutations were also evaluated: canonical-input digest drift, mutation-input digest drift, duplicate route identity, same-obligation outcome conflict, a surviving route mutation, and incomplete execution. Every case removed the verified tier. Conflicting outcomes remained `conflicting_evidence`; no vote or automatic downgrade occurred.

## Commands

```text
PYTHONDONTWRITEBYTECODE=1 python3 -B -m unittest discover -v -s tests
PYTHONDONTWRITEBYTECODE=1 python3 -B -m unittest -v test_suite.py
cd evidence/author-attempt-005 && sha256sum -c ARTIFACTS.sha256
PYTHONDONTWRITEBYTECODE=1 python3 -B run.py --output evidence/reviewer-attempt-002/replay
cd evidence/reviewer-attempt-002/replay && sha256sum -c ARTIFACTS.sha256
PYTHONDONTWRITEBYTECODE=1 python3 -B mutations.py
```

The Rust mutation command ran without `--write`; it used disposable copies and left the implementation unchanged.

## Claim ceiling

This is independent evidence that the exact five-obligation Auth V3 candidate suite passed within its declared executable and finite model bounds. It is not evidence of universal correctness beyond those bounds and does not grant approval, admission, activation, publication, release, deployment, certification, or any customer-facing effect.

## Open Questions

- Should a future V3 contract digest-bind hostile-control evidence instead of carrying only detected booleans?
- Should shared Java infrastructure require a second JVM implementation for a stronger common-mode independence claim?
- Which separately governed owner and runtime, if any, should consider this candidate evidence for admission or recurring execution?
