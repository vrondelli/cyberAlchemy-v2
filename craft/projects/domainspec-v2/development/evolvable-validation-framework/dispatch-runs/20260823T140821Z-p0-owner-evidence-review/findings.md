# EVF L3 P0 owner-evidence review findings

## Direct current-state answer

The three evidence calls ran concurrently and all agents terminated, but P0 remains blocked. The BTE output set is wholly absent, no exact IOLM DSC-A owner receipt locator was established, and all five dirty-baseline dispositions remain owner decisions. The dirty-byte evidence is current and exact. Orchestrate correctly reduced the wave to `gate_block` because the BTE action returned `status=block`.

The run also exposed a governance-only runtime defect: the confirmed sheet carried detailed lane prompts, but the capability-bound `DISPATCH.json` and compiled host actions did not bind those prompts. The native requests therefore carried only role, target, scopes, and input/output refs. That caused incomplete BTE/IOLM audit behavior and prevents this run from being accepted as the promised full review.

## Per-artifact findings

| # | File or surface | Evidence | Severity | Proposed fix | Verdict |
|---|---|---|---|---|---|
| F-01 | `BTE-FREEZE-ADMISSION-CATALOGUE-REQUEST.json` response surface | Parent recheck found all 11 distinct expected output paths absent; spawn-0001 independently confirmed the request shape and returned `block`. | MAJOR | Each named BTE owner independently authors its response-contract-compliant output; then rehash all 11 paths. | KEEP request; owner outputs missing |
| F-02 | `IOLM-DSC-A-PREREQUISITE-REQUEST.json` response surface | The request locator is null. Repository-local filename/content search found planning references but no exact passing DSC-A receipt locator. spawn-0002 preserved the owner boundary but did not complete the promised locator/provenance search. | MAJOR | The private IOLM product owner supplies either the exact passing DSC-A receipt or a separate decision changing the predecessor. | KEEP request; owner response missing |
| F-03 | `DIRTY-BASELINE-CLASSIFICATION-REQUEST.json` | spawn-0003 and parent rehash agree on five modified live hashes and one clean-equals-HEAD target; all five `owner_decision` values remain null. | MAJOR | BTE implementation/aggregate owners return one adopt-or-reconcile decision per target, bound to the current live hash and size. | KEEP request; decisions missing |
| F-04 | `CONTINUATION-ROUTE-RESULT.json` | Candidate evidence says all four requests are hash-bound, but the JSON carries paths only and no request digest tuples or aggregate-binding recipe. The companion Markdown has a table, but the JSON does not bind that companion. | MAJOR | Issue new candidate continuation bytes with explicit request path/SHA-256/size bindings or an exact digest-manifest locator; do not alter the accepted result in place. | FIX candidate |
| F-05 | Dispatch-sheet to Orchestrate prompt bridge | `dispatch-sheet.json` contains detailed `initial_prompt` fields; compiled actions and `host-requests/spawn-000*.json` contain only role/target/scope/input/output fields. BTE returned action-level `block`; IOLM treated a forbidden-write scope as a forbidden-read scope and skipped promised evidence. | MAJOR | Add a validator-enforced briefing binding from every confirmed sheet agent to its capability-bound action/host request, with a hostile regression proving status semantics and read-vs-write scope survive compilation. | FIX workflow |

## Owner packets

### BTE

- Expected outputs: 11.
- Present outputs: 0.
- Required next act: independently authored freeze/admission/catalogue responses from their named owners.
- Authority effect of this review: none.

### IOLM DSC-A

- Exact response locator remains unresolved.
- Permitted next acts: owner-supplied passing DSC-A receipt, or owner decision changing the predecessor.
- DSC-B and P0 remain blocked.

### Dirty baselines

| Target | Current live SHA-256 | Owner decision |
|---|---|---|
| `projects/domainspec-v2/impl/package.json` | `f5d68ea28ab2442307b3a608d184dbd8d877c54436cf5c2b700ad73f2b141692` | pending |
| `projects/domainspec-v2/impl/test-derivation-engine/src/bte/development-engine.ts` | `18b9869d40022e12337fe329efd7bef5ddadab61b08de3c49ff2ef744ea9bf25` | pending |
| `projects/domainspec-v2/impl/test-derivation-engine/src/bte/development-engine.test.ts` | `c4305293e9554af22a6e191a98b6dfc044cbdbe48f0058da97ab1f4c7be992e1` | pending |
| `projects/domainspec-v2/impl/test-derivation-engine/src/bte/development-fixture.ts` | `5a9d2108044174bdc32b9b3de63b7eb6f828702028a0ae96a0bcbe8500fd272e` | pending |
| `projects/domainspec-v2/impl/test-derivation-engine/src/bte/development-pipeline.test.ts` | `df02bcd88e158138b5d78e5eeac2e94cc1d9b2a10a0395b8251b4a1eb43cd180` | pending |

The corrected clean target `development-pipeline.ts` remains SHA-256 `07001eb4e78039fb6293fb425cd02a232e85a72938c4fd18e50bf2ef0fbf895b` and is not an owner-decision target.

## Final-approver disposition

Parent verification accepts the factual dirty-baseline packet, the 11-path BTE absence check, and the bounded continuation consistency finding. It does not accept this run as full completion of the promised BTE/IOLM evidence review because the runtime prompt bridge omitted the confirmed lane briefings. No refuted finding was retained. The correct dispatch outcome is `error`, with zero downstream actions and a governance-defect sidecar route.

## Claim ceiling

This review proves only current evidence locations, absences, hashes, and workflow residue. It does not supply an owner response, admit a profile or relationship set, decide a dirty baseline, accept or apply proposal bytes, grant readiness, select U1, authorize Task Session, promote, publish, release, deploy, or establish production readiness.
