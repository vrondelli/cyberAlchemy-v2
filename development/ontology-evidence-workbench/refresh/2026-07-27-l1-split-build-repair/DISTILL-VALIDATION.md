# Distill Validation — OEW L1 Split-Build Repair

Mode: Standard (default assumption; no alternate budget selected)  
Role path: local Proposer/Balancer simulation; no subagents authorized  
Rounds: 2 of 2  
Result: pass for Plan coherence; implementation remains unselected

## Objective and Output

Reduce build-order option A to the smallest graph that proves early
materialization mechanics and still binds final feature bytes before browser
acceptance. Output: an owner-complete private SWU graph and fresh selection
handoff.

## Round 1 — Proposer

Redefine 006B as a provisioner, keep 007–013, and add one final build/verifier
between 013 and 014.

## Round 1 — Balancer Objections

| Category | Objection | Reconciliation |
| --- | --- | --- |
| selector identity | 006B is already consumed; redefining it obscures history and repeats a cursor | retain 006B unchanged as historical; introduce 006P |
| input ownership | a provisioner still cycles if its patch is owned by 007 | give 006P a self-owned fixture manifest and patch probe |
| temporal closure | 014 must not consume any pre-feature handle | introduce 013B after 013 and depend 014 on it |
| target overlap | repeated `package.json` ownership obscures who registers runtime commands | 006P alone owns the existing package script registry; 013B owns scripts/contracts/evidence only |
| authority split | producer verification can become circular | toolchain and final-build handles each require a distinct verifier process |
| authorization | current A chooses architecture, not the exact new selector | invalidate selection and route to a fresh gate |

## Round 2 — Reconciled Shape

```text
historical 006B BLOCK (immutable)

006P toolchain/materializer proof
  → 007–013 feature source
  → 013B final clean build + distinct verifier
  → 014 browser producer
  → 014V browser acceptance verifier
```

## Smallest Coherent Units

- 006P owns exact tools, effective lock, fresh workroot, self-owned fixture
  patch mechanics, cleanup, and toolchain verification.
- 013B owns the final source-to-build temporal closure and independently
  verified immutable build handle.

Merging them recreates the pre-feature build problem. Splitting either further
would separate one temporal producer/verifier decision without reducing risk.

## Recomposition Proof

The verified 006P handle supplies reproducible materialization mechanics to
feature work. The complete 007–013 overlay is then the exact source input to
013B. Only the verified 013B handle reaches browser production, and 014V
recomputes its browser binding. Removing either new unit breaks a named proof;
retaining both recomposes the requested L1 interface without changing L0.

## Premortem

| Failure | Earliest signal | Guard |
| --- | --- | --- |
| provisioner accidentally claims feature readiness | toolchain schema contains output-build fields | schema and receipt ceiling reject final-build claims |
| final build uses stale overlay bytes | manifest digest differs from 007–013 targets | 013B binds complete overlay pre/postimages |
| package scripts drift across SWUs | package target appears in 013B | owner-unique target check |
| old cursor resumes | selected SWU or visited selector is non-null | new chain begins unselected with empty visited set |

## Technique Trace

- abstraction-level guard: stayed at SWU lifecycle, not individual script
  functions;
- recomposition proof: pass;
- evolution profile: upstream/feature growth remains behind the final overlay
  manifest;
- cognitive-load check: two named build interfaces, no per-feature handle
  chain;
- premortem: applied because the prior graph passed planning but failed
  preflight;
- frame expiry: upstream pin, tool lock, overlay ownership, graph, or authority
  changes invalidate this result.

## Navigation

Start at `SWU-OEW-006P` only after
`G-OEW-L1-SPLIT-BUILD-SELECTION`. The candidate frontier is eleven units.
Historical 006B remains evidence, not a candidate. Next route:
`decision-gate`.

Evidence emission: not configured; non-authoritative planning artifacts and
receipts are retained. Caller owns Invoke observability closeout.
