---
artifact: execution-pack
proposal: candidate-a
status: selected-applied-blocked-on-audit
complexity: high
parallelism: none
automatic_successor: false
---

# Candidate A One-Shot Execution Pack

## Control Sequence

The control sequence uses `EVF-PKG-TOPOLOGY-001 /
EVF-PKG-B-EVIDENCE-ONLY`; material envelopes are run-local evidence.

```text
G0 owner selects A [PASS]
  -> G1 Invoke authors/validates/applies 23 owned planning + 11 owner-material targets [PASS],
        including the exact selection-ready canonical entry; Work Pack is blocked-on-audit
  -> G2 independent reviewer accepts the exact 34-target applied corpus and creates audit target 35
  -> G3 Implementation Readiness classifies the exact conditional route
  -> G4 Task Session admits 18 implementation + 21 evidence + P/O/T paths
  -> ICR-S1-001 -> 002 -> 003 -> 004 -> 005 -> 006 -> 007
  -> E -> P -> delegated Invoke O -> Task Session T
  -> continuity cursor; successor_executed:false
```

Each arrow is fail-closed. No phase is speculative, parallel, or best-effort.

## Wave Schedule

| Wave | Owner | Work | Entry gate | Exit evidence | On failure |
| --- | --- | --- | --- | --- | --- |
| G0 | semantic owner | select exact A/B/C route | Refine result complete | `DEC-GCP-001-R1:option-a` direct selection | passed; no inferred A |
| G1 | Invoke Refresh | author exact postimages; stage/validate/apply 23 Invoke-owned planning and 11 byte-bound material targets, including canonical entry from the reviewed selection-ready postimage | A selected; explicit apply authorization; all live baselines match | 34-target applied/result inventory plus run-local material-package producer receipt; Work Pack `blocked-on-audit` | rollback only if exact/reversible/authorized; preserve evidence; never invoke Implementation Readiness before G2 |
| G2 | independent reviewer | attack the exact 34-target applied corpus and claim ceiling, then create the independent audit target | G1 receipt and all exact refs | target 35, `CURRENT-PLAN-AUDIT.json`, accepts the non-self-referential corpus | Invoke repair and renewed exact-byte review |
| G3 | Implementation Readiness | rehash/revalidate the unchanged already-audited entry, resolve all required inputs, and classify its route digest | G2 accept and audit target present | current classification receipt | retain blocked classification; never mutate entry without a fresh audit |
| G4 | Task Session | context build, governance, admission, ticket, and one consumed attempt | G3 route; no drift; exact P/O/T absent | mutation-admission receipt and execution ticket | exit 2; no implementation write |
| W1 | Task Session | execute one atomic SWU through seven ordered seams | G4 consumed admission | executor and validation receipts; acceptance vector | earliest stable code; no positive receipt; no later seam |
| C1 | Task Session -> Invoke -> Task Session | emit P, join O, emit T, observe, emit cursor | W1 pass | exact P/O/T refs; `successor_executed:false` | terminal block/flag with residue; no successor |

## Parallelization Boundary

There is no implementation fan-out. The seams share types, IDs, digests, and a single acceptance vector; parallel workers would create merge and attribution ambiguity across acceptance-bound files. The only delegated owner transition is the prescribed closeout join from P to Invoke O and back to Task Session T.

## Retry And Resume

- No automatic product retry is declared.
- A repairable owner condition requires a new exact preflight; changed semantic/acceptance bytes create a new candidate and review.
- A resumed Task Session must bind the same route and attempt ownership rules, then consume a new admitted attempt only if the owner contracts allow it.
- `attempt-001` P/O/T collisions are drift, never overwrite targets.

## Stop Boundary

Stop for any semantic choice, scope expansion, destructive/irreversible action, secret or network effect, cost/risk acceptance, authority/promotion/publication/deployment request, or acceptance-critical validation failure. Do not start repeatability, graph laws, BTE, IOLM, breadth, release, or production work.
