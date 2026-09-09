# Constitution Foundry development-package candidate synthesis

Status: verifier input only; findings are not final until the two verifier passes and final audit complete.

Target: `cyberAlchemy-v2/development/refinement-runs/20260806T184230Z-constitution-foundry-architecture/`

Coverage: all 63 package artifacts inspected against current bytes. The package target remained read-only.

## Candidate package verdict

- Architecture coherence: **KEEP with bounded fixes**. Preserve Author -> Prove -> Decide -> Cast; source/IR separation; directional partial translation; backend-native status preservation; obligation aggregation; orthogonal case projections; two-act authority; Mint-only target effects; installation/observation separation; L1 attestation ceiling; and self-standing interpretation.
- Formal claim soundness: **FIX** because the S06 pass is misbound and the S08 unique-outcome claim exceeds its oracles.
- Execution-plan safety: **BLOCK implementation entry pending FIX** because the whitelist omits machine prerequisite gates, ends before W5, and leaves shared closeout state unprotected.
- Owner admission: **ABSENT**. A generic Decision Gate is not exact constitution/authority/runtime/data-owner acceptance.
- Runtime evidence: **ABSENT by explicit package claim**. No solver, Mint apply, target mutation, runtime, owner decision, attestation installation, promotion, publication, deployment, release, or production proof exists.

## Candidates for verification

### CF-REV-001 - severity disputed: CRITICAL or MAJOR

Executable routes do not encode the prerequisite state machine. `stages/S09-EXECUTION-ENTRY.json:/execution_policy/route_policy` is `automatic-in-scope`; the SWU-001 execute route omits the owner-entry receipt, later execute routes omit predecessor terminal/closeout receipts, and all 19 closeouts share Work Pack/manifest targets without serialization or CAS. Fix with digest-bound owner and predecessor readiness predicates plus serialized/CAS closeout updates. Shannon and Turing argue CRITICAL; Beer argues MAJOR because nothing executed and prose retains the prerequisite.

### CF-REV-002 - MAJOR

Seven frozen dispatch references do not resolve. `REFINE-DISPATCH.json` names absent S03, S05, S06, S08, S10, and S01 Context Builder artifacts, while receipts substitute different names without deviation/supersession evidence. Restore exact artifacts or publish one explicit supersession map and refresh every dependent selector, digest, receipt, manifest, and Result reference.

### CF-REV-003 - MAJOR

S06 design selection passes on a pre-design readiness signal. `S06-DESIGN-SCOPE-MANIFEST.json:/acceptance_and_readiness_claims/0/source_selector` points to S05 while marking the design authored-complete; actor and unknown denominators are empty, yet the selection result claims validator pass and fixed point. Rebuild evidence from current S06 selectors and regenerate the dependent S06 evidence chain.

### CF-REV-004 - MAJOR

The S08 reference fixture contradicts its unique typed-outcome claim: negative cases 1 and 7 permit disjunctive results (`translation-error-or-stale`, `recovered-or-manual-never-installed`) while the prose claims 12/12 unique outcomes. Split conditional fixtures so each has one exact expected result and bind executable descendants to exact subject/artifact digests.

### CF-REV-005 - MAJOR

SWU-CF-001 cannot create its declared proof within scope. Its validation invokes `test_case_schema.py`, but its write scope owns only the schema and fixture directory. Add the exact test path to owned scope and route, or bind a pre-existing validator by identity.

### CF-REV-006 - MAJOR

SWU-CF-002 accepts a parsed JSON value yet promises to reject duplicate keys at the parse boundary; ordinary parsing has already discarded duplicate-key occurrence. Move rejection to raw bytes/pairs-preserving parsing or assign it to an explicit parser contract.

### CF-REV-007 - MAJOR

Mint crash recovery lacks a durable attempt-journal contract. The task requires interruption before/after every effect, but SWU-012 owns no journal schema/path and defines no write-before-effect ordering, stable effect identity, persistence/atomicity ceiling, replay, or idempotency rule. Add a fixture-local durable write-ahead journal contract and crash-point fixtures.

### CF-REV-008 - MAJOR

