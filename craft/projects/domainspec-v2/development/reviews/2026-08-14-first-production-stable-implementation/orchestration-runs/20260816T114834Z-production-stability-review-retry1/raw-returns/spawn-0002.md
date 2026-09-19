Action receipt: `spawn-0002`

- Binding: `Hewitt, Carl`
- Role: `runtime-mechanics-attacker`
- Mode: `attack`
- Result: `completed_with_findings`
- Review verdict: `REJECT` as a production-stable baseline
- Mutation: none to repository or declared output refs
- Sheet SHA-256: `35eeded757ac503124ebd3af5b03fa013458b5443a442737e92855563e4ce1e1`
- Frozen corpus: 6,188 files, 1,351,008,277 bytes, aggregate `6d208f20bacc39e124709fd18b2fe93147ccb52bf625833c1efd92afe09afa1a`
- Initial drift check: PASS for every frozen file
- Final drift recheck: not run because the parent issued a bounded stop checkpoint; all executed writes were confined to `/tmp`.

Findings:

1. **CRITICAL — `factory verify` accepts a fabricated run with no plan, request, lock, snapshots, nodes, or process evidence.**

   `verify-run-root.ts:33-62` trusts the self-authored index and checks only `result`, `authority_effect`, and a semantic-receipt digest. It string-coerces an arbitrary `lock_sha256` and `run_id`. The CLI exposes this directly at `factory/cli/index.ts:57-58`.

   An isolated three-file forged run returned:

   ```json
   {
     "result": "pass",
     "lock_sha256": "forged-not-a-digest",
     "run_id": "forged-run"
   }
   ```

   Fix: require a caller-supplied expected request/lock or run-root anchor, closed-schema decode every mandatory artifact, and verify the complete request → plan → lock → snapshots → nodes → terminal topology.

   Acceptance: the forged three-file fixture must fail with a typed topology/anchor error while a genuine locked run still passes.

2. **CRITICAL — W4 creates a ghost event on timeout-after-success.**

   `settlement-workflow.ts:30-48` compensates persisted state after any publish exception. The executable probe made `publish` succeed externally and then throw `TIMEOUT_AFTER_SUCCESS`; current code returned:

   ```json
   {
     "outcome": "settlement-failed",
     "compensations": ["rollback-settlement"],
     "persisted": false,
     "published": true
   }
   ```

   This contradicts W3’s atomic record-plus-durable-outbox model in `effects-connections/.../descriptors.json:80-111`.

   Fix: publish through the atomic outbox and model ambiguous publish outcomes explicitly; never roll back durable state solely because acknowledgment is unknown.

   Acceptance: fault-inject fail-before-send, success, and success-then-timeout; assert no published event lacks its durable state/outbox record and retry is occurrence-idempotent.

3. **MAJOR — W3 cross-language behavior disagrees on compatibility.**

   For the same observation accepting future major version `2`:

   - TypeScript returned `reject / ARCH_INTERFACE_COMPATIBILITY_DRIFT`.
   - Python returned `pass`.
   - Rust’s evaluator cannot represent compatibility checks.

   TypeScript enforces compatibility at `evaluate-w3.ts:79-89`; Python ignores it at `targets/python/w3.py:94-100`; Rust’s API at `targets/rust/src/w3.rs:99-103` contains only contract/version/exposure.

   Fix: run one shared hostile JSON corpus through all language evaluators and require equivalent verdicts/codes, or explicitly narrow Python/Rust to syntax witnesses and remove behavioral-parity claims.

4. **MAJOR — supposedly content-addressed W3/W4 bindings validate only digest syntax.**

   `evaluate-w3.ts:28-36` and `evaluate-w4.ts:23-31` check only that six refs contain 64 hexadecimal characters. Both descriptor sets bind the TypeScript profile to stale digest `b0057f...`; the frozen current profile is `32cf17...`. Nevertheless, all 21 focused TypeScript W3/W4 tests passed.

   Fix: resolve every binding ID through an explicit path registry and compare live/frozen bytes before evaluation.

   Acceptance: any one-byte bound-source/profile change must yield `ARCH_W3_BINDING_INVALID` or `ARCH_W4_BINDING_INVALID`.

5. **MAJOR — the full factory suite is not green on the frozen corpus.**

   Result: 17 files passed, 2 failed; 61 tests passed, 8 skipped. Both failures occurred during setup:

   - `rmt-entity.request.json:432-433`
   - `rmt-value-object.request.json:369-370`

   They expect ontology digest `2b3605...`; current frozen ontology is `6cd5a4...`.

   The unexercised legacy `rmt-enum.request.json` also contains two stale refs, while `rmt-enum.test.ts:20-23` uses the newer semantic-slice request instead.

   Fix: semantically revalidate and regenerate affected requests and downstream receipts, then add a census test over every `*.request.json` ref.

6. **MINOR — the frozen corpus includes host-local Rust caches.**

   The manifest contains 4,825 `cargo-target` files totaling 1,340,635,926 bytes because `**/target/**` does not match `**/cargo-target/**`. This makes drift sensitive to transient compiler artifacts.

   Fix requires a newly confirmed exclusion, fresh freeze, and rerunning all attackers; the current confirmed corpus was preserved unchanged.

Command receipts:

- Full frozen hash check: exit `0`, no mismatches.
- Factory suite with isolated `TMPDIR`, `XDG_CACHE_HOME`, and `CARGO_TARGET_DIR`: exit `1`; `17 passed`, `2 failed`, `61 passed`, `8 skipped`.
- Python W3/W4: `python3 -m unittest -v test_w3.py test_w4.py`; exit `0`, `8 passed`.
- Rust W3/W4: `cargo test --locked --offline --test w3 --test w4`; exit `0`, `9 passed`.
- TypeScript W3/W4 evaluator suites: exit `0`, `21 passed`.
- Timeout-after-success counterexample: exit `0`; reproduced `published=true`, `persisted=false`.
- TypeScript/Python compatibility counterexample: exit `0`; reproduced `reject` versus `pass`.
- Forged factory-run verification: exit `0`; verifier returned `pass`.
- One preliminary timeout probe exited `1` because `tsx -e` rejected top-level await; the wrapped rerun above succeeded.
- One initial factory wrapper was rejected before execution because it contained recursive temp cleanup; no test or repository mutation occurred.

Evidence gaps:

- No exhaustive multi-process lock-race, crash-restart, poison-input, or duplicate-delivery matrix.
- No cross-host reproduction.
- The 41 system-integration receipt/probe files were inventoried and frozen but not individually re-executed.
- Canonical and production/status families were checked for digest/claim relationships, not independently semantically audited.
- No final post-command corpus drift check due the parent stop checkpoint.

Temporary residue intentionally left for explicit cleanup:

- `/tmp/domainspec-runtime-review.GfgOxV`
- `/tmp/domainspec-runtime-py.dpcMMm`
- `/tmp/domainspec-runtime-rust.LZBElF`
- `/tmp/domainspec-runtime-ts.VWWYbf`
- `/tmp/domainspec-forged-factory-run.ZUZ8GT`
- `/tmp/domainspec-runtime-paths-view.txt`

No receipt was written to `receipts/attacker-runtime-mechanics.json`; write scope was empty.
