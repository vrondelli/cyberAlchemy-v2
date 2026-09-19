# Design context: emits closure-envelope placement

Status: authored-complete; owner choice pending.

## Intent

Translate the approved N38 split-ownership contract into the smallest representation decision that preserves consumer attestation, generated provenance, and evaluator verdict as separate authorities.

## Evidence boundary

- N38 admits the two proposal-side contract surfaces but does not select representation.
- The consumer owns population, placement, and completeness claims.
- The compiler produces a graph, source manifest, and build receipt as non-authoritative inputs.
- The evaluator consumes one exact envelope and emits one immutable result receipt.
- `minted-project/v1` is a closed stable source manifest. The generated source manifest and build receipt bind its source-set and output digests.

## Derived representation result

One action survives structural review: a dedicated consumer-authored sidecar outside `generated_root`, created after the graph/source manifest exist, and passed to the evaluator by exact project-relative path and digest. Embedding the snapshot-relative claim in `project.json` requires a schema version change and creates a digest cycle. An ephemeral evaluation request is either the same sidecar under another name or an unreviewable duplicate.

## Authority ceiling

This Design package prepares a representation choice only. It does not create a canonical schema, change `project.json`, compile or evaluate a project, admit an emits-capable profile, project the relationship packet, implement code, promote, publish, release, deploy, or reopen D06.
