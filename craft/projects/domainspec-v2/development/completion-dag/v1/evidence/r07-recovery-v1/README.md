# R07 recovery product-test campaign

This packet tests the exact local Python/SQLite recovery candidate assembled from R03 coordination storage, R04 Operation replay, R05 fenced execution and R06 retry/restart orchestration. It does not modify those implementation packets or their definition and system-prototype predecessors.

The selected R01 matrix contains 30 scenarios. `scenario-map.json` binds every scenario to concrete executable checks. `additional_tests.py` closes gaps in the earlier focused suites; `contracts.mjs` checks the actual selected R02 formation records, universal-Port rejection and missing runtime bindings using the bound system-integration compiler.

`RESULTS.json` retains each scenario's status, raw test output, exit code, execution time, interpreter identity and read-only database observations. Each scenario executes in a fresh interpreter with fresh temporary stores. The second pass runs in reverse order. Both passes are collect-all: a failed or inaccessible scenario remains visible and does not disappear from the report. Contract-only F26 observes formation without creating runtime stores. Other metadata-versus-runtime cases retain their separate formation and runtime checks.

`DEVELOPMENT-RESULTS.json` preserves the first 60-execution campaign before strengthening direct terminal-successor rejection and coordination-progress crash coverage. Only the final `RESULTS.json` is acceptance-bound to the final harness bytes. The original runtime bytes are unchanged throughout.

The crash checks use actual SIGKILL at barriers. Coverage includes coordination transition/outbox commit, progress commit, retry schedule, terminal recording, local hint acknowledgement, Operation commit, and the interval between Operation and coordination commits. Process restart checks preserve the completed prefix and stable invocation identity. Other checks cover two competing workers, lease expiry and renewal generations, monotonic fences, exact binding preflight, persisted retry delay and budget, unknown-result reconciliation, duplicate replay, evidence loss and schema/boot mismatch.

`REPLAY-REPORT.json` reports execution independence: fresh interpreters and stores, reversed scenario order, unchanged source/test hashes, and independently observed test outcomes. The same agent authored the supplemental tests and evaluated the results. This is not an independent human or second-agent review; R08 explicitly owns that review and the product-owner decision.

The scope is one local Linux host and boot, two competing workers, separate SQLite databases, and the selected bounded example Operation. No remote effects, multi-host behavior, cross-boot recovery, power-loss durability, throughput guarantee, production activation or universal exactly-once claim is made. Absent wakeup notifications are tolerated; missing durable evidence is rejected. An unresolved terminal disposition does not prove that a stale in-flight Operation had no effect.

`PRODUCT-TEST-MANIFEST.json` binds the exact composite candidate and final tests. `COVERAGE.json` joins all 30 original scenarios to both observations. `verify.py` checks current source/runtime hashes, complete scenario coverage, recorded outcomes, replay order, product-test binding and packet closure without rerunning tests. A deliberate rerun of `campaign.py` rewrites run evidence and requires a new review epoch; it is not the read-only verification command.

```sh
python3 -B projects/domainspec-v2/development/completion-dag/v1/evidence/r07-recovery-v1/verify.py
```

Construction frontier and operational residue are separate in `progress.json`. R08 owns independent transaction/evidence review and approval of one exact tested product candidate. U00 and L00 remain independent construction work. Existing release, distribution, EVF stability/environment and source-index tasks keep their prior owners and affected stages; none is converted into a prototype gate. Product-test evidence grants no operational, publication or deployment authority.
