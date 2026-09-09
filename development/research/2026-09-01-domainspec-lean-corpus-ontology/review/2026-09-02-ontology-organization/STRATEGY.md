# Lean corpus ontology organization review strategy

Status: closed — `loop_ceiling_reached`; coverage audit failed  
Dispatch type: review  
Selected route: `CA2-ROUTE-DELEGATE`  
Target ontology: `CA2-ONTOLOGY-CANDIDATE-DOMAINSPEC-LEAN-CORPUS-2026-09-01` (`unregistered`, `research-candidate`)  
Authority effect: none

## P1 trigger decision

Dispatch is warranted by synthesis across eight findings and twelve sources, isolation of speculative organization proposals, independent verification of Lean and authority claims, and parallel mechanics/semantics/ownership attacks.

## Lanes and subagents

| Group | Agents | Purpose | Anti-bias axis | Scheduling |
| --- | --- | --- | --- | --- |
| `attackers` | Abramsky, Samson; Peirce, Charles Sanders; Yanofsky, Noson | Attack mechanics, semantic fidelity, and ownership/reference integrity across the full corpus. | `methodology` | Three agents in parallel, followed by robot talks. |
| `synthesizer` | Riehl, Emily | Dedupe and rank cited change requests into a proposed ontology organization. | Singleton | Sequential after attackers; exchanges with verifiers. |
| `verifiers` | Gödel, Kurt; Hacking, Ian | Refute unsupported formal entailments and authority promotion. | `attack-vector` | Two agents in parallel after the first synthesis. |
| `coverage-auditor` | Loregian, Fosco | Check promised corpus coverage, dropped refutations, and zero-findings behavior. | Singleton | Sequential after verifier convergence. |

All names resolve in `telemetry/agents/agent-pool.yaml`. Every working agent uses `gpt-5.6-sol` with a finite token budget declared in `dispatch-sheet.json`.

## Dependency flow

```text
attackers --sequential--> synthesizer --zig-zag(2)--> verifiers
    ^                         |
    +------feedback(1)--------+

verifiers --sequential--> coverage-auditor --> parent final approval
```

Required review outputs are `attacks.md` and `findings.md`. The review produces verified change requests, not ontology mutations. Applying accepted requests is a separately routed and authorized task.

## Inventory preflight

`strategy-inventory-packet.json` records `machine_index_gap`: the machine index parses but fails current lookup-readiness and predates the ontology candidate. Human-index fallback selected the layer-map, exact-path/frozen-evidence, and gaps records. Migration-only records were excluded. The packet is discovery-only, so agents must quote and verify current target bytes.

The post-result Inventory hook is unresolved: the existing machine index cannot pass its current contract. This review will preserve that gap and will not silently repair or extend the Inventory package.

## Gate and ledger state

- Live schema: `0.10.0` from the repo-local owner; the generated global `0.8.0` copy is not the active owner.
- Candidate sheet: persisted without `evidence_binding`; SHA-256 `b808fd2b19970d11b5f570c2d6f4f506e6ebb7a17d9ea706e644a29287b28bdc`.
- Confirmation readiness: PASS with `LEDGER_READ=none` and `LEDGER_MUTATION=none`.
- Material strategy: `domainspec.material-strategy.v3`, SHA-256 `12579ad067022b0eaffdad1b2b124cf064f4ce6f9c46bc12401d7e94a2f29b25`.
- Check-tension: independent checker PASS and reviewer PASS on the exact sheet digest.
- Preconfirmation closure: PASS with zero blockers, first nonzero `0`, and spawn-attempt count `0`.
- Human confirmation: received for the exact frozen material strategy.
- Registration: appended through the governed runtime as dispatch `2026-09-02-lean-corpus-ontology-organization-review`.
- Execution: seven declared agents ran; three attackers completed robot talks, one writer synthesized, two verifiers converged after two permitted exchanges, and one coverage auditor audited the frozen result.
- Verifier result: PASS/PASS on final `findings.md` SHA-256 `a3e758a5f5319c19ebac9f89602021979d682a2ddb709cc275b6cafcc12f7a33`; all eleven change requests survive.
- Coverage result: FAIL. Seven source IDs, seven invariant IDs, and six gap IDs lack explicit per-record dispositions in `findings.md`; aggregate coverage language was insufficient.
- Final approval: withheld. The graph has no auditor-to-writer repair edge, so the omission was preserved instead of extending the confirmed graph.
- Closeout: governed close appended with `exit_reason: loop_ceiling_reached`; seven agents, two loops, close content digest `083ce65b2f8eff9a588c4c4167fcbe6be0f60f93c2efde8db4ffdc947878a5a0`.

## Stop conditions

Stop on failed readiness, failed or disagreeing tension verdicts, failed preconfirmation closure, material strategy change without reconfirmation, missing source binding, owner/admission decision, scope expansion, publication/deployment, destructive action, or any external effect.

## Continuation residue

A new bounded review continuation must explicitly authorize a writer repair from the coverage-audit result and a fresh coverage audit. It should add per-record dispositions for the seven omitted source IDs, seven omitted invariant IDs, and six omitted gap IDs listed in `attacks.md`. The existing ontology candidate remains unchanged, unregistered, owner-unselected, and non-authoritative.
