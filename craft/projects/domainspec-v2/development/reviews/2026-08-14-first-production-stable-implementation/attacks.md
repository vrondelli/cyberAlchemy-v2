# DomainSpec v2 first production-stable implementation: joined attack ledger

Status: verifier-feedback loop 2 of 2 applied; final coverage-auditor disposition pending

## Direct attack result

The frozen corpus does not contain a current production-stable DomainSpec v2 artifact. It contains useful canonical inputs, candidate-local implementations, discriminating tests, and authority-none receipts, but the stable object, owner contract, current admission chain, exact evidence joins, reproducible release candidate, and operational support boundary are not closed.

This file preserves the three attackers' initial positions and their retry/robot-talk-final positions. It does not average disagreements into a false consensus. The normalized change requests are in `findings.md`.

## Evidence binding and drift

- Frozen manifest: `corpus-manifest.json`, schema `domainspec.review-corpus-manifest.v1`.
- Frozen at: `2026-08-16T11:27:32.697064Z`.
- Corpus: 6,188 files, 1,351,008,277 bytes.
- Aggregate SHA-256: `6d208f20bacc39e124709fd18b2fe93147ccb52bf625833c1efd92afe09afa1a`.
- Manifest SHA-256 at final parent verification: `1c8f1b4b13c9a1ebd821034aad43acb3475350c302459bc888893a1f0cdfc35d`.
- Final drift verification: `PARENT-DRIFT-VERIFY-RECEIPT.json` records exit 0, the expected and current aggregates equal, and empty added, removed, and changed sets.
- Drift claim ceiling: byte identity only. It is not correctness, conformance, semantic admission, production stability, release, or deployment evidence.
- Strategy discovery packet: `strategy-inventory-packet.json`. Its root Inventory was lookup-ready at `2ac0e3538aa1882e2d11fb41fb8a6dfeec945f10cf15c30ea0048de88f8c74b5`, but coverage was partial and no consumer-local DomainSpec v2 index existed. The packet is discovery evidence, not authority.

The runtime attacker explicitly stopped before his final recheck. That omission is preserved as his execution residue. The parent coordinator subsequently ran the exact manifest verifier recorded in `PARENT-DRIFT-VERIFY-RECEIPT.json`; the parent result closes corpus identity for synthesis, not the runtime attacker's own command ledger.

## Execution chronology

| Run | Lane | Result | Evidence use |
| --- | --- | --- | --- |
| `20260816T112917Z-production-stability-review` | Contract/model | Completed with nine substantive attacks | Initial position retained |
| `20260816T112917Z-production-stability-review` | Runtime/mechanics | Native safety refusal before execution | Execution residue only; not substantive review evidence |
| `20260816T112917Z-production-stability-review` | Lifecycle/longevity | Completed with eight substantive attacks | Initial position retained |
| `20260816T114834Z-production-stability-review-retry1` | Contract/model | PASS action receipt; ten attacks | Final position retained, including retry-only CM-R02, CM-R03, CM-R04, CM-R07, CM-R08, and CM-R09 |
| `20260816T114834Z-production-stability-review-retry1` | Runtime/mechanics | Completed with six attacks and executable counterexamples | Final position retained |
| `20260816T114834Z-production-stability-review-retry1` | Lifecycle/longevity | Completed with twelve attacks/controls | Final position retained |

The first runtime refusal stated that the content was flagged for possible cybersecurity risk. It produced no product command, evidence, or finding. The successful bounded retry supersedes it for substantive review, while the refusal remains visible here as orchestration residue.

## Contract/model attack ledger

Raw sources:

- Initial: `orchestration-runs/20260816T112917Z-production-stability-review/raw-returns/spawn-0001.md`.
- Retry/final: `orchestration-runs/20260816T114834Z-production-stability-review-retry1/raw-returns/spawn-0001.md`.

