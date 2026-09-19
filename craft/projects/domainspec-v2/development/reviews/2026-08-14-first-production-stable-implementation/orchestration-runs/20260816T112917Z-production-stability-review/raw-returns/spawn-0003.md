# Raw lifecycle/longevity attack receipt

**Action admission: PASS.** The bounded `Ashby, W. Ross` lifecycle/operability attack is complete enough for parent receipt admission.

**Product verdict: BLOCK / REPAIR-THEN-GATE.** No current frozen artifact qualifies as a production-stable baseline. PASS applies only to this read-only review action.

## Action identity

- Action: `spawn-0003`
- Role: `lifecycle-longevity-attacker`
- Mode: `attack`
- Mutation: none
- Output ref: not written
- Controlling brief: exact `Ashby, W. Ross.initial_prompt`
- Frozen corpus: 6,188 files, 1,351,008,277 bytes
- Aggregate digest: `6d208f20bacc39e124709fd18b2fe93147ccb52bf625833c1efd92afe09afa1a`
- Full file-digest verification: PASS, 6,188/6,188
- `TARGET-CORPUS.json` digest matched manifest: `ab28c7e7...38035`
- `dispatch-sheet.json` digest matched manifest: `35eeded7...e1e1`
- No network, installation, product command, or write was performed.

## Source-family coverage

| Family | Frozen status | Lifecycle disposition |
|---|---:|---|
| Canonical authority/schema | 69 tracked-clean | KEEP as inputs; release profile remains owner-gated |
| Ontology/profile/form decisions | 106: 66 changed, 30 ignored-untracked, 10 clean | DEFER candidate projections; reconcile lifecycle state |
| Architecture runtime | 932: 542 changed, 69 ignored-untracked, 321 clean | HARDEN a bounded CLI core; no whole-family baseline |
| RMT candidates/factory | 5,034: 23 changed, 5,011 ignored-untracked | DEFER candidates; KILL cache residue from release scope |
| W3/W4 integration boundary | 41: 35 changed, 6 ignored-untracked | DEFER until durability semantics are owner-decided |
| Production/status evidence | 6: 5 clean, 1 ignored-untracked | KEEP as comparator/gate evidence, not release proof |

## Severity-ordered findings

### LON-001 — CRITICAL — The frozen corpus does not bind the current release referent

Evidence:

- The exact manifest query for `projects/domainspec-v2/development/first-production-release/decisions/2026-07-12-product-release-contract.md` returns zero; the corpus contains no current first-production decision, product contract, or profile-lane artifact.
- The earlier comparator requires G0 to bind artifact, actors, environment, profile, compatibility, support, withdrawal, and accountable owners: `implementation/domainspec/research/2026-07-12-first-production-release/findings.md:50-98`.
- The current Craft projection describes an accepted private route, but remains `stage: plan`, `gate: block`, and says production is unauthorized: `projects/domainspec-v2/.craft/ledger.yml:369-386`.
- The backend lane is also `gate: block`: ledger lines 449-462.
- The only frozen canonical profile is `experimental`, with `release_admission: not-granted/deferred`: `projects/domainspec-v2/definitions/minted-project/supported-profiles.yml:2-6,22,57-64`.

Impact: the review cannot identify which commands, data formats, owners, environments, or support promises are intended to remain stable.

One-line fix: freeze the exact current G0/R2 contract and owner receipts into a new corpus, or retain the release block.

Durable acceptance: a validator binds exact artifact digest, supported commands/inputs/outputs/writes, profile, environment, compatibility/support/withdrawal boundaries, and named or governed owners; any changed contract byte forces a new freeze and attacker rerun.

Classification: **required for every stable slice; owner-decision-gated**.

---

### LON-002 — CRITICAL — W3 and W4 expose an unjoined durability contract

Evidence:

