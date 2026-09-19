# ORODI WP5 candidate-local prototype validation report

## Outcome

PASS for the accepted candidate-local implementation lane. ORODI WP5 revision 003 was implemented in W0 → W1 → W2 order within the exact accepted 23-path manifest. All declared validation passed. This report records repository-local prototype evidence only.

## Accepted boundary

- Revision manifest: `94053bad26ed670ee848de4f425f0f3706ae186ec30804eb92b1c8dcd0f255ce`
- Independent review: `2171d5a13e68f240ddadb8c5ead72a65c7239f7daec31531dca4e306ee05059c`
- Owner acceptance receipt: `c94d2ab1e6e0fc06fb1b6cb0cb2e164188f56686767d7dba392bc9db092c9039`
- Planned write manifest: `c0ee8813107f1ff529062e190b0aaa494518c40b478866045cccc68668ca99af`
- WP1–WP4 baseline: `098d0dffbb33a8313f64a6bf1aa3677f4cca4a9f4af374e2984316f5fdb41fb6`
- Product write-set parity: 23 accepted paths / 23 materialized paths
- Product write-set digest snapshot: `57990013a1d807b5e4a39a9d7ecf2b9ebe5860cf3487e10579603c1a3cf2ff61`

Twenty-two accepted files were created. The only pre-existing accepted target, `projects/domainspec-v2/impl/operational-resilience/README.md`, was changed only by adding the section anchored at `## Tool evidence profiles (candidate-local)`.

## Deferred-governance handoff

- Handoff Notice: `HN-A404FBD85165`
- Notice digest: `a404fbd851653904e7da3daea89a0d366b7e9dff4d07eaa708dda9acb0677391`
- Helper receipt SHA-256: `345bf15c3c6b0b40db8fb23900771f93e19a0420282cc988ad009c3b5501a934`
- Publish, exact resolve, inspect, index and Markdown parity, source hashes, JSONL, and authority-boundary checks: PASS
- Product paths touched by the helper: none
- Deferred next route: `invoke:refresh`, authorization not granted

The notice was published and joined before product mutation.

## Implemented vertical

### W0 — closed contracts and inventories

- Closed descriptor and validation-result TypeScript contracts.
- JSON Schemas for the descriptor, family inventory, attribute policy, referent inventory, and validation result.
- Exactly seven admitted families: telemetry, health-failure, workload, fault, canary-analysis, deployment-observation, and rollback-observation.
- `infrastructure-plan` and `compatibility` remain deferred and unadmitted.
- Closed attribute allowlist, secret-key and prefix rejection, byte limits, cardinality limit, and wildcard denial.
- Caller-resolved exact-byte referents for a distinct producer, offline normalizer, input/output schemas, validation-receipt schema, and proposed-control catalog.

### W1 — pure validator and exact local CLI

- Deterministic SHA-256 binding for all four JSON inputs.
- Exact UTF-8 JSON parsing with duplicate-object-key rejection.
- Closed JSON Pointer selection without discovery, wildcards, fragments, parent traversal, expressions, or ambient latest behavior.
- Referent role, version, digest, and bytes validation.
- Exact family safeguard, normalized-kind, admitted-control, proposed-control, timestamp, expiry, attribute, and output-constraint validation.
- Sorted and deduplicated findings.
- The result always declares `runtime_admission: "denied"`, `referent_trust: "unverified"`, and `authority_effect: "none"`.
- The CLI accepts only explicit regular non-symlink local files, emits only the validation result, and exposes no output path, discovery, network, or child-process surface.

### W2 — replay proof and documentation

- Seven golden profiles.
- Forty-one hostile cases: 37 pure-validator cases and four CLI path/argument cases.
- Exact hostile-case to expected-discriminator parity.
- Regression tests for deterministic rejection, closed outputs, sorted findings, no partial observation/control/eligibility assembly, and both deferred-family codes.
- Candidate-local README boundary and invocation example.

## Declared validation results

| Validation | Result |
| --- | --- |
| TypeScript compile, `tsc --noEmit` | PASS |
| Full six-suite regression surface | PASS — 147/147 tests |
| Family inventory, attribute policy, referents, and seven golden descriptors against JSON Schemas | PASS — 10/10 instances |
| Seven exact CLI replays and emitted results against the result schema | PASS — 7/7 |
| Independent JSON parsing plus focused executable replay | PASS — 59/59 focused tests |
| Forbidden pure-validator and CLI surface scans | PASS |
| Denied admission, no authority effect, unverified referents, no normalized outputs, sorted findings, and deferred-family assertions | PASS |
| Exact planned-write manifest, regular-file, non-symlink, non-empty, readable, final-newline, whitespace, and conflict-marker checks | PASS — 23/23 paths |
| Pre-existing WP1–WP4 baseline | PASS — 88/88 files byte-identical |

The first focused test attempt exposed a test-helper-only defect: remove mutations tried to clone an absent mutation value. The helper was corrected inside the accepted test path, and both the focused and full declared matrices were rerun to PASS.

## Authority and claim ceiling

This implementation validates repository-local profile descriptions and fixtures. It does not run or admit a monitoring backend, health integration, workload generator, fault tool, canary controller, infrastructure provider, deployment transport, rollback actuator, or environment binding. It does not prove source authorship, authenticity, trust, availability, observability coverage, live behavior, operational readiness, release readiness, deployment success, rollback success, or production truth.

No dependency was installed. No network request, live tool, infrastructure operation, deployment, rollback, Git publication, lifecycle reconciliation, promotion, or external effect was performed. Lifecycle reconciliation remains deferred. `authority_effect: none`.