| Raw ID | Severity | Preserved attack | Initial/final relationship | Synthesized request | Original synthesis verifier state |
| --- | --- | --- | --- | --- | --- |
| CM-I01 | CRITICAL | W3 atomic settlement-plus-outbox persistence and W4 rollback-after-publish-failure cannot compose without contradicting state/event truth. | Reconfirmed and sharpened by CM-R04/CM-R05 and an executable runtime timeout probe. | CR-05, CR-06 | Pending |
| CM-I02 | CRITICAL | Six implemented RMT candidates fail current validators or retain stale admission/profile bindings; no all-current admission follows from historical candidate PASS. | CM-R01 and CM-R06 split stale decision state from coverage-model drift; lifecycle final retains a CRITICAL whole-product block. | CR-03, CR-10, CR-11 | Pending |
| CM-I03 | MAJOR | W3/W4 evaluators accept syntactically valid but false SHA-256 bindings. | Reconfirmed by runtime RT-R04; CM-R03 adds open JSON decoding. | CR-07, CR-10 | Pending |
| CM-I04 | MAJOR | Python and Rust W3 evaluators enforce materially less than the TypeScript evaluator. | Reconfirmed by runtime RT-R03 with future-major compatibility divergence. | CR-12 | Pending |
| CM-I05 | MAJOR | Canonical `produces` is not explicitly joined to architecture `architecture.emits`, whose name conflicts with the canonical Operation-to-Event non-example. | CM-R06/CM-R08 broaden this into ontology and canonical-relation trace failure. | CR-11 | Pending |
| CM-I06 | MAJOR | W3/W4 validators depend on a historical TypeScript profile excluded from the frozen corpus. | CM-R07 and RT-R04 show the wider current/historical exact-binding problem. | CR-10 | Pending |
| CM-I07 | MAJOR | Entity/Event/Rule v1 formation schemas accept unknown fields while Operation rejects them, and schema evolution is undefined. | CM-R02 identifies the deeper split between advertised JSON schemas and compiler YAML criteria. | CR-07, CR-08 | Pending |
| CM-I08 | MINOR | Current-named ontology reports contain stale concept/property/relation and realization counts. | CM-R06 raises the operational consequence to MAJOR because ontology, projection, and prose disagree about provider coverage. | CR-11 | Pending |
| CM-I09 | MAJOR | Concrete system-integration contracts remain absent; current evidence closure correctly blocks. | Lifecycle final keeps the boundary excluded from the narrow slice. | CR-16 | Pending |
| CM-R01 | MAJOR | A decision packet still says current PASS after ontology, projection, three language profiles, and enclosing receipt digests drifted despite an explicit stale transition. | Retry-only precision; agrees with CM-I02. | CR-03, CR-10 | Pending |
| CM-R02 | MAJOR | Minted-project formation advertises JSON schemas but the compiler discards body-schema failures and evaluates separate YAML criteria. | Retry-only finding; deepens CM-I07. | CR-08 | Pending |
| CM-R03 | MAJOR | W3/W4 providers `JSON.parse` then cast descriptor/observation arrays without closed member decoding. | Retry-only finding; complements evolution attacks. | CR-07 | Pending |
| CM-R04 | CRITICAL | W3's observation model cannot represent whether the outbox member of an allegedly atomic effect group committed or rolled back. | Retry-only model-expressiveness attack; distinct from cross-wave composition. | CR-05 | Pending |
| CM-R05 | CRITICAL | W4 step bindings do not identify the W3 descriptor/transaction; either W4 rolls back an already durable fact or fails to implement W3 atomicity. | Final form of CM-I01. | CR-06 | Pending |
| CM-R06 | MAJOR | Live ontology, projection, provider corpus, README, and map disagree about implementation coverage and counts. | Final broadening of CM-I02/CM-I08. | CR-11 | Pending |
| CM-R07 | MAJOR | The architecture-realization v2 catalogue still points at mutable live paths with v1-era ontology/profile digests. | Retry-only historical/current proof lookup attack. | CR-10, CR-11 | Pending |
| CM-R08 | MAJOR | The deep `enforces` proof binds a candidate-local relation definition, not the live canonical relationship signature. | Retry-only canonical-authority trace attack. | CR-11 | Pending |
| CM-R09 | MAJOR | Generic strict validation loads candidate UI schemas and active relations whose endpoints are candidate/deferred without a selected maturity profile. | Retry-only stable/development isolation attack. | CR-09 | Pending |
| CM-R10 | MINOR | 4,825 `cargo-target` files dominate the frozen corpus because the confirmed selector excluded `target` but not `cargo-target`. | Agrees with both other final lanes; current freeze remains valid. | CR-17 | Pending |