- W3 requires one caller-supplied atomic commit of `SettlementRecord` plus `SettlementCreated`: `targets/python/w3.py:58-74`.
- W4 separately fixes `validate → decide → persist → publish`, then compensates completed `persist` after publication failure: `targets/python/w4_workflow.py:5,22-56`; this rollback is asserted by `targets/python/test_w4.py:35-60`.
- The W3 README describes a durable checkpoint separated from publication attempts; the W4 README assigns effect execution to a W3 Operation.
- The strategy packet records this as an unresolved tension.
- The W3/W4 report says repository-wide `NOT GREEN`, lifecycle deliberately unrefreshed, and owner reconciliation still open: `PROTOTYPE-VALIDATION-REPORT.md:5-19,59-80`.

The models may be composable, but no frozen versioned contract says whether W4 `persist` is:

1. W3’s durable record-plus-outbox commit, in which case rolling it back after publish failure risks an orphan/ghost event or lost retry; or
2. reversible staging before W3 finalization, in which case its identity and recovery semantics are currently unstated.

One-line fix: owner-select one explicit persistence/publication/compensation model and bind W4 steps to the corresponding W3 operation and outbox state.

Durable acceptance: crash/restart after every boundary; timeout-after-success; duplicate, poison, reordered, and replayed delivery; proof that record, outbox, publication attempt, compensation, and receipt state never contradict across included languages.

Classification: **required if W3/W4 enter the product contract; otherwise DEFER with reopen on supported runtime workflow/state execution**.

---

### LON-003 — MAJOR — All 4,825 cargo-target files are frozen cache contamination

The residue was not omitted:

- Count: 4,825 files across calculation 572, entity 745, enum 547, policy 600, query 667, validation 547, and value-object 1,147.
- Size: 1,340,635,926 bytes.
- Share: 77.9735% of files and 99.2323% of corpus bytes.
- Status: all `ignored-untracked`.
- `CACHEDIR.TAG` explicitly identifies each directory as Cargo cache.
- `.rustc_info.json` embeds host architecture, exact workstation toolchain, and `/home/vrondelli/...`.
- Current confirmed exclusion covers `**/target/**`, not `**/cargo-target/**`.

Current-review disposition: **KEEP only as enumerated frozen residue**, because removing it would change the accepted corpus.

Stable-slice disposition: **KILL/exclude all 4,825 files**. They are neither canonical source nor durable proof and leak host-specific build information.

One-line fix: redirect `CARGO_TARGET_DIR` outside selected/product roots and add an explicitly owner-approved `**/cargo-target/**` exclusion for the next freeze.

Durable acceptance: a clean empty-cache run yields zero product-tree `/cargo-target/` files, preserves semantic receipts, and contains no absolute home path; changing the selector requires a new manifest and full review rerun.

Classification: **required cleanup; corpus-change owner gate required**.

---

### LON-004 — MAJOR — Generated, canonical, evidence, and lifecycle state are not durably separated

Evidence:

- The corpus contains 50 ignored-untracked `dist/` files, 64 run snapshots, 152 non-cargo run files, and 114 receipt-named files.
- Run snapshots duplicate canonical source/provider bytes exactly.
- `ontology-form-decisions/README.md:39-51` says all 13 active cards remain blocked, the queue is empty, and W4 is the next wave.
- Later W3/W4 evidence reports a candidate PASS while explicitly saying Craft, Work Pack, form decisions, terminal receipt, and lifecycle projections were not refreshed.
- `TERMINAL-RECEIPT.json` selector `.deferred_lifecycle_work` says governance synchronization was not executed and promotion/release were not granted.
- The ontology experiment remains explicitly non-authoritative and partly hand-authored: `ontology-experiment/README.md:3,140-171`.

Impact: future maintainers cannot treat documentation, queues, generated distribution, run snapshots, or candidate receipts as one current lifecycle truth.

One-line fix: establish one digest-bound lifecycle projection and separate source, generated release staging, and evidence archive ownership.

Durable acceptance: clean generation produces deterministic `dist` bytes; a lifecycle validator reports W3/W4 as implemented candidate evidence but unadmitted; stale “W4 next” wording fails; no run snapshot becomes product or semantic authority.

Classification: **required; exact candidate-state reconciliation is owner-gated**.