The machine route chain ends after SWU-CF-019 closeout even though the Work Pack succeeds to TASK-CF-VERIFY/W5. Add an explicit non-mutating W5 verification route with required inputs, receipt, and continuation/closeout rule.

### CF-REV-009 - MAJOR

The package substitutes `decision-gate:generic` for exact owner acceptance across protocol, authority subjects, repository root/language, fixture posture, and sink exclusion, while the Work Pack admits the exact owner/subject model is unadmitted. Use Decision Gate only to resolve options; require separate typed, digest-bound acceptance artifacts from each exact owner.

### CF-REV-010 - MAJOR, retention disputed

SWU-CF-013 combines pre/post attestation integrity and cold self-standing interpretation in one behavior, write scope, and test, despite separate owner/proof domains. Split these proofs and recompose later. The task defends them as one installed-subject witness; verifiers must decide whether the owner boundary requires a split.

### CF-REV-011 - MAJOR, retention disputed

SWU-CF-019 combines semantic, recovery, security, resource, and privacy families while claiming zero task-shaped units. Split semantic/recovery from security/resource/privacy and join at W4. Shannon and Beer retain; Turing argues a single layer-exit matrix is coherent.

### CF-REV-012 - MAJOR or MINOR, severity disputed

All SWU source anchors are unresolved aliases such as `S08#Repair-1`, `S07#DR-01`, and `formal-semantics-receipt#R-FSB-02`; the manifest contains no path/selector/digest resolver although Context Builder must consume them. Bind exact path, selector, and digest, or a versioned resolver. Candidate severity is MAJOR; attackers also considered MINOR because aliases are human-readable within this run.

### CF-REV-013 - MINOR

S08 says both ten and twelve negative mutations. Correct the denominator to twelve and refresh dependent counts/receipts.

### CF-REV-014 - MINOR

W1 calls candidate L0 receipts `Promotion evidence` while immediately denying target mutation and real authority. Rename this to layer-exit candidate evidence or input to a later promotion-owner decision.

## Dropped during synthesis

- Symbolic fixture digests/owner: explicitly simulated.
- Historical `authoritative report` wording: superseded by later current artifacts.
- S06/S09 layer-number reuse: no demonstrated semantic failure.
- Closeout concurrency as a separate item: deduplicated into CF-REV-001.

## Complete artifact matrix