### Contract/model defended-zero observations

These positive observations are retained and must not be erased by the change requests:

- Canonical active/candidate/deferred/superseded distinctions and the Saga tombstone survived.
- The live ontology explicitly says candidate, authority effect none, and zero promotions.
- All 48 path/digest references embedded in the six live ontology implementation instances resolved.
- The implementation queue has no ready unit; candidate receipts do not claim admission.
- The bounded `enforces` proof has non-vacuous order/count/guard mutants, although its canonical binding is incomplete.
- Missing W3/W4 observations fail closed, candidate receipts retain `authority_effect: none`, and exactly-once delivery is not falsely claimed.
- Production/status sources continue to deny release and production readiness.

## Runtime/mechanics attack ledger

Raw sources:

- Initial refusal: `orchestration-runs/20260816T112917Z-production-stability-review/raw-returns/spawn-0002.md`.
- Retry/final: `orchestration-runs/20260816T114834Z-production-stability-review-retry1/raw-returns/spawn-0002.md`.

| Raw ID | Severity | Preserved attack or residue | Executed evidence | Synthesized request | Original synthesis verifier state |
| --- | --- | --- | --- | --- | --- |
| RT-I00 | n/a | The first native turn stopped on a safety refusal before any bounded check. | None; no mutation. | Execution residue only | Not a finding |
| RT-R01 | CRITICAL | `factory verify` accepts a fabricated three-file run with no request, plan, valid lock, snapshots, nodes, or process evidence. | Verifier returned PASS with `lock_sha256: forged-not-a-digest` and `run_id: forged-run`. | CR-04 | Pending |
| RT-R02 | CRITICAL | W4 compensates persisted state after a publication that succeeded externally but timed out before acknowledgement, producing `published=true` with `persisted=false`. | Timeout-after-success probe reproduced the ghost event. | CR-06 | Pending |
| RT-R03 | MAJOR | TypeScript rejects future major interface compatibility, Python accepts it, and Rust cannot represent the check. | Counterexample returned TypeScript reject versus Python pass; source inspection established the Rust gap. | CR-12 | Pending |
| RT-R04 | MAJOR | W3/W4 binding validation checks digest syntax, not frozen bytes; focused tests pass despite stale TypeScript profile bindings. | All 21 focused TypeScript W3/W4 tests passed while the bound profile digest was stale. | CR-10 | Pending |
| RT-R05 | MAJOR | The full factory suite is red on frozen current bytes because Entity and ValueObject requests bind a stale ontology digest; a legacy Enum request is also stale and unexercised. | Exit 1; 17 files passed, 2 failed; 61 tests passed, 8 skipped. | CR-03, CR-10 | Pending |
| RT-R06 | MINOR | Host-local Rust build caches overwhelm the manifest and make semantic drift checks noisy. | Manifest census: 4,825 files, 1,340,635,926 bytes. | CR-17 | Pending |

### Runtime command receipt