---

### LON-005 — MAJOR — Package-manager and install authority are ambiguous and unenforced

Evidence:

- Root `package.json:52` declares a hash-pinned `pnpm@11.11.0`.
- Root scripts and factory documentation invoke `npm`.
- A tracked-clean root `package-lock.json` exists, but the exact manifest query for root `impl/pnpm-lock.yaml` returns zero.
- A separate nested `test-derivation-engine/pnpm-lock.yaml` exists.
- Both `pnpm-workspace.yaml` files contain unresolved `allowBuilds.esbuild: set this to true or false`.
- The root package/workspace files are changed while `package-lock.json` is clean.
- The key direct tool versions currently align across the npm and nested pnpm locks, but that does not identify the authoritative installer.
- Exact CI-path query over the frozen corpus returns zero.

One-line fix: owner-select one package manager and lock boundary, resolve the build-script policy, and make clean frozen-lock installation/build the enforced path.

Durable acceptance: two clean arbitrary-path checkouts use the selected pinned manager and lock, build the compiled CLI, run the complete selected gate, and reject lock or workspace-policy drift in CI.

Classification: **required; package-manager choice is owner-decision-gated**.

---

### LON-006 — MAJOR — Durable API/schema/receipt evolution is unowned

Evidence:

- The corpus contains 54 schema paths and 114 receipt paths.
- Many `schema_version` identities coexist at v1/v2, including ontology, Enum admission/descriptors, projections, and obligation catalogues.
- Only three path-level compatibility surfaces exist: the SIC matrix and Enum-v1 implementation/test.
- Exact manifest path query finds zero migration, upgrade, or deprecation artifacts.
- The implementation packages remain private `0.0.0`; this is acceptable for a candidate but does not define compatibility.
- The production comparator classifies persisted-format migration, version rollback, compatibility, and deprecation as release-blocking: `findings.md:145-165`.

The absence query proves no first-class policy is present in this frozen corpus; it does not claim those words appear nowhere inside prose.

One-line fix: owner-register every supported CLI, diagnostic, receipt, schema, and persisted format with compatibility class, migration/rollback behavior, deprecation window, and unknown-future handling.

Durable acceptance: N/N+1/N−1 golden fixtures; old receipts are still read/replayed or rejected with a stable typed code; unknown future versions fail closed; every breaking change carries an owner-approved migration or explicit irreversible gate.

Classification: **required after G0/R2 identify supported interfaces; owner-decision-gated**.

---

### LON-007 — MAJOR — Current proof is a frozen dirty host snapshot, not a rebuildable baseline

Evidence:

- Corpus status: 666 changed, 5,117 ignored-untracked, and 405 tracked-clean files.
- Full digest verification proves the exact current snapshot, but not that a clean checkout can recreate it.
- Factory documentation explicitly limits proof to same-host local reproduction and says it does not provision another host: `factory/README.md:120`.
- The implementation’s compiled `dist` is ignored-untracked.
- Rust cache metadata embeds the current x86_64 Linux toolchain and workstation path.
- The accepted comparator requires compiled self-containment and clean RC proof: `findings.md:136,149` and verdict rows R3/R9 at lines 398-404.

One-line fix: bind one supported environment first, then build and verify the exact release artifact from clean arbitrary paths with fresh isolated caches.

Durable acceptance: independent clean roots on every supported environment yield the same normalized semantic receipts and release manifest, with only declared platform-specific process observations and no sibling/source-checkout leakage.

Classification: **clean reproducibility is required; multi-platform/cross-host breadth is owner-gated and may initially be narrowed to one managed environment**.

---

### LON-008 — MAJOR — Operability, resource, retention, security, and support boundaries remain unbound

Evidence:

