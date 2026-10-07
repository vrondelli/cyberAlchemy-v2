# F5 selected source proof-context v2 — candidate implementation plan

## Boundary

This is a read-only, non-authorizing TDE diagnostic for the selected Auth SFOL
claim. It does not rewrite historical admission, recover a missing historical
standalone source-manifest artifact, accept DomainSpec v4 meaning, or satisfy F5.
The owner-selected F5 order remains: TDE derives exact cases and witnesses,
then the executable verification request is finalized. AlchLang is not rerun
to consume TDE artifacts.

## Evidence and DAG

1. **Selected predecessors:** hash-check the historical clause manifest, current
   compiled graph, current instantiation receipt, SFOL profile, and exact
   development graph scaffold. The scaffold embeds
   `.graph.source_manifest`; its obsolete `graph.project_root` is never used.
2. **Manifest integrity:** validate the embedded manifest's source-manifest-v1
   shape, canonical-body SHA-256, and aggregate row digest. Compare its
   internal `manifest_sha256` to the historical clause pin and compiled graph
   binding. This is a different digest from the scaffold file's raw SHA-256.
3. **Current source alignment:** verify each listed source's path, regular-file
   status, non-symlink traversal, byte count, and raw SHA-256 against the
   caller-selected local Auth source root. Enumerate eligible semantic input
   paths before claiming complete alignment; reject unlisted eligible files.
4. **Separate drift:** retain the historical build pin as the raw receipt-file
   SHA-256. Its mismatch with the current receipt remains explicit and keeps
   the overall proof context incomplete. No automatic repin or admission.
5. **Replay/tests:** recompute the assessment on replay; cover current bytes,
   rehashed/tampered scaffold, changed/missing/symlinked/extra source, build
   drift, and forged held result. Run focused tests and SFOL typecheck.

Plan review accepted this boundary with two guardrails: verify both canonical
manifest and aggregate digests; and claim source-set completeness only after
enumerating eligible paths. Product construction can proceed independently of
future provider and admission work. Operational owners and later stages remain
separate: Auth/DomainSpec meaning owners own accepted v4 correspondence and
R4; a provider/evidence owner owns independently authenticated runtime
guarantees. Their absence blocks F5 qualification, not this local diagnostic.

## Open Questions

- What exact accepted DomainSpec v4 meaning and projection/preservation chain
  will be selected for F5? R4 meaning remains an owner decision.
- Which independent provider and runtime-isolation evidence will qualify the
  later verification result? A local diagnostic cannot answer that.