| Check | Result | Interpretation |
| --- | --- | --- |
| Full frozen hash check | Exit 0; no mismatches | Initial byte identity |
| Factory suite with isolated `TMPDIR`, `XDG_CACHE_HOME`, and `CARGO_TARGET_DIR` | Exit 1; 17 files passed, 2 failed; 61 tests passed, 8 skipped | Repository aggregate is not green |
| `python3 -m unittest -v test_w3.py test_w4.py` | Exit 0; 8 passed | Bounded Python fixtures pass, not parity or production |
| `cargo test --locked --offline --test w3 --test w4` | Exit 0; 9 passed | Bounded Rust fixtures pass, not parity or production |
| TypeScript W3/W4 evaluator suites | Exit 0; 21 passed | Focused current expectations pass despite stale/syntax-only bindings |
| Timeout-after-success probe | Exit 0; reproduced `published=true` and `persisted=false` | Executable CRITICAL counterexample |
| TypeScript/Python compatibility probe | Exit 0; reproduced reject versus pass | Executable parity counterexample |
| Forged factory-run verification | Exit 0; verifier returned pass | Executable false-green counterexample |
| Preliminary `tsx -e` timeout probe | Exit 1 due top-level-await wrapper | Superseded command residue; wrapped rerun succeeded |
| Initial factory wrapper | Rejected before execution due recursive temp cleanup | Safety residue; no test or repository mutation |
| Parent final drift verifier | Exit 0; no added/removed/changed files | Post-attacker corpus identity, parent-completed |

The runtime helper left six explicitly named `/tmp` paths for parent-owned cleanup. They are not repository artifacts and are not product evidence.

### Runtime blocked checks

- No exhaustive multi-process lock race, process-kill crash/restart, poison-input, duplicate-delivery, or reorder matrix.
- No cross-host reproduction.
- No individual re-execution of all 41 system-integration files.
- No independent semantic audit of the canonical or production/status families.
- The runtime helper did not run its own final drift check; the parent did so later.

## Lifecycle/longevity attack ledger

Raw sources:

- Initial: `orchestration-runs/20260816T112917Z-production-stability-review/raw-returns/spawn-0003.md`.
- Retry/final: `orchestration-runs/20260816T114834Z-production-stability-review-retry1/raw-returns/spawn-0003.md`.

