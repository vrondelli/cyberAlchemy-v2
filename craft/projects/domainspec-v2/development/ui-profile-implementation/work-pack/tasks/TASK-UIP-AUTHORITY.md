---
task_id: TASK-UIP-AUTHORITY
feature_code: UIP
layer: L3
status: complete
---

# TASK-UIP-AUTHORITY: Exact Owner Reconciliation Packet

## SWU-UIP-006

- Goal: produce one machine/human packet that lets DS-D1, DS-D8, and supported-
  profile owners decide canonical placement without redoing implementation
  discovery.
- Dependencies: SWU-UIP-005.
- Source anchors: development registry/digest, graph/traversal receipt, current
  DS-D1 and DS-D8 authority, `GAP-SH-UI11-MIGRATE`, active FPR-02 decision.
- Write scope:
  - `projects/domainspec-v2/development/ui-profile-implementation/authority-packet/`
  - `runs/SWU-UIP-006/`
  - no canonical authority files
- Inputs: exact development results and current authority digests.
- Outputs: proposed DS-D1 disposition table, DS-D8 endpoint/signature table,
  supported-profile request, migration steps, validation receipts, confidence
  residue, and prohibited-inference statement in Markdown plus JSON.

## Algorithm

1. Bind the packet to current authority and development-profile digests.
2. Emit one row for every required concept and every affected UI signature.
3. Distinguish activation, alias, split, role/projection, unchanged, and owner-
   unresolved dispositions.
4. Include exact Adapter/`shapes` and State Indicator/`reflects` alternatives;
   select none on behalf of owners.
5. Include the TAXONOMY/root migration impact and FPR-02 interaction.
6. Verify that applying no packet row leaves canonical files byte-identical.

## Failure Modes

- Missing concept/signature, placeholder owner, stale authority digest, hidden
  canonical write, confidence presented as admission, or FPR-02 selection
  inferred: block.

## Done And Validation

- Human and JSON packets cover 11/11 concepts and every affected signature.
- Current authority digests verify and canonical diff is empty.

```bash
jq empty projects/domainspec-v2/development/ui-profile-implementation/authority-packet/packet.json
git diff --exit-code -- projects/domainspec-v2/definitions
```

- Execution owner: local Task Session; next lifecycle owner is definitions-
  governance/relationship/profile governance after the work-pack audit.
- Context Builder anchors: this SWU, current authority registries, FPR-02
  decision, UI migration gap, and SWU-UIP-005 receipt.
- Expected receipt: packet paths/digests, coverage matrix, zero-authority-diff
  proof, residue, and audit handoff.
