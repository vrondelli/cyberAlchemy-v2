# TASK-OCGP-EVIDENCE-001 — Reproducible Evidence and Isolation

Layers: L1 and L2  
Status: implementation in progress; `SWU-OCGP-006` complete, `007` next  
Parent work pack: `WP-OCGP-001`

## SWU-OCGP-006

Primary behavior: write one canonical, create-only run bundle and write its
terminal receipt last.

Dependencies: passing receipts for `001–005`.

Execution owner recommendation: Task Session.

Exact future write scope:

- `cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/src/evidence/canonical-json.mjs`
- `cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/src/evidence/run-writer.mjs`
- `cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/src/cli.mjs`
- `cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/test/run-writer.test.mjs`
- `cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/package.json`
- exact terminal/session/owner receipt paths from the manifest

Write only inside a previously absent exact run directory. Canonical result,
projection, digest map, and terminal receipt have independent versions. Refuse
an existing directory; use exclusive create; publish the receipt only after all
other files are durable. Run metadata may contain identity/time but cannot
enter compared canonical bodies.

Expected result shape: the Execution Pack result envelope plus a run directory
containing exactly `result.v1.json`, `projection.v1.json`, `digest-map.v1.json`,
and `terminal-receipt.json`.

Independent acceptance:

- successful bundle has the exact file inventory and digest bindings;
- collision refuses overwrite and changes no bytes;
- injected pre-receipt failure leaves no terminal pass receipt;
- output bodies are stable.

Validation:

```bash
node --test cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/test/run-writer.test.mjs
```

Split analysis: producer serialization/writing is one atomic persistence
behavior. Isolation and independent certification are separate units.

Handoff: stop after closeout; only `007` becomes the successor candidate.

Closeout evidence: terminal receipt pass; writer tests 4 passed, 0 failed.

## SWU-OCGP-007

Primary behavior: attest that the protected input selector set retains the
same digest and rejects a deliberate write probe.

Dependencies: passing receipts for `001–006` (satisfied).

Execution owner recommendation: Task Session with the normal filesystem
capability restricted to the exact SWU scope.

Exact future write scope:

- `cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/scripts/verify-write-isolation.mjs`
- `cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/test/write-isolation.test.mjs`
- exact terminal/session/owner receipt paths from the manifest

Protected selectors:

- `cyberAlchemy-v2/ontology/canonical-kinds/EDGES.yaml`
- `cyberAlchemy-v2/ontology/canonical-kinds/ALLOWED-EDGES.yaml`
- `cyberAlchemy-v2/authority/**`
- `validation/poker-team/**`
- `.arcanum/inventory/**`
- `arcanum/**`

The attestation records a sorted file/digest map before and after evaluation
and a denied write attempt against a Task Session-created protected test
selector, never against a governed source file.

Expected result shape:

```json
{
  "protected_set_digest_before": "sha256",
  "protected_set_digest_after": "sha256",
  "write_probe": "denied",
  "authority_effect": "none"
}
```

Independent acceptance:

- before and after aggregate digests match;
- write probe is denied by capability, not merely reverted;
- deleting, adding, or changing one protected test file fails;
- the result explicitly claims input isolation only, not host security.

Validation:

```bash
node --test cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/test/write-isolation.test.mjs
```

Split analysis: isolation observes side effects; it does not certify receipt
bytes or graph semantics.

Handoff: stop after closeout; only `008` becomes the successor candidate.

## SWU-OCGP-008

Primary behavior: independently verify one terminal bundle.

Dependencies: passing receipts for `001–007`, specifically `006` and `007`.

Execution owner recommendation: Task Session; verifier module must be separate
from the run writer.

Exact future write scope:

- `cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/scripts/verify-terminal-receipt.mjs`
- `cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/test/terminal-receipt.test.mjs`
- exact terminal/session/owner receipt paths from the manifest

The verifier rebuilds the expected exact file inventory, hashes exact bytes,
and checks version/digest bindings and the isolation attestation. It must
reject missing, extra, stale, tampered, unknown-version, overwritten, or
self-promoting evidence.

Expected result shape:

```json
{"verified": true, "receipt_sha256": "sha256", "artifact_count": 4, "issues": []}
```

Independent acceptance:

Validation:

```bash
node --test cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/test/terminal-receipt.test.mjs
node cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/scripts/verify-terminal-receipt.mjs \
  cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/generated/runs/SWU-OCGP-008/terminal-receipt.json
```

Done when all tamper vectors fail and the verifier emits no authority or
promotion verdict.

Split analysis: independent verification is one consumer behavior; it must not
share the producer’s write path or certify broader ontology correctness.

Handoff: stop after closeout. Only `009` becomes the successor candidate.

## SWU-OCGP-009

Primary behavior: compare canonical result, projection, and attestation bodies
across two fresh equivalent run roots.

Dependencies: passing receipts for `001–008`.

Execution owner recommendation: Task Session.

Exact future write scope:

- `cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/test/determinism.test.mjs`
- exact terminal/session/owner receipt paths from the manifest

The harness creates two absent temporary run roots from identical canonical
inputs, invokes the public prototype entrypoint twice, independently verifies
both bundles, removes run identity and wall-clock metadata from the comparison
surface as specified, and compares the remaining exact bytes. It must also
show that one controlled input change produces a different bound digest.

Expected result shape:

```json
{
  "equal": true,
  "compared_paths": ["digest-map.v1.json", "projection.v1.json", "result.v1.json"],
  "differing_paths": []
}
```

Independent acceptance:

Validation:

```bash
node --test cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/test/determinism.test.mjs
```

Done when equivalent bodies are byte-identical, changed input is distinguishable,
and no comparison depends on object insertion order or filesystem enumeration.

Split analysis: this unit owns reproducibility comparison only. Receipt
validity is a dependency supplied by `008`, not re-certified by this SWU.

Handoff: stop after closeout. `TASK-OCGP-VERIFY-001` becomes eligible for a
separate read-only closure review; nothing is auto-selected.