- No product-owned CI, SECURITY, SUPPORT, OWNERS/CODEOWNERS, migration, runbook, release, license, notice, or SBOM path exists in the frozen manifest. The CHANGELOG/observability paths that do exist are test fixtures.
- One full SIC validation took 1,357,182 ms.
- Cargo cache residue alone is 1.34 GB.
- Factory evidence proves child timeout/output-cap behavior but expressly excludes runtime performance.
- The backend Craft lane still needs redaction rules, rollback route, and accountable owners: ledger lines 449-462.
- The production comparator requires dependency/security containment, local diagnostics, performance bounds, recovery, help/version/docs, support, hotfix, and withdrawal: `findings.md:151-165`.

One-line fix: bind a local-CLI operator contract covering exit codes, diagnostics/redaction, time-memory-disk limits, crash cleanup, evidence retention, dependency/security review, support, hotfix, and withdrawal.

Durable acceptance: declared maximum-corpus run stays within budgets; forced timeout/crash publishes no partial output; cleanup preserves referenced receipts; artifact scan finds no secrets/private paths; an independent operator completes install, use, diagnostics, recovery, and rollback from the supplied package.

Classification: **local operability is required; central telemetry/SLO/service controls remain out of scope unless a hosted contract is selected**.

## Minimum coherent first stable slice

No current artifact is stable. The smallest defensible candidate remains the comparator’s Option A:

> A private, repository-local, compiled TypeScript Validation Toolkit CLI, bound to one exact owner-ratified backend profile, with only its command surface, exit codes, diagnostics, and versioned machine receipts treated as supported interfaces.

Recommended boundaries:

- Include canonical definitions/schemas by exact digest.
- Use `feature-with-independent-node-files/v1` only if R2 promotes or explicitly ratifies that exact profile; it is currently experimental.
- Restrict writes to one explicit atomic/recoverable output directory.
- Do not promise a stable JavaScript import API.
- Keep the generic factory as an internal evidence harness unless G0 separately selects it as product surface.
- Exclude Python/Rust runtime support, RMT candidates, ontology candidate projections, W3/W4 execution, UI, public distribution, hosted service, stable SDK, code generation, and Saturn/convergence claims.

Dependency order:

1. Freeze and ratify exact G0 product/release contract, profile, actors, environment, owners, and exclusions.
2. Curate exact source bytes and select the package manager/lock/toolchain.
3. Produce the self-contained compiled CLI from a clean arbitrary path.
4. Freeze command, diagnostic, receipt, schema, compatibility, migration, and recovery contracts.
5. Add fail-closed, state-safety, resource, security, and local-operability evidence.
6. Enforce the exact gate in CI and produce an independently verified clean RC.
7. Run the bounded operator pilot.
8. Obtain exact G1 claim acceptance and G2 release authorization.

## Component disposition

- **KEEP:** canonical authority/schema inputs; production comparator; Craft gate state.
- **HARDEN:** TypeScript validation CLI; generic factory as an internal evidence harness; Enum-v1 compatibility precedent.
- **REPLACE:** ignored `dist/` snapshot with clean generated release staging.
- **DEFER:** all authority-none RMT candidates; ontology projections; W3/W4 implementations; cross-language and cross-host breadth.
- **KILL from product/release scope:** all 4,825 cargo-target files.
- **ARCHIVE outside product scope:** run snapshots and receipts under an explicit retention/supersession policy.

## Explicit out-of-scope controls and reopen triggers

- UI/accessibility audit → reopen on supported-UI decision.
- Public distribution → reopen on approved public product route.
- Hosted-service SLOs, central telemetry, backup/deployment → reopen on hosted contract.
- Stable SDK → reopen when module imports become supported.
- SBOM/public license package → reopen on extracted distribution, customer requirement, or threat decision.
- Cross-platform support → reopen when more than one environment is promised.
- Code generation/agent-cost → reopen on product claim.
- Saturn/runtime convergence → reopen on runtime-loop contract.
- Cross-repository inheritance → reopen on approved external consumer.
- Broad formal proof → reopen on a ratified formal-proof obligation.

Claim ceiling: this is a verified read-only lifecycle attack and candidate stabilization route. It grants no semantic authority, implementation conformance, profile admission, promotion, production readiness, publication, release, deployment, or G0/G1/G2 decision.