| # | Artifact | Verdict | Candidate |
|---:|---|---|---|
| 1 | `REFINE-DISPATCH.json` | FIX | 002 |
| 2 | `REFINE-SEED-PROPOSAL.md` | KEEP | - |
| 3 | `RESULT.md` | FIX | 001, 008, 009 |
| 4 | `RUN-MANIFEST.md` | KEEP | - |
| 5 | `RUNTIME-HANDOFF.md` | KEEP | - |
| 6 | `context-builder/context-pack.json` | KEEP | - |
| 7 | `context-builder/context-pack.md` | KEEP | - |
| 8 | `context-builder/runtime-handoff-index.json` | KEEP | - |
| 9 | `evidence-index.json` | KEEP | - |
| 10 | `receipts/S01.json` | KEEP | - |
| 11 | `receipts/S02.json` | KEEP | - |
| 12 | `receipts/S03.json` | FIX | 002 |
| 13 | `receipts/S04.json` | KEEP | - |
| 14 | `receipts/S05.json` | FIX | 002 |
| 15 | `receipts/S06.json` | FIX | 003 |
| 16 | `receipts/S07.json` | KEEP | - |
| 17 | `receipts/S08.json` | FIX | 004, 013 |
| 18 | `receipts/S09-EXECUTION-ENTRY-VALIDATION.json` | FIX | 001, 008 |
| 19 | `receipts/S09.json` | FIX | 001, 005-012 |
| 20 | `receipts/S10.json` | FIX | 002, 009 |
| 21 | `receipts/dispatch-validation.json` | KEEP | structural pre-run pass only |
| 22 | `receipts/formal-semantics-boundary-reviewer.json` | KEEP | - |
| 23 | `stages/S02-INVOKE-DEFINE.md` | KEEP | - |
| 24 | `stages/S03-INTERROGATION-REVIEW.md` | KEEP | historical residue defended |
| 25 | `stages/S04-RESEARCH-DECISION.md` | KEEP | - |
| 26 | `stages/S05-DISTILL.md` | KEEP | architecture retained |
| 27 | `stages/S06-AUTHORED-CONCERNS.json` | KEEP | - |
| 28 | `stages/S06-DESIGN-DENOMINATOR-RECEIPT.json` | FIX | 003 |
| 29 | `stages/S06-DESIGN-SCOPE-MANIFEST.json` | FIX | 003 |
| 30 | `stages/S06-DESIGN-SELECTION-RESULT.json` | FIX | 003 |
| 31 | `stages/S06-DESIGN-TRANSPORT.md` | FIX | 003 |
| 32 | `stages/S06-GLOSSARY-CONSISTENCY.md` | KEEP | - |
| 33 | `stages/S06-IMPLEMENTATION-LAYERING-SEED.md` | KEEP | - |
| 34 | `stages/S06-INVOKE-DESIGN.md` | FIX | 007 journal detail only |
| 35 | `stages/S06-PLANNED-WITNESSES.json` | KEEP | explicitly unexecuted |
| 36 | `stages/S07-INTERROGATION-DESIGN-REVIEW.md` | KEEP | - |
| 37 | `stages/S08-DISTILL-REPAIR.md` | FIX | 004, 013 |
| 38 | `stages/S08-REFERENCE-CASTING-FIXTURE.json` | FIX | 004 |
| 39 | `stages/S09-DISTILL-VALIDATION.md` | FIX | 005, 006, 010, 011 |
| 40 | `stages/S09-EXECUTION-ENTRY.json` | FIX | 001, 008, 009, 010, 012 |
| 41 | `stages/S09-EXECUTION-PACK.md` | FIX | 001, 008 |
| 42 | `stages/S09-IMPLEMENTATION-LAYERING.md` | FIX | 010, 011 |
| 43 | `stages/S09-INVOKE-PLAN.md` | FIX | 001, 008, 009 |
| 44 | `stages/S09-MINT-AUDIT-MAPPING.md` | KEEP | mapping ceiling retained |
| 45 | `stages/S09-PLAN-CONTEXT.md` | FIX | 009 |
| 46 | `stages/S09-PLAN-TRANSPORT.md` | KEEP | - |
| 47 | `stages/S09-SWU-MANIFEST.json` | FIX | 005-007, 010-012 |
| 48 | `stages/S09-WORK-PACK.md` | FIX | 001, 008, 009, 012 |
| 49 | `stages/S10-FINAL-INTERROGATION.md` | FIX | 002, 009 |
| 50 | `stages/work-pack/tasks/TASK-CF-AUTHORITY.md` | KEEP | owner-artifact separation retained |
| 51 | `stages/work-pack/tasks/TASK-CF-BACKENDS.md` | KEEP | backend ceilings retained |
| 52 | `stages/work-pack/tasks/TASK-CF-CORE.md` | FIX | 005, 006 |
| 53 | `stages/work-pack/tasks/TASK-CF-MINT.md` | FIX | 007, 010 |
| 54 | `stages/work-pack/tasks/TASK-CF-REFERENCE.md` | FIX | 011 |
| 55 | `stages/work-pack/tasks/TASK-CF-RUNTIME.md` | KEEP | - |
| 56 | `stages/work-pack/tasks/TASK-CF-SEMANTICS.md` | KEEP | - |
| 57 | `stages/work-pack/tasks/TASK-CF-VERIFY.md` | KEEP | content sound; route defect elsewhere |
| 58 | `stages/work-pack/waves/W0.md` | FIX | 009 |
| 59 | `stages/work-pack/waves/W1.md` | FIX | 014 |
| 60 | `stages/work-pack/waves/W2.md` | KEEP | - |
| 61 | `stages/work-pack/waves/W3.md` | KEEP | - |
| 62 | `stages/work-pack/waves/W4.md` | KEEP | - |
| 63 | `stages/work-pack/waves/W5.md` | KEEP | content sound; route defect elsewhere |