| Raw ID | Severity | Preserved attack/control | Initial/final relationship | Synthesized request | Original synthesis verifier state |
| --- | --- | --- | --- | --- | --- |
| LON-I001 | CRITICAL | No current G0 release referent binds artifact, commands, environment, owners, compatibility, support, or withdrawal; Craft remains plan/block. | Reconfirmed by F-R01. | CR-01 | Pending |
| LON-I002 | CRITICAL | W3 durable commit and W4 compensation are unjoined. | Reconfirmed by F-R11 and executable runtime evidence. | CR-06 | Pending |
| LON-I003 | MAJOR | The confirmed corpus accidentally includes all `cargo-target` caches. | Final F-R12 lowers direct product severity to MINOR while retaining mandatory future exclusion. | CR-17 | Pending |
| LON-I004 | MAJOR | Canonical, generated, evidence, and lifecycle state are not durably separated; current docs and receipts can describe different frontiers. | F-R02/F-R03 retain the release/admission consequences. | CR-02, CR-03, CR-11 | Pending |
| LON-I005 | MAJOR | Package-manager and install authority conflict: npm scripts, pinned pnpm declaration, npm lock, nested pnpm lock, unresolved esbuild policy, and no frozen CI path. | Reconfirmed by F-R04. | CR-13 | Pending |
| LON-I006 | MAJOR | Persisted schema/API/receipt evolution has no owned migration, rollback, or deprecation policy. | Reconfirmed and deepened by F-R05. | CR-07 | Pending |
| LON-I007 | MAJOR | Frozen dirty-host identity is not clean-checkout rebuildability or cross-host evidence. | F-R02/F-R06 split release anchoring from source/host coupling. | CR-02, CR-13 | Pending |
| LON-I008 | MAJOR | Operability, resource, retention, security, and support boundaries are unbound. | F-R08/F-R09/F-R10 split the control families. | CR-14, CR-15 | Pending |
| F-R01 | CRITICAL | No authorized stable object or accountable owner set exists. | Final form of LON-I001. | CR-01 | Pending |
| F-R02 | CRITICAL | Dirty and stale current evidence cannot anchor a release candidate; Repair-B is historical and 27 accepted entries now drift. | Final precision for release-candidate identity. | CR-02, CR-10 | Pending |
| F-R03 | CRITICAL | No current ontology/meta-type admission; the queue is empty and all 13 active cards remain blocked. | Final precision for semantic realization. | CR-03 | Pending |
| F-R04 | MAJOR | Package, build, dependency, and CI authority conflict and the aggregate gate omits material suites. | Final form of LON-I005. | CR-13 | Pending |
| F-R05 | MAJOR | Persisted factory and engine formats lack complete decoders, supported-reader matrices, migration, and deprecation. | Final form of LON-I006. | CR-07 | Pending |
| F-R06 | MAJOR | TypeScript source execution, sibling-checkout fallback, repository-root derivation, ambient tools, and same-host scope block durable distribution. | Final form of LON-I007's host-coupling branch. | CR-13 | Pending |
| F-R07 | MAJOR | Factory recovery lacks stale-lock metadata/recovery and verification lacks an external anchor. | Agrees with RT-R01 while adding crash residue. | CR-04, CR-14 | Pending |
| F-R08 | MAJOR | Factory snapshots/environment/process observations lack owned threat, secret, sandbox, redaction, and retention rules. | Final security branch of LON-I008. | CR-14 | Pending |
| F-R09 | MAJOR | No supported input/latency/memory/output/disk envelope exists. | Final resource branch of LON-I008. | CR-15 | Pending |
| F-R10 | MAJOR | No owned operator, support, diagnostic-version, compatibility-window, or withdrawal package exists. | Final support branch of LON-I008. | CR-15 | Pending |
| F-R11 | CRITICAL if included | W3 durability contradicts W4 rollback after a later publish failure. | Conditional severity preserved: CRITICAL for a slice that includes W3/W4; excluded from the narrow CLI slice. | CR-06 | Pending |
| F-R12 | MINOR | Generated residue overwhelms evidence selection and must be killed from future source/release manifests, not deleted from the accepted current freeze. | Final calibrated form of LON-I003. | CR-17 | Pending |

### Lifecycle defended controls

- Canonical authority/schema bytes remain useful inputs, not production proof.
- Candidate receipts are retained as historical evidence rather than discarded.
- Atomic staging/rename, no-overwrite, collision locking, caught-error cleanup, content-bound snapshots, and authority-none receipts are worth keeping as internal evidence mechanics.
- The first stable slice may be one explicitly supported environment; cross-platform breadth is an owner decision, not an automatic blocker.
- Hosted-service, public distribution, UI, SDK, central telemetry, and broad formal-proof controls are conditional reopen gates, not mandatory for a bounded private local CLI.

## Preserved disagreements and adjudications

| Tension | Position A | Position B | Synthesis adjudication |
| --- | --- | --- | --- |
| Must W3/W4 be decided before any stable slice is named? | Contract initial says persistence/publication semantics should be selected before naming a first stable slice. | Lifecycle final says a read-only structural CLI can proceed while W3/W4 is excluded. | The narrow CLI candidate may be named, but W3/W4 must be DEFERRED explicitly. Any slice containing runtime Operation/Event/Workflow/StateMachine semantics remains blocked on CR-05/CR-06 and an owner decision. |
| Is missing meta-type admission CRITICAL or MAJOR? | Contract retry classifies individual stale packets/coverage as MAJOR. | Lifecycle classifies absence of whole-plane admission as CRITICAL. | MAJOR as a repair item inside an excluded candidate plane; CRITICAL against any claim that the current architecture/meta-type plane is production stable. CR-03 retains CRITICAL because this review asks about the current whole implementation. |
| Should Python/Rust be fixed or claims narrowed? | Contract/runtime ask for one hostile parity corpus. | Lifecycle recommends excluding Python/Rust from the first slice. | DEFER Python/Rust from the first slice; before reopen, either prove shared behavior or label them syntax/provider witnesses and remove parity claims. |
| Should the generic factory be hardened now? | Contract/runtime find useful mechanics plus critical verifier gaps. | Lifecycle excludes factory commands from the first product surface. | KEEP/HARDEN it as internal evidence infrastructure, but DEFER all factory commands from the first stable user contract. CR-04/CR-14 become reopen gates. |
| Are `cargo-target` bytes invalid evidence? | All lanes call them contamination. | The accepted freeze required them because no confirmed exclusion existed. | KEEP them only as enumerated residue for this run; KILL/exclude them from the next owner-confirmed source/release manifest and rerun the review. No deletion is authorized. |
| Are focused green tests meaningful? | Runtime recorded green Python, Rust, and TypeScript focused suites. | The full factory suite was red and model/binding counterexamples survived. | Preserve the green receipts as bounded fixture evidence; they do not offset the false-green, stale-binding, parity, or repository-aggregate findings. |
| Is the ontology a failed authority? | Coverage prose and projection are stale. | The ontology explicitly says candidate/authority-none and its six embedded instance references resolve. | KEEP its honest authority ceiling; HARDEN/regenerate coverage and current decision joins before using it for discovery or admission. |

## Cross-lane joined attack themes

1. The release referent is missing: no current G0 contract and owner set define the stable object.
2. The current bytes are frozen exactly but are not a clean, reconstructable release candidate.
3. Current semantic admission is absent and stale lifecycle records still look current.
4. The factory verifier can self-attest an incomplete fabricated topology.
5. W3 cannot observe its claimed atomic outbox member.
6. W3 durable commit and W4 compensation conflict under publish ambiguity.
7. Persisted JSON/schema contracts are open or cast and have no owned evolution policy.
8. Formation has two competing authorities and no selected stable maturity profile.
9. Exact path/digest/receipt joins are stale, syntax-only, historical/current-confused, or unresolved.
10. Ontology, projection, canonical relationships, provider inventory, and prose do not form one current model.
11. TypeScript/Python/Rust behavior is not equivalent under hostile inputs.
12. Package manager, lock, build, compiled artifact, CI, and host boundaries are unsettled.
13. Factory mechanisms expose crash, environment, snapshot, secret, sandbox, and retention questions that require an unexecuted resilience/security campaign.
14. A performance, resource, diagnostics, support, pilot, hotfix, and withdrawal envelope is not evidenced by the frozen review corpus.
15. Product system-integration contracts remain deliberately blocked.
16. Generated cache residue obscures the semantic corpus.

## Joined blocked-check ledger

- No reviewed exact G0/R2 binding establishes the shortlist, and no G1/G2 acceptance is available to this review.
- Both independent verifier disposition ledgers are joined; their loop-2 FIX feedback is applied below.
- No final coverage-auditor ACCEPT.
- No clean-checkout/current-CI run for the selected candidate.
- No cross-host reproduction.
- No process-kill crash/recovery matrix or multi-process lock-race matrix.
- No malformed/future-version campaign for every persisted factory format.
- No full duplicate/poison/reorder/retry W3/W4 campaign.
- No current dependency vulnerability or SBOM audit.
- No resource benchmark or oversized-input campaign.
- No independent operator pilot or support/withdrawal drill.
- No owner-selected W3/W4 persistence/publication semantics.
- No current product-level system-integration target/admission.
- Inventory coverage remains partial and non-authoritative.

## Verifier disposition register

Canonical receipts:

- Popper/counterexample: `receipts/verifier-counterexample.json`; action PASS, review verdict FIX, 10 KEEP / 7 FIX / 0 DROP.
- Meadows/system boundary: `receipts/verifier-system-boundary.json`; action PASS, review verdict FIX, 12 KEEP / 5 FIX / 0 DROP.
- Raw returns: `orchestration-runs/20260816T114834Z-production-stability-review-retry1/raw-returns/spawn-0005.md` and `spawn-0006.md`.
- Both receipts bind corpus aggregate `6d208f20bacc39e124709fd18b2fe93147ccb52bf625833c1efd92afe09afa1a`. Popper recorded no target drift; Meadows bound the original synthesis hashes and manifest hash.

| Request | Popper executable-counterexample verifier | Meadows scope/authority/evolution verifier | Loop-2 writer disposition |
| --- | --- | --- | --- |
| CR-01 | FIX | KEEP | FIX: narrowed repository-wide absence language while preserving release block |
| CR-02 | KEEP | KEEP | KEEP |
| CR-03 | KEEP | KEEP | KEEP |
| CR-04 | KEEP | KEEP | KEEP |
| CR-05 | KEEP | FIX | FIX: separated closed observation representability from provider persistence/crash proof |
| CR-06 | KEEP | KEEP | KEEP |
| CR-07 | FIX | FIX | FIX: partitioned version/owner gates by CLI, factory, minted, W3, and W4 |
| CR-08 | FIX | FIX | FIX: required declared two-stage composition and stage-specific diagnostics; retained external profile admission |
| CR-09 | FIX | FIX | FIX: removed un-reverified loader count and added unknown/expanded-profile fail-closed gates |
| CR-10 | KEEP | KEEP | KEEP |
| CR-11 | FIX | FIX | FIX: preserved separate owners and authority direction; labeled subclaim evidence classes |
| CR-12 | KEEP | KEEP | KEEP |
| CR-13 | KEEP | KEEP | KEEP |
| CR-14 | FIX | KEEP | FIX: kept executable anchor defect in CR-04 and recast other controls as an unexecuted campaign |
| CR-15 | FIX | KEEP | FIX: narrowed absence claim to the frozen review corpus |
| CR-16 | KEEP | KEEP | KEEP |
| CR-17 | KEEP | KEEP | KEEP |

### Feedback edge: loop 2 of 2

The exact feedback edge is `feedback/loop-2-synthesizer-prompt.md`. It required no new finding and authorized edits only to this file and `findings.md`.

- CR-01 now says no reviewed exact G0/R2 binding establishes the proposed slice; corpus non-selection is not repository-wide absence.
- CR-05 now distinguishes what a closed evaluator fixture can establish from independent provider/database fault-and-restart evidence.
- CR-07 now has surface-specific version matrices and owner gates; only selected CLI boundaries gate the candidate shortlist.
- CR-08 now requires compiler acceptance to equal the declared shape-schema plus semantic-criterion composition with stage-specific diagnostics. Neither verifier claimed to rerun that contradiction.
- CR-09 no longer relies on an un-reverified UI-loader count and adds unknown/new meta-type, relation, endpoint-maturity, and profile-expansion gates.
- CR-11 now keeps canonical definitions, selected profiles, provider registrations, and authority-none views under separate owners and labels which detailed subclaims were attacker-recorded rather than verifier-rechecked.
- CR-14 leaves the executable external-anchor defect in CR-04 and treats crash, environment, secret, sandbox, and retention work as a required unexecuted campaign.
- CR-15 now says the operator/resource/support envelope is not evidenced by the frozen corpus.
- The proposed two-command CLI is now a candidate shortlist, not a proved minimum or current coherent artifact. Its current exit, path fallback, source execution, and profile-admission defects are explicit.

Both verifiers marked the minimum-slice language FIX, not DROP. The revised shortlist remains blocked on owner selection, implementation, clean proof, independent operator pilot/support handoff, and final audit.

## Claim ceiling

This ledger proves only that three bounded attacker lanes joined over an unchanged frozen corpus and produced the recorded attacks, command results, defended controls, disagreements, and gaps. It does not implement a fix, select an owner-gated contract, admit a profile or meta-type, establish cross-language parity, accept the candidate findings, or establish production readiness, publication, release, or deployment.
